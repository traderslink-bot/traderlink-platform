import type { BaseCandleProviderResponse, CandleProviderName, CandleTimeframe } from "./candle-types.js";
type GenericProviderCandle = {
    datetime?: string | number;
    timestamp?: string | number;
    time?: string | number;
    open: number | string;
    high: number | string;
    low: number | string;
    close: number | string;
    volume?: number | string | null;
};
export declare function normalizeGenericProviderCandles(params: {
    provider: CandleProviderName;
    symbol: string;
    timeframe: CandleTimeframe;
    requestedLookbackBars: number;
    rows: GenericProviderCandle[];
    requestedStartTimestamp: number;
    requestedEndTimestamp: number;
    sessionMetadataAvailable: boolean;
    providerMetadata?: Record<string, string | number | boolean | null>;
}): BaseCandleProviderResponse;
export {};
//# sourceMappingURL=candle-normalizer.d.ts.map