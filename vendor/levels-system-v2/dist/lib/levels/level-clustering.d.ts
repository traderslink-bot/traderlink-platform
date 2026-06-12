import type { LevelScoreConfig } from "./level-score-config.js";
import type { LevelCandidate, LevelCluster, RankedLevel } from "./level-types.js";
type ClusterComparableLevel = Pick<RankedLevel, "id" | "type" | "price" | "zoneLow" | "zoneHigh" | "sourceTimeframes" | "strongestReactionMovePct" | "cleanlinessStdDevPct" | "barsSinceLastReaction" | "structuralStrengthScore"> & {
    clusterPenalty?: number;
    clusterId?: string | null;
    isClusterRepresentative?: boolean;
};
export declare function chooseClusterRepresentative<T extends ClusterComparableLevel>(clusterLevels: T[]): T;
export declare function clusterLevels<T extends Pick<LevelCandidate, "id" | "type" | "price" | "zoneLow" | "zoneHigh">>(levels: T[], config?: LevelScoreConfig): LevelCluster[];
export declare function applyClusterPenalties<T extends ClusterComparableLevel>(levels: T[], clusters: LevelCluster[], config?: LevelScoreConfig): T[];
export {};
//# sourceMappingURL=level-clustering.d.ts.map