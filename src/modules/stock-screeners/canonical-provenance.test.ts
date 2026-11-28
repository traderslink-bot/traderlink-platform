// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { easternDayStart } from "../scanner/alpaca/candles";
import { DEFAULT_DEFINITION } from "./contracts";
import { ScreenerSnapshotCollector } from "./provider-snapshot-collector";
import { publishScreenerPack } from "./provider-pack-store";
import { createRun } from "./service";
import type { MoomooScreenerOperation, ScreenerProviderTransport } from "./provider-transport";
import { decodeScreenerPrivatePack, decodeScreenerPrivatePackAsync, encodeScreenerPrivatePack } from "./private-publication-wire";
import { validateMarketPack } from "./snapshot-file";

const now = Date.parse("2026-11-27T14:26:00Z"), day = "2026-11-27", minute = Date.parse("2026-11-27T12:02:00Z") / 1000;
const selection = { provider: "moomoo", revision: 1 } as const;
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("retains canonical provenance for both accounts, guards native quote aggregates, and keeps it off ordinary results", async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now);
  const folder = mkdtempSync(join(tmpdir(), "screener-canonical-provenance-"));
  const configured = join(folder, "market-data-providers-v1", "screeners");
  mkdirSync(configured, { recursive: true }); writeFileSync(join(configured, "provider.json"), JSON.stringify(selection));
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(folder, "fixture.sqlite")); vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "0");
  const days: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ feed: "sip", generation: 20,
    symbols: { POM: { minutes: [minute], pending: false, revision: "b".repeat(64) } } })));
  const transport = {
    universe: async () => ({ listingDate: day, partialCaps: false, spacingMs: 1500,
      stocks: ["POM", "NATIVE"].map(symbol => ({ symbol, name: symbol, exchange: "NASDAQ", marketCap: 20000000 })) }),
    moomoo: async (_selection: unknown, operation: MoomooScreenerOperation) => {
      if (operation.operation === "calendar") {
        for (let time = Date.parse(operation.start + "T12:00:00Z"); time <= Date.parse(operation.end + "T12:00:00Z"); time += 86400000) {
          const date = new Date(time); if (date.getUTCDay() % 6) days.push(date.toISOString().slice(0, 10));
        }
        return { ret_code: 0, data: { trading_days: days.map(time => ({ time, trade_date_type: "WHOLE" })) } };
      }
      if (operation.operation === "rehab") return { ret_code: 0, data: { rehabs: [] } };
      if (operation.operation !== "history") throw Error("unexpected_operation");
      const canonical = operation.symbol === "POM";
      const rows = operation.timeframe === "1Day" ? days.map(date => ({ time_key: easternDayStart(Date.parse(date + "T12:00:00Z") / 1000) * 1000,
        open: 10, high: 10, low: 10, close: 10, volume: 1000, turnover: 10000 })) : operation.timeframe === "15Min" ? []
        : [{ time_key: Date.parse("2026-11-27T12:05:00Z"), open: 4, high: canonical ? 42 : 31, low: 3, close: canonical ? 40 : 4,
          volume: 1000, turnover: canonical ? null : 4000 }];
      return { ret_code: 0, data: { kline_list: rows.filter(row => row.time_key >= operation.start && row.time_key <= operation.end + 300000),
        ...(canonical && operation.timeframe === "5Min" ? { corrections: { source: "alpaca-sip", times: [Date.parse("2026-11-27T12:00:00Z") / 1000], pending: [] } } : {}) } };
    },
  };
  const collector = new ScreenerSnapshotCollector(transport as unknown as ScreenerProviderTransport, selection, new AbortController().signal, undefined,
    { NODE_ENV: "test", TRADERLINK_ALPACA_GATEWAY_URL: "http://127.0.0.1:12345", TRADERLINK_ALPACA_GATEWAY_TOKEN: "fixture" });
  collector.observeMoomooSnapshots({ ret_code: 0, data: { snapshot_list: [{ code: "US.POM", data_date: day, update_time: now,
    pre_price: 32, pre_high_price: 35, pre_low_price: 2, pre_volume: 5000, pre_turnover: 160000 }] } }, ["POM"]);
  try {
    const pack = await collector.collect();
    expect(pack.snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.high).toBe(42);
    expect(pack.correctionProvenance).toEqual({ source: "alpaca-sip", symbols: ["POM"] });
    const premarket = { start: Date.parse(day + "T09:00:00Z"), end: Date.parse(day + "T14:30:00Z") };
    const live = [{ symbol: "POM", price: 32, priceAt: now, vwap: 80, vwapAt: now }, { symbol: "NATIVE", price: 4, priceAt: now, vwap: 3, vwapAt: now }];
    expect(collector.guardMoomooLiveRows(live, premarket)).toEqual([{ symbol: "POM", price: 32, priceAt: now, vwap: null }, live[1]]);
    expect(collector.guardMoomooLiveRows(live, { start: premarket.end, end: Date.parse(day + "T21:00:00Z") })).toEqual(live);
    const initial = await collector.initialMoomooPack();
    expect(initial.selection).toEqual(selection);
    expect(initial.snapshots.premarket.rows.find(row => row.symbol === "POM")!.values).toMatchObject({ price: 32 });
    expect(initial.snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.sessionVwap).toBeUndefined();
    expect(initial.snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.high).toBeUndefined();
    const token = "canonical-internal-source-fixture-0123456789";
    expect(() => encodeScreenerPrivatePack(initial, selection, true, token)).not.toThrow();
    const wire = encodeScreenerPrivatePack(pack, selection, false, token);
    expect(JSON.stringify(wire)).not.toMatch(/alpaca|moomoo/i);
    for (const restored of [decodeScreenerPrivatePack(wire, selection, token), await decodeScreenerPrivatePackAsync(wire, selection, token)])
      expect(validateMarketPack(restored.pack, now, selection).correctionProvenance).toEqual(pack.correctionProvenance);
    const directory = join(folder, "stock-screeners-v1"); await publishScreenerPack(directory, pack, selection);
    expect(JSON.parse(readFileSync(join(directory, "market-moomoo-1.json"), "utf8")).correctionProvenance).toEqual(pack.correctionProvenance);
    for (const userId of ["canonical-one", "canonical-two"]) {
      const identity = { mode: "platform_session", scope: { userId } } as TraderLinkPlatformRequestIdentity;
      const result = await createRun(identity, { ...DEFAULT_DEFINITION, session: "premarket" });
      expect(result.rows.find(row => row.symbol === "POM")!.values.high).toBe(42);
      expect(result).not.toHaveProperty("correctionProvenance");
    }
    expect(() => validateMarketPack({ ...pack, correctionProvenance: { source: "other", symbols: ["POM"] } }, now, selection)).toThrow();
    expect(() => validateMarketPack({ ...pack, correctionProvenance: { source: "alpaca-sip", symbols: ["FOREIGN"] } }, now, selection)).toThrow();
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
