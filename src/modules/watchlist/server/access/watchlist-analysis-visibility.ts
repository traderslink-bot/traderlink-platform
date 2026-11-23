import { withWatchlistAdminDatabase } from "@/src/modules/watchlist/server/access/watchlist-admin-authorization";
import "server-only";
import type Database from "better-sqlite3";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { hasWatchlistDashboardNavigationAccess } from "./watchlist-dashboard-navigation-access";
import { hasPlatformDiscordPremiumAccess } from "./platform-discord-watchlist-entitlement";
import { hasWatchlistPremiumPlanAccess, readWatchlistDefaultPremiumOnly, readWatchlistPlanDecisions, watchlistDefaultPremiumOnly } from "./watchlist-plan-policy";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const analysisVisibilitySymbol = /^[A-Z0-9][A-Z0-9.^-]{0,15}$/;

export function readAnalysisPremiumOnly(database: Database.Database, symbol: string): boolean {
  if (!analysisVisibilitySymbol.test(symbol)) throw new Error("Invalid ticker.");
  const row = database.prepare<[string], { premium_only: number }>(
    "SELECT premium_only FROM platform_watchlist_analysis_visibility WHERE symbol = ?",
  ).get(symbol);
  if (row && row.premium_only !== 0 && row.premium_only !== 1) throw new Error("Invalid access setting.");
  return row ? row.premium_only === 1 : readWatchlistDefaultPremiumOnly(database, symbol);
}

export function saveAnalysisPremiumOnly(database: Database.Database, input: {
  symbol: string; premiumOnly: boolean; actorUserId: string;
}): void {
  if (!analysisVisibilitySymbol.test(input.symbol) || typeof input.premiumOnly !== "boolean") throw new Error("Invalid access setting.");
  const now = new Date().toISOString();
  database.transaction(() => {
    const previous = readAnalysisPremiumOnly(database, input.symbol);
    const tickerPremiumOnly = readTickerPremiumOnly(database, input.symbol);
    database.prepare(`INSERT INTO platform_watchlist_analysis_visibility(symbol,premium_only,ticker_premium_only,updated_at_utc,updated_by_user_id)
      VALUES(?,?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET premium_only=excluded.premium_only,
      updated_at_utc=excluded.updated_at_utc,updated_by_user_id=excluded.updated_by_user_id`)
      .run(input.symbol, Number(input.premiumOnly), Number(tickerPremiumOnly), now, input.actorUserId);
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
  return row ? row.ticker_premium_only === 1 : readWatchlistDefaultPremiumOnly(database, symbol);
}

export function saveTickerPremiumOnly(database: Database.Database, input: {
  symbol: string; premiumOnly: boolean; actorUserId: string;
}): void {
  if (!analysisVisibilitySymbol.test(input.symbol) || typeof input.premiumOnly !== "boolean") throw new Error("Invalid access setting.");
  const now = new Date().toISOString();
  database.transaction(() => {
    const previous = readTickerPremiumOnly(database, input.symbol);
    const analysisPremiumOnly = readAnalysisPremiumOnly(database, input.symbol);
    database.prepare(`INSERT INTO platform_watchlist_analysis_visibility(symbol,premium_only,ticker_premium_only,updated_at_utc,updated_by_user_id)
      VALUES(?,?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET ticker_premium_only=excluded.ticker_premium_only,
      updated_at_utc=excluded.updated_at_utc,updated_by_user_id=excluded.updated_by_user_id`)
      .run(input.symbol, Number(analysisPremiumOnly), Number(input.premiumOnly), now, input.actorUserId);
    database.prepare(`INSERT INTO platform_watchlist_analysis_visibility_audit(symbol,control,previous_premium_only,premium_only,changed_at_utc,actor_user_id)
      VALUES(?,'ticker',?,?,?,?)`).run(input.symbol, Number(previous), Number(input.premiumOnly), now, input.actorUserId);
  })();
}

export function readRowHiddenFromFree(database: Database.Database, symbol: string): boolean {
  if (!analysisVisibilitySymbol.test(symbol)) throw new Error("Invalid ticker.");
  // Reads remain compatible with a server deployed before the additive migration.
  if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_row_visibility'").get()) return false;
  const row = database.prepare<[string], { hidden_from_free: number }>(
    "SELECT hidden_from_free FROM platform_watchlist_row_visibility WHERE symbol=?").get(symbol);
  if (row && row.hidden_from_free !== 0 && row.hidden_from_free !== 1) throw new Error("Invalid access setting.");
  return row?.hidden_from_free === 1;
}

export function saveRowHiddenFromFree(database: Database.Database, input: {
  symbol: string; premiumOnly: boolean; actorUserId: string;
}): void {
  if (!analysisVisibilitySymbol.test(input.symbol) || typeof input.premiumOnly !== "boolean") throw new Error("Invalid access setting.");
  const now = new Date().toISOString();
  database.transaction(() => {
    const previous = readRowHiddenFromFree(database, input.symbol);
    database.prepare(`INSERT INTO platform_watchlist_row_visibility(symbol,hidden_from_free,updated_at_utc,updated_by_user_id)
      VALUES(?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET hidden_from_free=excluded.hidden_from_free,
      updated_at_utc=excluded.updated_at_utc,updated_by_user_id=excluded.updated_by_user_id`)
      .run(input.symbol, Number(input.premiumOnly), now, input.actorUserId);
    database.prepare(`INSERT INTO platform_watchlist_row_visibility_audit(symbol,previous_hidden_from_free,hidden_from_free,changed_at_utc,actor_user_id)
      VALUES(?,?,?,?,?)`).run(input.symbol, Number(previous), Number(input.premiumOnly), now, input.actorUserId);
  })();
}

/** Explicit date-only disclosure, independent of every access restriction. */
export function readHiddenTickerAddedVisible(database: Database.Database, symbol: string): boolean {
  if (!analysisVisibilitySymbol.test(symbol)) throw new Error("Invalid ticker.");
  if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_hidden_added_visibility'").get()) return false;
  const row = database.prepare<[string], { show_added: number }>(
    "SELECT show_added FROM platform_watchlist_hidden_added_visibility WHERE symbol=?").get(symbol);
  if (row && row.show_added !== 0 && row.show_added !== 1) throw new Error("Invalid access setting.");
  return row?.show_added === 1;
}

export function saveHiddenTickerAddedVisible(database: Database.Database, input: {
  symbol: string; premiumOnly: boolean; actorUserId: string;
}): void {
  if (!analysisVisibilitySymbol.test(input.symbol) || typeof input.premiumOnly !== "boolean") throw new Error("Invalid access setting.");
  const now = new Date().toISOString();
  database.transaction(() => {
    const previous = readHiddenTickerAddedVisible(database, input.symbol);
    database.prepare(`INSERT INTO platform_watchlist_hidden_added_visibility(symbol,show_added,updated_at_utc,updated_by_user_id)
      VALUES(?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET show_added=excluded.show_added,
      updated_at_utc=excluded.updated_at_utc,updated_by_user_id=excluded.updated_by_user_id`)
      .run(input.symbol, Number(input.premiumOnly), now, input.actorUserId);
    database.prepare(`INSERT INTO platform_watchlist_hidden_added_visibility_audit(symbol,previous_show_added,show_added,changed_at_utc,actor_user_id)
      VALUES(?,?,?,?,?)`).run(input.symbol, Number(previous), Number(input.premiumOnly), now, input.actorUserId);
  })();
}

export function readWatchlistTickerPolicy(requestHeaders: Headers): { all: boolean; owner: boolean; privateSymbols: ReadonlySet<string>; restricted: ReadonlySet<string>; hiddenRows: ReadonlySet<string>; showAddedDates: ReadonlySet<string> } | null {
  try {
    if (withWatchlistAdminDatabase(requestHeaders, () => true)) return { all: true, owner: true, privateSymbols: new Set(), restricted: new Set(), hiddenRows: new Set(), showAddedDates: new Set() };
  } catch { /* Normal free members may not have dashboard access. */ }
  try {
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(requestHeaders, { membershipFeatures: ["watchlist.access"] });
    const restricted = withReadonlyPlatformDatabase({}, db => {
      const choices = new Map(db.prepare<[], { symbol: string; ticker_premium_only: number }>(
        "SELECT symbol,ticker_premium_only FROM platform_watchlist_analysis_visibility").all().map(row => {
        if (row.ticker_premium_only !== 0 && row.ticker_premium_only !== 1) throw new Error("Invalid access setting.");
        return [row.symbol, row.ticker_premium_only === 1] as const;
      }));
      for (const row of db.prepare<[], { symbol: string; state_json: string }>("SELECT symbol,state_json FROM live_watchlist_symbols").all()) {
        if (!choices.has(row.symbol)) choices.set(row.symbol, watchlistDefaultPremiumOnly(row.state_json));
      }
      return [...choices].filter(([, premiumOnly]) => premiumOnly).map(([symbol]) => ({ symbol }));
    });
    const privateSymbols = withReadonlyPlatformDatabase({}, db => db.prepare<[], {symbol:string}>("SELECT symbol FROM live_watchlist_symbols WHERE json_extract(state_json,'$.watchlistGroup')='private'").all());
    const premium = Boolean(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord)) ||
      withReadonlyPlatformDatabase({}, db => hasWatchlistPremiumPlanAccess(db, identity.scope.userId, "ticker"));
    const blocked = new Set(premium ? [] : restricted.map(row => row.symbol));
    const configuredHiddenRows = withReadonlyPlatformDatabase({}, db => {
      if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_row_visibility'").get()) return new Set<string>();
      const rows = db.prepare<[], { symbol: string }>("SELECT symbol FROM platform_watchlist_row_visibility WHERE hidden_from_free=1").all();
      return new Set(rows.map(row => row.symbol));
    });
    const showAddedDates = withReadonlyPlatformDatabase({}, db => {
      if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_hidden_added_visibility'").get()) return new Set<string>();
      return new Set(db.prepare<[], {symbol:string}>("SELECT symbol FROM platform_watchlist_hidden_added_visibility WHERE show_added=1").all().map(row => row.symbol));
    });
    const hiddenRows = new Set(premium ? [] : configuredHiddenRows);
    const plans = withReadonlyPlatformDatabase({}, db => readWatchlistPlanDecisions(db, identity.scope.userId, "ticker"));
    for (const [symbol, allowed] of plans) { if (allowed) blocked.delete(symbol); else blocked.add(symbol); }
    // A specific selected plan takes precedence over the legacy Premium role.
    for (const [symbol, allowed] of plans) {
      if (!configuredHiddenRows.has(symbol)) continue;
      if (allowed) hiddenRows.delete(symbol); else hiddenRows.add(symbol);
    }
    return { owner: false, privateSymbols: new Set(privateSymbols.map(row=>row.symbol)), all: false, restricted: blocked, hiddenRows, showAddedDates };
  } catch { return null; }
}

export function canViewWatchlistTicker(requestHeaders: Headers, symbol: string): boolean {
  const policy = readWatchlistTickerPolicy(requestHeaders);
  return Boolean(policy && (policy.owner || !policy.privateSymbols.has(symbol.toUpperCase())) && (policy.all || !policy.restricted.has(symbol.toUpperCase())));
}

/** Independent of generic analysis entitlements. Never authorize from a client flag. */
export function canViewWatchlistAnalysisPrices(requestHeaders: Headers, symbol: string): boolean {
  try {
    if (withWatchlistAdminDatabase(requestHeaders, () => true)) return true;
  } catch { /* Ordinary member. */ }
  try {
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(requestHeaders, { membershipFeatures: ["watchlist.access"] });
    const decision = withReadonlyPlatformDatabase({}, db => readWatchlistPlanDecisions(db, identity.scope.userId, "analysis").get(symbol.toUpperCase()));
    if (decision !== undefined) return decision;
    if (hasWatchlistDashboardNavigationAccess(identity)) return true;
    const restricted = withReadonlyPlatformDatabase({}, db => readAnalysisPremiumOnly(db, symbol.toUpperCase()));
    if (!restricted) return true;
    return Boolean(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord)) ||
      withReadonlyPlatformDatabase({}, db => hasWatchlistPremiumPlanAccess(db, identity.scope.userId, "analysis"));
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
  try { if(withWatchlistAdminDatabase(headers,()=>true))return true; }catch{}
  try { return !isPrivateWatchlistTicker(symbol); }catch{return false;}
}
