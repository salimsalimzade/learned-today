import { A, createAsync, useLocation } from "@solidjs/router";
import { Button, ButtonLink, Icon, Kbd } from "~/components/ui-kit";
import { flag } from "~/lib/cx";
import { getSession } from "~/lib/queries/session";
import { useOverlays } from "../../overlays/overlay-provider";
import { useShare } from "../../overlays/use-share";
import { AccountMenu } from "../account-menu";
import styles from "./header.module.css";

/** Sticky site header: wordmark, search, share and the account menu. */
export function Header() {
  const overlays = useOverlays();
  const location = useLocation();
  const session = createAsync(() => getSession());
  const share = useShare();

  return (
    <header class={styles.header}>
      <div class={styles.inner}>
        <A class={styles.wordmark} href="/">
          what-did-i-learn-today
        </A>
        <Button class={styles.search} aria-label="Search ( / )" aria-keyshortcuts="/" onClick={() => overlays.setPaletteOpen(true)}>
          <span class={styles["search-label"]}>
            <Icon name="search" />
            <span class={styles.wide}>Search</span>
          </span>
          <span class={styles.wide}>
            <Kbd>/</Kbd>
          </span>
        </Button>
        {/* Hidden on /share rather than removed, so search and the account button don't jump sideways. */}
        <ButtonLink
          class={styles.share}
          variant="primary"
          href="/share"
          aria-label="Share"
          data-hidden={flag(location.pathname === "/share")}
          on:click={share.onLinkClick}
        >
          <span class={styles.narrow}>
            <Icon name="plus" size={20} />
          </span>
          <span class={styles.wide}>Share</span>
        </ButtonLink>
        <AccountMenu user={session()} />
      </div>
    </header>
  );
}
