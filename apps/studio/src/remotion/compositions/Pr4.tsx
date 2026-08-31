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

const ACCENT = theme.color.amber;

/**
 * PR4 — Multi-provider composition.
 * Act 1: one intent spans providers no single site coordinates.
 * Act 2: planComposition + one generated UI that orchestrates all worlds.
 * Act 3: real live proof — a two-step plan and a UI referencing both worlds.
 */
export function Pr4() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Backdrop />
      <PrHeader tag="PR4" title="Multi-provider composition" accent={ACCENT} />

      <Sequence durationInFrames={150}>
        <ProblemAct />
      </Sequence>
      <Sequence from={150} durationInFrames={230}>
        <CodeAct />
      </Sequence>
      <Sequence from={380} durationInFrames={240}>
        <ProofAct />
      </Sequence>
    </div>
  );
}

function ProblemAct() {
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={1} label="The problem" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 90,
          right: 90,
          display: "flex",
          flexDirection: "column",
          gap: 34,
        }}
      >
        <Appear delay={6}>
          <h2
            style={{
              fontFamily: theme.font.sans,
              fontSize: 48,
              fontWeight: 700,
              color: theme.color.ink,
              lineHeight: 1.25,
              margin: 0,
              maxWidth: 1400,
            }}
          >
            “Plan a gathering: find a venue and arrange catering.”
            <span style={{ color: theme.color.muted, fontWeight: 500 }}>
              {" "}
              No single website coordinates two independent providers.
            </span>
          </h2>
        </Appear>
        <div style={{ display: "flex", gap: 24 }}>
          <Appear delay={16}>
            <Glass style={{ padding: "26px 30px", width: 520 }}>
              <div
                style={{
                  fontFamily: theme.font.sans,
                  fontSize: 30,
                  fontWeight: 700,
                  color: theme.color.ink,
                }}
              >
                Hall Finder
              </div>
              <div
                style={{
                  fontFamily: theme.font.sans,
                  fontSize: 24,
                  color: theme.color.muted,
                  marginTop: 8,
                }}
              >
                venues + availability
              </div>
            </Glass>
          </Appear>
          <Appear delay={24}>
            <Glass style={{ padding: "26px 30px", width: 520 }}>
              <div
                style={{
                  fontFamily: theme.font.sans,
                  fontSize: 30,
                  fontWeight: 700,
                  color: theme.color.ink,
                }}
              >
                Feast Collective
              </div>
              <div
                style={{
                  fontFamily: theme.font.sans,
                  fontSize: 24,
                  color: theme.color.muted,
                  marginTop: 8,
                }}
              >
                catering + menu
              </div>
            </Glass>
          </Appear>
        </div>
      </div>
      <Caption
        delay={20}
        text="Cross-provider coordination is the thing the traditional web can't assemble on demand."
      />
    </>
  );
}

function CodeAct() {
  const plan: CodeLine[] = [
    { text: "// service.compose — simplified" },
    { text: "const worlds = discover(intent);" },
    { text: "const plan = await model.planComposition({", spot: true },
    { text: "  intent, worlds,   // roles + dependsOn" },
    { text: "});" },
    { text: "// keep only worlds the plan references" },
    { text: "const used = worlds.filter(inPlan);", spot: true },
  ];
  const ui: CodeLine[] = [
    { text: "// one UI orchestrates every world" },
    { text: "const html = await model.generateCompositionUi({", spot: true },
    { text: "  intent, plan, worlds: used," },
    { text: "});" },
    { text: "// same generic bridge, many worlds:" },
    { text: "agent.invoke({ worldId, action, args });", spot: true },
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
              title="plan across providers"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={plan}
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
              title="one orchestrating UI"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={ui}
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
        text="The model plans which world plays which role, then generates one interface that drives all of them through the same generic invoke bridge."
      />
    </>
  );
}

function ProofAct() {
  const steps: TimelineStep[] = [
    { label: "Discover", sub: "2 worlds", color: theme.color.blue },
    { label: "Plan", sub: "roles + order", color: theme.color.amber },
    { label: "Generate", sub: "one UI", color: theme.color.green },
  ];
  const log: TermLine[] = [
    { text: "POST /v1/compose", prompt: true, tone: "muted" },
    { text: "plan.steps = 2  (venue -> catering)", tone: "good" },
    { text: "html references both worldIds  [ok]", tone: "good" },
    { text: '{"purpose":"composition-ui","cost":0.00036}', tone: "json" },
    { text: "one intent -> one interface -> two providers", tone: "good" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={3} label="Proof it works" accent={ACCENT} />
      </div>
      <div style={{ position: "absolute", top: 210, left: 120, right: 120 }}>
        <Appear delay={6}>
          <Timeline steps={steps} startReveal={16} perStep={24} />
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
          <Window title="live composition" accent={theme.color.green}>
            <Terminal lines={log} startReveal={84} perLine={16} fontSize={25} />
          </Window>
        </Appear>
        <Appear delay={40}>
          <Glass strong style={{ padding: "30px 34px" }}>
            <Stat label="Providers" value="2 in one flow" />
            <Stat label="Plan steps" value="venue -> catering" />
            <Stat label="Compose cost" value="$0.00036" />
            <Stat label="Interface" value="single UI" last />
          </Glass>
        </Appear>
      </div>
      <Caption
        delay={20}
        text="Real run: a two-step plan and one generated interface driving both providers — coordination no single site offers."
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
