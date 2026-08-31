import { describe, expect, it } from "vitest";
import { computeEvaluationMetrics, metricEvidence } from "./metrics.js";
import { EvaluationCaseObservationSchema } from "./report-schema.js";

const firstWorldId = "00000000-0000-4000-8000-000000000001";
const secondWorldId = "00000000-0000-4000-8000-000000000002";
const eventId = "00000000-0000-4000-8000-000000000003";

function observation(input: {
  caseId: string;
  mode?: "single" | "compose";
  baselineTopHit?: boolean;
  agentTopHit?: boolean;
  generatedCoverage?: boolean;
  planCoverage?: boolean | null;
  htmlPassed?: boolean;
  invocationStatus?: "ok" | "needs_input" | "declined" | "error";
  persisted?: boolean;
  idempotent?: boolean;
}) {
  const mode = input.mode ?? "single";
  const persisted = input.persisted ?? true;
  const idempotent = input.idempotent ?? true;
  const htmlPassed = input.htmlPassed ?? true;
  const relevantProviderIds =
    mode === "compose"
      ? ["alpha-provider", "beta-provider"]
      : ["alpha-provider"];
  const ranked = (include: boolean) =>
    include
      ? relevantProviderIds.map((fixtureProviderId, index) => ({
          rank: index + 1,
          fixtureProviderId,
          worldId: index === 0 ? firstWorldId : secondWorldId,
          score: 1 - index / 10,
        }))
      : [];
  const generatedCoverage = input.generatedCoverage ?? true;
  const planCoverage = input.planCoverage ?? false;
  const coveredProviders = [
    { fixtureProviderId: "alpha-provider", worldId: firstWorldId },
    ...(mode === "compose" && generatedCoverage
      ? [{ fixtureProviderId: "beta-provider", worldId: secondWorldId }]
      : []),
  ];
  const planProviders = [
    { fixtureProviderId: "alpha-provider", worldId: firstWorldId },
    ...(mode === "compose" && planCoverage
      ? [{ fixtureProviderId: "beta-provider", worldId: secondWorldId }]
      : []),
  ];
  return EvaluationCaseObservationSchema.parse({
    caseId: input.caseId,
    mode,
    intent: "perform a useful task",
    relevantProviderIds,
    discovery: {
      retrievalCutoff: 5,
      baseline: {
        rankedProviders: ranked(input.baselineTopHit ?? false),
        topHit: input.baselineTopHit ?? false,
        relevantProviderCoverage: input.baselineTopHit ?? false,
      },
      agent: {
        rankedProviders: ranked(input.agentTopHit ?? true),
        topHit: input.agentTopHit ?? true,
        relevantProviderCoverage: input.agentTopHit ?? true,
      },
    },
    generation: {
      kind: mode,
      statusCode: 201,
      providers: coveredProviders,
      relevantProviderCoverage: generatedCoverage,
      planProviders: mode === "compose" ? planProviders : null,
      planRelevantProviderCoverage: mode === "compose" ? planCoverage : null,
      html: {
        hasDoctype: htmlPassed,
        hasHtmlElement: htmlPassed,
        hasHeadElement: htmlPassed,
        hasTitleElement: htmlPassed,
        hasBodyElement: htmlPassed,
        hasMainElement: htmlPassed,
        tagsBalanced: htmlPassed,
        hasInvokeBridge: htmlPassed,
        prohibitedTagCount: 0,
        externalScriptCount: 0,
        inlineEventHandlerCount: 0,
        javascriptUrlCount: 0,
        requiredMarkers: [],
        structurallyValid: htmlPassed,
        safe: true,
        passed: htmlPassed,
      },
    },
    invocation: {
      providerId: "alpha-provider",
      action: "perform the task",
      arguments: {},
      idempotencyKey: `eval-key-${input.caseId}`,
      statusCode: 200,
      retryStatusCode: 200,
      decisionStatus: input.invocationStatus ?? "ok",
      providerInGeneratedExperience: true,
      eventId,
      worldRevision: 2,
      retryReturnedSameResponse: idempotent,
      persistence: {
        statePatchPersisted: persisted,
        revisionPersisted: persisted,
        eventPersisted: persisted,
        eventPayloadPersisted: persisted,
        matchingDecisionEventCount: persisted ? 1 : 0,
        retryDidNotAddEvent: idempotent,
        retryDidNotAdvanceRevision: idempotent,
      },
    },
  });
}

describe("evaluation metrics", () => {
  it("keeps numerator, denominator, and per-case outcomes", () => {
    expect(
      metricEvidence([
        { caseId: "first-case", passed: true },
        { caseId: "second-case", passed: false },
      ]),
    ).toEqual({
      numerator: 1,
      denominator: 2,
      rate: 0.5,
      caseOutcomes: [
        { caseId: "first-case", passed: true },
        { caseId: "second-case", passed: false },
      ],
    });
  });

  it("uses a null rate for a metric with no applicable cases", () => {
    expect(metricEvidence([])).toEqual({
      numerator: 0,
      denominator: 0,
      rate: null,
      caseOutcomes: [],
    });
  });

  it("compares only retrieval metrics and labels executable capabilities agent-only", () => {
    const metrics = computeEvaluationMetrics(
      [
        observation({
          caseId: "single-case",
          baselineTopHit: false,
          agentTopHit: true,
        }),
        observation({
          caseId: "compose-case",
          mode: "compose",
          baselineTopHit: true,
          agentTopHit: false,
          generatedCoverage: false,
          planCoverage: false,
          htmlPassed: false,
          invocationStatus: "declined",
          persisted: false,
          idempotent: false,
        }),
      ],
      5,
    );

    expect(metrics.comparable.discoveryTopHit.baseline).toMatchObject({
      numerator: 1,
      denominator: 2,
    });
    expect(metrics.comparable.discoveryTopHit.agent).toMatchObject({
      numerator: 1,
      denominator: 2,
    });
    expect(metrics.agentOnly.composePlanProviderCoverage).toMatchObject({
      numerator: 0,
      denominator: 1,
    });
    expect(metrics.agentOnly.htmlStructureAndSafety).toMatchObject({
      numerator: 1,
      denominator: 2,
    });
    expect(metrics).not.toHaveProperty("baseline.taskSpecificUiRate");
  });
});
