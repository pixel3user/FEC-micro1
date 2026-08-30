import { describe, expect, it } from "vitest";
import { DynamicActionRequestSchema, JsonObjectSchema } from "./index.js";

describe("open transport contracts", () => {
  it("accepts action names and nested arguments that were not predefined", () => {
    const parsed = DynamicActionRequestSchema.parse({
      sessionId: "774a4d88-8a1e-4ec7-9d60-68e3c110eb45",
      action: "invent a cross-domain arrangement nobody registered beforehand",
      arguments: {
        constraints: ["quiet", "under budget"],
        experimentalRule: { if: "rain", then: "move everything" },
      },
    });
    expect(parsed.action).toContain("nobody registered");
    expect(JsonObjectSchema.parse(parsed.arguments)).toEqual(parsed.arguments);
  });
});
