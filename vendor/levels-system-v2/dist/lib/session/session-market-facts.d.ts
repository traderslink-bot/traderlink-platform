import type { Candle } from "../market-data/candle-types.js";
export type SessionMarketFactDiagnosticCode = "future_candles_filtered" | "partial_candles_filtered" | "no_closed_session_candles" | "no_premarket_candles" | "no_regular_session_candles" | "zero_volume_for_vwap";
export type SessionMarketFactDiagnostic = {
    code: SessionMarketFactDiagnosticCode;
    severity: "info" | "warning";
    message: string;
    excludedCount?: number;
};
export type SessionConsolidationRange = {
    low: number;
    high: number;
    startTimestamp: number;
    endTimestamp: number;
};
export type SessionMarketFacts = {
    symbol: string;
    asOfTimestamp: number;
    sessionDate: string;
    previousClose?: number;
    regularSessionOpen?: number;
    currentPrice?: number;
    premarketHigh?: number;
    premarketLow?: number;
    premarketHighTimestamp?: number;
    premarketLowTimestamp?: number;
    openingRangeHigh?: number;
    openingRangeLow?: number;
    openingRangeStartTimestamp?: number;
    openingRangeEndTimestamp?: number;
    highOfDay?: number;
    lowOfDay?: number;
    highOfDayTimestamp?: number;
    lowOfDayTimestamp?: number;
    vwap?: number;
    aboveVWAP?: boolean;
    percentFromVWAP?: number;
    firstPullbackLow?: number;
    firstPullbackLowTimestamp?: number;
    firstBreakoutHigh?: number;
    firstBreakoutHighTimestamp?: number;
    firstConsolidationRange?: SessionConsolidationRange;
    diagnostics: SessionMarketFactDiagnostic[];
};
export type BuildSessionMarketFactsRequest = {
    symbol: string;
    asOfTimestamp: number;
    candles5m: Candle[];
    previousClose?: number;
    currentPrice?: number;
};
export declare function buildSessionMarketFacts(request: BuildSessionMarketFactsRequest): SessionMarketFacts;
//# sourceMappingURL=session-market-facts.d.ts.map