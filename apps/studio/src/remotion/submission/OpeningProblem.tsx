import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
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

const titleCards = [
  {
    n: "01",
    title: "Describe the outcome",
    body: "The user says what should change — not where to click.",
    accent: submission.color.terracotta,
  },
  {
    n: "02",
    title: "Reason at runtime",
    body: "The model interprets constraints, state, and consent.",
    accent: submission.color.terracotta,
  },
  {
    n: "03",
    title: "Compose providers",
    body: "Capabilities are discovered and combined by meaning.",
    accent: submission.color.slate,
  },
  {
    n: "04",
    title: "Generate the result",
    body: "The outcome arrives directly — not as another website.",
    accent: submission.color.navy,
  },
] as const;

export function TitleChapter() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleProgress = spring({
    frame: frame - 12,
    fps,
    config: { damping: 180, mass: 0.85 },
  });
  return (
    <Scene duration={270} style={{ paddingTop: 112 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.88fr 1.62fr",
          gap: 72,
          alignItems: "end",
          marginBottom: 52,
        }}
      >
        <Reveal delay={4}>
          <div>
            <Eyebrow color={submission.color.terracotta}>
              micro1 Agentic Workflows Hackathon
            </Eyebrow>
            <div
              style={{
                width: 70,
                height: 4,
                marginTop: 22,
                background: submission.color.terracotta,
              }}
            />
          </div>
        </Reveal>
        <div
          style={{
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 26}px)`,
          }}
        >
          <h1
            style={{
              margin: 0,
              maxWidth: 1100,
              fontSize: 92,
              fontWeight: 660,
              lineHeight: 0.98,
              letterSpacing: -4.4,
              color: submission.color.ink,
            }}
          >
            The Internet
            <br />
            After Interfaces
          </h1>
          <p
            style={{
              margin: "24px 0 0",
              fontSize: 27,
              lineHeight: 1.35,
              color: submission.color.muted,
            }}
          >
            Replacing application workflows with LLM reasoning.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 18,
        }}
      >
        {titleCards.map((card, index) => (
          <Reveal key={card.n} delay={54 + index * 9} y={16}>
            <EditorialCard
              accent={card.accent}
              style={{ height: 284, padding: "30px 30px 26px" }}
            >
              <CardNumber color={card.accent}>{card.n}</CardNumber>
              <div
                style={{
                  marginTop: 31,
                  fontSize: 30,
                  lineHeight: 1.12,
                  fontWeight: 620,
                  letterSpacing: -0.9,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  right: 28,
                  bottom: 28,
                  color: submission.color.muted,
                  fontSize: 18,
                  lineHeight: 1.4,
                }}
              >
                {card.body}
              </div>
            </EditorialCard>
          </Reveal>
        ))}
      </div>
      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "Every application is built for human interaction, with pages, menus, forms, and controls that become obstacles for agents.",
          },
        ]}
      />
    </Scene>
  );
}

const sites = [
  ["SEARCH", "Find the right website"],
  ["MENU", "Learn its navigation"],
  ["FILTER", "Translate intent into fields"],
  ["ACCOUNT", "Repeat identity and details"],
  ["FORM", "Follow a predicted workflow"],
  ["CONFIRM", "Recover the actual outcome"],
] as const;

function UserIntentCard() {
  return (
    <EditorialCard
      accent={submission.color.terracotta}
      style={{ height: 544, padding: 28 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <CardNumber>USER / ONE INTENT</CardNumber>
        <LineIcon
          name="intent"
          size={44}
          color={submission.color.terracotta}
        />
      </div>
      <div
        style={{
          marginTop: 32,
          padding: "25px 24px",
          background: submission.color.white,
          borderLeft: `3px solid ${submission.color.terracotta}`,
          fontSize: 30,
          lineHeight: 1.25,
          fontWeight: 590,
          letterSpacing: -0.8,
        }}
      >
        “I know what I want. Why do I need to learn how every website works?”
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginTop: 22,
        }}
      >
        {[
          ["01", "Describe"],
          ["02", "Search"],
          ["03", "Navigate"],
          ["04", "Translate"],
        ].map(([number, label]) => (
          <div
            key={number}
            style={{
              padding: "14px 15px",
              borderTop: `1px solid ${submission.color.line}`,
              background: "rgba(255,255,255,0.48)",
            }}
          >
            <CardNumber color={submission.color.slate}>{number}</CardNumber>
            <div style={{ marginTop: 7, fontSize: 16, fontWeight: 620 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          bottom: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Eyebrow>Human translation tax</Eyebrow>
        <Pill tone="rust">Repeated everywhere</Pill>
      </div>
    </EditorialCard>
  );
}

function WebsiteStack() {
  const frame = useCurrentFrame();
  return (
    <EditorialCard
      accent={submission.color.slate}
      style={{ height: 544, padding: 26 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <LineIcon name="website" size={40} color={submission.color.slate} />
        <div>
          <CardNumber color={submission.color.slate}>
            THE INTERFACE MAZE
          </CardNumber>
          <div style={{ fontSize: 22, fontWeight: 620, marginTop: 4 }}>
            One goal, six translations
          </div>
        </div>
        <Pill tone="slate" style={{ marginLeft: "auto" }}>
          23 interactions
        </Pill>
      </div>
      <div style={{ marginTop: 23, display: "grid", gap: 8 }}>
        {sites.map(([label, detail], index) => {
          const reveal = interpolate(
            frame,
            [44 + index * 15, 54 + index * 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={label}
              style={{
                opacity: reveal,
                transform: `translateX(${(1 - reveal) * 18}px)`,
                display: "grid",
                gridTemplateColumns: "72px 1fr 28px",
                alignItems: "center",
                gap: 14,
                padding: "11px 14px",
                background:
                  index % 2 === 0
                    ? submission.color.white
                    : "rgba(255,255,255,0.42)",
                borderLeft: `2px solid ${index < 3 ? submission.color.slate : submission.color.faint}`,
              }}
            >
              <div
                style={{
                  fontFamily: submission.font.mono,
                  fontSize: 11,
                  letterSpacing: 1.4,
                  color: submission.color.slate,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 17, color: submission.color.inkSoft }}>
                {detail}
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: `1px solid ${submission.color.line}`,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: submission.font.mono,
                  fontSize: 10,
                  color: submission.color.faint,
                }}
              >
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: 26,
          right: 26,
          height: 5,
          background: submission.color.lineSoft,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${interpolate(frame, [40, 240], [4, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}%`,
            background: submission.color.slate,
          }}
        />
      </div>
    </EditorialCard>
  );
}

function ProviderCodeStack() {
  const files = [
    ["frontend.tsx", "menus · fields · state"],
    ["routes.ts", "pages · redirects · errors"],
    ["workflow.ts", "predicted action sequence"],
    ["mobile.tsx", "the same flow, rebuilt"],
    ["integrations.ts", "service-specific glue"],
  ] as const;
  return (
    <EditorialCard
      accent={submission.color.navy}
      style={{ height: 544, padding: 26 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <LineIcon name="api" size={40} color={submission.color.navy} />
        <div>
          <CardNumber color={submission.color.navy}>
            PROVIDER / EVERY JOURNEY
          </CardNumber>
          <div style={{ fontSize: 22, fontWeight: 620, marginTop: 4 }}>
            Predict, code, maintain
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 23,
          position: "relative",
          height: 315,
        }}
      >
        {files.map(([name, detail], index) => (
          <Reveal key={name} delay={95 + index * 16} y={11}>
            <div
              style={{
                position: "absolute",
                top: index * 61,
                left: index * 9,
                right: 0,
                height: 70,
                padding: "13px 16px",
                background: index === 0 ? submission.color.white : "#e8e6e3",
                borderTop: `2px solid ${index < 2 ? submission.color.navy : submission.color.faint}`,
                boxShadow: "0 6px 18px rgba(17,26,36,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <div
                  style={{
                    fontFamily: submission.font.mono,
                    color: submission.color.navy,
                    fontSize: 14,
                    fontWeight: 650,
                  }}
                >
                  {name}
                </div>
                <CardNumber color={submission.color.faint}>
                  {String(index + 1).padStart(2, "0")}
                </CardNumber>
              </div>
              <div
                style={{
                  marginTop: 8,
                  color: submission.color.muted,
                  fontSize: 14,
                }}
              >
                {detail}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 26,
          right: 26,
          bottom: 25,
          paddingTop: 15,
          borderTop: `1px solid ${submission.color.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Eyebrow>Application-specific code</Eyebrow>
        <Pill tone="navy">Built in advance</Pill>
      </div>
    </EditorialCard>
  );
}

export function ProblemChapter() {
  return (
    <Scene duration={840}>
      <Reveal delay={2}>
        <SectionTitle
          number="01"
          title="The web makes both sides translate intent into interfaces."
          description="Users learn a different interaction language for every service. Providers prebuild every journey they expect a user to take."
          compact
        />
      </Reveal>
      <div
        style={{
          marginTop: 34,
          display: "grid",
          gridTemplateColumns: "0.88fr 1.22fr 1fr",
          gap: 18,
        }}
      >
        <Reveal delay={20}>
          <UserIntentCard />
        </Reveal>
        <Reveal delay={34}>
          <WebsiteStack />
        </Reveal>
        <Reveal delay={48}>
          <ProviderCodeStack />
        </Reveal>
      </div>
      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "Pages, menus, filters, accounts, and forms are translations between one human intention and one provider action.",
          },
          {
            from: 390,
            text: "Providers pay the same tax: frontend and backend workflows for every interaction they can predict.",
          },
          {
            from: 610,
            text: "Our goal is to replace that application-specific interaction code with reasoning at runtime.",
          },
        ]}
      />
    </Scene>
  );
}

function MazeDiagram() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [34, 360], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nodes = [
    { x: 42, y: 72, label: "GOAL", detail: "one clear intent" },
    { x: 220, y: 72, label: "SEARCH", detail: "choose a site" },
    { x: 220, y: 208, label: "MENU", detail: "learn structure" },
    { x: 420, y: 208, label: "FILTER", detail: "map constraints" },
    { x: 420, y: 72, label: "FORM", detail: "repeat details" },
    { x: 620, y: 72, label: "RESULT", detail: "recover outcome" },
  ] as const;
  return (
    <div style={{ position: "relative", height: 330 }}>
      <svg
        viewBox="0 0 720 280"
        style={{ position: "absolute", inset: 0, width: "100%", height: 280 }}
      >
        <path
          d="M74 90H220V224H420V90H620"
          fill="none"
          stroke={submission.color.line}
          strokeWidth="7"
        />
        <path
          d="M74 90H220V224H420V90H620"
          fill="none"
          stroke={submission.color.terracotta}
          strokeWidth="4"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - progress}
        />
      </svg>
      {nodes.map((node, index) => {
        const active = progress >= index / (nodes.length - 1);
        return (
          <div
            key={node.label}
            style={{
              position: "absolute",
              left: node.x - 34,
              top: node.y - 10,
              width: 112,
              opacity: active ? 1 : 0.35,
            }}
          >
            <div
              style={{
                width: 23,
                height: 23,
                background: active
                  ? submission.color.terracotta
                  : submission.color.paperStrong,
                border: `5px solid ${submission.color.paper}`,
                outline: `1px solid ${active ? submission.color.terracotta : submission.color.line}`,
                marginBottom: 12,
              }}
            />
            <div
              style={{
                fontFamily: submission.font.mono,
                fontSize: 11,
                fontWeight: 650,
                letterSpacing: 1,
                color: active
                  ? submission.color.terracotta
                  : submission.color.faint,
              }}
            >
              {node.label}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                lineHeight: 1.2,
                color: submission.color.muted,
              }}
            >
              {node.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DirectPath() {
  const steps = [
    ["01", "Desired outcome", "Natural language, image, voice"],
    ["02", "LLM reasoning", "Interpret context and constraints"],
    ["03", "Authorized action", "Use provider capabilities"],
    ["04", "Generated result", "Communicate the outcome directly"],
  ] as const;
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {steps.map(([number, title, detail], index) => (
        <Reveal key={number} delay={88 + index * 18} y={10}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "44px 52px 1fr",
              alignItems: "center",
              minHeight: 70,
              padding: "10px 15px",
              background:
                index === steps.length - 1
                  ? submission.color.navy
                  : submission.color.white,
              color:
                index === steps.length - 1
                  ? submission.color.white
                  : submission.color.ink,
            }}
          >
            <CardNumber
              color={
                index === steps.length - 1
                  ? submission.color.terracottaSoft
                  : submission.color.slate
              }
            >
              {number}
            </CardNumber>
            <div
              style={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                background:
                  index === steps.length - 1
                    ? "rgba(255,255,255,0.12)"
                    : submission.color.slateSoft,
              }}
            >
              <LineIcon
                name={
                  index === 0
                    ? "intent"
                    : index === 1
                      ? "spark"
                      : index === 2
                        ? "lock"
                        : "result"
                }
                size={23}
                color={
                  index === steps.length - 1
                    ? submission.color.white
                    : submission.color.slate
                }
              />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 650 }}>{title}</div>
              <div
                style={{
                  marginTop: 3,
                  fontSize: 13,
                  color:
                    index === steps.length - 1
                      ? "rgba(255,255,255,0.68)"
                      : submission.color.muted,
                }}
              >
                {detail}
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function BottleneckChapter() {
  const frame = useCurrentFrame();
  const attention = Math.round(
    interpolate(frame, [40, 390], [0, 87], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  return (
    <Scene duration={840}>
      <Reveal delay={2}>
        <SectionTitle
          number="02"
          title="The bottleneck is not the task. It is the interface around it."
          description="One clear goal becomes navigation, attention, and code before it becomes an outcome."
          compact
        />
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.48fr 0.92fr",
          gap: 18,
          marginTop: 32,
        }}
      >
        <Reveal delay={22}>
          <EditorialCard
            accent={submission.color.terracotta}
            style={{ height: 500, padding: 26 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <CardNumber>THE CURRENT PATH</CardNumber>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 28,
                    fontWeight: 630,
                    letterSpacing: -0.7,
                  }}
                >
                  The user translates the same intent repeatedly
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Eyebrow>Attention spent</Eyebrow>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: submission.font.mono,
                    fontSize: 38,
                    color: submission.color.terracotta,
                  }}
                >
                  {attention}%
                </div>
              </div>
            </div>
            <div style={{ marginTop: 22 }}>
              <MazeDiagram />
            </div>
            <div
              style={{
                position: "absolute",
                left: 26,
                right: 26,
                bottom: 22,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
              }}
            >
              {["pages", "menus", "forms", "confirmation"].map(
                (label, index) => (
                  <div
                    key={label}
                    style={{
                      padding: "11px 12px",
                      background: submission.color.white,
                      borderTop: `2px solid ${index < 2 ? submission.color.terracotta : submission.color.faint}`,
                    }}
                  >
                    <CardNumber>{String(index + 1).padStart(2, "0")}</CardNumber>
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 13,
                        textTransform: "uppercase",
                        color: submission.color.muted,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ),
              )}
            </div>
          </EditorialCard>
        </Reveal>

        <Reveal delay={42}>
          <EditorialCard
            accent={submission.color.navy}
            style={{ height: 500, padding: 26 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <CardNumber color={submission.color.navy}>
                  THE REASONING PATH
                </CardNumber>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 25,
                    fontWeight: 630,
                    letterSpacing: -0.5,
                  }}
                >
                  Intent goes directly to outcome
                </div>
              </div>
              <Pill tone="navy">Runtime</Pill>
            </div>
            <DirectPath />
          </EditorialCard>
        </Reveal>
      </div>

      <Reveal delay={142}>
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            minHeight: 80,
            background: submission.color.paperStrong,
            borderLeft: `4px solid ${submission.color.slate}`,
          }}
        >
          <div
            style={{
              padding: "18px 22px",
              borderRight: `1px solid ${submission.color.line}`,
            }}
          >
            <Eyebrow color={submission.color.slate}>Trusted substrate</Eyebrow>
            <div style={{ marginTop: 7, fontSize: 16, fontWeight: 620 }}>
              Small, deterministic, necessary
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              alignItems: "stretch",
            }}
          >
            {["Identity", "Permission", "Storage", "Validation", "Transport"].map(
              (label, index) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    borderRight:
                      index < 4 ? `1px solid ${submission.color.line}` : "none",
                    fontFamily: submission.font.mono,
                    fontSize: 13,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    color: submission.color.inkSoft,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      background: submission.color.slate,
                    }}
                  />
                  {label}
                </div>
              ),
            )}
          </div>
        </div>
      </Reveal>
      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "Many websites optimize navigation and attention even when the user already knows the result they want.",
          },
          {
            from: 145,
            text: "If an agent understands the same human actions, the interaction no longer needs to be pre-rendered as pages and forms.",
          },
          {
            from: 325,
            text: "For example, booking a flight still means navigating filters, seat maps, and checkout.",
          },
          {
            from: 435,
            text: "The changing workflow can come from LLM reasoning instead of permanently written application logic.",
          },
          {
            from: 575,
            text: "For example, reasoning can rebook disrupted travel without a prewritten recovery flow.",
          },
          {
            from: 690,
            text: "A small trusted substrate remains for identity, permission, storage, validation, and transport.",
          },
        ]}
      />
    </Scene>
  );
}
