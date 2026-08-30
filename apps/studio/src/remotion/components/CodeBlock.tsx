import { interpolate, useCurrentFrame } from "remotion";
import { syntax, theme } from "../theme";

/**
 * Lightweight token highlighter. Not a full parser — it recognizes the token
 * shapes we use in the showcase snippets (keywords, strings, comments, calls,
 * types, numbers) so the light-glass code panes read cleanly at video scale.
 */
export type CodeLine = {
  text: string;
  /** Highlight this line as the "spotlight" once its reveal frame passes. */
  spot?: boolean;
};

const KEYWORDS = new Set([
  "const",
  "let",
  "return",
  "async",
  "await",
  "for",
  "of",
  "if",
  "else",
  "try",
  "catch",
  "throw",
  "new",
  "function",
  "class",
  "extends",
  "import",
  "from",
  "export",
  "type",
  "interface",
  "break",
  "continue",
  "as",
]);

function renderToken(token: string, key: number) {
  let color: string = syntax.plain;
  if (/^\/\//.test(token)) color = syntax.comment;
  else if (/^["'`]/.test(token)) color = syntax.string;
  else if (KEYWORDS.has(token)) color = syntax.keyword;
  else if (/^[A-Z][A-Za-z0-9]+$/.test(token)) color = syntax.type;
  else if (/^\d/.test(token)) color = syntax.number;
  else if (/^[a-zA-Z_$][\w$]*$/.test(token)) color = syntax.plain;
  else color = syntax.punctuation;
  return (
    <span key={key} style={{ color }}>
      {token}
    </span>
  );
}

function tokenize(line: string) {
  const commentIndex = line.indexOf("//");
  if (commentIndex >= 0) {
    const code = line.slice(0, commentIndex);
    const comment = line.slice(commentIndex);
    return [
      ...splitCode(code),
      <span key="c" style={{ color: syntax.comment }}>
        {comment}
      </span>,
    ];
  }
  return splitCode(line);
}

function splitCode(code: string) {
  // Split into strings vs. everything else, then tokenize the non-string parts.
  const parts = code.split(/(`[^`]*`|"[^"]*"|'[^']*')/g).filter(Boolean);
  const out: React.ReactNode[] = [];
  let key = 0;
  for (const part of parts) {
    if (/^["'`]/.test(part)) {
      out.push(renderToken(part, key++));
    } else {
      for (const t of part
        .split(/(\s+|[(){}\[\].,;:=<>|&?])/g)
        .filter(Boolean)) {
        out.push(renderToken(t, key++));
      }
    }
  }
  return out;
}

export function CodeBlock({
  lines,
  startReveal = 0,
  perLine = 3,
  fontSize = 26,
}: {
  lines: CodeLine[];
  startReveal?: number;
  perLine?: number;
  fontSize?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: theme.font.mono,
        fontSize,
        lineHeight: 1.65,
        color: syntax.plain,
      }}
    >
      {lines.map((line, index) => {
        const appearAt = startReveal + index * perLine;
        const opacity = interpolate(frame, [appearAt, appearAt + 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const spotOn =
          line.spot &&
          interpolate(frame, [appearAt + 4, appearAt + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
        return (
          <div
            key={index}
            style={{
              opacity,
              display: "flex",
              gap: 20,
              padding: "1px 12px",
              borderRadius: 8,
              background: spotOn
                ? `rgba(59,109,246,${0.1 * (spotOn as number)})`
                : "transparent",
              boxShadow:
                line.spot && spotOn
                  ? `inset 3px 0 0 ${theme.color.blue}`
                  : "none",
            }}
          >
            <span
              style={{
                color: theme.color.faint,
                width: 26,
                textAlign: "right",
                userSelect: "none",
              }}
            >
              {index + 1}
            </span>
            <span style={{ whiteSpace: "pre" }}>
              {line.text.length === 0 ? " " : tokenize(line.text)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
