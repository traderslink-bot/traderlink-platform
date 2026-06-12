// 2026-05-27 09:20 PM America/Toronto
// Rescue-only multi-timeframe support/resistance context composed from closed candles only.
import { buildLevelAnalysisSnapshotFromCandles } from "../analysis/level-analysis-snapshot-from-candles.js";
import { buildSingleTimeframeSupportResistanceContext, } from "./single-timeframe-context.js";
const TIMEFRAMES = ["daily", "4h", "5m"];
function newestCandleTimestamp(candlesByTimeframe) {
    const timestamps = Object.values(candlesByTimeframe)
        .flatMap((candles) => candles ?? [])
        .map((candle) => candle.timestamp)
        .filter((timestamp) => Number.isFinite(timestamp));
    return timestamps.length === 0 ? undefined : Math.max(...timestamps);
}
function flattenLevelEngineOutput(output) {
    return [
        ...output.majorSupport,
        ...output.majorResistance,
        ...output.intermediateSupport,
        ...output.intermediateResistance,
        ...output.intradaySupport,
        ...output.intradayResistance,
        ...output.extensionLevels.support,
        ...output.extensionLevels.resistance,
    ];
}
function buildRichLevelEngineOutput(request) {
    const asOfTimestamp = request.asOfTimestamp ?? newestCandleTimestamp(request.candlesByTimeframe);
    if (asOfTimestamp === undefined || !Number.isFinite(asOfTimestamp)) {
        return undefined;
    }
    return buildLevelAnalysisSnapshotFromCandles({
        symbol: request.symbol,
        asOfTimestamp,
        candles5m: request.candlesByTimeframe["5m"] ?? [],
        dailyCandles: request.candlesByTimeframe.daily,
        fourHourCandles: request.candlesByTimeframe["4h"],
    }).levelEngineOutput;
}
export function buildSymbolSupportResistanceContext(request) {
    const timeframes = {};
    for (const timeframe of TIMEFRAMES) {
        const candles = request.candlesByTimeframe[timeframe];
        if (!candles) {
            continue;
        }
        timeframes[timeframe] = buildSingleTimeframeSupportResistanceContext({
            symbol: request.symbol,
            timeframe,
            candles,
            asOfTimestamp: request.asOfTimestamp,
        });
    }
    const contexts = Object.values(timeframes);
    const levelEngineOutput = buildRichLevelEngineOutput(request);
    return {
        symbol: request.symbol.toUpperCase(),
        asOfTimestamp: request.asOfTimestamp ?? undefined,
        timeframes,
        levels: contexts.flatMap((context) => context.levels),
        finalLevelZones: levelEngineOutput ? flattenLevelEngineOutput(levelEngineOutput) : [],
        levelEngineOutput,
        diagnostics: contexts.flatMap((context) => context.diagnostics),
    };
}
