// The parts of the editor that don't need TipTap, so /share can draw the editor's frame while its code
// (TipTap, ProseMirror, highlight.js: most of the page's weight) is still downloading.
import type { JSX } from "solid-js";
import { cx, flag } from "~/lib/cx";
import { proseClass } from "../../post/prose";
import styles from "./editor.module.css";

export const PLACEHOLDER = "What did you learn? Type / to add a block.";

/** The empty writing area. Same box as TipTap's, so nothing jumps when it takes over. */
export function ContentPlaceholder() {
  return (
    <div class={cx(styles.content, proseClass)} aria-hidden="true">
      <p class="is-empty" data-placeholder={PLACEHOLDER} />
    </div>
  );
}

/** The hint row under the writing area, with the draft status on the right. */
export function EditorFoot(props: { status?: JSX.Element }) {
  return (
    <div class={styles.foot}>
      <span>
        <code>```js</code> + Enter: code block in JavaScript · <code>/code</code> any language
      </span>
      {props.status}
    </div>
  );
}

/** <Editor>'s frame (border, toolbar row, writing area, hint) with nothing to press yet. */
export function EditorPlaceholder(props: { status?: JSX.Element; invalid?: boolean }) {
  return (
    <div class={styles.editor} data-invalid={flag(props.invalid)} aria-busy="true">
      <div class={styles.toolbar} data-placeholder="" />
      <ContentPlaceholder />
      <EditorFoot status={props.status} />
    </div>
  );
}
