export const DEFAULT_VALIDATION_LOOKBACKS = {
    daily: 120,
    "4h": 120,
    "5m": 160,
};
function resolvePositiveInteger(rawValue, fallback) {
    const parsed = Number.parseInt(rawValue ?? "", 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function lookbackEnvKey(timeframe) {
    switch (timeframe) {
        case "daily":
            return "LEVEL_VALIDATION_LOOKBACK_DAILY";
        case "4h":
            return "LEVEL_VALIDATION_LOOKBACK_4H";
        case "5m":
            return "LEVEL_VALIDATION_LOOKBACK_5M";
    }
}
export function resolveValidationLookbacks(env = process.env, defaults = DEFAULT_VALIDATION_LOOKBACKS) {
    return {
        daily: resolvePositiveInteger(env[lookbackEnvKey("daily")], defaults.daily),
        "4h": resolvePositiveInteger(env[lookbackEnvKey("4h")], defaults["4h"]),
        "5m": resolvePositiveInteger(env[lookbackEnvKey("5m")], defaults["5m"]),
    };
}
export function isStructurallyRequiredValidationTimeframe(timeframe) {
    return timeframe === "daily" || timeframe === "4h";
}
