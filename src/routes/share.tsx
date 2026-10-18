import { Title } from "@solidjs/meta";
import { createAsync, useSubmission } from "@solidjs/router";
import { batch, createEffect, createSignal, on, onCleanup, onMount, Show } from "solid-js";
import { Page } from "~/components/layout/page";
import { useOverlays } from "~/components/overlays/overlay-provider";
import { clearDraft, type Draft, readDraft, writeDraft } from "~/components/share/draft";
import { Editor, type EditorApi } from "~/components/share/editor";
import { TagInput } from "~/components/share/tag-input";
import { type TopicOption, TopicPicker } from "~/components/share/topic-picker";
import { Button, Checkbox, FieldOptional, fieldStyles, Kbd, KbdCombo, KbdHint, showToast, TextField } from "~/components/ui-kit";
import { publishPost } from "~/lib/actions/publish-post";
import { flag } from "~/lib/cx";
import { getTopics } from "~/lib/queries/posts";
import { getSession } from "~/lib/queries/session";
import { type PostErrors, type PostField, SIGN_IN_REQUIRED, TITLE_MAX, validatePost } from "~/lib/schemas/post";
import { useShortcut } from "~/lib/shortcuts";
import styles from "~/styles/pages/share.module.css";

/** /share: needs sign-in. Guests get the sign-in dialog first and come back here after. */
export default function SharePage() {
  const overlays = useOverlays();
  const session = createAsync(() => getSession());
  const topics = createAsync(() => getTopics());
  const submission = useSubmission(publishPost);

  const [title, setTitle] = createSignal("");
  const [body, setBody] = createSignal("");
  const [topic, setTopic] = createSignal<TopicOption | null>(null);
  const [tags, setTags] = createSignal<string[]>([]);
  const [own, setOwn] = createSignal(false);
  const [errors, setErrors] = createSignal<PostErrors>({});
  const [savedAt, setSavedAt] = createSignal<number | null>(null);
  const [modKey, setModKey] = createSignal("Ctrl");
  let form: HTMLFormElement | undefined;
  let editor: EditorApi | undefined;
  let publishing = false;

  const err = (f: PostField) => errors()[f];
  const edit =
    <T,>(set: (v: T) => void, field: PostField) =>
    (v: T) => {
      set(v);
      if (errors()[field]) setErrors({ ...errors(), [field]: undefined });
    };

  onMount(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setModKey("⌘");
    const d = readDraft();
    if (d)
      batch(() => {
        setTitle(d.title);
        setBody(d.body);
        setTopic(d.topic);
        setTags(d.tags);
        setOwn(d.own);
        setSavedAt(d.savedAt);
      });
  });

  createEffect(() => {
    if (session() === null) overlays.requestSignIn("share", "/share");
  });

  // Save the draft half a second after the last change.
  createEffect(
    on(
      [title, body, topic, tags, own],
      () => {
        const id = setTimeout(
          () => setSavedAt(writeDraft({ title: title(), body: body(), topic: topic(), tags: tags(), own: own() })),
          500,
        );
        onCleanup(() => clearTimeout(id));
      },
      { defer: true },
    ),
  );

  // Errors the server found (it runs the same schema).
  createEffect(() => {
    const r = submission.result;
    if (r?.ok !== false) return;
    setErrors(r.errors);
    publishing = false;
    if (r.errors.form === SIGN_IN_REQUIRED) overlays.requestSignIn("share", "/share");
  });
  createEffect(() => {
    if (!submission.error) return;
    publishing = false;
    showToast({ title: "Couldn't share.", description: "What you wrote is still here.", variant: "error" });
  });
  onCleanup(() => publishing && clearDraft());

  const onSubmit = (e: SubmitEvent) => {
    if (!session()) {
      e.preventDefault();
      return overlays.requestSignIn("share", "/share");
    }
    const result = validatePost({
      title: title(),
      body: body(),
      topic: topic()?.value ?? "",
      tags: tags(),
      own: own(),
    });
    if (!result.ok) {
      e.preventDefault();
      setErrors(result.errors);
      queueMicrotask(() => {
        if (result.errors.body && !result.errors.title) editor?.focus();
        else form?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid] input, [data-invalid] button')?.focus();
      });
      return;
    }
    setErrors({});
    publishing = true;
  };

  useShortcut("Enter", (e) => (e.preventDefault(), form?.requestSubmit()), { mod: true, allowInFields: true });

  const discard = () => {
    const snapshot: Omit<Draft, "savedAt"> = { title: title(), body: body(), topic: topic(), tags: tags(), own: own() };
    const restore = (d: Omit<Draft, "savedAt">) =>
      batch(() => {
        setTitle(d.title);
        setTopic(d.topic);
        setTags(d.tags);
        setOwn(d.own);
        setErrors({});
        editor?.setMarkdown(d.body);
      });
    restore({ title: "", body: "", topic: null, tags: [], own: false });
    clearDraft();
    setSavedAt(null);
    showToast({ title: "Draft deleted.", action: { label: "Undo", onClick: () => restore(snapshot) } });
  };

  return (
    <Page>
      <Title>What did you learn today? · what-did-i-learn-today</Title>
      <h1 class={styles.title}>What did you learn today?</h1>
      <p class={styles.sub}>One small thing, in your own words. It shows up in the feed as soon as you share it.</p>

      <form ref={form} action={publishPost} method="post" class={styles.form} onSubmit={onSubmit} novalidate>
        <TextField
          label="Title"
          name="title"
          value={title()}
          onChange={edit(setTitle, "title")}
          description="In one sentence: what did you learn?"
          error={err("title")}
          counterMax={TITLE_MAX}
        />

        <div class={fieldStyles.field} data-invalid={flag(errors().body)}>
          <span class={fieldStyles.label} id="f-body-l">
            Note
          </span>
          <Editor
            labelId="f-body-l"
            describedBy="f-body-d"
            initial={() => readDraft()?.body ?? ""}
            onChange={edit(setBody, "body")}
            onSubmit={() => form?.requestSubmit()}
            invalid={!!errors().body}
            ref={(api) => (editor = api)}
            status={
              <Show when={savedAt()}>
                <span>Draft saved</span>
              </Show>
            }
          />
          <input type="hidden" name="body" value={body()} />
          <Show
            when={err("body")}
            fallback={
              <p class={fieldStyles.description} id="f-body-d">
                3–6 short paragraphs. One idea, one example.
              </p>
            }
          >
            <p class={fieldStyles.error} id="f-body-d">
              {err("body")}
            </p>
          </Show>
        </div>

        <div class={styles.grid}>
          <TopicPicker id="f-topic" topics={topics() ?? []} value={topic()} onChange={edit(setTopic, "topic")} error={err("topic")} />
          <div class={fieldStyles.field} data-invalid={flag(errors().tags)}>
            <label class={fieldStyles.label} for="f-tags">
              Tags <FieldOptional>(optional)</FieldOptional>
            </label>
            <TagInput id="f-tags" name="tags" value={tags()} onChange={edit(setTags, "tags")} error={err("tags")} />
          </div>
        </div>

        <Checkbox name="own" checked={own()} onChange={edit(setOwn, "own")} label="I wrote this myself" error={err("own")} />

        <div class={styles.actions}>
          <KbdCombo>
            <KbdHint>
              <Kbd>{modKey()}</Kbd>
              <Kbd>↵</Kbd>
            </KbdHint>
          </KbdCombo>
          <Button variant="ghost" onClick={discard}>
            Delete draft
          </Button>
          <Button variant="primary" type="submit" aria-busy={submission.pending ? "true" : undefined} disabled={submission.pending}>
            {submission.pending ? "Sharing…" : "Share"}
          </Button>
        </div>
      </form>
    </Page>
  );
}
