import { z } from "zod";

const MarkerObservationSchema = z
  .object({
    marker: z.string(),
    present: z.boolean(),
  })
  .strict();

export const HtmlStructureObservationSchema = z
  .object({
    hasDoctype: z.boolean(),
    hasHtmlElement: z.boolean(),
    hasHeadElement: z.boolean(),
    hasTitleElement: z.boolean(),
    hasBodyElement: z.boolean(),
    hasMainElement: z.boolean(),
    tagsBalanced: z.boolean(),
    hasInvokeBridge: z.boolean(),
    prohibitedTagCount: z.number().int().nonnegative(),
    externalScriptCount: z.number().int().nonnegative(),
    inlineEventHandlerCount: z.number().int().nonnegative(),
    javascriptUrlCount: z.number().int().nonnegative(),
    requiredMarkers: z.array(MarkerObservationSchema),
    structurallyValid: z.boolean(),
    safe: z.boolean(),
    passed: z.boolean(),
  })
  .strict();

export type HtmlStructureObservation = z.infer<
  typeof HtmlStructureObservationSchema
>;

type TagToken = {
  closing: boolean;
  name: string;
  attributes: string;
  selfClosing: boolean;
  rawText?: string;
};

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const RAW_TEXT_ELEMENTS = new Set(["script", "style"]);
const PROHIBITED_ELEMENTS = new Set(["embed", "iframe", "object"]);

/**
 * Conservatively checks generated HTML without executing it. The API has no
 * direct HTML-parser dependency, so this tokenizer rejects malformed nesting,
 * misplaced document elements, and suspicious executable attributes.
 */
export function observeHtmlStructure(
  html: string,
  expectedMarkers: readonly string[] = [],
): HtmlStructureObservation {
  const tokens = tokenizeHtml(html);
  const stack: string[] = [];
  const counts = new Map<string, number>();
  let tagsBalanced = tokens.valid;
  let hierarchyValid = true;
  let prohibitedTagCount = 0;
  let externalScriptCount = 0;
  let inlineEventHandlerCount = 0;
  let javascriptUrlCount = 0;
  let hasInvokeBridge = false;
  let bodySeen = false;

  for (const token of tokens.tags) {
    const { closing, name } = token;
    if (!closing) {
      const parent = stack.at(-1);
      counts.set(name, (counts.get(name) ?? 0) + 1);
      if (name === "html" && parent !== undefined) hierarchyValid = false;
      if (name === "head" && (parent !== "html" || bodySeen)) {
        hierarchyValid = false;
      }
      if (name === "body") {
        if (parent !== "html") hierarchyValid = false;
        bodySeen = true;
      }
      if (name === "title" && !stack.includes("head")) hierarchyValid = false;
      if (name === "main" && !stack.includes("body")) hierarchyValid = false;

      if (PROHIBITED_ELEMENTS.has(name)) prohibitedTagCount += 1;
      if (name === "script" && /\bsrc\s*=/i.test(token.attributes)) {
        externalScriptCount += 1;
      }
      const decodedAttributes = decodeHtmlEntities(token.attributes);
      inlineEventHandlerCount += countMatches(
        decodedAttributes,
        /(?:^|[\s/])on[a-z][a-z0-9_-]*\s*=/gi,
      );
      javascriptUrlCount += countJavascriptUrls(decodedAttributes);
      if (
        name === "script" &&
        !/\bsrc\s*=/i.test(token.attributes) &&
        isExecutableScript(token.attributes) &&
        hasTypedInvokeCall(token.rawText ?? "")
      ) {
        hasInvokeBridge = true;
      }

      if (!token.selfClosing && !VOID_ELEMENTS.has(name)) stack.push(name);
      continue;
    }

    if (VOID_ELEMENTS.has(name) || stack.pop() !== name) {
      tagsBalanced = false;
    }
  }
  if (stack.length > 0) tagsBalanced = false;

  const hasDoctype = /^\s*<!doctype\s+html\s*>/i.test(html);
  const hasHtmlElement = counts.get("html") === 1;
  const hasHeadElement = counts.get("head") === 1;
  const hasTitleElement = counts.get("title") === 1;
  const hasBodyElement = counts.get("body") === 1;
  const hasMainElement = (counts.get("main") ?? 0) >= 1;
  const requiredMarkers = expectedMarkers.map((marker) => ({
    marker,
    present: html.includes(marker),
  }));
  const structurallyValid =
    hasDoctype &&
    hasHtmlElement &&
    hasHeadElement &&
    hasTitleElement &&
    hasBodyElement &&
    hasMainElement &&
    tagsBalanced &&
    hierarchyValid;
  const safe =
    prohibitedTagCount === 0 &&
    externalScriptCount === 0 &&
    inlineEventHandlerCount === 0 &&
    javascriptUrlCount === 0;
  const passed =
    structurallyValid &&
    safe &&
    hasInvokeBridge &&
    requiredMarkers.every(({ present }) => present);

  return HtmlStructureObservationSchema.parse({
    hasDoctype,
    hasHtmlElement,
    hasHeadElement,
    hasTitleElement,
    hasBodyElement,
    hasMainElement,
    tagsBalanced,
    hasInvokeBridge,
    prohibitedTagCount,
    externalScriptCount,
    inlineEventHandlerCount,
    javascriptUrlCount,
    requiredMarkers,
    structurallyValid,
    safe,
    passed,
  });
}

function tokenizeHtml(html: string): { tags: TagToken[]; valid: boolean } {
  const tags: TagToken[] = [];
  let valid = true;
  let cursor = 0;

  while (cursor < html.length) {
    const opening = html.indexOf("<", cursor);
    if (opening < 0) break;
    if (html.startsWith("<!--", opening)) {
      const commentEnd = html.indexOf("-->", opening + 4);
      if (commentEnd < 0) return { tags, valid: false };
      cursor = commentEnd + 3;
      continue;
    }
    if (/^<!doctype\b/i.test(html.slice(opening))) {
      const doctypeEnd = html.indexOf(">", opening + 2);
      if (doctypeEnd < 0) return { tags, valid: false };
      cursor = doctypeEnd + 1;
      continue;
    }

    const end = findTagEnd(html, opening + 1);
    if (end < 0) return { tags, valid: false };
    const source = html.slice(opening + 1, end).trim();
    const match = /^(\/?)\s*([a-zA-Z][a-zA-Z0-9:-]*)([\s\S]*)$/.exec(source);
    if (!match) {
      valid = false;
      cursor = end + 1;
      continue;
    }
    const closing = match[1] === "/";
    const name = (match[2] ?? "").toLowerCase();
    const attributes = match[3] ?? "";
    const token: TagToken = {
      closing,
      name,
      attributes,
      selfClosing: /\/\s*$/.test(attributes),
    };

    if (!closing && RAW_TEXT_ELEMENTS.has(name) && !token.selfClosing) {
      const closingPattern = new RegExp(`<\\s*\\/\\s*${name}\\s*>`, "gi");
      closingPattern.lastIndex = end + 1;
      const closingMatch = closingPattern.exec(html);
      if (!closingMatch) return { tags, valid: false };
      token.rawText = html.slice(end + 1, closingMatch.index);
      tags.push(token, {
        closing: true,
        name,
        attributes: "",
        selfClosing: false,
      });
      cursor = closingPattern.lastIndex;
      continue;
    }

    tags.push(token);
    cursor = end + 1;
  }

  return { tags, valid };
}

function findTagEnd(html: string, start: number): number {
  let quote: '"' | "'" | null = null;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (quote !== null) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index;
    }
  }
  return -1;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_match, digits: string) =>
      String.fromCodePoint(Number.parseInt(digits, 16)),
    )
    .replace(/&#([0-9]+);?/g, (_match, digits: string) =>
      String.fromCodePoint(Number.parseInt(digits, 10)),
    )
    .replace(/&colon;/gi, ":");
}

function countJavascriptUrls(attributes: string): number {
  const pattern =
    /\b(?:href|src|action|formaction)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let count = 0;
  for (const match of attributes.matchAll(pattern)) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";
    const browserNormalized = value
      .replace(/[\u0000-\u0020\u007f]+/g, "")
      .toLowerCase();
    if (browserNormalized.startsWith("javascript:")) count += 1;
  }
  return count;
}

function isExecutableScript(attributes: string): boolean {
  const typeMatch = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
    attributes,
  );
  if (!typeMatch) return true;
  const type = (typeMatch[1] ?? typeMatch[2] ?? typeMatch[3] ?? "")
    .trim()
    .toLowerCase();
  return (
    type === "" ||
    type === "module" ||
    type === "text/javascript" ||
    type === "application/javascript" ||
    type === "text/ecmascript" ||
    type === "application/ecmascript"
  );
}

function hasTypedInvokeCall(script: string): boolean {
  const call = /\bwindow\s*\.\s*agent\s*\.\s*invoke\s*\(\s*\{/.exec(script);
  if (!call) return false;
  const invocationSource = script.slice(call.index, call.index + 5_000);
  return (
    /\bworldId\s*:/.test(invocationSource) &&
    /\baction\s*:/.test(invocationSource) &&
    /\barguments\s*:/.test(invocationSource)
  );
}

function countMatches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}
