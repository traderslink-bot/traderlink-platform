import { describe, expect, it } from "vitest";
import { DEFAULT_DEFINITION, parseDefinition } from "./contracts";
import { completedSessionBars, intradayStructureMetrics } from "./intraday-structure";
import { sessionBounds, sessionMetrics, type ProviderBar, type Window } from "./market-metrics";
import { matchesRule } from "./query";

const minute = 60_000;
const day = { date: "2026-11-13", open: "09:30", close: "16:00" };
const regular = sessionBounds(day, "regular");

function windowAt(elapsed: number, session: Window["session"] = "regular"): Window {
  const bounds = sessionBounds(day, session);
  return { ...bounds, session, date: day.date, asOf: bounds.from + elapsed * minute, closed: false };
}

function bar(timestamp: number, close: number, vwap?: number, volume = 100, high = close, low = close): ProviderBar {
  return { time: timestamp / 1000, open: close, high, low, close, volume, vwap };
}

describe("regular opening ranges", () => {
  it("publishes only completed windows and compares a later price against their inclusive endpoints", () => {
    const bars = [
      bar(regular.from - 5 * minute, 60, 60),
      bar(regular.from, 10, 10, 100, 11, 9),
      bar(regular.from + 5 * minute, 10, 10, 100, 11.5, 8),
      bar(regular.from + 10 * minute, 10, 10, 100, 12, 9),
      bar(regular.from + 15 * minute, 13, 13),
      bar(regular.from + 20 * minute, 99, 99),
    ];
    const boundary = windowAt(15);
    const atBoundary = intradayStructureMetrics(boundary, completedSessionBars(boundary, bars), 10, boundary.asOf);
    expect(atBoundary).toMatchObject({ or5High: 11, or5Low: 9, or15High: 12, or15Low: 8 });
    expect(atBoundary.or15Width).toBe(50);
    expect(atBoundary.or15Position).toBeUndefined();
    expect(atBoundary.or30High).toBeUndefined();

    const later = windowAt(20);
    const observed = completedSessionBars(later, bars);
    expect(intradayStructureMetrics(later, observed, 13, later.asOf).or15Position).toBe(1);
    expect(intradayStructureMetrics(later, observed, 12, later.asOf).or15Position).toBe(0);
    expect(intradayStructureMetrics(later, observed, 8, later.asOf).or15Position).toBe(0);
    expect(intradayStructureMetrics(later, observed, 7, later.asOf).or15Position).toBe(-1);
    expect(intradayStructureMetrics(later, observed, 13, boundary.asOf).or15Position).toBeUndefined();
    expect(intradayStructureMetrics(windowAt(65), bars.slice(1), 13, regular.from + 65 * minute)).toMatchObject({ or60High: 99, or60Low: 8 });
  });

  it("leaves an untraded opening window unavailable even when the stock trades later", () => {
    const window = windowAt(30);
    const later = bar(regular.from + 25 * minute, 9, 9);
    const values = intradayStructureMetrics(window, [later], 9, window.asOf);
    expect(values.or5High).toBeUndefined();
    expect(values.or15High).toBeUndefined();
    expect(values.or30High).toBe(9);
  });
});

describe("session VWAP", () => {
  it("weights by bar volume, uses each bar's cumulative VWAP for a cross, and resets in extended hours", () => {
    const window = windowAt(10, "after_hours");
    const bars = [bar(window.from - 5 * minute, 60, 60), bar(window.from, 9, 10), bar(window.from + 5 * minute, 13, 12, 300)];
    const observed = completedSessionBars(window, bars);
    const values = intradayStructureMetrics(window, observed, 13, window.asOf);
    expect(values).toMatchObject({ sessionVwap: 11.5, vwapPosition: 1, vwapCross: 1 });
    expect(values.vwapDistance).toBeCloseTo((13 / 11.5 - 1) * 100);
    expect(values.or5High).toBeUndefined();
    const down = intradayStructureMetrics(window, [bar(window.from, 11, 10), bar(window.from + 5 * minute, 7, 9)], 7, window.asOf);
    expect(down).toMatchObject({ sessionVwap: 9.5, vwapPosition: -1, vwapCross: -1 });
    const even = intradayStructureMetrics(window, [bar(window.from, 0.3, 0.3, 333)], 0.3, window.asOf);
    expect(even).toMatchObject({ vwapPosition: 0, vwapDistance: 0 });
  });

  it("rejects stale, nonconsecutive and VWAP-missing inputs without fabricating a cross", () => {
    const window = windowAt(15);
    const first = bar(window.from, 9, 10);
    const second = bar(window.from + 5 * minute, 13, 12);
    const last = bar(window.from + 10 * minute, 13, 12);
    expect(intradayStructureMetrics(window, [first, second], 13, window.asOf).vwapCross).toBeUndefined();
    expect(intradayStructureMetrics(window, [first, last], 13, window.asOf).vwapCross).toBeUndefined();
    expect(intradayStructureMetrics(window, [first, second, last], 13, window.asOf).vwapCross).toBe(0);
    expect(intradayStructureMetrics(window, [first, { ...second, vwap: undefined }, last], 13, window.asOf).sessionVwap).toBeUndefined();
    expect(intradayStructureMetrics(window, [{ ...last, volume: 0 }], 13, window.asOf).sessionVwap).toBeUndefined();
  });

  it("includes both metrics in the production session calculation only with complete intraday input", () => {
    const window = windowAt(10);
    const bars = [bar(window.from, 9, 10), bar(window.from + 5 * minute, 13, 12)];
    const input = { window, days: [day], daily: [], intraday: bars, captureAt: window.asOf, dailyComplete: false };
    expect(sessionMetrics({ ...input, intradayComplete: true }).values).toMatchObject({ or5Position: 1, sessionVwap: 11 });
    expect(sessionMetrics({ ...input, intradayComplete: false }).values).toEqual({});
  });

  it("round-trips categorical filters and distinguishes a missing signal from neutral", () => {
    const rule = { metric: "or15Position", operator: "eq", value: -1 } as const;
    expect(parseDefinition({ ...DEFAULT_DEFINITION, rules: [rule] }).rules).toEqual([rule]);
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, rules: [{ ...rule, value: -2 }] })).toThrow("invalid_rule");
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, rules: [{ ...rule, operator: "gt" }] })).toThrow("invalid_rule");
    const row = { symbol: "ABC", exchange: "NASDAQ" as const, values: {} };
    expect(matchesRule(row, rule)).toBeNull();
    expect(matchesRule({ ...row, values: { or15Position: 0 } }, rule)).toBe(false);
  });
});
