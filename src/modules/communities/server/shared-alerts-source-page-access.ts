import { sharedAlertsMigrationCarrier, sharedProductionPrerequisitesReady, sharedProductionRequiredTables } from "../../platform/server/database/platform-shared-alerts-production-carrier";
import "server-only";
import type Database from "better-sqlite3";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { requireCommunityOwnerReviewIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { withReadonlyPlatformDatabase } from "../../platform/server/database/open-readonly-platform-database";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, calculatePlatformMigrationChecksum, createCanonicalUtcTimestamp, createCanonicalUuidV4, platformFailure } from "../../platform/server/database/platform-migration-contract";
import { requireCommunityRequestAccess } from "./community-request-access";
import { SharedAlertsDiscord } from "./shared-alerts-discord";
import { SharedAlertError } from "./shared-alerts-errors";
import { sharedAlertUnreadCount } from "./shared-alerts-read";
import { sharedAlertAwareDiscordRequest } from "./shared-alerts-rate-limits";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { readSharedAlertsSourceOwner, readSharedAlertsSourcePublisher } from "./shared-alerts-source-read";
import { isSharedAlertPublisher } from "./shared-alerts-publisher-permissions";
import { SharedAlertsSourcePublication } from "./shared-alerts-source-publication";
import { readSharedAlertsSourceTracker } from "./shared-alerts-source-tracker";
import { verifySharedAlertOwner } from "./shared-alerts-verification";
import { isCommunityContentActivityPath } from "./community-activity-scope";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";

/** Only menu facts: current permissions and this user's actual student predicate, no coaching content. */
function sourceNavigation(database: Database.Database, context: {communitySlug:string;userId:string;atUtc:string}, communityId: string) {
  const permission = new TraderLinkCommunityRepository(database).resolveAccess(communityId, context.userId);
  if (!permission.capabilities.includes("community.view")) throw new SharedAlertError("unavailable");
  const row = database.prepare(`SELECT c.discord_guild_id,c.display_name,m.role_ids_json,coalesce(m.global_display_name,m.username) name,
    (SELECT count(*) FROM traderlink_community_memberships member WHERE member.community_id=c.community_id AND member.status='active') member_count
    FROM traderlink_communities c JOIN platform_discord_memberships m ON m.guild_id=c.discord_guild_id AND m.user_id=? WHERE c.community_id=? AND c.status='active'`).get(context.userId, communityId) as {discord_guild_id:string;display_name:string;role_ids_json:string;name:string;member_count:number}|undefined;
  if (!row) throw new SharedAlertError("unavailable");
  const roles:unknown=JSON.parse(row.role_ids_json);
  if(!Array.isArray(roles)||roles.some(role=>typeof role!=="string"||!/^\d{1,32}$/u.test(role)))throw new SharedAlertError("unavailable");
  const relationships=database.prepare("SELECT student_user_id studentUserId FROM traderlink_community_coaching_relationships WHERE community_id=? AND student_user_id=? LIMIT 1").all(communityId,context.userId) as {studentUserId:string}[];
  return {community:{communityId,discordGuildId:row.discord_guild_id,slug:context.communitySlug,displayName:row.display_name,status:"active" as const,isOwner:permission.isOwner,memberCount:row.member_count},
    viewer:{userId:context.userId,displayName:row.name,capabilities:permission.capabilities,discordRoleIds:roles as string[]},relationships,
    sharedAlertsAvailable:true,sourceAlertPublishingAllowed:isSharedAlertPublisher(database,communityId,context.userId,context.atUtc,true),
    sharedAlertsUnreadCount:permission.isOwner?sharedAlertUnreadCount(new SharedAlertsRepository(database),{communityId,userId:context.userId}):0};
}

/** Same narrow activity write as the Community repository, without its Coaching snapshot graph. */
function recordSourceAlertView(database: Database.Database, input: Readonly<{ communityId: string; userId: string; path: string; objectType: string; objectId?: string; atUtc: string }>): void {
  assertCanonicalUuidV4(input.communityId, "communityId");
  assertCanonicalUuidV4(input.userId, "userId");
  assertCanonicalUtcTimestamp(input.atUtc, "atUtc");
  const community = database.prepare("SELECT slug FROM traderlink_communities WHERE community_id=?").get(input.communityId) as { slug: string } | undefined;
  if (!community || !isCommunityContentActivityPath(community.slug, input.path)) return;
  const text = (value: string, maximum: number, field: string): string => {
    const normalized = value.normalize("NFKC").trim();
    if (!normalized || normalized.length > maximum || /[\u0000-\u001f\u007f]/u.test(normalized)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
    }
    return normalized;
  };
  const path = text(input.path, 500, "path");
  database.transaction(() => {
    database.prepare(`INSERT INTO traderlink_community_activity_events(event_id,community_id,user_id,event_type,object_type,object_id,path,occurred_at_utc) VALUES(?,?,?,'page.view',?,?,?,?)`)
      .run(createCanonicalUuidV4(), input.communityId, input.userId, text(input.objectType, 40, "objectType"), input.objectId ?? null, path, input.atUtc);
    database.prepare(`INSERT INTO traderlink_community_activity_daily_members(community_id,activity_day,path,user_id,views,first_viewed_at_utc,last_viewed_at_utc) VALUES(?,?,?,?,1,?,?) ON CONFLICT(community_id,activity_day,path,user_id) DO UPDATE SET views=views+1,last_viewed_at_utc=excluded.last_viewed_at_utc`)
      .run(input.communityId, input.atUtc.slice(0, 10), path, input.userId, input.atUtc, input.atUtc);
  }).immediate();
}

/** No synthetic HTTP Request, session minting or layout-auth exception. */
async function access(communitySlug: string) {
  if (communitySlug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(communitySlug)) throw new SharedAlertError("not_found");
  if (process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED !== "1"
    && process.env.TRADERLINK_SHARED_ALERTS_OWNER_REVIEW_ENABLED !== "1") return null;
  const { platformMigrationManifest } = await import("../../platform/server/database/platform-migration-manifest");
  const carrier = sharedAlertsMigrationCarrier;
  if (carrier.state !== "selected" || typeof carrier.carrierIdentity !== "string" || !carrier.carrierIdentity.trim() || !Array.isArray(carrier.requiredMigrations) || carrier.requiredMigrations.length !== 2) return null;
  const requirements = carrier.requiredMigrations;
  if (requirements.some(row => !row) || new Set(requirements.map(row => row.migrationId)).size !== 2 || new Set(requirements.map(row => row.executionOrder)).size !== 2 || requirements.some(row => !row || !["0171_traderlink_community_shared_alerts", "0177_traderlink_community_shared_alert_individuals"].includes(row.migrationId) || row.moduleNamespace !== "community" || !Number.isSafeInteger(row.executionOrder) || row.executionOrder <= 0 || !/^[a-f0-9]{64}$/u.test(row.checksumSha256))) return null;
  for (const required of requirements) {
    const selected = platformMigrationManifest.filter(row => row.migrationId === required.migrationId);
    if (selected.length !== 1 || selected[0].moduleNamespace !== required.moduleNamespace || selected[0].executionOrder !== required.executionOrder || calculatePlatformMigrationChecksum(selected[0]) !== required.checksumSha256) return null;
  }
  const identity = requireCommunityOwnerReviewIdentity(await requireTraderLinkPlatformServerComponentPageIdentity());
  const ready = withReadonlyPlatformDatabase({}, database => {
    if (!sharedProductionPrerequisitesReady(database, platformMigrationManifest, carrier.prerequisiteMigrations, sharedProductionRequiredTables)) return false;
    for (const migration of requirements) {
      const applied = database.prepare("SELECT module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations WHERE migration_id=?").get(migration.migrationId) as { module_namespace: string; execution_order: number; checksum_sha256: string } | undefined;
      if (!applied || applied.module_namespace !== "community" || applied.execution_order !== migration.executionOrder || applied.checksum_sha256 !== migration.checksumSha256) return false;
    }
    for (const table of ["traderlink_community_alerts", "traderlink_community_audiences", "traderlink_community_audience_discord_roles", "traderlink_community_publication_distribution", "traderlink_community_publication_receipts", "traderlink_community_publication_revisions", "traderlink_community_discord_destinations", "traderlink_community_destination_publishers", "community_alert_discord_authors", "community_alert_publisher_permissions", "community_shared_alert_requests", "community_shared_alert_routes", "community_shared_alert_owner_checks", "community_shared_alert_rate_limits", "community_shared_alert_messages", "community_shared_alert_events", "community_shared_alert_read_positions", "community_shared_alert_deliveries", "community_shared_alert_delivery_parts"])
      if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(table)) return false;
    return true;
  });
  if (!ready) return null;
  await requireCommunityRequestAccess({ slug: communitySlug, userId: identity.scope.userId });
  return { communitySlug, userId: identity.scope.userId, atUtc: createCanonicalUtcTimestamp() };
}

export async function loadSharedAlertsSourcePublisherPage(communitySlug: string, options: Readonly<{ alertId?: string; page?: number }> = {}) {
  const context = await access(communitySlug);
  if (!context) return null;
  return withReadonlyPlatformDatabase({}, database => {
    const source=readSharedAlertsSourcePublisher(database,{...context,...options});
    return {...source,navigation:sourceNavigation(database,context,source.community.communityId)};
  });
}

export async function loadSharedAlertsSourceOwnerPage(communitySlug: string) {
  const context = await access(communitySlug);
  if (!context) return null;
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const repository = new SharedAlertsRepository(database), owner = repository.localOwner(communitySlug, context.userId);
    const request = sharedAlertAwareDiscordRequest(fetch, operation => operation(database));
    const discord = new SharedAlertsDiscord(process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim() ?? "", request);
    await verifySharedAlertOwner(repository, discord, owner);
    const channels = await discord.channels(owner.guildId), atUtc = createCanonicalUtcTimestamp();
    return {
      ...readSharedAlertsSourceOwner(database, { ...context, atUtc }),
      channels: channels.map(row => ({ id: row.channelId, name: row.name })),
      navigation: sourceNavigation(database, { ...context, atUtc }, owner.communityId),
    };
  } finally { database.close(); }
}

/** Legacy text slug and current UUID resolve to ONE alert and the SAME private reader. */
export async function loadSharedAlertsSourceTrackerPage(communitySlug: string, reference: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,159}$/u.test(reference)) throw new SharedAlertError("not_found");
  const context = await access(communitySlug);
  if (!context) return null;
  const requestHeaders = await headers();
  const prefetch = requestHeaders.has("next-router-prefetch") || /prefetch/iu.test(`${requestHeaders.get("purpose") ?? ""} ${requestHeaders.get("sec-purpose") ?? ""}`);
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const target = database.prepare(`SELECT a.alert_id,c.community_id FROM traderlink_community_alerts a JOIN traderlink_communities c ON c.community_id=a.community_id AND c.status='active'
      WHERE c.slug=? AND (a.alert_id=? OR a.slug=?) AND a.status IN ('published','archived') AND a.published_at_utc IS NOT NULL LIMIT 2`).all(communitySlug, reference, reference) as { alert_id: string; community_id: string }[];
    if (target.length !== 1) throw new SharedAlertError("not_found");
    const request = sharedAlertAwareDiscordRequest(fetch, operation => operation(database));
    const alert = await readSharedAlertsSourceTracker(database, { communitySlug, alertId: target[0].alert_id, userId: context.userId, botToken: process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim() ?? "" }, request);
    const mode = database.prepare("SELECT publishing_mode FROM traderlink_community_alerts WHERE community_id=? AND alert_id=?").get(target[0].community_id, alert.alertId) as { publishing_mode: string } | undefined;
    if (!prefetch && alert.status === "published" && mode?.publishing_mode === "tracked_page") {
      try {
        // Existing own-server activity facts only, AFTER private audience/channel authorization.
        recordSourceAlertView(database, { communityId: target[0].community_id, userId: context.userId, path: `/communities/${communitySlug}/alerts/${alert.alertId}`, objectType: "alert", objectId: alert.alertId, atUtc: createCanonicalUtcTimestamp() });
      } catch (error) { unstable_rethrow(error); console.warn("Source alert page-view recording unavailable."); }
    }
    const author = database.prepare("SELECT display_name,username FROM community_alert_discord_authors WHERE alert_id=? AND discord_user_id IS NOT NULL").get(alert.alertId) as { display_name: string | null; username: string | null } | undefined;
    let canEdit = false;
    try { new SharedAlertsSourcePublication(database).readForPublisher(target[0].community_id, context.userId, alert.alertId, createCanonicalUtcTimestamp()); canEdit = true; }
    catch (error) { unstable_rethrow(error); }
    return { ...alert, authorName: author?.display_name || author?.username || "Discord author unavailable", authorUsername: author?.username ?? null, canEdit,
      navigation:sourceNavigation(database,{...context,atUtc:createCanonicalUtcTimestamp()},target[0].community_id) };
  } finally { database.close(); }
}
