import type Database from "better-sqlite3";
import type { MembershipNewsDelayFeature } from "../../contracts/membership-news-delays";
import { evaluateMembershipFeature } from "./platform-membership-access";
import { PlatformMembershipRepository } from "./platform-membership-repository";

/** Delay is a minimum across grants, unlike a usage ceiling (which is a maximum).
 * An absent setting preserves immediate legacy access; it does not grant news access.
 * A selected blank/zero setting explicitly grants immediate access.
 */
export function readMembershipNewsDelaySeconds(database: Database.Database, userId: string,
  feature: MembershipNewsDelayFeature, now = new Date().toISOString()): number {
  const decision = evaluateMembershipFeature(database, userId, feature, 0, now);
  if (decision.mode !== "enforced" || decision.ownerBypass) return 0;
  const access = new PlatformMembershipRepository(database).readEffectiveAccess(userId, now);
  let seconds: number | undefined;
  const read = database.prepare("SELECT limit_value FROM platform_membership_plan_features WHERE plan_version_id=? AND feature_key=?");
  for (const version of new Set(access.sources.map(source => source.planVersionId))) {
    const row = read.get(version, feature) as { limit_value: number | null } | undefined;
    if (!row) continue;
    const value = row.limit_value ?? 0;
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid news delay configuration.");
    seconds = seconds === undefined ? value : Math.min(seconds, value);
  }
  return seconds ?? 0;
}

/** Independent owner setting: notifications may precede visibility if configured that way. */
export function readMembershipNewsNotificationDelaySeconds(database: Database.Database, userId: string): number {
  return readMembershipNewsDelaySeconds(database, userId, "news.notification_delay_seconds");
}

export function delayedNewsAvailableAt(createdAt: string, publishedAt: string, seconds: number): string {
  if (!Number.isSafeInteger(seconds) || seconds < 0) throw new Error("Invalid news delay configuration.");
  const anchor = Math.max(Date.parse(createdAt), Date.parse(publishedAt));
  if (!Number.isFinite(anchor)) throw new Error("Invalid news availability timestamp.");
  // Storage timestamps use four-digit years. Larger requested delays remain held.
  return new Date(Math.min(Date.parse("9999-12-31T23:59:59.999Z"), anchor + seconds * 1000)).toISOString();
}
