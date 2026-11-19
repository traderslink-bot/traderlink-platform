import { isSharedAlertReviewTarget } from "./shared-alerts-review-targets";
import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { isFreshCommunityEvidence } from "./community-launch-policy";
import type { VerifiedSharedAlertChannel } from "./shared-alerts-discord";
import { SharedAlertError } from "./shared-alerts-errors";
import { isSharedAlertPublisher } from "./shared-alerts-publisher-permissions";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";

export type SharedSourceSelection = Readonly<{ distribution: "website" | "discord"; destinationIds: readonly string[] }>;
export type SharedSourceDestination = Readonly<{ destinationId: string; name: string; channelId: string; status: "active" | "paused" }>;

/** Dormant alert-only policy. No Discord I/O, role grants, schema creation or worker registration. */
export class SharedAlertsSourcePolicy {
  constructor(private readonly database: Database.Database) {}

  requirePublisher(communityId: string, userId: string, atUtc: string): void {
    assertCanonicalUuidV4(communityId, "communityId");
    assertCanonicalUuidV4(userId, "userId");
    assertCanonicalUtcTimestamp(atUtc, "atUtc");
    // A Discord role or even server ownership alone never grants this permission.
    if (!isSharedAlertPublisher(this.database, communityId, userId, atUtc, true)) throw new SharedAlertError("changed");
    const access = new TraderLinkCommunityRepository(this.database).resolveAccess(communityId, userId);
    if (access.membershipStatus !== "active" || !access.capabilities.includes("community.view")) throw new SharedAlertError("unavailable");
  }

  private owner(communityId: string, userId: string, atUtc: string) {
    assertCanonicalUtcTimestamp(atUtc, "atUtc");
    return new SharedAlertsRepository(this.database, () => atUtc).requireOwner({ communityId, userId });
  }

  destinations(communityId: string, userId: string, atUtc: string): readonly SharedSourceDestination[] {
    this.requirePublisher(communityId, userId, atUtc);
    const access = new TraderLinkCommunityRepository(this.database).resolveAccess(communityId, userId);
    const evidence = this.database.prepare(`SELECT m.role_ids_json,c.discord_guild_id FROM traderlink_communities c
      JOIN platform_discord_memberships m ON m.guild_id=c.discord_guild_id AND m.user_id=? WHERE c.community_id=?`)
      .get(userId, communityId) as { role_ids_json: string; discord_guild_id: string } | undefined;
    if (!evidence) return [];
    const parsed: unknown = JSON.parse(evidence.role_ids_json);
    if (!Array.isArray(parsed) || parsed.some(role => typeof role !== "string" || !/^\d{1,32}$/u.test(role))) throw new SharedAlertError("unavailable");
    const roles = new Set<string>([evidence.discord_guild_id, ...parsed]);
    const rows = this.database.prepare(`SELECT destination_id destinationId,name,discord_channel_id channelId,status
      FROM traderlink_community_discord_destinations WHERE community_id=? AND content_type='alerts' AND status='active' ORDER BY name,destination_id`)
      .all(communityId) as SharedSourceDestination[];
    return rows.filter(row => isSharedAlertReviewTarget(evidence.discord_guild_id, row.channelId) && (access.isOwner || Boolean(this.database.prepare(`SELECT 1 FROM traderlink_community_destination_publishers
      WHERE community_id=? AND destination_id=? AND ((subject_kind='user' AND subject_id=?) OR
      (subject_kind='role' AND subject_id IN (SELECT value FROM json_each(?)))) LIMIT 1`)
      .get(communityId, row.destinationId, userId, JSON.stringify([...roles])))));
  }

  /** Channel must come from server-side SharedAlertsDiscord.verifyChannel, never submitted evidence. */
  saveDestination(input: Readonly<{ communityId: string; ownerUserId: string; destinationId?: string; name: string; channel: VerifiedSharedAlertChannel; active: boolean; atUtc: string }>): string {
    return this.database.transaction(() => {
      const owner = this.owner(input.communityId, input.ownerUserId, input.atUtc);
      if (input.channel.guildId !== owner.guildId || !/^\d{1,32}$/u.test(input.channel.channelId) || !isFreshCommunityEvidence(input.channel.verifiedAtUtc, input.atUtc)) throw new SharedAlertError("invalid");
      const name = input.name.trim();
      if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/u.test(name)) throw new SharedAlertError("invalid");
      const id = input.destinationId ?? createCanonicalUuidV4();
      assertCanonicalUuidV4(id, "destinationId");
      if (input.destinationId) {
        const changed = this.database.prepare(`UPDATE traderlink_community_discord_destinations SET name=?,discord_channel_id=?,status=?,updated_by_user_id=?,updated_at_utc=?
          WHERE destination_id=? AND community_id=? AND content_type='alerts'`).run(name, input.channel.channelId, input.active ? "active" : "paused", input.ownerUserId, input.atUtc, id, input.communityId);
        if (!changed.changes) throw new SharedAlertError("not_found");
        // A queued publication never silently moves to a newly chosen source channel.
        this.database.prepare(`UPDATE traderlink_community_content_deliveries SET status='cancelled',last_error='Source destination changed.',updated_at_utc=?
          WHERE community_id=? AND destination_id=? AND object_type='alert' AND status IN ('pending','failed')`).run(input.atUtc, input.communityId, id);
      } else this.database.prepare(`INSERT INTO traderlink_community_discord_destinations(destination_id,community_id,name,discord_channel_id,content_type,status,updated_by_user_id,created_at_utc,updated_at_utc)
        VALUES(?,?,?,?,'alerts',?,?,?,?)`).run(id, input.communityId, name, input.channel.channelId, input.active ? "active" : "paused", input.ownerUserId, input.atUtc, input.atUtc);
      return id;
    }).immediate();
  }

  assignPublishers(input: Readonly<{ communityId: string; ownerUserId: string; destinationId: string; userIds: readonly string[]; atUtc: string }>): void {
    this.database.transaction(() => {
      this.owner(input.communityId, input.ownerUserId, input.atUtc);
      assertCanonicalUuidV4(input.destinationId, "destinationId");
      if (input.userIds.length > 200 || new Set(input.userIds).size !== input.userIds.length) throw new SharedAlertError("invalid");
      if (!this.database.prepare("SELECT 1 FROM traderlink_community_discord_destinations WHERE community_id=? AND destination_id=? AND content_type='alerts'").get(input.communityId, input.destinationId)) throw new SharedAlertError("not_found");
      for (const userId of input.userIds) this.requirePublisher(input.communityId, userId, input.atUtc);
      const before = this.database.prepare("SELECT subject_kind,subject_id FROM traderlink_community_destination_publishers WHERE community_id=? AND destination_id=? ORDER BY subject_kind,subject_id").all(input.communityId, input.destinationId);
      // Preserve pre-existing role/channel autonomy; this owner control changes individual assignments only.
      this.database.prepare("DELETE FROM traderlink_community_destination_publishers WHERE community_id=? AND destination_id=? AND subject_kind='user'").run(input.communityId, input.destinationId);
      const insert = this.database.prepare(`INSERT INTO traderlink_community_destination_publishers(community_id,destination_id,subject_kind,subject_id,updated_by_user_id,updated_at_utc) VALUES(?,?,'user',?,?,?)`);
      for (const userId of input.userIds) insert.run(input.communityId, input.destinationId, userId, input.ownerUserId, input.atUtc);
      const after = this.database.prepare("SELECT subject_kind,subject_id FROM traderlink_community_destination_publishers WHERE community_id=? AND destination_id=? ORDER BY subject_kind,subject_id").all(input.communityId, input.destinationId);
      this.database.prepare(`INSERT INTO traderlink_community_destination_audit(audit_id,community_id,destination_id,actor_user_id,before_json,after_json,created_at_utc) VALUES(?,?,?,?,?,?,?)`)
        .run(createCanonicalUuidV4(), input.communityId, input.destinationId, input.ownerUserId, JSON.stringify(before), JSON.stringify(after), input.atUtc);
    }).immediate();
  }

  intent(communityId: string, objectType: string, objectId: string): SharedSourceSelection | undefined {
    if (objectType !== "alert") return undefined;
    const row = this.database.prepare(`SELECT distribution,destination_ids_json FROM traderlink_community_publication_distribution WHERE community_id=? AND object_type='alert' AND object_id=?`)
      .get(communityId, objectId) as { distribution: SharedSourceSelection["distribution"]; destination_ids_json: string } | undefined;
    if (!row) return undefined;
    const ids: unknown = JSON.parse(row.destination_ids_json);
    if (!Array.isArray(ids) || ids.length > 50 || ids.some(id => typeof id !== "string")) throw new SharedAlertError("invalid");
    return { distribution: row.distribution, destinationIds: ids };
  }

  saveIntent(input: Readonly<{ communityId: string; publisherUserId: string; alertId: string; selection: SharedSourceSelection; publishingMode: "tracked_page" | "discord_post"; publish: boolean; atUtc: string }>): void {
    this.requirePublisher(input.communityId, input.publisherUserId, input.atUtc);
    assertCanonicalUuidV4(input.alertId, "alertId");
    const { distribution, destinationIds } = input.selection;
    if (!["website", "discord"].includes(distribution) || !Array.isArray(destinationIds) || destinationIds.length > 50 || new Set(destinationIds).size !== destinationIds.length || (input.publish && !destinationIds.length) || (input.publishingMode === "discord_post" && distribution !== "discord")) throw new SharedAlertError("invalid");
    const allowed = new Set(this.destinations(input.communityId, input.publisherUserId, input.atUtc).map(row => row.destinationId));
    for (const id of destinationIds) {
      assertCanonicalUuidV4(id, "destinationId");
      if (!allowed.has(id)) throw new SharedAlertError("changed");
    }
    this.database.prepare(`INSERT INTO traderlink_community_publication_distribution(community_id,object_type,object_id,publisher_user_id,distribution,destination_ids_json,updated_at_utc)
      VALUES(?,'alert',?,?,?,?,?) ON CONFLICT(community_id,object_type,object_id) DO UPDATE SET publisher_user_id=excluded.publisher_user_id,distribution=excluded.distribution,destination_ids_json=excluded.destination_ids_json,updated_at_utc=excluded.updated_at_utc`)
      .run(input.communityId, input.alertId, input.publisherUserId, distribution, JSON.stringify(destinationIds), input.atUtc);
  }

  assertDelivery(communityId: string, publisherId: string | null, destinationId: string, kind: "alerts", atUtc: string): void {
    if (kind !== "alerts" || !publisherId || !this.destinations(communityId, publisherId, atUtc).some(row => row.destinationId === destinationId)) throw new SharedAlertError("changed");
  }
}
