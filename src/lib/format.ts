import { SITE_TIME_ZONE } from "./env";
import type { MessageKey } from "./i18n";
import type { Locale } from "./types";

const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** YYYY-MM-DD in the site time zone. */
export function dayKey(date: string | Date) {
  return keyFmt.format(typeof date === "string" ? new Date(date) : date);
}

/** 15.10.2026, the format the designs use in both languages. */
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

/** "Bu gün", "Dünən" or the weekday, for sticky day headers. */
export function dayTitle(key: string, locale: Locale, t: (k: MessageKey) => string) {
  const today = dayKey(new Date());
  if (key === today) return t("day.today");
  if (key === shiftKey(today, -1)) return t("day.yesterday");
  const [y, m, d] = key.split("-").map(Number);
  const name = new Intl.DateTimeFormat(locale === "az" ? "az-AZ" : "en-GB", { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("az"))
    .join("");
}

/** About 200 words a minute, never less than one. */
export function readMinutes(markdown: string) {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " code ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Case- and accent-aware lowercase for matching Azerbaijani text (İ → i, I → ı). */
export function fold(s: string) {
  return s.toLocaleLowerCase("az");
}
