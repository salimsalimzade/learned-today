import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Button, ButtonLink, Icon, Kbd, KbdHint } from "~/components/ui-kit";

export default function ButtonPreview() {
  return (
    <PreviewPage title="Button" description="Kobalte Button. Outlined by default; primary is the accent fill; ghost has no edge.">
      <Specimen title="Variants">
        {() => (
          <>
            <Cell label="secondary (default)">
              <Button>Ləğv et</Button>
            </Cell>
            <Cell label="primary">
              <Button variant="primary">Paylaş</Button>
            </Cell>
            <Cell label="ghost">
              <Button variant="ghost">Qaralamanı sil</Button>
            </Cell>
          </>
        )}
      </Specimen>
      <Specimen title="With icon, Kbd, icon-only">
        {() => (
          <>
            <Cell label="leading icon">
              <Button>
                <Icon name="plus" />
                Yeni qeyd
              </Button>
            </Cell>
            <Cell label="with Kbd hint">
              <Button variant="primary">
                Yaz
                <KbdHint>
                  <Kbd>n</Kbd>
                </KbdHint>
              </Button>
            </Cell>
            <Cell label="icon-only">
              <Button icon aria-label="Bağla">
                <Icon name="x" />
              </Button>
            </Cell>
            <Cell label="icon-only ghost">
              <Button icon variant="ghost" aria-label="Axtar">
                <Icon name="search" />
              </Button>
            </Cell>
          </>
        )}
      </Specimen>
      <Specimen title="States">
        {() => (
          <>
            <Cell label="disabled">
              <Button disabled>Ləğv et</Button>
            </Cell>
            <Cell label="primary disabled">
              <Button variant="primary" disabled>
                Paylaş
              </Button>
            </Cell>
            <Cell label="busy">
              <Button variant="primary" aria-busy="true" disabled>
                Paylaşılır…
              </Button>
            </Cell>
            <Cell label="ButtonLink (an <a>)">
              <ButtonLink href="/preview">Bütün komponentlər</ButtonLink>
            </Cell>
          </>
        )}
      </Specimen>
      <Specimen title="Block" stack>
        {() => <Button block>GitHub ilə daxil ol</Button>}
      </Specimen>
    </PreviewPage>
  );
}
