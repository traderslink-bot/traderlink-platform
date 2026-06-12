import { type ComparablePathOutput } from "./level-ranking-comparison.js";
import type { LevelRuntimeCompareActivePath } from "./level-runtime-mode.js";
export type LevelRuntimeComparisonLogEntry = {
    type: "level_runtime_compare";
    symbol: string;
    activePath: LevelRuntimeCompareActivePath;
    alternatePath: LevelRuntimeCompareActivePath;
    activeTopSupport: string | null;
    alternateTopSupport: string | null;
    activeTopResistance: string | null;
    alternateTopResistance: string | null;
    activeVisibleCounts: {
        support: number;
        resistance: number;
    };
    alternateVisibleCounts: {
        support: number;
        resistance: number;
    };
    notableDifferences: string[];
    newPathContext: {
        topSupportState: string | null;
        topSupportConfidence: number | null;
        topSupportExplanation: string | null;
        topResistanceState: string | null;
        topResistanceConfidence: number | null;
        topResistanceExplanation: string | null;
    };
};
export declare function buildLevelRuntimeComparisonLogEntry(params: {
    symbol: string;
    activePath: LevelRuntimeCompareActivePath;
    oldPath: ComparablePathOutput;
    newPath: ComparablePathOutput;
}): LevelRuntimeComparisonLogEntry;
//# sourceMappingURL=level-runtime-comparison-logger.d.ts.map