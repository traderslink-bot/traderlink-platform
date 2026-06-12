import type { SessionMarketFacts } from "../session/session-market-facts.js";
import type { VolumeMarketFacts } from "../volume/volume-market-facts.js";
import type { VolumeShelf } from "../volume/volume-shelf-detector.js";
import { type LevelCandidateSessionFactProximity, type LevelCandidateVolumeSessionContext, type LevelCandidateVolumeSessionContextRow, type LevelCandidateVolumeSessionSide, type LevelCandidateVolumeSessionStage, type LevelCandidateVolumeShelfOverlap } from "./level-candidate-volume-session-context.js";
export type LevelCandidateVolumeSessionContextInputRow = {
    rowId: string;
    levelId?: string;
    candidateId?: string;
    side: LevelCandidateVolumeSessionSide;
    stage: LevelCandidateVolumeSessionStage;
    price: number;
    zoneLow?: number;
    zoneHigh?: number;
    distanceFromReferencePct?: number;
};
export type BuildLevelCandidateVolumeSessionContextRequest = {
    symbol: string;
    provider: string;
    asOfTimestamp: number;
    asOfIso?: string;
    referencePrice?: number;
    rows: LevelCandidateVolumeSessionContextInputRow[];
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    proximity?: {
        sessionNearPct?: number;
        sessionOverlapPct?: number;
        volumeShelfNearPct?: number;
    };
    diagnostics?: string[];
    limitations?: string[];
};
export declare function findNearbySessionFactsForCandidate(params: {
    row: LevelCandidateVolumeSessionContextInputRow;
    sessionFacts?: SessionMarketFacts;
    sessionNearPct?: number;
    sessionOverlapPct?: number;
}): LevelCandidateSessionFactProximity[];
export declare function findVolumeShelfOverlapsForCandidate(params: {
    row: LevelCandidateVolumeSessionContextInputRow;
    volumeShelves?: VolumeShelf[];
    volumeShelfNearPct?: number;
}): LevelCandidateVolumeShelfOverlap[];
export declare function buildLevelCandidateVolumeSessionContextRow(params: {
    row: LevelCandidateVolumeSessionContextInputRow;
    referencePrice?: number;
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    proximity?: BuildLevelCandidateVolumeSessionContextRequest["proximity"];
}): LevelCandidateVolumeSessionContextRow;
export declare function deriveVolumeSessionComparisonSummary(contexts: LevelCandidateVolumeSessionContextRow[]): LevelCandidateVolumeSessionContext["comparisonSummary"];
export declare function buildLevelCandidateVolumeSessionContext(request: BuildLevelCandidateVolumeSessionContextRequest): LevelCandidateVolumeSessionContext;
//# sourceMappingURL=level-candidate-volume-session-context-builder.d.ts.map