import { For } from "solid-js";
import { TagList, TagToggle } from "~/components/ui-kit";
import { useI18n } from "~/lib/i18n";
import type { TagCount } from "~/lib/types";

/** Single-choice tag chips ("hamısı" + each tag with its count). Pressed chips use accent-soft. */
export function TagFilter(props: { tags: TagCount[]; value: string | null; onChange: (tag: string | null) => void }) {
  const { t } = useI18n();
  return (
    <TagList aria-label={t("topic.filter")}>
      <li>
        <TagToggle noHash pressed={props.value === null} onChange={() => props.onChange(null)}>
          {t("topic.all")}
        </TagToggle>
      </li>
      <For each={props.tags}>
        {(tag) => (
          <li>
            <TagToggle
              pressed={props.value === tag.slug}
              count={tag.count}
              onChange={() => props.onChange(props.value === tag.slug ? null : tag.slug)}
            >
              {tag.slug}
            </TagToggle>
          </li>
        )}
      </For>
    </TagList>
  );
}
