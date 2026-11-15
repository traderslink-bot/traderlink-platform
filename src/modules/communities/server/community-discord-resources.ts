import type { CommunityDiscordResources } from "../contracts/community-discord-resources";

type Role = { id: string; name: string; permissions: string };
type Overwrite = { id: string; type: number; allow: string; deny: string };
const snowflake = /^\d{1,32}$/u;
const bitfield = /^\d{1,32}$/u;
const REQUIRED = BigInt(1024) | BigInt(2048); // View channel and send messages.

export function canBotPublish(guildId: string, botId: string, memberRoles: readonly string[], roles: readonly Role[], overwrites: readonly Overwrite[]): boolean {
  const everyone = roles.find(role => role.id === guildId);
  if (!everyone) return false;
  const selected = new Set(memberRoles);
  let permissions = BigInt(everyone.permissions);
  for (const role of roles) if (selected.has(role.id)) permissions |= BigInt(role.permissions);
  if (permissions & BigInt(8)) return true;
  const apply = (deny: bigint, allow: bigint) => { permissions = (permissions & ~deny) | allow; };
  const base = overwrites.find(item => item.type === 0 && item.id === guildId);
  if (base) apply(BigInt(base.deny), BigInt(base.allow));
  let deny = BigInt(0), allow = BigInt(0);
  for (const item of overwrites) if (item.type === 0 && item.id !== guildId && selected.has(item.id)) { deny |= BigInt(item.deny); allow |= BigInt(item.allow); }
  apply(deny, allow);
  const personal = overwrites.find(item => item.type === 1 && item.id === botId);
  if (personal) apply(BigInt(personal.deny), BigInt(personal.allow));
  return (permissions & REQUIRED) === REQUIRED;
}

/** Read-only discovery. No Discord roles, channels or permissions are modified. */
export async function readCommunityDiscordResources(guildId: string, token: string, request: typeof fetch = fetch): Promise<CommunityDiscordResources> {
  if (!snowflake.test(guildId) || !token.trim()) throw new Error("Discord connection unavailable.");
  async function get(path: string): Promise<unknown> {
    const response = await request(`https://discord.com/api/v10/${path}`, { headers: { Authorization: `Bot ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Discord server verification unavailable.");
    return response.json();
  }
  const [rawRoles, rawChannels, rawBot, rawGuild] = await Promise.all([get(`guilds/${guildId}/roles`), get(`guilds/${guildId}/channels`), get("users/@me"), get(`guilds/${guildId}`)]);
  const bot = rawBot as { id?: string; bot?: boolean };
  if (!bot || !bot.id || !snowflake.test(bot.id) || bot.bot !== true || !Array.isArray(rawRoles) || !Array.isArray(rawChannels)) throw new Error("Discord server verification unavailable.");
  const roles = rawRoles as Role[];
  if (roles.length > 1000 || roles.some(role => !role || !snowflake.test(role.id) || typeof role.name !== "string" || !bitfield.test(role.permissions)) || !roles.some(role => role.id === guildId)) throw new Error("Discord roles unavailable.");
  const member = await get(`guilds/${guildId}/members/${bot.id}`) as { user?: { id?: string }; roles?: unknown; communication_disabled_until?: string | null };
  if (member?.user?.id !== bot.id || !Array.isArray(member.roles) || member.roles.some(role => typeof role !== "string" || !snowflake.test(role))) throw new Error("Discord bot membership unavailable.");
  const timedOut = Boolean(member.communication_disabled_until && Date.parse(member.communication_disabled_until) > Date.now());
  const channels: { id: string; name: string; canPublish: boolean }[] = [];
  for (const channel of rawChannels as { id: string; guild_id?: string; name: string; type: number; permission_overwrites?: Overwrite[] }[]) {
    if (!channel || !snowflake.test(channel.id) || typeof channel.name !== "string" || (channel.guild_id !== undefined && channel.guild_id !== guildId)) throw new Error("Discord channels unavailable.");
    if (channel.type !== 0 && channel.type !== 5) continue; // Text/announcement only; no forum/thread fallback.
    const overwrites = channel.permission_overwrites;
    if (!Array.isArray(overwrites) || overwrites.some(item => !item || !snowflake.test(item.id) || ![0,1].includes(item.type) || !bitfield.test(item.allow) || !bitfield.test(item.deny))) throw new Error("Discord channel permissions unavailable.");
    channels.push({ id: channel.id, name: channel.name, canPublish: !timedOut && canBotPublish(guildId, bot.id, member.roles as string[], roles, overwrites) });
  }
  const guild=rawGuild as {id?:string;name?:string};
  if(guild.id!==guildId||typeof guild.name!=="string")throw new Error("Discord server identity unavailable.");
  return { guildName:guild.name, roles: roles.map(({ id, name }) => ({ id, name })), channels };
}
