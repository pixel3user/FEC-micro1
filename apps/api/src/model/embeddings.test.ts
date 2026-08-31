import { describe, expect, it } from "vitest";
import { cosineSimilarity, HashingEmbedder } from "./embeddings.js";

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors and 0 for orthogonal ones", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns 0 when either vector is zero", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("HashingEmbedder", () => {
  const embedder = new HashingEmbedder(128);

  it("is deterministic for the same text", async () => {
    const a = await embedder.embed("bike repair for commuters");
    const b = await embedder.embed("bike repair for commuters");
    expect(a).toEqual(b);
  });

  it("ranks a token-overlapping query above a disjoint one", async () => {
    // The deterministic hashing embedder is a bag-of-tokens stand-in for tests:
    // it captures lexical overlap, not deep semantics (that is what the live
    // OpenRouter embedding model provides). Assert only what it can guarantee.
    const provider = await embedder.embed(
      "commuter bicycle repair parts service",
    );
    const overlapping = await embedder.embed("commuter bicycle repair");
    const disjoint = await embedder.embed("saxophone piano lesson");
    expect(cosineSimilarity(provider, overlapping)).toBeGreaterThan(
      cosineSimilarity(provider, disjoint),
    );
  });
});
