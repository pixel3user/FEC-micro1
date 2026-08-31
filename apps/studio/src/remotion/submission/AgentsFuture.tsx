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

const workflowModules = [
  ["ROUTES + PAGES", "router · view shell", "A path for every expected journey"],
  ["COMPONENT LIBRARIES", "forms · controls", "Fields, buttons, dialogs, and states"],
  ["FORM + UI STATE", "schema · client store", "Validation and transitions"],
  ["WORKFLOW BRANCHES", "conditions · guards", "Every predicted exception"],
  ["PROVIDER ADAPTERS", "service clients", "One integration per provider"],
  ["ORCHESTRATION", "handlers · retries", "Coordinate calls and failures"],
  ["RESULT VIEWS", "templates · status UI", "Format each possible outcome"],
  ["TEST + MAINTENANCE", "fixtures · mocks", "Update the entire dependency path"],
] as const;

const reasoningInputs = [
  "Desired outcome",
  "User context",
  "Constraints",
  "Provider capabilities",
  "Current state",
] as const;

function BeforeWorkflowStack({ frame }: { frame: number }) {
  return (
    <EditorialCard
      accent={submission.color.terracotta}
      style={{ height: 492, padding: 22 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <CardNumber>BEFORE · APPLICATION-SPECIFIC WORKFLOW STACK</CardNumber>
          <div style={{ marginTop: 7, fontSize: 25, fontWeight: 650, letterSpacing: -0.5 }}>
            Every journey is assembled in advance
          </div>
        </div>
        <Pill tone="rust">Many moving parts</Pill>
      </div>

      <div
        style={{
          marginTop: 17,
          padding: "10px 12px",
          display: "grid",
          gridTemplateColumns: "86px 1fr",
          alignItems: "center",
          background: submission.color.white,
          borderLeft: `3px solid ${submission.color.terracotta}`,
        }}
      >
        <Eyebrow color={submission.color.terracotta}>Request</Eyebrow>
        <div style={{ fontSize: 13, color: submission.color.inkSoft }}>
          Must fit a route, screen, branch, and integration that already exist.
        </div>
      </div>

      <div
        style={{
          marginTop: 11,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 7,
        }}
      >
        {workflowModules.map(([label, dependency, detail], index) => {
          const visible = interpolate(frame, [35 + index * 30, 65 + index * 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={label}
              style={{
                minHeight: 58,
                padding: "7px 10px",
                display: "grid",
                gridTemplateColumns: "25px 1fr",
                gap: 9,
                alignItems: "center",
                background: index % 3 === 0 ? submission.color.terracottaSoft : submission.color.white,
                borderTop: `2px solid ${index < 4 ? submission.color.terracotta : submission.color.line}`,
                opacity: visible,
                transform: `translateY(${(1 - visible) * 5}px)`,
              }}
            >
              <div
                style={{
                  width: 23,
                  height: 23,
                  display: "grid",
                  placeItems: "center",
                  background: submission.color.terracotta,
                  color: submission.color.white,
                  fontFamily: submission.font.mono,
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <div style={{ fontFamily: submission.font.mono, fontSize: 10, fontWeight: 700, letterSpacing: 0.6 }}>
                  {label}
                </div>
                <div style={{ marginTop: 3, fontSize: 10, color: submission.color.terracotta }}>
                  {dependency}
                </div>
                <div style={{ marginTop: 2, fontSize: 10, color: submission.color.muted }}>
                  {detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 22,
          right: 22,
          bottom: 18,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: submission.color.warningSoft,
          borderLeft: `3px solid ${submission.color.warning}`,
        }}
      >
        <Eyebrow color={submission.color.warning}>Every new outcome adds</Eyebrow>
        <div style={{ fontFamily: submission.font.mono, fontSize: 11, fontWeight: 700 }}>
          IMPLEMENTATION · DEPENDENCIES · TESTS · MAINTENANCE
        </div>
      </div>
    </EditorialCard>
  );
}

function UnifiedReasoning({ frame }: { frame: number }) {
  const pulse = interpolate(frame % 90, [0, 45, 90], [0.34, 0.72, 0.34]);
  const resultReveal = interpolate(frame, [320, 390], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <EditorialCard
      accent={submission.color.navy}
      style={{
        height: 492,
        padding: 22,
        background: submission.color.navy,
        color: submission.color.white,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <CardNumber color={submission.color.terracottaSoft}>AFTER · ONE LLM REASONING PROCESS</CardNumber>
          <div style={{ marginTop: 7, fontSize: 25, fontWeight: 650, letterSpacing: -0.5 }}>
            The complete situation is processed together
          </div>
        </div>
        <Pill tone="success">At request time</Pill>
      </div>

      <div style={{ marginTop: 17 }}>
        <Eyebrow color="rgba(255,255,255,0.5)">Available to the model at once</Eyebrow>
        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {reasoningInputs.map((input, index) => (
            <div
              key={input}
              style={{
                minHeight: 47,
                padding: "8px 7px",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                background: index % 2 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.12)",
                borderTop: `2px solid ${index < 2 ? submission.color.terracotta : submission.color.slate}`,
                fontFamily: submission.font.mono,
                fontSize: 9,
                lineHeight: 1.25,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {input}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 15,
          minHeight: 165,
          padding: "16px 20px",
          position: "relative",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "72px 1fr",
          alignItems: "center",
          gap: 19,
          background: submission.color.white,
          color: submission.color.ink,
          borderLeft: `4px solid ${submission.color.slate}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: pulse,
            background: `radial-gradient(circle at 72px 96px, ${submission.color.slateSoft}, transparent 44%)`,
          }}
        />
        <div
          style={{
            width: 70,
            height: 70,
            position: "relative",
            zIndex: 1,
            display: "grid",
            placeItems: "center",
            background: submission.color.navy,
          }}
        >
          <LineIcon name="spark" size={43} color={submission.color.white} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <Eyebrow color={submission.color.slate}>One unified reasoning process</Eyebrow>
          <div style={{ marginTop: 8, fontSize: 23, fontWeight: 680, letterSpacing: -0.55 }}>
            No separately implemented flow for this outcome.
          </div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.45, color: submission.color.muted }}>
            The LLM reasons over the request and available world together, then determines the appropriate authorized result.
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          padding: "9px 13px",
          display: "grid",
          gridTemplateColumns: "46px 1fr auto",
          alignItems: "center",
          gap: 12,
          background: submission.color.successSoft,
          color: submission.color.ink,
          opacity: resultReveal,
          transform: `translateY(${(1 - resultReveal) * 8}px)`,
        }}
      >
        <LineIcon name="result" size={35} color={submission.color.success} />
        <div>
          <Eyebrow color={submission.color.success}>Direct final result</Eyebrow>
          <div style={{ marginTop: 4, fontSize: 14, fontWeight: 650 }}>
            Generated for this request, then verified and persisted.
          </div>
        </div>
        <Pill tone="success">Outcome</Pill>
      </div>

    </EditorialCard>
  );
}

function TrustedExecution() {
  const systems = ["Identity", "Permission", "Validation", "Storage", "Transport", "Execution"];
  return (
    <div
      style={{
        marginTop: 14,
        minHeight: 84,
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        background: submission.color.paperStrong,
        borderLeft: `4px solid ${submission.color.slate}`,
      }}
    >
      <div
        style={{
          padding: "15px 20px",
          borderRight: `1px solid ${submission.color.line}`,
        }}
      >
        <Eyebrow color={submission.color.slate}>Trusted execution stack remains</Eyebrow>
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 640 }}>
          Deterministic systems still enforce reality
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}>
        {systems.map((system, index) => (
          <div
            key={system}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderRight: index < systems.length - 1 ? `1px solid ${submission.color.line}` : "none",
              fontFamily: submission.font.mono,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: submission.color.inkSoft,
            }}
          >
            <span style={{ width: 7, height: 7, background: submission.color.slate }} />
            {system}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentsChapter() {
  const frame = useCurrentFrame();
  return (
    <Scene duration={900}>
      <Reveal delay={2}>
        <SectionTitle
          number="05"
          title="The application-specific workflow stack becomes runtime reasoning."
          description="We are not replacing the trusted execution stack with an LLM. We are replacing more of the application-specific workflow stack with reasoning at runtime."
          compact
        />
      </Reveal>

      <div
        style={{
          marginTop: 29,
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: 15,
        }}
      >
        <Reveal delay={22}>
          <BeforeWorkflowStack frame={frame} />
        </Reveal>
        <Reveal delay={40}>
          <UnifiedReasoning frame={frame} />
        </Reveal>
      </div>

      <Reveal delay={76}>
        <TrustedExecution />
      </Reveal>

      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "Before, every expected outcome needs an application-specific workflow stack built in advance.",
          },
          {
            from: 170,
            text: "That stack includes routes, forms, state, branches, provider adapters, result views, and the libraries connecting them.",
          },
          {
            from: 350,
            text: "Each new journey adds implementation, testing, dependencies, and maintenance before the user can request it.",
          },
          {
            from: 530,
            text: "One LLM reasoning process considers the complete outcome, context, constraints, capabilities, and current state together.",
          },
          {
            from: 700,
            text: "We are not replacing the trusted execution stack with an LLM. We are replacing more of the application-specific workflow stack with reasoning at runtime.",
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
