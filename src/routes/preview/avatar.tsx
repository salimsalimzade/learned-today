import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Avatar } from "~/components/ui-kit";

export default function AvatarPreview() {
  return (
    <PreviewPage title="Avatar" description="Kobalte Image: the picture when it loads, initials on bg-subtle until then (or if it fails).">
      <Specimen title="Sizes">
        {() => (
          <>
            <Cell label="sm">
              <Avatar name="Emily Carter" size="sm" />
            </Cell>
            <Cell label="md (default)">
              <Avatar name="Emily Carter" />
            </Cell>
            <Cell label="lg">
              <Avatar name="Emily Carter" size="lg" />
            </Cell>
          </>
        )}
      </Specimen>
      <Specimen title="Image and fallback">
        {() => (
          <>
            <Cell label="with image">
              <Avatar name="Learned today" src="/favicon.svg" size="lg" />
            </Cell>
            <Cell label="broken image → initials">
              <Avatar name="Ryan Allen" src="/missing.png" size="lg" />
            </Cell>
            <Cell label="one word">
              <Avatar name="salim" size="lg" />
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
