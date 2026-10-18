import { Combobox } from "@kobalte/core/combobox";
import { createMemo, createSignal } from "solid-js";
import { fieldStyles, Icon, inputClass, selectStyles } from "~/components/ui-kit";
import { cx } from "~/lib/cx";
import { fold } from "~/lib/format";
import type { TopicChoice } from "~/lib/types";
import styles from "./topic-picker.module.css";

/** One choice in the picker. `value` is the topic's slug. */
export interface TopicOption {
  value: string;
  label: string;
}

interface TopicPickerProps {
  id: string;
  topics: TopicChoice[];
  value: TopicOption | null;
  onChange: (topic: TopicOption | null) => void;
  /** Already translated */
  error?: string;
}

/** Searchable topic field. Typing matches a topic's name or slug. */
export function TopicPicker(props: TopicPickerProps) {
  const [typed, setTyped] = createSignal("");

  const all = createMemo<TopicOption[]>(() => props.topics.map((x) => ({ value: x.slug, label: x.name })));
  const searchable = createMemo(() => new Map(props.topics.map((x) => [x.slug, fold(`${x.name} ${x.slug}`)])));

  const options = createMemo<TopicOption[]>(() => {
    const text = typed().trim();
    // The input shows the chosen topic's label after a pick. That shouldn't narrow the list to it.
    const browsing = !!props.value && text === props.value.label;
    const needle = browsing || !text ? "" : fold(text);
    return needle ? all().filter((o) => searchable().get(o.value)?.includes(needle)) : all();
  });

  return (
    <Combobox<TopicOption>
      class={fieldStyles.field}
      name="topic"
      options={options()}
      optionValue="value"
      optionLabel="label"
      optionTextValue="label"
      defaultFilter={() => true}
      value={props.value}
      onChange={props.onChange}
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
      <Combobox.HiddenSelect />
      <Combobox.Label class={fieldStyles.label}>Topic</Combobox.Label>
      <Combobox.Control class={styles.control}>
        <Combobox.Input id={props.id} class={cx(inputClass, styles.input)} placeholder="Search topics" autocomplete="off" />
        <Combobox.Trigger class={styles.trigger} aria-label="Open the topic list">
          <Combobox.Icon class={styles.icon}>
            <Icon name="chevron-down" />
          </Combobox.Icon>
        </Combobox.Trigger>
      </Combobox.Control>
      <Combobox.Description class={fieldStyles.description}>Pick the closest topic.</Combobox.Description>
      <Combobox.Portal>
        <Combobox.Content class={selectStyles.content}>
          <Combobox.Listbox class={selectStyles.listbox} />
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}
