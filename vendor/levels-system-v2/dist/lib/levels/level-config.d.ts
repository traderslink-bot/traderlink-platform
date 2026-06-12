import type { CandleTimeframe } from "../market-data/candle-types.js";
export type TimeframeConfig = {
    swingWindow: number;
    minimumDisplacementPct: number;
    minimumSwingSeparationBars: number;
    clusterTolerancePct: number;
    timeframeWeight: number;
    maxOutputPerSide: number;
};
export type ScoreThresholds = {
    major: number;
    strong: number;
    moderate: number;
};
export type LevelEngineConfig = {
    timeframeConfig: Record<CandleTimeframe, TimeframeConfig>;
    reactionWeight: number;
    touchWeight: number;
    confluenceWeight: number;
    recencyWeight: number;
    displacementWeight: number;
    sessionWeight: number;
    qualityWeight: number;
    followThroughWeight: number;
    pathClearanceWeight: number;
    singleTimeframeOnlyPenalty: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    mixedTimeframeBonus: number;
    secondPassMergeToleranceMultiplier: number;
    overlapMergeTolerancePct: number;
    maxMergedZoneWidthPct: number;
    crowdingDistancePct: number;
    weakerNearbyCrowdingPenalty: number;
    surfacedSpacingPct: {
        daily: number;
        "4h": number;
        "5m": number;
    };
    extensionSpacingPct: number;
    extensionSearchWindowPct: number;
    scoreThresholds: ScoreThresholds;
};
export declare const DEFAULT_LEVEL_ENGINE_CONFIG: LevelEngineConfig;
//# sourceMappingURL=level-config.d.ts.map