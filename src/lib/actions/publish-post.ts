import { action, redirect } from "@solidjs/router";
import { isMock } from "../env";
import { store } from "../mock/store";
import { type PostErrors, readPostForm, validatePost } from "../schemas/post";
import { notWired } from "../server/not-wired";
import { getViewer } from "../server/viewer";

export type PublishResult = { ok: false; errors: PostErrors };

/**
 * Validates with the same schema as the form, saves the post and redirects to it.
 * With Supabase: insert into posts (status 'published') and post_tags in one RPC;
 * the 0003 trigger queues Telegram notifications.
 */
export const publishPost = action(async (form: FormData): Promise<PublishResult> => {
  "use server";
  const user = await getViewer();
  if (!user) return { ok: false, errors: { form: "errors.signInRequired" } };

  const result = validatePost(readPostForm(form));
  if (!result.ok) return { ok: false, errors: result.errors };

  if (!isMock) return notWired("publishPost");
  const { own: _own, ...input } = result.data;
  const id = store.publish(input, user.handle);
  throw redirect(`/post/${id}?new=1`);
}, "publishPost");
