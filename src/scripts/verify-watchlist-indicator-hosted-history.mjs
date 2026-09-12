// Explicitly opted-in read-only historical verification. Never adds/approves tickers or requests AI.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire, registerHooks } from "node:module";
if (!process.argv.includes("--allow-production-history") || !process.env.TRADERLINK_INDICATOR_PUBLISHER_ENV_FILE) throw Error("Explicit historical-read opt-in and publisher environment file are required.");
registerHooks({ resolve(specifier, context, next) { try { return next(specifier, context); } catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) return next(`${specifier}.ts`, context); throw error;
} } });
const dependencies = createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE ?? new URL("../../package.json", import.meta.url));
const environment = dependencies("dotenv").parse(await readFile(process.env.TRADERLINK_INDICATOR_PUBLISHER_ENV_FILE));
const endpoint = new URL(environment.TRADERSLINK_WATCHLIST_INGEST_URL);
if (!["https://traderslink.pro", "https://app.traderslink.pro"].includes(endpoint.origin) || !endpoint.pathname.endsWith("/ingest")) throw Error("Unexpected configured production bridge.");
endpoint.pathname = `${endpoint.pathname.slice(0, -7)}/moomoo-candles`;
const token = environment.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim(); if (!token) throw Error("Publisher authorization unavailable.");
const { calculateIndicatorHistory, calculateSessionVwap } = await import("../lib/live-watchlist/indicators/indicator-engine.ts");
const { aggregateIndicatorMinutes } = await import("../lib/live-watchlist/indicators/indicator-aggregation.ts");
const { normalizeIndicatorSessions, indicatorTradingDay, indicatorVwapCoverage } = await import("../lib/live-watchlist/indicators/indicator-sessions.ts");
const { parseMoomooIndicatorPage } = await import("../lib/live-watchlist/indicators/indicator-history-provider.ts");
const calendar = JSON.parse(await readFile(new URL("../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json", import.meta.url), "utf8"));
const date = process.env.TRADERLINK_INDICATOR_HISTORY_DATE ?? "2026-09-11", day = indicatorTradingDay(calendar, date);
if (!day || day.postClose > Date.now()) throw Error("A verified completed historical session is required.");
let failures = 0;
for (const symbol of ["TRUG", "TNON", "AENT", "FTFT", "FEIM", "BDRX", "SURG", "SXTC", "PCLA"]) {
  const url = new URL(endpoint); url.search = new URLSearchParams({ symbol, start: String(day.preOpen / 1000), end: String(day.postClose / 1000) }).toString();
  try {
    const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, redirect: "error", signal: AbortSignal.timeout(20_000) });
    if (!response.ok) { failures++; console.log(JSON.stringify({ symbol, status: response.status, result: "historical_bridge_unavailable" })); continue; }
    const payload = await response.json();
    assert.equal(payload.status, "ready"); assert.equal(payload.provider, "moomoo_open_api");
    assert.ok(Array.isArray(payload.candles) && payload.candles.length <= 1440);
    // Exercise the production Indicators parser, not a test-only timestamp correction.
    const parsedBars = [];
    for (let index = 0; index < payload.candles.length; index += 370) {
      const parsed = parseMoomooIndicatorPage({ ret_code: 0, data: { kline_list: payload.candles.slice(index, index + 370).map(bar => ({
        time_key: bar.timestamp, open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume })) } }, "1m");
      assert.equal(parsed.ok, true); parsedBars.push(...parsed.data.bars);
    }
    const one = normalizeIndicatorSessions({ calendar, timeframe: "1m", completedThrough: day.postClose, bars: parsedBars }).candles;
    const frames = { "1m": one, "5m": [], "15m": [] };
    for (const [key, start, end] of [["pre", day.preOpen, day.regularOpen], ["regular", day.regularOpen, day.regularClose], ["post", day.regularClose, day.postClose]]) {
      const sessionBars = one.filter(bar => bar.start >= start && bar.end <= end);
      const session = { start, end, key: sessionBars[0]?.sessionKey ?? `${date}:${key}` };
      for (const timeframe of ["5m", "15m"]) frames[timeframe].push(...aggregateIndicatorMinutes({ candles: sessionBars, timeframe, session, completedThrough: day.postClose }).candles);
    }
    for (const [timeframe, bars] of Object.entries(frames)) {
      assert.ok(bars.length > 0);
      const results = calculateIndicatorHistory(bars, timeframe, `hosted:${symbol}:${timeframe}`, day.postClose).results;
      const last = results.at(-1); assert.ok(last.ema9 !== null && last.ema20 !== null && last.rsi14 !== null && last.atr14 !== null);
      const ema = period => { let value = bars.slice(0, period).reduce((sum, bar) => sum + bar.close, 0) / period;
        for (const bar of bars.slice(period)) value += (bar.close - value) * 2 / (period + 1); return value; };
      assert.ok(Math.abs(last.ema9 - ema(9)) < 1e-8); assert.ok(Math.abs(last.ema20 - ema(20)) < 1e-8);
    }
    const coverage = indicatorVwapCoverage({ candles: one, day, completedThrough: day.postClose });
    const vwap = calculateSessionVwap({ candles: one, sessionStart: day.preOpen, sessionEnd: day.postClose, completedThrough: day.postClose, coverageComplete: coverage.complete });
    if (coverage.complete && one.every(bar => bar.volume !== null)) {
      const volume = one.reduce((sum, bar) => sum + bar.volume, 0);
      const expected = volume ? one.reduce((sum, bar) => sum + (bar.high + bar.low + bar.close) / 3 * bar.volume, 0) / volume : null;
      assert.ok(expected === null ? vwap.value === null : Math.abs(vwap.value - expected) < 1e-8);
    } else assert.equal(vwap.value, null);
    console.log(JSON.stringify({ symbol, date, provider: "moomoo_open_api", inputSha256: createHash("sha256").update(JSON.stringify(one)).digest("hex"),
      completedBars: Object.fromEntries(Object.entries(frames).map(([frame, bars]) => [frame, bars.length])), unknownMissingMinutes: coverage.missingMinutes, fullSessionVwapVerified: vwap.value !== null, result: "passed" }));
  } catch { failures++; console.log(JSON.stringify({ symbol, result: "failed_or_incomplete_historical_check" })); }
  finally { await new Promise(resolve => setTimeout(resolve, 500)); }
}
if (failures) process.exitCode = 1;
console.log(`Historical check complete: ${failures} failures. Existing production one-minute bridge, locally derived 5m/15m only; not native multi-timeframe adapter or released new UI proof. No AI, ticker adds, approvals, Discord or deployment.`);
