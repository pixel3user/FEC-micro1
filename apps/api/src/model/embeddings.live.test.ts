import { describe, expect, it } from "vitest";
import { loadConfig } from "../config.js";
import { cosineSimilarity, OpenRouterEmbedder } from "./embeddings.js";

const shouldRun =
  process.env.RUN_LIVE_MODEL_TESTS === "1" &&
  Boolean(process.env.OPENROUTER_API_KEY);
const live = shouldRun ? describe : describe.skip;

live("OpenRouterEmbedder (live)", () => {
  const embedder = new OpenRouterEmbedder(
    loadConfig({ ...process.env, MODEL_MODE: "live", SEMANTIC_SEARCH: "on" }),
  );

  it("ranks a semantically related query above an unrelated one without lexical overlap", async () => {
    const provider = await embedder.embed(
      "A clinic offering eye examinations and prescriptions for glasses.",
    );
    // No shared keywords with the provider text — pure meaning.
    const related = await embedder.embed(
      "my vision is blurry and I need my sight checked",
    );
    const unrelated = await embedder.embed(
      "rent a bulldozer for a construction site",
    );
    const relatedScore = cosineSimilarity(provider, related);
    const unrelatedScore = cosineSimilarity(provider, unrelated);
    expect(relatedScore).toBeGreaterThan(unrelatedScore);
  }, 60_000);
});
