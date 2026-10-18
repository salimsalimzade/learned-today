import { query } from "@solidjs/router";
import { fold } from "../format";
import { authorCounts, listFacets, searchRows, tagCounts, toCards, topicCounts, topicRows } from "../server/post-rows";
import { getCtx } from "../server/viewer";
import type { SearchResults } from "../types";

/**
 * Command palette search. Posts come from search_posts() (0004_search.sql). Tags, topics and
 * authors are matched in memory against every published post, which is fine at this size.
 */
export const searchAll = query(async (q: string): Promise<SearchResults> => {
  "use server";
  const ctx = await getCtx();
  const term = q.trim().replace(/^#/, "");
  const needle = fold(term);
  if (!needle) return { posts: [], tags: [], topics: [], authors: [] };
  const hit = (s: string) => fold(s).includes(needle);

  const [found, all, topicList] = await Promise.all([searchRows(term, 6), listFacets(), topicRows()]);
  // Topics match in either language, whatever the reader's language is.
  const matching = new Set(topicList.filter((t) => fold(`${t.name} ${t.slug}`).includes(needle)).map((t) => t.slug));
  return {
    posts: await toCards(found, ctx.user?.id ?? null),
    tags: tagCounts(all)
      .filter((t) => hit(t.slug))
      .slice(0, 4),
    topics: topicCounts(all)
      .filter((t) => matching.has(t.slug))
      .slice(0, 3),
    authors: authorCounts(all)
      .filter((a) => hit(a.name) || hit(a.handle))
      .slice(0, 3),
  };
}, "search");
