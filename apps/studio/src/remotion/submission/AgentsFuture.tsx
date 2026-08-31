import { interpolate, useCurrentFrame } from "remotion";
import type { IconName } from "./Icons";
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

const capabilities: Array<{
  n: string;
  title: string;
  detail: string;
  icon: IconName;
}> = [
  { n: "01", title: "Understand intent", detail: "Outcome, not keywords", icon: "intent" },
  { n: "02", title: "Discover by meaning", detail: "Capabilities, not pages", icon: "search" },
  { n: "03", title: "Read live state", detail: "Current provider reality", icon: "state" },
  { n: "04", title: "Request context", detail: "Only what is missing", icon: "question" },
  { n: "05", title: "Choose the action", detail: "Invent name + arguments", icon: "spark" },
  { n: "06", title: "Compose providers", detail: "One cross-service plan", icon: "compose" },
  { n: "07", title: "Act with consent", detail: "Authorized operations", icon: "lock" },
  { n: "08", title: "Generate the result", detail: "Direct useful output", icon: "result" },
];

function IntentPanel() {
  return (
    <EditorialCard
      accent={submission.color.terracotta}
      style={{ height: 520, padding: 24 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <CardNumber>UNSTRUCTURED REQUEST</CardNumber>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 650 }}>
            The user describes the outcome
          </div>
        </div>
        <LineIcon name="intent" size={42} color={submission.color.terracotta} />
      </div>
      <div
        style={{
          marginTop: 20,
          padding: "16px 18px",
          background: submission.color.white,
          borderLeft: `3px solid ${submission.color.terracotta}`,
          fontSize: 20,
          lineHeight: 1.35,
          fontWeight: 580,
          letterSpacing: -0.4,
        }}
      >
        “Arrange the best outcome for me. Keep my constraints, ask before commitment, and explain what changed.”
      </div>
      <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
        {[
          ["INPUT", "Natural language"],
          ["CONTEXT", "Images · history · state"],
          ["BOUNDARY", "Consent · budget · policy"],
        ].map(([label, value], index) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "116px 1fr",
              columnGap: 12,
              alignItems: "center",
              minHeight: 40,
              padding: "6px 11px",
              background: index % 2 ? "rgba(255,255,255,0.4)" : submission.color.white,
            }}
          >
            <Eyebrow
              color={submission.color.terracotta}
              style={{ fontSize: 11, letterSpacing: 2.4 }}
            >
              {label}
            </Eyebrow>
            <div
              style={{
                paddingLeft: 4,
                fontSize: 15,
                color: submission.color.inkSoft,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 22,
          paddingTop: 14,
          borderTop: `1px solid ${submission.color.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Eyebrow>User learns no interface</Eyebrow>
        <Pill tone="rust">One request</Pill>
      </div>
    </EditorialCard>
  );
}

function CapabilityMatrix({ frame }: { frame: number }) {
  const active = Math.min(
    capabilities.length - 1,
    Math.max(0, Math.floor((frame - 70) / 78)),
  );
  return (
    <EditorialCard
      accent={submission.color.slate}
      style={{ height: 520, padding: 20 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <CardNumber color={submission.color.slate}>THE AGENT IS THE REASONING LAYER</CardNumber>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 650 }}>
            The workflow is selected at runtime
          </div>
        </div>
        <Pill tone="slate">{active + 1}/8</Pill>
      </div>
      <div
        style={{
          marginTop: 19,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        {capabilities.map((capability, index) => {
          const reached = index <= active;
          const current = index === active;
          return (
            <div
              key={capability.n}
              style={{
                minHeight: 91,
                padding: "11px 13px",
                display: "grid",
                gridTemplateColumns: "32px 39px 1fr",
                alignItems: "center",
                gap: 9,
                background: current
                  ? submission.color.slateSoft
                  : reached
                    ? submission.color.white
                    : "rgba(255,255,255,0.3)",
                borderTop: `2px solid ${current ? submission.color.slate : reached ? submission.color.success : submission.color.line}`,
                opacity: reached ? 1 : 0.4,
              }}
            >
              <CardNumber color={current ? submission.color.slate : submission.color.faint}>
                {capability.n}
              </CardNumber>
              <LineIcon
                name={capability.icon}
                size={30}
                color={current ? submission.color.slate : reached ? submission.color.success : submission.color.faint}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 660, lineHeight: 1.2 }}>
                  {capability.title}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: submission.color.muted }}>
                  {capability.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </EditorialCard>
  );
}

function GenerativeResult({ frame }: { frame: number }) {
  const wave = Array.from({ length: 18 }, (_, index) => {
    const height = 8 + Math.abs(Math.sin(index * 1.9 + frame / 9)) * 28;
    return height;
  });
  const reveal = interpolate(frame, [470, 540], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <EditorialCard
      accent={submission.color.navy}
      style={{ height: 520, padding: 22, background: submission.color.navy, color: submission.color.white }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <CardNumber color={submission.color.terracottaSoft}>DIRECT GENERATIVE OUTPUT</CardNumber>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 650 }}>
            The result, not another app
          </div>
        </div>
        <LineIcon name="result" size={39} color={submission.color.white} />
      </div>

      <div
        style={{
          marginTop: 23,
          height: 170,
          position: "relative",
          overflow: "hidden",
          background: submission.color.paperStrong,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(145deg, rgba(183,120,108,0.42), transparent 46%), linear-gradient(330deg, rgba(111,130,148,0.52), transparent 50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 26,
            top: 24,
            width: 150,
            height: 112,
            border: `2px solid ${submission.color.navy}`,
            transform: "rotate(-2deg)",
          }}
        >
          <div style={{ position: "absolute", left: 12, right: 12, top: 18, height: 2, background: submission.color.slate }} />
          <div style={{ position: "absolute", left: 12, width: 85, top: 37, height: 7, background: submission.color.terracotta }} />
          <div style={{ position: "absolute", left: 12, right: 28, top: 57, height: 5, background: submission.color.faint }} />
          <div style={{ position: "absolute", left: 12, right: 18, top: 73, height: 5, background: submission.color.faint }} />
        </div>
        <div style={{ position: "absolute", left: 198, top: 24, right: 20 }}>
          <Eyebrow color={submission.color.navy}>Generated visual explanation</Eyebrow>
          <div style={{ marginTop: 13, color: submission.color.ink, fontSize: 18, lineHeight: 1.35, fontWeight: 620 }}>
            A result shaped for this request — text, image, audio, video, or a combination.
          </div>
          <div style={{ marginTop: 17, display: "flex", alignItems: "center", gap: 3, height: 38 }}>
            {wave.map((height, index) => (
              <div
                key={index}
                style={{
                  width: 4,
                  height,
                  background: index % 3 === 0 ? submission.color.terracotta : submission.color.slate,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 8, opacity: reveal }}>
        {[
          ["DECISION", "The requested outcome is ready."],
          ["ACTIONS", "3 authorized operations completed."],
          ["STATE", "Provider state verified after execution."],
        ].map(([label, value], index) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "110px 1fr",
              alignItems: "center",
              minHeight: 48,
              padding: "8px 11px",
              background: index === 0 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.075)",
              borderLeft: `2px solid ${index === 0 ? submission.color.terracotta : "rgba(255,255,255,0.2)"}`,
            }}
          >
            <Eyebrow
              color={index === 0 ? submission.color.terracottaSoft : "rgba(255,255,255,0.46)"}
              style={{ fontSize: 10, letterSpacing: 2 }}
            >
              {label}
            </Eyebrow>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.74)" }}>{value}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 23,
          left: 22,
          right: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 13,
          borderTop: "1px solid rgba(255,255,255,0.16)",
        }}
      >
        <Eyebrow color="rgba(255,255,255,0.48)">Permanent interface</Eyebrow>
        <div style={{ fontFamily: submission.font.mono, color: submission.color.terracottaSoft, fontSize: 16, fontWeight: 700 }}>
          NONE
        </div>
      </div>
    </EditorialCard>
  );
}

export function AgentsChapter() {
  const frame = useCurrentFrame();
  const traceProgress = interpolate(frame, [150, 700], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const trace = ["UNDERSTAND", "DISCOVER", "COMPOSE", "CONFIRM", "INVOKE", "VERIFY", "GENERATE"];
  return (
    <Scene duration={900}>
      <Reveal delay={2}>
        <SectionTitle
          number="05"
          title="The agent becomes the reasoning layer."
          description="Actions are not limited to predefined buttons or forms. The model decides what is required from the request, context, capabilities, and consent."
          compact
        />
      </Reveal>
      <div
        style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "0.78fr 1.4fr 0.92fr",
          gap: 15,
        }}
      >
        <Reveal delay={24}>
          <IntentPanel />
        </Reveal>
        <Reveal delay={39}>
          <CapabilityMatrix frame={frame} />
        </Reveal>
        <Reveal delay={54}>
          <GenerativeResult frame={frame} />
        </Reveal>
      </div>

      <Reveal delay={95}>
        <div
          style={{
            marginTop: 14,
            height: 72,
            display: "grid",
            gridTemplateColumns: "155px 1fr",
            background: submission.color.paperStrong,
            borderTop: `3px solid ${submission.color.slate}`,
          }}
        >
          <div
            style={{
              padding: "15px 18px",
              borderRight: `1px solid ${submission.color.line}`,
            }}
          >
            <Eyebrow color={submission.color.slate}>Chosen trace</Eyebrow>
            <div style={{ marginTop: 5, fontSize: 13, color: submission.color.muted }}>
              invented at runtime
            </div>
          </div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", alignItems: "center" }}>
            <div
              style={{
                position: "absolute",
                left: 42,
                right: 42,
                top: 34,
                height: 2,
                background: submission.color.line,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 42,
                top: 34,
                height: 2,
                width: `calc((100% - 84px) * ${traceProgress})`,
                background: submission.color.slate,
              }}
            />
            {trace.map((label, index) => {
              const reached = traceProgress >= index / (trace.length - 1);
              return (
                <div key={label} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      margin: "0 auto 8px",
                      background: reached ? submission.color.slate : submission.color.paperStrong,
                      border: `2px solid ${reached ? submission.color.slate : submission.color.line}`,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: submission.font.mono,
                      fontSize: 9,
                      letterSpacing: 0.7,
                      color: reached ? submission.color.slate : submission.color.faint,
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "The agent understands the desired outcome rather than forcing it into a predefined interface.",
          },
          {
            from: 170,
            text: "It discovers providers by meaning, reads current capabilities and state, and requests only missing context.",
          },
          {
            from: 350,
            text: "It chooses action names and arguments at runtime and composes multiple providers when one is not enough.",
          },
          {
            from: 530,
            text: "Authorized actions are performed and verified before the model communicates the final result.",
          },
          {
            from: 700,
            text: "The final goal is reasoning that defines the interaction — not another generated website.",
          },
        ]}
      />
    </Scene>
  );
}

const futureCards: Array<{
  n: string;
  title: string;
  body: string;
  examples: string[];
  icon: IconName;
  accent: string;
}> = [
  {
    n: "01",
    title: "Context",
    body: "Understand the user, provider, current situation, and desired outcome.",
    examples: ["constraints", "current state", "permissions"],
    icon: "context",
    accent: submission.color.terracotta,
  },
  {
    n: "02",
    title: "Tools",
    body: "Discover capabilities, retrieve live information, act, and verify.",
    examples: ["discovery", "operations", "verification"],
    icon: "tools",
    accent: submission.color.terracotta,
  },
  {
    n: "03",
    title: "Memory",
    body: "Carry useful preferences and previous decisions into the next request.",
    examples: ["preferences", "consent", "history"],
    icon: "memory",
    accent: submission.color.slate,
  },
  {
    n: "04",
    title: "Better reasoning",
    body: "Replace more permanent workflow code with decisions made for now.",
    examples: ["personal", "adaptive", "direct"],
    icon: "spark",
    accent: submission.color.navy,
  },
];

function FutureCard({
  card,
  index,
  active,
}: {
  card: (typeof futureCards)[number];
  index: number;
  active: number;
}) {
  const reached = index <= active;
  return (
    <EditorialCard
      accent={card.accent}
      style={{
        height: 492,
        padding: 27,
        opacity: reached ? 1 : 0.54,
        background:
          index === 3 && reached ? submission.color.navy : submission.color.paper,
        color:
          index === 3 && reached ? submission.color.white : submission.color.ink,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <CardNumber color={index === 3 && reached ? submission.color.terracottaSoft : card.accent}>
          {card.n}
        </CardNumber>
        <LineIcon
          name={card.icon}
          size={47}
          color={index === 3 && reached ? submission.color.white : card.accent}
        />
      </div>
      <div
        style={{
          marginTop: 44,
          fontSize: 33,
          fontWeight: 650,
          lineHeight: 1.08,
          letterSpacing: -1,
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 17,
          lineHeight: 1.5,
          color:
            index === 3 && reached
              ? "rgba(255,255,255,0.68)"
              : submission.color.muted,
        }}
      >
        {card.body}
      </div>
      <div style={{ marginTop: 32, display: "grid", gap: 8 }}>
        {card.examples.map((example, exampleIndex) => (
          <div
            key={example}
            style={{
              padding: "10px 12px",
              background:
                index === 3 && reached
                  ? "rgba(255,255,255,0.09)"
                  : submission.color.white,
              borderLeft: `2px solid ${index === 3 && reached ? submission.color.terracotta : card.accent}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: submission.font.mono,
                fontSize: 11,
                letterSpacing: 1.3,
                textTransform: "uppercase",
                color:
                  index === 3 && reached
                    ? "rgba(255,255,255,0.72)"
                    : submission.color.inkSoft,
              }}
            >
              {example}
            </div>
            <CardNumber color={index === 3 && reached ? submission.color.terracottaSoft : submission.color.faint}>
              {String(exampleIndex + 1).padStart(2, "0")}
            </CardNumber>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 27,
          right: 27,
          bottom: 25,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 14,
          borderTop: `1px solid ${index === 3 && reached ? "rgba(255,255,255,0.16)" : submission.color.line}`,
        }}
      >
        <Eyebrow color={index === 3 && reached ? "rgba(255,255,255,0.45)" : submission.color.faint}>
          feeds the model
        </Eyebrow>
        <div
          style={{
            width: 10,
            height: 10,
            background: reached ? card.accent : submission.color.line,
          }}
        />
      </div>
    </EditorialCard>
  );
}

export function FutureChapter() {
  const frame = useCurrentFrame();
  const active = Math.min(3, Math.max(0, Math.floor((frame - 55) / 160)));
  const output = interpolate(frame, [575, 650], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Scene duration={900}>
      <Reveal delay={2}>
        <SectionTitle
          number="06"
          title="Better context, tools, and memory move more code into reasoning."
          description="The model becomes more useful when it knows what matters, can affect the world, and can carry the right information forward."
          compact
        />
      </Reveal>
      <div
        style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 17,
        }}
      >
        {futureCards.map((card, index) => (
          <Reveal key={card.n} delay={25 + index * 14} y={13}>
            <FutureCard card={card} index={index} active={active} />
          </Reveal>
        ))}
      </div>

      <div
        style={{
          marginTop: 15,
          minHeight: 88,
          display: "grid",
          gridTemplateColumns: "170px 1fr 240px",
          alignItems: "center",
          background: submission.color.successSoft,
          borderTop: `3px solid ${submission.color.success}`,
          opacity: output,
          transform: `translateY(${(1 - output) * 12}px)`,
        }}
      >
        <div style={{ padding: "0 22px" }}>
          <Eyebrow color={submission.color.success}>Remembered</Eyebrow>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 650 }}>
            Weekdays after 4 PM
          </div>
        </div>
        <div
          style={{
            height: "100%",
            borderLeft: `1px solid ${submission.color.success}`,
            borderRight: `1px solid ${submission.color.success}`,
            display: "flex",
            alignItems: "center",
            padding: "0 25px",
            fontSize: 20,
            fontWeight: 590,
          }}
        >
          “I used your saved preference, checked live availability, completed the authorized action, and verified the new state.”
        </div>
        <div style={{ textAlign: "center" }}>
          <Eyebrow color={submission.color.success}>Interface opened</Eyebrow>
          <div style={{ marginTop: 5, fontFamily: submission.font.mono, fontSize: 25, fontWeight: 700, color: submission.color.success }}>
            0
          </div>
        </div>
      </div>

      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "Context tells the model who the user is, what is happening now, and which constraints must survive the plan.",
          },
          {
            from: 180,
            text: "Tools let the agent discover capabilities, retrieve live information, perform authorized operations, and verify results.",
          },
          {
            from: 360,
            text: "Memory carries useful preferences and previous decisions forward without making the user repeat them.",
          },
          {
            from: 540,
            text: "Together they allow more application-specific frontend and backend workflow code to become runtime reasoning.",
          },
          {
            from: 690,
            text: "The end goal is an internet where people communicate desired outcomes and generative AI returns the result directly.",
          },
        ]}
      />
    </Scene>
  );
}

export function ClosingChapter() {
  const frame = useCurrentFrame();
  const cards = [
    ["01", "REQUEST", "Describe the outcome", submission.color.terracotta],
    ["02", "REASON", "Interpret and compose", submission.color.terracotta],
    ["03", "ACT", "Use authorized capabilities", submission.color.slate],
    ["04", "RESULT", "Generate it directly", submission.color.navy],
  ] as const;
  const line = interpolate(frame, [45, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Scene duration={330} style={{ paddingTop: 122 }}>
      <div style={{ display: "grid", gridTemplateColumns: "0.82fr 1.4fr", gap: 66, alignItems: "end" }}>
        <Reveal delay={4}>
          <div>
            <Eyebrow color={submission.color.terracotta}>The direction</Eyebrow>
            <div
              style={{
                marginTop: 18,
                width: 85,
                height: 4,
                background: submission.color.terracotta,
              }}
            />
          </div>
        </Reveal>
        <Reveal delay={12}>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 78,
                lineHeight: 0.98,
                letterSpacing: -3.7,
                fontWeight: 660,
              }}
            >
              The Internet
              <br />
              After Interfaces
            </h2>
            <p style={{ margin: "21px 0 0", fontSize: 24, color: submission.color.muted }}>
              LLM reasoning replaces the application-specific interaction.
            </p>
          </div>
        </Reveal>
      </div>

      <div style={{ position: "relative", marginTop: 54 }}>
        <div
          style={{
            position: "absolute",
            top: 111,
            left: 90,
            width: `calc((100% - 180px) * ${line})`,
            height: 3,
            background: `linear-gradient(90deg, ${submission.color.terracotta}, ${submission.color.slate}, ${submission.color.navy})`,
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 17 }}>
          {cards.map(([number, title, detail, accent], index) => (
            <Reveal key={number} delay={36 + index * 12} y={13}>
              <EditorialCard accent={accent} style={{ height: 250, padding: 27 }}>
                <CardNumber color={accent}>{number}</CardNumber>
                <div style={{ marginTop: 35, fontFamily: submission.font.mono, fontSize: 14, letterSpacing: 2.5, color: accent }}>
                  {title}
                </div>
                <div style={{ marginTop: 13, fontSize: 26, lineHeight: 1.2, fontWeight: 630 }}>
                  {detail}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 27,
                    bottom: 25,
                    width: 17,
                    height: 17,
                    background: accent,
                    border: `5px solid ${submission.color.paper}`,
                    outline: `1px solid ${accent}`,
                  }}
                />
              </EditorialCard>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal delay={105}>
        <div
          style={{
            marginTop: 25,
            paddingTop: 18,
            borderTop: `1px solid ${submission.color.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 20, color: submission.color.inkSoft }}>
            Users communicate desired outcomes. LLMs reason, compose, and act. Generative AI returns the result directly.
          </div>
          <div style={{ fontFamily: submission.font.mono, fontSize: 14, letterSpacing: 1.6, color: submission.color.slate }}>
            chat.thecatgpt.com · github.com/pixel3user/FEC-micro1
          </div>
        </div>
      </Reveal>
    </Scene>
  );
}
