import { join } from "node:path";
import { ValidationCachedCandleFetchService, resolveValidationCandleCacheMode, } from "../../lib/validation/validation-candle-cache.js";
export function createValidationCandleFetchService(candleFetchService) {
    const cacheMode = resolveValidationCandleCacheMode(process.env.LEVEL_VALIDATION_CACHE_MODE);
    const cacheDirectoryPath = process.env.LEVEL_VALIDATION_CACHE_DIR?.trim() ||
        join(process.cwd(), ".validation-cache", "candles");
    if (cacheMode === "off") {
        return {
            candleFetchService,
            cacheMode,
            cacheDirectoryPath,
        };
    }
    return {
        candleFetchService: new ValidationCachedCandleFetchService(candleFetchService, {
            cacheDirectoryPath,
            mode: cacheMode,
        }),
        cacheMode,
        cacheDirectoryPath,
    };
}
