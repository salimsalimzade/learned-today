import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { Button, Icon, Kbd, KbdHint, Popover, PopoverContent, PopoverTrigger, showToast } from "~/components/ui-kit";
import { setRssFollow } from "~/lib/actions/rss-feed";
import { getMyRssFeed } from "~/lib/queries/rss-feed";
import { getSession } from "~/lib/queries/session";
import { useShortcut } from "~/lib/shortcuts";
import { rssPath, telegramFollowUrl } from "~/lib/telegram";
import type { FollowTarget, RssFollow } from "~/lib/types";
import { useOverlays } from "../../overlays/overlay-provider";
import styles from "./follow-popover.module.css";

/**
 * "Follow" button and popover: subscribe in the Telegram bot (tags and authors), copy this page's RSS address,
 * or add the tag or author to your own RSS feed, which the account menu links to.
 */
export function FollowPopover(props: { target: FollowTarget; shortcut?: boolean }) {
  const [open, setOpen] = createSignal(false);
  const overlays = useOverlays();
  const session = createAsync(() => getSession());
  // .latest, not feed(): reading it while it loads would suspend the root <Suspense> (see account-menu).
  const feed = createAsync(async () => (open() && session() ? getMyRssFeed() : null));
  const follow = useAction(setRssFollow);
  const following = useSubmission(setRssFollow);

  useShortcut("f", (e) => {
    if (!props.shortcut) return;
    e.preventDefault();
    setOpen(true);
  });

  // The bot and the personal feed follow tags and authors; a topic is its own RSS feed only.
  const personTarget = (): RssFollow | null => {
    const t = props.target;
    return t.type === "topic" ? null : t;
  };

  const inFeed = (t: RssFollow) => !!feed.latest?.follows.some((f) => f.type === t.type && f.slug === t.slug);

  const copyRss = async () => {
    await navigator.clipboard.writeText(new URL(rssPath(props.target), location.origin).href);
    setOpen(false);
    showToast({ title: "RSS link copied." });
  };

  const toggleFeed = async (t: RssFollow) => {
    setOpen(false);
    if (!session.latest) return overlays.requestSignIn("rss");
    const on = !inFeed(t);
    const result = await follow({ type: t.type, slug: t.slug }, on).catch(() => null);
    if (result?.ok) {
      showToast(
        on
          ? { title: "Added to your RSS feed.", description: "Copy its link from your account menu." }
          : { title: "Removed from your RSS feed." },
      );
    } else {
      const limit = result?.reason === "limit";
      showToast({
        title: limit ? "Your RSS feed is full." : "Couldn't update your RSS feed.",
        description: limit ? "It follows up to 50 tags and authors. Remove one first." : "Try again in a moment.",
        variant: "error",
      });
    }
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
          <Show when={personTarget()}>
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
          <Show when={personTarget()}>
            {(target) => (
              <button
                type="button"
                class={styles.option}
                aria-pressed={inFeed(target())}
                disabled={following.pending}
                onClick={() => toggleFeed(target())}
              >
                <span class={styles.text}>
                  <span class={styles.label}>{inFeed(target()) ? "In your RSS feed" : "Add to your RSS feed"}</span>
                  <span class={styles.hint}>{inFeed(target()) ? "Click to remove it" : "Everything you follow, one link"}</span>
                </span>
                <Icon name={inFeed(target()) ? "check" : "plus"} />
              </button>
            )}
          </Show>
        </div>
      </PopoverContent>
    </Popover>
  );
}
