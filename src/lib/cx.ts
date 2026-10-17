export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** For data-* flags: "" when on, undefined (attribute removed) when off. */
export const flag = (on: unknown) => (on ? "" : undefined);
