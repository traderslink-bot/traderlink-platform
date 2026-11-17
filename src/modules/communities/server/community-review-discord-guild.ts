import "server-only";

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const COMMUNITY_REVIEW_DISCORD_GUILD_ID = "1559172784813514803";

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
