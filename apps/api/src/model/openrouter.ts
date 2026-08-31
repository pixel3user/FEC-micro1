import {
  DynamicActionDecisionSchema,
  JsonObjectSchema,
  type DynamicActionDecision,
} from "@agent-web/contracts";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import { ModelError } from "../errors.js";
import { slugify } from "../utils.js";
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

export class OpenRouterRuntime implements ModelRuntime {
  constructor(private readonly config: AppConfig) {}

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
      `Write a completely new, polished, standalone HTML document for this specific user intent. Generate the interface from scratch now; do not select or describe a template. Include all CSS and JavaScript inline and use no external libraries, network calls, forms that navigate, or parent-window access. Make it responsive and genuinely useful.\n\nThe sandbox provides exactly one effect API:\nwindow.agent.invoke({ worldId: string, action: string, arguments: object }) -> Promise<{ eventId, worldRevision, decision: { decision, result, statePatch, publicSummary } }>\n\nYou choose every action name and argument structure at runtime based on the intent. There is no predefined action vocabulary. Use the listed provider world IDs exactly. Handle loading, success, and error states inside the generated page. Render untrusted returned text with textContent, never innerHTML. Return only JSON with title, html, rationale. The html must be a full document beginning with <!doctype html>.\n\nSession: ${input.sessionId}\nUser intent: ${input.intent}\nAvailable provider worlds:\n${JSON.stringify(input.worlds)}`,
      this.config.maxModelOutputTokens,
    );
  }

  private async callJson<T>(
    purpose: string,
    schema: z.ZodType<T>,
    userPrompt: string,
    tokenLimit: number,
  ): Promise<T> {
    if (!this.config.openRouterApiKey) {
      throw new ModelError(
        "OPENROUTER_API_KEY is missing. Use MODEL_MODE=mock for the local replay or add a fresh key to .env.",
      );
    }

    let correction = "";
    let previous = "";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(
        `${this.config.openRouterBaseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": this.config.publicApiUrl,
            "X-Title": "Agent Native Web Prototype",
          },
          body: JSON.stringify({
            model: this.config.openRouterModel,
            messages: [
              {
                role: "system",
                content:
                  "Follow the requested JSON shape exactly. Return a single JSON object with no markdown fences or prose outside it.",
              },
              { role: "user", content: `${userPrompt}${correction}` },
            ],
            response_format: { type: "json_object" },
            temperature: 0.15,
            max_tokens: Math.min(tokenLimit, this.config.maxModelOutputTokens),
            usage: { include: true },
          }),
        },
      );
      const payload = (await response.json()) as OpenRouterResponse;
      if (!response.ok) {
        throw new ModelError(
          payload.error?.message ??
            `OpenRouter returned HTTP ${response.status}.`,
        );
      }
      const content = extractContent(payload);
      try {
        const parsed = schema.parse(JSON.parse(stripCodeFence(content)));
        if (payload.usage) {
          console.info(
            JSON.stringify({
              purpose,
              model: this.config.openRouterModel,
              usage: payload.usage,
            }),
          );
        }
        return parsed;
      } catch (error) {
        previous = content.slice(0, 20_000);
        correction = `\n\nYour previous output failed JSON validation. Correct it and return the entire object again. Previous output:\n${previous}\nValidation error:\n${String(error)}`;
      }
    }
    throw new ModelError(
      `${purpose} did not return valid JSON after one repair attempt.`,
    );
  }
}

function extractContent(payload: OpenRouterResponse): string {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content.map((part) => part.text ?? "").join("");
  throw new ModelError("OpenRouter returned no message content.");
}

function stripCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}
