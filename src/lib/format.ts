import { readTimeZone } from "./prefs";

const keyFormats = new Map<string, Intl.DateTimeFormat>();

/** YYYY-MM-DD in the visitor's time zone (the default one when theirs isn't known). */
export function dayKey(date: string | Date, timeZone = readTimeZone()) {
  let fmt = keyFormats.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    keyFormats.set(timeZone, fmt);
  }
  return fmt.format(typeof date === "string" ? new Date(date) : date);
}

/** 15.10.2026, the format the designs use. */
export function formatDate(date: string | Date) {
  const [y, m, d] = dayKey(date).split("-");
  return `${d}.${m}.${y}`;
}

export function formatDayKey(key: string) {
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

function shiftKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "Today", "Yesterday" or the weekday, for sticky day headers. */
export function dayTitle(key: string) {
  const today = dayKey(new Date());
  if (key === today) return "Today";
  if (key === shiftKey(today, -1)) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  const name = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d, 12)));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/** Lowercase, for matching text regardless of case. */
export function fold(s: string) {
  return s.toLowerCase();
}
