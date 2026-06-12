import type { Candle } from "../market-data/candle-types.js";
export type MarketContextPrimary = "normal_intraday" | "premarket_runner" | "day_trade_runner" | "press_release_runner" | "swing_structure" | "failed_runner" | "choppy_low_quality" | "parabolic_extension";
export type RunnerPhase = "not_applicable" | "premarket_discovery" | "opening_drive" | "first_pullback" | "vwap_hold" | "vwap_reclaim" | "high_of_day_breakout" | "second_leg_attempt" | "parabolic_extension" | "failed_breakout" | "fade";
export type MarketContextEvidence = {
    code: string;
    context: MarketContextPrimary;
    message: string;
    weight: number;
};
export type MarketContextWarning = {
    code: string;
    severity: "info" | "warning";
    message: string;
};
export type MarketContextFacts = {
    percentFromPreviousClose?: number;
    percentFromOpen?: number;
    percentFromVWAP?: number;
    relativeVolume?: number;
    dollarVolume?: number;
    aboveVWAP?: boolean;
    abovePremarketHigh?: boolean;
    aboveOpeningRangeHigh?: boolean;
    nearHighOfDay?: boolean;
    premarketHigh?: number;
    openingRangeHigh?: number;
    highOfDay?: number;
    filteredCandleCount: number;
    filteredPremarketCandleCount: number;
    filteredRegularSessionCandleCount: number;
};
export type MarketContextScoringAdjustments = {
    intradayWeightMultiplier: number;
    dailyWeightMultiplier: number;
    sessionLevelWeightMultiplier: number;
    volumeWeightMultiplier: number;
    extensionRiskPenaltyMultiplier: number;
};
export type MarketContextProfile = {
    primaryContext: MarketContextPrimary;
    confidence: number;
    runnerPhase: RunnerPhase;
    evidence: MarketContextEvidence[];
    warnings: MarketContextWarning[];
    facts: MarketContextFacts;
    scoringAdjustments: MarketContextScoringAdjustments;
};
export type MarketContextHigherTimeframeStructure = {
    dailyLevelNearPrice?: boolean;
    fourHourLevelNearPrice?: boolean;
    multiDayTrend?: "up" | "down" | "range";
};
export type ClassifyMarketContextInput = {
    symbol: string;
    asOfTimestamp: number;
    referencePrice: number;
    candles5m?: Candle[];
    premarketCandles?: Candle[];
    regularSessionCandles?: Candle[];
    previousClose?: number;
    vwap?: number;
    relativeVolume?: number;
    dollarVolume?: number;
    failedHighOfDayAttempts?: number;
    newsTimestamp?: number;
    pressReleaseTimestamp?: number;
    higherTimeframeStructure?: MarketContextHigherTimeframeStructure;
};
export declare function classifyMarketContext(input: ClassifyMarketContextInput): MarketContextProfile;
//# sourceMappingURL=market-context-classifier.d.ts.map