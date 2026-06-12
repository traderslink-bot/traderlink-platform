import { IBApi } from "@stoqey/ib";
import type { CandleProviderName } from "./candle-types.js";
import type { HistoricalCandleProvider } from "./provider-types.js";
export type HistoricalProviderFactoryOptions = {
    provider?: CandleProviderName;
    ib?: IBApi;
    twelveDataApiKey?: string;
    ibkrTimeoutMs?: number;
};
export declare function createHistoricalCandleProvider(options?: HistoricalProviderFactoryOptions): HistoricalCandleProvider;
//# sourceMappingURL=provider-factory.d.ts.map