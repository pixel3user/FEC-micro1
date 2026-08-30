import {
  ComposeResponseSchema,
  CreateWorldResponseSchema,
  DynamicActionResponseSchema,
  ExperienceResponseSchema,
  PublishResponseSchema,
  RepairExperienceResponseSchema,
} from "@agent-web/contracts";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { AppConfig } from "./config.js";
import { HashingEmbedder } from "./model/embeddings.js";
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
  openRouterFallbackModels: [],
  openRouterEmbeddingModel: "mock-embedding",
  semanticSearch: true,
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
      embedder: new HashingEmbedder(256),
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

  it("regenerates a corrected experience when the generated UI reports a runtime error", async () => {
    const created = CreateWorldResponseSchema.parse(
      (
        await app.inject({
          method: "POST",
          url: "/v1/worlds",
          payload: {
            preferredName: "Repairable Provider",
            message:
              "We help people compare options for anything they describe and adapt to unusual requests.",
          },
        })
      ).json(),
    );
    await app.inject({
      method: "POST",
      url: `/v1/worlds/${created.world.id}/publish`,
      headers: { "x-owner-token": created.ownerToken },
    });

    const experience = ExperienceResponseSchema.parse(
      (
        await app.inject({
          method: "POST",
          url: "/v1/experiences",
          payload: { intent: "Compare a few options interactively" },
        })
      ).json(),
    );
    const originalId = experience.experience.id;

    const repairResponse = await app.inject({
      method: "POST",
      url: "/v1/experiences/repair",
      payload: {
        sessionId: experience.experience.sessionId,
        error: "TypeError: Cannot read properties of undefined (reading 'map')",
      },
    });
    expect(repairResponse.statusCode).toBe(201);
    const repaired = RepairExperienceResponseSchema.parse(
      repairResponse.json(),
    );
    expect(repaired.repaired).toBe(true);
    expect(repaired.experience.id).not.toBe(originalId);
    expect(repaired.experience.sessionId).toBe(experience.experience.sessionId);
    expect(repaired.experience.title.toLowerCase()).toContain("repaired");
  });

  it("returns 404 when repairing a session that has no generated experience", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/experiences/repair",
      payload: {
        sessionId: "99999999-9999-4999-8999-999999999999",
        error: "boom",
      },
    });
    expect(response.statusCode).toBe(404);
  });

  it("composes one intent across multiple provider worlds", async () => {
    const publish = async (preferredName: string, message: string) => {
      const created = CreateWorldResponseSchema.parse(
        (
          await app.inject({
            method: "POST",
            url: "/v1/worlds",
            payload: { preferredName, message },
          })
        ).json(),
      );
      await app.inject({
        method: "POST",
        url: `/v1/worlds/${created.world.id}/publish`,
        headers: { "x-owner-token": created.ownerToken },
      });
      return created.world.id;
    };

    const venueId = await publish(
      "Hall Finder",
      "We help people find event venues and halls for gatherings.",
    );
    const cateringId = await publish(
      "Feast Collective",
      "We provide catering and food service for events and gatherings.",
    );

    const response = await app.inject({
      method: "POST",
      url: "/v1/compose",
      payload: {
        intent: "Plan a gathering: find a venue and arrange catering",
        preferredWorldIds: [venueId, cateringId],
      },
    });
    expect(response.statusCode).toBe(201);
    const composed = ComposeResponseSchema.parse(response.json());
    expect(composed.providers).toHaveLength(2);
    expect(composed.plan.steps.length).toBeGreaterThanOrEqual(2);
    const planWorldIds = new Set(composed.plan.steps.map((s) => s.worldId));
    expect(planWorldIds.has(venueId)).toBe(true);
    expect(planWorldIds.has(cateringId)).toBe(true);
    expect(composed.experience.worldIds).toContain(venueId);
    expect(composed.experience.worldIds).toContain(cateringId);
  });

  it("ranks a semantically relevant provider above an unrelated one", async () => {
    const publish = async (preferredName: string, message: string) => {
      const created = CreateWorldResponseSchema.parse(
        (
          await app.inject({
            method: "POST",
            url: "/v1/worlds",
            payload: { preferredName, message },
          })
        ).json(),
      );
      await app.inject({
        method: "POST",
        url: `/v1/worlds/${created.world.id}/publish`,
        headers: { "x-owner-token": created.ownerToken },
      });
      return created.world.id;
    };

    const bikeId = await publish(
      "Cog and Chain",
      "A bicycle repair co-op that services commuter bikes and stocks common parts.",
    );
    await publish(
      "Blue Note Studio",
      "A music school offering jazz saxophone and piano lessons for adults.",
    );

    const searchResponse = await app.inject({
      method: "GET",
      url: `/v1/index/search?query=${encodeURIComponent("fix my bicycle")}`,
    });
    expect(searchResponse.statusCode).toBe(200);
    const results = searchResponse.json().results as Array<{
      world: { id: string };
      score: number;
    }>;
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].world.id).toBe(bikeId);
  });
});
