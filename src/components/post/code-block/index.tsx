import { createSignal, onCleanup } from "solid-js";
import { Button, Icon, Tooltip, TooltipTrigger } from "~/components/ui-kit";
import { flag } from "~/lib/cx";
import { useI18n } from "~/lib/i18n";
import styles from "./code-block.module.css";

/** Copy button with a two-second "Kopyalandı" state and a polite announcement. */
export function CopyButton(props: { code: () => string }) {
  const { t } = useI18n();
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
      <Tooltip content={t("code.copyLabel")}>
        <TooltipTrigger
          as={Button}
          variant="ghost"
          class={styles.copy}
          data-copied={flag(copied())}
          aria-label={t("code.copyLabel")}
          onClick={copy}
        >
          <Icon name={copied() ? "check" : "copy"} />
          {copied() ? t("code.copied") : t("code.copy")}
        </TooltipTrigger>
      </Tooltip>
      <span class="sr-only" aria-live="polite">
        {copied() ? t("code.copied") : ""}
      </span>
    </>
  );
}

/** A highlighted code block with its language label. `html` is pre-escaped by lib/markdown. */
export function CodeBlock(props: { label: string; html: string; code: string }) {
  return (
    <figure class={styles.code}>
      <div class={styles.head}>
        <span class={styles.lang}>{props.label}</span>
        <CopyButton code={() => props.code} />
      </div>
      <pre class={styles.pre} tabindex="0">
        <code innerHTML={props.html} />
      </pre>
    </figure>
  );
}

export const codeBlockStyles = styles;
