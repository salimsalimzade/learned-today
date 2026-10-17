import type { APIEvent } from "@solidjs/start/server";
import { isMock, SITE_URL } from "~/lib/env";
import { createSupabaseAdminClient } from "~/lib/supabase/server";
import { parseStartPayload } from "~/lib/telegram";

/**
 * POST /api/telegram: the bot's webhook.
 * Register it once:
 *   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
 *     -d url=https://your.site/api/telegram -d secret_token=$TELEGRAM_WEBHOOK_SECRET
 *
 * Commands: /start <payload> follows a topic, tag or author (payloads come from the
 * İzlə popover's deep link), /start alone follows everything, /list, /stop.
 * Replies go back in the webhook response itself, so no bot token is needed here.
 * Sending new-post messages is the notifier's job (supabase/functions/notifier).
 */

interface TelegramUpdate {
  message?: { chat: { id: number }; text?: string; from?: { language_code?: string } };
}

type Follow = { target: "all" | "topic" | "tag" | "author"; value: string };

// Demo mode keeps follows in memory, per server process.
const demoFollows = new Map<number, Follow[]>();

async function addFollow(chatId: number, f: Follow, lang: "az" | "en") {
  if (isMock) {
    const list = demoFollows.get(chatId) ?? [];
    if (!list.some((x) => x.target === f.target && x.value === f.value)) list.push(f);
    demoFollows.set(chatId, list);
    return;
  }
  const db = createSupabaseAdminClient();
  await db.from("telegram_chats").upsert({ chat_id: chatId, language: lang, blocked_at: null }, { onConflict: "chat_id" });
  await db.from("follows").upsert({ chat_id: chatId, target: f.target, value: f.value }, { onConflict: "chat_id,target,value" });
}

async function listFollows(chatId: number): Promise<Follow[]> {
  if (isMock) return demoFollows.get(chatId) ?? [];
  const { data } = await createSupabaseAdminClient().from("follows").select("target, value").eq("chat_id", chatId);
  return data ?? [];
}

async function clearFollows(chatId: number) {
  if (isMock) return void demoFollows.delete(chatId);
  await createSupabaseAdminClient().from("follows").delete().eq("chat_id", chatId);
}

const text = {
  az: {
    followed: (what: string) => `Hazırdır. ${what} üzrə yeni qeydləri bura göndərəcəyəm.`,
    all: "Bütün yeni qeydləri bura göndərəcəyəm. Yalnız bir mövzunu izləmək üçün saytda İzlə düyməsini bas.",
    list: (items: string) => `İzlədiklərin:\n${items}`,
    none: "Hələ heç nə izləmirsən.",
    stopped: "Abunəlik dayandırıldı. Yenidən başlamaq üçün /start yaz.",
    help: `Əmrlər:\n/list – izlədiklərin\n/stop – hamısını dayandır\n\nMövzu, teq və ya müəllifi saytda İzlə düyməsi ilə əlavə et: ${SITE_URL}`,
  },
  en: {
    followed: (what: string) => `Done. I'll send new notes for ${what} here.`,
    all: "I'll send every new note here. To follow just one topic, use the Follow button on the site.",
    list: (items: string) => `You follow:\n${items}`,
    none: "You don't follow anything yet.",
    stopped: "Unsubscribed. Send /start to begin again.",
    help: `Commands:\n/list – what you follow\n/stop – stop everything\n\nAdd a topic, tag or author with the Follow button on the site: ${SITE_URL}`,
  },
};

const label = (f: Follow) =>
  f.target === "all" ? "*" : f.target === "tag" ? `#${f.value}` : f.target === "author" ? `@${f.value}` : f.value;

export async function POST(event: APIEvent) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || event.request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  const update = (await event.request.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;
  if (!message?.text) return new Response("ok");

  const chatId = message.chat.id;
  const lang = message.from?.language_code?.startsWith("az") ? "az" : "en";
  const tx = text[lang];
  const [command, arg] = message.text.trim().split(/\s+/, 2);
  let reply: string;

  switch (command.split("@")[0]) {
    case "/start": {
      const target = arg ? parseStartPayload(arg) : null;
      if (target) {
        await addFollow(chatId, { target: target.type, value: target.slug }, lang);
        reply = tx.followed(label({ target: target.type, value: target.slug }));
      } else {
        await addFollow(chatId, { target: "all", value: "" }, lang);
        reply = tx.all;
      }
      break;
    }
    case "/list": {
      const follows = await listFollows(chatId);
      reply = follows.length ? tx.list(follows.map((f) => `• ${label(f)}`).join("\n")) : tx.none;
      break;
    }
    case "/stop":
      await clearFollows(chatId);
      reply = tx.stopped;
      break;
    default:
      reply = tx.help;
  }

  return Response.json({ method: "sendMessage", chat_id: chatId, text: reply, disable_web_page_preview: true });
}
