// @refresh reload
import * as Sentry from "@sentry/solidstart";
import { solidRouterBrowserTracingIntegration } from "@sentry/solidstart/solidrouter";
import { mount, StartClient } from "@solidjs/start/client";
import { SENTRY_DSN, SITE_URL } from "./lib/env";
import { setLogger } from "./lib/log";

// Browser errors, page and navigation timings, logs and replays go to Sentry. Server errors stay with Workers Issues
// (wrangler.jsonc): Sentry's server SDK expects Node, and this app runs on Workers.
Sentry.init({
  dsn: SENTRY_DSN,
  // The live site only: a build served from VITE_SITE_URL, which only the deploy job sets to the real address
  // (.env has localhost:3000). `pnpm dev`, `wrangler dev` and any other copy send nothing.
  enabled: import.meta.env.PROD && location.origin === SITE_URL,
  // Events go through our own Worker (routes/api/monitoring.ts), so the CSP's connect-src stays as it is and
  // ad blockers that drop requests to sentry.io let them through.
  tunnel: "/api/monitoring",
  integrations: [solidRouterBrowserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  // sentry-trace and baggage headers go on calls to the site itself only; Supabase gets none.
  tracePropagationTargets: [SITE_URL],
  // Replay masks all text and blocks images by default. One session in ten, and every session that hits an error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // No IP address or account on events, no cookies (the Supabase session) and no request bodies (drafts, follows).
  dataCollection: { userInfo: false, cookies: false, httpBodies: [] },
});
// log.* in components (lib/log.ts) sends through this. SDK 11 sends logs without an enableLogs flag.
setLogger(Sentry.logger);

mount(() => <StartClient />, document.getElementById("app")!);
