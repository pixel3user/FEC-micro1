import { Sequence } from "remotion";
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
import { Timeline, type TimelineStep } from "../components/Timeline";
import { theme } from "../theme";

const ACCENT = theme.color.violet;

/**
 * PR2 — Self-healing generated UI.
 * Act 1: a generated interface throws a real runtime error in the sandbox.
 * Act 2: condensed error capture (bridge) + repair regeneration (service).
 * Act 3: the real captured repair (broken -> valid doc, ~44s, ~$0.0003).
 */
export function Pr2() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Backdrop />
      <PrHeader tag="PR2" title="Self-healing generated UI" accent={ACCENT} />

      <Sequence durationInFrames={150}>
        <ProblemAct />
      </Sequence>
      <Sequence from={150} durationInFrames={230}>
        <CodeAct />
      </Sequence>
      <Sequence from={380} durationInFrames={230}>
        <ProofAct />
      </Sequence>
    </div>
  );
}

function ProblemAct() {
  const err: TermLine[] = [
    { text: "// inside the sandboxed iframe", tone: "muted" },
    { text: "const items = data.results;", tone: "plain" },
    { text: "items.map(r => render(r));", tone: "plain" },
    { text: "Uncaught TypeError: Cannot read", tone: "bad" },
    { text: "properties of undefined (reading 'map')", tone: "bad" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={1} label="The problem" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 90,
          right: 90,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          alignItems: "center",
        }}
      >
        <Appear delay={6}>
          <h2
            style={{
              fontFamily: theme.font.sans,
              fontSize: 46,
              fontWeight: 700,
              color: theme.color.ink,
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            The model writes fresh UI every time.
            <span style={{ color: theme.color.muted, fontWeight: 500 }}>
              {" "}
              Sometimes it throws at runtime — and the user is stuck on a broken
              screen.
            </span>
          </h2>
        </Appear>
        <Appear delay={14}>
          <Window title="generated experience" accent={theme.color.red}>
            <Terminal lines={err} startReveal={20} perLine={14} />
          </Window>
        </Appear>
      </div>
      <Caption
        delay={20}
        text="A single-shot generator with no recovery leaves a dead end."
      />
    </>
  );
}

function CodeAct() {
  const bridge: CodeLine[] = [
    { text: "// bridge.ts (in-sandbox) — simplified" },
    { text: "window.onerror = (msg) =>", spot: true },
    { text: "  post({ type: 'runtime-error', msg });", spot: true },
    { text: "window.onunhandledrejection = (e) =>" },
    { text: "  post({ type: 'runtime-error'," },
    { text: "         msg: e.reason });" },
  ];
  const repair: CodeLine[] = [
    { text: "// service.repairExperience — simplified" },
    { text: "const prev = latestExperience(sessionId);" },
    { text: "const fixed = await model.repairUi({", spot: true },
    { text: "  previousHtml: prev.html," },
    { text: "  error,               // the captured message", spot: true },
    { text: "  worlds, intent," },
    { text: "});" },
    { text: "return save(fixed);   // swap into the sandbox", spot: true },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={2} label="The implementation" accent={ACCENT} />
      </div>
      <SplitStage
        left={
          <Appear delay={6} style={{ height: "100%" }}>
            <Window
              title="sandbox captures the error"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={bridge}
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
              title="model regenerates a fix"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={repair}
                startReveal={58}
                perLine={7}
                fontSize={25}
              />
            </Window>
          </Appear>
        }
      />
      <Caption
        delay={10}
        text="The sandbox reports the error to the host; the host sends the broken HTML plus the error back to the model, which returns a corrected document."
      />
    </>
  );
}

function ProofAct() {
  const steps: TimelineStep[] = [
    { label: "Error", sub: "TypeError", color: theme.color.red },
    { label: "Regenerate", sub: "model.repairUi", color: theme.color.amber },
    { label: "Healed", sub: "valid document", color: theme.color.green },
  ];
  const log: TermLine[] = [
    { text: "sandbox -> host: runtime-error", tone: "warn" },
    { text: "POST /v1/experiences/repair", prompt: true, tone: "muted" },
    { text: "model.repairUi -> <!doctype html> ... [ok]", tone: "good" },
    { text: '{"purpose":"runtime-ui-repair","cost":0.0003}', tone: "json" },
    { text: "healed in ~44s  ·  document valid", tone: "good" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={3} label="Proof it works" accent={ACCENT} />
      </div>
      <div style={{ position: "absolute", top: 210, left: 120, right: 120 }}>
        <Appear delay={6}>
          <Timeline steps={steps} startReveal={16} perStep={26} />
        </Appear>
      </div>
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 90,
          right: 90,
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 32,
        }}
      >
        <Appear delay={30}>
          <Window title="live repair" accent={theme.color.green}>
            <Terminal lines={log} startReveal={90} perLine={16} fontSize={25} />
          </Window>
        </Appear>
        <Appear delay={40}>
          <Glass strong style={{ padding: "30px 34px" }}>
            <Stat label="Recovery" value="automatic" />
            <Stat label="Repair time" value="~44s" />
            <Stat label="Repair cost" value="$0.0003" />
            <Stat label="Result" value="valid doc" last />
          </Glass>
        </Appear>
      </div>
      <Caption
        delay={20}
        text="Real run: a broken generation becomes a valid document — the interface heals itself instead of dead-ending."
      />
    </>
  );
}

function Stat({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "18px 0",
        borderBottom: last ? "none" : `1px solid ${theme.color.line}`,
      }}
    >
      <span
        style={{
          fontFamily: theme.font.sans,
          fontSize: 26,
          color: theme.color.muted,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: theme.font.mono,
          fontSize: 28,
          fontWeight: 700,
          color: theme.color.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}
