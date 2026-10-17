import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Kbd, KbdCombo, KbdHint } from "~/components/ui-kit";

export default function KbdPreview() {
  return (
    <PreviewPage title="Kbd" description="Key faces. KbdHint hides itself on touch screens, where single-key shortcuts don't apply.">
      <Specimen title="Keys">
        {() => (
          <>
            <Cell label="single">
              <Kbd>/</Kbd>
            </Cell>
            <Cell label="letters">
              <span style={{ display: "inline-flex", gap: "4px" }}>
                <Kbd>j</Kbd>
                <Kbd>k</Kbd>
                <Kbd>n</Kbd>
              </span>
            </Cell>
            <Cell label="modifier">
              <span style={{ display: "inline-flex", gap: "4px" }}>
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
              </span>
            </Cell>
            <Cell label="word">
              <Kbd>Esc</Kbd>
            </Cell>
          </>
        )}
      </Specimen>
      <Specimen title="Combo with label">
        {() => (
          <>
            <Cell label="KbdCombo">
              <KbdCombo>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> seç
              </KbdCombo>
            </Cell>
            <Cell label="KbdHint (hidden on touch)">
              <KbdCombo>
                <KbdHint>
                  <Kbd>r</Kbd>
                  <Kbd>1</Kbd>–<Kbd>6</Kbd> reaksiya seç
                </KbdHint>
              </KbdCombo>
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
