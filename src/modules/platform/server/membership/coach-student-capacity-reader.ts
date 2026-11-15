import type Database from "better-sqlite3";
import type { CoachStudentCapacitySnapshot } from "../../contracts/coach-student-capacity";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4 } from "../database/platform-migration-contract";
import { PlatformMembershipRepository } from "./platform-membership-repository";

/** Reuse existing Membership access/source/overlap rules without changing them.
 * Repeat capacity batches are summed into each accepted bundle before this read.
 * This reader adds no payment-provider, Discord or source-selection policy.
 */
export function readCoachStudentCapacitySnapshot(database: Database.Database, input: Readonly<{
  coachUserId: string; atUtc: string;
}>): CoachStudentCapacitySnapshot {
  assertCanonicalUuidV4(input.coachUserId, "coachUserId");
  assertCanonicalUtcTimestamp(input.atUtc, "atUtc");
  const hasPolicy = database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_feature_policies'").get();
  const policy = hasPolicy ? database.prepare("SELECT enforcement_mode FROM platform_membership_feature_policies WHERE feature_key='coaching.students'").get() as { enforcement_mode: string } | undefined : undefined;
  if (policy?.enforcement_mode !== "enforced") return { version: 1, enabled: false, capacity: null };
  const access = new PlatformMembershipRepository(database).readEffectiveAccess(input.coachUserId, input.atUtc);
  const capacity = access.limits["coaching.students"];
  return { version: 1, enabled: true, capacity: capacity === undefined ? null : capacity === null
    ? { kind: "unlimited" } : { kind: "finite", count: capacity } };
}
