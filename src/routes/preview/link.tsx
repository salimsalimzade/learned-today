import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Icon, Link } from "~/components/ui-kit";

export default function LinkPreview() {
  return (
    <PreviewPage title="Link" description="Kobalte Link. Internal hrefs go through the router; external ones are plain anchors.">
      <Specimen title="Variants">
        {() => (
          <>
            <Cell label="default (prose)">
              <Link href="/preview">Read on MDN</Link>
            </Cell>
            <Cell label="quiet">
              <Link variant="quiet" href="/preview">
                Emily Carter
              </Link>
            </Cell>
            <Cell label="muted">
              <Link variant="muted" href="/preview">
                <Icon name="arrow-left" />
                Back to the feed
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
            The long explanation is <Link href="/preview">in this article</Link>, but the short version is: <code>satisfies</code> doesn't
            widen the type.
          </p>
        )}
      </Specimen>
    </PreviewPage>
  );
}
