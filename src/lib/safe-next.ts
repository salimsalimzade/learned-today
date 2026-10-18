// Where to send someone after sign-in (?next=). Shared by the signIn action and /auth/callback.
const BASE = "http://next.invalid";

/**
 * A path on this site, or "/". It parses the value the way the browser will instead of checking its
 * prefix: "/\evil.com" and "/<tab>/evil.com" start with one slash, yet browsers read both as
 * "//evil.com", another site. Leading slashes are collapsed so "/.//evil.com" can't come out as "//evil.com".
 */
export function safeNext(next: string | null | undefined): string {
  try {
    const url = new URL(next || "/", BASE);
    if (url.origin !== BASE) return "/";
    return `${url.pathname.replace(/^\/+/, "/")}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
