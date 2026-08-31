import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  EVALUATION_FIXTURE_FILES,
  loadEvaluationFixtures,
} from "./load-fixtures.js";

const validProviders = {
  version: 1,
  providers: [
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
  ],
};

const validDevelopment = {
  version: 1,
  split: "development",
  cases: [
    {
      id: "development-case",
      mode: "single",
      intent: "book a planning appointment",
      relevantProviderIds: ["alpha-provider"],
      invocation: {
        providerId: "alpha-provider",
        action: "book the planning appointment",
        arguments: { day: "Tuesday" },
      },
    },
  ],
};

const validHeldOut = {
  version: 1,
  split: "held-out",
  cases: [
    {
      id: "held-out-case",
      mode: "compose",
      intent: "plan an event with food",
      relevantProviderIds: ["alpha-provider", "beta-provider"],
      invocation: {
        providerId: "beta-provider",
        action: "prepare the catering proposal",
        arguments: { guests: 20 },
      },
    },
  ],
};

describe("loadEvaluationFixtures", () => {
  let fixtureDirectory: string;

  beforeEach(async () => {
    fixtureDirectory = await mkdtemp(join(tmpdir(), "agent-web-eval-"));
  });

  afterEach(async () => {
    await rm(fixtureDirectory, { recursive: true, force: true });
  });

  it("loads and keeps the checked-in development and held-out sets separate", async () => {
    const fixtures = await loadEvaluationFixtures();

    expect(fixtures.version).toBe(1);
    expect(fixtures.providers.length).toBeGreaterThan(1);
    expect(fixtures.development).toHaveLength(3);
    expect(fixtures.heldOut).toHaveLength(3);
    expect(fixtures.development.every(({ id }) => id.startsWith("dev-"))).toBe(
      true,
    );
    expect(fixtures.heldOut.every(({ id }) => id.startsWith("held-out-"))).toBe(
      true,
    );
    expect(fixtures.development.some(({ mode }) => mode === "compose")).toBe(
      true,
    );
    expect(fixtures.heldOut.some(({ mode }) => mode === "compose")).toBe(true);
  });

  it("loads a valid fixture set from an explicit directory", async () => {
    await writeValidFixtureSet(fixtureDirectory);

    const fixtures = await loadEvaluationFixtures(fixtureDirectory);

    expect(fixtures.providers.map(({ id }) => id)).toEqual([
      "alpha-provider",
      "beta-provider",
    ]);
    expect(fixtures.development[0]?.id).toBe("development-case");
    expect(fixtures.heldOut[0]?.id).toBe("held-out-case");
  });

  it("reports the filename for malformed JSON and per-file schema failures", async () => {
    await writeValidFixtureSet(fixtureDirectory);
    await writeFile(
      join(fixtureDirectory, EVALUATION_FIXTURE_FILES.development),
      "{",
      "utf8",
    );

    await expect(loadEvaluationFixtures(fixtureDirectory)).rejects.toThrow(
      "development.v1.json",
    );

    await writeValidFixtureSet(fixtureDirectory, {
      heldOut: { ...validHeldOut, split: "development" },
    });

    await expect(loadEvaluationFixtures(fixtureDirectory)).rejects.toThrow(
      "held-out.v1.json",
    );
  });

  it("rejects cross-file unknown provider references", async () => {
    const heldOutWithUnknownProvider = {
      ...validHeldOut,
      cases: [
        {
          ...validHeldOut.cases[0],
          relevantProviderIds: ["alpha-provider", "missing-provider"],
        },
      ],
    };
    await writeValidFixtureSet(fixtureDirectory, {
      heldOut: heldOutWithUnknownProvider,
    });

    await expect(loadEvaluationFixtures(fixtureDirectory)).rejects.toThrow(
      "unknown provider id 'missing-provider'",
    );
  });
});

async function writeValidFixtureSet(
  directory: string,
  overrides: {
    providers?: unknown;
    development?: unknown;
    heldOut?: unknown;
  } = {},
): Promise<void> {
  await Promise.all([
    writeFile(
      join(directory, EVALUATION_FIXTURE_FILES.providers),
      JSON.stringify(overrides.providers ?? validProviders),
      "utf8",
    ),
    writeFile(
      join(directory, EVALUATION_FIXTURE_FILES.development),
      JSON.stringify(overrides.development ?? validDevelopment),
      "utf8",
    ),
    writeFile(
      join(directory, EVALUATION_FIXTURE_FILES.heldOut),
      JSON.stringify(overrides.heldOut ?? validHeldOut),
      "utf8",
    ),
  ]);
}
