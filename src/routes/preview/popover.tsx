import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Button, Icon, Popover, PopoverContent, PopoverTrigger } from "~/components/ui-kit";

export default function PopoverPreview() {
  return (
    <PreviewPage
      title="Popover"
      description="Kobalte Popover: hairline edge, no shadow, fades in. Focus goes to the first option without scrolling."
    >
      <Specimen title="Examples" site note="Opens in a portal, so it follows the site theme. Switch the theme above to see the dark one.">
        {() => (
          <>
            <Cell label="title + description + close">
              <Popover placement="bottom-start" gutter={8}>
                <PopoverTrigger as={Button}>
                  İzlə
                  <Icon name="chevron-down" />
                </PopoverTrigger>
                <PopoverContent title="Frontend mövzusunu izlə" description="Yeni qeydlər gələndə xəbər verək." style={{ width: "320px" }}>
                  <div style={{ display: "flex", gap: "8px", "margin-top": "12px" }}>
                    <Button variant="primary">Telegram</Button>
                    <Button>RSS</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </Cell>
            <Cell label="title, no close button">
              <Popover placement="bottom-start" gutter={8}>
                <PopoverTrigger as={Button}>Məlumat</PopoverTrigger>
                <PopoverContent title="Bu nədir?" closeButton={false} style={{ width: "280px" }}>
                  <p style={{ margin: "8px 0 0", font: "var(--text-body-sm)", color: "var(--text-muted)" }}>
                    Hər gün öyrəndiyin bir şeyi qısa yaz.
                  </p>
                </PopoverContent>
              </Popover>
            </Cell>
            <Cell label="bare content">
              <Popover placement="bottom-start" gutter={8}>
                <PopoverTrigger as={Button} icon aria-label="Əlavə et">
                  <Icon name="plus" />
                </PopoverTrigger>
                <PopoverContent aria-label="Seçimlər">
                  <div style={{ display: "flex", "flex-direction": "column" }}>
                    <Button variant="ghost">Linki kopyala</Button>
                    <Button variant="ghost">Bildir</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
