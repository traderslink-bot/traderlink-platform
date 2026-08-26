import type {
  LiveWatchlistCardContent,
  LiveWatchlistLevelMap,
} from "@/src/lib/live-watchlist/live-watchlist-types";

export type StockLevelsMap = Readonly<{
  symbol: string;
  referencePrice: number;
  referencePriceAsOf: number;
  calculatedAt: number;
  cacheStatus: "hit" | "fresh";
  levelMap: LiveWatchlistLevelMap | null;
  fullLadderCard: LiveWatchlistCardContent | null;
  nearestSupportResistanceCard: LiveWatchlistCardContent | null;
}>;

export type SavedStockLevelsMap = Readonly<{
  savedMapId: string;
  map: StockLevelsMap;
}>;

export type StockLevelsResult =
  | Readonly<{ state: "ready"; map: StockLevelsMap; savedMap: SavedStockLevelsMap; remainingHourly: number | null; remainingNewYorkDay: number | null; resetAt: number | null }>
  | Readonly<{ state: "unavailable"; code: "invalid_symbol" | "unsupported_equity" | "reference_price_unavailable" | "market_data_unavailable" | "runtime_unavailable" | "limit_reached" | "saved_map_unavailable"; message: string; remainingHourly: number | null; remainingNewYorkDay: number | null; resetAt: number | null }>;

export function isStockLevelsMap(value: unknown): value is StockLevelsMap {
  if (!value || typeof value !== "object") return false;
  const map = value as Record<string, unknown>;
  return typeof map.symbol === "string" && typeof map.referencePrice === "number" &&
    typeof map.referencePriceAsOf === "number" && typeof map.calculatedAt === "number" &&
    (map.cacheStatus === "hit" || map.cacheStatus === "fresh") &&
    (map.levelMap === null || typeof map.levelMap === "object") &&
    (map.fullLadderCard === null || typeof map.fullLadderCard === "object") &&
    (map.nearestSupportResistanceCard === null || typeof map.nearestSupportResistanceCard === "object");
}

export function isSavedStockLevelsMap(value: unknown): value is SavedStockLevelsMap {
  if (!value || typeof value !== "object") return false;
  const savedMap = value as Record<string, unknown>;
  return typeof savedMap.savedMapId === "string" && isStockLevelsMap(savedMap.map);
}
