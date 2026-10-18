// Runs around every request the Worker handles (pages, server functions, RSS, the Telegram webhook).
// Static files in /_build, the icons and fonts never reach it: Cloudflare serves them from the assets binding.
//
//   1. Rate limits per IP, with the Workers rate-limiting bindings in wrangler.jsonc.
//   2. A fresh CSP nonce per request, which entry-server.tsx puts on every inline script.
//   3. Security headers on the response.
import { createMiddleware } from "@solidjs/start/middleware";
import type { FetchEvent } from "@solidjs/start/server";
import { SUPABASE_URL } from "./lib/env";

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** A Cloudflare binding. Nitro's cloudflare-module entry puts the Worker's env on globalThis for each request. */
function binding<T>(name: string): T | undefined {
  return (globalThis as { __env__?: Record<string, unknown> }).__env__?.[name] as T | undefined;
}

/**
 * Which limiter a request counts against. The Telegram webhook is left out: it checks its own secret, and every
 * update comes from Telegram's few addresses. Everything else is reachable without signing in, and a page or a
 * server function costs one or more Supabase queries, so each IP gets a budget.
 */
function limiterFor(pathname: string) {
  if (pathname === "/api/telegram") return null;
  if (pathname.endsWith("/rss.xml")) return "RATE_LIMIT_RSS";
  return "RATE_LIMIT";
}

async function rateLimit(event: FetchEvent) {
  const name = limiterFor(new URL(event.request.url).pathname);
  const limiter = name ? binding<RateLimiter>(name) : undefined;
  // No binding under `vite dev`, and no client IP outside Cloudflare: nothing to count.
  const ip = event.request.headers.get("cf-connecting-ip");
  if (!limiter || !ip) return;
  const { success } = await limiter.limit({ key: ip });
  if (!success)
    return new Response("Too many requests. Wait a few seconds and try again.", {
      status: 429,
      headers: { "Retry-After": "10", "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
}

function setNonce(event: FetchEvent) {
  event.locals.nonce = crypto.randomUUID().replace(/-/g, "");
}

const SUPABASE_ORIGIN = SUPABASE_URL ? new URL(SUPABASE_URL).origin : "";

/**
 * Scripts: our own files plus inline scripts that carry this request's nonce (the theme and time zone boot
 * scripts and Solid's hydration data), so an injected <script> can't run. Styles allow inline: Solid and
 * Kobalte set style attributes, and the head has a one-line @layer rule. Images: avatars from the sign-in
 * providers. connect-src names Supabase for the browser client (lib/supabase/browser.ts).
 */
function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*.googleusercontent.com https://avatars.githubusercontent.com",
    "font-src 'self'",
    `connect-src 'self'${SUPABASE_ORIGIN ? ` ${SUPABASE_ORIGIN} ${SUPABASE_ORIGIN.replace(/^http/, "ws")}` : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function securityHeaders(event: FetchEvent) {
  const headers = event.response.headers;
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()");
  if (new URL(event.request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Vite's dev server injects its own scripts and styles, so the policy only applies to builds.
  if (import.meta.env.PROD && event.locals.nonce) headers.set("Content-Security-Policy", contentSecurityPolicy(event.locals.nonce));
}

export default createMiddleware({
  onRequest: [rateLimit, setNonce],
  onBeforeResponse: [securityHeaders],
});
