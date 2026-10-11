import { createHash } from "node:crypto";
import { notificationRoles, type NotificationRoleKey } from "./catalog";

export function isDiscordId(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d{16,19}$/u.test(value);
}

export type NotificationRoleConfiguration = Readonly<{
  applicationId: string;
  publicKey: string;
  botToken: string;
  guildId: string;
  channelId: string;
  panelMessageId: string | null;
  roleIds: Readonly<Record<NotificationRoleKey, string>>;
  version: string;
}>;

/** No fallback to the community sender: the owner must identify the existing Platform bot. */
export function notificationRoleConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): NotificationRoleConfiguration | null {
  const applicationId = environment.DISCORD_APPLICATION_ID?.trim();
  const publicKey = environment.DISCORD_INTERACTIONS_PUBLIC_KEY?.trim();
  const botToken = environment.DISCORD_BOT_TOKEN?.trim();
  const guildId = environment.TRADERLINK_DISCORD_NOTIFICATION_GUILD_ID?.trim();
  const channelId = environment.TRADERLINK_DISCORD_NOTIFICATION_CHANNEL_ID?.trim();
  const panelMessageId = environment.TRADERLINK_DISCORD_NOTIFICATION_PANEL_MESSAGE_ID?.trim() || null;
  if (!isDiscordId(applicationId) || !isDiscordId(guildId) || !isDiscordId(channelId)
    || !publicKey || !/^[a-f\d]{64}$/iu.test(publicKey) || !botToken || botToken.length < 20
    || (panelMessageId !== null && !isDiscordId(panelMessageId))) return null;
  let mapping: unknown;
  try { mapping = JSON.parse(environment.TRADERLINK_DISCORD_NOTIFICATION_ROLE_IDS ?? ""); }
  catch { return null; }
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) return null;
  const values = mapping as Record<string, unknown>;
  // Upgrade this server's existing seven-role environment without a hosted mutation.
  // Explicit mappings remain authoritative; other guilds require all thirteen IDs.
  const legacyKeys = ["watchlist", "trading_tips", "day_trade", "swing_trade", "im_in", "im_out", "watching"];
  if (guildId === "1433570740430573642" && Object.keys(values).length === legacyKeys.length
    && legacyKeys.every(key => isDiscordId(values[key]))) {
    Object.assign(values, {
      live_scanner: "1558619263173009578", news_scanner: "1558619323461926962",
      news_30m_mc: "1558619363773251657", news_50m_mc: "1558619397721956453",
      news_100m_mc: "1558619443322691666", halt_alerts: "1558619478936395818",
    });
  }
  if (Object.keys(values).length !== notificationRoles.length) return null;
  const roleIds = {} as Record<NotificationRoleKey, string>;
  for (const role of notificationRoles) {
    const id = values[role.key];
    if (!isDiscordId(id) || id === guildId) return null;
    roleIds[role.key] = id;
  }
  if (new Set(Object.values(roleIds)).size !== notificationRoles.length) return null;
  const version = createHash("sha256").update(JSON.stringify({ applicationId, guildId, channelId, panelMessageId, roleIds })).digest("hex");
  return Object.freeze({ applicationId, publicKey, botToken, guildId, channelId, panelMessageId, roleIds: Object.freeze(roleIds), version });
}

export function notificationRoleSelectorEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.TRADERLINK_DISCORD_NOTIFICATION_ROLES_ENABLED === "true";
}
