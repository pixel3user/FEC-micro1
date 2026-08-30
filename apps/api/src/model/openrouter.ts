import {
  DynamicActionDecisionSchema,
  JsonObjectSchema,
  type DynamicActionDecision,
} from "@agent-web/contracts";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import { ModelError } from "../errors.js";
import { slugify } from "../utils.js";
import { extractJsonObject } from "./json-extract.js";
import { recordUsage } from "./usage.js";
import type { GeneratedUiDraft, ModelRuntime, WorldDraft } from "./types.js";

const WorldDraftSchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(80),
  summary: z.string().min(1).max(2_000),
  knowledge: JsonObjectSchema,
  instructions: z.string().min(1).max(50_000),
  searchableText: z.string().min(1).max(50_000),
});

const GeneratedUiDraftSchema = z.object({
  title: z.string().min(1).max(300),
  html: z.string().min(100).max(500_000),
  rationale: z.string().min(1).max(4_000),
});

type OpenRouterResponse = {
  choices?: Array<{
    message?: { content?: string | Array<{ type?: string; text?: string }> };
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  error?: { message?: string };
};

const SYSTEM_PROMPT =
  "You output exactly one strict JSON object. No markdown fences, no prose, no reasoning text, no <think> segments before or after the object. The response must start with { and end with }.";

export class OpenRouterRuntime implements ModelRuntime {
  private readonly models: string[];

  constructor(private readonly config: AppConfig) {
    this.models = [
      config.openRouterModel,
      ...config.openRouterFallbackModels,
    ].filter(
      (model, index, all) => model.length > 0 && all.indexOf(model) === index,
    );
  }

  async createWorld(input: {
    providerMessage: string;
    preferredName?: string;
    domain?: string;
  }): Promise<WorldDraft> {
    const draft = await this.callJson(
      "world-intake",
      WorldDraftSchema,
      `You create persistent provider worlds for an agent-native internet. A provider describes anything they offer or represent. Infer a flexible world; do not force commerce, booking, or any fixed action ontology. Preserve important constraints as data and behavioral instructions. Put any provider-described possible abilities in knowledge.capabilities as plain-language strings, but never claim the list is exhaustive. searchableText should richly describe who might discover this provider. Return only JSON with keys name, slug, summary, knowledge, instructions, searchableText.\n\nProvider message:\n${input.providerMessage}\n\nPreferred name: ${input.preferredName ?? "not supplied"}\nDomain: ${input.domain ?? "not supplied"}`,
      1_800,
    );
    return { ...draft, slug: slugify(draft.slug) };
  }

  async reviseWorld(
    input: Parameters<ModelRuntime["reviseWorld"]>[0],
  ): Promise<WorldDraft> {
    const draft = await this.callJson(
      "world-revision",
      WorldDraftSchema,
      `Revise an existing provider world from a new provider message. The provider controls their world. Keep still-valid facts, incorporate corrections, and leave the action space open-ended. Do not introduce a predefined workflow or verb set. Return a complete replacement JSON object with keys name, slug, summary, knowledge, instructions, searchableText.\n\nCurrent world:\n${JSON.stringify(input.world)}\n\nRecent events:\n${JSON.stringify(input.events)}\n\nNew provider message:\n${input.providerMessage}`,
      2_000,
    );
    return { ...draft, slug: slugify(draft.slug) };
  }

  async decideAction(
    input: Parameters<ModelRuntime["decideAction"]>[0],
  ): Promise<DynamicActionDecision> {
    return this.callJson(
      "provider-decision",
      DynamicActionDecisionSchema,
      `You are the authoritative reasoning process for this prototype provider world. Interpret the consumer's arbitrary action without relying on a predefined action catalog. Decide what happens using the world's knowledge, instructions, current state, consumer intent, and event history. Your decision becomes this prototype's ground truth. Do not pretend an external real-world effect happened; describe the provider-world result. Return JSON with: decision (reasoning/conclusion for the user), result (any JSON value useful to the generated UI), statePatch (an object merged into persistent world state), and publicSummary.\n\nProvider world:\n${JSON.stringify(input.world)}\n\nRecent events:\n${JSON.stringify(input.events)}\n\nConsumer intent:\n${input.consumerIntent}\n\nArbitrary action name:\n${input.action}\n\nArbitrary arguments:\n${JSON.stringify(input.arguments)}`,
      1_500,
    );
  }

  async generateUi(
    input: Parameters<ModelRuntime["generateUi"]>[0],
  ): Promise<GeneratedUiDraft> {
    return this.callJson(
      "runtime-ui",
      GeneratedUiDraftSchema,
      buildUiPrompt(input),
      this.config.maxModelOutputTokens,
      { maxAttemptsPerModel: 1, timeoutMs: 75_000 },
    );
  }

  private async callJson<T>(
    purpose: string,
    schema: z.ZodType<T>,
    userPrompt: string,
    tokenLimit: number,
    options: { maxAttemptsPerModel?: number; timeoutMs?: number } = {},
  ): Promise<T> {
    if (!this.config.openRouterApiKey) {
      throw new ModelError(
        "OPENROUTER_API_KEY is missing. Use MODEL_MODE=mock for the local replay or add a fresh key to .env.",
      );
    }

    const maxAttempts = options.maxAttemptsPerModel ?? 2;
    const timeoutMs = options.timeoutMs ?? 45_000;
    const errors: string[] = [];
    for (const model of this.models) {
      let correction = "";
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const { content } = await this.request(
            model,
            userPrompt + correction,
            tokenLimit,
            purpose,
            timeoutMs,
          );
          return schema.parse(extractJsonObject(content));
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          errors.push(`${model} attempt ${attempt + 1}: ${detail}`);
          if (isHardModelFailure(error)) break; // move to the next model
          correction = `\n\nYour previous output was invalid: ${detail}\nReturn the entire corrected JSON object only.`;
        }
      }
    }
    throw new ModelError(
      `${purpose} failed for all models. ${errors.join(" | ")}`,
    );
  }

  private async request(
    model: string,
    prompt: string,
    tokenLimit: number,
    purpose: string,
    timeoutMs: number,
  ): Promise<{ content: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(
        `${this.config.openRouterBaseUrl}/chat/completions`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${this.config.openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": this.config.publicApiUrl,
            "X-Title": "Agent Native Web Prototype",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.15,
            max_tokens: Math.min(tokenLimit, this.config.maxModelOutputTokens),
            usage: { include: true },
          }),
        },
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ModelError(`Model call timed out after ${timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    const payload = (await response
      .json()
      .catch(() => ({}))) as OpenRouterResponse;
    if (!response.ok) {
      const message =
        payload.error?.message ??
        `OpenRouter returned HTTP ${response.status}.`;
      const error = new ModelError(message) as ModelError & { hard?: boolean };
      error.hard =
        response.status === 404 ||
        response.status === 401 ||
        response.status === 403;
      throw error;
    }

    const content = extractContent(payload);
    if (payload.usage) {
      recordUsage({
        purpose,
        model,
        cost: payload.usage.cost ?? 0,
        usage: payload.usage,
      });
    }
    return { content };
  }
}

function buildUiPrompt(
  input: Parameters<ModelRuntime["generateUi"]>[0],
): string {
  return `Write a completely new, polished, standalone HTML document for this specific user intent. Generate the interface from scratch now; do not select or describe a template. Include all CSS and JavaScript inline and use no external libraries, network calls, forms that navigate, or parent-window access. Make it responsive and genuinely useful.

The sandbox provides exactly one effect API:
window.agent.invoke({ worldId: string, action: string, arguments: object }) -> Promise<{ eventId, worldRevision, decision: { decision, result, statePatch, publicSummary } }>

You choose every action name and argument structure at runtime based on the intent. There is no predefined action vocabulary. Use the listed provider world IDs exactly. Handle loading, success, and error states inside the generated page. Render untrusted returned text with textContent, never innerHTML. Wrap event handlers in try/catch and show a visible error message on failure. Keep the document focused and under about 160 lines so it returns quickly and completely. Return only JSON with title, html, rationale. The html must be a full document beginning with <!doctype html>.

Session: ${input.sessionId}
User intent: ${input.intent}
Available provider worlds:
${JSON.stringify(input.worlds)}`;
}

function extractContent(payload: OpenRouterResponse): string {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content.map((part) => part.text ?? "").join("");
  throw new ModelError("OpenRouter returned no message content.");
}

function isHardModelFailure(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "hard" in error &&
    (error as { hard?: boolean }).hard === true
  );
}
