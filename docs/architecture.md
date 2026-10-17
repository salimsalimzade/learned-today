# Architecture

**what-did-i-learn-today**: people share one small thing they learned, others react and follow topics on Telegram or RSS.

## Stack

| Layer | Choice |
| --- | --- |
| App | SolidStart 2 (Vite 8 + Nitro v3), Solid Router 1.0, Node 24 |
| UI | Kobalte base components, one CSS module each (kebab-case classes), tokens from `tokens.json` |
| Editor | TipTap 3 with `@tiptap/markdown`; posts are stored as Markdown |
| Data | Supabase (Postgres + RLS + Auth), mock data until it's connected |
| Notifications | Telegram bot webhook + `notifier` Edge Function, run by pg_cron |

## Run it

```sh
pnpm install
pnpm dev            # http://localhost:3000, mock data, "sign in" = sample account
                    # http://localhost:3000/preview  base components, light and dark
pnpm tokens         # rebuild src/styles/tokens.css after editing tokens.json
pnpm check          # Biome: format + lint + import order (pnpm check:fix to apply)
pnpm build && node .output/server/index.mjs
```

`pnpm install` also installs a Lefthook pre-push hook (`lefthook.yml`) that runs `pnpm check` and `pnpm typecheck`. CI (`.github/workflows/ci.yml`) runs format, lint, typecheck and build on PRs and pushes to `main`. No deploy yet.

No preset is set in `vite.config.ts`: Nitro detects Vercel and Netlify when it builds there.

## Mock mode vs Supabase

`isMock` (src/lib/env.ts) is true while `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are empty.

- **Mock (now):** queries read `src/lib/mock/store.ts`, an in-memory store seeded from `mock/data.ts`. Reactions and new posts work until the server restarts. Sign-in sets an `lt_demo_user` cookie.
- **Supabase (next):** each query in `src/lib/queries/*.ts` has a `notWired(...)` line. Replace it with a query on the `public_posts` view and map rows into `src/lib/types.ts`. Auth (`actions/auth.ts`, `routes/auth/callback.ts`), the Telegram webhook and the notifier are already written for Supabase.

## Folders

```
src/
  routes/            one file per page; *.ts files with GET/POST are server routes
  components/
    ui-kit/          base components, one folder each: <name>/index.tsx + <name>.module.css
                     avatar button checkbox collapsible dialog field icon kbd link popover
                     select tabs tag text-area text-field toast toggle-group tooltip
    layout/          page header footer account-menu not-found
    overlays/        command-palette sign-in-dialog shortcuts-dialog, overlay-provider (open state)
    feed/            feed-card day-head post-list ask-banner
    post/            reactions reaction-tray code-block prose adjacent-posts
    topic/           follow-popover tag-filter listing-header people-list
    share/           editor/ (TipTap, slash menu, code block view) tag-input language-picker
    preview/         preview-page (light/dark panels) and the list of /preview pages
  lib/
    queries/         read queries ("use server" bodies): posts, search, session, rss
    actions/         publish-post, set-reaction, auth (signIn / signOut)
    schemas/post.ts  zod schema shared by the share form and publishPost
    server/          server-only helpers (current viewer, cookies). Never imported by components
    supabase/        server.ts (@supabase/ssr), browser.ts, database.types.ts
    mock/            sample data + in-memory store
    i18n/            az.ts (default), en.ts, provider
    markdown.ts      Markdown → prose blocks (raw HTML escaped, unsafe links dropped)
  styles/            tokens.json → tokens.css (generated), base.css, syntax.css, fonts/, pages/*.module.css
scripts/
  build-tokens.mjs   tokens.json → tokens.css
supabase/
  migrations/        0001 schema · 0002 RLS · 0003 triggers + cron · 0004 search
  functions/notifier Edge Function that sends queued Telegram messages
```

## How a request flows

1. `entry-server.tsx` reads the `theme` and `lang` cookies and renders `<html lang data-theme>`. A tiny inline script handles "Sistem" (system) theme before paint.
2. `app.tsx` mounts Header, Footer and the overlays once. Routes render into `<main>`.
3. Routes call queries through `createAsync`. Query bodies run on the server, so the mock store and Supabase keys never reach the browser.
4. Actions (reactions, publishing, sign-in) are server functions too. Reactions update optimistically and revalidate nothing; sign-in revalidates everything.

Single-flight note: after an action, SolidStart re-renders the page in the same round trip with a rebuilt request that already has the new cookies. Read cookies from `getRequestEvent().request` (as `lib/server/viewer.ts` does), not h3's `getCookie`, or the re-render sees the old session.

## Design system

**Tokens.** `src/styles/tokens.json` is the source. `pnpm tokens` writes `tokens.css`: the `@font-face` rules, colours for light, dark and "system" (a `prefers-color-scheme` fallback before JS runs), spacing, radius, sizes, strokes, layers, `--font-sans` / `--font-mono`, a `--text-<name>` font shorthand and `--tracking-<name>` for each type style, and `.type-<name>` utility classes. Don't edit `tokens.css` by hand.

**Fonts.** Inter (variable, opsz 14–32, wght 100–900) and JetBrains Mono (variable, wght 100–800), roman and italic, from Google Fonts. Each is subset to a single Latin file (covers Azerbaijani: ə, ğ, ı, ş…), limited by `unicode-range`. Italic stays because prose `em` and code comments use it. Licences sit next to them in `styles/fonts/`. Mono text turns ligatures off so `!==` and `->` show as typed.

**CSS modules.** Every component has `<name>.module.css` beside its `index.tsx`. Class names are kebab-case (`styles["text-field"]`, `styles.trigger`); built names are `<class>-<hash>`. Only three files are global: `tokens.css`, `base.css` (element defaults, focus ring, `.sr-only`) and `syntax.css` (code colours, used by HTML highlighted on the server). Page layout lives in `styles/pages/*.module.css`.

**Cascade layers.** `@layer base, ui;` is set inline in `entry-server.tsx` (and at the top of `tokens.css`). `base.css` is in `base`, every ui-kit module is in `ui`, and compound and page modules are unlayered. So a compound can restyle a base component with one class, whatever order the CSS files load in.

**Sharing styles.** Modules reuse each other with `composes` (`text-area` composes the `text-field` input; the tag input composes it too). Components that need another's classes import its exported styles (`buttonClass`, `inputClass`, `selectStyles`, `fieldStyles`, `tagStyles`). Cross-component hooks are data attributes: `[data-icon]`, `[data-kbd]`, `[data-variant]`, plus Kobalte's `data-selected`, `data-pressed`, `data-expanded`, `data-closed`, `data-highlighted`, `data-invalid`.

**/preview.** `/preview` lists the base components; each page draws them in a light and a dark panel side by side (`data-theme` on the panel). Overlays (popover, dialog, select list, tooltip, toast) open in a portal, so they follow the site theme: use the theme switch at the top of the page. `/preview/tokens` shows every token from `tokens.json`. Pages set `robots: noindex`.

`syntax.css` maps code colours to `tok-*` classes (post pages, highlighted on the server) and to highlight.js classes (the editor, highlighted live by lowlight).

## Auth

Google and GitHub through Supabase OAuth (PKCE). `signIn` asks Supabase for the provider URL with `redirectTo=/auth/callback?next=…`; the callback swaps the code for a session, which `@supabase/ssr` stores in cookies. A trigger on `auth.users` creates the profile and a unique handle. Guests who react or open `/share` see the sign-in dialog and come back to the same page.

## Telegram

1. The Follow (İzlə) popover links to `t.me/<bot>?start=<payload>`. The payload encodes topic, tag or author (`lib/telegram.ts`; non-ASCII slugs are base64url).
2. `POST /api/telegram` (secret-token checked) stores the chat and the follow, and replies in the webhook response. Also `/list` and `/stop`.
3. Publishing a post (or adding its tags) queues one row per follower in `notification_queue` (0003 triggers).
4. pg_cron calls the `notifier` function every minute while the queue has work; it claims 25 rows with `for update skip locked`, sends them, and marks chats that blocked the bot.

## RSS

`/rss.xml`, `/topic/:slug/rss.xml`, `/tag/:slug/rss.xml`, `/author/:handle/rss.xml`: RSS 2.0, newest 30, full post HTML, cached 10 minutes.

## Keyboard

`/` search · `j` `k` next/previous · `n` new note · `r` then `1`–`6` react · `f` follow · `t` theme · `Ctrl`/`⌘` `↵` publish · `?` all shortcuts. Single keys stay quiet while typing or when a dialog is open.

## Differences from the planned tree

- `app.config.ts` → `vite.config.ts`: SolidStart 2 dropped Vinxi and configures through Vite.
- Added: `lib/server/` (server-only helpers), `lib/mock/`, `lib/queries/session.ts`, `actions/set-reaction.ts` and `actions/auth.ts`, `routes/[...404].tsx`, `routes/preview/`, `scripts/build-tokens.mjs`, and the extra ui-kit pieces above.
- File and folder names are kebab-case. `text-field` and `text-area` follow Kobalte's own names (`@kobalte/core/text-field`).

## Setup checklist for Supabase

1. `pnpm db:start` (needs Docker), then `pnpm db:types` to regenerate `database.types.ts`.
2. Fill `.env` from `.env.example` (URL, anon key, service-role key).
3. Create GitHub and Google OAuth apps, add their keys, enable them in `supabase/config.toml` (or the dashboard).
4. Store `project_url` and `service_role_key` in Vault (see the end of 0003) so pg_cron can reach the notifier.
5. `supabase secrets set TELEGRAM_BOT_TOKEN=… SITE_URL=…`, deploy `notifier`, then call Telegram's `setWebhook` (see `routes/api/telegram.ts`).
6. Replace the `notWired(...)` lines in `src/lib/queries` and the two actions.
