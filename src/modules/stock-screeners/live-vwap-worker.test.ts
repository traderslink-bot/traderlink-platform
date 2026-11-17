// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { LiveScreenerVwapWorker } from "./live-vwap-worker";
import type { readScreenerVwapSeeds, SeedCoverage } from "./candle-cache-reader";

const start = Date.parse("2026-11-16T14:30:00Z");
const boundary = start + 60_000;
const end = start + 360_000;
const basisDate = "2026-11-16";
const abort = new AbortController();

function seeded(volume: number, notional: number) {
  return { status: "complete" as const, completedThroughMs: boundary,
    seed: { basisDate, completedThroughMs: boundary, volume, notional } };
}

describe("live Screeners VWAP worker", () => {
  it("counts an eligible trade at the exclusive seed boundary once and keeps incomplete tickers out of VWAP", async () => {
    const read = vi.fn<typeof readScreenerVwapSeeds>(async function* () {
      yield new Map<string, SeedCoverage>([["AAA", seeded(100, 1000)], ["BBB", { status: "partial", completedThroughMs: start, seed: null }]]);
    });
    const worker = new LiveScreenerVwapWorker(["AAA", "BBB"], start, boundary, end, { NODE_ENV: "test" }, read);
    const published = vi.fn();
    worker.observe("AAA", boundary - 1, 90, 100);
    worker.observe("AAA", boundary, 12, 100);
    worker.observe("AAA", end, 90, 100);
    expect(worker.reading("AAA")).toBeNull();
    await worker.warm(published, abort.signal);
    expect(read.mock.calls[0]?.[1]).toEqual({ startMs: start, endMs: boundary });
    expect(published).toHaveBeenCalledExactlyOnceWith(["AAA"]);
    expect(worker.reading("AAA")).toEqual({ vwap: 11, vwapAt: boundary });
    expect(worker.reading("BBB")).toBeNull();
    worker.invalidate("AAA");
    expect(worker.reading("AAA")).toBeNull();
  });

  it("keeps completed seeds on a busy reply and retries only missing symbols", async () => {
    const seed = vi.fn<typeof readScreenerVwapSeeds>(async function* (symbols) {
      if (symbols.length === 2) {
        yield new Map([["AAA", seeded(100, 1234)]]);
        throw Error("screener_seed_gateway_busy");
      }
      yield new Map([["BBB", seeded(0, 0)]]);
    });
    const worker = new LiveScreenerVwapWorker(["AAA", "BBB"], start, boundary, end, { NODE_ENV: "test" }, seed);
    await worker.warm(() => {}, abort.signal);
    expect(seed.mock.calls.map(([symbols]) => symbols)).toEqual([["AAA", "BBB"], ["BBB"]]);
    expect(worker.reading("AAA")).toEqual({ vwap: 12.34, vwapAt: boundary });
    expect(worker.reading("BBB")).toBeNull();
    worker.observe("BBB", boundary, 4, 2);
    expect(worker.reading("BBB")).toEqual({ vwap: 4, vwapAt: boundary });
  });

  it("can start directly at the opening boundary and discards interrupted session totals on reconnect", async () => {
    const seed = vi.fn<typeof readScreenerVwapSeeds>(async function* () {
      yield new Map([["AAA", seeded(10, 100)]]);
    });
    const connected = new LiveScreenerVwapWorker(["AAA"], start, start, end, { NODE_ENV: "test" }, seed);
    connected.observe("AAA", start, 20, 20);
    await connected.warm(() => {}, abort.signal);
    expect(seed).not.toHaveBeenCalled();
    expect(connected.reading("AAA")).toEqual({ vwap: 20, vwapAt: start });
    const reconnected = new LiveScreenerVwapWorker(["AAA"], start, boundary, end, { NODE_ENV: "test" }, seed);
    await reconnected.warm(() => {}, abort.signal);
    expect(reconnected.reading("AAA")).toEqual({ vwap: 10, vwapAt: boundary });
  });
});
