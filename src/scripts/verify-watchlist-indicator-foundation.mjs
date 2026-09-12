// Focused, offline checkpoint: Node built-ins only; no server, provider calls or AI.
import assert from "node:assert/strict";
import { advanceIndicator, calculateIndicatorHistory, calculateSessionVwap, createIndicatorCheckpoint }
  from "../lib/live-watchlist/indicators/indicator-engine.ts";
import { aggregateIndicatorMinutes } from "../lib/live-watchlist/indicators/indicator-aggregation.ts";

const start = Date.UTC(2026, 8, 11, 13, 30);
const bars = (n, price = i => 100 + i) => Array.from({ length: n }, (_, i) => ({
  start: start + i * 60_000, end: start + (i + 1) * 60_000,
  open: price(i), high: price(i) + 1, low: price(i) - 1, close: price(i),
  volume: 100, sessionKey: "2026-09-11:regular",
}));
const run = input => calculateIndicatorHistory(input, "1m", "fixture", input.at(-1)?.end ?? start);
let assertions = 0;
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
const truth = value => { assert.ok(value); assertions++; };
const reject = callback => { assert.throws(callback); assertions++; };
const history = run(bars(40)).results;
const missingVolumeHistory = run(bars(40).map(c => ({ ...c, volume: null }))).results;
for (const field of ["ema9", "ema20", "rsi14", "atr14", "trend"]) equal(missingVolumeHistory.at(-1)[field], history.at(-1)[field]);
equal(missingVolumeHistory.at(-1).volume, null); equal(missingVolumeHistory.at(-1).volumeRatio, null);
equal(history[7].ema9, null);
equal(history[8].ema9, 104);
equal(history[18].ema20, null);
equal(history[19].ema20, 109.5);
equal(history[21].trend, null);
equal(history[22].trend, "uptrend");
equal(history[13].rsi14, null);
equal(history[14].rsi14, 100);
equal(history[14].atr14, 2);
equal(history[16].rsiChange, null);
equal(history[17].rsiChange, 0);
equal(history[33].atrRatio, null);
equal(history[34].atrRatio, 1);

const flat = bars(40, () => 100).map(c => ({ ...c, high: 100, low: 100, volume: 0 }));
const flatResult = run(flat).results.at(-1);
equal(flatResult.rsi14, 50);
equal(flatResult.atr14, 0);
equal(flatResult.atrRatio, null);
equal(flatResult.volumeRatio, null);
equal(flatResult.trend, null);
const dip = run(bars(18, i => i <= 14 ? 100 - i : 86 + (i - 14) * 0.2)).results.at(-1);
truth(dip.rsiChange > 3);
equal(dip.rsiDirection, "rising");
equal(dip.rsiCondition, "oversold");

const volume = run(bars(11).map((c, i) => ({ ...c, volume: i === 10 ? 140 : 100 }))).results;
equal(volume[1].volumeChangePercent, 0);
equal(volume[9].volumeRatio, null);
equal(volume[10].volumeState, "above_baseline");
const transition = run(bars(25).map((c, i) => ({ ...c, sessionKey: i === 24 ? "post" : c.sessionKey }))).results.at(-1);
equal(transition.volumeBaselineBars, 0);
truth(transition.ema20 !== null);
const daily = bars(11).map((c, i) => ({ ...c, start: start + i * 86_400_000,
  end: start + (i + 1) * 86_400_000, sessionKey: `day-${i}`, volume: i === 10 ? 75 : 100 }));
equal(calculateIndicatorHistory(daily, "1d", "daily", daily.at(-1).end).results.at(-1).volumeState, "below_baseline");

// Independent batch recurrence (not the production incremental helper).
const fixture = bars(250, i => 110 + Math.sin(i * 0.4) * 7 + Math.cos(i * 0.19) * 3);
const expectedEma = period => {
  let value = fixture.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  for (const c of fixture.slice(period)) value = c.close * (2 / (period + 1)) + value * (1 - 2 / (period + 1));
  return value;
};
let avgGain = 0, avgLoss = 0, avgTr = 0;
for (let i = 1; i < fixture.length; i++) {
  const c = fixture[i], p = fixture[i - 1];
  const gain = Math.max(c.close - p.close, 0), loss = Math.max(p.close - c.close, 0);
  const tr = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
  if (i <= 14) { avgGain += gain / 14; avgLoss += loss / 14; avgTr += tr / 14; }
  else { avgGain = avgGain * (13 / 14) + gain / 14; avgLoss = avgLoss * (13 / 14) + loss / 14; avgTr = avgTr * (13 / 14) + tr / 14; }
}
const full = run(fixture);
const last = full.results.at(-1);
truth(Math.abs(last.ema9 - expectedEma(9)) < 1e-10);
truth(Math.abs(last.ema20 - expectedEma(20)) < 1e-10);
truth(Math.abs(last.rsi14 - (100 - 100 / (1 + avgGain / avgLoss))) < 1e-10);
truth(Math.abs(last.atr14 - avgTr) < 1e-10);
let checkpoint = JSON.parse(JSON.stringify(run(fixture.slice(0, 51)).checkpoint));
for (const c of fixture.slice(51)) checkpoint = advanceIndicator(checkpoint, c, fixture.at(-1).end).checkpoint;
equal(checkpoint, full.checkpoint);
const old = JSON.stringify(checkpoint);
reject(() => advanceIndicator(checkpoint, fixture[0], fixture.at(-1).end));
equal(JSON.stringify(checkpoint), old);
reject(() => advanceIndicator(createIndicatorCheckpoint("1m", "x"), fixture[0], fixture[0].end - 1));
reject(() => advanceIndicator(createIndicatorCheckpoint("5m", "x"), fixture[0], fixture[0].end));

const vwapBars = bars(2, i => i === 0 ? 10 : 20).map((c, i) => ({ ...c, volume: i === 0 ? 100 : 300 }));
const vwapInput = { candles: vwapBars, sessionStart: start, sessionEnd: start + 3_600_000,
  completedThrough: vwapBars.at(-1).end, coverageComplete: true };
equal(calculateSessionVwap(vwapInput).value, 17.5);
equal(calculateSessionVwap({ ...vwapInput, coverageComplete: false }).value, null);
equal(calculateSessionVwap({ ...vwapInput, candles: vwapBars.map(c => ({ ...c, volume: null })) }).value, null);
reject(() => calculateSessionVwap({ ...vwapInput, sessionStart: start + 60_000 }));
reject(() => calculateSessionVwap({ ...vwapInput, candles: [vwapBars[0], vwapBars[0]] }));
const minuteBars = bars(15);
const aggregationInput = { candles: minuteBars, session: { key: minuteBars[0].sessionKey,
  start, end: start + 15 * 60_000 }, timeframe: "5m", completedThrough: minuteBars.at(-1).end };
const fiveMinute = aggregateIndicatorMinutes(aggregationInput);
equal(fiveMinute.candles.length, 3);
equal(fiveMinute.candles[0].open, 100);
equal(fiveMinute.candles[0].close, 104);
equal(fiveMinute.candles[0].volume, 500);
const missingVolumeAggregate = aggregateIndicatorMinutes({ ...aggregationInput, candles: minuteBars.map(c => ({ ...c, volume: null })) });
equal(missingVolumeAggregate.candles.length, 3); equal(missingVolumeAggregate.candles[0].volume, null);
equal(missingVolumeAggregate.candles[0].close, fiveMinute.candles[0].close);
equal(aggregateIndicatorMinutes({ ...aggregationInput, timeframe: "15m" }).candles.length, 1);
const missing = aggregateIndicatorMinutes({ ...aggregationInput, candles: minuteBars.filter((_, i) => i !== 2) });
equal(missing.candles.length, 2);
equal(missing.missingMinutes, [start + 2 * 60_000]);
const confirmed = aggregateIndicatorMinutes({ ...aggregationInput, candles: minuteBars.filter((_, i) => i !== 2),
  confirmedNoTradeMinutes: [start + 2 * 60_000] });
equal(confirmed.candles.length, 3);
equal(confirmed.candles[0].volume, 400);
const incomplete = aggregateIndicatorMinutes({ ...aggregationInput, completedThrough: start + 14 * 60_000 });
equal(incomplete.candles.length, 2);
equal(incomplete.incompleteBuckets, [start + 10 * 60_000]);
reject(() => aggregateIndicatorMinutes({ ...aggregationInput, candles: [...minuteBars, minuteBars[0]] }));
reject(() => aggregateIndicatorMinutes({ ...aggregationInput, confirmedNoTradeMinutes: [start] }));
console.log(`PASS: ${assertions} offline indicator assertions; independent formula parity, serialized replay and timeframe aggregation verified. No provider or AI requests.`);
