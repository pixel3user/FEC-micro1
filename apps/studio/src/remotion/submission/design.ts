import {
  SUBMISSION_DURATION_IN_FRAMES,
  chapterDuration,
  chapterFrom,
} from "./narration";

export const submission = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: SUBMISSION_DURATION_IN_FRAMES,
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
  {
    id: "title",
    label: "Premise",
    from: chapterFrom("title"),
    duration: chapterDuration("title"),
  },
  {
    id: "problem",
    label: "Who has the problem",
    from: chapterFrom("problem"),
    duration: chapterDuration("problem"),
  },
  {
    id: "bottleneck",
    label: "The bottleneck",
    from: chapterFrom("bottleneck"),
    duration: chapterDuration("bottleneck"),
  },
  {
    id: "use-case",
    label: "A real outcome",
    from: chapterFrom("use-case"),
    duration: chapterDuration("use-case"),
  },
  {
    id: "market",
    label: "What changes",
    from: chapterFrom("market"),
    duration: chapterDuration("market"),
  },
  {
    id: "agents",
    label: "How agents help",
    from: chapterFrom("agents"),
    duration: chapterDuration("agents"),
  },
  {
    id: "future",
    label: "Context · Tools · Memory",
    from: chapterFrom("future"),
    duration: chapterDuration("future"),
  },
  {
    id: "evidence",
    label: "Baseline · Improvement",
    from: chapterFrom("evidence"),
    duration: chapterDuration("evidence"),
  },
  {
    id: "changelog",
    label: "Improvement changelog",
    from: chapterFrom("changelog"),
    duration: chapterDuration("changelog"),
  },
  {
    id: "close",
    label: "The direction",
    from: chapterFrom("close"),
    duration: chapterDuration("close"),
  },
] as const;

export type SubmissionChapter = (typeof chapters)[number];

export const thesis =
  "Replace application-specific interfaces and workflows with LLM reasoning.";
