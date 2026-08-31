import type { ComponentType } from "react";
import { Intro } from "./remotion/compositions/Intro";
import { Pr1 } from "./remotion/compositions/Pr1";
import { Pr2 } from "./remotion/compositions/Pr2";
import { Pr3 } from "./remotion/compositions/Pr3";
import { Pr4 } from "./remotion/compositions/Pr4";
import { Pr5 } from "./remotion/compositions/Pr5";
import { SubmissionVideo } from "./remotion/compositions/SubmissionVideo";
import { Workflow } from "./remotion/compositions/Workflow";
import { submission } from "./remotion/submission/design";
import { theme } from "./remotion/theme";

export type ShowcaseEntry = {
  id: string;
  label: string;
  blurb: string;
  durationInFrames: number;
  component: ComponentType;
};

/**
 * The player app reads this list. It mirrors the Remotion Root registry so the
 * in-browser Player and the render pipeline stay in sync. One entry per PR will
 * be added as each composition lands.
 */
export const SHOWCASE: ShowcaseEntry[] = [
  {
    id: "SubmissionVideo",
    label: "Submission video · Internet After Interfaces",
    blurb:
      "The complete micro1 Agentic Workflows Hackathon story: problem, reasoning model, novel accessibility outcome, market contrast, capabilities, context, tools, and memory.",
    durationInFrames: submission.durationInFrames,
    component: SubmissionVideo,
  },
  {
    id: "Intro",
    label: "Intro",
    blurb: "The agent-native web thesis and the five-PR roadmap.",
    durationInFrames: 420,
    component: Intro,
  },
  {
    id: "PR1",
    label: "PR1 · Hardened runtime",
    blurb:
      "Reasoning-safe JSON extraction, schema retries, model fallback — verified live.",
    durationInFrames: 600,
    component: Pr1,
  },
  {
    id: "PR2",
    label: "PR2 · Self-healing UI",
    blurb:
      "Sandbox captures runtime errors; the model regenerates a corrected document.",
    durationInFrames: 610,
    component: Pr2,
  },
  {
    id: "PR3",
    label: "PR3 · Semantic discovery",
    blurb:
      "Cosine similarity blended with lexical rank finds intent with no shared keywords.",
    durationInFrames: 610,
    component: Pr3,
  },
  {
    id: "PR4",
    label: "PR4 · Composition",
    blurb:
      "One intent planned and generated as a single UI across multiple provider worlds.",
    durationInFrames: 620,
    component: Pr4,
  },
  {
    id: "PR5",
    label: "PR5 · Evaluation",
    blurb:
      "A fair baseline-vs-agent harness plus adversarial checks — measured, live.",
    durationInFrames: 620,
    component: Pr5,
  },
  {
    id: "Workflow",
    label: "Workflow · End-to-end",
    blurb:
      "Publish by chat, resolve intent, generate UI, invent an action, persist the decision.",
    durationInFrames: 590,
    component: Workflow,
  },
];

export const videoConfig = {
  fps: theme.fps,
  width: theme.width,
  height: theme.height,
};
