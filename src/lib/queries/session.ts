import { query } from "@solidjs/router";
import { getViewer } from "../server/viewer";
import type { SessionUser } from "../types";

/** The signed-in user, or null for guests. */
export const getSession = query(async (): Promise<SessionUser | null> => {
  "use server";
  return getViewer();
}, "session");
