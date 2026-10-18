// Which link targets a note may use. Shared by the renderer (lib/markdown.ts), which drops anything else,
// and the editor's link box, which tidies what's typed so it passes.

/** http(s), mailto, a path on this site, or an anchor; null for anything else (javascript:, data:, …). */
export function safeHref(href: string) {
  const h = href.trim();
  if (/^(https?:|mailto:)/i.test(h) || h.startsWith("/") || h.startsWith("#")) return h;
  return null;
}

/**
 * What someone typed in the link box, as a link the renderer keeps: "example.com" gets https://,
 * "me@example.com" gets mailto:. null when it can't be a link (spaces, another scheme).
 */
export function normalizeHref(typed: string): string | null {
  const t = typed.trim();
  if (!t || /\s/.test(t)) return null;
  if (safeHref(t)) return t;
  // Any other scheme ("javascript:", "ftp:") is refused rather than guessed at.
  if (/^[a-z][a-z0-9+.-]*:/i.test(t) && !/^[^:/]+:\d/.test(t)) return null;
  if (/^[^@/]+@[^@/]+\.[^@/]+$/.test(t)) return `mailto:${t}`;
  if (/^[^./]+(\.[^./]+)+(:\d+)?([/?#].*)?$/.test(t)) return `https://${t}`;
  return null;
}
