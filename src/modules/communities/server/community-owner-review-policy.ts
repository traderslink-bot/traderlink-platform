import "server-only";

import {
  COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS,
  COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,
  COMMUNITY_REVIEW_DISCORD_GUILD_ID,
} from "./community-review-discord-guild";

/** A fixed server-owned intent after the existing selected-identity gate.
 * It authorizes discovery only; native membership, ownership, admission and
 * individual capabilities still apply. Generic callers remain Tests-only. */
export type CommunityOwnerReviewIntent = "community-owner-review";

export function isCommunityOwnerReviewGuild(guildId: unknown): boolean {
  return guildId === COMMUNITY_REVIEW_DISCORD_GUILD_ID || guildId === COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID;
}

export function isCommunityOwnerReviewChannel(guildId: unknown, channelId: unknown): boolean {
  if (typeof channelId !== "string" || !/^[0-9]{1,32}$/u.test(channelId)) return false;
  return guildId === COMMUNITY_REVIEW_DISCORD_GUILD_ID
    || guildId === COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID && COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS.some(id => id === channelId);
}
