import { Toast as KToast, toaster } from "@kobalte/core/toast";
import { onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import buttonStyles from "../button/button.module.css";
import { Icon } from "../icon";
import styles from "./toast.module.css";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "error" | "warning";
  /** Replaces the close button, e.g. "Undo" or "Try again". */
  action?: { label: string; onClick: () => void };
  duration?: number;
}

let closeLabel = "Close";

/** Show a toast from anywhere on the client. Errors are announced assertively. */
export function showToast(o: ToastOptions) {
  return toaster.show((p) => (
    <KToast
      toastId={p.toastId}
      class={styles.toast}
      data-variant={o.variant}
      duration={o.duration ?? 5000}
      priority={o.variant === "error" ? "high" : "low"}
    >
      <div class={styles.body}>
        <KToast.Title class={styles.title}>{o.title}</KToast.Title>
        <Show when={o.description}>
          <KToast.Description class={styles.description}>{o.description}</KToast.Description>
        </Show>
      </div>
      <div class={styles.actions}>
        <Show
          when={o.action}
          fallback={
            <KToast.CloseButton class={buttonStyles.button} data-variant="ghost" data-icon-only="" aria-label={closeLabel}>
              <Icon name="x" />
            </KToast.CloseButton>
          }
        >
          {(action) => (
            <button
              type="button"
              class={buttonStyles.button}
              data-variant="ghost"
              onClick={() => {
                action().onClick();
                toaster.dismiss(p.toastId);
              }}
            >
              {action().label}
            </button>
          )}
        </Show>
      </div>
    </KToast>
  ));
}

/** Mount once, in app.tsx. Bottom centre on phones, bottom right from 600px. */
export function ToastRegion() {
  onMount(() => (closeLabel = "Close"));
  return (
    <Portal>
      <KToast.Region class={styles.region} swipeDirection="right">
        <KToast.List class={styles.list} />
      </KToast.Region>
    </Portal>
  );
}
