import { randomUUID } from "node:crypto";
import {
  type AgentManifest,
  type CreateWorldRequest,
  type CreateWorldResponse,
  type DynamicActionRequest,
  type DynamicActionResponse,
  type ExperienceRequest,
  type ExperienceResponse,
  type JsonObject,
  type ProviderWorld,
  type PublishResponse,
  type SearchResult,
} from "@agent-web/contracts";
import type { AppConfig } from "./config.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "./errors.js";
import type { ModelRuntime } from "./model/index.js";
import type { Store, WorldDefinition } from "./storage/types.js";
import {
  capabilitiesFromKnowledge,
  createOwnerToken,
  hashToken,
  mergeJsonObjects,
  slugify,
} from "./utils.js";

export class AgentWebService {
  constructor(
    private readonly store: Store,
    private readonly model: ModelRuntime,
    private readonly config: AppConfig,
  ) {}

  async createWorld(input: CreateWorldRequest): Promise<CreateWorldResponse> {
    const draft = await this.model.createWorld({
      providerMessage: input.message,
      ...(input.preferredName ? { preferredName: input.preferredName } : {}),
      ...(input.domain ? { domain: input.domain } : {}),
    });
    const slug = await this.uniqueSlug(slugify(draft.slug));
    const ownerToken = createOwnerToken();
    const now = new Date().toISOString();
    const world = await this.store.createWorld({
      id: randomUUID(),
      slug,
      name: draft.name,
      summary: draft.summary,
      domain: input.domain ?? null,
      knowledge: draft.knowledge,
      instructions: draft.instructions,
      state: {},
      searchableText: draft.searchableText,
      published: false,
      ownerTokenHash: hashToken(ownerToken),
      revision: 0,
      createdAt: now,
      updatedAt: now,
    });
    await this.store.appendEvent({
      worldId: world.id,
      sessionId: null,
      eventType: "provider.world-created",
      actor: "provider",
      payload: { message: input.message },
    });
    return { world, ownerToken };
  }

  async requireOwner(
    worldId: string,
    ownerToken: string | undefined,
  ): Promise<void> {
    if (
      !ownerToken ||
      !(await this.store.verifyOwner(worldId, hashToken(ownerToken)))
    ) {
      throw new UnauthorizedError(
        "A valid x-owner-token header is required for this provider world.",
      );
    }
  }

  async converse(
    worldId: string,
    providerMessage: string,
  ): Promise<ProviderWorld> {
    const world = await this.requireWorld(worldId);
    const events = await this.store.listEvents(worldId, 30);
    const draft = await this.model.reviseWorld({
      world,
      events,
      providerMessage,
    });
    const definition: WorldDefinition = {
      slug: world.slug,
      name: draft.name,
      summary: draft.summary,
      domain: world.domain,
      knowledge: draft.knowledge,
      instructions: draft.instructions,
      searchableText: draft.searchableText,
    };
    const updated = await this.store.updateWorldDefinition(
      worldId,
      world.revision,
      definition,
    );
    await this.store.appendEvent({
      worldId,
      sessionId: null,
      eventType: "provider.world-revised",
      actor: "provider",
      payload: { message: providerMessage, revision: updated.revision },
    });
    return updated;
  }

  async publish(worldId: string): Promise<PublishResponse> {
    const world = await this.store.publishWorld(worldId);
    await this.store.appendEvent({
      worldId,
      sessionId: null,
      eventType: "provider.world-published",
      actor: "provider",
      payload: { revision: world.revision },
    });
    return {
      world,
      manifestUrl: `${this.config.publicApiUrl}/.well-known/agents/${world.slug}.json`,
    };
  }

  async search(query: string, limit: number): Promise<SearchResult[]> {
    if (!query.trim()) {
      const worlds = await this.store.listPublishedWorlds(limit);
      return worlds.map((world) => ({ world, score: 0 }));
    }
    const results = await this.store.searchWorlds(query, limit);
    if (results.length > 0) return results;
    const fallback = await this.store.listPublishedWorlds(limit);
    return fallback.map((world) => ({ world, score: 0 }));
  }

  async createExperience(
    input: ExperienceRequest,
  ): Promise<ExperienceResponse> {
    let worlds: ProviderWorld[] = [];
    if (input.preferredWorldIds?.length) {
      const candidates = await Promise.all(
        input.preferredWorldIds.map((worldId) =>
          this.store.getWorldById(worldId),
        ),
      );
      worlds = candidates.filter(
        (world): world is ProviderWorld => world !== null && world.published,
      );
    } else {
      worlds = (await this.search(input.intent, 6)).map(({ world }) => world);
    }
    if (worlds.length === 0) {
      throw new NotFoundError(
        "No published provider agents are available for this intent.",
      );
    }

    const sessionId = randomUUID();
    const createdAt = new Date().toISOString();
    await this.store.createSession({
      id: sessionId,
      intent: input.intent,
      worldIds: worlds.map((world) => world.id),
      createdAt,
    });
    const generated = await this.model.generateUi({
      sessionId,
      intent: input.intent,
      worlds,
    });
    const experience = await this.store.saveExperience({
      id: randomUUID(),
      sessionId,
      title: generated.title,
      html: generated.html,
      rationale: generated.rationale,
      worldIds: worlds.map((world) => world.id),
      createdAt,
    });
    return { experience, providers: worlds };
  }

  async invoke(
    worldId: string,
    input: DynamicActionRequest,
  ): Promise<DynamicActionResponse> {
    if (input.idempotencyKey) {
      const previous = await this.store.getIdempotentResponse(
        worldId,
        input.idempotencyKey,
      );
      if (previous) return previous;
    }
    const [world, session] = await Promise.all([
      this.requireWorld(worldId),
      this.store.getSession(input.sessionId),
    ]);
    if (!world.published)
      throw new NotFoundError("Provider agent is not published.");
    if (!session) throw new NotFoundError("Experience session not found.");

    const events = await this.store.listEvents(worldId, 40);
    const decision = await this.model.decideAction({
      world,
      events,
      consumerIntent: session.intent,
      action: input.action,
      arguments: input.arguments,
    });
    const state = mergeJsonObjects(world.state, decision.statePatch);
    return this.store.commitDecision({
      worldId,
      sessionId: input.sessionId,
      expectedRevision: world.revision,
      state,
      decision,
      action: input.action,
      arguments: input.arguments,
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    });
  }

  async manifest(slug: string): Promise<AgentManifest> {
    const world = await this.store.getWorldBySlugOrDomain(slug);
    if (!world?.published)
      throw new NotFoundError("Published provider agent not found.");
    return this.buildManifest(world);
  }

  buildManifest(world: ProviderWorld): AgentManifest {
    return {
      protocol: "agent-native-web/0.1",
      id: world.id,
      slug: world.slug,
      name: world.name,
      summary: world.summary,
      domain: world.domain,
      revision: world.revision,
      invokeUrl: `${this.config.publicApiUrl}/v1/worlds/${world.id}/invoke`,
      discoveredCapabilities: capabilitiesFromKnowledge(world.knowledge),
      generatedAt: new Date().toISOString(),
    };
  }

  async getPublicWorld(id: string): Promise<ProviderWorld> {
    const world = await this.requireWorld(id);
    if (!world.published)
      throw new NotFoundError("Published provider agent not found.");
    return world;
  }

  async events(worldId: string, limit: number) {
    const world = await this.getPublicWorld(worldId);
    return {
      worldRevision: world.revision,
      events: await this.store.listEvents(worldId, limit),
    };
  }

  private async requireWorld(id: string): Promise<ProviderWorld> {
    const world = await this.store.getWorldById(id);
    if (!world) throw new NotFoundError("Provider world not found.");
    return world;
  }

  private async uniqueSlug(base: string): Promise<string> {
    if (!(await this.store.hasSlug(base))) return base;
    for (let suffix = 2; suffix < 10_000; suffix += 1) {
      const candidate = `${base.slice(0, 72)}-${suffix}`;
      if (!(await this.store.hasSlug(candidate))) return candidate;
    }
    throw new ConflictError("Unable to allocate a unique provider slug.");
  }
}
