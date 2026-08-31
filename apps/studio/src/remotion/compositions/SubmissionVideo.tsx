import { Sequence } from "remotion";
import {
  AgentsChapter,
  ClosingChapter,
  FutureChapter,
} from "../submission/AgentsFuture";
import {
  BottleneckChapter,
  ProblemChapter,
  TitleChapter,
} from "../submission/OpeningProblem";
import { MarketChapter, UseCaseChapter } from "../submission/UseCaseMarket";
import { PersistentHeader, SubmissionCanvas } from "../submission/Primitives";
import { TemporarySubmissionNarration } from "../submission/TemporaryNarration";
import { chapters } from "../submission/design";

/**
 * Hackathon submission film. It deliberately uses a dense editorial workspace
 * rather than a slide deck: every chapter keeps the request, reasoning,
 * providers, and direct result visible together while the active path evolves.
 */
export function SubmissionVideo() {
  return (
    <SubmissionCanvas>
      <Sequence from={chapters[0].from} durationInFrames={chapters[0].duration}>
        <TitleChapter />
      </Sequence>
      <Sequence from={chapters[1].from} durationInFrames={chapters[1].duration}>
        <ProblemChapter />
      </Sequence>
      <Sequence from={chapters[2].from} durationInFrames={chapters[2].duration}>
        <BottleneckChapter />
      </Sequence>
      <Sequence from={chapters[3].from} durationInFrames={chapters[3].duration}>
        <UseCaseChapter />
      </Sequence>
      <Sequence from={chapters[4].from} durationInFrames={chapters[4].duration}>
        <MarketChapter />
      </Sequence>
      <Sequence from={chapters[5].from} durationInFrames={chapters[5].duration}>
        <AgentsChapter />
      </Sequence>
      <Sequence from={chapters[6].from} durationInFrames={chapters[6].duration}>
        <FutureChapter />
      </Sequence>
      <Sequence from={chapters[7].from} durationInFrames={chapters[7].duration}>
        <ClosingChapter />
      </Sequence>
      <TemporarySubmissionNarration />
      <PersistentHeader />
    </SubmissionCanvas>
  );
}
