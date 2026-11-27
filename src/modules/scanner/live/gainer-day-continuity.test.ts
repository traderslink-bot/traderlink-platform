import { describe, expect, it } from "vitest";
import { LiveScannerEngine } from "./engine";
import { initialConfiguration } from "./settings";
import type { DailyUniverse, NormalizedSnapshot, ScannerSession } from "./contracts";

const regularAt = Date.parse("2026-11-19T20:59:59Z"), afterAt = regularAt + 2_000;
const universe: DailyUniverse = { version: 1, tradingDate: "2026-11-19", acceptedAtUtc: new Date(regularAt).toISOString(),
  lastCollectionAtUtc: new Date(regularAt).toISOString(), latestUploadCount: 1, sourceHashes: ["a".repeat(64)],
  stocks: [{ symbol: "TEST", exchange: "NASDAQ", marketCapAtCollection: 10_000_000 }] };
const initial = initialConfiguration();
const configuration = { ...initial, enabled: true, gainers: { ...initial.gainers, filters: {
  ...initial.gainers.filters,
  regular: { ...initial.gainers.filters.regular, minimumVolume: 100_000, minimumDollarVolume: 100_000, maximumSpreadPercent: null },
  after_hours: { ...initial.gainers.filters.after_hours, minimumVolume: 40_000, minimumDollarVolume: 50_000, maximumSpreadPercent: null },
} } };
const snapshot = (session: ScannerSession, at: number, price = session === "regular" ? 2 : 2.1): NormalizedSnapshot => ({
  provider: "alpaca", symbol: "TEST", company: "Synthetic fixture", session, tradingDate: universe.tradingDate,
  providerAt: at, receivedAt: at, price, baseline: 1, regularClosePrice: 2, priceTimeBasis: "session_observation",
  volume: session === "regular" ? 1_000_000 : 10, dollarVolume: session === "regular" ? 2_000_000 : 21,
  bid: null, ask: null, marketCap: 10_000_000, dayHigh: Math.max(2.1, price), dayLow: .9, providerVolumeRatio: null,
});
function run(engine: LiveScannerEngine, session: ScannerSession, now: number, snapshots = [snapshot(session, now)], chosen = configuration, stocks = universe.stocks) {
  return engine.evaluate({ universe: { ...universe, stocks }, tradingDate: universe.tradingDate, session, now, snapshots,
    floats: new Map([["TEST", { shares: 1_000_000, retrievedAtUtc: new Date(regularAt).toISOString() }]]), news: new Map(), configuration: chosen });
}

describe("Day Gainers continuation across regular close", () => {
  it.each([false, true])("keeps a qualified day leader while low post-market volume does not qualify the separate post list, eventDriven=%s", eventDriven => {
    const engine = new LiveScannerEngine(eventDriven);
    expect(run(engine, "regular", regularAt).dayGainers.rows.map(row => row.symbol)).toEqual(["TEST"]);
    for (const now of [afterAt, afterAt + 20 * 60_000]) {
      const result = run(engine, "after_hours", now);
      expect(result.dayGainers.rows.map(row => row.symbol)).toEqual(["TEST"]);
      expect(result.dayGainers.rows[0].sessionGain).toBeCloseTo(110);
      expect(result.dayGainers.rows[0].gainBasis).toBe("previous_regular_close");
      expect(result.dayGainers.rows[0].comparisonPrice).toBe(1);
      expect(result.dayGainers.rows[0].price).toBe(2.1);
      expect(result.dayGainers.rows[0].providerAtUtc).toBe(new Date(now).toISOString());
      expect(result.gainers.rows).toEqual([]);
    }
  });
  it("retains the last actual day reading when no after-hours trade has arrived", () => {
    const engine = new LiveScannerEngine(true), prior = run(engine, "regular", regularAt).dayGainers.rows[0];
    const result = run(engine, "after_hours", afterAt, []);
    expect(result.dayGainers.rows).toEqual([prior]);
    expect(result.gainers.rows).toEqual([]);
  });
  it("does not admit a new after-hours candidate with insufficient liquidity", () => {
    expect(run(new LiveScannerEngine(), "after_hours", afterAt).dayGainers.rows).toEqual([]);
  });
  it("still removes a former day leader after it stops gaining or leaves the universe", () => {
    const engine = new LiveScannerEngine(); run(engine, "regular", regularAt);
    expect(run(engine, "after_hours", afterAt, [snapshot("after_hours", afterAt, .99)]).dayGainers.rows).toEqual([]);
    run(engine, "regular", regularAt + 100);
    expect(run(engine, "after_hours", afterAt + 100, [], configuration, []).dayGainers.rows).toEqual([]);
  });
  it("rechecks changed rules and never carries established membership into another trading day", () => {
    const engine = new LiveScannerEngine(); run(engine, "regular", regularAt);
    const changed = { ...configuration, revision: 1 };
    expect(run(engine, "after_hours", afterAt, undefined, changed).dayGainers.rows).toEqual([]);
    run(engine, "regular", regularAt + 100);
    const now = afterAt + 86_400_000, next = snapshot("after_hours", now);
    expect(engine.evaluate({ universe: { ...universe, tradingDate: "2026-11-20" }, tradingDate: "2026-11-20", session: "after_hours", now,
      snapshots: [{ ...next, tradingDate: "2026-11-20" }], floats: new Map(), news: new Map(), configuration }).dayGainers.rows).toEqual([]);
  });
});

it("keeps the regular-session leader visible when a refresh contains only a lower gainer", () => {
  const engine = new LiveScannerEngine(true);
  const stocks = [...universe.stocks, {...universe.stocks[0], symbol:"NEXT"}];
  const settings = {...configuration, gainers:{...configuration.gainers, displayLimit:1}};
  const lower = (at:number) => ({...snapshot("regular",at,1.8),symbol:"NEXT"});
  const first = run(engine,"regular",regularAt,[snapshot("regular",regularAt),lower(regularAt)],settings,stocks);
  const next = run(engine,"regular",regularAt+60_000,[lower(regularAt+60_000)],settings,stocks);
  for(const result of [first,next]) expect(result.dayGainers.rows.map(row=>row.symbol)).toEqual(["TEST"]);
});
