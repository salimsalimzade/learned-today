import { Select as KSelect } from "@kobalte/core/select";
import { type JSX, Show } from "solid-js";
import fieldStyles from "../field/field.module.css";
import { Icon } from "../icon";
import styles from "./select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label: JSX.Element;
  name: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
  description?: JSX.Element;
  /** Already translated */
  error?: string;
  disabled?: boolean;
}

/** Kobalte Select with a hidden native <select>, so the value posts with the form. */
export function Select(props: SelectProps) {
  const selected = () => props.options.find((o) => o.value === props.value) ?? null;
  return (
    <KSelect<SelectOption>
      class={fieldStyles.field}
      name={props.name}
      options={props.options}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      value={selected()}
      onChange={(o) => o && props.onChange(o.value)}
      placeholder={props.placeholder}
      disabled={props.disabled}
      validationState={props.error ? "invalid" : "valid"}
      gutter={4}
      sameWidth
      itemComponent={(p) => (
        <KSelect.Item item={p.item} class={styles.item}>
          <KSelect.ItemLabel>{p.item.rawValue.label}</KSelect.ItemLabel>
          <KSelect.ItemIndicator class={styles.indicator}>
            <Icon name="check" />
          </KSelect.ItemIndicator>
        </KSelect.Item>
      )}
    >
      <KSelect.HiddenSelect />
      <KSelect.Label class={fieldStyles.label}>{props.label}</KSelect.Label>
      <KSelect.Trigger class={styles.trigger}>
        <KSelect.Value<SelectOption> class={styles.value}>{(s) => s.selectedOption()?.label}</KSelect.Value>
        <Icon name="chevron-down" />
      </KSelect.Trigger>
      <Show
        when={props.error}
        fallback={
          <Show when={props.description}>{(d) => <KSelect.Description class={fieldStyles.description}>{d()}</KSelect.Description>}</Show>
        }
      >
        <KSelect.ErrorMessage class={fieldStyles.error}>{props.error}</KSelect.ErrorMessage>
      </Show>
      <KSelect.Portal>
        <KSelect.Content class={styles.content}>
          <KSelect.Listbox class={styles.listbox} />
        </KSelect.Content>
      </KSelect.Portal>
    </KSelect>
  );
}

/** List styles for custom listboxes (the code-language picker reuses them). */
export const selectStyles = styles;
