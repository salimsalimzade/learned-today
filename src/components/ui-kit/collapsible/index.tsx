import { Collapsible as KCollapsible } from "@kobalte/core/collapsible";
import type { JSX, ParentProps } from "solid-js";
import { Icon } from "../icon";
import styles from "./collapsible.module.css";

/** Kobalte Collapsible: a ruled row that opens to show its content. Stack several for an FAQ. */
export function Collapsible(
  props: ParentProps & { title: JSX.Element; defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void },
) {
  return (
    <KCollapsible class={styles.collapsible} defaultOpen={props.defaultOpen} open={props.open} onOpenChange={props.onOpenChange}>
      <KCollapsible.Trigger class={styles.trigger}>
        {props.title}
        <Icon name="chevron-down" />
      </KCollapsible.Trigger>
      <KCollapsible.Content class={styles.content}>
        <div class={styles.body}>{props.children}</div>
      </KCollapsible.Content>
    </KCollapsible>
  );
}
