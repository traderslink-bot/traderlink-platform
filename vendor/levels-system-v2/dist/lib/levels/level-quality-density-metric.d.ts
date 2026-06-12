import type { LevelQualityAuditBucket, LevelQualityAuditItem } from "./level-quality-audit-runner.js";
export type LevelQualityDensityClassification = "sparse" | "balanced" | "dense_separated" | "dense_clustered";
export type LevelQualityDensitySideBias = "none" | "support_heavy" | "resistance_heavy" | "mixed";
export type LevelQualityDensityBucket = "historical" | "extension" | "synthetic";
export type LevelQualityDensityRow = Pick<LevelQualityAuditItem, "levelId" | "kind" | "bucket" | "representativePrice" | "isExtension" | "syntheticContinuationMap">;
export type LevelQualityDensityMetricThresholds = {
    auditWindowPct: number;
    sparseBelowCount: number;
    denseAtOrAboveCount: number;
    sideHeavyShare: number;
    extensionHeavyShare: number;
};
export type LevelQualityDensityMetricInput = {
    rows: readonly LevelQualityDensityRow[];
    referencePrice?: number;
    diagnostics?: readonly string[];
    clusteredAreaCount?: number;
    thresholds?: Partial<LevelQualityDensityMetricThresholds>;
};
export type LevelQualityDensityMetric = {
    schemaVersion: "level-quality-density-metric/v1";
    classification: LevelQualityDensityClassification;
    sideBias: LevelQualityDensitySideBias;
    auditWindowPct: number;
    referencePrice?: number;
    totalRows: number;
    rowsInsideAuditWindow: number;
    counts: {
        support: number;
        resistance: number;
        historical: number;
        extension: number;
        synthetic: number;
    };
    bucketCounts: Record<LevelQualityAuditBucket, number>;
    densityBuckets: Record<LevelQualityDensityBucket, number>;
    flags: {
        clusteredAreasPresent: boolean;
        denseButSeparated: boolean;
        extensionHeavy: boolean;
        syntheticPresent: boolean;
    };
    thresholds: LevelQualityDensityMetricThresholds;
    diagnostics: string[];
    safety: {
        auditOnly: true;
        generatedLevelsUnchanged: true;
        rankingUnchanged: true;
        clusteringUnchanged: true;
        surfacedLevelsUnchanged: true;
        extensionGenerationUnchanged: true;
    };
};
export type LevelQualityDensityMetricValidationResult = {
    valid: boolean;
    errors: string[];
};
export declare function classifyLevelMapDensity(input: LevelQualityDensityMetricInput): LevelQualityDensityMetric;
export declare function describeLevelQualityDensityMetric(metric: LevelQualityDensityMetric): string;
export declare function validateLevelQualityDensityMetric(value: unknown): LevelQualityDensityMetricValidationResult;
export declare function isLevelQualityDensityMetric(value: unknown): value is LevelQualityDensityMetric;
export declare function assertLevelQualityDensityMetricFactsOnly(value: unknown): asserts value is LevelQualityDensityMetric;
//# sourceMappingURL=level-quality-density-metric.d.ts.map