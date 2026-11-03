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
import { SnapshotSessionQualifier } from "../session-qualification";
import { DailyFloatEnricher, ScannerFloatFeed } from "./float-enrichment";
import { LiveScannerFeed, startLiveScannerFeed } from "./live-feed";
import { ScannerSettingsStore } from "./settings-store";
import { UniverseStore } from "./universe-store";
import { sendScannerUniverseAlert } from "./universe-alert";
import { pacedSnapshotPass, scannerSnapshotSpacing } from "./snapshot-pacing";
import { ScannerAuditRecorder, ScannerAuditStore } from "../audit/server/audit-store";

const SNAPSHOT_URL = "https://webapi.moomoo.com/api/v1.0/quote/snapshot";
type ScannerRuntime = Readonly<{ feed: LiveScannerFeed; settings: ScannerSettingsStore; audit: ScannerAuditRecorder }>;
// Instrumentation and route handlers are separate Next.js bundles. Module-local
// state would give the API a new disabled feed instead of the running worker.
const processState = globalThis as typeof globalThis & {
  __traderlinkLiveScannerRuntimeV1?: { instances: Map<string,ScannerRuntime>; started: WeakSet<LiveScannerFeed> };
};
const registry = processState.__traderlinkLiveScannerRuntimeV1 ??= { instances:new Map(),started:new WeakSet() };
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
function configuredRuntime(environment: NodeJS.ProcessEnv): ScannerRuntime {
  const directory = root(environment);
  const existing = registry.instances.get(directory);
  if (existing) return existing;
  const settings = new ScannerSettingsStore(directory);
  const universe = new UniverseStore(directory);
  const floatPersistence = settings.floatCache();
  const floatEnricher = new DailyFloatEnricher({ finnhubToken:environment.FINNHUB_API_KEY?.trim(),
    eodhdToken:environment.EODHD_API_TOKEN?.trim(),persistence:floatPersistence });
  const floatFeed = new ScannerFloatFeed(floatPersistence,(date,symbols)=>floatEnricher.load(date,symbols));
  const audit = new ScannerAuditRecorder(new ScannerAuditStore(join(directory,"audit")));
  const sessionQualifier = new SnapshotSessionQualifier();
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
      return pacedSnapshotPass(batches,async (requestedSymbols,requestedAt) => {
        try {
          const response = await sharedMoomooFetch(SNAPSHOT_URL,{ method: "POST", cache: "no-store", redirect: "error",
            signal: AbortSignal.timeout(15_000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ code_list: requestedSymbols.map(symbol => `US.${symbol}`) }) },
          { priority: "scanner", environment, requireEnabled: true });
          if (!response.ok) throw Error("scanner_snapshot_http_unavailable");
          return { requestedSymbols, payload: await response.json(), receivedAt: Date.now(),requestedAt };
        } catch {
          // Return a batch-scoped invalid envelope so later batches still run.
          // LiveScannerFeed records this batch as unavailable without erasing
          // successful responses from the same pass.
          return { requestedSymbols, payload:null, receivedAt:Date.now(),requestedAt };
        }
      },{spacingMs:scannerSnapshotSpacing(environment)});
    },environment),
    floats: (date,symbols) => floatFeed.read(date,symbols),
    news: async symbols => newsFor(symbols,environment),
    qualification: (session,context) => sessionQualifier.observe(session,context),
    audit,
  });
  const runtime = Object.freeze({ feed,settings,audit });
  registry.instances.set(directory,runtime);
  return runtime;
}
export function startConfiguredLiveScannerRuntime(environment: NodeJS.ProcessEnv = process.env): void {
  if (environment.TRADERLINK_LIVE_SCREENERS_ENABLED !== "true" || environment.TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED !== "true") return;
  const current = configuredRuntime(environment);
  if (registry.started.has(current.feed)) return;
  registry.started.add(current.feed);
  try { startLiveScannerFeed(current.feed,environment); }
  catch (error) { registry.started.delete(current.feed); throw error; }
}
export function readLiveScannerRuntime(environment: NodeJS.ProcessEnv = process.env): ScannerReadModel {
  return configuredRuntime(environment).feed.read();
}
export function scannerSettingsStore(environment: NodeJS.ProcessEnv = process.env): ScannerSettingsStore {
  return configuredRuntime(environment).settings;
}
export function scannerAuditRecorder(environment: NodeJS.ProcessEnv = process.env): ScannerAuditRecorder {
  return configuredRuntime(environment).audit;
}
export function readScannerAuditHealth(environment: NodeJS.ProcessEnv = process.env) {
  const current=configuredRuntime(environment),model=current.feed.read();
  return current.audit.health({expectedActive:model.session!==null});
}
