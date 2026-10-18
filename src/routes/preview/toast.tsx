import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Button, showToast } from "~/components/ui-kit";

export default function ToastPreview() {
  return (
    <PreviewPage title="Toast" description="Kobalte Toast, bottom of the screen. The region is mounted once in app.tsx.">
      <Specimen title="Variants" site note="Toasts follow the site theme. Switch the theme above to see the dark ones.">
        {() => (
          <>
            <Cell label="default">
              <Button onClick={() => showToast({ title: "Note shared" })}>Show</Button>
            </Cell>
            <Cell label="with description">
              <Button onClick={() => showToast({ title: "Link copied", description: "Now paste it anywhere." })}>Show</Button>
            </Cell>
            <Cell label="with action">
              <Button
                onClick={() =>
                  showToast({
                    title: "Qaralama silindi",
                    action: { label: "Undo", onClick: () => showToast({ title: "Undone" }) },
                  })
                }
              >
                Show
              </Button>
            </Cell>
            <Cell label="error">
              <Button
                onClick={() =>
                  showToast({ title: "Couldn't share", description: "Check your connection and try again.", variant: "error" })
                }
              >
                Show
              </Button>
            </Cell>
            <Cell label="warning">
              <Button onClick={() => showToast({ title: "The draft is old", variant: "warning" })}>Show</Button>
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
