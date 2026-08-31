import {
  JsonObjectSchema,
  type GeneratedExperience,
} from "@agent-web/contracts";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { api } from "./api";
import { injectAgentBridge } from "./bridge";

const InvokeMessageSchema = z.object({
  source: z.literal("agent-native-generated-ui"),
  type: z.literal("invoke"),
  requestId: z.string().min(1).max(200),
  input: z.object({
    worldId: z.uuid(),
    action: z.string().min(1).max(500),
    arguments: JsonObjectSchema.default({}),
  }),
});

const RuntimeErrorMessageSchema = z.object({
  source: z.literal("agent-native-generated-ui"),
  type: z.literal("runtime-error"),
  kind: z.string().max(80),
  detail: z.string().max(2_000),
});

type Trace = {
  requestId: string;
  action: string;
  status: "deciding" | "completed" | "failed";
  detail: string;
};

type RepairState =
  | { status: "healthy" }
  | { status: "detected"; error: string }
  | { status: "repairing"; error: string }
  | { status: "failed"; error: string };

export function GeneratedExperienceFrame({
  experience: initialExperience,
}: {
  experience: GeneratedExperience;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [experience, setExperience] = useState(initialExperience);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [repair, setRepair] = useState<RepairState>({ status: "healthy" });
  // Level A: an agent-supplied follow-up document that replaces the current
  // view when a decision returns `nextView`.
  const [agentView, setAgentView] = useState<string | null>(null);
  const activeHtml = agentView ?? experience.html;
  const source = useMemo(() => injectAgentBridge(activeHtml), [activeHtml]);

  useEffect(() => {
    setExperience(initialExperience);
    setTraces([]);
    setRepair({ status: "healthy" });
    setAgentView(null);
  }, [initialExperience]);

  useEffect(() => {
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

    const handleInvoke = async (
      parsed: z.infer<typeof InvokeMessageSchema>,
    ) => {
      const { requestId, input } = parsed;
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
        // Level A: if the agent proposed a follow-up view, swap the sandbox to
        // it. The result was already returned above so the current UI can also
        // react before it is replaced.
        if (result.decision.nextView) {
          const nextView = result.decision.nextView;
          setTimeout(() => setAgentView(nextView), 400);
        }
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

    const receive = (event: MessageEvent<unknown>) => {
      if (event.source !== frame.current?.contentWindow) return;
      const invoke = InvokeMessageSchema.safeParse(event.data);
      if (invoke.success) {
        void handleInvoke(invoke.data);
        return;
      }
      const runtimeError = RuntimeErrorMessageSchema.safeParse(event.data);
      if (runtimeError.success) {
        setRepair((current) =>
          current.status === "repairing"
            ? current
            : {
                status: "detected",
                error: `${runtimeError.data.kind}: ${runtimeError.data.detail}`,
              },
        );
      }
    };

    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [experience]);

  const runRepair = async (error: string) => {
    setRepair({ status: "repairing", error });
    try {
      const response = await api.repairExperience({
        sessionId: experience.sessionId,
        error,
      });
      setExperience(response.experience);
      setTraces([]);
      setRepair({ status: "healthy" });
    } catch (caught) {
      setRepair({
        status: "failed",
        error: caught instanceof Error ? caught.message : String(caught),
      });
    }
  };

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
        {repair.status !== "healthy" && (
          <div className={`repair-bar ${repair.status}`} role="status">
            {repair.status === "detected" && (
              <>
                <span>The generated interface reported an error.</span>
                <button onClick={() => void runRepair(repair.error)}>
                  Ask the model to repair it
                </button>
              </>
            )}
            {repair.status === "repairing" && (
              <span>Regenerating a corrected interface…</span>
            )}
            {repair.status === "failed" && (
              <>
                <span>Repair failed: {repair.error}</span>
                <button onClick={() => void runRepair(repair.error)}>
                  Retry repair
                </button>
              </>
            )}
          </div>
        )}
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
