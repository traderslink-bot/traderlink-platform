import { type LevelEngineConfig } from "../levels/level-config.js";
import type { Candle } from "../market-data/candle-types.js";
import { type LevelAnalysisSnapshot } from "./level-analysis-snapshot.js";
export type LevelAnalysisSnapshotFromCandlesInput = {
    symbol: string;
    asOfTimestamp: number;
    referencePrice?: number;
    candles5m: Candle[];
    candles15m?: Candle[];
    dailyCandles?: Candle[];
    fourHourCandles?: Candle[];
    previousClose?: number;
    config?: LevelEngineConfig;
};
export declare function buildLevelAnalysisSnapshotFromCandles(request: LevelAnalysisSnapshotFromCandlesInput): LevelAnalysisSnapshot;
//# sourceMappingURL=level-analysis-snapshot-from-candles.d.ts.map