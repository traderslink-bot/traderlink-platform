import "server-only";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "../../../platform/server/database/platform-database-config";
import { withReadonlyPlatformDatabase } from "../../../platform/server/database/open-readonly-platform-database";
import { CoachUsEquitiesReviewCalendarService } from "../../../coach/server/market-calendar/coach-us-equities-review-calendar-service";
import { withWatchlistIndicatorMoomooAccess } from "../../../watchlist/server/moomoo-watchlist-candle-bridge";
import { getMoomooSharedTransport, sharedMoomooFetch } from "../../../platform/server/broker-connections/moomoo-shared-transport";
import { listScannerRecentPressReleases } from "../../../news/server/scanner-recent-press-releases";
import type { ScannerNewsItem, ScannerReadModel } from "../contracts";
import type { MarketDay } from "../sessions";
import { DailyFloatEnricher } from "./float-enrichment";
import { LiveScannerFeed, startLiveScannerFeed } from "./live-feed";
import { ScannerSettingsStore } from "./settings-store";
import { UniverseStore } from "./universe-store";
import { sendScannerUniverseAlert } from "./universe-alert";

const SNAPSHOT_URL = "https://webapi.moomoo.com/api/v1.0/quote/snapshot";
let runtime: Readonly<{ feed: LiveScannerFeed; settings: ScannerSettingsStore }> | null = null;
function root(environment: NodeJS.ProcessEnv): string {
  return join(dirname(resolvePlatformDatabaseConfig({ environment }).databasePath),"scanner-live-v1");
}
function marketDay(date: string): MarketDay {
  const session = new CoachUsEquitiesReviewCalendarService().session(date);
  const early = session.sessionKind === "scheduled_early_close";
  const expectedExtended = early ? "17:00" : "20:00";
  return { date, verified: session.state === "closed" || session.postMarketEndEastern === expectedExtended,
    open: session.state === "open", regularCloseEastern: early ? "13:00" : "16:00", extendedCloseEastern: expectedExtended };
}
function newsFor(symbols: readonly string[], environment: NodeJS.ProcessEnv): ReadonlyMap<string,readonly ScannerNewsItem[]> {
  if (symbols.length === 0) return new Map();
  return withReadonlyPlatformDatabase({ environment },database =>
    new Map(symbols.map(symbol => [symbol,listScannerRecentPressReleases(database,symbol).articles.map(article => ({
      id: article.id, headline: article.headline, createdAt: article.createdAt, url: article.url, typeLabel: article.typeLabel,
    }))])));
}
function configuredRuntime(environment: NodeJS.ProcessEnv): Readonly<{ feed: LiveScannerFeed; settings: ScannerSettingsStore }> {
  if (runtime) return runtime;
  const directory = root(environment);
  const settings = new ScannerSettingsStore(directory);
  const universe = new UniverseStore(directory);
  const feed = new LiveScannerFeed({
    configuration: () => settings.configuration(), marketDay: async date => marketDay(date), universe: async date => {
      const exact = await universe.read(date);
      if (exact) { await sendScannerUniverseAlert({ kind:"recovered",tradingDate:date,sourceDate:date,count:exact.stocks.length,environment }); return exact; }
      const retained = await universe.readLatestOnOrBefore(date);
      if (!retained) { await sendScannerUniverseAlert({ kind:"missing",tradingDate:date,sourceDate:null,count:0,environment }); return null; }
      await sendScannerUniverseAlert({ kind:"missing",tradingDate:date,sourceDate:retained.tradingDate,count:retained.stocks.length,environment });
      return { ...retained,tradingDate:date,sourceTradingDate:retained.tradingDate };
    },
    reserveScannerBudget: count => getMoomooSharedTransport(environment).reserveScanner(count),
    snapshotPass: batches => withWatchlistIndicatorMoomooAccess(async ({ token }) => {
      const results: Array<{ requestedSymbols: readonly string[]; payload: unknown; receivedAt: number }> = [];
      for (const requestedSymbols of batches) {
        const response = await sharedMoomooFetch(SNAPSHOT_URL,{ method: "POST", cache: "no-store", redirect: "error",
          signal: AbortSignal.timeout(15_000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ code_list: requestedSymbols.map(symbol => `US.${symbol}`) }) },
        { priority: "scanner", environment, requireEnabled: true });
        if (!response.ok) throw Error("scanner_snapshot_http_unavailable");
        results.push({ requestedSymbols, payload: await response.json(), receivedAt: Date.now() });
      }
      return results;
    },environment),
    floats: async (date,symbols) => {
      const finnhubToken = environment.FINNHUB_API_KEY?.trim();
      const eodhdToken = environment.EODHD_API_TOKEN?.trim();
      if (!finnhubToken && !eodhdToken) throw Error("scanner_float_not_configured");
      return new DailyFloatEnricher({ finnhubToken,eodhdToken,persistence:settings.floatCache() }).load(date,symbols);
    },
    news: async symbols => newsFor(symbols,environment),
    // These remain false until a bounded live qualification establishes exact provider semantics.
    qualification: () => ({ sessionTimestampVerified: false, sessionCountersVerified: false, afterHoursRegularCloseVerified: false }),
  });
  runtime = Object.freeze({ feed,settings });
  return runtime;
}
export function startConfiguredLiveScannerRuntime(environment: NodeJS.ProcessEnv = process.env): void {
  if (environment.TRADERLINK_LIVE_SCREENERS_ENABLED !== "true" || environment.TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED !== "true") return;
  startLiveScannerFeed(configuredRuntime(environment).feed,environment);
}
export function readLiveScannerRuntime(environment: NodeJS.ProcessEnv = process.env): ScannerReadModel {
  return configuredRuntime(environment).feed.read();
}
export function scannerSettingsStore(environment: NodeJS.ProcessEnv = process.env): ScannerSettingsStore {
  return configuredRuntime(environment).settings;
}
