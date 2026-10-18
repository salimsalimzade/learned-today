import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Button, Icon, Tooltip, TooltipTrigger } from "~/components/ui-kit";

export default function TooltipPreview() {
  return (
    <PreviewPage title="Tooltip" description="Kobalte Tooltip, inverted colours. Hover or focus the buttons.">
      <Specimen title="Examples" site note="Opens in a portal, so it follows the site theme. Switch the theme above to see the dark one.">
        {() => (
          <>
            <Cell label="text">
              <Tooltip content="Kodu kopyala">
                <TooltipTrigger as={Button} icon variant="ghost" aria-label="Kodu kopyala">
                  <Icon name="copy" />
                </TooltipTrigger>
              </Tooltip>
            </Cell>
            <Cell label="with Kbd">
              <Tooltip content="Search" kbd="/">
                <TooltipTrigger as={Button} icon aria-label="Search">
                  <Icon name="search" />
                </TooltipTrigger>
              </Tooltip>
            </Cell>
            <Cell label="bottom">
              <Tooltip content="Opens below" placement="bottom">
                <TooltipTrigger as={Button}>Below</TooltipTrigger>
              </Tooltip>
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
