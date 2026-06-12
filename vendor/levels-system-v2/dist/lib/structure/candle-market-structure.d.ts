import type { Candle } from "../market-data/candle-types.js";
export type CandleMarketStructureState = "insufficient_data" | "range_bound" | "base_building" | "pressing_range_high" | "breakout_attempt" | "breakout_holding" | "failed_breakout" | "pullback_to_structure" | "higher_lows_intact" | "trend_intact" | "trend_damaged" | "pivot_lost" | "reclaim_attempt" | "reclaim_confirmed";
export type CandleMarketStructureDiagnosticCode = "insufficient_candles" | "future_candles_filtered" | "partial_candles_filtered" | "no_confirmed_pivots" | "choppy_structure" | "derived_from_1m";
export type CandleMarketStructureDiagnostic = {
    code: CandleMarketStructureDiagnosticCode;
    severity: "info" | "warning";
    message: string;
};
export type CandleMarketStructureOptions = {
    leftBars?: number;
    rightBars?: number;
    minCandles?: number;
    rangeLookbackBars?: number;
    sourceTimeframe?: "5m" | "1m";
};
export type CandleStructurePivot = {
    id: string;
    kind: "swing_high" | "swing_low";
    price: number;
    timestamp: number;
    index: number;
    strength: number;
    confirmed: true;
};
export type CandleMarketStructurePivots = {
    confirmedHighs: CandleStructurePivot[];
    confirmedLows: CandleStructurePivot[];
    latestSwingHigh: CandleStructurePivot | null;
    latestSwingLow: CandleStructurePivot | null;
    priorSwingHigh: CandleStructurePivot | null;
    priorSwingLow: CandleStructurePivot | null;
};
export type CandleMarketStructureTrend = {
    direction: "building" | "fading" | "uptrend" | "damaged" | "range" | "unknown";
    higherLowCount: number;
    lowerHighCount: number;
    higherHighCount: number;
    lowerLowCount: number;
    latestHigherLow: CandleStructurePivot | null;
    latestLowerHigh: CandleStructurePivot | null;
};
export type CandleMarketStructureRange = {
    active: boolean;
    high: number;
    low: number;
    widthPct: number;
    touchCountHigh: number;
    touchCountLow: number;
    quality: "clean" | "loose" | "choppy";
};
export type CandleMarketStructurePivotEvent = {
    type: "reclaim" | "loss" | "failed_reclaim" | "none";
    pivot: CandleStructurePivot | null;
    triggerPrice: number | null;
    confirmation: "early" | "confirmed";
};
export type CandleMarketStructureConfidence = {
    score: number;
    label: "low" | "medium" | "high";
    reasons: string[];
};
export type CandleMarketStructureContext = {
    symbol: string;
    timeframe: "5m";
    asOfTimestamp: number | null;
    state: CandleMarketStructureState;
    confidence: CandleMarketStructureConfidence;
    pivots: CandleMarketStructurePivots;
    trend: CandleMarketStructureTrend;
    range: CandleMarketStructureRange | null;
    pivotEvent: CandleMarketStructurePivotEvent | null;
    traderLine?: string;
    diagnostics: CandleMarketStructureDiagnostic[];
};
export type BuildCandleMarketStructureRequest = {
    symbol: string;
    candles: Candle[];
    timeframe?: "5m";
    asOfTimestamp?: number | string | Date;
    currentPrice?: number;
    options?: CandleMarketStructureOptions;
};
export declare function buildCandleMarketStructureContext(request: BuildCandleMarketStructureRequest): CandleMarketStructureContext;
//# sourceMappingURL=candle-market-structure.d.ts.map