import type {
  CompositionPlan,
  DynamicActionDecision,
  JsonObject,
} from "@agent-web/contracts";
import { slugify } from "../utils.js";
import type { GeneratedUiDraft, ModelRuntime, WorldDraft } from "./types.js";

/** Deterministic, no-cost fixture used only for tests and reproducible local replay. */
export class MockModelRuntime implements ModelRuntime {
  async createWorld(
    input: Parameters<ModelRuntime["createWorld"]>[0],
  ): Promise<WorldDraft> {
    const name =
      input.preferredName ??
      firstSentence(input.providerMessage).slice(0, 80) ??
      "Provider Agent";
    return {
      name,
      slug: slugify(name),
      summary: firstSentence(input.providerMessage),
      knowledge: {
        providerDescription: input.providerMessage,
        capabilities: [
          "Interpret open-ended requests using the provider description",
        ],
      },
      instructions:
        "Treat the provider description and recorded decisions as the authoritative prototype world.",
      searchableText: `${name} ${input.providerMessage}`,
    };
  }

  async reviseWorld(
    input: Parameters<ModelRuntime["reviseWorld"]>[0],
  ): Promise<WorldDraft> {
    return {
      name: input.world.name,
      slug: input.world.slug,
      summary: input.world.summary,
      knowledge: {
        ...input.world.knowledge,
        latestProviderMessage: input.providerMessage,
      },
      instructions: `${input.world.instructions}\nProvider revision: ${input.providerMessage}`,
      searchableText: `${input.world.searchableText} ${input.providerMessage}`,
    };
  }

  async decideAction(
    input: Parameters<ModelRuntime["decideAction"]>[0],
  ): Promise<DynamicActionDecision> {
    const statePatch: JsonObject = {
      lastDecision: {
        action: input.action,
        arguments: input.arguments,
        consumerIntent: input.consumerIntent,
      },
    };
    return {
      decision: `The provider agent interpreted “${input.action}” and accepted it in deterministic replay mode.`,
      result: {
        accepted: true,
        action: input.action,
        received: input.arguments,
      },
      statePatch,
      publicSummary: `Replay decision recorded for ${input.action}.`,
      status: "ok",
      display: {
        kind: "confirmation",
        title: `Done: ${input.action}`,
        fields: [{ label: "action", value: input.action }],
      },
      nextView: `<!doctype html><html><head><meta charset="utf-8"><title>Confirmed</title></head><body><main><h1>Confirmed</h1><p id="s">Replay confirmation for ${escapeHtml(
        input.action,
      )}.</p></main></body></html>`,
    };
  }

  async generateUi(
    input: Parameters<ModelRuntime["generateUi"]>[0],
  ): Promise<GeneratedUiDraft> {
    const world = input.worlds[0];
    if (!world) throw new Error("At least one provider world is required.");
    const title = `Generated experience for ${input.intent}`;
    const safeTitle = escapeHtml(title);
    const safeProvider = escapeHtml(world.name);
    return {
      title,
      rationale:
        "Deterministic fixture for tests and offline replay; live mode asks the configured model for fresh code.",
      html: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${safeTitle}</title><style>body{font-family:system-ui;margin:0;padding:2rem;background:#f4f0e8;color:#18201b}main{max-width:680px;margin:auto;background:white;border:1px solid #d7d1c5;border-radius:20px;padding:2rem}button{background:#145c43;color:white;border:0;border-radius:999px;padding:.8rem 1.2rem;font-weight:700}pre{white-space:pre-wrap;background:#edf4ef;padding:1rem;border-radius:12px}</style></head><body><main><p>GENERATED REPLAY</p><h1>${safeTitle}</h1><p>Provider: ${safeProvider}</p><button id="act">Ask the provider agent to decide</button><pre id="result">No decision yet.</pre></main><script>document.getElementById('act').onclick=async()=>{const out=document.getElementById('result');out.textContent='Deciding…';try{const value=await window.agent.invoke({worldId:'${world.id}',action:'interpret the current user intent and propose the next useful outcome',arguments:{intent:${JSON.stringify(input.intent)}}});out.textContent=JSON.stringify(value.decision,null,2)}catch(error){out.textContent=String(error)}};</script></body></html>`,
    };
  }

  async repairUi(
    input: Parameters<ModelRuntime["repairUi"]>[0],
  ): Promise<GeneratedUiDraft> {
    const base = await this.generateUi({
      sessionId: input.sessionId,
      intent: input.intent,
      worlds: input.worlds,
    });
    return {
      ...base,
      title: `${base.title} (repaired)`,
      rationale: `Deterministic repaired fixture after error: ${input.error.slice(0, 200)}`,
    };
  }

  async planComposition(
    input: Parameters<ModelRuntime["planComposition"]>[0],
  ): Promise<CompositionPlan> {
    return {
      summary: `Deterministic plan coordinating ${input.worlds.length} provider world(s) for: ${input.intent}`,
      steps: input.worlds.map((world, index) => ({
        worldId: world.id,
        worldName: world.name,
        role: `Contribute step ${index + 1} toward the intent`,
        suggestedAction:
          "interpret the user intent and propose the next useful outcome",
        dependsOn: index === 0 ? [] : [index - 1],
      })),
    };
  }

  async generateCompositionUi(
    input: Parameters<ModelRuntime["generateCompositionUi"]>[0],
  ): Promise<GeneratedUiDraft> {
    const base = await this.generateUi({
      sessionId: input.sessionId,
      intent: input.intent,
      worlds: input.worlds,
    });
    return {
      ...base,
      title: `Composed: ${base.title}`,
      rationale: `Deterministic composition fixture across ${input.worlds.length} worlds. ${input.plan.summary}`,
    };
  }
}

function firstSentence(value: string): string {
  return value.trim().split(/(?<=[.!?])\s+/)[0] ?? value.trim();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}
