import type { APIEvent } from "@solidjs/start/server";
import { isMock, SITE_URL } from "~/lib/env";
import { normalizeTag, TAG_PATTERN } from "~/lib/schemas/post";
import { createSupabaseAdminClient } from "~/lib/supabase/server";
import { parseStartPayload, startPayload } from "~/lib/telegram";

/**
 * POST /api/telegram: the bot's webhook.
 * Register it once:
 *   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
 *     -d url=https://your.site/api/telegram -d secret_token=$TELEGRAM_WEBHOOK_SECRET
 *
 * Commands (English only):
 *   /follow <#tag | @author | all>   /unfollow <#tag | @author>   /list   /stop
 *   /digest [week] [#tag | @author | all ...]   a recap of new notes, built now
 *   /schedule <daily | weekly | off> [filters]   a recap sent every 24 hours or 7 days, instead of one message per note
 * A scheduled recap counts from the moment it was saved, so it needs no time zone: it arrives at the hour the
 * person ran the command. It pauses the instant messages from the chat's follows (see enqueue_post_notifications).
 *   /start <payload> follows what the site's Follow button points at (a tag or an author).
 * Replies go back in the webhook response itself, so no bot token is needed here. The token is only used,
 * when it is set, to stop a pressed button's spinner (answerCallbackQuery), which a webhook response can't do
 * alongside its own reply. The webhook must receive callback_query updates (the default for setWebhook).
 * Confirmations and recaps are Telegram HTML with inline buttons; callback_data is
 *   undo:<start payload | all>   take back a follow from its confirmation
 *   list                         show what the chat follows (the Subscriptions button)
 *   stop:<post id>               drop the follow that brought a note (its Stop following button)
 * Sending new-post messages is the notifier's job (supabase/functions/notifier).
 */

interface TelegramUpdate {
  message?: { chat: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; message?: { message_id: number; chat: { id: number } } };
}

type Button = { text: string; url: string } | { text: string; callback_data: string };

/** A reply with formatting and buttons. A plain string is sent as text. */
type Reply = string | { html: string; buttons?: Button[] };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Telegram refuses URL buttons that point at localhost, so they are left out of a local setup.
const LINKABLE = /^https?:\/\/(?!localhost|127\.|0\.0\.0\.0)/.test(SITE_URL);

/** One button per row, as in the designs. */
function keyboard(buttons: Button[] = []) {
  const rows = buttons.filter((b) => LINKABLE || !("url" in b)).map((b) => [b]);
  return { inline_keyboard: rows };
}

type Follow = { target: "all" | "tag" | "author"; value: string };

/** Author handles, as the profiles table checks them. */
const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}$/;

/** Most things one chat can follow, so a single chat can't queue unbounded messages. */
const MAX_FOLLOWS = 50;

/** Most filters one /digest or /schedule can take. */
const MAX_FILTERS = 10;

// Demo mode (no Supabase keys) keeps follows in memory, per server process.
const demoFollows = new Map<number, Follow[]>();

const db = () => createSupabaseAdminClient();

async function listFollows(chatId: number): Promise<Follow[]> {
  if (isMock) return demoFollows.get(chatId) ?? [];
  const { data } = await db().from("follows").select("target, value").eq("chat_id", chatId).neq("target", "topic").order("created_at");
  return (data ?? []) as Follow[];
}

const same = (a: Follow, b: Follow) => a.target === b.target && a.value === b.value;

async function addFollow(chatId: number, f: Follow): Promise<"added" | "exists" | "limit"> {
  const current = await listFollows(chatId);
  if (current.some((x) => same(x, f))) return "exists";
  if (current.length >= MAX_FOLLOWS) return "limit";
  if (isMock) {
    demoFollows.set(chatId, [...current, f]);
    return "added";
  }
  await db().from("telegram_chats").upsert({ chat_id: chatId, blocked_at: null }, { onConflict: "chat_id" });
  await db().from("follows").insert({ chat_id: chatId, target: f.target, value: f.value });
  return "added";
}

async function removeFollow(chatId: number, f: Follow): Promise<boolean> {
  const current = await listFollows(chatId);
  if (!current.some((x) => same(x, f))) return false;
  if (isMock)
    demoFollows.set(
      chatId,
      current.filter((x) => !same(x, f)),
    );
  else await db().from("follows").delete().eq("chat_id", chatId).eq("target", f.target).eq("value", f.value);
  return true;
}

async function clearFollows(chatId: number) {
  if (isMock) return void demoFollows.delete(chatId);
  await db().from("follows").delete().eq("chat_id", chatId);
  await db().from("digest_schedules").delete().eq("chat_id", chatId);
}

async function authorExists(handle: string) {
  if (isMock) return true;
  const { data } = await db().from("profiles").select("handle").eq("handle", handle).maybeSingle();
  return !!data;
}

const tx = {
  welcome: `Welcome to TIL Daily! I send you short notes about things people just learned.

Choose what you want:
/follow #deploy – a tag
/follow @someone – an author
/follow all – every new note

Want one recap instead of a message per note? Try /schedule daily.
Send /help to see all commands.`,
  help: `Commands:
/follow <#tag or @author> – get new notes for it
/unfollow <#tag or @author> – stop getting them
/list – what you follow
/digest [filters] – a recap of the last 24 hours
/digest week [filters] – a recap of the last 7 days
/schedule <daily|weekly|off> [filters] – a recap sent to you, at the hour you set it up
/stop – stop everything

Examples: /follow #deploy, /follow @rauf-aliyev, /follow all
          /digest #deploy @rauf-aliyev, /schedule daily #git @someone, /schedule weekly
A scheduled recap comes every 24 hours (daily) or 7 days (weekly) from the moment you set it, so run the command at the hour you want it.
Browse tags and authors: ${SITE_URL}`,
  followUsage: `Tell me what to follow:
/follow #deploy – a tag
/follow @someone – an author
/follow all – every new note

Find tags and authors on ${SITE_URL}`,
  unfollowUsage: "Tell me what to stop: /unfollow #deploy or /unfollow @rauf-aliyev",
  badTag: "Tags can only have letters, digits and hyphens, like #deploy.",
  badTarget: (q: string) => `I can't follow “${q}”. Use a #tag, an @author or all, like /follow #deploy.`,
  badAuthor: "Author handles look like @rauf-aliyev: letters, digits and hyphens.",
  noAuthor: "I couldn't find that author.",
  added: (what: string) => `Done. I'll send new notes for ${what} here.`,
  exists: (what: string) => `You already follow ${what}.`,
  limit: `You can follow up to ${MAX_FOLLOWS} things. Use /unfollow to make room.`,
  removed: (what: string) => `Stopped. You won't get notes for ${what} any more.`,
  notFollowing: (what: string) => `You don't follow ${what}.`,
  list: (items: string) => `You follow:\n${items}`,
  none: "You don't follow anything yet. Try /follow #deploy or /follow all.",
  stopped: "Unsubscribed from everything. Use /follow to start again.",
  needsDatabase: "Recaps need the database, which isn't connected in demo mode.",
  tooManyFilters: `Use up to ${MAX_FILTERS} filters at a time.`,
  digestNothingFollowed:
    "You don't follow anything yet. Follow something first (/follow #deploy), or ask for specific notes: /digest #deploy.",
  digestEmpty: (period: string, filters: string[]) => `Nothing new in the ${period}${filters.length ? ` for ${filters.join(", ")}` : ""}.`,
  noClockTime:
    "Recaps don't take a clock time. Run /schedule daily (or /schedule weekly) at the hour you want it, and it comes at that hour every day.",
  scheduleUsage: `Pick how often you want a recap:
/schedule daily – every 24 hours
/schedule weekly – every 7 days
/schedule daily #git @someone – only what you list
/schedule off – back to a message per note

The first recap comes a day (or a week) after you set it, then at the same time after that, so run the command at the hour you want it. While a recap is on, I send it instead of a message for each note.`,
  scheduleSet: (when: string, what: string, first: string) =>
    `Done. You'll get a recap ${when}, of ${what}, starting ${first} at about this time. While it's on I pause the instant messages from your follows. /schedule off brings them back.`,
  scheduleCurrent: (when: string, what: string) =>
    `Your recap is on: ${when}, of ${what}. Change it with /schedule daily or /schedule weekly, or turn it off with /schedule off.`,
  scheduleOff: "Recaps are off. You'll get a message for each new note again.",
  addedToRecap: (what: string) =>
    `Done. You follow ${what}. Your recap is on, so it will show up in your next recap, not as a message right away.`,
  addedBesideFilteredRecap: (what: string) =>
    `Done. You follow ${what}, but your recap has its own filters and instant messages are paused while it's on, so you won't hear about it until you run /schedule off.`,
};

function describe(f: Follow) {
  if (f.target === "all") return "everything";
  return f.target === "tag" ? `#${f.value}` : `@${f.value}`;
}

type Parsed = { follow: Follow; label: string } | { reply: string };

/**
 * What the person typed after /follow or /unfollow: "all", "#tag" or "@author".
 * Authors must exist to be followed, but can always be dropped.
 */
async function parseTarget(arg: string, mustExist = true): Promise<Parsed> {
  if (arg.startsWith("@")) {
    const handle = arg.slice(1).toLowerCase();
    if (!HANDLE_PATTERN.test(handle)) return { reply: tx.badAuthor };
    if (mustExist && !(await authorExists(handle))) return { reply: tx.noAuthor };
    return { follow: { target: "author", value: handle }, label: `@${handle}` };
  }
  if (arg.startsWith("#")) {
    const tag = normalizeTag(arg);
    if (!tag || !TAG_PATTERN.test(tag)) return { reply: tx.badTag };
    return { follow: { target: "tag", value: tag }, label: `#${tag}` };
  }
  if (["all", "everything"].includes(arg.toLowerCase())) return { follow: { target: "all", value: "" }, label: "everything" };
  return { reply: tx.badTarget(arg) };
}

/** A deep link from the site's Follow button: t.me/<bot>?start=<payload>. */
async function parsePayload(payload: string): Promise<Parsed | null> {
  const target = parseStartPayload(payload);
  if (!target) return null;
  if (target.type === "tag") return { follow: { target: "tag", value: target.slug }, label: `#${target.slug}` };
  if (!(await authorExists(target.slug))) return { reply: tx.noAuthor };
  return { follow: { target: "author", value: target.slug }, label: `@${target.slug}` };
}

const FOLLOW_SCOPES = { all: "anywhere", tag: "with this tag", author: "by this author" } as const;

/** callback_data for taking a follow back. Telegram allows 64 bytes; null when it wouldn't fit. */
function undoData(f: Follow) {
  const data = `undo:${f.target === "all" ? "all" : startPayload({ type: f.target, slug: f.value })}`;
  return new TextEncoder().encode(data).length <= 64 ? data : null;
}

function undoTarget(data: string): Follow | null {
  if (data === "all") return { target: "all", value: "" };
  const target = parseStartPayload(data);
  return target ? { target: target.type, value: target.slug } : null;
}

/** "You're following: #deploy", what that means, and buttons to look at it or take it back. */
function followed(f: Follow, label: string): Reply {
  const page = f.target === "all" ? SITE_URL : `${SITE_URL}/${f.target}/${encodeURIComponent(f.value)}`;
  const undo = undoData(f);
  return {
    html: `<b>You're following: ${esc(label)}</b>\n\nI'll message you here when a new note is published ${FOLLOW_SCOPES[f.target]}.`,
    buttons: [
      { text: f.target === "all" ? "Open feed" : `View ${f.target}`, url: page },
      ...(undo ? [{ text: "Cancel", callback_data: undo }] : []),
    ],
  };
}

async function follow(chatId: number, parsed: Parsed): Promise<Reply> {
  if ("reply" in parsed) return parsed.reply;
  const result = await addFollow(chatId, parsed.follow);
  if (result === "exists") return tx.exists(parsed.label);
  if (result === "limit") return tx.limit;
  const recap = await getSchedule(chatId);
  if (!recap) return followed(parsed.follow, parsed.label);
  return recap.everything || recap.tags || recap.authors ? tx.addedBesideFilteredRecap(parsed.label) : tx.addedToRecap(parsed.label);
}

const PERIODS = { day: { hours: 24, label: "last 24 hours" }, week: { hours: 24 * 7, label: "last 7 days" } } as const;

/** Words that name a time of day, which recaps don't take. */
const CLOCK_TIME = /^(\d{1,2}:\d{2}|midnight|morning|noon|evening)$/;

/** A saved recap. tags and authors are null, and everything false, when it covers what the chat follows. */
interface Recap {
  frequency: "daily" | "weekly";
  everything: boolean;
  tags: string[] | null;
  authors: string[] | null;
}

interface Filters {
  everything: boolean;
  tags: string[];
  authors: string[];
  labels: string[];
}

const emptyFilters = (): Filters => ({ everything: false, tags: [], authors: [], labels: [] });

/** Add one "#tag", "@author" or "all" to the filters. Returns an error reply, or null when it worked. */
async function addFilter(filters: Filters, word: string): Promise<string | null> {
  if (CLOCK_TIME.test(word.toLowerCase())) return tx.noClockTime;
  const parsed = await parseTarget(word);
  if ("reply" in parsed) return parsed.reply;
  const { target, value } = parsed.follow;
  if (target === "all") filters.everything = true;
  else if (target === "tag") filters.tags.push(value);
  else filters.authors.push(value);
  filters.labels.push(parsed.label);
  return null;
}

function describeSchedule(r: Recap) {
  return r.frequency === "weekly" ? "every 7 days" : "every 24 hours";
}

/** What a recap covers, for people: "what you follow", or the list it was saved with. */
function describeFilters(r: Recap) {
  if (!r.everything && !r.tags && !r.authors) return "what you follow";
  const parts = [...(r.everything ? ["everything"] : []), ...(r.tags ?? []).map((t) => `#${t}`), ...(r.authors ?? []).map((a) => `@${a}`)];
  return parts.length > 6 ? `${parts.slice(0, 6).join(", ")} and ${parts.length - 6} more` : parts.join(", ");
}

async function getSchedule(chatId: number): Promise<Recap | null> {
  if (isMock) return null;
  const { data } = await db().from("digest_schedules").select("frequency, everything, tags, authors").eq("chat_id", chatId).maybeSingle();
  return data ? { ...data, frequency: data.frequency as Recap["frequency"] } : null;
}

/**
 * Save a recap, replacing any earlier one. It counts from now (created_at), so the first one comes a day
 * or a week later, and nothing fires at once.
 */
async function saveRecap(chatId: number, recap: { frequency: Recap["frequency"]; filters: Filters }): Promise<string> {
  const filtered = recap.filters.labels.length > 0;
  const uniq = (xs: string[]) => [...new Set(xs)];
  const row = {
    chat_id: chatId,
    frequency: recap.frequency,
    everything: recap.filters.everything,
    tags: filtered ? uniq(recap.filters.tags) : null,
    authors: filtered ? uniq(recap.filters.authors) : null,
    last_occurrence: null,
    created_at: new Date().toISOString(),
  };
  await db().from("telegram_chats").upsert({ chat_id: chatId, blocked_at: null }, { onConflict: "chat_id" });
  const { error } = await db().from("digest_schedules").upsert(row, { onConflict: "chat_id" });
  if (error) throw new Error(error.message);
  const saved: Recap = { ...row, frequency: recap.frequency };
  return tx.scheduleSet(describeSchedule(saved), describeFilters(saved), recap.frequency === "weekly" ? "next week" : "tomorrow");
}

/** /schedule daily · /schedule weekly #git @rauf · /schedule off · /schedule (show it) */
async function schedule(chatId: number, arg: string): Promise<string> {
  if (isMock) return tx.needsDatabase;
  const words = arg.split(/[\s,]+/).filter(Boolean);
  if (!words.length) {
    const current = await getSchedule(chatId);
    return current ? tx.scheduleCurrent(describeSchedule(current), describeFilters(current)) : tx.scheduleUsage;
  }
  if (words.length > MAX_FILTERS + 1) return tx.tooManyFilters;
  const first = words[0].toLowerCase();
  if (first === "off") {
    await db().from("digest_schedules").delete().eq("chat_id", chatId);
    return tx.scheduleOff;
  }
  if (first !== "daily" && first !== "weekly") return tx.scheduleUsage;

  const filters = emptyFilters();
  for (const word of words.slice(1)) {
    const problem = await addFilter(filters, word);
    if (problem) return problem;
  }
  return saveRecap(chatId, { frequency: first, filters });
}

/**
 * /digest [week] [#tag | @author | all ...]
 * A recap built now. With no filters it covers what the chat follows; with filters it covers exactly
 * those, followed or not. /digest daily and /digest weekly are /schedule by another name.
 */
async function digest(chatId: number, arg: string): Promise<Reply> {
  if (isMock) return tx.needsDatabase;
  const words = arg.split(/[\s,]+/).filter(Boolean);
  if (words.length > MAX_FILTERS) return tx.tooManyFilters;
  if (["daily", "weekly", "off"].includes(words[0]?.toLowerCase())) return schedule(chatId, arg);

  let period: keyof typeof PERIODS = "day";
  const filters = emptyFilters();
  for (const word of words) {
    const w = word.toLowerCase();
    if (w === "day" || w === "today") period = "day";
    else if (w === "week") period = "week";
    else {
      const problem = await addFilter(filters, word);
      if (problem) return problem;
    }
  }

  const filtered = filters.labels.length > 0;
  if (!filtered && !(await listFollows(chatId)).length) return tx.digestNothingFollowed;
  const { hours, label } = PERIODS[period];
  const { data, error } = await db().rpc("digest_text", {
    p_chat_id: chatId,
    p_since: new Date(Date.now() - hours * 3600_000).toISOString(),
    p_label: `in the ${label}`,
    p_site_url: SITE_URL,
    ...(filtered ? { p_tags: filters.tags, p_authors: filters.authors, p_everything: filters.everything } : {}),
  });
  if (error) throw new Error(error.message);
  return data ? { html: data, buttons: DIGEST_BUTTONS } : tx.digestEmpty(label, filters.labels);
}

const DIGEST_BUTTONS: Button[] = [
  { text: "Open feed", url: SITE_URL },
  { text: "Subscriptions", callback_data: "list" },
];

/** The follow that brought a note to a chat, most specific first: a tag, then the author, then "all". */
async function followBehind(chatId: number, postId: number): Promise<Follow | null> {
  if (isMock) return null;
  const [follows, { data: post }] = await Promise.all([
    listFollows(chatId),
    db().from("public_posts").select("tags, author_handle").eq("id", postId).maybeSingle(),
  ]);
  if (!post) return null;
  const tags = post.tags ?? [];
  return (
    follows.find((f) => f.target === "tag" && tags.includes(f.value)) ??
    follows.find((f) => f.target === "author" && f.value === post.author_handle) ??
    follows.find((f) => f.target === "all") ??
    null
  );
}

/** What a chat follows, as the /list reply. */
async function listReply(chatId: number) {
  const [follows, current] = await Promise.all([listFollows(chatId), getSchedule(chatId)]);
  let reply = follows.length ? tx.list(follows.map((f) => `• ${describe(f)}`).join("\n")) : tx.none;
  if (current) reply += `\n\nRecap: ${describeSchedule(current)}, of ${describeFilters(current)}`;
  return reply;
}

/** Stops a pressed button's spinner. Best effort: it needs the bot token, and the reply itself goes in the webhook response. */
async function answerCallback(id: string, text?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, text }),
  }).catch(() => {});
}

/** A pressed inline button. The webhook response edits or adds to the message it sits under. */
async function handleCallback(query: NonNullable<TelegramUpdate["callback_query"]>) {
  const chat = query.message?.chat.id;
  const messageId = query.message?.message_id;
  if (!chat || !messageId || !query.data) return new Response("ok");
  const [action, ...rest] = query.data.split(":");
  const arg = rest.join(":");

  if (action === "list") {
    await answerCallback(query.id);
    return Response.json({ method: "sendMessage", chat_id: chat, text: await listReply(chat), disable_web_page_preview: true });
  }

  if (action === "stop") {
    const postId = Number(arg);
    const follow = Number.isInteger(postId) ? await followBehind(chat, postId) : null;
    if (follow) await removeFollow(chat, follow);
    await answerCallback(query.id, follow ? tx.removed(describe(follow)) : "You don't follow this any more.");
    // The note stays; only its second button changes, so a second press can't do anything.
    return Response.json({
      method: "editMessageReplyMarkup",
      chat_id: chat,
      message_id: messageId,
      reply_markup: keyboard([
        { text: "Read", url: `${SITE_URL}/post/${postId}` },
        { text: "Subscriptions", callback_data: "list" },
      ]),
    });
  }

  if (action === "undo") {
    const target = undoTarget(arg);
    if (!target) return Response.json({ method: "answerCallbackQuery", callback_query_id: query.id });
    const label = describe(target);
    const text = (await removeFollow(chat, target)) ? tx.removed(label) : tx.notFollowing(label);
    await answerCallback(query.id);
    return Response.json({ method: "editMessageText", chat_id: chat, message_id: messageId, text });
  }

  return Response.json({ method: "answerCallbackQuery", callback_query_id: query.id });
}

export async function POST(event: APIEvent) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || event.request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  const update = (await event.request.json().catch(() => null)) as TelegramUpdate | null;
  if (update?.callback_query) return handleCallback(update.callback_query);
  const message = update?.message;
  if (!message?.text) return new Response("ok");

  const chatId = message.chat.id;
  const [head, ...words] = message.text.trim().split(/\s+/);
  const arg = words.join(" ");
  let reply: Reply;

  switch (head.split("@")[0].toLowerCase()) {
    case "/start": {
      const parsed = arg ? await parsePayload(arg) : null;
      reply = parsed ? await follow(chatId, parsed) : tx.welcome;
      break;
    }
    case "/follow":
      reply = arg ? await follow(chatId, await parseTarget(arg)) : tx.followUsage;
      break;
    case "/unfollow": {
      if (!arg) {
        reply = tx.unfollowUsage;
        break;
      }
      const parsed = await parseTarget(arg, false);
      if ("reply" in parsed) reply = parsed.reply;
      else reply = (await removeFollow(chatId, parsed.follow)) ? tx.removed(parsed.label) : tx.notFollowing(parsed.label);
      break;
    }
    case "/list":
      reply = await listReply(chatId);
      break;
    case "/digest":
    case "/dailyrecap":
      reply = await digest(chatId, arg);
      break;
    case "/schedule":
      reply = await schedule(chatId, arg);
      break;
    case "/stop":
      await clearFollows(chatId);
      reply = tx.stopped;
      break;
    default:
      reply = tx.help;
  }

  if (typeof reply === "string")
    return Response.json({ method: "sendMessage", chat_id: chatId, text: reply, disable_web_page_preview: true });
  return Response.json({
    method: "sendMessage",
    chat_id: chatId,
    text: reply.html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: keyboard(reply.buttons),
  });
}
