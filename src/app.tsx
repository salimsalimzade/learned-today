// Global CSS, in this order: tokens (fonts, colours, type), base element rules, code colours.
// Everything else is a CSS module next to its component.
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/syntax.css";
import { Meta, MetaProvider, Title } from "@solidjs/meta";
import { Router, useNavigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { type ParentProps, Suspense } from "solid-js";
import styles from "./app.module.css";
import { Footer } from "./components/layout/footer";
import { Header } from "./components/layout/header";
import { CommandPalette } from "./components/overlays/command-palette";
import { OverlayProvider, useOverlays } from "./components/overlays/overlay-provider";
import { ShortcutsDialog } from "./components/overlays/shortcuts-dialog";
import { SignInDialog } from "./components/overlays/sign-in-dialog";
import { ToastRegion } from "./components/ui-kit";
import { useShortcut } from "./lib/shortcuts";
import { ThemeProvider, useTheme } from "./lib/theme";

/** Root layout: header and footer around every route, overlays mounted once. */
function Shell(props: ParentProps) {
  const overlays = useOverlays();
  const theme = useTheme();
  const navigate = useNavigate();

  useShortcut("/", (e) => {
    e.preventDefault();
    overlays.setPaletteOpen(true);
  });
  useShortcut("n", (e) => {
    e.preventDefault();
    navigate("/share");
  });
  useShortcut("t", () => theme.cycle());
  useShortcut("?", () => overlays.setShortcutsOpen(true));

  return (
    <>
      <Title>what-did-i-learn-today</Title>
      <Meta name="description" content="Learn one small thing every day and share it." />
      <a class={styles.skip} href="#main">
        Skip to content
      </a>
      <div class={styles.app}>
        <Header />
        <div class={styles.body}>
          <Suspense>{props.children}</Suspense>
        </div>
        <Footer />
      </div>
      <CommandPalette />
      <SignInDialog />
      <ShortcutsDialog />
      <ToastRegion />
    </>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <ThemeProvider>
            <OverlayProvider>
              <Suspense>
                <Shell>{props.children}</Shell>
              </Suspense>
            </OverlayProvider>
          </ThemeProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
