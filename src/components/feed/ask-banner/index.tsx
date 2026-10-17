import { ButtonLink, Kbd, KbdHint } from "~/components/ui-kit";
import { useI18n } from "~/lib/i18n";
import styles from "./ask-banner.module.css";

/** "Bu gün nə öyrəndin?" above the feed, with the n shortcut to write. */
export function AskBanner() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="ask" class={styles.ask}>
      <div class={styles.text}>
        <h2 id="ask" class={styles.title}>
          {t("feed.askTitle")}
        </h2>
        <p class={styles.sub}>{t("feed.askSub")}</p>
      </div>
      <ButtonLink href="/share" aria-keyshortcuts="n">
        {t("feed.write")}
        <KbdHint>
          <Kbd>n</Kbd>
        </KbdHint>
      </ButtonLink>
    </section>
  );
}
