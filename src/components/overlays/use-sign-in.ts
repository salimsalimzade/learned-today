import { useAction, useSubmission } from "@solidjs/router";
import { showToast } from "~/components/ui-kit";
import { signIn, signOut } from "~/lib/actions/auth";
import type { Provider } from "~/lib/types";

const PROVIDER_NAMES: Record<Provider, string> = { google: "Google", github: "GitHub" };

/**
 * Starts sign-in: the page goes to Google or GitHub, then comes back through /auth/callback. When Supabase
 * can't start it (signIn returns ok: false) or the request fails, a toast says so instead of nothing happening.
 */
export function useSignIn() {
  const run = useAction(signIn);
  const submission = useSubmission(signIn);
  return {
    start: async (provider: Provider, next: string) => {
      // On success the action redirects the page away, so a result only comes back when it failed.
      const result = await run(provider, next).catch(() => ({ ok: false as const }));
      if (result && !result.ok)
        showToast({ title: `Couldn't reach ${PROVIDER_NAMES[provider]}.`, description: "Try again in a moment.", variant: "error" });
    },
    pending: () => submission.pending ?? false,
  };
}

/** Signs out. The action always signs this browser out; it only fails if the request itself never got through. */
export function useSignOut() {
  const run = useAction(signOut);
  return async () => {
    try {
      await run();
    } catch {
      showToast({ title: "Couldn't sign out.", description: "Check your connection and try again.", variant: "error" });
    }
  };
}
