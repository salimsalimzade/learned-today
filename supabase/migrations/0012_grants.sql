-- 0012_grants.sql: table and view privileges for the API roles.
-- Local Supabase grants everything in public to anon, authenticated and service_role by default, so
-- 0001-0011 never wrote grants. A hosted project can start without those defaults, and then every
-- query fails with "permission denied for view public_posts". RLS (0002) still decides which rows.

grant usage on schema public to anon, authenticated, service_role;

-- Public reading. public_posts is security_invoker, so the caller also needs select on what it joins.
grant select on public.public_posts, public.profiles, public.topics, public.posts, public.post_tags, public.reactions
  to anon, authenticated;

-- Signed-in writes, one grant per policy in 0002. create_post (0005) runs as the caller.
grant update on public.profiles to authenticated;
grant insert, update, delete on public.posts to authenticated;
grant insert, delete on public.post_tags to authenticated;
grant insert, update, delete on public.reactions to authenticated;
grant usage on all sequences in schema public to authenticated;

-- Server only: the Telegram webhook and the notifier use the service role. telegram_chats, follows
-- and digest_schedules have no policies, so the browser roles get nothing on them.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
