import { Sequence } from "remotion";
import { ActBadge, PrHeader } from "../components/layout";
import { Appear, Backdrop, Caption, Glass } from "../components/primitives";
import { Terminal, type TermLine } from "../components/Terminal";
import { Timeline, type TimelineStep } from "../components/Timeline";
import { theme } from "../theme";

const ACCENT = theme.color.blue;

/**
 * Workflow — the full end-to-end narrative showing how the five PRs combine
 * in practice: a provider publishes by chat, a consumer's intent is resolved,
 * a UI is generated, an invented action is decided, and state persists.
 */
export function Workflow() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Backdrop />
      <PrHeader tag="FLOW" title="End-to-end in practice" accent={ACCENT} />

      <Sequence durationInFrames={170}>
        <ProviderAct />
      </Sequence>
      <Sequence from={170} durationInFrames={200}>
        <ConsumerAct />
      </Sequence>
      <Sequence from={370} durationInFrames={220}>
        <OutcomeAct />
      </Sequence>
    </div>
  );
}

function ProviderAct() {
  const chat: TermLine[] = [
    { text: 'provider: "I run a bike-repair co-op.', tone: "plain" },
    { text: "  We fix commuter bikes and take", tone: "plain" },
    { text: '  unusual custom requests."', tone: "plain" },
    { text: "agent: built a world + capabilities", tone: "good" },
    { text: "published -> indexed + embedded", tone: "good" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={1} label="A provider publishes" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 220,
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
            No forms, no schema.
            <span style={{ color: theme.color.muted, fontWeight: 500 }}>
              {" "}
              A provider describes a service in plain language and the agent
              builds a publishable world.
            </span>
          </h2>
        </Appear>
        <Appear delay={14}>
          <Glass strong style={{ padding: "26px 30px" }}>
            <Terminal
              lines={chat}
              startReveal={20}
              perLine={16}
              fontSize={25}
            />
          </Glass>
        </Appear>
      </div>
      <Caption
        delay={22}
        text="PR1 hardens the model call behind this intake."
      />
    </>
  );
}

function ConsumerAct() {
  const steps: TimelineStep[] = [
    { label: "Intent", sub: '"fix my bike"', color: theme.color.blue },
    { label: "Discover", sub: "semantic (PR3)", color: theme.color.green },
    { label: "Generate", sub: "fresh UI (PR1)", color: theme.color.violet },
    { label: "Invoke", sub: "invented action", color: theme.color.amber },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={2} label="A consumer arrives" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 160,
          left: 120,
          right: 120,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Appear delay={6} style={{ width: "100%" }}>
          <Timeline steps={steps} startReveal={16} perStep={26} />
        </Appear>
      </div>
      <Caption
        delay={20}
        text="Intent resolves to a provider, the model writes an interface, and it invents whatever action the task needs — self-healing if it breaks (PR2)."
      />
    </>
  );
}

function OutcomeAct() {
  const log: TermLine[] = [
    { text: "agent.invoke({ action:", tone: "muted" },
    { text: "  'reserve a same-day tune-up slot' })", tone: "plain" },
    { text: "provider agent decides -> accepted", tone: "good" },
    { text: "decision persisted as world state", tone: "good" },
    { text: "next visit sees this as ground truth", tone: "good" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge
          index={3}
          label="The decision becomes truth"
          accent={ACCENT}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 90,
          right: 90,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          alignItems: "center",
        }}
      >
        <Appear delay={6}>
          <Glass strong style={{ padding: "26px 30px" }}>
            <Terminal lines={log} startReveal={16} perLine={16} fontSize={25} />
          </Glass>
        </Appear>
        <Appear delay={16}>
          <div>
            <h2
              style={{
                fontFamily: theme.font.sans,
                fontSize: 44,
                fontWeight: 700,
                color: theme.color.ink,
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              The agent's decision is recorded as the world's state —
              <span style={{ color: theme.color.muted, fontWeight: 500 }}>
                {" "}
                and PR5 proves the whole path beats a baseline, safely.
              </span>
            </h2>
          </div>
        </Appear>
      </div>
      <Caption
        delay={24}
        text="Providers publish meaning; agents generate the interface and the actions — the agent-native web, end to end."
      />
    </>
  );
}
