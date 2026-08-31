import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

/**
 * Horizontal step timeline used to show a process over time (e.g. the repair
 * loop: error -> regenerate -> healed). Steps light up as their reveal frame
 * passes, with a connecting progress line.
 */
export type TimelineStep = {
  label: string;
  sub?: string;
  color: string;
};

export function Timeline({
  steps,
  startReveal = 0,
  perStep = 22,
}: {
  steps: TimelineStep[];
  startReveal?: number;
  perStep?: number;
}) {
  const frame = useCurrentFrame();
  const lastAt = startReveal + (steps.length - 1) * perStep;
  const lineProgress = interpolate(frame, [startReveal, lastAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "relative", width: "100%", padding: "20px 0" }}>
      <div
        style={{
          position: "absolute",
          top: 34,
          left: 40,
          right: 40,
          height: 3,
          background: theme.color.line,
          borderRadius: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 34,
          left: 40,
          height: 3,
          width: `calc((100% - 80px) * ${lineProgress})`,
          background: `linear-gradient(90deg, ${theme.color.violet}, ${theme.color.green})`,
          borderRadius: 3,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {steps.map((step, index) => {
          const at = startReveal + index * perStep;
          const on = interpolate(frame, [at, at + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={step.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                opacity: 0.35 + on * 0.65,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: step.color,
                  boxShadow: `0 0 ${16 * on}px ${step.color}`,
                  transform: `scale(${0.8 + on * 0.2})`,
                  marginBottom: 18,
                }}
              />
              <div
                style={{
                  fontFamily: theme.font.sans,
                  fontSize: 26,
                  fontWeight: 700,
                  color: theme.color.ink,
                }}
              >
                {step.label}
              </div>
              {step.sub && (
                <div
                  style={{
                    fontFamily: theme.font.mono,
                    fontSize: 20,
                    color: theme.color.muted,
                    marginTop: 6,
                  }}
                >
                  {step.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
