import type { APIEvent } from "@solidjs/start/server";
import { rssFeed } from "~/lib/queries/rss";

/** GET /feed/:token/rss.xml: someone's personal feed, every tag and author they follow by RSS (0014). */
export async function GET(event: APIEvent) {
  const token = event.params.token;
  const feed = /^[0-9a-f]{32}$/.test(token) ? await rssFeed({ token }, new URL(event.request.url).origin) : null;
  return feed ?? new Response("Not found", { status: 404 });
}
