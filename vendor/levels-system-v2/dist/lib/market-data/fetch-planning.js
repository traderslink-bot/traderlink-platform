const TIMEFRAME_TO_INTERVAL_MS = {
    daily: 24 * 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "5m": 5 * 60 * 1000,
};
const TIMEFRAME_TO_BAR_SIZE = {
    daily: "1 day",
    "4h": "4 hours",
    "15m": "15 mins",
    "5m": "5 mins",
};
const TIMEFRAME_TO_REMOTE_INTERVAL = {
    daily: "1day",
    "4h": "4h",
    "15m": "15min",
    "5m": "5min",
};
function resolvePlannedBarCount(timeframe, lookbackBars) {
    switch (timeframe) {
        case "daily":
            return Math.max(lookbackBars + 40, Math.ceil(lookbackBars * 1.25));
        case "4h":
            return Math.max(lookbackBars + 30, Math.ceil(lookbackBars * 1.4));
        case "15m":
            return Math.max(lookbackBars + 60, Math.ceil(lookbackBars * 1.6));
        case "5m":
            return Math.max(lookbackBars + 60, Math.ceil(lookbackBars * 1.6));
    }
}
function formatIbkrDurationFromMs(spanMs) {
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    const yearMs = 365 * dayMs;
    if (spanMs <= weekMs) {
        return `${Math.max(1, Math.ceil(spanMs / dayMs))} D`;
    }
    if (spanMs <= 12 * weekMs) {
        return `${Math.max(1, Math.ceil(spanMs / weekMs))} W`;
    }
    if (spanMs <= 18 * monthMs) {
        return `${Math.max(1, Math.ceil(spanMs / monthMs))} M`;
    }
    return `${Math.max(1, Math.ceil(spanMs / yearMs))} Y`;
}
export function buildProviderHistoricalFetchPlan(request, provider) {
    const requestEndTimestamp = request.endTimeMs ?? Date.now();
    const intervalMs = TIMEFRAME_TO_INTERVAL_MS[request.timeframe];
    const plannedBarCount = resolvePlannedBarCount(request.timeframe, request.lookbackBars);
    const requestStartTimestamp = requestEndTimestamp - plannedBarCount * intervalMs;
    const providerRequest = {
        barSizeSetting: TIMEFRAME_TO_BAR_SIZE[request.timeframe],
        durationStr: formatIbkrDurationFromMs(requestEndTimestamp - requestStartTimestamp),
        interval: TIMEFRAME_TO_REMOTE_INTERVAL[request.timeframe],
        outputSize: plannedBarCount,
    };
    return {
        provider,
        timeframe: request.timeframe,
        requestedLookbackBars: request.lookbackBars,
        plannedBarCount,
        requestStartTimestamp,
        requestEndTimestamp,
        intervalMs,
        sessionMetadataAvailable: request.timeframe === "5m",
        providerRequest,
    };
}
export function buildHistoricalFetchPlan(request, provider) {
    return buildProviderHistoricalFetchPlan(request, provider);
}
