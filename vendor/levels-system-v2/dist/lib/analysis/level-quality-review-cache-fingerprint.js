const FINGERPRINT_SCHEMA_VERSION = "level-quality-review-cache-fingerprint/v1";
const FINGERPRINT_SET_SCHEMA_VERSION = "level-quality-review-cache-fingerprint-set/v1";
const PROVIDERS = [
    "ibkr",
    "stub",
    "twelve_data",
];
const TIMEFRAMES = [
    "5m",
    "15m",
    "4h",
    "daily",
];
const FINGERPRINT_KEYS = new Set([
    "schemaVersion",
    "relativePath",
    "provider",
    "symbol",
    "timeframe",
    "sha256",
    "wrapperCandleCount",
    "requestLookbackBars",
    "requestEndTimestamp",
    "actualBarsReturned",
    "validationIssueCount",
    "firstCandleTimestamp",
    "lastCandleTimestamp",
    "asOfTimestamp",
    "includedInLevelEngine",
    "contextOnly",
    "safety",
]);
const FINGERPRINT_SET_KEYS = new Set([
    "schemaVersion",
    "generatedAt",
    "provider",
    "fingerprints",
]);
const SAFETY_KEYS = new Set([
    "rawCandlesIncluded",
    "rawCacheWrapperPayloadsIncluded",
    "fullSnapshotsIncluded",
    "providerCallsMade",
    "cacheFilesWritten",
    "fifteenMinuteFedIntoLevelEngine",
]);
const FORBIDDEN_PAYLOAD_KEYS = new Set([
    "candles",
    "cacheWrapper",
    "cacheWrapperPayload",
    "rawCacheWrapper",
    "rawCacheWrapperPayload",
    "response",
    "request",
    "snapshot",
    "fullSnapshot",
    "levelAnalysisSnapshot",
    "levelEngineOutput",
]);
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
function isProvider(value) {
    return typeof value === "string" && PROVIDERS.includes(value);
}
function isTimeframe(value) {
    return typeof value === "string" && TIMEFRAMES.includes(value);
}
function isNonNegativeInteger(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
function isPositiveInteger(value) {
    return typeof value === "number" && Number.isInteger(value) && value > 0;
}
function validateKnownKeys(errors, value, knownKeys, label) {
    for (const key of Object.keys(value)) {
        if (!knownKeys.has(key)) {
            errors.push(`${label}.${key} is not part of the compact cache fingerprint contract`);
        }
    }
}
function validateNoForbiddenPayloads(errors, value, path = "fingerprint") {
    if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index += 1) {
            const item = value[index];
            if (isRecord(item) &&
                "open" in item &&
                "high" in item &&
                "low" in item &&
                "close" in item &&
                "volume" in item) {
                errors.push(`${path}[${index}] looks like a raw candle and is not allowed`);
            }
            validateNoForbiddenPayloads(errors, item, `${path}[${index}]`);
        }
        return;
    }
    if (!isRecord(value)) {
        return;
    }
    for (const [key, child] of Object.entries(value)) {
        if (FORBIDDEN_PAYLOAD_KEYS.has(key)) {
            errors.push(`${path}.${key} is a raw payload field and is not allowed`);
        }
        validateNoForbiddenPayloads(errors, child, `${path}.${key}`);
    }
}
function validateRelativePath(errors, value) {
    if (typeof value !== "string" || value.trim() === "") {
        errors.push("relativePath must be a non-empty string");
        return;
    }
    if (value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) {
        errors.push("relativePath must be a portable relative path using forward slashes");
    }
    if (value.split("/").some((segment) => segment === ".." || segment.trim() === "")) {
        errors.push("relativePath must not contain empty or parent-directory segments");
    }
}
function validateOptionalTimestamp(errors, value, key) {
    if (value[key] !== undefined && !isNonNegativeInteger(value[key])) {
        errors.push(`${key} must be a non-negative integer timestamp when present`);
    }
}
function validateSafety(errors, value) {
    if (!isRecord(value)) {
        errors.push("safety must be an object");
        return;
    }
    validateKnownKeys(errors, value, SAFETY_KEYS, "safety");
    for (const key of SAFETY_KEYS) {
        if (value[key] !== false) {
            errors.push(`safety.${key} must be false`);
        }
    }
}
export function validateLevelQualityReviewCacheFingerprint(value) {
    const errors = [];
    if (!isRecord(value)) {
        return {
            valid: false,
            errors: ["fingerprint must be an object"],
        };
    }
    validateKnownKeys(errors, value, FINGERPRINT_KEYS, "fingerprint");
    validateNoForbiddenPayloads(errors, value);
    if (value.schemaVersion !== FINGERPRINT_SCHEMA_VERSION) {
        errors.push(`schemaVersion must be ${FINGERPRINT_SCHEMA_VERSION}`);
    }
    validateRelativePath(errors, value.relativePath);
    if (!isProvider(value.provider)) {
        errors.push("provider must be ibkr, stub, or twelve_data");
    }
    if (typeof value.symbol !== "string" || value.symbol.trim() === "") {
        errors.push("symbol must be a non-empty string");
    }
    if (!isTimeframe(value.timeframe)) {
        errors.push("timeframe must be 5m, 15m, 4h, or daily");
    }
    if (typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256)) {
        errors.push("sha256 must be a lowercase 64-character hexadecimal digest");
    }
    if (!isNonNegativeInteger(value.wrapperCandleCount)) {
        errors.push("wrapperCandleCount must be a non-negative integer");
    }
    if (!isPositiveInteger(value.requestLookbackBars)) {
        errors.push("requestLookbackBars must be a positive integer");
    }
    if (!isNonNegativeInteger(value.requestEndTimestamp)) {
        errors.push("requestEndTimestamp must be a non-negative integer timestamp");
    }
    if (!isNonNegativeInteger(value.actualBarsReturned)) {
        errors.push("actualBarsReturned must be a non-negative integer");
    }
    if (!isNonNegativeInteger(value.validationIssueCount)) {
        errors.push("validationIssueCount must be a non-negative integer");
    }
    validateOptionalTimestamp(errors, value, "firstCandleTimestamp");
    validateOptionalTimestamp(errors, value, "lastCandleTimestamp");
    validateOptionalTimestamp(errors, value, "asOfTimestamp");
    if (isNonNegativeInteger(value.firstCandleTimestamp) &&
        isNonNegativeInteger(value.lastCandleTimestamp) &&
        value.firstCandleTimestamp > value.lastCandleTimestamp) {
        errors.push("firstCandleTimestamp must be less than or equal to lastCandleTimestamp");
    }
    if (isNonNegativeInteger(value.wrapperCandleCount) &&
        isNonNegativeInteger(value.actualBarsReturned) &&
        value.wrapperCandleCount !== value.actualBarsReturned) {
        errors.push("wrapperCandleCount must equal actualBarsReturned");
    }
    if (value.includedInLevelEngine !== undefined && typeof value.includedInLevelEngine !== "boolean") {
        errors.push("includedInLevelEngine must be boolean when present");
    }
    if (value.contextOnly !== undefined && typeof value.contextOnly !== "boolean") {
        errors.push("contextOnly must be boolean when present");
    }
    if (value.includedInLevelEngine === true && value.contextOnly === true) {
        errors.push("includedInLevelEngine and contextOnly cannot both be true");
    }
    if (value.timeframe === "15m") {
        if (value.contextOnly !== true) {
            errors.push("15m fingerprints must be marked contextOnly true");
        }
        if (value.includedInLevelEngine !== false) {
            errors.push("15m fingerprints must be marked includedInLevelEngine false");
        }
    }
    validateSafety(errors, value.safety);
    return {
        valid: errors.length === 0,
        errors,
    };
}
export function isLevelQualityReviewCacheFingerprint(value) {
    return validateLevelQualityReviewCacheFingerprint(value).valid;
}
export function validateLevelQualityReviewCacheFingerprintSet(value) {
    const errors = [];
    if (!isRecord(value)) {
        return {
            valid: false,
            errors: ["fingerprint set must be an object"],
        };
    }
    validateKnownKeys(errors, value, FINGERPRINT_SET_KEYS, "fingerprintSet");
    validateNoForbiddenPayloads(errors, value, "fingerprintSet");
    if (value.schemaVersion !== FINGERPRINT_SET_SCHEMA_VERSION) {
        errors.push(`schemaVersion must be ${FINGERPRINT_SET_SCHEMA_VERSION}`);
    }
    if (value.generatedAt !== undefined) {
        if (typeof value.generatedAt !== "string" || !Number.isFinite(Date.parse(value.generatedAt))) {
            errors.push("generatedAt must be a valid ISO timestamp when present");
        }
    }
    if (value.provider !== undefined && !isProvider(value.provider)) {
        errors.push("provider must be ibkr, stub, or twelve_data when present");
    }
    if (!Array.isArray(value.fingerprints) || value.fingerprints.length === 0) {
        errors.push("fingerprints must be a non-empty array");
    }
    else {
        const seen = new Set();
        for (const [index, fingerprint] of value.fingerprints.entries()) {
            const validation = validateLevelQualityReviewCacheFingerprint(fingerprint);
            for (const error of validation.errors) {
                errors.push(`fingerprints[${index}].${error}`);
            }
            if (isRecord(fingerprint)) {
                const key = `${String(fingerprint.provider)}|${String(fingerprint.symbol)}|${String(fingerprint.timeframe)}|${String(fingerprint.relativePath)}`;
                if (seen.has(key)) {
                    errors.push(`fingerprints[${index}] duplicates provider symbol timeframe and relativePath`);
                }
                seen.add(key);
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
export function isLevelQualityReviewCacheFingerprintSet(value) {
    return validateLevelQualityReviewCacheFingerprintSet(value).valid;
}
function fingerprintsFrom(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if ("fingerprints" in value) {
        return value.fingerprints;
    }
    return [value];
}
function countBy(values, keyFn) {
    const counts = new Map();
    for (const value of values) {
        const key = keyFn(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
}
export function summarizeLevelQualityReviewCacheFingerprints(value) {
    const fingerprints = fingerprintsFrom(value);
    const symbols = [...new Set(fingerprints.map((fingerprint) => fingerprint.symbol))].sort();
    const firstTimestamps = fingerprints
        .map((fingerprint) => fingerprint.firstCandleTimestamp)
        .filter((timestamp) => timestamp !== undefined);
    const lastTimestamps = fingerprints
        .map((fingerprint) => fingerprint.lastCandleTimestamp)
        .filter((timestamp) => timestamp !== undefined);
    const validationIssueCount = fingerprints.reduce((sum, fingerprint) => sum + fingerprint.validationIssueCount, 0);
    const summary = {
        totalFingerprints: fingerprints.length,
        symbolCount: symbols.length,
        symbols,
        providerCounts: countBy(fingerprints, (fingerprint) => fingerprint.provider),
        timeframeCounts: countBy(fingerprints, (fingerprint) => fingerprint.timeframe),
        levelEngineInputCount: fingerprints.filter((fingerprint) => fingerprint.includedInLevelEngine === true).length,
        contextOnlyCount: fingerprints.filter((fingerprint) => fingerprint.contextOnly === true).length,
        fifteenMinuteContextOnlyCount: fingerprints.filter((fingerprint) => fingerprint.timeframe === "15m" &&
            fingerprint.contextOnly === true &&
            fingerprint.includedInLevelEngine === false).length,
        validationIssueCount,
        wrapperCandleCount: fingerprints.reduce((sum, fingerprint) => sum + fingerprint.wrapperCandleCount, 0),
        actualBarsReturned: fingerprints.reduce((sum, fingerprint) => sum + fingerprint.actualBarsReturned, 0),
        hasValidationIssues: validationIssueCount > 0,
        ...(firstTimestamps.length > 0 ? { firstCandleTimestamp: Math.min(...firstTimestamps) } : {}),
        ...(lastTimestamps.length > 0 ? { lastCandleTimestamp: Math.max(...lastTimestamps) } : {}),
    };
    return summary;
}
export function assertLevelQualityReviewCacheFingerprintFactsOnly(value) {
    const fingerprintValidation = validateLevelQualityReviewCacheFingerprint(value);
    const setValidation = validateLevelQualityReviewCacheFingerprintSet(value);
    if (!fingerprintValidation.valid && !setValidation.valid) {
        throw new Error(`Invalid level quality review cache fingerprint: ${[
            ...fingerprintValidation.errors,
            ...setValidation.errors,
        ].join("; ")}`);
    }
    const text = JSON.stringify(value);
    const hits = FACTUAL_ONLY_BLOCKED_PATTERNS
        .filter(([, pattern]) => pattern.test(text))
        .map(([label]) => label);
    if (hits.length > 0) {
        throw new Error(`Level quality review cache fingerprint contains non-factual wording: ${hits.join(", ")}`);
    }
}
