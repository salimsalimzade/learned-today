-- 0004_search.sql: command palette search over titles, bodies and tags.
-- 'simple' config: there's no Azerbaijani stemmer, so words match as written (lowercased).
-- Trigram indexes catch partial words ("tip" → "tipini").

alter table public.posts
  add column search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(body_md, '')), 'B')
  ) stored;

create index posts_search_idx on public.posts using gin (search);
create index posts_title_trgm_idx on public.posts using gin (title extensions.gin_trgm_ops);
create index post_tags_tag_trgm_idx on public.post_tags using gin (tag extensions.gin_trgm_ops);

create or replace function public.search_posts(q text, max_results int default 20)
returns setof public.public_posts
language sql stable security invoker set search_path = '' as $$
  with needle as (
    select
      websearch_to_tsquery('simple', q) as ts,
      '%' || replace(replace(replace(ltrim(btrim(q), '#'), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select pp.*
  from public.public_posts pp
  join public.posts p on p.id = pp.id
  cross join needle n
  where p.search @@ n.ts
     or p.title ilike n.pattern
     or exists (select 1 from public.post_tags t where t.post_id = p.id and t.tag ilike n.pattern)
  order by ts_rank(p.search, n.ts) desc, pp.published_at desc
  limit least(max_results, 50);
$$;
