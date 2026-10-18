// Who is making this request. Server only: imported from "use server" functions and routes, never from
// components (the Supabase server client reads the request's cookies).
import { getRequestEvent } from "solid-js/web";
import { createSupabaseServerClient } from "../supabase/server";
import type { SessionUser } from "../types";

/** Who is asking: the handle and the signed-in user. */
export async function getCtx() {
  const viewer = await getViewer();
  return { viewer: viewer?.handle ?? null, user: viewer };
}

/**
 * One lookup per request. A page asks several times (the header's session, then every query through
 * getCtx), and each lookup is a round trip to Supabase. Keyed by the Request object, not event.locals:
 * the single-flight re-render after an action shares locals but gets a new Request with the new cookies.
 */
const viewers = new WeakMap<Request, Promise<SessionUser | null>>();

export function getViewer(): Promise<SessionUser | null> {
  const request = getRequestEvent()?.request;
  if (!request) return loadViewer();
  let viewer = viewers.get(request);
  if (!viewer) {
    viewer = loadViewer();
    viewers.set(request, viewer);
  }
  return viewer;
}

async function loadViewer(): Promise<SessionUser | null> {
  const supabase = createSupabaseServerClient();
  // getClaims checks the token's signature locally with the project's public keys (fetched once and
  // cached), where getUser asks the Auth server every time. It falls back to getUser for old HS256 keys.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!profile) return null;
  return {
    id: profile.id,
    handle: profile.handle,
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
    provider: profile.provider === "google" ? "google" : "github",
    timeZone: profile.time_zone,
  };
}
