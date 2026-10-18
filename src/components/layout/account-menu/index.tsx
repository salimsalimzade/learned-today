import { createAsync, useLocation } from "@solidjs/router";
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
} from "~/components/ui-kit";
import { cx } from "~/lib/cx";
import { formatDate } from "~/lib/format";
import { getMyPosts } from "~/lib/queries/posts";
import type { Provider, SessionUser } from "~/lib/types";
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
  const signIn = useSignIn();
  const signOut = useSignOut();
  const close = () => setOpen(false);

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
