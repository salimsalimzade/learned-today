import { Extension } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import type { Owner } from "solid-js";
import { normalizeLanguage } from "~/lib/languages";
import { lowlight } from "~/lib/lowlight";
import { codeBlockView } from "./code-block-view";
import { SlashCommands, type SlashRender } from "./slash";

/** "```js" then Enter turns the line into a JavaScript code block (Space works too, via TipTap's input rule). */
const FenceEnter = Extension.create({
  name: "fenceEnter",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parent.type.name !== "paragraph" || $from.parentOffset !== $from.parent.content.size) return false;
        const m = $from.parent.textContent.match(/^```([\w#+-]*)$/);
        if (!m) return false;
        return editor
          .chain()
          .deleteRange({ from: $from.start(), to: $from.end() })
          .setCodeBlock({ language: normalizeLanguage(m[1] || "txt") })
          .run();
      },
    };
  },
});

/** Ctrl/Cmd+Enter publishes instead of inserting a line break. */
const SubmitShortcut = (onSubmit: () => void) =>
  Extension.create({
    name: "submitShortcut",
    priority: 1000,
    addKeyboardShortcuts() {
      return {
        "Mod-Enter": () => {
          onSubmit();
          return true;
        },
      };
    },
  });

export function editorExtensions(opts: { owner: Owner | null; slash: SlashRender; onSubmit: () => void }) {
  return [
    StarterKit.configure({
      codeBlock: false,
      underline: false,
      strike: false,
      horizontalRule: false,
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { rel: "nofollow ugc noopener noreferrer", target: null },
      },
    }),
    CodeBlockLowlight.extend({ addNodeView: () => codeBlockView(opts.owner) }).configure({ lowlight, defaultLanguage: "txt" }),
    Placeholder.configure({ placeholder: () => "What did you learn? Type / to add a block." }),
    Markdown,
    FenceEnter,
    SubmitShortcut(opts.onSubmit),
    SlashCommands({ render: opts.slash }),
  ];
}
