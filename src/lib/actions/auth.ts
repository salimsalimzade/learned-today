import { action, redirect } from "@solidjs/router";
import { safeNext } from "../safe-next";
import { clearAuthCookies, createSupabaseServerClient, requestOrigin } from "../supabase/server";
import type { Provider } from "../types";

/** Starts the OAuth flow with Google or GitHub; /auth/callback finishes it. */
export const signIn = action(async (provider: Provider, next: string) => {
  "use server";
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${requestOrigin()}/auth/callback?next=${encodeURIComponent(safeNext(next))}` },
  });
  if (error || !data.url) return { ok: false as const };
  // The page is leaving for the provider, so refetching this page's queries would only be cut off mid-stream.
  throw redirect(data.url, { revalidate: "nothing" });
}, "signIn");

/**
 * Signs this browser out, always. auth.signOut() returns its errors instead of throwing (it throws only on
 * bugs), and how far it got depends on where it failed:
 *   Supabase unreachable or erroring on /logout: cookies cleared, but the session isn't revoked there
 *   reading or refreshing the session failed first:  nothing cleared, the person would stay signed in
 * So on any error the cookies are deleted here too, and the error is logged. A session left un-revoked at
 * Supabase expires on its own, and without its cookies this browser can no longer use it.
 */
export const signOut = action(async () => {
  "use server";
  const { error } = await createSupabaseServerClient()
    .auth.signOut()
    .catch((e: Error) => ({ error: e }));
  if (error) {
    console.error(`signOut: ${error.message}`);
    clearAuthCookies();
  }
  return { ok: true as const };
}, "signOut");
