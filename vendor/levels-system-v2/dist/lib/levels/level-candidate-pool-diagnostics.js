const DEFAULT_FORWARD_PLANNING_RANGE_PCT = 0.5;
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function sortedNumberRecord(entries) {
    return Object.fromEntries(entries
        .filter(([, value]) => value > 0)
        .sort(([left], [right]) => left.localeCompare(right)));
}
function sortedRecord(entries) {
    return Object.fromEntries(entries
        .filter(([, value]) => value > 0)
        .sort(([left], [right]) => left.localeCompare(right)));
}
function countBy(items) {
    const counts = new Map();
    for (const item of items) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
    }
    return sortedNumberRecord([...counts.entries()]);
}
function sourceTypeSetKey(sourceTypes) {
    return [...sourceTypes].sort().join("+") || "unknown";
}
function priceRange(prices) {
    if (prices.length === 0) {
        return undefined;
    }
    return {
        min: round(Math.min(...prices)),
        max: round(Math.max(...prices)),
    };
}
function referenceDepth(prices, referencePrice) {
    if (!referencePrice || referencePrice <= 0) {
        return {
            referencePrice,
            belowReferenceCount: 0,
            atReferenceCount: 0,
            aboveReferenceCount: 0,
        };
    }
    const below = prices.filter((price) => price < referencePrice);
    const above = prices.filter((price) => price > referencePrice);
    const at = prices.filter((price) => price === referencePrice);
    const farthestBelowReference = below.length > 0 ? Math.min(...below) : undefined;
    const farthestAboveReference = above.length > 0 ? Math.max(...above) : undefined;
    return {
        referencePrice: round(referencePrice),
        belowReferenceCount: below.length,
        atReferenceCount: at.length,
        aboveReferenceCount: above.length,
        nearestBelowReference: below.length > 0 ? round(Math.max(...below)) : undefined,
        farthestBelowReference: farthestBelowReference === undefined ? undefined : round(farthestBelowReference),
        nearestAboveReference: above.length > 0 ? round(Math.min(...above)) : undefined,
        farthestAboveReference: farthestAboveReference === undefined ? undefined : round(farthestAboveReference),
        deepestBelowReferencePct: farthestBelowReference === undefined
            ? undefined
            : round(((referencePrice - farthestBelowReference) / referencePrice) * 100),
        highestAboveReferencePct: farthestAboveReference === undefined
            ? undefined
            : round(((farthestAboveReference - referencePrice) / referencePrice) * 100),
    };
}
function summarizeRawStage(params) {
    const prices = [...params.candidates]
        .map((candidate) => round(candidate.price))
        .sort((left, right) => left - right);
    return {
        stage: params.stage,
        total: params.candidates.length,
        prices,
        priceRange: priceRange(prices),
        byTimeframe: countBy(params.candidates.map((candidate) => candidate.timeframe)),
        byTimeframeBias: {},
        bySourceType: countBy(params.candidates.map((candidate) => candidate.sourceType)),
        bySourceTypeSet: sortedRecord([...countSourceTypeSets(params.candidates.map((candidate) => [candidate.sourceType])).entries()]),
        depth: referenceDepth(prices, params.referencePrice),
    };
}
function countSourceTypeSets(sourceTypeSets) {
    const counts = new Map();
    for (const sourceTypes of sourceTypeSets) {
        const key = sourceTypeSetKey(sourceTypes);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}
function summarizeZoneStage(params) {
    const prices = [...params.zones]
        .map((zone) => round(zone.representativePrice))
        .sort((left, right) => left - right);
    return {
        stage: params.stage,
        total: params.zones.length,
        prices,
        priceRange: priceRange(prices),
        byTimeframe: countBy(params.zones.flatMap((zone) => zone.timeframeSources)),
        byTimeframeBias: countBy(params.zones.map((zone) => zone.timeframeBias)),
        bySourceType: countBy(params.zones.flatMap((zone) => zone.sourceTypes)),
        bySourceTypeSet: sortedRecord([...countSourceTypeSets(params.zones.map((zone) => zone.sourceTypes)).entries()]),
        depth: referenceDepth(prices, params.referencePrice),
    };
}
function surfacedFromOutput(output, surfacedBuckets) {
    const source = surfacedBuckets ?? output;
    return {
        majorSupport: source?.majorSupport ?? [],
        majorResistance: source?.majorResistance ?? [],
        intermediateSupport: source?.intermediateSupport ?? [],
        intermediateResistance: source?.intermediateResistance ?? [],
        intradaySupport: source?.intradaySupport ?? [],
        intradayResistance: source?.intradayResistance ?? [],
    };
}
function extensionLevelsFromInput(output, extensionLevels) {
    return extensionLevels ?? output?.extensionLevels ?? { support: [], resistance: [] };
}
function surfacedSupport(buckets) {
    return [
        ...buckets.majorSupport,
        ...buckets.intermediateSupport,
        ...buckets.intradaySupport,
    ];
}
function surfacedResistance(buckets) {
    return [
        ...buckets.majorResistance,
        ...buckets.intermediateResistance,
        ...buckets.intradayResistance,
    ];
}
function surfacedResistanceBoundary(params) {
    const maxPracticalPrice = params.referencePrice && params.referencePrice > 0
        ? params.referencePrice * (1 + params.forwardPlanningRangePct)
        : Number.POSITIVE_INFINITY;
    const practicalSurfaced = params.surfaced
        .filter((zone) => zone.representativePrice <= maxPracticalPrice)
        .map((zone) => zone.representativePrice);
    if (practicalSurfaced.length > 0) {
        return Math.max(...practicalSurfaced);
    }
    if (params.surfaced.length === 0) {
        return -Infinity;
    }
    return Math.max(...params.surfaced.map((zone) => zone.representativePrice));
}
function extensionCandidates(params) {
    if (params.side === "support") {
        const lowestVisibleSupport = params.surfaced.length > 0
            ? Math.min(...params.surfaced.map((zone) => zone.representativePrice))
            : Infinity;
        return [...params.scoredZones]
            .filter((zone) => zone.representativePrice < lowestVisibleSupport)
            .sort((left, right) => right.representativePrice - left.representativePrice);
    }
    const highestVisibleResistance = surfacedResistanceBoundary({
        surfaced: params.surfaced,
        referencePrice: params.referencePrice,
        forwardPlanningRangePct: params.forwardPlanningRangePct,
    });
    const maxPracticalResistance = params.referencePrice && params.referencePrice > 0
        ? params.referencePrice * (1 + params.forwardPlanningRangePct)
        : Number.POSITIVE_INFINITY;
    return [...params.scoredZones]
        .filter((zone) => zone.representativePrice > highestVisibleResistance &&
        zone.representativePrice <= maxPracticalResistance)
        .sort((left, right) => left.representativePrice - right.representativePrice);
}
function buildNarrowing(params) {
    return {
        side: params.side,
        from: params.from.stage,
        to: params.to.stage,
        fromCount: params.from.total,
        toCount: params.to.total,
        delta: params.from.total - params.to.total,
        narrowed: params.to.total < params.from.total,
        note: params.note,
    };
}
function sideWarnings(params) {
    const warnings = [];
    if (params.raw.total === 0) {
        warnings.push(`no_${params.side}_raw_candidates`);
    }
    if (params.clustered.total === 0 && params.raw.total > 0) {
        warnings.push(`no_${params.side}_clustered_zones_after_raw_candidates`);
    }
    if (params.scored.total === 0 && params.clustered.total > 0) {
        warnings.push(`no_${params.side}_scored_zones_after_clustering`);
    }
    if (params.extensionCandidates.total === 0 && params.selectedExtensions.total === 0) {
        warnings.push(`no_${params.side}_extension_candidate_inventory`);
    }
    if (params.side === "support" &&
        params.scored.depth.referencePrice !== undefined &&
        params.scored.depth.belowReferenceCount === 0) {
        warnings.push("no_scored_support_depth_below_reference");
    }
    if (params.side === "resistance" &&
        params.scored.depth.referencePrice !== undefined &&
        params.scored.depth.aboveReferenceCount === 0) {
        warnings.push("no_scored_resistance_depth_above_reference");
    }
    return warnings;
}
function buildSideDiagnostics(params) {
    const raw = summarizeRawStage({
        stage: "raw",
        candidates: params.rawCandidates,
        referencePrice: params.referencePrice,
    });
    const clustered = summarizeZoneStage({
        stage: "clustered",
        zones: params.clusteredZones,
        referencePrice: params.referencePrice,
    });
    const scored = summarizeZoneStage({
        stage: "scored",
        zones: params.scoredZones,
        referencePrice: params.referencePrice,
    });
    const surfaced = summarizeZoneStage({
        stage: "surfaced",
        zones: params.surfacedZones,
        referencePrice: params.referencePrice,
    });
    const extensionCandidateSummary = summarizeZoneStage({
        stage: "extension_candidate",
        zones: params.extensionCandidateZones,
        referencePrice: params.referencePrice,
    });
    const selectedExtensionSummary = summarizeZoneStage({
        stage: "extension_selected",
        zones: params.selectedExtensionZones,
        referencePrice: params.referencePrice,
    });
    const stageNarrowing = [
        {
            from: raw,
            to: clustered,
            note: "raw_candidates_to_clustered_zones",
        },
        {
            from: clustered,
            to: scored,
            note: "clustered_zones_to_scored_zones",
        },
        {
            from: scored,
            to: surfaced,
            note: "scored_zones_to_public_surfaced_buckets",
        },
        {
            from: scored,
            to: extensionCandidateSummary,
            note: "scored_zones_to_extension_boundary_candidates",
        },
        {
            from: extensionCandidateSummary,
            to: selectedExtensionSummary,
            note: "extension_boundary_candidates_to_selected_extensions",
        },
    ].map((entry) => buildNarrowing({
        side: params.side,
        ...entry,
    }));
    return {
        side: params.side,
        raw,
        clustered,
        scored,
        surfaced,
        extensionCandidates: extensionCandidateSummary,
        selectedExtensions: selectedExtensionSummary,
        narrowing: stageNarrowing,
        warnings: sideWarnings({
            side: params.side,
            raw,
            clustered,
            scored,
            extensionCandidates: extensionCandidateSummary,
            selectedExtensions: selectedExtensionSummary,
        }),
    };
}
export function buildLevelCandidatePoolDiagnostics(input) {
    const referencePrice = input.referencePrice ?? input.levelOutput?.metadata.referencePrice;
    const forwardPlanningRangePct = input.forwardPlanningRangePct ?? DEFAULT_FORWARD_PLANNING_RANGE_PCT;
    const buckets = surfacedFromOutput(input.levelOutput, input.surfacedBuckets);
    const selectedExtensions = extensionLevelsFromInput(input.levelOutput, input.extensionLevels);
    const allSurfacedSupport = surfacedSupport(buckets);
    const allSurfacedResistance = surfacedResistance(buckets);
    const supportExtensionCandidates = extensionCandidates({
        side: "support",
        scoredZones: input.scoredSupportZones,
        surfaced: allSurfacedSupport,
        referencePrice,
        forwardPlanningRangePct,
    });
    const resistanceExtensionCandidates = extensionCandidates({
        side: "resistance",
        scoredZones: input.scoredResistanceZones,
        surfaced: allSurfacedResistance,
        referencePrice,
        forwardPlanningRangePct,
    });
    const support = buildSideDiagnostics({
        side: "support",
        rawCandidates: input.rawCandidates.filter((candidate) => candidate.kind === "support"),
        clusteredZones: input.clusteredSupportZones,
        scoredZones: input.scoredSupportZones,
        surfacedZones: allSurfacedSupport,
        extensionCandidateZones: supportExtensionCandidates,
        selectedExtensionZones: selectedExtensions.support,
        referencePrice,
    });
    const resistance = buildSideDiagnostics({
        side: "resistance",
        rawCandidates: input.rawCandidates.filter((candidate) => candidate.kind === "resistance"),
        clusteredZones: input.clusteredResistanceZones,
        scoredZones: input.scoredResistanceZones,
        surfacedZones: allSurfacedResistance,
        extensionCandidateZones: resistanceExtensionCandidates,
        selectedExtensionZones: selectedExtensions.resistance,
        referencePrice,
    });
    const narrowing = [...support.narrowing, ...resistance.narrowing];
    return {
        symbol: input.symbol.toUpperCase(),
        referencePrice: referencePrice === undefined ? undefined : round(referencePrice),
        summary: {
            rawCandidateCount: input.rawCandidates.length,
            clusteredZoneCount: input.clusteredSupportZones.length + input.clusteredResistanceZones.length,
            scoredZoneCount: input.scoredSupportZones.length + input.scoredResistanceZones.length,
            surfacedLevelCount: allSurfacedSupport.length + allSurfacedResistance.length,
            extensionCandidateCount: supportExtensionCandidates.length + resistanceExtensionCandidates.length,
            selectedExtensionCount: selectedExtensions.support.length + selectedExtensions.resistance.length,
        },
        surfacedBucketCounts: {
            majorSupport: buckets.majorSupport.length,
            majorResistance: buckets.majorResistance.length,
            intermediateSupport: buckets.intermediateSupport.length,
            intermediateResistance: buckets.intermediateResistance.length,
            intradaySupport: buckets.intradaySupport.length,
            intradayResistance: buckets.intradayResistance.length,
        },
        support,
        resistance,
        narrowing,
        diagnostics: [
            "candidate_pool_diagnostics_only",
            "accepts_prebuilt_pipeline_inputs",
            "normal_level_engine_output_not_modified",
        ],
        safety: {
            diagnosticOnly: true,
            levelOutputUnchanged: true,
            extensionGenerationUnchanged: true,
            noRuntimeBehaviorChange: true,
        },
    };
}
