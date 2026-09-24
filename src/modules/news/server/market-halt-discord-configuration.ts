import "server-only";

import { resolveTraderLinkDiscordGuildId } from "../../platform/server/authentication/platform-discord-configuration";

export type MarketHaltDiscordConfiguration = Readonly<{
  botToken: string;
  channelId: string;
  guildId: string;
}>;

export function loadMarketHaltDiscordConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): MarketHaltDiscordConfiguration | null {
  const channelId = environment.DISCORD_HALT_ALERT_CHANNEL_ID?.trim();
  if (!channelId) return null;
  const botToken = environment.DISCORD_BOT_TOKEN?.trim();
  if (!/^[0-9]{1,32}$/u.test(channelId) || !botToken || botToken.length < 20) {
    throw new Error("market_halt_discord_configuration_invalid");
  }
  return Object.freeze({ botToken, channelId, guildId: resolveTraderLinkDiscordGuildId(environment) });
}
