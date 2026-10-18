import type { APIEvent } from "@solidjs/start/server";
import { rssFeed } from "~/lib/queries/rss";

/** GET /rss.xml: every published note, newest first. */
export async function GET(event: APIEvent) {
  return await rssFeed({}, new URL(event.request.url).origin)!;
}
