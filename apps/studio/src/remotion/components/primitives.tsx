import type { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/** Fade + rise entrance driven by a spring for organic motion. */
export function Appear({
  children,
  delay = 0,
  y = 22,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.6 },
  });
  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Fades a block out over its final frames so scenes hand off cleanly. */
export function FadeOut({
  children,
  at,
  duration = 15,
  style,
}: {
  children: ReactNode;
  at: number;
  duration?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at, at + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ opacity, ...style }}>{children}</div>;
}

/** Soft light canvas with gentle drifting color washes behind every scene. */
export function Backdrop() {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 300], [0, 26]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, ${theme.color.bg}, ${theme.color.bgSoft})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -80,
          backgroundImage: `linear-gradient(${theme.color.line} 1px, transparent 1px), linear-gradient(90deg, ${theme.color.line} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          opacity: 0.5,
          maskImage:
            "radial-gradient(circle at 50% 40%, black, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 40%, black, transparent 78%)",
          transform: `translate(${-drift}px, ${-drift * 0.5}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-18%",
          right: "-6%",
          width: 820,
          height: 820,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,109,246,0.16), transparent 60%)",
          filter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-22%",
          left: "-6%",
          width: 760,
          height: 760,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,92,255,0.14), transparent 60%)",
          filter: "blur(8px)",
        }}
      />
    </div>
  );
}

/** Bottom caption bar — frosted glass. Text-only; audio can be layered later. */
export function Caption({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <Appear
      delay={delay}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 64,
        display: "flex",
        justifyContent: "center",
        padding: "0 120px",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          textAlign: "center",
          fontFamily: theme.font.sans,
          fontSize: 34,
          lineHeight: 1.4,
          color: theme.color.inkSoft,
          background: theme.color.glassStrong,
          border: `1px solid ${theme.color.glassBorder}`,
          borderRadius: 16,
          padding: "18px 30px",
          boxShadow: theme.shadowSoft,
          backdropFilter: theme.blur,
          WebkitBackdropFilter: theme.blur,
        }}
      >
        {text}
      </div>
    </Appear>
  );
}

/** Frosted glass panel — the primary surface for grouping content. */
export function Glass({
  children,
  style,
  strong = false,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        background: strong ? theme.color.glassStrong : theme.color.glass,
        border: `1px solid ${theme.color.glassBorder}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        backdropFilter: theme.blur,
        WebkitBackdropFilter: theme.blur,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** macOS-style window chrome on a glass surface for code and terminal panes. */
export function Window({
  title,
  accent = theme.color.blue,
  children,
  style,
}: {
  title: string;
  accent?: string;
  children: ReactNode;
  style?: React.CSSProperties;
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
          gap: 14,
          padding: "16px 20px",
          borderBottom: `1px solid ${theme.color.glassBorder}`,
          background: "rgba(255,255,255,0.55)",
        }}
      >
        <Dot color="#ec6a5e" />
        <Dot color="#f4bf50" />
        <Dot color="#61c454" />
        <span
          style={{
            marginLeft: 8,
            fontFamily: theme.font.mono,
            fontSize: 22,
            color: theme.color.muted,
          }}
        >
          {title}
        </span>
        <span
          style={{
            marginLeft: "auto",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 14px ${accent}`,
          }}
        />
      </div>
      <div style={{ padding: 28 }}>{children}</div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{ width: 14, height: 14, borderRadius: "50%", background: color }}
    />
  );
}
