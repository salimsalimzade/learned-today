import type { APIEvent } from "@solidjs/start/server";
import { isMock } from "~/lib/env";
import { createSupabaseServerClient } from "~/lib/supabase/server";

/**
 * GET /auth/callback?code=…&next=/share
 * Supabase sends people here after Google or GitHub. The code is swapped for a session,
 * which @supabase/ssr writes as cookies on this response, then we redirect to `next`.
 */
export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const rawNext = url.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const code = url.searchParams.get("code");

  if (isMock || !code) return Response.redirect(new URL(next, url.origin), 303);

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  const to = error ? `/?auth_error=${encodeURIComponent(error.code ?? "exchange_failed")}` : next;
  return new Response(null, { status: 303, headers: { Location: new URL(to, url.origin).href } });
}
