import type { ComponentType } from "react";
import { Intro } from "./remotion/compositions/Intro";
import { Pr1 } from "./remotion/compositions/Pr1";
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
];

export const videoConfig = {
  fps: theme.fps,
  width: theme.width,
  height: theme.height,
};
