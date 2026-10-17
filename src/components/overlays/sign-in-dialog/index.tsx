import { createAsync } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { Button, Dialog, DialogBody, DialogNote, Kbd } from "~/components/ui-kit";
import { isMock } from "~/lib/env";
import { useI18n } from "~/lib/i18n";
import { getSession } from "~/lib/queries/session";
import type { Provider } from "~/lib/types";
import { useOverlays } from "../overlay-provider";
import { useSignIn } from "../use-sign-in";
import styles from "./sign-in-dialog.module.css";

/** Opens when a guest reacts or tries to share. Closes by itself once a session exists. */
export function SignInDialog() {
  const { t } = useI18n();
  const overlays = useOverlays();
  const session = createAsync(() => getSession());
  const signIn = useSignIn();

  createEffect(() => {
    if (session() && overlays.signIn()) overlays.closeSignIn();
  });

  const title = () => {
    const reason = overlays.signIn()?.reason;
    return reason === "react" ? t("signin.titleReact") : reason === "share" ? t("signin.titleShare") : t("signin.title");
  };

  const start = (provider: Provider) => signIn.start(provider, overlays.signIn()?.next ?? "/");

  return (
    <Dialog
      open={!!overlays.signIn()}
      onOpenChange={(open) => !open && overlays.closeSignIn()}
      title={title()}
      description={t("signin.description")}
    >
      <DialogBody class={styles.providers}>
        <Button block onClick={() => start("google")} disabled={signIn.pending()}>
          {t("signin.google")}
        </Button>
        <Button block onClick={() => start("github")} disabled={signIn.pending()}>
          {t("signin.github")}
        </Button>
      </DialogBody>
      <Show when={isMock}>
        <DialogNote>{t("signin.mockNote")}</DialogNote>
      </Show>
      <DialogNote class={styles["hover-only"]}>
        <Kbd>esc</Kbd> {t("signin.escCloses")}
      </DialogNote>
    </Dialog>
  );
}
