import React from "react";
import { submission } from "./design";

export type IconName =
  | "website"
  | "mobile"
  | "api"
  | "chat"
  | "browser"
  | "spark"
  | "intent"
  | "search"
  | "state"
  | "question"
  | "compose"
  | "lock"
  | "result"
  | "context"
  | "tools"
  | "memory"
  | "ramp"
  | "move"
  | "equipment"
  | "delivery"
  | "install"
  | "rules";

const paths: Record<IconName, React.ReactNode> = {
  website: (
    <>
      <rect x="4" y="6" width="40" height="32" rx="1" />
      <path d="M4 14H44M10 10H12M16 10H18M22 10H24M10 21H26M10 27H37M10 33H31" />
    </>
  ),
  mobile: (
    <>
      <rect x="13" y="3" width="22" height="42" rx="4" />
      <path d="M20 8H28M21 39H27M18 15H30M18 21H30M18 27H26" />
    </>
  ),
  api: (
    <>
      <path d="M15 8L5 24L15 40M33 8L43 24L33 40M28 5L20 43" />
    </>
  ),
  chat: (
    <>
      <path d="M6 8H42V34H20L11 42V34H6V8Z" />
      <path d="M13 17H35M13 24H29" />
    </>
  ),
  browser: (
    <>
      <rect x="4" y="6" width="40" height="34" rx="2" />
      <path d="M4 14H44M10 10H11M15 10H16M20 10H21M13 31L20 23L26 28L35 19" />
    </>
  ),
  spark: (
    <>
      <path d="M24 3L28 18L43 24L28 29L24 45L19 29L4 24L19 18L24 3Z" />
      <path d="M38 5L39 10L44 12L39 14L38 19L36 14L31 12L36 10L38 5Z" />
    </>
  ),
  intent: (
    <>
      <circle cx="24" cy="24" r="19" />
      <circle cx="24" cy="24" r="11" />
      <circle cx="24" cy="24" r="3" />
      <path d="M34 14L43 5M36 5H43V12" />
    </>
  ),
  search: (
    <>
      <circle cx="20" cy="20" r="14" />
      <path d="M30 30L43 43M14 20H26M20 14V26" />
    </>
  ),
  state: (
    <>
      <ellipse cx="24" cy="10" rx="17" ry="6" />
      <path d="M7 10V24C7 27 15 30 24 30C33 30 41 27 41 24V10M7 24V38C7 41 15 44 24 44C33 44 41 41 41 38V24" />
    </>
  ),
  question: (
    <>
      <circle cx="24" cy="24" r="20" />
      <path d="M17 18C18 12 30 11 32 18C34 25 24 25 24 32M24 38V40" />
    </>
  ),
  compose: (
    <>
      <circle cx="10" cy="12" r="5" />
      <circle cx="10" cy="36" r="5" />
      <circle cx="38" cy="24" r="6" />
      <path d="M15 12C26 12 26 20 32 22M15 36C26 36 26 28 32 26" />
    </>
  ),
  lock: (
    <>
      <rect x="8" y="20" width="32" height="24" rx="3" />
      <path d="M15 20V14C15 2 33 2 33 14V20M24 29V36" />
    </>
  ),
  result: (
    <>
      <path d="M5 25L16 36L43 8" />
      <path d="M42 24V42H7V7H31" />
    </>
  ),
  context: (
    <>
      <circle cx="24" cy="16" r="8" />
      <path d="M8 43C9 31 15 26 24 26C33 26 39 31 40 43M5 9H12M36 9H43M5 20H11M37 20H43" />
    </>
  ),
  tools: (
    <>
      <path d="M29 7C36 2 44 10 39 17L19 37L10 38L11 29L31 9" />
      <path d="M8 8L20 20M7 15L15 7M31 31L42 42M36 27L42 33" />
    </>
  ),
  memory: (
    <>
      <path d="M17 7C9 7 7 15 10 20C3 24 7 34 14 34C14 43 25 45 29 39C39 43 45 33 40 27C46 18 39 9 31 11C28 5 21 4 17 7Z" />
      <path d="M17 17C21 13 28 14 31 18M15 26C21 22 30 24 34 30M24 8V40" />
    </>
  ),
  ramp: <path d="M5 40H44M9 36L32 18H44V36M10 29H22M37 12V36" />,
  move: (
    <>
      <rect x="6" y="12" width="17" height="24" />
      <rect x="27" y="19" width="15" height="17" />
      <path d="M8 42L16 36L24 42M26 42L34 36L42 42M15 7H34M29 3L34 7L29 11" />
    </>
  ),
  equipment: (
    <>
      <circle cx="22" cy="38" r="6" />
      <circle cx="39" cy="38" r="6" />
      <path d="M18 5V23H34L39 32M18 13H31M10 10H18M14 23H27L31 32" />
    </>
  ),
  delivery: (
    <>
      <path d="M4 12H29V36H4V12ZM29 20H38L44 28V36H29V20Z" />
      <circle cx="13" cy="39" r="5" />
      <circle cx="36" cy="39" r="5" />
    </>
  ),
  install: (
    <>
      <path d="M7 41L27 21M18 8L25 15L15 25L8 18L18 8ZM31 27L42 38L38 42L27 31" />
      <path d="M30 5L43 18M36 5L43 12M30 11L37 18" />
    </>
  ),
  rules: (
    <>
      <path d="M11 4H37V44H11V4Z" />
      <path d="M17 14H31M17 22H31M17 30H27M17 38H24" />
    </>
  ),
};

export function LineIcon({
  name,
  size = 48,
  color = submission.color.ink,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
