import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";
import { HashingEmbedder } from "../model/embeddings.js";
import { MockModelRuntime } from "../model/mock.js";
import { getUsageTotals } from "../model/usage.js";
import { MemoryStore } from "../storage/memory-store.js";

/**
 * Evaluation harness comparing a fixed non-agent baseline against the
 * agent-native path on the same seeded providers and intents.
 *
 * Baseline model: a user of a conventional multi-site web must (1) pick a
 * provider from a keyword listing and (2) land on that provider's own fixed
 * page. It cannot compose across providers and produces no task-specific UI.
 * We approximate the baseline's discovery with naive substring keyword search
 * and count the fixed navigation steps a person would take.
 *
 * Agent path: intent -> blended discovery -> one generated interface (and,
 * for multi-need intents, a single composed interface across providers).
 *
 * Metrics are structural and deterministic in mock mode (no spend). Pass
 * MODEL_MODE=live (with a key) to measure real generation success and cost.
 */

type Provider = { name: string; message: string };
type EvalCase = {
  intent: string;
  relevantProviderNames: string[];
  multiProvider: boolean;
};

const PROVIDERS: Provider[] = [
  {
    name: "Cog and Chain Co-op",
    message:
      "A bicycle repair co-op servicing commuter bikes, stocking common parts, and handling unusual custom requests.",
  },
  {
    name: "Northstar Events",
    message:
      "We help groups plan local events, find venues, and coordinate schedules for gatherings.",
  },
  {
    name: "Feast Collective",
    message:
      "We provide catering and food service for events, parties, and corporate gatherings.",
  },
  {
    name: "Clearview Eye Clinic",
    message:
      "A clinic offering eye examinations, vision tests, and prescriptions for glasses and contacts.",
  },
  {
    name: "Bluenote Studio",
    message:
      "A music school offering saxophone, piano, and guitar lessons for adults and teenagers.",
  },
];

const CASES: EvalCase[] = [
  {
    intent: "my commuter bicycle needs a tune-up",
    relevantProviderNames: ["Cog and Chain Co-op"],
    multiProvider: false,
  },
  {
    intent: "my eyesight is blurry and I want it checked",
    relevantProviderNames: ["Clearview Eye Clinic"],
    multiProvider: false,
  },
  {
    intent: "plan a birthday gathering with a venue and food",
    relevantProviderNames: ["Northstar Events", "Feast Collective"],
    multiProvider: true,
  },
  {
    intent: "I want to learn to play the saxophone",
    relevantProviderNames: ["Bluenote Studio"],
    multiProvider: false,
  },
];

// Baseline: naive keyword overlap between the raw intent and provider text.
function baselineDiscover(
  intent: string,
  providers: Array<{ name: string; text: string }>,
): string[] {
  const terms = intent.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return providers
    .map((provider) => {
      const haystack = provider.text.toLowerCase();
      const score = terms.reduce(
        (count, term) => count + (haystack.includes(term) ? 1 : 0),
        0,
      );
      return { name: provider.name, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.name);
}

function topHit(ranked: string[], relevant: string[]): boolean {
  return ranked.length > 0 && relevant.includes(ranked[0] as string);
}

function allFound(ranked: string[], relevant: string[]): boolean {
  return relevant.every((name) => ranked.includes(name));
}

export type EvalReport = {
  model: string;
  cases: number;
  baseline: {
    discoveryTopHitRate: number;
    multiProviderCoverageRate: number;
    taskSpecificUiRate: number;
    avgUserSteps: number;
    canCompose: boolean;
  };
  agent: {
    discoveryTopHitRate: number;
    multiProviderCoverageRate: number;
    taskSpecificUiRate: number;
    avgUserSteps: number;
    canCompose: boolean;
  };
  costUsd: number;
};

export async function runEval(app: FastifyInstance): Promise<EvalReport> {
  const config = loadConfig();

  // Seed providers and capture their searchable text for the baseline.
  const seeded: Array<{ name: string; id: string; text: string }> = [];
  for (const provider of PROVIDERS) {
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/worlds",
      payload: { preferredName: provider.name, message: provider.message },
    });
    const created = createResponse.json() as {
      world: { id: string; slug: string; searchableText: string };
      ownerToken: string;
    };
    await app.inject({
      method: "POST",
      url: `/v1/worlds/${created.world.id}/publish`,
      headers: { "x-owner-token": created.ownerToken },
    });
    seeded.push({
      name: provider.name,
      id: created.world.id,
      text: `${provider.name} ${created.world.searchableText}`,
    });
  }

  let baselineTopHits = 0;
  let baselineMultiCoverage = 0;
  let baselineSteps = 0;
  let agentTopHits = 0;
  let agentMultiCoverage = 0;
  let agentUi = 0;
  let agentSteps = 0;
  let multiCases = 0;

  for (const testCase of CASES) {
    // Baseline discovery + fixed navigation cost.
    const baselineRanked = baselineDiscover(testCase.intent, seeded);
    if (topHit(baselineRanked, testCase.relevantProviderNames))
      baselineTopHits += 1;
    // A conventional flow: read listing, click a provider, read its page,
    // then act. For multi-need intents the user repeats per provider site.
    const baselineCaseSteps = testCase.multiProvider
      ? 3 * testCase.relevantProviderNames.length
      : 3;
    baselineSteps += baselineCaseSteps;

    // Agent discovery via the real blended index.
    const searchResponse = await app.inject({
      method: "GET",
      url: `/v1/index/search?query=${encodeURIComponent(testCase.intent)}&limit=5`,
    });
    const agentRanked = (
      searchResponse.json().results as Array<{ world: { name: string } }>
    ).map((entry) => entry.world.name);
    if (topHit(agentRanked, testCase.relevantProviderNames)) agentTopHits += 1;

    if (testCase.multiProvider) {
      multiCases += 1;
      if (allFound(baselineRanked, testCase.relevantProviderNames))
        baselineMultiCoverage += 1;
      const composeResponse = await app.inject({
        method: "POST",
        url: "/v1/compose",
        payload: { intent: testCase.intent, maxProviders: 4 },
      });
      if (composeResponse.statusCode === 201) {
        const composed = composeResponse.json() as {
          providers: Array<{ name: string }>;
          experience: { html: string };
        };
        const names = composed.providers.map((p) => p.name);
        if (allFound(names, testCase.relevantProviderNames))
          agentMultiCoverage += 1;
        if (composed.experience.html.length > 100) agentUi += 1;
      }
      // Agent flow: one intent -> one composed interface -> act.
      agentSteps += 2;
    } else {
      const experienceResponse = await app.inject({
        method: "POST",
        url: "/v1/experiences",
        payload: { intent: testCase.intent },
      });
      if (experienceResponse.statusCode === 201) {
        const experience = experienceResponse.json() as {
          experience: { html: string };
        };
        if (experience.experience.html.length > 100) agentUi += 1;
      }
      agentSteps += 2;
    }
  }

  const cases = CASES.length;
  return {
    model: config.modelMode === "mock" ? "mock" : config.openRouterModel,
    cases,
    baseline: {
      discoveryTopHitRate: round(baselineTopHits / cases),
      multiProviderCoverageRate:
        multiCases > 0 ? round(baselineMultiCoverage / multiCases) : 0,
      taskSpecificUiRate: 0, // baseline shows fixed pages, never task-specific UI
      avgUserSteps: round(baselineSteps / cases),
      canCompose: false,
    },
    agent: {
      discoveryTopHitRate: round(agentTopHits / cases),
      multiProviderCoverageRate:
        multiCases > 0 ? round(agentMultiCoverage / multiCases) : 0,
      taskSpecificUiRate: round(agentUi / cases),
      avgUserSteps: round(agentSteps / cases),
      canCompose: true,
    },
    costUsd: getUsageTotals().costUsd,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export async function main(): Promise<void> {
  const config = loadConfig();
  const app =
    config.modelMode === "mock"
      ? await buildApp({
          config,
          store: new MemoryStore(),
          model: new MockModelRuntime(),
          embedder: new HashingEmbedder(256),
        })
      : await buildApp({ config, store: new MemoryStore() });
  try {
    const report = await runEval(app);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await app.close();
  }
}

const isDirectRun =
  process.argv[1] !== undefined && /harness\.(js|ts)$/.test(process.argv[1]);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
