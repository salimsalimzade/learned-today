import { PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Collapsible } from "~/components/ui-kit";

export default function CollapsiblePreview() {
  return (
    <PreviewPage title="Collapsible" description="Kobalte Collapsible with a title row and a chevron.">
      <Specimen title="Closed and open" stack>
        {() => (
          <>
            <Collapsible title="Niyə belə işləyir?">
              <p style={{ margin: 0, font: "var(--text-body-sm)" }}>Duz dənələrin səthindəki nişastanı yuyur, ona görə yapışmırlar.</p>
            </Collapsible>
            <Collapsible title="Mənbələr" defaultOpen>
              <p style={{ margin: 0, font: "var(--text-body-sm)" }}>Nənəmin resepti və bir neçə yemək bloqu.</p>
            </Collapsible>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
