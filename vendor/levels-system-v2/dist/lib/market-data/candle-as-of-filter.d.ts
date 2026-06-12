import type { Candle, CandleFetchTimeframe } from "./candle-types.js";
export type CandleAsOfFilterDiagnosticCode = "future_candles_filtered" | "partial_candles_filtered";
export type CandleAsOfFilterDiagnostic = {
    code: CandleAsOfFilterDiagnosticCode;
    severity: "info";
    timeframe: CandleFetchTimeframe;
    excludedCount: number;
    message: string;
};
export type FilterCandlesByCloseAsOfRequest = {
    candles: Candle[];
    timeframe: CandleFetchTimeframe;
    asOfTimestamp?: number | null;
};
export type FilterCandlesByCloseAsOfResult = {
    candles: Candle[];
    diagnostics: CandleAsOfFilterDiagnostic[];
    excludedFutureCount: number;
    excludedPartialCount: number;
};
export declare function candleCloseTimestamp(candle: Candle, timeframe: CandleFetchTimeframe): number;
export declare function candleIsClosedAsOf(candle: Candle, timeframe: CandleFetchTimeframe, asOfTimestamp: number): boolean;
export declare function filterCandlesByCloseAsOf(request: FilterCandlesByCloseAsOfRequest): FilterCandlesByCloseAsOfResult;
//# sourceMappingURL=candle-as-of-filter.d.ts.map