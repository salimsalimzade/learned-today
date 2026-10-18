import { action, redirect } from "@solidjs/router";
import { type PostErrors, readPostForm, SIGN_IN_REQUIRED, validatePost } from "../schemas/post";
import { getViewer } from "../server/viewer";
import { createSupabaseServerClient } from "../supabase/server";

export type PublishResult = { ok: false; errors: PostErrors };

/**
 * Validates with the same schema as the form, saves the post and redirects to it.
 * rpc("create_post") inserts the post and its tags in one transaction (migration 0005);
 * a trigger from 0006 queues Telegram notifications. A database error is thrown, so the
 * form shows its "Couldn't share" toast and keeps what was written.
 */
export const publishPost = action(async (form: FormData): Promise<PublishResult> => {
  "use server";
  const user = await getViewer();
  if (!user) return { ok: false, errors: { form: SIGN_IN_REQUIRED } };

  const result = validatePost(readPostForm(form));
  if (!result.ok) return { ok: false, errors: result.errors };

  const { own: _own, ...input } = result.data;
  const supabase = createSupabaseServerClient();
  const { data: id, error } = await supabase.rpc("create_post", {
    p_topic_slug: input.topic,
    p_title: input.title,
    p_body_md: input.body,
    p_tags: input.tags,
  });
  if (error) throw new Error(`create_post: ${error.message}`);
  throw redirect(`/post/${id}?new=1`);
}, "publishPost");
