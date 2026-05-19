import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import { type ComparablePathOutput } from "./level-ranking-comparison.js";
import type { LevelScoreConfig } from "./level-score-config.js";
import type { LevelSurfacedSelectionConfig } from "./level-surfaced-selection-config.js";
import { type SurfacedSelectionResult } from "./level-surfaced-selection.js";
import type { LevelCandidate, LevelEngineOutput, RawLevelCandidate, RankedLevelsOutput } from "./level-types.js";
export type NewRuntimeCompatibleLevelOutput = {
    output: LevelEngineOutput;
    rankedOutput: RankedLevelsOutput;
    surfacedSelection: SurfacedSelectionResult;
    comparableOutput: ComparablePathOutput;
    mappingNotes: string[];
};
export type LevelRuntimeOutputAdapterInput = {
    symbol: string;
    rawCandidates: RawLevelCandidate[];
    candlesByTimeframe: Partial<Record<CandleTimeframe, Candle[]>>;
    metadata: LevelEngineOutput["metadata"];
    specialLevels: LevelEngineOutput["specialLevels"];
    levelCandidates?: LevelCandidate[];
    generatedAt?: number;
    scoreConfig?: LevelScoreConfig;
    surfacedSelectionConfig?: LevelSurfacedSelectionConfig;
};
export declare function buildNewRuntimeCompatibleLevelOutput(input: LevelRuntimeOutputAdapterInput): NewRuntimeCompatibleLevelOutput;
//# sourceMappingURL=level-runtime-output-adapter.d.ts.map