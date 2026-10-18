import { createSignal, createUniqueId, onCleanup, Show } from "solid-js";
import { Button, Icon, Tooltip, TooltipTrigger } from "~/components/ui-kit";
import { CARD_CODE_LINES } from "~/lib/card-preview";
import { flag } from "~/lib/cx";
import styles from "./code-block.module.css";

/** Copy button with a two-second "Copied" state and a polite announcement. */
export function CopyButton(props: { code: () => string }) {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));

  const copy = async () => {
    await navigator.clipboard.writeText(props.code());
    setCopied(true);
    clearTimeout(timer);
    timer = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Tooltip content="Copy code">
        <TooltipTrigger as={Button} variant="ghost" class={styles.copy} data-copied={flag(copied())} aria-label="Copy code" onClick={copy}>
          <Icon name={copied() ? "check" : "copy"} />
          {copied() ? "Copied" : "Copy"}
        </TooltipTrigger>
      </Tooltip>
      <span class="sr-only" aria-live="polite">
        {copied() ? "Copied" : ""}
      </span>
    </>
  );
}

/**
 * A highlighted code block with its language label. `html` is pre-escaped by lib/markdown. In a feed card
 * (`collapsible`) it also shows its line count and, past CARD_CODE_LINES, opens with "Show all N lines";
 * `onExpand` tells the card, which then stops clamping its body.
 */
export function CodeBlock(props: { label: string; html: string; code: string; collapsible?: boolean; onExpand?: () => void }) {
  const [open, setOpen] = createSignal(false);
  const preId = createUniqueId();
  const lines = () => props.code.split("\n").length;
  const long = () => !!props.collapsible && lines() > CARD_CODE_LINES;
  const toggle = () => {
    setOpen(!open());
    if (open()) props.onExpand?.();
  };
  // Ctrl/Cmd+A in a focused code block selects its code, not the whole page.
  const selectCode = (e: KeyboardEvent & { currentTarget: HTMLPreElement }) => {
    if (e.key.toLowerCase() !== "a" || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
    e.preventDefault();
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  };

  return (
    <figure class={styles.code}>
      <div class={styles.head}>
        <span class={styles.lang}>
          {props.label}
          <Show when={props.collapsible}>
            <span class={styles.lines}>{lines() === 1 ? "1 line" : `${lines()} lines`}</span>
          </Show>
        </span>
        <CopyButton code={() => props.code} />
      </div>
      <pre id={preId} class={styles.pre} tabindex="0" data-collapsed={flag(long() && !open())} onKeyDown={selectCode}>
        <code innerHTML={props.html} />
      </pre>
      <Show when={long()}>
        <button type="button" class={styles.toggle} aria-expanded={open()} aria-controls={preId} onClick={toggle}>
          {open() ? "Show fewer lines" : `Show all ${lines()} lines`}
          <Icon name="chevron-down" class={styles.chevron} />
        </button>
      </Show>
    </figure>
  );
}

export const codeBlockStyles = styles;
