import type { ChainedCommands, Editor } from "@tiptap/core";
import type { IconName } from "~/components/ui-kit";

export type BlockId = "text" | "heading" | "list" | "ordered" | "quote" | "code";

export interface BlockDef {
  id: BlockId;
  icon: IconName;
  label: string;
  description: string;
  /** Extra words the slash menu matches on. */
  aliases: string[];
  apply: (chain: ChainedCommands, language?: string) => ChainedCommands;
}

/** Block types offered by the toolbar's block menu and the "/" menu. Markdown keeps all of them. */
export const BLOCKS: BlockDef[] = [
  {
    id: "text",
    icon: "text",
    label: "Text",
    description: "Plain paragraph",
    aliases: ["paragraph", "text"],
    apply: (c) => c.setParagraph(),
  },
  {
    id: "heading",
    icon: "heading",
    label: "Heading",
    description: "Section heading",
    aliases: ["h2", "title", "heading"],
    apply: (c) => c.setHeading({ level: 2 }),
  },
  {
    id: "list",
    icon: "list",
    label: "Bulleted list",
    description: "Points in any order",
    aliases: ["ul", "bullet", "list"],
    apply: (c) => c.toggleBulletList(),
  },
  {
    id: "ordered",
    icon: "list-ordered",
    label: "Numbered list",
    description: "1, 2, 3 in order",
    aliases: ["ol", "numbered", "ordered", "steps"],
    apply: (c) => c.toggleOrderedList(),
  },
  {
    id: "quote",
    icon: "quote",
    label: "Quote",
    description: "Quote or aside",
    aliases: ["blockquote", "quote"],
    apply: (c) => c.toggleBlockquote(),
  },
  {
    id: "code",
    icon: "code-block",
    label: "Code block",
    description: "With syntax colours",
    aliases: ["code", "```"],
    apply: (c, language) => c.setCodeBlock({ language: language ?? "txt" }),
  },
];

export function currentBlock(editor: Editor | undefined): BlockDef {
  const find = (id: BlockId) => BLOCKS.find((b) => b.id === id)!;
  if (!editor) return find("text");
  if (editor.isActive("codeBlock")) return find("code");
  if (editor.isActive("heading")) return find("heading");
  if (editor.isActive("orderedList")) return find("ordered");
  if (editor.isActive("bulletList")) return find("list");
  if (editor.isActive("blockquote")) return find("quote");
  return find("text");
}
