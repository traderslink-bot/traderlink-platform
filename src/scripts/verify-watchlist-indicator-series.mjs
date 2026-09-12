import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Native Node strips TypeScript but needs explicit extension resolution for these app imports.
registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) return next(`${specifier}.ts`, context);
    throw error;
  }
} });
const { IndicatorSeries } = await import("../lib/live-watchlist/indicators/indicator-series.ts");
const { indicatorHistoryRebuildReason } = await import("../lib/live-watchlist/indicators/indicator-history-rebuild.ts");
const { advanceIndicator, createIndicatorCheckpoint } = await import("../lib/live-watchlist/indicators/indicator-engine.ts");
let assertions = 0;
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
const start = Date.parse("2026-09-11T13:30:00Z");
const candles = Array.from({ length: 100 }, (_, i) => ({ start: start + i * 60_000, end: start + (i + 1) * 60_000,
  open: 3 + i / 100, high: 3.1 + i / 100, low: 2.9 + i / 100, close: 3.02 + i / 100, volume: 100 + i, sessionKey: "2026-09-11:regular" }));
const series = new IndicatorSeries({ activationId: "one", seriesKey: "moomoo:TNON:1m:forward", timeframe: "1m", maximumBars: 40 });
const update = bars => series.update({ activationId: "one", expectedRevision: series.snapshot().revision, candles: bars,
  completedThrough: candles.at(-1).end, continuous: (a, b) => a.end === b.start });
equal(update(candles.slice(0, 60)).outcome, "updated");
equal(series.snapshot().candles.length, 40); equal(series.snapshot().initialCheckpoint.count, 20);
equal(update(candles.slice(60)).outcome, "updated");
let checkpoint = createIndicatorCheckpoint("1m", "moomoo:TNON:1m:forward"), result;
for (const candle of candles) ({ checkpoint, result } = advanceIndicator(checkpoint, candle, candles.at(-1).end));
equal(series.snapshot().result, result); equal(series.snapshot().checkpoint, checkpoint);
equal(update(candles.slice(80)).outcome, "unchanged");
const corrected = { ...candles[90], close: candles[90].close - .05 };
equal(update([corrected]).correctedBars, 1);
const saved = series.snapshot();
checkpoint = saved.initialCheckpoint;
for (const candle of saved.candles) ({ checkpoint, result } = advanceIndicator(checkpoint, candle, candles.at(-1).end));
equal(saved.result, result); equal(saved.checkpoint, checkpoint);
const persisted = JSON.parse(JSON.stringify(saved));
equal(indicatorHistoryRebuildReason(saved, [candles[0]]), "older_seed_history");
equal(indicatorHistoryRebuildReason(saved, saved.candles.slice(-5).map(c => ({ ...c, open: c.open * 10, high: c.high * 10, low: c.low * 10, close: c.close * 10 }))), "price_history_rebased");
equal(indicatorHistoryRebuildReason(saved, [corrected]), null);
const restored = IndicatorSeries.restore({ ...persisted, maximumBars: 40, completedThrough: candles.at(-1).end });
equal(restored.snapshot().checkpoint, saved.checkpoint); equal(restored.snapshot().result, saved.result);
assert.throws(() => IndicatorSeries.restore({ ...persisted, initialCheckpoint: null, completedThrough: candles.at(-1).end })); assertions++;
assert.throws(() => IndicatorSeries.restore({ ...persisted, result: { ...persisted.result, close: 999 }, completedThrough: candles.at(-1).end })); assertions++;
equal(update([candles[0]]).outcome, "seed_history_required");
equal(series.update({ activationId: "old", expectedRevision: saved.revision, candles: [], completedThrough: 0, continuous: () => true }).outcome, "superseded");
equal(series.update({ activationId: "one", expectedRevision: 0, candles: [], completedThrough: 0, continuous: () => true }).outcome, "superseded");
assert.throws(() => update([{ ...candles[99], close: -1 }])); assertions++;
equal(series.snapshot(), saved);
saved.candles[0].close = 999;
equal(series.snapshot().candles[0].close === 999, false);
const gaps = new IndicatorSeries({ activationId: "two", seriesKey: "test", timeframe: "1m" });
const gapped = gaps.update({ activationId: "two", expectedRevision: 0, candles: [...candles.slice(0, 30), ...candles.slice(35)],
  completedThrough: candles.at(-1).end, continuous: (a, b) => a.end === b.start });
equal(gapped.gapReset, true); equal(gapped.snapshot.result.bars, 65);
console.log(`PASS: ${assertions} offline correction-cache assertions: exact retained seed/replay, append parity, immutable snapshots, stale activation/revision protection, invalid-update atomicity and unknown-gap reset.`);
