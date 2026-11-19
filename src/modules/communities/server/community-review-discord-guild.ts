import "server-only";

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const COMMUNITY_REVIEW_DISCORD_GUILD_ID = "1559172784813514803";
export const COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID = "1433570740430573642";
export const COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS = Object.freeze([
  "1546033958448529508",
  "1546034056725008385",
  "1546033844468187156",
] as const);

export const COMMUNITY_STAGING_QA_DISCORD_GUILD_IDS = Object.freeze([
  COMMUNITY_REVIEW_DISCORD_GUILD_ID,
  COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,
] as const);

export function isCommunityReviewDiscordGuild(guildId: unknown): boolean {
  return guildId === COMMUNITY_REVIEW_DISCORD_GUILD_ID;
}

export function assertCommunityReviewDiscordGuild(guildId: unknown): void {
  if (!isCommunityReviewDiscordGuild(guildId)) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED", {
      resource: "community_discord_review",
    });
  }
}

/** Staging-only target inventory. Production workers keep the Tests-only guard above. */
export function isCommunityStagingQaDiscordGuild(guildId: unknown): guildId is typeof COMMUNITY_STAGING_QA_DISCORD_GUILD_IDS[number] {
  return typeof guildId === "string" && COMMUNITY_STAGING_QA_DISCORD_GUILD_IDS.includes(guildId as typeof COMMUNITY_STAGING_QA_DISCORD_GUILD_IDS[number]);
}

/** Main is limited to the three owner-designated test channels; Tests retains sealed fresh discovery. */
export function isCommunityStagingQaDiscordChannel(guildId: unknown,channelId:unknown):boolean{
  if(typeof channelId!=="string"||!/^\d{1,32}$/.test(channelId))return false;
  if(guildId===COMMUNITY_REVIEW_DISCORD_GUILD_ID)return true;
  return guildId===COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID&&COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS.includes(channelId as typeof COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS[number]);
}
