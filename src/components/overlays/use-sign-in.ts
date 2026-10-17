import { useAction, useSubmission } from "@solidjs/router";
import { signIn, signOut } from "~/lib/actions/auth";
import type { Provider } from "~/lib/types";

/** Starts sign-in. In demo mode it resolves right away; with Supabase the page goes to the provider. */
export function useSignIn() {
  const run = useAction(signIn);
  const submission = useSubmission(signIn);
  return {
    start: (provider: Provider, next: string) => run(provider, next),
    pending: () => submission.pending ?? false,
  };
}

export function useSignOut() {
  return useAction(signOut);
}
