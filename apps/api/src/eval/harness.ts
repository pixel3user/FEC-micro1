import { isDeepStrictEqual } from "node:util";
import {
  ComposeRequestSchema,
  ComposeResponseSchema,
  CreateWorldRequestSchema,
  CreateWorldResponseSchema,
  DynamicActionRequestSchema,
  DynamicActionResponseSchema,
  ExperienceRequestSchema,
  ExperienceResponseSchema,
  ProviderWorldSchema,
  PublishResponseSchema,
  SearchRequestSchema,
  SearchResultSchema,
  WorldEventSchema,
} from "@agent-web/contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";
import { HashingEmbedder } from "../model/embeddings.js";
import { MockModelRuntime } from "../model/mock.js";
import { getUsageTotals } from "../model/usage.js";
import { MemoryStore } from "../storage/memory-store.js";
import { mergeJsonObjects } from "../utils.js";
import { observeHtmlStructure } from "./html-structure.js";
import { loadEvaluationFixtures } from "./load-fixtures.js";
import { computeEvaluationMetrics } from "./metrics.js";
import {
  EVALUATION_REPORT_VERSION,
  EvalReportSchema,
  EvaluationCaseObservationSchema,
  EvaluationRuntimeIdentitySchema,
  type EvalReport,
  type EvaluationCaseObservation,
  type EvaluationRuntimeIdentity,
} from "./report-schema.js";
import {
  EvaluationFixturesSchema,
  FixtureSplitSchema,
  type EvaluationCase,
  type EvaluationFixtures,
} from "./schemas.js";

export type { EvalReport, EvaluationRuntimeIdentity };

const SearchResponseSchema = z
  .object({ results: z.array(SearchResultSchema) })
  .strict();
const EventsResponseSchema = z
  .object({
    worldRevision: z.number().int().nonnegative(),
    events: z.array(WorldEventSchema),
  })
  .strict();
const RetrievalCutoffSchema = z.number().int().min(1).max(8);
const DatasetIdSchema = z.string().min(1).max(200);

export type RunEvalOptions = {
  runtime: EvaluationRuntimeIdentity;
  split?: "development" | "held-out";
  retrievalCutoff?: number;
  datasetId?: string;
  fixtures?: EvaluationFixtures;
  fixtureDirectory?: string | URL;
  now?: () => Date;
};

type SeededProvider = {
  fixtureProviderId: string;
  worldId: string;
  searchableText: string;
};

type EvaluationInjectRequest = {
  method: "GET" | "POST";
  url: string;
  payload?: object;
  headers?: Record<string, string>;
};

type UsageSnapshot = ReturnType<typeof getUsageTotals>;

type AppEvaluationState = {
  fixtureFingerprint: string;
  seeded: Promise<SeededProvider[]>;
  runNumber: number;
};

const evaluationStateByApp = new WeakMap<FastifyInstance, AppEvaluationState>();
const evaluationQueueByApp = new WeakMap<FastifyInstance, Promise<void>>();

export async function runEval(
  app: FastifyInstance,
  options: RunEvalOptions,
): Promise<EvalReport> {
  const previous = evaluationQueueByApp.get(app) ?? Promise.resolve();
  let release = (): void => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  evaluationQueueByApp.set(
    app,
    previous.then(() => current),
  );
  await previous;
  try {
    return await runEvalOnce(app, options);
  } finally {
    release();
  }
}

async function runEvalOnce(
  app: FastifyInstance,
  options: RunEvalOptions,
): Promise<EvalReport> {
  const runtime = EvaluationRuntimeIdentitySchema.parse(options.runtime);
  const split = FixtureSplitSchema.parse(options.split ?? "held-out");
  const retrievalCutoff = RetrievalCutoffSchema.parse(
    options.retrievalCutoff ?? 5,
  );
  const datasetId = DatasetIdSchema.parse(
    options.datasetId ?? "agent-web-evaluation-fixtures",
  );
  const fixtures = EvaluationFixturesSchema.parse(
    options.fixtures ??
      (await loadEvaluationFixtures(options.fixtureDirectory)),
  );
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const usageBefore = getUsageTotals();

  const { seeded, runNumber } = await providersForEvaluation(app, fixtures);
  const runId = `eval-${split}-${runNumber}`;
  const fixtureIdByWorldId = new Map(
    seeded.map(({ fixtureProviderId, worldId }) => [
      worldId,
      fixtureProviderId,
    ]),
  );
  const seededByFixtureId = new Map(
    seeded.map((provider) => [provider.fixtureProviderId, provider]),
  );
  const cases =
    split === "development" ? fixtures.development : fixtures.heldOut;
  const observations: EvaluationCaseObservation[] = [];

  for (const testCase of cases) {
    observations.push(
      await observeCase({
        app,
        runId,
        testCase,
        retrievalCutoff,
        seeded,
        fixtureIdByWorldId,
        seededByFixtureId,
      }),
    );
  }

  const completedAt = now().toISOString();
  return EvalReportSchema.parse({
    reportVersion: EVALUATION_REPORT_VERSION,
    runId,
    dataset: {
      id: datasetId,
      version: fixtures.version,
      split,
    },
    runtime,
    startedAt,
    completedAt,
    retrievalCutoff,
    providerMappings: seeded.map(({ fixtureProviderId, worldId }) => ({
      fixtureProviderId,
      worldId,
    })),
    cases: observations,
    metrics: computeEvaluationMetrics(observations, retrievalCutoff),
    usage: usageDelta(usageBefore, getUsageTotals()),
  });
}

async function providersForEvaluation(
  app: FastifyInstance,
  fixtures: EvaluationFixtures,
): Promise<{ seeded: SeededProvider[]; runNumber: number }> {
  const fixtureFingerprint = JSON.stringify(fixtures.providers);
  let state = evaluationStateByApp.get(app);
  if (state === undefined) {
    state = {
      fixtureFingerprint,
      seeded: seedProviders(app, fixtures),
      runNumber: 0,
    };
    evaluationStateByApp.set(app, state);
  } else if (state.fixtureFingerprint !== fixtureFingerprint) {
    throw new Error(
      "A Fastify app cannot be reused with a different evaluation provider fixture set.",
    );
  }
  const seeded = await state.seeded;
  state.runNumber += 1;
  return { seeded, runNumber: state.runNumber };
}

async function seedProviders(
  app: FastifyInstance,
  fixtures: EvaluationFixtures,
): Promise<SeededProvider[]> {
  const seeded: SeededProvider[] = [];
  for (const provider of fixtures.providers) {
    const createInput = CreateWorldRequestSchema.parse({
      preferredName: provider.name,
      message: provider.message,
    });
    const created = await injectParsed(
      app,
      {
        method: "POST",
        url: "/v1/worlds",
        payload: createInput,
      },
      201,
      CreateWorldResponseSchema,
      `create fixture provider '${provider.id}'`,
    );
    const published = await injectParsed(
      app,
      {
        method: "POST",
        url: `/v1/worlds/${created.world.id}/publish`,
        headers: { "x-owner-token": created.ownerToken },
      },
      200,
      PublishResponseSchema,
      `publish fixture provider '${provider.id}'`,
    );
    if (published.world.id !== created.world.id) {
      throw new Error(
        `Published world ID did not match created world for fixture provider '${provider.id}'.`,
      );
    }
    seeded.push({
      fixtureProviderId: provider.id,
      worldId: published.world.id,
      searchableText: `${provider.name} ${published.world.searchableText}`,
    });
  }
  return seeded;
}

async function observeCase(input: {
  app: FastifyInstance;
  runId: string;
  testCase: EvaluationCase;
  retrievalCutoff: number;
  seeded: readonly SeededProvider[];
  fixtureIdByWorldId: ReadonlyMap<string, string>;
  seededByFixtureId: ReadonlyMap<string, SeededProvider>;
}): Promise<EvaluationCaseObservation> {
  const {
    app,
    runId,
    testCase,
    retrievalCutoff,
    seeded,
    fixtureIdByWorldId,
    seededByFixtureId,
  } = input;
  const baselineRanked = baselineDiscover(
    testCase.intent,
    seeded,
    retrievalCutoff,
  );
  const searchInput = SearchRequestSchema.parse({
    query: testCase.intent,
    // Retrieve the full bounded pool, then apply the declared cutoff after
    // restricting observations to this run's fixture-to-world mapping.
    limit: 20,
  });
  const search = await injectParsed(
    app,
    {
      method: "GET",
      url: `/v1/index/search?query=${encodeURIComponent(searchInput.query)}&limit=${searchInput.limit}`,
    },
    200,
    SearchResponseSchema,
    `search for case '${testCase.id}'`,
  );
  const agentRanked = search.results
    .filter(({ world }) => fixtureIdByWorldId.has(world.id))
    .slice(0, retrievalCutoff)
    .map(({ world, score }, index) => ({
      rank: index + 1,
      fixtureProviderId: fixtureIdByWorldId.get(world.id) ?? null,
      worldId: world.id,
      score,
    }));
  const preferredWorldIds = agentRanked.flatMap(({ worldId }) =>
    worldId === null ? [] : [worldId],
  );
  if (preferredWorldIds.length === 0) {
    throw new Error(
      `Agent discovery returned no run-scoped providers for case '${testCase.id}'.`,
    );
  }

  const generation =
    testCase.mode === "compose"
      ? await generateComposition(
          app,
          testCase,
          retrievalCutoff,
          preferredWorldIds,
          fixtureIdByWorldId,
        )
      : await generateSingle(
          app,
          testCase,
          preferredWorldIds,
          fixtureIdByWorldId,
        );

  const invocationProvider = seededByFixtureId.get(
    testCase.invocation.providerId,
  );
  if (!invocationProvider) {
    throw new Error(
      `No generated world mapping for fixture provider '${testCase.invocation.providerId}'.`,
    );
  }
  const worldUrl = `/v1/worlds/${invocationProvider.worldId}`;
  const eventsUrl = `${worldUrl}/events?limit=200`;
  const worldBefore = await injectParsed(
    app,
    { method: "GET", url: worldUrl },
    200,
    ProviderWorldSchema,
    `read pre-invocation world for case '${testCase.id}'`,
  );
  const eventsBefore = await injectParsed(
    app,
    { method: "GET", url: eventsUrl },
    200,
    EventsResponseSchema,
    `read pre-invocation events for case '${testCase.id}'`,
  );
  const idempotencyKey = `${runId}:${testCase.id}`;
  const invocationInput = DynamicActionRequestSchema.parse({
    sessionId: generation.sessionId,
    action: testCase.invocation.action,
    arguments: testCase.invocation.arguments,
    idempotencyKey,
  });
  const invocationUrl = `${worldUrl}/invoke`;
  const invoked = await injectParsed(
    app,
    { method: "POST", url: invocationUrl, payload: invocationInput },
    200,
    DynamicActionResponseSchema,
    `invoke case '${testCase.id}'`,
  );
  const worldAfter = await injectParsed(
    app,
    { method: "GET", url: worldUrl },
    200,
    ProviderWorldSchema,
    `read persisted world for case '${testCase.id}'`,
  );
  const eventsAfter = await injectParsed(
    app,
    { method: "GET", url: eventsUrl },
    200,
    EventsResponseSchema,
    `read persisted events for case '${testCase.id}'`,
  );
  const retried = await injectParsed(
    app,
    { method: "POST", url: invocationUrl, payload: invocationInput },
    200,
    DynamicActionResponseSchema,
    `retry invocation for case '${testCase.id}'`,
  );
  const worldAfterRetry = await injectParsed(
    app,
    { method: "GET", url: worldUrl },
    200,
    ProviderWorldSchema,
    `read world after retry for case '${testCase.id}'`,
  );
  const eventsAfterRetry = await injectParsed(
    app,
    { method: "GET", url: eventsUrl },
    200,
    EventsResponseSchema,
    `read events after retry for case '${testCase.id}'`,
  );
  const matchingEvents = eventsAfter.events.filter(
    (event) =>
      event.id === invoked.eventId &&
      event.worldId === invocationProvider.worldId &&
      event.sessionId === generation.sessionId &&
      event.eventType === `agent.decision:${testCase.invocation.action}` &&
      event.actor === "agent",
  );
  const eventPayloadPersisted =
    matchingEvents.length === 1 &&
    isDeepStrictEqual(
      matchingEvents[0]?.payload.action,
      invocationInput.action,
    ) &&
    isDeepStrictEqual(
      matchingEvents[0]?.payload.arguments,
      invocationInput.arguments,
    ) &&
    isDeepStrictEqual(matchingEvents[0]?.payload.decision, invoked.decision);
  const providerInGeneratedExperience = generation.providers.some(
    ({ fixtureProviderId }) =>
      fixtureProviderId === testCase.invocation.providerId,
  );
  const statePatchPersisted = isDeepStrictEqual(
    worldAfter.state,
    mergeJsonObjects(worldBefore.state, invoked.decision.statePatch),
  );

  return EvaluationCaseObservationSchema.parse({
    caseId: testCase.id,
    mode: testCase.mode,
    intent: testCase.intent,
    relevantProviderIds: testCase.relevantProviderIds,
    discovery: {
      retrievalCutoff,
      baseline: {
        rankedProviders: baselineRanked,
        topHit: isTopHit(baselineRanked, testCase.relevantProviderIds),
        relevantProviderCoverage: hasRelevantCoverage(
          baselineRanked,
          testCase.relevantProviderIds,
        ),
      },
      agent: {
        rankedProviders: agentRanked,
        topHit: isTopHit(agentRanked, testCase.relevantProviderIds),
        relevantProviderCoverage: hasRelevantCoverage(
          agentRanked,
          testCase.relevantProviderIds,
        ),
      },
    },
    generation: {
      kind: testCase.mode,
      statusCode: 201,
      providers: generation.providers,
      relevantProviderCoverage: hasMappedProviderCoverage(
        generation.providers,
        testCase.relevantProviderIds,
      ),
      planProviders: generation.planProviders,
      planRelevantProviderCoverage:
        generation.planProviders === null
          ? null
          : hasMappedProviderCoverage(
              generation.planProviders,
              testCase.relevantProviderIds,
            ),
      html: observeHtmlStructure(
        generation.html,
        testCase.expectedHtmlMarkers ?? [],
      ),
    },
    invocation: {
      providerId: testCase.invocation.providerId,
      action: invocationInput.action,
      arguments: invocationInput.arguments,
      idempotencyKey,
      statusCode: 200,
      retryStatusCode: 200,
      decisionStatus: invoked.decision.status,
      providerInGeneratedExperience,
      eventId: invoked.eventId,
      worldRevision: invoked.worldRevision,
      retryReturnedSameResponse: isDeepStrictEqual(invoked, retried),
      persistence: {
        statePatchPersisted,
        revisionPersisted:
          invoked.worldRevision === worldBefore.revision + 1 &&
          worldAfter.revision === invoked.worldRevision &&
          eventsAfter.worldRevision === invoked.worldRevision,
        eventPersisted: matchingEvents.length === 1 && eventPayloadPersisted,
        eventPayloadPersisted,
        matchingDecisionEventCount: matchingEvents.length,
        retryDidNotAddEvent:
          isDeepStrictEqual(eventsAfterRetry.events, eventsAfter.events) &&
          eventsAfterRetry.events.filter(
            (event) => event.id === invoked.eventId,
          ).length === 1 &&
          !eventsBefore.events.some((event) => event.id === invoked.eventId),
        retryDidNotAdvanceRevision:
          worldAfterRetry.revision === worldAfter.revision &&
          eventsAfterRetry.worldRevision === eventsAfter.worldRevision,
      },
    },
  });
}

type GenerationResult = {
  sessionId: string;
  html: string;
  providers: Array<{ fixtureProviderId: string | null; worldId: string }>;
  planProviders: Array<{
    fixtureProviderId: string | null;
    worldId: string;
  }> | null;
};

async function generateSingle(
  app: FastifyInstance,
  testCase: EvaluationCase,
  preferredWorldIds: string[],
  fixtureIdByWorldId: ReadonlyMap<string, string>,
): Promise<GenerationResult> {
  const request = ExperienceRequestSchema.parse({
    intent: testCase.intent,
    preferredWorldIds,
  });
  const response = await injectParsed(
    app,
    { method: "POST", url: "/v1/experiences", payload: request },
    201,
    ExperienceResponseSchema,
    `generate experience for case '${testCase.id}'`,
  );
  return {
    sessionId: response.experience.sessionId,
    html: response.experience.html,
    providers: mapGeneratedProviders(response.providers, fixtureIdByWorldId),
    planProviders: null,
  };
}

async function generateComposition(
  app: FastifyInstance,
  testCase: EvaluationCase,
  retrievalCutoff: number,
  preferredWorldIds: string[],
  fixtureIdByWorldId: ReadonlyMap<string, string>,
): Promise<GenerationResult> {
  const request = ComposeRequestSchema.parse({
    intent: testCase.intent,
    preferredWorldIds,
    maxProviders: retrievalCutoff,
  });
  const response = await injectParsed(
    app,
    { method: "POST", url: "/v1/compose", payload: request },
    201,
    ComposeResponseSchema,
    `compose experience for case '${testCase.id}'`,
  );
  return {
    sessionId: response.experience.sessionId,
    html: response.experience.html,
    providers: mapGeneratedProviders(response.providers, fixtureIdByWorldId),
    planProviders: response.plan.steps.map(({ worldId }) => ({
      fixtureProviderId: fixtureIdByWorldId.get(worldId) ?? null,
      worldId,
    })),
  };
}

function mapGeneratedProviders(
  providers: ReadonlyArray<{ id: string }>,
  fixtureIdByWorldId: ReadonlyMap<string, string>,
): Array<{ fixtureProviderId: string | null; worldId: string }> {
  return providers.map(({ id: worldId }) => ({
    fixtureProviderId: fixtureIdByWorldId.get(worldId) ?? null,
    worldId,
  }));
}

export function baselineDiscover(
  intent: string,
  providers: readonly SeededProvider[],
  cutoff: number,
) {
  const terms = intent.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return providers
    .map((provider, providerIndex) => ({
      provider,
      providerIndex,
      score: terms.reduce(
        (count, term) =>
          count +
          (provider.searchableText.toLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.providerIndex - right.providerIndex,
    )
    .slice(0, cutoff)
    .map(({ provider, score }, index) => ({
      rank: index + 1,
      fixtureProviderId: provider.fixtureProviderId,
      worldId: null,
      score,
    }));
}

function isTopHit(
  ranked: ReadonlyArray<{ fixtureProviderId: string | null }>,
  relevantProviderIds: readonly string[],
): boolean {
  const first = ranked[0]?.fixtureProviderId;
  return (
    first !== null && first !== undefined && relevantProviderIds.includes(first)
  );
}

function hasRelevantCoverage(
  ranked: ReadonlyArray<{ fixtureProviderId: string | null }>,
  relevantProviderIds: readonly string[],
): boolean {
  const observed = new Set(
    ranked.flatMap(({ fixtureProviderId }) =>
      fixtureProviderId === null ? [] : [fixtureProviderId],
    ),
  );
  return relevantProviderIds.every((providerId) => observed.has(providerId));
}

function hasMappedProviderCoverage(
  providers: ReadonlyArray<{ fixtureProviderId: string | null }>,
  relevantProviderIds: readonly string[],
): boolean {
  return hasRelevantCoverage(providers, relevantProviderIds);
}

async function injectParsed<T>(
  app: FastifyInstance,
  request: EvaluationInjectRequest,
  expectedStatus: number,
  schema: z.ZodType<T>,
  operation: string,
): Promise<T> {
  const response = await app.inject(request);
  const body = response.json<unknown>();
  if (response.statusCode !== expectedStatus) {
    throw new Error(
      `Evaluation could not ${operation}: expected HTTP ${expectedStatus}, received ${response.statusCode}: ${JSON.stringify(body)}`,
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Evaluation could not ${operation}: response schema validation failed: ${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}

function usageDelta(before: UsageSnapshot, after: UsageSnapshot) {
  const purposeNames = new Set([
    ...Object.keys(before.byPurpose),
    ...Object.keys(after.byPurpose),
  ]);
  return {
    scope: "process-counter-delta" as const,
    calls: after.calls - before.calls,
    costUsd: roundCurrency(after.costUsd - before.costUsd),
    promptTokens: after.promptTokens - before.promptTokens,
    completionTokens: after.completionTokens - before.completionTokens,
    byPurpose: Object.fromEntries(
      [...purposeNames]
        .sort()
        .map((purpose) => {
          const start = before.byPurpose[purpose] ?? { calls: 0, costUsd: 0 };
          const end = after.byPurpose[purpose] ?? { calls: 0, costUsd: 0 };
          return [
            purpose,
            {
              calls: end.calls - start.calls,
              costUsd: roundCurrency(end.costUsd - start.costUsd),
            },
          ];
        })
        .filter(([, value]) => {
          const bucket = value as { calls: number; costUsd: number };
          return bucket.calls !== 0 || bucket.costUsd !== 0;
        }),
    ),
  };
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(6));
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
    const report = await runEval(app, {
      runtime: {
        runtimeId:
          config.modelMode === "mock"
            ? "mock-model-runtime"
            : "openrouter-model-runtime",
        modelId: config.modelMode === "mock" ? "mock" : config.openRouterModel,
        embeddingModelId:
          config.modelMode === "mock"
            ? "hashing-embedder-256"
            : config.openRouterEmbeddingModel,
      },
    });
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
