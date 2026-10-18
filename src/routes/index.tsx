import { createAsync, type RouteDefinition } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import { AskBanner } from "~/components/feed/ask-banner";
import { DayHead } from "~/components/feed/day-head";
import { EmptyState, PostList, useListKeys } from "~/components/feed/post-list";
import { Page } from "~/components/layout/page";
import { Button } from "~/components/ui-kit";
import { getFeed } from "~/lib/queries/posts";
import styles from "~/styles/pages/feed.module.css";

export const route = {
  preload: () => getFeed(null),
} satisfies RouteDefinition;

/** One page of whole days. "Older notes" appends the next page below. */
function FeedPage(props: { cursor: string | null; last: boolean; first: boolean; onMore: (cursor: string) => void }) {
  const page = createAsync(() => getFeed(props.cursor));
  return (
    <Show when={page()}>
      {(p) => (
        <>
          <Show when={props.first && !p().days.length}>
            <EmptyState>Nobody has shared anything yet. Be the first.</EmptyState>
          </Show>
          <For each={p().days}>
            {(day) => (
              <section class={styles.day}>
                <DayHead dayKey={day.key} />
                <PostList posts={day.posts} />
              </section>
            )}
          </For>
          <Show when={props.last && p().nextCursor}>
            {(next) => (
              <div class={styles.more}>
                <Button class={styles["more-button"]} onClick={() => props.onMore(next())}>
                  Older notes
                </Button>
              </div>
            )}
          </Show>
        </>
      )}
    </Show>
  );
}

export default function Feed() {
  const [cursors, setCursors] = createSignal<(string | null)[]>([null]);
  useListKeys();
  return (
    <Page>
      <h1 class="sr-only">Feed</h1>
      <AskBanner />
      <For each={cursors()}>
        {(cursor, i) => (
          <Suspense fallback={<EmptyState>Loading…</EmptyState>}>
            <FeedPage cursor={cursor} first={i() === 0} last={i() === cursors().length - 1} onMore={(c) => setCursors([...cursors(), c])} />
          </Suspense>
        )}
      </For>
    </Page>
  );
}
