import { createContext, createSignal, type ParentProps, useContext } from "solid-js";
import { isServer } from "solid-js/web";
import { LANG_COOKIE, readPrefs, writeCookie } from "../prefs";
import type { Locale } from "../types";
import { az, type MessageKey, type Messages } from "./az";
import { en } from "./en";

export type { MessageKey } from "./az";

const dictionaries: Record<Locale, Messages> = { az, en };
type Params = Record<string, string | number>;

function format(template: string, params?: Params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

export function translate(locale: Locale, key: MessageKey, params?: Params) {
  return format(dictionaries[locale][key] ?? az[key], params);
}

interface I18n {
  locale: () => Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, params?: Params) => string;
  /** BCP-47 tag for Intl APIs */
  intl: () => string;
}

const I18nContext = createContext<I18n>();

export function I18nProvider(props: ParentProps) {
  const [locale, setLocaleSignal] = createSignal<Locale>(readPrefs().lang);
  const setLocale = (l: Locale) => {
    setLocaleSignal(l);
    if (!isServer) {
      writeCookie(LANG_COOKIE, l);
      document.documentElement.lang = l;
    }
  };
  const value: I18n = {
    locale,
    setLocale,
    t: (key, params) => translate(locale(), key, params),
    intl: () => (locale() === "az" ? "az-AZ" : "en-GB"),
  };
  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
