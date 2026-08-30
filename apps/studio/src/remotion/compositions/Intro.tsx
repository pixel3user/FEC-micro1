import {
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Appear, Backdrop, Caption, Glass } from "../components/primitives";
import { theme } from "../theme";

/**
 * Shared opener for the showcase. Establishes the agent-native web thesis and
 * previews the five PRs, each of which gets its own composition. Duration is
 * driven by the registered composition (see Root).
 */
export function Intro() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Backdrop />

      <Sequence durationInFrames={110}>
        <TitleScene />
      </Sequence>

      <Sequence from={110} durationInFrames={140}>
        <ThesisScene />
      </Sequence>

      <Sequence from={250} durationInFrames={170}>
        <RoadmapScene />
      </Sequence>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 160px",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function TitleScene() {
  return (
    <>
      <Center>
        <Appear>
          <div
            style={{
              fontFamily: theme.font.mono,
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: theme.color.green,
              marginBottom: 28,
            }}
          >
            FEC-micro1 · Agentic Workflows
          </div>
        </Appear>
        <Appear delay={12}>
          <h1
            style={{
              fontFamily: theme.font.sans,
              fontWeight: 800,
              fontSize: 108,
              lineHeight: 1.02,
              letterSpacing: -3,
              color: theme.color.ink,
              margin: 0,
            }}
          >
            The Agent-Native Web
          </h1>
        </Appear>
        <Appear delay={26}>
          <p
            style={{
              fontFamily: theme.font.sans,
              fontSize: 38,
              color: theme.color.muted,
              marginTop: 30,
              maxWidth: 1200,
            }}
          >
            Providers publish meaning. Agents generate the interface and the
            actions at runtime.
          </p>
        </Appear>
      </Center>
      <Caption
        delay={40}
        text="A walkthrough of the repository, one pull request at a time — code and real live evidence."
      />
    </>
  );
}

function ThesisScene() {
  const layers = [
    { k: "Discovery", v: "DNS-like public index resolves intent to providers" },
    { k: "Model access", v: "One cheap model call, hardened and budgeted" },
    {
      k: "Persistence",
      v: "Worlds, events, and agent decisions as ground truth",
    },
    { k: "Sandbox", v: "Generated code runs isolated behind one bridge" },
  ];
  return (
    <>
      <Center>
        <Appear>
          <h2
            style={{
              fontFamily: theme.font.sans,
              fontWeight: 700,
              fontSize: 60,
              color: theme.color.ink,
              margin: "0 0 20px",
            }}
          >
            The platform fixes only four things
          </h2>
        </Appear>
        <Appear delay={10}>
          <p
            style={{
              fontFamily: theme.font.sans,
              fontSize: 32,
              color: theme.color.muted,
              margin: "0 0 46px",
            }}
          >
            Everything else — actions, workflows, interfaces — is invented by
            the model.
          </p>
        </Appear>
        <div
          style={{
            display: "flex",
            gap: 22,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {layers.map((layer, index) => (
            <Appear key={layer.k} delay={20 + index * 10}>
              <Glass
                style={{
                  width: 380,
                  textAlign: "left",
                  padding: "24px 26px",
                }}
              >
                <div
                  style={{
                    fontFamily: theme.font.mono,
                    fontSize: 20,
                    color: theme.color.blue,
                    marginBottom: 10,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontFamily: theme.font.sans,
                    fontWeight: 700,
                    fontSize: 30,
                    color: theme.color.ink,
                    marginBottom: 8,
                  }}
                >
                  {layer.k}
                </div>
                <div
                  style={{
                    fontFamily: theme.font.sans,
                    fontSize: 24,
                    lineHeight: 1.4,
                    color: theme.color.muted,
                  }}
                >
                  {layer.v}
                </div>
              </Glass>
            </Appear>
          ))}
        </div>
      </Center>
    </>
  );
}

function RoadmapScene() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const prs = [
    { n: "PR1", t: "Hardened model runtime", c: theme.color.blue },
    { n: "PR2", t: "Self-healing generated UI", c: theme.color.violet },
    { n: "PR3", t: "Semantic discovery", c: theme.color.green },
    { n: "PR4", t: "Multi-provider composition", c: theme.color.amber },
    { n: "PR5", t: "Evaluation + adversarial", c: theme.color.teal },
  ];
  const line = interpolate(frame, [10, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <Center>
        <Appear>
          <h2
            style={{
              fontFamily: theme.font.sans,
              fontWeight: 700,
              fontSize: 60,
              color: theme.color.ink,
              margin: "0 0 60px",
            }}
          >
            Five pull requests, built and live-verified
          </h2>
        </Appear>
        <div style={{ position: "relative", width: 1500 }}>
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 0,
              height: 3,
              width: `${line * 100}%`,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${theme.color.blue}, ${theme.color.teal})`,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {prs.map((pr, index) => (
              <Appear key={pr.n} delay={20 + index * 12} style={{ width: 260 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: pr.c,
                      boxShadow: `0 0 20px ${pr.c}`,
                      marginBottom: 26,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: theme.font.mono,
                      fontSize: 24,
                      color: pr.c,
                      marginBottom: 10,
                    }}
                  >
                    {pr.n}
                  </div>
                  <div
                    style={{
                      fontFamily: theme.font.sans,
                      fontSize: 26,
                      color: theme.color.ink,
                      textAlign: "center",
                      lineHeight: 1.3,
                    }}
                  >
                    {pr.t}
                  </div>
                </div>
              </Appear>
            ))}
          </div>
        </div>
      </Center>
      <Caption
        delay={30}
        text="Total live model spend across every PR and demo: about one cent."
      />
      <FadeMarker at={durationInFrames - 12} />
    </>
  );
}

function FadeMarker({ at }: { at: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at, at + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: theme.color.bgSoft,
        opacity,
      }}
    />
  );
}
