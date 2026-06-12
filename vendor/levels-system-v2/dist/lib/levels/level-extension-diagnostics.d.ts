import { type LevelExtensionCandidatePoolMode, type LevelExtensionSelectionSkipReason } from "./level-extension-engine.js";
import type { FinalLevelZone, LevelEngineOutput, LevelLadderExtension } from "./level-types.js";
export type LevelExtensionDiagnosticSide = "support" | "resistance";
export type LevelExtensionSkipReason = LevelExtensionSelectionSkipReason;
export type LevelExtensionCoverageWarning = "missing_resistance_extension" | "missing_support_extension" | "limited_upside_extension_coverage" | "limited_downside_extension_coverage" | "insufficient_candidate_inventory";
export type LevelExtensionCandidateDiagnostic = {
    id: string;
    price: number;
    zoneLow: number;
    zoneHigh: number;
    isSurfaced: boolean;
    isPreSelectionCandidate: boolean;
    isEligibleExtensionCandidate: boolean;
    isSelectedExtension: boolean;
    usefulnessScore: number;
    skipReasons: LevelExtensionSkipReason[];
};
export type LevelExtensionSideDiagnostics = {
    symbol: string;
    referencePrice?: number;
    side: LevelExtensionDiagnosticSide;
    surfacedLevelPrices: number[];
    inputInventoryPrices: number[];
    candidatePoolMode?: LevelExtensionCandidatePoolMode;
    preSelectionCandidatePrices: number[];
    candidatePoolPrices: number[];
    eligibleCandidatePrices: number[];
    selectedExtensionPrices: number[];
    skippedCandidatePrices: number[];
    candidateCoveragePct?: number;
    selectedCoveragePct?: number;
    candidates: LevelExtensionCandidateDiagnostic[];
    rejectionReasonCounts: Partial<Record<LevelExtensionSkipReason, number>>;
    insufficientCandidateInventory: boolean;
    syntheticGenerationAvailable: boolean;
    undeterminedRejectionCount: number;
    notes: string[];
};
export type LevelExtensionCoverageDiagnostics = {
    supportExtensions: number;
    resistanceExtensions: number;
    lowestSupportExtension?: number;
    highestResistanceExtension?: number;
    downsideCoveragePct?: number;
    upsideCoveragePct?: number;
    warnings: LevelExtensionCoverageWarning[];
};
export type BuildLevelExtensionDiagnosticsRequest = {
    symbol: string;
    referencePrice?: number;
    supportZones: FinalLevelZone[];
    resistanceZones: FinalLevelZone[];
    surfacedSupport: FinalLevelZone[];
    surfacedResistance: FinalLevelZone[];
    selectedExtensions?: LevelLadderExtension;
    maxExtensionPerSide?: number;
    spacingPct?: number;
    searchWindowPct?: number;
    forwardPlanningRangePct?: number;
    coverageWarningPct?: number;
    diagnostics?: string[];
};
export type LevelExtensionDiagnosticsReport = {
    symbol: string;
    referencePrice?: number;
    support: LevelExtensionSideDiagnostics;
    resistance: LevelExtensionSideDiagnostics;
    extensionCoverage: LevelExtensionCoverageDiagnostics;
    warnings: LevelExtensionCoverageWarning[];
    diagnostics: string[];
    safety: {
        extensionGenerationUnchanged: true;
        supportResistanceDetectionUnchanged: true;
        noRuntimeBehaviorChange: true;
        noScoringChange: true;
        reviewOnly: true;
    };
};
export declare function buildLevelExtensionDiagnostics(request: BuildLevelExtensionDiagnosticsRequest): LevelExtensionDiagnosticsReport;
export declare function buildLevelExtensionDiagnosticsFromOutput(output: LevelEngineOutput, options?: {
    coverageWarningPct?: number;
    forwardPlanningRangePct?: number;
    spacingPct?: number;
}): LevelExtensionDiagnosticsReport;
//# sourceMappingURL=level-extension-diagnostics.d.ts.map