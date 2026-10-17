// One schema for the share form and the publishPost action, so both reject the same things.
// Error messages are i18n keys; the form turns them into text with t().
import { z } from "zod";
import type { MessageKey } from "../i18n";

export const TITLE_MAX = 90;
export const BODY_MAX = 8000;
export const TAGS_MAX = 5;
export const TAG_MAX = 24;

/** "#Massiv" → "massiv". Returns "" for anything that can't be a tag. */
export function normalizeTag(raw: string) {
  return raw.trim().replace(/^#+/, "").toLocaleLowerCase("az").replace(/\s+/g, "-").replace(/-{2,}/g, "-").slice(0, TAG_MAX);
}

export const TAG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

const tag = z.string().regex(TAG_PATTERN, "errors.tagInvalid" satisfies MessageKey);

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "errors.titleRequired" satisfies MessageKey)
    .max(TITLE_MAX, "errors.titleTooLong" satisfies MessageKey),
  body: z
    .string()
    .trim()
    .min(1, "errors.bodyRequired" satisfies MessageKey)
    .max(BODY_MAX, "errors.bodyTooLong" satisfies MessageKey),
  topic: z.string().min(1, "errors.topicRequired" satisfies MessageKey),
  tags: z.array(tag).max(TAGS_MAX, "errors.tagsMax" satisfies MessageKey),
  lang: z.enum(["az", "en"]),
  own: z.literal(true, { error: "errors.ownRequired" satisfies MessageKey }),
});

export type PostInput = z.infer<typeof postSchema>;
export type PostField = keyof PostInput;
export type PostErrors = Partial<Record<PostField | "form", MessageKey>>;

/** Read the share form's fields. Tags come as repeated `tags` inputs. */
export function readPostForm(form: FormData) {
  return {
    title: String(form.get("title") ?? ""),
    body: String(form.get("body") ?? ""),
    topic: String(form.get("topic") ?? ""),
    tags: form
      .getAll("tags")
      .map((t) => normalizeTag(String(t)))
      .filter(Boolean),
    lang: form.get("lang") === "en" ? "en" : "az",
    own: form.get("own") === "on" || form.get("own") === "true",
  };
}

export function validatePost(raw: unknown): { ok: true; data: PostInput } | { ok: false; errors: PostErrors } {
  const result = postSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const errors: PostErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as PostField | undefined;
    if (field && !errors[field]) errors[field] = issue.message as MessageKey;
  }
  return { ok: false, errors };
}
