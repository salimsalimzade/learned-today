// Supabase client for the browser. Most reads and writes go through server functions,
// so this is mainly for realtime subscriptions later on.
import { createBrowserClient } from "@supabase/ssr";
import { isMock, SUPABASE_ANON_KEY, SUPABASE_URL } from "../env";
import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowserClient() {
  if (isMock) return null;
  client ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
