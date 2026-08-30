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

const ACCENT = theme.color.green;

/**
 * PR3 — Semantic discovery.
 * Act 1: keyword search misses intent with no shared words.
 * Act 2: cosine similarity + the 0.6 semantic / 0.4 lexical blend.
 * Act 3: real live proof — eye clinic ranks above bulldozer, zero overlap.
 */
export function Pr3() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Backdrop />
      <PrHeader tag="PR3" title="Semantic discovery" accent={ACCENT} />

      <Sequence durationInFrames={150}>
        <ProblemAct />
      </Sequence>
      <Sequence from={150} durationInFrames={230}>
        <CodeAct />
      </Sequence>
      <Sequence from={380} durationInFrames={230}>
        <ProofAct />
      </Sequence>
    </div>
  );
}

function ProblemAct() {
  const search: TermLine[] = [
    { text: 'query: "my eyesight is blurry"', tone: "muted" },
    { text: "keyword match vs. provider text:", tone: "muted" },
    { text: '"Clearview Eye Clinic — exams,', tone: "plain" },
    { text: ' vision tests, glasses" -> 0 hits', tone: "bad" },
    { text: "no shared words -> not found", tone: "bad" },
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
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            Intent rarely shares keywords with a provider's description.
            <span style={{ color: theme.color.muted, fontWeight: 500 }}>
              {" "}
              Lexical search alone misses the match.
            </span>
          </h2>
        </Appear>
        <Appear delay={14}>
          <Window title="lexical search" accent={theme.color.red}>
            <Terminal lines={search} startReveal={20} perLine={14} />
          </Window>
        </Appear>
      </div>
      <Caption
        delay={20}
        text='"Blurry eyesight" and "eye exams" mean the same thing — but share no words.'
      />
    </>
  );
}

function CodeAct() {
  const cosine: CodeLine[] = [
    { text: "// embeddings.ts — simplified" },
    { text: "function cosine(a, b) {", spot: true },
    { text: "  const dot = sum(a[i] * b[i]);" },
    { text: "  return dot / (norm(a) * norm(b));", spot: true },
    { text: "}" },
    { text: "// each published world is embedded once" },
    { text: "await store.setEmbedding(id, embed(text));" },
  ];
  const blend: CodeLine[] = [
    { text: "// service.search — simplified" },
    { text: "const q = await embed(query);" },
    { text: "for (const w of published) {" },
    { text: "  const sem = cosine(q, w.embedding);", spot: true },
    { text: "  const lex = normalizedRank(w);" },
    { text: "  score = 0.6 * sem + 0.4 * lex;", spot: true },
    { text: "}" },
    { text: "// no key? degrade to lexical only", spot: true },
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
              title="cosine similarity"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={cosine}
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
              title="semantic + lexical blend"
              accent={ACCENT}
              style={{ height: "100%" }}
            >
              <CodeBlock
                lines={blend}
                startReveal={58}
                perLine={7}
                fontSize={25}
              />
            </Window>
          </Appear>
        }
      />
      <Caption
        delay={10}
        text="Embed each world once, score queries by cosine similarity, and blend 60% semantic with 40% lexical rank — falling back to lexical if embeddings are unavailable."
      />
    </>
  );
}

function ProofAct() {
  const log: TermLine[] = [
    { text: 'query: "my vision is blurry" (0 shared words)', tone: "muted" },
    { text: "Clearview Eye Clinic     sim 0.42  [1st]", tone: "good" },
    { text: "Bulldozer Rental Co.     sim 0.07", tone: "muted" },
    { text: '{"purpose":"embedding","cost":0.0000006}', tone: "json" },
    { text: "semantic rank beats lexical  [pass]", tone: "good" },
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
          <Window title="live discovery" accent={theme.color.green}>
            <Terminal lines={log} startReveal={14} perLine={18} fontSize={25} />
          </Window>
        </Appear>
        <Appear delay={16}>
          <Glass strong style={{ padding: "30px 34px" }}>
            <Stat label="Keyword overlap" value="zero" />
            <Stat label="Ranked first" value="eye clinic" />
            <Stat label="Cost / embed" value="$0.0000006" />
            <Stat label="Fallback" value="lexical" last />
          </Glass>
        </Appear>
      </div>
      <Caption
        delay={22}
        text="Real run: the eye clinic ranks above a bulldozer rental for a query with no shared keywords — meaning, not string matching."
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
