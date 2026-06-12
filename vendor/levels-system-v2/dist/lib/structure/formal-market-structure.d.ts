import type { Candle } from "../market-data/candle-types.js";
export type FormalStructureTimeframe = "5m" | "4h" | "daily";
export type FormalStructureBias = "bullish" | "bearish" | "bullish_transition" | "bearish_transition" | "range" | "unknown";
export type FormalStructureEventType = "bos_bullish" | "bos_bearish" | "choch_bullish" | "choch_bearish" | "liquidity_sweep_high" | "liquidity_sweep_low" | "failed_break_high" | "failed_break_low" | "none";
export type FormalSwingKind = "high" | "low";
export type FormalSwingLabel = "HH" | "HL" | "LH" | "LL" | "EH" | "EL" | "H" | "L";
export type FormalSwingScope = "internal" | "external";
export type FormalBreakConfirmation = "close_confirmed" | "displacement_confirmed" | "follow_through_confirmed" | "wick_only" | "failed" | "none";
export type FormalStructureConfidenceLabel = "low" | "medium" | "high";
export interface FormalMarketStructureDiagnostic {
    code: string;
    message: string;
}
export interface FormalMarketStructureOptions {
    minCandles?: number;
    internalLeftBars?: number;
    internalRightBars?: number;
    externalLeftBars?: number;
    externalRightBars?: number;
    equalLevelTolerancePct?: number;
    displacementRangeMultiplier?: number;
    followThroughBars?: number;
}
export interface FormalStructureSwing {
    id: string;
    timeframe: FormalStructureTimeframe;
    kind: FormalSwingKind;
    scope: FormalSwingScope;
    label: FormalSwingLabel;
    price: number;
    timestamp: string;
    candleIndex: number;
    confirmedAt: string;
    moveStrengthPct: number;
}
export interface FormalStructureEvent {
    type: FormalStructureEventType;
    timeframe: FormalStructureTimeframe;
    biasBefore: FormalStructureBias;
    biasAfter: FormalStructureBias;
    triggerTimestamp: string | null;
    triggerClose: number | null;
    brokenSwingId: string | null;
    brokenSwingPrice: number | null;
    sweptSwingId: string | null;
    sweptSwingPrice: number | null;
    protectedHighId: string | null;
    protectedHighPrice: number | null;
    protectedLowId: string | null;
    protectedLowPrice: number | null;
    confirmation: FormalBreakConfirmation;
    closeBeyondPct: number;
    confidenceScore: number;
    confidence: FormalStructureConfidenceLabel;
    reasonCodes: string[];
    traderLine: string;
}
export interface FormalMarketStructureContext {
    symbol: string;
    timeframe: FormalStructureTimeframe;
    candleCount: number;
    evaluatedAt: string | null;
    bias: FormalStructureBias;
    previousBias: FormalStructureBias | null;
    swings: FormalStructureSwing[];
    internalSwings: FormalStructureSwing[];
    externalSwings: FormalStructureSwing[];
    latestHigh: FormalStructureSwing | null;
    latestLow: FormalStructureSwing | null;
    protectedHigh: FormalStructureSwing | null;
    protectedLow: FormalStructureSwing | null;
    latestEvent: FormalStructureEvent;
    diagnostics: FormalMarketStructureDiagnostic[];
}
export interface BuildFormalMarketStructureRequest {
    symbol: string;
    candles: Candle[];
    timeframe?: FormalStructureTimeframe;
    asOfTimestamp?: number | string | Date;
    options?: FormalMarketStructureOptions;
}
export declare function buildFormalMarketStructureContext(request: BuildFormalMarketStructureRequest): FormalMarketStructureContext;
//# sourceMappingURL=formal-market-structure.d.ts.map