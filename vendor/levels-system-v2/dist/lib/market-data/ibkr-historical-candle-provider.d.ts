import { IBApi } from "@stoqey/ib";
import type { BaseCandleProviderResponse } from "./candle-types.js";
import type { BaseProviderCandleResponse, HistoricalCandleProvider, HistoricalFetchPlan, HistoricalFetchRequest, ProviderHistoricalFetchPlan, ProviderHistoricalFetchRequest } from "./provider-types.js";
export declare class IbkrHistoricalCandleProvider implements HistoricalCandleProvider {
    private readonly ib;
    private readonly timeoutMs;
    static nextRequestId: number;
    readonly providerName: "ibkr";
    constructor(ib: IBApi, timeoutMs?: number);
    fetchCandles(request: HistoricalFetchRequest, plan: HistoricalFetchPlan): Promise<BaseCandleProviderResponse>;
    fetchCandles(request: ProviderHistoricalFetchRequest, plan: ProviderHistoricalFetchPlan): Promise<BaseProviderCandleResponse>;
    private get ibClient();
    private validateRequest;
    private requestHistoricalBars;
    private mapBarToCandle;
    private parseIbkrTimestamp;
    private getFallbackDuration;
    private toFiniteNumber;
}
//# sourceMappingURL=ibkr-historical-candle-provider.d.ts.map