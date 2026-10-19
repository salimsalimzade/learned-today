// Public settings, safe on both server and client.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const TELEGRAM_BOT = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "tildailybot";
export const REPO_URL = "https://github.com/salimsalimzade/learned-today";
/** Where the browser reports errors (entry-client.tsx). Public by design: it only lets someone send events to this project. */
export const SENTRY_DSN = "https://92e469ff01c8de6a22f8c312e48f46c0@o4512280051515392.ingest.de.sentry.io/4512280066326608";

/** The time zone used when the visitor's own can't be found. Otherwise day headers ("Today", "Yesterday") use theirs (readTimeZone in prefs.ts). */
export const DEFAULT_TIME_ZONE = "Asia/Baku";
