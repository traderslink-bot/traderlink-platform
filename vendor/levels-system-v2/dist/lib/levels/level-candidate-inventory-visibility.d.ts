export type LevelCandidateInventoryStage = "raw" | "clustered" | "scored" | "surfaced" | "extension_candidate" | "extension_selected";
export type LevelCandidateInventorySide = "support" | "resistance";
export type LevelCandidateInventoryGapClassification = "no_gap" | "closer_unsurfaced_candidate" | "truthful_market_context_gap" | "inconclusive_missing_reasons";
export type LevelCandidateInventoryReasonAvailability = "available" | "not_available" | "not_needed";
export type LevelCandidateInventoryStageSummary = {
    stage: LevelCandidateInventoryStage;
    support: number;
    resistance: number;
    total: number;
    byTimeframe?: Record<string, number>;
    bySourceType?: Record<string, number>;
};
export type LevelCandidateInventoryNearest = {
    stage: LevelCandidateInventoryStage;
    side: LevelCandidateInventorySide;
    price?: number;
    distancePct?: number;
    levelId?: string;
    bucket?: string;
    surfaced?: boolean;
    timeframeBias?: string;
    sourceTypes?: string[];
};
export type LevelCandidateInventoryUnsurfacedCloserSummary = {
    side: LevelCandidateInventorySide;
    present: boolean;
    count: number;
    nearest?: LevelCandidateInventoryNearest;
    reasonAvailability: LevelCandidateInventoryReasonAvailability;
    reasons: string[];
    limitations: string[];
};
export type LevelCandidateInventoryVisibility = {
    schemaVersion: "level-candidate-inventory-visibility/v1";
    symbol: string;
    provider?: string;
    asOfTimestamp?: number;
    asOfIso?: string;
    referencePrice?: number;
    sourceFiles: Partial<Record<"5m" | "15m" | "4h" | "daily", string>>;
    stageCounts: Record<LevelCandidateInventoryStage, LevelCandidateInventoryStageSummary>;
    nearest: Record<LevelCandidateInventoryStage, Partial<Record<LevelCandidateInventorySide, LevelCandidateInventoryNearest>>>;
    unsurfacedCloser: Record<LevelCandidateInventorySide, LevelCandidateInventoryUnsurfacedCloserSummary>;
    gapClassification: {
        support: LevelCandidateInventoryGapClassification;
        resistance: LevelCandidateInventoryGapClassification;
        overall: LevelCandidateInventoryGapClassification;
    };
    diagnostics: string[];
    limitations: string[];
    safety: {
        readOnly: true;
        auditOnly: true;
        providerCallsMade: false;
        cacheFilesWritten: false;
        rawCandlesIncluded: false;
        fullSnapshotsIncluded: false;
        supportResistanceDetectionChanged: false;
        levelEngineScoringRankingClusteringChanged: false;
        surfacedLevelsChanged: false;
        extensionGenerationChanged: false;
        fifteenMinuteFedIntoLevelEngine: false;
    };
};
export type LevelCandidateInventoryVisibilityValidationResult = {
    valid: boolean;
    errors: string[];
};
export type LevelCandidateInventoryGapSummary = {
    support: LevelCandidateInventoryGapClassification;
    resistance: LevelCandidateInventoryGapClassification;
    overall: LevelCandidateInventoryGapClassification;
};
export declare function validateLevelCandidateInventoryVisibility(value: unknown): LevelCandidateInventoryVisibilityValidationResult;
export declare function isLevelCandidateInventoryVisibility(value: unknown): value is LevelCandidateInventoryVisibility;
export declare function summarizeLevelCandidateInventoryGaps(value: LevelCandidateInventoryVisibility): LevelCandidateInventoryGapSummary;
export declare function assertLevelCandidateInventoryVisibilityFactsOnly(value: unknown): asserts value is LevelCandidateInventoryVisibility;
//# sourceMappingURL=level-candidate-inventory-visibility.d.ts.map