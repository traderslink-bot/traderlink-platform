import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
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

export function readTickerPremiumOnly(database: Database.Database, symbol: string): boolean {
  if (!analysisVisibilitySymbol.test(symbol)) throw new Error("Invalid ticker.");
  const row = database.prepare<[string], { ticker_premium_only: number }>(
    "SELECT ticker_premium_only FROM platform_watchlist_analysis_visibility WHERE symbol = ?",
  ).get(symbol);
  if (row && row.ticker_premium_only !== 0 && row.ticker_premium_only !== 1) throw new Error("Invalid access setting.");
  return row?.ticker_premium_only === 1;
}

export function saveTickerPremiumOnly(database: Database.Database, input: {
  symbol: string; premiumOnly: boolean; actorUserId: string;
}): void {
  if (!analysisVisibilitySymbol.test(input.symbol) || typeof input.premiumOnly !== "boolean") throw new Error("Invalid access setting.");
  const now = new Date().toISOString();
  database.transaction(() => {
    const previous = readTickerPremiumOnly(database, input.symbol);
    database.prepare(`INSERT INTO platform_watchlist_analysis_visibility(symbol,premium_only,ticker_premium_only,updated_at_utc,updated_by_user_id)
      VALUES(?,0,?,?,?) ON CONFLICT(symbol) DO UPDATE SET ticker_premium_only=excluded.ticker_premium_only,
      updated_at_utc=excluded.updated_at_utc,updated_by_user_id=excluded.updated_by_user_id`)
      .run(input.symbol, Number(input.premiumOnly), now, input.actorUserId);
    database.prepare(`INSERT INTO platform_watchlist_analysis_visibility_audit(symbol,control,previous_premium_only,premium_only,changed_at_utc,actor_user_id)
      VALUES(?,'ticker',?,?,?,?)`).run(input.symbol, Number(previous), Number(input.premiumOnly), now, input.actorUserId);
  })();
}

export function readWatchlistTickerPolicy(requestHeaders: Headers): { all: boolean; owner: boolean; privateSymbols: ReadonlySet<string>; restricted: ReadonlySet<string> } | null {
  try {
    if (withJournalAdminDatabase(requestHeaders, () => true)) return { all: true, owner: true, privateSymbols: new Set(), restricted: new Set() };
  } catch { /* Normal free members may not have dashboard access. */ }
  try {
    const identity = requireTraderLinkPlatformDiscordMemberRequestIdentity(requestHeaders);
    const restricted = withReadonlyPlatformDatabase({}, db => db.prepare<[], { symbol: string }>(
      "SELECT symbol FROM platform_watchlist_analysis_visibility WHERE ticker_premium_only = 1").all());
    const privateSymbols = withReadonlyPlatformDatabase({}, db => db.prepare<[], {symbol:string}>("SELECT symbol FROM live_watchlist_symbols WHERE json_extract(state_json,'$.watchlistGroup')='private'").all());
    return { owner: false, privateSymbols: new Set(privateSymbols.map(row=>row.symbol)), all: Boolean(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord)), restricted: new Set(restricted.map(row => row.symbol)) };
  } catch { return null; }
}

export function canViewWatchlistTicker(requestHeaders: Headers, symbol: string): boolean {
  const policy = readWatchlistTickerPolicy(requestHeaders);
  return Boolean(policy && (policy.owner || !policy.privateSymbols.has(symbol.toUpperCase())) && (policy.all || !policy.restricted.has(symbol.toUpperCase())));
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

export function isPrivateWatchlistTicker(symbol: string): boolean {
  return withReadonlyPlatformDatabase({}, db => {
    const row=db.prepare<[string],{state_json:string}>("SELECT state_json FROM live_watchlist_symbols WHERE symbol=?").get(symbol.toUpperCase());
    return row ? JSON.parse(row.state_json).watchlistGroup === "private" : false;
  });
}

export function canViewPrivateWatchlistTicker(headers: Headers, symbol:string):boolean {
  try { if(withJournalAdminDatabase(headers,()=>true))return true; }catch{}
  try { return !isPrivateWatchlistTicker(symbol); }catch{return false;}
}
