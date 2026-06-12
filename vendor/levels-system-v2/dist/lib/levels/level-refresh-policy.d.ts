import type { LevelEngineOutput } from "./level-types.js";
export type LevelRefreshReason = "missing_levels" | "stale_output" | "aging_output" | "new_session";
export type LevelRefreshDecision = {
    shouldRefresh: boolean;
    reasons: LevelRefreshReason[];
};
export declare function decideLevelRefresh(params: {
    output?: LevelEngineOutput;
    referenceTimestamp: number;
}): LevelRefreshDecision;
//# sourceMappingURL=level-refresh-policy.d.ts.map