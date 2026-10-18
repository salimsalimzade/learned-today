import { createAsync, useAction, useLocation } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import {
  Avatar,
  Button,
  ButtonLink,
  Icon,
  Kbd,
  KbdHint,
  Link,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  showToast,
  TagChip,
  TagList,
} from "~/components/ui-kit";
import { newRssLink, setRssFollow } from "~/lib/actions/rss-feed";
import { cx } from "~/lib/cx";
import { formatDate } from "~/lib/format";
import { getMyPosts } from "~/lib/queries/posts";
import { getMyRssFeed } from "~/lib/queries/rss-feed";
import type { Provider, RssFollow, SessionUser } from "~/lib/types";
import { useSignIn, useSignOut } from "../../overlays/use-sign-in";
import styles from "./account-menu.module.css";

const providerName = (p: Provider) => (p === "github" ? "GitHub" : "Google");

/** Header popover: the avatar opens your account; "Daxil ol" opens sign-in for guests. */
export function AccountMenu(props: { user: SessionUser | null | undefined }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);
  // .latest, not mine(): reading it while it loads would suspend the root <Suspense> and blank the page
  // behind the menu (see command-palette). The section appears once the posts are in.
  const mine = createAsync(async () => (open() && props.user ? getMyPosts() : null));
  const rss = createAsync(async () => (open() && props.user ? getMyRssFeed() : null));
  const follow = useAction(setRssFollow);
  const newLink = useAction(newRssLink);
  const signIn = useSignIn();
  const signOut = useSignOut();
  const close = () => setOpen(false);

  const unfollow = async (f: RssFollow) => {
    const result = await follow({ type: f.type, slug: f.slug }, false).catch(() => null);
    if (!result?.ok) showToast({ title: "Couldn't update your RSS feed.", description: "Try again in a moment.", variant: "error" });
  };
  const copyFeed = async (path: string) => {
    await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
    showToast({ title: "RSS feed link copied.", description: "Paste it into your RSS reader." });
  };
  const replaceLink = async () => {
    const result = await newLink().catch(() => null);
    showToast(
      result?.ok
        ? { title: "Your RSS feed has a new link.", description: "Copy it into your reader; the old one no longer works." }
        : { title: "Couldn't make a new link.", description: "Try again in a moment.", variant: "error" },
    );
  };

  const start = async (provider: Provider) => {
    await signIn.start(provider, location.pathname + location.search);
    close();
  };

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <Show
        when={props.user}
        fallback={
          <PopoverTrigger as={Button} variant="ghost" class={styles.guest} aria-label="Sign in">
            <span class={styles.narrow}>
              <Icon name="person" size={20} />
            </span>
            <span class={styles.wide}>Sign in</span>
          </PopoverTrigger>
        }
      >
        {(user) => (
          <PopoverTrigger as={Button} variant="ghost" icon aria-label={`Account: ${user().name}`}>
            <Avatar name={user().name} src={user().avatarUrl} />
          </PopoverTrigger>
        )}
      </Show>

      <PopoverContent class={styles.popover}>
        <Show
          when={props.user}
          fallback={
            <div class={styles.section}>
              <div class={styles.row}>
                <PopoverTitle as="h2" class={styles.name}>
                  Sign in
                </PopoverTitle>
                <KbdHint>
                  <Kbd>esc</Kbd>
                </KbdHint>
              </div>
              <p class={styles.text}>To react, share notes and see what you've shared in one place.</p>
              <div class={styles.buttons}>
                <Button block onClick={() => start("google")} disabled={signIn.pending()}>
                  Sign in with Google
                </Button>
                <Button block onClick={() => start("github")} disabled={signIn.pending()}>
                  Sign in with GitHub
                </Button>
              </div>
            </div>
          }
        >
          {(user) => (
            <>
              <div class={styles.head}>
                <Avatar name={user().name} src={user().avatarUrl} size="lg" />
                <div class={styles.who}>
                  <PopoverTitle as="h2" class={styles.name}>
                    {user().name}
                  </PopoverTitle>
                  <p class={styles.sub}>
                    {providerName(user().provider)} · @{user().handle}
                  </p>
                </div>
                <span class={styles.esc}>
                  <KbdHint>
                    <Kbd>esc</Kbd>
                  </KbdHint>
                </span>
              </div>

              <Show when={mine.latest}>
                {(m) => (
                  <Show
                    when={m().postCount > 0}
                    fallback={
                      <section class={cx(styles.section, styles.ruled)}>
                        <p class={styles.empty}>You haven't shared anything yet. Notes you share will show up here.</p>
                        <ButtonLink class={styles.cta} href="/share" onClick={close}>
                          What did you learn today?
                        </ButtonLink>
                      </section>
                    }
                  >
                    <section class={cx(styles.posts, styles.ruled)} aria-labelledby="acc-posts">
                      <div class={cx(styles.row, styles.baseline)}>
                        <h3 id="acc-posts" class={styles.caption}>
                          What you've shared
                        </h3>
                        <span class={styles.sub}>{`${m().postCount} notes · ${m().reactionCount} reactions`}</span>
                      </div>
                      <ul class={styles.list}>
                        <For each={m().recent}>
                          {(p) => (
                            <li>
                              <Link class={styles.post} variant="quiet" href={`/post/${p.id}`} onClick={close}>
                                {p.title}
                              </Link>
                              <span class={styles.sub}>{`${formatDate(p.publishedAt)} · ${p.reactions} reactions`}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                      <Link class={styles.more} href={`/author/${user().handle}`} onClick={close}>
                        Your author page
                        <Icon name="arrow-right" />
                      </Link>
                    </section>
                  </Show>
                )}
              </Show>

              <Show when={rss.latest}>
                {(feed) => (
                  <section class={cx(styles.section, styles.ruled)} aria-labelledby="acc-rss">
                    <div class={cx(styles.row, styles.baseline)}>
                      <h3 id="acc-rss" class={styles.caption}>
                        Your RSS feed
                      </h3>
                      <span class={styles.sub}>{`${feed().follows.length} followed`}</span>
                    </div>
                    <Show
                      when={feed().follows.length > 0}
                      fallback={<p class={styles.text}>Add tags and authors from their Follow menu, then read them all at one link.</p>}
                    >
                      <TagList class={styles.follows} aria-label="Followed by RSS">
                        <For each={feed().follows}>
                          {(f) => (
                            <li>
                              <TagChip
                                kind={f.type === "author" ? "topic" : "tag"}
                                end={
                                  <button
                                    type="button"
                                    class={styles.remove}
                                    aria-label={`Remove from your RSS feed: ${f.type === "author" ? f.name : `#${f.name}`}`}
                                    onClick={() => unfollow(f)}
                                  >
                                    <Icon name="x" />
                                  </button>
                                }
                              >
                                {f.name}
                              </TagChip>
                            </li>
                          )}
                        </For>
                      </TagList>
                      <Show when={feed().path}>
                        {(path) => (
                          <>
                            <div class={styles.actions}>
                              <Button onClick={() => copyFeed(path())}>
                                <Icon name="copy" />
                                Copy link
                              </Button>
                              <Button variant="ghost" onClick={replaceLink}>
                                New link
                              </Button>
                            </div>
                            <p class={styles.text}>Keep the link to yourself. A new link stops the old one from working.</p>
                          </>
                        )}
                      </Show>
                    </Show>
                  </section>
                )}
              </Show>

              <div class={styles.foot}>
                <Button
                  variant="ghost"
                  block
                  class={styles["sign-out"]}
                  onClick={async () => {
                    await signOut();
                    close();
                  }}
                >
                  Sign out
                </Button>
              </div>
            </>
          )}
        </Show>
      </PopoverContent>
    </Popover>
  );
}
