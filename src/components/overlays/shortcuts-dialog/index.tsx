import { For, type JSX } from "solid-js";
import { Dialog, Kbd } from "~/components/ui-kit";
import { type MessageKey, useI18n } from "~/lib/i18n";
import { useOverlays } from "../overlay-provider";
import styles from "./shortcuts-dialog.module.css";

/** The ? key, and "? all shortcuts" in the footer. */
export function ShortcutsDialog() {
  const { t } = useI18n();
  const overlays = useOverlays();
  const rows: [() => JSX.Element, MessageKey][] = [
    [() => <Kbd>/</Kbd>, "shortcuts.search"],
    [
      () => (
        <>
          <Kbd>j</Kbd> <Kbd>k</Kbd>
        </>
      ),
      "shortcuts.nextPrev",
    ],
    [() => <Kbd>↵</Kbd>, "shortcuts.open"],
    [() => <Kbd>n</Kbd>, "shortcuts.new"],
    [
      () => (
        <>
          <Kbd>r</Kbd> <span class={styles.then}>{t("shortcuts.then")}</span> <Kbd>1</Kbd>–<Kbd>6</Kbd>
        </>
      ),
      "shortcuts.react",
    ],
    [() => <Kbd>f</Kbd>, "shortcuts.follow"],
    [() => <Kbd>t</Kbd>, "shortcuts.theme"],
    [
      () => (
        <>
          <Kbd>Ctrl</Kbd> <Kbd>↵</Kbd>
        </>
      ),
      "shortcuts.publish",
    ],
    [() => <Kbd>esc</Kbd>, "shortcuts.close"],
    [() => <Kbd>?</Kbd>, "shortcuts.all"],
  ];
  return (
    <Dialog open={overlays.shortcutsOpen()} onOpenChange={overlays.setShortcutsOpen} title={t("shortcuts.title")}>
      <dl class={styles.keys}>
        <For each={rows}>
          {([keys, label]) => (
            <>
              <dt>{keys()}</dt>
              <dd>{t(label)}</dd>
            </>
          )}
        </For>
      </dl>
    </Dialog>
  );
}
