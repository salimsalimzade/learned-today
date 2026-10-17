import { ToggleGroup as KToggleGroup } from "@kobalte/core/toggle-group";
import { For, type JSX } from "solid-js";
import styles from "./toggle-group.module.css";

export interface ToggleItem<T extends string> {
  value: T;
  label: JSX.Element;
  /** Needed when the label is only an icon. */
  ariaLabel?: string;
  lang?: string;
  disabled?: boolean;
}

/** Single-choice Kobalte ToggleGroup. One item always stays pressed. */
export function ToggleGroup<T extends string>(props: { value: T; onChange: (value: T) => void; label: string; items: ToggleItem<T>[] }) {
  return (
    <KToggleGroup class={styles.group} value={props.value} onChange={(v) => v && props.onChange(v as T)} aria-label={props.label}>
      <For each={props.items}>
        {(item) => (
          <KToggleGroup.Item class={styles.item} value={item.value} aria-label={item.ariaLabel} lang={item.lang} disabled={item.disabled}>
            {item.label}
          </KToggleGroup.Item>
        )}
      </For>
    </KToggleGroup>
  );
}
