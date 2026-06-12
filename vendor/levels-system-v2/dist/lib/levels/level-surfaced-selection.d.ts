import type { RankedLevel, RankedLevelsOutput } from "./level-types.js";
export type SurfacedLevelSelection = RankedLevel & {
    selectionCategory: "actionable" | "anchor";
    surfacedSelectionScore: number;
    surfacedSelectionExplanation: string;
    surfacedSelectionNotes: string[];
    durabilityLabel?: "fragile" | "tested" | "durable" | "reinforced";
};
export type SurfacedSelectionResult = {
    symbol: string;
    currentPrice: number;
    surfacedSupports: SurfacedLevelSelection[];
    surfacedResistances: SurfacedLevelSelection[];
    deeperSupportAnchor?: SurfacedLevelSelection;
    deeperResistanceAnchor?: SurfacedLevelSelection;
    suppressedNearDuplicates: SurfacedLevelSelection[];
    diagnostics: {
        rankedSupportCount: number;
        rankedResistanceCount: number;
        surfacedSupportCount: number;
        surfacedResistanceCount: number;
    };
};
export declare function selectSurfacedLevels(rankedOutput: RankedLevelsOutput): SurfacedSelectionResult;
//# sourceMappingURL=level-surfaced-selection.d.ts.map