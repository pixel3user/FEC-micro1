import { z } from "zod";

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const JsonObjectSchema = z.record(z.string(), JsonValueSchema);
export type JsonObject = z.infer<typeof JsonObjectSchema>;

export const ProviderWorldSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(2).max(80),
  name: z.string().min(1).max(160),
  summary: z.string().min(1).max(2_000),
  domain: z.string().nullable(),
  knowledge: JsonObjectSchema,
  instructions: z.string().min(1).max(50_000),
  state: JsonObjectSchema,
  searchableText: z.string().min(1).max(50_000),
  published: z.boolean(),
  revision: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type ProviderWorld = z.infer<typeof ProviderWorldSchema>;

export const WorldEventSchema = z.object({
  id: z.uuid(),
  worldId: z.uuid(),
  sessionId: z.uuid().nullable(),
  eventType: z.string().min(1).max(160),
  actor: z.enum(["provider", "consumer", "agent", "system"]),
  payload: JsonObjectSchema,
  createdAt: z.iso.datetime(),
});
export type WorldEvent = z.infer<typeof WorldEventSchema>;

export const AgentManifestSchema = z.object({
  protocol: z.literal("agent-native-web/0.1"),
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  summary: z.string(),
  domain: z.string().nullable(),
  revision: z.number().int().nonnegative(),
  invokeUrl: z.url(),
  discoveredCapabilities: z.array(z.string()),
  generatedAt: z.iso.datetime(),
});
export type AgentManifest = z.infer<typeof AgentManifestSchema>;

export const CreateWorldRequestSchema = z.object({
  message: z.string().min(10).max(30_000),
  preferredName: z.string().min(1).max(160).optional(),
  domain: z.string().min(3).max(255).optional(),
});
export type CreateWorldRequest = z.infer<typeof CreateWorldRequestSchema>;

export const CreateWorldResponseSchema = z.object({
  world: ProviderWorldSchema,
  ownerToken: z.string().min(32),
});
export type CreateWorldResponse = z.infer<typeof CreateWorldResponseSchema>;

export const ConverseRequestSchema = z.object({
  message: z.string().min(1).max(30_000),
});
export type ConverseRequest = z.infer<typeof ConverseRequestSchema>;

export const PublishResponseSchema = z.object({
  world: ProviderWorldSchema,
  manifestUrl: z.url(),
});
export type PublishResponse = z.infer<typeof PublishResponseSchema>;

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(2_000),
  limit: z.number().int().min(1).max(20).default(8),
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResultSchema = z.object({
  world: ProviderWorldSchema,
  score: z.number(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const DynamicActionRequestSchema = z.object({
  sessionId: z.uuid(),
  action: z.string().min(1).max(500),
  arguments: JsonObjectSchema.default({}),
  idempotencyKey: z.string().min(8).max(200).optional(),
});
export type DynamicActionRequest = z.infer<typeof DynamicActionRequestSchema>;

export const DynamicActionDecisionSchema = z.object({
  decision: z.string().min(1).max(10_000),
  result: JsonValueSchema,
  statePatch: JsonObjectSchema,
  publicSummary: z.string().min(1).max(2_000),
});
export type DynamicActionDecision = z.infer<typeof DynamicActionDecisionSchema>;

export const DynamicActionResponseSchema = z.object({
  eventId: z.uuid(),
  worldRevision: z.number().int().nonnegative(),
  decision: DynamicActionDecisionSchema,
});
export type DynamicActionResponse = z.infer<typeof DynamicActionResponseSchema>;

export const ExperienceRequestSchema = z.object({
  intent: z.string().min(2).max(5_000),
  preferredWorldIds: z.array(z.uuid()).max(8).optional(),
});
export type ExperienceRequest = z.infer<typeof ExperienceRequestSchema>;

export const GeneratedExperienceSchema = z.object({
  id: z.uuid(),
  sessionId: z.uuid(),
  title: z.string().min(1).max(300),
  html: z.string().min(100).max(500_000),
  rationale: z.string().min(1).max(4_000),
  worldIds: z.array(z.uuid()).min(1),
  createdAt: z.iso.datetime(),
});
export type GeneratedExperience = z.infer<typeof GeneratedExperienceSchema>;

export const ExperienceResponseSchema = z.object({
  experience: GeneratedExperienceSchema,
  providers: z.array(ProviderWorldSchema),
});
export type ExperienceResponse = z.infer<typeof ExperienceResponseSchema>;

export const RepairExperienceRequestSchema = z.object({
  sessionId: z.uuid(),
  error: z.string().min(1).max(5_000),
  context: z.string().max(5_000).optional(),
});
export type RepairExperienceRequest = z.infer<
  typeof RepairExperienceRequestSchema
>;

export const RepairExperienceResponseSchema = z.object({
  experience: GeneratedExperienceSchema,
  repaired: z.boolean(),
});
export type RepairExperienceResponse = z.infer<
  typeof RepairExperienceResponseSchema
>;

export const ResolveResponseSchema = z.object({
  source: z.enum(["index", "dns"]),
  manifest: AgentManifestSchema.optional(),
  manifestUrl: z.url().optional(),
});
export type ResolveResponse = z.infer<typeof ResolveResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: JsonValueSchema.optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
