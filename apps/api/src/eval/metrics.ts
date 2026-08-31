import {
  EvaluationMetricsSchema,
  MetricEvidenceSchema,
  type EvaluationCaseObservation,
  type MetricEvidence,
} from "./report-schema.js";

export function metricEvidence(
  outcomes: ReadonlyArray<{ caseId: string; passed: boolean }>,
): MetricEvidence {
  const caseOutcomes = outcomes.map(({ caseId, passed }) => ({
    caseId,
    passed,
  }));
  const numerator = caseOutcomes.filter(({ passed }) => passed).length;
  const denominator = caseOutcomes.length;
  return MetricEvidenceSchema.parse({
    numerator,
    denominator,
    rate: denominator === 0 ? null : round(numerator / denominator),
    caseOutcomes,
  });
}

export function computeEvaluationMetrics(
  observations: readonly EvaluationCaseObservation[],
  retrievalCutoff: number,
) {
  const outcomes = (
    select: (observation: EvaluationCaseObservation) => boolean,
    filter: (observation: EvaluationCaseObservation) => boolean = () => true,
  ): MetricEvidence =>
    metricEvidence(
      observations.filter(filter).map((observation) => ({
        caseId: observation.caseId,
        passed: select(observation),
      })),
    );

  return EvaluationMetricsSchema.parse({
    comparable: {
      retrievalCutoff,
      discoveryTopHit: {
        baseline: outcomes(
          (observation) => observation.discovery.baseline.topHit,
        ),
        agent: outcomes((observation) => observation.discovery.agent.topHit),
      },
      discoveryRelevantProviderCoverage: {
        baseline: outcomes(
          (observation) =>
            observation.discovery.baseline.relevantProviderCoverage,
        ),
        agent: outcomes(
          (observation) => observation.discovery.agent.relevantProviderCoverage,
        ),
      },
    },
    agentOnly: {
      generatedProviderCoverage: outcomes(
        (observation) => observation.generation.relevantProviderCoverage,
      ),
      composePlanProviderCoverage: outcomes(
        (observation) =>
          observation.generation.planRelevantProviderCoverage === true,
        (observation) => observation.mode === "compose",
      ),
      htmlStructureAndSafety: outcomes(
        (observation) => observation.generation.html.passed,
      ),
      invocationOk: outcomes(
        (observation) =>
          observation.invocation.providerInGeneratedExperience &&
          observation.invocation.decisionStatus === "ok",
      ),
      statePersisted: outcomes(
        (observation) =>
          observation.invocation.persistence.statePatchPersisted &&
          observation.invocation.persistence.revisionPersisted,
      ),
      eventPersisted: outcomes(
        (observation) =>
          observation.invocation.persistence.eventPersisted &&
          observation.invocation.persistence.eventPayloadPersisted,
      ),
      idempotentRetry: outcomes(
        (observation) =>
          observation.invocation.retryReturnedSameResponse &&
          observation.invocation.persistence.retryDidNotAddEvent &&
          observation.invocation.persistence.retryDidNotAdvanceRevision,
      ),
    },
  });
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
