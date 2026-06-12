import type { LevelCandidate, RawLevelCandidate } from "./level-types.js";
export type SurfacedShadowCase = {
    caseId: string;
    symbol: string;
    currentPrice: number;
    rawCandidates?: RawLevelCandidate[];
    newCandidates: LevelCandidate[];
};
export declare function buildDefaultSurfacedShadowCases(): SurfacedShadowCase[];
//# sourceMappingURL=level-surfaced-shadow-evaluation.d.ts.map