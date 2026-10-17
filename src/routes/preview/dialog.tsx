import { createSignal } from "solid-js";
import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Button, Dialog, DialogActions, DialogBody, DialogNote } from "~/components/ui-kit";

function Confirm() {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Təsdiq dialoqu</Button>
      <Dialog open={open()} onOpenChange={setOpen} title="Qaralama silinsin?" description="Yazdıqların itəcək. Bunu geri qaytarmaq olmur.">
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Ləğv et</Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Sil
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
      <Button onClick={() => setOpen(true)}>Body və qeyd</Button>
      <Dialog open={open()} onOpenChange={setOpen} title="Daxil ol">
        <DialogBody>
          <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
            <Button block>GitHub ilə</Button>
            <Button block>Google ilə</Button>
          </div>
        </DialogBody>
        <DialogNote>Davam etməklə qaydalarla razılaşırsan.</DialogNote>
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
