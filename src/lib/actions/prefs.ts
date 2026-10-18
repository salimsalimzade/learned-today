import { action, json } from "@solidjs/router";
import { isTimeZone } from "../prefs";
import { getViewer } from "../server/viewer";
import { createSupabaseServerClient } from "../supabase/server";

/**
 * Saves a signed-in person's time zone on their profile (profiles.time_zone, null = Automatic), so their other
 * devices follow it. Guests have nowhere to save it but the cookie, so for them it's a no-op that succeeds.
 */
export const saveTimeZone = action(async (zone: string | null) => {
  "use server";
  if (zone !== null && !isTimeZone(zone)) return json({ ok: false }, { revalidate: "nothing" });
  const user = await getViewer();
  if (!user) return json({ ok: true }, { revalidate: "nothing" });
  const { error } = await createSupabaseServerClient().from("profiles").update({ time_zone: zone }).eq("id", user.id);
  if (error) console.error(`saveTimeZone: ${error.message}`);
  return json({ ok: !error }, { revalidate: "nothing" });
}, "saveTimeZone");
