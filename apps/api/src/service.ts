import { randomUUID } from "node:crypto";
import {
  type AgentManifest,
  type ComposeRequest,
  type ComposeResponse,
  type CreateWorldRequest,
  type CreateWorldResponse,
  type DynamicActionRequest,
  type DynamicActionResponse,
  type ExperienceRequest,
  type ExperienceResponse,
  type JsonObject,
  type ProviderWorld,
  type PublishResponse,
  type RepairExperienceRequest,
  type RepairExperienceResponse,
  type SearchResult,
} from "@agent-web/contracts";
import type { AppConfig } from "./config.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "./errors.js";
import { cosineSimilarity, type Embedder } from "./model/embeddings.js";
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
    private readonly embedder: Embedder,
  ) {}

  private embeddingText(world: {
    name: string;
    summary: string;
    searchableText: string;
  }): string {
    return `${world.name}\n${world.summary}\n${world.searchableText}`;
  }

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
    await this.indexEmbedding(world);
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

  /**
   * Computes and stores the world embedding for semantic discovery. Failures
   * are non-fatal: publishing still succeeds and search falls back to lexical.
   */
  private async indexEmbedding(world: ProviderWorld): Promise<void> {
    if (!this.embedder.available) return;
    try {
      const vector = await this.embedder.embed(this.embeddingText(world));
      await this.store.setWorldEmbedding(world.id, vector);
    } catch {
      // Non-fatal — lexical search remains available.
    }
  }

  async search(query: string, limit: number): Promise<SearchResult[]> {
    if (!query.trim()) {
      const worlds = await this.store.listPublishedWorlds(limit);
      return worlds.map((world) => ({ world, score: 0 }));
    }

    const lexical = await this.store.searchWorlds(query, Math.max(limit, 12));
    const semantic = await this.semanticScores(query, Math.max(limit, 20));

    if (semantic.size === 0) {
      if (lexical.length > 0) return lexical.slice(0, limit);
      const fallback = await this.store.listPublishedWorlds(limit);
      return fallback.map((world) => ({ world, score: 0 }));
    }

    // Blend: normalized lexical rank + cosine similarity. Union of both sets.
    const merged = new Map<string, { world: ProviderWorld; score: number }>();
    const lexicalMax = lexical[0]?.score || 1;
    lexical.forEach((entry) => {
      const normalized = lexicalMax > 0 ? entry.score / lexicalMax : 0;
      merged.set(entry.world.id, {
        world: entry.world,
        score: normalized * 0.4,
      });
    });
    for (const [world, similarity] of semantic) {
      const existing = merged.get(world.id);
      const semanticContribution = similarity * 0.6;
      if (existing) existing.score += semanticContribution;
      else merged.set(world.id, { world, score: semanticContribution });
    }

    return [...merged.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  private async semanticScores(
    query: string,
    limit: number,
  ): Promise<Map<ProviderWorld, number>> {
    const scores = new Map<ProviderWorld, number>();
    if (!this.embedder.available) return scores;
    let queryVector: number[];
    try {
      queryVector = await this.embedder.embed(query);
    } catch {
      return scores;
    }
    const candidates =
      await this.store.listPublishedWorldsWithEmbeddings(limit);
    for (const { world, embedding } of candidates) {
      if (!embedding) continue;
      scores.set(world, cosineSimilarity(queryVector, embedding));
    }
    return scores;
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

  async compose(input: ComposeRequest): Promise<ComposeResponse> {
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
      worlds = (await this.search(input.intent, input.maxProviders)).map(
        ({ world }) => world,
      );
    }
    worlds = worlds.slice(0, input.maxProviders);
    if (worlds.length === 0) {
      throw new NotFoundError(
        "No published provider agents are available for this intent.",
      );
    }

    const plan = await this.model.planComposition({
      intent: input.intent,
      worlds,
    });
    // Keep only worlds the plan actually references, preserving discovery order.
    const referenced = new Set(plan.steps.map((step) => step.worldId));
    const planWorlds = worlds.filter((world) => referenced.has(world.id));
    const effectiveWorlds = planWorlds.length > 0 ? planWorlds : worlds;

    const sessionId = randomUUID();
    const createdAt = new Date().toISOString();
    await this.store.createSession({
      id: sessionId,
      intent: input.intent,
      worldIds: effectiveWorlds.map((world) => world.id),
      createdAt,
    });
    const generated = await this.model.generateCompositionUi({
      sessionId,
      intent: input.intent,
      worlds: effectiveWorlds,
      plan,
    });
    const experience = await this.store.saveExperience({
      id: randomUUID(),
      sessionId,
      title: generated.title,
      html: generated.html,
      rationale: generated.rationale,
      worldIds: effectiveWorlds.map((world) => world.id),
      createdAt,
    });
    return { experience, providers: effectiveWorlds, plan };
  }

  async repairExperience(
    input: RepairExperienceRequest,
  ): Promise<RepairExperienceResponse> {
    const session = await this.store.getSession(input.sessionId);
    if (!session) throw new NotFoundError("Experience session not found.");
    const previous = await this.store.getLatestExperienceForSession(
      input.sessionId,
    );
    if (!previous)
      throw new NotFoundError(
        "No generated experience exists for this session.",
      );

    const candidates = await Promise.all(
      session.worldIds.map((worldId) => this.store.getWorldById(worldId)),
    );
    const worlds = candidates.filter(
      (world): world is ProviderWorld => world !== null && world.published,
    );
    if (worlds.length === 0) {
      throw new NotFoundError(
        "The provider agents for this session are no longer available.",
      );
    }

    const repaired = await this.model.repairUi({
      sessionId: input.sessionId,
      intent: session.intent,
      worlds,
      previousHtml: previous.html,
      error: input.error,
      ...(input.context ? { context: input.context } : {}),
    });
    const experience = await this.store.saveExperience({
      id: randomUUID(),
      sessionId: input.sessionId,
      title: repaired.title,
      html: repaired.html,
      rationale: repaired.rationale,
      worldIds: worlds.map((world) => world.id),
      createdAt: new Date().toISOString(),
    });
    return { experience, repaired: true };
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
