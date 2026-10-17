import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import { Popover as KPopover } from "@kobalte/core/popover";
import { Editor as TiptapEditor } from "@tiptap/core";
import { createSignal, createUniqueId, For, getOwner, type JSX, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";
import { createEditorTransaction } from "solid-tiptap";
import { buttonClass, fieldStyles, Icon, type IconName, inputClass, popoverClass } from "~/components/ui-kit";
import { cx, flag } from "~/lib/cx";
import { type MessageKey, useI18n } from "~/lib/i18n";
import { proseClass } from "../../post/prose";
import { BLOCKS, currentBlock } from "./blocks";
import styles from "./editor.module.css";
import { editorExtensions } from "./extensions";
import type { SlashItem, SlashRender } from "./slash";

export interface EditorApi {
  focus: () => void;
  setMarkdown: (markdown: string) => void;
}

interface EditorProps {
  labelId: string;
  describedBy: string;
  /** Read once when the editor mounts (e.g. a saved draft). */
  initial: () => string;
  onChange: (markdown: string) => void;
  onSubmit: () => void;
  invalid?: boolean;
  status?: JSX.Element;
  ref?: (api: EditorApi) => void;
}

/** Markdown without the &nbsp; lines TipTap writes for empty paragraphs. */
function toMarkdown(editor: TiptapEditor) {
  if (editor.isEmpty) return "";
  return editor
    .getMarkdown()
    .replace(/^(?:&nbsp;|\u00a0)[ \t]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** TipTap block editor that reads and writes Markdown. */
export function Editor(props: EditorProps) {
  const { t } = useI18n();
  const owner = getOwner();
  const linkFieldId = createUniqueId();
  const [editor, setEditor] = createSignal<TiptapEditor>();
  const [slash, setSlash] = createStore({
    open: false,
    items: [] as SlashItem[],
    index: 0,
    left: 0,
    top: 0,
    pick: null as null | ((item: SlashItem) => void),
  });
  const [linkOpen, setLinkOpen] = createSignal(false);
  const [linkUrl, setLinkUrl] = createSignal("");
  let mount: HTMLDivElement | undefined;
  let toolbar: HTMLDivElement | undefined;
  let slashList: HTMLUListElement | undefined;

  const place = (rect: DOMRect | null | undefined) => (rect ? { left: rect.left, top: rect.bottom + 8 } : {});
  const slashRender: SlashRender = () => ({
    onStart: (p) => setSlash({ open: true, items: p.items, index: 0, pick: p.command, ...place(p.clientRect?.()) }),
    onUpdate: (p) => setSlash({ items: p.items, index: 0, pick: p.command, ...place(p.clientRect?.()) }),
    onKeyDown: ({ event }) => {
      if (!slash.open) return false;
      const n = slash.items.length;
      if (event.key === "Escape") return setSlash("open", false), true;
      if (!n) return false;
      if (event.key === "ArrowDown") return setSlash("index", (slash.index + 1) % n), scrollSlash(), true;
      if (event.key === "ArrowUp") return setSlash("index", (slash.index - 1 + n) % n), scrollSlash(), true;
      if (event.key === "Enter" || event.key === "Tab") return slash.pick?.(slash.items[slash.index]), true;
      return false;
    },
    onExit: () => setSlash({ open: false, items: [] }),
  });
  const scrollSlash = () => queueMicrotask(() => slashList?.querySelector("[data-highlighted]")?.scrollIntoView({ block: "nearest" }));

  onMount(() => {
    const instance = new TiptapEditor({
      element: mount!,
      extensions: editorExtensions({ t, owner, slash: slashRender, onSubmit: () => props.onSubmit() }),
      content: props.initial(),
      contentType: "markdown",
      editorProps: {
        attributes: {
          class: cx(styles.content, proseClass),
          role: "textbox",
          "aria-multiline": "true",
          "aria-labelledby": props.labelId,
          "aria-describedby": props.describedBy,
        },
      },
      onUpdate: ({ editor }) => props.onChange(toMarkdown(editor)),
    });
    setEditor(instance);
    props.ref?.({
      focus: () => instance.commands.focus(),
      setMarkdown: (md) => {
        instance.commands.setContent(md, { contentType: "markdown" });
        props.onChange(toMarkdown(instance));
      },
    });
    onCleanup(() => instance.destroy());
  });

  const state = createEditorTransaction(editor, (e) => ({
    block: currentBlock(e),
    bold: !!e?.isActive("bold"),
    italic: !!e?.isActive("italic"),
    code: !!e?.isActive("code"),
    link: !!e?.isActive("link"),
    list: !!e?.isActive("bulletList"),
    steps: !!e?.isActive("orderedList"),
    quote: !!e?.isActive("blockquote"),
    codeBlock: !!e?.isActive("codeBlock"),
  }));

  const chain = () => editor()!.chain().focus();

  // Roving focus: arrow keys move between toolbar buttons, Tab leaves the toolbar.
  const onToolbarKey = (e: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) || !toolbar) return;
    const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>("button")];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? buttons.length - 1
          : (i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    e.preventDefault();
    buttons[next]?.focus();
  };

  const ToolButton = (p: { icon: IconName; label: MessageKey; pressed: boolean; run: () => void }) => (
    <button
      type="button"
      class={cx(buttonClass, styles.tool)}
      data-variant="ghost"
      data-icon-only=""
      aria-label={t(p.label)}
      aria-pressed={p.pressed}
      onMouseDown={(e) => e.preventDefault()}
      onClick={p.run}
    >
      <Icon name={p.icon} />
    </button>
  );

  const applyLink = (e: SubmitEvent) => {
    e.preventDefault();
    const href = linkUrl().trim();
    if (href) chain().extendMarkRange("link").setLink({ href }).run();
    else chain().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  };

  return (
    <div class={styles.editor} data-invalid={flag(props.invalid)}>
      <div ref={toolbar} class={styles.toolbar} role="toolbar" aria-label={t("editor.toolbar")} onKeyDown={onToolbarKey}>
        <DropdownMenu placement="bottom-start" gutter={4}>
          <DropdownMenu.Trigger
            class={cx(buttonClass, styles.tool, styles["block-trigger"])}
            data-variant="ghost"
            aria-label={t("editor.blockType", { type: t(state().block.label) })}
          >
            <Icon name={state().block.icon} />
            <span class={styles["block-label"]}>{t(state().block.label)}</span>
            <Icon name="chevron-down" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content class={styles.menu} onCloseAutoFocus={(e) => (e.preventDefault(), editor()?.commands.focus())}>
              <For each={BLOCKS}>
                {(b) => (
                  <DropdownMenu.Item class={styles["menu-item"]} onSelect={() => b.apply(chain()).run()}>
                    <span class={styles["menu-icon"]}>
                      <Icon name={b.icon} />
                    </span>
                    <span class={styles["menu-text"]}>
                      <span class={styles["menu-label"]}>{t(b.label)}</span>
                      <span class={styles["menu-description"]}>{t(b.description)}</span>
                    </span>
                  </DropdownMenu.Item>
                )}
              </For>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
        <span class={styles.sep} aria-hidden="true" />
        <ToolButton icon="bold" label="editor.bold" pressed={state().bold} run={() => chain().toggleBold().run()} />
        <ToolButton icon="italic" label="editor.italic" pressed={state().italic} run={() => chain().toggleItalic().run()} />
        <ToolButton icon="code" label="editor.inlineCode" pressed={state().code} run={() => chain().toggleCode().run()} />
        <KPopover
          open={linkOpen()}
          onOpenChange={(open) => {
            if (open) setLinkUrl(editor()?.getAttributes("link").href ?? "");
            setLinkOpen(open);
          }}
          placement="bottom-start"
          gutter={4}
        >
          <KPopover.Trigger
            class={cx(buttonClass, styles.tool)}
            data-variant="ghost"
            data-icon-only=""
            aria-label={t("editor.link")}
            aria-pressed={state().link}
          >
            <Icon name="link" />
          </KPopover.Trigger>
          <KPopover.Portal>
            <KPopover.Content
              class={cx(popoverClass, styles["link-pop"])}
              onOpenAutoFocus={(e) => (e.preventDefault(), document.getElementById(linkFieldId)?.focus({ preventScroll: true }))}
              onCloseAutoFocus={(e) => (e.preventDefault(), editor()?.commands.focus())}
            >
              <form class={fieldStyles.field} onSubmit={applyLink}>
                <label class={fieldStyles.label} for={linkFieldId}>
                  {t("editor.linkUrl")}
                </label>
                <input
                  id={linkFieldId}
                  class={inputClass}
                  type="url"
                  inputmode="url"
                  placeholder="https://"
                  value={linkUrl()}
                  onInput={(e) => setLinkUrl(e.currentTarget.value)}
                />
                <div class={styles["link-actions"]}>
                  <Show when={state().link}>
                    <button
                      type="button"
                      class={buttonClass}
                      data-variant="ghost"
                      onClick={() => (chain().extendMarkRange("link").unsetLink().run(), setLinkOpen(false))}
                    >
                      {t("editor.linkRemove")}
                    </button>
                  </Show>
                  <button type="submit" class={buttonClass} data-variant="primary">
                    {t("editor.linkApply")}
                  </button>
                </div>
              </form>
            </KPopover.Content>
          </KPopover.Portal>
        </KPopover>
        <span class={styles.sep} aria-hidden="true" />
        <ToolButton icon="list" label="editor.list" pressed={state().list} run={() => chain().toggleBulletList().run()} />
        <ToolButton icon="list-ordered" label="editor.steps" pressed={state().steps} run={() => chain().toggleOrderedList().run()} />
        <ToolButton icon="quote" label="editor.quote" pressed={state().quote} run={() => chain().toggleBlockquote().run()} />
        <ToolButton
          icon="code-block"
          label="editor.codeBlock"
          pressed={state().codeBlock}
          run={() => chain().toggleCodeBlock({ language: "txt" }).run()}
        />
      </div>

      <Show when={!editor()}>
        {/* Same box as the real editor until TipTap mounts, so nothing jumps. */}
        <div class={cx(styles.content, proseClass)} aria-hidden="true">
          <p class="is-empty" data-placeholder={t("share.bodyPlaceholder")} />
        </div>
      </Show>
      <div ref={mount} class={styles.mount} />

      <div class={styles.foot}>
        <span>
          <code>```js</code> {t("share.hintFence")} · <code>/code</code> {t("share.hintSlash")}
        </span>
        {props.status}
      </div>

      <Show when={slash.open && slash.items.length}>
        <Portal>
          <ul
            ref={slashList}
            class={styles.menu}
            role="listbox"
            aria-label={t("editor.slashBlocks")}
            style={{ position: "fixed", left: `${slash.left}px`, top: `${slash.top}px` }}
          >
            <For each={slash.items}>
              {(item, i) => (
                <>
                  <Show when={i() === 0 || slash.items[i() - 1].group !== item.group}>
                    <li class={styles["menu-group"]} role="presentation">
                      {item.group === "blocks" ? t("editor.slashBlocks") : t("editor.slashLangs")}
                    </li>
                  </Show>
                  <li
                    class={styles["menu-item"]}
                    role="option"
                    aria-selected={i() === slash.index}
                    data-highlighted={flag(i() === slash.index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => setSlash("index", i())}
                    onClick={() => slash.pick?.(item)}
                  >
                    <span class={styles["menu-icon"]}>
                      <Icon name={item.icon} />
                    </span>
                    <span class={styles["menu-text"]}>
                      <span class={styles["menu-label"]}>{item.label}</span>
                      <Show when={item.description}>
                        <span class={styles["menu-description"]}>{item.description}</span>
                      </Show>
                    </span>
                    <Show when={item.hint}>
                      <span class={styles["menu-key"]}>{item.hint}</span>
                    </Show>
                  </li>
                </>
              )}
            </For>
          </ul>
        </Portal>
      </Show>
    </div>
  );
}
