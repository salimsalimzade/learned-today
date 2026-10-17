// In-memory stand-in for the database. Lives as long as the server process, so
// reactions and new posts survive page loads in dev but reset on restart.
import { dayKey, fold, readMinutes } from "../format";
import { excerptOf } from "../markdown";
import { applyReaction, totalReactions } from "../reactions";
import type {
  AuthorCount,
  AuthorDetail,
  AuthorRef,
  FeedPage,
  Locale,
  MyPosts,
  PostCard,
  ReactionCounts,
  ReactionKind,
  SearchResults,
  SessionUser,
  TagCount,
  TagDetail,
  TopicCount,
  TopicDetail,
  TopicRef,
} from "../types";
import { type MockPost, profiles, posts as seedPosts, seedUserReactions, topics } from "./data";

/** Who is asking and in which interface language. */
export interface Ctx {
  viewer: string | null;
  locale: Locale;
}

type Filter = { topic?: string; tag?: string; author?: string };

const posts: MockPost[] = [...seedPosts];
const userReactions = new Map<string, Map<string, ReactionKind>>(
  Object.entries(seedUserReactions).map(([h, r]) => [h, new Map(Object.entries(r))]),
);
let nextId = posts.length + 1;

const byNewest = (a: MockPost, b: MockPost) => b.publishedAt.localeCompare(a.publishedAt);
const matches = (p: MockPost, f: Filter) =>
  (!f.topic || p.topicSlug === f.topic) && (!f.tag || p.tags.includes(f.tag)) && (!f.author || p.authorHandle === f.author);

function authorRef(handle: string): AuthorRef {
  const p = profiles.find((x) => x.handle === handle)!;
  return { handle: p.handle, name: p.name, avatarUrl: p.avatarUrl };
}

function topicRef(slug: string, locale: Locale): TopicRef {
  const t = topics.find((x) => x.slug === slug)!;
  return { slug: t.slug, name: t.name[locale] };
}

function countsFor(post: MockPost): ReactionCounts {
  let counts = { ...post.baseReactions };
  for (const map of userReactions.values()) {
    const kind = map.get(post.id);
    if (kind) counts = applyReaction(counts, null, kind);
  }
  return counts;
}

function toCard(post: MockPost, ctx: Ctx): PostCard {
  return {
    id: post.id,
    title: post.title,
    excerpt: excerptOf(post.body),
    lang: post.lang,
    author: authorRef(post.authorHandle),
    topic: topicRef(post.topicSlug, ctx.locale),
    tags: post.tags,
    publishedAt: post.publishedAt,
    readMinutes: readMinutes(post.body),
    reactions: countsFor(post),
    myReaction: ctx.viewer ? (userReactions.get(ctx.viewer)?.get(post.id) ?? null) : null,
  };
}

function tagCounts(list: MockPost[]): TagCount[] {
  const m = new Map<string, number>();
  for (const p of list) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m].map(([slug, count]) => ({ slug, count })).sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug, "az"));
}

function authorCounts(list: MockPost[]): AuthorCount[] {
  const m = new Map<string, number>();
  for (const p of list) m.set(p.authorHandle, (m.get(p.authorHandle) ?? 0) + 1);
  return [...m].map(([h, count]) => ({ ...authorRef(h), count })).sort((a, b) => b.count - a.count);
}

function topicCounts(list: MockPost[], locale: Locale): TopicCount[] {
  const m = new Map<string, number>();
  for (const p of list) m.set(p.topicSlug, (m.get(p.topicSlug) ?? 0) + 1);
  return [...m].map(([s, count]) => ({ ...topicRef(s, locale), count })).sort((a, b) => b.count - a.count);
}

export const store = {
  user(handle: string): SessionUser | null {
    const p = profiles.find((x) => x.handle === handle);
    return p ? { id: p.id, handle: p.handle, name: p.name, avatarUrl: p.avatarUrl, provider: p.provider } : null;
  },

  /** Posts grouped by day, `daysPerPage` whole days at a time, older than the `before` day key. */
  feed(ctx: Ctx, before: string | null, daysPerPage: number): FeedPage {
    const keys: string[] = [];
    const groups = new Map<string, PostCard[]>();
    const page = () => keys.map((k) => ({ key: k, posts: groups.get(k)! }));
    for (const p of [...posts].sort(byNewest)) {
      const key = dayKey(p.publishedAt);
      if (before && key >= before) continue;
      if (!groups.has(key)) {
        if (keys.length === daysPerPage) return { days: page(), nextCursor: keys.at(-1)! };
        keys.push(key);
        groups.set(key, []);
      }
      groups.get(key)!.push(toCard(p, ctx));
    }
    return { days: page(), nextCursor: null };
  },

  post(id: string, ctx: Ctx) {
    const sorted = [...posts].sort(byNewest);
    const i = sorted.findIndex((p) => p.id === id);
    if (i < 0) return null;
    // Same order as the feed (newest first), so k/j on a post move like k/j in the list:
    // "previous" is the newer note above, "next" the older one below.
    const newer = sorted[i - 1];
    const older = sorted[i + 1];
    return {
      card: toCard(sorted[i], ctx),
      body: sorted[i].body,
      prev: newer ? { id: newer.id, title: newer.title } : null,
      next: older ? { id: older.id, title: older.title } : null,
    };
  },

  topics(locale: Locale): TopicRef[] {
    return topics.map((t) => ({ slug: t.slug, name: t.name[locale] }));
  },

  topic(slug: string, locale: Locale): TopicDetail | null {
    const t = topics.find((x) => x.slug === slug);
    if (!t) return null;
    const list = posts.filter((p) => p.topicSlug === slug);
    const authors = authorCounts(list);
    return {
      slug: t.slug,
      name: t.name[locale],
      description: t.description[locale],
      postCount: list.length,
      authorCount: authors.length,
      tags: tagCounts(list),
      authors,
    };
  },

  tag(slug: string, locale: Locale): TagDetail | null {
    const list = posts.filter((p) => p.tags.includes(slug));
    if (!list.length) return null;
    return { slug, postCount: list.length, authorCount: authorCounts(list).length, topics: topicCounts(list, locale) };
  },

  author(handle: string, locale: Locale): AuthorDetail | null {
    const p = profiles.find((x) => x.handle === handle);
    if (!p) return null;
    const list = posts.filter((x) => x.authorHandle === handle);
    return {
      handle: p.handle,
      name: p.name,
      avatarUrl: p.avatarUrl,
      provider: p.provider,
      postCount: list.length,
      reactionCount: list.reduce((n, x) => n + totalReactions(countsFor(x)), 0),
      topics: topicCounts(list, locale),
    };
  },

  list(filter: Filter, ctx: Ctx, limit = 50): PostCard[] {
    return posts
      .filter((p) => matches(p, filter))
      .sort(byNewest)
      .slice(0, limit)
      .map((p) => toCard(p, ctx));
  },

  /** Posts with their Markdown body, for RSS and Telegram. Newest first. */
  raw(filter: Filter, locale: Locale, limit = 30) {
    return posts
      .filter((p) => matches(p, filter))
      .sort(byNewest)
      .slice(0, limit)
      .map((p) => ({ ...p, author: authorRef(p.authorHandle), topic: topicRef(p.topicSlug, locale) }));
  },

  mine(handle: string): MyPosts {
    const list = posts.filter((p) => p.authorHandle === handle).sort(byNewest);
    return {
      postCount: list.length,
      reactionCount: list.reduce((n, p) => n + totalReactions(countsFor(p)), 0),
      recent: list
        .slice(0, 3)
        .map((p) => ({ id: p.id, title: p.title, publishedAt: p.publishedAt, reactions: totalReactions(countsFor(p)) })),
    };
  },

  search(q: string, ctx: Ctx): SearchResults {
    const needle = fold(q.trim().replace(/^#/, ""));
    if (!needle) return { posts: [], tags: [], topics: [], authors: [] };
    const hit = (s: string) => fold(s).includes(needle);
    const found = posts.filter((p) => hit(p.title) || hit(p.body) || p.tags.some(hit)).sort(byNewest);
    return {
      posts: found.slice(0, 6).map((p) => toCard(p, ctx)),
      tags: tagCounts(posts)
        .filter((t) => hit(t.slug))
        .slice(0, 4),
      topics: topicCounts(posts, ctx.locale)
        .filter((t) => hit(t.name) || hit(t.slug))
        .slice(0, 3),
      authors: authorCounts(posts)
        .filter((a) => hit(a.name) || hit(a.handle))
        .slice(0, 3),
    };
  },

  react(postId: string, handle: string, kind: ReactionKind | null) {
    const post = posts.find((p) => p.id === postId);
    if (!post) return null;
    const map = userReactions.get(handle) ?? new Map<string, ReactionKind>();
    userReactions.set(handle, map);
    if (kind) map.set(postId, kind);
    else map.delete(postId);
    return { counts: countsFor(post), mine: kind };
  },

  publish(input: { title: string; body: string; topic: string; tags: string[]; lang: Locale }, handle: string) {
    if (!topics.some((t) => t.slug === input.topic)) throw new Error("Unknown topic");
    const id = String(nextId++);
    posts.push({
      id,
      title: input.title,
      body: input.body,
      lang: input.lang,
      authorHandle: handle,
      topicSlug: input.topic,
      tags: input.tags,
      publishedAt: new Date().toISOString(),
      baseReactions: {},
    });
    return id;
  },
};
