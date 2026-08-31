import { randomUUID } from "node:crypto";
import {
  DynamicActionResponseSchema,
  ProviderWorldSchema,
  WorldEventSchema,
  type DynamicActionResponse,
  type GeneratedExperience,
  type ProviderWorld,
  type SearchResult,
  type WorldEvent,
} from "@agent-web/contracts";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { ConflictError, NotFoundError } from "../errors.js";
import { schemaSql } from "./schema.js";
import type {
  CommitDecisionInput,
  CreateWorldRecord,
  EventInput,
  SessionRecord,
  Store,
  WorldDefinition,
} from "./types.js";

export class PostgresStore implements Store {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 20 });
  }

  async initialize(): Promise<void> {
    await this.pool.query(schemaSql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async createWorld(record: CreateWorldRecord): Promise<ProviderWorld> {
    try {
      const result = await this.pool.query(
        `INSERT INTO worlds
          (id, slug, name, summary, domain, knowledge, instructions, state, searchable_text,
           published, owner_token_hash, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          record.id,
          record.slug,
          record.name,
          record.summary,
          record.domain,
          JSON.stringify(record.knowledge),
          record.instructions,
          JSON.stringify(record.state),
          record.searchableText,
          record.published,
          record.ownerTokenHash,
          record.revision,
          record.createdAt,
          record.updatedAt,
        ],
      );
      return mapWorld(requireRow(result.rows[0]));
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError(
          "That provider slug or domain is already registered.",
        );
      throw error;
    }
  }

  async getWorldById(id: string): Promise<ProviderWorld | null> {
    const result = await this.pool.query("SELECT * FROM worlds WHERE id = $1", [
      id,
    ]);
    return result.rows[0] ? mapWorld(result.rows[0]) : null;
  }

  async getWorldBySlugOrDomain(value: string): Promise<ProviderWorld | null> {
    const result = await this.pool.query(
      "SELECT * FROM worlds WHERE lower(slug) = lower($1) OR lower(domain) = lower($1) LIMIT 1",
      [value],
    );
    return result.rows[0] ? mapWorld(result.rows[0]) : null;
  }

  async hasSlug(slug: string): Promise<boolean> {
    const result = await this.pool.query(
      "SELECT EXISTS(SELECT 1 FROM worlds WHERE slug = $1) AS present",
      [slug],
    );
    return Boolean(result.rows[0]?.present);
  }

  async verifyOwner(worldId: string, tokenHash: string): Promise<boolean> {
    const result = await this.pool.query(
      "SELECT EXISTS(SELECT 1 FROM worlds WHERE id = $1 AND owner_token_hash = $2) AS valid",
      [worldId, tokenHash],
    );
    return Boolean(result.rows[0]?.valid);
  }

  async updateWorldDefinition(
    worldId: string,
    expectedRevision: number,
    definition: WorldDefinition,
  ): Promise<ProviderWorld> {
    try {
      const result = await this.pool.query(
        `UPDATE worlds SET
           slug=$3, name=$4, summary=$5, domain=$6, knowledge=$7::jsonb,
           instructions=$8, searchable_text=$9, revision=revision+1, updated_at=now()
         WHERE id=$1 AND revision=$2 RETURNING *`,
        [
          worldId,
          expectedRevision,
          definition.slug,
          definition.name,
          definition.summary,
          definition.domain,
          JSON.stringify(definition.knowledge),
          definition.instructions,
          definition.searchableText,
        ],
      );
      if (!result.rows[0])
        throw new ConflictError(
          "The provider world changed; reload before updating it again.",
        );
      return mapWorld(result.rows[0]);
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError(
          "That provider slug or domain is already registered.",
        );
      throw error;
    }
  }

  async publishWorld(worldId: string): Promise<ProviderWorld> {
    const result = await this.pool.query(
      `UPDATE worlds SET published=true, revision=revision+1, updated_at=now()
       WHERE id=$1 RETURNING *`,
      [worldId],
    );
    if (!result.rows[0]) throw new NotFoundError("Provider world not found.");
    return mapWorld(result.rows[0]);
  }

  async searchWorlds(query: string, limit: number): Promise<SearchResult[]> {
    const result = await this.pool.query(
      `WITH input AS (SELECT plainto_tsquery('simple', $1) AS terms)
       SELECT worlds.*,
         ts_rank(to_tsvector('simple', searchable_text), input.terms) AS search_score
       FROM worlds, input
       WHERE published = true
         AND (to_tsvector('simple', searchable_text) @@ input.terms OR searchable_text ILIKE '%' || $1 || '%')
       ORDER BY search_score DESC, updated_at DESC
       LIMIT $2`,
      [query, limit],
    );
    return result.rows.map((row) => ({
      world: mapWorld(row),
      score: Number(row.search_score ?? 0),
    }));
  }

  async listPublishedWorlds(limit: number): Promise<ProviderWorld[]> {
    const result = await this.pool.query(
      "SELECT * FROM worlds WHERE published=true ORDER BY updated_at DESC LIMIT $1",
      [limit],
    );
    return result.rows.map(mapWorld);
  }

  async appendEvent(input: EventInput): Promise<WorldEvent> {
    const result = await this.pool.query(
      `INSERT INTO world_events
        (id, world_id, session_id, event_type, actor, payload, created_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING *`,
      [
        input.id ?? randomUUID(),
        input.worldId,
        input.sessionId,
        input.eventType,
        input.actor,
        JSON.stringify(input.payload),
        input.createdAt ?? new Date().toISOString(),
      ],
    );
    return mapEvent(requireRow(result.rows[0]));
  }

  async listEvents(worldId: string, limit: number): Promise<WorldEvent[]> {
    const result = await this.pool.query(
      `SELECT * FROM (
         SELECT * FROM world_events WHERE world_id=$1 ORDER BY created_at DESC LIMIT $2
       ) recent ORDER BY created_at ASC`,
      [worldId, limit],
    );
    return result.rows.map(mapEvent);
  }

  async createSession(record: SessionRecord): Promise<SessionRecord> {
    await this.pool.query(
      "INSERT INTO sessions (id, intent, world_ids, created_at) VALUES ($1,$2,$3::jsonb,$4)",
      [
        record.id,
        record.intent,
        JSON.stringify(record.worldIds),
        record.createdAt,
      ],
    );
    return record;
  }

  async getSession(id: string): Promise<SessionRecord | null> {
    const result = await this.pool.query("SELECT * FROM sessions WHERE id=$1", [
      id,
    ]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      intent: String(row.intent),
      worldIds: row.world_ids as string[],
      createdAt: toIso(row.created_at),
    };
  }

  async saveExperience(
    experience: GeneratedExperience,
  ): Promise<GeneratedExperience> {
    await this.pool.query(
      `INSERT INTO generated_experiences
        (id, session_id, title, html, rationale, world_ids, created_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [
        experience.id,
        experience.sessionId,
        experience.title,
        experience.html,
        experience.rationale,
        JSON.stringify(experience.worldIds),
        experience.createdAt,
      ],
    );
    return experience;
  }

  async getIdempotentResponse(
    worldId: string,
    key: string,
  ): Promise<DynamicActionResponse | null> {
    const result = await this.pool.query(
      "SELECT response FROM idempotency_records WHERE world_id=$1 AND key=$2",
      [worldId, key],
    );
    return result.rows[0]
      ? DynamicActionResponseSchema.parse(result.rows[0].response)
      : null;
  }

  async commitDecision(
    input: CommitDecisionInput,
  ): Promise<DynamicActionResponse> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (input.idempotencyKey) {
        const prior = await client.query(
          "SELECT response FROM idempotency_records WHERE world_id=$1 AND key=$2 FOR UPDATE",
          [input.worldId, input.idempotencyKey],
        );
        if (prior.rows[0]) {
          await client.query("COMMIT");
          return DynamicActionResponseSchema.parse(prior.rows[0].response);
        }
      }

      const worldResult = await client.query(
        `UPDATE worlds SET state=$3::jsonb, revision=revision+1, updated_at=now()
         WHERE id=$1 AND revision=$2 RETURNING revision`,
        [input.worldId, input.expectedRevision, JSON.stringify(input.state)],
      );
      if (!worldResult.rows[0]) {
        throw new ConflictError(
          "The world changed while the agent was deciding. Retry with current context.",
        );
      }

      const eventId = randomUUID();
      const revision = Number(worldResult.rows[0].revision);
      await insertDecisionEvent(client, eventId, input);
      const response: DynamicActionResponse = {
        eventId,
        worldRevision: revision,
        decision: input.decision,
      };
      if (input.idempotencyKey) {
        await client.query(
          `INSERT INTO idempotency_records (world_id, key, response)
           VALUES ($1,$2,$3::jsonb)`,
          [input.worldId, input.idempotencyKey, JSON.stringify(response)],
        );
      }
      await client.query("COMMIT");
      return response;
    } catch (error) {
      await client.query("ROLLBACK");
      if (isUniqueViolation(error) && input.idempotencyKey) {
        const existing = await this.getIdempotentResponse(
          input.worldId,
          input.idempotencyKey,
        );
        if (existing) return existing;
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

async function insertDecisionEvent(
  client: PoolClient,
  eventId: string,
  input: CommitDecisionInput,
): Promise<void> {
  await client.query(
    `INSERT INTO world_events
      (id, world_id, session_id, event_type, actor, payload)
     VALUES ($1,$2,$3,$4,'agent',$5::jsonb)`,
    [
      eventId,
      input.worldId,
      input.sessionId,
      `agent.decision:${input.action}`,
      JSON.stringify({
        action: input.action,
        arguments: input.arguments,
        decision: input.decision,
      }),
    ],
  );
}

function mapWorld(row: QueryResultRow): ProviderWorld {
  return ProviderWorldSchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    domain: row.domain ?? null,
    knowledge: row.knowledge,
    instructions: row.instructions,
    state: row.state,
    searchableText: row.searchable_text,
    published: row.published,
    revision: row.revision,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  });
}

function mapEvent(row: QueryResultRow): WorldEvent {
  return WorldEventSchema.parse({
    id: row.id,
    worldId: row.world_id,
    sessionId: row.session_id ?? null,
    eventType: row.event_type,
    actor: row.actor,
    payload: row.payload,
    createdAt: toIso(row.created_at),
  });
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function requireRow(row: QueryResultRow | undefined): QueryResultRow {
  if (!row) throw new Error("Expected database row was not returned.");
  return row;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
