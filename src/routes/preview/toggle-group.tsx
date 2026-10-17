import { createSignal } from "solid-js";
import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Icon, ToggleGroup } from "~/components/ui-kit";

function Theme() {
  const [v, setV] = createSignal<"light" | "system" | "dark">("system");
  return (
    <ToggleGroup
      label="Tema"
      value={v()}
      onChange={setV}
      items={[
        { value: "light", label: <Icon name="sun" />, ariaLabel: "Açıq" },
        { value: "system", label: "Sistem" },
        { value: "dark", label: <Icon name="moon" />, ariaLabel: "Tünd" },
      ]}
    />
  );
}

function Lang() {
  const [v, setV] = createSignal<"az" | "en">("az");
  return (
    <ToggleGroup
      label="Dil"
      value={v()}
      onChange={setV}
      items={[
        { value: "az", label: "AZ", lang: "az" },
        { value: "en", label: "EN", lang: "en" },
      ]}
    />
  );
}

function WithDisabled() {
  const [v, setV] = createSignal<"day" | "week" | "month">("day");
  return (
    <ToggleGroup
      label="Dövr"
      value={v()}
      onChange={setV}
      items={[
        { value: "day", label: "Gün" },
        { value: "week", label: "Həftə" },
        { value: "month", label: "Ay", disabled: true },
      ]}
    />
  );
}

export default function ToggleGroupPreview() {
  return (
    <PreviewPage title="Toggle group" description="Kobalte ToggleGroup: one choice, always one selected.">
      <Specimen title="Examples">
        {() => (
          <>
            <Cell label="icons + text">
              <Theme />
            </Cell>
            <Cell label="text">
              <Lang />
            </Cell>
            <Cell label="disabled item">
              <WithDisabled />
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
