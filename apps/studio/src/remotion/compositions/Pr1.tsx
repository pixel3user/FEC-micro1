import { Sequence } from "remotion";
import { CodeBlock, type CodeLine } from "../components/CodeBlock";
import { ActBadge, PrHeader, SplitStage } from "../components/layout";
import {
  Appear,
  Backdrop,
  Caption,
  Glass,
  Window,
} from "../components/primitives";
import { Terminal, type TermLine } from "../components/Terminal";
import { theme } from "../theme";

const ACCENT = theme.color.blue;

/**
 * PR1 — Hardened model runtime.
 * Act 1: the real failure (reasoning-trace garbage instead of JSON).
 * Act 2: condensed but faithful extraction + fallback logic.
 * Act 3: the real captured proof (garbage -> valid JSON -> fallback -> cost).
 */
export function Pr1() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Backdrop />
      <PrHeader tag="PR1" title="Hardened model runtime" accent={ACCENT} />

      <Sequence durationInFrames={150}>
        <ProblemAct />
      </Sequence>
      <Sequence from={150} durationInFrames={230}>
        <CodeAct />
      </Sequence>
      <Sequence from={380} durationInFrames={220}>
        <ProofAct />
      </Sequence>
    </div>
  );
}

function ProblemAct() {
  const badOutput: TermLine[] = [
    { text: "model: deepseek/deepseek-v4-flash-0731", tone: "muted" },
    { text: "asking for a JSON object…", tone: "muted" },
    {
      text: '{ "json_outer_script_here} }</think>}Response:{" : "no_: { " }',
      tone: "bad",
    },
    { text: "JSON.parse -> SyntaxError", tone: "bad" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={1} label="The problem" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 90,
          right: 90,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          alignItems: "center",
        }}
      >
        <Appear delay={6}>
          <h2
            style={{
              fontFamily: theme.font.sans,
              fontSize: 46,
              fontWeight: 700,
              color: theme.color.ink,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Cheap models don't always return clean JSON.
            <span style={{ color: theme.color.muted, fontWeight: 500 }}>
              {" "}
              They leak <code>&lt;think&gt;</code> traces and truncate.
            </span>
          </h2>
        </Appear>
        <Appear delay={14}>
          <Window title="live output" accent={theme.color.red}>
            <Terminal lines={badOutput} startReveal={20} perLine={16} />
          </Window>
        </Appear>
      </div>
      <Caption
        delay={20}
        text="Observed live on the default model — a raw fetch would crash here."
      />
    </>
  );
}

function CodeAct() {
  const extract: CodeLine[] = [
    { text: "// json-extract.ts — simplified" },
    { text: "export function extractJsonObject(raw) {" },
    { text: "  const clean = raw", spot: true },
    { text: "    .replace(/<think>[\\s\\S]*?<\\/think>/g, '')", spot: true },
    { text: "    .replace(/```(json)?/g, '').trim();" },
    { text: "  // scan for the first balanced { … }" },
    { text: "  const body = balancedObject(clean);", spot: true },
    { text: "  return JSON.parse(body ?? clean);" },
    { text: "}" },
  ];
  const fallback: CodeLine[] = [
    { text: "// openrouter.ts — simplified" },
    { text: "for (const model of [primary, ...fallbacks]) {", spot: true },
    { text: "  for (let attempt = 0; attempt < 2; attempt++) {" },
    { text: "    const out = await call(model, prompt);" },
    { text: "    try { return schema.parse(", spot: true },
    { text: "      extractJsonObject(out)); }" },
    { text: "    catch (e) { correction = repair(e); }" },
    { text: "  } // hard errors -> next model" },
    { text: "}" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={2} label="The implementation" accent={ACCENT} />
      </div>
      <SplitStage
        left={
          <Appear delay={6} style={{ height: "100%" }}>
            <Window
              title="reasoning-safe extraction"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={extract}
                startReveal={12}
                perLine={7}
                fontSize={25}
              />
            </Window>
          </Appear>
        }
        right={
          <Appear delay={12} style={{ height: "100%" }}>
            <Window
              title="schema retries + model fallback"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={fallback}
                startReveal={70}
                perLine={7}
                fontSize={25}
              />
            </Window>
          </Appear>
        }
      />
      <Caption
        delay={10}
        text="Strip the reasoning trace, extract the balanced object, validate against a schema, and fall back to another model on failure."
      />
    </>
  );
}

function ProofAct() {
  const log: TermLine[] = [
    {
      text: "RUN_LIVE_MODEL_TESTS=1 pnpm --filter api test",
      prompt: true,
      tone: "muted",
    },
    { text: "world-intake -> valid JSON  [pass]", tone: "good" },
    { text: '{"event":"model.usage","cost":0.0000189}', tone: "json" },
    { text: "runtime-ui -> deepseek truncated", tone: "warn" },
    { text: "  fallback: openai/gpt-4o-mini -> valid  [pass]", tone: "good" },
    { text: "2 passed  |  live cost ~ $0.0017 total", tone: "good" },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 90 }}>
        <ActBadge index={3} label="Proof it works" accent={ACCENT} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 90,
          right: 90,
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 32,
        }}
      >
        <Appear delay={6}>
          <Window title="live model tests" accent={theme.color.green}>
            <Terminal lines={log} startReveal={14} perLine={18} fontSize={26} />
          </Window>
        </Appear>
        <Appear delay={16}>
          <Glass strong style={{ padding: "32px 34px" }}>
            <Stat label="Extraction" value="reasoning-safe" />
            <Stat label="Fallback" value="verified live" />
            <Stat label="Cost / call" value="$0.0000189" />
            <Stat label="Total live spend" value="~ $0.0017" last />
          </Glass>
        </Appear>
      </div>
      <Caption
        delay={22}
        text="Real runs: garbage becomes valid JSON, the fallback rescues a truncation, and cost is a fraction of a cent."
      />
    </>
  );
}

function Stat({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "18px 0",
        borderBottom: last ? "none" : `1px solid ${theme.color.line}`,
      }}
    >
      <span
        style={{
          fontFamily: theme.font.sans,
          fontSize: 26,
          color: theme.color.muted,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: theme.font.mono,
          fontSize: 28,
          fontWeight: 700,
          color: theme.color.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}
