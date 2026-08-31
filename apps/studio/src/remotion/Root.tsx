import { Composition } from "remotion";
import { Intro } from "./compositions/Intro";
import { Pr1 } from "./compositions/Pr1";
import { Pr2 } from "./compositions/Pr2";
import { Pr3 } from "./compositions/Pr3";
import { Pr4 } from "./compositions/Pr4";
import { Pr5 } from "./compositions/Pr5";
import { SubmissionVideo } from "./compositions/SubmissionVideo";
import { Workflow } from "./compositions/Workflow";
import { submission } from "./submission/design";
import { theme } from "./theme";

/** Registry of all showcase compositions. One per PR will be added here. */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="SubmissionVideo"
        component={SubmissionVideo}
        durationInFrames={submission.durationInFrames}
        fps={submission.fps}
        width={submission.width}
        height={submission.height}
      />
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={420}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
      />
      <Composition
        id="PR1"
        component={Pr1}
        durationInFrames={600}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
      />
      <Composition
        id="PR2"
        component={Pr2}
        durationInFrames={610}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
      />
      <Composition
        id="PR3"
        component={Pr3}
        durationInFrames={610}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
      />
      <Composition
        id="PR4"
        component={Pr4}
        durationInFrames={620}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
      />
      <Composition
        id="PR5"
        component={Pr5}
        durationInFrames={620}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
      />
      <Composition
        id="Workflow"
        component={Workflow}
        durationInFrames={590}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
      />
    </>
  );
}
