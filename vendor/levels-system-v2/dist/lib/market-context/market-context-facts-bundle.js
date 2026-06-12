function hasValue(value) {
    return value !== undefined && value !== null;
}
function isUsableNumber(value) {
    return value !== undefined && Number.isFinite(value);
}
function resolveSymbol(request) {
    return (request.symbol ?? request.sessionFacts.symbol ?? request.volumeFacts.symbol).toUpperCase();
}
function resolveAsOfTimestamp(request) {
    return request.asOfTimestamp ?? request.sessionFacts.asOfTimestamp ?? request.volumeFacts.asOfTimestamp;
}
function resolveReferencePrice(request) {
    const candidates = [
        request.referencePrice,
        request.sessionFacts.currentPrice,
        request.sessionFacts.highOfDay,
        request.sessionFacts.regularSessionOpen,
        request.sessionFacts.previousClose,
        request.sessionFacts.vwap,
    ];
    return candidates.find(isUsableNumber);
}
function cloneSessionDiagnostic(diagnostic) {
    return { ...diagnostic };
}
function cloneVolumeDiagnostic(diagnostic) {
    return { ...diagnostic };
}
function cloneSessionFacts(facts) {
    const clone = {
        ...facts,
        diagnostics: facts.diagnostics.map(cloneSessionDiagnostic),
    };
    if (facts.firstConsolidationRange) {
        clone.firstConsolidationRange = { ...facts.firstConsolidationRange };
    }
    return clone;
}
function cloneVolumeFacts(facts) {
    return {
        ...facts,
        diagnostics: facts.diagnostics.map(cloneVolumeDiagnostic),
    };
}
function cloneVolumeShelf(shelf) {
    return { ...shelf };
}
function countExcludedDiagnostics(diagnostics, code) {
    return diagnostics
        .filter((diagnostic) => diagnostic.code === code)
        .reduce((sum, diagnostic) => sum + (diagnostic.excludedCount ?? 0), 0);
}
function newsMetadata(request) {
    if (!hasValue(request.newsTimestamp) && !hasValue(request.pressReleaseTimestamp)) {
        return undefined;
    }
    const metadata = {
        hasExplicitCatalyst: true,
    };
    if (hasValue(request.newsTimestamp)) {
        metadata.newsTimestamp = request.newsTimestamp;
    }
    if (hasValue(request.pressReleaseTimestamp)) {
        metadata.pressReleaseTimestamp = request.pressReleaseTimestamp;
    }
    return metadata;
}
export function buildMarketContextFactsBundle(request) {
    const sessionFacts = cloneSessionFacts(request.sessionFacts);
    const volumeFacts = cloneVolumeFacts(request.volumeFacts);
    const volumeShelves = (request.volumeShelves ?? []).map(cloneVolumeShelf);
    const diagnostics = [...sessionFacts.diagnostics, ...volumeFacts.diagnostics];
    const bundle = {
        symbol: resolveSymbol(request),
        asOfTimestamp: resolveAsOfTimestamp(request),
        sessionFacts,
        volumeFacts,
        volumeShelves,
        diagnostics: {
            futureCandlesExcluded: countExcludedDiagnostics(diagnostics, "future_candles_filtered"),
            partialCandlesExcluded: countExcludedDiagnostics(diagnostics, "partial_candles_filtered"),
            sessionDiagnostics: sessionFacts.diagnostics,
            volumeDiagnostics: volumeFacts.diagnostics,
        },
        levelOutputUnchanged: true,
        shelvesAreFactsOnly: true,
        vwapFactsOnly: true,
    };
    const referencePrice = resolveReferencePrice(request);
    const news = newsMetadata(request);
    if (referencePrice !== undefined) {
        bundle.referencePrice = referencePrice;
    }
    if (news) {
        bundle.news = news;
    }
    return bundle;
}
