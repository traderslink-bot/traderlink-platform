import "server-only";
import { resolveTraderLinkDiscordGuildId } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
export type ReverseSplitConfiguration = Readonly<{
  eodhdToken: string; secUserAgent: string; dataUseApproved: boolean;
  discord: Readonly<{ channelId: string; guildId: string; botToken: string }> | null;
}>;
export function reverseSplitConfiguration(env: NodeJS.ProcessEnv = process.env): ReverseSplitConfiguration | null {
  if (env.REVERSE_SPLIT_ENABLED !== "true") return null;
  const channelId = env.DISCORD_REVERSE_SPLIT_CHANNEL_ID?.trim() ?? "";
  const botToken = env.DISCORD_BOT_TOKEN?.trim() ?? "";
  const eodhdToken = (env.EODHD_API_TOKEN ?? env.LEVEL_EODHD_API_TOKEN)?.trim() ?? "";
  const secUserAgent = env.REVERSE_SPLIT_SEC_USER_AGENT?.trim() ?? "";
  if (!eodhdToken || !/^[\x20-\x7e]{10,200}$/u.test(secUserAgent) || !secUserAgent.includes("@")) throw new Error("reverse_split_configuration_invalid");
  const dataUseApproved = env.REVERSE_SPLIT_DATA_USE_APPROVED === "true";
  let discord: ReverseSplitConfiguration["discord"] = null;
  if (env.DISCORD_REVERSE_SPLIT_DELIVERY_ENABLED === "true") {
    if (!dataUseApproved) throw new Error("reverse_split_data_use_not_approved");
    if (!/^\d{1,32}$/u.test(channelId) || botToken.length < 20) throw new Error("reverse_split_discord_configuration_invalid");
    if (channelId === env.DISCORD_HALT_ALERT_CHANNEL_ID?.trim()) throw new Error("reverse_split_channel_must_be_separate");
    discord = { channelId, botToken, guildId: resolveTraderLinkDiscordGuildId(env) };
  }
  return { eodhdToken, secUserAgent, dataUseApproved, discord };
}
