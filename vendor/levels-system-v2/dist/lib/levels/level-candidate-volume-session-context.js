const SCHEMA_VERSION = "level-candidate-volume-session-context/v1";
const STAGES = [
    "raw",
    "clustered",
    "scored",
    "surfaced",
    "extension_candidate",
    "extension_selected",
];
const SIDES = ["support", "resistance"];
const SESSION_FACTS = [
    "vwap",
    "premarket_high",
    "premarket_low",
    "opening_range_high",
    "opening_range_low",
    "high_of_day",
    "low_of_day",
    "previous_close",
    "regular_session_open",
];
const SESSION_FACT_RELATIONS = [
    "overlaps",
    "near",
    "outside_threshold",
];
const SHELF_RELATIONS = ["overlaps", "near"];
const SHELF_ROLES = [
    "unknown",
    "support",
    "resistance",
    "chop_zone",
    "magnet",
];
const COMPARISON_OUTCOMES = [
    "surfaced_has_more_session_volume_context",
    "unsurfaced_has_more_session_volume_context",
    "similar_session_volume_context",
    "missing_facts_inconclusive",
    "candidate_identifier_unavailable",
    "no_nearby_session_volume_context",
];
const FACTUAL_ONLY_BLOCKED_PATTERNS = [
    ["buy", /\bbuy\b/i],
    ["sell", /\bsell\b/i],
    ["hold", /\bhold\b/i],
    ["recommendation", /\brecommendation\b/i],
    ["advice", /\badvice\b|\btrade\s+advice\b/i],
    ["grade", /\bgrade\b|\bgrading\b/i],
    ["coaching", /\bcoaching\b|\bcoach\b/i],
    ["p/l", /\bp\/l\b|\bpnl\b/i],
    ["giveback", /\bgiveback\b/i],
    ["behavior score", /\bbehavior score\b|\bbehavior scoring\b/i],
    ["good trade", /\bgood trade\b/i],
    ["bad trade", /\bbad trade\b/i],
    ["should have", /\bshould have\b/i],
    ["should enter", /\bshould\s+enter\b/i],
    ["should exit", /\bshould\s+exit\b/i],
    ["should add", /\bshould\s+add\b/i],
    ["should trim", /\bshould\s+trim\b/i],
    ["mistake", /\bmistake\b/i],
    ["discipline", /\bdiscipline\b/i],
];
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
}
function isNonNegativeNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function isPositiveNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function isStage(value) {
    return typeof value === "string" && STAGES.includes(value);
}
function isSide(value) {
    return typeof value === "string" && SIDES.includes(value);
}
function isSessionFact(value) {
    return typeof value === "string" && SESSION_FACTS.includes(value);
}
function isSessionFactRelation(value) {
    return typeof value === "string" && SESSION_FACT_RELATIONS.includes(value);
}
function isShelfRelation(value) {
    return typeof value === "string" && SHELF_RELATIONS.includes(value);
}
function isShelfRole(value) {
    return typeof value === "string" && SHELF_ROLES.includes(value);
}
function isComparisonOutcome(value) {
    return typeof value === "string" && COMPARISON_OUTCOMES.includes(value);
}
function validateOptionalString(errors, value, key, label) {
    if (value[key] !== undefined && typeof value[key] !== "string") {
        errors.push(`${label}.${key} must be a string when present`);
    }
}
function validateOptionalNonNegativeNumber(errors, value, key, label) {
    if (value[key] !== undefined && !isNonNegativeNumber(value[key])) {
        errors.push(`${label}.${key} must be a non-negative finite number when present`);
    }
}
function validateOptionalPositiveNumber(errors, value, key, label) {
    if (value[key] !== undefined && !isPositiveNumber(value[key])) {
        errors.push(`${label}.${key} must be a positive finite number when present`);
    }
}
function validateSessionFactProximity(errors, value, label, expectedFact) {
    if (!isRecord(value)) {
        errors.push(`${label} must be an object`);
        return;
    }
    if (!isSessionFact(value.fact)) {
        errors.push(`${label}.fact must be a known session fact`);
    }
    else if (expectedFact !== undefined && value.fact !== expectedFact) {
        errors.push(`${label}.fact must equal ${expectedFact}`);
    }
    if (!isPositiveNumber(value.price)) {
        errors.push(`${label}.price must be a positive finite number`);
    }
    if (!isNonNegativeNumber(value.distancePct)) {
        errors.push(`${label}.distancePct must be a non-negative finite number`);
    }
    if (!isSessionFactRelation(value.relation)) {
        errors.push(`${label}.relation must be known`);
    }
    if (value.factsOnly !== true) {
        errors.push(`${label}.factsOnly must be true`);
    }
}
function validateSession(errors, value, label) {
    if (!isRecord(value)) {
        errors.push(`${label} must be an object`);
        return;
    }
    if (!Array.isArray(value.nearbyFacts)) {
        errors.push(`${label}.nearbyFacts must be an array`);
    }
    else {
        value.nearbyFacts.forEach((fact, index) => validateSessionFactProximity(errors, fact, `${label}.nearbyFacts[${index}]`));
    }
    if (value.vwap !== undefined) {
        validateSessionFactProximity(errors, value.vwap, `${label}.vwap`, "vwap");
    }
    if (!isStringArray(value.diagnostics)) {
        errors.push(`${label}.diagnostics must be an array of strings`);
    }
}
function validateVolume(errors, value, label) {
    if (!isRecord(value)) {
        errors.push(`${label} must be an object`);
        return;
    }
    validateOptionalNonNegativeNumber(errors, value, "relativeVolume", label);
    validateOptionalNonNegativeNumber(errors, value, "dollarVolume", label);
    for (const key of [
        "volumeState",
        "liquidityQuality",
        "accelerationState",
        "pullbackVolumeState",
        "breakoutVolumeState",
    ]) {
        validateOptionalString(errors, value, key, label);
    }
    if (!isStringArray(value.diagnostics)) {
        errors.push(`${label}.diagnostics must be an array of strings`);
    }
}
function validateShelfOverlap(errors, value, label) {
    if (!isRecord(value)) {
        errors.push(`${label} must be an object`);
        return;
    }
    if (!isNonEmptyString(value.shelfId)) {
        errors.push(`${label}.shelfId must be a non-empty string`);
    }
    for (const key of ["zoneLow", "zoneHigh", "representativePrice"]) {
        if (!isPositiveNumber(value[key])) {
            errors.push(`${label}.${key} must be a positive finite number`);
        }
    }
    if (isPositiveNumber(value.zoneLow) && isPositiveNumber(value.zoneHigh) && value.zoneLow > value.zoneHigh) {
        errors.push(`${label}.zoneLow cannot exceed zoneHigh`);
    }
    if (!isShelfRelation(value.relation)) {
        errors.push(`${label}.relation must be known`);
    }
    if (!isShelfRole(value.shelfRole)) {
        errors.push(`${label}.shelfRole must be known`);
    }
    validateOptionalNonNegativeNumber(errors, value, "totalVolume", label);
    validateOptionalNonNegativeNumber(errors, value, "dollarVolume", label);
    validateOptionalNonNegativeNumber(errors, value, "percentOfWindowVolume", label);
    if (value.factsOnly !== true) {
        errors.push(`${label}.factsOnly must be true`);
    }
}
function validateShelves(errors, value, label) {
    if (!isRecord(value)) {
        errors.push(`${label} must be an object`);
        return;
    }
    if (!isStringArray(value.nearbyShelfIds)) {
        errors.push(`${label}.nearbyShelfIds must be an array of strings`);
    }
    if (!Array.isArray(value.overlaps)) {
        errors.push(`${label}.overlaps must be an array`);
    }
    else {
        value.overlaps.forEach((overlap, index) => validateShelfOverlap(errors, overlap, `${label}.overlaps[${index}]`));
    }
    if (!isStringArray(value.diagnostics)) {
        errors.push(`${label}.diagnostics must be an array of strings`);
    }
}
function validateRowSafety(errors, value, label) {
    if (!isRecord(value)) {
        errors.push(`${label} must be an object`);
        return;
    }
    for (const key of [
        "factsOnly",
        "noLevelSelectionChange",
        "noRankingChange",
        "noRuntimeBehaviorChange",
        "vwapFactsOnly",
        "shelvesAreFactsOnly",
    ]) {
        if (value[key] !== true) {
            errors.push(`${label}.${key} must be true`);
        }
    }
}
function validateRootSafety(errors, value) {
    if (!isRecord(value)) {
        errors.push("safety must be an object");
        return;
    }
    for (const key of [
        "factsOnly",
        "noLevelSelectionChange",
        "noRankingChange",
        "noRuntimeBehaviorChange",
        "vwapFactsOnly",
        "shelvesAreFactsOnly",
    ]) {
        if (value[key] !== true) {
            errors.push(`safety.${key} must be true`);
        }
    }
    for (const key of [
        "fifteenMinuteFedIntoLevelEngine",
        "volumeSessionFactsUsedForScoringOrSurfacedSelection",
        "supportResistanceDetectionChanged",
        "levelEngineScoringRankingClusteringChanged",
        "surfacedLevelsChanged",
        "extensionGenerationChanged",
        "providerCallsMade",
        "cacheFilesWritten",
        "rawCandlesIncluded",
        "fullSnapshotsIncluded",
    ]) {
        if (value[key] !== false) {
            errors.push(`safety.${key} must be false`);
        }
    }
}
function validateRow(errors, value, index) {
    const label = `contexts[${index}]`;
    if (!isRecord(value)) {
        errors.push(`${label} must be an object`);
        return;
    }
    if (!isNonEmptyString(value.rowId)) {
        errors.push(`${label}.rowId must be a non-empty string`);
    }
    validateOptionalString(errors, value, "levelId", label);
    validateOptionalString(errors, value, "candidateId", label);
    if (!isSide(value.side)) {
        errors.push(`${label}.side must be support or resistance`);
    }
    if (!isStage(value.stage)) {
        errors.push(`${label}.stage must be known`);
    }
    if (!isPositiveNumber(value.price)) {
        errors.push(`${label}.price must be a positive finite number`);
    }
    validateOptionalPositiveNumber(errors, value, "zoneLow", label);
    validateOptionalPositiveNumber(errors, value, "zoneHigh", label);
    if (isPositiveNumber(value.zoneLow) && isPositiveNumber(value.zoneHigh) && value.zoneLow > value.zoneHigh) {
        errors.push(`${label}.zoneLow cannot exceed zoneHigh`);
    }
    validateOptionalNonNegativeNumber(errors, value, "distanceFromReferencePct", label);
    validateSession(errors, value.session, `${label}.session`);
    validateVolume(errors, value.volume, `${label}.volume`);
    validateShelves(errors, value.shelves, `${label}.shelves`);
    if (!isStringArray(value.diagnostics)) {
        errors.push(`${label}.diagnostics must be an array of strings`);
    }
    validateRowSafety(errors, value.safety, `${label}.safety`);
}
function validateComparisonSummary(errors, value, rowIds) {
    if (!isRecord(value)) {
        errors.push("comparisonSummary must be an object");
        return;
    }
    if (!isComparisonOutcome(value.outcome)) {
        errors.push("comparisonSummary.outcome must be known");
    }
    for (const side of SIDES) {
        if (value[side] !== undefined && !isComparisonOutcome(value[side])) {
            errors.push(`comparisonSummary.${side} must be a known outcome when present`);
        }
    }
    for (const key of ["comparedRowIds", "surfacedRowIds", "unsurfacedRowIds"]) {
        if (!isStringArray(value[key])) {
            errors.push(`comparisonSummary.${key} must be an array of strings`);
            continue;
        }
        for (const rowId of value[key]) {
            if (!rowIds.has(rowId)) {
                errors.push(`comparisonSummary.${key} contains unknown rowId ${rowId}`);
            }
        }
    }
    if (!isStringArray(value.diagnostics)) {
        errors.push("comparisonSummary.diagnostics must be an array of strings");
    }
}
export function validateLevelCandidateVolumeSessionContext(value) {
    const errors = [];
    if (!isRecord(value)) {
        return {
            valid: false,
            errors: ["context must be an object"],
        };
    }
    if (value.schemaVersion !== SCHEMA_VERSION) {
        errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
    }
    if (!isNonEmptyString(value.symbol)) {
        errors.push("symbol must be a non-empty string");
    }
    if (!isNonEmptyString(value.provider)) {
        errors.push("provider must be a non-empty string");
    }
    if (!isNonNegativeNumber(value.asOfTimestamp)) {
        errors.push("asOfTimestamp must be a non-negative finite number");
    }
    validateOptionalString(errors, value, "asOfIso", "context");
    validateOptionalPositiveNumber(errors, value, "referencePrice", "context");
    const rowIds = new Set();
    if (!Array.isArray(value.contexts)) {
        errors.push("contexts must be an array");
    }
    else {
        value.contexts.forEach((row, index) => {
            if (isRecord(row) && isNonEmptyString(row.rowId)) {
                if (rowIds.has(row.rowId)) {
                    errors.push(`contexts[${index}].rowId must be unique`);
                }
                rowIds.add(row.rowId);
            }
            validateRow(errors, row, index);
        });
    }
    validateComparisonSummary(errors, value.comparisonSummary, rowIds);
    if (!isStringArray(value.diagnostics)) {
        errors.push("diagnostics must be an array of strings");
    }
    validateRootSafety(errors, value.safety);
    return {
        valid: errors.length === 0,
        errors,
    };
}
export function isLevelCandidateVolumeSessionContext(value) {
    return validateLevelCandidateVolumeSessionContext(value).valid;
}
export function assertLevelCandidateVolumeSessionContextFactsOnly(value) {
    const validation = validateLevelCandidateVolumeSessionContext(value);
    if (!validation.valid) {
        throw new Error(`Invalid level candidate volume session context: ${validation.errors.join("; ")}`);
    }
    const text = JSON.stringify(value);
    const hits = FACTUAL_ONLY_BLOCKED_PATTERNS
        .filter(([, pattern]) => pattern.test(text))
        .map(([label]) => label);
    if (hits.length > 0) {
        throw new Error(`Candidate volume session context contains non-factual wording: ${hits.join(", ")}`);
    }
}
