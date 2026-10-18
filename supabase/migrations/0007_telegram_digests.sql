-- 0007_telegram_digests.sql: recaps for the Telegram bot.
--
--  /dailyrecap builds a recap of new notes on demand (digest_text).
--  /schedule  saves when a chat wants one (digest_schedules): daily or weekly, at a time in the
--  /digest    site time zone, and optionally which topics, tags and authors it covers (without
--             them it covers what the chat follows). While a schedule is on, the chat gets the
--             recap instead of one message per note (enqueue_post_notifications skips it).
--  cron       every minute enqueue_due_digests queues a message {"kind": "digest", ...} on the
--             Telegram queue for each schedule whose time has come. The notifier turns it into text
--             with digest_text and sends it, with the same retries as any other message.

create table public.digest_schedules (
  chat_id         bigint primary key references public.telegram_chats (chat_id) on delete cascade,
  frequency       text not null check (frequency in ('daily', 'weekly')),
  weekday         smallint check (weekday between 0 and 6), -- 0 = Sunday, weekly schedules only
  at_time         time not null,                            -- in the site time zone (Asia/Baku)
  topics          text[],                                   -- what the recap covers; all three null = what the chat follows
  tags            text[],
  authors         text[],
  last_occurrence timestamptz,                              -- the last slot already queued
  created_at      timestamptz not null default now(),
  check ((frequency = 'weekly') = (weekday is not null))
);

-- Like the other Telegram tables: no policies, so only the service role can touch it.
alter table public.digest_schedules enable row level security;

-- The latest slot of a schedule that is not in the future, as a moment in time.
create or replace function public.digest_occurrence(p_frequency text, p_weekday int, p_time time, p_now timestamptz)
returns timestamptz language sql stable set search_path = '' as $$
  with local as (select p_now at time zone 'Asia/Baku' as now_local),
  slot as (
    select
      now_local,
      date_trunc('day', now_local) + p_time
        - case when p_frequency = 'weekly'
               then make_interval(days => (extract(dow from now_local)::int - p_weekday + 7) % 7)
               else interval '0 days' end as at_local
    from local
  )
  select (case when at_local > now_local
               then at_local - case when p_frequency = 'weekly' then interval '7 days' else interval '1 day' end
               else at_local end) at time zone 'Asia/Baku'
  from slot;
$$;

-- The recap as plain text, or null when there is nothing new. With no filters it covers what the
-- chat follows; with any of p_topics, p_tags, p_authors it covers exactly those instead.
create or replace function public.digest_text(
  p_chat_id bigint,
  p_since timestamptz,
  p_label text,
  p_site_url text,
  p_topics text[] default null,
  p_tags text[] default null,
  p_authors text[] default null
) returns text
language sql stable security invoker set search_path = '' as $$
  with picked as (
    select pp.id, pp.title, pp.author_name, pp.topic_name, pp.tags, pp.published_at
    from public.public_posts pp
    where pp.published_at >= p_since
      and case
        when p_topics is null and p_tags is null and p_authors is null then exists (
          select 1 from public.follows f
          where f.chat_id = p_chat_id
            and (f.target = 'all'
              or (f.target = 'topic' and f.value = pp.topic_slug)
              or (f.target = 'author' and f.value = pp.author_handle)
              or (f.target = 'tag' and f.value = any (pp.tags))))
        else pp.topic_slug = any (coalesce(p_topics, '{}'))
          or pp.author_handle = any (coalesce(p_authors, '{}'))
          or pp.tags && coalesce(p_tags, '{}')
      end
    order by pp.published_at desc
    limit 50
  ),
  shown as (select * from picked order by published_at desc limit 8),
  total as (select count(*) as n from picked)
  select case when (select n from total) = 0 then null else
    p_label || E'\n' || (select n from total)::text
      || case when (select n from total) = 1 then ' new note' else ' new notes' end || E'\n\n'
      || (select string_agg(
            format(E'• %s\n  %s · %s%s\n  %s/post/%s',
              s.title, s.author_name, s.topic_name,
              coalesce(' · ' || (select string_agg('#' || t, ' ') from unnest(s.tags) t), ''),
              p_site_url, s.id),
            E'\n\n' order by s.published_at desc)
          from shown s)
      || case when (select n from total) > 8
              then E'\n\n+' || ((select n from total) - 8)::text || ' more at ' || p_site_url
              else '' end
  end;
$$;

-- Queue a digest for every schedule whose slot has passed since it was last handled. A slot before the
-- schedule was saved doesn't count, so setting 08:00 at 10:00 doesn't send yesterday's recap at once.
create or replace function public.enqueue_due_digests() returns int
language plpgsql security definer set search_path = '' as $$
declare
  due record;
  queued int := 0;
begin
  for due in
    select s.chat_id, s.frequency, s.topics, s.tags, s.authors, o.at as occurrence
    from public.digest_schedules s
    join public.telegram_chats c on c.chat_id = s.chat_id and c.blocked_at is null
    cross join lateral (select public.digest_occurrence(s.frequency, s.weekday, s.at_time, now()) as at) o
    where o.at > greatest(coalesce(s.last_occurrence, '-infinity'), s.created_at)
  loop
    update public.digest_schedules set last_occurrence = due.occurrence where chat_id = due.chat_id;
    perform pgmq.send('telegram_notifications', jsonb_build_object(
      'kind', 'digest',
      'chat_id', due.chat_id,
      'since', due.occurrence - case when due.frequency = 'weekly' then interval '7 days' else interval '1 day' end,
      'topics', to_jsonb(due.topics),
      'tags', to_jsonb(due.tags),
      'authors', to_jsonb(due.authors),
      'label', case when due.frequency = 'weekly' then 'Your weekly recap · last 7 days' else 'Your daily recap · last 24 hours' end
    ));
    queued := queued + 1;
  end loop;
  if queued > 0 then perform public.kick_notifier(); end if;
  return queued;
end $$;

-- Instant messages skip chats that chose a schedule: they get the recap instead.
create or replace function public.enqueue_post_notifications() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  msgs jsonb[];
begin
  if new.status <> 'published' or (tg_op = 'UPDATE' and old.status = 'published') then
    return null;
  end if;

  select array_agg(jsonb_build_object('post_id', new.id, 'chat_id', c.chat_id)) into msgs
  from (
    select distinct f.chat_id
    from public.follows f
    join public.telegram_chats t on t.chat_id = f.chat_id and t.blocked_at is null
    where (f.target = 'all'
       or (f.target = 'topic' and f.value = new.topic_slug)
       or (f.target = 'author' and f.value = (select handle from public.profiles where id = new.author_id))
       or (f.target = 'tag' and f.value in (select tag from public.post_tags where post_id = new.id)))
      and not exists (select 1 from public.digest_schedules d where d.chat_id = f.chat_id)
  ) c;

  if msgs is not null then
    perform pgmq.send_batch('telegram_notifications', msgs);
    perform public.kick_notifier();
  end if;
  return null;
end $$;

revoke execute on function public.digest_occurrence(text, int, time, timestamptz) from public, anon, authenticated;
revoke execute on function public.digest_text(bigint, timestamptz, text, text, text[], text[], text[]) from public, anon, authenticated;
revoke execute on function public.enqueue_due_digests() from public, anon, authenticated;

select cron.schedule('telegram-digests', '* * * * *', $$ select public.enqueue_due_digests(); $$);
