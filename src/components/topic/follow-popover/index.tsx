import { createSignal, Show } from "solid-js";
import { Button, Icon, Kbd, KbdHint, Popover, PopoverContent, PopoverTrigger, showToast } from "~/components/ui-kit";
import { useShortcut } from "~/lib/shortcuts";
import { rssPath, telegramFollowUrl } from "~/lib/telegram";
import type { FollowTarget } from "~/lib/types";
import styles from "./follow-popover.module.css";

/** "Follow" button and popover: subscribe in the Telegram bot (tags and authors), or copy the RSS address. */
export function FollowPopover(props: { target: FollowTarget; shortcut?: boolean }) {
  const [open, setOpen] = createSignal(false);

  useShortcut("f", (e) => {
    if (!props.shortcut) return;
    e.preventDefault();
    setOpen(true);
  });

  // The bot follows tags and authors; a topic is RSS only.
  const telegramTarget = () => {
    const t = props.target;
    return t.type === "topic" ? null : t;
  };

  const copyRss = async () => {
    await navigator.clipboard.writeText(new URL(rssPath(props.target), location.origin).href);
    setOpen(false);
    showToast({ title: "RSS link copied." });
  };

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger as={Button} aria-keyshortcuts={props.shortcut ? "f" : undefined}>
        Follow
        <Show when={props.shortcut}>
          <KbdHint>
            <Kbd>f</Kbd>
          </KbdHint>
        </Show>
        <Icon name="chevron-down" class={styles.chevron} />
      </PopoverTrigger>
      <PopoverContent
        title={`Follow: ${props.target.name}`}
        description="Get notified when a new note is published."
        class={styles.popover}
      >
        <div class={styles.options}>
          <Show when={telegramTarget()}>
            {(target) => (
              <a
                class={styles.option}
                href={telegramFollowUrl(target())}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <span class={styles.text}>
                  <span class={styles.label}>Telegram</span>
                  <span class={styles.hint}>Open the bot, subscribe in one tap</span>
                </span>
                <Icon name="arrow-up-right" />
              </a>
            )}
          </Show>
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
