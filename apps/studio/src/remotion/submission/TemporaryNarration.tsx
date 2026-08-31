import { Audio, Sequence, staticFile } from "remotion";

/**
 * TEMPORARY SUBMISSION TTS
 *
 * This layer mirrors the visible SubmissionVideo caption cues. To remove the
 * temporary voice later:
 *   1. Remove <TemporarySubmissionNarration /> from SubmissionVideo.tsx.
 *   2. Delete this file.
 *   3. Delete apps/studio/public/submission-tts-temp/.
 *   4. If no other static assets use it, remove the remotion_staticBase setup
 *      from apps/studio/src/main.tsx.
 *
 * No scene visuals or permanent composition logic depend on this file.
 */
export type TemporaryNarrationCue = {
  id: string;
  from: number;
  text: string;
};

export const TEMPORARY_NARRATION_CUES: TemporaryNarrationCue[] = [
  // 01 · Who has the problem? — chapter starts at frame 270.
  {
    id: "01-problem-user",
    from: 270,
    text: "Every person completing a task online must first learn how that website expects the task to be expressed.",
  },
  {
    id: "02-problem-translation",
    from: 450,
    text: "Pages, menus, filters, accounts, and forms are translations between one human intention and one provider action.",
  },
  {
    id: "03-problem-provider",
    from: 660,
    text: "Providers pay the same tax: frontend and backend workflows for every interaction they can predict.",
  },
  {
    id: "04-problem-goal",
    from: 880,
    text: "Our goal is to replace that application-specific interaction code with reasoning at runtime.",
  },

  // 02 · The bottleneck — chapter starts at frame 1110.
  {
    id: "05-bottleneck-attention",
    from: 1110,
    text: "Many websites optimize navigation and attention even when the user already knows the result they want.",
  },
  {
    id: "06-bottleneck-interface",
    from: 1310,
    text: "If an agent understands the same human actions, the interaction no longer needs to be pre-rendered as pages and forms.",
  },
  {
    id: "07-bottleneck-reasoning",
    from: 1540,
    text: "The changing workflow can come from LLM reasoning instead of permanently written application logic.",
  },
  {
    id: "08-bottleneck-substrate",
    from: 1750,
    text: "A small trusted substrate remains for identity, permission, storage, validation, and transport.",
  },

  // 03 · A real outcome — chapter starts at frame 1950.
  {
    id: "09-usecase-request",
    from: 1950,
    text: "The user describes a difficult real outcome once and supplies the context the model needs.",
  },
  {
    id: "10-usecase-visual",
    from: 2150,
    text: "The LLM reasons visually about the apartment, detects accessibility problems, and preserves every personal constraint.",
  },
  {
    id: "11-usecase-discovery",
    from: 2380,
    text: "It discovers ramp rental, moving, equipment, delivery, installation, and building-rule capabilities by meaning.",
  },
  {
    id: "12-usecase-compose",
    from: 2600,
    text: "Those independent providers are composed into one plan; the agent asks only for decisions that require consent.",
  },
  {
    id: "13-usecase-output",
    from: 2810,
    text: "The output is the adapted plan and verified commitments — not six websites, directories, calendars, and checkout forms.",
  },
  {
    id: "14-usecase-novel",
    from: 3030,
    text: "No provider could predict this exact workflow. The LLM creates it through reasoning for this person and this moment.",
  },

  // 04 · What changes — chapter starts at frame 3270.
  {
    id: "15-market-websites",
    from: 3270,
    text: "Websites and mobile apps encode actions in permanent human-operated interfaces.",
  },
  {
    id: "16-market-apis",
    from: 3450,
    text: "APIs remove the visual layer, but developers still hand-code every connection and workflow.",
  },
  {
    id: "17-market-agents",
    from: 3630,
    text: "Chatbots and browser agents usually sit on top of the same flows; generative UI creates another interface.",
  },
  {
    id: "18-market-added",
    from: 3840,
    text: "We added provider worlds, semantic discovery, arbitrary actions, composition, stored decisions, and adaptive outcomes.",
  },
  {
    id: "19-market-bridge",
    from: 4060,
    text: "The prototype uses generated HTML as a bridge. The final direction removes that temporary interface too.",
  },
  {
    id: "20-market-result",
    from: 4280,
    text: "The model should reason from request to result instead of generating software that the user must operate.",
  },

  // 05 · How agents help — chapter starts at frame 4470.
  {
    id: "21-agent-intent",
    from: 4470,
    text: "The agent understands the desired outcome rather than forcing it into a predefined interface.",
  },
  {
    id: "22-agent-discover",
    from: 4640,
    text: "It discovers providers by meaning, reads current capabilities and state, and requests only missing context.",
  },
  {
    id: "23-agent-actions",
    from: 4820,
    text: "It chooses action names and arguments at runtime and composes multiple providers when one is not enough.",
  },
  {
    id: "24-agent-verify",
    from: 5000,
    text: "Authorized actions are performed and verified before the model communicates the final result.",
  },
  {
    id: "25-agent-direction",
    from: 5170,
    text: "The final goal is reasoning that defines the interaction — not another generated website.",
  },

  // 06 · Context, tools, and memory — chapter starts at frame 5370.
  {
    id: "26-future-context",
    from: 5370,
    text: "Context tells the model who the user is, what is happening now, and which constraints must survive the plan.",
  },
  {
    id: "27-future-tools",
    from: 5550,
    text: "Tools let the agent discover capabilities, retrieve live information, perform authorized operations, and verify results.",
  },
  {
    id: "28-future-memory",
    from: 5730,
    text: "Memory carries useful preferences and previous decisions forward without making the user repeat them.",
  },
  {
    id: "29-future-code",
    from: 5910,
    text: "Together they allow more application-specific frontend and backend workflow code to become runtime reasoning.",
  },
  {
    id: "30-future-endgoal",
    from: 6060,
    text: "The end goal is an internet where people communicate desired outcomes and generative AI returns the result directly.",
  },
];

const AUDIO_DIRECTORY = "submission-tts-temp";
const TEMPORARY_NARRATION_END_FRAME = 6270;

export function TemporarySubmissionNarration() {
  return (
    <>
      {TEMPORARY_NARRATION_CUES.map((cue, index) => {
        const nextCue = TEMPORARY_NARRATION_CUES[index + 1];
        const endFrame = nextCue?.from ?? TEMPORARY_NARRATION_END_FRAME;

        return (
          <Sequence
            key={cue.id}
            from={cue.from}
            durationInFrames={endFrame - cue.from}
            name={`Temporary TTS · ${cue.id}`}
          >
            <Audio
              src={staticFile(`${AUDIO_DIRECTORY}/${cue.id}.mp3`)}
              volume={0.92}
            />
          </Sequence>
        );
      })}
    </>
  );
}
