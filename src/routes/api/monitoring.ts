import type { APIEvent } from "@solidjs/start/server";
import { SENTRY_DSN } from "~/lib/env";

/**
 * POST /api/monitoring
 * Sentry's browser SDK sends its envelopes here (`tunnel` in entry-client.tsx) and they go on to Sentry. Only
 * envelopes for our own project are forwarded, so this can't be used to post anywhere else. The path avoids the
 * word "sentry", which ad blockers match.
 */
const dsn = new URL(SENTRY_DSN);
const ENVELOPE_URL = `https://${dsn.host}/api${dsn.pathname}/envelope/`;

export async function POST(event: APIEvent) {
  const body = await event.request.arrayBuffer();
  // An envelope opens with a line of JSON naming the DSN it's for. What follows can be binary (compressed replays).
  const bytes = new Uint8Array(body);
  const newline = bytes.indexOf(10);
  let target: URL;
  try {
    target = new URL(JSON.parse(new TextDecoder().decode(bytes.subarray(0, newline < 0 ? undefined : newline))).dsn);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (target.host !== dsn.host || target.pathname !== dsn.pathname) return new Response(null, { status: 400 });

  const res = await fetch(ENVELOPE_URL, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-sentry-envelope" },
  });
  // Sentry's rate-limit headers go back, so the SDK backs off when it's told to.
  const headers = new Headers();
  for (const name of ["Retry-After", "X-Sentry-Rate-Limits"]) {
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(null, { status: res.status, headers });
}
