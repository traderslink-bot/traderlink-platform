import type { FinalLevelZone, LevelEngineOutput, LevelKind, LevelLadderExtension, RawLevelCandidate, RawLevelCandidateSourceType } from "./level-types.js";
import type { CandleTimeframe } from "../market-data/candle-types.js";
export type LevelCandidatePoolStage = "raw" | "clustered" | "scored" | "surfaced" | "extension_candidate" | "extension_selected";
export type LevelCandidatePoolPriceRange = {
    min: number;
    max: number;
};
export type LevelCandidatePoolReferenceDepth = {
    referencePrice?: number;
    belowReferenceCount: number;
    atReferenceCount: number;
    aboveReferenceCount: number;
    nearestBelowReference?: number;
    farthestBelowReference?: number;
    nearestAboveReference?: number;
    farthestAboveReference?: number;
    deepestBelowReferencePct?: number;
    highestAboveReferencePct?: number;
};
export type LevelCandidatePoolStageSummary = {
    stage: LevelCandidatePoolStage;
    total: number;
    prices: number[];
    priceRange?: LevelCandidatePoolPriceRange;
    byTimeframe: Partial<Record<CandleTimeframe, number>>;
    byTimeframeBias: Partial<Record<CandleTimeframe | "mixed", number>>;
    bySourceType: Partial<Record<RawLevelCandidateSourceType, number>>;
    bySourceTypeSet: Record<string, number>;
    depth: LevelCandidatePoolReferenceDepth;
};
export type LevelCandidatePoolNarrowing = {
    side: LevelKind;
    from: LevelCandidatePoolStage;
    to: LevelCandidatePoolStage;
    fromCount: number;
    toCount: number;
    delta: number;
    narrowed: boolean;
    note: string;
};
export type LevelCandidatePoolSideDiagnostics = {
    side: LevelKind;
    raw: LevelCandidatePoolStageSummary;
    clustered: LevelCandidatePoolStageSummary;
    scored: LevelCandidatePoolStageSummary;
    surfaced: LevelCandidatePoolStageSummary;
    extensionCandidates: LevelCandidatePoolStageSummary;
    selectedExtensions: LevelCandidatePoolStageSummary;
    narrowing: LevelCandidatePoolNarrowing[];
    warnings: string[];
};
export type LevelCandidatePoolSurfacedBuckets = Pick<LevelEngineOutput, "majorSupport" | "majorResistance" | "intermediateSupport" | "intermediateResistance" | "intradaySupport" | "intradayResistance">;
export type BuildLevelCandidatePoolDiagnosticsInput = {
    symbol: string;
    referencePrice?: number;
    rawCandidates: RawLevelCandidate[];
    clusteredSupportZones: FinalLevelZone[];
    clusteredResistanceZones: FinalLevelZone[];
    scoredSupportZones: FinalLevelZone[];
    scoredResistanceZones: FinalLevelZone[];
    surfacedBuckets?: LevelCandidatePoolSurfacedBuckets;
    extensionLevels?: LevelLadderExtension;
    levelOutput?: LevelEngineOutput;
    forwardPlanningRangePct?: number;
};
export type LevelCandidatePoolDiagnosticsReport = {
    symbol: string;
    referencePrice?: number;
    summary: {
        rawCandidateCount: number;
        clusteredZoneCount: number;
        scoredZoneCount: number;
        surfacedLevelCount: number;
        extensionCandidateCount: number;
        selectedExtensionCount: number;
    };
    surfacedBucketCounts: {
        majorSupport: number;
        majorResistance: number;
        intermediateSupport: number;
        intermediateResistance: number;
        intradaySupport: number;
        intradayResistance: number;
    };
    support: LevelCandidatePoolSideDiagnostics;
    resistance: LevelCandidatePoolSideDiagnostics;
    narrowing: LevelCandidatePoolNarrowing[];
    diagnostics: string[];
    safety: {
        diagnosticOnly: true;
        levelOutputUnchanged: true;
        extensionGenerationUnchanged: true;
        noRuntimeBehaviorChange: true;
    };
};
export declare function buildLevelCandidatePoolDiagnostics(input: BuildLevelCandidatePoolDiagnosticsInput): LevelCandidatePoolDiagnosticsReport;
//# sourceMappingURL=level-candidate-pool-diagnostics.d.ts.map