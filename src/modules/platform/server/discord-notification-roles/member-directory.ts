import "server-only";
import type { JournalAdminScope } from "../../contracts/journal-admin-scope";
import { notificationRoles, type NotificationRoleKey } from "./catalog";
import { isDiscordId, notificationRoleConfiguration } from "./configuration";
import { discordNotificationUserAgent } from "./http-client";

type Member = { user: { id: string; username: string; global_name?: string | null }; nick?: string | null; roles: string[] };
type Role = { id: string; name: string };
export type DirectoryMember = { id: string; username: string; displayName: string; roles: NotificationRoleKey[]; premium: boolean };
export type DirectoryResult =
  | { status: "ready"; members: DirectoryMember[]; checkedAt: string }
  | { status: "unavailable"; message: string };

/** Read-only Discord authority. Never changes roles, permissions, subscriptions or entitlements. */
export async function notificationMemberDirectory(scope: JournalAdminScope): Promise<DirectoryResult> {
  if (!scope.permissions.includes("read_user_details")) throw new Error("Journal admin access denied");
  const config = notificationRoleConfiguration();
  if (!config) return { status: "unavailable", message: "The Discord member directory is not configured yet. No member list has been loaded." };
  const deadline = Date.now() + 60_000;
  async function get(path: string): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error("unavailable");
      const response = await fetch(`https://discord.com/api/v10${path}`, {
        headers: { Authorization: `Bot ${config!.botToken}`, "User-Agent": discordNotificationUserAgent, "Content-Type": "application/json" }, cache: "no-store",
        signal: AbortSignal.timeout(Math.min(10_000, remaining)),
      });
      if (response.status === 429) {
        const body = await response.json() as { retry_after?: unknown };
        if (typeof body.retry_after !== "number" || !Number.isFinite(body.retry_after) || body.retry_after < 0
          || body.retry_after > 5 || Date.now() + body.retry_after * 1000 >= deadline) throw new Error("unavailable");
        await new Promise(resolve => setTimeout(resolve, Math.max(50, body.retry_after as number * 1000)));
        continue;
      }
      if (!response.ok) throw new Error("unavailable");
      return response.json();
    }
    throw new Error("unavailable");
  }
  try {
    const bot = await get("/users/@me") as { id?: string; bot?: boolean };
    if (bot.id !== config.applicationId || bot.bot !== true) throw new Error("unavailable");
    const roles = await get(`/guilds/${config.guildId}/roles`) as Role[];
    if (!Array.isArray(roles) || !roles.every(role => role && isDiscordId(role.id) && typeof role.name === "string")) throw new Error("unavailable");
    for (const role of notificationRoles) {
      if (!roles.some(item => item.id === config.roleIds[role.key] && item.name === role.label.slice(1))) throw new Error("unavailable");
    }
    const premiumId = process.env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID?.trim();
    const premium = premiumId ? roles.filter(role => role.id === premiumId && role.name === "Premium Members")
      : roles.filter(role => role.name === "Premium Members");
    if (premium.length !== 1) return { status: "unavailable", message: "The Premium Members role could not be identified uniquely. No member list has been loaded." };
    const members = new Map<string, DirectoryMember>();
    let after = "0";
    // Discord returns at most 1,000 per request. Continue until exhaustion, never a fixed total cap.
    for (;;) {
      const batch = await get(`/guilds/${config.guildId}/members?limit=1000&after=${after}`) as Member[];
      if (!Array.isArray(batch) || batch.length > 1000) throw new Error("unavailable");
      let next = after;
      for (const member of batch) {
        if (!member || !isDiscordId(member.user?.id) || typeof member.user.username !== "string"
          || !Array.isArray(member.roles) || !member.roles.every(isDiscordId)) throw new Error("unavailable");
        if (BigInt(member.user.id) <= BigInt(after)) throw new Error("unavailable");
        if (BigInt(member.user.id) > BigInt(next)) next = member.user.id;
        const selected = notificationRoles.filter(role => member.roles.includes(config.roleIds[role.key])).map(role => role.key);
        if (selected.length) members.set(member.user.id, {
          id: member.user.id, username: member.user.username,
          displayName: typeof member.nick === "string" && member.nick ? member.nick
            : typeof member.user.global_name === "string" && member.user.global_name ? member.user.global_name : member.user.username,
          roles: selected, premium: member.roles.includes(premium[0].id),
        });
      }
      if (batch.length < 1000) break;
      if (next === after) throw new Error("unavailable");
      after = next;
    }
    return { status: "ready", members: [...members.values()].sort((a, b) => a.username.localeCompare(b.username) || a.id.localeCompare(b.id)), checkedAt: new Date().toISOString() };
  } catch {
    return { status: "unavailable", message: "Discord could not provide the complete member list. Check the bot token, server access and Server Members Intent, then refresh. No partial list is shown." };
  }
}
