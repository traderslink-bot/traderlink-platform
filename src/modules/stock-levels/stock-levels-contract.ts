import type {
  LiveWatchlistCardContent,
  LiveWatchlistLevelMap,
} from "@/src/lib/live-watchlist/live-watchlist-types";

export type StockLevelsChartEvidenceInput = Readonly<{
  id: string;
  frame: "daily" | "4h";
  datasetId: string;
  priceBasisId: string;
  calendarRevision: string;
  sessionMode: "regular" | "extended";
  completedThroughMs: number;
  availableAtMs: number;
  acceptedAtMs: number;
  acceptedCutoffMs: number;
  digest: string;
}>;

/** Private runtime and saved-map metadata. Never include it in the public Levels response. */
export type StockLevelsChartEvidenceProvenance = Readonly<{
  version: 1;
  instrument: Readonly<{ id: string; symbol: string; venue: string }>;
  calculatedAtMs: number;
  inputs: readonly StockLevelsChartEvidenceInput[];
  zones: readonly Readonly<{ side: "support" | "resistance"; index: number; inputIds: readonly string[] }>[];
}>;

export type StockLevelsMap = Readonly<{
  symbol: string;
  referencePrice: number;
  referencePriceAsOf: number;
  // Older saved maps do not identify whether the reference was a real trade.
  referencePriceBasis?: "last_trade" | "reference";
  calculatedAt: number;
  cacheStatus: "hit" | "fresh";
  levelMap: LiveWatchlistLevelMap | null;
  fullLadderCard: LiveWatchlistCardContent | null;
  nearestSupportResistanceCard: LiveWatchlistCardContent | null;
  chartEvidenceProvenance?: StockLevelsChartEvidenceProvenance;
}>;

export type SavedStockLevelsMap = Readonly<{
  savedMapId: string;
  map: StockLevelsMap;
}>;

export type StockLevelsQuotaFeedback = Readonly<{
  remainingHourly: number | null;
  remainingNewYorkDay: number | null;
  resetAt: number | null;
  membership?: Readonly<{ included?: boolean; remaining: number | null; resetsAtUtc: string | null; resetDays: number | null }>;
}>;

export type StockLevelsResult =
  | (Readonly<{ state: "ready"; map: StockLevelsMap; savedMap: SavedStockLevelsMap }> & StockLevelsQuotaFeedback)
  | (Readonly<{ state: "unavailable"; code: "invalid_symbol" | "unsupported_equity" | "reference_price_unavailable" | "market_data_unavailable" | "runtime_unavailable" | "limit_reached" | "saved_map_unavailable"; message: string }> & StockLevelsQuotaFeedback);

export function isStockLevelsMap(value: unknown): value is StockLevelsMap {
  if (!value || typeof value !== "object") return false;
  const map = value as Record<string, unknown>;
  return typeof map.symbol === "string" && typeof map.referencePrice === "number" &&
    typeof map.referencePriceAsOf === "number" && typeof map.calculatedAt === "number" &&
    (map.referencePriceBasis === undefined || map.referencePriceBasis === "last_trade" || map.referencePriceBasis === "reference") &&
    (map.cacheStatus === "hit" || map.cacheStatus === "fresh") &&
    (map.levelMap === null || typeof map.levelMap === "object") &&
    (map.fullLadderCard === null || typeof map.fullLadderCard === "object") &&
    (map.nearestSupportResistanceCard === null || typeof map.nearestSupportResistanceCard === "object");
}

export function stockLevelsReferencePriceLabel(map: StockLevelsMap): "Last traded price" | "Reference price" {
  return map.referencePriceBasis === "last_trade" ? "Last traded price" : "Reference price";
}

const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const clockMs = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;

function exactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)));
}

export function qualifiedStockLevelsChartProvenance(map: StockLevelsMap): StockLevelsChartEvidenceProvenance | undefined {
  const value: unknown = map.chartEvidenceProvenance;
  if (!exactRecord(value, ["version", "instrument", "calculatedAtMs", "inputs", "zones"]) ||
    value.version !== 1 || !clockMs(value.calculatedAtMs) || !map.levelMap ||
    !Array.isArray(value.inputs) || !value.inputs.length || !Array.isArray(value.zones) || !value.zones.length) return;
  const instrument = value.instrument;
  if (!exactRecord(instrument, ["id", "symbol", "venue"]) || !nonempty(instrument.id) ||
    !nonempty(instrument.venue) || instrument.symbol !== map.symbol) return;

  const inputIds = new Set<string>();
  for (const input of value.inputs) {
    if (!exactRecord(input, [
      "id", "frame", "datasetId", "priceBasisId", "calendarRevision", "sessionMode",
      "completedThroughMs", "availableAtMs", "acceptedAtMs", "acceptedCutoffMs", "digest",
    ]) || !nonempty(input.id) || inputIds.has(input.id) ||
      (input.frame !== "daily" && input.frame !== "4h") ||
      !nonempty(input.datasetId) || !nonempty(input.priceBasisId) || !nonempty(input.calendarRevision) ||
      (input.sessionMode !== "regular" && input.sessionMode !== "extended") ||
      !clockMs(input.completedThroughMs) || !clockMs(input.availableAtMs) || !clockMs(input.acceptedAtMs) ||
      !clockMs(input.acceptedCutoffMs) || input.completedThroughMs > input.availableAtMs ||
      input.completedThroughMs > input.acceptedCutoffMs || input.availableAtMs > input.acceptedAtMs ||
      input.acceptedCutoffMs > input.acceptedAtMs || input.acceptedAtMs > value.calculatedAtMs ||
      typeof input.digest !== "string" ||
      !/^[a-f0-9]{64}$/u.test(input.digest)) return;
    inputIds.add(input.id);
  }

  const represented = new Set<string>();
  for (const zone of value.zones) {
    if (!exactRecord(zone, ["side", "index", "inputIds"]) ||
      (zone.side !== "support" && zone.side !== "resistance") ||
      typeof zone.index !== "number" || !Number.isSafeInteger(zone.index) || zone.index < 0 ||
      !Array.isArray(zone.inputIds) || !zone.inputIds.length || new Set(zone.inputIds).size !== zone.inputIds.length ||
      !zone.inputIds.every(id => nonempty(id) && inputIds.has(id))) return;
    const side = zone.side === "support" ? map.levelMap.supportLevels : map.levelMap.resistanceLevels;
    const key = `${zone.side}:${zone.index}`;
    if (represented.has(key) || !Array.isArray(side) || side[zone.index]?.side !== zone.side) return;
    represented.add(key);
  }
  return value as StockLevelsChartEvidenceProvenance;
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
    if (membership.included !== undefined && typeof membership.included !== "boolean") return false;
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
