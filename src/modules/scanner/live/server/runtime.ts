import { readAlpacaScannerHaltSymbols } from "../../alpaca/scanner-halts";
import "server-only";
import {scannerConnection} from "./scanner-connection";
export {scannerConnection} from "./scanner-connection";
import {readScannerConnection,saveScannerConnection,type ScannerProvider} from "./provider-store";
import { eventScannerEnabled } from "../event-timing";
import { AlpacaScannerStream } from "../../alpaca/scanner-stream";
import { coalescedMetadata } from "./coalesced-cache";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "../../../platform/server/database/platform-database-config";
import { withReadonlyPlatformDatabase } from "../../../platform/server/database/open-readonly-platform-database";
import { CoachUsEquitiesReviewCalendarService } from "../../../coach/server/market-calendar/coach-us-equities-review-calendar-service";
import { withWatchlistIndicatorMoomooAccess } from "../../../watchlist/server/moomoo-watchlist-candle-bridge";
import { getMoomooSharedTransport, sharedMoomooFetch } from "../../../platform/server/broker-connections/moomoo-shared-transport";
import { listScannerRecentPressReleases } from "../../../news/server/scanner-recent-press-releases";
import type { ScannerNewsItem, ScannerReadModel } from "../contracts";
import { easternClock, type MarketDay } from "../sessions";
import { SnapshotSessionQualifier } from "../session-qualification";
import { DailyFloatEnricher, ScannerFloatFeed } from "./float-enrichment";
import { LiveScannerFeed, startLiveScannerFeed } from "./live-feed";
import { ScannerSettingsStore } from "./settings-store";
import { UniverseStore } from "./universe-store";
import { ManualTickerStore } from "./manual-ticker-store";
import { NasdaqUniverseRefresher } from "./nasdaq-universe-source";
import { sendScannerUniverseAlert } from "./universe-alert";
import { pacedSnapshotPass, scannerSnapshotSpacing } from "./snapshot-pacing";
import { ScannerAuditRecorder, ScannerAuditStore } from "../audit/server/audit-store";
import { alpacaMarketDataEnabled, requestAlpacaGateway } from "../../alpaca/client";
import { normalizeAlpacaScannerBatch } from "../../alpaca/scanner-snapshots";

const SNAPSHOT_URL = "https://webapi.moomoo.com/api/v1.0/quote/snapshot";
type ScannerRuntime = { provider: "moomoo" | "alpaca"; stop?:()=>void;stopSource?:()=>void;feed: LiveScannerFeed; settings: ScannerSettingsStore; audit: ScannerAuditRecorder };
// Instrumentation and route handlers are separate Next.js bundles. Module-local
// state would give the API a new disabled feed instead of the running worker.
const processState = globalThis as typeof globalThis & {
  __traderlinkLiveScannerRuntimeV1?: { instances: Map<string,ScannerRuntime>; started: WeakSet<LiveScannerFeed>; audits?:Map<string,ScannerAuditRecorder>;providerChanges?:Set<string> };
};
const registry = processState.__traderlinkLiveScannerRuntimeV1 ??= { instances:new Map(),started:new WeakSet(),audits:new Map<string,ScannerAuditRecorder>(),providerChanges:new Set<string>() };
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
const reusableAudits=registry.audits??=new Map<string,ScannerAuditRecorder>();
const providerChanges=registry.providerChanges??=new Set<string>();
function scannerEnvironment(environment:NodeJS.ProcessEnv):NodeJS.ProcessEnv{return {...environment,TRADERLINK_MARKET_DATA_PROVIDER:readScannerConnection(root(environment),environment).provider};}
function configuredRuntime(inputEnvironment: NodeJS.ProcessEnv): ScannerRuntime {
  const environment=scannerEnvironment(inputEnvironment);
  const directory = root(environment);
  const existing = registry.instances.get(directory);
  const provider = alpacaMarketDataEnabled(environment) ? "alpaca" : "moomoo";
  if (existing) {
    if ((existing.provider ?? "moomoo") !== provider) throw Error("scanner_provider_change_requires_restart");
    return existing;
  }
  const settings = new ScannerSettingsStore(directory);
  const universe = new UniverseStore(directory);
  const manualTickers = new ManualTickerStore(join(directory,"manual-tickers.json"));
  const nasdaqUniverse = new NasdaqUniverseRefresher({store:universe});
  const floatPersistence = settings.floatCache();
  const floatEnricher = new DailyFloatEnricher({ finnhubToken:environment.FINNHUB_API_KEY?.trim(),
    eodhdToken:environment.EODHD_API_TOKEN?.trim(),persistence:floatPersistence });
  const floatFeed = new ScannerFloatFeed(floatPersistence,(date,symbols)=>floatEnricher.load(date,symbols));
  const audit = reusableAudits.get(directory)??new ScannerAuditRecorder(new ScannerAuditStore(join(directory,"audit")));
  reusableAudits.set(directory,audit);
  const sessionQualifier = new SnapshotSessionQualifier();
  const eventDriven=eventScannerEnabled(environment);
  const eventStream=eventDriven?new AlpacaScannerStream(environment):undefined;
  let knownExcludedListings: ReadonlySet<string> | undefined;
  const refreshExcludedListings = coalescedMetadata(async () => {
    try {
      const value = await requestAlpacaGateway("scanner-listings", new URLSearchParams(), environment, AbortSignal.timeout(6000)) as { excluded?: unknown };
      if (!Array.isArray(value.excluded) || value.excluded.length > 40_000 || value.excluded.some(symbol => typeof symbol !== "string")) throw Error("scanner_listings_invalid");
      knownExcludedListings = new Set<string>(value.excluded);
    } catch { /* Preserve the last verified exclusions through a provider outage. */ }
    return knownExcludedListings;
  }, 60_000, () => "scanner-listings");
  const excludedListings = async () => {
    const refresh = refreshExcludedListings();
    if (knownExcludedListings) return knownExcludedListings;
    const result = await refresh;
    if (!result) throw Error("scanner_listings_unavailable");
    return result;
  };
  const dependencies:ConstructorParameters<typeof LiveScannerFeed>[0]={
    provider,
    ...(provider === "alpaca" ? { haltedSymbols: readAlpacaScannerHaltSymbols } : {}),
    ...(alpacaMarketDataEnabled(environment) ? { excludedListings } : {}),
    ...(eventStream?{eventDriven:true,subscribeChanges:eventStream.subscribe,inactive:()=>eventStream.stop()}:{}),
    configuration: () => settings.configuration(), manualTickers:()=>manualTickers.list(), marketDay: async date => marketDay(date), universe: async date => {
      try{await nasdaqUniverse.refresh(date);}catch{/* Retain the last validated universe and alert below. */}
      const exact = await universe.read(date);
      if (exact) { await sendScannerUniverseAlert({ kind:"recovered",tradingDate:date,sourceDate:date,count:exact.stocks.length,environment }); return exact; }
      const retained = await universe.readLatestOnOrBefore(date);
      if (!retained) { await sendScannerUniverseAlert({ kind:"missing",tradingDate:date,sourceDate:null,count:0,environment }); return null; }
      await sendScannerUniverseAlert({ kind:"missing",tradingDate:date,sourceDate:retained.tradingDate,count:retained.stocks.length,environment });
      return { ...retained,tradingDate:date,sourceTradingDate:retained.tradingDate };
    },
    reserveScannerBudget: count => alpacaMarketDataEnabled(environment) ? Promise.resolve() : getMoomooSharedTransport(environment).reserveScanner(count),
    ...(alpacaMarketDataEnabled(environment) ? { normalizeBatch: eventDriven?input=>normalizeAlpacaScannerBatch({...input,maxQuoteAgeMs:30_000}):normalizeAlpacaScannerBatch } : {}),
    snapshotPass: async batches => {
      if (alpacaMarketDataEnabled(environment)) {
        const day = marketDay(easternClock(Date.now()).date);
        const results = [];
        if(eventStream){
          eventStream.configure(batches.flat(),day.date,day.regularCloseEastern === "13:00" ? 780:960);
          return batches.map(requestedSymbols=>({requestedSymbols,payload:eventStream.read(requestedSymbols),requestedAt:Date.now(),receivedAt:Date.now()}));
        }
        for (const requestedSymbols of batches) {
          const requestedAt = Date.now();
          try {
            const payload = await requestAlpacaGateway("quotes", new URLSearchParams({ symbols: requestedSymbols.join(","), sessions: "1", regularClose: day.regularCloseEastern === "13:00" ? "780" : "960" }), environment);
            results.push({ requestedSymbols, payload, requestedAt, receivedAt: Date.now() });
          } catch { results.push({ requestedSymbols, payload: null, requestedAt, receivedAt: Date.now() }); }
        }
        return results;
      }
      return withWatchlistIndicatorMoomooAccess(async ({ token }) => {
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
      },environment);
    },
    floats: (date,symbols) => floatFeed.read(date,symbols),
    countries: date => floatFeed.readCountries(date),
    news: async symbols => newsFor(symbols,environment),
    qualification: (session,context) => sessionQualifier.observe(session,context),
    audit,
  };
  const feed = new LiveScannerFeed(eventDriven?{
    ...dependencies,
    universe:coalescedMetadata(dependencies.universe,5000,date=>date),
    floats:coalescedMetadata(dependencies.floats,5000,(date,symbols)=>date+":"+symbols.join(",")),
    countries:dependencies.countries?coalescedMetadata(dependencies.countries,300_000,date=>date):undefined,
    news:coalescedMetadata(dependencies.news,5000,symbols=>symbols.join(",")),
  }:dependencies);
  const runtime:ScannerRuntime={ feed,settings,audit,provider,stopSource:()=>eventStream?.stop() };
  registry.instances.set(directory,runtime);
  return runtime;
}
export function startConfiguredLiveScannerRuntime(inputEnvironment: NodeJS.ProcessEnv = process.env): void {
  const environment=scannerEnvironment(inputEnvironment);
  if (environment.TRADERLINK_LIVE_SCREENERS_ENABLED !== "true" || (!alpacaMarketDataEnabled(environment) && environment.TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED !== "true")) return;
  const current = configuredRuntime(environment);
  if (registry.started.has(current.feed)) return;
  registry.started.add(current.feed);
  try { current.stop=startLiveScannerFeed(current.feed,environment); }
  catch (error) { registry.started.delete(current.feed); throw error; }
}
export function readLiveScannerRuntime(environment: NodeJS.ProcessEnv = process.env): ScannerReadModel {
  return configuredRuntime(environment).feed.read();
}
export function subscribeLiveScannerRuntime(notify:()=>void,environment:NodeJS.ProcessEnv=process.env):()=>void {
  return configuredRuntime(environment).feed.subscribeModels(notify);
}
export function readLiveScannerMarketMovements(environment: NodeJS.ProcessEnv = process.env) {
  return configuredRuntime(environment).feed.movements();
}
export function scannerUniverseStore(environment: NodeJS.ProcessEnv = process.env): UniverseStore {
  return new UniverseStore(root(environment));
}
export function scannerSettingsStore(environment: NodeJS.ProcessEnv = process.env): ScannerSettingsStore {
  return configuredRuntime(environment).settings;
}
export function scannerManualTickerStore(environment:NodeJS.ProcessEnv=process.env):ManualTickerStore{return new ManualTickerStore(join(root(environment),"manual-tickers.json"));}
export function scannerAuditRecorder(environment: NodeJS.ProcessEnv = process.env): ScannerAuditRecorder {
  return configuredRuntime(environment).audit;
}
export function readScannerAuditHealth(environment: NodeJS.ProcessEnv = process.env) {
  const current=configuredRuntime(environment),model=current.feed.read();
  return current.audit.health({expectedActive:model.session!==null});
}

export async function changeScannerConnection(provider:ScannerProvider,revision:number,environment:NodeJS.ProcessEnv=process.env){
  if(!["alpaca","moomoo"].includes(provider)||!Number.isSafeInteger(revision))throw Error("invalid_scanner_connection");
  const directory=root(environment);if(providerChanges.has(directory))throw Error("scanner_connection_busy");
  providerChanges.add(directory);
  const old=registry.instances.get(directory);const wasRunning=old?registry.started.has(old.feed):false;
  try{
    const current=readScannerConnection(directory,environment);if(current.revision!==revision)throw Error("scanner_connection_conflict");
    if(provider==="moomoo"&&environment.TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED!=="true")throw Error("scanner_connection_not_configured");
    if(provider===current.provider)return scannerConnection(environment);
    old?.stop?.();old?.stopSource?.();await old?.feed.whenIdle();
    // A scan already awaiting metadata may have reopened its source before it drained.
    old?.stopSource?.();
    await saveScannerConnection(directory,current,provider);
    if(old){reusableAudits.set(directory,old.audit);registry.started.delete(old.feed);registry.instances.delete(directory);}
    // A provider selector cannot enable a stopped/worker-disabled preview.
    if(wasRunning)startConfiguredLiveScannerRuntime(environment);
    return scannerConnection(environment);
  }catch(error){
    if(wasRunning&&old){registry.started.delete(old.feed);startConfiguredLiveScannerRuntime(environment);}
    throw error;
  }finally{providerChanges.delete(directory);}
}
