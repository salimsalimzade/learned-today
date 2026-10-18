import { createAsync } from "@solidjs/router";
import { createEffect, Show } from "solid-js";
import { Button, Dialog, DialogBody, DialogNote, Kbd } from "~/components/ui-kit";
import { isMock } from "~/lib/env";
import { getSession } from "~/lib/queries/session";
import type { Provider } from "~/lib/types";
import { useOverlays } from "../overlay-provider";
import { useSignIn } from "../use-sign-in";
import styles from "./sign-in-dialog.module.css";

/** Opens when a guest reacts or tries to share. Closes by itself once a session exists. */
export function SignInDialog() {
  const overlays = useOverlays();
  const session = createAsync(() => getSession());
  const signIn = useSignIn();

  createEffect(() => {
    if (session() && overlays.signIn()) overlays.closeSignIn();
  });

  const title = () => {
    const reason = overlays.signIn()?.reason;
    return reason === "react" ? "Sign in to react" : reason === "share" ? "Sign in to share" : "Sign in";
  };

  const start = (provider: Provider) => signIn.start(provider, overlays.signIn()?.next ?? "/");

  return (
    <Dialog
      open={!!overlays.signIn()}
      onOpenChange={(open) => !open && overlays.closeSignIn()}
      title={title()}
      description="You can leave one reaction per note. You also need to sign in to share a note."
    >
      <DialogBody class={styles.providers}>
        <Button block onClick={() => start("google")} disabled={signIn.pending()}>
          Sign in with Google
        </Button>
        <Button block onClick={() => start("github")} disabled={signIn.pending()}>
          Sign in with GitHub
        </Button>
      </DialogBody>
      <Show when={isMock}>
        <DialogNote>Demo mode: Supabase isn't connected, so you sign in as a sample account.</DialogNote>
      </Show>
      <DialogNote class={styles["hover-only"]}>
        <Kbd>esc</Kbd> closes.
      </DialogNote>
    </Dialog>
  );
}
