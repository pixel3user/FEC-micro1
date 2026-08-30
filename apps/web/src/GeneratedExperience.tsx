import {
  JsonObjectSchema,
  type GeneratedExperience,
} from "@agent-web/contracts";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { api } from "./api";
import { injectAgentBridge } from "./bridge";

const BridgeMessageSchema = z.object({
  source: z.literal("agent-native-generated-ui"),
  type: z.literal("invoke"),
  requestId: z.string().min(1).max(200),
  input: z.object({
    worldId: z.uuid(),
    action: z.string().min(1).max(500),
    arguments: JsonObjectSchema.default({}),
  }),
});

type Trace = {
  requestId: string;
  action: string;
  status: "deciding" | "completed" | "failed";
  detail: string;
};

export function GeneratedExperienceFrame({
  experience,
}: {
  experience: GeneratedExperience;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const source = useMemo(
    () => injectAgentBridge(experience.html),
    [experience.html],
  );

  useEffect(() => {
    const receive = async (event: MessageEvent<unknown>) => {
      if (event.source !== frame.current?.contentWindow) return;
      const parsed = BridgeMessageSchema.safeParse(event.data);
      if (!parsed.success) return;
      const { requestId, input } = parsed.data;
      if (!experience.worldIds.includes(input.worldId)) {
        sendResult(
          requestId,
          false,
          undefined,
          "Generated UI requested a provider outside this experience.",
        );
        return;
      }
      setTraces((current) => [
        {
          requestId,
          action: input.action,
          status: "deciding",
          detail: "Provider agent is deciding…",
        },
        ...current,
      ]);
      try {
        const result = await api.invoke(input.worldId, {
          sessionId: experience.sessionId,
          action: input.action,
          arguments: input.arguments,
          idempotencyKey: `${experience.sessionId}:${requestId}`,
        });
        setTraces((current) =>
          current.map((trace) =>
            trace.requestId === requestId
              ? {
                  ...trace,
                  status: "completed",
                  detail: result.decision.publicSummary,
                }
              : trace,
          ),
        );
        sendResult(requestId, true, result);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        setTraces((current) =>
          current.map((trace) =>
            trace.requestId === requestId
              ? { ...trace, status: "failed", detail }
              : trace,
          ),
        );
        sendResult(requestId, false, undefined, detail);
      }
    };

    const sendResult = (
      requestId: string,
      ok: boolean,
      payload?: unknown,
      error?: string,
    ) => {
      frame.current?.contentWindow?.postMessage(
        {
          source: "agent-native-host",
          type: "result",
          requestId,
          ok,
          payload,
          error,
        },
        "*",
      );
    };

    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [experience]);

  return (
    <div className="experience-layout">
      <section className="generated-stage">
        <div className="stage-bar">
          <div>
            <span className="eyebrow">Generated live</span>
            <strong>{experience.title}</strong>
          </div>
          <span className="status-dot">Sandboxed</span>
        </div>
        <iframe
          ref={frame}
          className="generated-frame"
          sandbox="allow-scripts allow-forms allow-modals"
          referrerPolicy="no-referrer"
          srcDoc={source}
          title={experience.title}
        />
      </section>
      <aside className="trace-panel">
        <span className="eyebrow">Decision stream</span>
        <h3>Agent activity</h3>
        {traces.length === 0 ? (
          <p className="muted">
            Actions invented by the generated interface will appear here.
          </p>
        ) : (
          <ol className="trace-list">
            {traces.map((trace) => (
              <li key={trace.requestId} className={`trace ${trace.status}`}>
                <strong>{trace.action}</strong>
                <span>{trace.detail}</span>
              </li>
            ))}
          </ol>
        )}
        <details className="code-view">
          <summary>View generated source</summary>
          <pre>{experience.html}</pre>
        </details>
      </aside>
    </div>
  );
}
