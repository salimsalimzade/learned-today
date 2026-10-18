import { Link, Title } from "@solidjs/meta";
import { createAsync, type RouteDefinition, useParams, useSearchParams } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import { PostList, useListKeys } from "~/components/feed/post-list";
import { NotFound } from "~/components/layout/not-found";
import { Page } from "~/components/layout/page";
import { ListingHeader } from "~/components/topic/listing-header";
import { PeopleList } from "~/components/topic/people-list";
import { TagFilter } from "~/components/topic/tag-filter";
import { Tab, TabPanel, Tabs, TabsList, TagLink, TagList } from "~/components/ui-kit";
import { getPosts, getTopic } from "~/lib/queries/posts";
import styles from "~/styles/pages/listing.module.css";

export const route = {
  preload: ({ params, location }) => {
    void getTopic(params.slug ?? "");
    void getPosts({ topic: params.slug ?? "", tag: new URLSearchParams(location.search).get("tag") ?? undefined });
  },
} satisfies RouteDefinition;

export default function TopicPage() {
  const params = useParams<{ slug: string }>();
  const [search, setSearch] = useSearchParams<{ tag?: string }>();
  const [tab, setTab] = createSignal("posts");
  const topic = createAsync(() => getTopic(params.slug));
  const posts = createAsync(() => getPosts({ topic: params.slug, tag: search.tag || undefined }));
  useListKeys();

  return (
    <Page>
      <Show
        when={topic()}
        fallback={
          <Show when={topic() === null}>
            <NotFound message="That topic doesn't exist." />
          </Show>
        }
      >
        {(tp) => (
          <>
            <Title>{tp().name} · what-did-i-learn-today</Title>
            <Link rel="alternate" type="application/rss+xml" title={tp().name} href={`/topic/${tp().slug}/rss.xml`} />
            <ListingHeader
              eyebrow="Topic"
              title={tp().name}
              stats={`${tp().postCount} notes · ${tp().authorCount} authors`}
              follow={{ type: "topic", slug: tp().slug, name: tp().name }}
            />

            <Tabs value={tab()} onChange={setTab} class={styles.tabs}>
              <TabsList aria-label="Topic sections">
                <Tab value="posts" count={tp().postCount}>
                  Notes
                </Tab>
                <Tab value="tags" count={tp().tags.length}>
                  Tags
                </Tab>
                <Tab value="authors" count={tp().authorCount}>
                  Authors
                </Tab>
              </TabsList>

              <TabPanel value="posts" class={styles.panel}>
                <TagFilter tags={tp().tags} value={search.tag || null} onChange={(tag) => setSearch({ tag: tag ?? undefined })} />
                <PostList posts={posts()} headingLevel={2} />
              </TabPanel>

              <TabPanel value="tags" class={styles.panel}>
                <TagList>
                  <For each={tp().tags}>
                    {(tag) => (
                      <li>
                        <TagLink href={`/tag/${encodeURIComponent(tag.slug)}`} count={tag.count}>
                          {tag.slug}
                        </TagLink>
                      </li>
                    )}
                  </For>
                </TagList>
              </TabPanel>

              <TabPanel value="authors" class={styles.panel}>
                <PeopleList people={tp().authors} />
              </TabPanel>
            </Tabs>
          </>
        )}
      </Show>
    </Page>
  );
}
