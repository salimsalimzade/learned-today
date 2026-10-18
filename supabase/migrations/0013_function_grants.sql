-- 0013_function_grants.sql: execute privileges on the public functions (companion to 0012).
-- 0005-0010 revoke execute from public on the internal functions (notifications_*, digest_text, ...),
-- so service_role only had it through Supabase's default grants, which a hosted project may lack.
-- The notifier and the Telegram webhook call them as service_role.

grant execute on all functions in schema public to service_role;
grant execute on function public.feed_page(date, int, text), public.search_posts(text, int) to anon, authenticated;
grant execute on function public.set_reaction(bigint, public.reaction_kind) to authenticated;
