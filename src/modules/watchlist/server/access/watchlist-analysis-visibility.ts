import "server-only";
import type Database from "better-sqlite3";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { requireTraderLinkPlatformDiscordMemberRequestIdentity, requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "./watchlist-dashboard-navigation-access";
import { hasPlatformDiscordPremiumAccess } from "./platform-discord-watchlist-entitlement";

export const analysisVisibilitySymbol = /^[A-Z0-9][A-Z0-9.^-]{0,15}$/;

export function readAnalysisPremiumOnly(database: Database.Database, symbol: string): boolean {
  if (!analysisVisibilitySymbol.test(symbol)) throw new Error("Invalid ticker.");
  const row = database.prepare<[string], { premium_only: number }>(
    "SELECT premium_only FROM platform_watchlist_analysis_visibility WHERE symbol = ?",
  ).get(symbol);
  if (row && row.premium_only !== 0 && row.premium_only !== 1) throw new Error("Invalid access setting.");
  return row?.premium_only === 1;
}

export function saveAnalysisPremiumOnly(database: Database.Database, input: {
  symbol: string; premiumOnly: boolean; actorUserId: string;
}): void {
  if (!analysisVisibilitySymbol.test(input.symbol) || typeof input.premiumOnly !== "boolean") throw new Error("Invalid access setting.");
  const now = new Date().toISOString();
  database.transaction(() => {
    const previous = readAnalysisPremiumOnly(database, input.symbol);
    database.prepare(`INSERT INTO platform_watchlist_analysis_visibility(symbol,premium_only,updated_at_utc,updated_by_user_id)
      VALUES(?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET premium_only=excluded.premium_only,
      updated_at_utc=excluded.updated_at_utc,updated_by_user_id=excluded.updated_by_user_id`)
      .run(input.symbol, Number(input.premiumOnly), now, input.actorUserId);
    database.prepare(`INSERT INTO platform_watchlist_analysis_visibility_audit(symbol,previous_premium_only,premium_only,changed_at_utc,actor_user_id)
      VALUES(?,?,?,?,?)`).run(input.symbol, Number(previous), Number(input.premiumOnly), now, input.actorUserId);
  })();
}

/** Independent of generic analysis entitlements. Never authorize from a client flag. */
export function canViewWatchlistAnalysisPrices(requestHeaders: Headers, symbol: string): boolean {
  try {
    if (hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(requestHeaders))) return true;
  } catch { /* Ordinary Discord members may not have dashboard access. */ }
  try {
    const identity = requireTraderLinkPlatformDiscordMemberRequestIdentity(requestHeaders);
    if (hasWatchlistDashboardNavigationAccess(identity)) return true;
    const restricted = withReadonlyPlatformDatabase({}, db => readAnalysisPremiumOnly(db, symbol.toUpperCase()));
    if (!restricted) return true;
    return Boolean(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord));
  } catch {
    return false;
  }
}
