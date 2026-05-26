// 2026-04-18 08:40 AM America/Toronto
// Runtime-compatible projection from the new structural ranking + surfaced adapter path into the legacy bucketed output contract.
import { rankLevels } from "./level-ranking.js";
import { normalizeSurfacedSelectionOutput } from "./level-ranking-comparison.js";
import { LEVEL_SCORE_CONFIG } from "./level-score-config.js";
import { LEVEL_SURFACED_SELECTION_CONFIG } from "./level-surfaced-selection-config.js";
import { selectSurfacedLevels, } from "./level-surfaced-selection.js";
import { buildZoneBounds, clamp } from "./level-zone-utils.js";
const RAW_LEVEL_SOURCE_TYPES = [
    "swing_high",
    "swing_low",
    "premarket_high",
    "premarket_low",
    "opening_range_high",
    "opening_range_low",
];
function normalizeRuntimeSourceTimeframe(timeframe) {
    if (timeframe === "daily" || timeframe === "4h" || timeframe === "5m") {
        return timeframe;
    }
    return "5m";
}
function deriveCurrentTimeframe(candlesByTimeframe) {
    if ((candlesByTimeframe["5m"]?.length ?? 0) > 0) {
        return "5m";
    }
    if ((candlesByTimeframe["4h"]?.length ?? 0) > 0) {
        return "4h";
    }
    return "daily";
}
function deriveLatestTimestamp(candlesByTimeframe) {
    return Math.max(0, ...Object.values(candlesByTimeframe).map((candles) => candles?.at(-1)?.timestamp ?? 0));
}
function buildScoringContext(symbol, candlesByTimeframe, metadata) {
    const currentTimeframe = deriveCurrentTimeframe(candlesByTimeframe);
    const recentCandles = candlesByTimeframe[currentTimeframe] ??
        candlesByTimeframe["5m"] ??
        candlesByTimeframe["4h"] ??
        candlesByTimeframe.daily ??
        [];
    return {
        symbol: symbol.toUpperCase(),
        currentPrice: metadata.referencePrice ?? 0,
        latestTimestamp: deriveLatestTimestamp(candlesByTimeframe),
        recentCandles,
        currentTimeframe,
    };
}
function convertRawCandidateToLevelCandidate(candidate, candlesByTimeframe) {
    const zoneBounds = buildZoneBounds(candidate.price);
    return {
        id: candidate.id,
        symbol: candidate.symbol,
        type: candidate.kind === "support" ? "support" : "resistance",
        price: candidate.price,
        zoneLow: zoneBounds.zoneLow,
        zoneHigh: zoneBounds.zoneHigh,
        sourceTimeframes: [candidate.timeframe],
        originKinds: [candidate.sourceType],
        analysisCandles: candlesByTimeframe[candidate.timeframe],
    };
}
function bucketForSurfacedLevel(level) {
    const normalized = [...new Set(level.sourceTimeframes.map(normalizeRuntimeSourceTimeframe))];
    if (normalized.includes("daily") || normalized.length > 1) {
        return "major";
    }
    if (normalized.includes("4h")) {
        return "intermediate";
    }
    return "intraday";
}
function adjustedLabelScore(score, durabilityLabel) {
    if (durabilityLabel === "reinforced") {
        return score + 4;
    }
    if (durabilityLabel === "tested") {
        return score - 4;
    }
    if (durabilityLabel === "fragile") {
        return score - 10;
    }
    return score;
}
function deriveStrengthLabel(score, durabilityLabel) {
    const labelScore = adjustedLabelScore(score, durabilityLabel);
    if (labelScore >= 80) {
        return "major";
    }
    if (labelScore >= 64) {
        return "strong";
    }
    if (labelScore >= 46) {
        return "moderate";
    }
    return "weak";
}
function deriveFreshness(level) {
    if (level.barsSinceLastReaction <= 8) {
        return "fresh";
    }
    if (level.barsSinceLastReaction <= 30) {
        return "aging";
    }
    return "stale";
}
function deriveTimeframeBias(level) {
    const normalized = [...new Set(level.sourceTimeframes.map(normalizeRuntimeSourceTimeframe))];
    if (normalized.length !== 1) {
        return "mixed";
    }
    return normalized[0];
}
function deriveSourceTypes(level) {
    const sourceTypes = level.originKinds.filter((origin) => RAW_LEVEL_SOURCE_TYPES.includes(origin));
    if (sourceTypes.length > 0) {
        return [...new Set(sourceTypes)];
    }
    return [level.type === "support" ? "swing_low" : "swing_high"];
}
function deriveReactionScore(level) {
    return clamp(level.scoreBreakdown.reactionQualityScore / 15, 0, 1);
}
function deriveRejectionScore(level) {
    return clamp((level.rejectionCount + level.failedBreakCount + level.reclaimCount) /
        Math.max(level.touchCount, 1), 0, 1);
}
function deriveDisplacementScore(level) {
    return clamp(level.scoreBreakdown.reactionMagnitudeScore / 10, 0, 1);
}
function deriveSessionSignificanceScore(level) {
    return clamp(level.scoreBreakdown.volumeScore / 10, 0, 1);
}
function deriveFollowThroughScore(level) {
    return clamp(level.averageReactionMovePct / 0.08, 0, 1);
}
function deriveFirstTimestamp(level, generatedAt) {
    const timestamps = level.touches.map((touch) => touch.candleTimestamp);
    return timestamps.length > 0 ? Math.min(...timestamps) : generatedAt;
}
function deriveLastTimestamp(level, generatedAt) {
    const timestamps = level.touches.map((touch) => touch.candleTimestamp);
    return timestamps.length > 0 ? Math.max(...timestamps) : generatedAt;
}
function toRuntimeZone(level, generatedAt) {
    const strengthScore = Number(level.surfacedSelectionScore.toFixed(2));
    const timeframeSources = [...new Set(level.sourceTimeframes.map(normalizeRuntimeSourceTimeframe))];
    return {
        id: level.id,
        symbol: level.symbol,
        kind: level.type,
        timeframeBias: deriveTimeframeBias(level),
        zoneLow: level.zoneLow,
        zoneHigh: level.zoneHigh,
        representativePrice: level.price,
        strengthScore,
        // This label is an explicit approximation from the new surfaced-selection score,
        // not the old scorer's native label taxonomy.
        strengthLabel: deriveStrengthLabel(strengthScore, level.durabilityLabel),
        touchCount: level.touchCount,
        confluenceCount: Math.max(timeframeSources.length + level.roleFlipCount, 1),
        sourceTypes: deriveSourceTypes(level),
        timeframeSources,
        reactionQualityScore: deriveReactionScore(level),
        rejectionScore: deriveRejectionScore(level),
        displacementScore: deriveDisplacementScore(level),
        sessionSignificanceScore: deriveSessionSignificanceScore(level),
        followThroughScore: deriveFollowThroughScore(level),
        gapContinuationScore: undefined,
        sourceEvidenceCount: Math.max(level.meaningfulTouchCount, timeframeSources.length),
        firstTimestamp: deriveFirstTimestamp(level, generatedAt),
        lastTimestamp: deriveLastTimestamp(level, generatedAt),
        sessionDate: undefined,
        isExtension: level.selectionCategory === "anchor",
        freshness: deriveFreshness(level),
        notes: [
            "runtime_compatibility_adapter:new_surfaced_selection",
            `state=${level.state}`,
            `durability=${level.durabilityLabel ?? "tested"}`,
            `confidence=${level.confidence.toFixed(2)}`,
            level.surfacedSelectionExplanation,
            ...level.surfacedSelectionNotes,
        ],
    };
}
function pushBucketedZone(buckets, level, generatedAt) {
    buckets[bucketForSurfacedLevel(level)].push(toRuntimeZone(level, generatedAt));
}
function buildActionableBuckets(levels, generatedAt) {
    const buckets = {
        major: [],
        intermediate: [],
        intraday: [],
    };
    for (const level of levels) {
        pushBucketedZone(buckets, level, generatedAt);
    }
    return buckets;
}
export function buildNewRuntimeCompatibleLevelOutput(input) {
    const symbol = input.symbol.toUpperCase();
    const scoreConfig = input.scoreConfig ?? LEVEL_SCORE_CONFIG;
    const surfacedSelectionConfig = input.surfacedSelectionConfig ?? LEVEL_SURFACED_SELECTION_CONFIG;
    const generatedAt = input.generatedAt ?? Date.now();
    const levelCandidates = input.levelCandidates ??
        input.rawCandidates.map((candidate) => convertRawCandidateToLevelCandidate(candidate, input.candlesByTimeframe));
    const rankedOutput = rankLevels(levelCandidates, buildScoringContext(symbol, input.candlesByTimeframe, input.metadata), scoreConfig);
    const surfacedSelection = selectSurfacedLevels(rankedOutput, surfacedSelectionConfig);
    const supportBuckets = buildActionableBuckets(surfacedSelection.surfacedSupports, generatedAt);
    const resistanceBuckets = buildActionableBuckets(surfacedSelection.surfacedResistances, generatedAt);
    const extensionSupport = surfacedSelection.deeperSupportAnchor
        ? [toRuntimeZone(surfacedSelection.deeperSupportAnchor, generatedAt)]
        : [];
    const extensionResistance = surfacedSelection.deeperResistanceAnchor
        ? [toRuntimeZone(surfacedSelection.deeperResistanceAnchor, generatedAt)]
        : [];
    const output = {
        symbol,
        generatedAt,
        metadata: input.metadata,
        majorSupport: supportBuckets.major,
        majorResistance: resistanceBuckets.major,
        intermediateSupport: supportBuckets.intermediate,
        intermediateResistance: resistanceBuckets.intermediate,
        intradaySupport: supportBuckets.intraday,
        intradayResistance: resistanceBuckets.intraday,
        extensionLevels: {
            support: extensionSupport,
            resistance: extensionResistance,
        },
        specialLevels: input.specialLevels,
    };
    return {
        output,
        rankedOutput,
        surfacedSelection,
        comparableOutput: normalizeSurfacedSelectionOutput(surfacedSelection, 12),
        mappingNotes: [
            "The new surfaced adapter is projected into the legacy bucketed LevelEngineOutput contract for runtime compatibility.",
            "Strength labels are approximated from surfaced-selection scores because the new path does not emit the old scorer's native label buckets.",
            "Extension levels currently map only the surfaced adapter's deeper anchors instead of recreating the full old extension engine behavior.",
        ],
    };
}
