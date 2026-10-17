import type { ChainedCommands, Editor } from "@tiptap/core";
import type { IconName } from "~/components/ui-kit";
import type { MessageKey } from "~/lib/i18n";

export type BlockId = "text" | "heading" | "list" | "steps" | "quote" | "code";

export interface BlockDef {
  id: BlockId;
  icon: IconName;
  label: MessageKey;
  description: MessageKey;
  /** Extra words the slash menu matches on. */
  aliases: string[];
  apply: (chain: ChainedCommands, language?: string) => ChainedCommands;
}

/** Block types offered by the toolbar's block menu and the "/" menu. Markdown keeps all of them. */
export const BLOCKS: BlockDef[] = [
  {
    id: "text",
    icon: "text",
    label: "editor.text",
    description: "editor.textDesc",
    aliases: ["paragraph", "abzas", "mətn"],
    apply: (c) => c.setParagraph(),
  },
  {
    id: "heading",
    icon: "heading",
    label: "editor.heading",
    description: "editor.headingDesc",
    aliases: ["h2", "title", "başlıq"],
    apply: (c) => c.setHeading({ level: 2 }),
  },
  {
    id: "list",
    icon: "list",
    label: "editor.list",
    description: "editor.listDesc",
    aliases: ["ul", "bullet", "siyahı"],
    apply: (c) => c.toggleBulletList(),
  },
  {
    id: "steps",
    icon: "list-ordered",
    label: "editor.steps",
    description: "editor.stepsDesc",
    aliases: ["ol", "numbered", "addım"],
    apply: (c) => c.toggleOrderedList(),
  },
  {
    id: "quote",
    icon: "quote",
    label: "editor.quote",
    description: "editor.quoteDesc",
    aliases: ["blockquote", "sitat"],
    apply: (c) => c.toggleBlockquote(),
  },
  {
    id: "code",
    icon: "code-block",
    label: "editor.codeBlock",
    description: "editor.codeDesc",
    aliases: ["code", "kod", "```"],
    apply: (c, language) => c.setCodeBlock({ language: language ?? "txt" }),
  },
];

export function currentBlock(editor: Editor | undefined): BlockDef {
  const find = (id: BlockId) => BLOCKS.find((b) => b.id === id)!;
  if (!editor) return find("text");
  if (editor.isActive("codeBlock")) return find("code");
  if (editor.isActive("heading")) return find("heading");
  if (editor.isActive("orderedList")) return find("steps");
  if (editor.isActive("bulletList")) return find("list");
  if (editor.isActive("blockquote")) return find("quote");
  return find("text");
}
