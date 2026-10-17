import { TextField as KTextField } from "@kobalte/core/text-field";
import { type JSX, Show } from "solid-js";
import { FieldCounter } from "../field";
import fieldStyles from "../field/field.module.css";
import styles from "./text-area.module.css";

export interface TextAreaProps {
  label: JSX.Element;
  name: string;
  value: string;
  onChange: (value: string) => void;
  description?: JSX.Element;
  /** Already translated */
  error?: string;
  counterMax?: number;
  placeholder?: string;
  disabled?: boolean;
  /** Minimum height in px (default 168). */
  minHeight?: number;
}

/** Kobalte TextField with a multi-line TextArea, grows with its content. */
export function TextArea(props: TextAreaProps) {
  const over = () => props.counterMax !== undefined && props.value.length > props.counterMax;
  return (
    <KTextField
      class={fieldStyles.field}
      name={props.name}
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      validationState={props.error || over() ? "invalid" : "valid"}
    >
      <KTextField.Label class={fieldStyles.label}>{props.label}</KTextField.Label>
      <KTextField.TextArea
        class={styles.textarea}
        placeholder={props.placeholder}
        autoResize
        style={props.minHeight ? { "min-height": `${props.minHeight}px` } : undefined}
      />
      <div class={fieldStyles.foot}>
        <Show
          when={props.error}
          fallback={
            <Show when={props.description}>
              {(d) => <KTextField.Description class={fieldStyles.description}>{d()}</KTextField.Description>}
            </Show>
          }
        >
          <KTextField.ErrorMessage class={fieldStyles.error}>{props.error}</KTextField.ErrorMessage>
        </Show>
        <Show when={props.counterMax !== undefined}>
          <FieldCounter value={props.value.length} max={props.counterMax!} />
        </Show>
      </div>
    </KTextField>
  );
}
