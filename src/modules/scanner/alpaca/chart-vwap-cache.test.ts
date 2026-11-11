import { expect, it } from "vitest";
import { ChartVwapCache } from "@/app/(dashboard)/charts/chart-vwap-cache";
import type { VwapSeed } from "./chart-vwap-seed";

it("shares the seed and last readout on remount and reload while isolating accounts and settings", () => {
  const data = new Map<string, string>();
  const storage = () => ({ getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } });
  const cache = new ChartVwapCache(storage);
  const seed: VwapSeed = {
    complete: true, basisDate: "2026-11-11", anchorKey: "2026-11-11", start: 1794373200, volume: 0,
    request: { symbol: "NXXT", timeframe: "15m", anchor: "Session", before: 1794407400, premarket: true, regular: true, postmarket: true },
    sums: { open: 0, high: 0, low: 0, close: 0, hl2: 0, hlc3: 0, ohlc4: 0 },
  };
  const readout = { time: 1794407400, value: 1.7, precision: 2 };
  cache.writeSeed("owner-a", "NXXT-15m", seed);
  cache.writeReadout("owner-a", "2026-11-11-NXXT-15m", readout);
  cache.writeReadout("owner-a", "2026-11-11-NXXT-15m", { ...readout, time: readout.time - 60, value: 1.2 });
  expect(cache.readReadout("owner-a", "2026-11-11-NXXT-15m")).toEqual(readout);
  cache.flush("owner-a");
  const reloaded = new ChartVwapCache(storage);
  expect(reloaded.readSeed("owner-a", "NXXT-15m")?.value).toEqual(seed);
  expect(reloaded.readReadout("owner-a", "2026-11-11-NXXT-15m")).toEqual(readout);
  expect(reloaded.readSeed("owner-b", "NXXT-15m")).toBeUndefined();
  expect(reloaded.readReadout("owner-a", "2026-11-12-NXXT-15m")).toBeUndefined();
  expect(reloaded.readSeed("owner-a", "NXXT-5m")).toBeUndefined();
});
