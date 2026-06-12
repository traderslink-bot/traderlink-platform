const DEFAULT_HIGH_COMPRESSION_RATIO_THRESHOLD = 3;
const DEFAULT_BROAD_CLUSTER_SPAN_PCT = 2;
const DEFAULT_MANY_MEMBERS_THRESHOLD = 5;
const EPSILON = 0.000_001;
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function uniqueSorted(items) {
    return [...new Set(items)].sort();
}
function countBy(items) {
    const counts = {};
    for (const item of items) {
        counts[item] = (counts[item] ?? 0) + 1;
    }
    return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}
function priceSpanPct(prices) {
    if (prices.length === 0) {
        return undefined;
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const midpoint = (min + max) / 2;
    return round(((max - min) / Math.max(midpoint, 0.0001)) * 100);
}
function clusterCompressionRatio(rawCandidateCount, clusteredZoneCount) {
    if (rawCandidateCount === 0 && clusteredZoneCount === 0) {
        return 0;
    }
    if (clusteredZoneCount === 0) {
        return rawCandidateCount;
    }
    return round(rawCandidateCount / clusteredZoneCount);
}
function candidateMatchesZone(candidate, zone, symbol) {
    if (candidate.kind !== zone.kind) {
        return false;
    }
    if (candidate.symbol !== symbol && candidate.symbol !== zone.symbol) {
        return false;
    }
    if (candidate.price < zone.zoneLow - EPSILON || candidate.price > zone.zoneHigh + EPSILON) {
        return false;
    }
    if (!zone.sourceTypes.includes(candidate.sourceType)) {
        return false;
    }
    return zone.timeframeSources.includes(candidate.timeframe);
}
function trackedClusterMatchesZone(trackedCluster, zone, clusterIndex) {
    if (trackedCluster.clusterId === zone.id) {
        return true;
    }
    return trackedCluster.clusterIndex === clusterIndex && trackedCluster.kind === zone.kind;
}
function buildClusterDiagnostics(params) {
    const trackedRawMembers = params.trackedCluster?.rawMembers;
    const rawMembers = trackedRawMembers
        ? trackedRawMembers
            .map((member) => ({
            ...member,
            symbol: params.symbol,
            kind: params.zone.kind,
        }))
            .sort((left, right) => left.price - right.price || left.id.localeCompare(right.id))
        : params.rawCandidates
            .filter((candidate) => candidateMatchesZone(candidate, params.zone, params.symbol))
            .sort((left, right) => left.price - right.price || left.id.localeCompare(right.id));
    const rawMemberPrices = rawMembers.map((member) => round(member.price));
    const rawPriceSpan = params.trackedCluster?.rawPriceSpanPct ?? priceSpanPct(rawMemberPrices);
    const rawMemberMapping = params.trackedCluster?.rawMemberMapping ??
        (rawMembers.length > 0 ? "inferred_from_zone_span" : "unavailable");
    const isBroadCluster = (rawPriceSpan ?? 0) >= params.broadClusterSpanPct;
    const manyMembers = rawMembers.length >= params.manyMembersThreshold;
    const trackedHiddenDepthCandidates = params.trackedCluster?.hiddenDepthCandidates ?? [];
    const mayHideMultipleCandidateDepths = rawMembers.length > 1 &&
        (isBroadCluster || manyMembers || trackedHiddenDepthCandidates.length > 0);
    const warnings = [];
    if (rawMembers.length === 0) {
        warnings.push("no_raw_members_available");
    }
    if (isBroadCluster) {
        warnings.push("broad_cluster_span");
    }
    if (manyMembers) {
        warnings.push("many_members_single_cluster");
    }
    if (mayHideMultipleCandidateDepths) {
        warnings.push("hidden_depth_possible");
    }
    return {
        clusterId: params.zone.id || `${params.symbol}-${params.zone.kind}-cluster-${params.clusterIndex + 1}`,
        clusterIndex: params.clusterIndex,
        kind: params.zone.kind,
        representativePrice: round(params.zone.representativePrice),
        zoneLow: round(params.zone.zoneLow),
        zoneHigh: round(params.zone.zoneHigh),
        rawMemberMapping,
        rawMemberCount: rawMembers.length,
        rawMemberIds: rawMembers.map((member) => member.id),
        rawMemberPrices,
        minRawMemberPrice: rawMembers.length > 0 ? round(Math.min(...rawMemberPrices)) : undefined,
        maxRawMemberPrice: rawMembers.length > 0 ? round(Math.max(...rawMemberPrices)) : undefined,
        rawPriceSpanPct: rawPriceSpan,
        sourceTypes: rawMembers.length > 0
            ? uniqueSorted(rawMembers.map((member) => member.sourceType))
            : uniqueSorted(params.zone.sourceTypes),
        sourceTypeCounts: rawMembers.length > 0
            ? countBy(rawMembers.map((member) => member.sourceType))
            : countBy(params.zone.sourceTypes),
        timeframeSources: rawMembers.length > 0
            ? uniqueSorted(rawMembers.map((member) => member.timeframe))
            : uniqueSorted(params.zone.timeframeSources),
        timeframeCounts: rawMembers.length > 0
            ? countBy(rawMembers.map((member) => member.timeframe))
            : countBy(params.zone.timeframeSources),
        isBroadCluster,
        mayHideMultipleCandidateDepths,
        exactRawMemberTrackingAvailable: rawMemberMapping === "tracked_from_clusterer_diagnostics",
        membersSpanMateriallyDifferentPrices: params.trackedCluster?.membersSpanMateriallyDifferentPrices ?? isBroadCluster,
        hiddenDepthCandidateIds: trackedHiddenDepthCandidates.map((candidate) => candidate.id),
        hiddenDepthCandidatePrices: trackedHiddenDepthCandidates.map((candidate) => round(candidate.price)),
        potentialExtensionDepthMemberIds: params.trackedCluster?.potentialExtensionDepthMemberIds ??
            trackedHiddenDepthCandidates.map((candidate) => candidate.id),
        warnings,
    };
}
function aggregateWarnings(compressionRatio, highCompressionRatioThreshold, clusters) {
    const warnings = new Set();
    if (compressionRatio >= highCompressionRatioThreshold) {
        warnings.add("high_compression_ratio");
    }
    for (const cluster of clusters) {
        for (const warning of cluster.warnings) {
            warnings.add(warning);
        }
    }
    return [...warnings].sort();
}
export function buildLevelClusteringDiagnostics(input) {
    const highCompressionRatioThreshold = input.highCompressionRatioThreshold ?? DEFAULT_HIGH_COMPRESSION_RATIO_THRESHOLD;
    const broadClusterSpanPct = input.broadClusterSpanPct ?? DEFAULT_BROAD_CLUSTER_SPAN_PCT;
    const manyMembersThreshold = input.manyMembersThreshold ?? DEFAULT_MANY_MEMBERS_THRESHOLD;
    const rawCandidates = [...input.rawCandidates];
    const clusteredZones = [...input.clusteredZones];
    const clusters = clusteredZones.map((zone, index) => buildClusterDiagnostics({
        symbol: input.symbol,
        zone,
        clusterIndex: index,
        rawCandidates,
        trackedCluster: input.trackedClusters?.find((trackedCluster) => trackedClusterMatchesZone(trackedCluster, zone, index)),
        broadClusterSpanPct,
        manyMembersThreshold,
    }));
    const mappedRawCandidateIds = new Set(clusters.flatMap((cluster) => cluster.rawMemberIds));
    const unmappedRawCandidateCount = rawCandidates.filter((candidate) => !mappedRawCandidateIds.has(candidate.id)).length;
    const compressionRatio = clusterCompressionRatio(rawCandidates.length, clusteredZones.length);
    const warnings = aggregateWarnings(compressionRatio, highCompressionRatioThreshold, clusters);
    return {
        symbol: input.symbol,
        rawCandidateCount: rawCandidates.length,
        clusteredZoneCount: clusteredZones.length,
        compressionRatio,
        unmappedRawCandidateCount,
        clusters,
        warnings,
        diagnostics: [
            "clustering_diagnostics_only",
            input.trackedClusters && input.trackedClusters.length > 0
                ? "raw_member_mapping_tracked_from_clusterer_diagnostics_when_available"
                : "raw_member_mapping_inferred_from_zone_span_source_type_and_timeframe",
        ],
        safety: {
            diagnosticOnly: true,
            clusteringBehaviorUnchanged: true,
            noRuntimeBehaviorChange: true,
        },
    };
}
