import type Database from "better-sqlite3";
import type { TraderLinkCommunityDashboardSnapshot } from "../contracts/traderlink-community-platform-contracts";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { SharedAlertError } from "./shared-alerts-errors";
import { sharedAlertUnreadCount } from "./shared-alerts-read";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";

export type SharedAlertsOwnerProjection = Pick<TraderLinkCommunityDashboardSnapshot, "community" | "viewer" | "relationships"> & Readonly<{ sharedAlertsUnreadCount: number }>;

/** Small live-owner navigation read. Never loads full alert/Coaching/Journal snapshots or retained history. */
export function readSharedAlertsOwnerProjection(database: Database.Database, input: Readonly<{ communitySlug: string; userId: string; atUtc: string }>): SharedAlertsOwnerProjection {
  assertCanonicalUuidV4(input.userId, "userId");
  assertCanonicalUtcTimestamp(input.atUtc, "atUtc");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(input.communitySlug) || input.communitySlug.length > 100) throw new SharedAlertError("not_found");
  return database.transaction(() => {
    const repository = new SharedAlertsRepository(database, () => input.atUtc);
    const owner = repository.localOwner(input.communitySlug, input.userId);
    if (!repository.ownerIsFresh(owner)) throw new SharedAlertError("discord_unavailable");
    const access = new TraderLinkCommunityRepository(database).resolveAccess(owner.communityId, input.userId);
    const evidence = database.prepare("SELECT role_ids_json FROM platform_discord_memberships WHERE user_id=? AND guild_id=?").get(input.userId, owner.guildId) as { role_ids_json: string } | undefined;
    const roles: unknown = evidence ? JSON.parse(evidence.role_ids_json) : [];
    if (!Array.isArray(roles) || roles.some(role => typeof role !== "string" || !/^\d{1,32}$/u.test(role))) throw new SharedAlertError("unavailable");
    const count = database.prepare("SELECT count(*) total FROM traderlink_community_memberships WHERE community_id=? AND status='active'").get(owner.communityId) as { total: number };
    return Object.freeze({
      community: Object.freeze({ communityId: owner.communityId, discordGuildId: owner.guildId, slug: owner.slug, displayName: owner.name, status: "active" as const, isOwner: true, memberCount: count.total }),
      viewer: Object.freeze({ userId: input.userId, displayName: owner.ownerName, capabilities: access.capabilities, discordRoleIds: Object.freeze(roles as string[]) }),
      // No fabricated student/coach relationships are needed to enter owner management.
      relationships: Object.freeze([]),
      sharedAlertsUnreadCount: sharedAlertUnreadCount(repository, { communityId: owner.communityId, userId: input.userId }),
    });
  }).deferred();
}
