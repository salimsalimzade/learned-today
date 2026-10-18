// Reads from Supabase for posts, topics, authors and reactions. Shared by the queries in
// src/lib/queries and the RSS routes. Server only: it uses the request's Supabase client.
import { toPreview } from "../markdown";
import { readTimeZone } from "../prefs";
import type { Database } from "../supabase/database.types";
import { createSupabaseServerClient } from "../supabase/server";
import type { AuthorCount, PostCard, ReactionCounts, ReactionKind, TagCount, TopicCount } from "../types";

export type PostRow = Database["public"]["Views"]["public_posts"]["Row"];
export type TopicRow = Database["public"]["Tables"]["topics"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Which posts to list. Several filters combine. */
export interface Filter {
  topic?: string;
  tag?: string;
  author?: string;
}

/** Throws on a database error, so the page shows its error state instead of empty data. */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as T;
}

/** Published posts, newest first. No limit means every match (topic, tag and author pages count them). */
export async function listPosts(filter: Filter, limit?: number): Promise<PostRow[]> {
  let q = createSupabaseServerClient().from("public_posts").select("*");
  if (filter.topic) q = q.eq("topic_slug", filter.topic);
  if (filter.tag) q = q.contains("tags", [filter.tag]);
  if (filter.author) q = q.eq("author_handle", filter.author);
  q = q.order("published_at", { ascending: false });
  if (limit) q = q.limit(limit);
  return unwrap(await q, "listPosts");
}

/** The columns tagCounts, authorCounts and topicCounts read. */
export type FacetRow = Pick<PostRow, "tags" | "author_handle" | "author_name" | "author_avatar_url" | "topic_slug" | "topic_name">;

/** Every published post, but only what the counts need: no bodies, which search would otherwise fetch on each keystroke. */
export async function listFacets(): Promise<FacetRow[]> {
  const q = createSupabaseServerClient()
    .from("public_posts")
    .select("tags, author_handle, author_name, author_avatar_url, topic_slug, topic_name");
  return unwrap(await q, "listFacets");
}

export async function getPostRow(id: number): Promise<PostRow | null> {
  const q = createSupabaseServerClient().from("public_posts").select("*").eq("id", id);
  return unwrap(await q.maybeSingle(), "getPostRow");
}

/** The post right above (newer) or below (older) in the feed order. */
export async function neighbourPost(publishedAt: string, newer: boolean): Promise<{ id: string; title: string } | null> {
  const base = createSupabaseServerClient().from("public_posts").select("*");
  const result = newer
    ? await base.gt("published_at", publishedAt).order("published_at", { ascending: true }).limit(1).maybeSingle()
    : await base.lt("published_at", publishedAt).order("published_at", { ascending: false }).limit(1).maybeSingle();
  const row = unwrap(result, "neighbourPost");
  return row ? { id: String(row.id), title: row.title ?? "" } : null;
}

/** Feed rows for `days` whole days, newest first. `before` is the day the previous page ended on. */
export async function feedRows(before: string | null, days: number): Promise<PostRow[]> {
  const result = await createSupabaseServerClient().rpc("feed_page", {
    p_before: before ?? undefined,
    p_days: days,
    p_time_zone: readTimeZone(),
  });
  return unwrap(result, "feedRows");
}

export async function searchRows(q: string, max: number): Promise<PostRow[]> {
  return unwrap(await createSupabaseServerClient().rpc("search_posts", { q, max_results: max }), "searchRows");
}

export async function topicRows(): Promise<TopicRow[]> {
  return unwrap(await createSupabaseServerClient().from("topics").select("*"), "topicRows");
}

export async function topicRow(slug: string): Promise<TopicRow | null> {
  return unwrap(await createSupabaseServerClient().from("topics").select("*").eq("slug", slug).maybeSingle(), "topicRow");
}

export async function profileRow(handle: string): Promise<ProfileRow | null> {
  return unwrap(await createSupabaseServerClient().from("profiles").select("*").eq("handle", handle).maybeSingle(), "profileRow");
}

/** This person's reactions on the given posts. Guests get an empty map. */
export async function myReactions(userId: string | null, postIds: number[]): Promise<Map<string, ReactionKind>> {
  const map = new Map<string, ReactionKind>();
  if (!userId || !postIds.length) return map;
  const rows = unwrap(
    await createSupabaseServerClient().from("reactions").select("post_id,kind").eq("user_id", userId).in("post_id", postIds),
    "myReactions",
  );
  for (const r of rows) map.set(String(r.post_id), r.kind);
  return map;
}

/** The display name of a personal RSS feed's owner, or null when no feed has this token (0014). */
export async function rssFeedOwner(token: string): Promise<string | null> {
  return unwrap(await createSupabaseServerClient().rpc("rss_feed_owner", { p_token: token }), "rssFeedOwner");
}

/** The newest notes on a personal RSS feed's tags and authors. */
export async function rssFeedRows(token: string, limit: number): Promise<PostRow[]> {
  return unwrap(await createSupabaseServerClient().rpc("rss_feed_posts", { p_token: token, p_limit: limit }), "rssFeedRows");
}

export const reactionsOf = (row: PostRow) => (row.reactions ?? {}) as ReactionCounts;

export function toCard(row: PostRow, mine: ReactionKind | null): PostCard {
  return {
    id: String(row.id),
    title: row.title ?? "",
    ...toPreview(row.body_md ?? ""),
    author: { handle: row.author_handle ?? "", name: row.author_name ?? "", avatarUrl: row.author_avatar_url },
    topic: { slug: row.topic_slug ?? "", name: row.topic_name ?? "" },
    tags: row.tags ?? [],
    publishedAt: row.published_at ?? "",
    readMinutes: row.read_minutes ?? 1,
    reactions: reactionsOf(row),
    myReaction: mine,
  };
}

/** Cards for a list of rows, with this viewer's own reactions filled in. */
export async function toCards(rows: PostRow[], userId: string | null): Promise<PostCard[]> {
  const mine = await myReactions(
    userId,
    rows.map((r) => r.id ?? 0),
  );
  return rows.map((r) => toCard(r, mine.get(String(r.id)) ?? null));
}

export const totalOf = (counts: ReactionCounts) => Object.values(counts).reduce((n, c) => n + (c ?? 0), 0);

/** Counts per tag, most used first. */
export function tagCounts(rows: FacetRow[]): TagCount[] {
  const m = new Map<string, number>();
  for (const r of rows) for (const t of r.tags ?? []) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m].map(([slug, count]) => ({ slug, count })).sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug, "az"));
}

/** Counts per author, most posts first. */
export function authorCounts(rows: FacetRow[]): AuthorCount[] {
  const m = new Map<string, AuthorCount>();
  for (const r of rows) {
    const handle = r.author_handle ?? "";
    const seen = m.get(handle);
    if (seen) seen.count++;
    else m.set(handle, { handle, name: r.author_name ?? "", avatarUrl: r.author_avatar_url, count: 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

/** Counts per topic, most posts first. */
export function topicCounts(rows: FacetRow[]): TopicCount[] {
  const m = new Map<string, TopicCount>();
  for (const r of rows) {
    const slug = r.topic_slug ?? "";
    const seen = m.get(slug);
    if (seen) seen.count++;
    else m.set(slug, { slug, name: r.topic_name ?? "", count: 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}
