import { StubHistoricalCandleProvider } from "./candle-fetch-service.js";
import { IbkrHistoricalCandleProvider } from "./ibkr-historical-candle-provider.js";
import { TwelveDataHistoricalCandleProvider } from "./providers/twelve-data-historical-candle-provider.js";
import { resolveProviderPriority } from "./provider-priority.js";
export function createHistoricalCandleProvider(options = {}) {
    const priority = resolveProviderPriority(options.provider);
    for (const providerName of priority) {
        if (providerName === "twelve_data" && options.twelveDataApiKey?.trim()) {
            return new TwelveDataHistoricalCandleProvider(options.twelveDataApiKey);
        }
        if (providerName === "ibkr" && options.ib) {
            return new IbkrHistoricalCandleProvider(options.ib, options.ibkrTimeoutMs);
        }
        if (providerName === "stub") {
            return new StubHistoricalCandleProvider();
        }
    }
    throw new Error("Unable to create a historical candle provider from the supplied options.");
}
