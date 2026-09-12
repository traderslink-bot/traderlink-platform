import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
registerHooks({ resolve(specifier, context, next) { try { return next(specifier, context); } catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) return next(`${specifier}.ts`, context); throw error;
} } });
const { calculateIndicatorHistory, calculateSessionVwap } = await import("../lib/live-watchlist/indicators/indicator-engine.ts");
const { normalizeIndicatorSessions, indicatorTradingDay, indicatorMarketDate, indicatorVwapCoverage } = await import("../lib/live-watchlist/indicators/indicator-sessions.ts");
const calendar = JSON.parse(await readFile(new URL("../modules/coach/server/market-calendar/us-equities-review-calendar.v1.json", import.meta.url), "utf8"));
let assertions = 0;
const near = (actual, expected) => { assert.ok(expected === null ? actual === null : Math.abs(actual - expected) <= 1e-8 * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`); assertions++; };
function reference(bars) {
  const closes = bars.map(bar => bar.close);
  const ema = period => {
    if (closes.length < period) return null;
    let value = closes.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    for (const price of closes.slice(period)) value += (price - value) * 2 / (period + 1);
    return value;
  };
  if (bars.length < 15) return { ema9: ema(9), ema20: ema(20), atr14: null, rsi14: null };
  let gain = 0, loss = 0, range = 0;
  for (let index = 1; index < bars.length; index++) {
    const change = closes[index] - closes[index - 1], up = Math.max(0, change), down = Math.max(0, -change);
    const tr = Math.max(bars[index].high - bars[index].low, Math.abs(bars[index].high - closes[index - 1]), Math.abs(bars[index].low - closes[index - 1]));
    if (index <= 14) { gain += up / 14; loss += down / 14; range += tr / 14; }
    else { gain = (gain * 13 + up) / 14; loss = (loss * 13 + down) / 14; range = (range * 13 + tr) / 14; }
  }
  return { ema9: ema(9), ema20: ema(20), atr14: range, rsi14: loss === 0 ? gain === 0 ? 50 : 100 : 100 - 100 / (1 + gain / loss) };
}
for (const file of ["trug-midday", "sxtc", "pcla"]) {
  const saved = JSON.parse(await readFile(new URL(`../../data/watchlist-${file}-owner-export-20260911.json`, import.meta.url), "utf8"));
  const packet = JSON.parse(saved.audit.diagnostic.events[0].payload.body.input[1].content[0].text).marketPacket;
  const action = packet.priceAction, asOf = packet.dataAsOf;
  assert.ok(Number.isSafeInteger(asOf));
  const normalize = (bars, timeframe) => normalizeIndicatorSessions({ timeframe, calendar, completedThrough: asOf, bars: bars.map(bar => ({
    start: timeframe === "1d" ? indicatorTradingDay(calendar, bar.dateIso.slice(0, 10))?.regularOpen ?? bar.timestamp : bar.timestamp,
    open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume,
  })) }).candles;
  const one = normalize(action.oneMinuteEvidence.recentOneMinuteBars, "1m"), five = normalize(action.recentFiveMinuteBars, "5m");
  const buckets = new Map();
  for (const bar of five) { const start = Math.floor(bar.start / 900_000) * 900_000; const group = buckets.get(start) ?? []; group.push(bar); buckets.set(start, group); }
  const fifteen = [...buckets].filter(([start, bars]) => bars.length === 3 && bars.every((bar, index) => bar.start === start + index * 300_000 && bar.sessionKey === bars[0].sessionKey)).map(([start, bars]) => ({
    start, end: start + 900_000, open: bars[0].open, close: bars[2].close, high: Math.max(...bars.map(bar => bar.high)), low: Math.min(...bars.map(bar => bar.low)), volume: bars.some(bar => bar.volume === null) ? null : bars.reduce((sum, bar) => sum + bar.volume, 0), sessionKey: bars[0].sessionKey,
  }));
  const frames = { "1m": one, "5m": five, "15m": fifteen, "1d": normalize(action.recentDailyBars, "1d") };
  for (const [frame, bars] of Object.entries(frames)) {
    assert.ok(bars.length > 0);
    const actual = calculateIndicatorHistory(bars, frame, `captured:${packet.symbol}:${frame}`, asOf).results.at(-1), expected = reference(bars);
    for (const key of ["ema9", "ema20", "rsi14", "atr14"]) near(actual[key], expected[key]);
  }
  const day = indicatorTradingDay(calendar, indicatorMarketDate(asOf));
  const coverage = indicatorVwapCoverage({ candles: one, day, completedThrough: asOf });
  assert.equal(coverage.complete, false); assertions++;
  const vwap = calculateSessionVwap({ candles: one, sessionStart: day.preOpen, sessionEnd: day.postClose, completedThrough: asOf, coverageComplete: coverage.complete });
  near(vwap.value, null);
  console.log(JSON.stringify({ symbol: packet.symbol, capturedAt: new Date(asOf).toISOString(), completedBars: Object.fromEntries(Object.entries(frames).map(([frame, bars]) => [frame, bars.length])), fifteenMinuteSource: "complete groups of three saved five-minute bars", vwap: "not verifiable: saved one-minute window does not cover full session" }));
}
console.log(`PASS: ${assertions} independent EMA/RSI/ATR and incomplete-VWAP assertions using actual private saved TRUG, SXTC and PCLA candles. No private packets copied or committed. TNON, AENT, FTFT, FEIM, BDRX and SURG do not have equivalent captured files in this selected sample; nine synthetic fixtures are not a substitute. No live/provider/AI requests.`);
