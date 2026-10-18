import { createSignal } from "solid-js";
import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { TextField } from "~/components/ui-kit";

function Field(props: {
  label: string;
  initial?: string;
  description?: string;
  error?: string;
  counterMax?: number;
  disabled?: boolean;
  mono?: boolean;
  placeholder?: string;
}) {
  const [v, setV] = createSignal(props.initial ?? "");
  return (
    <TextField
      label={props.label}
      name="preview"
      value={v()}
      onChange={setV}
      description={props.description}
      error={props.error}
      counterMax={props.counterMax}
      disabled={props.disabled}
      mono={props.mono}
      placeholder={props.placeholder}
    />
  );
}

export default function TextFieldPreview() {
  return (
    <PreviewPage
      title="Text field"
      description="Kobalte TextField with label, help text, error and an optional counter. Folder: ui-kit/text-field."
    >
      <Specimen title="Default and help" stack>
        {() => (
          <>
            <Field label="Title" placeholder="In one sentence" />
            <Field
              label="Title"
              initial="satisfies doesn't widen the type"
              description="One sentence. What did you learn?"
              counterMax={90}
            />
          </>
        )}
      </Specimen>
      <Specimen title="Error, disabled, mono" stack>
        {() => (
          <>
            <Field label="Title" error="A title is required." />
            <Field label="Title" initial={"A very long title ".repeat(7)} counterMax={90} error="Keep it under 90 characters." />
            <Field label="Link" initial="https://example.com" disabled />
            <Cell label="mono" wide>
              <Field label="Telegram ID" initial="@learned_today" mono />
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
