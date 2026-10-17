import { A } from "@solidjs/router";
import { For } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Avatar, TagLink, TagList } from "~/components/ui-kit";
import { formatDate } from "~/lib/format";
import { useI18n } from "~/lib/i18n";
import type { PostCard } from "~/lib/types";
import { Reactions } from "../../post/reactions";
import styles from "./feed-card.module.css";

/** Title, a ruled meta row (date · topic · tags), excerpt, then byline and reactions. */
export function FeedCard(props: { post: PostCard; headingLevel?: 2 | 3 }) {
  const { t } = useI18n();
  const p = () => props.post;
  return (
    <article class={styles.card} lang={p().lang} data-feed-card="">
      <Dynamic component={props.headingLevel === 2 ? "h2" : "h3"} class={styles.title}>
        <A href={`/post/${p().id}`} data-feed-link="">
          {p().title}
        </A>
      </Dynamic>
      <div class={styles.meta}>
        <time class={styles.date} datetime={p().publishedAt}>
          {formatDate(p().publishedAt)}
        </time>
        <TagList class={styles.tags} aria-label={t("card.topicAndTags")}>
          <li>
            <TagLink kind="topic" href={`/topic/${p().topic.slug}`}>
              {p().topic.name}
            </TagLink>
          </li>
          <For each={p().tags}>
            {(tag) => (
              <li>
                <TagLink href={`/tag/${encodeURIComponent(tag)}`}>{tag}</TagLink>
              </li>
            )}
          </For>
        </TagList>
      </div>
      <p class={styles.excerpt}>{p().excerpt}</p>
      <div class={styles.foot}>
        <span class={styles["byline-row"]}>
          <A class={styles.byline} href={`/author/${p().author.handle}`}>
            <Avatar name={p().author.name} src={p().author.avatarUrl} size="sm" />
            <span>{p().author.name}</span>
          </A>
          <span class={styles.read}>{t("card.readTime", { n: p().readMinutes })}</span>
        </span>
        <Reactions postId={p().id} counts={p().reactions} mine={p().myReaction} />
      </div>
    </article>
  );
}
