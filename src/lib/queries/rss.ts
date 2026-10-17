// RSS 2.0 feeds for the GET routes in src/routes/**/rss.xml.ts. Server only.
import { isMock } from "../env";
import { toHtml } from "../markdown";
import { store } from "../mock/store";
import { notWired } from "../server/not-wired";

type Filter = { topic?: string; tag?: string; author?: string };

const SITE_NAME = "what-did-i-learn-today";

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

/** Returns null when the topic, tag or author doesn't exist, so the route can 404. */
export function rssFeed(filter: Filter, origin: string): Response | null {
  if (!isMock) return notWired("rssFeed");

  let title = SITE_NAME;
  let path = "/";
  let description = "Hər gün bir kiçik şey öyrən və paylaş.";
  if (filter.topic) {
    const topic = store.topic(filter.topic, "az");
    if (!topic) return null;
    title = `${topic.name} · ${SITE_NAME}`;
    path = `/topic/${topic.slug}`;
    description = topic.description;
  } else if (filter.tag) {
    if (!store.tag(filter.tag, "az")) return null;
    title = `#${filter.tag} · ${SITE_NAME}`;
    path = `/tag/${encodeURIComponent(filter.tag)}`;
  } else if (filter.author) {
    const author = store.author(filter.author, "az");
    if (!author) return null;
    title = `${author.name} · ${SITE_NAME}`;
    path = `/author/${author.handle}`;
  }

  const posts = store.raw(filter, "az");
  const items = posts
    .map((p) => {
      const link = `${origin}/post/${p.id}`;
      const categories = [p.topic.name, ...p.tags].map((c) => `<category>${xml(c)}</category>`).join("");
      return `<item><title>${xml(p.title)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><dc:creator>${xml(p.author.name)}</dc:creator>${categories}<description>${cdata(toHtml(p.body))}</description></item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${xml(title)}</title>
<link>${origin}${path}</link>
<atom:link href="${origin}${path === "/" ? "" : path}/rss.xml" rel="self" type="application/rss+xml"/>
<description>${xml(description)}</description>
<language>az</language>
${posts[0] ? `<lastBuildDate>${new Date(posts[0].publishedAt).toUTCString()}</lastBuildDate>` : ""}
${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
