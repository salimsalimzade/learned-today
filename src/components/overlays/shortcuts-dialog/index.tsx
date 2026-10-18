import { For, type JSX } from "solid-js";
import { Dialog, Kbd } from "~/components/ui-kit";
import { useOverlays } from "../overlay-provider";
import styles from "./shortcuts-dialog.module.css";

/** The ? key, and "? all shortcuts" in the footer. */
export function ShortcutsDialog() {
  const overlays = useOverlays();
  const rows: [() => JSX.Element, string][] = [
    [() => <Kbd>/</Kbd>, "Open search"],
    [
      () => (
        <>
          <Kbd>j</Kbd> <Kbd>k</Kbd>
        </>
      ),
      "Next, previous note",
    ],
    [() => <Kbd>↵</Kbd>, "Open the selected note"],
    [() => <Kbd>n</Kbd>, "Write a new note"],
    [
      () => (
        <>
          <Kbd>r</Kbd> <span class={styles.then}>then</span> <Kbd>1</Kbd>–<Kbd>6</Kbd>
        </>
      ),
      "Pick a reaction",
    ],
    [() => <Kbd>f</Kbd>, "Follow"],
    [() => <Kbd>t</Kbd>, "Switch theme"],
    [
      () => (
        <>
          <Kbd>Ctrl</Kbd> <Kbd>↵</Kbd>
        </>
      ),
      "Publish the form",
    ],
    [() => <Kbd>esc</Kbd>, "Close"],
    [() => <Kbd>?</Kbd>, "All shortcuts"],
  ];
  return (
    <Dialog open={overlays.shortcutsOpen()} onOpenChange={overlays.setShortcutsOpen} title="Keyboard shortcuts">
      <dl class={styles.keys}>
        <For each={rows}>
          {([keys, label]) => (
            <>
              <dt>{keys()}</dt>
              <dd>{label}</dd>
            </>
          )}
        </For>
      </dl>
    </Dialog>
  );
}
