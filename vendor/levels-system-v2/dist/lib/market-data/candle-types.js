// 2026-04-14 08:05 PM America/Toronto
// Shared candle type definitions for the levels system market-data layer.
export const LEVEL_ENGINE_ELIGIBLE_TIMEFRAMES = [
    "daily",
    "4h",
    "5m",
];
export const PROVIDER_CANDLE_TIMEFRAMES = [
    "daily",
    "4h",
    "15m",
    "5m",
];
export function isLevelEngineEligibleTimeframe(timeframe) {
    return timeframe === "daily" || timeframe === "4h" || timeframe === "5m";
}
export function isProviderCandleTimeframe(timeframe) {
    return (timeframe === "daily" ||
        timeframe === "4h" ||
        timeframe === "15m" ||
        timeframe === "5m");
}
