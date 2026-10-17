import { action, redirect } from "@solidjs/router";
import { isMock } from "../env";
import { endDemoSession, startDemoSession } from "../server/viewer";
import { createSupabaseServerClient, requestOrigin } from "../supabase/server";
import type { Provider } from "../types";

/** Only same-site paths, so ?next= can't send people elsewhere. */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/**
 * Demo mode signs in as the sample account and revalidates everything.
 * With Supabase it starts the OAuth flow; /auth/callback finishes it.
 */
export const signIn = action(async (provider: Provider, next: string) => {
  "use server";
  if (isMock) {
    startDemoSession();
    return { ok: true as const };
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${requestOrigin()}/auth/callback?next=${encodeURIComponent(safeNext(next))}` },
  });
  if (error || !data.url) return { ok: false as const };
  throw redirect(data.url);
}, "signIn");

export const signOut = action(async () => {
  "use server";
  if (isMock) endDemoSession();
  else await createSupabaseServerClient().auth.signOut();
  return { ok: true as const };
}, "signOut");
