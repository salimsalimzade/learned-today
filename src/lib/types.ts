// Shapes the UI works with. Queries map database rows into these.

export type Provider = "github" | "google";

export const REACTION_KINDS = ["learned", "like", "love", "funny", "surprised", "thanks"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];
export type ReactionCounts = Partial<Record<ReactionKind, number>>;

export interface AuthorRef {
  handle: string;
  name: string;
  avatarUrl: string | null;
}

export interface TopicRef {
  slug: string;
  name: string;
}

/** How much of a note a feed card shows (lib/markdown toCardPreview). */
export interface CardPreview {
  blocks: ProseBlock[];
  /** Longer than a card: the body is clamped and "Read more" links to the rest. */
  truncated: boolean;
  /** Blocks left out entirely. */
  hidden: number;
}

export interface PostCard {
  id: string;
  title: string;
  preview: CardPreview;
  author: AuthorRef;
  topic: TopicRef;
  tags: string[];
  publishedAt: string;
  readMinutes: number;
  reactions: ReactionCounts;
  myReaction: ReactionKind | null;
}

/** One top-level block of a rendered post body. Code blocks render with <CodeBlock>. */
export type ProseBlock =
  | { kind: "html"; tag: "p" | "h2" | "h3" | "ul" | "ol" | "blockquote" | "hr" | "table"; html: string }
  | { kind: "code"; lang: string; label: string; html: string; code: string };

export interface PostLink {
  id: string;
  title: string;
}

/** A post page has the whole body, so no card preview. */
export interface PostDetail extends Omit<PostCard, "preview"> {
  blocks: ProseBlock[];
  prev: PostLink | null;
  next: PostLink | null;
}

export interface FeedDay {
  /** YYYY-MM-DD in the site time zone */
  key: string;
  posts: PostCard[];
}

export interface FeedPage {
  days: FeedDay[];
  nextCursor: string | null;
}

export interface TagCount {
  slug: string;
  count: number;
}

/** A topic a post can be filed under. */
export type TopicChoice = TopicRef;

export interface TopicCount extends TopicRef {
  count: number;
}

export interface AuthorCount extends AuthorRef {
  count: number;
}

export interface TopicDetail extends TopicRef {
  postCount: number;
  authorCount: number;
  tags: TagCount[];
  authors: AuthorCount[];
}

export interface TagDetail {
  slug: string;
  postCount: number;
  authorCount: number;
  topics: TopicCount[];
}

export interface AuthorDetail extends AuthorRef {
  provider: Provider;
  postCount: number;
  reactionCount: number;
  topics: TopicCount[];
}

export interface SessionUser extends AuthorRef {
  id: string;
  provider: Provider;
  /** The zone saved on their profile, or null for "Automatic" (their browser's). */
  timeZone: string | null;
}

export interface MyPosts {
  postCount: number;
  reactionCount: number;
  recent: { id: string; title: string; publishedAt: string; reactions: number }[];
}

export interface SearchResults {
  posts: PostCard[];
  tags: TagCount[];
  topics: TopicCount[];
  authors: AuthorCount[];
}

export type FollowTarget =
  | { type: "topic"; slug: string; name: string }
  | { type: "tag"; slug: string; name: string }
  | { type: "author"; slug: string; name: string };

/** What a personal RSS feed follows: tags and authors, like the Telegram bot. Topics have their own feed. */
export type RssFollow = Extract<FollowTarget, { type: "tag" | "author" }>;

/** The signed-in person's RSS feed (migration 0014). `path` is null until they first follow something. */
export interface MyRssFeed {
  path: string | null;
  follows: RssFollow[];
}
