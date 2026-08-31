import { describe, expect, it } from "vitest";
import { extractJsonObject, JsonExtractionError } from "./json-extract.js";

describe("extractJsonObject", () => {
  it("parses a clean JSON object", () => {
    expect(extractJsonObject('{"ok":true}')).toEqual({ ok: true });
  });

  it("strips reasoning traces before the JSON (observed live failure mode)", () => {
    const raw =
      '<think>The user wants…</think>\n{"title":"Plan","items":["a","b"]}';
    expect(extractJsonObject(raw)).toEqual({
      title: "Plan",
      items: ["a", "b"],
    });
  });

  it("removes dangling reasoning tags", () => {
    expect(extractJsonObject('</think> {"value": 1}')).toEqual({ value: 1 });
  });

  it("unwraps markdown fences", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("recovers a balanced object surrounded by prose", () => {
    const raw =
      'Sure, here it is: {"nested":{"k":"}"},"done":true} — hope that helps!';
    expect(extractJsonObject(raw)).toEqual({ nested: { k: "}" }, done: true });
  });

  it("does not terminate early on braces inside strings", () => {
    expect(extractJsonObject('{"pattern":"a{b}c"}')).toEqual({
      pattern: "a{b}c",
    });
  });

  it("throws when no JSON object is present", () => {
    expect(() => extractJsonObject("no json here")).toThrow(
      JsonExtractionError,
    );
  });
});
