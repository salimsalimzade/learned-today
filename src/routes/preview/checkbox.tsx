import { createSignal } from "solid-js";
import { PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Checkbox } from "~/components/ui-kit";

function Box(props: { initial?: boolean; label: string; description?: string; error?: string; disabled?: boolean }) {
  const [v, setV] = createSignal(props.initial ?? false);
  return (
    <Checkbox
      name="preview"
      checked={v()}
      onChange={setV}
      label={props.label}
      description={props.description}
      error={props.error}
      disabled={props.disabled}
    />
  );
}

export default function CheckboxPreview() {
  return (
    <PreviewPage title="Checkbox" description="Kobalte Checkbox with label, help and error text.">
      <Specimen title="States" stack>
        {() => (
          <>
            <Box label="I learned this myself" />
            <Box label="I learned this myself" initial />
            <Box label="Telegram notifications" description="One message every morning." initial />
          </>
        )}
      </Specimen>
      <Specimen title="Error and disabled" stack>
        {() => (
          <>
            <Box label="I learned this myself" error="Confirm before sharing." />
            <Box label="Disabled" disabled />
            <Box label="Disabled, selected" disabled initial />
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
