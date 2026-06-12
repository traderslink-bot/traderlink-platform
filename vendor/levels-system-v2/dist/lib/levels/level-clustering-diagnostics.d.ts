import type { CandleTimeframe } from "../market-data/candle-types.js";
import type { FinalLevelZone, LevelKind, RawLevelCandidate, RawLevelCandidateSourceType } from "./level-types.js";
export type LevelClusteringDiagnosticsWarning = "high_compression_ratio" | "broad_cluster_span" | "many_members_single_cluster" | "hidden_depth_possible" | "no_raw_members_available";
export type LevelClusteringRawMemberMapping = "tracked_from_clusterer_diagnostics" | "inferred_from_zone_span" | "unavailable";
export type LevelClusteringTrackedRawMember = {
    id: string;
    price: number;
    sourceType: RawLevelCandidateSourceType;
    timeframe: CandleTimeframe;
};
export type LevelClusteringTrackedHiddenDepthCandidate = LevelClusteringTrackedRawMember & {
    distanceFromRepresentativePct: number;
    depthSide: "below_representative" | "above_representative";
};
export type LevelClusteringTrackedClusterMembers = {
    clusterId: string;
    clusterIndex: number;
    kind: LevelKind;
    rawMemberMapping: "tracked_from_clusterer_diagnostics";
    rawMemberIds: string[];
    rawMemberPrices: number[];
    rawMembers: LevelClusteringTrackedRawMember[];
    rawPriceSpanPct?: number;
    membersSpanMateriallyDifferentPrices?: boolean;
    hiddenDepthCandidates?: LevelClusteringTrackedHiddenDepthCandidate[];
    potentialExtensionDepthMemberIds?: string[];
};
export type LevelClusteringDiagnosticCluster = {
    clusterId: string;
    clusterIndex: number;
    kind: LevelKind;
    representativePrice: number;
    zoneLow: number;
    zoneHigh: number;
    rawMemberMapping: LevelClusteringRawMemberMapping;
    rawMemberCount: number;
    rawMemberIds: string[];
    rawMemberPrices: number[];
    minRawMemberPrice?: number;
    maxRawMemberPrice?: number;
    rawPriceSpanPct?: number;
    sourceTypes: RawLevelCandidateSourceType[];
    sourceTypeCounts: Partial<Record<RawLevelCandidateSourceType, number>>;
    timeframeSources: CandleTimeframe[];
    timeframeCounts: Partial<Record<CandleTimeframe, number>>;
    isBroadCluster: boolean;
    mayHideMultipleCandidateDepths: boolean;
    exactRawMemberTrackingAvailable: boolean;
    membersSpanMateriallyDifferentPrices: boolean;
    hiddenDepthCandidateIds: string[];
    hiddenDepthCandidatePrices: number[];
    potentialExtensionDepthMemberIds: string[];
    warnings: LevelClusteringDiagnosticsWarning[];
};
export type BuildLevelClusteringDiagnosticsInput = {
    symbol: string;
    rawCandidates: RawLevelCandidate[];
    clusteredZones: FinalLevelZone[];
    trackedClusters?: LevelClusteringTrackedClusterMembers[];
    highCompressionRatioThreshold?: number;
    broadClusterSpanPct?: number;
    manyMembersThreshold?: number;
};
export type LevelClusteringDiagnosticsReport = {
    symbol: string;
    rawCandidateCount: number;
    clusteredZoneCount: number;
    compressionRatio: number;
    unmappedRawCandidateCount: number;
    clusters: LevelClusteringDiagnosticCluster[];
    warnings: LevelClusteringDiagnosticsWarning[];
    diagnostics: string[];
    safety: {
        diagnosticOnly: true;
        clusteringBehaviorUnchanged: true;
        noRuntimeBehaviorChange: true;
    };
};
export declare function buildLevelClusteringDiagnostics(input: BuildLevelClusteringDiagnosticsInput): LevelClusteringDiagnosticsReport;
//# sourceMappingURL=level-clustering-diagnostics.d.ts.map