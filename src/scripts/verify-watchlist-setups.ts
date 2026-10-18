import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import calendar from "../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json";
import { evaluateWatchlistSetups } from "../lib/live-watchlist/setups/setup-engine";
import { SetupResultsAccumulator } from "../lib/live-watchlist/setups/setup-results";
import { createIndicatorCheckpoint } from "../lib/live-watchlist/indicators/indicator-engine";
import type { IndicatorCandle, IndicatorTimeframe } from "../lib/live-watchlist/indicators/indicator-engine";
import { normalizeIndicatorSessions, indicatorMarketDate, indicatorTradingDay } from "../lib/live-watchlist/indicators/indicator-sessions";
import type { IndicatorCalendar } from "../lib/live-watchlist/indicators/indicator-sessions";
import { parseMoomooIndicatorPage } from "../lib/live-watchlist/indicators/indicator-history-provider";
import { IndicatorRefreshService } from "../lib/live-watchlist/indicators/indicator-refresh-service";
import { IndicatorRequestCoordinator } from "../lib/live-watchlist/indicators/indicator-request-coordinator";
import type { IndicatorCalculationEvidence } from "../modules/watchlist/server/indicators/indicator-audit-store";
import { INITIAL_WATCHLIST_SETUP_KINDS } from "../lib/live-watchlist/setups/setup-contracts";
import type { SetupConfiguration } from "../lib/live-watchlist/setups/setup-contracts";
import type { WatchlistSetupInput, SetupFrameInput } from "../lib/live-watchlist/setups/setup-input";
import { watchlistMarketDataDemand, nextWatchlistSetupFeedAt } from "../lib/live-watchlist/setups/setup-demand";
import { WatchlistMoomooAdmission } from "../lib/live-watchlist/setups/setup-admission";
import type { SetupAdmissionLedger } from "../lib/live-watchlist/setups/setup-admission";

async function main() {
// This executable imports pure modules only. It cannot initialize hosted workers,
// access an account/database, refresh live data, change settings or send a post.
globalThis.fetch = async () => { throw Error("Network forbidden in recorded setup verification"); };
const minute = 60_000, identity = "00000000-0000-4000-8000-000000000001";
const config: SetupConfiguration = { version: 1, revision: 1, tickerOverrides: {}, settings: { enabled: true,
  enabledDetectors: [...INITIAL_WATCHLIST_SETUP_KINDS], sessions: ["premarket", "regular", "postmarket"],
  showMemberCard: true, notifyForming: false, notifyConfirmed: false } };
const cal = calendar as IndicatorCalendar;
let assertions = 0;
const check = (condition: unknown, label: string) => { assert.ok(condition, label); assertions++; };
type Dataset = { symbol: string; source: string; sha256: string; provenance: string; one: IndicatorCandle[]; five: IndicatorCandle[] };
const datasets: Dataset[] = [];
const sha = (bytes: string) => createHash("sha256").update(bytes).digest("hex");
function normalize(bars: any[], timeframe: "1m" | "5m", through: number) {
  return [...normalizeIndicatorSessions({ bars, timeframe, calendar: cal, completedThrough: through }).candles];
}
function aggregate(candles: readonly IndicatorCandle[], size: number): IndicatorCandle[] {
  const buckets = new Map<string, IndicatorCandle[]>();
  for (const bar of candles) {
    const start = Math.floor(bar.start / (size * minute)) * size * minute, key = `${bar.sessionKey}:${start}`;
    const values = buckets.get(key) ?? []; values.push(bar); buckets.set(key, values);
  }
  return [...buckets.values()].flatMap(bars => {
    if (bars.length !== size || bars[0].start % (size * minute) !== 0
      || bars.some((bar, index) => index > 0 && bars[index - 1].end !== bar.start)) return [];
    return [{ ...bars[0], end: bars.at(-1)!.end, high: Math.max(...bars.map(bar => bar.high)),
      low: Math.min(...bars.map(bar => bar.low)), close: bars.at(-1)!.close,
      volume: bars.some(bar => bar.volume === null) ? null : bars.reduce((total, bar) => total + bar.volume!, 0) }];
  });
}
const scannerSource = "data/scanner-verification-candles.jsonl";
for (const line of readFileSync(scannerSource, "utf8").trim().split(/\r?\n/u)) {
  const record = JSON.parse(line);
  if (!record.symbol || !Array.isArray(record.rows)) continue; // Account metadata is never copied.
  const rows = record.rows.filter((row: any) => [row.open, row.high, row.low, row.close].every(value => Number.isFinite(value) && value > 0));
  const through = Math.max(...rows.map((row: any) => row.time_key));
  const parsed = parseMoomooIndicatorPage({ ret_code: record.providerCode, data: { kline_list: rows, volume_precision: 0 }, pagination: { has_more: false } }, "1m", through);
  check(record.http === 200 && parsed.ok, `${record.symbol}: recorded Moomoo page accepted`);
  if (!parsed.ok) continue;
  const one = normalize([...parsed.data.bars], "1m", through);
  datasets.push({ symbol: record.symbol, source: scannerSource, sha256: sha(line),
    provenance: "Recorded Moomoo WebAPI 1m end labels; 5m derived only from five complete consecutive recorded minutes. Not broker-native 5m validation.",
    one, five: aggregate(one, 5) });
}
for (const symbol of ["WETO", "DRMA", "YYAI", "SHFS", "RCT", "TCRT"]) {
  const source = `data/simple-structure-v2/1792120718589.jsonl.${symbol}.packet.json`;
  if (!existsSync(source)) continue;
  const raw = readFileSync(source, "utf8"), packet = JSON.parse(raw);
  const user = packet.payload.body.input.find((message: any) => message.role === "user");
  const market = JSON.parse(user.content[0].text).marketPacket, action = market.priceAction;
  const one = action.oneMinuteEvidence.recentOneMinuteBars, five = action.recentFiveMinuteBars;
  const bars = (items: any[]) => items.map(item => ({ start: item.timestamp, open: item.open, high: item.high,
    low: item.low, close: item.close, volume: item.volumeDataQuality === "reported" ? item.volume : null }));
  const through = Math.max(...one.map((bar: any) => bar.timestamp + minute));
  datasets.push({ symbol, source, sha256: sha(raw),
    provenance: "Recorded analysis packet: Moomoo current-session plus completed-session EODHD context. Adjustment/provenance per individual older bar not established; price-sequence replay only.",
    one: normalize(bars(one), "1m", through), five: normalize(bars(five), "5m", through) });
}
function inputFor(dataset: Dataset, through = dataset.one.at(-1)!.end): WatchlistSetupInput {
  const frame = (name: "1m" | "5m", candles: readonly IndicatorCandle[]): SetupFrameInput => {
    const key = `recorded:${dataset.symbol}:${name}:${dataset.sha256}`;
    return { provider: "moomoo", adjustment: "recorded-adjustment-unverified", seriesKey: key,
      seed: createIndicatorCheckpoint(name, key), candles: candles.filter(bar => bar.end <= through) };
  };
  return { symbol: dataset.symbol, publicationIdentity: identity, revision: `${dataset.sha256}:${through}`, receivedAt: through + 5000,
    calendar: cal, oneMinute: frame("1m", dataset.one), fiveMinute: frame("5m", dataset.five) };
}
function independentEma(candles: readonly IndicatorCandle[], period: number, through: number): number | null {
  const closes = candles.filter(bar => bar.end <= through).map(bar => bar.close);
  if (closes.length < period) return null;
  let value = closes.slice(0, period).reduce((sum, close) => sum + close, 0) / period;
  for (const close of closes.slice(period)) value += (close - value) * 2 / (period + 1);
  return value;
}
const results: any[] = [];
const witnesses = new Map<string, { dataset: string; at: number; instance: unknown }>();
for (const dataset of datasets) {
  const input = inputFor(dataset), untouched = JSON.stringify(input), result = evaluateWatchlistSetups(input, config.settings);
  check(JSON.stringify(input) === untouched, "Detection leaves accepted shared input unchanged");
  const statistics = new SetupResultsAccumulator();
  const saved = { version: 1, configurationRevision: 1, input, evaluation: result };
  statistics.add(saved); statistics.add(saved);
  const measured = statistics.results({ minutes: 30, page: 1 }, input.receivedAt);
  check(measured.total === result.instances.length, `${dataset.symbol}: retained duplicate snapshots count each occurrence once`);
  for (const summary of measured.summary) {
    for (const stage of ["forming", "confirmed", "failed", "expired"] as const) {
      const expected = new Set(result.transitions.filter(event => event.state === stage && result.instances.some(instance => instance.id === event.instanceId && instance.kind === summary.kind)).map(event => event.instanceId)).size;
      check(summary[stage] === expected, `${dataset.symbol}: ${summary.kind} ${stage} stats reconcile to recorded transitions`);
    }
  }
  const counts = Object.fromEntries(INITIAL_WATCHLIST_SETUP_KINDS.map(kind => [kind, {
    forming: result.transitions.filter(event => event.state === "forming" && event.instanceId.startsWith(kind)).length,
    confirmed: result.transitions.filter(event => event.state === "confirmed" && event.instanceId.startsWith(kind)).length,
  }]));
  for (const instance of result.instances) {
    const events = result.transitions.filter(event => event.instanceId === instance.id), confirmed = events.find(event => event.state === "confirmed");
    check(events.every(event => event.candleCompletedAt <= input.receivedAt && event.knownAt >= event.candleCompletedAt), "No future/backdated event");
    const low = instance.references.find(reference => reference.role === "test-low")!;
    check(dataset.one.some(bar => bar.start === low.observation.observedAt && bar.low === low.observation.value), "Defended low is an actual recorded price");
    if (!confirmed) continue;
    const trigger = instance.references.find(reference => reference.role === "trigger")!;
    check(Number.isFinite(trigger?.observation.value), "Confirmed event has a finite trigger");
    if (instance.kind.startsWith("ema")) {
      check(confirmed.candleCompletedAt > trigger.observation.observedAt, "EMA trigger is on a later candle");
      check(dataset.one.some(bar => bar.end === trigger.observation.observedAt && bar.high === trigger.observation.value), "EMA response-high trigger matches its actual candle");
      for (const reference of instance.references.filter(value => ["ema9", "ema20", "test-average"].includes(value.role))) {
        const expected = independentEma(dataset.five, instance.kind.startsWith("ema9") ? 9 : 20, reference.observation.observedAt);
        check(expected !== null && Math.abs(expected - reference.observation.value) < 1e-9, "EMA observations match an independent chronological recurrence");
      }
    }
    if (instance.kind === "vwap-reclaim-hold") {
      check(confirmed.candleCompletedAt > events.find(event => event.state === "reclaimed")!.candleCompletedAt, "VWAP hold follows reclaim");
      const anchor = instance.references.find(value => value.role === "vwap")!;
      const day = indicatorTradingDay(cal, indicatorMarketDate(confirmed.candleCompletedAt - 1))!;
      const start = anchor.vwapAnchor === "regular-session" ? day.regularOpen : day.preOpen;
      const bars = dataset.one.filter(bar => bar.start >= start && bar.end <= anchor.observation.observedAt);
      const shares = bars.reduce((sum, bar) => sum + bar.volume!, 0);
      const independentlyWeighted = bars.reduce((sum, bar) => sum + (bar.high + bar.low + bar.close) / 3 * bar.volume!, 0) / shares;
      check(shares > 0 && Math.abs(independentlyWeighted - anchor.observation.value) < 1e-9, "VWAP matches independently weighted recorded shares on the named anchor");
    }
    if (!witnesses.has(instance.kind)) witnesses.set(instance.kind, { dataset: dataset.symbol, at: confirmed.candleCompletedAt, instance });
  }
  const missingVolume: WatchlistSetupInput = { ...input,
    oneMinute: { ...input.oneMinute!, candles: input.oneMinute!.candles.map(bar => ({ ...bar, volume: null })) } };
  const noVolume = evaluateWatchlistSetups(missingVolume, config.settings);
  const nonVwap = (value: typeof result) => value.transitions.filter(event => !event.instanceId.startsWith("vwap")).map(event => `${event.instanceId}:${event.state}:${event.candleCompletedAt}`);
  check(JSON.stringify(nonVwap(result)) === JSON.stringify(nonVwap(noVolume)), "Missing volume cannot erase independent price events");
  const badFive: WatchlistSetupInput = { ...input,
    fiveMinute: { ...input.fiveMinute!, candles: input.fiveMinute!.candles.map((bar, index) => index === 0 ? { ...bar, low: -1 } : bar) } };
  const independent = evaluateWatchlistSetups(badFive, config.settings);
  const higherLowEvents = (value: typeof result) => value.transitions.filter(event => event.instanceId.startsWith("higher-low"));
  check(JSON.stringify(higherLowEvents(result)) === JSON.stringify(higherLowEvents(independent)), "Bad 5m cannot erase independent 1m higher-low events");
  const firstConfirm = result.transitions.find(event => event.state === "confirmed");
  if (firstConfirm) {
    const gapInput = { ...input, revision: `${input.revision}:gap`, oneMinute: { ...input.oneMinute!,
      candles: input.oneMinute!.candles.filter(bar => bar.end !== firstConfirm.candleCompletedAt) } };
    const gapResult = evaluateWatchlistSetups(gapInput, config.settings);
    check(!gapResult.transitions.some(event => event.instanceId === firstConfirm.instanceId && event.state === "confirmed"), "A missing required confirmation cannot be supplied by a later candle");
  }
  // Bounded prefix replay: no complete-day look-ahead, and exact witness boundaries.
  const cutoffs = new Set<number>([...Array.from({ length: 8 }, (_, index) => dataset.one[Math.floor((dataset.one.length - 1) * (index + 1) / 8)].end),
    ...[...witnesses.values()].filter(value => value.dataset === dataset.symbol).flatMap(value => [value.at - minute, value.at])]);
  for (const through of cutoffs) {
    const prefix = inputFor(dataset, through), replay = evaluateWatchlistSetups(prefix, config.settings);
    check(replay.transitions.every(event => event.candleCompletedAt <= through), "Prefix contains no future event");
    const expected = result.transitions.filter(event => event.candleCompletedAt <= through).map(event => `${event.instanceId}:${event.state}:${event.candleCompletedAt}`);
    const actual = replay.transitions.map(event => `${event.instanceId}:${event.state}:${event.candleCompletedAt}`);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) console.log("Prefix mismatch", { symbol: dataset.symbol, through,
      missing: expected.filter(value => !actual.includes(value)).slice(0, 3), extra: actual.filter(value => !expected.includes(value)).slice(0, 3) });
    check(JSON.stringify(actual) === JSON.stringify(expected), `${dataset.symbol}: prefix events match chronological full replay`);
  }
  results.push({ symbol: dataset.symbol, source: dataset.source, sourceSha256: dataset.sha256, provenance: dataset.provenance,
    oneMinuteBars: dataset.one.length, fiveMinuteBars: dataset.five.length, first: dataset.one[0]?.start, through: input.receivedAt - 5000,
    counts, diagnostics: result.diagnostics, dependencies: result.snapshot.dependencies, prefixChecks: cutoffs.size });
  console.log(`${dataset.symbol}: ${JSON.stringify(counts)}`);
}

// Shared-demand and actual acquisition-path verification using recorded pages,
// an injected clock and callback. No HTTP, OAuth, application storage or worker.
const full = datasets.find(dataset => dataset.one.length > 500)!;
let now = full.one[480].end + 5000;
const calls: { frame: string; provider: string }[] = [], evidence: IndicatorCalculationEvidence[] = [];
const service = new IndicatorRefreshService({ calendar: cal, now: () => now, id: randomUUID, record: () => {},
  saveCalculation: async value => { evidence.push(value); return true; },
  load: async request => {
    calls.push({ frame: request.request.timeframe, provider: request.provider });
    let candles = request.request.timeframe === "1m" ? full.one : request.request.timeframe === "5m" ? full.five
      : request.request.timeframe === "15m" ? aggregate(full.one, 15) : [];
    const bars = candles.filter(bar => bar.end <= now).map(({ end: _end, sessionKey: _key, ...bar }) => bar);
    return { provider: request.provider, adjustment: request.provider === "moomoo" ? "moomoo-forward" : "yahoo-chart-native",
      bars, pages: 1, transportIds: [randomUUID()], outcome: bars.length ? "complete" : "no_data", nextEnd: null };
  } });
const setupDemand = { frames: ["1m", "5m"] as const, minimumIntervalMs: 60_000, reuseCompletedFrames: true };
const allDemand = { ...setupDemand, frames: ["1m", "5m", "15m", "1d"] as const };
await Promise.all([service.refresh(full.symbol, identity, setupDemand), service.refresh(full.symbol, identity, allDemand)]);
check(calls.filter(call => call.frame === "1m").length === 1 && calls.filter(call => call.frame === "5m").length === 1, "Concurrent setup/Indicators consumers share 1m/5m acquisition");
const before = calls.length;
await service.refresh(full.symbol, identity, allDemand);
check(calls.length === before, "Repeated current-minute refresh uses cache");
now += minute;
await service.refresh(full.symbol, identity, setupDemand);
check(calls.filter(call => call.frame === "1m").length === 2, "New completed minute can request a genuinely new window");
check(calls.filter(call => call.frame === "5m").length === 1, "Unchanged completed 5m frame is reused");
const beforeRestart = calls.length;
const restoredService = new IndicatorRefreshService({ calendar: cal, now: () => now, id: randomUUID, record: () => {},
  saveCalculation: async () => true, load: async () => { throw Error("Restored fresh data must not fetch"); } });
check(restoredService.restore(full.symbol, identity, evidence.at(-1)!), "Accepted recorded calculation restores after restart");
await restoredService.refresh(full.symbol, identity, setupDemand);
check(calls.length === beforeRestart, "Restored fresh current frame creates no duplicate acquisition");
now += 40000;
await service.refresh(full.symbol, identity, setupDemand);
check(calls.length === beforeRestart, "Late publisher request reuses the already completed minute");
now += 20000;
await service.refresh(full.symbol, identity, setupDemand);
check(calls.filter(call => call.frame === "1m").length === 3 && calls.filter(call => call.frame === "5m").length === 1,
  "The next minute-close is not delayed by a late publisher poll twenty seconds earlier");
check(nextWatchlistSetupFeedAt(120001) === 125000 && nextWatchlistSetupFeedAt(125001) === 185000, "Minute-close offset does not skip the first eligible five-second boundary");
const ticker = { status: "live", firstPostedAt: now - minute, indicatorPublicationIdentity: identity, indicatorCardVisible: false };
check(watchlistMarketDataDemand(ticker, config, "regular")?.frames.join() === "1m,5m", "Setups keep 1m/5m demand when Indicators hidden");
check(watchlistMarketDataDemand(ticker, { ...config, settings: { ...config.settings, enabled: false } }, "regular") === null, "Both consumers disabled create no demand");
check(watchlistMarketDataDemand({ ...ticker, indicatorPublicationIdentity: "OLD:123" }, config, "regular") === null, "Old activation cannot request new data");
check(watchlistMarketDataDemand({ ...ticker, watchlistGroup: "private" }, config, "regular") === null, "Private-list movement cancels public setup feed demand");
check(watchlistMarketDataDemand({ ...ticker, indicatorCardVisible: true }, { ...config, settings: { ...config.settings, enabled: false } }, "regular")?.minimumIntervalMs === 120000, "Disabling setups preserves Indicators cadence");

let clock = 100_000, persisted: SetupAdmissionLedger = { version: 1, starts: [], retryAt: 0, lastSeenAt: clock };
const gateOptions = { now: () => clock, sleep: async (ms: number) => { clock += ms; }, load: async () => structuredClone(persisted),
  save: async (value: SetupAdmissionLedger) => { persisted = structuredClone(value); } };
const gate = new WatchlistMoomooAdmission(gateOptions), starts: number[] = [];
for (let index = 0; index < 80; index++) { check((await gate.acquire()).allowed, "Budget admits eligible slot"); starts.push(clock); }
check(starts.slice(1).every((value, index) => value - starts[index] >= 750), "Actual starts are spaced >=750ms");
check(!(await gate.acquire()).allowed, "81st attempt is deferred inside rolling minute");
await gate.rateLimited(120000);
const restored = new WatchlistMoomooAdmission(gateOptions);
check(!(await restored.acquire()).allowed, "Restart retains provider cooldown");
clock = persisted.retryAt;
check((await restored.acquire()).allowed, "Cooldown expires without resetting the limiter");
let transportCalls = 0;
const coordinator = new IndicatorRequestCoordinator({ now: () => clock, sleep: async ms => { clock += ms; }, admission: restored });
const request = { provider: "moomoo" as const, scope: "offline-shared-scope", requestKey: "one-normalized-page", consumer: "a", maxAttempts: 1 as const,
  execute: async () => { transportCalls++; return { ok: true as const, data: { candles: 3 }, usable: true, requestAccepted: true as const }; } };
await Promise.all([coordinator.request(request), coordinator.request({ ...request, consumer: "b" })]);
check(transportCalls === 1, "Transport coalesces the identical outbound page across consumers");
let permitted = true, cancelledCalls = 0;
const cancelling = new IndicatorRequestCoordinator({ admission: new WatchlistMoomooAdmission({ ...gateOptions,
  save: async ledger => { persisted = structuredClone(ledger); permitted = false; } }) });
const cancelled = await cancelling.request({ ...request, requestKey: "removed-publication", isCurrent: async () => permitted,
  execute: async () => { cancelledCalls++; return { ok: true, data: null, usable: false, requestAccepted: true }; } });
check(cancelledCalls === 0 && cancelled.transportIds.length === 0, "Queued removal/disable is rechecked after admission without a fictitious HTTP request");
await coordinator.request({ ...request, requestKey: "recorded-429-simulation", execute: async () => ({ ok: false, reason: "rate_limited", requestAccepted: false, retryAfterMs: 90000, httpStatus: 429 }) });
const differentScope = await coordinator.request({ ...request, scope: "different-connection-same-egress", requestKey: "after-429" });
check(differentScope.kind === "deferred", "Actual coordinator rate-limit result cools down other connection scopes too");
clock -= 120000;
check(!(await restored.acquire()).allowed, "Clock rollback cannot reset prior starts/cooldown");
const unavailableStorage = new WatchlistMoomooAdmission({ ...gateOptions, save: async () => { throw Error("offline storage failure injection"); } });
check(!(await unavailableStorage.acquire()).allowed && unavailableStorage.status().storageUnavailable, "Failed durable write cannot admit an unrecorded request");

const outputDirectory = resolve("data/watchlist-setup-validation", `${Date.now()}-${randomUUID().slice(0, 8)}`);
mkdirSync(outputDirectory, { recursive: true });
const report = { version: 1, createdAt: new Date().toISOString(), rulesVersion: "watchlist-setups-a-v1", assertions,
  codeIdentity: Object.fromEntries([
    "src/lib/live-watchlist/setups/setup-engine.ts", "src/lib/live-watchlist/setups/setup-demand.ts", "src/lib/live-watchlist/setups/setup-admission.ts",
    "src/lib/live-watchlist/setups/setup-volume.ts", "src/lib/live-watchlist/indicators/indicator-refresh-service.ts",
    "src/lib/live-watchlist/indicators/indicator-request-coordinator.ts", "src/scripts/verify-watchlist-setups.ts",
  ].map(file => [file, sha(readFileSync(file, "utf8"))])),
  boundaries: { networkCalls: 0, applicationDataWrites: 0, notifications: 0, liveSettingsChanges: 0,
    derivedFiveMinuteIsNotNativeProviderProof: true, theseChecksDoNotMeasureTradingProfitability: true },
  datasets: results, firstConfirmedWitnesses: Object.fromEntries(witnesses), acquisitionCalls: calls,
  allFourHaveRecordedConfirmation: INITIAL_WATCHLIST_SETUP_KINDS.every(kind => witnesses.has(kind)) };
writeFileSync(join(outputDirectory, "results.json"), JSON.stringify(report, null, 2), { flag: "wx" });
console.log(`PASS ${assertions} assertions; recorded confirmations ${witnesses.size}/4; results: ${outputDirectory}`);
if (witnesses.size !== 4) process.exitCode = 2;
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
