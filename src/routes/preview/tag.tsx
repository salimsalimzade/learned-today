import { createSignal, For } from "solid-js";
import { Cell, PreviewPage, Specimen } from "~/components/preview/preview-page";
import { Icon, TagChip, TagLink, TagList, TagToggle } from "~/components/ui-kit";

function Filter() {
  const [on, setOn] = createSignal<string | null>("css");
  return (
    <TagList aria-label="Teqə görə süz">
      <For each={["css", "typescript", "solid"]}>
        {(tag) => (
          <li>
            <TagToggle pressed={on() === tag} onChange={(p) => setOn(p ? tag : null)}>
              {tag}
            </TagToggle>
          </li>
        )}
      </For>
    </TagList>
  );
}

export default function TagPreview() {
  return (
    <PreviewPage title="Tag" description="Chips for topics and tags: a link, a filter toggle (Kobalte ToggleButton), or a static chip.">
      <Specimen title="TagLink">
        {() => (
          <>
            <Cell label="tag">
              <TagLink href="/preview">typescript</TagLink>
            </Cell>
            <Cell label="topic">
              <TagLink kind="topic" href="/preview">
                Frontend
              </TagLink>
            </Cell>
            <Cell label="with count">
              <TagLink href="/preview" count={12}>
                css
              </TagLink>
            </Cell>
            <Cell label="plain (meta lines)">
              <TagLink plain href="/preview">
                solid
              </TagLink>
            </Cell>
          </>
        )}
      </Specimen>
      <Specimen title="TagToggle">
        {() => (
          <Cell label="pressed = accent-soft">
            <Filter />
          </Cell>
        )}
      </Specimen>
      <Specimen title="TagChip">
        {() => (
          <>
            <Cell label="static">
              <TagChip>reaktivlik</TagChip>
            </Cell>
            <Cell label="with end slot">
              <TagChip
                end={
                  <button
                    type="button"
                    aria-label="Sil"
                    style={{ display: "grid", padding: 0, border: 0, background: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    <Icon name="x" style={{ width: "12px", height: "12px" }} />
                  </button>
                }
              >
                css
              </TagChip>
            </Cell>
          </>
        )}
      </Specimen>
      <Specimen title="TagList" stack>
        {() => (
          <TagList aria-label="Teqlər">
            <For each={["typescript", "css", "solid", "kobalte", "vite", "supabase", "postgres", "rss"]}>
              {(t) => (
                <li>
                  <TagLink href="/preview">{t}</TagLink>
                </li>
              )}
            </For>
          </TagList>
        )}
      </Specimen>
    </PreviewPage>
  );
}
