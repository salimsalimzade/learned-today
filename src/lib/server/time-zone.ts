// Server only (it sets cookies through @solidjs/start/http).
import { setCookie } from "@solidjs/start/http";
import { readTimeZoneChoice, TZ_CHOICE_COOKIE, YEAR } from "../prefs";
import type { createSupabaseServerClient } from "../supabase/server";

/**
 * Right after sign-in, lines this browser and the account up (profiles.time_zone, 0001). An account with a
 * zone wins: it goes into this browser's tz_choice cookie. An account without one takes the zone this browser
 * picked, so a choice made before signing in isn't lost. Best effort: sign-in goes on whatever happens here.
 */
export async function syncTimeZoneOnSignIn(supabase: ReturnType<typeof createSupabaseServerClient>, userId: string) {
  const { data: profile, error } = await supabase.from("profiles").select("time_zone").eq("id", userId).maybeSingle();
  if (error || !profile) return;
  if (profile.time_zone) {
    // Not httpOnly: the time zone menu and the boot script read it in the browser.
    setCookie(TZ_CHOICE_COOKIE, profile.time_zone, { path: "/", maxAge: YEAR, sameSite: "lax" });
    return;
  }
  const picked = readTimeZoneChoice();
  if (picked) await supabase.from("profiles").update({ time_zone: picked }).eq("id", userId);
}
