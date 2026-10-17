import { Button as KButton } from "@kobalte/core/button";
import { A } from "@solidjs/router";
import { type ComponentProps, splitProps } from "solid-js";
import { cx, flag } from "~/lib/cx";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface Look {
  /** secondary is the outlined default */
  variant?: ButtonVariant;
  /** square 40×40, for icon-only buttons (give them an aria-label) */
  icon?: boolean;
  /** full width */
  block?: boolean;
}

const lookKeys = ["variant", "icon", "block", "class"] as const;

function lookAttrs(l: Look) {
  return {
    "data-variant": l.variant && l.variant !== "secondary" ? l.variant : undefined,
    "data-icon-only": flag(l.icon),
    "data-block": flag(l.block),
  };
}

/** Class for elements that only need to look like a button (e.g. a Kobalte trigger rendered as something else). */
export const buttonClass = styles.button;

export type ButtonProps = ComponentProps<"button"> & Look;

/** Kobalte Button: outlined by default, primary (accent fill) or ghost. */
export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, lookKeys);
  return <KButton type="button" class={cx(styles.button, local.class)} {...lookAttrs(local)} {...(rest as object)} />;
}

/** A router link that looks like a button. Stays a real <a> for navigation. */
export function ButtonLink(props: ComponentProps<typeof A> & Look) {
  const [local, rest] = splitProps(props, lookKeys);
  return <A class={cx(styles.button, local.class)} {...lookAttrs(local)} {...rest} />;
}
