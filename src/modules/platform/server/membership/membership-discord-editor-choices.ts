import { z } from "zod";

const snowflake = z.string().regex(/^\d{1,32}$/);
const choice = z.object({ id: snowflake, name: z.string().min(1).max(255) });
export type MembershipDiscordChoices = { items: { id: string; name: string }[]; nextCursor: string | null };

/** GET-only discovery using the existing Platform bot. No role assignment,
 * invitation, membership mutation, message, or notification is possible here. */
export async function readMembershipDiscordChoices(input: { guildId?: string; after?: string },
  environment: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): Promise<MembershipDiscordChoices> {
  const request = z.object({ guildId: snowflake.optional(), after: snowflake.optional() }).strict().parse(input);
  const token = environment.DISCORD_BOT_TOKEN?.trim();
  if (!token || token.length < 20) throw new Error("Connect the Platform Discord bot to load server and role names. Saved access rules remain editable.");
  const path = request.guildId ? `/guilds/${request.guildId}/roles`
    : `/users/@me/guilds?limit=200${request.after ? `&after=${request.after}` : ""}`;
  let response: Response;
  try {
    response = await fetcher("https://discord.com/api/v10" + path, {
      method: "GET", cache: "no-store", signal: AbortSignal.timeout(8_000),
      headers: { Authorization: `Bot ${token}` },
    });
  } catch { throw new Error("Discord discovery is unavailable. Your saved settings have not changed."); }
  if (!response.ok) throw new Error("Discord could not list these servers or roles. Check the bot connection and try again.");
  const parsed = z.array(choice).safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new Error("Discord returned an incomplete server or role list. Try again.");
  const items = parsed.data.filter(item => !request.guildId || item.id !== request.guildId);
  return { items, nextCursor: !request.guildId && parsed.data.length === 200 ? parsed.data[parsed.data.length - 1].id : null };
}
