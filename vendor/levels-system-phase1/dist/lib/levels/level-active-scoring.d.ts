import type { LevelScoreConfig } from "./level-score-config.js";
import type { LevelScoringContext, LevelScoreBreakdown, RankedLevel, LevelCandidate } from "./level-types.js";
type ActivelyScorableLevel = Pick<RankedLevel, "type" | "zoneLow" | "zoneHigh" | "barsSinceLastReaction" | "touches" | "price"> & Partial<Pick<LevelCandidate, "averageVolumeRatio">>;
export declare function computeActiveRelevanceScore(level: ActivelyScorableLevel, context: LevelScoringContext, config?: LevelScoreConfig): {
    activeRelevanceScore: number;
    scoreBreakdown: Pick<LevelScoreBreakdown, "distanceToPriceScore" | "freshReactionScore" | "intradayPressureScore" | "recentVolumeActivityScore" | "currentInteractionScore" | "activeRelevanceScore">;
};
export {};
//# sourceMappingURL=level-active-scoring.d.ts.map