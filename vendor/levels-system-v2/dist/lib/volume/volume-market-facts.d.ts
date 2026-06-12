import type { Candle } from "../market-data/candle-types.js";
export type VolumeState = "unknown" | "low" | "normal" | "elevated" | "high" | "extreme";
export type LiquidityQuality = "unknown" | "thin" | "acceptable" | "good" | "strong";
export type VolumeAccelerationState = "unknown" | "decelerating" | "steady" | "building" | "surging" | "exhaustion_risk";
export type PullbackVolumeState = "unknown" | "drying_up" | "normal" | "selling_pressure_increasing";
export type BreakoutVolumeState = "unknown" | "not_applicable" | "weak" | "confirmed" | "strong" | "exhaustion_risk";
export type VolumeMarketFactDiagnosticCode = "future_candles_filtered" | "partial_candles_filtered" | "no_closed_candles" | "insufficient_rolling_volume_history" | "zero_rolling_average_volume" | "no_reference_price_for_dollar_volume";
export type VolumeMarketFactDiagnostic = {
    code: VolumeMarketFactDiagnosticCode;
    severity: "info" | "warning";
    message: string;
    excludedCount?: number;
};
export type VolumeMarketFacts = {
    symbol: string;
    asOfTimestamp: number;
    currentVolume?: number;
    rollingAverageVolume?: number;
    relativeVolume?: number;
    dollarVolume?: number;
    volumeState: VolumeState;
    liquidityQuality: LiquidityQuality;
    accelerationState: VolumeAccelerationState;
    pullbackVolumeState: PullbackVolumeState;
    breakoutVolumeState: BreakoutVolumeState;
    diagnostics: VolumeMarketFactDiagnostic[];
};
export type BuildVolumeMarketFactsRequest = {
    symbol: string;
    asOfTimestamp: number;
    candles5m: Candle[];
    referencePrice?: number;
    rollingWindowCandles?: number;
};
export declare function buildVolumeMarketFacts(request: BuildVolumeMarketFactsRequest): VolumeMarketFacts;
//# sourceMappingURL=volume-market-facts.d.ts.map