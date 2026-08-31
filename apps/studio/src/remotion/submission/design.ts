export const submission = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 8160,
  color: {
    canvas: "#fdfdfc",
    paper: "#f2f0ee",
    paperStrong: "#ebe8e5",
    white: "#ffffff",
    ink: "#111a24",
    inkSoft: "#34404b",
    muted: "#7d8791",
    faint: "#a5adb5",
    line: "#d9d6d2",
    lineSoft: "#e8e5e2",
    terracotta: "#b7786c",
    terracottaSoft: "#ead8d3",
    slate: "#6f8294",
    slateSoft: "#dce3e8",
    navy: "#172330",
    navySoft: "#d6dde3",
    success: "#567b68",
    successSoft: "#dce8e0",
    warning: "#a76e43",
    warningSoft: "#eee0d2",
  },
  font: {
    sans: '"Manrope", "Avenir Next", "Segoe UI", sans-serif',
    mono: '"DM Mono", "IBM Plex Mono", "SFMono-Regular", monospace',
  },
} as const;

export const chapters = [
  { id: "title", label: "Premise", from: 0, duration: 270 },
  { id: "problem", label: "Who has the problem", from: 270, duration: 840 },
  { id: "bottleneck", label: "The bottleneck", from: 1110, duration: 840 },
  { id: "use-case", label: "A real outcome", from: 1950, duration: 1320 },
  { id: "market", label: "What changes", from: 3270, duration: 1200 },
  { id: "agents", label: "How agents help", from: 4470, duration: 900 },
  { id: "future", label: "Context · Tools · Memory", from: 5370, duration: 900 },
  { id: "evidence", label: "Baseline · Improvement", from: 6270, duration: 1560 },
  { id: "close", label: "The direction", from: 7830, duration: 330 },
] as const;

export type SubmissionChapter = (typeof chapters)[number];

export const thesis =
  "Replace application-specific interfaces and workflows with LLM reasoning.";
