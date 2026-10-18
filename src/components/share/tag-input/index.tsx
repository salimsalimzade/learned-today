import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from "solid-js";
import { FieldCounter, fieldStyles, Icon, TagChip, tagStyles } from "~/components/ui-kit";
import { cx, flag } from "~/lib/cx";
import { normalizeTag, TAG_PATTERN, TAGS_MAX } from "~/lib/schemas/post";
import styles from "./tag-input.module.css";

interface TagInputProps {
  id: string;
  name: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Already translated */
  error?: string;
}

/**
 * Chips in a single-line field. # / Enter / space / comma adds, Backspace on an empty
 * input removes the last chip. Chips that don't fit collapse into "+N"; clicking it
 * lets the field wrap so every chip shows. Each chip posts as a hidden `tags` input.
 */
export function TagInput(props: TagInputProps) {
  const [draft, setDraft] = createSignal("");
  const [hidden, setHidden] = createSignal(0);
  const [expanded, setExpanded] = createSignal(false);
  const [invalid, setInvalid] = createSignal(false);
  let box: HTMLDivElement | undefined;
  let input: HTMLInputElement | undefined;

  const commit = (raw = draft()) => {
    const tag = normalizeTag(raw);
    setDraft("");
    if (!tag) return;
    if (!TAG_PATTERN.test(tag)) return setInvalid(true);
    setInvalid(false);
    if (props.value.includes(tag) || props.value.length >= TAGS_MAX) return;
    props.onChange([...props.value, tag]);
  };

  const remove = (tag: string) => {
    props.onChange(props.value.filter((x) => x !== tag));
    input?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      if (draft().trim()) {
        e.preventDefault();
        commit();
      } else if (e.key === "Enter") e.preventDefault();
    } else if (e.key === "Backspace" && !draft() && props.value.length) {
      e.preventDefault();
      props.onChange(props.value.slice(0, -1));
    }
  };

  // How many chips fit on one line next to a 72px input and the +N chip?
  const measure = () => {
    if (!box || expanded()) return setHidden(0);
    const chips = [...box.querySelectorAll<HTMLElement>("[data-chip]")];
    for (const c of chips) c.hidden = false;
    const room = box.clientWidth - 16 - 72 - 44;
    let used = 0;
    let fit = chips.length;
    for (let i = 0; i < chips.length; i++) {
      used += chips[i].offsetWidth + 6;
      if (used > room + (i === chips.length - 1 ? 44 : 0)) {
        fit = i;
        break;
      }
    }
    chips.forEach((c, i) => {
      c.hidden = i >= fit;
    });
    setHidden(chips.length - fit);
  };

  onMount(() => {
    const ro = new ResizeObserver(() => measure());
    if (box) ro.observe(box);
    onCleanup(() => ro.disconnect());
  });
  createEffect(on([() => props.value.length, expanded], () => queueMicrotask(measure)));

  const hiddenTags = () => props.value.slice(props.value.length - hidden());

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: clicking the box focuses the input, which already takes the keyboard. */}
      <div
        ref={box}
        class={styles.box}
        data-expanded={flag(expanded())}
        aria-invalid={props.error || invalid() ? "true" : undefined}
        onClick={(e) => e.target === box && input?.focus()}
        onFocusOut={(e) => !box?.contains(e.relatedTarget as Node | null) && setExpanded(false)}
      >
        <For each={props.value}>
          {(tag) => (
            <span class={styles.chip} data-chip="">
              <TagChip
                end={
                  <button type="button" class={styles.remove} aria-label={`Remove tag: ${tag}`} onClick={() => remove(tag)}>
                    <Icon name="x" />
                  </button>
                }
              >
                {tag}
              </TagChip>
              <input type="hidden" name={props.name} value={tag} />
            </span>
          )}
        </For>
        <Show when={hidden() > 0}>
          <button
            type="button"
            class={cx(tagStyles.tag, styles.more)}
            aria-label={`${hidden()} more tags: ${hiddenTags().join(", ")}`}
            onClick={() => setExpanded(true)}
          >
            +{hidden()}
          </button>
        </Show>
        <input
          ref={input}
          id={props.id}
          type="text"
          class={styles.draft}
          placeholder={props.value.length < TAGS_MAX ? "#tag" : ""}
          disabled={props.value.length >= TAGS_MAX}
          aria-describedby={`${props.id}-d`}
          autocomplete="off"
          spellcheck={false}
          value={draft()}
          onInput={(e) => {
            setInvalid(false);
            setDraft(e.currentTarget.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => commit()}
        />
      </div>
      <div class={fieldStyles.foot}>
        <Show
          when={props.error || invalid()}
          fallback={
            <p class={fieldStyles.description} id={`${props.id}-d`}>
              Type #, press Enter or space to add. Up to 5.
            </p>
          }
        >
          <p class={fieldStyles.error} id={`${props.id}-d`}>
            {props.error ?? "Tags can only have letters, digits and hyphens."}
          </p>
        </Show>
        <FieldCounter value={props.value.length} max={TAGS_MAX} />
      </div>
    </>
  );
}
