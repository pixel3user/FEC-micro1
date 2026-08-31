import type {
  DynamicActionDecision,
  DynamicActionResponse,
  GeneratedExperience,
  JsonObject,
  ProviderWorld,
  SearchResult,
  WorldEvent,
} from "@agent-web/contracts";

export type WorldDefinition = Pick<
  ProviderWorld,
  | "slug"
  | "name"
  | "summary"
  | "domain"
  | "knowledge"
  | "instructions"
  | "searchableText"
>;

export type CreateWorldRecord = WorldDefinition & {
  id: string;
  ownerTokenHash: string;
  state: JsonObject;
  published: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type SessionRecord = {
  id: string;
  intent: string;
  worldIds: string[];
  createdAt: string;
};

export type EventInput = Omit<WorldEvent, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

export type CommitDecisionInput = {
  worldId: string;
  sessionId: string;
  expectedRevision: number;
  state: JsonObject;
  decision: DynamicActionDecision;
  action: string;
  arguments: JsonObject;
  idempotencyKey?: string;
};

export interface Store {
  initialize(): Promise<void>;
  close(): Promise<void>;
  createWorld(record: CreateWorldRecord): Promise<ProviderWorld>;
  getWorldById(id: string): Promise<ProviderWorld | null>;
  getWorldBySlugOrDomain(value: string): Promise<ProviderWorld | null>;
  hasSlug(slug: string): Promise<boolean>;
  verifyOwner(worldId: string, tokenHash: string): Promise<boolean>;
  updateWorldDefinition(
    worldId: string,
    expectedRevision: number,
    definition: WorldDefinition,
  ): Promise<ProviderWorld>;
  publishWorld(worldId: string): Promise<ProviderWorld>;
  searchWorlds(query: string, limit: number): Promise<SearchResult[]>;
  listPublishedWorlds(limit: number): Promise<ProviderWorld[]>;
  appendEvent(input: EventInput): Promise<WorldEvent>;
  listEvents(worldId: string, limit: number): Promise<WorldEvent[]>;
  createSession(record: SessionRecord): Promise<SessionRecord>;
  getSession(id: string): Promise<SessionRecord | null>;
  saveExperience(experience: GeneratedExperience): Promise<GeneratedExperience>;
  getIdempotentResponse(
    worldId: string,
    key: string,
  ): Promise<DynamicActionResponse | null>;
  commitDecision(input: CommitDecisionInput): Promise<DynamicActionResponse>;
}
