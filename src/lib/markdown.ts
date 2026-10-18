// Markdown → prose blocks, run on the server for post pages, RSS and Telegram.
// Raw HTML in a post is shown as text, and links only allow http(s), mailto and site paths.
import { Marked, type Token, type Tokens } from "marked";
import { languageLabel, normalizeLanguage } from "./languages";
import { lowlight } from "./lowlight";
import type { ProseBlock } from "./types";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function safeHref(href: string) {
  const h = href.trim();
  if (/^(https?:|mailto:)/i.test(h) || h.startsWith("/") || h.startsWith("#")) return h;
  return null;
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
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
      return safe
        ? `<a href="${escapeHtml(safe)}" rel="nofollow ugc noopener noreferrer">${escapeHtml(text || href)}</a>`
        : escapeHtml(text);
    },
  },
});

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

function hastToHtml(node: HastNode): string {
  if (node.type === "text") return escapeHtml(node.value ?? "");
  const inner = (node.children ?? []).map(hastToHtml).join("");
  if (node.type === "element") {
    const cls = tokClass(node.properties?.className ?? []);
    return cls ? `<span class="${cls}">${inner}</span>` : inner;
  }
  return inner;
}

export function highlight(code: string, lang: string) {
  const id = normalizeLanguage(lang);
  if (id === "txt" || !lowlight.registered(id)) return escapeHtml(code);
  return hastToHtml(lowlight.highlight(id, code) as unknown as HastNode);
}

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

/** Full HTML for RSS readers, with plain code blocks. */
export function toHtml(markdown: string) {
  return marked.parse(markdown) as string;
}
