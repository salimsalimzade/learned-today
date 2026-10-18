// The signed-in person's personal RSS feed (migration 0014), for the Follow popover and the account menu.
import { query } from "@solidjs/router";
import { unwrap } from "../server/post-rows";
import { getViewer } from "../server/viewer";
import { createSupabaseServerClient } from "../supabase/server";
import type { MyRssFeed, RssFollow } from "../types";

export const rssFeedPath = (token: string) => `/feed/${token}/rss.xml`;

/** Their feed's address and what it follows, oldest follow first. null for guests. */
export const getMyRssFeed = query(async (): Promise<MyRssFeed | null> => {
  "use server";
  const user = await getViewer();
  if (!user) return null;
  const supabase = createSupabaseServerClient();
  const [feed, follows] = await Promise.all([
    supabase.from("rss_feeds").select("token").eq("user_id", user.id).maybeSingle(),
    supabase.from("rss_follows").select("target, value").eq("user_id", user.id).order("created_at"),
  ]);
  const rows = unwrap(follows, "rssFollows");
  const token = unwrap(feed, "rssFeed")?.token;

  // Authors show by name. A handle that no longer exists shows as itself.
  const handles = rows.filter((r) => r.target === "author").map((r) => r.value);
  const names = new Map<string, string>();
  if (handles.length) {
    const profiles = unwrap(await supabase.from("profiles").select("handle, display_name").in("handle", handles), "rssAuthors");
    for (const p of profiles) names.set(p.handle, p.display_name);
  }

  return {
    path: token ? rssFeedPath(token) : null,
    follows: rows.map(
      (r): RssFollow =>
        r.target === "author"
          ? { type: "author", slug: r.value, name: names.get(r.value) ?? r.value }
          : { type: "tag", slug: r.value, name: r.value },
    ),
  };
}, "rss-feed");
