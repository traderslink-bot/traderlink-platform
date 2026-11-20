import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { SharedAlertError } from "./shared-alerts-errors";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertsSourcePolicy } from "./shared-alerts-source-policy";
import { SharedAlertsSourcePublication } from "./shared-alerts-source-publication";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";

type SourceReadInput = Readonly<{ communitySlug: string; userId: string; atUtc: string }>;

function community(database: Database.Database, input: SourceReadInput) {
  assertCanonicalUuidV4(input.userId, "userId");
  assertCanonicalUtcTimestamp(input.atUtc, "atUtc");
  if (input.communitySlug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(input.communitySlug)) throw new SharedAlertError("not_found");
  const row = database.prepare("SELECT community_id communityId,slug,display_name name FROM traderlink_communities WHERE slug=? AND status='active'").get(input.communitySlug) as { communityId: string; slug: string; name: string } | undefined;
  if (!row) throw new SharedAlertError("unavailable");
  return row;
}

/** Private publisher read, never a subscriber/Journal/Coaching full snapshot. */
export function readSharedAlertsSourcePublisher(database: Database.Database, input: SourceReadInput & Readonly<{ alertId?: string; page?: number }>) {
  return database.transaction(() => {
    const source = community(database, input), policy = new SharedAlertsSourcePolicy(database);
    policy.requirePublisher(source.communityId, input.userId, input.atUtc);
    const access = new TraderLinkCommunityRepository(database).resolveAccess(source.communityId, input.userId);
    const manageAll = access.capabilities.includes("community.alerts.manage_all") ? 1 : 0;
    const total = (database.prepare("SELECT count(*) total FROM traderlink_community_alerts WHERE community_id=? AND (?=1 OR author_user_id=?)").get(source.communityId, manageAll, input.userId) as { total: number }).total;
    const requested = Number.isSafeInteger(input.page) && Number(input.page) > 0 ? Number(input.page) : 1;
    const page = Math.min(requested, Math.max(1, Math.ceil(total / 25)));
    const alerts = database.prepare(`SELECT alert_id id,slug,title,symbol,status,published_at_utc publishedAtUtc,updated_at_utc updatedAtUtc
      FROM traderlink_community_alerts WHERE community_id=? AND (?=1 OR author_user_id=?) ORDER BY updated_at_utc DESC,alert_id LIMIT 25 OFFSET ?`)
      .all(source.communityId, manageAll, input.userId, (page - 1) * 25) as { id: string; slug: string; title: string; symbol: string | null; status: string; publishedAtUtc: string | null; updatedAtUtc: string }[];
    const selected = input.alertId ? new SharedAlertsSourcePublication(database).readForPublisher(source.communityId, input.userId, input.alertId, input.atUtc) : null;
    const intent = selected ? policy.intent(source.communityId, "alert", selected.alertId) : undefined;
    const audiences = database.prepare("SELECT audience_id id,name FROM traderlink_community_audiences WHERE community_id=? AND status='active' ORDER BY name,audience_id LIMIT 201").all(source.communityId) as { id: string; name: string }[];
    if (audiences.length > 200) throw new SharedAlertError("limit");
    return Object.freeze({
      community: source, alerts, selected, page, total,
      audiences, destinations: policy.destinations(source.communityId, input.userId, input.atUtc).map(row => ({ id: row.destinationId, name: row.name })),
      initialDestinationIds: intent?.destinationIds ?? [], initialDistribution: intent?.distribution ?? "discord",
    });
  }).deferred();
}

/** Caller refreshes owner verification before this pure owner-only read; channels are verified separately. */
export function readSharedAlertsSourceOwner(database: Database.Database, input: SourceReadInput) {
  return database.transaction(() => {
    const source = community(database, input);
    new SharedAlertsRepository(database, () => input.atUtc).requireOwner({ communityId: source.communityId, userId: input.userId });
    const destinations = database.prepare(`SELECT destination_id id,name,discord_channel_id channelId,status FROM traderlink_community_discord_destinations
      WHERE community_id=? AND content_type='alerts' ORDER BY name,destination_id LIMIT 201`).all(source.communityId) as { id: string; name: string; channelId: string; status: string }[];
    const candidates = database.prepare(`SELECT p.user_id id,coalesce(d.global_display_name,d.username) name,d.username FROM community_alert_publisher_permissions p
      JOIN traderlink_communities c ON c.community_id=p.community_id
      JOIN traderlink_community_memberships member ON member.community_id=p.community_id AND member.user_id=p.user_id AND member.status='active'
      JOIN platform_users u ON u.user_id=p.user_id AND u.status='active'
      JOIN platform_auth_identities i ON i.user_id=u.user_id AND i.auth_provider='discord' AND i.status='active'
      JOIN platform_discord_memberships d ON d.user_id=p.user_id AND d.guild_id=c.discord_guild_id AND d.last_verified_at_utc>=member.discord_verified_at_utc
      WHERE p.community_id=? AND p.enabled=1 ORDER BY name,p.user_id LIMIT 201`).all(source.communityId) as { id: string; name: string; username: string }[];
    if (destinations.length > 200 || candidates.length > 200) throw new SharedAlertError("limit");
    const assignments = database.prepare(`SELECT a.destination_id,a.subject_id FROM traderlink_community_destination_publishers a
      JOIN traderlink_community_discord_destinations d ON d.destination_id=a.destination_id AND d.community_id=a.community_id
      WHERE a.community_id=? AND a.subject_kind='user' AND d.content_type='alerts' ORDER BY a.destination_id,a.subject_id`)
      .all(source.communityId) as { destination_id: string; subject_id: string }[];
    const policy = new SharedAlertsSourcePolicy(database);
    const publishers = candidates.map(row => {
      let available = false;
      try { policy.requirePublisher(source.communityId, row.id, input.atUtc); available = true; }
      catch (error) { if (!(error instanceof SharedAlertError)) throw error; }
      return { id: row.id, name: row.name === row.username ? `@${row.username}` : `${row.name} (@${row.username})`, available };
    });
    const assignedIds = [...new Set(assignments.map(row => row.subject_id))];
    if (new Set([...publishers.map(person => person.id), ...assignedIds]).size > 200) throw new SharedAlertError("limit");
    for (const userId of assignedIds) {
      if (publishers.some(person => person.id === userId)) continue;
      const prior = database.prepare(`SELECT coalesce(d.global_display_name,d.username,u.display_name) name,d.username FROM platform_users u
        LEFT JOIN platform_discord_memberships d ON d.user_id=u.user_id AND d.guild_id=(SELECT discord_guild_id FROM traderlink_communities WHERE community_id=?) WHERE u.user_id=?`).get(source.communityId, userId) as { name: string; username: string | null } | undefined;
      publishers.push({ id: userId, name: prior?.username ? `${prior.name} (@${prior.username})` : `${prior?.name ?? "Unavailable member"} (unavailable assignment ${publishers.length + 1})`, available: false });
    }
    if (publishers.length > 200) throw new SharedAlertError("limit");
    return Object.freeze({ community: source, publishers, destinations: destinations.map(row => ({ id: row.id, name: row.name, channelId: row.channelId, active: row.status === "active",
      ...policy.assignmentState({ communityId: source.communityId, ownerUserId: input.userId, destinationId: row.id, atUtc: input.atUtc }) })) });
  }).deferred();
}
