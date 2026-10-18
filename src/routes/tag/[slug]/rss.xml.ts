import type { APIEvent } from "@solidjs/start/server";
import { rssFeed } from "~/lib/queries/rss";

/** GET /tag/:slug/rss.xml (slugs can be non-ASCII, e.g. /tag/%C5%9F%C9%99ki/rss.xml) */
export async function GET(event: APIEvent) {
  let slug = event.params.slug;
  try {
    slug = decodeURIComponent(slug);
  } catch {}
  return (await rssFeed({ tag: slug }, new URL(event.request.url).origin)) ?? new Response("Not found", { status: 404 });
}
