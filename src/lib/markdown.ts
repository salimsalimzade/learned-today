// Markdown → prose blocks, run on the server for post pages, RSS and Telegram.
// Raw HTML in a post is shown as text, and links only allow http(s), mailto and site paths.
import { Marked, type RendererObject, type Token, type Tokens } from "marked";
import { languageLabel, normalizeLanguage } from "./languages";
import { lowlight } from "./lowlight";
import type { PostCard, ProseBlock } from "./types";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function safeHref(href: string) {
  const h = href.trim();
  if (/^(https?:|mailto:)/i.test(h) || h.startsWith("/") || h.startsWith("#")) return h;
  return null;
}

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

const SNIPPET_LINES = 6;

/** A block's words without its Markdown, for excerpts. */
function plainText(token: Token): string {
  if (token.type === "list") return (token as Tokens.List).items.map(plainText).join(" ");
  if ("tokens" in token && token.tokens?.length) return token.tokens.map(plainText).join("");
  if (token.type === "br") return " ";
  return "text" in token ? token.text : "";
}

/**
 * What a feed card shows under the title, from the note's first block: its code (the first few lines,
 * highlighted) when the note opens with a code block, otherwise its text.
 */
export function toPreview(markdown: string, plainLabel = "Plain text"): Pick<PostCard, "excerpt" | "snippet"> {
  const first = (marked.lexer(markdown) as Token[]).find((t) => t.type !== "space" && t.type !== "hr");
  if (!first) return { excerpt: "", snippet: null };
  if (first.type === "code") {
    const t = first as Tokens.Code;
    const lang = normalizeLanguage(t.lang);
    const lines = t.text.replace(/^\s*\n/, "").split("\n");
    const code = lines.slice(0, SNIPPET_LINES).join("\n");
    return {
      excerpt: "",
      snippet: { label: languageLabel(lang, plainLabel), html: highlight(code, lang), truncated: lines.length > SNIPPET_LINES },
    };
  }
  return { excerpt: plainText(first).replace(/\s+/g, " ").trim().slice(0, 280), snippet: null };
}

/** Full HTML for RSS readers, with highlighted code blocks styled inline. */
export function toHtml(markdown: string) {
  return rssMarked.parse(markdown) as string;
}
