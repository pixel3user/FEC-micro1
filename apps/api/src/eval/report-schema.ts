import { JsonObjectSchema } from "@agent-web/contracts";
import { z } from "zod";
import { HtmlStructureObservationSchema } from "./html-structure.js";
import { FixtureIdSchema, FixtureSplitSchema } from "./schemas.js";

export const EVALUATION_REPORT_VERSION = 1 as const;

export const EvaluationRuntimeIdentitySchema = z
  .object({
    runtimeId: z.string().min(1).max(200),
    modelId: z.string().min(1).max(300),
    embeddingModelId: z.string().min(1).max(300),
  })
  .strict();
export type EvaluationRuntimeIdentity = z.infer<
  typeof EvaluationRuntimeIdentitySchema
>;

const ProviderMappingSchema = z
  .object({
    fixtureProviderId: FixtureIdSchema,
    worldId: z.uuid(),
  })
  .strict();

const RankedProviderSchema = z
  .object({
    rank: z.number().int().positive(),
    fixtureProviderId: FixtureIdSchema.nullable(),
    worldId: z.uuid().nullable(),
    score: z.number(),
  })
  .strict();

const DiscoveryPathSchema = z
  .object({
    rankedProviders: z.array(RankedProviderSchema),
    topHit: z.boolean(),
    relevantProviderCoverage: z.boolean(),
  })
  .strict();

const DiscoveryObservationSchema = z
  .object({
    retrievalCutoff: z.number().int().min(1).max(8),
    baseline: DiscoveryPathSchema,
    agent: DiscoveryPathSchema,
  })
  .strict();

const GeneratedProviderSchema = z
  .object({
    fixtureProviderId: FixtureIdSchema.nullable(),
    worldId: z.uuid(),
  })
  .strict();

const GenerationObservationSchema = z
  .object({
    kind: z.enum(["single", "compose"]),
    statusCode: z.literal(201),
    providers: z.array(GeneratedProviderSchema),
    relevantProviderCoverage: z.boolean(),
    planProviders: z.array(GeneratedProviderSchema).nullable(),
    planRelevantProviderCoverage: z.boolean().nullable(),
    html: HtmlStructureObservationSchema,
  })
  .strict();

const PersistenceObservationSchema = z
  .object({
    statePatchPersisted: z.boolean(),
    revisionPersisted: z.boolean(),
    eventPersisted: z.boolean(),
    eventPayloadPersisted: z.boolean(),
    matchingDecisionEventCount: z.number().int().nonnegative(),
    retryDidNotAddEvent: z.boolean(),
    retryDidNotAdvanceRevision: z.boolean(),
  })
  .strict();

const InvocationObservationSchema = z
  .object({
    providerId: FixtureIdSchema,
    action: z.string().min(1).max(500),
    arguments: JsonObjectSchema,
    idempotencyKey: z.string().min(8).max(200),
    statusCode: z.literal(200),
    retryStatusCode: z.literal(200),
    decisionStatus: z.enum(["ok", "needs_input", "declined", "error"]),
    providerInGeneratedExperience: z.boolean(),
    eventId: z.uuid(),
    worldRevision: z.number().int().nonnegative(),
    retryReturnedSameResponse: z.boolean(),
    persistence: PersistenceObservationSchema,
  })
  .strict();

export const EvaluationCaseObservationSchema = z
  .object({
    caseId: FixtureIdSchema,
    mode: z.enum(["single", "compose"]),
    intent: z.string().min(2).max(5_000),
    relevantProviderIds: z.array(FixtureIdSchema).min(1).max(8),
    discovery: DiscoveryObservationSchema,
    generation: GenerationObservationSchema,
    invocation: InvocationObservationSchema,
  })
  .strict()
  .superRefine((observation, ctx) => {
    for (const path of ["baseline", "agent"] as const) {
      const ranked = observation.discovery[path].rankedProviders;
      if (ranked.some(({ rank }, index) => rank !== index + 1)) {
        ctx.addIssue({
          code: "custom",
          message: "rank values must be consecutive",
          path: ["discovery", path, "rankedProviders"],
        });
      }
      const firstId = ranked[0]?.fixtureProviderId;
      const expectedTopHit =
        firstId !== null &&
        firstId !== undefined &&
        observation.relevantProviderIds.includes(firstId);
      if (observation.discovery[path].topHit !== expectedTopHit) {
        ctx.addIssue({
          code: "custom",
          message: "topHit must match ranked providers",
          path: ["discovery", path, "topHit"],
        });
      }
      const rankedIds = new Set(
        ranked.map(({ fixtureProviderId }) => fixtureProviderId),
      );
      const expectedCoverage = observation.relevantProviderIds.every((id) =>
        rankedIds.has(id),
      );
      if (
        observation.discovery[path].relevantProviderCoverage !==
        expectedCoverage
      ) {
        ctx.addIssue({
          code: "custom",
          message: "coverage must match ranked providers",
          path: ["discovery", path, "relevantProviderCoverage"],
        });
      }
    }
    const generatedIds = new Set(
      observation.generation.providers.map(
        ({ fixtureProviderId }) => fixtureProviderId,
      ),
    );
    const expectedGeneratedCoverage = observation.relevantProviderIds.every(
      (id) => generatedIds.has(id),
    );
    if (
      observation.generation.relevantProviderCoverage !==
      expectedGeneratedCoverage
    ) {
      ctx.addIssue({
        code: "custom",
        message: "coverage must match generated providers",
        path: ["generation", "relevantProviderCoverage"],
      });
    }
    if (observation.generation.kind !== observation.mode) {
      ctx.addIssue({
        code: "custom",
        message: "generation kind must match case mode",
        path: ["generation", "kind"],
      });
    }
    if (
      observation.mode === "single" &&
      (observation.generation.planProviders !== null ||
        observation.generation.planRelevantProviderCoverage !== null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "single cases cannot have plan evidence",
        path: ["generation", "planProviders"],
      });
    }
    if (
      observation.mode === "compose" &&
      (observation.generation.planProviders === null ||
        observation.generation.planRelevantProviderCoverage === null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "compose cases require plan evidence",
        path: ["generation", "planProviders"],
      });
    } else if (
      observation.generation.planProviders !== null &&
      observation.generation.planRelevantProviderCoverage !== null
    ) {
      const planIds = new Set(
        observation.generation.planProviders.map(
          ({ fixtureProviderId }) => fixtureProviderId,
        ),
      );
      const expectedPlanCoverage = observation.relevantProviderIds.every((id) =>
        planIds.has(id),
      );
      if (
        observation.generation.planRelevantProviderCoverage !==
        expectedPlanCoverage
      ) {
        ctx.addIssue({
          code: "custom",
          message: "coverage must match plan providers",
          path: ["generation", "planRelevantProviderCoverage"],
        });
      }
    }
    const invocationLinked = observation.generation.providers.some(
      ({ fixtureProviderId }) =>
        fixtureProviderId === observation.invocation.providerId,
    );
    if (
      observation.invocation.providerInGeneratedExperience !== invocationLinked
    ) {
      ctx.addIssue({
        code: "custom",
        message: "invocation linkage must match generated providers",
        path: ["invocation", "providerInGeneratedExperience"],
      });
    }
  });
export type EvaluationCaseObservation = z.infer<
  typeof EvaluationCaseObservationSchema
>;

const MetricCaseOutcomeSchema = z
  .object({
    caseId: FixtureIdSchema,
    passed: z.boolean(),
  })
  .strict();

export const MetricEvidenceSchema = z
  .object({
    numerator: z.number().int().nonnegative(),
    denominator: z.number().int().nonnegative(),
    rate: z.number().min(0).max(1).nullable(),
    caseOutcomes: z.array(MetricCaseOutcomeSchema),
  })
  .strict()
  .superRefine((evidence, ctx) => {
    const numerator = evidence.caseOutcomes.filter(
      ({ passed }) => passed,
    ).length;
    const denominator = evidence.caseOutcomes.length;
    const expectedRate =
      denominator === 0
        ? null
        : Math.round((numerator / denominator) * 1_000_000) / 1_000_000;
    if (evidence.numerator !== numerator) {
      ctx.addIssue({
        code: "custom",
        message: "numerator must match passing case outcomes",
        path: ["numerator"],
      });
    }
    if (evidence.denominator !== denominator) {
      ctx.addIssue({
        code: "custom",
        message: "denominator must match case outcomes",
        path: ["denominator"],
      });
    }
    if (evidence.rate !== expectedRate) {
      ctx.addIssue({
        code: "custom",
        message: "rate must match numerator/denominator",
        path: ["rate"],
      });
    }
    if (
      new Set(evidence.caseOutcomes.map(({ caseId }) => caseId)).size !==
      denominator
    ) {
      ctx.addIssue({
        code: "custom",
        message: "case outcome IDs must be unique",
        path: ["caseOutcomes"],
      });
    }
  });
export type MetricEvidence = z.infer<typeof MetricEvidenceSchema>;

const ComparableMetricSchema = z
  .object({
    baseline: MetricEvidenceSchema,
    agent: MetricEvidenceSchema,
  })
  .strict();

export const EvaluationMetricsSchema = z
  .object({
    comparable: z
      .object({
        retrievalCutoff: z.number().int().min(1).max(8),
        discoveryTopHit: ComparableMetricSchema,
        discoveryRelevantProviderCoverage: ComparableMetricSchema,
      })
      .strict(),
    agentOnly: z
      .object({
        generatedProviderCoverage: MetricEvidenceSchema,
        composePlanProviderCoverage: MetricEvidenceSchema,
        htmlStructureAndSafety: MetricEvidenceSchema,
        invocationOk: MetricEvidenceSchema,
        statePersisted: MetricEvidenceSchema,
        eventPersisted: MetricEvidenceSchema,
        idempotentRetry: MetricEvidenceSchema,
      })
      .strict(),
  })
  .strict();

const UsagePurposeSchema = z
  .object({
    calls: z.number().int().nonnegative(),
    costUsd: z.number().nonnegative(),
  })
  .strict();

export const RunLocalUsageSchema = z
  .object({
    scope: z.literal("process-counter-delta"),
    calls: z.number().int().nonnegative(),
    costUsd: z.number().nonnegative(),
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    byPurpose: z.record(z.string(), UsagePurposeSchema),
  })
  .strict();

export const EvalReportSchema = z
  .object({
    reportVersion: z.literal(EVALUATION_REPORT_VERSION),
    runId: z.string().min(1).max(200),
    dataset: z
      .object({
        id: z.string().min(1).max(200),
        version: z.number().int().positive(),
        split: FixtureSplitSchema,
      })
      .strict(),
    runtime: EvaluationRuntimeIdentitySchema,
    startedAt: z.iso.datetime(),
    completedAt: z.iso.datetime(),
    retrievalCutoff: z.number().int().min(1).max(8),
    providerMappings: z.array(ProviderMappingSchema).min(1),
    cases: z.array(EvaluationCaseObservationSchema).min(1),
    metrics: EvaluationMetricsSchema,
    usage: RunLocalUsageSchema,
  })
  .strict()
  .superRefine((report, ctx) => {
    const fixtureIds = report.providerMappings.map(
      ({ fixtureProviderId }) => fixtureProviderId,
    );
    const worldIds = report.providerMappings.map(({ worldId }) => worldId);
    if (
      new Set(fixtureIds).size !== fixtureIds.length ||
      new Set(worldIds).size !== worldIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "provider mappings must be one-to-one",
        path: ["providerMappings"],
      });
    }
    if (report.metrics.comparable.retrievalCutoff !== report.retrievalCutoff) {
      ctx.addIssue({
        code: "custom",
        message: "metric cutoff must match report cutoff",
        path: ["metrics", "comparable", "retrievalCutoff"],
      });
    }
    const allCaseIds = report.cases.map(({ caseId }) => caseId).sort();
    const composeCaseIds = report.cases
      .filter(({ mode }) => mode === "compose")
      .map(({ caseId }) => caseId)
      .sort();
    const allCaseMetrics = [
      report.metrics.comparable.discoveryTopHit.baseline,
      report.metrics.comparable.discoveryTopHit.agent,
      report.metrics.comparable.discoveryRelevantProviderCoverage.baseline,
      report.metrics.comparable.discoveryRelevantProviderCoverage.agent,
      report.metrics.agentOnly.generatedProviderCoverage,
      report.metrics.agentOnly.htmlStructureAndSafety,
      report.metrics.agentOnly.invocationOk,
      report.metrics.agentOnly.statePersisted,
      report.metrics.agentOnly.eventPersisted,
      report.metrics.agentOnly.idempotentRetry,
    ];
    allCaseMetrics.forEach((metric, index) => {
      const outcomeIds = metric.caseOutcomes.map(({ caseId }) => caseId).sort();
      if (!isDeepEqualStringArray(outcomeIds, allCaseIds)) {
        ctx.addIssue({
          code: "custom",
          message: "metric outcomes must cover every selected case",
          path: ["metrics", index],
        });
      }
    });
    const planOutcomeIds =
      report.metrics.agentOnly.composePlanProviderCoverage.caseOutcomes
        .map(({ caseId }) => caseId)
        .sort();
    if (!isDeepEqualStringArray(planOutcomeIds, composeCaseIds)) {
      ctx.addIssue({
        code: "custom",
        message: "compose-plan outcomes must cover compose cases only",
        path: ["metrics", "agentOnly", "composePlanProviderCoverage"],
      });
    }
    report.cases.forEach((observation, index) => {
      if (observation.discovery.retrievalCutoff !== report.retrievalCutoff) {
        ctx.addIssue({
          code: "custom",
          message: "case cutoff must match report cutoff",
          path: ["cases", index, "discovery", "retrievalCutoff"],
        });
      }
    });
  });
export type EvalReport = z.infer<typeof EvalReportSchema>;

function isDeepEqualStringArray(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
