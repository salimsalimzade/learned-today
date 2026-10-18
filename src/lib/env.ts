// Public settings, safe on both server and client.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const TELEGRAM_BOT = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "tildailybot";
export const REPO_URL = "https://github.com/salimsalimzade/learned-today";

/** The time zone used when the visitor's own can't be found. Otherwise day headers ("Today", "Yesterday") use theirs (readTimeZone in prefs.ts). */
export const DEFAULT_TIME_ZONE = "Asia/Baku";
