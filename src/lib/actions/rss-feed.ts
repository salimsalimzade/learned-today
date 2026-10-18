import { action, json } from "@solidjs/router";
import { getViewer } from "../server/viewer";
import { createSupabaseServerClient } from "../supabase/server";
import type { RssFollow } from "../types";

export type RssFollowResult = { ok: true } | { ok: false; reason: "signin" | "limit" | "error" };

/**
 * Adds a tag or author to this person's RSS feed (on) or takes it off, creating the feed on the first add.
 * The table checks the value's shape and the 50-follow limit (0014). Only getMyRssFeed is revalidated.
 */
export const setRssFollow = action(async (target: Pick<RssFollow, "type" | "slug">, on: boolean) => {
  "use server";
  const fail = (reason: "signin" | "limit" | "error") => json<RssFollowResult>({ ok: false, reason }, { revalidate: "nothing" });
  const user = await getViewer();
  if (!user) return fail("signin");
  if ((target.type !== "tag" && target.type !== "author") || typeof target.slug !== "string") return fail("error");

  const supabase = createSupabaseServerClient();
  if (!on) {
    const { error } = await supabase.from("rss_follows").delete().eq("user_id", user.id).eq("target", target.type).eq("value", target.slug);
    return error ? fail("error") : json<RssFollowResult>({ ok: true }, { revalidate: "rss-feed" });
  }

  const feed = await supabase.from("rss_feeds").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
  if (feed.error) return fail("error");
  const { error } = await supabase
    .from("rss_follows")
    .upsert({ user_id: user.id, target: target.type, value: target.slug }, { onConflict: "user_id,target,value", ignoreDuplicates: true });
  if (error) return fail(/at most 50/.test(error.message) ? "limit" : "error");
  return json<RssFollowResult>({ ok: true }, { revalidate: "rss-feed" });
}, "setRssFollow");

/** Gives this person's feed a new address. The old one stops working at once. */
export const newRssLink = action(async () => {
  "use server";
  const user = await getViewer();
  if (!user) return json({ ok: false as const }, { revalidate: "nothing" });
  const { error } = await createSupabaseServerClient()
    .from("rss_feeds")
    .update({ token: crypto.randomUUID().replace(/-/g, "") })
    .eq("user_id", user.id);
  return json({ ok: !error }, { revalidate: "rss-feed" });
}, "newRssLink");
