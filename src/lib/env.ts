// Public settings, safe on both server and client.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const TELEGRAM_BOT = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "learned_today_bot";
export const REPO_URL = "https://github.com/salimsalimzade/learned-today";

/** True until Supabase keys are set. Queries and actions read mock data instead. */
export const isMock = !SUPABASE_URL || !SUPABASE_ANON_KEY;

/** Day headers ("Today", "Yesterday") are worked out in this time zone. */
export const SITE_TIME_ZONE = "Asia/Baku";
