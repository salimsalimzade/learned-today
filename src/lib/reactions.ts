import { REACTION_KINDS, type ReactionCounts, type ReactionKind } from "./types";

export const REACTION_EMOJI: Record<ReactionKind, string> = {
  learned: "💡",
  like: "👍",
  love: "❤️",
  funny: "😂",
  surprised: "😮",
  thanks: "🙏",
};

export const REACTION_LABELS: Record<ReactionKind, string> = {
  learned: "Learned something",
  like: "Like",
  love: "Love",
  funny: "Funny",
  surprised: "Surprised",
  thanks: "Thanks",
};

/** The tray order is the 1–6 shortcut order. */
export const REACTIONS = REACTION_KINDS.map((kind, i) => ({ kind, emoji: REACTION_EMOJI[kind], key: String(i + 1) }));

export function totalReactions(counts: ReactionCounts) {
  return Object.values(counts).reduce((n, c) => n + (c ?? 0), 0);
}

/** Apply one person's switch from `from` to `to` (either may be null). One reaction per post. */
export function applyReaction(counts: ReactionCounts, from: ReactionKind | null, to: ReactionKind | null): ReactionCounts {
  const next = { ...counts };
  if (from) next[from] = Math.max(0, (next[from] ?? 0) - 1);
  if (to) next[to] = (next[to] ?? 0) + 1;
  return next;
}
