export type StockLevelsSide = "support" | "resistance";

export type StockLevelsLevel = Readonly<{
  side: StockLevelsSide;
  price: number;
  distancePct: number;
  strength: "weak" | "moderate" | "strong" | "major";
  type: string;
  timeframeSources: readonly string[];
  formedAt: number | null;
  lastTestedAt: number | null;
  lastConfirmedAt: number | null;
}>;

export type StockLevelsMap = Readonly<{
  symbol: string;
  referencePrice: number;
  referencePriceAsOf: number;
  calculatedAt: number;
  cacheStatus: "hit" | "fresh";
  nearestSupport: StockLevelsLevel | null;
  nearestResistance: StockLevelsLevel | null;
  support: readonly StockLevelsLevel[];
  resistance: readonly StockLevelsLevel[];
  fullLadder: Readonly<{ support: readonly StockLevelsLevel[]; resistance: readonly StockLevelsLevel[] }>;
}>;

export type StockLevelsResult =
  | Readonly<{ state: "ready"; map: StockLevelsMap; remainingHourly: number; remainingNewYorkDay: number; resetAt: number }>
  | Readonly<{ state: "unavailable"; code: "invalid_symbol" | "unsupported_equity" | "reference_price_unavailable" | "market_data_unavailable" | "runtime_unavailable" | "limit_reached"; message: string; remainingHourly: number; remainingNewYorkDay: number; resetAt: number }>;

export function isStockLevelsMap(value: unknown): value is StockLevelsMap {
  if (!value || typeof value !== "object") return false;
  const map = value as Record<string, unknown>;
  return typeof map.symbol === "string" && typeof map.referencePrice === "number" &&
    typeof map.referencePriceAsOf === "number" && typeof map.calculatedAt === "number" &&
    (map.cacheStatus === "hit" || map.cacheStatus === "fresh") && Array.isArray(map.support) && Array.isArray(map.resistance);
}
