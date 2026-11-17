// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { runMoomooScreenerSession } from "./moomoo-live-worker";
import { parseScreenerMoomooUniverse, type ScreenerProviderTransport } from "./provider-transport";
import { ScreenerSnapshotCollector } from "./provider-snapshot-collector";

vi.mock("node:timers/promises", () => ({
  setTimeout(ms: number, _: undefined, { signal }: { signal: AbortSignal }) {
    return new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal.reason); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  },
}));

const start = Date.parse("2026-11-13T14:30:00Z"), now = start + 60_000;
const window = { session: "regular", start, end: start + 390 * 60_000 } as const;
const selection = { provider: "moomoo", revision: 1 } as const;
const symbols = Array.from({ length: 401 }, (_, i) => "A" + String(i).padStart(3, "0"));
const payload = (symbol = "ABC") => ({ ret_code: 0, data: { snapshot_list: [
  { code: "US." + symbol, update_time: now, data_date: "2026-11-13", last_price: 12, volume: 100, turnover: 1_100 },
] } });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it.each([
  { responseMs: 250, spacingMs: 1_500, starts: [0, 1_500, 6_750] },
  { responseMs: 2_200, spacingMs: 1_500, starts: [0, 2_200, 9_400] },
  { responseMs: 250, spacingMs: 3_000, starts: [0, 3_000, 8_250] },
])("matches the retained batch/pass cadence for $responseMs ms replies and $spacingMs ms spacing", async ({ responseMs, spacingMs, starts }) => {
  vi.useFakeTimers(); vi.setSystemTime(now);
  const stop = new AbortController(), recorded: number[] = [];
  const completed: number[] = [];
  const disconnected = vi.fn();
  const finished = runMoomooScreenerSession({ symbols, window, signal: stop.signal, spacingMs,
    read: async batch => {
      recorded.push(Date.now() - now);
      await new Promise(resolve => setTimeout(resolve, responseMs));
      expect(batch.length).toBeLessThanOrEqual(400);
      return payload(batch[0]);
    }, publish() {}, connected() {}, disconnected,
    completedPass: async () => { completed.push(Date.now() - now); },
  }).catch(error => error);
  try {
    await vi.advanceTimersByTimeAsync(starts[2] + 1);
    expect(recorded).toEqual(starts);
    expect(recorded[2] - completed[0]).toBe(5_000);
  } finally { stop.abort(); await vi.advanceTimersByTimeAsync(responseMs); await finished; }
  expect(disconnected).toHaveBeenCalledOnce();
});

it("continues healthy batches after a failure and loads the next pass from the refreshed app roster", async () => {
  vi.useFakeTimers(); vi.setSystemTime(now);
  const stop = new AbortController(), batches: string[][] = [], observed: string[] = [];
  let passes = 0;
  const finished = runMoomooScreenerSession({ symbols, window, signal: stop.signal,
    universe: async () => ({ symbols: passes === 0 ? symbols : ["NEW"], spacingMs: 1_500 }),
    read: async batch => {
      batches.push(batch);
      if (batches.length === 1) throw Error("transient_batch_failure");
      return payload(batch[0]);
    }, publish: rows => { observed.push(...rows.map(row => row.symbol)); }, connected() {}, disconnected() {},
    completedPass: async () => { passes++; },
  }).catch(error => error);
  try {
    await vi.advanceTimersByTimeAsync(6_501);
    expect(batches.map(batch => batch.length)).toEqual([400, 1, 1]);
    expect(observed).toEqual([symbols[400], "NEW"]);
  } finally { stop.abort(); await finished; }
});

it("uses the persisted app roster, retains its source date and applies the approved $200M eligibility", () => {
  const value = { ...selection, tradingDate: "2026-11-13", sourceTradingDate: "2026-11-12", spacingMs: 1_500,
    stocks: [
      { symbol: "LOW", exchange: "NASDAQ", marketCapAtCollection: 5_000_000 },
      { symbol: "BOUND", exchange: "NYSE", marketCapAtCollection: 200_000_000 },
      { symbol: "HIGH", exchange: "AMEX", marketCapAtCollection: 300_000_000 },
    ] };
  const result = parseScreenerMoomooUniverse(value, selection, "2026-11-13");
  expect(result.stocks.map(stock => stock.symbol)).toEqual(["LOW", "BOUND"]);
  expect(result).toMatchObject({ listingDate: "2026-11-12", partialCaps: true, spacingMs: 1_500 });
  expect(() => parseScreenerMoomooUniverse({ ...value, revision: 0 }, selection, "2026-11-13")).toThrow("screener_provider_changed");
  expect(() => parseScreenerMoomooUniverse({ ...value, spacingMs: 1 }, selection, "2026-11-13")).toThrow();
});

it("reuses live quotes for bootstrap and metrics without making a second snapshot request", async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now);
  const network = vi.fn(async () => { throw Error("unexpected_independent_listing_request"); });
  vi.stubGlobal("fetch", network);
  const days = Array.from({ length: 480 }, (_, i) => new Date(now - (479 - i) * 86_400_000))
    .filter(date => date.getUTCDay() > 0 && date.getUTCDay() < 6)
    .map(date => ({ time: date.toISOString().slice(0, 10), trade_date_type: "WHOLE", trade_second: 23_400 }));
  const universe = vi.fn(async () => ({ listingDate: "2026-11-02", stocks: [{ symbol: "ABC", exchange: "NASDAQ", name: "ABC", marketCap: 5_000_000 }],
    partialCaps: true, spacingMs: 1_500 }));
  const moomoo = vi.fn(async (_: unknown, operation: { operation: string }) => operation.operation === "calendar"
    ? { ret_code: 0, data: { trading_days: days } } : { ret_code: -1 });
  const transport = { universe, moomoo } as unknown as ScreenerProviderTransport;
  const collector = new ScreenerSnapshotCollector(transport, selection, new AbortController().signal);
  collector.observeMoomooSnapshots(payload(), ["ABC"]);
  const initial = await collector.initialMoomooPack();
  expect(initial.snapshots.regular.rows[0].values).toMatchObject({ price: 12, sessionVwap: 11 });
  await expect(collector.collect()).rejects.toThrow("market_pack_unavailable");
  expect(network).not.toHaveBeenCalled();
  expect(moomoo.mock.calls.some(([, operation]) => operation.operation === "snapshots")).toBe(false);
  vi.setSystemTime(now + 5_001);
  await collector.referenceData();
  expect(universe).toHaveBeenCalledTimes(2);
  expect(moomoo.mock.calls.filter(([, operation]) => operation.operation === "calendar")).toHaveLength(1);
});
