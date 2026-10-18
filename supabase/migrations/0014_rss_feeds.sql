-- 0014_rss_feeds.sql: personal RSS feeds, the RSS side of following on Telegram.
--
-- A signed-in person adds tags and authors from the Follow popover and reads all of them at one private
-- address, /feed/<token>/rss.xml. RSS readers can't sign in, so the token is the only key: it lives in its
-- own table because profiles are public, and a new token makes the old address stop working. The feed route
-- runs as anon and reads through rss_feed_owner and rss_feed_posts, which look the token up themselves.

create table public.rss_feeds (
  user_id    uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  token      text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

-- Same value rules as post_tags.tag and profiles.handle (0001). Topics stay RSS-only through their own feed.
create table public.rss_follows (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target     public.follow_target not null,
  value      text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target, value),
  check (
    (target = 'tag' and char_length(value) <= 24 and value ~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' and value = lower(value))
    or (target = 'author' and value ~ '^[a-z0-9][a-z0-9-]{1,38}$')
  )
);

-- At most 50 follows per person, like a Telegram chat --------------------------------
create function public.rss_follows_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.rss_follows where user_id = new.user_id) >= 50 then
    raise exception 'An RSS feed can follow at most 50 tags and authors' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger rss_follows_limit before insert on public.rss_follows
  for each row execute function public.rss_follows_limit();

-- Each person sees and changes only their own feed -----------------------------------
alter table public.rss_feeds   enable row level security;
alter table public.rss_follows enable row level security;

create policy "people read their own feed" on public.rss_feeds
  for select to authenticated using (user_id = (select auth.uid()));
create policy "people create their own feed" on public.rss_feeds
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "people replace their own feed token" on public.rss_feeds
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "people read their own rss follows" on public.rss_follows
  for select to authenticated using (user_id = (select auth.uid()));
create policy "people add their own rss follows" on public.rss_follows
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "people remove their own rss follows" on public.rss_follows
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update on public.rss_feeds to authenticated;
grant select, insert, delete on public.rss_follows to authenticated;
grant all on public.rss_feeds, public.rss_follows to service_role;

-- Reading a feed by its token, for the anonymous feed route --------------------------
-- security definer: anon has no rights on rss_feeds or rss_follows. Each returns nothing for an unknown token.

-- The owner's display name, for the feed title. null means no such feed (the route 404s).
create function public.rss_feed_owner(p_token text) returns text
language sql stable security definer set search_path = '' as $$
  select p.display_name
  from public.rss_feeds f
  join public.profiles p on p.id = f.user_id
  where f.token = p_token;
$$;

-- The newest published notes on any of the feed's tags or by any of its authors.
create function public.rss_feed_posts(p_token text, p_limit int default 30)
returns setof public.public_posts
language sql stable security definer set search_path = '' as $$
  select pp.*
  from public.public_posts pp
  where exists (
    select 1
    from public.rss_feeds f
    join public.rss_follows r on r.user_id = f.user_id
    where f.token = p_token
      and ((r.target = 'tag' and r.value = any (pp.tags)) or (r.target = 'author' and r.value = pp.author_handle))
  )
  order by pp.published_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

revoke execute on function public.rss_feed_owner(text), public.rss_feed_posts(text, int), public.rss_follows_limit() from public;
grant execute on function public.rss_feed_owner(text), public.rss_feed_posts(text, int) to anon, authenticated, service_role;
