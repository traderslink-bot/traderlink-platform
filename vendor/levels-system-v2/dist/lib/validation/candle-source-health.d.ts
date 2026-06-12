import type { CandleFetchService, HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import type { CandleProviderName, CandleProviderResponse } from "../market-data/candle-types.js";
export type CandleSourceHealthStatus = "healthy" | "degraded" | "unavailable";
export type CandleSourceHealthReport = {
    provider: CandleProviderName | "unknown";
    symbol: string;
    timeframe: HistoricalFetchRequest["timeframe"];
    requestedLookbackBars: number;
    status: CandleSourceHealthStatus;
    reason: string;
    diagnostics: string;
    response: CandleProviderResponse | null;
    errorMessage?: string;
};
export declare function checkCandleSourceHealth(candleFetchService: CandleFetchService, request: HistoricalFetchRequest): Promise<CandleSourceHealthReport>;
export declare function formatCandleSourceHealthReport(report: CandleSourceHealthReport): string;
//# sourceMappingURL=candle-source-health.d.ts.map