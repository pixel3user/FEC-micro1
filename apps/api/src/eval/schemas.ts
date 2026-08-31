import {
  CreateWorldRequestSchema,
  DynamicActionRequestSchema,
  ExperienceRequestSchema,
  JsonObjectSchema,
} from "@agent-web/contracts";
import { z } from "zod";

export const EVALUATION_FIXTURE_VERSION = 1 as const;

export const FixtureVersionSchema = z.literal(EVALUATION_FIXTURE_VERSION);
export const FixtureSplitSchema = z.enum(["development", "held-out"]);
export const FixtureIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
    "must be a lowercase kebab-case identifier",
  );

const UniqueProviderIdsSchema = z
  .array(FixtureIdSchema)
  .min(1)
  .max(8)
  .superRefine((ids, ctx) => {
    addDuplicateIssues(ids, ctx);
  });

const ExpectedHtmlMarkersSchema = z
  .array(z.string().min(1).max(500))
  .min(1)
  .max(20)
  .superRefine((markers, ctx) => {
    addDuplicateIssues(markers, ctx);
  });

export const EvaluationProviderSchema = z
  .object({
    id: FixtureIdSchema,
    name: CreateWorldRequestSchema.shape.preferredName.unwrap(),
    message: CreateWorldRequestSchema.shape.message,
  })
  .strict();

export const EvaluationInvocationSchema = z
  .object({
    providerId: FixtureIdSchema,
    action: DynamicActionRequestSchema.shape.action,
    arguments: JsonObjectSchema,
  })
  .strict();

const EvaluationCaseFields = {
  id: FixtureIdSchema,
  intent: ExperienceRequestSchema.shape.intent,
  invocation: EvaluationInvocationSchema,
  expectedHtmlMarkers: ExpectedHtmlMarkersSchema.optional(),
};

export const SingleEvaluationCaseSchema = z
  .object({
    ...EvaluationCaseFields,
    mode: z.literal("single"),
    relevantProviderIds: UniqueProviderIdsSchema.length(1),
  })
  .strict();

export const ComposeEvaluationCaseSchema = z
  .object({
    ...EvaluationCaseFields,
    mode: z.literal("compose"),
    relevantProviderIds: UniqueProviderIdsSchema.min(2),
  })
  .strict();

export const EvaluationCaseSchema = z.discriminatedUnion("mode", [
  SingleEvaluationCaseSchema,
  ComposeEvaluationCaseSchema,
]);

export const ProvidersFixtureFileSchema = z
  .object({
    version: FixtureVersionSchema,
    providers: z.array(EvaluationProviderSchema).min(1),
  })
  .strict()
  .superRefine((fixture, ctx) => {
    addUniqueIdIssues(fixture.providers, ["providers"], ctx);
  });

export const DevelopmentFixtureFileSchema = z
  .object({
    version: FixtureVersionSchema,
    split: z.literal("development"),
    cases: z.array(EvaluationCaseSchema).min(1),
  })
  .strict()
  .superRefine((fixture, ctx) => {
    addUniqueIdIssues(fixture.cases, ["cases"], ctx);
  });

export const HeldOutFixtureFileSchema = z
  .object({
    version: FixtureVersionSchema,
    split: z.literal("held-out"),
    cases: z.array(EvaluationCaseSchema).min(1),
  })
  .strict()
  .superRefine((fixture, ctx) => {
    addUniqueIdIssues(fixture.cases, ["cases"], ctx);
  });

export const EvaluationFixturesSchema = z
  .object({
    version: FixtureVersionSchema,
    providers: z.array(EvaluationProviderSchema).min(1),
    development: z.array(EvaluationCaseSchema).min(1),
    heldOut: z.array(EvaluationCaseSchema).min(1),
  })
  .strict()
  .superRefine((fixtures, ctx) => {
    addUniqueIdIssues(fixtures.providers, ["providers"], ctx);

    const providerIds = new Set(fixtures.providers.map(({ id }) => id));
    const caseIds = new Map<string, ["development" | "heldOut", number]>();

    for (const [split, cases] of [
      ["development", fixtures.development],
      ["heldOut", fixtures.heldOut],
    ] as const) {
      cases.forEach((testCase, index) => {
        const existing = caseIds.get(testCase.id);
        if (existing !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `duplicate case id '${testCase.id}' (also at ${existing[0]}[${existing[1]}])`,
            path: [split, index, "id"],
          });
        } else {
          caseIds.set(testCase.id, [split, index]);
        }

        testCase.relevantProviderIds.forEach((providerId, providerIndex) => {
          if (!providerIds.has(providerId)) {
            ctx.addIssue({
              code: "custom",
              message: `unknown provider id '${providerId}'`,
              path: [split, index, "relevantProviderIds", providerIndex],
            });
          }
        });

        if (!providerIds.has(testCase.invocation.providerId)) {
          ctx.addIssue({
            code: "custom",
            message: `unknown provider id '${testCase.invocation.providerId}'`,
            path: [split, index, "invocation", "providerId"],
          });
        } else if (
          !testCase.relevantProviderIds.includes(testCase.invocation.providerId)
        ) {
          ctx.addIssue({
            code: "custom",
            message: "invocation provider must be relevant to the case",
            path: [split, index, "invocation", "providerId"],
          });
        }
      });
    }
  });

export type EvaluationProvider = z.infer<typeof EvaluationProviderSchema>;
export type EvaluationInvocation = z.infer<typeof EvaluationInvocationSchema>;
export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;
export type ProvidersFixtureFile = z.infer<typeof ProvidersFixtureFileSchema>;
export type DevelopmentFixtureFile = z.infer<
  typeof DevelopmentFixtureFileSchema
>;
export type HeldOutFixtureFile = z.infer<typeof HeldOutFixtureFileSchema>;
export type EvaluationFixtures = z.infer<typeof EvaluationFixturesSchema>;

function addDuplicateIssues(
  values: readonly string[],
  ctx: z.RefinementCtx,
): void {
  const firstIndexes = new Map<string, number>();
  values.forEach((value, index) => {
    const firstIndex = firstIndexes.get(value);
    if (firstIndex !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `duplicate value '${value}' (first at index ${firstIndex})`,
        path: [index],
      });
    } else {
      firstIndexes.set(value, index);
    }
  });
}

function addUniqueIdIssues(
  entries: ReadonlyArray<{ id: string }>,
  pathPrefix: readonly (string | number)[],
  ctx: z.RefinementCtx,
): void {
  const firstIndexes = new Map<string, number>();
  entries.forEach(({ id }, index) => {
    const firstIndex = firstIndexes.get(id);
    if (firstIndex !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `duplicate id '${id}' (first at index ${firstIndex})`,
        path: [...pathPrefix, index, "id"],
      });
    } else {
      firstIndexes.set(id, index);
    }
  });
}
