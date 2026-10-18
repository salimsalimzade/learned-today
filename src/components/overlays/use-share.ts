import { createAsync, useNavigate } from "@solidjs/router";
import { getSession } from "~/lib/queries/session";
import { useOverlays } from "./overlay-provider";

/**
 * The way into /share. Guests get the sign-in dialog where they are, instead of loading the share page
 * behind it, and land on /share once they've signed in (/auth/callback?next=/share). While the session is
 * still loading, it goes ahead: /share asks for sign-in itself.
 */
export function useShare() {
  const overlays = useOverlays();
  const navigate = useNavigate();
  const session = createAsync(() => getSession());
  const guest = () => session() === null;
  const askToSignIn = () => overlays.requestSignIn("share", "/share");

  return {
    /**
     * For links to /share, as `on:click` so it runs before the router's own click handler. A new-tab
     * click (Ctrl/⌘, Shift, middle button) is left alone: that tab opens /share, which asks there.
     */
    onLinkClick: (e: MouseEvent) => {
      if (!guest() || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      askToSignIn();
    },
    /** For the n shortcut and the command palette. */
    open: () => (guest() ? askToSignIn() : navigate("/share")),
  };
}
