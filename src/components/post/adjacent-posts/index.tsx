import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { Icon, Kbd, KbdCombo, KbdHint } from "~/components/ui-kit";
import { cx } from "~/lib/cx";
import type { PostLink } from "~/lib/types";
import styles from "./adjacent-posts.module.css";

/** Previous (k) and next (j) notes, in feed order. */
export function AdjacentPosts(props: { prev: PostLink | null; next: PostLink | null }) {
  return (
    <nav aria-label="Adjacent notes" class={styles.nav}>
      <Show when={props.prev} fallback={<span />}>
        {(prev) => (
          <A class={styles.link} href={`/post/${prev().id}`} aria-keyshortcuts="k">
            <KbdCombo>
              <Icon name="arrow-left" />
              Previous
              <KbdHint>
                <Kbd>k</Kbd>
              </KbdHint>
            </KbdCombo>
            <span class={styles.title}>{prev().title}</span>
          </A>
        )}
      </Show>
      <Show when={props.next}>
        {(next) => (
          <A class={cx(styles.link, styles.next)} href={`/post/${next().id}`} aria-keyshortcuts="j">
            <KbdCombo>
              <KbdHint>
                <Kbd>j</Kbd>
              </KbdHint>
              Next
              <Icon name="arrow-right" />
            </KbdCombo>
            <span class={styles.title}>{next().title}</span>
          </A>
        )}
      </Show>
    </nav>
  );
}
