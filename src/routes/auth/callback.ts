import type { APIEvent } from "@solidjs/start/server";
import { safeNext } from "~/lib/safe-next";
import { syncTimeZoneOnSignIn } from "~/lib/server/time-zone";
import { createSupabaseServerClient } from "~/lib/supabase/server";

/**
 * GET /auth/callback?code=…&next=/share
 * Supabase sends people here after Google or GitHub. The code is swapped for a session,
 * which @supabase/ssr writes as cookies on this response, then we redirect to `next`.
 */
export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");

  if (!code) return Response.redirect(new URL(next, url.origin), 303);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  // A warning, not an error: a reused or expired code (back button, another browser) fails here too. A run of
  // them after a deploy points at the OAuth settings.
  if (error) console.warn({ event: "auth_callback_failed", code: error.code, status: error.status, message: error.message });
  if (!error && data.user) await syncTimeZoneOnSignIn(supabase, data.user.id);
  const to = error ? `/?auth_error=${encodeURIComponent(error.code ?? "exchange_failed")}` : next;
  return new Response(null, { status: 303, headers: { Location: new URL(to, url.origin).href } });
}
