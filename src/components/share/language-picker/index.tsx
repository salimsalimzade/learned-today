import { Popover as KPopover } from "@kobalte/core/popover";
import { createMemo, createSignal, createUniqueId, For, Show } from "solid-js";
import { Icon, selectStyles } from "~/components/ui-kit";
import { cx, flag } from "~/lib/cx";
import { fold } from "~/lib/format";
import { useI18n } from "~/lib/i18n";
import { LANGUAGES, languageLabel, normalizeLanguage } from "~/lib/languages";
import { readRecentLanguages, rememberLanguage } from "../recent-languages";
import styles from "./language-picker.module.css";

interface Row {
  id: string;
  label: string;
  section: "recent" | "all";
}

/**
 * The language button in a code block's header. Opens a searchable list:
 * "Son istifadə" (recent) first, then every language with its short name.
 */
export function LanguagePicker(props: { value: string; onChange: (id: string) => void; onDone?: () => void }) {
  const { t } = useI18n();
  const listId = createUniqueId();
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [active, setActive] = createSignal(0);
  const [recent, setRecent] = createSignal<string[]>([]);
  let input: HTMLInputElement | undefined;
  let list: HTMLUListElement | undefined;

  const label = (id: string) => languageLabel(id, t("lang.plain"));
  const current = () => normalizeLanguage(props.value);

  const rows = createMemo<Row[]>(() => {
    const q = fold(query().trim());
    const all = LANGUAGES.map((l) => ({ id: l.id, label: label(l.id) }));
    if (q) return all.filter((l) => fold(l.label).includes(q) || l.id.startsWith(q)).map((l) => ({ ...l, section: "all" as const }));
    const rec = recent()
      .filter((id) => LANGUAGES.some((l) => l.id === id))
      .map((id) => ({ id, label: label(id), section: "recent" as const }));
    return [...rec, ...all.filter((l) => !recent().includes(l.id)).map((l) => ({ ...l, section: "all" as const }))];
  });

  const choose = (id: string) => {
    rememberLanguage(id);
    props.onChange(id);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const n = rows().length;
    if (e.key === "ArrowDown" && n) e.preventDefault(), setActive((active() + 1) % n);
    else if (e.key === "ArrowUp" && n) e.preventDefault(), setActive((active() - 1 + n) % n);
    else if (e.key === "Enter" && n) e.preventDefault(), choose(rows()[active()].id);
    else return;
    queueMicrotask(() => list?.querySelector("[data-highlighted]")?.scrollIntoView({ block: "nearest" }));
  };

  const optionId = (i: number) => `${listId}-${i}`;

  return (
    <KPopover
      open={open()}
      onOpenChange={(o) => {
        if (o) {
          setRecent(readRecentLanguages());
          setQuery("");
          setActive(0);
        }
        setOpen(o);
      }}
      placement="bottom-start"
      gutter={4}
    >
      <KPopover.Trigger class={styles.trigger} aria-haspopup="listbox">
        {label(current())}
        <Icon name="chevron-down" />
      </KPopover.Trigger>
      <KPopover.Portal>
        <KPopover.Content
          class={cx(selectStyles.content, styles.panel)}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            input?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(e) => {
            if (props.onDone) {
              e.preventDefault();
              props.onDone();
            }
          }}
        >
          <div class={styles.search}>
            <Icon name="search" />
            <input
              ref={input}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={rows().length ? optionId(active()) : undefined}
              aria-label={t("lang.searchLabel")}
              placeholder={t("lang.search")}
              autocomplete="off"
              spellcheck={false}
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
            />
          </div>
          <ul class={cx(selectStyles.listbox, styles.list)} id={listId} ref={list} role="listbox" aria-label={t("lang.listLabel")}>
            <For each={rows()}>
              {(row, i) => (
                <>
                  <Show when={!query().trim() && (i() === 0 || rows()[i() - 1].section !== row.section)}>
                    <li class={selectStyles.section} role="presentation">
                      {row.section === "recent" ? t("lang.recent") : t("lang.all")}
                    </li>
                  </Show>
                  <li
                    class={selectStyles.item}
                    id={optionId(i())}
                    role="option"
                    aria-selected={row.id === current()}
                    data-selected={flag(row.id === current())}
                    data-highlighted={flag(i() === active())}
                    onMouseMove={() => setActive(i())}
                    onClick={() => choose(row.id)}
                  >
                    {row.label}
                    <Show when={row.id === current()} fallback={<span class={styles.id}>{row.id}</span>}>
                      <span class={selectStyles.indicator}>
                        <Icon name="check" />
                      </span>
                    </Show>
                  </li>
                </>
              )}
            </For>
          </ul>
        </KPopover.Content>
      </KPopover.Portal>
    </KPopover>
  );
}
