// Last three code languages picked, per browser. Only a convenience, so storage errors are ignored.
const KEY = "lt.recentLangs";

export function readRecentLanguages(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function rememberLanguage(id: string) {
  try {
    const next = [id, ...readRecentLanguages().filter((x) => x !== id)].slice(0, 3);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}
