import { action, json } from "@solidjs/router";
import { getViewer } from "../server/viewer";
import { createSupabaseServerClient } from "../supabase/server";
import { REACTION_KINDS, type ReactionCounts, type ReactionKind } from "../types";

export type ReactionResult = { ok: true; counts: ReactionCounts; mine: ReactionKind | null } | { ok: false; reason: "signin" | "error" };

/**
 * Sets this user's one reaction on a post (null removes it). The component updates
 * optimistically, so nothing else is revalidated. Calls rpc("set_reaction") (0003).
 */
export const setReaction = action(async (postId: string, kind: ReactionKind | null) => {
  "use server";
  const user = await getViewer();
  if (!user) return json<ReactionResult>({ ok: false, reason: "signin" }, { revalidate: "nothing" });
  if ((kind !== null && !REACTION_KINDS.includes(kind)) || !/^\d+$/.test(postId))
    return json<ReactionResult>({ ok: false, reason: "error" }, { revalidate: "nothing" });

  // null removes the reaction. The generated type doesn't show the argument as nullable.
  const { data, error } = await createSupabaseServerClient().rpc("set_reaction", {
    p_post_id: Number(postId),
    p_kind: kind as ReactionKind,
  });
  if (error || !data) return json<ReactionResult>({ ok: false, reason: "error" }, { revalidate: "nothing" });
  const { mine, counts } = data as unknown as { mine: ReactionKind | null; counts: ReactionCounts };
  return json<ReactionResult>({ ok: true, counts, mine }, { revalidate: "nothing" });
}, "setReaction");
