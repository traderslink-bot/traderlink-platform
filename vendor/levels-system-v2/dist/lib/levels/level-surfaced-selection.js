// 2026-05-27 08:55 PM America/Toronto
// Minimal surfaced-selection shape used by the rescue-only runtime projection tests.
function durabilityLabelForState(state) {
    if (state === "heavily_tested" || state === "weakened" || state === "broken") {
        return "fragile";
    }
    if (state === "respected" || state === "reclaimed" || state === "flipped") {
        return "durable";
    }
    return "tested";
}
function toSurfacedLevel(level) {
    const selectionCategory = level.type === "support" || level.type === "resistance" ? "actionable" : "anchor";
    return {
        ...level,
        selectionCategory,
        surfacedSelectionScore: level.score,
        surfacedSelectionExplanation: level.explanation,
        surfacedSelectionNotes: [],
        durabilityLabel: durabilityLabelForState(level.state),
    };
}
function sortByRuntimePriority(levels, side, currentPrice) {
    const sideLevels = levels.filter((level) => level.type === side);
    return [...sideLevels].sort((left, right) => {
        const sideDistance = side === "support"
            ? Math.abs(currentPrice - right.price) - Math.abs(currentPrice - left.price)
            : Math.abs(currentPrice - left.price) - Math.abs(currentPrice - right.price);
        return right.score - left.score || sideDistance || left.price - right.price;
    });
}
export function selectSurfacedLevels(rankedOutput) {
    const supports = sortByRuntimePriority(rankedOutput.supports, "support", rankedOutput.currentPrice).map(toSurfacedLevel);
    const resistances = sortByRuntimePriority(rankedOutput.resistances, "resistance", rankedOutput.currentPrice).map(toSurfacedLevel);
    return {
        symbol: rankedOutput.symbol,
        currentPrice: rankedOutput.currentPrice,
        surfacedSupports: supports,
        surfacedResistances: resistances,
        deeperSupportAnchor: supports.at(-1),
        deeperResistanceAnchor: resistances.at(-1),
        suppressedNearDuplicates: [],
        diagnostics: {
            rankedSupportCount: rankedOutput.supports.length,
            rankedResistanceCount: rankedOutput.resistances.length,
            surfacedSupportCount: supports.length,
            surfacedResistanceCount: resistances.length,
        },
    };
}
