import { ToggleButton } from "@kobalte/core/toggle-button";
import { type ComponentProps, type JSX, type ParentProps, Show, splitProps } from "solid-js";
import { cx } from "~/lib/cx";
import styles from "./tag.module.css";

interface TagLook {
  /** A topic chip: sans text, no #. Tags get a muted # before the name. */
  kind?: "tag" | "topic";
  /** No border or padding, for meta lines. */
  plain?: boolean;
  count?: number;
}

function Label(props: ParentProps & TagLook) {
  return (
    <>
      <Show when={props.kind !== "topic"}>
        <span class={styles.hash}>#</span>
      </Show>
      {props.children}
      <Show when={props.count !== undefined}>
        <span class={styles.count}>{props.count}</span>
      </Show>
    </>
  );
}

const look = (l: TagLook) => ({
  "data-kind": l.kind === "topic" ? "topic" : undefined,
  "data-variant": l.plain ? "plain" : undefined,
});

/** A tag or topic chip that links somewhere. A plain <a>, so the app router still handles it. */
export function TagLink(props: ComponentProps<"a"> & TagLook) {
  const [local, rest] = splitProps(props, ["kind", "plain", "count", "children", "class"]);
  return (
    <a class={cx(styles.tag, local.class)} {...look(local)} {...rest}>
      <Label kind={local.kind} count={local.count}>
        {local.children}
      </Label>
    </a>
  );
}

/** A chip that filters: Kobalte ToggleButton, accent-soft when pressed. */
export function TagToggle(props: ParentProps & TagLook & { pressed: boolean; onChange: (pressed: boolean) => void; noHash?: boolean }) {
  return (
    <ToggleButton class={styles.tag} pressed={props.pressed} onChange={props.onChange} {...look(props)}>
      <Show when={!props.noHash} fallback={props.children}>
        <Label kind={props.kind} count={props.count}>
          {props.children}
        </Label>
      </Show>
    </ToggleButton>
  );
}

/** A non-interactive chip (e.g. inside the tag input), with room for a remove button. */
export function TagChip(props: ParentProps & TagLook & { end?: JSX.Element; hidden?: boolean; ref?: (el: HTMLSpanElement) => void }) {
  return (
    <span ref={props.ref} class={styles.tag} data-static="" hidden={props.hidden} {...look(props)}>
      <Label kind={props.kind}>{props.children}</Label>
      {props.end}
    </span>
  );
}

/** Wraps chips with 12px rows so their 40px hit areas never overlap. */
export function TagList(props: ParentProps & { "aria-label"?: string; class?: string; style?: JSX.CSSProperties }) {
  return (
    <ul class={cx(styles.list, props.class)} aria-label={props["aria-label"]} style={props.style}>
      {props.children}
    </ul>
  );
}

export const tagStyles = styles;
