import { ButtonLink, Kbd, KbdHint } from "~/components/ui-kit";
import { useShare } from "../../overlays/use-share";
import styles from "./ask-banner.module.css";

/** "What did you learn today?" above the feed, with the n shortcut to write. */
export function AskBanner() {
  const share = useShare();
  return (
    <section aria-labelledby="ask" class={styles.ask}>
      <div class={styles.text}>
        <h2 id="ask" class={styles.title}>
          What did you learn today?
        </h2>
        <p class={styles.sub}>One small thing, in your own words.</p>
      </div>
      <ButtonLink href="/share" aria-keyshortcuts="n" on:click={share.onLinkClick}>
        Write
        <KbdHint>
          <Kbd>n</Kbd>
        </KbdHint>
      </ButtonLink>
    </section>
  );
}
