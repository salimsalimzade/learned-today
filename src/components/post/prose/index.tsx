import { For, Match, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cx } from "~/lib/cx";
import type { ProseBlock } from "~/lib/types";
import { CodeBlock } from "../code-block";
import styles from "./prose.module.css";

/**
 * A post body. Each top-level block is a direct child of the prose box so paragraph spacing
 * applies; code blocks get the interactive <CodeBlock>. The html strings come from
 * lib/markdown, which escapes raw HTML and drops unsafe links.
 */
export function Prose(props: { blocks: ProseBlock[]; class?: string }) {
  return (
    <div class={cx(styles.prose, props.class)}>
      <For each={props.blocks}>
        {(b) => (
          <Switch>
            <Match when={b.kind === "code" && b}>{(c) => <CodeBlock label={c().label} html={c().html} code={c().code} />}</Match>
            <Match when={b.kind === "html" && b.tag === "hr"}>
              <hr />
            </Match>
            <Match when={b.kind === "html" && b}>{(h) => <Dynamic component={h().tag} innerHTML={h().html} />}</Match>
          </Switch>
        )}
      </For>
    </div>
  );
}

/** For other rich text that should read like a post (the editor uses it). */
export const proseClass = styles.prose;
