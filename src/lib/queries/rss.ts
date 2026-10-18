// RSS 2.0 feeds for the GET routes in src/routes/**/rss.xml.ts. Server only.
import { toHtml } from "../markdown";
import { listPosts, profileRow, topicRow } from "../server/post-rows";

type Filter = { topic?: string; tag?: string; author?: string };

const SITE_NAME = "what-did-i-learn-today";

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

/** Returns null when the topic, tag or author doesn't exist, so the route can 404. */
export async function rssFeed(filter: Filter, origin: string): Promise<Response | null> {
  let title = SITE_NAME;
  let path = "/";
  const description = "Learn one small thing every day and share it.";
  if (filter.topic) {
    const topic = await topicRow(filter.topic);
    if (!topic) return null;
    title = `${topic.name} · ${SITE_NAME}`;
    path = `/topic/${topic.slug}`;
  } else if (filter.tag) {
    if (!(await listPosts({ tag: filter.tag }, 1)).length) return null;
    title = `#${filter.tag} · ${SITE_NAME}`;
    path = `/tag/${encodeURIComponent(filter.tag)}`;
  } else if (filter.author) {
    const profile = await profileRow(filter.author);
    if (!profile) return null;
    title = `${profile.display_name} · ${SITE_NAME}`;
    path = `/author/${profile.handle}`;
  }

  const posts = await listPosts(filter, 30);
  const items = posts
    .map((p) => {
      const link = `${origin}/post/${p.id}`;
      const categories = [p.topic_name ?? "", ...(p.tags ?? [])].map((c) => `<category>${xml(c)}</category>`).join("");
      return `<item><title>${xml(p.title ?? "")}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${new Date(p.published_at ?? "").toUTCString()}</pubDate><dc:creator>${xml(p.author_name ?? "")}</dc:creator>${categories}<description>${cdata(toHtml(p.body_md ?? ""))}</description></item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${xml(title)}</title>
<link>${origin}${path}</link>
<atom:link href="${origin}${path === "/" ? "" : path}/rss.xml" rel="self" type="application/rss+xml"/>
<description>${xml(description)}</description>
<language>en</language>
${posts[0] ? `<lastBuildDate>${new Date(posts[0].published_at ?? "").toUTCString()}</lastBuildDate>` : ""}
${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
