import type { ParentProps } from "solid-js";
import styles from "./page.module.css";

/** Each route's <main>: the centred column with the page's top and bottom padding. */
export function Page(props: ParentProps & { compact?: boolean }) {
  return (
    <main id="main" class={styles.main} data-size={props.compact ? "compact" : undefined}>
      {props.children}
    </main>
  );
}

/** The bare column, for the header and footer. */
export const columnClass = styles.column;
