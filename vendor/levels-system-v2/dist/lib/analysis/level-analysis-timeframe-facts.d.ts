export declare const FIFTEEN_MINUTE_FACTS_SCHEMA_VERSION = "level-analysis-15m-facts/v1";
export type FifteenMinuteFactAvailabilityStatus = "unavailable" | "limited" | "available";
export type FifteenMinuteRangeState = "unknown" | "compressed" | "normal" | "expanded";
export type FifteenMinuteReferencePosition = "unknown" | "below_recent_range" | "near_recent_low" | "inside_recent_range" | "near_recent_high" | "above_recent_range";
export type FifteenMinuteTrendState = "unknown" | "mixed" | "up" | "down" | "sideways";
export type FifteenMinuteCloseLocation = "unknown" | "upper_third" | "middle_third" | "lower_third";
export type FifteenMinuteVolumeState = "unknown" | "low" | "normal" | "elevated" | "high" | "extreme";
export type FifteenMinuteParticipationState = "unknown" | "fading" | "steady" | "building" | "surging";
export type FifteenMinuteStructureState = "unknown" | "not_present" | "present";
export type FifteenMinuteFactDiagnosticSeverity = "info" | "warning" | "error";
export type FifteenMinuteFactLimitation = "15m_input_not_provided" | "15m_closed_candles_missing" | "15m_insufficient_trend_history" | "15m_insufficient_volume_history" | "15m_facts_contract_only" | "15m_future_candles_filtered" | "15m_partial_candles_filtered" | string;
export type FifteenMinuteDataCompleteness = {
    availabilityStatus: FifteenMinuteFactAvailabilityStatus;
    provided: boolean;
    rawCandleCount: number;
    closedCandleCount: number;
    excludedFutureCandleCount: number;
    excludedPartialCandleCount: number;
    firstClosedTimestamp?: number;
    lastClosedTimestamp?: number;
    sufficientForTrendFacts: boolean;
    sufficientForVolumeFacts: boolean;
};
export type FifteenMinuteRangeFacts = {
    lookbackCandleCount: number;
    recentHigh?: number;
    recentLow?: number;
    recentMidpoint?: number;
    latestRangePct?: number;
    averageRangePct?: number;
    rangeState: FifteenMinuteRangeState;
    referencePosition: FifteenMinuteReferencePosition;
};
export type FifteenMinuteTrendFacts = {
    trendState: FifteenMinuteTrendState;
    higherCloseCount: number;
    lowerCloseCount: number;
    greenCandleCount: number;
    redCandleCount: number;
    latestCloseLocation: FifteenMinuteCloseLocation;
};
export type FifteenMinuteVolumeFacts = {
    volumeState: FifteenMinuteVolumeState;
    latestVolume?: number;
    rollingAverageVolume?: number;
    relativeVolume?: number;
    dollarVolume?: number;
    participationState: FifteenMinuteParticipationState;
};
export type FifteenMinuteStructureFacts = {
    consolidationState: FifteenMinuteStructureState;
    pullbackState: FifteenMinuteStructureState;
    continuationState: FifteenMinuteStructureState;
    recentHighTimestamp?: number;
    recentLowTimestamp?: number;
};
export type FifteenMinuteFactDiagnostic = {
    code: string;
    severity: FifteenMinuteFactDiagnosticSeverity;
    message: string;
};
export type FifteenMinuteFactSafety = {
    noLookaheadApplied: boolean;
    levelOutputUnchanged: true;
    factsOnly: true;
    noRuntimeBehaviorChange: true;
};
export type FifteenMinuteFacts = {
    schemaVersion: typeof FIFTEEN_MINUTE_FACTS_SCHEMA_VERSION;
    symbol: string;
    asOfTimestamp: number;
    dataCompleteness: FifteenMinuteDataCompleteness;
    range: FifteenMinuteRangeFacts;
    trend: FifteenMinuteTrendFacts;
    volume?: FifteenMinuteVolumeFacts;
    structure: FifteenMinuteStructureFacts;
    diagnostics: FifteenMinuteFactDiagnostic[];
    limitations: FifteenMinuteFactLimitation[];
    safety: FifteenMinuteFactSafety;
};
export type LevelAnalysisTimeframeFacts = {
    "15m"?: FifteenMinuteFacts;
};
export type FifteenMinuteFactsValidationResult = {
    valid: boolean;
    errors: string[];
};
export type CreateUnavailableFifteenMinuteFactsInput = {
    symbol: string;
    asOfTimestamp: number;
    rawCandleCount?: number;
    excludedFutureCandleCount?: number;
    excludedPartialCandleCount?: number;
    diagnostics?: FifteenMinuteFactDiagnostic[];
    limitations?: FifteenMinuteFactLimitation[];
};
export type FifteenMinuteFactsSummary = {
    schemaVersion: typeof FIFTEEN_MINUTE_FACTS_SCHEMA_VERSION;
    symbol: string;
    asOfTimestamp: number;
    availabilityStatus: FifteenMinuteFactAvailabilityStatus;
    closedCandleCount: number;
    rangeState: FifteenMinuteRangeState;
    trendState: FifteenMinuteTrendState;
    volumeState: FifteenMinuteVolumeState;
    limitationCount: number;
    diagnosticCount: number;
    noLookaheadApplied: boolean;
    levelOutputUnchanged: true;
    factsOnly: true;
    noRuntimeBehaviorChange: true;
};
export declare function assertFifteenMinuteFactsAreFactsOnly(value: unknown): void;
export declare function validateFifteenMinuteFacts(value: unknown): FifteenMinuteFactsValidationResult;
export declare function isFifteenMinuteFacts(value: unknown): value is FifteenMinuteFacts;
export declare function createUnavailableFifteenMinuteFacts(input: CreateUnavailableFifteenMinuteFactsInput): FifteenMinuteFacts;
export declare function summarizeFifteenMinuteFacts(value: FifteenMinuteFacts): FifteenMinuteFactsSummary;
//# sourceMappingURL=level-analysis-timeframe-facts.d.ts.map