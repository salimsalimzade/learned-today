import { createSignal } from "solid-js";
import { PreviewPage, Specimen } from "~/components/preview/preview-page";
import { TextArea } from "~/components/ui-kit";

function Area(props: { label: string; initial?: string; description?: string; error?: string; counterMax?: number; disabled?: boolean }) {
  const [v, setV] = createSignal(props.initial ?? "");
  return (
    <TextArea
      label={props.label}
      name="preview"
      value={v()}
      onChange={setV}
      description={props.description}
      error={props.error}
      counterMax={props.counterMax}
      disabled={props.disabled}
      placeholder="Bir neçə cümlə…"
    />
  );
}

export default function TextAreaPreview() {
  return (
    <PreviewPage
      title="Text area"
      description="Kobalte TextField with a multi-line input. Shares the input look with text-field via CSS composes."
    >
      <Specimen title="Default and help" stack>
        {() => (
          <>
            <Area label="Qısa izah" />
            <Area
              label="Qısa izah"
              initial="Düyünü duzlu suda isladanda dənələr bir-birinə yapışmır."
              description="Lentdə görünür."
              counterMax={200}
            />
          </>
        )}
      </Specimen>
      <Specimen title="Error and disabled" stack>
        {() => (
          <>
            <Area label="Qısa izah" error="Bu sahə lazımdır." />
            <Area label="Qısa izah" initial="Redaktə etmək olmur." disabled />
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
