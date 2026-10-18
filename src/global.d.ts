/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface RequestEventLocals {
    /** This request's CSP nonce (src/middleware.ts), for the inline scripts in entry-server.tsx. */
    nonce?: string;
  }
}
