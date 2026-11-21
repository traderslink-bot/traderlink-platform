import { publicMarketMetadata } from "@/src/modules/market-data/public-market-metadata";
import type { LiveWatchlistCardContent } from "@/src/lib/live-watchlist/live-watchlist-types";
import type { SavedStockLevelsMap, StockLevelsMap, StockLevelsResult } from "../stock-levels-contract";

const formats = new Set(["level_snapshot", "live_level_map", "level_extension"]);

function card(value: LiveWatchlistCardContent | null): LiveWatchlistCardContent | null {
  if (!value) return null;
  const { title, body, updatedAt, priceWhenPosted, source, metadata } = value;
  return { title, body, updatedAt, priceWhenPosted,
    source: formats.has(source) ? source : "TradersLink",
    ...(metadata ? { metadata: publicMarketMetadata(metadata) } : {}),
  };
}

/** Public envelope only. Stored evidence and runtime provider records stay intact. */
export function browserStockLevelsMap(map: StockLevelsMap): StockLevelsMap {
  const { symbol, referencePrice, referencePriceAsOf, calculatedAt, cacheStatus, levelMap } = map;
  return { symbol, referencePrice, referencePriceAsOf, calculatedAt, cacheStatus, levelMap: publicMarketMetadata(levelMap),
    fullLadderCard: card(map.fullLadderCard), nearestSupportResistanceCard: card(map.nearestSupportResistanceCard) };
}

export function browserSavedStockLevelsMap(saved: SavedStockLevelsMap): SavedStockLevelsMap {
  return { savedMapId: saved.savedMapId, map: browserStockLevelsMap(saved.map) };
}

const messages: Record<Extract<StockLevelsResult, { state: "unavailable" }>["code"], string> = {
  invalid_symbol: "Enter a valid ticker.",
  unsupported_equity: "Data is not available for this ticker right now, try again later.",
  reference_price_unavailable: "Data is not available for this ticker right now, try again later.",
  market_data_unavailable: "Data is not available for this ticker right now, try again later.",
  runtime_unavailable: "A reliable Stock Levels map is unavailable right now. Try again later.",
  saved_map_unavailable: "This saved map is unavailable.",
  limit_reached: "Your generation allowance has been reached. View plans for more access, or wait for your reset if one is scheduled.",
};

export function browserStockLevelsResult(result: StockLevelsResult): StockLevelsResult {
  const { remainingHourly, remainingNewYorkDay, resetAt, membership } = result;
  const quota = { remainingHourly, remainingNewYorkDay, resetAt, ...(membership ? { membership } : {}) };
  if (result.state === "ready") return { state: "ready", map: browserStockLevelsMap(result.map),
    savedMap: browserSavedStockLevelsMap(result.savedMap), ...quota };
  return { state: "unavailable", code: result.code,
    message: result.code === "limit_reached" && membership?.included === false
      ? "Unlock Levels Generator to create support and resistance maps. Choose a plan that includes it."
      : messages[result.code], ...quota };
}
