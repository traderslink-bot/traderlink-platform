import "server-only";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { requirePlatformErasureWriter } from "../../platform/server/privacy/platform-erasure-admission";
import { communityCoachingPlanDeliveryContent } from "./community-coaching-plan-delivery-content";
import { recordCommunityDeliveryAttempt } from "./community-delivery-history";
import { verifyCommunityOwner } from "./community-onboarding-service";
import { verifyCommunityReviewDeliveryChannel } from "./community-review-discord-channel";
import { isSharedAlertReviewTarget } from "./shared-alerts-review-targets";

type Row = Record<string, unknown>;
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const refused = (): never => { throw new Error("Selected community delivery changed or is unavailable."); };

function binding(database: Database.Database, deliveryId: string) {
  const job = database.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=? AND object_type='plan'").get(deliveryId) as Row | undefined;
  if (!job) return refused();
  const community = database.prepare("SELECT community_id,discord_guild_id,owner_user_id,display_name,slug,status FROM traderlink_communities WHERE community_id=?").get(job.community_id) as Row | undefined;
  const destination = database.prepare("SELECT * FROM traderlink_community_discord_destinations WHERE community_id=? AND destination_id=?").get(job.community_id, job.destination_id) as Row | undefined;
  const plan = database.prepare("SELECT * FROM traderlink_community_coaching_plans WHERE community_id=? AND plan_id=?").get(job.community_id, job.object_id) as Row | undefined;
  const profile = plan && database.prepare("SELECT * FROM traderlink_community_coach_profiles WHERE community_id=? AND coach_profile_id=?").get(job.community_id, plan.coach_profile_id) as Row | undefined;
  if (!community || community.status !== "active" || !destination || destination.status !== "active" || destination.content_type !== "coaching"
    || !isSharedAlertReviewTarget(community.discord_guild_id, destination.discord_channel_id)
    || !plan || plan.status !== "active" || !profile || profile.status !== "active") return refused();
  const principals = [...new Set([String(community.owner_user_id), String(profile.user_id), ...(job.publisher_user_id ? [String(job.publisher_user_id)] : [])])].sort();
  const jobFacts = Object.fromEntries(["delivery_id", "community_id", "object_type", "object_id", "destination_id", "publisher_user_id", "requested_at_utc", "current_attempt_key"].map(key => [key, job[key]]));
  return { job, community, destination, plan, profile, principals, fingerprint: sha({ jobFacts, community, destination, plan, profile }) };
}

/** Observation only. Missing normal destination/job is a prerequisite failure, never an insert. */
export function readSelectedCommunityPlanDelivery(database: Database.Database, deliveryId: string) {
  assertCanonicalUuidV4(deliveryId, "deliveryId");
  const b = binding(database, deliveryId);
  return Object.freeze({ deliveryId, jobSha256: sha(b.job), bindingSha256: b.fingerprint, principalUserIds: b.principals,
    communityId: String(b.community.community_id), ownerUserId: String(b.community.owner_user_id),
    guildId: String(b.community.discord_guild_id), channelId: String(b.destination.discord_channel_id), planId: String(b.plan.plan_id), requestedAtUtc: String(b.job.requested_at_utc) });
}

/** Exactly one initial normal plan job. No recovery scan, action worker, retry or role/settings writes. */
export async function runSelectedCommunityPlanDelivery(database: Database.Database, input: Readonly<{
  selection: ReturnType<typeof readSelectedCommunityPlanDelivery>; publicOrigin: string; botToken: string;
  withCurrentWriter: <T>(userIds: readonly string[], operation: () => T) => T;
  assertEffectCurrent: (phase: "claim" | "send" | "settlement") => void;
}>, request: typeof fetch = fetch) {
  const selected = input.selection, initial = binding(database, selected.deliveryId);
  const current = (phase: "claim" | "send" | "settlement") => {
    input.assertEffectCurrent(phase);
    for (const userId of selected.principalUserIds) requirePlatformErasureWriter(database, userId).assertLivePrincipal(userId);
    const b = binding(database, selected.deliveryId);
    if (b.fingerprint !== selected.bindingSha256 || sha(b.principals) !== sha(selected.principalUserIds)) return refused();
    if (phase === "claim" ? sha(b.job) !== selected.jobSha256 : b.job.status !== "sending") return refused();
    return b;
  };
  const writer = <T>(phase: "claim" | "send" | "settlement", operation: () => T): T => input.withCurrentWriter(selected.principalUserIds, () => {
    current(phase); const result = operation();
    if (result !== null && (typeof result === "object" || typeof result === "function") && "then" in result) return refused();
    input.assertEffectCurrent(phase);
    for (const userId of selected.principalUserIds) requirePlatformErasureWriter(database, userId).assertLivePrincipal(userId);
    return result;
  });
  if (sha(readSelectedCommunityPlanDelivery(database, selected.deliveryId)) !== sha(selected)
    || initial.job.status !== "pending" || initial.job.attempt_count !== 0 || initial.job.delivery_outcome !== "pending"
    || initial.job.discord_message_id !== null
    || database.prepare("SELECT 1 FROM traderlink_community_delivery_attempt_history WHERE delivery_id=? AND outcome<>'requested' LIMIT 1").get(selected.deliveryId)) return refused();
  writer("claim", () => undefined);
  const payload = communityCoachingPlanDeliveryContent(database, { communityId: selected.communityId, planId: selected.planId,
    communitySlug: String(initial.community.slug), communityName: String(initial.community.display_name), publicOrigin: input.publicOrigin });
  if (!payload || payload.content.length > 2000) return refused();
  const owner = database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").get(selected.ownerUserId) as { auth_subject: string } | undefined;
  if (!owner) return refused();
  // Fresh real Discord owner evidence; no observation is written outside native frames.
  await verifyCommunityOwner(selected.guildId, owner.auth_subject, input.botToken, request, "community-owner-review");
  writer("claim", () => {
    const count = database.prepare("UPDATE traderlink_community_content_deliveries SET status='sending',attempt_count=1,last_error=NULL,updated_at_utc=? WHERE delivery_id=? AND status='pending' AND attempt_count=0 AND delivery_outcome='pending'").run(createCanonicalUtcTimestamp(), selected.deliveryId);
    if (count.changes !== 1) return refused();
  });
  const target = { community_id: selected.communityId, destination_id: String(initial.job.destination_id), discord_channel_id: selected.channelId, discord_guild_id: selected.guildId, delivery_id: selected.deliveryId };
  let started = false;
  const attemptKey = String(initial.job.current_attempt_key ?? selected.deliveryId);
  const nonce = createHash("sha256").update(attemptKey).digest("hex").slice(0,24);
  try {
    await verifyCommunityReviewDeliveryChannel(database, target, input.botToken, request, { guildId: selected.guildId, channelIds: [selected.channelId] });
    writer("send", () => {
      database.prepare("UPDATE traderlink_community_content_deliveries SET delivery_outcome='uncertain' WHERE delivery_id=? AND status='sending' AND attempt_count=1").run(selected.deliveryId);
    });
    started = true;
    const response = await request(`https://discord.com/api/v10/channels/${selected.channelId}/messages`, { method: "POST", headers: { Authorization: `Bot ${input.botToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, nonce, enforce_nonce: true }), signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Provider did not confirm the selected plan announcement.");
    const receipt = await response.json() as { id?: string; channel_id?: string };
    if (!receipt.id || !/^[0-9]{1,32}$/u.test(receipt.id) || receipt.channel_id !== selected.channelId) return refused();
    writer("settlement", () => {
      const at = createCanonicalUtcTimestamp();
      const count = database.prepare("UPDATE traderlink_community_content_deliveries SET status='delivered',delivery_outcome='confirmed',discord_message_id=?,next_attempt_at_utc=NULL,delivered_at_utc=?,updated_at_utc=? WHERE delivery_id=? AND status='sending' AND attempt_count=1 AND delivery_outcome='uncertain'").run(receipt.id, at, at, selected.deliveryId);
      if (count.changes !== 1) return refused();
      recordCommunityDeliveryAttempt(database, { deliveryId: selected.deliveryId, communityId: selected.communityId, attemptKey, outcome: "confirmed", messageId: receipt.id, atUtc: at });
    });
    return { delivered: 1, failed: 0, deliveryId: selected.deliveryId, messageId: receipt.id, channelId: selected.channelId, payloadSha256: sha(payload) };
  } catch {
    writer("settlement", () => {
      const at = createCanonicalUtcTimestamp(), outcome = started ? "uncertain" : "rejected";
      const error = started ? "Delivery confirmation unavailable. Check Discord before retrying." : "The selected destination could not be verified.";
      const count = database.prepare("UPDATE traderlink_community_content_deliveries SET status='failed',delivery_outcome=?,last_error=?,next_attempt_at_utc=NULL,updated_at_utc=? WHERE delivery_id=? AND status='sending' AND attempt_count=1").run(outcome, error, at, selected.deliveryId);
      if (count.changes !== 1) return refused();
      recordCommunityDeliveryAttempt(database, { deliveryId: selected.deliveryId, communityId: selected.communityId, attemptKey, outcome, error, atUtc: at });
    });
    return { delivered: 0, failed: 1, deliveryId: selected.deliveryId, uncertain: started };
  }
}
