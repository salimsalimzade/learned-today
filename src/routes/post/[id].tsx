import { Title } from "@solidjs/meta";
import { createAsync, type RouteDefinition, useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { createEffect, For, Show } from "solid-js";
import { NotFound } from "~/components/layout/not-found";
import { Page } from "~/components/layout/page";
import { AdjacentPosts } from "~/components/post/adjacent-posts";
import { DeletePost } from "~/components/post/delete-post";
import { Prose } from "~/components/post/prose";
import { Reactions } from "~/components/post/reactions";
import { FollowPopover } from "~/components/topic/follow-popover";
import { Avatar, Icon, Kbd, KbdCombo, KbdHint, Link, showToast, TagLink, TagList } from "~/components/ui-kit";
import { formatDate } from "~/lib/format";
import { getPost } from "~/lib/queries/posts";
import { getSession } from "~/lib/queries/session";
import { useShortcut } from "~/lib/shortcuts";
import styles from "~/styles/pages/post.module.css";

export const route = {
  preload: ({ params }) => getPost(params.id ?? ""),
} satisfies RouteDefinition;

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams<{ new?: string }>();
  const post = createAsync(() => getPost(params.id));
  const session = createAsync(() => getSession());

  // Arriving from the share form.
  createEffect(() => {
    if (search.new && post()) {
      showToast({ title: "Shared." });
      setSearch({ new: undefined }, { replace: true });
    }
  });

  useShortcut(["j", "k"], (e) => {
    const p = post();
    const to = e.key === "j" ? p?.next : p?.prev;
    if (to) navigate(`/post/${to.id}`);
  });

  return (
    <Page compact>
      <Show
        when={post()}
        fallback={
          <Show when={post() === null}>
            <NotFound message="That note doesn't exist." />
          </Show>
        }
      >
        {(p) => (
          <>
            <Title>{p().title} · what-did-i-learn-today</Title>
            <Link class={styles.back} variant="muted" href="/">
              <Icon name="arrow-left" />
              Feed
            </Link>

            <article class={styles.article}>
              <h1 class={styles.title}>{p().title}</h1>
              <div class={styles.meta}>
                <div class={styles.byline}>
                  <Avatar name={p().author.name} src={p().author.avatarUrl} />
                  <div class={styles["byline-text"]}>
                    <Link class={styles.author} variant="quiet" href={`/author/${p().author.handle}`}>
                      {p().author.name}
                    </Link>
                    <span class={styles.date}>
                      <time datetime={p().publishedAt}>{formatDate(p().publishedAt)}</time> · {`${p().readMinutes} min read`}
                    </span>
                  </div>
                </div>
                <TagList aria-label="Topic and tags">
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
              <Prose class={styles.body} blocks={p().blocks} />
            </article>

            <section aria-labelledby="rx" class={styles.reactions}>
              <h2 id="rx" class={styles["rx-title"]}>
                What did this note give you?
              </h2>
              <div class={styles["rx-row"]}>
                <Reactions postId={p().id} counts={p().reactions} mine={p().myReaction} shortcut />
                <KbdCombo>
                  <KbdHint>
                    <Kbd>r</Kbd>
                    <Kbd>1</Kbd>–<Kbd>6</Kbd> pick
                  </KbdHint>
                </KbdCombo>
              </div>
              <p class={styles["rx-rule"]}>One reaction per note. Pick another to change it.</p>
            </section>

            <section aria-labelledby="fl" class={styles.section}>
              <h2 id="fl" class={styles["section-title"]}>
                Follow notes like this
              </h2>
              <div class={styles["follow-grid"]}>
                <div class={styles["follow-row"]}>
                  <span>
                    <span class={styles["follow-label"]}>Author:</span> {p().author.name}
                  </span>
                  <FollowPopover target={{ type: "author", slug: p().author.handle, name: p().author.name }} />
                </div>
                <div class={styles["follow-row"]}>
                  <span>
                    <span class={styles["follow-label"]}>Topic:</span> {p().topic.name}
                  </span>
                  <FollowPopover target={{ type: "topic", slug: p().topic.slug, name: p().topic.name }} shortcut />
                </div>
              </div>
            </section>

            <Show when={session()?.handle === p().author.handle}>
              <section aria-label="Your note" class={styles.owner}>
                <DeletePost postId={p().id} />
              </section>
            </Show>

            <AdjacentPosts prev={p().prev} next={p().next} />
          </>
        )}
      </Show>
    </Page>
  );
}
