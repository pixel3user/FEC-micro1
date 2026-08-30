/**
 * Robust JSON extraction for models that wrap output in reasoning traces,
 * markdown fences, or leading prose. Observed live with reasoning-capable
 * models that emit `<think>…</think>` segments and stray leading characters
 * before the JSON object even when a JSON response format is requested.
 */

const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi;
const DANGLING_THINK = /<\/?think>/gi;
const CODE_FENCE = /```(?:json)?\s*([\s\S]*?)```/i;

export class JsonExtractionError extends Error {}

export function extractJsonObject(raw: string): unknown {
  const cleaned = raw
    .replace(THINK_BLOCK, "")
    .replace(DANGLING_THINK, "")
    .trim();

  const candidates: string[] = [];
  const fenced = cleaned.match(CODE_FENCE);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  candidates.push(cleaned);

  const balanced = extractBalanced(cleaned);
  if (balanced) candidates.push(balanced);

  for (const candidate of candidates) {
    const parsed = tryParse(candidate);
    if (parsed !== undefined) return parsed;
  }

  throw new JsonExtractionError(
    `Could not extract a JSON object from model output (first 200 chars): ${cleaned.slice(0, 200)}`,
  );
}

function tryParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Scans for the first top-level {...} region, tracking string literals and
 * escapes so braces inside strings do not terminate the region early.
 */
function extractBalanced(value: string): string | null {
  const start = value.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return value.slice(start, index + 1);
    }
  }
  return null;
}
