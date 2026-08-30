import { createHash, randomBytes } from "node:crypto";
import type { JsonObject, JsonValue } from "@agent-web/contracts";

export function createOwnerToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || `agent-${randomBytes(4).toString("hex")}`;
}

export function mergeJsonObjects(
  current: JsonObject,
  patch: JsonObject,
): JsonObject {
  const result: JsonObject = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    const previous = result[key];
    if (isJsonObject(previous) && isJsonObject(value)) {
      result[key] = mergeJsonObjects(previous, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function capabilitiesFromKnowledge(knowledge: JsonObject): string[] {
  const candidate = knowledge.capabilities;
  if (!Array.isArray(candidate)) return [];
  return candidate
    .filter((value): value is string => typeof value === "string")
    .slice(0, 50);
}
