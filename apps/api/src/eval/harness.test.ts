import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import type { AppConfig } from "../config.js";
import { HashingEmbedder } from "../model/embeddings.js";
import { MockModelRuntime } from "../model/mock.js";
import { MemoryStore } from "../storage/memory-store.js";
import { runEval } from "./harness.js";
import { EvalReportSchema } from "./report-schema.js";

const config: AppConfig = {
  apiHost: "127.0.0.1",
  apiPort: 8787,
  logLevel: "silent",
  maxModelOutputTokens: 3_500,
  modelMode: "mock",
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  openRouterModel: "mock",
  openRouterFallbackModels: [],
  openRouterEmbeddingModel: "mock-embedding",
  semanticSearch: true,
  publicApiUrl: "http://localhost:8787",
  webOrigins: ["http://localhost:5173"],
};

const runtime = {
  runtimeId: "mock-model-runtime:test",
  modelId: "mock:test",
  embeddingModelId: "hashing-embedder:256",
};

describe("evaluation harness", () => {
  let app: FastifyInstance;
  let store: MemoryStore;

  beforeEach(async () => {
    store = new MemoryStore();
    app = await createTestApp(store);
  });

  afterEach(async () => {
    await app.close();
  });

  it("defaults to held-out and reports validated executable evidence", async () => {
    const report = await runEval(app, { runtime });

    expect(EvalReportSchema.parse(report)).toEqual(report);
    const contradictory = structuredClone(report);
    contradictory.metrics.agentOnly.invocationOk.numerator = 0;
    expect(EvalReportSchema.safeParse(contradictory).success).toBe(false);
    expect(report.dataset).toEqual({
      id: "agent-web-evaluation-fixtures",
      version: 1,
      split: "held-out",
    });
    expect(report.runtime).toEqual(runtime);
    expect(report.providerMappings).toHaveLength(7);
    expect(
      new Set(report.providerMappings.map(({ worldId }) => worldId)).size,
    ).toBe(7);
    expect(report.cases.map(({ caseId }) => caseId)).toEqual([
      "held-out-blurry-vision-exam",
      "held-out-workshop-material-delivery",
      "held-out-custom-bike-request",
    ]);

    for (const observation of report.cases) {
      expect(observation.discovery.retrievalCutoff).toBe(5);
      expect(
        observation.discovery.baseline.rankedProviders.length,
      ).toBeLessThanOrEqual(5);
      expect(
        observation.discovery.agent.rankedProviders.length,
      ).toBeLessThanOrEqual(5);
      expect(observation.generation.html.structurallyValid).toBe(true);
      expect(observation.generation.html.safe).toBe(true);
      expect(observation.generation.html.hasInvokeBridge).toBe(true);
      expect(observation.invocation.decisionStatus).toBe("ok");
      expect(observation.invocation.persistence).toMatchObject({
        statePatchPersisted: true,
        revisionPersisted: true,
        eventPersisted: true,
        eventPayloadPersisted: true,
        matchingDecisionEventCount: 1,
        retryDidNotAddEvent: true,
        retryDidNotAdvanceRevision: true,
      });
      expect(observation.invocation.retryReturnedSameResponse).toBe(true);
    }

    expect(report.metrics.comparable.retrievalCutoff).toBe(5);
    expect(report.metrics.agentOnly.invocationOk).toMatchObject({
      numerator: 3,
      denominator: 3,
    });
    expect(report.metrics.agentOnly.idempotentRetry).toMatchObject({
      numerator: 3,
      denominator: 3,
    });
    expect(report.usage).toMatchObject({
      scope: "process-counter-delta",
      calls: 0,
      costUsd: 0,
    });
  });

  it("selects the development split explicitly and applies one retrieval cutoff to both paths", async () => {
    const report = await runEval(app, {
      runtime,
      split: "development",
      retrievalCutoff: 2,
      datasetId: "test-dataset",
    });

    expect(report.dataset).toEqual({
      id: "test-dataset",
      version: 1,
      split: "development",
    });
    expect(report.cases.every(({ caseId }) => caseId.startsWith("dev-"))).toBe(
      true,
    );
    expect(report.metrics.comparable.retrievalCutoff).toBe(2);
    expect(
      report.cases.every(
        ({ discovery }) =>
          discovery.retrievalCutoff === 2 &&
          discovery.baseline.rankedProviders.length <= 2 &&
          discovery.agent.rankedProviders.length <= 2,
      ),
    ).toBe(true);
    expect(
      report.metrics.agentOnly.composePlanProviderCoverage.denominator,
    ).toBe(1);
  });

  it("enforces retrieval and runtime identity boundaries", async () => {
    await expect(
      runEval(app, { runtime, retrievalCutoff: 0 }),
    ).rejects.toThrow();
    await expect(
      runEval(app, { runtime, retrievalCutoff: 9 }),
    ).rejects.toThrow();
    await expect(
      runEval(app, {
        runtime: { ...runtime, modelId: "" },
      }),
    ).rejects.toThrow();

    const boundaryReport = await runEval(app, {
      runtime,
      retrievalCutoff: 8,
    });
    expect(boundaryReport.retrievalCutoff).toBe(8);
  });

  it("reuses one run-scoped mapping and isolates idempotency across repeated runs", async () => {
    const first = await runEval(app, { runtime });
    for (const { worldId } of first.providerMappings) {
      for (let index = 0; index < 205; index += 1) {
        await store.appendEvent({
          worldId,
          sessionId: null,
          eventType: "test.history-padding",
          actor: "system",
          payload: { index },
        });
      }
    }
    const second = await runEval(app, { runtime });
    const third = await runEval(app, { runtime });

    expect(second.providerMappings).toEqual(first.providerMappings);
    expect(third.providerMappings).toEqual(first.providerMappings);
    const mappedWorldIds = new Set(
      first.providerMappings.map(({ worldId }) => worldId),
    );
    expect(
      second.cases
        .flatMap(({ discovery }) => discovery.agent.rankedProviders)
        .every(
          ({ worldId }) => worldId !== null && mappedWorldIds.has(worldId),
        ),
    ).toBe(true);
    expect(first.cases).toHaveLength(second.cases.length);
    expect(
      [...second.cases, ...third.cases].every(
        ({ invocation }) =>
          invocation.retryReturnedSameResponse &&
          invocation.persistence.matchingDecisionEventCount === 1 &&
          invocation.persistence.retryDidNotAddEvent,
      ),
    ).toBe(true);
    expect(first.runId).not.toBe(second.runId);
    expect(second.runId).not.toBe(third.runId);
    expect(third.usage.costUsd).toBe(0);
  });
});

async function createTestApp(store: MemoryStore): Promise<FastifyInstance> {
  return buildApp({
    config,
    store,
    model: new MockModelRuntime(),
    embedder: new HashingEmbedder(256),
  });
}
