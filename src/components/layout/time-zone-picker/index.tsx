import { createAsync, revalidate, useAction } from "@solidjs/router";
import { format } from "date-fns";
import { createEffect, createMemo, createSignal, onMount } from "solid-js";
import { type SearchOption, SearchSelect, showToast } from "~/components/ui-kit";
import { saveTimeZone } from "~/lib/actions/prefs";
import { inTimeZone } from "~/lib/format";
import { deleteCookie, readTimeZoneChoice, TZ_CHOICE_COOKIE, TZ_COOKIE, timeZoneChanged, writeCookie } from "~/lib/prefs";
import { getFeed } from "~/lib/queries/posts";
import { getSession } from "~/lib/queries/session";
import styles from "./time-zone-picker.module.css";

const AUTO = "auto";

const name = (zone: string) => zone.replace(/_/g, " ");

/** "GMT+4" or "GMT+5:30" for a zone right now, or "" for a name this browser doesn't know. */
function offsetOf(zone: string, now: Date) {
  try {
    return format(inTimeZone(now, zone), "O");
  } catch {
    return "";
  }
}

/** "America/New York (GMT-4)", findable by its offset too. */
function zoneOption(zone: string, now: Date): SearchOption {
  const offset = offsetOf(zone, now);
  return { value: zone, label: offset ? `${name(zone)} (${offset})` : name(zone), keywords: offset };
}

/**
 * Points this browser's cookie at a zone (null = Automatic, the browser's own), then updates the page in place:
 * dates re-render through timeZoneChanged, and the feed, whose days are cut on the server, is fetched again.
 */
function applyZone(zone: string | null, browser: string | null) {
  if (zone) writeCookie(TZ_CHOICE_COOKIE, zone);
  else {
    deleteCookie(TZ_CHOICE_COOKIE);
    if (browser) writeCookie(TZ_COOKIE, browser);
  }
  timeZoneChanged();
  return revalidate(getFeed.key);
}

/**
 * The time zone days are cut in ("Today", "Yesterday", dates on notes). "Automatic" follows the browser, which
 * is what everyone gets until they pick one here. A pick is kept in its own cookie (prefs.ts) and the page updates
 * in place: dates re-render and the feed, whose days are cut on the server, reloads. Signed in, the pick is also saved on the profile
 * (profiles.time_zone), and a zone saved there wins on every device. An account without one ("Automatic")
 * leaves each device to its browser. Searchable, as there are ~420 zones: "york", "tokyo" or "gmt+4" all work.
 */
export function TimeZonePicker() {
  const choice = () => readTimeZoneChoice();
  const [detected, setDetected] = createSignal<string | null>(null);
  // The server and the first client render know only the current choice. The full list fills in when the
  // browser is idle, so the page doesn't carry ~420 zones it may never show.
  const initial = choice();
  const [zones, setZones] = createSignal<SearchOption[]>(initial ? [{ value: initial, label: name(initial) }] : []);
  const options = createMemo<SearchOption[]>(() => [
    { value: AUTO, label: detected() ? `Automatic · ${name(detected() ?? "")}` : "Automatic", keywords: "browser" },
    ...zones(),
  ]);
  const session = createAsync(() => getSession());
  const save = useAction(saveTimeZone);

  // Signed in, and the account has a zone this device isn't using (it was picked on another device): switch to
  // it. An account without a zone doesn't override anything, so a pick made here before signing in stays. Once
  // per page: a browser that refuses the cookie would otherwise keep switching.
  let synced = false;
  createEffect(() => {
    const user = session();
    if (!user?.timeZone || user.timeZone === choice() || synced) return;
    synced = true;
    applyZone(user.timeZone, null);
  });

  onMount(() => {
    setDetected(Intl.DateTimeFormat().resolvedOptions().timeZone || null);
    const fill = () => {
      const now = new Date();
      const ids = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
      const all = [...new Set([...ids, "UTC", ...(initial ? [initial] : [])])].sort();
      setZones(all.map((zone) => zoneOption(zone, now)));
    };
    if ("requestIdleCallback" in window) requestIdleCallback(fill, { timeout: 2000 });
    else setTimeout(fill, 200);
  });

  const change = async (option: SearchOption) => {
    const zone = option.value === AUTO ? null : option.value;
    if (zone === choice()) return;
    // The account first: if it kept the old zone, the sync above would undo this device's change.
    if (session()) {
      const saved = await save(zone).catch(() => null);
      if (!saved?.ok) return showToast({ title: "Couldn't save your time zone.", description: "Try again in a moment.", variant: "error" });
    }
    await applyZone(zone, detected());
  };

  return (
    <SearchSelect
      class={styles.picker}
      label="Time zone"
      hideLabel
      placeholder="Search time zones"
      listLabel="Open the time zone list"
      options={options()}
      value={choice() ?? AUTO}
      onChange={change}
    />
  );
}
