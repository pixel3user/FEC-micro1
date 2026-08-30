import type {
  DynamicActionDecision,
  GeneratedExperience,
  JsonObject,
  ProviderWorld,
  WorldEvent,
} from "@agent-web/contracts";

export type WorldDraft = {
  name: string;
  slug: string;
  summary: string;
  knowledge: JsonObject;
  instructions: string;
  searchableText: string;
};

export type GeneratedUiDraft = Pick<
  GeneratedExperience,
  "title" | "html" | "rationale"
>;

export interface ModelRuntime {
  createWorld(input: {
    providerMessage: string;
    preferredName?: string;
    domain?: string;
  }): Promise<WorldDraft>;
  reviseWorld(input: {
    world: ProviderWorld;
    events: WorldEvent[];
    providerMessage: string;
  }): Promise<WorldDraft>;
  decideAction(input: {
    world: ProviderWorld;
    events: WorldEvent[];
    consumerIntent: string;
    action: string;
    arguments: JsonObject;
  }): Promise<DynamicActionDecision>;
  generateUi(input: {
    sessionId: string;
    intent: string;
    worlds: ProviderWorld[];
  }): Promise<GeneratedUiDraft>;
  repairUi(input: {
    sessionId: string;
    intent: string;
    worlds: ProviderWorld[];
    previousHtml: string;
    error: string;
    context?: string;
  }): Promise<GeneratedUiDraft>;
}
