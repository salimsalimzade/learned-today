import { Combobox } from "@kobalte/core/combobox";
import { createMemo, createSignal, type JSX, Show } from "solid-js";
import { cx } from "~/lib/cx";
import { fold } from "~/lib/format";
import fieldStyles from "../field/field.module.css";
import { Icon } from "../icon";
import selectStyles from "../select/select.module.css";
import { inputClass } from "../text-field";
import styles from "./search-select.module.css";

export interface SearchOption {
  value: string;
  label: string;
  /** Extra text typing should match besides the label, e.g. a slug or "GMT+4". */
  keywords?: string;
}

interface SearchSelectProps {
  label: JSX.Element;
  /** Keep the label for screen readers only, where the context already says what the field is. */
  hideLabel?: boolean;
  options: SearchOption[];
  value: string | null;
  onChange: (option: SearchOption) => void;
  placeholder: string;
  /** aria-label of the chevron button that opens the whole list. */
  listLabel: string;
  id?: string;
  /** Posts the value with a form, through Kobalte's hidden <select>. */
  name?: string;
  description?: JSX.Element;
  /** Already translated */
  error?: string;
  class?: string;
}

/**
 * Kobalte Combobox: a text field that filters a list as you type (label and keywords, case-insensitive),
 * with a chevron to browse the whole list. For lists too long to scroll through: topics, time zones.
 */
export function SearchSelect(props: SearchSelectProps) {
  const [typed, setTyped] = createSignal("");
  const selected = () => props.options.find((o) => o.value === props.value) ?? null;
  const haystack = createMemo(() => new Map(props.options.map((o) => [o.value, fold(`${o.label} ${o.value} ${o.keywords ?? ""}`)])));

  const shown = createMemo(() => {
    const text = typed().trim();
    // After a pick the field shows that option's label. That shouldn't narrow the list down to it.
    const browsing = !!selected() && text === selected()?.label;
    const needle = browsing || !text ? "" : fold(text);
    return needle ? props.options.filter((o) => haystack().get(o.value)?.includes(needle)) : props.options;
  });

  return (
    <Combobox<SearchOption>
      class={cx(fieldStyles.field, props.class)}
      name={props.name}
      options={shown()}
      optionValue="value"
      optionLabel="label"
      optionTextValue="label"
      defaultFilter={() => true}
      value={selected()}
      onChange={(o) => o && props.onChange(o)}
      onInputChange={setTyped}
      validationState={props.error ? "invalid" : "valid"}
      gutter={4}
      sameWidth
      itemComponent={(p) => (
        <Combobox.Item item={p.item} class={selectStyles.item}>
          <Combobox.ItemLabel>{p.item.rawValue.label}</Combobox.ItemLabel>
          <Combobox.ItemIndicator class={selectStyles.indicator}>
            <Icon name="check" />
          </Combobox.ItemIndicator>
        </Combobox.Item>
      )}
    >
      <Show when={props.name}>
        <Combobox.HiddenSelect />
      </Show>
      <Combobox.Label class={props.hideLabel ? "sr-only" : fieldStyles.label}>{props.label}</Combobox.Label>
      <Combobox.Control class={styles.control}>
        <Combobox.Input id={props.id} class={cx(inputClass, styles.input)} placeholder={props.placeholder} autocomplete="off" />
        <Combobox.Trigger class={styles.trigger} aria-label={props.listLabel}>
          <Combobox.Icon class={styles.icon}>
            <Icon name="chevron-down" />
          </Combobox.Icon>
        </Combobox.Trigger>
      </Combobox.Control>
      <Show
        when={props.error}
        fallback={
          <Show when={props.description}>{(d) => <Combobox.Description class={fieldStyles.description}>{d()}</Combobox.Description>}</Show>
        }
      >
        <Combobox.ErrorMessage class={fieldStyles.error}>{props.error}</Combobox.ErrorMessage>
      </Show>
      <Combobox.Portal>
        <Combobox.Content class={selectStyles.content}>
          <Combobox.Listbox class={selectStyles.listbox} />
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}
