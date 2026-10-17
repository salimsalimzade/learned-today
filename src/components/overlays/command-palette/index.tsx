import { createAsync, useNavigate } from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, type JSX, on, onCleanup, Show } from "solid-js";
import { buttonClass, DialogPrimitive as D, dialogStyles, Icon, type IconName, Kbd, KbdHint } from "~/components/ui-kit";
import { fold, formatDate } from "~/lib/format";
import { useI18n } from "~/lib/i18n";
import { searchAll } from "~/lib/queries/search";
import { useTheme } from "~/lib/theme";
import { useOverlays } from "../overlay-provider";
import styles from "./command-palette.module.css";

interface Item {
  id: string;
  group: string;
  title: JSX.Element;
  meta?: JSX.Element;
  kind?: string;
  icon?: IconName;
  kbd?: string;
  mono?: boolean;
  run: () => void;
}

/** Wrap each match of `q` in <mark>, ignoring case (Azerbaijani rules). */
function highlight(text: string, q: string): JSX.Element {
  const needle = fold(q.trim().replace(/^#/, ""));
  if (!needle) return text;
  const hay = fold(text);
  const out: JSX.Element[] = [];
  let i = 0;
  for (let at = hay.indexOf(needle); at >= 0; at = hay.indexOf(needle, i)) {
    if (at > i) out.push(text.slice(i, at));
    out.push(<mark class={styles.match}>{text.slice(at, at + needle.length)}</mark>);
    i = at + needle.length;
  }
  out.push(text.slice(i));
  return out;
}

/** "/" anywhere, or the header's search button. Searches notes, tags, topics, authors and commands. */
export function CommandPalette() {
  const { t, locale, setLocale } = useI18n();
  const theme = useTheme();
  const overlays = useOverlays();
  const navigate = useNavigate();
  const [query, setQuery] = createSignal("");
  const [debounced, setDebounced] = createSignal("");
  const [active, setActive] = createSignal(0);
  let input: HTMLInputElement | undefined;
  let list: HTMLUListElement | undefined;

  createEffect(
    on(query, (q) => {
      const id = setTimeout(() => setDebounced(q.trim()), 120);
      onCleanup(() => clearTimeout(id));
    }),
  );
  createEffect(
    on(
      () => overlays.paletteOpen(),
      (open) => !open && (setQuery(""), setDebounced("")),
    ),
  );

  const results = createAsync(async () => (overlays.paletteOpen() && debounced() ? searchAll(debounced()) : null));

  const close = () => overlays.setPaletteOpen(false);
  const go = (href: string) => () => {
    close();
    navigate(href);
  };

  const items = createMemo<Item[]>(() => {
    const q = debounced();
    const r = results();
    const out: Item[] = [];
    if (q && r) {
      for (const p of r.posts) {
        const inTitle = fold(p.title).includes(fold(q.replace(/^#/, "")));
        const tag = inTitle ? undefined : p.tags.find((x) => fold(x).includes(fold(q.replace(/^#/, ""))));
        out.push({
          id: `p-${p.id}`,
          group: t("palette.posts"),
          title: highlight(p.title, q),
          meta: (
            <>
              {p.author.name} · {formatDate(p.publishedAt)} · {tag ? <>#{highlight(tag, q)}</> : p.topic.name}
            </>
          ),
          run: go(`/post/${p.id}`),
        });
      }
      for (const tag of r.tags)
        out.push({
          id: `t-${tag.slug}`,
          group: t("palette.tagsTopics"),
          title: <>#{highlight(tag.slug, q)}</>,
          mono: true,
          kind: t("palette.kindTag", { n: tag.count }),
          run: go(`/tag/${encodeURIComponent(tag.slug)}`),
        });
      for (const topic of r.topics)
        out.push({
          id: `c-${topic.slug}`,
          group: t("palette.tagsTopics"),
          title: highlight(topic.name, q),
          kind: t("palette.kindTopic", { n: topic.count }),
          run: go(`/topic/${topic.slug}`),
        });
      for (const a of r.authors)
        out.push({
          id: `a-${a.handle}`,
          group: t("palette.authors"),
          title: highlight(a.name, q),
          kind: t("palette.kindAuthor", { n: a.count }),
          run: go(`/author/${a.handle}`),
        });
    }
    const commands: Item[] = [
      { id: "cmd-new", group: t("palette.commands"), title: t("palette.newNote"), icon: "plus", kbd: "n", run: go("/share") },
      { id: "cmd-theme", group: t("palette.commands"), title: t("palette.toggleTheme"), icon: "moon", kbd: "t", run: () => theme.cycle() },
      {
        id: "cmd-lang",
        group: t("palette.commands"),
        title: t("palette.toggleLang"),
        icon: "text",
        run: () => setLocale(locale() === "az" ? "en" : "az"),
      },
    ];
    // Commands always show, under the results, as in the design.
    return [...out, ...commands];
  });

  createEffect(on(items, () => setActive(0)));
  createEffect(
    on(active, (i) => {
      list?.querySelector(`#${CSS.escape(`pl-${items()[i]?.id ?? ""}`)}`)?.scrollIntoView({ block: "nearest" });
    }),
  );

  const onKeyDown = (e: KeyboardEvent) => {
    const n = items().length;
    if (!n) return;
    if (e.key === "ArrowDown") e.preventDefault(), setActive((active() + 1) % n);
    else if (e.key === "ArrowUp") e.preventDefault(), setActive((active() - 1 + n) % n);
    else if (e.key === "Home") e.preventDefault(), setActive(0);
    else if (e.key === "End") e.preventDefault(), setActive(n - 1);
    else if (e.key === "Enter") {
      e.preventDefault();
      items()[active()]?.run();
    }
  };

  const activeId = () => (items()[active()] ? `pl-${items()[active()].id}` : undefined);
  const showEmpty = () => !!debounced() && results() !== undefined && items().every((i) => i.id.startsWith("cmd-"));

  return (
    <D open={overlays.paletteOpen()} onOpenChange={overlays.setPaletteOpen} modal preventScroll>
      <D.Portal>
        <D.Overlay class={dialogStyles.scrim} />
        <div class={styles.positioner}>
          <D.Content
            class={styles.palette}
            aria-label={t("palette.label")}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              input?.focus({ preventScroll: true });
            }}
          >
            <div class={styles.search}>
              <Icon name="search" size={20} />
              <input
                ref={input}
                class={styles.input}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-autocomplete="list"
                aria-activedescendant={activeId()}
                aria-label={t("palette.inputLabel")}
                placeholder={t("palette.placeholder")}
                autocomplete="off"
                spellcheck={false}
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                onKeyDown={onKeyDown}
              />
              <D.CloseButton class={buttonClass} data-variant="ghost" aria-label={t("common.close")}>
                <Kbd>esc</Kbd>
              </D.CloseButton>
            </div>
            <ul class={styles.list} id="palette-list" role="listbox" ref={list} aria-label={t("palette.label")}>
              <Show when={showEmpty()}>
                <li class={styles.group} role="presentation">
                  {t("palette.empty", { q: debounced() })}
                </li>
              </Show>
              <For each={items()}>
                {(item, i) => (
                  <>
                    <Show when={i() === 0 || items()[i() - 1].group !== item.group}>
                      <li class={styles.group} role="presentation">
                        {item.group}
                      </li>
                    </Show>
                    <li
                      class={styles.item}
                      id={`pl-${item.id}`}
                      role="option"
                      aria-selected={i() === active()}
                      data-highlighted={i() === active() ? "" : undefined}
                      onMouseMove={() => setActive(i())}
                      onClick={() => item.run()}
                    >
                      <Show when={item.icon}>
                        <Icon name={item.icon!} />
                      </Show>
                      <span class={styles.text}>
                        <span class={styles.title} data-mono={item.mono ? "" : undefined}>
                          {item.title}
                        </span>
                        <Show when={item.meta}>
                          <span class={styles.meta}>{item.meta}</span>
                        </Show>
                      </span>
                      <Show when={item.kind}>
                        <span class={styles.kind}>{item.kind}</span>
                      </Show>
                      <Show when={item.kbd || i() === active()}>
                        <Kbd>{item.kbd ?? "↵"}</Kbd>
                      </Show>
                    </li>
                  </>
                )}
              </For>
            </ul>
            <div class={styles.foot}>
              <KbdHint>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> {t("palette.select")}
              </KbdHint>
              <KbdHint>
                <Kbd>↵</Kbd> {t("palette.open")}
              </KbdHint>
              <KbdHint>
                <Kbd>esc</Kbd> {t("palette.close")}
              </KbdHint>
            </div>
          </D.Content>
        </div>
      </D.Portal>
    </D>
  );
}
