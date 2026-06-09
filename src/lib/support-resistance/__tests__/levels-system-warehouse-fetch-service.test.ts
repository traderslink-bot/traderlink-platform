import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  CandleProviderResponse,
  HistoricalFetchRequest,
} from "levels-system-v2/support-resistance-engine";
import { LevelsSystemWarehouseBackedFetchService } from "../levels-system-warehouse-fetch-service";

let tempDir = "";

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "levels-system-warehouse-fetch-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function candle(timestamp: number, price: number) {
  return {
    close: price,
    high: price + 0.1,
    low: price - 0.1,
    open: price,
    timestamp,
    volume: 1000,
  };
}

function response(args: {
  candles: ReturnType<typeof candle>[];
  request: HistoricalFetchRequest;
}): CandleProviderResponse {
  return {
    actualBarsReturned: args.candles.length,
    candles: args.candles,
    completenessStatus:
      args.candles.length >= args.request.lookbackBars
        ? "complete"
        : args.candles.length > 0
          ? "partial"
          : "empty",
    fetchEndTimestamp: Date.now(),
    fetchStartTimestamp: Date.now(),
    provider: "ibkr",
    requestedEndTimestamp: args.request.endTimeMs ?? Date.now(),
    requestedLookbackBars: args.request.lookbackBars,
    requestedStartTimestamp:
      (args.request.endTimeMs ?? Date.now()) -
      args.request.lookbackBars * 300_000,
    sessionMetadataAvailable: args.request.timeframe === "5m",
    sessionSummary: null,
    stale: false,
    symbol: args.request.symbol,
    timeframe: args.request.timeframe,
    validationIssues: [],
  };
}

function writeWarehouseRows(args: {
  candles: ReturnType<typeof candle>[];
  dateKey: string;
  symbol: string;
  timeframe: string;
}) {
  const directory = join(tempDir, "ibkr", args.symbol, args.timeframe);
  const filePath = join(directory, `${args.dateKey}.jsonl`);

  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    filePath,
    `${args.candles
      .map((item) =>
        JSON.stringify({
          ...item,
          adjustmentMode: "raw",
          provider: "ibkr",
          sourceFetchedAt: Date.now(),
          symbol: args.symbol,
          timeframe: args.timeframe,
        }),
      )
      .join("\n")}\n`,
    "utf8",
  );
}

describe("LevelsSystemWarehouseBackedFetchService", () => {
  it("uses partial daily warehouse candles without calling IBKR", async () => {
    const endTimeMs = Date.parse("2026-05-08T00:00:00.000Z");
    const storedCandles = [
      candle(Date.parse("2026-05-06T00:00:00.000Z"), 3),
      candle(Date.parse("2026-05-07T00:00:00.000Z"), 4),
      candle(endTimeMs, 5),
    ];
    let delegateCalls = 0;

    writeWarehouseRows({
      candles: storedCandles,
      dateKey: "2026-05-08",
      symbol: "PMAX",
      timeframe: "daily",
    });

    const service = new LevelsSystemWarehouseBackedFetchService({
      delegate: {
        async fetchCandles(request) {
          delegateCalls += 1;
          return response({ candles: [], request });
        },
        getProviderName: () => "ibkr",
      },
      mode: "read_write",
      warehouseDirectoryPath: tempDir,
    });
    const result = await service.fetchCandles({
      endTimeMs,
      lookbackBars: 520,
      symbol: "PMAX",
      timeframe: "daily",
    });

    expect(delegateCalls).toBe(0);
    expect(result.providerMetadata?.durableWarehouse).toBe("partial_hit");
    expect(result.candles).toHaveLength(3);
  });

  it("fetches and writes missing 5m candles", async () => {
    const endTimeMs = Date.parse("2026-05-08T14:00:00.000Z");
    const freshCandles = [
      candle(endTimeMs - 600_000, 10),
      candle(endTimeMs - 300_000, 10.2),
      candle(endTimeMs, 10.4),
    ];
    let delegateCalls = 0;
    const service = new LevelsSystemWarehouseBackedFetchService({
      delegate: {
        async fetchCandles(request) {
          delegateCalls += 1;
          return response({ candles: freshCandles, request });
        },
        getProviderName: () => "ibkr",
      },
      mode: "read_write",
      warehouseDirectoryPath: tempDir,
    });
    const result = await service.fetchCandles({
      endTimeMs,
      lookbackBars: 3,
      symbol: "MISS",
      timeframe: "5m",
    });
    const written = readFileSync(
      join(tempDir, "ibkr", "MISS", "5m", "2026-05-08.jsonl"),
      "utf8",
    );

    expect(delegateCalls).toBe(1);
    expect(result.providerMetadata?.durableWarehouse).toBe("write_through");
    expect(written).toContain('"symbol":"MISS"');
    expect(written).toContain('"timeframe":"5m"');
  });

  it("uses partial real 5m warehouse candles without calling IBKR", async () => {
    const endTimeMs = Date.parse("2026-05-08T20:00:00.000Z");
    const storedCandles = [
      candle(endTimeMs - 600_000, 10),
      candle(endTimeMs - 300_000, 10.2),
      candle(endTimeMs, 10.4),
    ];
    let delegateCalls = 0;

    writeWarehouseRows({
      candles: storedCandles,
      dateKey: "2026-05-08",
      symbol: "RDW",
      timeframe: "5m",
    });

    const service = new LevelsSystemWarehouseBackedFetchService({
      delegate: {
        async fetchCandles(request) {
          delegateCalls += 1;
          return response({ candles: [], request });
        },
        getProviderName: () => "ibkr",
      },
      mode: "read_write",
      warehouseDirectoryPath: tempDir,
    });
    const result = await service.fetchCandles({
      endTimeMs,
      lookbackBars: 120,
      symbol: "RDW",
      timeframe: "5m",
    });

    expect(delegateCalls).toBe(0);
    expect(result.providerMetadata?.durableWarehouse).toBe("partial_hit");
    expect(result.candles).toHaveLength(3);
  });
});
