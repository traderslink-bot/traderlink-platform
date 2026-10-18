import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, open, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";
registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) return next(`${specifier}.ts`, context);
    throw error;
  }
} });
const { IndicatorRefreshService } = await import("../lib/live-watchlist/indicators/indicator-refresh-service.ts");
const { IndicatorRequestCoordinator } = await import("../lib/live-watchlist/indicators/indicator-request-coordinator.ts");
const demand = await import("../lib/live-watchlist/setups/setup-demand.ts");
const calendar = JSON.parse(await readFile(new URL("../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json", import.meta.url), "utf8"));
const id = "00000000-0000-4000-8000-000000000001", replacement = "00000000-0000-4000-8000-000000000002";
let now = Date.parse("2026-10-09T16:00:05Z"), oauthCalls = 0, sourceCalls = [], classifications = [], accepted = [], retained = null, assertions = 0;
let ticker = { symbol: "BDAI", status: "live", firstPostedAt: now - 100000, indicatorPublicationIdentity: id, indicatorCardVisible: false };
let configuration = { version: 1, revision: 1, tickerOverrides: {}, settings: { enabled: true,
  enabledDetectors: ["vwap-reclaim-hold", "ema9-pullback-bounce", "ema20-pullback-bounce", "higher-low-reversal"],
  sessions: ["premarket", "regular", "postmarket"], showMemberCard: true, notifyForming: false, notifyConfirmed: false } };
const records = (await readFile(new URL("../../data/scanner-verification-candles.jsonl", import.meta.url), "utf8")).trim().split(/\r?\n/u).map(JSON.parse);
const minutes = records.find(record => record.symbol === "BDAI").rows.filter(row => Number.isFinite(row.open) && row.open > 0)
  .map(row => ({ start: row.time_key - 60000, end: row.time_key, open: row.open, high: row.high, low: row.low, close: row.close, volume: row.volume }));
function barsFor(frame) {
  if (frame === "1d") return [];
  const size = { "1m": 1, "5m": 5, "15m": 15 }[frame], result = [];
  for (let index = 0; index + size <= minutes.length; index += size) {
    const bars = minutes.slice(index, index + size);
    if (bars.at(-1).end > now) break;
    if (bars.length !== size || bars.some((bar, i) => i && bar.start !== bars[i - 1].end)) continue;
    result.push({ start: bars[0].start, open: bars[0].open, close: bars.at(-1).close,
      high: Math.max(...bars.map(bar => bar.high)), low: Math.min(...bars.map(bar => bar.low)), volume: bars.reduce((sum, bar) => sum + bar.volume, 0) });
  }
  return result;
}
const context = createContext({ Date: class extends Date { static now() { return now; } }, structuredClone,
  crypto, console, setTimeout, clearTimeout, Map, Set, Promise });
const modules = new Map();
const synthetic = exports => new SyntheticModule(Object.keys(exports), function () {
  for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
}, { context });
const mocks = {
  "server-only": {},
  "node:fs/promises": Object.fromEntries(Object.entries({ mkdir, open, rename, unlink }).map(([name, fn]) => [name, async (...args) => {
    try { return await fn(...args); } catch (error) { if (error.code !== "ENOENT") console.log("Isolated ledger operation failed", name, error.code ?? error.name); throw error; }
  }])),
  "node:path": { dirname, join },
  "node:crypto": { randomUUID },
  "@/src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json": { default: calendar },
  "@/src/lib/live-watchlist/indicators/indicator-refresh-service": { IndicatorRefreshService: class extends IndicatorRefreshService {
    constructor(options) { super({ ...options, now: () => now }); }
  } },
  "@/src/lib/live-watchlist/indicators/indicator-request-coordinator": { IndicatorRequestCoordinator },
  "@/src/lib/live-watchlist/indicators/indicator-history-provider": { fetchIndicatorHistory: async input => {
    assert.equal(typeof input.isCurrent, "function");
    if (!await input.isCurrent()) return { provider: input.provider, adjustment: "moomoo-forward", bars: [], pages: 0, transportIds: [], outcome: "permission", nextEnd: null };
    sourceCalls.push({ provider: input.provider, frame: input.request.timeframe });
    classifications.push(input.additionalDemand);
    const bars = barsFor(input.request.timeframe);
    return { provider: input.provider, adjustment: input.provider === "moomoo" ? "moomoo-forward" : "yahoo-chart-native", bars, pages: 1, transportIds: [], outcome: bars.length ? "complete" : "no_data", nextEnd: null };
  } },
  "@/src/lib/live-watchlist/indicators/indicator-sessions": await import("../lib/live-watchlist/indicators/indicator-sessions.ts"),
  "@/src/lib/live-watchlist/setups/setup-demand": demand,
  "@/src/lib/live-watchlist/live-watchlist-store": { LiveWatchlistStore: class {
    async getSymbol() { return ticker; } async listSymbols() { return { symbols: ticker ? [ticker] : [] }; }
  } },
  "./setup-store": { watchlistSetupStore: () => ({ configuration: async () => configuration }) },
  "../setups/setup-admission-runtime": { watchlistMoomooAdmission: () => ({ dispatch: async input =>
    input.isCurrent && !await input.isCurrent() ? { allowed: false, retryAt: 0, cancelled: true } : { allowed: true, value: input.start() },
    rateLimited: async () => {} }) },
  "../moomoo-watchlist-candle-bridge": { withWatchlistIndicatorMoomooAccess: async callback => {
    oauthCalls++; return callback({ token: "offline-fixture-not-a-real-token", requestScope: "offline-fixture-scope" });
  } },
  "./indicator-audit-runtime": { watchlistIndicatorAuditStore: () => ({ enqueue() {}, flush: async () => {},
    reconcileRestart: async () => {}, latestCalculation: async () => retained,
    saveCalculation: async evidence => { retained = evidence; return true; } }) },
  "../setups/setup-runtime": { recordAcceptedWatchlistSetupCalculation: async evidence => { accepted.push(evidence); },
    ensureWatchlistSetupsFromSavedCalculation: async () => {} },
};
const sourceFiles = {
  refresh: "../modules/watchlist/server/indicators/indicator-refresh-runtime.ts",
  shared: "../modules/watchlist/server/setups/setup-shared-feed-runtime.ts",
  ledger: "../modules/watchlist/server/setups/setup-admission-runtime.ts",
};
async function load(name) {
  if (modules.has(name)) return modules.get(name);
  const source = await readFile(new URL(sourceFiles[name], import.meta.url), "utf8");
  const module = new SourceTextModule(stripTypeScriptTypes(source), { context,
    importModuleDynamically: async specifier => {
      const found = specifier === "../setups/setup-shared-feed-runtime" ? await load("shared") : synthetic(mocks[specifier]);
      if (found.status === "unlinked") await found.link(linker);
      if (found.status === "linked") await found.evaluate();
      return found;
    } });
  modules.set(name, module);
  return module;
}
async function linker(specifier) {
  if (specifier === "../indicators/indicator-refresh-runtime") return load("refresh");
  assert.ok(mocks[specifier], specifier);
  return synthetic(mocks[specifier]);
}
const shared = await load("shared"); await shared.link(linker); await shared.evaluate();
const runtime = modules.get("refresh").namespace;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
equal(runtime.readCachedWatchlistIndicators("BDAI", id), null); equal(sourceCalls.length, 0);
await Promise.all([shared.namespace.refreshPublishedWatchlistMarketData("BDAI", id), shared.namespace.runWatchlistSetupFeedOnce(now)]);
equal(sourceCalls, [{ provider: "moomoo", frame: "1m" }, { provider: "moomoo", frame: "5m" }]);
equal(oauthCalls, 1); equal(accepted.length, 1); equal(accepted[0].activationId, id);
equal(classifications, [true, true]);
equal(runtime.readSharedWatchlistIndicatorCandles("BDAI", id).provider, "moomoo");
const calls = sourceCalls.length;
await shared.namespace.refreshPublishedWatchlistMarketData("BDAI", id);
equal(sourceCalls.length, calls); equal(oauthCalls, 1);
configuration = { ...configuration, settings: { ...configuration.settings, enabled: false } };
equal(await shared.namespace.refreshPublishedWatchlistMarketData("BDAI", id), null);
await shared.namespace.runWatchlistSetupFeedOnce(now); equal(sourceCalls.length, calls);
ticker = { ...ticker, indicatorCardVisible: true };
await shared.namespace.refreshPublishedWatchlistMarketData("BDAI", id);
equal(sourceCalls.filter(call => call.frame === "1m").length, 1); equal(sourceCalls.filter(call => call.frame === "5m").length, 1);
equal(sourceCalls.some(call => call.frame === "15m"), true);
equal(classifications.slice(2).every(value => value === false), true);
ticker = { ...ticker, indicatorPublicationIdentity: replacement };
const before = sourceCalls.length;
equal(await shared.namespace.refreshPublishedWatchlistMarketData("BDAI", id), null); equal(sourceCalls.length, before);
ticker = null;
equal(await shared.namespace.refreshPublishedWatchlistMarketData("BDAI", replacement), null); equal(sourceCalls.length, before);
const fixtureRoot = join(process.cwd(), "data", "watchlist-setup-validation");
await mkdir(fixtureRoot, { recursive: true });
const isolatedDirectory = await mkdtemp(join(fixtureRoot, "ledger-sandbox-"));
mocks["@/src/modules/platform/server/database/platform-database-config"] = { resolvePlatformDatabaseConfig: () => ({ databasePath: join(isolatedDirectory, "unused-test.sqlite") }) };
mocks["@/src/lib/live-watchlist/setups/setup-admission"] = await import("../lib/live-watchlist/setups/setup-admission.ts");
const ledgerModule = await load("ledger"); await ledgerModule.link(linker); await ledgerModule.evaluate();
const gate = ledgerModule.namespace.watchlistMoomooAdmission();
equal((await gate.acquire()).allowed, false); // Lost/unavailable history gets conservative recovery.
if (gate.status().storageUnavailable) console.log("Isolated ledger storage status", gate.status());
const persisted = JSON.parse(await readFile(join(isolatedDirectory, "watchlist-moomoo-admission-v1.json"), "utf8"));
equal(persisted.recoveryUntil, now + 60000); equal(persisted.retryAt, 0); equal(persisted.starts, []);
now += 60000; equal((await gate.acquire()).allowed, true);
await gate.rateLimited(30000);
delete context.__watchlistMoomooAdmission;
const restoredGate = ledgerModule.namespace.watchlistMoomooAdmission();
equal((await restoredGate.acquire()).allowed, false);
equal(restoredGate.status().retryAt, now + 30000);
console.log(`PASS: ${assertions} actual shared-feed/runtime checks, including an isolated temporary ledger write/reload. Recorded bars with mocked account/HTTP access. No network, app storage writes, workers started or notifications.`);
