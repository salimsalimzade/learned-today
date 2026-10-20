import { Icon, Kbd, KbdCombo, KbdHint, Link, ToggleGroup } from "~/components/ui-kit";
import { REPO_URL } from "~/lib/env";
import type { ThemePref } from "~/lib/prefs";
import { useTheme } from "~/lib/theme";
import { useOverlays } from "../../overlays/overlay-provider";
import { TimeZonePicker } from "../time-zone-picker";
import styles from "./footer.module.css";

export function Footer() {
  const theme = useTheme();
  const overlays = useOverlays();

  return (
    <footer class={styles.footer}>
      <div class={styles.inner}>
        <div class={styles.main}>
          <nav aria-label="Site" class={styles.nav}>
            <Link variant="muted" external href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
              <Icon name="external" />
            </Link>
            <Link variant="muted" external href="/rss.xml">
              RSS
              <Icon name="rss" />
            </Link>
          </nav>
          <p class={styles.note}>A non-commercial community project. No ads.</p>
          <span class={styles.keys}>
            <KbdHint>
              <button type="button" class={styles["keys-button"]} onClick={() => overlays.setShortcutsOpen(true)}>
                <KbdCombo>
                  <Kbd>?</Kbd> all shortcuts
                </KbdCombo>
              </button>
            </KbdHint>
          </span>
        </div>
        <div class={styles.toggles}>
          <ToggleGroup<ThemePref>
            label="Theme"
            value={theme.pref()}
            onChange={theme.setPref}
            items={[
              {
                value: "light",
                label: <Icon name="sun" />,
                ariaLabel: "Light",
              },
              { value: "system", label: "System" },
              { value: "dark", label: <Icon name="moon" />, ariaLabel: "Dark" },
            ]}
          />
          <TimeZonePicker />
        </div>
      </div>
    </footer>
  );
}
