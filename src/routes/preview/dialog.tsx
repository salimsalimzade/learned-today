import { createSignal } from "solid-js";
import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Button, Dialog, DialogActions, DialogBody, DialogNote } from "~/components/ui-kit";

function Confirm() {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Confirm dialog</Button>
      <Dialog open={open()} onOpenChange={setOpen} title="Delete draft?" description="What you wrote will be lost. This can't be undone.">
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function WithBody() {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Body and note</Button>
      <Dialog open={open()} onOpenChange={setOpen} title="Daxil ol">
        <DialogBody>
          <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
            <Button block>With GitHub</Button>
            <Button block>With Google</Button>
          </div>
        </DialogBody>
        <DialogNote>By continuing you agree to the rules.</DialogNote>
      </Dialog>
    </>
  );
}

export default function DialogPreview() {
  return (
    <PreviewPage title="Dialog" description="Kobalte Dialog: scrim, title, close button, then content. Esc or the scrim closes it.">
      <Specimen title="Examples" site note="Opens in a portal, so it follows the site theme. Switch the theme above to see the dark one.">
        {() => (
          <>
            <Cell label="title + description + actions">
              <Confirm />
            </Cell>
            <Cell label="body + note">
              <WithBody />
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
