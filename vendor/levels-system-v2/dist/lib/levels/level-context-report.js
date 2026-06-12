import { explainLevelContext, } from "./level-context-explainer.js";
function runtimeLevels(output) {
    return [
        ...output.majorSupport,
        ...output.majorResistance,
        ...output.intermediateSupport,
        ...output.intermediateResistance,
        ...output.intradaySupport,
        ...output.intradayResistance,
        ...output.extensionLevels.support,
        ...output.extensionLevels.resistance,
    ];
}
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
export function buildLevelContextReport(request) {
    const { output } = request;
    const explanations = runtimeLevels(output).map((level) => explainLevelContext({
        level,
        sessionFacts: request.sessionFacts,
        volumeFacts: request.volumeFacts,
        volumeShelves: request.volumeShelves,
        marketContext: request.marketContext,
        factsBundle: request.factsBundle,
        currentPrice: output.metadata.referencePrice,
        proximityThresholdPct: request.proximityThresholdPct,
    }));
    return {
        symbol: output.symbol,
        generatedAt: output.generatedAt,
        explanations,
        counts: buildCounts(output),
        safety: {
            levelOutputUnchanged: true,
            factsOnlyVWAP: true,
            shelvesAreFactsOnly: true,
            noRuntimeBehaviorChange: true,
        },
    };
}
