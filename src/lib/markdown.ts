// Markdown → prose blocks, run on the server for post pages, RSS and Telegram.
// Raw HTML in a post is shown as text, and links only allow http(s), mailto and site paths.
import { Marked, type RendererObject, type Token, type Tokens } from "marked";
import { CARD_BODY_MAX, CARD_CODE_LINES } from "./card-preview";
import { languageLabel, normalizeLanguage } from "./languages";
import { safeHref } from "./links";
import { lowlight } from "./lowlight";
import type { CardPreview, ProseBlock } from "./types";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const renderer: RendererObject = {
  html({ text }) {
    return escapeHtml(text);
  },
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const safe = safeHref(href);
    if (!safe) return text;
    const external = /^https?:/i.test(safe);
    const t = title ? ` title="${escapeHtml(title)}"` : "";
    const rel = external ? ` rel="nofollow ugc noopener noreferrer"` : "";
    return `<a href="${escapeHtml(safe)}"${t}${rel}>${text}</a>`;
  },
  image({ href, text }) {
    // No images in notes. Show the alt text as a link instead.
    const safe = safeHref(href);
    return safe ? `<a href="${escapeHtml(safe)}" rel="nofollow ugc noopener noreferrer">${escapeHtml(text || href)}</a>` : escapeHtml(text);
  },
};

const marked = new Marked({ gfm: true, breaks: false, renderer });

// highlight.js class names → the design system's tok-* classes (styles/syntax.css)
function tokClass(classes: string[]): string | null {
  const c = classes.join(" ");
  if (/hljs-comment|hljs-quote/.test(c)) return "tok-comment";
  if (/hljs-string|hljs-regexp|hljs-template-tag|hljs-symbol/.test(c)) return "tok-string";
  if (/hljs-number|hljs-literal/.test(c)) return "tok-number";
  if (/hljs-title/.test(c) && /function_/.test(c)) return "tok-function";
  if (/hljs-built_in/.test(c)) return "tok-function";
  if (/hljs-type|hljs-title/.test(c)) return "tok-type";
  if (/hljs-keyword|hljs-selector-tag/.test(c)) return "tok-keyword";
  if (/hljs-property|hljs-attr|hljs-attribute|hljs-variable|hljs-params/.test(c)) return "tok-property";
  if (/hljs-operator|hljs-punctuation/.test(c)) return "tok-punct";
  return null;
}

type HastNode = { type: string; value?: string; tagName?: string; properties?: { className?: string[] }; children?: HastNode[] };

/** `open` writes the opening <span> for a tok-* class: with the class on the site, with inline styles in RSS. */
function hastToHtml(node: HastNode, open: (tok: string) => string): string {
  if (node.type === "text") return escapeHtml(node.value ?? "");
  const inner = (node.children ?? []).map((child) => hastToHtml(child, open)).join("");
  if (node.type === "element") {
    const tok = tokClass(node.properties?.className ?? []);
    return tok ? `${open(tok)}${inner}</span>` : inner;
  }
  return inner;
}

function highlightWith(code: string, lang: string, open: (tok: string) => string) {
  const id = normalizeLanguage(lang);
  if (id === "txt" || !lowlight.registered(id)) return escapeHtml(code);
  return hastToHtml(lowlight.highlight(id, code) as unknown as HastNode, open);
}

export function highlight(code: string, lang: string) {
  return highlightWith(code, lang, (tok) => `<span class="${tok}">`);
}

// RSS readers drop stylesheets and class names but mostly keep style attributes, so feed code carries its
// look inline: the post page's code block in the site's dark colours (styles/syntax.css, tokens.css). A dark
// block reads the same in a light or a dark reader.
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const RSS_TOK: Record<string, string> = {
  "tok-keyword": "color:#c9a2ff;font-weight:500",
  "tok-string": "color:#8bd49a",
  "tok-number": "color:#f2b36b",
  "tok-function": "color:#6fcfd6",
  "tok-type": "color:#e8c27a",
  "tok-property": "color:#ededed",
  "tok-punct": "color:#b0b0b0",
  "tok-comment": "color:#9a9a9a;font-style:italic",
};
const RSS_BOX = "margin:16px 0;border:1px solid #2a2a2a;border-radius:8px;background:#1a1a1a;overflow:hidden";
const RSS_LANG = `margin:0;padding:6px 16px;border-bottom:1px solid #2a2a2a;color:#9a9a9a;font:12px/16px ${MONO}`;
const RSS_PRE = `margin:0;padding:12px 16px;overflow-x:auto;background:#1a1a1a;color:#ededed;font:14px/24px ${MONO};tab-size:2;white-space:pre`;
// Readers often style <code> themselves (a light background inside the dark block); undo that.
const RSS_CODE = "font:inherit;color:inherit;background:none;padding:0;border:0";
// Inline code takes the reader's own text colour, so a translucent grey works on light and dark.
const RSS_INLINE = `padding:1px 5px;border-radius:4px;background:rgba(127,127,127,0.18);font-family:${MONO};font-size:0.875em`;

const rssMarked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    ...renderer,
    code({ text, lang }) {
      const id = normalizeLanguage(lang);
      const code = text.replace(/^(?:[ \t]*\n)+/, "");
      const html = highlightWith(code, id, (tok) => `<span style="${RSS_TOK[tok]}">`);
      return `<div style="${RSS_BOX}"><p style="${RSS_LANG}">${escapeHtml(languageLabel(id, "Plain text"))}</p><pre style="${RSS_PRE}"><code style="${RSS_CODE}">${html}</code></pre></div>\n`;
    },
    codespan({ text }) {
      return `<code style="${RSS_INLINE}">${escapeHtml(text)}</code>`;
    },
  },
});

function stripOuter(html: string) {
  const m = html.trim().match(/^<([a-z0-9]+)[^>]*>([\s\S]*)<\/\1>$/i);
  return m ? m[2] : html;
}

export function toBlocks(markdown: string, plainLabel = "Plain text"): ProseBlock[] {
  const blocks: ProseBlock[] = [];
  for (const token of marked.lexer(markdown) as Token[]) {
    switch (token.type) {
      case "space":
        break;
      case "code": {
        const t = token as Tokens.Code;
        const lang = normalizeLanguage(t.lang);
        blocks.push({ kind: "code", lang, label: languageLabel(lang, plainLabel), code: t.text, html: highlight(t.text, lang) });
        break;
      }
      case "heading": {
        const t = token as Tokens.Heading;
        blocks.push({ kind: "html", tag: t.depth <= 2 ? "h2" : "h3", html: marked.parseInline(t.text) as string });
        break;
      }
      case "paragraph":
        blocks.push({
          kind: "html",
          tag: "p",
          html: marked
            .parser([token])
            .trim()
            .replace(/^<p>|<\/p>$/g, ""),
        });
        break;
      case "list": {
        const t = token as Tokens.List;
        blocks.push({
          kind: "html",
          tag: t.ordered ? "ol" : "ul",
          html: stripOuter(marked.parser([token])),
        });
        break;
      }
      case "blockquote":
        blocks.push({ kind: "html", tag: "blockquote", html: stripOuter(marked.parser([token])) });
        break;
      case "hr":
        blocks.push({ kind: "html", tag: "hr", html: "" });
        break;
      case "table":
        blocks.push({ kind: "html", tag: "table", html: stripOuter(marked.parser([token])) });
        break;
      default:
        blocks.push({ kind: "html", tag: "p", html: escapeHtml(("raw" in token && token.raw) || "") });
    }
  }
  return blocks;
}

// Rough rendered heights (px) for a card's compact prose: --text-body-sm lines, --space-4 between blocks. A card
// column (680px less padding) fits about 90 characters a line; 80 errs toward cutting a little early.
const LINE = 24;
const GAP = 16;
const CHARS_PER_LINE = 80;

const textOf = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&[#a-z0-9]+;/gi, "x");
const linesOf = (text: string, perLine = CHARS_PER_LINE) => Math.max(1, Math.ceil(text.trim().length / perLine));
const codeLines = (code: string) => code.split("\n").length;

function blockHeight(b: ProseBlock): number {
  if (b.kind === "code") {
    const lines = codeLines(b.code);
    // header with Copy, padding, the visible lines, then "Show all" when it's longer (measured in a card)
    return 42 + 24 + Math.min(lines, CARD_CODE_LINES) * LINE + (lines > CARD_CODE_LINES ? 41 : 0);
  }
  switch (b.tag) {
    case "h2":
    case "h3":
      return LINE + GAP;
    case "hr":
      return 1;
    case "table":
      return (b.html.match(/<tr[\s>]/g)?.length ?? 1) * 33;
    case "ul":
    case "ol":
      return b.html
        .split(/<li[\s>]/)
        .slice(1)
        .reduce((h, item) => h + linesOf(textOf(item), CHARS_PER_LINE - 6) * LINE + 8, 0);
    default:
      return linesOf(textOf(b.html)) * LINE;
  }
}

/**
 * What a feed card shows: the note's blocks until they fill CARD_BODY_MAX, judged by estimated height so the
 * server decides and the page doesn't shift. The block that crosses the line is kept (the card clamps and fades
 * it); everything after is left out, and the card links to the post for it.
 */
export function toCardPreview(markdown: string): CardPreview {
  const all = toBlocks(markdown, "Plain text");
  const blocks: ProseBlock[] = [];
  let height = 0;
  for (const b of all) {
    const h = (blocks.length ? GAP : 0) + blockHeight(b);
    // Text still reads when the cut falls inside it. A code block or table cut after its first lines doesn't,
    // so it shows whole (one line of the card's slack allowed) or waits behind "Read more".
    const whole = b.kind === "code" || b.tag === "table";
    if (blocks.length && (height > CARD_BODY_MAX - 2 * LINE || (whole && height + h > CARD_BODY_MAX + LINE))) break;
    height += h;
    blocks.push(b);
  }
  const hidden = all.slice(blocks.length);
  const truncated = hidden.length > 0 || height > CARD_BODY_MAX;
  return { blocks, truncated, hidden: hidden.length };
}

/** Full HTML for RSS readers, with highlighted code blocks styled inline. */
export function toHtml(markdown: string) {
  return rssMarked.parse(markdown) as string;
}
