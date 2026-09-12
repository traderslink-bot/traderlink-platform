import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) return next(`${specifier}.ts`, context);
    throw error;
  }
} });
const { IndicatorRefreshService } = await import("../lib/live-watchlist/indicators/indicator-refresh-service.ts");
const { indicatorTradingDay } = await import("../lib/live-watchlist/indicators/indicator-sessions.ts");
const calendar = JSON.parse(await readFile(new URL("../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json", import.meta.url), "utf8"));
let now = Date.parse("2026-09-11T14:30:00Z"), calls = [], failure = "none", assertions = 0, priceScale = 1;
const audits = [], evidence = [];
const day = indicatorTradingDay(calendar, "2026-09-11");
const daily = [];
for (let timestamp = Date.parse("2026-06-01T12:00:00Z"); timestamp < now; timestamp += 86_400_000) {
  const session = indicatorTradingDay(calendar, new Date(timestamp).toISOString().slice(0, 10));
  if (session) daily.push(session.regularOpen);
}
const service = new IndicatorRefreshService({ calendar, now: () => now, record: row => audits.push(row),
  saveCalculation: async snapshot => { evidence.push(snapshot); return true; }, load: async input => {
    calls.push(input);
    const base = { provider: input.provider, adjustment: input.provider === "moomoo" ? "moomoo-forward" : "yahoo-chart-native",
      pages: 1, transportIds: [], nextEnd: null };
    if (failure === "both" || (failure === "primary" && input.provider === "moomoo")) return { ...base, outcome: "provider_error", bars: [] };
    const timeframe = input.request.timeframe, duration = { "1m": 60_000, "5m": 300_000, "15m": 900_000 }[timeframe];
    const times = timeframe === "1d" ? daily : Array.from({ length: Math.floor((now - day.preOpen) / duration) }, (_, i) => day.preOpen + i * duration);
    const bars = times.filter(start => start >= input.request.start && start < input.request.end).map(start => {
      const i = timeframe === "1d" ? daily.indexOf(start) : (start - day.preOpen) / duration;
      return { start, open: (3 + i / 100) * priceScale, high: (3.1 + i / 100) * priceScale, low: (2.9 + i / 100) * priceScale, close: (3.02 + i / 100) * priceScale, volume: 100 + i };
    });
    return { ...base, outcome: "complete", bars };
  } });
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
const symbols = ["TRUG", "TNON", "AENT", "FTFT", "FEIM", "BDRX", "SURG", "SXTC", "PCLA"];
for (const symbol of symbols) {
  const snapshot = await service.refresh(symbol, `${symbol}:one`);
  equal(Object.keys(snapshot.timeframes).length, 4);
  equal(snapshot.vwap.value !== null, true);
  equal(snapshot.timeframes["1m"].dataThrough, now);
  equal(snapshot.timeframes["1d"].dataThrough, indicatorTradingDay(calendar, "2026-09-10").regularClose);
}
equal(calls.length, 36);
const previous = service.current("TRUG", "TRUG:one");
const shared = service.sharedFiveMinute("TRUG", "TRUG:one");
equal(shared.provider, "moomoo"); equal(shared.dataThrough, previous.timeframes["5m"].dataThrough);
equal(service.sharedFiveMinute("TRUG", "old-activation"), null);
shared.candles[0].close = 999;
equal(service.sharedFiveMinute("TRUG", "TRUG:one").candles[0].close !== 999, true);
await Promise.all([service.refresh("TRUG", "TRUG:one"), service.refresh("TRUG", "TRUG:one")]);
equal(calls.length, 36);
now += 120_000; failure = "both";
const retained = await service.refresh("TRUG", "TRUG:one");
equal(retained.timeframes, previous.timeframes); equal(retained.vwap, previous.vwap);
equal(audits.at(-1).outcome, "retained");
equal(calls.filter(call => call.request.symbol === "TRUG" && call.request.timeframe === "1d").length, 1);
now += 120_000; failure = "primary";
const fallback = await service.refresh("TRUG", "TRUG:one");
equal(fallback.timeframes["1m"].dataThrough, now);
equal(audits.at(-1).timeframes.find(frame => frame.timeframe === "1m").provider, "yahoo");
equal(evidence.at(-1).timeframes.find(frame => frame.timeframe === "1m").provider, "yahoo");
equal(service.sharedFiveMinute("TRUG", "TRUG:one").provider, "yahoo");
equal(service.current("TRUG", "old-activation"), null);
service.deactivate("TRUG"); equal(service.current("TRUG", "TRUG:one"), null);
equal(service.sharedFiveMinute("TRUG", "TRUG:one"), null);
const oldEvidence = evidence[0];
equal(oldEvidence.symbol, "TRUG"); equal(oldEvidence.timeframes.find(frame => frame.timeframe === "1m").provider, "moomoo");
const restartedService = new IndicatorRefreshService({ calendar, now: () => now, record: () => {}, saveCalculation: async () => true, load: async () => { throw Error("Restore must not request data"); } });
equal(restartedService.restore("TRUG", "TRUG:one", oldEvidence), true);
equal(restartedService.current("TRUG", "TRUG:one").calculationId, oldEvidence.id);
equal(restartedService.current("TRUG", "TRUG:one").timeframes["1m"], oldEvidence.timeframes.find(frame => frame.timeframe === "1m").result);
equal(restartedService.restore("TNON", "TNON:one", oldEvidence), false);
now += 120_000; failure = "none"; priceScale = 10;
const beforeRebase = service.current("TNON", "TNON:one");
await service.refresh("TNON", "TNON:one");
equal(audits.at(-1).timeframes.filter(frame => frame.rebuildReason === "price_history_rebased").length, 4);
equal(Math.abs(service.current("TNON", "TNON:one").timeframes["1d"].ema20 - beforeRebase.timeframes["1d"].ema20 * 10) < 1e-10, true);
equal(service.current("TNON", "TNON:one").calculationId !== beforeRebase.calculationId, true);
now = Date.parse("2026-09-12T14:30:00Z"); failure = "both";
await service.refresh("TNON", "TNON:one");
const closedCalls = calls.length;
now += 120_000; await service.refresh("TNON", "TNON:one"); equal(calls.length, closedCalls); equal(audits.at(-1).outcome, "session_closed");
now += 86_400_000; await service.refresh("TNON", "TNON:one"); equal(calls.length, closedCalls);
service.reconcilePopulation(new Map([["TNON", "TNON:one"]]));
equal(service.current("AENT", "AENT:one"), null); equal(service.current("TNON", "TNON:one") !== null, true);
failure = "none";
const closedWarmup = await service.refresh("AENT", "AENT:weekend");
equal(closedWarmup.vwap.value !== null, true); equal(closedWarmup.vwap.dataThrough, day.postClose);
const weekendCalls = calls.length;
now += 120_000; await service.refresh("AENT", "AENT:weekend"); equal(calls.length, weekendCalls);
console.log(`PASS: ${assertions} offline refresh integration assertions across nine named ticker fixtures: four frames, session VWAP, completed Daily caching, two-minute reuse, retained timestamps on failure, explicit Yahoo fallback, immutable prior evidence and activation isolation. These are synthetic fixtures, not live market-data acceptance.`);
