import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import { ButtonLink } from "~/components/ui-kit";
import styles from "./not-found.module.css";

/** 404 content. Sets the response status during SSR. */
export function NotFound(props: { message?: string }) {
  return (
    <div class={styles["not-found"]}>
      <HttpStatusCode code={404} />
      <Title>Page not found · what-did-i-learn-today</Title>
      <h1 class={styles.title}>Page not found</h1>
      <p class={styles.text}>{props.message ?? "There's nothing at this address."}</p>
      <ButtonLink class={styles.home} href="/">
        Back to the feed
      </ButtonLink>
    </div>
  );
}
