import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import { ButtonLink } from "~/components/ui-kit";
import { useI18n } from "~/lib/i18n";
import styles from "./not-found.module.css";

/** 404 content. Sets the response status during SSR. */
export function NotFound(props: { message?: string }) {
  const { t } = useI18n();
  return (
    <div class={styles["not-found"]}>
      <HttpStatusCode code={404} />
      <Title>{t("notFound.title")} · what-did-i-learn-today</Title>
      <h1 class={styles.title}>{t("notFound.title")}</h1>
      <p class={styles.text}>{props.message ?? t("notFound.body")}</p>
      <ButtonLink class={styles.home} href="/">
        {t("notFound.home")}
      </ButtonLink>
    </div>
  );
}
