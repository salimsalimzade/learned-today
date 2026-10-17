import { Tabs as KTabs, type TabsRootProps } from "@kobalte/core/tabs";
import { type JSX, type ParentProps, Show, splitProps } from "solid-js";
import { cx } from "~/lib/cx";
import styles from "./tabs.module.css";

/** Kobalte Tabs. The selected tab gets an accent underline from data-selected. */
export function Tabs(props: TabsRootProps & ParentProps & { class?: string }) {
  return <KTabs {...props} />;
}

export function TabsList(props: ParentProps & { "aria-label": string; class?: string; style?: JSX.CSSProperties }) {
  const [local, rest] = splitProps(props, ["class"]);
  return <KTabs.List class={cx(styles.list, local.class)} {...rest} />;
}

export function Tab(props: ParentProps & { value: string; count?: number; disabled?: boolean }) {
  return (
    <KTabs.Trigger class={styles.tab} value={props.value} disabled={props.disabled}>
      {props.children}
      <Show when={props.count !== undefined}>
        <span class={styles.count}>{props.count}</span>
      </Show>
    </KTabs.Trigger>
  );
}

export function TabPanel(props: ParentProps & { value: string; class?: string }) {
  return (
    <KTabs.Content class={cx(styles.panel, props.class)} value={props.value}>
      {props.children}
    </KTabs.Content>
  );
}
