import { explainLevelContext } from "./level-context-explainer.js";
const DEFAULT_PROXIMITY_THRESHOLD_PCT = 1;
const ROUND_NUMBER_THRESHOLD_PCT = 0.35;
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function isUsableNumber(value) {
    return value !== undefined && Number.isFinite(value);
}
function distancePct(price, referencePrice) {
    if (!Number.isFinite(price) || !Number.isFinite(referencePrice) || referencePrice === 0) {
        return Number.POSITIVE_INFINITY;
    }
    return round((Math.abs(price - referencePrice) / Math.abs(referencePrice)) * 100);
}
function distanceCategory(distance) {
    if (distance <= 2) {
        return "near";
    }
    if (distance <= 8) {
        return "approaching";
    }
    if (distance <= 20) {
        return "extended";
    }
    return "far";
}
function resolveSessionFacts(request) {
    return request.sessionFacts ?? request.factsBundle?.sessionFacts;
}
function resolveVolumeFacts(request) {
    return request.volumeFacts ?? request.factsBundle?.volumeFacts;
}
function resolveReferencePrice(request, sessionFacts) {
    return request.referencePrice ?? request.factsBundle?.referencePrice ?? sessionFacts?.currentPrice;
}
function resolveVolumeShelves(request) {
    const shelves = new Map();
    for (const shelf of [...(request.volumeShelves ?? []), ...(request.factsBundle?.volumeShelves ?? [])]) {
        shelves.set(shelf.id, shelf);
    }
    return [...shelves.values()];
}
function shelfOverlapsLevel(level, shelf) {
    return level.zoneLow <= shelf.zoneHigh && shelf.zoneLow <= level.zoneHigh;
}
function shelfNearLevel(level, shelf, thresholdPct) {
    return shelfOverlapsLevel(level, shelf) || distancePct(level.representativePrice, shelf.representativePrice) <= thresholdPct;
}
function zoneWidthPercent(level) {
    if (level.representativePrice === 0) {
        return 0;
    }
    return round((Math.abs(level.zoneHigh - level.zoneLow) / Math.abs(level.representativePrice)) * 100);
}
function roundNumberType(value) {
    const cents = Math.round((value - Math.floor(value)) * 100);
    if (cents === 0) {
        return "whole";
    }
    if (cents === 50) {
        return "half";
    }
    if (cents === 25 || cents === 75) {
        return "quarter";
    }
    return "ten_cent";
}
function nearestRoundNumber(price) {
    const increments = [1, 0.5, 0.25, 0.1];
    const candidates = increments.map((increment) => {
        const value = round(Math.round(price / increment) * increment, 4);
        return {
            value,
            type: roundNumberType(value),
            distancePct: distancePct(price, value),
        };
    });
    const best = candidates.sort((left, right) => left.distancePct - right.distancePct)[0];
    if (!best || best.distancePct > ROUND_NUMBER_THRESHOLD_PCT) {
        return undefined;
    }
    return best;
}
function buildDistance(level, referencePrice) {
    if (!isUsableNumber(referencePrice)) {
        return undefined;
    }
    const pct = distancePct(level.representativePrice, referencePrice);
    return {
        referencePrice,
        distanceFromReferencePct: pct,
        category: distanceCategory(pct),
    };
}
function buildReaction(level) {
    const touchStats = level.enrichedAnalysis?.touchStats;
    return {
        touchCount: level.touchCount,
        reactionQualityScore: level.reactionQualityScore,
        rejectionScore: level.rejectionScore,
        displacementScore: level.displacementScore,
        followThroughScore: level.followThroughScore,
        meaningfulTouchCount: touchStats?.meaningfulTouchCount,
        rejectionCount: touchStats?.rejectionCount,
        failedBreakCount: touchStats?.failedBreakCount,
        cleanBreakCount: touchStats?.cleanBreakCount,
        reclaimCount: touchStats?.reclaimCount,
        averageReactionMovePct: touchStats?.averageReactionMovePct,
        strongestReactionMovePct: touchStats?.strongestReactionMovePct,
        bestVolumeRatio: touchStats?.bestVolumeRatio,
        averageVolumeRatio: touchStats?.averageVolumeRatio,
        cleanlinessStdDevPct: touchStats?.cleanlinessStdDevPct,
    };
}
function formatEvidenceLimitation(value) {
    if (value === "not_historical_support_resistance") {
        return "not historical support/resistance";
    }
    return value.replaceAll("_", " ");
}
function buildExtensionProfile(level) {
    if (!level.isExtension) {
        return undefined;
    }
    const metadata = level.extensionMetadata;
    const source = metadata?.extensionSource ?? "historical_candidate";
    const isSyntheticContinuationMap = source === "synthetic_continuation_map";
    const evidenceLimitations = metadata?.evidenceLimitations ? [...metadata.evidenceLimitations] : [];
    return {
        source,
        label: isSyntheticContinuationMap
            ? "Synthetic continuation map"
            : "Historical candidate extension",
        generationMethod: metadata?.generationMethod,
        evidenceLimitations,
        referencePrice: metadata?.referencePrice,
        coveragePct: metadata?.targetCoveragePct,
        maxCoveragePct: metadata?.maxCoveragePct,
        syntheticIndex: metadata?.syntheticIndex,
        notes: [...level.notes],
        isSyntheticContinuationMap,
    };
}
function buildDiagnostics(params) {
    const diagnostics = [];
    if (!params.sessionFacts) {
        diagnostics.push("session_facts_missing");
    }
    if (!params.volumeFacts) {
        diagnostics.push("volume_facts_missing");
    }
    if (!isUsableNumber(params.referencePrice)) {
        diagnostics.push("reference_price_missing");
    }
    if (!params.level.enrichedAnalysis) {
        diagnostics.push("enriched_analysis_missing");
    }
    if (params.nearbyShelfIds.length === 0) {
        diagnostics.push("no_nearby_volume_shelf");
    }
    return diagnostics;
}
function buildReason(level, profile) {
    if (profile.extension?.isSyntheticContinuationMap) {
        const limitations = profile.extension.evidenceLimitations.map(formatEvidenceLimitation);
        const pieces = [
            `${level.kind} extension ${round(level.representativePrice)} is a synthetic continuation-map forward-planning level`,
            "not historical support/resistance",
            limitations.length > 0 ? `evidence limits: ${limitations.join(", ")}` : "limited evidence",
        ];
        if (profile.distance) {
            pieces.push(`${profile.distance.distanceFromReferencePct}% from reference price`);
        }
        return `${pieces.join("; ")}.`;
    }
    const pieces = [
        `${level.kind} zone ${round(level.representativePrice)} is sourced from ${profile.origin.timeframeSources.join(", ") || "unknown timeframe"} evidence`,
        `freshness is ${profile.freshness.label}`,
    ];
    if (profile.freshness.state) {
        pieces.push(`state is ${profile.freshness.state}`);
    }
    if (profile.distance) {
        pieces.push(`${profile.distance.distanceFromReferencePct}% from reference price`);
    }
    if (profile.volume && profile.volume.volumeState !== "unknown") {
        pieces.push(`volume state is ${profile.volume.volumeState}`);
    }
    return `${pieces.join("; ")}.`;
}
export function buildLevelIntelligenceProfile(request) {
    const { level } = request;
    const sessionFacts = resolveSessionFacts(request);
    const volumeFacts = resolveVolumeFacts(request);
    const shelves = resolveVolumeShelves(request);
    const referencePrice = resolveReferencePrice(request, sessionFacts);
    const thresholdPct = Math.max(0, request.proximityThresholdPct ?? DEFAULT_PROXIMITY_THRESHOLD_PCT);
    const contextExplanation = explainLevelContext({
        level,
        sessionFacts,
        volumeFacts,
        volumeShelves: shelves,
        marketContext: request.marketContext,
        factsBundle: request.factsBundle,
        currentPrice: referencePrice,
        proximityThresholdPct: thresholdPct,
    });
    const nearbyShelfIds = shelves
        .filter((shelf) => shelfNearLevel(level, shelf, thresholdPct))
        .map((shelf) => shelf.id);
    const distance = buildDistance(level, referencePrice);
    const extension = buildExtensionProfile(level);
    const volume = volumeFacts
        ? {
            volumeState: volumeFacts.volumeState,
            relativeVolume: volumeFacts.relativeVolume,
            dollarVolume: volumeFacts.dollarVolume,
            liquidityQuality: volumeFacts.liquidityQuality,
            accelerationState: volumeFacts.accelerationState,
            pullbackVolumeState: volumeFacts.pullbackVolumeState,
            breakoutVolumeState: volumeFacts.breakoutVolumeState,
            nearbyShelfIds,
        }
        : undefined;
    const profileSeed = {
        distance,
        origin: {
            sourceTypes: [...level.sourceTypes],
            timeframeSources: [...level.timeframeSources],
            primaryTimeframe: level.timeframeBias,
            isExtension: level.isExtension,
        },
        extension,
        freshness: {
            firstTimestamp: level.firstTimestamp,
            lastTimestamp: level.lastTimestamp,
            label: level.freshness,
            state: level.enrichedAnalysis?.state,
        },
        volume,
    };
    return {
        levelId: level.id,
        symbol: level.symbol,
        kind: level.kind,
        representativePrice: level.representativePrice,
        zoneLow: level.zoneLow,
        zoneHigh: level.zoneHigh,
        zoneWidthPercent: zoneWidthPercent(level),
        origin: profileSeed.origin,
        extension,
        freshness: profileSeed.freshness,
        reaction: buildReaction(level),
        distance,
        volume,
        confluence: {
            nearSessionFacts: [...contextExplanation.nearbySessionFacts],
            nearVolumeFacts: [...contextExplanation.nearbyVolumeFacts],
            nearShelfFacts: [...contextExplanation.nearbyShelfFacts],
            contextTags: [...contextExplanation.contextTags],
            nearRoundNumber: nearestRoundNumber(level.representativePrice),
        },
        marketContext: request.marketContext
            ? {
                primaryContext: request.marketContext.primaryContext,
                runnerPhase: request.marketContext.runnerPhase,
                confidence: request.marketContext.confidence,
            }
            : undefined,
        confidence: level.enrichedAnalysis?.confidence,
        diagnostics: buildDiagnostics({ sessionFacts, volumeFacts, referencePrice, nearbyShelfIds, level }),
        reason: buildReason(level, profileSeed),
        safety: {
            factsOnly: true,
            noRuntimeBehaviorChange: true,
            vwapFactsOnly: true,
            shelvesAreFactsOnly: true,
        },
    };
}
