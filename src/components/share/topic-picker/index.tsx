import { createMemo } from "solid-js";
import { type SearchOption, SearchSelect } from "~/components/ui-kit";
import type { TopicChoice } from "~/lib/types";

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
  const options = createMemo<SearchOption[]>(() => props.topics.map((x) => ({ value: x.slug, label: x.name })));
  return (
    <SearchSelect
      id={props.id}
      name="topic"
      label="Topic"
      description="Pick the closest topic."
      placeholder="Search topics"
      listLabel="Open the topic list"
      options={options()}
      value={props.value?.value ?? null}
      onChange={(o) => props.onChange({ value: o.value, label: o.label })}
      error={props.error}
    />
  );
}
