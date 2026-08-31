import { describe, expect, it } from "vitest";
import { injectAgentBridge } from "./bridge";

describe("generated UI bridge", () => {
  it("injects a sandbox transport and restrictive CSP without replacing generated markup", () => {
    const generated =
      "<!doctype html><html><head><title>Unique generated page</title></head><body><main>Original UI</main></body></html>";
    const result = injectAgentBridge(generated);
    expect(result).toContain("Unique generated page");
    expect(result).toContain("Original UI");
    expect(result).toContain("window.agent");
    expect(result).toContain("connect-src 'none'");
    expect(result).toContain("agent-native-runtime-bridge");
  });

  it("is idempotent", () => {
    const once = injectAgentBridge(
      "<html><head></head><body>Generated</body></html>",
    );
    expect(injectAgentBridge(once)).toBe(once);
  });

  it("wires runtime error reporting for the repair loop", () => {
    const result = injectAgentBridge(
      "<html><head></head><body>x</body></html>",
    );
    expect(result).toContain('addEventListener("error"');
    expect(result).toContain('addEventListener("unhandledrejection"');
    expect(result).toContain("runtime-error");
  });
});
