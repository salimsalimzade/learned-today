// Dates as people see them, always on the clock of the visitor's time zone: the one they picked in the footer,
// else their browser's (readTimeZone in prefs.ts). Works the same on the server and in the browser, so the
// server-rendered page and the hydrated one agree. date-fns does the formatting and the calendar maths;
// TZDate (@date-fns/tz) is a Date whose day, month and hour are read in a given zone.
import { TZDate } from "@date-fns/tz";
import { differenceInCalendarDays, format, parse } from "date-fns";
import { readTimeZone } from "./prefs";

/** A day key ("2026-10-15") as a plain calendar date, for date-fns. Not a moment: no zone applies. */
const KEY = "yyyy-MM-dd";
const parseKey = (key: string) => parse(key, KEY, new Date());

/** The moment `date`, read on the clock in `timeZone`. */
export function inTimeZone(date: string | Date, timeZone = readTimeZone()) {
  return new TZDate(new Date(date).getTime(), timeZone);
}

/** YYYY-MM-DD in the visitor's time zone: the day a moment falls on there. Groups the feed into days. */
export function dayKey(date: string | Date, timeZone = readTimeZone()) {
  return format(inTimeZone(date, timeZone), KEY);
}

/** 15.10.2026, the format the designs use, on the visitor's calendar. */
export function formatDate(date: string | Date) {
  return format(inTimeZone(date), "dd.MM.yyyy");
}

/** A day key in the same 15.10.2026 format. */
export function formatDayKey(key: string) {
  return format(parseKey(key), "dd.MM.yyyy");
}

/** "Today", "Yesterday" or the weekday ("Monday"), for sticky day headers. Today is today in the visitor's zone. */
export function dayTitle(key: string) {
  const days = differenceInCalendarDays(parseKey(dayKey(new Date())), parseKey(key));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return format(parseKey(key), "EEEE");
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
