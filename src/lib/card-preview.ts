// How much of a note a feed card shows. lib/markdown (server) picks the blocks with these numbers and the
// card (components/feed/feed-card) clamps to them, so the two always agree.

/** The card body is cut at this height (px) when the note is longer. */
export const CARD_BODY_MAX = 248;

/** A code block in a card shows this many lines until "Show all N lines". */
export const CARD_CODE_LINES = 4;
