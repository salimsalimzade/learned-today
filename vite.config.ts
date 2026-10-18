// SolidStart 2 replaces v1's app.config.ts with this file.
// SolidStart options go in solidStart(), server and deploy options in `nitro`.
import { createHash } from "node:crypto";
import { relative } from "node:path";
import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solidStart(), nitro({ preset: "cloudflare-module", rolldownConfig: { output: { inlineDynamicImports: true } } })],
  // Port 3000 matches VITE_SITE_URL and the OAuth redirect URLs in supabase/config.toml.
  // allowedHosts lets a tunnel (cloudflared, ngrok) reach the dev server so Telegram can call
  // the webhook while you test. A leading dot allows every subdomain.
  server: { port: 3000, allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".loca.lt"] },
  css: {
    modules: {
      // Class names stay kebab-case in the markup too: `.select-trigger` → `select-trigger-3fa2c`.
      generateScopedName: (name, filename) =>
        `${name}-${createHash("md5")
          .update(`${relative(process.cwd(), filename.replace(/\?.*$/, ""))}:${name}`)
          .digest("hex")
          .slice(0, 5)}`,
    },
  },
  // SolidStart's dev error overlay reads source maps with this CommonJS package. Under pnpm,
  // Vite doesn't find it on its own, so pre-bundle it or `pnpm dev` fails to hydrate.
  optimizeDeps: {
    include: ["@solidjs/start > @jridgewell/trace-mapping"],
  },
  // The preset is pinned to Cloudflare Workers above; wrangler.jsonc holds the Worker settings.
});
