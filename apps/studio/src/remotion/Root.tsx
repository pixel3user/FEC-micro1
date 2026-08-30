import { Composition } from "remotion";
import { Intro } from "./compositions/Intro";
import { theme } from "./theme";

/** Registry of all showcase compositions. One per PR will be added here. */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={420}
        fps={theme.fps}
        width={theme.width}
        height={theme.height}
      />
    </>
  );
}
