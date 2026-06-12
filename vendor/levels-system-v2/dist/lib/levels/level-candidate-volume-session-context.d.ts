export type LevelCandidateVolumeSessionStage = "raw" | "clustered" | "scored" | "surfaced" | "extension_candidate" | "extension_selected";
export type LevelCandidateVolumeSessionSide = "support" | "resistance";
export type LevelCandidateSessionFactName = "vwap" | "premarket_high" | "premarket_low" | "opening_range_high" | "opening_range_low" | "high_of_day" | "low_of_day" | "previous_close" | "regular_session_open";
export type LevelCandidateSessionFactRelation = "overlaps" | "near" | "outside_threshold";
export type LevelCandidateVolumeShelfRelation = "overlaps" | "near";
export type LevelCandidateVolumeShelfRole = "unknown" | "support" | "resistance" | "chop_zone" | "magnet";
export type LevelCandidateVolumeSessionComparisonOutcome = "surfaced_has_more_session_volume_context" | "unsurfaced_has_more_session_volume_context" | "similar_session_volume_context" | "missing_facts_inconclusive" | "candidate_identifier_unavailable" | "no_nearby_session_volume_context";
export type LevelCandidateSessionFactProximity = {
    fact: LevelCandidateSessionFactName;
    price: number;
    distancePct: number;
    relation: LevelCandidateSessionFactRelation;
    factsOnly: true;
};
export type LevelCandidateVolumeShelfOverlap = {
    shelfId: string;
    zoneLow: number;
    zoneHigh: number;
    representativePrice: number;
    relation: LevelCandidateVolumeShelfRelation;
    shelfRole: LevelCandidateVolumeShelfRole;
    totalVolume?: number;
    dollarVolume?: number;
    percentOfWindowVolume?: number;
    factsOnly: true;
};
export type LevelCandidateVolumeSessionContextRow = {
    rowId: string;
    levelId?: string;
    candidateId?: string;
    side: LevelCandidateVolumeSessionSide;
    stage: LevelCandidateVolumeSessionStage;
    price: number;
    zoneLow?: number;
    zoneHigh?: number;
    distanceFromReferencePct?: number;
    session: {
        nearbyFacts: LevelCandidateSessionFactProximity[];
        vwap?: LevelCandidateSessionFactProximity;
        diagnostics: string[];
    };
    volume: {
        relativeVolume?: number;
        dollarVolume?: number;
        volumeState?: string;
        liquidityQuality?: string;
        accelerationState?: string;
        pullbackVolumeState?: string;
        breakoutVolumeState?: string;
        diagnostics: string[];
    };
    shelves: {
        nearbyShelfIds: string[];
        overlaps: LevelCandidateVolumeShelfOverlap[];
        diagnostics: string[];
    };
    diagnostics: string[];
    safety: {
        factsOnly: true;
        noLevelSelectionChange: true;
        noRankingChange: true;
        noRuntimeBehaviorChange: true;
        vwapFactsOnly: true;
        shelvesAreFactsOnly: true;
    };
};
export type LevelCandidateVolumeSessionComparisonSummary = {
    outcome: LevelCandidateVolumeSessionComparisonOutcome;
    support?: LevelCandidateVolumeSessionComparisonOutcome;
    resistance?: LevelCandidateVolumeSessionComparisonOutcome;
    comparedRowIds: string[];
    surfacedRowIds: string[];
    unsurfacedRowIds: string[];
    diagnostics: string[];
};
export type LevelCandidateVolumeSessionContext = {
    schemaVersion: "level-candidate-volume-session-context/v1";
    symbol: string;
    provider: string;
    asOfTimestamp: number;
    asOfIso?: string;
    referencePrice?: number;
    contexts: LevelCandidateVolumeSessionContextRow[];
    comparisonSummary: LevelCandidateVolumeSessionComparisonSummary;
    diagnostics: string[];
    safety: {
        factsOnly: true;
        noLevelSelectionChange: true;
        noRankingChange: true;
        noRuntimeBehaviorChange: true;
        vwapFactsOnly: true;
        shelvesAreFactsOnly: true;
        fifteenMinuteFedIntoLevelEngine: false;
        volumeSessionFactsUsedForScoringOrSurfacedSelection: false;
        supportResistanceDetectionChanged: false;
        levelEngineScoringRankingClusteringChanged: false;
        surfacedLevelsChanged: false;
        extensionGenerationChanged: false;
        providerCallsMade: false;
        cacheFilesWritten: false;
        rawCandlesIncluded: false;
        fullSnapshotsIncluded: false;
    };
};
export type LevelCandidateVolumeSessionContextValidationResult = {
    valid: boolean;
    errors: string[];
};
export declare function validateLevelCandidateVolumeSessionContext(value: unknown): LevelCandidateVolumeSessionContextValidationResult;
export declare function isLevelCandidateVolumeSessionContext(value: unknown): value is LevelCandidateVolumeSessionContext;
export declare function assertLevelCandidateVolumeSessionContextFactsOnly(value: unknown): asserts value is LevelCandidateVolumeSessionContext;
//# sourceMappingURL=level-candidate-volume-session-context.d.ts.map