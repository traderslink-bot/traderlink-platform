// 2026-04-14 08:42 PM America/Toronto
// Main phase 1 support and resistance engine orchestrator with refined clustering and scoring.
import { DEFAULT_LEVEL_ENGINE_CONFIG } from "./level-config.js";
import { clusterRawLevelCandidates } from "./level-clusterer.js";
import { buildLevelRuntimeComparisonLogEntry, } from "./level-runtime-comparison-logger.js";
import { buildNewRuntimeCompatibleLevelOutput } from "./level-runtime-output-adapter.js";
import { buildRawLevelCandidates } from "./raw-level-candidate-builder.js";
import { rankLevelZones } from "./level-ranker.js";
import { normalizeOldPathOutput } from "./level-ranking-comparison.js";
import { scoreLevelZones } from "./level-scorer.js";
import { buildSpecialLevelCandidates } from "./special-level-builder.js";
import { detectSwingPoints } from "./swing-detector.js";
export class LevelEngine {
    fetchService;
    config;
    runtimeOptions;
    constructor(fetchService, config = DEFAULT_LEVEL_ENGINE_CONFIG, runtimeOptions = {}) {
        this.fetchService = fetchService;
        this.config = config;
        this.runtimeOptions = runtimeOptions;
    }
    buildOptionalIntradayFallback(params) {
        const requestEndTimestamp = params.request.endTimeMs ?? Date.now();
        const intervalMs = 5 * 60 * 1000;
        const requestedStartTimestamp = requestEndTimestamp - params.request.lookbackBars * intervalMs;
        return {
            provider: params.fallbackProvider,
            symbol: params.symbol.toUpperCase(),
            timeframe: "5m",
            requestedLookbackBars: params.request.lookbackBars,
            candles: [],
            fetchStartTimestamp: requestEndTimestamp,
            fetchEndTimestamp: requestEndTimestamp,
            requestedStartTimestamp,
            requestedEndTimestamp: requestEndTimestamp,
            sessionMetadataAvailable: true,
            actualBarsReturned: 0,
            completenessStatus: "empty",
            stale: true,
            validationIssues: [],
            sessionSummary: null,
            providerMetadata: {
                degraded_reason: "optional_intraday_unavailable",
            },
        };
    }
    async loadSeries(request) {
        const dailyPromise = this.fetchService.fetchCandles(request.historicalRequests.daily);
        const fourHourPromise = this.fetchService.fetchCandles(request.historicalRequests["4h"]);
        const fiveMinutePromise = this.fetchService.fetchCandles(request.historicalRequests["5m"]);
        const [daily, fourHour, fiveMinuteResult] = await Promise.allSettled([
            dailyPromise,
            fourHourPromise,
            fiveMinutePromise,
        ]);
        if (daily.status !== "fulfilled") {
            throw daily.reason;
        }
        if (fourHour.status !== "fulfilled") {
            throw fourHour.reason;
        }
        const fiveMinute = fiveMinuteResult.status === "fulfilled" &&
            fiveMinuteResult.value.completenessStatus !== "empty" &&
            !fiveMinuteResult.value.validationIssues.some((issue) => issue.severity === "error")
            ? fiveMinuteResult.value
            : this.buildOptionalIntradayFallback({
                symbol: request.symbol,
                request: request.historicalRequests["5m"],
                fallbackProvider: daily.value.provider,
            });
        return {
            daily: daily.value,
            "4h": fourHour.value,
            "5m": fiveMinute,
        };
    }
    assertSeriesUsable(seriesMap) {
        for (const timeframe of ["daily", "4h"]) {
            const series = seriesMap[timeframe];
            const errors = series.validationIssues.filter((issue) => issue.severity === "error");
            if (errors.length > 0) {
                throw new Error(`Cannot generate levels for ${series.symbol} ${timeframe} because candle validation failed: ${errors
                    .map((issue) => issue.code)
                    .join(", ")}`);
            }
            if (series.completenessStatus === "empty") {
                throw new Error(`Cannot generate levels for ${series.symbol} ${timeframe} because no candles were returned.`);
            }
        }
    }
    deriveOutputMetadata(seriesMap) {
        const dataQualityFlags = [
            ...new Set(Object.values(seriesMap).flatMap((series) => series.validationIssues.map((issue) => `${series.timeframe}:${issue.code}`))),
        ];
        if (seriesMap["5m"].candles.length === 0) {
            dataQualityFlags.push("5m:unavailable");
        }
        const freshestTimestamp = Math.max(...Object.values(seriesMap).map((series) => series.candles.at(-1)?.timestamp ?? 0));
        const ageHours = (Date.now() - freshestTimestamp) / (1000 * 60 * 60);
        const freshness = ageHours <= 24 ? "fresh" : ageHours <= 24 * 7 ? "aging" : "stale";
        const referencePrice = seriesMap["5m"].candles.at(-1)?.close ??
            seriesMap["4h"].candles.at(-1)?.close ??
            seriesMap.daily.candles.at(-1)?.close;
        return {
            providerByTimeframe: {
                daily: seriesMap.daily.provider,
                "4h": seriesMap["4h"].provider,
                "5m": seriesMap["5m"].provider,
            },
            dataQualityFlags,
            freshness,
            referencePrice,
        };
    }
    buildOldOutput(params) {
        const supportTolerance = Math.max(this.config.timeframeConfig.daily.clusterTolerancePct, this.config.timeframeConfig["4h"].clusterTolerancePct);
        const resistanceTolerance = supportTolerance;
        const supportZones = scoreLevelZones(clusterRawLevelCandidates(params.symbol, "support", params.rawCandidates, supportTolerance, this.config), this.config);
        const resistanceZones = scoreLevelZones(clusterRawLevelCandidates(params.symbol, "resistance", params.rawCandidates, resistanceTolerance, this.config), this.config);
        return rankLevelZones({
            symbol: params.symbol,
            supportZones,
            resistanceZones,
            specialLevels: params.specialLevels,
            metadata: params.metadata,
            config: this.config,
        });
    }
    async generateLevels(request) {
        const seriesMap = await this.loadSeries(request);
        this.assertSeriesUsable(seriesMap);
        const metadata = this.deriveOutputMetadata(seriesMap);
        const rawCandidates = [];
        for (const timeframe of ["daily", "4h", "5m"]) {
            const series = seriesMap[timeframe];
            if (series.candles.length === 0) {
                continue;
            }
            const swings = detectSwingPoints(series.candles, {
                swingWindow: this.config.timeframeConfig[timeframe].swingWindow,
                minimumDisplacementPct: this.config.timeframeConfig[timeframe].minimumDisplacementPct,
                minimumSeparationBars: this.config.timeframeConfig[timeframe].minimumSwingSeparationBars,
            });
            rawCandidates.push(...buildRawLevelCandidates({
                symbol: request.symbol.toUpperCase(),
                timeframe,
                candles: series.candles,
                swings,
            }));
        }
        const special = buildSpecialLevelCandidates(request.symbol.toUpperCase(), seriesMap["5m"].candles);
        rawCandidates.push(...special.candidates);
        const symbol = request.symbol.toUpperCase();
        const oldOutput = this.buildOldOutput({
            symbol,
            metadata,
            rawCandidates,
            specialLevels: special.summary,
        });
        const runtimeMode = this.runtimeOptions.runtimeMode ?? "old";
        if (runtimeMode === "old") {
            return oldOutput;
        }
        const newProjection = buildNewRuntimeCompatibleLevelOutput({
            symbol,
            rawCandidates,
            candlesByTimeframe: {
                daily: seriesMap.daily.candles,
                "4h": seriesMap["4h"].candles,
                "5m": seriesMap["5m"].candles,
            },
            metadata,
            specialLevels: special.summary,
            legacyRuntimeBuckets: {
                majorSupport: oldOutput.majorSupport,
                majorResistance: oldOutput.majorResistance,
                intermediateSupport: oldOutput.intermediateSupport,
                intermediateResistance: oldOutput.intermediateResistance,
                intradaySupport: oldOutput.intradaySupport,
                intradayResistance: oldOutput.intradayResistance,
            },
            legacyExtensionLevels: oldOutput.extensionLevels,
        });
        if (runtimeMode === "new") {
            return newProjection.output;
        }
        const compareActivePath = this.runtimeOptions.compareActivePath ?? "old";
        this.runtimeOptions.onComparisonLog?.(buildLevelRuntimeComparisonLogEntry({
            symbol,
            activePath: compareActivePath,
            oldPath: normalizeOldPathOutput(oldOutput, metadata.referencePrice ?? 0, 12),
            newPath: newProjection.comparableOutput,
        }));
        return compareActivePath === "new" ? newProjection.output : oldOutput;
    }
}
