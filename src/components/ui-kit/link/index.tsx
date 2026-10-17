import { Link as KLink } from "@kobalte/core/link";
import { A } from "@solidjs/router";
import { type ComponentProps, splitProps } from "solid-js";
import { cx } from "~/lib/cx";
import styles from "./link.module.css";

export type LinkVariant = "default" | "quiet" | "muted";

type LinkProps = ComponentProps<"a"> & {
  /** default: accent + underline (prose). quiet: text colour. muted: secondary text. */
  variant?: LinkVariant;
  /** Open outside the app router (RSS, other sites). */
  external?: boolean;
};

/** Kobalte Link. Internal hrefs go through the router's <A>, so navigation stays client-side. */
export function Link(props: LinkProps) {
  const [local, rest] = splitProps(props, ["variant", "external", "class"]);
  return (
    <KLink
      as={local.external ? "a" : A}
      class={cx(styles.link, local.class)}
      data-variant={local.variant && local.variant !== "default" ? local.variant : undefined}
      {...(rest as object)}
    />
  );
}

export const linkClass = styles.link;
