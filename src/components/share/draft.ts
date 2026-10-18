// The share form's draft, saved per browser while you type. Lost if storage is blocked,
// which is fine: it's a convenience, the form still works.
const KEY = "lt.draft.v1";

/** The topic picked in the share form. */
export interface DraftTopic {
  value: string;
  label: string;
}

export interface Draft {
  title: string;
  body: string;
  topic: DraftTopic | null;
  tags: string[];
  own: boolean;
  savedAt: number;
}

function isDraftTopic(v: unknown): v is DraftTopic {
  const t = v as Partial<DraftTopic> | null;
  return !!t && typeof t.value === "string" && typeof t.label === "string";
}

export function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    return {
      title: typeof d.title === "string" ? d.title : "",
      body: typeof d.body === "string" ? d.body : "",
      topic: isDraftTopic(d.topic) ? d.topic : null,
      tags: Array.isArray(d.tags) ? d.tags.filter((x) => typeof x === "string").slice(0, 5) : [],
      own: d.own === true,
      savedAt: typeof d.savedAt === "number" ? d.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeDraft(d: Omit<Draft, "savedAt">): number | null {
  try {
    const empty = !d.title.trim() && !d.body.trim() && !d.tags.length && !d.topic;
    if (empty) {
      localStorage.removeItem(KEY);
      return null;
    }
    const savedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify({ ...d, savedAt }));
    return savedAt;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
