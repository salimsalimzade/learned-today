// Code languages offered in the editor's picker and labelled on code blocks.
// `id` is what goes after ``` in Markdown; lowlight knows each one as a name or alias.
export interface CodeLanguage {
  id: string;
  label: string;
}

export const LANGUAGES: CodeLanguage[] = [
  { id: "js", label: "JavaScript" },
  { id: "ts", label: "TypeScript" },
  { id: "sh", label: "Bash" },
  { id: "c", label: "C" },
  { id: "cs", label: "C#" },
  { id: "cpp", label: "C++" },
  { id: "css", label: "CSS" },
  { id: "go", label: "Go" },
  { id: "html", label: "HTML" },
  { id: "java", label: "Java" },
  { id: "json", label: "JSON" },
  { id: "kt", label: "Kotlin" },
  { id: "php", label: "PHP" },
  { id: "py", label: "Python" },
  { id: "rs", label: "Rust" },
  { id: "sql", label: "SQL" },
  { id: "swift", label: "Swift" },
  { id: "yml", label: "YAML" },
  { id: "txt", label: "" }, // label comes from i18n: lang.plain
];

const ALIASES: Record<string, string> = {
  javascript: "js",
  jsx: "js",
  mjs: "js",
  typescript: "ts",
  tsx: "ts",
  bash: "sh",
  shell: "sh",
  zsh: "sh",
  csharp: "cs",
  "c++": "cpp",
  xml: "html",
  kotlin: "kt",
  python: "py",
  rust: "rs",
  yaml: "yml",
  text: "txt",
  plaintext: "txt",
  plain: "txt",
};

export function normalizeLanguage(lang: string | null | undefined): string {
  const l = (lang ?? "").trim().toLowerCase();
  if (!l) return "txt";
  const id = ALIASES[l] ?? l;
  return LANGUAGES.some((x) => x.id === id) ? id : "txt";
}

export function languageLabel(id: string, plainLabel: string) {
  const found = LANGUAGES.find((x) => x.id === normalizeLanguage(id));
  return found?.label ? found.label : plainLabel;
}
