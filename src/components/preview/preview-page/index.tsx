import { Meta, Title } from "@solidjs/meta";
import { type JSX, type ParentProps, Show } from "solid-js";
import { Page } from "~/components/layout/page";
import { Icon, Link, ToggleGroup } from "~/components/ui-kit";
import type { ThemePref } from "~/lib/prefs";
import { useTheme } from "~/lib/theme";
import styles from "./preview-page.module.css";

/**
 * Frame for a /preview page: back link, title, the site theme switch, then sections.
 * Not linked from the site; robots are told to skip it.
 */
export function PreviewPage(props: ParentProps & { title: string; description?: string; back?: boolean }) {
  const theme = useTheme();
  return (
    <Page>
      <Title>{props.title} · preview · what-did-i-learn-today</Title>
      <Meta name="robots" content="noindex" />
      <div class={styles.top}>
        <Show when={props.back !== false} fallback={<span />}>
          <Link class={styles.back} variant="muted" href="/preview">
            <Icon name="arrow-left" />
            All components
          </Link>
        </Show>
        <ToggleGroup<ThemePref>
          label="Site theme"
          value={theme.pref()}
          onChange={theme.setPref}
          items={[
            { value: "light", label: <Icon name="sun" />, ariaLabel: "Light" },
            { value: "system", label: "System" },
            { value: "dark", label: <Icon name="moon" />, ariaLabel: "Dark" },
          ]}
        />
      </div>
      <h1 class={styles.title}>{props.title}</h1>
      <Show when={props.description}>
        <p class={styles.description}>{props.description}</p>
      </Show>
      <div class={styles.sections}>{props.children}</div>
    </Page>
  );
}

/**
 * One example, drawn twice: in a light panel and a dark panel side by side.
 * `children` is a function so each panel gets its own copy (and its own state); it gets the
 * panel theme too.
 *
 * `site` draws a single panel in the site theme instead. Use it for components that open in
 * a portal (popover, dialog, tooltip, toast): the opened layer follows the page theme, not
 * the panel, so switch the site theme above to see it dark.
 */
export function Specimen(props: {
  title: string;
  note?: JSX.Element;
  site?: boolean;
  stack?: boolean;
  children: (theme?: "light" | "dark") => JSX.Element;
}) {
  const panel = (theme?: "light" | "dark") => (
    <div class={styles.panel} data-theme={theme} data-stack={props.stack ? "" : undefined}>
      <Show when={theme}>
        <span class={styles["panel-label"]}>{theme}</span>
      </Show>
      <div class={styles.stage}>{props.children(theme)}</div>
    </div>
  );
  return (
    <section class={styles.specimen}>
      <h2 class={styles["specimen-title"]}>{props.title}</h2>
      <Show when={props.note}>
        <p class={styles.note}>{props.note}</p>
      </Show>
      <Show
        when={props.site}
        fallback={
          <div class={styles.pair}>
            {panel("light")}
            {panel("dark")}
          </div>
        }
      >
        <div class={styles.single}>{panel()}</div>
      </Show>
    </section>
  );
}

/** A small caption above one item inside a panel ("disabled", "with error"…). */
export function Cell(props: ParentProps & { label: string; wide?: boolean }) {
  return (
    <div class={styles.cell} data-wide={props.wide ? "" : undefined}>
      <span class={styles["cell-label"]}>{props.label}</span>
      {props.children}
    </div>
  );
}
