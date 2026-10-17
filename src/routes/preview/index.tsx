import { For } from "solid-js";
import { PREVIEWS } from "~/components/preview/list";
import { PreviewPage } from "~/components/preview/preview-page";
import { Link } from "~/components/ui-kit";
import styles from "~/styles/pages/preview.module.css";

/** /preview: the base components, each on its own page in light and dark. */
export default function PreviewIndex() {
  return (
    <PreviewPage
      title="Components"
      description="Base components from ui-kit. Each page shows them in a light and a dark panel."
      back={false}
    >
      <ul class={styles.index}>
        <For each={PREVIEWS}>
          {(p) => (
            <li class={styles.row}>
              <Link variant="quiet" class={styles.name} href={`/preview/${p.slug}`}>
                {p.name}
              </Link>
              <span class={styles.slug}>{p.slug}</span>
              <span class={styles.note}>{p.note}</span>
            </li>
          )}
        </For>
      </ul>
    </PreviewPage>
  );
}
