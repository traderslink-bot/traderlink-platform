import { CandleFetchService, type HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import type { CandleProviderName, CandleProviderResponse } from "../market-data/candle-types.js";
export type ValidationCandleCacheMode = "off" | "read_write" | "refresh" | "replay";
type CandleFetchClient = {
    getProviderName(): CandleProviderName;
    fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
};
export type ValidationCachedCandleFetchServiceOptions = {
    cacheDirectoryPath: string;
    mode?: ValidationCandleCacheMode;
};
export declare function resolveValidationCandleCacheMode(rawValue: string | undefined): ValidationCandleCacheMode;
export declare class ValidationCachedCandleFetchService extends CandleFetchService {
    private readonly delegate;
    private readonly mode;
    constructor(delegate: CandleFetchClient, options: ValidationCachedCandleFetchServiceOptions);
    readonly cacheDirectoryPath: string;
    getProviderName(): CandleProviderName;
    fetchCandles(request: HistoricalFetchRequest): Promise<CandleProviderResponse>;
}
export {};
//# sourceMappingURL=validation-candle-cache.d.ts.map