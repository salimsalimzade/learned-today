import { PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Collapsible } from "~/components/ui-kit";

export default function CollapsiblePreview() {
  return (
    <PreviewPage title="Collapsible" description="Kobalte Collapsible with a title row and a chevron.">
      <Specimen title="Closed and open" stack>
        {() => (
          <>
            <Collapsible title="Why does it work like this?">
              <p style={{ margin: 0, font: "var(--text-body-sm)" }}>
                Salt washes the starch off the surface of the grains, so they don't stick.
              </p>
            </Collapsible>
            <Collapsible title="Sources" defaultOpen>
              <p style={{ margin: 0, font: "var(--text-body-sm)" }}>My grandmother's recipe and a few food blogs.</p>
            </Collapsible>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
