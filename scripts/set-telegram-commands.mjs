// Registers the bot's command menu (the "/" button) with Telegram.
// The bot works without it, since the webhook reads any message; this only adds the suggestions.
// Run: pnpm telegram:commands   (needs TELEGRAM_BOT_TOKEN in .env)
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set. Add it to .env first.");
  process.exit(1);
}

const commands = [
  { command: "follow", description: "Follow a #tag or @author" },
  { command: "unfollow", description: "Stop following a #tag or @author" },
  { command: "list", description: "Show what you follow and your recap" },
  {
    command: "digest",
    description: "Recap of the last 24 hours, or `week`. Filters: #tag, @author, all",
  },
  { command: "schedule", description: "Get a recap every 24 hours or 7 days, from now: daily, weekly or off. Filters: #tag, @author, all" },
  { command: "stop", description: "Stop all notifications" },
];

async function call(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}

try {
  await call("setMyCommands", { commands });
  const now = await call("getMyCommands");
  console.log("Commands set:");
  for (const c of now) console.log(`  /${c.command} - ${c.description}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
