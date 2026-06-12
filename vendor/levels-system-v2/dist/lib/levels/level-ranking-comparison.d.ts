import type { LevelEngineOutput, SourceTimeframe } from "./level-types.js";
import type { SurfacedSelectionResult } from "./level-surfaced-selection.js";
export type ComparableLevelSummary = {
    sourcePath: "old" | "surfaced_adapter";
    side: "support" | "resistance";
    price: number;
    zoneLow: number;
    zoneHigh: number;
    rank: number;
    nearestRank: number;
    score: number;
    strengthLabel?: string;
    bucket?: string;
    confidence?: number;
    state?: string;
    explanation?: string;
    sourceTimeframes: SourceTimeframe[];
};
export type ComparablePathOutput = {
    symbol: string;
    currentPrice: number;
    topSupport?: ComparableLevelSummary;
    nearestSupport?: ComparableLevelSummary;
    topResistance?: ComparableLevelSummary;
    nearestResistance?: ComparableLevelSummary;
    supports: ComparableLevelSummary[];
    resistances: ComparableLevelSummary[];
    visibleSupportCount: number;
    visibleResistanceCount: number;
    nearbyDuplicateCount: number;
    outputShape: string;
};
export type LevelRankingDifference = {
    changedTopSupport: boolean;
    changedTopResistance: boolean;
    changedNearestSupport: boolean;
    changedNearestResistance: boolean;
    supportRankChanges: Array<{
        price: number;
        oldRank: number | null;
        newRank: number | null;
    }>;
    resistanceRankChanges: Array<{
        price: number;
        oldRank: number | null;
        newRank: number | null;
    }>;
    duplicateSuppressionImproved: boolean;
    oldNearbyDuplicateCount: number;
    newNearbyDuplicateCount: number;
    noteworthyDisagreements: string[];
    incompatibilities: string[];
};
export declare function normalizeOldPathOutput(output: LevelEngineOutput, currentPrice: number, maxComparableLevels?: number): ComparablePathOutput;
export declare function normalizeSurfacedSelectionOutput(output: SurfacedSelectionResult, maxComparableLevels?: number): ComparablePathOutput;
export declare function computeComparisonDifferences(params: {
    oldPath: ComparablePathOutput;
    newPath: ComparablePathOutput;
    limitations?: string[];
}): LevelRankingDifference;
//# sourceMappingURL=level-ranking-comparison.d.ts.map