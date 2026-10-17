import { createSignal, Show } from "solid-js";
import { Button, Icon, Kbd, KbdHint, Popover, PopoverContent, PopoverTrigger, showToast } from "~/components/ui-kit";
import { useI18n } from "~/lib/i18n";
import { useShortcut } from "~/lib/shortcuts";
import { rssPath, telegramFollowUrl } from "~/lib/telegram";
import type { FollowTarget } from "~/lib/types";
import styles from "./follow-popover.module.css";

/** "İzlə" button and popover: subscribe in the Telegram bot, or copy the RSS address. */
export function FollowPopover(props: { target: FollowTarget; shortcut?: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);

  useShortcut("f", (e) => {
    if (!props.shortcut) return;
    e.preventDefault();
    setOpen(true);
  });

  const copyRss = async () => {
    await navigator.clipboard.writeText(new URL(rssPath(props.target), location.origin).href);
    setOpen(false);
    showToast({ title: t("follow.rssCopied") });
  };

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger as={Button} aria-keyshortcuts={props.shortcut ? "f" : undefined}>
        {t("follow.button")}
        <Show when={props.shortcut}>
          <KbdHint>
            <Kbd>f</Kbd>
          </KbdHint>
        </Show>
        <Icon name="chevron-down" class={styles.chevron} />
      </PopoverTrigger>
      <PopoverContent title={t("follow.title", { name: props.target.name })} description={t("follow.description")} class={styles.popover}>
        <div class={styles.options}>
          <a
            class={styles.option}
            href={telegramFollowUrl(props.target)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <span class={styles.text}>
              <span class={styles.label}>Telegram</span>
              <span class={styles.hint}>{t("follow.telegramHint")}</span>
            </span>
            <Icon name="arrow-up-right" />
          </a>
          <button type="button" class={styles.option} onClick={copyRss}>
            <span class={styles.text}>
              <span class={styles.label}>RSS</span>
              <span class={styles.hint}>{decodeURIComponent(rssPath(props.target))}</span>
            </span>
            <Icon name="copy" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
