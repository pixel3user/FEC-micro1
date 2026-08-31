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
    text: "Before, every expected outcome needs an application-specific workflow stack built in advance.",
  },
  {
    id: "22-agent-discover",
    from: 4640,
    text: "That stack includes routes, forms, state, branches, provider adapters, result views, and the libraries connecting them.",
  },
  {
    id: "23-agent-actions",
    from: 4820,
    text: "Each new journey adds implementation, testing, dependencies, and maintenance before the user can request it.",
  },
  {
    id: "24-agent-verify",
    from: 5000,
    text: "One LLM reasoning process considers the complete outcome, context, constraints, capabilities, and current state together.",
  },
  {
    id: "25-agent-direction",
    from: 5170,
    text: "We are not replacing the trusted execution stack with an LLM. We are replacing more of the application-specific workflow stack with reasoning at runtime.",
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

  // 07 · Baseline and improvement evidence — chapter starts at frame 6270.
  {
    id: "31-evidence-baseline",
    from: 6270,
    text: "Our measured baseline is keyword-ranked provider search plus fixed pages, modeling the basic search-and-click flow people use today.",
  },
  {
    id: "32-evidence-outcome",
    from: 6450,
    text: "The baseline returns links and instructions for the user; our solution reasons toward an authorized, persisted outcome.",
  },
  {
    id: "33-evidence-discovery",
    from: 6630,
    text: "For blurry eyesight, lexical search looks for shared words while semantic discovery connects the request to vision assessment.",
  },
  {
    id: "34-evidence-score",
    from: 6810,
    text: "Across four fixed cases, relevant top-provider accuracy improved from two out of four to four out of four.",
  },
  {
    id: "35-evidence-composition",
    from: 6990,
    text: "For a birthday venue and food, the baseline finds two providers separately; our solution combines both into one plan.",
  },
  {
    id: "36-evidence-steps",
    from: 7170,
    text: "Modeled navigation falls from six steps to two for composition, but these are assumptions, not observed user telemetry.",
  },
  {
    id: "37-evidence-persistence",
    from: 7350,
    text: "A persistent result means the first authorized action changes durable provider state and records a decision event.",
  },
  {
    id: "38-evidence-followup",
    from: 7510,
    text: "A later request receives current state and recent events, so it can explain what is already arranged without starting over.",
  },
  {
    id: "39-evidence-boundary",
    from: 7670,
    text: "State updates and idempotency are tested; a distinct semantic follow-up is supported, but not yet measured.",
  },
];

const AUDIO_DIRECTORY = "submission-tts-temp";
const TEMPORARY_NARRATION_END_FRAME = 7830;

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
