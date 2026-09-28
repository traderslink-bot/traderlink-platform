import type Database from "better-sqlite3";
import { MEMBERSHIP_FEATURE_REQUIRED_MESSAGE } from "../../contracts/platform-membership-messages";
export { MEMBERSHIP_FEATURE_REQUIRED_MESSAGE } from "../../contracts/platform-membership-messages";
import { isPlatformMembershipCatalogAvailable } from "./platform-membership-catalog-repository";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { platformFailure, createCanonicalUtcTimestamp, isTraderLinkPlatformError } from "../database/platform-migration-contract";

export function isMembershipAccessDenied(error: unknown): boolean {
  return isTraderLinkPlatformError(error) && error.code === "TRADERLINK_ACCOUNT_ACCESS_DENIED" && error.safeContext.reason === "membership_feature_required";
}

export function membershipFeatureDeniedResponse(error: unknown): Response | null {
  return isMembershipAccessDenied(error)
    ? Response.json({ code: "membership_required", error: { code: "membership_required", message: MEMBERSHIP_FEATURE_REQUIRED_MESSAGE } }, { status: 403, headers: { "cache-control": "no-store" } })
    : null;
}

export function hasPlatformMembershipFeature(database: Database.Database, userId: string, feature: string): boolean {
  return isPlatformMembershipCatalogAvailable(database) && new PlatformMembershipRepository(database)
    .readEffectiveAccess(userId).booleanFeatures.includes(feature);
}

export type MembershipFeatureDecision = Readonly<{
  mode: "off" | "shadow" | "enforced"; allowed: boolean; wouldAllow: boolean; ownerBypass: boolean; limit: number | null | undefined;
}>;

/** This commercial policy never replaces workspace/account or coaching data authorization. */
export function evaluateMembershipFeature(database: Database.Database, userId: string | null, feature: string,
  requestedTotal?: number, at = createCanonicalUtcTimestamp()): MembershipFeatureDecision {
  if (requestedTotal !== undefined && (!Number.isSafeInteger(requestedTotal) || requestedTotal < 0)) throw new Error("Invalid membership usage count.");
  const available = database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_feature_policies'").get();
  if (!available) return { mode: "off", allowed: true, wouldAllow: true, ownerBypass: false, limit: undefined };
  const policy = database.prepare("SELECT enforcement_mode FROM platform_membership_feature_policies WHERE feature_key=?").get(feature) as { enforcement_mode: MembershipFeatureDecision["mode"] } | undefined;
  const mode = policy?.enforcement_mode ?? "off";
  if (mode === "off") return { mode, allowed: true, wouldAllow: true, ownerBypass: false, limit: undefined };
  if (userId === null) return { mode, allowed: mode !== "enforced", wouldAllow: false, ownerBypass: false, limit: undefined };
  const ownerTable = database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_operator_grants'").get();
  const ownerBypass = Boolean(ownerTable && database.prepare("SELECT 1 FROM platform_operator_grants WHERE user_id=? AND authority_key='journal_administration' AND grant_state='active'").get(userId));
  const access = new PlatformMembershipRepository(database).readEffectiveAccess(userId, at);
  const limit = access.limits[feature];
  const wouldAllow = ownerBypass || (requestedTotal === undefined ? access.booleanFeatures.includes(feature)
    : limit === null || (limit !== undefined && requestedTotal <= limit));
  return { mode, allowed: mode !== "enforced" || wouldAllow, wouldAllow, ownerBypass, limit };
}

export function assertMembershipFeature(database: Database.Database, userId: string, feature: string, requestedTotal?: number): void {
  if (!evaluateMembershipFeature(database, userId, feature, requestedTotal).allowed) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED", { reason: "membership_feature_required", feature });
  }
}

export function assertMembershipJournalAccountCreation(database: Database.Database, userId: string): void {
  const demoTable = database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='journal_demo_accounts'").get();
  const count = database.prepare(`SELECT COUNT(*) count FROM journal_accounts a WHERE a.created_by_user_id=? AND a.status='active'
    ${demoTable ? "AND NOT EXISTS (SELECT 1 FROM journal_demo_accounts d WHERE d.account_id=a.account_id AND d.workspace_id=a.workspace_id)" : ""}`)
    .get(userId) as { count: number };
  assertMembershipFeature(database, userId, "journal.accounts", count.count + 1);
}
