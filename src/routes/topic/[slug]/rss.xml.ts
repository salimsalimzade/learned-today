import type { APIEvent } from "@solidjs/start/server";
import { rssFeed } from "~/lib/queries/rss";

/** GET /topic/:slug/rss.xml */
export async function GET(event: APIEvent) {
  return (await rssFeed({ topic: event.params.slug }, new URL(event.request.url).origin)) ?? new Response("Not found", { status: 404 });
}
