import { Sequence } from "remotion";
import { ActBadge, PrHeader } from "../components/layout";
import { Appear, Backdrop, Caption } from "../components/primitives";
import {
  BridgePacket,
  Browser,
  Bubble,
  ProviderCard,
  SandboxFrame,
  StatePanel,
  UiButton,
} from "../components/product";
import { theme } from "../theme";

const ACCENT = theme.color.blue;

/**
 * Workflow — the full end-to-end story told with animated product UI:
 * 1) a provider publishes by chat and a world card materializes,
 * 2) a consumer's intent resolves to ranked results and a generated UI,
 * 3) an invented action fires over the bridge and persists as world state.
 */
export function Workflow() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Backdrop />
      <PrHeader tag="FLOW" title="End-to-end in practice" accent={ACCENT} />

      <Sequence durationInFrames={200}>
        <ProviderAct />
      </Sequence>
      <Sequence from={200} durationInFrames={220}>
        <ConsumerAct />
      </Sequence>
      <Sequence from={420} durationInFrames={220}>
        <OutcomeAct />
      </Sequence>
    </div>
  );
}

function ProviderAct() {
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={1} label="A provider publishes" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 90,
          right: 90,
          bottom: 170,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
        }}
      >
        <Appear delay={4} style={{ height: "100%" }}>
          <Browser
            url="agent-web.app/studio"
            accent={ACCENT}
            style={{ height: "100%" }}
          >
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Bubble
                from="provider"
                delay={10}
                text="I run a bike-repair co-op. We fix commuter bikes and take unusual custom requests."
              />
              <Bubble
                from="agent"
                delay={40}
                text="Got it — I built a world with capabilities and made it discoverable. Publish?"
              />
              <Bubble from="provider" delay={78} text="Publish it." />
            </div>
          </Browser>
        </Appear>
        <Appear delay={95} style={{ height: "100%" }}>
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <ProviderCard
              name="Cog & Chain Co-op"
              detail="commuter repair · parts · custom work"
              delay={100}
              accent={ACCENT}
            />
            <StatePanel
              title="published world"
              startReveal={110}
              rows={[
                { k: "slug", v: "cog-chain" },
                { k: "published", v: "true" },
                { k: "embedded", v: "1536-dim vector" },
                { k: "indexed", v: "public discovery" },
                { k: "capabilities", v: "repair, custom work" },
              ]}
            />
          </div>
        </Appear>
      </div>
      <Caption
        delay={20}
        text="No forms, no schema — a plain-language description becomes a published, discoverable world."
      />
    </>
  );
}

function ConsumerAct() {
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={2} label="A consumer arrives" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 90,
          right: 90,
          bottom: 170,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
        }}
      >
        <Appear delay={4} style={{ height: "100%" }}>
          <Browser
            url="agent-web.app/?q=fix+my+bike"
            accent={theme.color.green}
            style={{ height: "100%" }}
          >
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 20,
                  color: theme.color.muted,
                  marginBottom: 16,
                }}
              >
                intent: "somewhere to fix my commuter bike"
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <ProviderCard
                  name="Cog & Chain Co-op"
                  detail="commuter repair · custom work"
                  score="0.71"
                  rank={1}
                  delay={20}
                  accent={theme.color.green}
                />
                <ProviderCard
                  name="City Auto Body"
                  detail="car bodywork · not a match"
                  score="0.19"
                  rank={2}
                  delay={34}
                />
                <ProviderCard
                  name="Bluenote Studio"
                  detail="music lessons · not a match"
                  score="0.06"
                  rank={3}
                  delay={44}
                />
              </div>
              <div
                style={{
                  marginTop: 20,
                  fontFamily: theme.font.mono,
                  fontSize: 18,
                  color: theme.color.muted,
                }}
              >
                blended: 0.6 semantic + 0.4 lexical
              </div>
            </div>
          </Browser>
        </Appear>
        <Appear delay={60} style={{ height: "100%" }}>
          <SandboxFrame
            accent={theme.color.violet}
            style={{ height: "100%", display: "flex" }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "12px 6px",
              }}
            >
              <Appear delay={72}>
                <div
                  style={{
                    fontFamily: theme.font.sans,
                    fontWeight: 700,
                    fontSize: 32,
                    color: theme.color.ink,
                  }}
                >
                  Book a tune-up
                </div>
              </Appear>
              <Appear delay={84}>
                <div
                  style={{
                    fontFamily: theme.font.sans,
                    fontSize: 22,
                    color: theme.color.muted,
                    margin: "8px 0 26px",
                  }}
                >
                  Cog & Chain Co-op · commuter service
                </div>
              </Appear>
              <div
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 17,
                  color: theme.color.muted,
                  marginBottom: 12,
                }}
              >
                pick a slot
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 26,
                }}
              >
                <UiButton label="Today" delay={96} />
                <UiButton label="Tomorrow" delay={104} />
                <UiButton label="Custom request" delay={112} />
              </div>
              <UiButton label="Reserve" primary delay={124} />
              <Appear delay={140}>
                <div
                  style={{
                    marginTop: 26,
                    paddingTop: 20,
                    borderTop: `1px solid ${theme.color.line}`,
                    fontFamily: theme.font.mono,
                    fontSize: 18,
                    color: theme.color.muted,
                  }}
                >
                  no template — this markup was written by the model for this
                  intent
                </div>
              </Appear>
            </div>
          </SandboxFrame>
        </Appear>
      </div>
      <Caption
        delay={20}
        text="Intent resolves semantically to the right provider, and the model writes a fresh interface for this task on the spot."
      />
    </>
  );
}

function OutcomeAct() {
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge
          index={3}
          label="The decision becomes truth"
          accent={ACCENT}
        />
      </div>

      {/* Bridge: generated UI -> provider agent */}
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 90,
          right: 90,
          height: 120,
        }}
      >
        <div style={{ position: "relative", height: "100%" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: theme.font.mono,
              fontSize: 22,
              color: theme.color.violet,
              width: 300,
            }}
          >
            generated UI
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              textAlign: "right",
              fontFamily: theme.font.mono,
              fontSize: 22,
              color: theme.color.blue,
              width: 300,
            }}
          >
            provider agent
          </div>
          <div
            style={{
              position: "absolute",
              left: 300,
              right: 300,
              top: "50%",
              height: 2,
              background: theme.color.line,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 300,
              right: 300,
              top: 0,
              bottom: 0,
            }}
          >
            <BridgePacket
              startAt={10}
              from={0}
              to={100}
              label="agent.invoke({ action })"
              color={theme.color.amber}
            />
            <BridgePacket
              startAt={54}
              from={100}
              to={0}
              label="decision ->"
              color={theme.color.green}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 400,
          left: 90,
          right: 90,
          bottom: 170,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
        }}
      >
        <Appear delay={90}>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${theme.color.line}`,
              borderRadius: 14,
              padding: "22px 24px",
              fontFamily: theme.font.mono,
              fontSize: 22,
              color: theme.color.ink,
              boxShadow: theme.shadowSoft,
            }}
          >
            <div
              style={{
                color: theme.color.muted,
                fontSize: 17,
                marginBottom: 10,
              }}
            >
              invented action
            </div>
            "reserve a same-day tune-up slot"
            <div style={{ color: theme.color.green, marginTop: 14 }}>
              -&gt; accepted
            </div>
          </div>
        </Appear>
        <Appear delay={100}>
          <StatePanel
            title="world state (new ground truth)"
            startReveal={108}
            rows={[
              { k: "reservation", v: "same-day tune-up" },
              { k: "status", v: "confirmed" },
              { k: "revision", v: "4 (was 3)" },
              { k: "event", v: "agent.decision persisted" },
            ]}
          />
        </Appear>
      </div>
      <Caption
        delay={20}
        text="The generated UI invents an action, the provider agent decides, and that decision is persisted as the world's state — the agent-native web, end to end."
      />
    </>
  );
}
