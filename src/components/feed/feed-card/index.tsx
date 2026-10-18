import { A } from "@solidjs/router";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Avatar, Icon, TagLink, TagList } from "~/components/ui-kit";
import { CARD_BODY_MAX } from "~/lib/card-preview";
import { flag } from "~/lib/cx";
import { formatDate } from "~/lib/format";
import type { PostCard } from "~/lib/types";
import { Prose } from "../../post/prose";
import { Reactions } from "../../post/reactions";
import styles from "./feed-card.module.css";

/**
 * Title, a ruled meta row (date · topic · tags), the note itself, then byline and reactions. A long note is
 * cut at CARD_BODY_MAX with a fade and a "Read more" link (lib/markdown toCardPreview).
 */
export function FeedCard(props: { post: PostCard; headingLevel?: 2 | 3 }) {
  const p = () => props.post;
  // Opening a long code block lifts the clamp. Until measured in the browser, trust the server's estimate.
  const [open, setOpen] = createSignal(false);
  const [clipped, setClipped] = createSignal(p().preview.truncated);
  let body: HTMLDivElement | undefined;

  onMount(() => {
    if (!body) return;
    const el = body;
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    measure();
    onCleanup(() => observer.disconnect());
  });

  const clamped = () => p().preview.truncated && !open();
  // A link or Copy button below the cut gets keyboard focus: show the whole note instead of scrolling inside.
  const onFocusIn = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (clamped() && body && target.getBoundingClientRect().bottom > body.getBoundingClientRect().bottom) setOpen(true);
  };
  // Shown when blocks were left out, or while the last one is still cut off.
  const showMore = () => p().preview.truncated && (p().preview.hidden > 0 || (clamped() && clipped()));

  return (
    <article class={styles.card} data-feed-card="" style={{ "--card-body-max": `${CARD_BODY_MAX}px` }}>
      <Dynamic component={props.headingLevel === 2 ? "h2" : "h3"} class={styles.title}>
        <A href={`/post/${p().id}`} data-feed-link="">
          {p().title}
        </A>
      </Dynamic>
      <div class={styles.meta}>
        <time class={styles.date} datetime={p().publishedAt}>
          {formatDate(p().publishedAt)}
        </time>
        <TagList class={styles.tags} aria-label="Topic and tags">
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
      <div ref={body} class={styles.body} data-clamped={flag(clamped())} data-clipped={flag(clamped() && clipped())} onFocusIn={onFocusIn}>
        <Prose blocks={p().preview.blocks} compact onCodeExpand={() => setOpen(true)} />
      </div>
      <Show when={showMore()}>
        <A class={styles.more} href={`/post/${p().id}`} aria-label={`Read more: ${p().title}`}>
          Read more
          <Icon name="arrow-right" />
        </A>
      </Show>
      <div class={styles.foot}>
        <span class={styles["byline-row"]}>
          <A class={styles.byline} href={`/author/${p().author.handle}`}>
            <Avatar name={p().author.name} src={p().author.avatarUrl} size="sm" />
            <span>{p().author.name}</span>
          </A>
          <span class={styles.read}>{`${p().readMinutes} min read`}</span>
        </span>
        <Reactions postId={p().id} counts={p().reactions} mine={p().myReaction} />
      </div>
    </article>
  );
}
