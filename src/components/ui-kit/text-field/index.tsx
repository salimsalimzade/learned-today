import { TextField as KTextField } from "@kobalte/core/text-field";
import { type JSX, Show } from "solid-js";
import { cx, flag } from "~/lib/cx";
import { FieldCounter } from "../field";
import fieldStyles from "../field/field.module.css";
import styles from "./text-field.module.css";

export interface TextFieldProps {
  label: JSX.Element;
  name: string;
  value: string;
  onChange: (value: string) => void;
  description?: JSX.Element;
  /** Already translated. Shows instead of the description and marks the field invalid. */
  error?: string;
  /** Shows a 45/90 counter; typing past it is allowed but marked invalid. */
  counterMax?: number;
  placeholder?: string;
  disabled?: boolean;
  mono?: boolean;
  type?: "text" | "url" | "email" | "search";
  autocomplete?: string;
  ref?: (el: HTMLInputElement) => void;
}

/** Kobalte TextField: label, input, then helper text or the error, with an optional counter. */
export function TextField(props: TextFieldProps) {
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
      <KTextField.Input
        ref={props.ref}
        class={cx(styles.input)}
        type={props.type ?? "text"}
        data-mono={flag(props.mono)}
        placeholder={props.placeholder}
        autocomplete={props.autocomplete ?? "off"}
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

/** The input look on its own, for composite inputs (the tag input composes it). */
export const inputClass = styles.input;
