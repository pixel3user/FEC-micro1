import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { CodeBlock, type CodeLine } from "../components/CodeBlock";
import { ActBadge, PrHeader, SplitStage } from "../components/layout";
import {
  Appear,
  Backdrop,
  Caption,
  Glass,
  Window,
} from "../components/primitives";
import { Terminal, type TermLine } from "../components/Terminal";
import { theme } from "../theme";

const ACCENT = theme.color.teal;

/**
 * PR5 — Evaluation + adversarial.
 * Act 1: the question — is it actually better than a baseline?
 * Act 2: the harness (baseline vs agent) + adversarial checks.
 * Act 3: the real results table and adversarial pass summary.
 */
export function Pr5() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Backdrop />
      <PrHeader tag="PR5" title="Evaluation + adversarial" accent={ACCENT} />

      <Sequence durationInFrames={140}>
        <ProblemAct />
      </Sequence>
      <Sequence from={140} durationInFrames={220}>
        <CodeAct />
      </Sequence>
      <Sequence from={360} durationInFrames={260}>
        <ProofAct />
      </Sequence>
    </div>
  );
}

function ProblemAct() {
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={1} label="The question" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 200px",
        }}
      >
        <Appear delay={6}>
          <h2
            style={{
              fontFamily: theme.font.sans,
              fontSize: 62,
              fontWeight: 800,
              letterSpacing: -1.5,
              color: theme.color.ink,
              textAlign: "center",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Is the agent path actually better than a baseline —
            <span style={{ color: theme.color.muted }}>
              {" "}
              and can it be gamed?
            </span>
          </h2>
        </Appear>
      </div>
      <Caption
        delay={16}
        text="Claims need a fair baseline and evidence. So does safety."
      />
    </>
  );
}

function CodeAct() {
  const harness: CodeLine[] = [
    { text: "// eval/harness.ts — simplified" },
    { text: "for (const c of cases) {" },
    { text: "  baseline: keywordSearch(c.intent);", spot: true },
    { text: "  agent:    blendedSearch(c.intent);", spot: true },
    { text: "  measure(topHit, uiRate, steps," },
    { text: "          multiProviderCoverage);" },
    { text: "}" },
  ];
  const adversarial: CodeLine[] = [
    { text: "// adversarial.test.ts — simplified" },
    { text: "injection can't escape the decision", spot: true },
    { text: "cross-world writes are isolated", spot: true },
    { text: "concurrent invokes get distinct revs", spot: true },
    { text: "hostile args can't clobber other worlds" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={2} label="How it's measured" accent={ACCENT} />
      </div>
      <SplitStage
        left={
          <Appear delay={6} style={{ height: "100%" }}>
            <Window
              title="baseline vs agent"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={harness}
                startReveal={12}
                perLine={7}
                fontSize={25}
              />
            </Window>
          </Appear>
        }
        right={
          <Appear delay={12} style={{ height: "100%" }}>
            <Window
              title="adversarial checks"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={adversarial}
                startReveal={58}
                perLine={9}
                fontSize={25}
              />
            </Window>
          </Appear>
        }
      />
      <Caption
        delay={10}
        text="A fixed keyword baseline runs the same cases as the agent; adversarial tests probe injection, isolation, and concurrency."
      />
    </>
  );
}

const ROWS = [
  { metric: "Discovery top-hit", base: "0.50", agent: "1.00", win: true },
  { metric: "Task-specific UI", base: "0.00", agent: "1.00", win: true },
  { metric: "Avg user steps", base: "3.75", agent: "2.00", win: true },
  { metric: "Compose providers", base: "no", agent: "yes", win: true },
];

function ProofAct() {
  const frame = useCurrentFrame();
  const adv: TermLine[] = [
    { text: "adversarial.test.ts", prompt: true, tone: "muted" },
    { text: "injection contained        [pass]", tone: "good" },
    { text: "cross-world isolation      [pass]", tone: "good" },
    { text: "concurrency serialized     [pass]", tone: "good" },
    { text: "full eval live cost ~ $0.005", tone: "json" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={3} label="The results" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 90,
          right: 90,
          display: "grid",
          gridTemplateColumns: "1.25fr 0.75fr",
          gap: 32,
        }}
      >
        <Appear delay={6}>
          <Glass strong style={{ padding: "10px 20px 20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 1fr",
                fontFamily: theme.font.mono,
                fontSize: 22,
                color: theme.color.muted,
                padding: "18px 10px 14px",
                borderBottom: `1px solid ${theme.color.line}`,
              }}
            >
              <span>metric</span>
              <span style={{ textAlign: "right" }}>baseline</span>
              <span style={{ textAlign: "right" }}>agent</span>
            </div>
            {ROWS.map((row, index) => {
              const at = 16 + index * 14;
              const op = interpolate(frame, [at, at + 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={row.metric}
                  style={{
                    opacity: op,
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr 1fr",
                    alignItems: "center",
                    padding: "18px 10px",
                    borderBottom:
                      index === ROWS.length - 1
                        ? "none"
                        : `1px solid ${theme.color.line}`,
                    fontFamily: theme.font.sans,
                    fontSize: 27,
                  }}
                >
                  <span style={{ color: theme.color.ink, fontWeight: 600 }}>
                    {row.metric}
                  </span>
                  <span
                    style={{
                      textAlign: "right",
                      fontFamily: theme.font.mono,
                      color: theme.color.muted,
                    }}
                  >
                    {row.base}
                  </span>
                  <span
                    style={{
                      textAlign: "right",
                      fontFamily: theme.font.mono,
                      fontWeight: 700,
                      color: theme.color.green,
                    }}
                  >
                    {row.agent}
                  </span>
                </div>
              );
            })}
          </Glass>
        </Appear>
        <Appear delay={20}>
          <Window title="adversarial" accent={theme.color.green}>
            <Terminal lines={adv} startReveal={90} perLine={14} fontSize={23} />
          </Window>
        </Appear>
      </div>
      <Caption
        delay={26}
        text="Live: the agent wins every metric on the same data, all adversarial checks pass, and the whole evaluation costs about half a cent."
      />
    </>
  );
}
