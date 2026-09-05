import type Database from "better-sqlite3";

import type { TraderLinkPlatformRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { platformFailure } from "../../platform/server/database/platform-migration-contract";

export type TraderLinkCommunityViewer = Readonly<{
  userId: string;
  displayName: string;
  discordRoleIds: readonly string[];
}>;

export function resolveTraderLinkCommunityViewer(
  database: Database.Database,
  identity: TraderLinkPlatformRequestIdentity,
  communitySlug: string,
): TraderLinkCommunityViewer {
  const community = database.prepare(`SELECT discord_guild_id FROM traderlink_communities WHERE slug = ?`)
    .get(communitySlug) as { discord_guild_id: string } | undefined;
  if (!community) platformFailure("TRADERLINK_WORKSPACE_NOT_FOUND", { resource: "community" });
  const membership = new PlatformDiscordMembershipRepository(database)
    .findCurrent(identity.scope.userId, community.discord_guild_id);
  if (!membership) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED", { resource: "community" });
  return Object.freeze({
    userId: identity.scope.userId,
    displayName: identity.displayName ?? membership.globalDisplayName ?? membership.username,
    discordRoleIds: membership.roleIds,
  });
}
