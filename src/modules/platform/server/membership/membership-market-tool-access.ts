import type Database from "better-sqlite3";
import type { TraderLinkPlatformRequestIdentity } from "../authentication/require-platform-request-scope";
import { PlatformDashboardMemberAccessRepository } from "../authentication/platform-dashboard-member-access-repository";
import { hasPlatformDiscordPremiumAccess } from "@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement";
import { allowsMarketToolAccess, type MarketToolMembershipKey } from "../../contracts/membership-market-tools";
import { createCanonicalUtcTimestamp } from "../database/platform-migration-contract";
import { isPlatformMembershipCatalogAvailable } from "./platform-membership-catalog-repository";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { evaluateMembershipFeature, hasPlatformMembershipFeature } from "./platform-membership-access";

export type MarketToolAccessCheck = Readonly<{
  key: MarketToolMembershipKey;
  existingAccess: boolean;
  memberReleaseReady: boolean;
  /** Server-verified dashboard eligibility for this released consumer only. */
  prePaywallAccess?: boolean;
}>;

/** Reuse global app admission; a Billing-only identity does not qualify. */
export function hasMarketToolDashboardAdmission(
  database: Database.Database,
  identity: TraderLinkPlatformRequestIdentity,
  environment: NodeJS.ProcessEnv = process.env,
  atUtc = createCanonicalUtcTimestamp(),
): boolean {
  if (identity.mode === "local_development") return true;
  if (hasPlatformMembershipFeature(database, identity.scope.userId, "dashboard.access", atUtc)) return true;
  if (!identity.discord || !evaluateMembershipFeature(database, identity.scope.userId, "dashboard.access", undefined, atUtc).allowed) return false;
  return new PlatformDashboardMemberAccessRepository(database).read().allowAllDiscordMembers ||
    hasPlatformDiscordPremiumAccess(identity.discord, environment);
}

/** Resolve identity first. Pilot access and readiness must come from the feature. */
export function readMarketToolMembershipAccess(
  database: Database.Database,
  userId: string,
  checks: readonly MarketToolAccessCheck[],
  atUtc = createCanonicalUtcTimestamp(),
): ReadonlyMap<MarketToolMembershipKey, boolean> {
  const result = new Map(checks.map(check => [check.key, check.existingAccess]));
  const eligible = checks.filter(check => !check.existingAccess && check.memberReleaseReady);
  if (!eligible.length) return result;
  const policyAvailable = database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_feature_policies'").get();
  const policy = policyAvailable ? database.prepare<[string], { enforcement_mode: "off" | "shadow" | "enforced" }>(
    "SELECT enforcement_mode FROM platform_membership_feature_policies WHERE feature_key=?",
  ) : null;
  const decisions = eligible.map(check => ({ check, mode: policy?.get(check.key)?.enforcement_mode ?? "off" }));
  const needsGrants = decisions.some(({ mode }) => mode === "enforced");
  const grants = new Set(needsGrants && isPlatformMembershipCatalogAvailable(database)
    ? new PlatformMembershipRepository(database).readEffectiveAccess(userId, atUtc).booleanFeatures : []);
  for (const { check, mode } of decisions) {
    result.set(check.key, allowsMarketToolAccess({
      ...check, enforcement: mode, hasActiveGrant: grants.has(check.key),
    }));
  }
  return result;
}
