import "server-only";

import {
  COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS,
  COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID,
  COMMUNITY_REVIEW_DISCORD_GUILD_ID,
} from "./community-review-discord-guild";

/** Shared-only metadata scope. Human entry points still require the selected
 * identity and actual native community permissions; this is not an access grant.
 * Other Community/Paid/Coaching callers retain their existing guild policy. */
export function isSharedAlertReviewGuild(guildId: unknown): guildId is string {
  return guildId === COMMUNITY_REVIEW_DISCORD_GUILD_ID
    || guildId === COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID;
}

/** The main server is limited to the three owner-designated test channels.
 * Tests channels must still pass fresh Discord type/permission verification. */
export function isSharedAlertReviewTarget(guildId: unknown, channelId: unknown): boolean {
  if (typeof channelId !== "string" || !/^[0-9]{1,32}$/u.test(channelId)) return false;
  if (guildId === COMMUNITY_REVIEW_DISCORD_GUILD_ID) return true;
  return guildId === COMMUNITY_MAIN_TEST_DISCORD_GUILD_ID
    && COMMUNITY_MAIN_TEST_DISCORD_CHANNEL_IDS.some(id => id === channelId);
}
