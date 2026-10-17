import { query } from "@solidjs/router";
import { isMock } from "../env";
import { store } from "../mock/store";
import { notWired } from "../server/not-wired";
import { getCtx } from "../server/viewer";
import type { SearchResults } from "../types";

/** Command palette search. With Supabase this calls search_posts() from 0004_search.sql. */
export const searchAll = query(async (q: string): Promise<SearchResults> => {
  "use server";
  const ctx = await getCtx();
  if (isMock) return store.search(q, ctx);
  return notWired("searchAll");
}, "search");
