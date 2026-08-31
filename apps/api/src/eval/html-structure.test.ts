import { describe, expect, it } from "vitest";
import { observeHtmlStructure } from "./html-structure.js";

const validHtml = `<!doctype html><html><head><title>Useful UI</title></head><body><main><button id="go">Go</button></main><script>document.getElementById("go").onclick=()=>window.agent.invoke({worldId:"00000000-0000-4000-8000-000000000001",action:"go",arguments:{}});</script></body></html>`;

describe("observeHtmlStructure", () => {
  it("accepts a balanced full document with a bridge and required markers", () => {
    const observation = observeHtmlStructure(validHtml, [
      "<!doctype html>",
      "window.agent.invoke",
    ]);

    expect(observation.structurallyValid).toBe(true);
    expect(observation.safe).toBe(true);
    expect(observation.hasInvokeBridge).toBe(true);
    expect(observation.requiredMarkers.every(({ present }) => present)).toBe(
      true,
    );
    expect(observation.passed).toBe(true);
  });

  it("rejects malformed documents and missing required markers", () => {
    const observation = observeHtmlStructure(
      "<html><head><title>Broken</title></head><body><main></body></html>",
      ["case-specific-marker"],
    );

    expect(observation.hasDoctype).toBe(false);
    expect(observation.tagsBalanced).toBe(false);
    expect(observation.requiredMarkers[0]?.present).toBe(false);
    expect(observation.passed).toBe(false);
  });

  it("reports unsafe embeds, external scripts, handlers, and javascript URLs", () => {
    const observation = observeHtmlStructure(
      `<!doctype html><html><head><title>Unsafe</title><script src="https://example.test/a.js"></script></head><body><main><iframe src="https://example.test"></iframe><a href="javascript:alert(1)" onclick="alert(1)">go</a></main><script>window.agent.invoke({action:"go"})</script></body></html>`,
    );

    expect(observation.prohibitedTagCount).toBe(1);
    expect(observation.externalScriptCount).toBe(1);
    expect(observation.inlineEventHandlerCount).toBe(1);
    expect(observation.javascriptUrlCount).toBe(1);
    expect(observation.safe).toBe(false);
    expect(observation.passed).toBe(false);
  });

  it("rejects misplaced document sections and bridge text outside scripts", () => {
    const misplaced = observeHtmlStructure(
      `<!doctype html><html><body><main>window.agent.invoke({action:"go"})</main></body><head><title>Late</title></head></html>`,
    );

    expect(misplaced.structurallyValid).toBe(false);
    expect(misplaced.hasInvokeBridge).toBe(false);
    expect(misplaced.passed).toBe(false);
  });

  it("decodes character references before checking javascript URLs", () => {
    const observation = observeHtmlStructure(
      `<!doctype html><html><head><title>Encoded</title></head><body><main><a href="java&#x73;cript:alert(1)">go</a></main><script>window.agent.invoke({action:"go"})</script></body></html>`,
    );

    expect(observation.javascriptUrlCount).toBe(1);
    expect(observation.safe).toBe(false);
    expect(observation.passed).toBe(false);
  });

  it("fails closed on browser-normalized handlers and URL schemes", () => {
    const observation = observeHtmlStructure(
      `<!doctype html><html><head><title>Normalized</title></head><body><main><img/onerror=alert(1)><a href="java&#x09;script:alert(1)">go</a></main><script>window.agent.invoke({worldId:"00000000-0000-4000-8000-000000000001",action:"go",arguments:{}})</script></body></html>`,
    );

    expect(observation.inlineEventHandlerCount).toBe(1);
    expect(observation.javascriptUrlCount).toBe(1);
    expect(observation.safe).toBe(false);
  });

  it("does not treat inert script data as an executable bridge", () => {
    const observation = observeHtmlStructure(
      `<!doctype html><html><head><title>Inert</title></head><body><main>Data</main><script type="application/json">window.agent.invoke({worldId:"00000000-0000-4000-8000-000000000001",action:"go",arguments:{}})</script></body></html>`,
    );

    expect(observation.hasInvokeBridge).toBe(false);
    expect(observation.passed).toBe(false);
  });
});
