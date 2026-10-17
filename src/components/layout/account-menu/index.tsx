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
import { isMock } from "~/lib/env";
import { formatDate } from "~/lib/format";
import { useI18n } from "~/lib/i18n";
import { getMyPosts } from "~/lib/queries/posts";
import type { Provider, SessionUser } from "~/lib/types";
import { useSignIn, useSignOut } from "../../overlays/use-sign-in";
import styles from "./account-menu.module.css";

const providerName = (p: Provider) => (p === "github" ? "GitHub" : "Google");

/** Header popover: the avatar opens your account; "Daxil ol" opens sign-in for guests. */
export function AccountMenu(props: { user: SessionUser | null | undefined }) {
  const { t } = useI18n();
  const location = useLocation();
  const [open, setOpen] = createSignal(false);
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
          <PopoverTrigger as={Button} variant="ghost" class={styles.guest} aria-label={t("header.signIn")}>
            <span class={styles.narrow}>
              <Icon name="person" size={20} />
            </span>
            <span class={styles.wide}>{t("header.signIn")}</span>
          </PopoverTrigger>
        }
      >
        {(user) => (
          <PopoverTrigger as={Button} variant="ghost" icon aria-label={t("header.account", { name: user().name })}>
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
                  {t("signin.title")}
                </PopoverTitle>
                <KbdHint>
                  <Kbd>esc</Kbd>
                </KbdHint>
              </div>
              <p class={styles.text}>{t("account.guestDescription")}</p>
              <div class={styles.buttons}>
                <Button block onClick={() => start("google")} disabled={signIn.pending()}>
                  {t("signin.google")}
                </Button>
                <Button block onClick={() => start("github")} disabled={signIn.pending()}>
                  {t("signin.github")}
                </Button>
              </div>
              <Show when={isMock}>
                <p class={styles.text} style={{ "margin-top": "var(--space-3)" }}>
                  {t("signin.mockNote")}
                </p>
              </Show>
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

              <Show when={mine()}>
                {(m) => (
                  <Show
                    when={m().postCount > 0}
                    fallback={
                      <section class={cx(styles.section, styles.ruled)}>
                        <p class={styles.empty}>{t("account.empty")}</p>
                        <ButtonLink class={styles.cta} href="/share" onClick={close}>
                          {t("share.title")}
                        </ButtonLink>
                      </section>
                    }
                  >
                    <section class={cx(styles.posts, styles.ruled)} aria-labelledby="acc-posts">
                      <div class={cx(styles.row, styles.baseline)}>
                        <h3 id="acc-posts" class={styles.caption}>
                          {t("account.yourPosts")}
                        </h3>
                        <span class={styles.sub}>{t("account.stats", { posts: m().postCount, reactions: m().reactionCount })}</span>
                      </div>
                      <ul class={styles.list}>
                        <For each={m().recent}>
                          {(p) => (
                            <li>
                              <Link class={styles.post} variant="quiet" href={`/post/${p.id}`} onClick={close}>
                                {p.title}
                              </Link>
                              <span class={styles.sub}>{t("account.postMeta", { date: formatDate(p.publishedAt), n: p.reactions })}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                      <Link class={styles.more} href={`/author/${user().handle}`} onClick={close}>
                        {t("account.authorPage")}
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
                  {t("account.signOut")}
                </Button>
              </div>
            </>
          )}
        </Show>
      </PopoverContent>
    </Popover>
  );
}
