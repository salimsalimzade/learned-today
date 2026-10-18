import { dayTitle, formatDayKey } from "~/lib/format";
import styles from "./day-head.module.css";

/** Sticky "Today · 15.10.2026" rule above each day's notes. */
export function DayHead(props: { dayKey: string }) {
  return (
    <div class={styles["day-head"]}>
      <h2 class={styles.title}>{dayTitle(props.dayKey)}</h2>
      <time class={styles.date} datetime={props.dayKey}>
        {formatDayKey(props.dayKey)}
      </time>
    </div>
  );
}
