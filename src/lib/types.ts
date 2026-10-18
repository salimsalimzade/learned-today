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

export interface PostCard {
  id: string;
  title: string;
  excerpt: string;
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

export interface PostDetail extends PostCard {
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
