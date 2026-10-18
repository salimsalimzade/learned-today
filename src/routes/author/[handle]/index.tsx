import { Link, Title } from "@solidjs/meta";
import { createAsync, type RouteDefinition, useParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import { PostList, useListKeys } from "~/components/feed/post-list";
import { NotFound } from "~/components/layout/not-found";
import { Page } from "~/components/layout/page";
import { ListingHeader } from "~/components/topic/listing-header";
import { Avatar, TagLink, TagList } from "~/components/ui-kit";
import { getAuthor, getPosts } from "~/lib/queries/posts";
import styles from "~/styles/pages/listing.module.css";

// Not designed yet: the topic page layout with an author header (large avatar, handle, stats).

export const route = {
  preload: ({ params }) => {
    void getAuthor(params.handle ?? "");
    void getPosts({ author: params.handle ?? "" });
  },
} satisfies RouteDefinition;

export default function AuthorPage() {
  const params = useParams<{ handle: string }>();
  const author = createAsync(() => getAuthor(params.handle));
  const posts = createAsync(() => getPosts({ author: params.handle }));
  useListKeys();

  return (
    <Page>
      <Show
        when={author()}
        fallback={
          <Show when={author() === null}>
            <NotFound message="That author doesn't exist." />
          </Show>
        }
      >
        {(a) => (
          <>
            <Title>{a().name} · what-did-i-learn-today</Title>
            <Link rel="alternate" type="application/rss+xml" title={a().name} href={`/author/${a().handle}/rss.xml`} />
            <ListingHeader
              eyebrow="Author"
              leading={<Avatar name={a().name} src={a().avatarUrl} size="lg" />}
              title={a().name}
              description={`@${a().handle} · ${a().provider === "github" ? "GitHub" : "Google"}`}
              stats={`${a().postCount} notes · ${a().reactionCount} reactions`}
              follow={{ type: "author", slug: a().handle, name: a().name }}
            />
            <TagList class={styles.related} aria-label="Topics">
              <For each={a().topics}>
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
