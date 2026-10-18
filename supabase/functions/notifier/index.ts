// notifier: sends the Telegram queue (Supabase Queues, queue telegram_notifications). Enqueueing a post
// wakes it, and pg_cron checks every 15 seconds for messages whose retry time has come (0006).
// A message is either one new note {post_id, chat_id} or a recap {kind: "digest", chat_id, since, label}
// (0007). Both go out as Telegram HTML with inline buttons (0008). It reads up to 25 messages, which hides them for 2 minutes, sends each one, then tells the queue:
//   sent                  notifications_ack    (archived, kept 14 days)
//   will not get better   notifications_fail   (dead-letter queue: blocked chat, bad request, post gone)
//   might get better      notifications_retry  (back in 30 s, 2 min, 10 min, 1 h, then dead-lettered)
//
// Secrets: supabase secrets set TELEGRAM_BOT_TOKEN=... SITE_URL=https://your.site
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
const BATCH = 25; // Telegram allows about 30 messages a second per bot

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Telegram refuses URL buttons that point at localhost, so a local SITE_URL puts the link in the text instead.
const LINKABLE = /^https?:\/\/(?!localhost|127\.|0\.0\.0\.0)/.test(SITE_URL);

type Button = { text: string; url: string } | { text: string; callback_data: string };

/** One button per row, as in the designs. URL buttons are left out when SITE_URL isn't reachable. */
function keyboard(buttons: Button[]) {
  const rows = buttons.filter((b) => LINKABLE || !("url" in b)).map((b) => [b]);
  return rows.length ? { inline_keyboard: rows } : undefined;
}

interface Job {
  msg_id: number;
  /** How many times the queue has handed this message out, this time included. */
  read_ct: number;
  message: {
    kind?: "digest";
    post_id?: number;
    chat_id: number;
    since?: string;
    label?: string;
    /** A recap with its own filters; no tags, authors or "everything" means "what the chat follows". */
    everything?: boolean;
    tags?: string[] | null;
    authors?: string[] | null;
  };
}

interface Post {
  id: number;
  title: string;
  topic_name: string;
  tags: string[];
}

/**
 * A tag as a link to its page on the site. Telegram's own #hashtag detection stops at the first hyphen
 * ("#type-guards" would only link "#type") and searches the chat instead of opening the tag.
 */
const tagLink = (tag: string) =>
  LINKABLE ? `<a href="${esc(`${SITE_URL}/tag/${encodeURIComponent(tag)}`)}">#${esc(tag)}</a>` : `#${esc(tag)}`;

/**
 * A new note: the topic line and the title in bold, then the tags. The note itself stays on the site behind
 * the Read button: Telegram can't show its code blocks, lists and links the way the post page does.
 */
function message(post: Post) {
  const tags = post.tags.map(tagLink).join(" ");
  const lines = [
    `<b>New note · ${esc(post.topic_name)}</b>`,
    "",
    `<b>${esc(post.title)}</b>`,
    tags || null,
    LINKABLE ? null : `${SITE_URL}/post/${post.id}`,
  ];
  return lines.filter((line) => line !== null).join("\n");
}

const noteButtons = (post: Post): Button[] => [
  { text: "Read", url: `${SITE_URL}/post/${post.id}` },
  // The webhook works out which follow brought this note and drops it (routes/api/telegram.ts).
  { text: "Stop following", callback_data: `stop:${post.id}` },
];

const digestButtons: Button[] = [
  { text: "Open feed", url: SITE_URL },
  { text: "Subscriptions", callback_data: "list" },
];

const MAX_ATTEMPTS = 5;

Deno.serve(async () => {
  if (!BOT_TOKEN) return new Response("TELEGRAM_BOT_TOKEN is not set", { status: 500 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data, error } = await db.rpc("notifications_read", { p_qty: BATCH });
  if (error) return new Response(error.message, { status: 500 });
  const jobs = (data ?? []) as Job[];
  if (!jobs.length) return Response.json({ sent: 0, failed: 0, retrying: 0 });

  const postIds = [...new Set(jobs.filter((j) => j.message.kind !== "digest").map((j) => j.message.post_id as number))];
  const { data: posts } = await db.from("public_posts").select("id, title, topic_name, tags").in("id", postIds);
  const postById = new Map(((posts as Post[] | null) ?? []).map((p) => [p.id, p]));

  // Tell the queue what happened. If a call fails the message simply reappears when its hide time ends.
  const report = async (fn: string, args: Record<string, unknown>) => {
    const { error } = await db.rpc(fn, args);
    if (error) console.error(`${fn}: ${error.message}`);
  };

  let sent = 0;
  let failed = 0;
  let retrying = 0;
  for (const [i, job] of jobs.entries()) {
    const { chat_id } = job.message;

    if (job.read_ct > MAX_ATTEMPTS) {
      // Handed out too often: the notifier kept dying on it.
      await report("notifications_fail", { p_msg_id: job.msg_id, p_error: "gave up after repeated attempts" });
      failed++;
      continue;
    }
    // What to send: a recap is built from the database now, a note from its post.
    let text: string;
    let buttons: Button[];
    if (job.message.kind === "digest") {
      const { data: recap, error: recapError } = await db.rpc("digest_text", {
        p_chat_id: chat_id,
        p_since: job.message.since,
        p_label: job.message.label,
        p_site_url: SITE_URL,
        p_everything: job.message.everything ?? false,
        p_tags: job.message.tags ?? null,
        p_authors: job.message.authors ?? null,
      });
      if (recapError) {
        await report("notifications_retry", { p_msg_id: job.msg_id, p_error: `digest: ${recapError.message}` });
        retrying++;
        continue;
      }
      if (!recap) {
        // Nothing new in the window: no empty recap.
        await report("notifications_ack", { p_msg_id: job.msg_id });
        continue;
      }
      text = recap;
      buttons = digestButtons;
    } else {
      const post = postById.get(job.message.post_id as number);
      if (!post) {
        // Unpublished or deleted since it was queued.
        await report("notifications_fail", { p_msg_id: job.msg_id, p_error: "post not public" });
        failed++;
        continue;
      }
      text = message(post);
      buttons = noteButtons(post);
    }

    let res: Response;
    try {
      res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: keyboard(buttons),
        }),
      });
    } catch (e) {
      await report("notifications_retry", { p_msg_id: job.msg_id, p_error: `network: ${(e as Error).message}` });
      retrying++;
      continue;
    }

    if (res.ok) {
      await report("notifications_ack", { p_msg_id: job.msg_id });
      sent++;
      continue;
    }

    const body = await res.json().catch(() => ({}));
    const reason = String(body?.description ?? res.status);
    if (res.status === 403) {
      // The person blocked the bot. Stop queueing for this chat.
      await db.from("telegram_chats").update({ blocked_at: new Date().toISOString() }).eq("chat_id", chat_id);
      await report("notifications_fail", { p_msg_id: job.msg_id, p_error: reason });
      failed++;
    } else if (res.status === 400) {
      // Chat not found or a message Telegram refuses: sending it again won't change that.
      await report("notifications_fail", { p_msg_id: job.msg_id, p_error: reason });
      failed++;
    } else if (res.status === 429) {
      // Rate limited. Push this message and every one we haven't sent yet back by Telegram's retry_after.
      const wait = Number(body?.parameters?.retry_after ?? 30);
      for (const later of jobs.slice(i)) {
        await report("notifications_retry", { p_msg_id: later.msg_id, p_error: reason, p_min_wait: wait });
        retrying++;
      }
      break;
    } else {
      await report("notifications_retry", { p_msg_id: job.msg_id, p_error: reason });
      retrying++;
    }
  }

  return Response.json({ sent, failed, retrying });
});
