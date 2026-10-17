import { dayTitle, formatDayKey } from "~/lib/format";
import { useI18n } from "~/lib/i18n";
import styles from "./day-head.module.css";

/** Sticky "Bu gün · 15.10.2026" rule above each day's notes. */
export function DayHead(props: { dayKey: string }) {
  const { t, locale } = useI18n();
  return (
    <div class={styles["day-head"]}>
      <h2 class={styles.title}>{dayTitle(props.dayKey, locale(), t)}</h2>
      <time class={styles.date} datetime={props.dayKey}>
        {formatDayKey(props.dayKey)}
      </time>
    </div>
  );
}
