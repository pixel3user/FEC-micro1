import type { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * Product-UI kit: reusable, animated reconstructions of the actual app surfaces
 * (browser chrome, chat, provider/result cards, the sandboxed generated UI, the
 * action bridge, and a live state panel). These are faithful reconstructions
 * rendered by the video — not a screen recording of the running app — using the
 * real data, action names, and numbers captured from live runs.
 */

/** Mock browser window framing a scene as "the product". */
export function Browser({
  url,
  children,
  style,
  accent = theme.color.blue,
}: {
  url: string;
  children: ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: theme.color.glassStrong,
        border: `1px solid ${theme.color.glassBorder}`,
        borderRadius: theme.radius,
        overflow: "hidden",
        boxShadow: theme.shadow,
        backdropFilter: theme.blur,
        WebkitBackdropFilter: theme.blur,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderBottom: `1px solid ${theme.color.glassBorder}`,
          background: "rgba(255,255,255,0.6)",
        }}
      >
        <span
          style={{
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "#ec6a5e",
          }}
        />
        <span
          style={{
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "#f4bf50",
          }}
        />
        <span
          style={{
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "#61c454",
          }}
        />
        <div
          style={{
            marginLeft: 14,
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            border: `1px solid ${theme.color.line}`,
            borderRadius: 999,
            padding: "8px 16px",
            fontFamily: theme.font.mono,
            fontSize: 20,
            color: theme.color.muted,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accent,
            }}
          />
          {url}
        </div>
      </div>
      <div style={{ padding: 26 }}>{children}</div>
    </div>
  );
}

/** A chat bubble (provider or agent) that appears on schedule. */
export function Bubble({
  from,
  text,
  delay = 0,
}: {
  from: "provider" | "agent" | "user";
  text: string;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.5 },
  });
  const mine = from === "agent";
  const bg = mine ? theme.color.blue : "#fff";
  const color = mine ? "#fff" : theme.color.ink;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          background: bg,
          color,
          border: mine ? "none" : `1px solid ${theme.color.line}`,
          borderRadius: 16,
          padding: "14px 18px",
          fontFamily: theme.font.sans,
          fontSize: 24,
          lineHeight: 1.4,
          boxShadow: theme.shadowSoft,
        }}
      >
        <div
          style={{
            fontFamily: theme.font.mono,
            fontSize: 15,
            opacity: 0.7,
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {from}
        </div>
        {text}
      </div>
    </div>
  );
}

/** A provider/result card that materializes; optional similarity score + rank. */
export function ProviderCard({
  name,
  detail,
  score,
  rank,
  delay = 0,
  accent = theme.color.blue,
}: {
  name: string;
  detail: string;
  score?: string;
  rank?: number;
  delay?: number;
  accent?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.6 },
  });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px) scale(${0.98 + p * 0.02})`,
        background: "#fff",
        border: `1px solid ${rank === 1 ? accent : theme.color.line}`,
        borderRadius: 14,
        padding: "18px 20px",
        boxShadow: rank === 1 ? `0 10px 30px ${accent}22` : theme.shadowSoft,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {rank !== undefined && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: rank === 1 ? accent : theme.color.bgSoft,
            color: rank === 1 ? "#fff" : theme.color.muted,
            fontFamily: theme.font.mono,
            fontWeight: 700,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {rank}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: theme.font.sans,
            fontSize: 26,
            fontWeight: 700,
            color: theme.color.ink,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: theme.font.sans,
            fontSize: 20,
            color: theme.color.muted,
            marginTop: 3,
          }}
        >
          {detail}
        </div>
      </div>
      {score && (
        <div
          style={{
            fontFamily: theme.font.mono,
            fontSize: 22,
            fontWeight: 700,
            color: rank === 1 ? accent : theme.color.muted,
          }}
        >
          {score}
        </div>
      )}
    </div>
  );
}

/** A framed "sandbox" holding generated UI that assembles element by element. */
export function SandboxFrame({
  children,
  label = "sandboxed iframe · generated at runtime",
  accent = theme.color.violet,
  style,
}: {
  children: ReactNode;
  label?: string;
  accent?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        border: `2px dashed ${accent}66`,
        borderRadius: 16,
        padding: 18,
        background: "rgba(255,255,255,0.6)",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -14,
          left: 18,
          background: "#fff",
          border: `1px solid ${accent}66`,
          borderRadius: 8,
          padding: "3px 10px",
          fontFamily: theme.font.mono,
          fontSize: 15,
          color: accent,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/** A small button element used inside generated-UI reconstructions. */
export function UiButton({
  label,
  primary = false,
  delay = 0,
}: {
  label: string;
  primary?: boolean;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <span
      style={{
        opacity: p,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 20px",
        borderRadius: 12,
        fontFamily: theme.font.sans,
        fontWeight: 700,
        fontSize: 22,
        background: primary ? theme.color.green : "#fff",
        color: primary ? "#fff" : theme.color.ink,
        border: primary ? "none" : `1px solid ${theme.color.line}`,
        boxShadow: theme.shadowSoft,
      }}
    >
      {label}
    </span>
  );
}

/** An animated packet traveling left->right to visualize the action bridge. */
export function BridgePacket({
  from = 0,
  to = 100,
  startAt,
  label,
  color = theme.color.amber,
}: {
  from?: number;
  to?: number;
  startAt: number;
  label: string;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startAt, startAt + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(t, [0, 1], [from, to]);
  const opacity = interpolate(t, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
        opacity,
        background: color,
        color: "#fff",
        borderRadius: 999,
        padding: "6px 14px",
        fontFamily: theme.font.mono,
        fontSize: 18,
        whiteSpace: "nowrap",
        boxShadow: `0 6px 20px ${color}66`,
      }}
    >
      {label}
    </div>
  );
}

/** A key/value state panel whose rows populate over time. */
export function StatePanel({
  title,
  rows,
  startReveal = 0,
  perRow = 10,
}: {
  title: string;
  rows: Array<{ k: string; v: string }>;
  startReveal?: number;
  perRow?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        background: "#0f141b",
        borderRadius: 14,
        padding: "18px 20px",
        fontFamily: theme.font.mono,
        boxShadow: theme.shadow,
      }}
    >
      <div
        style={{
          color: "#7d8794",
          fontSize: 16,
          marginBottom: 12,
          letterSpacing: 1,
        }}
      >
        {title}
      </div>
      {rows.map((row, index) => {
        const at = startReveal + index * perRow;
        const op = interpolate(frame, [at, at + 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={row.k}
            style={{
              opacity: op,
              display: "flex",
              gap: 10,
              fontSize: 20,
              padding: "4px 0",
            }}
          >
            <span style={{ color: "#5aa0ff" }}>{row.k}:</span>
            <span style={{ color: "#c9d4e0" }}>{row.v}</span>
          </div>
        );
      })}
    </div>
  );
}
