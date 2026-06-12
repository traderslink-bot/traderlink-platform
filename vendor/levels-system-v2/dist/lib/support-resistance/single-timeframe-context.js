// 2026-05-27 09:20 PM America/Toronto
// Rescue-only single-timeframe support/resistance context with candle-close as-of safety.
import { filterCandlesByCloseAsOf, } from "../market-data/candle-as-of-filter.js";
function roundPrice(value) {
    return Number(value.toFixed(4));
}
function buildLevels(symbol, timeframe, candles) {
    return candles.flatMap((candle) => [
        {
            symbol: symbol.toUpperCase(),
            timeframe,
            kind: "support",
            price: roundPrice(candle.low),
            sourceTimestamp: candle.timestamp,
        },
        {
            symbol: symbol.toUpperCase(),
            timeframe,
            kind: "resistance",
            price: roundPrice(candle.high),
            sourceTimestamp: candle.timestamp,
        },
    ]);
}
export function buildSingleTimeframeSupportResistanceContext(request) {
    const filtered = filterCandlesByCloseAsOf({
        candles: request.candles,
        timeframe: request.timeframe,
        asOfTimestamp: request.asOfTimestamp,
    });
    return {
        symbol: request.symbol.toUpperCase(),
        timeframe: request.timeframe,
        asOfTimestamp: request.asOfTimestamp ?? undefined,
        candles: filtered.candles,
        levels: buildLevels(request.symbol, request.timeframe, filtered.candles),
        diagnostics: filtered.diagnostics,
    };
}
