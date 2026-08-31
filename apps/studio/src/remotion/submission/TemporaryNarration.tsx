import { Audio, staticFile } from "remotion";
import { NARRATION_AUDIO_FILE } from "./narration";

/**
 * Continuous submission narration. A single browser-decoded audio asset avoids
 * clipping the first phoneme at dozens of independently mounted MP3 boundaries.
 * The matching captions and chapter ranges come from the same generated timing.
 */
export function TemporarySubmissionNarration() {
  return <Audio src={staticFile(NARRATION_AUDIO_FILE)} volume={0.92} />;
}
