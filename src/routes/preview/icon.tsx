import { For } from "solid-js";
import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { ICON_NAMES, Icon } from "~/components/ui-kit";
import styles from "~/styles/pages/preview.module.css";

export default function IconPreview() {
  return (
    <PreviewPage title="Icon" description="Inline SVG, 24×24 grid, 1.75 stroke, currentColor. 16px by default, 20px with size={20}.">
      <Specimen title="All icons">
        {() => (
          <div class={styles.icons}>
            <For each={ICON_NAMES}>
              {(name) => (
                <div class={styles["icon-cell"]}>
                  <Icon name={name} size={20} />
                  <span class={styles["icon-name"]}>{name}</span>
                </div>
              )}
            </For>
          </div>
        )}
      </Specimen>
      <Specimen title="Sizes">
        {() => (
          <>
            <Cell label="16 (default)">
              <Icon name="search" />
            </Cell>
            <Cell label="20">
              <Icon name="search" size={20} />
            </Cell>
            <Cell label="muted (inherits colour)">
              <span style={{ color: "var(--text-muted)" }}>
                <Icon name="moon" size={20} />
              </span>
            </Cell>
            <Cell label="accent">
              <span style={{ color: "var(--accent)" }}>
                <Icon name="check" size={20} />
              </span>
            </Cell>
          </>
        )}
      </Specimen>
    </PreviewPage>
  );
}
