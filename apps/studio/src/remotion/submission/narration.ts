import narrationScript from "./narration-script.json";
import narrationTiming from "./narration-timing.json";

export const NARRATION_AUDIO_FILE =
  "submission-tts-temp/submission-narration.mp3";

export const NARRATED_CHAPTER_IDS = [
  "title",
  "problem",
  "bottleneck",
  "use-case",
  "market",
  "agents",
  "future",
  "evidence",
  "changelog",
] as const;

export type NarratedChapterId = (typeof NARRATED_CHAPTER_IDS)[number];
export type SubmissionChapterId = NarratedChapterId | "close";

export type NarrationCue = {
  id: string;
  chapter: NarratedChapterId;
  from: number;
  to: number;
  text: string;
};

if (narrationScript.length !== narrationTiming.length) {
  throw new Error("Submission narration script and timing lengths differ.");
}

export const NARRATION_CUES: NarrationCue[] = narrationScript.map(
  (scriptCue, index) => {
    const timingCue = narrationTiming[index];
    if (!timingCue || timingCue.id !== scriptCue.id) {
      throw new Error(`Submission narration timing mismatch at ${scriptCue.id}.`);
    }

    return {
      id: scriptCue.id,
      chapter: scriptCue.chapter as NarratedChapterId,
      from: timingCue.from,
      to: timingCue.to,
      text: scriptCue.text,
    };
  },
);

const chapterStarts = Object.fromEntries(
  NARRATED_CHAPTER_IDS.map((chapterId) => {
    const firstCue = NARRATION_CUES.find((cue) => cue.chapter === chapterId);
    if (!firstCue) {
      throw new Error(`Submission narration has no cue for ${chapterId}.`);
    }
    return [chapterId, firstCue.from];
  }),
) as Record<NarratedChapterId, number>;

export const CLOSING_DURATION_IN_FRAMES = 210;
export const CLOSING_FROM_FRAME = NARRATION_CUES.at(-1)?.to ?? 0;
export const SUBMISSION_DURATION_IN_FRAMES =
  CLOSING_FROM_FRAME + CLOSING_DURATION_IN_FRAMES;

export function chapterFrom(chapterId: SubmissionChapterId): number {
  return chapterId === "close"
    ? CLOSING_FROM_FRAME
    : chapterStarts[chapterId];
}

export function chapterDuration(chapterId: SubmissionChapterId): number {
  if (chapterId === "close") return CLOSING_DURATION_IN_FRAMES;

  const index = NARRATED_CHAPTER_IDS.indexOf(chapterId);
  const nextChapterId = NARRATED_CHAPTER_IDS[index + 1];
  const end = nextChapterId
    ? chapterStarts[nextChapterId]
    : CLOSING_FROM_FRAME;
  return end - chapterStarts[chapterId];
}

export function getChapterCaptionCues(chapterId: NarratedChapterId) {
  const start = chapterStarts[chapterId];
  return NARRATION_CUES.filter((cue) => cue.chapter === chapterId).map(
    (cue) => ({
      from: cue.from - start,
      to: cue.to - start,
      text: cue.text,
    }),
  );
}
