// Read queries. Each body runs on the server ("use server"), so the mock store and
// Supabase clients never reach the browser. The router caches results by key + args.
//
// Wiring Supabase: replace each `notWired(...)` with a query on the public_posts view
// (see supabase/migrations/0001_schema.sql) and map rows into the types in lib/types.ts.
import { query } from "@solidjs/router";
import { isMock } from "../env";
import { translate } from "../i18n";
import { toBlocks } from "../markdown";
import { store } from "../mock/store";
import { notWired } from "../server/not-wired";
import { getCtx, getLocale, getViewer } from "../server/viewer";
import type { AuthorDetail, FeedPage, MyPosts, PostCard, PostDetail, TagDetail, TopicDetail, TopicRef } from "../types";

/** Whole days per feed page, so a day is never split across "Older notes". */
const FEED_DAYS = 3;

export const getFeed = query(async (before: string | null): Promise<FeedPage> => {
  "use server";
  const ctx = await getCtx();
  if (isMock) return store.feed(ctx, before, FEED_DAYS);
  return notWired("getFeed");
}, "feed");

export const getPost = query(async (id: string): Promise<PostDetail | null> => {
  "use server";
  const ctx = await getCtx();
  if (!isMock) return notWired("getPost");
  const found = store.post(id, ctx);
  if (!found) return null;
  return {
    ...found.card,
    blocks: toBlocks(found.body, translate(ctx.locale, "lang.plain")),
    prev: found.prev,
    next: found.next,
  };
}, "post");

export const getTopics = query(async (): Promise<TopicRef[]> => {
  "use server";
  if (isMock) return store.topics(getLocale());
  return notWired("getTopics");
}, "topics");

export const getTopic = query(async (slug: string): Promise<TopicDetail | null> => {
  "use server";
  if (isMock) return store.topic(slug, getLocale());
  return notWired("getTopic");
}, "topic");

export const getTag = query(async (slug: string): Promise<TagDetail | null> => {
  "use server";
  if (isMock) return store.tag(slug, getLocale());
  return notWired("getTag");
}, "tag");

export const getAuthor = query(async (handle: string): Promise<AuthorDetail | null> => {
  "use server";
  if (isMock) return store.author(handle, getLocale());
  return notWired("getAuthor");
}, "author");

export const getPosts = query(async (filter: { topic?: string; tag?: string; author?: string }): Promise<PostCard[]> => {
  "use server";
  const ctx = await getCtx();
  if (isMock) return store.list(filter, ctx);
  return notWired("getPosts");
}, "posts");

export const getMyPosts = query(async (): Promise<MyPosts | null> => {
  "use server";
  const user = await getViewer();
  if (!user) return null;
  if (isMock) return store.mine(user.handle);
  return notWired("getMyPosts");
}, "my-posts");
