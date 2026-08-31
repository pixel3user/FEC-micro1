import { interpolate, useCurrentFrame } from "remotion";
import { LineIcon } from "./Icons";
import {
  CaptionTicker,
  CardNumber,
  EditorialCard,
  Eyebrow,
  Pill,
  Reveal,
  Scene,
  SectionTitle,
} from "./Primitives";
import { submission } from "./design";

const EVIDENCE_DURATION = 1560;

type EvidenceKind = "LIVE*" | "STRUCTURAL" | "MODELED" | "TESTED";

type Metric = {
  number: string;
  title: string;
  detail: string;
  baseline: string;
  agent: string;
  change: string;
  kind: EvidenceKind;
};

const metrics: Metric[] = [
  {
    number: "01",
    title: "Primary outcome: generated experience through shared runtime",
    detail: "HTTP 201 + generated HTML longer than 100 characters",
    baseline: "0 / 4",
    agent: "4 / 4",
    change: "+4 cases",
    kind: "LIVE*",
  },
  {
    number: "02",
    title: "Per-intent workflow UI in the evaluated source path",
    detail: "Route, form, task branch, and result view for each intent",
    baseline: "fixed page",
    agent: "none for 4",
    change: "removed",
    kind: "STRUCTURAL",
  },
  {
    number: "03",
    title: "Supporting capability: relevant provider ranked first",
    detail: "Four fixed discovery cases; semantic search is not the headline",
    baseline: "2 / 4",
    agent: "4 / 4",
    change: "+2 cases",
    kind: "LIVE*",
  },
  {
    number: "04",
    title: "Average human actions per task",
    detail: "Assumed navigation steps, not observed user telemetry",
    baseline: "3.75",
    agent: "2.00",
    change: "-46.7%",
    kind: "MODELED",
  },
  {
    number: "05",
    title: "Two-provider plan references both providers",
    detail: "One integration scenario using the mock runtime",
    baseline: "not supported",
    agent: "1 / 1",
    change: "added",
    kind: "TESTED",
  },
  {
    number: "06",
    title: "State update + decision event after invoke",
    detail: "One integration scenario using the in-memory store",
    baseline: "not evaluated",
    agent: "1 / 1",
    change: "persisted",
    kind: "TESTED",
  },
  {
    number: "07",
    title: "Duplicate retry returns the same event",
    detail: "Idempotency behavior in one integration scenario",
    baseline: "not evaluated",
    agent: "same event ID",
    change: "suppressed",
    kind: "TESTED",
  },
];

function kindTone(kind: EvidenceKind): "rust" | "slate" | "navy" | "success" {
  if (kind === "LIVE*") return "slate";
  if (kind === "STRUCTURAL") return "navy";
  if (kind === "MODELED") return "rust";
  return "success";
}

function MethodCard({
  variant,
}: {
  variant: "baseline" | "agent";
}) {
  const baseline = variant === "baseline";
  const accent = baseline ? submission.color.terracotta : submission.color.slate;
  const soft = baseline ? submission.color.terracottaSoft : submission.color.slateSoft;
  const items = baseline
    ? ["route + page", "form state", "workflow branches", "provider handlers", "result view"]
    : ["outcome", "context", "constraints", "capabilities", "current state"];

  return (
    <EditorialCard
      accent={accent}
      style={{ height: 154, padding: "17px 20px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
          <div
            style={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              background: soft,
            }}
          >
            <LineIcon
              name={baseline ? "browser" : "spark"}
              size={29}
              color={accent}
            />
          </div>
          <div>
            <CardNumber color={accent}>
              {baseline ? "SIMPLE BASELINE" : "AGENT SOLUTION"}
            </CardNumber>
            <div style={{ marginTop: 4, fontSize: 19, fontWeight: 660 }}>
              {baseline
                ? "A prebuilt workflow for each journey"
                : "One shared reasoning runtime across intents"}
            </div>
          </div>
        </div>
        <Pill tone={baseline ? "rust" : "slate"}>
          {baseline ? "built first" : "request time"}
        </Pill>
      </div>

      <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
        {items.map((item) => (
          <div
            key={item}
            style={{
              minHeight: 31,
              padding: "7px 8px",
              display: "grid",
              placeItems: "center",
              background: baseline ? submission.color.white : soft,
              borderTop: `2px solid ${accent}`,
              fontFamily: submission.font.mono,
              fontSize: 9,
              lineHeight: 1.2,
              letterSpacing: 0.55,
              textAlign: "center",
              textTransform: "uppercase",
              color: submission.color.inkSoft,
            }}
          >
            {item}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, fontSize: 11, color: submission.color.muted }}>
        {baseline
          ? "A new journey requires another implemented and maintained path."
          : "The same configured runtime and generic invoke contract serve all four fixed intents."}
      </div>
    </EditorialCard>
  );
}

function EvaluationTable({ frame }: { frame: number }) {
  return (
    <EditorialCard
      accent={submission.color.navy}
      style={{ marginTop: 13, height: 503, padding: "16px 20px 14px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <Eyebrow color={submission.color.navy}>Four fixed live cases · separate integration checks</Eyebrow>
          <div style={{ marginTop: 5, fontSize: 20, fontWeight: 660 }}>
            Does one shared runtime remove the need for four task-specific workflows?
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["LIVE*", "STRUCTURAL", "MODELED", "TESTED"] as EvidenceKind[]).map((kind) => (
            <Pill key={kind} tone={kindTone(kind)} style={{ fontSize: 8, padding: "5px 7px" }}>
              {kind}
            </Pill>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          minHeight: 36,
          display: "grid",
          gridTemplateColumns: "2.6fr 0.72fr 0.72fr 0.72fr",
          alignItems: "center",
          background: submission.color.navy,
          color: submission.color.white,
        }}
      >
        {[
          ["METRIC", "left"],
          ["SIMPLE BASELINE", "center"],
          ["AGENT SOLUTION", "center"],
          ["CHANGE", "center"],
        ].map(([label, align]) => (
          <div
            key={label}
            style={{
              padding: "0 13px",
              fontFamily: submission.font.mono,
              fontSize: 9,
              letterSpacing: 1.4,
              textAlign: align as "left" | "center",
              color: "rgba(255,255,255,0.68)",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div>
        {metrics.map((metric, index) => {
          const reveal = interpolate(frame, [150 + index * 75, 190 + index * 75], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const primary = index === 0;
          return (
            <div
              key={metric.number}
              style={{
                minHeight: 48,
                display: "grid",
                gridTemplateColumns: "2.6fr 0.72fr 0.72fr 0.72fr",
                alignItems: "stretch",
                background: primary
                  ? submission.color.navySoft
                  : index % 2
                    ? "rgba(255,255,255,0.42)"
                    : submission.color.white,
                borderBottom: `1px solid ${submission.color.line}`,
                opacity: reveal,
                transform: `translateY(${(1 - reveal) * 5}px)`,
              }}
            >
              <div
                style={{
                  padding: "7px 11px",
                  display: "grid",
                  gridTemplateColumns: "28px 1fr 78px",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <CardNumber color={primary ? submission.color.navy : submission.color.faint}>
                  {metric.number}
                </CardNumber>
                <div>
                  <div style={{ fontSize: 12, fontWeight: primary ? 720 : 650, lineHeight: 1.2 }}>
                    {metric.title}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 9, color: submission.color.muted, lineHeight: 1.2 }}>
                    {metric.detail}
                  </div>
                </div>
                <Pill
                  tone={kindTone(metric.kind)}
                  style={{ justifyContent: "center", fontSize: 8, padding: "5px 6px" }}
                >
                  {metric.kind}
                </Pill>
              </div>
              {[metric.baseline, metric.agent, metric.change].map((value, valueIndex) => (
                <div
                  key={`${metric.number}-${valueIndex}`}
                  style={{
                    padding: "7px 9px",
                    display: "grid",
                    placeItems: "center",
                    borderLeft: `1px solid ${submission.color.line}`,
                    fontFamily: submission.font.mono,
                    fontSize: primary ? 15 : 12,
                    fontWeight: primary || valueIndex === 2 ? 700 : 560,
                    textAlign: "center",
                    color:
                      valueIndex === 0
                        ? submission.color.terracotta
                        : valueIndex === 1
                          ? submission.color.slate
                          : submission.color.success,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 10, lineHeight: 1.3, color: submission.color.muted }}>
          * Documented OpenRouter live run. Generated-experience success is a shallow HTTP 201 + HTML-length check, not proof of completed real-world outcomes.
        </div>
        <Eyebrow color={submission.color.navy}>Trusted identity · permission · validation · storage · execution remain</Eyebrow>
      </div>
    </EditorialCard>
  );
}

export function EvidenceChapter() {
  const frame = useCurrentFrame();
  return (
    <Scene duration={EVIDENCE_DURATION}>
      <Reveal delay={2}>
        <SectionTitle
          number="07"
          title="Evaluate the architectural change, not only semantic search."
          description="We compare a prebuilt workflow path with one shared reasoning runtime across the same four fixed intents, then label every result as live, structural, modeled, or tested."
          compact
        />
      </Reveal>

      <div
        style={{
          marginTop: 25,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <Reveal delay={18}>
          <MethodCard variant="baseline" />
        </Reveal>
        <Reveal delay={34}>
          <MethodCard variant="agent" />
        </Reveal>
      </div>

      <Reveal delay={54}>
        <EvaluationTable frame={frame} />
      </Reveal>

      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "The primary question is whether one shared reasoning runtime can serve different intents without a separately implemented workflow for each one.",
          },
          {
            from: 180,
            text: "The simple baseline assumes a prebuilt route, form, workflow branches, provider handlers, and result view for every journey.",
          },
          {
            from: 360,
            text: "The agent uses the same configured runtime and generic invocation contract across all four fixed evaluation intents.",
          },
          {
            from: 540,
            text: "In the documented live run, generated experiences were returned for zero of four baseline cases and four of four agent cases.",
          },
          {
            from: 720,
            text: "That check means HTTP two-oh-one plus generated HTML over one hundred characters; it does not prove real-world task completion.",
          },
          {
            from: 900,
            text: "Semantic discovery is supporting evidence: relevant top-provider ranking improved from two of four to four of four fixed cases.",
          },
          {
            from: 1080,
            text: "Average human actions fall from three point seven five to two, but those values are modeled assumptions, not observed telemetry.",
          },
          {
            from: 1240,
            text: "Integration tests separately verify a two-provider plan, a state update with a decision event, and duplicate-action suppression.",
          },
          {
            from: 1400,
            text: "The evidence supports replacing more task-specific workflow implementation with reasoning, while trusted execution systems remain.",
          },
        ]}
      />
    </Scene>
  );
}
