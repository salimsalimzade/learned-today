import { A, createAsync, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import { Button, ButtonLink, Icon, Kbd } from "~/components/ui-kit";
import { useI18n } from "~/lib/i18n";
import { getSession } from "~/lib/queries/session";
import { useOverlays } from "../../overlays/overlay-provider";
import { AccountMenu } from "../account-menu";
import styles from "./header.module.css";

/** Sticky site header: wordmark, search, share and the account menu. */
export function Header() {
  const { t } = useI18n();
  const overlays = useOverlays();
  const location = useLocation();
  const session = createAsync(() => getSession());

  return (
    <header class={styles.header}>
      <div class={styles.inner}>
        <A class={styles.wordmark} href="/">
          what-did-i-learn-today
        </A>
        <Button
          class={styles.search}
          aria-label={t("header.searchLabel")}
          aria-keyshortcuts="/"
          onClick={() => overlays.setPaletteOpen(true)}
        >
          <span class={styles["search-label"]}>
            <Icon name="search" />
            <span class={styles.wide}>{t("header.search")}</span>
          </span>
          <span class={styles.wide}>
            <Kbd>/</Kbd>
          </span>
        </Button>
        <Show when={location.pathname !== "/share"}>
          <ButtonLink class={styles.share} variant="primary" href="/share" aria-label={t("header.share")}>
            <span class={styles.narrow}>
              <Icon name="plus" size={20} />
            </span>
            <span class={styles.wide}>{t("header.share")}</span>
          </ButtonLink>
        </Show>
        <AccountMenu user={session()} />
      </div>
    </header>
  );
}
