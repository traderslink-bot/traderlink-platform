import type { Candle } from "../market-data/candle-types.js";
import { type CandleAsOfFilterDiagnostic } from "../market-data/candle-as-of-filter.js";
import { type ClassifyMarketContextInput, type MarketContextHigherTimeframeStructure, type MarketContextProfile, type MarketContextWarning } from "./market-context-classifier.js";
export type MarketContextAnalysisMetadata = {
    generatedAsOfTimestamp: number;
    source: "market_context_classifier";
    version: 1;
    profile: MarketContextProfile;
    inputSummary: {
        symbol: string;
        closedFiveMinuteCandles: number;
        premarketCandles: number;
        regularSessionCandles: number;
        hasPreviousClose: boolean;
        hasVWAPFact: boolean;
        hasRelativeVolume: boolean;
        hasDollarVolume: boolean;
        hasExplicitCatalyst: boolean;
    };
    diagnostics: {
        futureCandlesExcluded: number;
        partialCandlesExcluded: number;
        filterDiagnostics: CandleAsOfFilterDiagnostic[];
        warnings: MarketContextWarning[];
    };
};
export type MarketContextClassifierInputAdapterRequest = {
    symbol: string;
    asOfTimestamp: number;
    referencePrice: number;
    candles5m: Candle[];
    previousClose?: number;
    vwap?: number;
    relativeVolume?: number;
    dollarVolume?: number;
    failedHighOfDayAttempts?: number;
    newsTimestamp?: number;
    pressReleaseTimestamp?: number;
    higherTimeframeStructure?: MarketContextHigherTimeframeStructure;
};
export type MarketContextClassifierInputAdapterResult = {
    input: ClassifyMarketContextInput;
    inputSummary: MarketContextAnalysisMetadata["inputSummary"];
    diagnostics: Omit<MarketContextAnalysisMetadata["diagnostics"], "warnings">;
};
export type MarketContextClassifierInputAdapter = (request: MarketContextClassifierInputAdapterRequest) => MarketContextClassifierInputAdapterResult;
export type MarketContextIntegrationResult = {
    marketContext: MarketContextAnalysisMetadata;
    levelOutputUnchanged: true;
};
export declare const buildMarketContextClassifierInput: MarketContextClassifierInputAdapter;
export declare function buildMarketContextAnalysis(request: MarketContextClassifierInputAdapterRequest): MarketContextIntegrationResult;
//# sourceMappingURL=market-context-integration.d.ts.map