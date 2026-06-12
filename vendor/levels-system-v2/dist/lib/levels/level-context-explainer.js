const DEFAULT_PROXIMITY_THRESHOLD_PCT = 1;
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function isUsableNumber(value) {
    return value !== undefined && Number.isFinite(value);
}
function formatNumber(value, decimals = 4) {
    return round(value, decimals).toString();
}
function distancePct(price, referencePrice) {
    if (!Number.isFinite(price) || !Number.isFinite(referencePrice) || referencePrice === 0) {
        return Number.POSITIVE_INFINITY;
    }
    return round((Math.abs(price - referencePrice) / Math.abs(referencePrice)) * 100);
}
function isNearPrice(price, referencePrice, thresholdPct) {
    return isUsableNumber(referencePrice) && distancePct(price, referencePrice) <= thresholdPct;
}
function addUnique(values, value) {
    if (!values.includes(value)) {
        values.push(value);
    }
}
function resolveSessionFacts(request) {
    return request.sessionFacts ?? request.factsBundle?.sessionFacts;
}
function resolveVolumeFacts(request) {
    return request.volumeFacts ?? request.factsBundle?.volumeFacts;
}
function resolveCurrentPrice(request, sessionFacts) {
    return request.currentPrice ?? sessionFacts?.currentPrice ?? request.factsBundle?.referencePrice;
}
function resolveVolumeShelves(request) {
    const byId = new Map();
    for (const shelf of [...(request.volumeShelves ?? []), ...(request.factsBundle?.volumeShelves ?? [])]) {
        byId.set(shelf.id, shelf);
    }
    return [...byId.values()];
}
function pushSessionPriceFact(params) {
    const price = params.price;
    if (!isNearPrice(params.level.representativePrice, price, params.thresholdPct)) {
        return;
    }
    const distance = distancePct(params.level.representativePrice, price);
    const fact = `Level is near ${params.label} ${formatNumber(price)} (${formatNumber(distance)}% away).`;
    addUnique(params.nearbySessionFacts, fact);
    addUnique(params.facts, fact);
    addUnique(params.confluences, `Level shares the ${params.label} price area.`);
    addUnique(params.contextTags, params.tag);
}
function shelfOverlapsLevel(level, shelf) {
    return level.zoneLow <= shelf.zoneHigh && shelf.zoneLow <= level.zoneHigh;
}
function shelfIsNearLevel(level, shelf, thresholdPct) {
    return shelfOverlapsLevel(level, shelf) || isNearPrice(level.representativePrice, shelf.representativePrice, thresholdPct);
}
function addVolumeFacts(params) {
    const { volumeFacts, facts, nearbyVolumeFacts, contextTags } = params;
    if (!volumeFacts) {
        return;
    }
    const pushVolumeFact = (message, tag) => {
        addUnique(nearbyVolumeFacts, message);
        addUnique(facts, message);
        addUnique(contextTags, tag);
    };
    if (volumeFacts.volumeState !== "unknown") {
        pushVolumeFact(`Volume state is ${volumeFacts.volumeState}.`, `volume_state_${volumeFacts.volumeState}`);
    }
    if (isUsableNumber(volumeFacts.relativeVolume)) {
        pushVolumeFact(`Relative volume fact is ${formatNumber(volumeFacts.relativeVolume)}.`, "relative_volume_fact");
    }
    if (isUsableNumber(volumeFacts.dollarVolume)) {
        pushVolumeFact(`Dollar volume fact is ${formatNumber(volumeFacts.dollarVolume, 2)}.`, "dollar_volume_fact");
    }
    if (volumeFacts.liquidityQuality !== "unknown") {
        pushVolumeFact(`Liquidity quality fact is ${volumeFacts.liquidityQuality}.`, `liquidity_${volumeFacts.liquidityQuality}`);
    }
    if (volumeFacts.accelerationState !== "unknown") {
        pushVolumeFact(`Volume acceleration fact is ${volumeFacts.accelerationState}.`, `volume_acceleration_${volumeFacts.accelerationState}`);
    }
    if (volumeFacts.pullbackVolumeState !== "unknown") {
        pushVolumeFact(`Pullback volume fact is ${volumeFacts.pullbackVolumeState}.`, `pullback_volume_${volumeFacts.pullbackVolumeState}`);
    }
    if (volumeFacts.breakoutVolumeState !== "unknown" && volumeFacts.breakoutVolumeState !== "not_applicable") {
        pushVolumeFact(`Breakout volume fact is ${volumeFacts.breakoutVolumeState}.`, `breakout_volume_${volumeFacts.breakoutVolumeState}`);
    }
}
function addShelfFacts(params) {
    const nearbyShelves = params.shelves.filter((shelf) => shelfIsNearLevel(params.level, shelf, params.thresholdPct));
    if (nearbyShelves.length === 0) {
        return;
    }
    addUnique(params.warnings, "Volume shelves are facts-only context and were not converted into support or resistance levels.");
    for (const shelf of nearbyShelves) {
        const relation = shelfOverlapsLevel(params.level, shelf) ? "overlaps" : "is near";
        const fact = `Level ${relation} volume shelf ${shelf.id} (${formatNumber(shelf.zoneLow)}-${formatNumber(shelf.zoneHigh)}, ${formatNumber(shelf.percentOfWindowVolume)}% of window volume, role ${shelf.shelfRole}).`;
        addUnique(params.nearbyShelfFacts, fact);
        addUnique(params.facts, fact);
        addUnique(params.confluences, `Volume shelf ${shelf.id} is facts-only context near this level.`);
        addUnique(params.contextTags, "near_volume_shelf");
        addUnique(params.contextTags, `volume_shelf_role_${shelf.shelfRole}`);
    }
}
function addMarketContextFacts(params) {
    const { marketContext, facts, warnings, contextTags } = params;
    if (!marketContext) {
        return;
    }
    addUnique(facts, `Market context fact is ${marketContext.primaryContext} with confidence ${formatNumber(marketContext.confidence, 3)}.`);
    addUnique(facts, `Runner phase fact is ${marketContext.runnerPhase}.`);
    addUnique(contextTags, `market_context_${marketContext.primaryContext}`);
    addUnique(contextTags, `runner_phase_${marketContext.runnerPhase}`);
    if (marketContext.primaryContext === "choppy_low_quality") {
        addUnique(warnings, "Supplied market context is choppy_low_quality; this is context only.");
    }
    if (marketContext.primaryContext === "parabolic_extension") {
        addUnique(warnings, "Supplied market context is parabolic_extension; this is context only.");
    }
}
function addEnrichedAnalysisFacts(params) {
    const analysis = params.level.enrichedAnalysis;
    if (!analysis) {
        return;
    }
    addUnique(params.facts, `enrichedAnalysis state is ${analysis.state} with confidence ${formatNumber(analysis.confidence, 3)}.`);
    addUnique(params.confluences, "enrichedAnalysis is available as shadow metadata.");
    addUnique(params.contextTags, `enriched_state_${analysis.state}`);
    addUnique(params.contextTags, "enriched_analysis_available");
}
function buildExplanation(level, facts, contextTags) {
    if (facts.length === 0) {
        return `Facts-only context for ${level.kind} level ${formatNumber(level.representativePrice)} has no supplied nearby market facts.`;
    }
    const summaryTags = contextTags.slice(0, 5).join(", ");
    return `Facts-only context for ${level.kind} level ${formatNumber(level.representativePrice)} includes ${facts.length} fact(s): ${summaryTags}.`;
}
export function explainLevelContext(request) {
    const { level } = request;
    const thresholdPct = Math.max(0, request.proximityThresholdPct ?? DEFAULT_PROXIMITY_THRESHOLD_PCT);
    const sessionFacts = resolveSessionFacts(request);
    const volumeFacts = resolveVolumeFacts(request);
    const volumeShelves = resolveVolumeShelves(request);
    const currentPrice = resolveCurrentPrice(request, sessionFacts);
    const facts = [];
    const confluences = [];
    const warnings = [];
    const nearbySessionFacts = [];
    const nearbyVolumeFacts = [];
    const nearbyShelfFacts = [];
    const contextTags = [];
    pushSessionPriceFact({
        level,
        label: "high of day",
        tag: "near_high_of_day",
        price: sessionFacts?.highOfDay,
        thresholdPct,
        facts,
        confluences,
        nearbySessionFacts,
        contextTags,
    });
    pushSessionPriceFact({
        level,
        label: "low of day",
        tag: "near_low_of_day",
        price: sessionFacts?.lowOfDay,
        thresholdPct,
        facts,
        confluences,
        nearbySessionFacts,
        contextTags,
    });
    pushSessionPriceFact({
        level,
        label: "premarket high",
        tag: "near_premarket_high",
        price: sessionFacts?.premarketHigh,
        thresholdPct,
        facts,
        confluences,
        nearbySessionFacts,
        contextTags,
    });
    pushSessionPriceFact({
        level,
        label: "premarket low",
        tag: "near_premarket_low",
        price: sessionFacts?.premarketLow,
        thresholdPct,
        facts,
        confluences,
        nearbySessionFacts,
        contextTags,
    });
    pushSessionPriceFact({
        level,
        label: "opening range high",
        tag: "near_opening_range_high",
        price: sessionFacts?.openingRangeHigh,
        thresholdPct,
        facts,
        confluences,
        nearbySessionFacts,
        contextTags,
    });
    pushSessionPriceFact({
        level,
        label: "opening range low",
        tag: "near_opening_range_low",
        price: sessionFacts?.openingRangeLow,
        thresholdPct,
        facts,
        confluences,
        nearbySessionFacts,
        contextTags,
    });
    pushSessionPriceFact({
        level,
        label: "VWAP fact",
        tag: "near_vwap_fact",
        price: sessionFacts?.vwap,
        thresholdPct,
        facts,
        confluences,
        nearbySessionFacts,
        contextTags,
    });
    if (isUsableNumber(sessionFacts?.vwap)) {
        addUnique(warnings, "VWAP is facts-only context and did not change level selection or scoring.");
    }
    pushSessionPriceFact({
        level,
        label: "current/reference price",
        tag: "near_current_price",
        price: currentPrice,
        thresholdPct,
        facts,
        confluences,
        nearbySessionFacts,
        contextTags,
    });
    addVolumeFacts({ volumeFacts, facts, nearbyVolumeFacts, contextTags });
    addShelfFacts({
        level,
        shelves: volumeShelves,
        thresholdPct,
        facts,
        confluences,
        warnings,
        nearbyShelfFacts,
        contextTags,
    });
    addMarketContextFacts({
        marketContext: request.marketContext,
        facts,
        warnings,
        contextTags,
    });
    addEnrichedAnalysisFacts({ level, facts, confluences, contextTags });
    if (level.isExtension) {
        addUnique(facts, "Level is an extension level from the supplied runtime ladder.");
        addUnique(contextTags, "extension_level");
    }
    if (level.extensionMetadata?.extensionSource === "synthetic_continuation_map") {
        addUnique(facts, "Synthetic continuation-map extension for forward planning; not historical support/resistance.");
        addUnique(warnings, "Synthetic continuation-map level has limited evidence and no historical touch/rejection history.");
        addUnique(contextTags, "synthetic_continuation_map");
        addUnique(contextTags, "forward_planning_extension");
    }
    return {
        levelId: level.id,
        symbol: level.symbol,
        kind: level.kind,
        representativePrice: level.representativePrice,
        explanation: buildExplanation(level, facts, contextTags),
        facts,
        confluences,
        warnings,
        nearbySessionFacts,
        nearbyVolumeFacts,
        nearbyShelfFacts,
        contextTags,
    };
}
