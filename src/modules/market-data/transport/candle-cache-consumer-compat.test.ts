// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { readScreenerVwapSeeds } from "../../stock-screeners/candle-cache-reader";
import { LiveScreenerVwapWorker } from "../../stock-screeners/live-vwap-worker";
import { CANDLE_CACHE_WIRE_PATH, decodeCandleCacheReply, encodeCandleCacheReply } from "./candle-cache-wire";
import { encodeGatewayWire, gatewayWirePath } from "./gateway-wire";

const start = Date.parse("2026-11-19T09:00:00Z");
const end = start + 120_000;
const window = { startMs: start, endMs: end };
const environment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  TRADERLINK_ALPACA_GATEWAY_URL: "https://gateway.example/",
  TRADERLINK_ALPACA_GATEWAY_TOKEN: "fixture-only",
  TRADERLINK_GATEWAY_CONTRACT: "traderslink.market.1",
};
const bar = { time: start / 1_000, open: 10, high: 12, low: 9, close: 11, volume: 100, vwap: 10 };
const complete = { status: "complete", completedThroughMs: end };
function packet(bars: Record<string, unknown[]>, coverage: Record<string, unknown> = {}) {
  return { feed: "sip", adjustment: "split", frame: "1m", basisDate: "2026-11-19", end,
    historyBars: 960, bars, coverage: { ...Object.fromEntries(Object.keys(bars).map(key => [key, complete])), ...coverage } };
}
afterEach(() => vi.unstubAllGlobals());

describe("authoritative Screeners consumer compatibility", () => {
  it("matches legacy seed results with absent or invalid OHLC and isolates malformed peer histories", async () => {
    const source = packet({
      GOOD: [bar], NOOHLC: [{ time: bar.time, volume: 100, vwap: 10 }],
      BADOHLC: [{ ...bar, open: "not-a-price", high: Infinity, low: null, close: undefined }],
      BADTIME: [{ ...bar, time: "not-a-time" }], BADVOL: [{ ...bar, volume: undefined }],
      BADROW: [null], BADCOVERAGE: [bar],
    }, { BADCOVERAGE: null });
    const symbols = Object.keys(source.bars);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(source)));
    const [legacy] = await Array.fromAsync(readScreenerVwapSeeds(symbols, window, {
      ...environment, TRADERLINK_GATEWAY_CONTRACT: undefined,
    }));
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(encodeCandleCacheReply(source))));
    const [modern] = await Array.fromAsync(readScreenerVwapSeeds(symbols, window, environment));
    expect(modern).toEqual(legacy);
    for (const symbol of ["GOOD", "NOOHLC", "BADOHLC"]) expect(modern.get(symbol)?.status).toBe("complete");
    for (const symbol of ["BADTIME", "BADVOL", "BADROW", "BADCOVERAGE"]) expect(modern.get(symbol)?.status).toBe("partial");
    const decoded = decodeCandleCacheReply(encodeCandleCacheReply(source)) as { bars: Record<string, unknown[]> };
    expect(decoded.bars.NOOHLC[0]).not.toHaveProperty("open");
    expect(decoded.bars.BADOHLC[0]).not.toHaveProperty("high");
  });

  it("isolates a malformed wire row or missing series without manufacturing complete quiet coverage", async () => {
    const wire = encodeCandleCacheReply(packet({ GOOD: [bar], BAD: [bar], MISSING: [bar] })) as {
      data: { candles: Record<string, unknown> };
    };
    wire.data.candles.BAD = [[1, 2, 3]];
    wire.data.candles.MISSING = null;
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(wire)));
    const [result] = await Array.fromAsync(readScreenerVwapSeeds(["GOOD", "BAD", "MISSING"], window, environment));
    expect(result.get("GOOD")?.status).toBe("complete");
    for (const symbol of ["BAD", "MISSING"]) expect(result.get(symbol)).toMatchObject({ status: "partial", seed: null });
  });

  it("keeps valid peers, quiet histories and null boundaries when one symbol lacks usable VWAP", async () => {
    const source = packet({
      GOOD: [bar], MISSING: [{ ...bar, vwap: undefined }], INVALID: [{ ...bar, vwap: "upstream-error" }],
      EMPTY: [], QUIET: [{ ...bar, volume: 0, vwap: undefined }], PARTIAL: [bar],
    }, { PARTIAL: { status: "partial", completedThroughMs: null } });
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(encodeCandleCacheReply(source)));
    vi.stubGlobal("fetch", fetcher);
    const [result] = await Array.fromAsync(readScreenerVwapSeeds([...Object.keys(source.bars), "ABSENT"], window, environment));
    expect(result.get("GOOD")?.seed).toMatchObject({ volume: 100, notional: 1000 });
    for (const symbol of ["EMPTY", "QUIET"]) expect(result.get(symbol)?.seed).toMatchObject({ volume: 0, notional: 0 });
    for (const symbol of ["MISSING", "INVALID", "PARTIAL", "ABSENT"]) expect(result.get(symbol)).toMatchObject({ status: "partial", seed: null });
    expect(result.get("PARTIAL")?.completedThroughMs).toBeNull();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("contains invalid wire weighted values without rejecting healthy peers or inventing VWAP", async () => {
    const wire = encodeCandleCacheReply(packet({ GOOD: [bar], BAD: [bar] })) as { data: { candles: Record<string, unknown[][]> } };
    wire.data.candles.BAD[0][6] = "not-a-price";
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(wire)));
    const [result] = await Array.fromAsync(readScreenerVwapSeeds(["GOOD", "BAD"], window, environment));
    expect(result.get("GOOD")?.status).toBe("complete");
    expect(result.get("BAD")).toMatchObject({ status: "partial", seed: null });
    const decoded = decodeCandleCacheReply(wire) as { bars: Record<string, unknown[]> };
    expect(decoded.bars.BAD[0]).not.toHaveProperty("vwap");
  });

  it("keeps sequential 50-symbol batches and already yielded seeds after a later busy reply", async () => {
    const symbols = Array.from({ length: 110 }, (_, index) => `S${index}`);
    let requestCount = 0;
    const fetcher = vi.fn<typeof fetch>(async (_url, options) => {
      expect(options).toMatchObject({ cache: "no-store", redirect: "error", headers: { Authorization: "Bearer fixture-only" } });
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      return ++requestCount === 1
        ? Response.json(encodeCandleCacheReply(packet(Object.fromEntries(symbols.slice(0, 50).map(symbol => [symbol, []])))))
        : new Response(null, { status: 429 });
    });
    vi.stubGlobal("fetch", fetcher);
    const reader = readScreenerVwapSeeds(symbols, window, environment);
    const first = await reader.next();
    if (first.done) throw Error("expected batch");
    expect(first.value.size).toBe(50);
    expect(first.value.get("S0")?.status).toBe("complete");
    expect(fetcher).toHaveBeenCalledTimes(1);
    await expect(reader.next()).rejects.toThrow("screener_seed_gateway_busy");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetcher.mock.calls[1][0])).searchParams.get("tickers")?.split(",")).toEqual(symbols.slice(50, 100));
    expect(first.value.get("S0")?.status).toBe("complete");
  });

  it.each([429, 503, 502, 401])("preserves status %i classification without forwarding diagnostic text", async status => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private supplier diagnostic", { status })));
    await expect(readScreenerVwapSeeds(["GOOD"], window, environment).next()).rejects.toThrow(
      [429, 503].includes(status) ? "screener_seed_gateway_busy" : "screener_seed_gateway_unavailable");
  });

  it.each([
    { adjustment: "raw" }, { frame: "5m" }, { basisDate: "2026-11-18" }, { end: end + 60_000 },
  ])("rejects changed source boundaries %j", async change => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(encodeCandleCacheReply({ ...packet({ GOOD: [bar] }), ...change }))));
    await expect(readScreenerVwapSeeds(["GOOD"], window, environment).next()).rejects.toThrow("screener_seed_gateway_invalid_reply");
  });

  it("does not turn duplicate timestamps or an incomplete exclusive boundary into usable seeds", async () => {
    const source = packet({ GOOD: [bar], DUPLICATE: [bar, bar], UNFINISHED: [bar] }, {
      UNFINISHED: { status: "complete", completedThroughMs: end - 60_000 },
    });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(encodeCandleCacheReply(source))));
    const [result] = await Array.fromAsync(readScreenerVwapSeeds(Object.keys(source.bars), window, environment));
    expect(result.get("GOOD")?.status).toBe("complete");
    for (const symbol of ["DUPLICATE", "UNFINISHED"]) expect(result.get(symbol)).toMatchObject({ status: "partial", seed: null });
  });

  it("joins epoch-second bars to millisecond live boundaries and seeds a reconnect at its new boundary", async () => {
    const requests: URL[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      requests.push(url);
      if (url.pathname === "/" + gatewayWirePath("trade-revisions")) {
        return Response.json(encodeGatewayWire("trade-revisions", { feed: "sip", symbols: {} }));
      }
      expect(url.pathname).toBe(CANDLE_CACHE_WIRE_PATH);
      const until = Number(url.searchParams.get("until"));
      return Response.json(encodeCandleCacheReply({ ...packet({ GOOD: [bar] }), end: until,
        coverage: { GOOD: { status: "complete", completedThroughMs: until } } }));
    }));
    const worker = new LiveScreenerVwapWorker(["GOOD"], start, end, end + 300_000, environment);
    worker.observe("GOOD", end, 12, 100);
    await worker.warm(() => {}, new AbortController().signal);
    expect(worker.reading("GOOD")).toEqual({ vwap: 11, vwapAt: end });
    const reconnectAt = end + 60_000;
    const reconnect = new LiveScreenerVwapWorker(["GOOD"], start, reconnectAt, end + 300_000, environment);
    expect(reconnect.reading("GOOD")).toBeNull();
    reconnect.observe("GOOD", end, 100, 100); // Before the new boundary: ignored.
    reconnect.observe("GOOD", reconnectAt, 14, 100);
    await reconnect.warm(() => {}, new AbortController().signal);
    expect(reconnect.reading("GOOD")).toEqual({ vwap: 12, vwapAt: reconnectAt });
    const revisionPath = "/" + gatewayWirePath("trade-revisions");
    const reads = (until: number) => [
      [revisionPath, until], [CANDLE_CACHE_WIRE_PATH, until], [revisionPath, until],
    ];
    expect(requests.map(url => [url.pathname, Number(url.searchParams.get("until"))]))
      .toEqual([...reads(end), ...reads(reconnectAt)]);
  });
});
