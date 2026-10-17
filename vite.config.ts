// SolidStart 2 replaces v1's app.config.ts with this file.
// SolidStart options go in solidStart(), server and deploy options in `nitro`.
import { createHash } from "node:crypto";
import { relative } from "node:path";
import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solidStart(), nitro()],
  // Port 3000 matches VITE_SITE_URL and the OAuth redirect URLs in supabase/config.toml.
  server: { port: 3000 },
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
  // No preset is set on purpose. Nitro detects Vercel and Netlify when it builds
  // there, and falls back to a plain Node server everywhere else.
  // To pin one: nitro: { preset: "vercel" } (or "netlify", "node-server").
});
