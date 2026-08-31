import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

/**
 * A terminal/log pane that reveals lines over time. Used for the "live proof"
 * act — the content is the real output captured from actual runs against the
 * API and OpenRouter, rendered here rather than screen-recorded.
 */
export type TermLine = {
  text: string;
  tone?: "plain" | "muted" | "good" | "bad" | "warn" | "json";
  prompt?: boolean;
};

const toneColor: Record<NonNullable<TermLine["tone"]>, string> = {
  plain: "#2b323b",
  muted: theme.color.muted,
  good: theme.color.green,
  bad: theme.color.red,
  warn: theme.color.amber,
  json: "#2f6df6",
};

export function Terminal({
  lines,
  startReveal = 0,
  perLine = 8,
  fontSize = 24,
}: {
  lines: TermLine[];
  startReveal?: number;
  perLine?: number;
  fontSize?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: theme.font.mono,
        fontSize,
        lineHeight: 1.7,
      }}
    >
      {lines.map((line, index) => {
        const appearAt = startReveal + index * perLine;
        const opacity = interpolate(frame, [appearAt, appearAt + 5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const color = toneColor[line.tone ?? "plain"];
        return (
          <div key={index} style={{ opacity, display: "flex", gap: 12 }}>
            {line.prompt && <span style={{ color: theme.color.green }}>$</span>}
            <span
              style={{ color, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {line.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
