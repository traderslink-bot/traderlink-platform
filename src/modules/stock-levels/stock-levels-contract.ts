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

export type StockLevelsQuotaFeedback = Readonly<{
  remainingHourly: number | null;
  remainingNewYorkDay: number | null;
  resetAt: number | null;
  membership?: Readonly<{ remaining: number | null; resetsAtUtc: string | null; resetDays: number | null }>;
}>;

export type StockLevelsResult =
  | (Readonly<{ state: "ready"; map: StockLevelsMap; savedMap: SavedStockLevelsMap }> & StockLevelsQuotaFeedback)
  | (Readonly<{ state: "unavailable"; code: "invalid_symbol" | "unsupported_equity" | "reference_price_unavailable" | "market_data_unavailable" | "runtime_unavailable" | "limit_reached" | "saved_map_unavailable"; message: string }> & StockLevelsQuotaFeedback);

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

export function isStockLevelsQuotaFeedback(value: unknown): value is StockLevelsQuotaFeedback {
  if (!value || typeof value !== "object") return false;
  const feedback = value as Record<string, unknown>;
  if (feedback.membership !== undefined) {
    if (!feedback.membership || typeof feedback.membership !== "object") return false;
    const membership = feedback.membership as Record<string, unknown>;
    if (!(membership.remaining === null || (Number.isSafeInteger(membership.remaining) && Number(membership.remaining) >= 0)) ||
        !(membership.resetsAtUtc === null || (typeof membership.resetsAtUtc === "string" && Number.isFinite(Date.parse(membership.resetsAtUtc)))) ||
        !(membership.resetDays === null || (Number.isSafeInteger(membership.resetDays) && Number(membership.resetDays) > 0))) return false;
    return feedback.remainingHourly === membership.remaining && feedback.remainingNewYorkDay === membership.remaining &&
      feedback.resetAt === (membership.resetsAtUtc === null ? null : Date.parse(membership.resetsAtUtc as string));
  }
  const allNull = feedback.remainingHourly === null &&
    feedback.remainingNewYorkDay === null && feedback.resetAt === null;
  const isFiniteNumber = (candidate: unknown): candidate is number =>
    typeof candidate === "number" && Number.isFinite(candidate);
  return allNull || (
    isFiniteNumber(feedback.remainingHourly) &&
    isFiniteNumber(feedback.remainingNewYorkDay) &&
    isFiniteNumber(feedback.resetAt)
  );
}
