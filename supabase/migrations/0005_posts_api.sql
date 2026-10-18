-- 0005_posts_api.sql: publishing a note and the home feed.
--
-- create_post inserts a post and its tags in one transaction, so a failed tag never leaves a post
-- behind. It runs as the signed-in person (security invoker), so the RLS insert policies on posts and
-- post_tags still apply. The triggers in 0003 do the rest: read time, published_at and the 5-tag limit.
-- The Telegram queue (0006) is filled by a trigger that fires when the transaction commits.

create or replace function public.create_post(
  p_topic_slug text,
  p_title text,
  p_body_md text,
  p_tags text[]
) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare
  new_id bigint;
begin
  insert into public.posts (topic_slug, title, body_md, written_by_author)
  values (p_topic_slug, p_title, p_body_md, true)
  returning id into new_id;

  insert into public.post_tags (post_id, tag)
  select distinct new_id, t from unnest(coalesce(p_tags, '{}'::text[])) as t;

  return new_id;
end $$;

revoke execute on function public.create_post(text, text, text, text[]) from public, anon;
grant execute on function public.create_post(text, text, text, text[]) to authenticated;

-- The home feed, whole days at a time, so a day is never split across pages.
-- Days are counted in the site time zone (SITE_TIME_ZONE in src/lib/env.ts). p_before is the day the
-- previous page ended on: only days before it are returned. Null means the first page.
create or replace function public.feed_page(p_before date default null, p_days int default 3)
returns setof public.public_posts
language sql stable security invoker set search_path = '' as $$
  with days as (
    select distinct (pp.published_at at time zone 'Asia/Baku')::date as day
    from public.public_posts pp
    where p_before is null or (pp.published_at at time zone 'Asia/Baku')::date < p_before
    order by day desc
    limit p_days
  )
  select pp.*
  from public.public_posts pp
  join days d on d.day = (pp.published_at at time zone 'Asia/Baku')::date
  order by pp.published_at desc;
$$;
