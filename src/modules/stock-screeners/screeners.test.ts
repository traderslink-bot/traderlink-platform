import { describe, expect, it } from "vitest";
import { DEFAULT_DEFINITION, MAX_RULES, parseDefinition, parseThreshold, type Candidate } from "./contracts";
import { previewPack } from "./fixture";
import { decodeBar, marketWindows, sessionMetrics } from "./market-metrics";
import { querySnapshot, sortRows } from "./query";
import { parseSaved } from "./saved-store";
import { easternDayStart } from "../scanner/alpaca/candles";

describe("stock screener session and evaluation contracts", () => {
  const days = [
    { date: "2026-11-25", open: "09:30", close: "16:00" },
    { date: "2026-11-27", open: "09:30", close: "13:00" },
  ];
  const dayStart = (date: string) => easternDayStart(Date.parse(date + "T12:00:00Z") / 1000);
  const bar = (time: number, price: number) => decodeBar({
    t: new Date(time * 1000).toISOString(), o: price, h: price, l: price, c: price, v: 100, vw: price, n: 2,
  })!;

  it("uses the early regular close as after-hours reference and excludes the forming bucket", () => {
    const now = Date.parse("2026-11-27T18:16:00Z");
    const { latest, windows } = marketWindows(days, now);
    expect(latest).toBe("after_hours");
    expect(windows.regular.until).toBe(Date.parse("2026-11-27T18:00:00Z"));
    expect(windows.after_hours.until).toBe(Date.parse("2026-11-27T22:00:00Z"));
    const after = windows.after_hours;
    const row = sessionMetrics({ window: after, days, captureAt: now, dailyComplete: true, intradayComplete: true, cap: 1e8,
      daily: [bar(dayStart("2026-11-25"), 2), bar(dayStart("2026-11-27"), 4)],
      intraday: [bar(after.from / 1000, 5), bar(after.asOf / 1000, 12)],
      quote: { bp: 4.99, ap: 5.01, t: new Date(now - 61_000).toISOString() } });
    expect(row.values).toMatchObject({ price: 5, change: 25, dollarVolume: 500 });
    expect(row.values.spread).toBeUndefined();
  });

  it("uses the prior split-basis close for premarket and carries Friday through the weekend", () => {
    const atWeekend = marketWindows(days, Date.parse("2026-11-28T16:00:00Z"));
    expect(atWeekend.latest).toBe("last_regular");
    expect(atWeekend.windows.last_regular.date).toBe("2026-11-27");
    const before = atWeekend.windows.premarket;
    const row = sessionMetrics({ window: before, days, captureAt: before.asOf,
      dailyComplete: true, intradayComplete: true, cap: 1e8,
      daily: [bar(dayStart("2026-11-25"), 2), bar(dayStart("2026-11-27"), 5)], intraday: [bar(before.from / 1000, 3)] });
    expect(row.values.change).toBe(50);
    expect(row.values.openGap).toBeUndefined();
  });

  it("keeps unknown prices visible in coverage and applies custom ticker scope before ranking", () => {
    const { snapshots } = previewPack(Date.parse("2026-11-14T21:00:00Z"));
    const screen = parseDefinition({ ...DEFAULT_DEFINITION, universe: "list", tickers: ["ARVX", "XNOD", "ZZUNKN"],
      rules: [{ metric: "price", operator: "between", value: 6, upper: 7 }] });
    const result = querySnapshot(snapshots.last_regular, screen);
    expect(result).toMatchObject({ eligible: 2, evaluated: 1, unavailable: 1, missingTickers: ["ZZUNKN"] });
    expect(result.rows.map(row => row.symbol)).toEqual(["ARVX"]);
    for (const dir of ["asc", "desc"] as const) {
      expect(sortRows(snapshots.last_regular.rows, { metric: "price", dir }).at(-1)?.symbol).toBe("XNOD");
    }
  });

  it("accepts exact units and rejects contradictory ranges or unregistered metrics", () => {
    expect(parseThreshold("250k", "volume")).toBe(250_000);
    expect(parseThreshold("-5%", "change")).toBe(-5);
    expect(parseThreshold("$2,500,000,000", "cap")).toBe(2.5e9);
    expect(parseThreshold("2.5T", "cap")).toBe(2.5e12);
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, rules: [{ metric: "price", operator: "between", value: 8, upper: 6 }] })).toThrow("invalid_rule");
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, columns: ["prototype"] })).toThrow("invalid_screen");
  });

  it("accepts filter units without interpreting amounts in a different unit", () => {
    expect(parseThreshold("50 bps", "spread")).toBe(50);
    expect(parseThreshold("50", "spread")).toBe(50);
    expect(parseThreshold("$ 5M", "cap")).toBe(5e6);
    expect(parseThreshold("2%", "spread")).toBeNaN();
    expect(parseThreshold("30%", "cap")).toBeNaN();
    expect(parseThreshold("2%", "price")).toBeNaN();
    expect(parseThreshold("$50", "change")).toBeNaN();
  });

  it("includes unnamed market caps by default and applies arbitrary size bounds when used", () => {
    const snapshot = previewPack(Date.parse("2026-11-14T21:00:00Z")).snapshots.last_regular;
    const all = querySnapshot(snapshot, DEFAULT_DEFINITION);
    expect(all.rows.some(row => row.values.cap === undefined)).toBe(true);
    expect(all.rows.some(row => (row.values.cap ?? 0) > 1e12)).toBe(true);
    expect(all.rows.some(row => row.values.cap === 2.8e6)).toBe(true);
    const custom = parseDefinition({
      ...DEFAULT_DEFINITION, rules: [{ metric: "cap", operator: "between", value: 375e6, upper: 25e9 }],
    });
    const filtered = querySnapshot(snapshot, custom);
    expect(filtered.rows.length).toBeGreaterThan(0);
    expect(filtered.rows.every(row => row.values.cap! >= 375e6 && row.values.cap! <= 25e9)).toBe(true);
    expect(filtered.unavailable).toBeGreaterThan(all.unavailable);
  });

  it("preserves the effective cap of saved screens created under the previous default", () => {
    const stored = { revision: 1, defaultId: null, screens: [
      { id: "ed83ec16-2e51-4df3-8b06-40accc4402ae", name: "Old screen", definition: { ...DEFAULT_DEFINITION, universe: "small" } },
      { id: "16c9f023-9f9e-484d-a1ae-489ba581f1c7", name: "Old list", definition: { ...DEFAULT_DEFINITION, universe: "list", tickers: ["ARVX"] } },
    ] };
    const { screens } = parseSaved(stored, true);
    expect(screens.map(screen => screen.definition.universe)).toEqual(["all", "list"]);
    expect(screens.map(screen => screen.definition.rules)).toEqual(
      Array.from({ length: 2 }, () => [{ metric: "cap", operator: "lt", value: 200e6 }]),
    );
  });

  it("combines required filters with any-of groups and keeps unknown exclusions unavailable", () => {
    const row = (symbol: string, exchange: Candidate["exchange"], values: Candidate["values"]): Candidate => ({ symbol, exchange, values: { price: 5, ...values } });
    const snapshot = { ...previewPack(Date.parse("2026-11-14T21:00:00Z"), 1).snapshots.last_regular, rows: [
      row("FIRST", "NASDAQ", { volume: 500, vwapPosition: 1 }),
      row("SECOND", "NYSE", { volume: 500, vwapPosition: -1, or15Position: 1 }),
      row("UNKNOWN", "NASDAQ", { vwapPosition: 1 }),
      row("UNKNOWNBRANCH", "NYSE", { volume: 500, vwapPosition: -1 }),
      row("REJECTED", "NASDAQ", { volume: 100, vwapPosition: 1 }),
      row("BELOW", "NYSE", { volume: 500, vwapPosition: -1, or15Position: -1 }),
      row("LOWPRICE", "NYSE", { price: 4, volume: 500, vwapPosition: 1, change: 1 }),
      row("OUTSIDE", "IEX", { volume: 500, vwapPosition: 1 }),
    ] };
    const definition = parseDefinition({ ...DEFAULT_DEFINITION, exchanges: ["NASDAQ", "NYSE"],
      rules: [{ metric: "volume", operator: "between", value: 50, upper: 100, exclude: true }],
      groups: [
        [{ metric: "vwapPosition", operator: "eq", value: 1 }, { metric: "or15Position", operator: "eq", value: 1 }],
        [{ metric: "change", operator: "gt", value: 2 }, { metric: "price", operator: "gte", value: 5 }],
      ],
    });
    const result = querySnapshot(snapshot, definition);
    expect(result.rows.map(item => item.symbol)).toEqual(["FIRST", "SECOND"]);
    expect(result).toMatchObject({ eligible: 7, evaluated: 5, unavailable: 2 });
  });

  it("caps the total rules and validates groups, exclusions and both sorts", () => {
    const rule = { metric: "price", operator: "gte", value: 1 };
    expect(parseDefinition({ ...DEFAULT_DEFINITION, rules: [rule], groups: [], sort: DEFAULT_DEFINITION.sort })).toEqual({
      ...DEFAULT_DEFINITION, rules: [rule],
    });
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, rules: Array(MAX_RULES).fill(rule), groups: [[rule]] })).toThrow("invalid_screen");
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, groups: [[]] })).toThrow("invalid_screen");
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, groups: [[{ ...rule, exclude: "true" }]] })).toThrow("invalid_rule");
    expect(() => parseDefinition({ ...DEFAULT_DEFINITION, sort: { ...DEFAULT_DEFINITION.sort, secondary: DEFAULT_DEFINITION.sort } })).toThrow("invalid_screen");
  });

  it("sorts ties by a second metric and leaves missing values last at each level", () => {
    const rows: Candidate[] = [
      { symbol: "A", exchange: "NYSE", values: { price: 1, volume: 40 } },
      { symbol: "B", exchange: "NYSE", values: { price: 1, volume: 80 } },
      { symbol: "C", exchange: "NYSE", values: { price: 1 } },
      { symbol: "D", exchange: "NYSE", values: { volume: 100 } },
      { symbol: "E", exchange: "NYSE", values: { price: 1, volume: 80 } },
    ];
    expect(sortRows(rows, { metric: "price", dir: "asc", secondary: { metric: "volume", dir: "desc" } }).map(row => row.symbol))
      .toEqual(["B", "E", "A", "C", "D"]);
    expect(sortRows(rows, { metric: "price", dir: "desc", secondary: { metric: "volume", dir: "asc" } }).map(row => row.symbol))
      .toEqual(["A", "B", "E", "C", "D"]);
  });
});
