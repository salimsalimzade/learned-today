// Who is making this request. Server only: imported from "use server" functions and routes,
// never from components (it pulls in @solidjs/start/http, which refuses to load in the browser).
import { deleteCookie, setCookie } from "@solidjs/start/http";
import { getRequestEvent } from "solid-js/web";
import { isMock } from "../env";
import { parseCookieHeader } from "../prefs";
import { createSupabaseServerClient } from "../supabase/server";
import type { SessionUser } from "../types";

const DEMO_COOKIE = "lt_demo_user";

/** Demo mode only (no Supabase keys): the sample account that "sign in" uses. */
const DEMO_USER: SessionUser = { id: "demo", handle: "sebine-q", name: "Səbinə Quliyeva", avatarUrl: null, provider: "github" };

/**
 * Cookies from the request event, not from h3's getCookie: after an action, SolidStart
 * re-renders the page in the same round trip ("single flight") with a rebuilt request that
 * already carries the cookies the action just set. h3's helper would still see the old ones.
 */
export function requestCookies() {
  return parseCookieHeader(getRequestEvent()?.request.headers.get("cookie"));
}

const getCookie = (name: string) => requestCookies()[name];

/** Who is asking: the handle and the signed-in user. */
export async function getCtx() {
  const viewer = await getViewer();
  return { viewer: viewer?.handle ?? null, user: viewer };
}

export async function getViewer(): Promise<SessionUser | null> {
  if (isMock) {
    const handle = getCookie(DEMO_COOKIE);
    return handle ? DEMO_USER : null;
  }
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
  if (!profile) return null;
  return {
    id: profile.id,
    handle: profile.handle,
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
    provider: profile.provider === "google" ? "google" : "github",
  };
}

/** Demo mode only: "sign in" as the sample account. */
export function startDemoSession() {
  setCookie(DEMO_COOKIE, DEMO_USER.handle, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
}

export function endDemoSession() {
  deleteCookie(DEMO_COOKIE, { path: "/" });
}
