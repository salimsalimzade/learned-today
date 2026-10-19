# what-did-i-learn-today

Learn one small thing every day and share it.

**Live app:** https://learned-today.learningishardiswear.workers.dev

How the app works (stack, folders, auth, Telegram, RSS, setup): [docs/architecture.md](docs/architecture.md).

## Run it locally

You need [Node.js](https://nodejs.org) 24+, [pnpm](https://pnpm.io/installation) 10+ and [Docker](https://www.docker.com/products/docker-desktop/). Follow [Run it](docs/architecture.md#run-it) and the [Supabase setup checklist](docs/architecture.md#setup-checklist-for-supabase) in architecture.md. These details are not listed there:

**Keys for `.env`.** [.env.example](.env.example) already has every key the app needs. Copy it to `.env`:

```sh
cp .env.example .env
```

Supabase runs on your computer. After `pnpm db:start`, run `pnpm dlx supabase status` and fill in these three keys in `.env` with its values. The Telegram keys can stay empty unless you work on the bot.

```sh
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Supabase Studio (the database UI) is at http://127.0.0.1:54323.

**Sign-in.** Set up GitHub, Google or both (one is enough). Both use the callback URL `http://127.0.0.1:54321/auth/v1/callback`:

- **GitHub:** GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
- **Google:** [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create credentials → OAuth client ID (type "Web application"). Add the callback URL under Authorized redirect URIs.

Put the keys in `supabase/.env`, then restart Supabase with `pnpm dlx supabase stop && pnpm db:start`:

```sh
SUPABASE_AUTH_GITHUB_CLIENT_ID=...
SUPABASE_AUTH_GITHUB_SECRET=...
SUPABASE_AUTH_GOOGLE_CLIENT_ID=...
SUPABASE_AUTH_GOOGLE_SECRET=...
```

## How to contribute

Example: fixing a bug in the feed.

```sh
# 1. Fork the repo on GitHub, clone your fork, then add the main repo
git clone https://github.com/<your-username>/learned-today.git
cd learned-today
git remote add upstream https://github.com/salimsalimzade/learned-today.git

# 2. Create a branch
git checkout -b fix/feed-card-overflow

# 3. Make your change, then check it
pnpm check
pnpm typecheck

# 4. Commit
git add .
git commit -m "bugfix(feed): stop long titles overflowing the card"

# 5. Push to your fork
git push origin fix/feed-card-overflow
```

6. On GitHub, open a pull request from your branch to `main`. Say what you changed and why. For UI changes, add a screenshot.
7. In your first pull request, add yourself to [CONTRIBUTORS.md](CONTRIBUTORS.md).

To get the latest changes from the main repo:

```sh
git fetch upstream
git rebase upstream/main
```

### Commit messages

Format: `type(scope): message`, all lowercase. The type is one of `feature`, `bugfix`, `refactor`, `chore` or `docs`. A git hook checks it when you commit.

Changing the database? Add a new file in `supabase/migrations/` (for example `0015_my_change.sql`), never edit an old one, then run `pnpm db:reset`.

## Contributors

See [CONTRIBUTORS.md](CONTRIBUTORS.md).

## License

[MIT](LICENSE)
