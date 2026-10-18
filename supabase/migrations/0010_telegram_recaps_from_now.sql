-- 0010_telegram_recaps_from_now.sql: recaps count from when they were saved, not from a clock time.
--
-- A recap used to be "every day at 15:38 Baku time", which needs the person's time zone. Now it is
-- "every 24 hours" (daily) or "every 7 days" (weekly) from the moment it was saved (created_at), so it
-- arrives at the hour the person ran /schedule, wherever they are. Saving again starts a new count.
-- Existing schedules keep running, counted from when they were last saved.
--  digest_schedules  loses at_time and weekday (and with them the check that tied weekday to weekly).
--  digest_occurrence the latest step from the anchor that is not in the future.

alter table public.digest_schedules drop column at_time;
alter table public.digest_schedules drop column weekday;

drop function public.digest_occurrence(text, int, time, timestamptz);

-- The latest slot not after p_now: p_anchor plus a whole number of days or weeks. It is p_anchor itself
-- until the first step has passed, which enqueue_due_digests ignores (it only queues slots after the anchor).
create function public.digest_occurrence(p_frequency text, p_anchor timestamptz, p_now timestamptz)
returns timestamptz language sql stable set search_path = '' as $$
  with step as (select case when p_frequency = 'weekly' then 604800 else 86400 end as secs)
  select p_anchor + make_interval(secs => (floor(greatest(extract(epoch from (p_now - p_anchor)), 0) / secs) * secs)::double precision)
  from step;
$$;

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
    cross join lateral (select public.digest_occurrence(s.frequency, s.created_at, now()) as at) o
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

revoke execute on function public.digest_occurrence(text, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.enqueue_due_digests() from public, anon, authenticated;
