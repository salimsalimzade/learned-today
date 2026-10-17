import type { ParentProps } from "solid-js";
import styles from "./kbd.module.css";

/** One key face. */
export function Kbd(props: ParentProps) {
  return (
    <kbd class={styles.kbd} data-kbd="">
      {props.children}
    </kbd>
  );
}

/** Keys with their muted label, e.g. "↑ ↓ seç". */
export function KbdCombo(props: ParentProps) {
  return <span class={styles.combo}>{props.children}</span>;
}

/** Hidden on touch screens, where single-key shortcuts don't apply. */
export function KbdHint(props: ParentProps) {
  return <span class={styles.hint}>{props.children}</span>;
}
