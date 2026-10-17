/** Thrown by queries that only have a mock implementation so far. See docs/architecture.md. */
export function notWired(what: string): never {
  throw new Error(`${what}: Supabase query not written yet. Unset VITE_SUPABASE_URL to use mock data.`);
}
