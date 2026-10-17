import type { APIEvent } from "@solidjs/start/server";
import { rssFeed } from "~/lib/queries/rss";

/** GET /author/:handle/rss.xml */
export function GET(event: APIEvent) {
  return rssFeed({ author: event.params.handle }, new URL(event.request.url).origin) ?? new Response("Not found", { status: 404 });
}
