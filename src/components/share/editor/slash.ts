import { type Editor, Extension, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import type { IconName } from "~/components/ui-kit";
import { fold } from "~/lib/format";
import { LANGUAGES, languageLabel } from "~/lib/languages";
import { BLOCKS } from "./blocks";

export interface SlashItem {
  id: string;
  group: "blocks" | "langs";
  label: string;
  description?: string;
  icon: IconName;
  hint?: string;
  run: (editor: Editor, range: Range) => void;
}

/**
 * "/" on an empty line. Matches block names; "/code py" or just "/py"
 * lists code languages, so any language is two keystrokes away.
 */
export function slashItems(query: string): SlashItem[] {
  const q = fold(query.trim());
  const codeQuery = q.match(/^code\s*(.*)$/)?.[1];
  const langQ = codeQuery ?? q;

  const blocks: SlashItem[] = BLOCKS.filter(
    (b) => codeQuery === undefined && (!q || [b.label, b.id, ...b.aliases].some((w) => fold(w).includes(q))),
  ).map((b) => ({
    id: b.id,
    group: "blocks",
    label: b.label,
    description: b.description,
    icon: b.icon,
    run: (editor, range) => b.apply(editor.chain().focus().deleteRange(range)).run(),
  }));

  const langs: SlashItem[] =
    codeQuery !== undefined || (q.length >= 1 && !blocks.length) || (q.length >= 2 && blocks.length < 2)
      ? LANGUAGES.filter((l) => !langQ || l.id.startsWith(langQ) || fold(languageLabel(l.id, "Plain text")).includes(langQ))
          .slice(0, codeQuery !== undefined ? 20 : 6)
          .map((l) => ({
            id: `lang-${l.id}`,
            group: "langs",
            label: languageLabel(l.id, "Plain text"),
            icon: "code-block",
            hint: l.id,
            run: (editor, range) => editor.chain().focus().deleteRange(range).setCodeBlock({ language: l.id }).run(),
          }))
      : [];

  return [...blocks, ...langs];
}

export type SlashRender = NonNullable<SuggestionOptions<SlashItem>["render"]>;

export function SlashCommands(opts: { render: SlashRender }) {
  return Extension.create({
    name: "slashCommands",
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          pluginKey: new PluginKey("slashCommands"),
          char: "/",
          startOfLine: true,
          allowSpaces: true,
          items: ({ query }) => slashItems(query),
          command: ({ editor, range, props }) => props.run(editor, range),
          render: opts.render,
        }),
      ];
    },
  });
}
