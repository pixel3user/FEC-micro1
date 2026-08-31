import { interpolate, useCurrentFrame } from "remotion";
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

const CHANGELOG_DURATION = 1260;

type Experiment = {
  number: string;
  title: string;
  tried: string;
  result: string;
  decision: string;
  status: "FOUNDATION" | "REPLACED" | "RETAINED" | "CURRENT BRIDGE";
  accent: string;
};

const experiments: Experiment[] = [
  {
    number: "00",
    title: "Simple baseline",
    tried: "A route, form, branches, provider handlers, and result view for each expected journey.",
    result: "Every new outcome adds another implementation and maintenance path.",
    decision: "Try one shared runtime instead of one workflow per task.",
    status: "FOUNDATION",
    accent: submission.color.terracotta,
  },
  {
    number: "01",
    title: "Shared generative runtime",
    tried: "Generate a fresh experience and accept arbitrary model-defined actions through one invoke bridge.",
    result: "Different intents reuse the same platform shell with no checked-in per-intent screens.",
    decision: "Keep the runtime; harden its model boundary.",
    status: "RETAINED",
    accent: submission.color.slate,
  },
  {
    number: "02",
    title: "Reliable output + repair",
    tried: "Schema validation, balanced JSON extraction, fallback models, browser error capture, and regeneration.",
    result: "Malformed-output and repair cases became deterministic tests.",
    decision: "Replace direct parsing and non-repairing generated UI.",
    status: "REPLACED",
    accent: submission.color.warning,
  },
  {
    number: "03",
    title: "Semantic discovery",
    tried: "Blend semantic similarity with lexical ranking while preserving lexical fallback.",
    result: "Relevant top result improved from 2/4 to 4/4 in the documented live run.",
    decision: "Keep semantic retrieval as a supporting capability.",
    status: "RETAINED",
    accent: submission.color.terracotta,
  },
  {
    number: "04",
    title: "Multi-service composition",
    tried: "Plan roles and dependencies across providers, then generate one combined experience.",
    result: "Two separate services became one tested plan and one user-facing experience.",
    decision: "Keep composition; separate planning evidence from execution claims.",
    status: "RETAINED",
    accent: submission.color.slate,
  },
  {
    number: "05",
    title: "Typed, persistent outcomes",
    tried: "Typed status, structured display, optional next view, state events, revisions, and idempotency.",
    result: "Removed free-text success guessing after “Purchase failed: Purchased.”",
    decision: "Keep typed decisions and deterministic persistence boundaries.",
    status: "REPLACED",
    accent: submission.color.warning,
  },
  {
    number: "06",
    title: "Evaluate, then move beyond UI",
    tried: "Compare four fixed intents and label live, structural, modeled, and tested evidence separately.",
    result: "The shared runtime generated 4/4 experiences; semantic search was only one contributor.",
    decision: "Keep generated UI as today’s bridge; pursue direct verified results next.",
    status: "CURRENT BRIDGE",
    accent: submission.color.navy,
  },
];

function statusTone(status: Experiment["status"]): "rust" | "slate" | "success" | "navy" {
  if (status === "FOUNDATION") return "rust";
  if (status === "REPLACED") return "rust";
  if (status === "CURRENT BRIDGE") return "navy";
  return "success";
}

function ExperimentCard({
  experiment,
  index,
  active,
}: {
  experiment: Experiment;
  index: number;
  active: number;
}) {
  const reached = index <= active;
  const current = index === active;
  return (
    <EditorialCard
      accent={reached ? experiment.accent : submission.color.line}
      style={{
        height: 268,
        padding: 17,
        display: "flex",
        flexDirection: "column",
        background: current ? submission.color.white : submission.color.paper,
        opacity: reached ? 1 : 0.38,
        transform: `translateY(${current ? -5 : 0}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <CardNumber color={reached ? experiment.accent : submission.color.faint}>
          {experiment.number}
        </CardNumber>
        <Pill
          tone={statusTone(experiment.status)}
          style={{ fontSize: 7, padding: "4px 6px", whiteSpace: "nowrap" }}
        >
          {experiment.status}
        </Pill>
      </div>
      <div style={{ marginTop: 12, fontSize: 18, fontWeight: 680, lineHeight: 1.12 }}>
        {experiment.title}
      </div>
      <div style={{ marginTop: 11, display: "grid", gap: 7 }}>
        <div>
          <Eyebrow color={experiment.accent} style={{ fontSize: 8, letterSpacing: 1.4 }}>
            Tried · why
          </Eyebrow>
          <div style={{ marginTop: 2, fontSize: 10, lineHeight: 1.3, color: submission.color.inkSoft }}>
            {experiment.tried}
          </div>
        </div>
        <div>
          <Eyebrow color={submission.color.success} style={{ fontSize: 8, letterSpacing: 1.4 }}>
            Result
          </Eyebrow>
          <div style={{ marginTop: 2, fontSize: 10, lineHeight: 1.3, color: submission.color.inkSoft }}>
            {experiment.result}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: "auto",
          paddingTop: 7,
          borderTop: `1px solid ${submission.color.line}`,
          fontFamily: submission.font.mono,
          fontSize: 8,
          lineHeight: 1.25,
          color: submission.color.muted,
        }}
      >
        NEXT · {experiment.decision}
      </div>
    </EditorialCard>
  );
}

export function ImprovementChangelog() {
  const frame = useCurrentFrame();
  const active = Math.min(experiments.length - 1, Math.max(0, Math.floor(frame / 180)));
  const progress = interpolate(frame, [0, CHANGELOG_DURATION - 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Scene duration={CHANGELOG_DURATION}>
      <Reveal delay={2}>
        <SectionTitle
          number="08"
          title="The changelog explains where the final improvement came from."
          description="Each experiment changed one failure mode, kept the useful part, and made the next comparison more meaningful. Superseded approaches remain visible because they taught us what the system needed."
          compact
        />
      </Reveal>

      <div style={{ marginTop: 26, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 38,
            right: 38,
            top: 19,
            height: 3,
            background: submission.color.line,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 38,
            top: 19,
            width: `calc((100% - 76px) * ${progress})`,
            height: 3,
            background: `linear-gradient(90deg, ${submission.color.terracotta}, ${submission.color.slate}, ${submission.color.navy})`,
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 9 }}>
          {experiments.map((experiment, index) => (
            <div key={experiment.number} style={{ position: "relative", paddingTop: 38 }}>
              <div
                style={{
                  position: "absolute",
                  zIndex: 2,
                  top: 11,
                  left: "50%",
                  width: 17,
                  height: 17,
                  transform: "translateX(-50%)",
                  background: index <= active ? experiment.accent : submission.color.paperStrong,
                  border: `4px solid ${submission.color.canvas}`,
                  outline: `1px solid ${index <= active ? experiment.accent : submission.color.line}`,
                }}
              />
              <ExperimentCard experiment={experiment} index={index} active={active} />
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 13,
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr",
          gap: 10,
        }}
      >
        <div style={{ padding: "14px 16px", background: submission.color.navy, color: submission.color.white }}>
          <Eyebrow color={submission.color.terracottaSoft}>Overall improvement</Eyebrow>
          <div style={{ marginTop: 6, fontSize: 16, fontWeight: 650 }}>
            One shared runtime generated experiences for 4/4 fixed intents.
          </div>
        </div>
        <div style={{ padding: "14px 16px", background: submission.color.successSoft, borderLeft: `3px solid ${submission.color.success}` }}>
          <Eyebrow color={submission.color.success}>What stayed deterministic</Eyebrow>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.35 }}>
            Identity, permission, validation, storage, transport, and execution.
          </div>
        </div>
        <div style={{ padding: "14px 16px", background: submission.color.warningSoft, borderLeft: `3px solid ${submission.color.warning}` }}>
          <Eyebrow color={submission.color.warning}>What remains next</Eyebrow>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.35 }}>
            Measure verified task completion and return results without the generated UI bridge.
          </div>
        </div>
      </div>

      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "We started from the simple baseline: every expected journey needs its own route, form, branches, integrations, and result view.",
          },
          {
            from: 180,
            text: "The first experiment replaced those per-intent screens with one shared runtime, generated experiences, and a generic action bridge.",
          },
          {
            from: 360,
            text: "Malformed model output and browser failures taught us to replace direct parsing with validation, fallback, error capture, and repair.",
          },
          {
            from: 540,
            text: "Semantic discovery fixed vocabulary mismatch, improving relevant top-provider ranking from two of four to four of four fixed cases.",
          },
          {
            from: 720,
            text: "Composition then combined two separate services into one tested plan and one user-facing experience.",
          },
          {
            from: 900,
            text: "A contradictory purchase message led us to replace free-text success guessing with typed decisions, state events, and idempotency.",
          },
          {
            from: 1080,
            text: "The final evaluation shows the overall gain and its limits: generated UI is today’s bridge, while direct verified results are the next experiment.",
          },
        ]}
      />
    </Scene>
  );
}
