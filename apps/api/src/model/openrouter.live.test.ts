import { describe, expect, it } from "vitest";
import { loadConfig } from "../config.js";
import { OpenRouterRuntime } from "./openrouter.js";

/**
 * Live tests hit the real OpenRouter API and cost a tiny amount of credit.
 * They run only when RUN_LIVE_MODEL_TESTS=1 and a key is present, so the
 * default `pnpm test` stays free and deterministic.
 */
const shouldRun =
  process.env.RUN_LIVE_MODEL_TESTS === "1" &&
  Boolean(process.env.OPENROUTER_API_KEY);
const live = shouldRun ? describe : describe.skip;

live("OpenRouterRuntime (live)", () => {
  const runtime = new OpenRouterRuntime(
    loadConfig({ ...process.env, MODEL_MODE: "live" }),
  );

  it("creates a schema-valid provider world from a free-form description", async () => {
    const draft = await runtime.createWorld({
      providerMessage:
        "We run a small bike-repair co-op. We fix commuter bikes, keep common parts in stock, and adapt to unusual custom requests when we can.",
      preferredName: "Cog & Chain Co-op",
    });
    expect(draft.name.length).toBeGreaterThan(0);
    expect(draft.slug).toMatch(/^[a-z0-9-]+$/);
    expect(draft.searchableText.toLowerCase()).toContain("bike");
  }, 60_000);

  it("generates a full standalone HTML document that references the world id", async () => {
    const world = {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "cog-chain",
      name: "Cog & Chain Co-op",
      summary: "A small bike-repair co-op.",
      domain: null,
      knowledge: {
        capabilities: ["repair commuter bikes", "handle custom requests"],
      },
      instructions: "Interpret requests using co-op knowledge.",
      state: {},
      searchableText: "bike repair co-op commuter custom",
      published: true,
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ui = await runtime.generateUi({
      sessionId: "22222222-2222-4222-8222-222222222222",
      intent: "Book a tune-up for my commuter bike and ask about a custom rack",
      worlds: [world],
    });
    expect(ui.html.toLowerCase()).toContain("<!doctype html>");
    expect(ui.html).toContain(world.id);
    expect(ui.html).toContain("agent.invoke");
  }, 120_000);

  it("repairs a UI given a runtime error and returns a valid full document", async () => {
    const world = {
      id: "33333333-3333-4333-8333-333333333333",
      slug: "repair-demo",
      name: "Repair Demo Provider",
      summary: "A provider used to exercise the repair loop.",
      domain: null,
      knowledge: { capabilities: ["answer questions"] },
      instructions: "Interpret requests using provider knowledge.",
      state: {},
      searchableText: "repair demo provider questions",
      published: true,
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const broken =
      '<!doctype html><html><head></head><body><div id="out"></div><script>const data=undefined;document.getElementById("out").textContent=data.map(x=>x).join(",");</script></body></html>';
    const repaired = await runtime.repairUi({
      sessionId: "44444444-4444-4444-8444-444444444444",
      intent: "Show a simple question box for the provider",
      worlds: [world],
      previousHtml: broken,
      error: "TypeError: Cannot read properties of undefined (reading 'map')",
    });
    expect(repaired.html.toLowerCase()).toContain("<!doctype html>");
    expect(repaired.html).toContain("agent.invoke");
  }, 120_000);
});
