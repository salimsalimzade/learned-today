import { createAsync, useAction } from "@solidjs/router";
import { createEffect, createMemo, createSignal, onMount } from "solid-js";
import { type SearchOption, SearchSelect, showToast } from "~/components/ui-kit";
import { saveTimeZone } from "~/lib/actions/prefs";
import { deleteCookie, readTimeZoneChoice, TZ_CHOICE_COOKIE, TZ_COOKIE, writeCookie } from "~/lib/prefs";
import { getSession } from "~/lib/queries/session";
import styles from "./time-zone-picker.module.css";

const AUTO = "auto";

const name = (zone: string) => zone.replace(/_/g, " ");

/** "GMT+4" for a zone right now, or "" where the browser can't say (no shortOffset support). */
function offsetOf(zone: string, now: Date) {
  try {
    return (
      new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" })
        .formatToParts(now)
        .find((p) => p.type === "timeZoneName")?.value ?? ""
    );
  } catch {
    return "";
  }
}

/** "America/New York (GMT-4)", findable by its offset too. */
function zoneOption(zone: string, now: Date): SearchOption {
  const offset = offsetOf(zone, now);
  return { value: zone, label: offset ? `${name(zone)} (${offset})` : name(zone), keywords: offset };
}

/** Points this browser's cookie at a zone (null = Automatic, the browser's own). */
function applyZone(zone: string | null, browser: string | null) {
  if (zone) return writeCookie(TZ_CHOICE_COOKIE, zone);
  deleteCookie(TZ_CHOICE_COOKIE);
  if (browser) writeCookie(TZ_COOKIE, browser);
}

/** Session storage marks a sync reload, so a browser that refuses the cookie can't reload forever. */
const SYNC_KEY = "tz-sync";
function syncOnce() {
  try {
    if (sessionStorage.getItem(SYNC_KEY)) return false;
    sessionStorage.setItem(SYNC_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/**
 * The time zone days are cut in ("Today", "Yesterday", dates on notes). "Automatic" follows the browser, which
 * is what everyone gets until they pick one here. A pick is kept in its own cookie (prefs.ts), and the page
 * reloads, since the feed's days are cut on the server. Signed in, the pick is also saved on the profile
 * (profiles.time_zone), and a zone saved there wins on every device. An account without one ("Automatic")
 * leaves each device to its browser. Searchable, as there are ~420 zones: "york", "tokyo" or "gmt+4" all work.
 */
export function TimeZonePicker() {
  const choice = readTimeZoneChoice();
  const [detected, setDetected] = createSignal<string | null>(null);
  // The server and the first client render know only the current choice. The full list fills in when the
  // browser is idle, so the page doesn't carry ~420 zones it may never show.
  const [zones, setZones] = createSignal<SearchOption[]>(choice ? [{ value: choice, label: name(choice) }] : []);
  const options = createMemo<SearchOption[]>(() => [
    { value: AUTO, label: detected() ? `Automatic · ${name(detected() ?? "")}` : "Automatic", keywords: "browser" },
    ...zones(),
  ]);
  const session = createAsync(() => getSession());
  const save = useAction(saveTimeZone);

  // Signed in, and the account has a zone this device isn't using (it was picked on another device): switch to
  // it. An account without a zone doesn't override anything, so a pick made here before signing in stays.
  createEffect(() => {
    const user = session();
    if (!user?.timeZone || user.timeZone === choice) {
      try {
        sessionStorage.removeItem(SYNC_KEY);
      } catch {}
      return;
    }
    if (!syncOnce()) return;
    applyZone(user.timeZone, null);
    location.reload();
  });

  onMount(() => {
    setDetected(Intl.DateTimeFormat().resolvedOptions().timeZone || null);
    const fill = () => {
      const now = new Date();
      const ids = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
      const all = [...new Set([...ids, "UTC", ...(choice ? [choice] : [])])].sort();
      setZones(all.map((zone) => zoneOption(zone, now)));
    };
    if ("requestIdleCallback" in window) requestIdleCallback(fill, { timeout: 2000 });
    else setTimeout(fill, 200);
  });

  const change = async (option: SearchOption) => {
    const zone = option.value === AUTO ? null : option.value;
    if (zone === choice) return;
    // The account first: if it kept the old zone, the sync above would undo this device's change.
    if (session()) {
      const saved = await save(zone).catch(() => null);
      if (!saved?.ok) return showToast({ title: "Couldn't save your time zone.", description: "Try again in a moment.", variant: "error" });
    }
    applyZone(zone, detected());
    location.reload();
  };

  return (
    <SearchSelect
      class={styles.picker}
      label="Time zone"
      hideLabel
      placeholder="Search time zones"
      listLabel="Open the time zone list"
      options={options()}
      value={choice ?? AUTO}
      onChange={change}
    />
  );
}
