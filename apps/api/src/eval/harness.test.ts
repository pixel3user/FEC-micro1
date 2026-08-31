import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import type { AppConfig } from "../config.js";
import { HashingEmbedder } from "../model/embeddings.js";
import { MockModelRuntime } from "../model/mock.js";
import { MemoryStore } from "../storage/memory-store.js";
import { runEval } from "./harness.js";

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

describe("evaluation harness", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      config,
      store: new MemoryStore(),
      model: new MockModelRuntime(),
      embedder: new HashingEmbedder(256),
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("produces a report where the agent path dominates the baseline on capability metrics", async () => {
    const report = await runEval(app);
    expect(report.cases).toBeGreaterThan(0);

    // The agent produces task-specific UI; the baseline never does.
    expect(report.agent.taskSpecificUiRate).toBeGreaterThan(
      report.baseline.taskSpecificUiRate,
    );
    // Only the agent path can compose across providers.
    expect(report.agent.canCompose).toBe(true);
    expect(report.baseline.canCompose).toBe(false);
    // The agent collapses multi-provider intents into fewer user steps.
    expect(report.agent.avgUserSteps).toBeLessThanOrEqual(
      report.baseline.avgUserSteps,
    );
    // Mock mode spends nothing.
    expect(report.costUsd).toBe(0);
  });
});
