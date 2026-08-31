const BRIDGE_MARKER = "agent-native-runtime-bridge";

const policy = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

const bridge = `<meta http-equiv="Content-Security-Policy" content="${policy}">
<script id="${BRIDGE_MARKER}">
(() => {
  const pending = new Map();
  const source = "agent-native-generated-ui";
  window.agent = Object.freeze({
    invoke(input) {
      if (!input || typeof input !== "object") return Promise.reject(new Error("agent.invoke expects an object"));
      const requestId = crypto.randomUUID();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error("The provider agent timed out"));
        }, 60000);
        pending.set(requestId, { resolve, reject, timeout });
        window.parent.postMessage({ source, type: "invoke", requestId, input }, "*");
      });
    }
  });
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (!message || message.source !== "agent-native-host" || message.type !== "result") return;
    const entry = pending.get(message.requestId);
    if (!entry) return;
    clearTimeout(entry.timeout);
    pending.delete(message.requestId);
    if (message.ok) entry.resolve(message.payload);
    else entry.reject(new Error(message.error || "Provider agent failed"));
  });
})();
</script>`;

export function injectAgentBridge(html: string): string {
  if (html.includes(`id="${BRIDGE_MARKER}"`)) return html;
  const head = /<head(?:\s[^>]*)?>/i;
  if (head.test(html))
    return html.replace(head, (match) => `${match}\n${bridge}`);
  return `<!doctype html><html><head>${bridge}</head><body>${html}</body></html>`;
}
