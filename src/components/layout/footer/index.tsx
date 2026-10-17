import { revalidate } from "@solidjs/router";
import { Icon, Kbd, KbdCombo, KbdHint, Link, ToggleGroup } from "~/components/ui-kit";
import { REPO_URL } from "~/lib/env";
import { useI18n } from "~/lib/i18n";
import type { ThemePref } from "~/lib/prefs";
import { useTheme } from "~/lib/theme";
import type { Locale } from "~/lib/types";
import { useOverlays } from "../../overlays/overlay-provider";
import styles from "./footer.module.css";

export function Footer() {
  const { t, locale, setLocale } = useI18n();
  const theme = useTheme();
  const overlays = useOverlays();

  const changeLocale = (l: Locale) => {
    setLocale(l);
    // Topic names and day words come from the server in the interface language.
    void revalidate();
  };

  return (
    <footer class={styles.footer}>
      <div class={styles.inner}>
        <div class={styles.main}>
          <nav aria-label={t("footer.siteNav")} class={styles.nav}>
            <Link variant="muted" external href={`${REPO_URL}#readme`}>
              {t("footer.about")}
            </Link>
            <Link variant="muted" external href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
              <Icon name="external" />
            </Link>
            <Link variant="muted" external href="/rss.xml">
              RSS
              <Icon name="rss" />
            </Link>
          </nav>
          <p class={styles.note}>{t("footer.note")}</p>
          <span class={styles.keys}>
            <KbdHint>
              <button type="button" class={styles["keys-button"]} onClick={() => overlays.setShortcutsOpen(true)}>
                <KbdCombo>
                  <Kbd>?</Kbd> {t("footer.shortcuts")}
                </KbdCombo>
              </button>
            </KbdHint>
          </span>
        </div>
        <div class={styles.toggles}>
          <ToggleGroup<Locale>
            label={t("footer.language")}
            value={locale()}
            onChange={changeLocale}
            items={[
              { value: "az", label: "Azərbaycanca", lang: "az" },
              { value: "en", label: "English", lang: "en" },
            ]}
          />
          <ToggleGroup<ThemePref>
            label={t("footer.theme")}
            value={theme.pref()}
            onChange={theme.setPref}
            items={[
              { value: "light", label: <Icon name="sun" />, ariaLabel: t("theme.light") },
              { value: "system", label: t("theme.system") },
              { value: "dark", label: <Icon name="moon" />, ariaLabel: t("theme.dark") },
            ]}
          />
        </div>
      </div>
    </footer>
  );
}
