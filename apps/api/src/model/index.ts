import type { AppConfig } from "../config.js";
import { MockModelRuntime } from "./mock.js";
import { OpenRouterRuntime } from "./openrouter.js";
import type { ModelRuntime } from "./types.js";

export function createModelRuntime(config: AppConfig): ModelRuntime {
  return config.modelMode === "mock"
    ? new MockModelRuntime()
    : new OpenRouterRuntime(config);
}

export type { ModelRuntime } from "./types.js";
