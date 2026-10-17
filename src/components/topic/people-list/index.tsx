import { A } from "@solidjs/router";
import { For } from "solid-js";
import { Avatar } from "~/components/ui-kit";
import { useI18n } from "~/lib/i18n";
import type { AuthorCount } from "~/lib/types";
import styles from "./people-list.module.css";

/** Authors with their note counts (topic page, "Müəlliflər" tab). */
export function PeopleList(props: { people: AuthorCount[] }) {
  const { t } = useI18n();
  return (
    <ul class={styles.list}>
      <For each={props.people}>
        {(a) => (
          <li>
            <A class={styles.person} href={`/author/${a.handle}`}>
              <Avatar name={a.name} src={a.avatarUrl} />
              <span class={styles.name}>{a.name}</span>
              <span class={styles.count}>{t("count.posts", { n: a.count })}</span>
            </A>
          </li>
        )}
      </For>
    </ul>
  );
}
