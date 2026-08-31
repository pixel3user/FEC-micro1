/**
 * Shared visual language for every composition. A light, Codex-style glass UI:
 * a soft warm-neutral canvas, frosted translucent panels with hairline borders
 * and gentle shadows, and restrained blur — clean developer tooling, not heavy
 * glassmorphism. Reused across all PR videos for a consistent, navigable feel.
 */
export const theme = {
  fps: 30,
  width: 1920,
  height: 1080,
  color: {
    // Canvas
    bg: "#f5f6f8",
    bgSoft: "#eef0f4",
    // Glass surfaces (translucent — layered over the canvas/gradients)
    glass: "rgba(255,255,255,0.62)",
    glassStrong: "rgba(255,255,255,0.82)",
    glassBorder: "rgba(17,24,39,0.08)",
    // Ink
    ink: "#161b22",
    inkSoft: "#3b424c",
    muted: "#6b7280",
    faint: "#9aa1ac",
    line: "rgba(17,24,39,0.10)",
    // Accents (kept calm and few)
    green: "#0f9d58",
    blue: "#3b6df6",
    violet: "#7c5cff",
    amber: "#d98a1f",
    teal: "#0aa5a5",
    red: "#e0554e",
  },
  font: {
    sans: '"Inter", "Manrope", system-ui, sans-serif',
    mono: '"JetBrains Mono", "DM Mono", "SFMono-Regular", monospace',
  },
  radius: 18,
  // Reusable style fragments so panels stay consistent.
  shadow: "0 22px 60px rgba(17,24,39,0.10)",
  shadowSoft: "0 10px 30px rgba(17,24,39,0.07)",
  blur: "saturate(140%) blur(10px)",
} as const;

/** Syntax highlight palette tuned for the light glass surfaces. */
export const syntax = {
  keyword: "#cf3d8b",
  string: "#0a7d33",
  fn: "#7c5cff",
  type: "#2f6df6",
  comment: "#96a0ad",
  number: "#b26b00",
  punctuation: "#4b5563",
  plain: "#232a33",
} as const;
