// @vitest-environment node
import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { readScreenerVwapSeeds, screenerSessionVwap } from "./candle-cache-reader";
import { DEFAULT_DEFINITION } from "./contracts";
import { previewPack } from "./fixture";
import { querySnapshot } from "./query";

const startMs = Date.parse("2026-11-13T14:30:00Z");
const endMs = startMs + 2 * 60_000;
const window = { startMs, endMs };
const basisDate = "2026-11-13";
const testToken = "fixture-screener-bearer";
const complete = { status: "complete", completedThroughMs: endMs };
const partial = { status: "partial", completedThroughMs: startMs + 60_000 };
const bar = { time: startMs / 1_000, open: 10, high: 10, low: 10, close: 10, volume: 100, vwap: 10 };

function packet(bars: Record<string, unknown[]>, coverage: Record<string, unknown>) {
  return { feed: "sip", adjustment: "split", frame: "1m", basisDate, end: endMs, bars, coverage };
}

async function gatewayTest(
  reply: (symbols: string[], index: number) => { payload?: unknown; status?: number },
  run: (env: NodeJS.ProcessEnv, requested: string[][]) => Promise<void>,
) {
  const requested: string[][] = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "", "http://127.0.0.1");
    if (request.method !== "GET" || request.headers.authorization !== `Bearer ${testToken}`
      || url.pathname !== "/screener-candle-bars" || url.searchParams.get("frame") !== "1m"
      || url.searchParams.get("start") !== String(startMs) || url.searchParams.get("end") !== String(endMs)) {
      response.writeHead(400).end();
      return;
    }
    const symbols = (url.searchParams.get("symbols") ?? "").split(",");
    requested.push(symbols);
    const { payload, status = 200 } = reply(symbols, requested.length);
    response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(payload ?? {}));
  });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw Error("missing_test_listener");
    await run({ NODE_ENV: "test", TRADERLINK_ALPACA_GATEWAY_URL: `http://127.0.0.1:${address.port}`,
      TRADERLINK_ALPACA_GATEWAY_TOKEN: testToken }, requested);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe("Screeners gateway VWAP warm-up", () => {
  it("joins complete 1m coverage to the live boundary and runs the real VWAP filter", async () => {
    await gatewayTest(() => ({ payload: packet({ AAA: [bar], BBB: [], CCC: [bar] }, { AAA: complete, BBB: complete, CCC: partial }) }),
      async (environment, requests) => {
        const [result] = await Array.fromAsync(readScreenerVwapSeeds(["AAA", "BBB", "CCC"], window, environment));
        expect(requests).toEqual([["AAA", "BBB", "CCC"]]);
        const live = { fromMs: endMs, basisDate, volume: 100, notional: 1_200 };
        const seeded = result.get("AAA")!;
        expect(seeded).toEqual({ status: "complete", completedThroughMs: endMs,
          seed: { basisDate, completedThroughMs: endMs, volume: 100, notional: 1_000 } });
        const vwap = screenerSessionVwap(seeded.seed, live);
        expect(vwap).toBe(11);
        expect(screenerSessionVwap(seeded.seed, { ...live, fromMs: endMs - 60_000 })).toBeNull();
        expect(screenerSessionVwap(seeded.seed, { ...live, basisDate: "2026-11-12" })).toBeNull();
        expect(screenerSessionVwap(result.get("BBB")!.seed, live)).toBe(12);
        expect(screenerSessionVwap(result.get("CCC")!.seed, live)).toBeNull();
        const snapshot = { ...previewPack(endMs, 1).snapshots.regular, rows: [
          { symbol: "AAA", exchange: "NYSE" as const, values: { price: 12, sessionVwap: vwap!, vwapPosition: 1 } },
          { symbol: "CCC", exchange: "NYSE" as const, values: { price: 12 } },
        ] };
        const resultRows = querySnapshot(snapshot, { ...DEFAULT_DEFINITION, rules: [{ metric: "vwapPosition", operator: "eq", value: 1 }] });
        expect(resultRows.rows.map(row => row.symbol)).toEqual(["AAA"]);
        expect(resultRows.unavailable).toBe(1);
        expect(querySnapshot(snapshot, DEFAULT_DEFINITION).rows.map(row => row.symbol)).toEqual(["AAA", "CCC"]);
      });
  });

  it("invalidates only the symbols with contradictory coverage, bad bars, or missing VWAP", async () => {
    await gatewayTest(() => ({ payload: packet({
      AAA: [bar], BBB: [bar, bar], CCC: [{ ...bar, vwap: undefined }],
      DDD: [{ ...bar, time: endMs / 1_000 }], EEE: [], FFF: [bar],
    }, { AAA: complete, BBB: complete, CCC: complete, DDD: complete, EEE: { ...partial, status: "complete" } }) }),
    async environment => {
      const [result] = await Array.fromAsync(readScreenerVwapSeeds(["AAA", "BBB", "CCC", "DDD", "EEE", "FFF"], window, environment));
      expect(result.get("AAA")?.status).toBe("complete");
      for (const symbol of ["BBB", "CCC", "DDD", "EEE", "FFF"]) {
        expect(result.get(symbol)).toMatchObject({ status: "partial", seed: null });
      }
    });
  });

  it("reads one bounded gateway batch at a time and retains earlier results when the next batch is busy", async () => {
    await gatewayTest((symbols, index) => ({
      status: index === 1 ? 200 : 503,
      payload: packet(Object.fromEntries(symbols.map(symbol => [symbol, []])), Object.fromEntries(symbols.map(symbol => [symbol, complete]))),
    }), async (environment, requests) => {
      const symbols = Array.from({ length: 110 }, (_, index) => `S${index}`);
      const reader = readScreenerVwapSeeds(symbols, window, environment);
      const first = await reader.next();
      expect(requests).toEqual([symbols.slice(0, 50)]);
      if (first.done) throw Error("expected_seed_batch");
      expect(first.value.get("S0")).toMatchObject({ status: "complete", seed: { volume: 0, notional: 0 } });
      await expect(reader.next()).rejects.toThrow("screener_seed_gateway_busy");
      expect(requests).toEqual([symbols.slice(0, 50), symbols.slice(50, 100)]);
    });
  });

  it("rejects a different adjustment basis and prevents an insecure hosted gateway connection", async () => {
    await gatewayTest(() => ({ payload: { ...packet({ AAA: [bar] }, { AAA: complete }), basisDate: "2026-11-12" } }),
      async (environment, requests) => {
        await expect(readScreenerVwapSeeds(["AAA"], window, { ...environment, NODE_ENV: "production" }).next())
          .rejects.toThrow("screener_seed_gateway_invalid");
        expect(requests).toHaveLength(0);
        await expect(readScreenerVwapSeeds(["AAA"], window, environment).next()).rejects.toThrow("screener_seed_gateway_invalid_reply");
        expect(requests).toHaveLength(1);
      });
  });
});
