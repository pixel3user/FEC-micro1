import type { AppConfig } from "../config.js";
import { MemoryStore } from "./memory-store.js";
import { PostgresStore } from "./postgres-store.js";
import type { Store } from "./types.js";

export function createStore(config: AppConfig): Store {
  return config.databaseUrl
    ? new PostgresStore(config.databaseUrl)
    : new MemoryStore();
}

export type { Store } from "./types.js";
