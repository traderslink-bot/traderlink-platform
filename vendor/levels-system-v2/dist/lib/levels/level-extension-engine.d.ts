import type { FinalLevelZone, LevelLadderExtension } from "./level-types.js";
export type LevelExtensionSelectionSide = "support" | "resistance";
export type SyntheticExtensionOptions = {
    enabled?: boolean;
    minTargetCoveragePct?: number;
    maxTargetCoveragePct?: number;
    minSyntheticSpacingPct?: number;
    maxSyntheticExtensionsPerSide?: number;
};
export type LevelExtensionCandidatePoolMode = "strict_frontier" | "expanded_unselected_scored";
export type LevelExtensionSelectionSkipReason = "already_surfaced" | "wrong_side_of_reference_price" | "outside_practical_range" | "inside_surfaced_map" | "too_close_to_surfaced_level" | "too_close_to_another_extension" | "dominated_by_forward_candidate" | "not_selected_by_ladder_selection" | "selected_extension" | "undetermined";
export type LevelExtensionCandidateSelectionDiagnostic = {
    id: string;
    price: number;
    zoneLow: number;
    zoneHigh: number;
    isSurfaced: boolean;
    isPreSelectionCandidate: boolean;
    isEligibleExtensionCandidate: boolean;
    isSelectedExtension: boolean;
    usefulnessScore: number;
    skipReasons: LevelExtensionSelectionSkipReason[];
};
export type LevelExtensionSelectionSideDiagnostics = {
    side: LevelExtensionSelectionSide;
    referencePrice?: number;
    surfacedLevelPrices: number[];
    inputInventoryPrices: number[];
    candidatePoolMode: LevelExtensionCandidatePoolMode;
    preSelectionCandidatePrices: number[];
    eligibleCandidatePrices: number[];
    selectedExtensionPrices: number[];
    skippedCandidatePrices: number[];
    candidateCoveragePct?: number;
    selectedCoveragePct?: number;
    insufficientCandidateInventory: boolean;
    candidates: LevelExtensionCandidateSelectionDiagnostic[];
    rejectionReasonCounts: Partial<Record<LevelExtensionSelectionSkipReason, number>>;
};
export type LevelExtensionSelectionDiagnostics = {
    support: LevelExtensionSelectionSideDiagnostics;
    resistance: LevelExtensionSelectionSideDiagnostics;
    config: {
        maxExtensionPerSide: number;
        spacingPct: number;
        searchWindowPct: number;
        forwardPlanningRangePct: number;
    };
    safety: {
        extensionGenerationUnchanged: true;
        diagnosticOnly: true;
    };
};
export type BuildLevelExtensionsParams = {
    supportZones: FinalLevelZone[];
    resistanceZones: FinalLevelZone[];
    surfacedSupport: FinalLevelZone[];
    surfacedResistance: FinalLevelZone[];
    maxExtensionPerSide?: number;
    spacingPct?: number;
    searchWindowPct?: number;
    referencePrice?: number;
    forwardPlanningRangePct?: number;
    syntheticExtensionOptions?: SyntheticExtensionOptions;
};
export type BuildLevelExtensionsWithDiagnosticsResult = {
    extensionLevels: LevelLadderExtension;
    diagnostics: LevelExtensionSelectionDiagnostics;
};
export declare function buildLevelExtensionSelectionDiagnostics(params: BuildLevelExtensionsParams & {
    selectedExtensions: LevelLadderExtension;
}): LevelExtensionSelectionDiagnostics;
export declare function buildLevelExtensionsWithDiagnostics(params: BuildLevelExtensionsParams): BuildLevelExtensionsWithDiagnosticsResult;
export declare function buildLevelExtensions(params: BuildLevelExtensionsParams): LevelLadderExtension;
//# sourceMappingURL=level-extension-engine.d.ts.map