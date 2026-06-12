import type { LevelScoreConfig } from "./level-score-config.js";
import type { RankedLevel, LevelCandidate, LevelState } from "./level-types.js";
type StatefulLevel = Pick<RankedLevel, "touchCount" | "meaningfulTouchCount" | "cleanBreakCount" | "reclaimCount" | "roleFlipCount" | "averageReactionMovePct" | "barsSinceLastReaction" | "touches"> & Partial<Pick<LevelCandidate, "originKinds">>;
export declare function deriveLevelState(level: StatefulLevel, config?: LevelScoreConfig): LevelState;
export {};
//# sourceMappingURL=level-state-engine.d.ts.map