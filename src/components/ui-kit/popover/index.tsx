import { Popover as KPopover, type PopoverRootProps } from "@kobalte/core/popover";
import { type JSX, type ParentProps, Show, splitProps } from "solid-js";
import { cx } from "~/lib/cx";
import { useI18n } from "~/lib/i18n";
import buttonStyles from "../button/button.module.css";
import { Icon } from "../icon";
import styles from "./popover.module.css";

/** Kobalte Popover with the design's defaults: 8px below the trigger, right-aligned. */
export function Popover(props: PopoverRootProps) {
  return <KPopover gutter={8} placement="bottom-end" {...props} />;
}

export const PopoverTrigger = KPopover.Trigger;
export const PopoverTitle = KPopover.Title;
export const PopoverClose = KPopover.CloseButton;

interface ContentProps extends ParentProps {
  title?: JSX.Element;
  description?: JSX.Element;
  /** Defaults to true when there's a title. */
  closeButton?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
  "aria-label"?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Portalled panel: hairline edge, no shadow, fades in and out. */
export function PopoverContent(props: ContentProps) {
  const { t } = useI18n();
  const [local, rest] = splitProps(props, ["title", "description", "closeButton", "class", "children"]);
  let content: HTMLDivElement | undefined;
  return (
    <KPopover.Portal>
      <KPopover.Content
        ref={content}
        class={cx(styles.popover, local.class)}
        {...rest}
        // The panel sits at 0,0 for a frame before it's positioned, so a plain focus() would
        // scroll the page to the top. Focus the first real option without scrolling.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const all = [...(content?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
          const first = all.find((el) => !el.closest(`.${styles.head}`)) ?? all[0];
          (first ?? content)?.focus({ preventScroll: true });
        }}
      >
        <Show when={local.title}>
          {(title) => (
            <div class={styles.head}>
              <div>
                <KPopover.Title class={styles.title}>{title()}</KPopover.Title>
                <Show when={local.description}>{(d) => <KPopover.Description class={styles.description}>{d()}</KPopover.Description>}</Show>
              </div>
              <Show when={local.closeButton !== false}>
                <KPopover.CloseButton
                  class={cx(buttonStyles.button, styles.close)}
                  data-variant="ghost"
                  data-icon-only=""
                  aria-label={t("common.close")}
                >
                  <Icon name="x" />
                </KPopover.CloseButton>
              </Show>
            </div>
          )}
        </Show>
        {local.children}
      </KPopover.Content>
    </KPopover.Portal>
  );
}

export const popoverClass = styles.popover;
