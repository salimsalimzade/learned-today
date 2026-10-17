import { createContext, createSignal, onCleanup, onMount, type ParentProps, useContext } from "solid-js";
import { readPrefs, THEME_COOKIE, type ThemePref, writeCookie } from "./prefs";

interface Theme {
  pref: () => ThemePref;
  setPref: (p: ThemePref) => void;
  /** light → dark → system → light, for the t shortcut and the command palette */
  cycle: () => void;
}

const ThemeContext = createContext<Theme>();

function apply(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function ThemeProvider(props: ParentProps) {
  const [pref, setPrefSignal] = createSignal<ThemePref>(readPrefs().theme);

  onMount(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => pref() === "system" && apply("system");
    mq.addEventListener("change", onChange);
    onCleanup(() => mq.removeEventListener("change", onChange));
  });

  const setPref = (p: ThemePref) => {
    setPrefSignal(p);
    // "system" is stored too, so the boot script can tell it apart from no choice at all.
    writeCookie(THEME_COOKIE, p);
    apply(p);
  };

  const order: ThemePref[] = ["light", "dark", "system"];
  const cycle = () => setPref(order[(order.indexOf(pref()) + 1) % order.length]);

  return <ThemeContext.Provider value={{ pref, setPref, cycle }}>{props.children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
