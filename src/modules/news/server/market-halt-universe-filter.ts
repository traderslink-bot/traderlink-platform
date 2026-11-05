import type { DailyUniverse } from "../../scanner/live/contracts";
import type { MarketHalt } from "./market-halt-feed";

export const MARKET_HALT_MAXIMUM_MARKET_CAP = 200_000_000;

export function filterMarketHaltsToUniverse(
  halts: readonly MarketHalt[],
  universes: ReadonlyMap<string,DailyUniverse | null>,
  maximumMarketCap = MARKET_HALT_MAXIMUM_MARKET_CAP,
): readonly MarketHalt[] {
  const members=new Map<string,ReadonlyMap<string,number>>();
  for(const [date,universe] of universes)members.set(date,new Map(universe?.stocks.map(stock=>[stock.symbol,stock.marketCapAtCollection])??[]));
  return Object.freeze(halts.filter(halt=>{
    const marketCap=members.get(halt.haltDateEt)?.get(halt.ticker);
    return marketCap!==undefined&&marketCap<=maximumMarketCap;
  }));
}
