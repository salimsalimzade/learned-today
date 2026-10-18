-- 0011_feed_page_time_zone.sql: the feed counts days in the visitor's time zone.
--
-- feed_page used to cut days at midnight in Asia/Baku. It now takes the zone as p_time_zone (the site sends
-- the tz cookie, see readTimeZone in src/lib/prefs.ts), so "Today" and the day headers match the visitor's
-- clock. A name Postgres doesn't know falls back to Asia/Baku. p_before is a day in that same zone.

drop function public.feed_page(date, int);

create function public.feed_page(p_before date default null, p_days int default 3, p_time_zone text default 'Asia/Baku')
returns setof public.public_posts
language sql stable security invoker set search_path = '' as $$
  with zone as (
    select case when exists (select 1 from pg_catalog.pg_timezone_names where name = p_time_zone)
                then p_time_zone else 'Asia/Baku' end as name
  ),
  days as (
    select distinct (pp.published_at at time zone z.name)::date as day
    from public.public_posts pp, zone z
    where p_before is null or (pp.published_at at time zone z.name)::date < p_before
    order by day desc
    limit p_days
  )
  select pp.*
  from zone z
  cross join public.public_posts pp
  join days d on d.day = (pp.published_at at time zone z.name)::date
  order by pp.published_at desc;
$$;
