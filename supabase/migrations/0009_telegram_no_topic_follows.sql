-- 0009_telegram_no_topic_follows.sql: the bot follows tags, authors and "all", no longer topics.
--
-- Topics stay on the site and in RSS, and recaps still group notes by topic, but a chat can't follow one.
--  follows           topic rows are deleted and a check keeps them out (the enum value stays: Postgres
--                    can't drop one).
--  digest_schedules  loses `topics`. "all" in a recap, which used to be every topic, is `everything`.
--                    A recap that had only topic filters now covers what the chat follows.
--  digest_text       p_topics is replaced by p_everything.

delete from public.follows where target = 'topic';
alter table public.follows add constraint follows_no_topic check (target <> 'topic');

alter table public.digest_schedules add column everything boolean not null default false;
alter table public.digest_schedules drop column topics;

drop function public.digest_text(bigint, timestamptz, text, text, text[], text[], text[]);

create function public.digest_text(
  p_chat_id bigint,
  p_since timestamptz,
  p_label text,
  p_site_url text,
  p_tags text[] default null,
  p_authors text[] default null,
  p_everything boolean default false
) returns text
language sql stable security invoker set search_path = '' as $$
  with picked as (
    select pp.id, pp.title, pp.topic_name, pp.published_at
    from public.public_posts pp
    where pp.published_at >= p_since
      and case
        when p_everything then true
        when p_tags is null and p_authors is null then exists (
          select 1 from public.follows f
          where f.chat_id = p_chat_id
            and (f.target = 'all'
              or (f.target = 'author' and f.value = pp.author_handle)
              or (f.target = 'tag' and f.value = any (pp.tags))))
        else pp.author_handle = any (coalesce(p_authors, '{}'))
          or pp.tags && coalesce(p_tags, '{}')
      end
    order by pp.published_at desc
    limit 50
  ),
  shown as (select * from picked order by published_at desc limit 8),
  total as (select count(*) as n from picked),
  grouped as (
    select
      g.topic_name,
      g.n,
      g.latest,
      (select string_agg(
          format(E'• <a href="%s/post/%s">%s</a>', public.telegram_html_escape(p_site_url), s.id, public.telegram_html_escape(s.title)),
          E'\n' order by s.published_at desc)
        from shown s where s.topic_name = g.topic_name) as items
    from (select topic_name, count(*) as n, max(published_at) as latest from picked group by topic_name) g
  )
  select case when (select n from total) = 0 then null else
    format('<b>%s new %s %s</b>',
      (select n from total),
      case when (select n from total) = 1 then 'note' else 'notes' end,
      public.telegram_html_escape(p_label))
      || E'\n\n'
      || (select string_agg(
            format(E'<b>%s</b> · %s\n%s', public.telegram_html_escape(g.topic_name), g.n, g.items),
            E'\n\n' order by g.n desc, g.latest desc)
          from grouped g where g.items is not null)
      || case when (select n from total) > 8
              then E'\n\n+' || ((select n from total) - 8)::text || ' more'
              else '' end
  end;
$$;

-- Same as 0008, with `everything` in place of `topics`.
create or replace function public.enqueue_due_digests() returns int
language plpgsql security definer set search_path = '' as $$
declare
  due record;
  queued int := 0;
begin
  for due in
    select s.chat_id, s.frequency, s.everything, s.tags, s.authors, o.at as occurrence
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
      'everything', due.everything,
      'tags', to_jsonb(due.tags),
      'authors', to_jsonb(due.authors),
      'label', case when due.frequency = 'weekly' then 'in the last 7 days' else 'in the last 24 hours' end
    ));
    queued := queued + 1;
  end loop;
  if queued > 0 then perform public.kick_notifier(); end if;
  return queued;
end $$;

-- Same as 0007, without the topic clause.
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

revoke execute on function public.digest_text(bigint, timestamptz, text, text, text[], text[], boolean) from public, anon, authenticated;
revoke execute on function public.enqueue_due_digests() from public, anon, authenticated;
