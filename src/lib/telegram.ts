// Telegram deep links: t.me/<bot>?start=<payload>. Payloads may only use A–Z a–z 0–9 _ -
// and be 64 characters at most, so non-ASCII slugs (şəki, düyü) are base64url-encoded.
import { TELEGRAM_BOT } from "./env";
import type { FollowTarget } from "./types";

const PREFIX = { topic: "t", tag: "g", author: "a" } as const;
const TYPES = { t: "topic", g: "tag", a: "author" } as const;

function b64url(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function startPayload(target: Pick<FollowTarget, "type" | "slug">) {
  const p = PREFIX[target.type];
  return /^[a-z0-9-]+$/.test(target.slug) ? `${p}_${target.slug}` : `${p}b_${b64url(target.slug)}`;
}

export function parseStartPayload(payload: string): Pick<FollowTarget, "type" | "slug"> | null {
  const m = payload.match(/^([tga])(b?)_([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  try {
    return { type: TYPES[m[1] as keyof typeof TYPES], slug: m[2] ? unb64url(m[3]) : m[3] };
  } catch {
    return null;
  }
}

export function telegramFollowUrl(target: Pick<FollowTarget, "type" | "slug">) {
  return `https://t.me/${TELEGRAM_BOT}?start=${startPayload(target)}`;
}

export function rssPath(target: Pick<FollowTarget, "type" | "slug">) {
  return `/${target.type}/${encodeURIComponent(target.slug)}/rss.xml`;
}
