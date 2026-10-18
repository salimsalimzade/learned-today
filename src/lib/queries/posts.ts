// Read queries. Each body runs on the server ("use server"), so the Supabase clients never
// reach the browser. The router caches results by key + args.
import { query } from "@solidjs/router";
import { dayKey } from "../format";
import { toBlocks } from "../markdown";
import {
  authorCounts,
  feedRows,
  getPostRow,
  listPosts,
  neighbourPost,
  profileRow,
  reactionsOf,
  tagCounts,
  toCards,
  topicCounts,
  topicRow,
  topicRows,
  totalOf,
} from "../server/post-rows";
import { getCtx, getViewer } from "../server/viewer";
import type { AuthorDetail, FeedDay, FeedPage, MyPosts, PostCard, PostDetail, TagDetail, TopicChoice, TopicDetail } from "../types";

/** Whole days per feed page, so a day is never split across "Older notes". */
const FEED_DAYS = 3;
/** Newest posts on a tag, topic or author page. */
const LIST_LIMIT = 50;

export const getFeed = query(async (before: string | null): Promise<FeedPage> => {
  "use server";
  const ctx = await getCtx();
  // One day more than a page: its existence means there's an older page.
  const cards = await toCards(await feedRows(before, FEED_DAYS + 1), ctx.user?.id ?? null);
  const days: FeedDay[] = [];
  for (const card of cards) {
    const key = dayKey(card.publishedAt);
    const last = days.at(-1);
    if (last?.key === key) last.posts.push(card);
    else days.push({ key, posts: [card] });
  }
  if (days.length > FEED_DAYS) return { days: days.slice(0, FEED_DAYS), nextCursor: days[FEED_DAYS - 1].key };
  return { days, nextCursor: null };
}, "feed");

export const getPost = query(async (id: string): Promise<PostDetail | null> => {
  "use server";
  if (!/^\d+$/.test(id)) return null;
  const ctx = await getCtx();
  const row = await getPostRow(Number(id));
  if (!row) return null;
  const [card] = await toCards([row], ctx.user?.id ?? null);
  const [prev, next] = await Promise.all([neighbourPost(card.publishedAt, true), neighbourPost(card.publishedAt, false)]);
  return {
    ...card,
    blocks: toBlocks(row.body_md ?? "", "Plain text"),
    prev,
    next,
  };
}, "post");

export const getTopics = query(async (): Promise<TopicChoice[]> => {
  "use server";
  const rows = await topicRows();
  return rows.map((r) => ({ slug: r.slug, name: r.name })).sort((a, b) => a.name.localeCompare(b.name, "en"));
}, "topics");

export const getTopic = query(async (slug: string): Promise<TopicDetail | null> => {
  "use server";
  const topic = await topicRow(slug);
  if (!topic) return null;
  const rows = await listPosts({ topic: slug });
  return {
    slug: topic.slug,
    name: topic.name,
    postCount: rows.length,
    authorCount: authorCounts(rows).length,
    tags: tagCounts(rows),
    authors: authorCounts(rows),
  };
}, "topic");

export const getTag = query(async (slug: string): Promise<TagDetail | null> => {
  "use server";
  const rows = await listPosts({ tag: slug });
  if (!rows.length) return null;
  return {
    slug,
    postCount: rows.length,
    authorCount: authorCounts(rows).length,
    topics: topicCounts(rows),
  };
}, "tag");

export const getAuthor = query(async (handle: string): Promise<AuthorDetail | null> => {
  "use server";
  const profile = await profileRow(handle);
  if (!profile) return null;
  const rows = await listPosts({ author: handle });
  return {
    handle: profile.handle,
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
    provider: profile.provider === "google" ? "google" : "github",
    postCount: rows.length,
    reactionCount: rows.reduce((n, r) => n + totalOf(reactionsOf(r)), 0),
    topics: topicCounts(rows),
  };
}, "author");

export const getPosts = query(async (filter: { topic?: string; tag?: string; author?: string }): Promise<PostCard[]> => {
  "use server";
  const ctx = await getCtx();
  return toCards(await listPosts(filter, LIST_LIMIT), ctx.user?.id ?? null);
}, "posts");

export const getMyPosts = query(async (): Promise<MyPosts | null> => {
  "use server";
  const user = await getViewer();
  if (!user) return null;
  const rows = await listPosts({ author: user.handle });
  return {
    postCount: rows.length,
    reactionCount: rows.reduce((n, r) => n + totalOf(reactionsOf(r)), 0),
    recent: rows.slice(0, 3).map((r) => ({
      id: String(r.id),
      title: r.title ?? "",
      publishedAt: r.published_at ?? "",
      reactions: totalOf(reactionsOf(r)),
    })),
  };
}, "my-posts");
