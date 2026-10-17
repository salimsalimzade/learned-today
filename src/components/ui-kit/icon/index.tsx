import type { JSX } from "solid-js";
import { cx } from "~/lib/cx";
import styles from "./icon.module.css";
import { ICONS, type IconName } from "./icons";

export type { IconName } from "./icons";
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** Decorative inline SVG in currentColor. Give icon-only buttons an aria-label instead. */
export function Icon(props: { name: IconName; size?: 16 | 20; class?: string; style?: JSX.CSSProperties }) {
  return (
    <svg
      class={cx(styles.icon, props.class)}
      data-icon={props.name}
      data-size={props.size === 20 ? "20" : undefined}
      style={props.style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {ICONS[props.name]()}
    </svg>
  );
}
