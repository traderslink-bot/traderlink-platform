export const FIFTEEN_MINUTE_FACTS_SCHEMA_VERSION = "level-analysis-15m-facts/v1";
const FACT_ONLY_PROHIBITED_PATTERNS = [
    ["recommendation", /\brecommendation\b/i],
    ["coaching", /\bcoaching\b/i],
    ["coach", /\bcoach\b/i],
    ["grading", /\bgrading\b/i],
    ["grade", /\bgrade\b/i],
    ["p/l", /\bp\/l\b/i],
    ["pnl", /\bpnl\b/i],
    ["giveback", /\bgiveback\b/i],
    ["behavior score", /\bbehavior score\b/i],
    ["behavior scoring", /\bbehavior scoring\b/i],
    ["trade advice", /\btrade advice\b/i],
    ["entry decision", /\bentry decision\b/i],
    ["exit decision", /\bexit decision\b/i],
    ["buy", /\bbuy\b/i],
    ["sell", /\bsell\b/i],
    ["hold", /\bhold\b/i],
    ["good trade", /\bgood trade\b/i],
    ["bad trade", /\bbad trade\b/i],
    ["should have", /\bshould have\b/i],
];
const LEVEL_CREATION_FIELD_NAMES = new Set([
    "supportLevels",
    "resistanceLevels",
    "generatedLevels",
    "candidateLevels",
    "levelCandidates",
    "levelEngineOutput",
    "majorSupport",
    "majorResistance",
    "intermediateSupport",
    "intermediateResistance",
    "intradaySupport",
    "intradayResistance",
    "extensionLevels",
]);
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeSymbol(symbol) {
    return symbol.trim().toUpperCase();
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function requireObject(value, label, errors) {
    if (!isRecord(value)) {
        errors.push(`${label} must be an object.`);
        return undefined;
    }
    return value;
}
function requireNumberField(value, field, label, errors) {
    if (!isFiniteNumber(value[field])) {
        errors.push(`${label}.${field} must be a finite number.`);
    }
}
function requireBooleanField(value, field, label, errors) {
    if (typeof value[field] !== "boolean") {
        errors.push(`${label}.${field} must be a boolean.`);
    }
}
function requireStringField(value, field, label, errors) {
    if (typeof value[field] !== "string" || value[field].trim().length === 0) {
        errors.push(`${label}.${field} must be a non-empty string.`);
    }
}
function collectFactsOnlyBoundaryIssues(value) {
    const issues = [];
    const seen = new Set();
    function visit(item, path) {
        if (item === null || item === undefined) {
            return;
        }
        if (typeof item === "string") {
            for (const [label, pattern] of FACT_ONLY_PROHIBITED_PATTERNS) {
                if (pattern.test(item)) {
                    issues.push(`${path || "value"} contains ${label} language.`);
                }
            }
            return;
        }
        if (typeof item !== "object") {
            return;
        }
        if (seen.has(item)) {
            return;
        }
        seen.add(item);
        if (Array.isArray(item)) {
            item.forEach((entry, index) => visit(entry, `${path}[${index}]`));
            return;
        }
        for (const [key, entry] of Object.entries(item)) {
            const nextPath = path ? `${path}.${key}` : key;
            if (LEVEL_CREATION_FIELD_NAMES.has(key)) {
                issues.push(`${nextPath} is a level-generation field and is not allowed in 15m facts.`);
            }
            for (const [label, pattern] of FACT_ONLY_PROHIBITED_PATTERNS) {
                if (pattern.test(key)) {
                    issues.push(`${nextPath} uses ${label} field language.`);
                }
            }
            visit(entry, nextPath);
        }
    }
    visit(value, "");
    return issues;
}
export function assertFifteenMinuteFactsAreFactsOnly(value) {
    const issues = collectFactsOnlyBoundaryIssues(value);
    if (issues.length > 0) {
        throw new Error(`15m facts must remain facts-only: ${issues.join(" ")}`);
    }
}
export function validateFifteenMinuteFacts(value) {
    const errors = [];
    const facts = requireObject(value, "FifteenMinuteFacts", errors);
    if (!facts) {
        return { valid: false, errors };
    }
    if (facts.schemaVersion !== FIFTEEN_MINUTE_FACTS_SCHEMA_VERSION) {
        errors.push(`schemaVersion must be ${FIFTEEN_MINUTE_FACTS_SCHEMA_VERSION}.`);
    }
    requireStringField(facts, "symbol", "FifteenMinuteFacts", errors);
    requireNumberField(facts, "asOfTimestamp", "FifteenMinuteFacts", errors);
    const dataCompleteness = requireObject(facts.dataCompleteness, "dataCompleteness", errors);
    if (dataCompleteness) {
        requireStringField(dataCompleteness, "availabilityStatus", "dataCompleteness", errors);
        requireBooleanField(dataCompleteness, "provided", "dataCompleteness", errors);
        for (const field of [
            "rawCandleCount",
            "closedCandleCount",
            "excludedFutureCandleCount",
            "excludedPartialCandleCount",
        ]) {
            requireNumberField(dataCompleteness, field, "dataCompleteness", errors);
        }
        requireBooleanField(dataCompleteness, "sufficientForTrendFacts", "dataCompleteness", errors);
        requireBooleanField(dataCompleteness, "sufficientForVolumeFacts", "dataCompleteness", errors);
    }
    const range = requireObject(facts.range, "range", errors);
    if (range) {
        requireNumberField(range, "lookbackCandleCount", "range", errors);
        requireStringField(range, "rangeState", "range", errors);
        requireStringField(range, "referencePosition", "range", errors);
    }
    const trend = requireObject(facts.trend, "trend", errors);
    if (trend) {
        requireStringField(trend, "trendState", "trend", errors);
        for (const field of ["higherCloseCount", "lowerCloseCount", "greenCandleCount", "redCandleCount"]) {
            requireNumberField(trend, field, "trend", errors);
        }
        requireStringField(trend, "latestCloseLocation", "trend", errors);
    }
    if (facts.volume !== undefined) {
        const volume = requireObject(facts.volume, "volume", errors);
        if (volume) {
            requireStringField(volume, "volumeState", "volume", errors);
            requireStringField(volume, "participationState", "volume", errors);
        }
    }
    const structure = requireObject(facts.structure, "structure", errors);
    if (structure) {
        requireStringField(structure, "consolidationState", "structure", errors);
        requireStringField(structure, "pullbackState", "structure", errors);
        requireStringField(structure, "continuationState", "structure", errors);
    }
    if (!Array.isArray(facts.diagnostics)) {
        errors.push("diagnostics must be an array.");
    }
    if (!Array.isArray(facts.limitations)) {
        errors.push("limitations must be an array.");
    }
    const safety = requireObject(facts.safety, "safety", errors);
    if (safety) {
        for (const field of ["noLookaheadApplied", "levelOutputUnchanged", "factsOnly", "noRuntimeBehaviorChange"]) {
            requireBooleanField(safety, field, "safety", errors);
            if (safety[field] !== true) {
                errors.push(`safety.${field} must be true.`);
            }
        }
    }
    errors.push(...collectFactsOnlyBoundaryIssues(facts));
    return {
        valid: errors.length === 0,
        errors,
    };
}
export function isFifteenMinuteFacts(value) {
    return validateFifteenMinuteFacts(value).valid;
}
export function createUnavailableFifteenMinuteFacts(input) {
    return {
        schemaVersion: FIFTEEN_MINUTE_FACTS_SCHEMA_VERSION,
        symbol: normalizeSymbol(input.symbol),
        asOfTimestamp: input.asOfTimestamp,
        dataCompleteness: {
            availabilityStatus: "unavailable",
            provided: false,
            rawCandleCount: input.rawCandleCount ?? 0,
            closedCandleCount: 0,
            excludedFutureCandleCount: input.excludedFutureCandleCount ?? 0,
            excludedPartialCandleCount: input.excludedPartialCandleCount ?? 0,
            sufficientForTrendFacts: false,
            sufficientForVolumeFacts: false,
        },
        range: {
            lookbackCandleCount: 0,
            rangeState: "unknown",
            referencePosition: "unknown",
        },
        trend: {
            trendState: "unknown",
            higherCloseCount: 0,
            lowerCloseCount: 0,
            greenCandleCount: 0,
            redCandleCount: 0,
            latestCloseLocation: "unknown",
        },
        structure: {
            consolidationState: "unknown",
            pullbackState: "unknown",
            continuationState: "unknown",
        },
        diagnostics: input.diagnostics ?? [
            {
                code: "15m_facts_unavailable",
                severity: "info",
                message: "No closed 15m facts are available for this snapshot.",
            },
        ],
        limitations: input.limitations ?? ["15m_input_not_provided", "15m_facts_contract_only"],
        safety: {
            noLookaheadApplied: true,
            levelOutputUnchanged: true,
            factsOnly: true,
            noRuntimeBehaviorChange: true,
        },
    };
}
export function summarizeFifteenMinuteFacts(value) {
    return {
        schemaVersion: value.schemaVersion,
        symbol: value.symbol,
        asOfTimestamp: value.asOfTimestamp,
        availabilityStatus: value.dataCompleteness.availabilityStatus,
        closedCandleCount: value.dataCompleteness.closedCandleCount,
        rangeState: value.range.rangeState,
        trendState: value.trend.trendState,
        volumeState: value.volume?.volumeState ?? "unknown",
        limitationCount: value.limitations.length,
        diagnosticCount: value.diagnostics.length,
        noLookaheadApplied: value.safety.noLookaheadApplied,
        levelOutputUnchanged: value.safety.levelOutputUnchanged,
        factsOnly: value.safety.factsOnly,
        noRuntimeBehaviorChange: value.safety.noRuntimeBehaviorChange,
    };
}
