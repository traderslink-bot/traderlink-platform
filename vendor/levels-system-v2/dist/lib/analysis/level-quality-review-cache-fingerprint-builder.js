import { createHash } from "node:crypto";
import { assertLevelQualityReviewCacheFingerprintFactsOnly, validateLevelQualityReviewCacheFingerprintSet, } from "./level-quality-review-cache-fingerprint.js";
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isProvider(value) {
    return value === "ibkr" || value === "stub" || value === "twelve_data";
}
function isTimeframe(value) {
    return value === "5m" || value === "15m" || value === "4h" || value === "daily";
}
function positiveInteger(value) {
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}
function nonNegativeInteger(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}
function timestampFrom(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}
function normalizeRelativePath(value) {
    return value.replaceAll("\\", "/");
}
function hashWrapper(rawCacheWrapper) {
    return createHash("sha256").update(rawCacheWrapper).digest("hex");
}
function extractCandleArray(parsed) {
    if (Array.isArray(parsed)) {
        return parsed;
    }
    if (isRecord(parsed) && Array.isArray(parsed.candles)) {
        return parsed.candles;
    }
    if (isRecord(parsed) && isRecord(parsed.response) && Array.isArray(parsed.response.candles)) {
        return parsed.response.candles;
    }
    return [];
}
function timestampBounds(candles) {
    const timestamps = candles
        .map((candle) => (isRecord(candle) ? timestampFrom(candle.timestamp) : undefined))
        .filter((timestamp) => timestamp !== undefined);
    if (timestamps.length === 0) {
        return {};
    }
    return {
        firstCandleTimestamp: Math.min(...timestamps),
        lastCandleTimestamp: Math.max(...timestamps),
    };
}
function firstProvider(values, fallback) {
    return values.find(isProvider) ?? fallback;
}
function firstTimeframe(values, fallback) {
    return values.find(isTimeframe) ?? fallback;
}
function firstString(values, fallback) {
    return values.find((value) => typeof value === "string" && value.trim() !== "") ?? fallback;
}
function compactString(value) {
    return value.trim().toUpperCase();
}
export function buildLevelQualityReviewCacheFingerprint(input) {
    const parsed = input.parsedCacheWrapper;
    const wrapper = isRecord(parsed) ? parsed : {};
    const request = isRecord(wrapper.request) ? wrapper.request : {};
    const response = isRecord(wrapper.response) ? wrapper.response : {};
    const candles = extractCandleArray(parsed);
    const count = candles.length;
    const bounds = timestampBounds(candles);
    const provider = firstProvider([response.provider, request.provider], input.provider);
    const timeframe = firstTimeframe([response.timeframe, request.timeframe], input.timeframe);
    const symbol = compactString(firstString([response.symbol, request.symbol], input.symbol));
    const actualBarsReturned = nonNegativeInteger(response.actualBarsReturned) ??
        nonNegativeInteger(response.returnedBars) ??
        count;
    const requestLookbackBars = positiveInteger(request.lookbackBars) ??
        positiveInteger(response.requestedLookbackBars) ??
        Math.max(count, 1);
    const requestEndTimestamp = nonNegativeInteger(request.endTimeMs) ??
        nonNegativeInteger(response.requestedEndTimestamp) ??
        bounds.lastCandleTimestamp ??
        input.asOfTimestamp ??
        0;
    const validationIssueCount = Array.isArray(response.validationIssues)
        ? response.validationIssues.length
        : nonNegativeInteger(response.validationIssueCount) ?? 0;
    const contextOnly = timeframe === "15m" ? true : input.contextOnly;
    const includedInLevelEngine = timeframe === "15m"
        ? false
        : input.includedInLevelEngine;
    const fingerprint = {
        schemaVersion: "level-quality-review-cache-fingerprint/v1",
        relativePath: normalizeRelativePath(input.relativePath),
        provider,
        symbol,
        timeframe,
        sha256: hashWrapper(input.rawCacheWrapper),
        wrapperCandleCount: count,
        requestLookbackBars,
        requestEndTimestamp,
        actualBarsReturned,
        validationIssueCount,
        ...bounds,
        ...(input.asOfTimestamp === undefined ? {} : { asOfTimestamp: input.asOfTimestamp }),
        ...(includedInLevelEngine === undefined ? {} : { includedInLevelEngine }),
        ...(contextOnly === undefined ? {} : { contextOnly }),
        safety: {
            rawCandlesIncluded: false,
            rawCacheWrapperPayloadsIncluded: false,
            fullSnapshotsIncluded: false,
            providerCallsMade: false,
            cacheFilesWritten: false,
            fifteenMinuteFedIntoLevelEngine: false,
        },
    };
    assertLevelQualityReviewCacheFingerprintFactsOnly(fingerprint);
    return fingerprint;
}
export function buildLevelQualityReviewCacheFingerprintSet(input) {
    const set = {
        schemaVersion: "level-quality-review-cache-fingerprint-set/v1",
        ...(input.generatedAt === undefined ? {} : { generatedAt: input.generatedAt }),
        ...(input.provider === undefined ? {} : { provider: input.provider }),
        fingerprints: [...input.fingerprints],
    };
    const validation = validateLevelQualityReviewCacheFingerprintSet(set);
    if (!validation.valid) {
        throw new Error(`Invalid level quality review cache fingerprint set: ${validation.errors.join("; ")}`);
    }
    assertLevelQualityReviewCacheFingerprintFactsOnly(set);
    return set;
}
