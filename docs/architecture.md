# Architecture

**what-did-i-learn-today**: people share one small thing they learned, others react and follow tags and authors on Telegram, or any topic, tag or author by RSS.

## Stack

| Layer | Choice |
| --- | --- |
| App | SolidStart 2 (Vite 8 + Nitro v3), Solid Router 1.0, Node 24 |
| UI | Kobalte base components, one CSS module each (kebab-case classes), tokens from `tokens.json` |
| Editor | TipTap 3 with `@tiptap/markdown`; posts are stored as Markdown |
| Data | Supabase (Postgres + RLS + Auth) |
| Notifications | Telegram bot webhook + `notifier` Edge Function, run by pg_cron |
| Monitoring | Workers Logs, traces and Issues (server); Sentry (browser) |

## Run it

```sh
pnpm install
pnpm db:start        # local Supabase (needs Docker); `pnpm db:reset` applies migrations and seed.sql
pnpm dev            # http://localhost:3000, reads the local database
                    # http://localhost:3000/preview  base components, light and dark
pnpm tokens         # rebuild src/styles/tokens.css after editing tokens.json
pnpm check          # Biome: format + lint + import order (pnpm check:fix to apply)
pnpm build && node .output/server/index.mjs
```

`pnpm install` also installs a Lefthook pre-push hook (`lefthook.yml`) that runs `pnpm check` and `pnpm typecheck`. CI (`.github/workflows/ci.yml`) runs format, lint, typecheck and build on PRs and pushes to `main`. No deploy yet.

No preset is set in `vite.config.ts`: Nitro detects Vercel and Netlify when it builds there.

## Supabase

The app needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; without them every server call fails with "Supabase is not configured". Posts, topics, search, RSS and reactions read Supabase: the queries in `src/lib/queries/` call `src/lib/server/post-rows.ts`, which reads `public_posts` and calls the `feed_page`, `search_posts`, `create_post` and `set_reaction` functions. `supabase/seed.sql` adds the topics and a set of sample notes by fake authors.

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
    markdown.ts      Markdown → prose blocks (raw HTML escaped, unsafe links dropped)
  styles/            tokens.json → tokens.css (generated), base.css, syntax.css, fonts/, pages/*.module.css
scripts/
  build-tokens.mjs   tokens.json → tokens.css
supabase/
  migrations/        0001 schema · 0002 RLS · 0003 triggers · 0004 search · 0005 posts API · 0006 Telegram queue · 0007 digests · 0008 rich messages · 0009 no topic follows · 0010 recaps from now · 0011 feed time zone · 0012/0013 grants
  functions/notifier Edge Function that sends queued Telegram messages
```

## How a request flows

1. `entry-server.tsx` reads the `theme` cookie and renders `<html lang="en" data-theme>`. A tiny inline script handles the "System" theme before paint.
   Day headers ("Today", "Yesterday") use the visitor's time zone. Another inline script reads it from the browser (`Intl`, no permission prompt, not their location) into the `tz` cookie; if it differs from the zone the server rendered with, the page reloads once. The server reads the cookie (`readTimeZone` in `lib/prefs.ts`) and passes it to `feed_page` (migration 0011), so days are cut at the visitor's midnight. Without a usable zone the default `DEFAULT_TIME_ZONE` (Asia/Baku, `lib/env.ts`) applies. The footer's time zone menu (`components/layout/time-zone-picker`) lets people pick a zone themselves: it goes in the `tz_choice` cookie, which `readTimeZone` prefers and which turns the detection off, and the page reloads. "Automatic" deletes it. Signed in, the pick is also saved as `profiles.time_zone` (0001, null = Automatic), and a zone saved there wins on every device: `/auth/callback` puts it in the cookie at sign-in (or saves this browser's pick when the account has none), and the menu switches a device over when the account's zone was changed elsewhere.
2. `app.tsx` mounts Header, Footer and the overlays once. Routes render into `<main>`.
3. Routes call queries through `createAsync`. Query bodies run on the server, so the Supabase keys never reach the browser.
4. Actions (reactions, publishing, sign-in) are server functions too. Reactions update optimistically and revalidate nothing; sign-in revalidates everything.
5. `src/middleware.ts` wraps every request the Worker handles (static files are served before it). It rate-limits per IP with the Workers rate-limiting bindings in `wrangler.jsonc` (`RATE_LIMIT`: 120 pages or server-function calls per 10 s; `RATE_LIMIT_RSS`: 30 feed fetches a minute; the Telegram webhook is exempt), and sets security headers: a Content-Security-Policy whose `script-src` takes a per-request nonce (entry-server.tsx puts it on the inline scripts and passes it to Solid), `frame-ancestors 'none'`, nosniff, HSTS and a strict referrer policy. zod runs `jitless` because the policy blocks `new Function`. SolidStart itself rejects cross-site server-function calls (`Sec-Fetch-Site` / `Origin`). `?next=` after sign-in goes through `lib/safe-next.ts`, which parses it as the browser will, so `/\evil.com` can't leave the site.
6. `getViewer` (lib/server/viewer.ts) runs once per request, and checks the session token locally with `getClaims`, so a page costs one profile query for the signed-in person instead of an Auth round trip per query.

Single-flight note: after an action, SolidStart re-renders the page in the same round trip with a rebuilt request that already has the new cookies. Read cookies from `getRequestEvent().request` (as `lib/server/viewer.ts` does), not h3's `getCookie`, or the re-render sees the old session.

## Design system

**Tokens.** `src/styles/tokens.json` is the source. `pnpm tokens` writes `tokens.css`: the `@font-face` rules, colours for light, dark and "system" (a `prefers-color-scheme` fallback before JS runs), spacing, radius, sizes, strokes, layers, `--font-sans` / `--font-mono`, a `--text-<name>` font shorthand and `--tracking-<name>` for each type style, and `.type-<name>` utility classes. Don't edit `tokens.css` by hand.

**Fonts.** Inter (variable, opsz 14–32, wght 100–900) and JetBrains Mono (variable, wght 100–800), roman and italic, from Google Fonts. Each is subset to a single Latin file, limited by `unicode-range`. Italic stays because prose `em` and code comments use it. Licences sit next to them in `styles/fonts/`. Mono text turns ligatures off so `!==` and `->` show as typed. Until Inter arrives, text shows in "Inter Fallback" (`type.fallbacks` in tokens.json): local Arial resized to Inter's width and line metrics, so the page barely moves when Inter swaps in.

**CSS modules.** Every component has `<name>.module.css` beside its `index.tsx`. Class names are kebab-case (`styles["text-field"]`, `styles.trigger`); built names are `<class>-<hash>`. Only three files are global: `tokens.css`, `base.css` (element defaults, focus ring, `.sr-only`) and `syntax.css` (code colours, used by HTML highlighted on the server). Page layout lives in `styles/pages/*.module.css`.

**Cascade layers.** `@layer base, ui;` is set inline in `entry-server.tsx` (and at the top of `tokens.css`). `base.css` is in `base`, every ui-kit module is in `ui`, and compound and page modules are unlayered. So a compound can restyle a base component with one class, whatever order the CSS files load in.

**Sharing styles.** Modules reuse each other with `composes` (`text-area` composes the `text-field` input; the tag input composes it too). Components that need another's classes import its exported styles (`buttonClass`, `inputClass`, `selectStyles`, `fieldStyles`, `tagStyles`). Cross-component hooks are data attributes: `[data-icon]`, `[data-kbd]`, `[data-variant]`, plus Kobalte's `data-selected`, `data-pressed`, `data-expanded`, `data-closed`, `data-highlighted`, `data-invalid`.

**/preview.** `/preview` lists the base components; each page draws them in a light and a dark panel side by side (`data-theme` on the panel). Overlays (popover, dialog, select list, tooltip, toast) open in a portal, so they follow the site theme: use the theme switch at the top of the page. `/preview/tokens` shows every token from `tokens.json`. Pages set `robots: noindex`.

`syntax.css` maps code colours to `tok-*` classes (post pages, highlighted on the server) and to highlight.js classes (the editor, highlighted live by lowlight).

## Auth

Google and GitHub through Supabase OAuth (PKCE). `signIn` asks Supabase for the provider URL with `redirectTo=/auth/callback?next=…`; the callback swaps the code for a session, which `@supabase/ssr` stores in cookies. A trigger on `auth.users` creates the profile and a unique handle. Guests who react or open `/share` see the sign-in dialog and come back to the same page.

## Telegram

1. The Follow popover links to `t.me/<bot>?start=<payload>`. The popover offers it on tag and author pages only (a topic is RSS only). The payload encodes a tag or author (`lib/telegram.ts`; non-ASCII slugs are base64url).
2. `POST /api/telegram` (secret-token checked) stores the chat and the follow, and replies in the webhook response. The bot speaks English only. `/follow <#tag | @author | all>` and `/unfollow` work from the chat (up to 50 follows a chat; the bot doesn't follow topics, which are RSS only, migration 0009). `pnpm telegram:commands` registers the command menu, `/list` shows what you follow, `/stop` clears everything. `/start` alone just welcomes; it follows nothing. `/digest [week] [#tag | @author | all ...]` builds a recap on the spot (of what the chat follows, or of exactly the filters it gives). `/schedule <daily|weekly|off> [filters]` saves a recurring one. A scheduled recap counts from the moment it was saved (every 24 hours or 7 days), so it needs no time zone and arrives at the hour the person ran the command; saving again starts a new count. While a recap is saved, the instant messages from the chat's follows are paused, and `/follow` says so (migrations 0007 and 0010).
3. Publishing a post queues one message per interested chat on the Supabase Queue `telegram_notifications` (`pgmq`, migration 0006). A deferred trigger on `posts` does it once, at commit, after `create_post` has inserted the tags, so a chat that follows an author, a tag and "all" still gets one message. Chats that blocked the bot are skipped. (Tags added to an already published post don't notify.)
4. Queuing wakes the `notifier` function straight away (`pg_net`, after the publish commits), and `pg_cron` checks every 15 seconds for messages whose retry time has come. Both need the Vault secrets `project_url` and `service_role_key`. Without them nothing is sent, but publishing still works.
5. The notifier reads up to 25 messages with `notifications_read`, which hides them for 2 minutes (the visibility timeout), so a crash mid-send brings them back. Then it reports each one: `notifications_ack` archives it; `notifications_fail` moves it to the dead-letter queue `telegram_notifications_failed` with the error (blocked chat, bad request, post gone); `notifications_retry` hides it again for 30 s, 2 min, 10 min, then 1 h (or Telegram's `retry_after`), and dead-letters it after the 5th attempt. Chats that blocked the bot are marked.
6. Archived (sent) messages and dead letters are kept for 14 days (daily `pg_cron` cleanup), then deleted. To look: `select * from pgmq.q_telegram_notifications` (waiting), `pgmq.a_telegram_notifications` (sent), `pgmq.q_telegram_notifications_failed` (dead letters).
7. A `pg_cron` job (`telegram-digests`, every minute) calls `enqueue_due_digests()`: for each schedule whose slot has passed it queues a `{"kind": "digest"}` message and wakes the notifier, which builds the text with `digest_text()` and sends it like any other message, with the same retries. A recap with nothing new is not sent. Changing a schedule starts it fresh, so slots before the change don't count.
8. Messages are Telegram HTML with inline buttons (migration 0008). A new note is `New note · Topic` and the title, both bold, then the tags (each a link to its tag page, since Telegram's own hashtags stop at a hyphen). The note itself isn't sent: Telegram can't show its code blocks, lists and links as the post page does, so **Read** opens it on the site. With **Read** comes **Stop following** (`stop:<post id>`, which drops the tag, author or "all" follow that brought the note, most specific first, and leaves the note in place). A recap is a bold headline, then notes grouped by topic with linked titles, with **Open feed** and **Subscriptions** (`list`). A new follow is confirmed with `You're following: <name>` (an author's display name, not the @handle, which Telegram would link to a Telegram account), **View tag/author** and **Cancel** (`undo:<payload>`). The webhook answers button presses (`callback_query`), so it must receive that update type; the bot token, when set there, is used only to clear the button's spinner. URL buttons are left out when `SITE_URL` is localhost, since Telegram rejects them.

## RSS

`/rss.xml`, `/topic/:slug/rss.xml`, `/tag/:slug/rss.xml`, `/author/:handle/rss.xml`: RSS 2.0, newest 30, full post HTML, cached 10 minutes.

## Monitoring

**Server (Cloudflare).** `observability` in `wrangler.jsonc` turns on Workers Logs (every request and its console output, 3 days on Free, 7 on Paid), traces (spans per request, Supabase fetches included) and Issues (uncaught exceptions, 5xx responses and `console.error`, grouped). All three are under Workers & Pages → learned-today → Observability; `pnpm exec wrangler tail` streams logs live. Nitro writes `.output/server/index.mjs.map` and `wrangler deploy` uploads it (`upload_source_maps`), so stacks point at `src/`. Alerts are Issues automations, set up in the dashboard.
- A server function that throws would otherwise leave no trace: SolidStart answers 200 with the message in an `X-Error` header. `src/server-fn-error.ts` (`serverFunctions.onError` in `vite.config.ts`) logs it with `console.error` and sends the browser "Something went wrong." instead, so Postgres detail stays in the log. Functions called while rendering throw in place, and SolidStart logs those itself.
- Plain objects passed to `console.log`/`console.warn` become searchable fields. The middleware logs `{ event: "rate_limited", limiter, path }` on a 429 and `/auth/callback` logs `{ event: "auth_callback_failed", code, … }`. Never log cookies, tokens or email addresses.
- Fetch spans keep the full URL, and Telegram's API puts the bot token in it (`answerCallback`), so traces must not be exported to another service as they are.

**Browser (Sentry).** `entry-client.tsx` starts Sentry on the live site only, a build served from `VITE_SITE_URL` (nothing from `pnpm dev` or `wrangler dev`): errors, page and navigation timings (`withSentryRouterRouting` in `app.tsx`) and Replay (one session in ten, every session with an error; text masked, images blocked). No IP, account, cookies or request bodies are sent. Events go through `POST /api/monitoring`, which forwards envelopes for our own DSN only, so `connect-src` stays as it is and ad blockers don't drop them. Replay compresses in a `blob:` worker, hence `worker-src 'self' blob:` in the CSP. Server errors stay with Issues: Sentry's server SDK expects Node.
- Logs: components call `log.info/warn/error` from `lib/log.ts` (Explore → Logs, each linked to its trace and replay). On the server those calls do nothing, so the Worker never bundles Sentry's Node SDK; server code logs with `console.*` to Workers Logs. Messages are fixed sentences, filters go in attributes (`lt.<area>.<field>`, `error.type`), never post text. Current logs: a failed publish (`share.tsx`), a sign-in that couldn't start (`use-sign-in.ts`), a draft the browser wouldn't store (`draft.ts`, once per page).
- Source maps: with the `SENTRY_AUTH_TOKEN` secret, the deploy build makes hidden browser maps, uploads them (`sentryVitePlugin` in `vite.config.ts`, client build only) and deletes them from `.output/public`.

**Database (Supabase).** Dashboard → Logs: API, Postgres, Auth and Edge Function logs (the notifier's `console.error`), 1 day on Free, 7 on Pro. The Telegram dead-letter queue is the notifier's error log (see Telegram, step 6).

## Topics

One flat, curated list of 200 topics in `supabase/seed.sql` (Git, JavaScript, Kitchen, History…). Slugs are English only, a database check allows lowercase letters, digits and hyphens (migration 0001). Each topic has one English `name`. There are no descriptions, groups or translations, and people can't add topics.

## Keyboard

`/` search · `j` `k` next/previous · `n` new note · `r` then `1`–`6` react · `f` follow · `t` theme · `Ctrl`/`⌘` `↵` publish · `?` all shortcuts. Single keys stay quiet while typing or when a dialog is open.

## Differences from the planned tree

- `app.config.ts` → `vite.config.ts`: SolidStart 2 dropped Vinxi and configures through Vite.
- Added: `lib/server/` (server-only helpers, including `post-rows.ts`), `lib/queries/session.ts`, `actions/set-reaction.ts` and `actions/auth.ts`, `routes/[...404].tsx`, `routes/preview/`, `scripts/build-tokens.mjs`, and the extra ui-kit pieces above.
- File and folder names are kebab-case. `text-field` and `text-area` follow Kobalte's own names (`@kobalte/core/text-field`).

## Setup checklist for Supabase

1. `pnpm db:start` (needs Docker), then `pnpm db:types` to regenerate `database.types.ts`.
2. Fill `.env` from `.env.example` (URL, publishable key, secret key).
3. Create GitHub and Google OAuth apps, add their keys, enable them in `supabase/config.toml` (or the dashboard).
4. Store `project_url` and `service_role_key` in Vault (see the end of 0003) so pg_cron can reach the notifier.
5. `supabase secrets set TELEGRAM_BOT_TOKEN=… SITE_URL=…`, deploy `notifier`, then call Telegram's `setWebhook` (see `routes/api/telegram.ts`). On every push to `main` the pipeline runs `supabase db push` (new migrations, before the Worker deploys) and redeploys `notifier` (after it), once the variable `SUPABASE_PROJECT_REF` and the secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` are set. Until then do both by hand, or Telegram keeps sending the old message format. `db push` only runs migrations the project hasn't recorded, so an edit to an already-applied one (like the `time_zone` column folded into 0001) needs `supabase db reset --linked` once, which wipes the database.
6. Monitoring: add the GitHub secret `SENTRY_AUTH_TOKEN` (a Sentry organization token) for readable browser stacks, and create an Issues automation in the Cloudflare dashboard to be told about server errors.
