import { randomUUID } from "node:crypto";
import type {
  DynamicActionResponse,
  GeneratedExperience,
  ProviderWorld,
  SearchResult,
  WorldEvent,
} from "@agent-web/contracts";
import { ConflictError, NotFoundError } from "../errors.js";
import type {
  CommitDecisionInput,
  CreateWorldRecord,
  EventInput,
  SessionRecord,
  Store,
  WorldDefinition,
} from "./types.js";

type StoredWorld = {
  world: ProviderWorld;
  ownerTokenHash: string;
};

export class MemoryStore implements Store {
  private readonly worlds = new Map<string, StoredWorld>();
  private readonly events: WorldEvent[] = [];
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly experiences = new Map<string, GeneratedExperience>();
  private readonly idempotency = new Map<string, DynamicActionResponse>();

  async initialize(): Promise<void> {}
  async close(): Promise<void> {}

  async createWorld(record: CreateWorldRecord): Promise<ProviderWorld> {
    if (
      [...this.worlds.values()].some(({ world }) => world.slug === record.slug)
    ) {
      throw new ConflictError(`The slug ${record.slug} is already registered.`);
    }
    const world: ProviderWorld = {
      id: record.id,
      slug: record.slug,
      name: record.name,
      summary: record.summary,
      domain: record.domain,
      knowledge: structuredClone(record.knowledge),
      instructions: record.instructions,
      state: structuredClone(record.state),
      searchableText: record.searchableText,
      published: record.published,
      revision: record.revision,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
    this.worlds.set(record.id, {
      world,
      ownerTokenHash: record.ownerTokenHash,
    });
    return structuredClone(world);
  }

  async getWorldById(id: string): Promise<ProviderWorld | null> {
    const stored = this.worlds.get(id);
    return stored ? structuredClone(stored.world) : null;
  }

  async getWorldBySlugOrDomain(value: string): Promise<ProviderWorld | null> {
    const normalized = value.toLowerCase();
    const stored = [...this.worlds.values()].find(
      ({ world }) =>
        world.slug.toLowerCase() === normalized ||
        world.domain?.toLowerCase() === normalized,
    );
    return stored ? structuredClone(stored.world) : null;
  }

  async hasSlug(slug: string): Promise<boolean> {
    return [...this.worlds.values()].some(({ world }) => world.slug === slug);
  }

  async verifyOwner(worldId: string, tokenHash: string): Promise<boolean> {
    return this.worlds.get(worldId)?.ownerTokenHash === tokenHash;
  }

  async updateWorldDefinition(
    worldId: string,
    expectedRevision: number,
    definition: WorldDefinition,
  ): Promise<ProviderWorld> {
    const stored = this.requireStoredWorld(worldId);
    if (stored.world.revision !== expectedRevision) {
      throw new ConflictError(
        "The provider world changed; reload before updating it again.",
      );
    }
    stored.world = {
      ...stored.world,
      ...structuredClone(definition),
      revision: stored.world.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    return structuredClone(stored.world);
  }

  async publishWorld(worldId: string): Promise<ProviderWorld> {
    const stored = this.requireStoredWorld(worldId);
    stored.world = {
      ...stored.world,
      published: true,
      revision: stored.world.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    return structuredClone(stored.world);
  }

  async searchWorlds(query: string, limit: number): Promise<SearchResult[]> {
    const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
    return [...this.worlds.values()]
      .map(({ world }) => {
        const haystack =
          `${world.name} ${world.summary} ${world.searchableText}`.toLowerCase();
        const matches = terms.reduce(
          (count, term) => count + (haystack.includes(term) ? 1 : 0),
          0,
        );
        return {
          world,
          score: terms.length === 0 ? 0 : matches / terms.length,
        };
      })
      .filter(
        ({ world, score }) =>
          world.published && (score > 0 || terms.length === 0),
      )
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.world.updatedAt.localeCompare(left.world.updatedAt),
      )
      .slice(0, limit)
      .map(({ world, score }) => ({ world: structuredClone(world), score }));
  }

  async listPublishedWorlds(limit: number): Promise<ProviderWorld[]> {
    return [...this.worlds.values()]
      .map(({ world }) => world)
      .filter((world) => world.published)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, limit)
      .map((world) => structuredClone(world));
  }

  async appendEvent(input: EventInput): Promise<WorldEvent> {
    this.requireStoredWorld(input.worldId);
    const event: WorldEvent = {
      id: input.id ?? randomUUID(),
      worldId: input.worldId,
      sessionId: input.sessionId,
      eventType: input.eventType,
      actor: input.actor,
      payload: structuredClone(input.payload),
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    this.events.push(event);
    return structuredClone(event);
  }

  async listEvents(worldId: string, limit: number): Promise<WorldEvent[]> {
    return this.events
      .filter((event) => event.worldId === worldId)
      .slice(-limit)
      .map((event) => structuredClone(event));
  }

  async createSession(record: SessionRecord): Promise<SessionRecord> {
    this.sessions.set(record.id, structuredClone(record));
    return structuredClone(record);
  }

  async getSession(id: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(id);
    return session ? structuredClone(session) : null;
  }

  async saveExperience(
    experience: GeneratedExperience,
  ): Promise<GeneratedExperience> {
    this.experiences.set(experience.id, structuredClone(experience));
    return structuredClone(experience);
  }

  async getIdempotentResponse(
    worldId: string,
    key: string,
  ): Promise<DynamicActionResponse | null> {
    const response = this.idempotency.get(`${worldId}:${key}`);
    return response ? structuredClone(response) : null;
  }

  async commitDecision(
    input: CommitDecisionInput,
  ): Promise<DynamicActionResponse> {
    const stored = this.requireStoredWorld(input.worldId);
    if (input.idempotencyKey) {
      const existing = this.idempotency.get(
        `${input.worldId}:${input.idempotencyKey}`,
      );
      if (existing) return structuredClone(existing);
    }
    if (stored.world.revision !== input.expectedRevision) {
      throw new ConflictError(
        "The world changed while the agent was deciding. Retry with current context.",
      );
    }

    const eventId = randomUUID();
    const revision = stored.world.revision + 1;
    stored.world = {
      ...stored.world,
      state: structuredClone(input.state),
      revision,
      updatedAt: new Date().toISOString(),
    };
    await this.appendEvent({
      id: eventId,
      worldId: input.worldId,
      sessionId: input.sessionId,
      eventType: `agent.decision:${input.action}`,
      actor: "agent",
      payload: {
        action: input.action,
        arguments: input.arguments,
        decision: input.decision,
      },
    });
    const response: DynamicActionResponse = {
      eventId,
      worldRevision: revision,
      decision: structuredClone(input.decision),
    };
    if (input.idempotencyKey) {
      this.idempotency.set(
        `${input.worldId}:${input.idempotencyKey}`,
        structuredClone(response),
      );
    }
    return response;
  }

  private requireStoredWorld(id: string): StoredWorld {
    const stored = this.worlds.get(id);
    if (!stored) throw new NotFoundError("Provider world not found.");
    return stored;
  }
}
