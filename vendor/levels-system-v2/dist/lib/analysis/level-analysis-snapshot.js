import { buildLevelIntelligenceReport, } from "../levels/level-intelligence-report.js";
import { buildLevelQualityAuditReport, } from "../levels/level-quality-audit-runner.js";
import { buildMarketContextFactsBundle, } from "../market-context/index.js";
export const LEVEL_ANALYSIS_SNAPSHOT_SCHEMA_VERSION = "level-analysis-snapshot/v1";
export const LEVEL_ANALYSIS_SNAPSHOT_PRODUCER = "levels-system";
function clone(value) {
    return structuredClone(value);
}
function normalizeSymbol(symbol) {
    return symbol.trim().toUpperCase();
}
function isUsableNumber(value) {
    return value !== undefined && Number.isFinite(value);
}
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function resolveReferencePrice(request) {
    return [
        request.referencePrice,
        request.levelEngineOutput.metadata.referencePrice,
        request.factsBundle?.referencePrice,
        request.sessionFacts?.currentPrice,
    ].find(isUsableNumber);
}
function resolveSessionFacts(request) {
    return request.sessionFacts ?? request.factsBundle?.sessionFacts;
}
function resolveVolumeFacts(request) {
    return request.volumeFacts ?? request.factsBundle?.volumeFacts;
}
function resolveVolumeShelves(request) {
    return request.volumeShelves ?? request.factsBundle?.volumeShelves;
}
function resolveFactsBundle(params) {
    if (params.request.factsBundle) {
        return params.request.factsBundle;
    }
    if (!params.sessionFacts || !params.volumeFacts) {
        return undefined;
    }
    return buildMarketContextFactsBundle({
        symbol: params.symbol,
        asOfTimestamp: params.request.asOfTimestamp,
        referencePrice: params.referencePrice,
        sessionFacts: params.sessionFacts,
        volumeFacts: params.volumeFacts,
        volumeShelves: params.volumeShelves ?? [],
    });
}
function allExtensionLevels(output) {
    return [...output.extensionLevels.support, ...output.extensionLevels.resistance];
}
function levelsByBucket(output) {
    return [
        ...output.majorSupport.map((level) => ({ bucket: "majorSupport", level })),
        ...output.majorResistance.map((level) => ({ bucket: "majorResistance", level })),
        ...output.intermediateSupport.map((level) => ({ bucket: "intermediateSupport", level })),
        ...output.intermediateResistance.map((level) => ({ bucket: "intermediateResistance", level })),
        ...output.intradaySupport.map((level) => ({ bucket: "intradaySupport", level })),
        ...output.intradayResistance.map((level) => ({ bucket: "intradayResistance", level })),
        ...output.extensionLevels.support.map((level) => ({ bucket: "extensionSupport", level })),
        ...output.extensionLevels.resistance.map((level) => ({ bucket: "extensionResistance", level })),
    ];
}
function toNearestLevel(params) {
    const distanceFromReferencePct = params.referencePrice === 0
        ? 0
        : Math.abs(params.level.representativePrice - params.referencePrice) / params.referencePrice;
    const nearest = {
        levelId: params.level.id,
        kind: params.level.kind,
        bucket: params.bucket,
        representativePrice: params.level.representativePrice,
        zoneLow: params.level.zoneLow,
        zoneHigh: params.level.zoneHigh,
        strengthScore: params.level.strengthScore,
        strengthLabel: params.level.strengthLabel,
        distanceFromReferencePct: round(distanceFromReferencePct, 6),
        isExtension: params.level.isExtension,
    };
    if (params.level.extensionMetadata?.extensionSource) {
        nearest.extensionSource = params.level.extensionMetadata.extensionSource;
    }
    return nearest;
}
function deriveNearestLevel(params) {
    if (params.referencePrice === undefined) {
        return null;
    }
    const candidates = levelsByBucket(params.output).filter(({ level }) => {
        if (level.kind !== params.kind) {
            return false;
        }
        return params.kind === "support"
            ? level.representativePrice <= params.referencePrice
            : level.representativePrice >= params.referencePrice;
    });
    const nearest = candidates.sort((left, right) => params.kind === "support"
        ? right.level.representativePrice - left.level.representativePrice
        : left.level.representativePrice - right.level.representativePrice)[0];
    return nearest
        ? toNearestLevel({
            ...nearest,
            referencePrice: params.referencePrice,
        })
        : null;
}
function syntheticExtensionsClearlyMarked(output) {
    const syntheticExtensions = allExtensionLevels(output).filter((level) => level.extensionMetadata?.extensionSource === "synthetic_continuation_map");
    return syntheticExtensions.every((level) => {
        const notes = level.notes.join(" ").toLowerCase();
        const limitations = level.extensionMetadata?.evidenceLimitations ?? [];
        return (level.isExtension === true &&
            level.touchCount === 0 &&
            level.confluenceCount === 0 &&
            notes.includes("synthetic") &&
            notes.includes("continuation") &&
            notes.includes("not historical support/resistance") &&
            limitations.includes("not_historical_support_resistance") &&
            limitations.includes("no_touch_or_rejection_history"));
    });
}
function timestampIsAsOfSafe(timestamp, asOfTimestamp) {
    return timestamp === undefined || !Number.isFinite(timestamp) || timestamp <= asOfTimestamp;
}
function noLookaheadApplied(params) {
    const asOfTimestamp = params.request.asOfTimestamp;
    return [
        params.request.levelEngineOutput.generatedAt,
        params.sessionFacts?.asOfTimestamp,
        params.volumeFacts?.asOfTimestamp,
        params.factsBundle?.asOfTimestamp,
    ].every((timestamp) => timestampIsAsOfSafe(timestamp, asOfTimestamp));
}
function emptyTimeframeSummary() {
    return {
        provided: false,
        candleCount: 0,
        filteredCandleCount: 0,
        excludedFutureCandleCount: 0,
        excludedPartialCandleCount: 0,
    };
}
function candleInputCount(candles) {
    return candles?.length ?? 0;
}
function buildInputSummary(request) {
    if (request.inputSummary) {
        return clone(request.inputSummary);
    }
    const timeframes = {
        "5m": {
            ...emptyTimeframeSummary(),
            provided: request.closedCandles?.fiveMinute !== undefined,
            candleCount: candleInputCount(request.closedCandles?.fiveMinute),
            filteredCandleCount: candleInputCount(request.closedCandles?.fiveMinute),
        },
        "15m": {
            ...emptyTimeframeSummary(),
            provided: request.closedCandles?.fifteenMinute !== undefined,
            candleCount: candleInputCount(request.closedCandles?.fifteenMinute),
            filteredCandleCount: candleInputCount(request.closedCandles?.fifteenMinute),
        },
        "4h": {
            ...emptyTimeframeSummary(),
            provided: request.closedCandles?.fourHour !== undefined,
            candleCount: candleInputCount(request.closedCandles?.fourHour),
            filteredCandleCount: candleInputCount(request.closedCandles?.fourHour),
        },
        daily: {
            ...emptyTimeframeSummary(),
            provided: request.closedCandles?.daily !== undefined,
            candleCount: candleInputCount(request.closedCandles?.daily),
            filteredCandleCount: candleInputCount(request.closedCandles?.daily),
        },
    };
    const keys = ["5m", "15m", "4h", "daily"];
    return {
        timeframesPresent: keys.filter((timeframe) => timeframes[timeframe].filteredCandleCount > 0),
        candleCounts: Object.fromEntries(keys.map((timeframe) => [timeframe, timeframes[timeframe].candleCount])),
        filteredCandleCounts: Object.fromEntries(keys.map((timeframe) => [timeframe, timeframes[timeframe].filteredCandleCount])),
        excludedFutureCandleCounts: Object.fromEntries(keys.map((timeframe) => [timeframe, timeframes[timeframe].excludedFutureCandleCount ?? 0])),
        excludedPartialCandleCounts: Object.fromEntries(keys.map((timeframe) => [timeframe, timeframes[timeframe].excludedPartialCandleCount ?? 0])),
        timeframes,
        previousCloseProvided: resolveSessionFacts(request)?.previousClose !== undefined,
    };
}
function buildDiagnostics(params) {
    const diagnostics = new Set();
    if (normalizeSymbol(params.request.levelEngineOutput.symbol) !== params.symbol) {
        diagnostics.add("symbol_mismatch");
    }
    if (!params.noLookaheadApplied) {
        diagnostics.add("as_of_boundary_warning");
    }
    if (!params.syntheticExtensionsClearlyMarked) {
        diagnostics.add("synthetic_extension_marking_incomplete");
    }
    if (!params.sessionFacts) {
        diagnostics.add("session_facts_missing");
    }
    if (!params.volumeFacts) {
        diagnostics.add("volume_facts_missing");
    }
    if (!params.factsBundle) {
        diagnostics.add("facts_bundle_missing");
    }
    if (params.request.closedCandles) {
        diagnostics.add("candle_inputs_reserved_for_future_fact_generation");
    }
    if (params.request.closedCandles?.fifteenMinute !== undefined && !params.request.timeframeFacts?.["15m"]) {
        diagnostics.add("15m_candles_reserved_for_future_fact_generation");
    }
    return [...diagnostics].sort();
}
export function buildLevelAnalysisSnapshot(request) {
    const symbol = normalizeSymbol(request.symbol);
    const referencePrice = resolveReferencePrice(request);
    const sessionFacts = resolveSessionFacts(request);
    const volumeFacts = resolveVolumeFacts(request);
    const volumeShelves = resolveVolumeShelves(request);
    const factsBundle = resolveFactsBundle({
        request,
        symbol,
        referencePrice,
        sessionFacts,
        volumeFacts,
        volumeShelves,
    });
    const levelIntelligenceReport = buildLevelIntelligenceReport({
        output: request.levelEngineOutput,
        referencePrice,
        sessionFacts,
        volumeFacts,
        volumeShelves,
        marketContext: request.marketContext,
        factsBundle,
    });
    const levelQualityAudit = buildLevelQualityAuditReport({
        output: request.levelEngineOutput,
        intelligenceReport: levelIntelligenceReport,
    });
    const syntheticMarked = syntheticExtensionsClearlyMarked(request.levelEngineOutput);
    const lookaheadSafe = noLookaheadApplied({
        request,
        sessionFacts,
        volumeFacts,
        factsBundle,
    });
    const diagnostics = buildDiagnostics({
        request,
        symbol,
        sessionFacts,
        volumeFacts,
        factsBundle,
        noLookaheadApplied: lookaheadSafe,
        syntheticExtensionsClearlyMarked: syntheticMarked,
    });
    const inputSummary = buildInputSummary(request);
    const nearestSupport = deriveNearestLevel({
        output: request.levelEngineOutput,
        referencePrice,
        kind: "support",
    });
    const nearestResistance = deriveNearestLevel({
        output: request.levelEngineOutput,
        referencePrice,
        kind: "resistance",
    });
    const snapshot = {
        schemaVersion: LEVEL_ANALYSIS_SNAPSHOT_SCHEMA_VERSION,
        producer: LEVEL_ANALYSIS_SNAPSHOT_PRODUCER,
        symbol,
        asOfTimestamp: request.asOfTimestamp,
        inputSummary,
        nearestSupport,
        nearestResistance,
        levelEngineOutput: clone(request.levelEngineOutput),
        levelIntelligenceReport,
        levelQualityAudit,
        diagnostics,
        safety: {
            noLookaheadApplied: lookaheadSafe,
            levelOutputUnchanged: true,
            factsOnlyVWAP: true,
            shelvesAreFactsOnly: true,
            syntheticExtensionsClearlyMarked: syntheticMarked,
            noRuntimeBehaviorChange: true,
        },
    };
    if (referencePrice !== undefined) {
        snapshot.referencePrice = referencePrice;
    }
    if (sessionFacts) {
        snapshot.sessionFacts = clone(sessionFacts);
    }
    if (volumeFacts) {
        snapshot.volumeFacts = clone(volumeFacts);
    }
    if (volumeShelves) {
        snapshot.volumeShelves = clone(volumeShelves);
    }
    if (request.marketContext) {
        snapshot.marketContext = clone(request.marketContext);
    }
    if (factsBundle) {
        snapshot.factsBundle = clone(factsBundle);
    }
    if (request.timeframeFacts) {
        snapshot.timeframeFacts = clone(request.timeframeFacts);
    }
    return snapshot;
}
