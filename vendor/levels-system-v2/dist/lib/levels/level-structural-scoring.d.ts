import type { LevelScoreConfig } from "./level-score-config.js";
import type { LevelScoreBreakdown, RankedLevel, LevelCandidate } from "./level-types.js";
type StructurallyScorableLevel = Pick<RankedLevel, "sourceTimeframes" | "meaningfulTouchCount" | "touchCount" | "touches" | "averageReactionMovePct" | "strongestReactionMovePct" | "averageVolumeRatio" | "bestVolumeRatio" | "cleanlinessStdDevPct" | "roleFlipCount" | "failedBreakCount" | "reclaimCount" | "rejectionCount" | "barsSinceLastReaction" | "price"> & Partial<Pick<LevelCandidate, "clusterPenalty">>;
export declare function computeStructuralStrengthScore(level: StructurallyScorableLevel, config?: LevelScoreConfig): {
    structuralStrengthScore: number;
    scoreBreakdown: LevelScoreBreakdown;
};
export {};
//# sourceMappingURL=level-structural-scoring.d.ts.map