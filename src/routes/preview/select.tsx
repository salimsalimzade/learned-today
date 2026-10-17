import { createSignal } from "solid-js";
import { PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Select } from "~/components/ui-kit";

const TOPICS = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "cooking", label: "Mətbəx" },
  { value: "language", label: "Dil" },
  { value: "history", label: "Tarix", disabled: true },
];

function Pick(props: { initial?: string; error?: string; disabled?: boolean; description?: string }) {
  const [v, setV] = createSignal<string | null>(props.initial ?? null);
  return (
    <Select
      label="Mövzu"
      name="topic"
      options={TOPICS}
      value={v()}
      onChange={setV}
      placeholder="Mövzu seç"
      error={props.error}
      disabled={props.disabled}
      description={props.description}
    />
  );
}

export default function SelectPreview() {
  return (
    <PreviewPage title="Select" description="Kobalte Select. The list opens in a portal, so it takes the site theme (switch it above).">
      <Specimen title="Empty and chosen" stack>
        {() => (
          <>
            <Pick description="Bir mövzu seç." />
            <Pick initial="cooking" />
          </>
        )}
      </Specimen>
      <Specimen title="Error and disabled" stack>
        {() => (
          <>
            <Pick error="Mövzu seç." />
            <Pick initial="frontend" disabled />
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
