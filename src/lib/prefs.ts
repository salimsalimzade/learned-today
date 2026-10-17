// Theme and language live in cookies so the server renders the right ones on first paint.
import { getRequestEvent, isServer } from "solid-js/web";
import type { Locale } from "./types";

export type ThemePref = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";
export const LANG_COOKIE = "lang";
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

export function readPrefs(): { theme: ThemePref; lang: Locale } {
  const c = readCookies();
  const theme: ThemePref = c[THEME_COOKIE] === "light" || c[THEME_COOKIE] === "dark" ? c[THEME_COOKIE] : "system";
  const lang: Locale = c[LANG_COOKIE] === "en" ? "en" : "az";
  return { theme, lang };
}

export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${YEAR}; SameSite=Lax`;
}

/**
 * Runs in <head> before first paint. The server can only set data-theme for an explicit
 * choice; for "system" this script reads prefers-color-scheme so dark users never see a flash.
 */
export const themeBootScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);var d=document.documentElement;d.dataset.theme=m?m[1]:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");}catch(e){}})();`;
