-- 0006_telegram_queue.sql: Telegram notifications on Supabase Queues (the pgmq extension).
--
--  queue telegram_notifications          one message per chat per post: {"post_id": 1, "chat_id": 2}
--  queue telegram_notifications_failed   dead letters: messages that can't be sent, with the error
--
--  read     pgmq.read leases a message for 2 minutes (the visibility timeout). If the notifier
--           dies mid-send the message reappears on its own.
--  success  pgmq.archive moves it to the archive table, where it stays for 14 days.
--  retry    pgmq.set_vt hides it again: 30 s, 2 min, 10 min, then 1 h; after the 5th read it
--           goes to the dead-letter queue. Telegram's retry_after wins if it is longer.
--  enqueue  one deferred trigger queues each post once, at commit when its tags exist, so a
--           person who follows both the topic and a tag still gets a single message.
--  wake-up  enqueueing calls the notifier right away; pg_cron checks every 15 seconds for
--           messages whose retry time has come.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists pgmq;
select pgmq.create('telegram_notifications');
select pgmq.create('telegram_notifications_failed');

-- Nothing here is for the browser: no policies, so only the service role and the functions below can read.
alter table pgmq.q_telegram_notifications enable row level security;
alter table pgmq.a_telegram_notifications enable row level security;
alter table pgmq.q_telegram_notifications_failed enable row level security;
alter table pgmq.a_telegram_notifications_failed enable row level security;

-- Wake the notifier. pg_net sends the request after the surrounding transaction commits. Without
-- the Vault secrets (a fresh local setup) this does nothing, and it never blocks publishing.
create or replace function public.kick_notifier() returns void
language plpgsql security definer set search_path = '' as $$
declare
  base text;
  key text;
begin
  select decrypted_secret into base from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into key from vault.decrypted_secrets where name = 'service_role_key';
  if base is not null and key is not null then
    perform net.http_post(
      url := base || '/functions/v1/notifier',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || key),
      body := '{}'::jsonb
    );
  end if;
exception when others then
  null;
end $$;

-- Runs at commit, after create_post has inserted the tags. A chat that follows the topic, the
-- author, a tag and "all" at once appears once in the distinct list.
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
    where f.target = 'all'
       or (f.target = 'topic' and f.value = new.topic_slug)
       or (f.target = 'author' and f.value = (select handle from public.profiles where id = new.author_id))
       or (f.target = 'tag' and f.value in (select tag from public.post_tags where post_id = new.id))
  ) c;

  if msgs is not null then
    perform pgmq.send_batch('telegram_notifications', msgs);
    perform public.kick_notifier();
  end if;
  return null;
end $$;

create constraint trigger posts_enqueue_notifications
  after insert or update of status on public.posts
  deferrable initially deferred
  for each row execute function public.enqueue_post_notifications();

-- What the notifier calls (service role only). The pgmq schema itself isn't exposed to the API.
create or replace function public.notifications_read(p_qty int default 25, p_lease int default 120)
returns table (msg_id bigint, read_ct int, message jsonb)
language sql security definer set search_path = '' as $$
  select m.msg_id, m.read_ct, m.message from pgmq.read('telegram_notifications', p_lease, p_qty) m;
$$;

create or replace function public.notifications_ack(p_msg_id bigint) returns void
language sql security definer set search_path = '' as $$
  select pgmq.archive('telegram_notifications', p_msg_id);
$$;

-- Sending can't succeed: park it in the dead-letter queue with the reason.
create or replace function public.notifications_fail(p_msg_id bigint, p_error text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb;
begin
  select message into m from pgmq.q_telegram_notifications where msg_id = p_msg_id;
  if m is null then return; end if;
  perform pgmq.send('telegram_notifications_failed', m || jsonb_build_object('error', p_error, 'failed_at', now()));
  perform pgmq.delete('telegram_notifications', p_msg_id);
end $$;

-- Try again later: 30 s, 2 min, 10 min, 1 h. p_min_wait (seconds) is Telegram's retry_after.
create or replace function public.notifications_retry(p_msg_id bigint, p_error text, p_min_wait int default 0)
returns void language plpgsql security definer set search_path = '' as $$
declare
  tries int;
begin
  select read_ct into tries from pgmq.q_telegram_notifications where msg_id = p_msg_id;
  if tries is null then return; end if;
  if tries >= 5 then
    perform public.notifications_fail(p_msg_id, p_error);
  else
    perform pgmq.set_vt('telegram_notifications', p_msg_id, greatest(p_min_wait, (array[30, 120, 600, 3600])[least(tries, 4)]));
  end if;
end $$;

revoke execute on function public.kick_notifier() from public, anon, authenticated;
revoke execute on function public.notifications_read(int, int) from public, anon, authenticated;
revoke execute on function public.notifications_ack(bigint) from public, anon, authenticated;
revoke execute on function public.notifications_fail(bigint, text) from public, anon, authenticated;
revoke execute on function public.notifications_retry(bigint, text, int) from public, anon, authenticated;

-- Check for messages that are due every 15 seconds. An idle queue makes the `exists` false, so no call.
select cron.schedule(
  'telegram-notifier',
  '15 seconds',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notifier',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  )
  where exists (select 1 from pgmq.q_telegram_notifications where vt <= now());
  $$
);

-- Sent messages (the archive) and dead letters stay for 14 days, then are deleted.
select cron.schedule(
  'notification-cleanup',
  '17 3 * * *',
  $$
  delete from pgmq.a_telegram_notifications where archived_at < now() - interval '14 days';
  delete from pgmq.q_telegram_notifications_failed where enqueued_at < now() - interval '14 days';
  delete from pgmq.a_telegram_notifications_failed where archived_at < now() - interval '14 days';
  $$
);
