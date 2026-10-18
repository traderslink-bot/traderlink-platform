import type Database from "better-sqlite3";
import { journalTagPresetForName } from "@/src/modules/journal/contracts/journal-tag-preset-catalog";
import { membershipFeatureDefaultEnforcement } from "../../contracts/membership-product-features";
import { MEMBERSHIP_FEATURE_REQUIRED_MESSAGE, MEMBERSHIP_IMPORT_REQUIRED_MESSAGE } from "../../contracts/platform-membership-messages";
export { MEMBERSHIP_FEATURE_REQUIRED_MESSAGE } from "../../contracts/platform-membership-messages";
import { isPlatformMembershipCatalogAvailable } from "./platform-membership-catalog-repository";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { platformFailure, createCanonicalUtcTimestamp, isTraderLinkPlatformError } from "../database/platform-migration-contract";

export function isMembershipAccessDenied(error: unknown): boolean {
  return isTraderLinkPlatformError(error) && error.code === "TRADERLINK_ACCOUNT_ACCESS_DENIED" && error.safeContext.reason === "membership_feature_required";
}

export function membershipFeatureDeniedMessage(error: unknown): string {
  const feature = isTraderLinkPlatformError(error) ? error.safeContext.feature : undefined;
  if (feature === "broker.connections") return "Connect your broker and keep trades flowing into your Journal. Choose a plan or add-on with an available broker connection.";
  if (feature === "journal.imports") return MEMBERSHIP_IMPORT_REQUIRED_MESSAGE;
  if (feature === "journal.accounts") return "You have reached your Journal account allowance. Choose a plan with more accounts to add another.";
  if (feature === "journal.custom_tags") return "Your plan does not allow another custom tag. Retire an unused custom tag or choose a plan with a larger allowance.";
  if (feature === "journal.custom_rules") return "Your plan does not allow another active custom rule. Pause or retire an unused rule or choose a plan with a larger allowance.";
  if (feature === "journal.preset_rules") return "Unlock preset Trading Rules to automatically review your trades against the rules you choose.";
  return MEMBERSHIP_FEATURE_REQUIRED_MESSAGE;
}

export function membershipFeatureDeniedResponse(error: unknown): Response | null {
  return isMembershipAccessDenied(error)
    ? Response.json({ code: "membership_required", error: { code: "membership_required", message: membershipFeatureDeniedMessage(error) } },
      { status: 403, headers: { "cache-control": "no-store" } })
    : null;
}

export function hasPlatformMembershipFeature(database: Database.Database, userId: string, feature: string, at = createCanonicalUtcTimestamp()): boolean {
  if (!isPlatformMembershipCatalogAvailable(database)) return false;
  const access = new PlatformMembershipRepository(database).readEffectiveAccess(userId, at);
  if (feature === "dashboard.access") {
    // Dashboard admission is implied by an active app product, not a separately
    // selectable plan feature. Product-specific permissions remain independent.
    const products = new Set(["dashboard.access", "journal.access", "journal.session_tracker", "analytics.access",
      "analytics.trade_explorer", "analytics.compare_trades", "ai.reviews", "ai.chat", "academy.access", "watchlist.access",
      "trade_analyzer.analysis", "news.access", "news.week_ahead", "coaching.access", "community.access"]);
    return access.booleanFeatures.some(key => products.has(key)) || ["trade_analyzer.analyses", "levels.generations"].some(key =>
      Object.hasOwn(access.limits, key) && (access.limits[key] === null || (access.limits[key] ?? 0) > 0));
  }
  return access.booleanFeatures.includes(feature);
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
  const mode = policy?.enforcement_mode ?? membershipFeatureDefaultEnforcement(feature);
  if (mode === "off") return { mode, allowed: true, wouldAllow: true, ownerBypass: false, limit: undefined };
  if (userId === null) return { mode, allowed: mode !== "enforced", wouldAllow: false, ownerBypass: false, limit: undefined };
  const ownerTable = database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_operator_grants'").get();
  const ownerBypass = Boolean(ownerTable && database.prepare("SELECT 1 FROM platform_operator_grants WHERE user_id=? AND authority_key='journal_administration' AND grant_state='active'").get(userId));
  const access = new PlatformMembershipRepository(database).readEffectiveAccess(userId, at);
  const limit = access.limits[feature];
  const wouldAllow = ownerBypass || (requestedTotal === undefined ? (feature === "dashboard.access" ? hasPlatformMembershipFeature(database, userId, feature, at) : access.booleanFeatures.includes(feature))
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

/** Called within the Journal write transaction so two requests cannot claim the same slot. */
export function assertMembershipCustomTagCreation(database: Database.Database, userId: string, name: string): void {
  if (journalTagPresetForName(name)) return;
  const tags = database.prepare(`SELECT current_name FROM journal_tags
    WHERE created_by_user_id=? AND lifecycle_state='active'`).all(userId) as { current_name: string }[];
  const count = tags.filter(tag => !journalTagPresetForName(tag.current_name)).length;
  assertMembershipFeature(database, userId, "journal.custom_tags", count + 1);
}

export function assertMembershipRuleCreation(database: Database.Database, userId: string, sourceKind: "template" | "custom"): void {
  assertMembershipFeature(database, userId, "journal.rules");
  if (sourceKind === "template") {
    assertMembershipFeature(database, userId, "journal.preset_rules");
  } else {
    const count = database.prepare(`SELECT COUNT(*) count FROM journal_rules
      WHERE created_by_user_id=? AND source_kind='custom' AND lifecycle_state='active'`).get(userId) as { count: number };
    assertMembershipFeature(database, userId, "journal.custom_rules", count.count + 1);
  }
}
