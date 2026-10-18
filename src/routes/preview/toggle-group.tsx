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
        { value: "light", label: <Icon name="sun" />, ariaLabel: "Light" },
        { value: "system", label: "Sistem" },
        { value: "dark", label: <Icon name="moon" />, ariaLabel: "Dark" },
      ]}
    />
  );
}

function View() {
  const [v, setV] = createSignal<"list" | "grid">("list");
  return (
    <ToggleGroup
      label="View"
      value={v()}
      onChange={setV}
      items={[
        { value: "list", label: "List" },
        { value: "grid", label: "Grid" },
      ]}
    />
  );
}

function WithDisabled() {
  const [v, setV] = createSignal<"day" | "week" | "month">("day");
  return (
    <ToggleGroup
      label="Period"
      value={v()}
      onChange={setV}
      items={[
        { value: "day", label: "Day" },
        { value: "week", label: "Week" },
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
              <View />
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
