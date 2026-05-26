import { CandleFetchService, } from "../market-data/candle-fetch-service.js";
import { buildSupportResistanceContextFromNormalizedCandles, parseSharedCandleTimestamp, sortSharedCandles, } from "./build-support-resistance-context.js";
const DEFAULT_LOOKBACK_BARS = {
    daily: 520,
    "4h": 180,
    "5m": 120,
};
function normalizeSymbol(symbol) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) {
        throw new Error("symbol is required.");
    }
    return normalized;
}
function buildFetchService(request) {
    return (request.fetchService ??
        new CandleFetchService({
            ...request.fetchServiceOptions,
            providerName: request.preferredProvider ?? request.fetchServiceOptions?.providerName,
        }));
}
function fetchSummary(response) {
    const freshnessStatus = response.completenessStatus === "empty"
        ? "missing"
        : response.stale
            ? "stale"
            : response.completenessStatus === "partial"
                ? "partial"
                : response.validationIssues.some((issue) => issue.severity === "warning")
                    ? "usable"
                    : "fresh";
    return {
        timeframe: response.timeframe,
        provider: response.provider,
        freshnessStatus,
        requestedLookbackBars: response.requestedLookbackBars,
        actualBarsReturned: response.actualBarsReturned,
        requestedStartTimestamp: response.requestedStartTimestamp,
        requestedEndTimestamp: response.requestedEndTimestamp,
        newestCandleTimestamp: response.candles.at(-1)?.timestamp ?? null,
        completenessStatus: response.completenessStatus,
        stale: response.stale,
        validationIssues: response.validationIssues,
    };
}
function diagnosticsFromResponses(responses) {
    const diagnostics = [];
    for (const timeframe of ["daily", "4h"]) {
        const response = responses[timeframe];
        if (!response || response.completenessStatus === "empty") {
            diagnostics.push({
                code: "missing_required_higher_timeframe",
                severity: "error",
                timeframe,
                message: `${timeframe} candles are required for full support/resistance context.`,
            });
        }
    }
    if (!responses["5m"] || responses["5m"]?.completenessStatus === "empty") {
        diagnostics.push({
            code: "missing_optional_5m_candles",
            severity: "warning",
            timeframe: "5m",
            message: "5m candles are optional, but missing 5m data limits dynamic and intraday context.",
        });
    }
    for (const response of Object.values(responses)) {
        if (!response) {
            continue;
        }
        diagnostics.push({
            code: "fetched_candle_group",
            severity: "info",
            timeframe: response.timeframe,
            message: `Fetched ${response.actualBarsReturned} ${response.timeframe} candles from ${response.provider}.`,
        });
        for (const issue of response.validationIssues) {
            diagnostics.push({
                code: "provider_warning",
                severity: issue.severity,
                timeframe: response.timeframe,
                message: issue.message,
            });
        }
    }
    return diagnostics;
}
export async function buildSupportResistanceContextForSymbol(request) {
    const symbol = normalizeSymbol(request.symbol);
    const fetchService = buildFetchService(request);
    const endTimeMs = request.asOfTimestamp === undefined
        ? undefined
        : parseSharedCandleTimestamp(request.asOfTimestamp);
    const endTimeMsByTimeframe = {};
    for (const timeframe of ["daily", "4h", "5m"]) {
        const timestamp = request.asOfTimestampByTimeframe?.[timeframe];
        if (timestamp !== undefined) {
            endTimeMsByTimeframe[timeframe] = parseSharedCandleTimestamp(timestamp);
        }
    }
    const requestedTimeframes = ["daily", "4h", "5m"];
    const settled = await Promise.allSettled(requestedTimeframes.map((timeframe) => fetchService.fetchCandles({
        symbol,
        timeframe,
        lookbackBars: request.lookbackBars?.[timeframe] ?? DEFAULT_LOOKBACK_BARS[timeframe],
        endTimeMs: endTimeMsByTimeframe[timeframe] ?? endTimeMs,
        preferredProvider: request.preferredProvider,
    })));
    const responses = {};
    const failedDiagnostics = [];
    for (const [index, result] of settled.entries()) {
        const timeframe = requestedTimeframes[index];
        if (result.status === "fulfilled") {
            responses[timeframe] = result.value;
            continue;
        }
        failedDiagnostics.push({
            code: timeframe === "5m" ? "missing_optional_5m_candles" : "missing_required_higher_timeframe",
            severity: timeframe === "5m" ? "warning" : "error",
            timeframe,
            message: result.reason instanceof Error
                ? result.reason.message
                : `Failed to fetch ${timeframe} candles for ${symbol}.`,
        });
    }
    const diagnostics = [...failedDiagnostics, ...diagnosticsFromResponses(responses)];
    const daily = responses.daily;
    const fourHour = responses["4h"];
    if (!daily || !fourHour) {
        const diagnosticSummary = diagnostics
            .filter((diagnostic) => diagnostic.severity === "error" || diagnostic.timeframe === "daily" || diagnostic.timeframe === "4h")
            .map((diagnostic) => `${diagnostic.timeframe ?? "context"}: ${diagnostic.message}`)
            .join(" | ");
        throw new Error(`Cannot build full support/resistance context for ${symbol}: daily and 4h candles are required.${diagnosticSummary ? ` Higher-timeframe diagnostics: ${diagnosticSummary}` : ""}`);
    }
    const baseContext = await buildSupportResistanceContextFromNormalizedCandles({
        symbol,
        candlesByTimeframe: {
            daily: sortSharedCandles(daily.candles.filter((candle) => endTimeMsByTimeframe.daily === undefined ? true : candle.timestamp <= endTimeMsByTimeframe.daily)),
            "4h": sortSharedCandles(fourHour.candles.filter((candle) => endTimeMsByTimeframe["4h"] === undefined ? true : candle.timestamp <= endTimeMsByTimeframe["4h"])),
            "5m": sortSharedCandles(responses["5m"]?.candles.filter((candle) => endTimeMsByTimeframe["5m"] === undefined ? true : candle.timestamp <= endTimeMsByTimeframe["5m"])),
        },
        providerByTimeframe: {
            daily: daily.provider,
            "4h": fourHour.provider,
            ...(responses["5m"] ? { "5m": responses["5m"].provider } : {}),
        },
        sessionDate: request.sessionDate,
        asOfTimestamp: endTimeMs,
        currentPrice: request.currentPrice,
        bid: request.bid,
        ask: request.ask,
        stockContext: request.stockContext,
        knownCatalyst: request.knownCatalyst,
        config: request.config,
        runtimeOptions: request.runtimeOptions,
    });
    return {
        ...baseContext,
        mode: "symbol",
        candleFetchingOwnedBy: "levels-system",
        requestedTimeframes,
        fetches: Object.values(responses).map(fetchSummary),
        diagnostics,
    };
}
