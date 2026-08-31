import { describe, expect, it } from "vitest";
import {
  ComposeEvaluationCaseSchema,
  DevelopmentFixtureFileSchema,
  EvaluationFixturesSchema,
  ProvidersFixtureFileSchema,
  SingleEvaluationCaseSchema,
} from "./schemas.js";

const providers = [
  {
    id: "alpha-provider",
    name: "Alpha Provider",
    message: "Alpha provides planning and booking services for local events.",
  },
  {
    id: "beta-provider",
    name: "Beta Provider",
    message: "Beta provides catering and delivery services for local events.",
  },
];

const singleCase = {
  id: "single-case",
  mode: "single" as const,
  intent: "book a planning appointment",
  relevantProviderIds: ["alpha-provider"],
  invocation: {
    providerId: "alpha-provider",
    action: "book the planning appointment",
    arguments: { day: "Tuesday" },
  },
  expectedHtmlMarkers: ["<!doctype html>", "window.agent.invoke"],
};

const composeCase = {
  id: "compose-case",
  mode: "compose" as const,
  intent: "plan an event with food",
  relevantProviderIds: ["alpha-provider", "beta-provider"],
  invocation: {
    providerId: "beta-provider",
    action: "prepare the catering proposal",
    arguments: { guests: 20 },
  },
};

describe("evaluation fixture schemas", () => {
  it("accepts a strict, versioned fixture set with separate splits", () => {
    const result = EvaluationFixturesSchema.parse({
      version: 1,
      providers,
      development: [singleCase],
      heldOut: [composeCase],
    });

    expect(result.version).toBe(1);
    expect(result.development[0]?.mode).toBe("single");
    expect(result.heldOut[0]?.mode).toBe("compose");
    expect(result.development[0]?.invocation.arguments).toEqual({
      day: "Tuesday",
    });
  });

  it("rejects unknown versions and unknown fields", () => {
    expect(() =>
      ProvidersFixtureFileSchema.parse({
        version: 2,
        providers,
      }),
    ).toThrow();

    expect(() =>
      DevelopmentFixtureFileSchema.parse({
        version: 1,
        split: "development",
        cases: [{ ...singleCase, undocumentedMetric: true }],
      }),
    ).toThrow(/Unrecognized key/);

    expect(() =>
      ProvidersFixtureFileSchema.parse({
        version: 1,
        providers: [{ ...providers[0], legacyId: "alpha" }],
      }),
    ).toThrow(/Unrecognized key/);
  });

  it("enforces single and compose provider cardinality", () => {
    expect(() =>
      SingleEvaluationCaseSchema.parse({
        ...singleCase,
        relevantProviderIds: ["alpha-provider", "beta-provider"],
      }),
    ).toThrow();

    expect(() =>
      ComposeEvaluationCaseSchema.parse({
        ...composeCase,
        relevantProviderIds: ["alpha-provider"],
      }),
    ).toThrow();
  });

  it("rejects duplicate stable IDs across providers, splits, and references", () => {
    expect(() =>
      ProvidersFixtureFileSchema.parse({
        version: 1,
        providers: [providers[0], providers[0]],
      }),
    ).toThrow(/duplicate id 'alpha-provider'/);

    expect(() =>
      EvaluationFixturesSchema.parse({
        version: 1,
        providers,
        development: [singleCase],
        heldOut: [{ ...composeCase, id: singleCase.id }],
      }),
    ).toThrow(/duplicate case id 'single-case'/);

    expect(() =>
      ComposeEvaluationCaseSchema.parse({
        ...composeCase,
        relevantProviderIds: ["alpha-provider", "alpha-provider"],
      }),
    ).toThrow(/duplicate value 'alpha-provider'/);
  });

  it("rejects unknown and non-relevant invocation provider references", () => {
    expect(() =>
      EvaluationFixturesSchema.parse({
        version: 1,
        providers,
        development: [
          {
            ...singleCase,
            relevantProviderIds: ["missing-provider"],
            invocation: {
              ...singleCase.invocation,
              providerId: "missing-provider",
            },
          },
        ],
        heldOut: [composeCase],
      }),
    ).toThrow(/unknown provider id 'missing-provider'/);

    expect(() =>
      EvaluationFixturesSchema.parse({
        version: 1,
        providers,
        development: [
          {
            ...singleCase,
            invocation: {
              ...singleCase.invocation,
              providerId: "beta-provider",
            },
          },
        ],
        heldOut: [composeCase],
      }),
    ).toThrow(/invocation provider must be relevant/);
  });
});
