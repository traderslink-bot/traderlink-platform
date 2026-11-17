// @vitest-environment node
import { expect, it, vi } from "vitest";
import { collectMarketPack, loadBars, type BarCache } from "./collect-market";
import { sessionBounds } from "./market-metrics";
import { MoomooScreenerData } from "./moomoo-market-data";
import { moomooScreenerLiveUpdates } from "./moomoo-live-worker";
import type { MoomooScreenerOperation } from "./provider-transport";
import { collectMoomooQuotePack } from "./moomoo-quote-pack";
import { validateMarketPack } from "./snapshot-file";

const from = Date.parse("2026-11-13T14:30:00Z"), until = from + 30 * 60_000;
const raw = (time: number, price = 100) => ({ time_key: time, open: price, high: price, low: price,
  close: price, volume: 1_000, turnover: price * 1_000 });

it("paginates raw history and applies only split/consolidation ratios to price and volume", async () => {
  const calls: MoomooScreenerOperation[] = [];
  const token = "a".repeat(48);
  const read = async (operation: MoomooScreenerOperation) => {
    calls.push(operation);
    if (operation.operation === "rehab") return { ret_code: 0, data: { rehabs: [
      { ex_div_date: "2026-11-14", action_types: ["SPLIT", "DIVIDEND"], split_ratio: 0.25, forward_adj_factorA: 0.2 },
      { ex_div_date: "2026-11-15", action_types: ["JOIN"], split_ratio: 2 },
      { ex_div_date: "2026-11-16", action_types: ["DIVIDEND"], split_ratio: 0 },
      { ex_div_date: "2026-11-19", action_types: ["SPLIT"], split_ratio: 0.1 },
    ] } };
    if (operation.operation !== "history") throw Error("unexpected_operation");
    return operation.nextTime
      ? { ret_code: 0, data: { kline_list: [raw(from)], volume_precision: 0 }, pagination: { has_more: false } }
      : { ret_code: 0, data: { kline_list: [raw(until - 300_000)], next_time: until - 300_000, volume_precision: 0 },
        pagination: { has_more: true, next_page_token: token } };
  };
  const data = new MoomooScreenerData(read, "2026-11-17");
  const bars = await loadBars(data, ["ABC"], "5Min", from, until, "2026-11-17");
  expect(bars.rejected.size).toBe(0);
  const candle = bars.grouped.get("ABC")?.get(from / 1_000);
  expect(candle).toMatchObject({ open: 50, close: 50, volume: 2_000, vwap: 50 });
  expect(calls[2]).toMatchObject({ operation: "history", nextTime: until - 300_000, pageToken: token });
});

it("keeps valid peers when one symbol's adjustment or history is unavailable", async () => {
  const data = new MoomooScreenerData(async operation => {
    if (operation.operation === "rehab") return { ret_code: 0, data: { rehabs: [] } };
    if (operation.operation !== "history" || operation.symbol === "BAD") throw Error("no_history");
    return { ret_code: 0, data: { kline_list: [raw(from)] } };
  }, "2026-11-17");
  const bars = await loadBars(data, ["GOOD", "BAD"], "5Min", from, until, "2026-11-17");
  expect(bars.rejected).toEqual(new Set(["BAD"]));
  expect(bars.grouped.get("GOOD")?.size).toBe(1);
});

it("pages back through a date-rounded first page beyond the requested minute cutoff", async () => {
  const data = new MoomooScreenerData(async operation => {
    if (operation.operation === "rehab") return { ret_code: 0, data: { rehabs: [] } };
    if (operation.operation !== "history") throw Error("unexpected_operation");
    return operation.nextTime === undefined
      ? { ret_code: 0, data: { kline_list: [raw(until + 300_000)], next_time: until + 300_000 }, pagination: { has_more: true } }
      : { ret_code: 0, data: { kline_list: [raw(from)] }, pagination: { has_more: false } };
  }, "2026-11-17");
  const result = await loadBars(data, ["ABC"], "5Min", from, until, "2026-11-17");
  expect(result.rejected.size).toBe(0);
  expect(result.grouped.get("ABC")?.size).toBe(1);
});

it("rejects a stuck or incomplete history cursor and stops immediately on a provider change", async () => {
  const read = vi.fn(async (operation: MoomooScreenerOperation) => operation.operation === "rehab"
    ? { ret_code: 0, data: { rehabs: [] } }
    : { ret_code: 0, data: { kline_list: [raw(until - 300_000)], next_time: until - 300_000 }, pagination: { has_more: true } });
  const data = new MoomooScreenerData(read, "2026-11-17");
  expect((await loadBars(data, ["ABC"], "5Min", from, until, "2026-11-17")).rejected.has("ABC")).toBe(true);
  const changed = new MoomooScreenerData(async () => { throw Error("screener_provider_changed"); }, "2026-11-17");
  await expect(loadBars(changed, ["ABC"], "5Min", from, until, "2026-11-17")).rejects.toThrow("screener_provider_changed");
});

it("uses session-specific Moomoo price and VWAP with the actual provider clock", () => {
  const now = Date.parse("2026-11-17T22:00:00Z");
  const window = { session: "after_hours", start: now - 3_600_000, end: now + 2 * 3_600_000 } as const;
  const quote = { code: "US.ABC", update_time: now - 2_000, data_date: "2026-11-17", last_price: 10,
    volume: 10_000, turnover: 100_000, after_price: 12, after_volume: 500, after_turnover: 5_500 };
  const payload = (row: unknown) => ({ ret_code: 0, data: { snapshot_list: [row] } });
  expect(moomooScreenerLiveUpdates(payload(quote), ["ABC"], window, now)).toEqual([
    { symbol: "ABC", price: 12, priceAt: now - 2_000, vwap: 11, vwapAt: now - 2_000 },
  ]);
  expect(moomooScreenerLiveUpdates(payload({ ...quote, update_time: window.start - 1 }), ["ABC"], window, now)).toEqual([]);
  expect(moomooScreenerLiveUpdates(payload({ ...quote, after_price: 0 }), ["ABC"], window, now)).toEqual([]);
  expect(moomooScreenerLiveUpdates(payload({ ...quote, after_turnover: 0 }), ["ABC"], window, now)[0].vwap).toBe(null);
});

it("runs the full metric collector with Moomoo pages and resets another provider's warm caches", async () => {
  const day = 86_400_000;
  const now = Date.parse("2026-11-13T16:37:00Z");
  const calendar = Array.from({ length: 480 }, (_, i) => new Date(now - (479 - i) * day))
    .filter(date => date.getUTCDay() > 0 && date.getUTCDay() < 6)
    .map(date => ({ date: date.toISOString().slice(0, 10), open: "09:30", close: "16:00" }));
  const today = calendar.at(-1)!;
  const open = sessionBounds(today, "regular").from;
  const priorOpen = sessionBounds(calendar.at(-2)!, "regular").from;
  const current = Array.from({ length: 26 }, (_, i) => raw(open + i * 300_000, i < 15 ? 10 : 12));
  const previous = Array.from({ length: 78 }, (_, i) => raw(priorOpen + i * 300_000, 10));
  const baseline = calendar.slice(-11, -1).flatMap(date => Array.from({ length: 26 }, (_, i) => raw(sessionBounds(date, "regular").from + i * 900_000, 10)));
  const cache: BarCache = { key: "", daily: new Map(), intraday: new Map() };
  const read = vi.fn(async (operation: MoomooScreenerOperation) => {
    if (operation.operation === "rehab") return { ret_code: 0, data: { rehabs: [] } };
    if (operation.operation === "snapshots") return { ret_code: 0, data: { snapshot_list: [] } };
    if (operation.operation !== "history") throw Error("unexpected_operation");
    const rows = operation.timeframe === "1Day" ? calendar.map(date => raw(sessionBounds(date, "regular").from, 10))
      : operation.timeframe === "15Min" ? baseline : [...previous, raw(open - 300_000, 8), ...current];
    return { ret_code: 0, data: { kline_list: rows }, pagination: { has_more: false } };
  });
  const input = { data: new MoomooScreenerData(read, today.date), calendar, now, cache,
    stocks: [{ symbol: "ABC", name: "ABC", exchange: "NASDAQ", marketCap: 15_000_000 }] as const, universeDate: today.date };
  const original = await collectMarketPack(input);
  expect(original.snapshots.regular.source).toBe("Alpaca SIP");
  const initialReads = read.mock.calls.filter(([operation]) => operation.operation === "history").length;
  const result = await collectMarketPack({ ...input, source: "Moomoo" });
  expect(read.mock.calls.filter(([operation]) => operation.operation === "history").length).toBeGreaterThan(initialReads);
  expect(result.snapshots.regular.source).toBe("Moomoo");
  expect(result.snapshots.regular.rows[0].values).toMatchObject({ price: 12, cap: 15_000_000, or5High: 10,
    or5Position: 1, vwapPosition: 1, gapFillStatus: -1, premarketHigh: 8, premarketHighBreak: 1, sma200: 10 });
  expect(result.snapshots.regular.rows[0].values.relativeVolume).toBeGreaterThan(1);
  expect(result.snapshots.regular.rows[0].values.recentVolume5).toBeGreaterThan(0);
});

it("offers initial quotes while history warms and leaves unavailable stocks in the universe", async () => {
  const now = Date.parse("2026-11-13T16:37:00Z");
  const calendar = ["2026-11-12", "2026-11-13"].map(date => ({ date, open: "09:30", close: "16:00" }));
  const result = await collectMoomooQuotePack({ now, signal: new AbortController().signal, calendar,
    universeDate: "2026-11-13", stocks: [{ symbol: "ABC", name: "ABC", exchange: "NASDAQ" }, { symbol: "MISSING", name: "Missing", exchange: "NYSE" }],
    read: async () => ({ ret_code: 0, data: { snapshot_list: [{ code: "US.ABC", data_date: "2026-11-13", update_time: now - 1_000,
      last_price: 12, prev_close_price: 10, high_price: 13, low_price: 9, volume: 100, turnover: 1_100, total_market_val: 15_000_000 }] } }),
  });
  expect(result.snapshots.regular).toMatchObject({ source: "Moomoo", partial: true, rows: [
    { symbol: "ABC", priceAt: now - 1_000, values: { price: 12, volume: 100, sessionVwap: 11, vwapPosition: 1, cap: 15_000_000 } },
    { symbol: "MISSING", values: {} },
  ] });
  expect(result.snapshots.regular.rows[0].values.or5High).toBeUndefined();
  expect(result.snapshots.last_regular.rows[0].values.price).toBeUndefined();
  const selection = { provider: "moomoo", revision: 1 } as const;
  expect(validateMarketPack({ ...result, selection }, now, selection)).toMatchObject({ selection });
});
