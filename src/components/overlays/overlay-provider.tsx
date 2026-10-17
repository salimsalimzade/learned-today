// Open/close state for the overlays mounted once in app.tsx, so any route or
// component can ask for the command palette or the sign-in dialog.
import { createContext, createSignal, type ParentProps, useContext } from "solid-js";

export type SignInReason = "react" | "share" | "account";

interface Overlays {
  paletteOpen: () => boolean;
  setPaletteOpen: (open: boolean) => void;
  signIn: () => { reason: SignInReason; next: string } | null;
  /** Ask a guest to sign in. `next` is where to come back to afterwards. */
  requestSignIn: (reason: SignInReason, next?: string) => void;
  closeSignIn: () => void;
  shortcutsOpen: () => boolean;
  setShortcutsOpen: (open: boolean) => void;
}

const OverlayContext = createContext<Overlays>();

export function OverlayProvider(props: ParentProps) {
  const [paletteOpen, setPaletteOpen] = createSignal(false);
  const [signIn, setSignIn] = createSignal<{ reason: SignInReason; next: string } | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = createSignal(false);
  const value: Overlays = {
    paletteOpen,
    setPaletteOpen,
    signIn,
    requestSignIn: (reason, next) => setSignIn({ reason, next: next ?? location.pathname + location.search }),
    closeSignIn: () => setSignIn(null),
    shortcutsOpen,
    setShortcutsOpen,
  };
  return <OverlayContext.Provider value={value}>{props.children}</OverlayContext.Provider>;
}

export function useOverlays() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlays must be used inside <OverlayProvider>");
  return ctx;
}
