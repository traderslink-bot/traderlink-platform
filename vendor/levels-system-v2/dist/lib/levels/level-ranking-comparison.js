// 2026-05-27 08:55 PM America/Toronto
// Compact comparable-output helpers for old/new runtime shadow checks.
function sortNearest(levels, currentPrice, side) {
    return [...levels]
        .filter((level) => (side === "support" ? level.price <= currentPrice : level.price >= currentPrice))
        .sort((left, right) => Math.abs(left.price - currentPrice) - Math.abs(right.price - currentPrice))
        .map((level, index) => ({
        ...level,
        nearestRank: index + 1,
    }));
}
function flattenOldSide(output, side) {
    if (side === "support") {
        return [
            ...output.majorSupport.map((zone) => ({ zone, bucket: "major" })),
            ...output.intermediateSupport.map((zone) => ({ zone, bucket: "intermediate" })),
            ...output.intradaySupport.map((zone) => ({ zone, bucket: "intraday" })),
        ];
    }
    return [
        ...output.majorResistance.map((zone) => ({ zone, bucket: "major" })),
        ...output.intermediateResistance.map((zone) => ({ zone, bucket: "intermediate" })),
        ...output.intradayResistance.map((zone) => ({ zone, bucket: "intraday" })),
    ];
}
export function normalizeOldPathOutput(output, currentPrice, maxComparableLevels = 8) {
    const supports = flattenOldSide(output, "support")
        .slice(0, maxComparableLevels)
        .map(({ zone, bucket }, index) => ({
        sourcePath: "old",
        side: "support",
        price: zone.representativePrice,
        zoneLow: zone.zoneLow,
        zoneHigh: zone.zoneHigh,
        rank: index + 1,
        nearestRank: index + 1,
        score: zone.strengthScore,
        strengthLabel: zone.strengthLabel,
        bucket,
        sourceTimeframes: zone.timeframeSources,
    }));
    const resistances = flattenOldSide(output, "resistance")
        .slice(0, maxComparableLevels)
        .map(({ zone, bucket }, index) => ({
        sourcePath: "old",
        side: "resistance",
        price: zone.representativePrice,
        zoneLow: zone.zoneLow,
        zoneHigh: zone.zoneHigh,
        rank: index + 1,
        nearestRank: index + 1,
        score: zone.strengthScore,
        strengthLabel: zone.strengthLabel,
        bucket,
        sourceTimeframes: zone.timeframeSources,
    }));
    const nearestSupports = sortNearest(supports, currentPrice, "support");
    const nearestResistances = sortNearest(resistances, currentPrice, "resistance");
    return {
        symbol: output.symbol,
        currentPrice,
        topSupport: supports[0],
        nearestSupport: nearestSupports[0],
        topResistance: resistances[0],
        nearestResistance: nearestResistances[0],
        supports,
        resistances,
        visibleSupportCount: supports.length,
        visibleResistanceCount: resistances.length,
        nearbyDuplicateCount: 0,
        outputShape: "legacy_level_engine_output",
    };
}
export function normalizeSurfacedSelectionOutput(output, maxComparableLevels = 8) {
    const supports = output.surfacedSupports.slice(0, maxComparableLevels).map((level, index) => ({
        sourcePath: "surfaced_adapter",
        side: "support",
        price: level.price,
        zoneLow: level.zoneLow,
        zoneHigh: level.zoneHigh,
        rank: index + 1,
        nearestRank: index + 1,
        score: level.surfacedSelectionScore,
        confidence: level.confidence,
        state: level.state,
        explanation: level.surfacedSelectionExplanation,
        sourceTimeframes: level.sourceTimeframes,
    }));
    const resistances = output.surfacedResistances.slice(0, maxComparableLevels).map((level, index) => ({
        sourcePath: "surfaced_adapter",
        side: "resistance",
        price: level.price,
        zoneLow: level.zoneLow,
        zoneHigh: level.zoneHigh,
        rank: index + 1,
        nearestRank: index + 1,
        score: level.surfacedSelectionScore,
        confidence: level.confidence,
        state: level.state,
        explanation: level.surfacedSelectionExplanation,
        sourceTimeframes: level.sourceTimeframes,
    }));
    const nearestSupports = sortNearest(supports, output.currentPrice, "support");
    const nearestResistances = sortNearest(resistances, output.currentPrice, "resistance");
    return {
        symbol: output.symbol,
        currentPrice: output.currentPrice,
        topSupport: supports[0],
        nearestSupport: nearestSupports[0],
        topResistance: resistances[0],
        nearestResistance: nearestResistances[0],
        supports,
        resistances,
        visibleSupportCount: supports.length,
        visibleResistanceCount: resistances.length,
        nearbyDuplicateCount: output.suppressedNearDuplicates.length,
        outputShape: "surfaced_selection_projection",
    };
}
function priceChanged(left, right) {
    if (!left || !right) {
        return left !== right;
    }
    return Math.abs(left.price - right.price) > 0.0001;
}
export function computeComparisonDifferences(params) {
    const noteworthyDisagreements = [];
    if (priceChanged(params.oldPath.nearestSupport, params.newPath.nearestSupport)) {
        noteworthyDisagreements.push("Nearest support differs between old and projected paths.");
    }
    if (priceChanged(params.oldPath.nearestResistance, params.newPath.nearestResistance)) {
        noteworthyDisagreements.push("Nearest resistance differs between old and projected paths.");
    }
    return {
        changedTopSupport: priceChanged(params.oldPath.topSupport, params.newPath.topSupport),
        changedTopResistance: priceChanged(params.oldPath.topResistance, params.newPath.topResistance),
        changedNearestSupport: priceChanged(params.oldPath.nearestSupport, params.newPath.nearestSupport),
        changedNearestResistance: priceChanged(params.oldPath.nearestResistance, params.newPath.nearestResistance),
        supportRankChanges: [],
        resistanceRankChanges: [],
        duplicateSuppressionImproved: params.newPath.nearbyDuplicateCount < params.oldPath.nearbyDuplicateCount,
        oldNearbyDuplicateCount: params.oldPath.nearbyDuplicateCount,
        newNearbyDuplicateCount: params.newPath.nearbyDuplicateCount,
        noteworthyDisagreements,
        incompatibilities: params.limitations ?? [],
    };
}
