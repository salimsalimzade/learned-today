import { action, json } from "@solidjs/router";
import { isMock } from "../env";
import { store } from "../mock/store";
import { notWired } from "../server/not-wired";
import { getViewer } from "../server/viewer";
import { REACTION_KINDS, type ReactionCounts, type ReactionKind } from "../types";

export type ReactionResult = { ok: true; counts: ReactionCounts; mine: ReactionKind | null } | { ok: false; reason: "signin" | "error" };

/**
 * Sets this user's one reaction on a post (null removes it). The component updates
 * optimistically, so nothing else is revalidated. With Supabase: rpc("set_reaction").
 */
export const setReaction = action(async (postId: string, kind: ReactionKind | null) => {
  "use server";
  const user = await getViewer();
  if (!user) return json<ReactionResult>({ ok: false, reason: "signin" }, { revalidate: "nothing" });
  if (kind !== null && !REACTION_KINDS.includes(kind))
    return json<ReactionResult>({ ok: false, reason: "error" }, { revalidate: "nothing" });
  if (!isMock) return notWired("setReaction");
  const result = store.react(postId, user.handle, kind);
  return json<ReactionResult>(result ? { ok: true, ...result } : { ok: false, reason: "error" }, { revalidate: "nothing" });
}, "setReaction");
