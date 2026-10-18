import { For } from "solid-js";
import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import styles from "~/styles/pages/preview.module.css";
import tokens from "~/styles/tokens.json";

type Theme = "light" | "dark";
const px = (v: string) => Number.parseInt(v, 10);

/** /preview/tokens: everything in tokens.json, read through the CSS variables it generates. */
export default function TokensPreview() {
  const typeStyles = tokens.type.groups.flatMap((g) => g.styles.map((s) => ({ ...s, family: g.family })));
  return (
    <PreviewPage title="Tokens" description="From src/styles/tokens.json. Run pnpm tokens after editing it to rebuild tokens.css.">
      <Specimen title="Colour" note="Swatches use the CSS variable; the text shows the value for that theme.">
        {(theme) => (
          <div class={styles.swatches}>
            <For each={tokens.color.tokens}>
              {(c) => (
                <div class={styles.swatch} title={c.usage}>
                  <span class={styles.chip} style={{ background: `var(--${c.name})` }} />
                  <span class={styles["swatch-name"]}>--{c.name}</span>
                  <span class={styles["swatch-value"]}>{(c.value as Record<Theme, string>)[theme ?? "light"]}</span>
                </div>
              )}
            </For>
          </div>
        )}
      </Specimen>

      <Specimen
        title="Type"
        note="Inter for UI and reading, JetBrains Mono for code, dates and tags. Utility class: .type-<name>, variable: --text-<name>."
        stack
      >
        {() => (
          <div class={styles["type-list"]}>
            <For each={typeStyles}>
              {(s) => (
                <div class={styles["type-row"]}>
                  <span class={styles["type-meta"]}>
                    {s.name} · {s.fontWeight} {s.fontSize}/{s.lineHeight}
                    {"letterSpacing" in s && s.letterSpacing ? ` · ${s.letterSpacing}` : ""}
                  </span>
                  <span class={`type-${s.name}`}>{s.sample}</span>
                  <span class={styles["type-usage"]}>{s.usage}</span>
                </div>
              )}
            </For>
          </div>
        )}
      </Specimen>

      <Specimen title="Fonts" note={tokens.type.fontsNote} stack>
        {() => (
          <>
            <div class={styles.font} style={{ "font-family": "var(--font-sans)" }}>
              <span class={styles["type-meta"]}>Inter · 100–900 · roman + italic · Latin</span>
              <p class={styles["font-sample"]}>What did you learn today? Aa Gg Ii Ss Cc Oo Uu</p>
              <div class={styles["font-weights"]}>
                <For each={[400, 500, 600, 650, 700]}>{(w) => <span style={{ "font-weight": w }}>{w} Aa</span>}</For>
                <span style={{ "font-style": "italic" }}>italic Aa</span>
              </div>
            </div>
            <div class={styles.font} style={{ "font-family": "var(--font-mono)", "font-variant-ligatures": "none" }}>
              <span class={styles["type-meta"]}>JetBrains Mono · 100–800 · roman + italic</span>
              <p class={styles["font-sample"]}>{"const x = a !== b ?? 0; // 15.10.2026"}</p>
              <div class={styles["font-weights"]}>
                <For each={[400, 500, 600, 700]}>
                  {(w) => (
                    <span style={{ "font-weight": w }}>
                      {w} {"{}"}
                    </span>
                  )}
                </For>
                <span style={{ "font-style": "italic" }}>{"// italic comment"}</span>
              </div>
            </div>
          </>
        )}
      </Specimen>

      <Specimen title="Spacing" note={tokens.spacing.note} site>
        {() => (
          <div class={styles.scale}>
            <For each={tokens.spacing.tokens}>
              {(t) => (
                <div class={styles["scale-row"]} title={t.usage}>
                  <span class={styles["scale-name"]}>--{t.name}</span>
                  <span class={styles["scale-value"]}>{t.value}</span>
                  <span class={styles.bar} style={{ width: `${px(t.value) * 2}px` }} />
                </div>
              )}
            </For>
          </div>
        )}
      </Specimen>

      <Specimen title="Radius" note={tokens.radius.note} site>
        {() => (
          <For each={tokens.radius.tokens}>
            {(t) => (
              <Cell label={`--${t.name} · ${t.value}`}>
                <span class={styles["radius-box"]} style={{ "border-radius": `var(--${t.name})` }} />
              </Cell>
            )}
          </For>
        )}
      </Specimen>

      <Specimen title="Size and stroke" note={tokens.size.note} site>
        {() => (
          <div class={styles.scale}>
            <For each={[...tokens.size.tokens, ...tokens.stroke.tokens]}>
              {(t) => (
                <div class={styles["scale-row"]} title={t.usage}>
                  <span class={styles["scale-name"]}>--{t.name}</span>
                  <span class={styles["scale-value"]}>{t.value}</span>
                  <span class={styles["type-usage"]}>{t.usage}</span>
                </div>
              )}
            </For>
          </div>
        )}
      </Specimen>
    </PreviewPage>
  );
}
