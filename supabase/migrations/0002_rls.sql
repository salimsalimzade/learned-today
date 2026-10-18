-- 0002_rls.sql: row level security. Anyone can read what's published; people write only
-- their own posts and reactions. Telegram tables have no policies, so only the service
-- role (the webhook and the notifier) can touch them.

alter table public.profiles           enable row level security;
alter table public.topics             enable row level security;
alter table public.posts              enable row level security;
alter table public.post_tags          enable row level security;
alter table public.reactions          enable row level security;
alter table public.telegram_chats     enable row level security;
alter table public.follows            enable row level security;

-- profiles
create policy "profiles are public" on public.profiles
  for select to anon, authenticated using (true);
create policy "people edit their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- topics
create policy "topics are public" on public.topics
  for select to anon, authenticated using (true);

-- posts
create policy "published posts are public, drafts are private" on public.posts
  for select to anon, authenticated
  using (status = 'published' or author_id = (select auth.uid()));
create policy "people write their own posts" on public.posts
  for insert to authenticated
  with check (author_id = (select auth.uid()) and status in ('draft', 'published'));
create policy "people edit their own posts" on public.posts
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and status in ('draft', 'published'));
create policy "people delete their own posts" on public.posts
  for delete to authenticated using (author_id = (select auth.uid()));

-- post_tags follow their post
create policy "tags of visible posts are public" on public.post_tags
  for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and (p.status = 'published' or p.author_id = (select auth.uid()))));
create policy "authors tag their own posts" on public.post_tags
  for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));
create policy "authors untag their own posts" on public.post_tags
  for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));

-- reactions: counts are public, each person manages their own one
create policy "reactions are public" on public.reactions
  for select to anon, authenticated using (true);
create policy "people react to published posts" on public.reactions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy "people change their reaction" on public.reactions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "people remove their reaction" on public.reactions
  for delete to authenticated using (user_id = (select auth.uid()));
