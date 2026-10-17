import { createAsync, useAction } from "@solidjs/router";
import { createComputed, createSignal, For, on } from "solid-js";
import { showToast, Tooltip, TooltipTrigger } from "~/components/ui-kit";
import { setReaction } from "~/lib/actions/set-reaction";
import { useI18n } from "~/lib/i18n";
import { getSession } from "~/lib/queries/session";
import { applyReaction, REACTIONS, reactionLabelKey } from "~/lib/reactions";
import { useShortcut } from "~/lib/shortcuts";
import type { ReactionCounts, ReactionKind } from "~/lib/types";
import { useOverlays } from "../../overlays/overlay-provider";
import { ReactionTray } from "../reaction-tray";
import styles from "./reactions.module.css";

interface ReactionsProps {
  postId: string;
  counts: ReactionCounts;
  mine: ReactionKind | null;
  /** Post page only: r opens the tray. */
  shortcut?: boolean;
}

/**
 * Pills for reactions that have counts, plus "+" for the tray. One reaction per person:
 * clicking yours removes it, clicking another moves it. Updates optimistically.
 */
export function Reactions(props: ReactionsProps) {
  const { t } = useI18n();
  const overlays = useOverlays();
  const session = createAsync(() => getSession());
  const save = useAction(setReaction);
  const [state, setState] = createSignal({ counts: props.counts, mine: props.mine });
  const [trayOpen, setTrayOpen] = createSignal(false);

  // Server data wins whenever it changes (navigation, revalidation).
  createComputed(
    on(
      () => [props.counts, props.mine] as const,
      ([counts, mine]) => setState({ counts, mine }),
      { defer: true },
    ),
  );

  useShortcut("r", (e) => {
    if (!props.shortcut) return;
    e.preventDefault();
    if (!session()) overlays.requestSignIn("react");
    else setTrayOpen(true);
  });

  const choose = async (kind: ReactionKind) => {
    if (!session()) return overlays.requestSignIn("react");
    const before = state();
    const next = before.mine === kind ? null : kind;
    setState({ counts: applyReaction(before.counts, before.mine, next), mine: next });
    const result = await save(props.postId, next).catch(() => null);
    if (result?.ok) return setState({ counts: result.counts, mine: result.mine });
    setState(before);
    if (result?.reason === "signin") overlays.requestSignIn("react");
    else showToast({ title: t("reactions.failed"), variant: "error" });
  };

  const visible = () => REACTIONS.filter((r) => (state().counts[r.kind] ?? 0) > 0);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a flex row of buttons; a fieldset brings its own border and layout quirks.
    <div class={styles.reactions} role="group" aria-label={t("reactions.group")}>
      <For each={visible()}>
        {(r) => {
          const count = () => state().counts[r.kind] ?? 0;
          const mine = () => state().mine === r.kind;
          const label = () => `${t(reactionLabelKey(r.kind))}: ${count()}${mine() ? `. ${t("reactions.yours")}` : ""}`;
          return (
            <Tooltip content={`${t(reactionLabelKey(r.kind))} · ${t("reactions.people", { n: count() })}`}>
              <TooltipTrigger
                as="button"
                type="button"
                class={styles.pill}
                aria-pressed={mine()}
                aria-label={label()}
                onClick={() => choose(r.kind)}
              >
                <span class={styles.emoji} aria-hidden="true">
                  {r.emoji}
                </span>
                {count()}
              </TooltipTrigger>
            </Tooltip>
          );
        }}
      </For>
      <ReactionTray
        triggerClass={styles.add}
        mine={state().mine}
        open={trayOpen()}
        onOpenChange={(open) => (open && !session() ? overlays.requestSignIn("react") : setTrayOpen(open))}
        onPick={choose}
      />
    </div>
  );
}
