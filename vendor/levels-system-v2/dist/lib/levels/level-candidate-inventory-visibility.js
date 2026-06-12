const STAGES = [
    "raw",
    "clustered",
    "scored",
    "surfaced",
    "extension_candidate",
    "extension_selected",
];
const SIDES = ["support", "resistance"];
const CLASSIFICATIONS = [
    "no_gap",
    "closer_unsurfaced_candidate",
    "truthful_market_context_gap",
    "inconclusive_missing_reasons",
];
const REASON_AVAILABILITY = [
    "available",
    "not_available",
    "not_needed",
];
const FACTUAL_ONLY_BLOCKED_PATTERNS = [
    ["buy", /\bbuy\b/i],
    ["sell", /\bsell\b/i],
    ["hold", /\bhold\b/i],
    ["recommendation", /\brecommendation\b/i],
    ["trade advice", /\btrade\s+advice\b/i],
    ["grade", /\bgrade\b|\bgrading\b/i],
    ["coaching", /\bcoaching\b|\bcoach\b/i],
    ["p/l", /\bp\/l\b|\bpnl\b/i],
    ["giveback", /\bgiveback\b/i],
    ["behavior score", /\bbehavior score\b|\bbehavior scoring\b/i],
    ["good trade", /\bgood trade\b/i],
    ["bad trade", /\bbad trade\b/i],
    ["should have", /\bshould have\b/i],
    ["mistake", /\bmistake\b/i],
    ["discipline", /\bdiscipline\b/i],
];
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonNegativeNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isStage(value) {
    return typeof value === "string" && STAGES.includes(value);
}
function isSide(value) {
    return typeof value === "string" && SIDES.includes(value);
}
function isClassification(value) {
    return typeof value === "string" && CLASSIFICATIONS.includes(value);
}
function validateOptionalNumber(errors, value, key, label) {
    if (value[key] !== undefined && !isNonNegativeNumber(value[key])) {
        errors.push(`${label}.${key} must be a non-negative finite number when present`);
    }
}
function validateOptionalString(errors, value, key, label) {
    if (value[key] !== undefined && typeof value[key] !== "string") {
        errors.push(`${label}.${key} must be a string when present`);
    }
}
function validateStringNumberRecord(errors, value, label) {
    if (value === undefined) {
        return;
    }
    if (!isRecord(value)) {
        errors.push(`${label} must be an object when present`);
        return;
    }
    for (const [key, count] of Object.entries(value)) {
        if (key.trim() === "") {
            errors.push(`${label} keys must be non-empty strings`);
        }
        if (!isNonNegativeNumber(count)) {
            errors.push(`${label}.${key} must be a non-negative finite number`);
        }
    }
}
function validateStageSummary(errors, value, stage) {
    if (!isRecord(value)) {
        errors.push(`stageCounts.${stage} must be an object`);
        return;
    }
    if (value.stage !== stage) {
        errors.push(`stageCounts.${stage}.stage must equal ${stage}`);
    }
    for (const key of ["support", "resistance", "total"]) {
        if (!isNonNegativeNumber(value[key])) {
            errors.push(`stageCounts.${stage}.${key} must be a non-negative finite number`);
        }
    }
    if (isNonNegativeNumber(value.support) &&
        isNonNegativeNumber(value.resistance) &&
        isNonNegativeNumber(value.total) &&
        value.support + value.resistance !== value.total) {
        errors.push(`stageCounts.${stage}.total must equal support plus resistance`);
    }
    validateStringNumberRecord(errors, value.byTimeframe, `stageCounts.${stage}.byTimeframe`);
    validateStringNumberRecord(errors, value.bySourceType, `stageCounts.${stage}.bySourceType`);
}
function validateNearest(errors, value, label, expectedStage, expectedSide) {
    if (value === undefined) {
        return;
    }
    if (!isRecord(value)) {
        errors.push(`${label} must be an object when present`);
        return;
    }
    if (value.stage !== expectedStage) {
        errors.push(`${label}.stage must equal ${expectedStage}`);
    }
    if (value.side !== expectedSide) {
        errors.push(`${label}.side must equal ${expectedSide}`);
    }
    validateOptionalNumber(errors, value, "price", label);
    validateOptionalNumber(errors, value, "distancePct", label);
    validateOptionalString(errors, value, "levelId", label);
    validateOptionalString(errors, value, "bucket", label);
    validateOptionalString(errors, value, "timeframeBias", label);
    if (value.surfaced !== undefined && typeof value.surfaced !== "boolean") {
        errors.push(`${label}.surfaced must be boolean when present`);
    }
    if (value.sourceTypes !== undefined && !isStringArray(value.sourceTypes)) {
        errors.push(`${label}.sourceTypes must be an array of strings when present`);
    }
}
function validateUnsurfacedCloser(errors, value, side) {
    const label = `unsurfacedCloser.${side}`;
    if (!isRecord(value)) {
        errors.push(`${label} must be an object`);
        return;
    }
    if (value.side !== side) {
        errors.push(`${label}.side must equal ${side}`);
    }
    if (typeof value.present !== "boolean") {
        errors.push(`${label}.present must be boolean`);
    }
    if (!isNonNegativeNumber(value.count)) {
        errors.push(`${label}.count must be a non-negative finite number`);
    }
    if (!REASON_AVAILABILITY.includes(value.reasonAvailability)) {
        errors.push(`${label}.reasonAvailability must be known`);
    }
    if (!isStringArray(value.reasons)) {
        errors.push(`${label}.reasons must be an array of strings`);
    }
    if (!isStringArray(value.limitations)) {
        errors.push(`${label}.limitations must be an array of strings`);
    }
    if (value.present === true && value.count === 0) {
        errors.push(`${label}.count must be positive when present is true`);
    }
    if (value.present === false && value.count !== 0) {
        errors.push(`${label}.count must be zero when present is false`);
    }
    if (value.present === true) {
        validateNearest(errors, value.nearest, `${label}.nearest`, "scored", side);
    }
}
function expectedOverall(params) {
    if (params.support === "inconclusive_missing_reasons" || params.resistance === "inconclusive_missing_reasons") {
        return "inconclusive_missing_reasons";
    }
    if (params.support === "closer_unsurfaced_candidate" || params.resistance === "closer_unsurfaced_candidate") {
        return "closer_unsurfaced_candidate";
    }
    if (params.support === "truthful_market_context_gap" || params.resistance === "truthful_market_context_gap") {
        return "truthful_market_context_gap";
    }
    return "no_gap";
}
function validateGapClassification(errors, value) {
    if (!isRecord(value)) {
        errors.push("gapClassification must be an object");
        return;
    }
    if (!isClassification(value.support)) {
        errors.push("gapClassification.support must be known");
    }
    if (!isClassification(value.resistance)) {
        errors.push("gapClassification.resistance must be known");
    }
    if (!isClassification(value.overall)) {
        errors.push("gapClassification.overall must be known");
    }
    if (isClassification(value.support) && isClassification(value.resistance) && isClassification(value.overall)) {
        const expected = expectedOverall({
            support: value.support,
            resistance: value.resistance,
        });
        if (value.overall !== expected) {
            errors.push(`gapClassification.overall must be ${expected}`);
        }
    }
}
function validateSafety(errors, value) {
    if (!isRecord(value)) {
        errors.push("safety must be an object");
        return;
    }
    for (const key of ["readOnly", "auditOnly"]) {
        if (value[key] !== true) {
            errors.push(`safety.${key} must be true`);
        }
    }
    for (const key of [
        "providerCallsMade",
        "cacheFilesWritten",
        "rawCandlesIncluded",
        "fullSnapshotsIncluded",
        "supportResistanceDetectionChanged",
        "levelEngineScoringRankingClusteringChanged",
        "surfacedLevelsChanged",
        "extensionGenerationChanged",
        "fifteenMinuteFedIntoLevelEngine",
    ]) {
        if (value[key] !== false) {
            errors.push(`safety.${key} must be false`);
        }
    }
}
export function validateLevelCandidateInventoryVisibility(value) {
    const errors = [];
    if (!isRecord(value)) {
        return {
            valid: false,
            errors: ["visibility must be an object"],
        };
    }
    if (value.schemaVersion !== "level-candidate-inventory-visibility/v1") {
        errors.push("schemaVersion must be level-candidate-inventory-visibility/v1");
    }
    if (typeof value.symbol !== "string" || value.symbol.trim() === "") {
        errors.push("symbol must be a non-empty string");
    }
    validateOptionalString(errors, value, "provider", "visibility");
    validateOptionalNumber(errors, value, "asOfTimestamp", "visibility");
    validateOptionalString(errors, value, "asOfIso", "visibility");
    validateOptionalNumber(errors, value, "referencePrice", "visibility");
    if (!isRecord(value.sourceFiles)) {
        errors.push("sourceFiles must be an object");
    }
    else {
        for (const [timeframe, sourceFile] of Object.entries(value.sourceFiles)) {
            if (!["5m", "15m", "4h", "daily"].includes(timeframe)) {
                errors.push(`sourceFiles.${timeframe} is not a known timeframe`);
            }
            if (typeof sourceFile !== "string" || sourceFile.trim() === "") {
                errors.push(`sourceFiles.${timeframe} must be a non-empty string`);
            }
        }
    }
    if (!isRecord(value.stageCounts)) {
        errors.push("stageCounts must be an object");
    }
    else {
        for (const key of Object.keys(value.stageCounts)) {
            if (!isStage(key)) {
                errors.push(`stageCounts.${key} is not a known candidate inventory stage`);
            }
        }
        for (const stage of STAGES) {
            validateStageSummary(errors, value.stageCounts[stage], stage);
        }
    }
    if (!isRecord(value.nearest)) {
        errors.push("nearest must be an object");
    }
    else {
        for (const key of Object.keys(value.nearest)) {
            if (!isStage(key)) {
                errors.push(`nearest.${key} is not a known candidate inventory stage`);
            }
        }
        for (const stage of STAGES) {
            const stageNearest = value.nearest[stage];
            if (stageNearest === undefined) {
                errors.push(`nearest.${stage} must be present`);
                continue;
            }
            if (!isRecord(stageNearest)) {
                errors.push(`nearest.${stage} must be an object`);
                continue;
            }
            for (const side of SIDES) {
                validateNearest(errors, stageNearest[side], `nearest.${stage}.${side}`, stage, side);
            }
        }
    }
    if (!isRecord(value.unsurfacedCloser)) {
        errors.push("unsurfacedCloser must be an object");
    }
    else {
        for (const side of SIDES) {
            validateUnsurfacedCloser(errors, value.unsurfacedCloser[side], side);
        }
    }
    validateGapClassification(errors, value.gapClassification);
    if (!isStringArray(value.diagnostics)) {
        errors.push("diagnostics must be an array of strings");
    }
    if (!isStringArray(value.limitations)) {
        errors.push("limitations must be an array of strings");
    }
    validateSafety(errors, value.safety);
    if (isRecord(value.unsurfacedCloser) && isRecord(value.gapClassification)) {
        for (const side of SIDES) {
            const closer = value.unsurfacedCloser[side];
            const classification = value.gapClassification[side];
            if (isRecord(closer) && closer.present === true && classification !== "closer_unsurfaced_candidate") {
                errors.push(`gapClassification.${side} must be closer_unsurfaced_candidate when unsurfacedCloser.${side}.present is true`);
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
export function isLevelCandidateInventoryVisibility(value) {
    return validateLevelCandidateInventoryVisibility(value).valid;
}
export function summarizeLevelCandidateInventoryGaps(value) {
    return {
        support: value.gapClassification.support,
        resistance: value.gapClassification.resistance,
        overall: value.gapClassification.overall,
    };
}
export function assertLevelCandidateInventoryVisibilityFactsOnly(value) {
    const validation = validateLevelCandidateInventoryVisibility(value);
    if (!validation.valid) {
        throw new Error(`Invalid level candidate inventory visibility: ${validation.errors.join("; ")}`);
    }
    const text = JSON.stringify(value);
    const hits = FACTUAL_ONLY_BLOCKED_PATTERNS
        .filter(([, pattern]) => pattern.test(text))
        .map(([label]) => label);
    if (hits.length > 0) {
        throw new Error(`Candidate inventory visibility contains non-factual wording: ${hits.join(", ")}`);
    }
}
