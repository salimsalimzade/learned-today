import { Link, Title } from "@solidjs/meta";
import { createAsync, type RouteDefinition, useParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import { PostList, useListKeys } from "~/components/feed/post-list";
import { NotFound } from "~/components/layout/not-found";
import { Page } from "~/components/layout/page";
import { ListingHeader } from "~/components/topic/listing-header";
import { TagLink, TagList } from "~/components/ui-kit";
import { useI18n } from "~/lib/i18n";
import { getPosts, getTag } from "~/lib/queries/posts";
import styles from "~/styles/pages/listing.module.css";

// Not designed yet: reuses the topic page layout with a tag header, as the canvas note suggests.

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export const route = {
  preload: ({ params }) => {
    void getTag(decode(params.slug ?? ""));
    void getPosts({ tag: decode(params.slug ?? "") });
  },
} satisfies RouteDefinition;

export default function TagPage() {
  const { t } = useI18n();
  const params = useParams<{ slug: string }>();
  const slug = () => decode(params.slug);
  const tag = createAsync(() => getTag(slug()));
  const posts = createAsync(() => getPosts({ tag: slug() }));
  useListKeys();

  return (
    <Page>
      <Show
        when={tag()}
        fallback={
          <Show when={tag() === null}>
            <NotFound message={t("tag.notFound")} />
          </Show>
        }
      >
        {(tg) => (
          <>
            <Title>#{tg().slug} · what-did-i-learn-today</Title>
            <Link
              rel="alternate"
              type="application/rss+xml"
              title={`#${tg().slug}`}
              href={`/tag/${encodeURIComponent(tg().slug)}/rss.xml`}
            />
            <ListingHeader
              eyebrow={t("tag.eyebrow")}
              title={<span class={styles["tag-title"]}>#{tg().slug}</span>}
              stats={t("topic.stats", { posts: tg().postCount, authors: tg().authorCount })}
              follow={{ type: "tag", slug: tg().slug, name: `#${tg().slug}` }}
            />
            <TagList class={styles.related} aria-label={t("tag.topics")}>
              <For each={tg().topics}>
                {(topic) => (
                  <li>
                    <TagLink kind="topic" href={`/topic/${topic.slug}`} count={topic.count}>
                      {topic.name}
                    </TagLink>
                  </li>
                )}
              </For>
            </TagList>
            <div class={styles.body}>
              <PostList posts={posts()} headingLevel={2} />
            </div>
          </>
        )}
      </Show>
    </Page>
  );
}
