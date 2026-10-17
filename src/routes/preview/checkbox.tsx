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
            <Box label="Bunu özüm öyrəndim" />
            <Box label="Bunu özüm öyrəndim" initial />
            <Box label="Telegram bildirişləri" description="Hər səhər bir mesaj." initial />
          </>
        )}
      </Specimen>
      <Specimen title="Error and disabled" stack>
        {() => (
          <>
            <Box label="Bunu özüm öyrəndim" error="Paylaşmadan əvvəl təsdiq et." />
            <Box label="Söndürülüb" disabled />
            <Box label="Söndürülüb, seçili" disabled initial />
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
