// The theme lives in a cookie so the server renders the right one on first paint.
import { getRequestEvent, isServer } from "solid-js/web";
import { DEFAULT_TIME_ZONE } from "./env";

export type ThemePref = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";
/** How long preference cookies (theme, time zone) last, in seconds. */
export const YEAR = 60 * 60 * 24 * 365;

export function parseCookieHeader(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    if (key) out[key] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function readCookies(): Record<string, string> {
  if (isServer) return parseCookieHeader(getRequestEvent()?.request.headers.get("cookie"));
  return parseCookieHeader(document.cookie);
}

export function readPrefs(): { theme: ThemePref } {
  const c = readCookies();
  const theme: ThemePref = c[THEME_COOKIE] === "light" || c[THEME_COOKIE] === "dark" ? c[THEME_COOKIE] : "system";
  return { theme };
}

/** The visitor's IANA time zone, e.g. "Europe/London", as the browser reports it. Set by timeZoneBootScript. */
export const TZ_COOKIE = "tz";

/** A time zone the visitor picked themselves (the footer's time zone menu). Wins over TZ_COOKIE while set. */
export const TZ_CHOICE_COOKIE = "tz_choice";

export function isTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The zone the visitor picked, or null when it follows their browser. */
export function readTimeZoneChoice(): string | null {
  const zone = readCookies()[TZ_CHOICE_COOKIE];
  return zone && isTimeZone(zone) ? zone : null;
}

/**
 * The time zone days are cut in: the one the visitor picked, else the one their browser reported, else
 * DEFAULT_TIME_ZONE (no cookie yet, cookies blocked, or not a real zone).
 */
export function readTimeZone(): string {
  const zone = readTimeZoneChoice() ?? readCookies()[TZ_COOKIE];
  return zone && isTimeZone(zone) ? zone : DEFAULT_TIME_ZONE;
}

export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${YEAR}; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * Runs in <head> before first paint. The server can only set data-theme for an explicit
 * choice; for "system" this script reads prefers-color-scheme so dark users never see a flash.
 */
export const themeBootScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);var d=document.documentElement;d.dataset.theme=m?m[1]:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");}catch(e){}})();`;

/**
 * Finds the visitor's time zone from the browser, with no permission prompt (it is not their location), and
 * keeps it in the tz cookie so the server can render day headers in it. The page was rendered in `rendered`;
 * if the browser's zone differs, the page reloads once so it matches. Without a usable zone, or with cookies
 * blocked, nothing happens and the default stays. While the visitor has picked a zone themselves
 * (TZ_CHOICE_COOKIE) it does nothing: the server already rendered in that one.
 */
export const timeZoneBootScript = (rendered: string) =>
  `(function(){try{if(/(?:^|; )${TZ_CHOICE_COOKIE}=/.test(document.cookie))return;var z=Intl.DateTimeFormat().resolvedOptions().timeZone;if(!z)return;var m=document.cookie.match(/(?:^|; )${TZ_COOKIE}=([^;]*)/);if(m&&decodeURIComponent(m[1])===z)return;document.cookie="${TZ_COOKIE}="+encodeURIComponent(z)+"; Path=/; Max-Age=${YEAR}; SameSite=Lax";if(z===${JSON.stringify(rendered)}||document.cookie.indexOf("${TZ_COOKIE}=")<0||sessionStorage.getItem("tz-reload"))return;sessionStorage.setItem("tz-reload","1");location.reload();}catch(e){}})();`;
