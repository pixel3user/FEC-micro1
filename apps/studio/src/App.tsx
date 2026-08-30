import { Player } from "@remotion/player";
import { useState } from "react";
import { SHOWCASE, videoConfig } from "./compositions";
import { theme } from "./remotion/theme";

/**
 * Interactive, no-render showcase. The Remotion <Player> runs the compositions
 * live in the browser (play, pause, scrub) with zero MP4 export. Published to
 * GitHub Pages so the repo has an embeddable live presentation.
 */
export function App() {
  const [activeId, setActiveId] = useState(SHOWCASE[0]!.id);
  const active =
    SHOWCASE.find((entry) => entry.id === activeId) ?? SHOWCASE[0]!;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.color.bg,
        color: theme.color.ink,
        fontFamily: theme.font.sans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 32px",
          borderBottom: `1px solid ${theme.color.line}`,
        }}
      >
        <span
          style={{
            fontFamily: theme.font.mono,
            fontWeight: 700,
            color: "#fff",
            background: theme.color.blue,
            padding: "8px 10px",
            borderRadius: 8,
          }}
        >
          A/
        </span>
        <strong style={{ fontSize: 20 }}>Agent-Native Web · Showcase</strong>
        <span
          style={{ marginLeft: "auto", color: theme.color.muted, fontSize: 15 }}
        >
          Live Remotion player — no video render required
        </span>
      </header>

      <main
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          minHeight: 0,
        }}
      >
        <nav
          style={{
            borderRight: `1px solid ${theme.color.line}`,
            padding: 20,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontFamily: theme.font.mono,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: theme.color.muted,
              marginBottom: 14,
            }}
          >
            Chapters
          </div>
          {SHOWCASE.map((entry) => {
            const selected = entry.id === activeId;
            return (
              <button
                key={entry.id}
                onClick={() => setActiveId(entry.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 10,
                  padding: "14px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: `1px solid ${selected ? theme.color.blue : theme.color.line}`,
                  background: selected
                    ? theme.color.glassStrong
                    : "transparent",
                  color: theme.color.ink,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {entry.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: theme.color.muted,
                    lineHeight: 1.4,
                  }}
                >
                  {entry.blurb}
                </div>
              </button>
            );
          })}
        </nav>

        <section
          style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            minWidth: 0,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${theme.color.line}`,
              boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
            }}
          >
            <Player
              key={active.id}
              component={active.component}
              durationInFrames={active.durationInFrames}
              fps={videoConfig.fps}
              compositionWidth={videoConfig.width}
              compositionHeight={videoConfig.height}
              style={{ width: "100%" }}
              controls
              autoPlay
              loop
            />
          </div>
          <p style={{ color: theme.color.muted, margin: 0, fontSize: 15 }}>
            Captions are on-screen; a voice track can be layered later without
            changing the compositions.
          </p>
        </section>
      </main>
    </div>
  );
}
