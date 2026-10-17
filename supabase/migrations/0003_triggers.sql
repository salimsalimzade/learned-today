-- 0003_triggers.sql: profiles from sign-ups, post bookkeeping, the 5-tag limit,
-- reactions RPC, and the Telegram notification queue (pg_cron → notifier → Telegram).

-- updated_at, read_minutes, published_at -------------------------------------------
create or replace function public.posts_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  -- About 200 words a minute, code blocks count as one word.
  new.read_minutes := greatest(1, round(array_length(regexp_split_to_array(btrim(regexp_replace(new.body_md, '```.*?```', ' code ', 'gs')), '\s+'), 1) / 200.0));
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger posts_before_write before insert or update on public.posts
  for each row execute function public.posts_before_write();

-- A profile for every new auth user ------------------------------------------------
-- Handle comes from the GitHub username or the email's local part, made URL-safe and unique.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base text;
  candidate text;
begin
  base := lower(coalesce(meta ->> 'user_name', meta ->> 'preferred_username', split_part(new.email, '@', 1), 'user'));
  base := trim(both '-' from regexp_replace(base, '[^a-z0-9]+', '-', 'g'));
  if char_length(base) < 2 then base := 'user'; end if;
  base := left(base, 32);
  candidate := base;
  while exists (select 1 from public.profiles where handle = candidate) loop
    candidate := base || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, handle, display_name, avatar_url, provider)
  values (
    new.id,
    candidate,
    left(coalesce(meta ->> 'full_name', meta ->> 'name', candidate), 80),
    meta ->> 'avatar_url',
    coalesce(new.raw_app_meta_data ->> 'provider', 'github')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- At most 5 tags per post -------------------------------------------------------------
create or replace function public.post_tags_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.post_tags where post_id = new.post_id) >= 5 then
    raise exception 'A post can have at most 5 tags' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger post_tags_limit before insert on public.post_tags
  for each row execute function public.post_tags_limit();

-- set_reaction(post, kind): one reaction per person, null removes it ------------------
create or replace function public.set_reaction(p_post_id bigint, p_kind public.reaction_kind)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  if p_kind is null then
    delete from public.reactions where post_id = p_post_id and user_id = auth.uid();
  else
    insert into public.reactions (post_id, user_id, kind) values (p_post_id, auth.uid(), p_kind)
    on conflict (post_id, user_id) do update set kind = excluded.kind, created_at = now();
  end if;
  return jsonb_build_object(
    'mine', p_kind,
    'counts', coalesce((select jsonb_object_agg(kind, n) from (
      select kind, count(*) as n from public.reactions where post_id = p_post_id group by kind
    ) r), '{}'::jsonb)
  );
end $$;

-- Queue Telegram messages when a post is published ----------------------------------
-- Topic, author and "all" followers are queued when the post goes live; tag followers
-- when its tags are inserted (they arrive right after the post, in the same RPC).
create or replace function public.enqueue_post_notifications() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    insert into public.notification_queue (post_id, chat_id)
    select distinct new.id, f.chat_id
    from public.follows f
    join public.telegram_chats c on c.chat_id = f.chat_id and c.blocked_at is null
    where f.target = 'all'
       or (f.target = 'topic' and f.value = new.topic_slug)
       or (f.target = 'author' and f.value = (select handle from public.profiles where id = new.author_id))
    on conflict (post_id, chat_id) do nothing;
  end if;
  return null;
end $$;

create trigger posts_enqueue_notifications after insert or update of status on public.posts
  for each row execute function public.enqueue_post_notifications();

create or replace function public.enqueue_tag_notifications() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notification_queue (post_id, chat_id)
  select distinct new.post_id, f.chat_id
  from public.follows f
  join public.telegram_chats c on c.chat_id = f.chat_id and c.blocked_at is null
  join public.posts p on p.id = new.post_id and p.status = 'published'
  where f.target = 'tag' and f.value = new.tag
  on conflict (post_id, chat_id) do nothing;
  return null;
end $$;

create trigger post_tags_enqueue_notifications after insert on public.post_tags
  for each row execute function public.enqueue_tag_notifications();

-- The notifier claims a batch at a time; skip locked keeps two runs from sending twice.
create or replace function public.claim_notifications(batch_size int default 25)
returns setof public.notification_queue language sql security definer set search_path = '' as $$
  update public.notification_queue q
  set attempts = q.attempts + 1
  where q.id in (
    select id from public.notification_queue
    where status = 'pending' and attempts < 5
    order by created_at
    limit batch_size
    for update skip locked
  )
  returning q.*;
$$;

revoke execute on function public.claim_notifications(int) from public, anon, authenticated;

-- Every minute, pg_cron asks the notifier Edge Function to drain the queue ----------
-- Store the two secrets once (SQL editor or `supabase secrets` + Vault):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'telegram-notifier',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notifier',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  )
  where exists (select 1 from public.notification_queue where status = 'pending');
  $$
);
