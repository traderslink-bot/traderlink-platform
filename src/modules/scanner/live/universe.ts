import type { DailyUniverse } from "./contracts";
import { MAX_UNIVERSE_ROWS, scannerUniverseSymbolEligible, validateUniverseUpload } from "./universe-validation";

/** Pure transition. The integration layer must persist this atomically under one writer. */
export function importDailyUniverse(previous: DailyUniverse | null, upload: unknown, now: number):
  Readonly<{ universe: DailyUniverse; idempotent: boolean }> {
  const checked = validateUniverseUpload(upload, now);
  if (previous && previous.tradingDate !== checked.input.tradingDate) throw Error("scanner_universe_date_conflict");
  if (previous?.sourceHashes.includes(checked.hash)) return { universe: previous, idempotent: true };
  if (previous && Date.parse(previous.lastCollectionAtUtc) > Date.parse(checked.input.metadata.collection_finished_at_utc)) {
    throw Error("scanner_universe_older_collection");
  }
  if (previous && previous.sourceHashes.length >= 20) throw Error("scanner_universe_import_limit");
  const qualifyingStocks=checked.stocks.filter(stock=>scannerUniverseSymbolEligible(stock.symbol));
  const retained = new Map(previous?.stocks.filter(stock=>scannerUniverseSymbolEligible(stock.symbol)).map(stock => [stock.symbol, stock]) ?? []);
  for (const stock of qualifyingStocks) {
    const earlier = retained.get(stock.symbol);
    if (earlier && earlier.exchange !== stock.exchange) throw Error("scanner_universe_exchange_conflict");
    // Preserve the first qualifying cap: crossing the ceiling does not remove today's member.
    if (!earlier) retained.set(stock.symbol, stock);
  }
  if (retained.size > MAX_UNIVERSE_ROWS) throw Error("scanner_universe_population_limit");
  return { idempotent: false, universe: {
    version: 1, tradingDate: checked.input.tradingDate, acceptedAtUtc: new Date(now).toISOString(),
    lastCollectionAtUtc: checked.input.metadata.collection_finished_at_utc,
    latestUploadCount: qualifyingStocks.length, sourceHashes: [...(previous?.sourceHashes ?? []), checked.hash],
    stocks: [...retained.values()].sort((a,b) => a.symbol.localeCompare(b.symbol)),
  } };
}
