import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire, stripTypeScriptTypes } from "node:module";
import { resolve } from "node:path";
import { SourceTextModule, createContext, runInContext } from "node:vm";

const root = process.env.TRADERLINK_INDICATOR_RUNTIME_ROOT ?? "C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability";
const dependencies = createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE ?? new URL("../../package.json", import.meta.url));
const ts = dependencies("typescript");
let payload = { handled: true, status: "warming", candles: null }, status = 200, lastRequest, assertions = 0;
const now = Date.now(), start = Math.floor((now - 300_000) / 300_000) * 300_000;
const bar = { start, end: start + 300_000, open: 3, high: 3.2, low: 2.9, close: 3.1, volume: 100 };
const context = createContext({ URL, Buffer, AbortSignal, Date, process: { env: {} }, fetch: async (url, options) => {
  lastRequest = { url: String(url), ...options }; return Response.json(payload, { status });
} });
const source = await readFile(resolve(root, "src/lib/market-data/platform-watchlist-indicator-loader.ts"), "utf8");
const module = new SourceTextModule(stripTypeScriptTypes(source), { context });
await module.link(name => { throw Error(`Unexpected loader import: ${name}`); }); await module.evaluate();
const equal = (a, b) => { assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b))); assertions++; };
equal(module.namespace.createPlatformWatchlistIndicatorLoader({}), null);
const loader = module.namespace.createPlatformWatchlistIndicatorLoader({ TRADERSLINK_WATCHLIST_INGEST_URL: "https://fixture.invalid/api/live-watchlist/ingest", TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN: "offline-fixture" });
const input = { symbol: "TNON", activatedAt: start - 60_000, asOfTimeMs: now };
equal(await loader(input), { handled: true, provider: null, candles: [] });
equal(lastRequest.url, "https://fixture.invalid/api/live-watchlist/indicators/refresh");
equal(JSON.parse(lastRequest.body), { symbol: "TNON", activatedAt: input.activatedAt });
equal(lastRequest.redirect, "error"); equal(lastRequest.method, "POST");
payload = { handled: true, candles: { provider: "moomoo", dataThrough: bar.end, candles: [bar] } };
equal((await loader(input)).provider, "moomoo"); equal((await loader(input)).candles[0].timestamp, start);
for (const invalid of [{ ...bar, close: 0 }, { ...bar, end: now + 300_000 }, { ...bar, volume: null }]) {
  payload.candles.candles = [invalid]; equal(await loader(input), { handled: true, provider: null, candles: [] });
}
payload.candles.candles = [bar, bar]; equal((await loader(input)).candles, []);
status = 404; equal((await loader(input)).handled, false);

// Execute the actual changed manager methods, with unrelated runtime/AI/publishing dependencies stubbed.
const managerSource = await readFile(resolve(root, "src/lib/monitoring/manual-watchlist-runtime-manager.ts"), "utf8");
const ast = ts.createSourceFile("manager.ts", managerSource, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === "ManualWatchlistRuntimeManager");
const names = new Set(["pullbackReadEnabled", "pullbackReadPollIntervalMs", "pollPullbackReadIntradayCandles", "refreshPullbackReadIntradayCandles"]);
const methods = declaration.members.filter(node => names.has(node.name?.getText(ast))).map(node => node.getText(ast));
assert.equal(methods.length, names.size);
const candle = { timestamp: start, open: 3, high: 3.2, low: 2.9, close: 3.1, volume: 100 };
let legacyRequests = 0, publications = 0, sharedResult = { handled: true, provider: "moomoo", candles: [candle] };
let entry = { symbol: "TNON", active: true, activatedAt: input.activatedAt };
const runtimeContext = createContext({ Date, console, normalizeSymbol: value => value.toUpperCase(), normalizePullbackCandles: value => value,
  hasUsableRecentPullbackCandles: value => value.length > 0, aggregateCandlesToFiveMinute: value => value,
  buildPullbackVolumeRead: () => ({}), delay: async () => {}, PULLBACK_READ_INTRADAY_POLL_INTERVAL_MS: 60_000,
  PULLBACK_READ_5M_LOOKBACK_BARS: 100, PULLBACK_READ_1M_LOOKBACK_BARS: 500 });
runInContext(ts.transpileModule(`class Fixture { ${methods.join("\n")} }; globalThis.fixture = new Fixture();`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, runtimeContext);
const fixture = runtimeContext.fixture;
fixture.options = { indicatorCandleLoader: async () => sharedResult, recentIntradayCandleFetchService: { fetchCandles: async () => {
  legacyRequests++; return { candles: [candle], validationIssues: [] };
} } };
fixture.watchlistStore = { getEntry: () => entry, getActiveEntries: () => [entry] };
fixture.technicalContextProviderBySymbol = new Map(); fixture.technicalContextDataQualityFlagsBySymbol = new Map();
fixture.technicalContextCandleStore = { setHistoricalCandles: (_, candles) => candles };
fixture.currentTechnicalContextPrice = () => 3.1; fixture.rebuildTechnicalContextForSymbol = input => input;
fixture.resolveLiveVolumeRead = () => ({}); fixture.publishWebsiteTechnicalContext = () => publications++;
fixture.publishWebsitePullbackTraderRead = () => {}; fixture.publishWebsiteSnapshotRefresh = () => {};
equal(fixture.pullbackReadPollIntervalMs(), 120_000);
await fixture.refreshPullbackReadIntradayCandles("TNON"); equal(legacyRequests, 0); equal(publications, 1);
equal(fixture.technicalContextProviderBySymbol.get("TNON"), "moomoo");
sharedResult = { handled: true, provider: null, candles: [] };
await fixture.refreshPullbackReadIntradayCandles("TNON"); equal(legacyRequests, 0); equal(publications, 1);
sharedResult = { handled: false, provider: null, candles: [] };
await fixture.refreshPullbackReadIntradayCandles("TNON"); equal(legacyRequests, 1); equal(publications, 2);
equal(fixture.technicalContextProviderBySymbol.get("TNON"), "yahoo");
fixture.options.indicatorCandleLoader = async () => { entry = { ...entry, activatedAt: entry.activatedAt + 1 }; return { handled: true, provider: "moomoo", candles: [candle] }; };
await fixture.refreshPullbackReadIntradayCandles("TNON"); equal(publications, 2);
fixture.options.indicatorCandleLoader = null; equal(fixture.pullbackReadPollIntervalMs(), 60_000);
console.log(`PASS: ${assertions} focused runtime bridge assertions: bounded native-candle parsing, exact endpoint/identity, redirect protection, shared reuse with zero duplicate legacy requests, warming concealment, old-bridge compatibility, provider attribution, obsolete activation exclusion and polling cadence. Actual changed methods, offline stubs only.`);
