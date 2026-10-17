import { type JSX, Show } from "solid-js";
import type { FollowTarget } from "~/lib/types";
import { FollowPopover } from "../follow-popover";
import styles from "./listing-header.module.css";

/**
 * Header shared by /topic, /tag and /author: eyebrow, page title, description, stats
 * and the Follow popover on the right (it wraps under the title on phones).
 */
export function ListingHeader(props: {
  eyebrow: string;
  title: JSX.Element;
  description?: string;
  stats: string;
  follow: FollowTarget;
  leading?: JSX.Element;
}) {
  return (
    <>
      <p class={styles.eyebrow}>{props.eyebrow}</p>
      <div class={styles.head}>
        <div class={styles.lead}>
          {/* Read once: touching a JSX prop twice would build (and hydrate) it twice. */}
          {props.leading}
          <div class={styles.copy}>
            <h1 class={styles.title}>{props.title}</h1>
            <Show when={props.description}>
              <p class={styles.description}>{props.description}</p>
            </Show>
            <p class={styles.stats}>{props.stats}</p>
          </div>
        </div>
        <FollowPopover target={props.follow} shortcut />
      </div>
    </>
  );
}
