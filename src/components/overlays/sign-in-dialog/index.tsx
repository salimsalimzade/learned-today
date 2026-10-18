import { createAsync } from "@solidjs/router";
import { createEffect } from "solid-js";
import { Button, Dialog, DialogBody, DialogNote, Kbd } from "~/components/ui-kit";
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
    if (reason === "rss") return "Sign in to follow by RSS";
    return reason === "react" ? "Sign in to react" : reason === "share" ? "Sign in to share" : "Sign in";
  };
  const description = () =>
    overlays.signIn()?.reason === "rss"
      ? "Your RSS feed collects the tags and authors you pick at one private link, so it needs an account."
      : "You can leave one reaction per note. You also need to sign in to share a note.";

  const start = (provider: Provider) => signIn.start(provider, overlays.signIn()?.next ?? "/");

  return (
    <Dialog open={!!overlays.signIn()} onOpenChange={(open) => !open && overlays.closeSignIn()} title={title()} description={description()}>
      <DialogBody class={styles.providers}>
        <Button block onClick={() => start("google")} disabled={signIn.pending()}>
          Sign in with Google
        </Button>
        <Button block onClick={() => start("github")} disabled={signIn.pending()}>
          Sign in with GitHub
        </Button>
      </DialogBody>
      <DialogNote class={styles["hover-only"]}>
        <Kbd>esc</Kbd> closes.
      </DialogNote>
    </Dialog>
  );
}
