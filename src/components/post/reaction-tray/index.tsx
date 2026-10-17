import { Popover as KPopover } from "@kobalte/core/popover";
import { For } from "solid-js";
import { Icon } from "~/components/ui-kit";
import { flag } from "~/lib/cx";
import { useI18n } from "~/lib/i18n";
import { REACTIONS, reactionLabelKey } from "~/lib/reactions";
import type { ReactionKind } from "~/lib/types";
import styles from "./reaction-tray.module.css";

interface TrayProps {
  /** The "+" pill's look, from the Reactions module. */
  triggerClass: string;
  mine: ReactionKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (kind: ReactionKind) => void;
}

/** The "+" pill and the six-emoji tray above it. Arrow keys move, 1–6 pick, Esc closes. */
export function ReactionTray(props: TrayProps) {
  const { t } = useI18n();
  let tray: HTMLDivElement | undefined;

  const pick = (kind: ReactionKind) => {
    props.onPick(kind);
    props.onOpenChange(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const buttons = [...(tray?.querySelectorAll<HTMLButtonElement>(`.${styles.item}`) ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const digit = Number(e.key);
    if (digit >= 1 && digit <= REACTIONS.length) {
      e.preventDefault();
      pick(REACTIONS[digit - 1].kind);
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const n = buttons.length;
      buttons[(i + (e.key === "ArrowRight" ? 1 : -1) + n) % n]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      buttons[e.key === "Home" ? 0 : buttons.length - 1]?.focus();
    }
  };

  return (
    <KPopover open={props.open} onOpenChange={props.onOpenChange} placement="top-start" gutter={8}>
      <KPopover.Trigger class={props.triggerClass} aria-label={t("reactions.add")} aria-keyshortcuts="r">
        <Icon name="plus" />
      </KPopover.Trigger>
      <KPopover.Portal>
        <KPopover.Content
          ref={tray}
          class={styles.tray}
          role="toolbar"
          aria-label={t("reactions.pick")}
          onKeyDown={onKeyDown}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            const idx = Math.max(
              0,
              REACTIONS.findIndex((r) => r.kind === props.mine),
            );
            tray?.querySelectorAll<HTMLButtonElement>(`.${styles.item}`)[idx]?.focus({ preventScroll: true });
          }}
        >
          <For each={REACTIONS}>
            {(r) => (
              <button
                type="button"
                class={styles.item}
                data-pressed={flag(props.mine === r.kind)}
                aria-pressed={props.mine === r.kind}
                aria-label={t(reactionLabelKey(r.kind))}
                aria-keyshortcuts={r.key}
                onClick={() => pick(r.kind)}
              >
                <span aria-hidden="true">{r.emoji}</span>
              </button>
            )}
          </For>
        </KPopover.Content>
      </KPopover.Portal>
    </KPopover>
  );
}
