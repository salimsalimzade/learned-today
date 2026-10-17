import { For, type JSX, Show } from "solid-js";
import { useI18n } from "~/lib/i18n";
import { useShortcut } from "~/lib/shortcuts";
import type { PostCard } from "~/lib/types";
import { FeedCard } from "../feed-card";
import styles from "./post-list.module.css";

/** j / k move focus between note titles on the page; Enter opens the focused one. */
export function useListKeys() {
  useShortcut(["j", "k"], (e) => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-feed-link]")];
    if (!links.length) return;
    e.preventDefault();
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = i < 0 ? 0 : Math.min(links.length - 1, Math.max(0, i + (e.key === "j" ? 1 : -1)));
    links[next].focus();
    links[next].closest("[data-feed-card]")?.scrollIntoView({ block: "nearest" });
  });
}

/** A column of feed cards. */
export function PostList(props: { posts: PostCard[] | undefined; headingLevel?: 2 | 3 }) {
  const { t } = useI18n();
  return (
    <Show
      when={props.posts?.length}
      fallback={
        <Show when={props.posts}>
          <EmptyState>{t("listing.empty")}</EmptyState>
        </Show>
      }
    >
      <ol class={styles.list}>
        <For each={props.posts}>
          {(post) => (
            <li>
              <FeedCard post={post} headingLevel={props.headingLevel} />
            </li>
          )}
        </For>
      </ol>
    </Show>
  );
}

export function EmptyState(props: { children: JSX.Element }) {
  return <p class={styles.empty}>{props.children}</p>;
}
