import { describe, expect, it } from "vitest";
import {
  advanceIndicator, calculateIndicatorHistory, calculateSessionVwap, createIndicatorCheckpoint,
  type IndicatorCandle,
} from "./indicator-engine";

const start = Date.UTC(2026, 8, 11, 13, 30);
function candles(count: number, closeAt: (i: number) => number = i => 100 + i): IndicatorCandle[] {
  return Array.from({ length: count }, (_, i) => ({
    start: start + i * 60_000, end: start + (i + 1) * 60_000,
    open: closeAt(i), high: closeAt(i) + 1, low: closeAt(i) - 1, close: closeAt(i),
    volume: 100, sessionKey: "2026-09-11:regular",
  }));
}
const run = (bars: readonly IndicatorCandle[]) => calculateIndicatorHistory(bars, "1m", "fixture:unadjusted", bars.at(-1)?.end ?? start);

describe("Watchlist deterministic indicator engine (no providers or AI)", () => {
  it("uses separate SMA-seeded EMA readiness without a 100-bar gate", () => {
    const { results } = run(candles(23));
    expect(results[7].ema9).toBeNull();
    expect(results[8].ema9).toBe(104);
    expect(results[18].ema20).toBeNull();
    expect(results[19].ema20).toBe(109.5);
    expect(results[21].trend).toBeNull();
    expect(results[22].trend).toBe("uptrend");
  });

  it("seeds Wilder RSI and ATR with 14 actual changes and delays only dependent comparisons", () => {
    const { results } = run(candles(35));
    expect(results[13].rsi14).toBeNull();
    expect(results[13].atr14).toBeNull();
    expect(results[14].rsi14).toBe(100);
    expect(results[14].atr14).toBe(2);
    expect(results[16].rsiChange).toBeNull();
    expect(results[17].rsiChange).toBe(0);
    expect(results[33].atrRatio).toBeNull();
    expect(results[34].atrRatio).toBe(1);
  });

  it("handles flat prices and zero volume without division errors", () => {
    const bars = candles(40, () => 100).map(c => ({ ...c, high: 100, low: 100, volume: 0 }));
    const last = run(bars).results.at(-1)!;
    expect(last.rsi14).toBe(50);
    expect(last.atr14).toBe(0);
    expect(last.trend).toBeNull();
    expect(last.atrRatio).toBeNull();
    expect(last.volumeRatio).toBeNull();
    expect(last.volumeChangePercent).toBeNull();
    expect(last.ema20).toBe(100);
  });

  it("keeps a rising oversold RSI qualified rather than calling it bullish momentum", () => {
    const bars = candles(18, i => i <= 14 ? 100 - i : 86 + (i - 14) * 0.2);
    const last = run(bars).results.at(-1)!;
    expect(last.rsiChange).toBeGreaterThan(3);
    expect(last.rsi14).toBeLessThan(30);
    expect(last.rsiDirection).toBe("rising");
    expect(last.rsiCondition).toBe("oversold");
  });

  it("provides bar-to-bar volume before a mature intraday baseline", () => {
    const bars = candles(11).map((c, i) => ({ ...c, volume: i === 10 ? 140 : 100 }));
    const { results } = run(bars);
    expect(results[1].volumeChangePercent).toBe(0);
    expect(results[9].volumeRatio).toBeNull();
    expect(results[10].volumeBaselineBars).toBe(10);
    expect(results[10].volumeRatio).toBe(1.4);
    expect(results[10].volumeState).toBe("above_baseline");
  });

  it("resets intraday volume only, retaining indicator history across sessions", () => {
    const bars = candles(25).map((c, i) => ({ ...c, sessionKey: i === 24 ? "2026-09-11:post" : c.sessionKey }));
    const last = run(bars).results.at(-1)!;
    expect(last.volumeBaselineBars).toBe(0);
    expect(last.volumeChangePercent).toBeNull();
    expect(last.ema20).not.toBeNull();
  });

  it("compares daily volume across completed trading dates instead of resetting daily", () => {
    const bars = candles(11).map((c, i) => ({ ...c,
      start: start + i * 86_400_000, end: start + (i + 1) * 86_400_000,
      sessionKey: `fixture-day-${i}`, volume: i === 10 ? 75 : 100,
    }));
    const last = calculateIndicatorHistory(bars, "1d", "daily-fixture", bars.at(-1)!.end).results.at(-1)!;
    expect(last.volumeBaselineBars).toBe(10);
    expect(last.volumeRatio).toBe(0.75);
    expect(last.volumeState).toBe("below_baseline");
  });

  it("replays precisely from a serialized checkpoint without reseeding", () => {
    const bars = candles(70, i => 100 + Math.sin(i) * 5);
    const initial = run(bars.slice(0, 31));
    let checkpoint = JSON.parse(JSON.stringify(initial.checkpoint));
    let resumed;
    for (const candle of bars.slice(31)) {
      resumed = advanceIndicator(checkpoint, candle, bars.at(-1)!.end);
      checkpoint = resumed.checkpoint;
    }
    expect(resumed!.result).toEqual(run(bars).results.at(-1));
    expect(checkpoint).toEqual(run(bars).checkpoint);
  });

  it("rejects older/duplicate or incomplete candles instead of corrupting incremental state", () => {
    const bars = candles(3);
    const first = run(bars.slice(0, 2));
    const saved = JSON.stringify(first.checkpoint);
    expect(() => advanceIndicator(first.checkpoint, bars[0], bars[2].end)).toThrow("rebuild_required");
    expect(() => advanceIndicator(first.checkpoint, bars[2], bars[2].end - 1)).toThrow("incomplete_candle");
    expect(JSON.stringify(first.checkpoint)).toBe(saved);
    expect(() => advanceIndicator(createIndicatorCheckpoint("5m", "x"), bars[0], bars[0].end)).toThrow("wrong_timeframe");
  });

  it("computes session VWAP from one-minute volume-weighted inputs only", () => {
    const bars = candles(2, i => i === 0 ? 10 : 20).map((c, i) => ({ ...c, volume: i === 0 ? 100 : 300 }));
    const input = { candles: bars, sessionStart: start, sessionEnd: start + 3_600_000,
      completedThrough: bars.at(-1)!.end, coverageComplete: true };
    expect(calculateSessionVwap(input).value).toBe(17.5);
    expect(calculateSessionVwap({ ...input, coverageComplete: false }).value).toBeNull();
    expect(() => calculateSessionVwap({ ...input, sessionStart: start + 60_000 })).toThrow("invalid_vwap_series");
    expect(() => calculateSessionVwap({ ...input, candles: [bars[0], bars[0]] })).toThrow("invalid_vwap_series");
  });
});
