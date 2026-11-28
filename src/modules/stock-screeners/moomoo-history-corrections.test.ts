// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { correctMoomooScreenerHistory } from "./moomoo-history-corrections";
import { MoomooScreenerData } from "./moomoo-market-data";
import { loadBars } from "./collect-market";
import type { Candle } from "../scanner/alpaca/candles";
import type { DurableTradeCorrections } from "../scanner/alpaca/durable-trade-corrections";
import type { MoomooDataRequest } from "../market-data/server/moomoo-bridge";
import { screenerControlPost } from "./private-publication-http";
import { decodeScreenerPrivateLinkedReply, encodeScreenerPrivateOperation } from "./private-publication-wire";
import { ScreenerProviderTransport } from "./provider-transport";

const upstream = vi.hoisted(() => ({ native: vi.fn(), evidence: vi.fn() }));
vi.mock("../scanner/alpaca/client", async importOriginal => ({ ...await importOriginal<typeof import("../scanner/alpaca/client")>(),
  readAlpacaTradeCorrectionEvidence: upstream.evidence }));
vi.mock("../market-data/server/moomoo-bridge", async importOriginal => ({ ...await importOriginal<typeof import("../market-data/server/moomoo-bridge")>(),
  requestMoomooMarketData: upstream.native }));

const start = Date.parse("2026-11-27T12:00:00Z"), now = Date.parse("2026-12-03T15:00:00Z"), stop = new AbortController().signal;
const before: Candle = { time: start / 1000 + 120, open: 3.21, high: 38, low: 3.21, close: 12.85, volume: 696132 };
const after: Candle = { ...before, high: 3.8399, close: 3.82, volume: 390678 };
const peer: Candle = { time: start / 1000 + 180, open: 7, high: 7.41, low: 7, close: 7.3, volume: 1000 };
const interval: Candle = { time: start / 1000, open: before.open, high: before.high, low: before.low, close: peer.close, volume: before.volume + peer.volume };
const raw = (bar: Candle, seconds: number, precision = 1) => ({ time_key: (bar.time + seconds) * 1000,
  open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume * 10 ** precision, turnover: 12345 });
const payload = (rows: unknown[], precision = 1) => ({ ret_code: 0, data: { kline_list: rows, volume_precision: precision }, pagination: { has_more: false } });
const operation = (symbol: string, timeframe: "5Min" | "15Min" | "1Day" = "5Min") => ({ operation: "history" as const, symbol, timeframe,
  start, end: start + (timeframe === "15Min" ? 900_000 : 300_000) - 1, correctionRevision: "f".repeat(64) });
function dependencies(symbol: string, bars = [before, peer]) {
  const evidence: DurableTradeCorrections = { symbol, feed: "sip", adjustment: "raw", generation: 5,
    rows: [{ symbol, minute: before.time, before, bar: after, correctionRevision: 5 }] };
  return { evidence, readEvidence: vi.fn(async () => evidence),
    readNative: vi.fn<(request: MoomooDataRequest) => Promise<Record<string, unknown>>>(async () => payload(bars.map(bar => raw(bar, 60)))) };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); upstream.native.mockReset(); upstream.evidence.mockReset(); });

it("makes no evidence or minute request for ordinary native history without a correction hint", async () => {
  const read = dependencies("ORDINARY"), body = payload([raw(interval, 300)]);
  const request: MoomooDataRequest = { operation: "history", symbol: "ORDINARY", timeframe: "5Min", start, end: start + 300_000 - 1 };
  expect(await correctMoomooScreenerHistory(request, body, {}, stop, read, now)).toBe(body);
  expect(read.readEvidence).not.toHaveBeenCalled(); expect(read.readNative).not.toHaveBeenCalled();
});

it.each(["5Min", "15Min"] as const)("repairs a sparse comparable raw %s bucket before applying the broker's own split factor", async timeframe => {
  const symbol = timeframe === "5Min" ? "COMPARABLE" : "CMPFIFTEEN", read = dependencies(symbol);
  const seconds = timeframe === "5Min" ? 300 : 900;
  const corrected = await correctMoomooScreenerHistory(operation(symbol, timeframe), payload([raw(interval, seconds)]), {}, stop, read, now);
  expect(read.readNative).toHaveBeenCalledTimes(1);
  expect(read.readNative.mock.calls[0][0]).toMatchObject({ operation: "history", symbol, timeframe: "1Min", start, end: start + seconds * 1000 - 1 });
  const adapter = new MoomooScreenerData(async request => request.operation === "rehab"
    ? { ret_code: 0, data: { rehabs: [{ ex_div_date: "2026-12-01", action_types: ["JOIN"], split_ratio: 2 }] } } : corrected, "2026-12-03");
  const result = await loadBars(adapter, [symbol], timeframe, start, start + seconds * 1000 - 1, "2026-12-03");
  expect(result.rejected.size).toBe(0);
  expect(result.grouped.get(symbol)!.get(start / 1000)).toMatchObject({ high: 14.82, volume: 195839 });
  expect(result.grouped.get(symbol)!.get(start / 1000)?.vwap).toBeUndefined();
  expect(read.readEvidence.mock.calls).toHaveLength(2);
});

it("keeps incompatible native observations instead of relabelling a foreign provider's correction", async () => {
  const native = { ...before, high: 31 }, read = dependencies("INCOMPATIBLE", [native, peer]);
  const body = payload([raw({ ...interval, high: 31 }, 300)]);
  const result = await correctMoomooScreenerHistory(operation("INCOMPATIBLE"), body, {}, stop, read, now);
  expect(result).toEqual(body);
});

it("rejects a native aggregate which cannot be reproduced by its own complete minutes", async () => {
  const read = dependencies("UNQUALIFIED");
  await expect(correctMoomooScreenerHistory(operation("UNQUALIFIED"), payload([raw({ ...interval, high: 39 }, 300)]), {}, stop, read, now))
    .rejects.toThrow("screener_native_correction_unqualified");
});

it("rejects an incomplete minute page and a correction generation race", async () => {
  const incomplete = dependencies("INCOMPLETE");
  incomplete.readNative.mockResolvedValue({ ...payload([]), pagination: { has_more: true } });
  await expect(correctMoomooScreenerHistory(operation("INCOMPLETE"), payload([raw(interval, 300)]), {}, stop, incomplete, now)).rejects.toThrow();
  const raced = dependencies("RACED");
  raced.readEvidence.mockResolvedValueOnce(raced.evidence).mockResolvedValue({ ...raced.evidence, generation: 6 });
  await expect(correctMoomooScreenerHistory(operation("RACED"), payload([raw(interval, 300)]), {}, stop, raced, now)).rejects.toThrow("screener_correction_changed");
});

it("removes a confirmed cancelled-only native interval instead of constructing a zero bar", async () => {
  const read = dependencies("REMOVED", [before]); read.evidence.rows[0].bar = null;
  const body = payload([raw({ ...before, time: start / 1000 }, 300)]);
  const result = await correctMoomooScreenerHistory(operation("REMOVED"), body, {}, stop, read, now);
  expect(result).toMatchObject({ data: { kline_list: [] } });
});

it("uses cache-only native daily witnesses and keeps unrelated days while unknown affected days are absent", async () => {
  const day = Date.parse("2026-11-27T05:00:00Z") / 1000, oldDay = { ...interval, time: day }, newDay = { ...oldDay, high: 7.41, volume: 391678 };
  const read = dependencies("DAILY");
  const body = payload([{ ...raw(oldDay, 0), time_key: Date.parse("2026-11-27T00:00:00Z"), date: 20261127 }]);
  const request = { ...operation("DAILY", "1Day"), start: day * 1000, end: day * 1000 + 86_400_000 - 1 };
  expect(await correctMoomooScreenerHistory(request, body, {}, stop, read, now)).toMatchObject({ data: { kline_list: [] } });
  read.evidence.nativeDays = [{ day, before: oldDay, bar: newDay }];
  const fixed = await correctMoomooScreenerHistory(request, body, {}, stop, read, now);
  expect(fixed).toMatchObject({ data: { kline_list: [{ high: 7.41, volume: 3916780 }] } });
  for (const [request] of read.readEvidence.mock.calls as unknown as [Record<string, unknown>][]) {
    expect(request.daily).toBe(true); expect(request.replayDaily).toBeUndefined();
  }
  expect(read.readNative).not.toHaveBeenCalled();
});

it("keeps bounded native proof work across retries instead of restarting the same first 24 buckets", async () => {
  const symbol = "BUDGET", read = dependencies(symbol);
  const native = Array.from({ length: 25 }, (_, index) => ({ ...interval, time: start / 1000 + index * 300 }));
  read.evidence.rows = native.map(bar => ({ symbol, minute: bar.time + 120, before: { ...before, time: bar.time + 120 },
    bar: { ...after, time: bar.time + 120 }, correctionRevision: 5 }));
  read.readNative.mockImplementation(async request => {
    if (request.operation !== "history") throw Error("unexpected_request");
    const bar = native.find(bar => bar.time * 1000 === request.start)!;
    return payload([raw({ ...before, time: bar.time + 120 }, 60), raw({ ...peer, time: bar.time + 180 }, 60)]);
  });
  const request = { ...operation(symbol), end: start + 25 * 300_000 - 1 }, body = payload(native.map(bar => raw(bar, 300)));
  await expect(correctMoomooScreenerHistory(request, body, {}, stop, read, now)).rejects.toThrow("screener_native_correction_unqualified");
  expect(read.readNative).toHaveBeenCalledTimes(24);
  const fixed = await correctMoomooScreenerHistory(request, body, {}, stop, read, now);
  expect(read.readNative).toHaveBeenCalledTimes(25);
  expect(fixed).toMatchObject({ data: { kline_list: Array.from({ length: 25 }, () => ({ high: 7.41 })) } });
});

it.each([false, true])("binds the real private history hook to provider revision and authentication, neutral=%s", async neutral => {
  const folder = mkdtempSync(join(tmpdir(), "screeners-correction-http-")), chosen = { provider: "moomoo", revision: 1 } as const;
  const token = "screeners-private-history-fixture-token-0123456789", providerFolder = join(folder, "market-data-providers-v1", "screeners");
  mkdirSync(providerFolder, { recursive: true });
  writeFileSync(join(providerFolder, "provider.json"), JSON.stringify(chosen));
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(folder, "fixture.sqlite"));
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "1");
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN", token);
  vi.stubEnv("TRADERLINK_SCREENERS_PRIVATE_CONTRACT", "traderslink.screeners.1");
  const symbol = neutral ? "NEUTRALHOOK" : "LEGACYHOOK", request = operation(symbol), read = dependencies(symbol);
  upstream.evidence.mockResolvedValue(read.evidence);
  upstream.native.mockImplementation(async (input: MoomooDataRequest) => payload(input.operation === "history" && input.timeframe === "1Min"
    ? [raw(before, 60), raw(peer, 60)] : [raw(interval, 300)]));
  const http = (body: unknown, authorization = token) => new Request("https://fixture.invalid/api/internal/market-data?feature=screeners", {
    method: "POST", headers: { Authorization: "Bearer " + authorization }, body: JSON.stringify(body) });
  const body = neutral ? encodeScreenerPrivateOperation(request, chosen, token) : { feature: "screeners", ...chosen, ...request };
  try {
    expect((await screenerControlPost(http(body, "wrong"), neutral)).status).toBe(404);
    expect(upstream.native).not.toHaveBeenCalled();
    const result = await screenerControlPost(http(body), neutral);
    expect(result.status).toBe(200);
    const value = await result.json();
    const native = neutral ? decodeScreenerPrivateLinkedReply("history", value, chosen, token) : value.payload;
    expect(native).toMatchObject({ data: { kline_list: [{ high: 7.41, volume: 3916780, turnover: 0 }] } });
    upstream.native.mockClear(); upstream.evidence.mockClear();
    const stale = { provider: "moomoo", revision: 0 } as const;
    const staleBody = neutral ? encodeScreenerPrivateOperation(request, stale, token) : { feature: "screeners", ...stale, ...request };
    expect((await screenerControlPost(http(staleBody), neutral)).status).toBe(409);
    expect(upstream.native).not.toHaveBeenCalled(); expect(upstream.evidence).not.toHaveBeenCalled();
    const malformed = { ...request, correctionRevision: "bad" };
    const badBody = neutral ? encodeScreenerPrivateOperation(malformed, chosen, token) : { feature: "screeners", ...chosen, ...malformed };
    expect((await screenerControlPost(http(badBody), neutral)).status).toBe(400);
    expect(upstream.native).not.toHaveBeenCalled();
    upstream.native.mockImplementation(async (input: MoomooDataRequest) => payload(input.operation === "history" && input.timeframe === "1Min"
      ? [raw(before, 60), raw(peer, 60)] : [raw({ ...interval, high: 39 }, 300)]));
    expect((await screenerControlPost(http(body), neutral)).status).toBe(422);
    const transport = new ScreenerProviderTransport("https://fixture.invalid", token, async () => new Response(null, { status: 422 }));
    await expect(transport.moomoo(chosen, request, stop)).rejects.toThrow("screener_history_correction_unqualified");
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
