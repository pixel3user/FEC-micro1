import { readFile } from "node:fs/promises";
import { join } from "node:path";
import developmentV1 from "./fixtures/development.v1.json" with { type: "json" };
import heldOutV1 from "./fixtures/held-out.v1.json" with { type: "json" };
import providersV1 from "./fixtures/providers.v1.json" with { type: "json" };
import {
  DevelopmentFixtureFileSchema,
  EVALUATION_FIXTURE_VERSION,
  EvaluationFixturesSchema,
  HeldOutFixtureFileSchema,
  ProvidersFixtureFileSchema,
  type EvaluationFixtures,
} from "./schemas.js";

export const EVALUATION_FIXTURE_FILES = {
  providers: "providers.v1.json",
  development: "development.v1.json",
  heldOut: "held-out.v1.json",
} as const;

type FixtureDirectory = string | URL;

export async function loadEvaluationFixtures(
  fixtureDirectory?: FixtureDirectory,
): Promise<EvaluationFixtures> {
  const [providersInput, developmentInput, heldOutInput] =
    fixtureDirectory === undefined
      ? [providersV1, developmentV1, heldOutV1]
      : await Promise.all([
          readJsonFixture(fixtureDirectory, EVALUATION_FIXTURE_FILES.providers),
          readJsonFixture(
            fixtureDirectory,
            EVALUATION_FIXTURE_FILES.development,
          ),
          readJsonFixture(fixtureDirectory, EVALUATION_FIXTURE_FILES.heldOut),
        ]);

  const providers = parseFixture(
    EVALUATION_FIXTURE_FILES.providers,
    providersInput,
    (input) => ProvidersFixtureFileSchema.parse(input),
  );
  const development = parseFixture(
    EVALUATION_FIXTURE_FILES.development,
    developmentInput,
    (input) => DevelopmentFixtureFileSchema.parse(input),
  );
  const heldOut = parseFixture(
    EVALUATION_FIXTURE_FILES.heldOut,
    heldOutInput,
    (input) => HeldOutFixtureFileSchema.parse(input),
  );

  try {
    return EvaluationFixturesSchema.parse({
      version: EVALUATION_FIXTURE_VERSION,
      providers: providers.providers,
      development: development.cases,
      heldOut: heldOut.cases,
    });
  } catch (error) {
    throw new Error(
      `Evaluation fixture set is invalid: ${errorMessage(error)}`,
      {
        cause: error,
      },
    );
  }
}

async function readJsonFixture(
  directory: FixtureDirectory,
  fileName: string,
): Promise<unknown> {
  try {
    const contents = await readFile(
      fixtureLocation(directory, fileName),
      "utf8",
    );
    return JSON.parse(contents) as unknown;
  } catch (error) {
    throw new Error(
      `Could not read evaluation fixture '${fileName}': ${errorMessage(error)}`,
      { cause: error },
    );
  }
}

function parseFixture<T>(
  fileName: string,
  input: unknown,
  parse: (value: unknown) => T,
): T {
  try {
    return parse(input);
  } catch (error) {
    throw new Error(
      `Evaluation fixture '${fileName}' is invalid: ${errorMessage(error)}`,
      { cause: error },
    );
  }
}

function fixtureLocation(
  directory: FixtureDirectory,
  fileName: string,
): string | URL {
  if (typeof directory === "string") return join(directory, fileName);

  const directoryUrl = directory.href.endsWith("/")
    ? directory
    : new URL(`${directory.href}/`);
  return new URL(fileName, directoryUrl);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
