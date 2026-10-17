import type { JSX } from "solid-js";

// The design system's icon set: 24px grid, 1.75 stroke, round caps and joins.
// Shapes are copied from the mask icons in docs/design-system/bundle.css.
export const ICONS = {
  search: () => (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  "chevron-down": () => <path d="M6 9l6 6 6-6" />,
  "chevron-right": () => <path d="M9 6l6 6-6 6" />,
  check: () => <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: () => <path d="M6 6l12 12M18 6L6 18" />,
  plus: () => <path d="M12 5v14M5 12h14" />,
  minus: () => <path d="M5 12h14" />,
  copy: () => (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </>
  ),
  "arrow-left": () => <path d="M19 12H5M11 6l-6 6 6 6" />,
  "arrow-right": () => <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-up-right": () => <path d="M7 17L17 7M8 7h9v9" />,
  external: () => <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />,
  rss: () => (
    <>
      <path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </>
  ),
  sun: () => (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </>
  ),
  moon: () => <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />,
  alert: () => (
    <>
      <path d="M12 8v5M12 16.5v.5" />
      <circle cx="12" cy="12" r="8.5" />
    </>
  ),
  bold: () => <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" stroke-width="2.25" />,
  italic: () => <path d="M10 5h8M6 19h8M14 5l-4 14" />,
  code: () => <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  link: () => <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />,
  text: () => <path d="M5 6h14M12 6v13" />,
  heading: () => <path d="M6 5v14M18 5v14M6 12h12" />,
  list: () => (
    <>
      <path d="M10 7h10M10 12h10M10 17h10" />
      <circle cx="5" cy="7" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="17" r="1" fill="currentColor" />
    </>
  ),
  "list-ordered": () => <path d="M11 7h9M11 12h9M11 17h9M4.5 5.5L6 5v4M4.5 14.5a1 1 0 0 1 2 .3c0 .9-2 1.6-2 2.7h2" />,
  quote: () => <path d="M5 6v12M9 8h10M9 12h10M9 16h6" />,
  "code-block": () => (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M10 10l-2 2 2 2M14 10l2 2-2 2" />
    </>
  ),
  clock: () => (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  person: () => (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
} satisfies Record<string, () => JSX.Element>;

export type IconName = keyof typeof ICONS;
