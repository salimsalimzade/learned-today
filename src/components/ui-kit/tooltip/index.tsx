import { Tooltip as KTooltip, type TooltipRootProps } from "@kobalte/core/tooltip";
import { type JSX, type ParentProps, Show, splitProps } from "solid-js";
import { Kbd } from "../kbd";
import styles from "./tooltip.module.css";

/**
 * Kobalte Tooltip, inverted colours. Put a <TooltipTrigger as={...}> inside:
 *   <Tooltip content="Copy code"><TooltipTrigger as={Button} ...>…</TooltipTrigger></Tooltip>
 */
export function Tooltip(props: ParentProps & TooltipRootProps & { content: JSX.Element; kbd?: string }) {
  const [local, rest] = splitProps(props, ["content", "kbd", "children"]);
  return (
    <KTooltip openDelay={400} closeDelay={0} gutter={8} placement="top" {...rest}>
      {local.children}
      <KTooltip.Portal>
        <KTooltip.Content class={styles.tooltip}>
          {local.content}
          <Show when={local.kbd}>
            <Kbd>{local.kbd}</Kbd>
          </Show>
        </KTooltip.Content>
      </KTooltip.Portal>
    </KTooltip>
  );
}

export const TooltipTrigger = KTooltip.Trigger;
