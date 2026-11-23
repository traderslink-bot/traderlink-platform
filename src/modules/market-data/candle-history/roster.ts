import "server-only";
import { requestAlpacaCandleArchiveAdmin } from "../../scanner/alpaca/client";
import type { DailyUniverse } from "../../scanner/live/contracts";
import { collectNasdaqCandleHistoryRoster } from "../../scanner/live/server/nasdaq-universe-source";
import { MAX_UNIVERSE_MARKET_CAP } from "../../scanner/live/universe-validation";

export function readCandleHistoryRoster(ceiling: number, universe: DailyUniverse | null,
  collect = collectNasdaqCandleHistoryRoster) {
  if (ceiling === 0) return Promise.resolve([]);
  const coverage = universe?.sourceImports?.some(source => source.sourceUrl === "https://api.nasdaq.com/api/screener/stocks")
    ? MAX_UNIVERSE_MARKET_CAP : universe ? 100_000_000 : 0;
  if (universe && coverage >= ceiling) {
    return Promise.resolve(universe.stocks.filter(stock => stock.marketCapAtCollection <= ceiling)
      .map(({ symbol, marketCapAtCollection }) => ({ symbol, marketCap: marketCapAtCollection })));
  }
  return collect(ceiling);
}

export async function syncCandleHistoryRoster(universe: DailyUniverse, environment: NodeJS.ProcessEnv) {
  if (!environment.TRADERLINK_ALPACA_CANDLE_HISTORY_ADMIN_TOKEN) return;
  const archive = await requestAlpacaCandleArchiveAdmin(undefined, environment);
  if (!archive) throw Error("candle_history_unavailable");
  const { marketCapCeiling, revision } = archive.settings;
  const roster = await readCandleHistoryRoster(marketCapCeiling, universe);
  await requestAlpacaCandleArchiveAdmin({ universe: roster, rosterSettingsRevision: revision }, environment);
}
