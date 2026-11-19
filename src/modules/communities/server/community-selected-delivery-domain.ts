import "server-only";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { COMMUNITY_EVIDENCE_MAX_AGE_MS, isFreshCommunityEvidence } from "./community-launch-policy";
import { readCoachCommercialAccess } from "./coaching-commercial-access";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertsSourcePolicy } from "./shared-alerts-source-policy";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";

const refused = (): never => { throw new Error("The selected delivery's original domain authority changed."); };
type Row = Record<string, unknown>;

/** Initial eligibility only, never an admission. Prior effects cannot become
 * new work by retaining or restoring a superficially pending label. */
export function assertSelectedCommunityInitialDelivery(database: Database.Database, deliveryId: string): void {
  const job = database.prepare("SELECT status,attempt_count,delivery_outcome,discord_message_id FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(deliveryId) as Row | undefined;
  if (!job || job.status !== "pending" || job.attempt_count !== 0 || job.delivery_outcome !== "pending" || job.discord_message_id !== null
    || database.prepare("SELECT 1 FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? AND outcome<>'requested' LIMIT 1").get(deliveryId)) return refused();
}

/** Concrete normal domain authorization, observed inside the real native frame.
 * This read does not create jobs, permissions, admissions or provider authority. */
export function readSelectedCommunityDeliveryDomain(database: Database.Database, input: Readonly<{
  kind: "source_alert" | "coaching_plan"; deliveryId: string; communityId: string;
  guildId: string; ownerUserId: string; principalUserIds: readonly string[]; atUtc: string;
}>) {
  const job = database.prepare("SELECT publisher_user_id,object_id,destination_id,object_type FROM traderlink_community_content_deliveries WHERE delivery_id=? AND community_id=?").get(input.deliveryId, input.communityId) as { publisher_user_id: string | null; object_id: string; destination_id: string; object_type: string } | undefined;
  const access = new TraderLinkCommunityRepository(database);
  if (!job || job.object_type !== (input.kind === "source_alert" ? "alert" : "plan")) return refused();
  let ownerEvidence: unknown = null, commercial: unknown = null;
  const deadlines: number[] = [];
  if (input.kind === "source_alert") {
    const repository = new SharedAlertsRepository(database, () => input.atUtc);
    const owner = repository.requireOwner({ communityId: input.communityId, userId: input.ownerUserId });
    if (owner.guildId !== input.guildId) return refused();
    const author = database.prepare("SELECT author_user_id FROM traderlink_community_alerts WHERE alert_id=? AND community_id=?").get(job.object_id, input.communityId) as { author_user_id: string } | undefined;
    if (!job.publisher_user_id || !author) return refused();
    const policy = new SharedAlertsSourcePolicy(database);
    for (const userId of new Set([job.publisher_user_id, author.author_user_id])) policy.assertDelivery(input.communityId, userId, job.destination_id, "alerts", input.atUtc);
    const check = database.prepare("SELECT community_id,owner_user_id,discord_user_id,result,checked_at_utc FROM community_shared_alert_owner_checks WHERE community_id=?").get(input.communityId) as Row;
    const { checked_at_utc, ...identity } = check;
    ownerEvidence = identity; deadlines.push(Date.parse(String(checked_at_utc)) + COMMUNITY_EVIDENCE_MAX_AGE_MS);
  } else {
    const profile = database.prepare("SELECT c.user_id FROM traderlink_community_coaching_plans p JOIN traderlink_community_coach_profiles c ON c.coach_profile_id=p.coach_profile_id AND c.community_id=p.community_id WHERE p.plan_id=? AND p.community_id=? AND p.status='active' AND c.status='active'").get(job.object_id, input.communityId) as { user_id: string } | undefined;
    if (!profile) return refused();
    const actor = job.publisher_user_id ?? profile.user_id;
    if (!input.principalUserIds.includes(actor)) return refused();
    // Same normal capability/commercial gate as createPlan; owner privilege is
    // resolved by that policy, never substituted for a coach's permission.
    const permission = access.requireCapability(input.communityId, actor, "community.coaching.offer");
    if (actor !== profile.user_id && !permission.capabilities.includes("community.coaching.manage_all")) return refused();
    commercial = readCoachCommercialAccess(database, { coachUserId: actor, scope: "community", communityId: input.communityId, atUtc: input.atUtc });
  }
  const members = input.principalUserIds.map(userId => {
    const member = database.prepare("SELECT role_ids_json,guild_owner,first_verified_at_utc,last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?").get(userId, input.guildId) as { role_ids_json: string; guild_owner: number; first_verified_at_utc: string; last_verified_at_utc: string } | undefined;
    if (!member || !isFreshCommunityEvidence(member.last_verified_at_utc, input.atUtc)) return refused();
    const roles: unknown = JSON.parse(member.role_ids_json);
    if (!Array.isArray(roles) || roles.some(role => typeof role !== "string" || !/^[0-9]{1,32}$/u.test(role))) return refused();
    deadlines.push(Date.parse(member.last_verified_at_utc) + COMMUNITY_EVIDENCE_MAX_AGE_MS);
    return { userId, guildOwner: member.guild_owner, roles: [...new Set(roles)].sort(), firstVerifiedAtUtc: member.first_verified_at_utc, access: access.resolveAccess(input.communityId, userId) };
  });
  const rows = (table: string, order: string) => {
    const values = database.prepare(`SELECT * FROM ${table} WHERE community_id=? ORDER BY ${order} LIMIT 10001`).all(input.communityId) as Row[];
    if (values.length > 10000) return refused();
    return values;
  };
  const grants = {
    publishers: rows("community_alert_publisher_permissions", "user_id").filter(row => input.principalUserIds.includes(String(row.user_id))),
    assignments: rows("traderlink_community_member_role_assignments", "user_id,role_id").filter(row => input.principalUserIds.includes(String(row.user_id))),
    roles: rows("traderlink_community_roles", "role_id"), capabilities: rows("traderlink_community_role_capabilities", "role_id,capability_key"),
    mappings: rows("traderlink_community_discord_role_mappings", "discord_role_id,role_id"),
    destinations: rows("traderlink_community_destination_publishers", "destination_id,subject_kind,subject_id").filter(row => row.destination_id === job.destination_id),
  };
  if (Object.values(grants).some(values => values.length > 10000)) return refused();
  const validUntil = Math.min(...deadlines);
  if (!Number.isFinite(validUntil) || validUntil <= Date.parse(input.atUtc)) return refused();
  return { sha256: createHash("sha256").update(JSON.stringify({ members, grants, ownerEvidence, commercial })).digest("hex"), validUntilUtc: new Date(validUntil).toISOString() };
}
