import { Checkbox as KCheckbox } from "@kobalte/core/checkbox";
import { type JSX, Show } from "solid-js";
import { Icon } from "../icon";
import styles from "./checkbox.module.css";

interface CheckboxProps {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: JSX.Element;
  description?: JSX.Element;
  /** Already translated */
  error?: string;
  disabled?: boolean;
}

/** Kobalte Checkbox. The real input stays in the DOM (visually hidden) and posts with the form. */
export function Checkbox(props: CheckboxProps) {
  return (
    <KCheckbox
      class={styles.checkbox}
      name={props.name}
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
      validationState={props.error ? "invalid" : "valid"}
    >
      <KCheckbox.Input class="sr-only" />
      <KCheckbox.Control class={styles.control}>
        <KCheckbox.Indicator class={styles.indicator}>
          <Icon name="check" />
        </KCheckbox.Indicator>
      </KCheckbox.Control>
      <span class={styles.text}>
        <KCheckbox.Label>{props.label}</KCheckbox.Label>
        <Show when={props.description}>{(d) => <KCheckbox.Description class={styles.description}>{d()}</KCheckbox.Description>}</Show>
      </span>
      <Show when={props.error}>
        <KCheckbox.ErrorMessage class={styles.error}>{props.error}</KCheckbox.ErrorMessage>
      </Show>
    </KCheckbox>
  );
}
