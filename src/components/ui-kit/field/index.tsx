import { type JSX, type ParentProps, Show } from "solid-js";
import { flag } from "~/lib/cx";
import styles from "./field.module.css";

/** Field layout classes, for controls that build their own label (e.g. the tag input). */
export const fieldStyles = styles;

/** "45/90" under a field; turns red past the limit. */
export function FieldCounter(props: { value: number; max: number }) {
  return (
    <span class={styles.counter} data-over={flag(props.value > props.max)} aria-hidden="true">
      {props.value}/{props.max}
    </span>
  );
}

/** "(istəyə bağlı)" after a label. */
export function FieldOptional(props: ParentProps) {
  return <span class={styles.optional}>{props.children}</span>;
}

/** Helper text or error on the left, optional counter on the right. */
export function FieldFoot(props: { description?: JSX.Element; error?: JSX.Element; counter?: JSX.Element; id?: string }) {
  return (
    <div class={styles.foot}>
      <Show
        when={props.error}
        fallback={
          <Show when={props.description}>
            {(d) => (
              <p class={styles.description} id={props.id}>
                {d()}
              </p>
            )}
          </Show>
        }
      >
        {(e) => (
          <p class={styles.error} id={props.id}>
            {e()}
          </p>
        )}
      </Show>
      {props.counter}
    </div>
  );
}
