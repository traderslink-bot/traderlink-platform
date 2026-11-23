import "server-only";

import type Database from "better-sqlite3";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { hasMarketToolDashboardAdmission, readMarketToolMembershipAccess } from "@/src/modules/platform/server/membership/membership-market-tool-access";
import { hasScannerEarlyAccess } from "@/src/modules/scanner/server/scanner-early-access";

export const SCANNER_DASHBOARD_SUBJECTS = "TRADERLINK_SCANNER_DASHBOARD_DISCORD_SUBJECT";
export const STOCK_SCREENERS_DASHBOARD_SUBJECTS = "TRADERLINK_STOCK_SCREENERS_DASHBOARD_DISCORD_SUBJECT";
export const TRADING_WORKSPACE_DASHBOARD_SUBJECTS = "TRADERLINK_TRADING_WORKSPACE_DASHBOARD_DISCORD_SUBJECT";
export const MARKET_TOOLS_ACCESS_MODE = "TRADERLINK_MARKET_TOOLS_ACCESS_MODE";
export const MARKET_TOOLS_REVIEW_USER_IDS = "TRADERLINK_MARKET_TOOLS_REVIEW_USER_IDS";
const LEGACY_PILOT_SUBJECTS = "TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT";
const DISCORD_SUBJECT = /^[0-9]{1,32}$/u;

type AccessOptions = Readonly<{
  environment?: NodeJS.ProcessEnv;
  databasePath?: string;
  forbiddenRepositoryRoots?: readonly string[];
}>;

type MarketToolsDashboardAccess = Readonly<{ scanner: boolean; tradingWorkspace: boolean }>;

function reviewAdmission(identity: TraderLinkPlatformRequestIdentity, environment: NodeJS.ProcessEnv): boolean | undefined {
  if (environment[MARKET_TOOLS_ACCESS_MODE] === "standard") return;
  const ids = environment[MARKET_TOOLS_REVIEW_USER_IDS]?.split(",").map(id => id.trim()) ?? [];
  return ids.length === 2 && ids.every(isCanonicalUuidV4) && ids[0] !== ids[1] &&
    ids.includes(identity.scope.userId);
}

function subjects(value: string | undefined): readonly string[] {
  const entries = value?.split(",").map(entry => entry.trim()) ?? [];
  return entries.every(entry => DISCORD_SUBJECT.test(entry)) ? entries : [];
}

function activeDiscordSubjects(database: Database.Database, userId: string) {
  const active = database.prepare<[string], { auth_subject: string }>(`
SELECT auth_subject
FROM platform_auth_identities
WHERE user_id = ? AND auth_provider = 'discord' AND status = 'active'
`).all(userId);
  return new Set(active.map(row => row.auth_subject));
}

function admitsMarketTool(
  database: Database.Database, userId: string, key: "scanners.access" | "screeners.access", existingAccess = false,
  prePaywallAdmission?: () => boolean,
) {
  try {
    return readMarketToolMembershipAccess(database, userId, [{
      key, existingAccess, memberReleaseReady: true,
      prePaywallAccess: !existingAccess && prePaywallAdmission?.() === true,
    }]).get(key) === true;
  } catch {
    return existingAccess;
  }
}

/** Feature admission stays independent. The old pilot roster is only a fallback for an unset roster. */
export function readMarketToolsDashboardAccess(
  identity: TraderLinkPlatformRequestIdentity,
  options: AccessOptions = {},
): MarketToolsDashboardAccess {
  if (identity.mode === "local_development") return { scanner: true, tradingWorkspace: true };

  const environment = options.environment ?? process.env;
  const review = reviewAdmission(identity, environment);
  if (review !== undefined) return { scanner: review, tradingWorkspace: review };
  const legacy = environment[LEGACY_PILOT_SUBJECTS];
  const scanner = subjects(environment[SCANNER_DASHBOARD_SUBJECTS] ?? legacy);
  const tradingWorkspace = subjects(environment[TRADING_WORKSPACE_DASHBOARD_SUBJECTS] ?? legacy);

  return withReadonlyPlatformDatabase({ ...options, environment }, database => {
    const userId = identity.scope.userId;
    const active = scanner.length || tradingWorkspace.length ? activeDiscordSubjects(database, userId) : new Set<string>();
    return {
      scanner: admitsMarketTool(database, userId, "scanners.access", scanner.some(subject => active.has(subject)),
        () => hasMarketToolDashboardAdmission(database, identity, environment)),
      tradingWorkspace: tradingWorkspace.some(subject => active.has(subject)),
    };
  });
}

export function hasScannerDashboardAccess(
  identity: TraderLinkPlatformRequestIdentity,
  options?: AccessOptions,
): boolean {
  return readMarketToolsDashboardAccess(identity, options).scanner;
}

/** The older Moomoo screen retains its own pilot and broker-connection checks. */
export function hasLegacyScannerDashboardAccess(
  identity: TraderLinkPlatformRequestIdentity,
  options: AccessOptions = {},
): boolean {
  if (identity.mode === "local_development") return true;
  if (reviewAdmission(identity, options.environment ?? process.env) === false) return false;
  const paid = withReadonlyPlatformDatabase(options, database =>
    admitsMarketTool(database, identity.scope.userId, "scanners.access"));
  return paid || hasScannerEarlyAccess(identity, options);
}

export function hasStockScreenersDashboardAccess(
  identity: TraderLinkPlatformRequestIdentity,
  options: AccessOptions = {},
): boolean {
  if (identity.mode === "local_development") return true;
  const environment = options.environment ?? process.env;
  const review = reviewAdmission(identity, environment);
  if (review !== undefined) return review;
  const roster = subjects(environment[STOCK_SCREENERS_DASHBOARD_SUBJECTS] ?? environment[LEGACY_PILOT_SUBJECTS]);
  return withReadonlyPlatformDatabase({ ...options, environment }, database => {
    const userId = identity.scope.userId;
    const active = roster.length ? activeDiscordSubjects(database, userId) : new Set<string>();
    return admitsMarketTool(database, userId, "screeners.access", roster.some(subject => active.has(subject)),
      () => hasMarketToolDashboardAdmission(database, identity, environment));
  });
}

export function hasTradingWorkspaceDashboardAccess(
  identity: TraderLinkPlatformRequestIdentity,
  options?: AccessOptions,
): boolean {
  return readMarketToolsDashboardAccess(identity, options).tradingWorkspace;
}

/** Shared data used by both features remains available to either admitted consumer. */
export function hasMarketToolsDashboardReadAccess(
  identity: TraderLinkPlatformRequestIdentity,
  options?: AccessOptions,
): boolean {
  const access = readMarketToolsDashboardAccess(identity, options);
  return access.scanner || access.tradingWorkspace;
}
