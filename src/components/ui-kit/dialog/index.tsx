import { Dialog as KDialog } from "@kobalte/core/dialog";
import { type JSX, type ParentProps, Show } from "solid-js";
import { cx } from "~/lib/cx";
import buttonStyles from "../button/button.module.css";
import { Icon } from "../icon";
import styles from "./dialog.module.css";

interface DialogProps extends ParentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: JSX.Element;
  description?: JSX.Element;
  class?: string;
}

/** Kobalte Dialog: title, close button, optional description, then your content. */
export function Dialog(props: DialogProps) {
  return (
    <KDialog open={props.open} onOpenChange={props.onOpenChange} modal preventScroll>
      <KDialog.Portal>
        <KDialog.Overlay class={styles.scrim} />
        <div class={styles.positioner}>
          <KDialog.Content class={cx(styles.dialog, props.class)}>
            <div class={styles.head}>
              <KDialog.Title class={styles.title}>{props.title}</KDialog.Title>
              <KDialog.CloseButton class={cx(buttonStyles.button, styles.close)} data-variant="ghost" data-icon-only="" aria-label="Close">
                <Icon name="x" size={20} />
              </KDialog.CloseButton>
            </div>
            <Show when={props.description}>{(d) => <KDialog.Description class={styles.description}>{d()}</KDialog.Description>}</Show>
            {props.children}
          </KDialog.Content>
        </div>
      </KDialog.Portal>
    </KDialog>
  );
}

export function DialogBody(props: ParentProps & { class?: string }) {
  return <div class={cx(styles.body, props.class)}>{props.children}</div>;
}

/** Buttons, stacked full-width on phones and right-aligned from 600px. Put the primary action last. */
export function DialogActions(props: ParentProps) {
  return <div class={styles.actions}>{props.children}</div>;
}

export function DialogNote(props: ParentProps & { class?: string }) {
  return <p class={cx(styles.note, props.class)}>{props.children}</p>;
}

/** Raw Kobalte parts and the shared styles, for overlays with their own layout (the command palette). */
export const DialogPrimitive = KDialog;
export const dialogStyles = styles;
