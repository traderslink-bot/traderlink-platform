import { describe, expect, it } from "vitest";
import { aggregateCandles, alpacaCandle, chartSymbol, chartTimeframe, type Candle } from "./candles";

const bar = (time: number, close: number, volume = 10): Candle => ({ time, open: close, high: close + 1, low: close - 1, close, volume });
describe("Alpaca chart candles", () => {
  it("normalizes symbols and rejects paths, query injection and unsupported intervals", () => {
    expect(chartSymbol(" brk.b ")).toBe("BRK.B");
    for (const value of ["", "AAPL&feed=iex", "../AAPL", "NASDAQ:AAPL"]) expect(() => chartSymbol(value)).toThrow();
    expect(chartTimeframe("5m")).toBe("5m");
    expect(chartTimeframe("4h")).toBe("4h");
    expect(() => chartTimeframe("10s")).toThrow();
  });
  it("uses UTC seconds and rejects malformed OHLCV", () => {
    expect(alpacaCandle({ t: "2026-11-06T14:30:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 15 })?.time).toBe(1793975400);
    expect(alpacaCandle({ t: "invalid", o: 1, h: 2, l: 0.5, c: 1, v: 15 })).toBeNull();
    expect(alpacaCandle({ t: "2026-11-06T14:30:00Z", o: 1, h: 0.8, l: 0.5, c: 1, v: 15 })).toBeNull();
  });
  it("sorts, deduplicates corrected minutes and recomputes bucket volume without double counting", () => {
    const input = [bar(120, 4), bar(60, 2), bar(60, 3, 50), bar(300, 8)];
    expect(aggregateCandles(input, "5m")).toEqual([
      { time: 0, open: 3, high: 5, low: 2, close: 4, volume: 60 },
      { time: 300, open: 8, high: 9, low: 7, close: 8, volume: 10 },
    ]);
    expect(aggregateCandles(input, "4h")).toEqual([{ time: 0, open: 3, high: 9, low: 2, close: 8, volume: 70 }]);
    expect(aggregateCandles(input, "1m")).toHaveLength(3);
    expect(aggregateCandles(input, "1D")).toHaveLength(3);
  });
});
