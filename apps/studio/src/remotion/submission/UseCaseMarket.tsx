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

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "90px 1fr",
        gap: 10,
        padding: "10px 12px",
        background: submission.color.white,
        borderLeft: `2px solid ${submission.color.terracotta}`,
      }}
    >
      <div
        style={{
          fontFamily: submission.font.mono,
          fontSize: 10,
          letterSpacing: 1.2,
          color: submission.color.terracotta,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 620 }}>{value}</div>
    </div>
  );
}

function ApartmentPlan({ frame }: { frame: number }) {
  const route = interpolate(frame, [130, 530], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const adapted = interpolate(frame, [540, 790], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sofaX = interpolate(adapted, [0, 1], [0, 48]);
  const rampOpacity = interpolate(adapted, [0, 0.2, 1], [0, 1, 1]);
  return (
    <svg
      viewBox="0 0 720 420"
      style={{ width: "100%", height: 356, display: "block" }}
    >
      <rect width="720" height="420" fill={submission.color.white} />
      <g stroke={submission.color.navy} strokeWidth="8" fill="none">
        <path d="M85 55H650V365H85V255M85 195V55" />
        <path d="M365 55V152M365 212V365M365 235H650" />
        <path d="M505 235V365" />
      </g>
      <g stroke={submission.color.line} strokeWidth="2" fill="none">
        <path d="M85 195A60 60 0 0 1 145 255" />
        <path d="M365 152A60 60 0 0 1 425 212" />
        <path d="M505 235A50 50 0 0 0 555 285" />
      </g>

      <g
        transform={`translate(${sofaX} 0)`}
        fill={submission.color.slateSoft}
        stroke={submission.color.slate}
        strokeWidth="2"
      >
        <rect x="174" y="88" width="142" height="64" />
        <rect x="184" y="78" width="122" height="20" />
        <path d="M185 152V166M305 152V166" />
      </g>
      <g fill={submission.color.paperStrong} stroke={submission.color.faint} strokeWidth="2">
        <rect x="204" y="252" width="108" height="72" />
        <circle cx="258" cy="288" r="25" fill={submission.color.white} />
        <rect x="407" y="87" width="93" height="55" />
        <rect x="530" y="81" width="83" height="66" />
        <rect x="407" y="272" width="60" height="62" />
        <rect x="543" y="280" width="70" height="42" />
      </g>

      <g
        opacity={1 - adapted * 0.75}
        stroke={submission.color.terracotta}
        strokeWidth="3"
        fill={submission.color.terracottaSoft}
      >
        <rect x="98" y="218" width="64" height="60" />
        <path d="M102 222L158 274M158 222L102 274" />
        <circle cx="337" cy="191" r="17" />
        <path d="M325 179L349 203M349 179L325 203" />
      </g>

      <g opacity={rampOpacity}>
        <path
          d="M22 263L84 218V266L22 295Z"
          fill={submission.color.successSoft}
          stroke={submission.color.success}
          strokeWidth="3"
        />
        <path d="M33 270L75 238" stroke={submission.color.success} strokeWidth="2" />
        <rect
          x="91"
          y="218"
          width="46"
          height="73"
          fill="none"
          stroke={submission.color.success}
          strokeWidth="3"
        />
      </g>

      <path
        d="M22 282C78 282 92 253 132 253C194 253 170 190 230 190H322C366 190 386 247 431 247H467"
        fill="none"
        stroke={submission.color.line}
        strokeWidth="10"
        strokeLinecap="square"
      />
      <path
        d="M22 282C78 282 92 253 132 253C194 253 170 190 230 190H322C366 190 386 247 431 247H467"
        fill="none"
        stroke={submission.color.success}
        strokeWidth="5"
        strokeLinecap="square"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - route}
      />
      <circle
        cx={22 + route * 445}
        cy={282 - Math.sin(route * Math.PI) * 70}
        r="9"
        fill={submission.color.success}
        opacity={route > 0 && route < 1 ? 1 : 0}
      />

      <g fontFamily={submission.font.mono} fontSize="11" letterSpacing="1.2" fill={submission.color.muted}>
        <text x="185" y="52">LIVING ROOM</text>
        <text x="432" y="52">BEDROOM</text>
        <text x="415" y="226">HALL</text>
        <text x="527" y="226">BATHROOM</text>
        <text x="16" y="324">ENTRY</text>
      </g>
      <g>
        <rect x="492" y="186" width="180" height="32" fill={submission.color.navy} />
        <text
          x="505"
          y="207"
          fontFamily={submission.font.mono}
          fontSize="11"
          letterSpacing="1"
          fill={submission.color.white}
        >
          CLEAR ROUTE · 91 CM
        </text>
      </g>
    </svg>
  );
}

const providerSteps: Array<{
  icon: IconName;
  title: string;
  detail: string;
  price: string;
}> = [
  { icon: "ramp", title: "Temporary ramp", detail: "10-day rental", price: "$286" },
  { icon: "move", title: "Furniture move", detail: "2-person crew", price: "$340" },
  { icon: "equipment", title: "Mobility equipment", detail: "shower + transfer", price: "$412" },
  { icon: "delivery", title: "Coordinated delivery", detail: "single window", price: "$124" },
  { icon: "install", title: "Installation", detail: "non-permanent", price: "$580" },
  { icon: "rules", title: "Building rules", detail: "access verified", price: "CLEAR" },
];

function ReasoningColumn({ frame }: { frame: number }) {
  const tasks = [
    ["VISUAL", "Detect narrow entry", "82 cm clearance"],
    ["CONSTRAINT", "No permanent changes", "rental only"],
    ["COMPOSE", "Join six capabilities", "one schedule"],
    ["CONSENT", "Ask before commitment", "2 approvals"],
    ["VERIFY", "Check resulting state", "ready in 8 days"],
  ] as const;
  const active = Math.min(tasks.length - 1, Math.max(0, Math.floor((frame - 100) / 150)));
  return (
    <EditorialCard
      accent={submission.color.slate}
      style={{ height: 518, padding: 22 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <CardNumber color={submission.color.slate}>LLM REASONING</CardNumber>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 640 }}>
            One outcome, many constraints
          </div>
        </div>
        <Pill tone="slate">Live plan</Pill>
      </div>
      <div style={{ marginTop: 19, display: "grid", gap: 6 }}>
        {tasks.map(([kind, title, detail], index) => {
          const complete = index < active;
          const current = index === active;
          return (
            <div
              key={kind}
              style={{
                display: "grid",
                gridTemplateColumns: "34px 1fr 92px",
                alignItems: "center",
                gap: 10,
                minHeight: 58,
                padding: "9px 11px",
                background: current
                  ? submission.color.slateSoft
                  : complete
                    ? submission.color.white
                    : "rgba(255,255,255,0.32)",
                borderLeft: `3px solid ${current ? submission.color.slate : complete ? submission.color.success : submission.color.line}`,
                opacity: index <= active ? 1 : 0.52,
              }}
            >
              <div
                style={{
                  width: 27,
                  height: 27,
                  display: "grid",
                  placeItems: "center",
                  background: complete
                    ? submission.color.success
                    : current
                      ? submission.color.slate
                      : submission.color.line,
                  color: submission.color.white,
                  fontFamily: submission.font.mono,
                  fontSize: 11,
                }}
              >
                {complete ? "OK" : String(index + 1)}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 650 }}>{title}</div>
                <div style={{ marginTop: 3, fontSize: 12, color: submission.color.muted }}>
                  {kind}
                </div>
              </div>
              <div
                style={{
                  fontFamily: submission.font.mono,
                  fontSize: 10,
                  lineHeight: 1.35,
                  letterSpacing: 0.4,
                  color: current ? submission.color.slate : submission.color.muted,
                  textAlign: "right",
                  textTransform: "uppercase",
                }}
              >
                {detail}
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
          bottom: 22,
          paddingTop: 13,
          borderTop: `1px solid ${submission.color.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow>Prebuilt workflow</Eyebrow>
        <div style={{ fontSize: 18, fontWeight: 650, color: submission.color.terracotta }}>
          None
        </div>
      </div>
    </EditorialCard>
  );
}

function ProviderGrid({ frame }: { frame: number }) {
  const active = Math.min(
    providerSteps.length,
    Math.max(0, Math.floor((frame - 270) / 105) + 1),
  );
  return (
    <EditorialCard
      accent={submission.color.navy}
      style={{ height: 518, padding: 22 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <CardNumber color={submission.color.navy}>PROVIDER COMPOSITION</CardNumber>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 640 }}>
            Capabilities joined at runtime
          </div>
        </div>
        <Pill tone={active === providerSteps.length ? "success" : "navy"}>
          {active}/{providerSteps.length} ready
        </Pill>
      </div>
      <div
        style={{
          marginTop: 19,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        {providerSteps.map((provider, index) => {
          const selected = index < active;
          return (
            <div
              key={provider.title}
              style={{
                minHeight: 111,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "39px 1fr",
                gap: 11,
                background: selected ? submission.color.white : "rgba(255,255,255,0.3)",
                borderTop: `2px solid ${selected ? submission.color.success : submission.color.line}`,
                opacity: selected ? 1 : 0.45,
              }}
            >
              <LineIcon
                name={provider.icon}
                size={34}
                color={selected ? submission.color.success : submission.color.faint}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 650, lineHeight: 1.2 }}>
                  {provider.title}
                </div>
                <div style={{ marginTop: 5, fontSize: 11, color: submission.color.muted }}>
                  {provider.detail}
                </div>
                <div
                  style={{
                    marginTop: 9,
                    fontFamily: submission.font.mono,
                    fontSize: 11,
                    color: selected ? submission.color.success : submission.color.faint,
                  }}
                >
                  {selected ? provider.price : "SEARCHING"}
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
          bottom: 21,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 12,
          borderTop: `1px solid ${submission.color.line}`,
        }}
      >
        <Eyebrow>One composed outcome</Eyebrow>
        <div style={{ fontFamily: submission.font.mono, fontSize: 18, fontWeight: 700 }}>
          $1,742
        </div>
      </div>
    </EditorialCard>
  );
}

export function UseCaseChapter() {
  const frame = useCurrentFrame();
  const resultOpacity = interpolate(frame, [860, 900], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Scene duration={1320}>
      <Reveal delay={2}>
        <SectionTitle
          number="03"
          title="A real outcome no provider could prebuild."
          description="Visual reasoning, personal constraints, six providers, consent, and real actions — composed for one person in one moment."
          compact
        />
      </Reveal>

      <Reveal delay={18}>
        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "170px 1fr",
            minHeight: 86,
            background: submission.color.navy,
            color: submission.color.white,
          }}
        >
          <div
            style={{
              padding: "18px 22px",
              borderRight: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Eyebrow color={submission.color.terracottaSoft}>User request</Eyebrow>
            <div style={{ marginTop: 7, fontSize: 14, color: "rgba(255,255,255,0.62)" }}>
              Photo + short video
            </div>
          </div>
          <div
            style={{
              padding: "17px 24px",
              fontSize: 22,
              lineHeight: 1.35,
              fontWeight: 560,
              letterSpacing: -0.2,
            }}
          >
            “My father is visiting in ten days. Make this apartment wheelchair-accessible, keep it under $2,000, make no permanent changes, and arrange everything.”
          </div>
        </div>
      </Reveal>

      <div
        style={{
          marginTop: 15,
          display: "grid",
          gridTemplateColumns: "1.25fr 0.79fr 0.96fr",
          gap: 14,
        }}
      >
        <Reveal delay={34}>
          <EditorialCard
            accent={submission.color.terracotta}
            style={{ height: 518, padding: 18 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <CardNumber>GENERATED SPATIAL PLAN</CardNumber>
                <div style={{ marginTop: 5, fontSize: 21, fontWeight: 640 }}>
                  Apartment · visual reasoning
                </div>
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <Pill tone="rust">Before</Pill>
                <Pill tone={frame > 680 ? "success" : "neutral"}>Adapted</Pill>
              </div>
            </div>
            <div style={{ marginTop: 5 }}>
              <ApartmentPlan frame={frame} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 17,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
              }}
            >
              <Constraint label="Arrival" value="10 days" />
              <Constraint label="Budget" value="< $2,000" />
              <Constraint label="Property" value="No changes" />
              <Constraint label="Route" value="91 cm" />
            </div>
          </EditorialCard>
        </Reveal>
        <Reveal delay={48}>
          <ReasoningColumn frame={frame} />
        </Reveal>
        <Reveal delay={62}>
          <ProviderGrid frame={frame} />
        </Reveal>
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          bottom: 109,
          height: 82,
          opacity: resultOpacity,
          transform: `translateY(${(1 - resultOpacity) * 16}px)`,
          display: "grid",
          gridTemplateColumns: "230px 1fr 200px",
          alignItems: "center",
          background: submission.color.success,
          color: submission.color.white,
          zIndex: 5,
        }}
      >
        <div style={{ padding: "0 24px" }}>
          <Eyebrow color="rgba(255,255,255,0.68)">Direct result</Eyebrow>
          <div style={{ marginTop: 5, fontSize: 20, fontWeight: 700 }}>READY IN 8 DAYS</div>
        </div>
        <div
          style={{
            height: "100%",
            padding: "0 24px",
            borderLeft: "1px solid rgba(255,255,255,0.2)",
            borderRight: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 16,
          }}
        >
          <span>RAMP RESERVED</span>
          <span>MOVE SCHEDULED</span>
          <span>EQUIPMENT ORDERED</span>
          <span>INSTALLATION BOOKED</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <Eyebrow color="rgba(255,255,255,0.68)">Verified total</Eyebrow>
          <div style={{ marginTop: 4, fontFamily: submission.font.mono, fontSize: 25, fontWeight: 700 }}>
            $1,742
          </div>
        </div>
      </div>

      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "The user describes a difficult real outcome once and supplies the context the model needs.",
          },
          {
            from: 200,
            text: "The LLM reasons visually about the apartment, detects accessibility problems, and preserves every personal constraint.",
          },
          {
            from: 430,
            text: "It discovers ramp rental, moving, equipment, delivery, installation, and building-rule capabilities by meaning.",
          },
          {
            from: 650,
            text: "Those independent providers are composed into one plan; the agent asks only for decisions that require consent.",
          },
          {
            from: 860,
            text: "The output is the adapted plan and verified commitments — not six websites, directories, calendars, and checkout forms.",
          },
          {
            from: 1080,
            text: "No provider could predict this exact workflow. The LLM creates it through reasoning for this person and this moment.",
          },
        ]}
      />
    </Scene>
  );
}

const marketItems: Array<{
  n: string;
  title: string;
  description: string;
  footer: string;
  icon: IconName;
  accent: string;
}> = [
  {
    n: "01",
    title: "Websites",
    description: "Actions encoded into pages, menus, forms, and buttons.",
    footer: "Human operates interface",
    icon: "website",
    accent: submission.color.terracotta,
  },
  {
    n: "02",
    title: "Mobile apps",
    description: "The same application workflows rebuilt for another device.",
    footer: "Interface reproduced",
    icon: "mobile",
    accent: submission.color.terracotta,
  },
  {
    n: "03",
    title: "APIs",
    description: "No visual layer, but developers manually connect each workflow.",
    footer: "Integration code remains",
    icon: "api",
    accent: submission.color.slate,
  },
  {
    n: "04",
    title: "Chatbots",
    description: "Usually wrap existing flows or return users to the website.",
    footer: "Old workflow underneath",
    icon: "chat",
    accent: submission.color.slate,
  },
  {
    n: "05",
    title: "Browser agents",
    description: "Automate interfaces that were originally designed for humans.",
    footer: "Agent clicks human UI",
    icon: "browser",
    accent: submission.color.navy,
  },
  {
    n: "06",
    title: "Generative UI",
    description: "Creates new frontend code, but still creates an interface.",
    footer: "Another UI to operate",
    icon: "spark",
    accent: submission.color.navy,
  },
];

function MarketGrid({ frame }: { frame: number }) {
  const dim = interpolate(frame, [580, 720], [1, 0.48], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
        opacity: dim,
      }}
    >
      {marketItems.map((item, index) => (
        <Reveal key={item.n} delay={32 + index * 13} y={11}>
          <EditorialCard accent={item.accent} style={{ height: 214, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <CardNumber color={item.accent}>{item.n}</CardNumber>
              <LineIcon name={item.icon} size={33} color={item.accent} />
            </div>
            <div style={{ marginTop: 15, fontSize: 22, fontWeight: 650, letterSpacing: -0.4 }}>
              {item.title}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.38, color: submission.color.muted }}>
              {item.description}
            </div>
            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 15,
                paddingTop: 9,
                borderTop: `1px solid ${submission.color.line}`,
                fontFamily: submission.font.mono,
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: item.accent,
              }}
            >
              {item.footer}
            </div>
          </EditorialCard>
        </Reveal>
      ))}
    </div>
  );
}

function OurDirection({ frame }: { frame: number }) {
  const stages = [
    ["01", "Provider worlds", "Capabilities + persistent state", "state"],
    ["02", "Semantic discovery", "Find services by meaning", "search"],
    ["03", "LLM reasoning", "Compose the workflow now", "spark"],
    ["04", "Authorized operations", "Act with explicit consent", "lock"],
    ["05", "Direct result", "Generate the outcome", "result"],
  ] as const;
  const active = Math.min(stages.length - 1, Math.max(0, Math.floor((frame - 170) / 140)));
  return (
    <EditorialCard
      accent={submission.color.navy}
      style={{ height: 438, padding: 22, background: submission.color.navy, color: submission.color.white }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <CardNumber color={submission.color.terracottaSoft}>WHAT WE ADDED</CardNumber>
          <div style={{ marginTop: 7, fontSize: 27, lineHeight: 1.1, fontWeight: 650 }}>
            Reasoning replaces the predicted journey
          </div>
        </div>
        <Pill tone="rust">Competition build</Pill>
      </div>
      <div style={{ marginTop: 20, display: "grid", gap: 7 }}>
        {stages.map(([number, title, detail, icon], index) => {
          const reached = index <= active;
          return (
            <div
              key={number}
              style={{
                minHeight: 52,
                padding: "8px 11px",
                display: "grid",
                gridTemplateColumns: "32px 39px 1fr",
                alignItems: "center",
                gap: 10,
                background: reached ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.035)",
                borderLeft: `3px solid ${reached ? submission.color.terracotta : "rgba(255,255,255,0.12)"}`,
                opacity: reached ? 1 : 0.42,
              }}
            >
              <CardNumber color={reached ? submission.color.terracottaSoft : "rgba(255,255,255,0.35)"}>
                {number}
              </CardNumber>
              <LineIcon name={icon} size={28} color={reached ? submission.color.white : "rgba(255,255,255,0.35)"} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 650 }}>{title}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: "rgba(255,255,255,0.56)" }}>
                  {detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </EditorialCard>
  );
}

export function MarketChapter() {
  const frame = useCurrentFrame();
  const directionScale = interpolate(frame, [520, 680], [0.98, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Scene duration={1200}>
      <Reveal delay={2}>
        <SectionTitle
          number="04"
          title="The market automates interfaces. We are removing the interface layer."
          description="Existing systems change who operates the workflow. Our direction changes where the workflow comes from."
          compact
        />
      </Reveal>
      <div
        style={{
          marginTop: 31,
          display: "grid",
          gridTemplateColumns: "1.5fr 0.82fr",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
            <Eyebrow>What exists in the market</Eyebrow>
            <Pill tone="neutral">Application-specific code remains</Pill>
          </div>
          <MarketGrid frame={frame} />
        </div>
        <div style={{ transform: `scale(${directionScale})`, transformOrigin: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
            <Eyebrow color={submission.color.navy}>Our direction</Eyebrow>
            <Pill tone="navy">Intent to outcome</Pill>
          </div>
          <OurDirection frame={frame} />
        </div>
      </div>

      <Reveal delay={300}>
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "0.85fr 1.7fr",
            minHeight: 90,
          }}
        >
          <div
            style={{
              padding: "17px 21px",
              background: submission.color.paperStrong,
              borderTop: `3px solid ${submission.color.terracotta}`,
            }}
          >
            <CardNumber>CURRENT PROTOTYPE BRIDGE</CardNumber>
            <div style={{ marginTop: 7, fontSize: 18, fontWeight: 650 }}>
              Runtime-generated HTML
            </div>
            <div style={{ marginTop: 3, fontSize: 12, color: submission.color.muted }}>
              Browsers still require a visual document.
            </div>
          </div>
          <div
            style={{
              padding: "17px 22px",
              background: submission.color.slateSoft,
              borderTop: `3px solid ${submission.color.slate}`,
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div>
              <CardNumber color={submission.color.slate}>FINAL DIRECTION</CardNumber>
              <div style={{ marginTop: 7, fontSize: 18, fontWeight: 650 }}>
                No application interface
              </div>
            </div>
            <div
              style={{
                fontSize: 17,
                lineHeight: 1.35,
                color: submission.color.inkSoft,
                borderLeft: `1px solid ${submission.color.slate}`,
                paddingLeft: 21,
              }}
            >
              The LLM reasons from the request to the authorized outcome and communicates the result directly through generative media.
            </div>
          </div>
        </div>
      </Reveal>
      <CaptionTicker
        cues={[
          {
            from: 0,
            text: "Websites and mobile apps encode actions in permanent human-operated interfaces.",
          },
          {
            from: 180,
            text: "APIs remove the visual layer, but developers still hand-code every connection and workflow.",
          },
          {
            from: 360,
            text: "Chatbots and browser agents usually sit on top of the same flows; generative UI creates another interface.",
          },
          {
            from: 570,
            text: "Provider worlds describe capabilities, rules, and state in natural language, so agents can reason over them and invoke any action without hard-coded business logic.",
          },
          {
            from: 790,
            text: "The prototype uses generated HTML as a bridge. The final direction removes that temporary interface too.",
          },
          {
            from: 1010,
            text: "The model should reason from request to result instead of generating software that the user must operate.",
          },
        ]}
      />
    </Scene>
  );
}
