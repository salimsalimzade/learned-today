import type { NodeViewRenderer } from "@tiptap/core";
import { createSignal, type Owner, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { buttonClass, Icon } from "~/components/ui-kit";
import { cx, flag } from "~/lib/cx";
import { normalizeLanguage } from "~/lib/languages";
import { codeBlockStyles } from "../../post/code-block";
import { LanguagePicker } from "../language-picker";

function CodeBlockHead(props: { lang: string; onLang: (id: string) => void; onDone: () => void; code: () => string }) {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));
  return (
    <>
      <LanguagePicker value={props.lang} onChange={props.onLang} onDone={props.onDone} />
      <button
        type="button"
        class={cx(buttonClass, codeBlockStyles.copy)}
        data-variant="ghost"
        data-copied={flag(copied())}
        aria-label="Copy code"
        onClick={async () => {
          await navigator.clipboard.writeText(props.code());
          setCopied(true);
          clearTimeout(timer);
          timer = setTimeout(() => setCopied(false), 2000);
        }}
      >
        <Icon name={copied() ? "check" : "copy"} />
        {copied() ? "Copied" : "Copy"}
      </button>
    </>
  );
}

/**
 * Code blocks in the editor look like the published ones (code-block module, data-editing) with a
 * language picker and copy button in the header. The header is a small Solid tree rendered
 * with the editor's owner, so it can read the i18n context.
 */
export function codeBlockView(owner: Owner | null): NodeViewRenderer {
  return ({ node, editor, getPos }) => {
    let current = node;
    const dom = document.createElement("figure");
    dom.className = codeBlockStyles.code;
    dom.dataset.editing = "";
    const head = document.createElement("div");
    head.className = codeBlockStyles.head;
    head.contentEditable = "false";
    const pre = document.createElement("pre");
    pre.className = codeBlockStyles.pre;
    const code = document.createElement("code");
    pre.append(code);
    dom.append(head, pre);

    const [lang, setLang] = createSignal<string>(normalizeLanguage(node.attrs.language));
    const dispose = render(
      () => (
        <CodeBlockHead
          lang={lang()}
          code={() => current.textContent}
          onDone={() => editor.commands.focus()}
          onLang={(id) => {
            const pos = typeof getPos === "function" ? getPos() : undefined;
            if (typeof pos !== "number") return;
            editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, language: id }));
          }}
        />
      ),
      head,
      undefined,
      { owner },
    );

    return {
      dom,
      contentDOM: code,
      update(updated) {
        if (updated.type !== current.type) return false;
        current = updated;
        setLang(normalizeLanguage(updated.attrs.language));
        return true;
      },
      stopEvent: (event) => head.contains(event.target as Node),
      ignoreMutation: (m) => head.contains(m.target as Node),
      destroy: dispose,
    };
  };
}
