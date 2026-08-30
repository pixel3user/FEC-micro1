import {
  CreateWorldResponseSchema,
  DynamicActionResponseSchema,
  ExperienceResponseSchema,
  PublishResponseSchema,
} from "@agent-web/contracts";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { AppConfig } from "./config.js";
import { MockModelRuntime } from "./model/mock.js";
import { MemoryStore } from "./storage/memory-store.js";

const config: AppConfig = {
  apiHost: "127.0.0.1",
  apiPort: 8787,
  logLevel: "silent",
  maxModelOutputTokens: 3_500,
  modelMode: "mock",
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  openRouterModel: "mock",
  publicApiUrl: "http://localhost:8787",
  webOrigins: ["http://localhost:5173"],
};

describe("agent-native public network", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      config,
      store: new MemoryStore(),
      model: new MockModelRuntime(),
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("publishes, discovers, generates, and records an arbitrary agent decision", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/worlds",
      payload: {
        preferredName: "Open Research Collective",
        message:
          "We help people investigate unusual technical questions and can adapt our process to whatever evidence the question requires.",
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = CreateWorldResponseSchema.parse(createResponse.json());

    const denied = await app.inject({
      method: "POST",
      url: `/v1/worlds/${created.world.id}/publish`,
    });
    expect(denied.statusCode).toBe(401);

    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/worlds/${created.world.id}/publish`,
      headers: { "x-owner-token": created.ownerToken },
    });
    expect(publishResponse.statusCode).toBe(200);
    const published = PublishResponseSchema.parse(publishResponse.json());
    expect(published.world.published).toBe(true);

    const searchResponse = await app.inject({
      method: "GET",
      url: "/v1/index/search?query=unusual%20technical%20question",
    });
    expect(searchResponse.statusCode).toBe(200);
    expect(searchResponse.json().results[0].world.id).toBe(created.world.id);

    const manifestResponse = await app.inject({
      method: "GET",
      url: `/.well-known/agents/${created.world.slug}.json`,
    });
    expect(manifestResponse.statusCode).toBe(200);
    expect(manifestResponse.json().invokeUrl).toContain(created.world.id);

    const experienceResponse = await app.inject({
      method: "POST",
      url: "/v1/experiences",
      payload: {
        intent:
          "Investigate a strange systems behavior and present an interactive path",
      },
    });
    expect(experienceResponse.statusCode).toBe(201);
    const experience = ExperienceResponseSchema.parse(
      experienceResponse.json(),
    );
    expect(experience.experience.html.toLowerCase()).toContain(
      "<!doctype html>",
    );

    const arbitraryAction =
      "construct a brand-new evidence ritual and remember its outcome";
    const invocation = {
      sessionId: experience.experience.sessionId,
      action: arbitraryAction,
      arguments: {
        signals: ["latency", "contradictions"],
        method: { inventedNow: true },
      },
      idempotencyKey: "same-interaction-retry-key",
    };
    const invokeResponse = await app.inject({
      method: "POST",
      url: `/v1/worlds/${created.world.id}/invoke`,
      payload: invocation,
    });
    expect(invokeResponse.statusCode).toBe(200);
    const decision = DynamicActionResponseSchema.parse(invokeResponse.json());
    expect(decision.decision.result).toMatchObject({
      accepted: true,
      action: arbitraryAction,
    });

    const retryResponse = await app.inject({
      method: "POST",
      url: `/v1/worlds/${created.world.id}/invoke`,
      payload: invocation,
    });
    const retry = DynamicActionResponseSchema.parse(retryResponse.json());
    expect(retry.eventId).toBe(decision.eventId);

    const worldResponse = await app.inject({
      method: "GET",
      url: `/v1/worlds/${created.world.id}`,
    });
    expect(worldResponse.json().state.lastDecision.action).toBe(
      arbitraryAction,
    );

    const eventsResponse = await app.inject({
      method: "GET",
      url: `/v1/worlds/${created.world.id}/events?limit=100`,
    });
    const decisionEvents = eventsResponse
      .json()
      .events.filter((event: { eventType: string }) =>
        event.eventType.startsWith("agent.decision:"),
      );
    expect(decisionEvents).toHaveLength(1);
  });
});
