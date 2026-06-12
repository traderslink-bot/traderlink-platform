import type { BaseCandleProviderResponse } from "../candle-types.js";
import type { BaseProviderCandleResponse, HistoricalCandleProvider, HistoricalFetchPlan, HistoricalFetchRequest, ProviderHistoricalFetchPlan, ProviderHistoricalFetchRequest } from "../provider-types.js";
export declare class TwelveDataHistoricalCandleProvider implements HistoricalCandleProvider {
    private readonly apiKey;
    private readonly baseUrl;
    readonly providerName: "twelve_data";
    constructor(apiKey: string, baseUrl?: string);
    fetchCandles(request: HistoricalFetchRequest, plan: HistoricalFetchPlan): Promise<BaseCandleProviderResponse>;
    fetchCandles(request: ProviderHistoricalFetchRequest, plan: ProviderHistoricalFetchPlan): Promise<BaseProviderCandleResponse>;
    private mapInterval;
}
//# sourceMappingURL=twelve-data-historical-candle-provider.d.ts.map