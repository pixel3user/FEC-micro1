import type { ReactNode } from "react";
import { Appear } from "./primitives";
import { theme } from "../theme";

/** Small labelled badge marking which act (Problem / Code / Proof) is on screen. */
export function ActBadge({
  index,
  label,
  accent,
}: {
  index: number;
  label: string;
  accent: string;
}) {
  return (
    <Appear>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          fontFamily: theme.font.mono,
          fontSize: 22,
          color: theme.color.inkSoft,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
          }}
        >
          {index}
        </span>
        <span style={{ letterSpacing: 3, textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
    </Appear>
  );
}

/** PR title header used at the top of every PR composition. */
export function PrHeader({
  tag,
  title,
  accent,
}: {
  tag: string;
  title: string;
  accent: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 54,
        left: 90,
        right: 90,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Appear>
        <span
          style={{
            fontFamily: theme.font.mono,
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
            background: accent,
            padding: "8px 14px",
            borderRadius: 10,
          }}
        >
          {tag}
        </span>
      </Appear>
      <Appear delay={4}>
        <span
          style={{
            fontFamily: theme.font.sans,
            fontSize: 40,
            fontWeight: 700,
            color: theme.color.ink,
          }}
        >
          {title}
        </span>
      </Appear>
    </div>
  );
}

/** Two-column stage: code/context on the left, live evidence on the right. */
export function SplitStage({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 90,
        right: 90,
        bottom: 200,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 32,
      }}
    >
      {left}
      {right}
    </div>
  );
}
