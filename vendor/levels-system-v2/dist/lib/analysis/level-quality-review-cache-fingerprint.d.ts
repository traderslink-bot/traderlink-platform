export type LevelQualityReviewCacheFingerprintTimeframe = "5m" | "15m" | "4h" | "daily";
export type LevelQualityReviewCacheFingerprintProvider = "ibkr" | "stub" | "twelve_data";
export type LevelQualityReviewCacheFingerprintSafety = {
    rawCandlesIncluded: false;
    rawCacheWrapperPayloadsIncluded: false;
    fullSnapshotsIncluded: false;
    providerCallsMade: false;
    cacheFilesWritten: false;
    fifteenMinuteFedIntoLevelEngine: false;
};
export type LevelQualityReviewCacheFingerprint = {
    schemaVersion: "level-quality-review-cache-fingerprint/v1";
    relativePath: string;
    provider: LevelQualityReviewCacheFingerprintProvider;
    symbol: string;
    timeframe: LevelQualityReviewCacheFingerprintTimeframe;
    sha256: string;
    wrapperCandleCount: number;
    requestLookbackBars: number;
    requestEndTimestamp: number;
    actualBarsReturned: number;
    validationIssueCount: number;
    firstCandleTimestamp?: number;
    lastCandleTimestamp?: number;
    asOfTimestamp?: number;
    includedInLevelEngine?: boolean;
    contextOnly?: boolean;
    safety: LevelQualityReviewCacheFingerprintSafety;
};
export type LevelQualityReviewCacheFingerprintSet = {
    schemaVersion: "level-quality-review-cache-fingerprint-set/v1";
    generatedAt?: string;
    provider?: LevelQualityReviewCacheFingerprintProvider;
    fingerprints: LevelQualityReviewCacheFingerprint[];
};
export type LevelQualityReviewCacheFingerprintValidationResult = {
    valid: boolean;
    errors: string[];
};
export type LevelQualityReviewCacheFingerprintSummary = {
    totalFingerprints: number;
    symbolCount: number;
    symbols: string[];
    providerCounts: Partial<Record<LevelQualityReviewCacheFingerprintProvider, number>>;
    timeframeCounts: Partial<Record<LevelQualityReviewCacheFingerprintTimeframe, number>>;
    levelEngineInputCount: number;
    contextOnlyCount: number;
    fifteenMinuteContextOnlyCount: number;
    validationIssueCount: number;
    wrapperCandleCount: number;
    actualBarsReturned: number;
    hasValidationIssues: boolean;
    firstCandleTimestamp?: number;
    lastCandleTimestamp?: number;
};
export declare function validateLevelQualityReviewCacheFingerprint(value: unknown): LevelQualityReviewCacheFingerprintValidationResult;
export declare function isLevelQualityReviewCacheFingerprint(value: unknown): value is LevelQualityReviewCacheFingerprint;
export declare function validateLevelQualityReviewCacheFingerprintSet(value: unknown): LevelQualityReviewCacheFingerprintValidationResult;
export declare function isLevelQualityReviewCacheFingerprintSet(value: unknown): value is LevelQualityReviewCacheFingerprintSet;
export declare function summarizeLevelQualityReviewCacheFingerprints(value: LevelQualityReviewCacheFingerprint | LevelQualityReviewCacheFingerprint[] | LevelQualityReviewCacheFingerprintSet): LevelQualityReviewCacheFingerprintSummary;
export declare function assertLevelQualityReviewCacheFingerprintFactsOnly(value: unknown): asserts value is LevelQualityReviewCacheFingerprint | LevelQualityReviewCacheFingerprintSet;
//# sourceMappingURL=level-quality-review-cache-fingerprint.d.ts.map