import type { CSSProperties, ReactNode } from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { chapters, submission, thesis } from "./design";

export function SubmissionCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: submission.color.canvas,
        color: submission.color.ink,
        fontFamily: submission.font.sans,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.26,
          backgroundImage: `linear-gradient(${submission.color.lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${submission.color.lineSoft} 1px, transparent 1px)`,
          backgroundSize: "96px 96px",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 14%, black 84%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 14%, black 84%, transparent 100%)",
        }}
      />
      {children}
    </div>
  );
}

export function PersistentHeader() {
  const frame = useCurrentFrame();
  const active = chapters.findIndex(
    (chapter) =>
      frame >= chapter.from && frame < chapter.from + chapter.duration,
  );

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 50,
        left: 74,
        right: 74,
        top: 30,
        height: 44,
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid ${submission.color.line}`,
      }}
    >
      <div
        style={{
          fontFamily: submission.font.mono,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 4.2,
          color: submission.color.ink,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        micro1 · Agentic Workflows Hackathon
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 5,
          marginLeft: "auto",
          height: 3,
          width: 550,
        }}
      >
        {chapters.map((chapter, index) => {
          const within = Math.max(
            0,
            Math.min(1, (frame - chapter.from) / chapter.duration),
          );
          const fill = index < active ? 1 : index === active ? within : 0;
          return (
            <div
              key={chapter.id}
              style={{
                position: "relative",
                flex: chapter.duration,
                background: submission.color.lineSoft,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "left center",
                  transform: `scaleX(${fill})`,
                  background:
                    index % 3 === 0
                      ? submission.color.terracotta
                      : index % 3 === 1
                        ? submission.color.slate
                        : submission.color.navy,
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          width: 280,
          marginLeft: 22,
          textAlign: "right",
          fontFamily: submission.font.mono,
          fontSize: 13,
          letterSpacing: 2.2,
          color: submission.color.muted,
          textTransform: "uppercase",
        }}
      >
        {chapters[Math.max(0, active)]?.label}
      </div>
    </div>
  );
}

export function Scene({
  children,
  duration,
  style,
}: {
  children: ReactNode;
  duration: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 16, Math.max(17, duration - 18), duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "96px 74px 112px",
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Reveal({
  children,
  delay = 0,
  y = 18,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 190, mass: 0.72, stiffness: 120 },
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

export function EditorialCard({
  children,
  accent = submission.color.terracotta,
  style,
}: {
  children: ReactNode;
  accent?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: submission.color.paper,
        borderTop: `4px solid ${accent}`,
        padding: 24,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  color = submission.color.muted,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: submission.font.mono,
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: 3.4,
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  number,
  title,
  description,
  compact = false,
}: {
  number: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 26 }}>
      <Eyebrow
        color={submission.color.terracotta}
        style={{ width: 48, paddingTop: 10 }}
      >
        {number}
      </Eyebrow>
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: compact ? 44 : 58,
            lineHeight: 1.04,
            letterSpacing: -2.2,
            fontWeight: 660,
            maxWidth: 1200,
          }}
        >
          {title}
        </h2>
        {description ? (
          <p
            style={{
              margin: "12px 0 0",
              color: submission.color.muted,
              fontSize: 21,
              lineHeight: 1.45,
              maxWidth: 1180,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CardNumber({
  children,
  color = submission.color.terracotta,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        fontFamily: submission.font.mono,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 1,
        color,
      }}
    >
      {children}
    </div>
  );
}

export type CaptionCue = { from: number; to?: number; text: string };

export function CaptionTicker({ cues }: { cues: CaptionCue[] }) {
  const frame = useCurrentFrame();
  const cue = cues.find(
    (candidate, index) =>
      frame >= candidate.from &&
      frame <
        (candidate.to ?? cues[index + 1]?.from ?? Number.POSITIVE_INFINITY),
  );
  if (!cue) return null;

  const age = Math.max(0, frame - cue.from);
  const opacity = interpolate(age, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        bottom: 26,
        minHeight: 62,
        display: "grid",
        gridTemplateColumns: "250px 1fr 250px",
        alignItems: "center",
        borderTop: `1px solid ${submission.color.line}`,
        paddingTop: 16,
      }}
    >
      <Eyebrow color={submission.color.slate}>Direct outcome</Eyebrow>
      <div
        key={cue.text}
        style={{
          opacity,
          textAlign: "center",
          color: submission.color.inkSoft,
          fontSize: 23,
          fontWeight: 530,
          lineHeight: 1.3,
        }}
      >
        {cue.text}
      </div>
      <div
        style={{
          textAlign: "right",
          fontFamily: submission.font.mono,
          fontSize: 12,
          letterSpacing: 1.7,
          color: submission.color.faint,
          textTransform: "uppercase",
        }}
      >
        {thesis}
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
  style,
}: {
  children: ReactNode;
  tone?: "slate" | "rust" | "navy" | "success" | "neutral";
  style?: CSSProperties;
}) {
  const tones = {
    slate: [submission.color.slateSoft, submission.color.slate],
    rust: [submission.color.terracottaSoft, submission.color.terracotta],
    navy: [submission.color.navySoft, submission.color.navy],
    success: [submission.color.successSoft, submission.color.success],
    neutral: [submission.color.white, submission.color.muted],
  } as const;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        background: tones[tone][0],
        color: tones[tone][1],
        fontFamily: submission.font.mono,
        fontSize: 12,
        fontWeight: 650,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Arrow({
  color = submission.color.slate,
  width = 70,
}: {
  color?: string;
  width?: number;
}) {
  return (
    <svg width={width} height="22" viewBox={`0 0 ${width} 22`} fill="none">
      <path d={`M1 11H${width - 7}`} stroke={color} strokeWidth="2" />
      <path
        d={`M${width - 14} 4L${width - 7} 11L${width - 14} 18`}
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
