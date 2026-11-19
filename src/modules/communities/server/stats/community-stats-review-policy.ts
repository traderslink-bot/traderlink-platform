import "server-only";
import {
  COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,
  COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS,
  isCommunityReviewDiscordGuild,
} from "../community-review-discord-guild";
import {platformFailure} from "../../../platform/server/database/platform-migration-contract";

/** Stats alone opts into the owner's designated Main review channels. */
export function isStatsReviewGuild(guildId:unknown):guildId is string{
  return typeof guildId==="string"&&(isCommunityReviewDiscordGuild(guildId)||guildId===COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID);
}
export function assertStatsReviewGuild(guildId:unknown):asserts guildId is string{
  if(!isStatsReviewGuild(guildId))platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
}
/** Parent selection only; verified public threads inherit a selected parent. */
export function isStatsReviewChannel(guildId:unknown,channelId:unknown):channelId is string{
  return isStatsReviewGuild(guildId)&&typeof channelId==="string"&&/^\d{1,32}$/u.test(channelId)
    &&(isCommunityReviewDiscordGuild(guildId)||COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS.some(id=>id===channelId));
}
