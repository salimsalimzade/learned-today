import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Button, showToast } from "~/components/ui-kit";

export default function ToastPreview() {
  return (
    <PreviewPage title="Toast" description="Kobalte Toast, bottom of the screen. The region is mounted once in app.tsx.">
      <Specimen title="Variants" site note="Toasts follow the site theme. Switch the theme above to see the dark ones.">
        {() => (
          <>
            <Cell label="default">
              <Button onClick={() => showToast({ title: "Qeyd paylaşıldı" })}>Göstər</Button>
            </Cell>
            <Cell label="with description">
              <Button onClick={() => showToast({ title: "Link kopyalandı", description: "İndi istədiyin yerə yapışdır." })}>Göstər</Button>
            </Cell>
            <Cell label="with action">
              <Button
                onClick={() =>
                  showToast({
                    title: "Qaralama silindi",
                    action: { label: "Geri qaytar", onClick: () => showToast({ title: "Qaytarıldı" }) },
                  })
                }
              >
                Göstər
              </Button>
            </Cell>
            <Cell label="error">
              <Button
                onClick={() =>
                  showToast({ title: "Paylaşmaq olmadı", description: "İnterneti yoxla və yenidən cəhd et.", variant: "error" })
                }
              >
                Göstər
              </Button>
            </Cell>
            <Cell label="warning">
              <Button onClick={() => showToast({ title: "Qaralama köhnədir", variant: "warning" })}>Göstər</Button>
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
