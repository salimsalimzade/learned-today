// Supabase client for server code (server functions, API routes).
// @supabase/ssr keeps the session in cookies, which it reads and writes through these helpers.
// Import this only from "use server" functions or server routes.

import { setCookie } from "@solidjs/start/http";
import { createServerClient } from "@supabase/ssr";
import { getRequestEvent } from "solid-js/web";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../env";
import { parseCookieHeader } from "../prefs";
import type { Database } from "./database.types";

export function createSupabaseServerClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        // Read from the request event so single-flight re-renders see cookies set moments ago.
        const header = getRequestEvent()?.request.headers.get("cookie");
        return Object.entries(parseCookieHeader(header)).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) setCookie(name, value, options);
      },
    },
  });
}

/** Service-role client that bypasses RLS. Only for trusted server code such as the Telegram webhook. */
export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createServerClient<Database>(SUPABASE_URL, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

/** The current request's origin, for OAuth redirect URLs. */
export function requestOrigin() {
  const url = getRequestEvent()?.request.url;
  return url ? new URL(url).origin : "";
}
