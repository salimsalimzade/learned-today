import { useAction } from "@solidjs/router";
import { createSignal } from "solid-js";
import { Button, Dialog, DialogActions, showToast } from "~/components/ui-kit";
import { deletePost } from "~/lib/actions/delete-post";
import styles from "./delete-post.module.css";

/**
 * "Delete" for the author of a note, with a confirmation. On success the action redirects to the feed and
 * the call resolves to undefined, so only a failure (returned or thrown) shows an error here.
 */
export function DeletePost(props: { postId: string }) {
  const remove = useAction(deletePost);
  const [open, setOpen] = createSignal(false);
  const [pending, setPending] = createSignal(false);

  const confirm = async () => {
    setPending(true);
    const result = await remove(props.postId).catch(() => ({ ok: false, reason: "error" }) as const);
    setPending(false);
    if (result?.ok === false && result.reason === "signin") return setOpen(false);
    if (result?.ok === false) showToast({ title: "Couldn't delete the note.", variant: "error" });
  };

  return (
    <>
      <Button class={styles.trigger} variant="ghost" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Dialog
        open={open()}
        onOpenChange={(next) => !pending() && setOpen(next)}
        title="Delete this note?"
        description="The note, its reactions and its tags are removed for good. This can't be undone."
      >
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={pending()}>
            Cancel
          </Button>
          <Button class={styles.confirm} variant="primary" onClick={confirm} disabled={pending()}>
            {pending() ? "Deleting…" : "Delete note"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
