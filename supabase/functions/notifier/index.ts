// notifier: pg_cron calls this every minute (0003_triggers.sql). It claims up to 25 queued
// notifications, sends each as a Telegram message and marks it sent or failed.
//
// Secrets: supabase secrets set TELEGRAM_BOT_TOKEN=... SITE_URL=https://your.site
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
const BATCH = 25; // Telegram allows about 30 messages a second per bot

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Job {
  id: number;
  post_id: number;
  chat_id: number;
  attempts: number;
}

interface Post {
  id: number;
  title: string;
  excerpt: string;
  author_name: string;
  topic_name_az: string;
  topic_name_en: string;
  tags: string[];
}

function message(post: Post, lang: "az" | "en") {
  const topic = lang === "az" ? post.topic_name_az : post.topic_name_en;
  const tags = post.tags.map((t) => `#${t}`).join(" ");
  return [
    `<b>${esc(post.title)}</b>`,
    post.excerpt ? esc(post.excerpt) : "",
    "",
    `${esc(post.author_name)} · ${esc(topic)}${tags ? ` · ${esc(tags)}` : ""}`,
    `${SITE_URL}/post/${post.id}`,
  ]
    .filter((line, i) => line !== "" || i === 2)
    .join("\n");
}

Deno.serve(async () => {
  if (!BOT_TOKEN) return new Response("TELEGRAM_BOT_TOKEN is not set", { status: 500 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: jobs, error } = await db.rpc("claim_notifications", { batch_size: BATCH });
  if (error) return new Response(error.message, { status: 500 });
  if (!jobs?.length) return Response.json({ sent: 0, failed: 0 });

  const postIds = [...new Set((jobs as Job[]).map((j) => j.post_id))];
  const chatIds = [...new Set((jobs as Job[]).map((j) => j.chat_id))];
  const [{ data: posts }, { data: chats }] = await Promise.all([
    db.from("public_posts").select("id, title, excerpt, author_name, topic_name_az, topic_name_en, tags").in("id", postIds),
    db.from("telegram_chats").select("chat_id, language").in("chat_id", chatIds),
  ]);
  const postById = new Map(((posts as Post[] | null) ?? []).map((p) => [p.id, p]));
  const langByChat = new Map((chats ?? []).map((c: { chat_id: number; language: "az" | "en" }) => [c.chat_id, c.language]));

  let sent = 0;
  let failed = 0;
  for (const job of jobs as Job[]) {
    const post = postById.get(job.post_id);
    if (!post) {
      // Unpublished or deleted since it was queued.
      await db.from("notification_queue").update({ status: "failed", last_error: "post not public" }).eq("id", job.id);
      failed++;
      continue;
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: job.chat_id, text: message(post, langByChat.get(job.chat_id) ?? "az"), parse_mode: "HTML" }),
    });

    if (res.ok) {
      await db.from("notification_queue").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
      sent++;
      continue;
    }

    const body = await res.json().catch(() => ({}));
    if (res.status === 429) {
      // Rate limited: leave it pending for the next run and stop this one.
      await db
        .from("notification_queue")
        .update({ attempts: job.attempts - 1 })
        .eq("id", job.id);
      break;
    }
    if (res.status === 403) {
      // The person blocked the bot. Stop queueing for this chat.
      await db.from("telegram_chats").update({ blocked_at: new Date().toISOString() }).eq("chat_id", job.chat_id);
    }
    const giveUp = res.status === 403 || res.status === 400 || job.attempts >= 5;
    await db
      .from("notification_queue")
      .update({ status: giveUp ? "failed" : "pending", last_error: String(body?.description ?? res.status) })
      .eq("id", job.id);
    failed++;
  }

  return Response.json({ sent, failed });
});
