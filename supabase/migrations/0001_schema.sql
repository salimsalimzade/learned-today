-- 0001_schema.sql: tables, types and the public_posts view the app reads from.
-- Shapes match src/lib/supabase/database.types.ts (regenerate with `pnpm db:types`).

create extension if not exists pg_trgm with schema extensions;

create type public.reaction_kind as enum ('learned', 'like', 'love', 'funny', 'surprised', 'thanks');
create type public.post_status as enum ('draft', 'published', 'hidden');
create type public.follow_target as enum ('all', 'topic', 'tag', 'author');
create type public.queue_status as enum ('pending', 'sent', 'failed');

-- One row per signed-in person, created by a trigger on auth.users (0003).
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  handle       text not null unique check (handle ~ '^[a-z0-9][a-z0-9-]{1,38}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url   text,
  provider     text not null default 'github',
  created_at   timestamptz not null default now()
);

-- Curated list; only the service role adds topics.
create table public.topics (
  slug           text primary key check (slug ~ '^[a-z0-9-]+$'),
  name_az        text not null,
  name_en        text not null,
  description_az text not null default '',
  description_en text not null default '',
  created_at     timestamptz not null default now()
);

create table public.posts (
  id                bigint generated always as identity primary key,
  author_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  topic_slug        text not null references public.topics (slug),
  title             text not null check (char_length(btrim(title)) between 1 and 90),
  body_md           text not null check (char_length(body_md) between 1 and 8000),
  lang              text not null default 'az' check (lang in ('az', 'en')),
  status            public.post_status not null default 'published',
  written_by_author boolean not null check (written_by_author),
  read_minutes      int not null default 1,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index posts_feed_idx on public.posts (published_at desc) where status = 'published';
create index posts_topic_idx on public.posts (topic_slug, published_at desc);
create index posts_author_idx on public.posts (author_id, published_at desc);

-- Up to 5 per post (enforced in 0003). Lowercase letters, digits and hyphens, any script.
create table public.post_tags (
  post_id bigint not null references public.posts (id) on delete cascade,
  tag     text not null check (char_length(tag) <= 24 and tag ~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' and tag = lower(tag)),
  primary key (post_id, tag)
);

create index post_tags_tag_idx on public.post_tags (tag);

-- One reaction per person per post; changing it updates the row.
create table public.reactions (
  post_id    bigint not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind       public.reaction_kind not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Telegram side. Written only by the webhook (service role).
create table public.telegram_chats (
  chat_id    bigint primary key,
  user_id    uuid references public.profiles (id) on delete set null,
  language   text not null default 'az' check (language in ('az', 'en')),
  created_at timestamptz not null default now(),
  blocked_at timestamptz
);

create table public.follows (
  chat_id    bigint not null references public.telegram_chats (chat_id) on delete cascade,
  target     public.follow_target not null,
  value      text not null default '',
  created_at timestamptz not null default now(),
  primary key (chat_id, target, value)
);

create index follows_target_idx on public.follows (target, value);

create table public.notification_queue (
  id         bigint generated always as identity primary key,
  post_id    bigint not null references public.posts (id) on delete cascade,
  chat_id    bigint not null references public.telegram_chats (chat_id) on delete cascade,
  status     public.queue_status not null default 'pending',
  attempts   int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at    timestamptz,
  unique (post_id, chat_id)
);

create index notification_queue_pending_idx on public.notification_queue (created_at) where status = 'pending';

-- What every page reads. security_invoker keeps the posts RLS policies in force.
create view public.public_posts with (security_invoker = true) as
select
  p.id,
  p.title,
  p.body_md,
  left(regexp_replace(split_part(p.body_md, E'\n\n', 1), '[`*_>#\[\]]|\([^)]*\)', '', 'g'), 220) as excerpt,
  p.lang,
  p.read_minutes,
  p.published_at,
  t.slug as topic_slug,
  t.name_az as topic_name_az,
  t.name_en as topic_name_en,
  a.id as author_id,
  a.handle as author_handle,
  a.display_name as author_name,
  a.avatar_url as author_avatar_url,
  coalesce((select array_agg(pt.tag order by pt.tag) from public.post_tags pt where pt.post_id = p.id), '{}') as tags,
  coalesce((
    select jsonb_object_agg(r.kind, r.n)
    from (select kind, count(*) as n from public.reactions where post_id = p.id group by kind) r
  ), '{}'::jsonb) as reactions
from public.posts p
join public.topics t on t.slug = p.topic_slug
join public.profiles a on a.id = p.author_id
where p.status = 'published';
