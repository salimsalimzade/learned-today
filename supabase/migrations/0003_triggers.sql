-- 0003_triggers.sql: profiles from sign-ups, post bookkeeping, the 5-tag limit and the reactions RPC.

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
