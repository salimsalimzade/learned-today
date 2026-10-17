// Single-key shortcuts ( / n t f j k r ? ). They stay quiet while typing in a field,
// while a dialog is open (unless allowInDialog), and when Ctrl/Cmd/Alt is held.
import { onCleanup, onMount } from "solid-js";

export interface ShortcutOptions {
  allowInDialog?: boolean;
  /** Fire even inside inputs, e.g. Ctrl+Enter to publish. */
  allowInFields?: boolean;
  /** Require Ctrl or Cmd. */
  mod?: boolean;
}

export function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

function dialogOpen() {
  return !!document.querySelector('[role="dialog"][aria-modal="true"]');
}

export function useShortcut(keys: string | string[], handler: (e: KeyboardEvent) => void, opts: ShortcutOptions = {}) {
  const list = Array.isArray(keys) ? keys : [keys];
  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const mod = e.ctrlKey || e.metaKey;
      if (opts.mod ? !mod : mod || e.altKey) return;
      if (!list.includes(e.key)) return;
      if (!opts.allowInFields && isTypingTarget(e.target)) return;
      if (!opts.allowInDialog && dialogOpen()) return;
      handler(e);
    };
    document.addEventListener("keydown", onKey);
    onCleanup(() => document.removeEventListener("keydown", onKey));
  });
}
