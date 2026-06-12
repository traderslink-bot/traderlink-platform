import type { Candle } from "../market-data/candle-types.js";
import type { LevelScoreConfig } from "./level-score-config.js";
import type { LevelCandidate, LevelTouchAnalysisResult, SourceTimeframe } from "./level-types.js";
export declare function analyzeLevelTouches(level: Pick<LevelCandidate, "price" | "type" | "zoneLow" | "zoneHigh">, candles: Candle[], timeframe: SourceTimeframe, config?: LevelScoreConfig): LevelTouchAnalysisResult;
//# sourceMappingURL=level-touch-analysis.d.ts.map