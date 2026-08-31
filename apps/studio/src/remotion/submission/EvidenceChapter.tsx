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

function FlowStep({
  index,
  title,
  detail,
  accent,
  active,
}: {
  index: number;
  title: string;
  detail: string;
  accent: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        minHeight: 62,
        padding: "9px 12px",
        display: "grid",
        gridTemplateColumns: "29px 1fr",
        alignItems: "center",
        gap: 10,
        background: active ? submission.color.white : "rgba(255,255,255,0.35)",
        borderLeft: `3px solid ${active ? accent : submission.color.line}`,
        opacity: active ? 1 : 0.42,
      }}
    >
      <div
        style={{
          width: 25,
          height: 25,
          display: "grid",
          placeItems: "center",
          background: active ? accent : submission.color.line,
          color: submission.color.white,
          fontFamily: submission.font.mono,
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 660 }}>{title}</div>
        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            lineHeight: 1.25,
            color: submission.color.muted,
          }}
        >
          {detail}
        </div>
      </div>
    </div>
  );
}

function BaselinePath({ frame }: { frame: number }) {
  const baselineSteps = [
    ["Search", "Keyword search across human-facing pages"],
    ["Open", "Read separate sites and infer capabilities"],
    ["Recommend", "Return links, options, and instructions"],
    ["Hand off", "The user completes every external action"],
  ] as const;
  const solutionSteps = [
    ["Understand", "Reason over outcome and constraints"],
    ["Discover", "Find machine-readable capabilities by meaning"],
    ["Compose + act", "Choose authorized actions at runtime"],
    ["Return result", "Persist and communicate the outcome"],
  ] as const;
  const active = Math.min(3, Math.max(0, Math.floor((frame - 80) / 85)));

  return (
    <EditorialCard
      accent={submission.color.terracotta}
      style={{ height: 470, padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <CardNumber>REASONABLE BASIC BASELINE</CardNumber>
          <div style={{ marginTop: 6, fontSize: 21, fontWeight: 650 }}>
            Keyword-ranked search · fixed pages
          </div>
        </div>
        <Pill tone="rust">Same request</Pill>
      </div>

      <div
        style={{
          marginTop: 15,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              minHeight: 54,
              padding: "9px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: submission.color.terracottaSoft,
            }}
          >
            <LineIcon name="browser" size={29} color={submission.color.terracotta} />
            <div>
              <Eyebrow color={submission.color.terracotta}>Basic path</Eyebrow>
              <div style={{ marginTop: 3, fontSize: 13, fontWeight: 620 }}>
                Helps the human operate software
              </div>
            </div>
          </div>
          <div style={{ marginTop: 7, display: "grid", gap: 6 }}>
            {baselineSteps.map(([title, detail], index) => (
              <FlowStep
                key={title}
                index={index}
                title={title}
                detail={detail}
                accent={submission.color.terracotta}
                active={index <= active}
              />
            ))}
          </div>
        </div>
        <div>
          <div
            style={{
              minHeight: 54,
              padding: "9px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: submission.color.slateSoft,
            }}
          >
            <LineIcon name="spark" size={29} color={submission.color.slate} />
            <div>
              <Eyebrow color={submission.color.slate}>Our solution</Eyebrow>
              <div style={{ marginTop: 3, fontSize: 13, fontWeight: 620 }}>
                Reasons toward an authorized outcome
              </div>
            </div>
          </div>
          <div style={{ marginTop: 7, display: "grid", gap: 6 }}>
            {solutionSteps.map(([title, detail], index) => (
              <FlowStep
                key={title}
                index={index}
                title={title}
                detail={detail}
                accent={submission.color.slate}
                active={index <= active}
              />
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 17,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div style={{ padding: "8px 11px", background: submission.color.white }}>
          <Eyebrow color={submission.color.terracotta}>Baseline output</Eyebrow>
          <div style={{ marginTop: 3, fontSize: 13, fontWeight: 650 }}>Recommendations for the user</div>
        </div>
        <div style={{ padding: "8px 11px", background: submission.color.navy, color: submission.color.white }}>
          <Eyebrow color={submission.color.terracottaSoft}>Solution output</Eyebrow>
          <div style={{ marginTop: 3, fontSize: 13, fontWeight: 650 }}>One generated, persisted result</div>
        </div>
      </div>
    </EditorialCard>
  );
}

function DiscoveryExample({ frame }: { frame: number }) {
  const scoreProgress = interpolate(frame, [300, 490], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <EditorialCard
      accent={submission.color.slate}
      style={{ height: 470, padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <CardNumber color={submission.color.slate}>02 · PROVIDER DISCOVERY</CardNumber>
          <div style={{ marginTop: 6, fontSize: 21, fontWeight: 650 }}>
            Meaning beats matching words
          </div>
        </div>
        <LineIcon name="search" size={38} color={submission.color.slate} />
      </div>
      <div
        style={{
          marginTop: 14,
          padding: "12px 13px",
          background: submission.color.navy,
          color: submission.color.white,
          fontSize: 15,
          lineHeight: 1.35,
          fontWeight: 590,
        }}
      >
        “My eyesight is blurry and I want it checked.”
      </div>
      <div style={{ marginTop: 9, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ padding: 12, background: submission.color.terracottaSoft }}>
          <Eyebrow color={submission.color.terracotta}>Basic lexical rank</Eyebrow>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.35 }}>
            <strong>eyesight · blurry · checked</strong>
            <br />
            Few exact words overlap with “optometry” or “vision assessment.”
          </div>
        </div>
        <div style={{ padding: 12, background: submission.color.slateSoft }}>
          <Eyebrow color={submission.color.slate}>Semantic rank</Eyebrow>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.35 }}>
            <strong>blurry eyesight maps to vision assessment</strong>
            <br />
            Clearview Eye Clinic becomes the relevant top result.
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          ["BASIC", 2, 4, submission.color.terracotta],
          ["OUR SOLUTION", 4, 4, submission.color.slate],
        ].map(([label, hits, total, color]) => {
          const percentage = (Number(hits) / Number(total)) * 100 * scoreProgress;
          return (
            <div key={String(label)} style={{ padding: "11px 12px", background: submission.color.white }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Eyebrow color={String(color)}>{label}</Eyebrow>
                <div style={{ fontFamily: submission.font.mono, fontSize: 18, fontWeight: 700, color: String(color) }}>
                  {Math.round(percentage)}%
                </div>
              </div>
              <div style={{ marginTop: 8, height: 5, background: submission.color.lineSoft }}>
                <div style={{ width: `${percentage}%`, height: "100%", background: String(color) }} />
              </div>
              <div style={{ marginTop: 7, fontSize: 11, color: submission.color.muted }}>
                {String(hits)}/{String(total)} relevant providers ranked first
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 17,
          paddingTop: 10,
          borderTop: `1px solid ${submission.color.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow>Executed · four fixed cases</Eyebrow>
        <Pill tone="slate" style={{ whiteSpace: "nowrap" }}>0.50 TO 1.00</Pill>
      </div>
    </EditorialCard>
  );
}

function CompositionExample({ frame }: { frame: number }) {
  const active = Math.min(3, Math.max(0, Math.floor((frame - 560) / 90)));
  const steps = ["Find venue", "Find catering", "Share constraints", "Coordinate outcome"];
  return (
    <EditorialCard
      accent={submission.color.navy}
      style={{ height: 470, padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <CardNumber color={submission.color.navy}>03 · MULTI-PROVIDER COMPOSITION</CardNumber>
          <div style={{ marginTop: 6, fontSize: 21, fontWeight: 650 }}>
            Finding two services is not composing them
          </div>
        </div>
        <LineIcon name="compose" size={38} color={submission.color.navy} />
      </div>
      <div
        style={{
          marginTop: 14,
          padding: "12px 13px",
          background: submission.color.navy,
          color: submission.color.white,
          fontSize: 15,
          lineHeight: 1.35,
          fontWeight: 590,
        }}
      >
        “Plan a birthday gathering with a venue and food.”
      </div>
      <div style={{ marginTop: 9, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ padding: 12, background: submission.color.terracottaSoft }}>
          <Eyebrow color={submission.color.terracotta}>Basic path</Eyebrow>
          <div style={{ marginTop: 9, display: "grid", gap: 6 }}>
            {["Northstar Events · venue", "Feast Collective · catering"].map((item) => (
              <div key={item} style={{ padding: "8px 9px", background: submission.color.white, fontSize: 12, fontWeight: 620 }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: submission.color.inkSoft }}>
            Two correct links. The user still coordinates both.
          </div>
        </div>
        <div style={{ padding: 12, background: submission.color.slateSoft }}>
          <Eyebrow color={submission.color.slate}>Our solution</Eyebrow>
          <div style={{ marginTop: 9, display: "grid", gap: 5 }}>
            {steps.map((step, index) => (
              <div
                key={step}
                style={{
                  padding: "6px 8px",
                  display: "flex",
                  justifyContent: "space-between",
                  background: index <= active ? submission.color.white : "rgba(255,255,255,0.35)",
                  opacity: index <= active ? 1 : 0.42,
                  fontSize: 11,
                  fontWeight: 620,
                }}
              >
                <span>{step}</span>
                <span style={{ color: submission.color.success }}>{index <= active ? "READY" : "…"}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 5, fontSize: 11, lineHeight: 1.2, color: submission.color.inkSoft }}>
            One coordinated plan across both providers.
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 17,
          minHeight: 52,
          padding: "9px 12px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.45fr",
          alignItems: "center",
          gap: 10,
          background: submission.color.white,
          borderTop: `3px solid ${submission.color.navy}`,
        }}
      >
        <div>
          <Eyebrow color={submission.color.terracotta}>Basic path</Eyebrow>
          <div style={{ marginTop: 3, fontFamily: submission.font.mono, fontSize: 14, fontWeight: 700 }}>
            6 modeled steps
          </div>
        </div>
        <div>
          <Eyebrow color={submission.color.slate}>Solution path</Eyebrow>
          <div style={{ marginTop: 3, fontFamily: submission.font.mono, fontSize: 14, fontWeight: 700 }}>
            2 modeled steps
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Eyebrow color={submission.color.navy}>Evidence boundary</Eyebrow>
          <div style={{ marginTop: 3, fontSize: 11, color: submission.color.muted }}>
            Modeled navigation, not telemetry
          </div>
        </div>
      </div>
    </EditorialCard>
  );
}

function MetricRail({ frame }: { frame: number }) {
  const metrics = [
    {
      number: "01",
      label: "Top provider",
      before: "2 / 4",
      after: "4 / 4",
      note: "executed",
      accent: submission.color.terracotta,
    },
    {
      number: "02",
      label: "Avg. user steps",
      before: "3.75",
      after: "2.00",
      note: "modeled",
      accent: submission.color.terracotta,
    },
    {
      number: "03",
      label: "Provider output",
      before: "links",
      after: "one plan",
      note: "tested",
      accent: submission.color.slate,
    },
    {
      number: "04",
      label: "Result state",
      before: "chat only",
      after: "persisted",
      note: "tested",
      accent: submission.color.navy,
    },
  ] as const;
  return (
    <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {metrics.map((metric, index) => {
        const reveal = interpolate(frame, [700 + index * 45, 735 + index * 45], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={metric.number}
            style={{
              minHeight: 94,
              padding: "13px 15px",
              background: submission.color.paperStrong,
              borderTop: `3px solid ${metric.accent}`,
              opacity: reveal,
              transform: `translateY(${(1 - reveal) * 8}px)`,
              display: "grid",
              gridTemplateColumns: "42px 1fr 72px",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CardNumber color={metric.accent}>{metric.number}</CardNumber>
            <div>
              <div style={{ fontSize: 14, fontWeight: 650 }}>{metric.label}</div>
              <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 8, fontFamily: submission.font.mono, fontSize: 13 }}>
                <span style={{ color: submission.color.terracotta }}>{metric.before}</span>
                <span style={{ color: submission.color.faint, fontSize: 9 }}>TO</span>
                <span style={{ color: submission.color.success, fontWeight: 700 }}>{metric.after}</span>
              </div>
            </div>
            <Pill tone={index < 2 ? "rust" : index === 2 ? "slate" : "navy"} style={{ justifyContent: "center", fontSize: 9, padding: "6px 8px" }}>
              {metric.note}
            </Pill>
          </div>
        );
      })}
    </div>
  );
}

function PersistenceEvidence({ frame }: { frame: number }) {
  const local = frame - 1020;
  const active = Math.min(4, Math.max(0, Math.floor((local - 45) / 75)));
  const stages = [
    { icon: "intent" as const, title: "Request 1", detail: "Reserve the temporary ramp", accent: submission.color.terracotta },
    { icon: "lock" as const, title: "Authorized action", detail: "Consent + idempotency key", accent: submission.color.terracotta },
    { icon: "state" as const, title: "Durable provider state", detail: "Reservation + decision event", accent: submission.color.slate },
    { icon: "memory" as const, title: "Request 2", detail: "What is already arranged?", accent: submission.color.slate },
    { icon: "result" as const, title: "State-aware result", detail: "Ramp reserved; two items pending", accent: submission.color.navy },
  ];
  return (
    <div
      style={{
        position: "absolute",
        inset: "220px 74px 230px",
        padding: 25,
        background: submission.color.paper,
        borderTop: `4px solid ${submission.color.navy}`,
        opacity: interpolate(frame, [995, 1035], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(frame, [995, 1035], [18, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}px)`,
        zIndex: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <CardNumber color={submission.color.navy}>06 · PERSISTENT RESULT</CardNumber>
          <div style={{ marginTop: 7, fontSize: 34, fontWeight: 650, letterSpacing: -1.1 }}>
            A result must survive the sentence that announced it.
          </div>
          <div style={{ marginTop: 8, fontSize: 16, color: submission.color.muted }}>
            The first action changes provider state. A later request receives that state and recent event history.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill tone="success">State update tested</Pill>
          <Pill tone="navy">Idempotency tested</Pill>
        </div>
      </div>

      <div style={{ marginTop: 28, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 74,
            left: 88,
            right: 88,
            height: 3,
            background: submission.color.line,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 74,
            left: 88,
            width: `${(Math.min(active, 4) / 4) * 90}%`,
            maxWidth: "calc(100% - 176px)",
            height: 3,
            background: `linear-gradient(90deg, ${submission.color.terracotta}, ${submission.color.slate}, ${submission.color.navy})`,
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {stages.map((stage, index) => {
            const reached = index <= active;
            return (
              <div key={stage.title} style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    minHeight: 168,
                    padding: 18,
                    background: reached ? submission.color.white : submission.color.paperStrong,
                    borderTop: `3px solid ${reached ? stage.accent : submission.color.line}`,
                    opacity: reached ? 1 : 0.44,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <CardNumber color={stage.accent}>{String(index + 1).padStart(2, "0")}</CardNumber>
                    <LineIcon name={stage.icon} size={35} color={reached ? stage.accent : submission.color.faint} />
                  </div>
                  <div style={{ marginTop: 24, fontSize: 19, fontWeight: 660 }}>{stage.title}</div>
                  <div style={{ marginTop: 9, fontSize: 13, lineHeight: 1.4, color: submission.color.muted }}>
                    {stage.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 0.7fr 1fr",
          gap: 10,
          background: submission.color.navy,
          color: submission.color.white,
        }}
      >
        {[
          ["world.state", "reservation confirmed"],
          ["events[-1]", "ramp_reserved"],
          ["revision", "18 TO 19"],
          ["idempotency", "duplicate blocked"],
        ].map(([label, value]) => (
          <div key={label}>
            <Eyebrow color={submission.color.terracottaSoft}>{label}</Eyebrow>
            <div style={{ marginTop: 5, fontFamily: submission.font.mono, fontSize: 12, fontWeight: 700 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: "15px 17px",
            background: submission.color.successSoft,
            borderLeft: `3px solid ${submission.color.success}`,
          }}
        >
          <Eyebrow color={submission.color.success}>What is already verified</Eyebrow>
          <div style={{ marginTop: 7, fontSize: 15, lineHeight: 1.4 }}>
            Provider state updates, decision events, revision checks, PostgreSQL durability, and duplicate-action protection.
          </div>
        </div>
        <div
          style={{
            padding: "15px 17px",
            background: submission.color.warningSoft,
            borderLeft: `3px solid ${submission.color.warning}`,
          }}
        >
          <Eyebrow color={submission.color.warning}>Honest boundary</Eyebrow>
          <div style={{ marginTop: 7, fontSize: 15, lineHeight: 1.4 }}>
            A distinct semantic follow-up using that previous state is supported, but not yet measured by the evaluation harness.
          </div>
        </div>
      </div>
    </div>
  );
}

export function EvidenceChapter() {
  const frame = useCurrentFrame();
  const comparisonOpacity = interpolate(frame, [960, 1020], [1, 0.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Scene duration={EVIDENCE_DURATION}>
      <Reveal delay={2}>
        <SectionTitle
          number="07"
          title="Show the improvement against a reasonable baseline."
          description="The measured baseline uses keyword-ranked provider search, fixed pages, and modeled navigation — the basic search-and-click flow people use today."
          compact
        />
      </Reveal>

      <div style={{ opacity: comparisonOpacity }}>
        <div
          style={{
            marginTop: 31,
            display: "grid",
            gridTemplateColumns: "1.2fr 0.88fr 0.92fr",
            gap: 14,
          }}
        >
          <Reveal delay={18}>
            <BaselinePath frame={frame} />
          </Reveal>
          <Reveal delay={32}>
            <DiscoveryExample frame={frame} />
          </Reveal>
          <Reveal delay={46}>
            <CompositionExample frame={frame} />
          </Reveal>
        </div>
        <MetricRail frame={frame} />
      </div>

      {frame >= 970 ? <PersistenceEvidence frame={frame} /> : null}

      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "Our measured baseline is keyword-ranked provider search plus fixed pages, modeling the basic search-and-click flow people use today.",
          },
          {
            from: 180,
            text: "The baseline returns links and instructions for the user; our solution reasons toward an authorized, persisted outcome.",
          },
          {
            from: 360,
            text: "For blurry eyesight, lexical search looks for shared words while semantic discovery connects the request to vision assessment.",
          },
          {
            from: 540,
            text: "Across four fixed cases, relevant top-provider accuracy improved from two out of four to four out of four.",
          },
          {
            from: 720,
            text: "For a birthday venue and food, the baseline finds two providers separately; our solution combines both into one plan.",
          },
          {
            from: 900,
            text: "Modeled navigation falls from six steps to two for composition, but these are assumptions, not observed user telemetry.",
          },
          {
            from: 1080,
            text: "A persistent result means the first authorized action changes durable provider state and records a decision event.",
          },
          {
            from: 1240,
            text: "A later request receives current state and recent events, so it can explain what is already arranged without starting over.",
          },
          {
            from: 1400,
            text: "State updates and idempotency are tested; a distinct semantic follow-up is supported, but not yet measured.",
          },
        ]}
      />
    </Scene>
  );
}
