// Generates src/styles/tokens.css from src/styles/tokens.json (the design system's source).
// Run with `pnpm tokens` after changing tokens.json. Never edit tokens.css by hand.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../src/styles/", import.meta.url));
const t = JSON.parse(readFileSync(`${dir}tokens.json`, "utf8"));

const comment = (s) => (s ? ` /* ${s.replace(/\*\//g, "* /")} */` : "");
// "{accent}" → var(--accent)
const ref = (v) => String(v).replace(/^\{(.+)\}$/, "var(--$1)");

const out = [];
out.push(`/* ${t.name} design tokens. Generated from tokens.json by scripts/build-tokens.mjs. Do not edit. */`, "");
// Layer order for the whole app (see base.css). Declared here because tokens.css loads first.
out.push("@layer base, ui;", "");

// Fonts
for (const f of t.type.fonts) {
  out.push(
    "@font-face {",
    `  font-family: "${f.family}";`,
    `  src: url("${f.file}") format("woff2");`,
    `  font-weight: ${f.weight};`,
    `  font-style: ${f.style};`,
    "  font-display: swap;",
    ...(f.unicodeRange ? [`  unicode-range: ${f.unicodeRange};`] : []),
    "}",
  );
}
// Metric-matched stand-ins built from installed fonts, used while the web fonts load.
for (const f of t.type.fallbacks ?? []) {
  out.push(
    `/* ${f.usage} */`,
    "@font-face {",
    `  font-family: "${f.family}";`,
    `  src: ${f.local.map((name) => `local("${name}")`).join(", ")};`,
    `  size-adjust: ${f.sizeAdjust};`,
    `  ascent-override: ${f.ascentOverride};`,
    `  descent-override: ${f.descentOverride};`,
    `  line-gap-override: ${f.lineGapOverride};`,
    "}",
  );
}
out.push("");

// Colours: light on :root, dark on [data-theme="dark"], and dark for "system" before the
// boot script runs or without JavaScript.
const colours = (theme, withUsage) =>
  t.color.tokens.map((c) => {
    const v = typeof c.value === "string" ? ref(c.value) : c.value[theme];
    return `  --${c.name}: ${v};${withUsage ? comment(c.usage) : ""}`;
  });
out.push(':root, [data-theme="light"] {', ...colours("light", true), "}");
out.push('[data-theme="dark"] {', ...colours("dark", false), "}");
out.push(
  "@media (prefers-color-scheme: dark) {",
  '  :root:not([data-theme="light"]) {',
  ...colours("dark", false).map((l) => `  ${l}`),
  "  }",
  "}",
  "",
);

// Everything else
const groups = ["spacing", "radius", "size", "stroke", "transition", "layer"];
out.push(":root {");
for (const g of groups) {
  out.push(`  /* ${g}${t[g].note ? `: ${t[g].note}` : ""} */`);
  for (const tok of t[g].tokens) out.push(`  --${tok.name}: ${tok.value};${comment(tok.usage)}`);
}
out.push("  /* type */");
out.push(`  --font-sans: ${t.type.families.sans};`);
out.push(`  --font-mono: ${t.type.families.mono};`);
const styles = t.type.groups.flatMap((g) => g.styles.map((s) => ({ ...s, family: g.family })));
for (const s of styles) {
  out.push(`  --text-${s.name}: ${s.fontWeight} ${s.fontSize}/${s.lineHeight} var(--font-${s.family});${comment(s.usage)}`);
  out.push(`  --tracking-${s.name}: ${s.letterSpacing ?? "0"};`);
}
out.push("}", "");

// One utility class per type style, for previews and plain markup.
for (const s of styles) {
  out.push(
    `.type-${s.name} {`,
    `  font: var(--text-${s.name});`,
    `  letter-spacing: var(--tracking-${s.name});`,
    ...(s.family === "mono" ? ["  font-variant-ligatures: none;", "  font-variant-numeric: tabular-nums;"] : []),
    "}",
  );
}

writeFileSync(`${dir}tokens.css`, `${out.join("\n")}\n`);
console.log(`tokens.css: ${t.color.tokens.length} colours, ${styles.length} type styles, ${t.type.fonts.length} font files`);
