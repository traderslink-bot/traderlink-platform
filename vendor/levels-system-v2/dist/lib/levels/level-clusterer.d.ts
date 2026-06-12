import type { LevelEngineConfig } from "./level-config.js";
import type { FinalLevelZone, RawLevelCandidate } from "./level-types.js";
export type LevelClusterRawMemberDiagnostic = {
    id: string;
    price: number;
    sourceType: RawLevelCandidate["sourceType"];
    timeframe: RawLevelCandidate["timeframe"];
};
export type LevelClusterHiddenDepthCandidate = LevelClusterRawMemberDiagnostic & {
    distanceFromRepresentativePct: number;
    depthSide: "below_representative" | "above_representative";
};
export type LevelClusterMemberDiagnostic = {
    clusterId: string;
    clusterIndex: number;
    kind: "support" | "resistance";
    representativePrice: number;
    zoneLow: number;
    zoneHigh: number;
    rawMemberMapping: "tracked_from_clusterer_diagnostics";
    rawMemberCount: number;
    rawMemberIds: string[];
    rawMemberPrices: number[];
    rawMembers: LevelClusterRawMemberDiagnostic[];
    minRawMemberPrice?: number;
    maxRawMemberPrice?: number;
    rawPriceSpanPct?: number;
    sourceTypes: RawLevelCandidate["sourceType"][];
    timeframeSources: RawLevelCandidate["timeframe"][];
    firstPassClusterIds: string[];
    mergedFirstPassClusterCount: number;
    materialPriceSpanPct: number;
    membersSpanMateriallyDifferentPrices: boolean;
    hiddenDepthCandidates: LevelClusterHiddenDepthCandidate[];
    potentialExtensionDepthMemberIds: string[];
};
export type LevelClusterMemberTrackingDiagnostics = {
    symbol: string;
    kind: "support" | "resistance";
    rawCandidateCount: number;
    filteredCandidateCount: number;
    firstPassClusterCount: number;
    finalClusterCount: number;
    materialPriceSpanThresholdPct: number;
    clusters: LevelClusterMemberDiagnostic[];
    diagnostics: string[];
    safety: {
        diagnosticOnly: true;
        clusteringBehaviorUnchanged: true;
        normalClusterOutputUnchanged: true;
    };
};
export type ClusterRawLevelCandidatesWithDiagnosticsResult = {
    zones: FinalLevelZone[];
    diagnostics: LevelClusterMemberTrackingDiagnostics;
};
export declare function clusterRawLevelCandidates(symbol: string, kind: "support" | "resistance", candidates: RawLevelCandidate[], tolerancePct: number, config: LevelEngineConfig, _referenceTimestamp?: number): FinalLevelZone[];
export declare function clusterRawLevelCandidatesWithDiagnostics(symbol: string, kind: "support" | "resistance", candidates: RawLevelCandidate[], tolerancePct: number, config: LevelEngineConfig, _referenceTimestamp?: number): ClusterRawLevelCandidatesWithDiagnosticsResult;
//# sourceMappingURL=level-clusterer.d.ts.map