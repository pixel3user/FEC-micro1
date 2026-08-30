import type { AppConfig } from "../config.js";
import { recordUsage } from "./usage.js";

/**
 * Embedding provider abstraction. The live implementation calls the OpenRouter
 * /embeddings endpoint; a deterministic hashing embedder is used for tests and
 * offline replay so the default suite spends nothing and stays reproducible.
 */
export interface Embedder {
  embed(text: string): Promise<number[]>;
  readonly available: boolean;
}

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  error?: { message?: string };
};

export class OpenRouterEmbedder implements Embedder {
  readonly available: boolean;

  constructor(private readonly config: AppConfig) {
    this.available = config.semanticSearch && Boolean(config.openRouterApiKey);
  }

  async embed(text: string): Promise<number[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(
        `${this.config.openRouterBaseUrl}/embeddings`,
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
            model: this.config.openRouterEmbeddingModel,
            input: [text.slice(0, 8_000)],
          }),
        },
      );
      const payload = (await response
        .json()
        .catch(() => ({}))) as EmbeddingResponse;
      if (!response.ok) {
        throw new Error(
          payload.error?.message ??
            `Embedding call failed with HTTP ${response.status}.`,
        );
      }
      const vector = payload.data?.[0]?.embedding;
      if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error("Embedding response contained no vector.");
      }
      if (payload.usage) {
        recordUsage({
          purpose: "embedding",
          model: this.config.openRouterEmbeddingModel,
          cost: payload.usage.cost ?? 0,
          usage: payload.usage,
        });
      }
      return vector;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Deterministic bag-of-tokens hashing embedder — no network, stable output. */
export class HashingEmbedder implements Embedder {
  readonly available = true;
  private readonly dimensions: number;

  constructor(dimensions = 256) {
    this.dimensions = dimensions;
  }

  async embed(text: string): Promise<number[]> {
    const vector = new Array<number>(this.dimensions).fill(0);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const token of tokens) {
      let hash = 2166136261;
      for (let index = 0; index < token.length; index += 1) {
        hash ^= token.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      const bucket = Math.abs(hash) % this.dimensions;
      vector[bucket] = (vector[bucket] ?? 0) + 1;
    }
    return vector;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < length; index += 1) {
    const x = a[index] ?? 0;
    const y = b[index] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
