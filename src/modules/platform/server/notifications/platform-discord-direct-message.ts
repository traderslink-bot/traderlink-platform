import "server-only";

const DISCORD_API = "https://discord.com/api/v10";

function botToken(environment: NodeJS.ProcessEnv): string | null {
  const value = environment.DISCORD_BOT_TOKEN?.trim();
  return value && value.length >= 20 ? value : null;
}

function publicOrigin(environment: NodeJS.ProcessEnv): string | null {
  const redirect = environment.DISCORD_REDIRECT_URI?.trim();
  if (!redirect) return null;
  try {
    const parsed = new URL(redirect);
    return parsed.protocol === "https:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

/** Sends only generic, user-requested completion notices. Callers keep the
 * in-app notification authoritative when Discord is unavailable. */
export async function sendDiscordStatementImportCompletion(input: Readonly<{
  discordSubject: string;
  environment?: NodeJS.ProcessEnv;
}>): Promise<boolean> {
  const environment = input.environment ?? process.env;
  const token = botToken(environment);
  const origin = publicOrigin(environment);
  if (!token || !origin || !/^\d{1,32}$/u.test(input.discordSubject)) return false;
  const headers = Object.freeze({
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  });
  try {
    const channel = await fetch(`${DISCORD_API}/users/@me/channels`, {
      method: "POST", headers, body: JSON.stringify({ recipient_id: input.discordSubject }),
    });
    if (!channel.ok) return false;
    const body: unknown = await channel.json();
    const channelId = body && typeof body === "object" &&
      typeof (body as { id?: unknown }).id === "string"
      ? (body as { id: string }).id
      : null;
    if (!channelId || !/^\d{1,32}$/u.test(channelId)) return false;
    const message = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST", headers,
      body: JSON.stringify({ content: `Your statement import is ready. Open ${origin}/imports` }),
    });
    return message.ok;
  } catch {
    return false;
  }
}
