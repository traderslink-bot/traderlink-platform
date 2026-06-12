import type { CandleTimeframe } from "../market-data/candle-types.js";
import { CandleFetchService, type HistoricalFetchRequest } from "../market-data/candle-fetch-service.js";
import { type LevelEngineConfig } from "./level-config.js";
import { type LevelRuntimeComparisonLogEntry } from "./level-runtime-comparison-logger.js";
import type { LevelRuntimeCompareActivePath, LevelRuntimeMode } from "./level-runtime-mode.js";
import type { LevelEngineOutput } from "./level-types.js";
export type LevelEngineRequest = {
    symbol: string;
    historicalRequests: Record<CandleTimeframe, HistoricalFetchRequest>;
};
export type LevelEngineRuntimeOptions = {
    runtimeMode?: LevelRuntimeMode;
    compareActivePath?: LevelRuntimeCompareActivePath;
    onComparisonLog?: (entry: LevelRuntimeComparisonLogEntry) => void;
};
export declare class LevelEngine {
    private readonly fetchService;
    private readonly config;
    private readonly runtimeOptions;
    constructor(fetchService: CandleFetchService, config?: LevelEngineConfig, runtimeOptions?: LevelEngineRuntimeOptions);
    private buildOptionalIntradayFallback;
    private loadSeries;
    private assertSeriesUsable;
    private deriveOutputMetadata;
    private buildOldOutput;
    generateLevels(request: LevelEngineRequest): Promise<LevelEngineOutput>;
}
//# sourceMappingURL=level-engine.d.ts.map