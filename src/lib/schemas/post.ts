// One schema for the share form and the publishPost action, so both reject the same things.
// Error messages are plain English, shown as they are.
import { z } from "zod";

// No compiled validators: zod probes for them with `new Function`, which the Content-Security-Policy
// (src/middleware.ts) blocks and the browser reports as a violation. Workers don't allow it either.
z.config({ jitless: true });

export const TITLE_MAX = 90;
export const BODY_MAX = 8000;
export const TAGS_MAX = 5;
export const TAG_MAX = 24;

/** "#Arrays" → "arrays". Returns "" for anything that can't be a tag. */
export function normalizeTag(raw: string) {
  return raw.trim().replace(/^#+/, "").toLowerCase().replace(/\s+/g, "-").replace(/-{2,}/g, "-").slice(0, TAG_MAX);
}

export const TAG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

const tag = z.string().regex(TAG_PATTERN, "Tags can only have letters, digits and hyphens.");

export const postSchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(TITLE_MAX, "Keep the title to 90 characters."),
  body: z.string().trim().min(1, "Write the note.").max(BODY_MAX, "The note is too long. Cut it down to one idea."),
  topic: z.string().min(1, "Pick a topic."),
  tags: z.array(tag).max(TAGS_MAX, "Up to 5 tags."),
  own: z.literal(true, { error: "Confirm this to share." }),
});

export type PostInput = z.infer<typeof postSchema>;
export type PostField = keyof PostInput;
export const SIGN_IN_REQUIRED = "Sign in first.";

export type PostErrors = Partial<Record<PostField | "form", string>>;

/** Read the share form's fields. Tags come as repeated `tags` inputs. */
export function readPostForm(form: FormData) {
  return {
    title: String(form.get("title") ?? ""),
    body: String(form.get("body") ?? ""),
    topic: String(form.get("topic") ?? "").trim(),
    tags: form
      .getAll("tags")
      .map((t) => normalizeTag(String(t)))
      .filter(Boolean),
    own: form.get("own") === "on" || form.get("own") === "true",
  };
}

export function validatePost(raw: unknown): { ok: true; data: PostInput } | { ok: false; errors: PostErrors } {
  const result = postSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const errors: PostErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as PostField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
