import {
  ComposeRequestSchema,
  ConverseRequestSchema,
  CreateWorldRequestSchema,
  DynamicActionRequestSchema,
  ExperienceRequestSchema,
  RepairExperienceRequestSchema,
  SearchRequestSchema,
} from "@agent-web/contracts";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { z, ZodError } from "zod";
import type { AppConfig } from "./config.js";
import { loadConfig } from "./config.js";
import {
  ConflictError,
  ModelError,
  NotFoundError,
  UnauthorizedError,
} from "./errors.js";
import {
  HashingEmbedder,
  OpenRouterEmbedder,
  type Embedder,
} from "./model/embeddings.js";
import { createModelRuntime, type ModelRuntime } from "./model/index.js";
import { getUsageTotals } from "./model/usage.js";
import { resolveDnsManifest } from "./resolver.js";
import { AgentWebService } from "./service.js";
import { createStore, type Store } from "./storage/index.js";

export type AppDependencies = {
  config?: AppConfig;
  store?: Store;
  model?: ModelRuntime;
  embedder?: Embedder;
};

export async function buildApp(
  dependencies: AppDependencies = {},
): Promise<FastifyInstance> {
  const config = dependencies.config ?? loadConfig();
  const store = dependencies.store ?? createStore(config);
  const model = dependencies.model ?? createModelRuntime(config);
  const embedder =
    dependencies.embedder ??
    (config.modelMode === "mock"
      ? new HashingEmbedder()
      : new OpenRouterEmbedder(config));
  await store.initialize();

  const app = Fastify({ logger: { level: config.logLevel } });
  const service = new AgentWebService(store, model, config, embedder);
  // Allow the configured web origin(s); "*" opts into permissive mode for local
  // dev. Requests with no Origin header (health checks, curl, SSR) are allowed.
  const allowAllOrigins = config.webOrigins.includes("*");
  await app.register(cors, {
    origin: allowAllOrigins
      ? true
      : (origin, cb) => {
          if (!origin || config.webOrigins.includes(origin)) {
            cb(null, true);
            return;
          }
          cb(new Error("Origin not allowed by CORS"), false);
        },
    methods: ["GET", "POST", "OPTIONS"],
  });
  await app.register(rateLimit, { max: 180, timeWindow: "1 minute" });

  app.addHook("onClose", async () => {
    await store.close();
  });

  app.get("/health", async () => ({
    status: "ok",
    model: config.modelMode === "mock" ? "mock" : config.openRouterModel,
    persistence: config.databaseUrl ? "postgresql" : "memory",
  }));

  app.get("/v1/usage", async () => getUsageTotals());

  app.post(
    "/v1/worlds",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = CreateWorldRequestSchema.parse(request.body);
      return reply.code(201).send(await service.createWorld(input));
    },
  );

  app.get("/v1/worlds/:id", async (request) => {
    const { id } = IdParamsSchema.parse(request.params);
    return service.getPublicWorld(id);
  });

  app.post(
    "/v1/worlds/:id/converse",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request) => {
      const { id } = IdParamsSchema.parse(request.params);
      await service.requireOwner(
        id,
        ownerTokenFrom(request.headers["x-owner-token"]),
      );
      const input = ConverseRequestSchema.parse(request.body);
      return service.converse(id, input.message);
    },
  );

  app.post("/v1/worlds/:id/publish", async (request) => {
    const { id } = IdParamsSchema.parse(request.params);
    await service.requireOwner(
      id,
      ownerTokenFrom(request.headers["x-owner-token"]),
    );
    return service.publish(id);
  });

  app.get("/v1/worlds/:id/events", async (request) => {
    const { id } = IdParamsSchema.parse(request.params);
    const { limit } = LimitQuerySchema.parse(request.query);
    return service.events(id, limit);
  });

  app.get("/v1/index/search", async (request) => {
    const query = SearchQuerySchema.parse(request.query);
    const input = SearchRequestSchema.parse({
      query: query.query,
      limit: query.limit,
    });
    return { results: await service.search(input.query, input.limit) };
  });

  app.post(
    "/v1/experiences",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = ExperienceRequestSchema.parse(request.body);
      return reply.code(201).send(await service.createExperience(input));
    },
  );

  app.post(
    "/v1/experiences/repair",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = RepairExperienceRequestSchema.parse(request.body);
      return reply.code(201).send(await service.repairExperience(input));
    },
  );

  app.post(
    "/v1/compose",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = ComposeRequestSchema.parse(request.body);
      return reply.code(201).send(await service.compose(input));
    },
  );

  app.post(
    "/v1/worlds/:id/invoke",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request) => {
      const { id } = IdParamsSchema.parse(request.params);
      const input = DynamicActionRequestSchema.parse(request.body);
      return service.invoke(id, input);
    },
  );

  app.get("/.well-known/agents/:slug.json", async (request) => {
    const { slug } = SlugParamsSchema.parse(request.params);
    return service.manifest(slug);
  });

  app.get("/v1/resolve/:name", async (request) => {
    const { name } = ResolveParamsSchema.parse(request.params);
    try {
      return {
        source: "index" as const,
        manifest: await service.manifest(name),
      };
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
    }
    const manifestUrl = await resolveDnsManifest(name);
    if (!manifestUrl)
      throw new NotFoundError(
        "No indexed agent or DNS manifest record was found.",
      );
    return { source: "dns" as const, manifestUrl };
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply
        .code(400)
        .send({ error: "Invalid request.", details: error.issues });
    }
    if (error instanceof UnauthorizedError)
      return reply.code(401).send({ error: error.message });
    if (error instanceof NotFoundError)
      return reply.code(404).send({ error: error.message });
    if (error instanceof ConflictError)
      return reply.code(409).send({ error: error.message });
    if (error instanceof ModelError)
      return reply.code(502).send({ error: error.message });
    app.log.error(error);
    return reply.code(500).send({ error: "Internal server error." });
  });

  return app;
}

const IdParamsSchema = z.object({ id: z.uuid() });
const SlugParamsSchema = z.object({ slug: z.string().min(1).max(80) });
const ResolveParamsSchema = z.object({ name: z.string().min(1).max(255) });
const SearchQuerySchema = z.object({
  query: z.string().min(1).max(2_000),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
const LimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

function ownerTokenFrom(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
