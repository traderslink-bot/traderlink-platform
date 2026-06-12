import { buildLevelIntelligenceProfile, } from "./level-intelligence-profile.js";
function buildCounts(output) {
    const majorSupport = output.majorSupport.length;
    const majorResistance = output.majorResistance.length;
    const intermediateSupport = output.intermediateSupport.length;
    const intermediateResistance = output.intermediateResistance.length;
    const intradaySupport = output.intradaySupport.length;
    const intradayResistance = output.intradayResistance.length;
    const extensionSupport = output.extensionLevels.support.length;
    const extensionResistance = output.extensionLevels.resistance.length;
    return {
        majorSupport,
        majorResistance,
        intermediateSupport,
        intermediateResistance,
        intradaySupport,
        intradayResistance,
        extensionSupport,
        extensionResistance,
        total: majorSupport +
            majorResistance +
            intermediateSupport +
            intermediateResistance +
            intradaySupport +
            intradayResistance +
            extensionSupport +
            extensionResistance,
    };
}
function resolveReferencePrice(request) {
    return (request.referencePrice ??
        request.output.metadata.referencePrice ??
        request.factsBundle?.referencePrice ??
        request.sessionFacts?.currentPrice);
}
function buildBucketProfiles(levels, request, referencePrice) {
    return levels.map((level) => buildLevelIntelligenceProfile({
        level,
        referencePrice,
        sessionFacts: request.sessionFacts,
        volumeFacts: request.volumeFacts,
        volumeShelves: request.volumeShelves,
        marketContext: request.marketContext,
        factsBundle: request.factsBundle,
        proximityThresholdPct: request.proximityThresholdPct,
    }));
}
function flattenBuckets(buckets) {
    return [
        ...buckets.majorSupport,
        ...buckets.majorResistance,
        ...buckets.intermediateSupport,
        ...buckets.intermediateResistance,
        ...buckets.intradaySupport,
        ...buckets.intradayResistance,
        ...buckets.extensionSupport,
        ...buckets.extensionResistance,
    ];
}
function collectDiagnostics(profiles) {
    return [...new Set(profiles.flatMap((profile) => profile.diagnostics))];
}
export function buildLevelIntelligenceReport(request) {
    const { output } = request;
    const referencePrice = resolveReferencePrice(request);
    const buckets = {
        majorSupport: buildBucketProfiles(output.majorSupport, request, referencePrice),
        majorResistance: buildBucketProfiles(output.majorResistance, request, referencePrice),
        intermediateSupport: buildBucketProfiles(output.intermediateSupport, request, referencePrice),
        intermediateResistance: buildBucketProfiles(output.intermediateResistance, request, referencePrice),
        intradaySupport: buildBucketProfiles(output.intradaySupport, request, referencePrice),
        intradayResistance: buildBucketProfiles(output.intradayResistance, request, referencePrice),
        extensionSupport: buildBucketProfiles(output.extensionLevels.support, request, referencePrice),
        extensionResistance: buildBucketProfiles(output.extensionLevels.resistance, request, referencePrice),
    };
    const profiles = flattenBuckets(buckets);
    return {
        symbol: output.symbol,
        generatedAt: output.generatedAt,
        referencePrice,
        profiles,
        buckets,
        counts: buildCounts(output),
        diagnostics: collectDiagnostics(profiles),
        safety: {
            levelOutputUnchanged: true,
            factsOnly: true,
            vwapFactsOnly: true,
            shelvesAreFactsOnly: true,
            noRuntimeBehaviorChange: true,
        },
    };
}
