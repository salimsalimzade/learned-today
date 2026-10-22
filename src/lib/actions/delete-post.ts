import { action, json, redirect } from "@solidjs/router";
import { getViewer } from "../server/viewer";
import { createSupabaseServerClient } from "../supabase/server";

export type DeleteResult = { ok: false; reason: "signin" | "error" };

/**
 * Deletes one of this person's own posts and goes back to the feed. RLS ("people delete their own posts", 0002)
 * is the real check; the author filter just makes someone else's post match nothing. Reactions and tags go with
 * the post (on delete cascade). Telegram messages already queued for it are dead-lettered by the notifier as
 * "post gone". Selecting the id back is how a delete that matched no row (not theirs, or already gone) shows up.
 */
export const deletePost = action(async (postId: string) => {
  "use server";
  const fail = (reason: DeleteResult["reason"]) => json<DeleteResult>({ ok: false, reason }, { revalidate: "nothing" });
  const user = await getViewer();
  if (!user) return fail("signin");
  if (!/^\d+$/.test(postId)) return fail("error");

  const { data, error } = await createSupabaseServerClient()
    .from("posts")
    .delete()
    .eq("id", Number(postId))
    .eq("author_id", user.id)
    .select("id");
  if (error) console.error(`deletePost: ${error.message}`);
  if (error || !data?.length) return fail("error");
  throw redirect("/?deleted=1");
}, "deletePost");
