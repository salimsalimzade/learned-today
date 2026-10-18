// The theme lives in a cookie so the server renders the right one on first paint.
import { getRequestEvent, isServer } from "solid-js/web";
import { DEFAULT_TIME_ZONE } from "./env";

export type ThemePref = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";
const YEAR = 60 * 60 * 24 * 365;

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

/** The visitor's IANA time zone, e.g. "Europe/London". Set by timeZoneBootScript. */
export const TZ_COOKIE = "tz";

function isTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The visitor's time zone from its cookie, or DEFAULT_TIME_ZONE when there is none (or it isn't a real zone). */
export function readTimeZone(): string {
  const zone = readCookies()[TZ_COOKIE];
  return zone && isTimeZone(zone) ? zone : DEFAULT_TIME_ZONE;
}

export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${YEAR}; SameSite=Lax`;
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
 * blocked, nothing happens and the default stays.
 */
export const timeZoneBootScript = (rendered: string) =>
  `(function(){try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;if(!z)return;var m=document.cookie.match(/(?:^|; )${TZ_COOKIE}=([^;]*)/);if(m&&decodeURIComponent(m[1])===z)return;document.cookie="${TZ_COOKIE}="+encodeURIComponent(z)+"; Path=/; Max-Age=${YEAR}; SameSite=Lax";if(z===${JSON.stringify(rendered)}||document.cookie.indexOf("${TZ_COOKIE}=")<0||sessionStorage.getItem("tz-reload"))return;sessionStorage.setItem("tz-reload","1");location.reload();}catch(e){}})();`;
