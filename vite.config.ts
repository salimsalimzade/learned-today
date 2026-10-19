// SolidStart 2 replaces v1's app.config.ts with this file.
// SolidStart options go in solidStart(), server and deploy options in `nitro`.
import { createHash } from "node:crypto";
import { relative } from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Browser source maps for Sentry, built and uploaded only when the deploy job has SENTRY_AUTH_TOKEN, then deleted
// so they're never served. "hidden" leaves the sourceMappingURL comment out of the bundles. The plugin runs on the
// client build only: the Worker's map is wrangler's to upload (`sourcemap` in nitro() below).
// Not sentrySolidStart() from @sentry/solidstart/vite: it adds Sentry's Node server SDK to the Worker and deletes
// every .map after upload, the Worker's included.
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const sentrySourceMaps = sentryVitePlugin({
  disable: !SENTRY_AUTH_TOKEN,
  authToken: SENTRY_AUTH_TOKEN,
  org: "personal-things-oo",
  project: "learned-today",
  // The project lives in Sentry's EU region (the DSN's ingest.de.sentry.io).
  url: "https://de.sentry.io/",
  sourcemaps: { filesToDeleteAfterUpload: [".output/public/**/*.map"] },
}).map((plugin) => ({ ...plugin, applyToEnvironment: (environment: { name: string }) => environment.name === "client" }));

export default defineConfig({
  // src/middleware.ts: rate limits, the CSP nonce and security headers.
  // src/server-fn-error.ts: logs what a server function throws and sends the browser a plain error.
  plugins: [
    solidStart({ middleware: "./src/middleware.ts", serverFunctions: { onError: "./src/server-fn-error.ts" } }),
    nitro({
      preset: "cloudflare-module",
      rolldownConfig: { output: { inlineDynamicImports: true } },
      // .output/server/index.mjs.map, which wrangler uploads (upload_source_maps) so stacks in Workers Logs and
      // Issues point at src/. Server bundles only; the browser's maps are set under `environments` below.
      sourcemap: true,
      // `pnpm dev` runs the server in Node. The Cloudflare preset would otherwise run it in Miniflare, and
      // nitro's runner (env-runner 0.2) passes options that the Miniflare 5 beta wrangler 4.151 ships rejects,
      // so every request got "503 Runner is unavailable". Builds still target Workers; `wrangler dev` after
      // `pnpm build` runs the real Worker locally, bindings included.
      devServer: { runner: "node-worker" },
    }),
    ...sentrySourceMaps,
  ],
  environments: { client: { build: { sourcemap: SENTRY_AUTH_TOKEN ? "hidden" : false } } },
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
  optimizeDeps: {
    include: [
      // SolidStart's dev error overlay reads source maps with this CommonJS package. Under pnpm,
      // Vite doesn't find it on its own, so pre-bundle it or `pnpm dev` fails to hydrate.
      "@solidjs/start > @jridgewell/trace-mapping",
      // Imported only by /share (the editor loads with clientOnly) and the form schema, so Vite's first scan
      // misses them. Found later, they made Vite re-bundle and reload mid-session, and the reloaded page ran
      // two copies of Solid: components stopped sharing state (signed in, yet reacting asked to sign in)
      // until a manual refresh. Every package the browser loads that isn't a Solid source package (Kobalte,
      // the router: those are served as source, never pre-bundled) is listed, so nothing is found late.
      "@date-fns/tz",
      "@solidjs/start/fns/client",
      "date-fns",
      "zod",
      "solid-tiptap",
      "@tiptap/core",
      "@tiptap/extension-code-block-lowlight",
      "@tiptap/extensions",
      "@tiptap/markdown",
      "@tiptap/pm/state",
      "@tiptap/starter-kit",
      "@tiptap/suggestion",
      "lowlight",
      "highlight.js/lib/languages/*",
    ],
  },
  // The preset is pinned to Cloudflare Workers above; wrangler.jsonc holds the Worker settings.
});
