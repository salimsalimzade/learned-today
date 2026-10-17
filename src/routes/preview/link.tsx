import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Icon, Link } from "~/components/ui-kit";

export default function LinkPreview() {
  return (
    <PreviewPage title="Link" description="Kobalte Link. Internal hrefs go through the router; external ones are plain anchors.">
      <Specimen title="Variants">
        {() => (
          <>
            <Cell label="default (prose)">
              <Link href="/preview">MDN-də oxu</Link>
            </Cell>
            <Cell label="quiet">
              <Link variant="quiet" href="/preview">
                Aysel Məmmədova
              </Link>
            </Cell>
            <Cell label="muted">
              <Link variant="muted" href="/preview">
                <Icon name="arrow-left" />
                Lentə qayıt
              </Link>
            </Cell>
            <Cell label="external">
              <Link external href="/rss.xml">
                RSS
              </Link>
            </Cell>
          </>
        )}
      </Specimen>
      <Specimen title="Inside text" stack>
        {() => (
          <p style={{ margin: 0, font: "var(--text-body)" }}>
            Ətraflı izahat <Link href="/preview">bu məqalədədir</Link>, amma qısası budur: <code>satisfies</code> tipi daraltmır.
          </p>
        )}
      </Specimen>
    </PreviewPage>
  );
}
