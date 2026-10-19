import type { logger } from "@sentry/solidstart";

/**
 * Browser logs for Sentry (Explore → Logs), each linked to the trace and replay it happened in. Server code keeps
 * to console.*, which Workers Logs collects. entry-client.tsx hands Sentry's logger over once Sentry has started;
 * on the server nothing does, so these calls do nothing there. A plain import of @sentry/solidstart here would
 * put Sentry's Node SDK in the Worker, since components render on the server too.
 *
 * A log is for something handled that's still worth knowing about: a recoverable failure, a fallback taken. A
 * crash is already an error event, and a routine click isn't worth a log. The message is a fixed sentence, so it
 * can be searched as is; what you'd filter on goes in attributes, named `lt.<area>.<field>` or after a Sentry
 * convention (`error.type`). No post text, names or tokens: like the rest of Sentry here, nothing personal.
 */
type Attributes = Record<string, string | number | boolean>;
type Sink = Pick<typeof logger, "info" | "warn" | "error">;

let sink: Sink | undefined;

export function setLogger(logger: Sink) {
  sink = logger;
}

export const log = {
  info: (message: string, attributes?: Attributes) => sink?.info(message, attributes),
  warn: (message: string, attributes?: Attributes) => sink?.warn(message, attributes),
  error: (message: string, attributes?: Attributes) => sink?.error(message, attributes),
};
