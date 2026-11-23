import "server-only";
import type { VwapSeed } from "@/src/modules/scanner/alpaca/chart-vwap-seed";
import { PRICE_SOURCES } from "@/src/modules/scanner/alpaca/chart-preferences";

export function browserVwapSeed(seed: VwapSeed): VwapSeed {
  const { complete, basisDate, anchorKey, start, volume } = seed;
  const { symbol, timeframe, anchor, before, premarket, regular, postmarket, adjustment } = seed.request;
  const sums = Object.fromEntries(PRICE_SOURCES.filter(key => seed.sums[key] !== undefined).map(key => [key, seed.sums[key]])) as VwapSeed["sums"];
  return { complete, basisDate, anchorKey, start, volume, request: { symbol, timeframe, anchor, before, premarket, regular, postmarket, ...(adjustment ? { adjustment } : {}) }, sums,
    ...(seed.moments ? { moments: Object.fromEntries(PRICE_SOURCES.map(key => [key, { mean: seed.moments![key].mean, m2: seed.moments![key].m2 }])) as VwapSeed["moments"] } : {}),
    ...(seed.events ? { events: { symbol: seed.events.symbol, anchor: seed.events.anchor, basisDate: seed.events.basisDate, dates: seed.events.dates } } : {}),
  };
}
