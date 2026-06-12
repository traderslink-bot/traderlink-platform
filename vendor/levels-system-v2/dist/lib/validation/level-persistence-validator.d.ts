import type { LevelEngineOutput } from "../levels/level-types.js";
export type SurfacedLevelBucket = "daily" | "4h" | "5m";
export type LevelPersistenceValidatorOptions = {
    priceTolerancePct?: number;
    priceToleranceAbsolute?: number;
    looseMatchToleranceRatio?: number;
};
export type LevelPersistenceRunSummary = {
    fromGeneratedAt: number;
    toGeneratedAt: number;
    supportPersistenceRate: number;
    resistancePersistenceRate: number;
    supportBucketPersistenceRate: Record<SurfacedLevelBucket, number>;
    extensionSupportPersistenceRate: number;
    extensionResistancePersistenceRate: number;
    surfacedSupportChurnRate: number;
    surfacedResistanceChurnRate: number;
    supportLooseMatchRate: number;
    resistanceLooseMatchRate: number;
    supportBucketLooseMatchRate: Record<SurfacedLevelBucket, number>;
    averageMatchedDriftPct: number;
};
export type LevelPersistenceValidationReport = {
    totalRunsCompared: number;
    averageSupportPersistenceRate: number;
    averageResistancePersistenceRate: number;
    averageSupportBucketPersistenceRate: Record<SurfacedLevelBucket, number>;
    averageExtensionSupportPersistenceRate: number;
    averageExtensionResistancePersistenceRate: number;
    averageSurfacedSupportChurnRate: number;
    averageSurfacedResistanceChurnRate: number;
    averageSupportLooseMatchRate: number;
    averageResistanceLooseMatchRate: number;
    averageSupportBucketLooseMatchRate: Record<SurfacedLevelBucket, number>;
    averageMatchedDriftPct: number;
    runSummaries: LevelPersistenceRunSummary[];
};
export declare function validateLevelPersistence(outputs: LevelEngineOutput[], options?: LevelPersistenceValidatorOptions): LevelPersistenceValidationReport;
export declare function formatLevelPersistenceReport(report: LevelPersistenceValidationReport): string[];
//# sourceMappingURL=level-persistence-validator.d.ts.map