import { Image } from "@kobalte/core/image";
import { Show } from "solid-js";
import { initials } from "~/lib/format";
import styles from "./avatar.module.css";

export type AvatarSize = "sm" | "md" | "lg";

/** Kobalte Image with initials as the fallback. Decorative: the name is always written next to it. */
export function Avatar(props: { name: string; src?: string | null; size?: AvatarSize }) {
  return (
    <Image class={styles.avatar} data-size={props.size ?? "md"} aria-hidden="true" fallbackDelay={0}>
      <Show when={props.src}>{(src) => <Image.Img class={styles.image} src={src()} alt="" />}</Show>
      <Image.Fallback>{initials(props.name)}</Image.Fallback>
    </Image>
  );
}
