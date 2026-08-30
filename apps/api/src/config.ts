import { z } from "zod";

const EnvironmentSchema = z.object({
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
  MAX_MODEL_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .min(256)
    .max(16_000)
    .default(3_500),
  MODEL_MODE: z.enum(["live", "mock"]).default("live"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_MODEL: z.string().default("deepseek/deepseek-v4-flash-0731"),
  OPENROUTER_FALLBACK_MODELS: z.string().default("openai/gpt-4o-mini"),
  OPENROUTER_EMBEDDING_MODEL: z
    .string()
    .default("openai/text-embedding-3-small"),
  SEMANTIC_SEARCH: z.enum(["on", "off"]).default("on"),
  PUBLIC_API_URL: z.url().default("http://localhost:8787"),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
});

export type AppConfig = {
  apiHost: string;
  apiPort: number;
  databaseUrl?: string;
  logLevel: string;
  maxModelOutputTokens: number;
  modelMode: "live" | "mock";
  openRouterApiKey?: string;
  openRouterBaseUrl: string;
  openRouterModel: string;
  openRouterFallbackModels: string[];
  openRouterEmbeddingModel: string;
  semanticSearch: boolean;
  publicApiUrl: string;
  webOrigins: string[];
};

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const parsed = EnvironmentSchema.parse(environment);
  return {
    apiHost: parsed.API_HOST,
    apiPort: parsed.API_PORT,
    ...(parsed.DATABASE_URL ? { databaseUrl: parsed.DATABASE_URL } : {}),
    logLevel: parsed.LOG_LEVEL,
    maxModelOutputTokens: parsed.MAX_MODEL_OUTPUT_TOKENS,
    modelMode: parsed.MODEL_MODE,
    ...(parsed.OPENROUTER_API_KEY
      ? { openRouterApiKey: parsed.OPENROUTER_API_KEY }
      : {}),
    openRouterBaseUrl: parsed.OPENROUTER_BASE_URL.replace(/\/$/, ""),
    openRouterModel: parsed.OPENROUTER_MODEL,
    openRouterFallbackModels: parsed.OPENROUTER_FALLBACK_MODELS.split(",")
      .map((model) => model.trim())
      .filter((model) => model.length > 0),
    openRouterEmbeddingModel: parsed.OPENROUTER_EMBEDDING_MODEL,
    semanticSearch: parsed.SEMANTIC_SEARCH === "on",
    publicApiUrl: parsed.PUBLIC_API_URL.replace(/\/$/, ""),
    webOrigins: parsed.WEB_ORIGIN.split(",").map((origin) => origin.trim()),
  };
}
