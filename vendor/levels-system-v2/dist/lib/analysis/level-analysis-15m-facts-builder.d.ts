import type { Candle } from "../market-data/candle-types.js";
import { type FifteenMinuteCloseLocation, type FifteenMinuteFacts, type FifteenMinuteRangeState, type FifteenMinuteReferencePosition, type FifteenMinuteStructureFacts, type FifteenMinuteTrendState, type FifteenMinuteVolumeFacts } from "./level-analysis-timeframe-facts.js";
export declare const FIFTEEN_MINUTE_TREND_FACT_MIN_CANDLES = 4;
export declare const FIFTEEN_MINUTE_VOLUME_FACT_MIN_CANDLES = 4;
export type BuildFifteenMinuteFactsInput = {
    symbol: string;
    asOfTimestamp: number;
    referencePrice?: number;
    rawCandleCount: number;
    closedCandles: Candle[];
    excludedFutureCandleCount?: number;
    excludedPartialCandleCount?: number;
};
export type FifteenMinuteCandleWindowSummary = {
    firstClosedTimestamp?: number;
    lastClosedTimestamp?: number;
    recentHigh?: number;
    recentLow?: number;
    recentMidpoint?: number;
    recentHighTimestamp?: number;
    recentLowTimestamp?: number;
    latestRangePct?: number;
    averageRangePct?: number;
    rangeState: FifteenMinuteRangeState;
    referencePosition: FifteenMinuteReferencePosition;
    trendState: FifteenMinuteTrendState;
    higherCloseCount: number;
    lowerCloseCount: number;
    greenCandleCount: number;
    redCandleCount: number;
    latestCloseLocation: FifteenMinuteCloseLocation;
    volume?: FifteenMinuteVolumeFacts;
    structure: FifteenMinuteStructureFacts;
};
export declare function summarizeFifteenMinuteCandleWindow(candles: Candle[], referencePrice?: number): FifteenMinuteCandleWindowSummary;
export declare function buildUnavailableFifteenMinuteFactsFromInput(input: Omit<BuildFifteenMinuteFactsInput, "closedCandles"> & {
    closedCandles?: Candle[];
}): FifteenMinuteFacts;
export declare function buildFifteenMinuteFacts(input: BuildFifteenMinuteFactsInput): FifteenMinuteFacts;
//# sourceMappingURL=level-analysis-15m-facts-builder.d.ts.map