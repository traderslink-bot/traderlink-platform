import { CandleFetchService } from "../../lib/market-data/candle-fetch-service.js";
import type { CandleProviderName } from "../../lib/market-data/candle-types.js";
import type { HistoricalCandleProvider } from "../../lib/market-data/provider-types.js";
import { type ValidationCandleCacheMode } from "../../lib/validation/validation-candle-cache.js";
export type ValidationCandleCacheRuntime = {
    candleFetchService: CandleFetchService;
    cacheMode: ValidationCandleCacheMode;
    cacheDirectoryPath: string;
};
export declare function createReplayOnlyHistoricalProvider(providerName: CandleProviderName): HistoricalCandleProvider;
export declare function createValidationCandleFetchService(candleFetchService: CandleFetchService): ValidationCandleCacheRuntime;
//# sourceMappingURL=validation-candle-cache.d.ts.map