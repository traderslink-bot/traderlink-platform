import { type LevelQualityReviewCacheFingerprint, type LevelQualityReviewCacheFingerprintProvider, type LevelQualityReviewCacheFingerprintSet, type LevelQualityReviewCacheFingerprintTimeframe } from "./level-quality-review-cache-fingerprint.js";
export type LevelQualityReviewCacheFingerprintBuildInput = {
    relativePath: string;
    rawCacheWrapper: string;
    parsedCacheWrapper: unknown;
    provider: LevelQualityReviewCacheFingerprintProvider;
    symbol: string;
    timeframe: LevelQualityReviewCacheFingerprintTimeframe;
    asOfTimestamp?: number;
    includedInLevelEngine?: boolean;
    contextOnly?: boolean;
};
export type LevelQualityReviewCacheFingerprintSetBuildInput = {
    generatedAt?: string;
    provider?: LevelQualityReviewCacheFingerprintProvider;
    fingerprints: LevelQualityReviewCacheFingerprint[];
};
export declare function buildLevelQualityReviewCacheFingerprint(input: LevelQualityReviewCacheFingerprintBuildInput): LevelQualityReviewCacheFingerprint;
export declare function buildLevelQualityReviewCacheFingerprintSet(input: LevelQualityReviewCacheFingerprintSetBuildInput): LevelQualityReviewCacheFingerprintSet;
//# sourceMappingURL=level-quality-review-cache-fingerprint-builder.d.ts.map