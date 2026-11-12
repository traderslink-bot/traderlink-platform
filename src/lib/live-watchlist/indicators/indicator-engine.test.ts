import { describe, expect, it } from "vitest";
import { IndicatorSeries } from "./indicator-series";
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

describe("Watchlist signal events", () => {
  it("timestamps an EMA cross once, preserves it on steady continuation, then records a second cross", () => {
    const bars = candles(50, i => i < 35 ? 100 + i : i < 45 ? 65 : 300);
    const { results } = run(bars);
    expect(results[34].signals?.averages).toBeUndefined();
    expect(results[35].signals?.averages).toEqual({ kind: "emaBearishCross", at: bars[35].end });
    expect(results[44].signals?.averages).toEqual(results[35].signals?.averages);
    expect(results[45].signals?.averages).toEqual({ kind: "emaBullishCross", at: bars[45].end });
  });

  it("reports loss of trend alignment separately from an EMA cross", () => {
    const bars = candles(36, i => i < 35 ? 100 + i : 119);
    const { results } = run(bars);
    expect(results[34].trend).toBe("uptrend");
    expect(results[35].signals?.trend).toEqual({ kind: "uptrendPriceWeakening", at: bars[35].end });
    expect(results[35].signals?.averages).toBeUndefined();
  });

  it("preserves distinct RSI threshold events on a single sharp move in either direction", () => {
    const bars = candles(38, i => i < 34 ? 100 + i : i === 34 ? 75 : 250);
    const { results } = run(bars);
    expect(results[34].signals).toMatchObject({
      rsiUpper: { kind: "rsiLeftOverbought", at: bars[34].end },
      rsiMidpoint: { kind: "rsiBelowMidpoint", at: bars[34].end },
      rsiLower: { kind: "rsiOversold", at: bars[34].end },
      momentum: { kind: "momentumTurningLower", at: bars[34].end },
    });
    expect(results[35].signals).toMatchObject({
      rsiUpper: { kind: "rsiOverbought", at: bars[35].end },
      rsiMidpoint: { kind: "rsiAboveMidpoint", at: bars[35].end },
      rsiLower: { kind: "rsiRecovered", at: bars[35].end },
    });
    expect(results[37].signals?.momentum).toEqual({ kind: "momentumTurningHigher", at: bars[37].end });
  });

  it("describes flat price on elevated volume and resets volume comparisons at a session boundary", () => {
    const bars = candles(25, () => 100).map((bar, i) => ({
      ...bar, volume: i === 22 ? 400 : 100, sessionKey: i === 24 ? "2026-09-11:postmarket" : bar.sessionKey,
    }));
    const { results } = run(bars);
    expect(results[22]).toMatchObject({ volumeState: "above_baseline", priceDirection: "flat",
      signals: { volume: { kind: "volumePickingUp", at: bars[22].end } } });
    expect(results[23].signals?.volume).toEqual({ kind: "volumeFading", at: bars[23].end });
    expect(results[24].signals?.volume).toBeUndefined();
    expect(results[24].volume).toBe(100);
  });

  it("uses preceding ATR to detect a wide candle in either price direction", () => {
    for (const close of [90, 110]) {
      const bars = candles(39, () => 100).map((bar, i) => i < 38 ? bar : {
        ...bar, close, high: Math.max(100, close) + 1, low: Math.min(100, close) - 1,
      });
      const { results } = run(bars);
      expect(results[37].atr14).toBe(2);
      expect(results[38].signals?.range).toEqual({ kind: "wideCandle", at: bars[38].end });
      expect(results[38].atr14).toBeGreaterThan(2);
    }
  });

  it("detects ATR contraction and subsequent expansion through a steady period", () => {
    const bars = candles(75, () => 100).map((bar, i) => {
      const halfRange = i < 37 ? 2 : i < 70 ? 0.1 : 8;
      return { ...bar, high: 100 + halfRange, low: 100 - halfRange };
    });
    const { results } = run(bars);
    expect(results.find(result => result.signals?.atr?.kind === "atrContracting")?.volatility).toBe("contracting");
    const expansion = results.find(result => result.signals?.atr?.kind === "atrExpandingFromQuiet");
    expect(expansion?.signals?.atr?.at).toBe(expansion?.dataThrough);
    expect(expansion?.volatility).toBe("expanding");
  });

  it("tracks VWAP against the same intraday price series and waits for the selected bucket to close", () => {
    const bars = candles(30, i => i < 5 ? 99 + i : i < 10 || i >= 15 ? 85 : 130);
    const vwap = (count: number) => calculateSessionVwap({ candles: bars.slice(0, count), sessionStart: start,
      sessionEnd: start + 3_600_000, completedThrough: bars[count - 1].end, coverageComplete: true });
    expect(vwap(6).signals?.["1m"]).toEqual({ kind: "vwapLost", at: bars[5].end });
    expect(vwap(6).signals?.["5m"]).toBeUndefined();
    expect(vwap(10).signals?.["5m"]).toEqual({ kind: "vwapLost", at: bars[9].end });
    expect(vwap(15).signals?.["5m"]).toEqual({ kind: "vwapReclaimed", at: bars[14].end });
    expect(vwap(15).signals?.["15m"]).toBeUndefined();
    expect(vwap(30).signals?.["15m"]).toEqual({ kind: "vwapLost", at: bars[29].end });
  });

  it("restores legacy checkpoints and keeps the same original timestamp across refreshed reads", () => {
    const bars = candles(38, i => i < 35 ? 100 + i : 65);
    const calculation = run(bars);
    const { signals, priceDirection, ...legacyResult } = calculation.results.at(-1)!;
    const through = bars.at(-1)!.end;
    const restore = (result: typeof calculation.results[number]) => IndicatorSeries.restore({ activationId: "fixture", seriesKey: "fixture:unadjusted",
      timeframe: "1m", completedThrough: through, initialCheckpoint: createIndicatorCheckpoint("1m", "fixture:unadjusted"),
      candles: bars, result });
    expect(restore(legacyResult).snapshot().result).toEqual(calculation.results.at(-1));
    expect(restore({ ...legacyResult, signals, priceDirection }).snapshot().result?.signals?.averages)
      .toEqual({ kind: "emaBearishCross", at: bars[35].end });
  });
});
