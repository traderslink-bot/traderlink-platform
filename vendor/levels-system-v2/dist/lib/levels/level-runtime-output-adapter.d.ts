import type { Candle, CandleTimeframe } from "../market-data/candle-types.js";
import { type ComparablePathOutput } from "./level-ranking-comparison.js";
import { type SurfacedSelectionResult } from "./level-surfaced-selection.js";
import type { LevelCandidate, LevelEngineOutput, RawLevelCandidate, RankedLevelsOutput } from "./level-types.js";
export type LegacyRuntimeBuckets = Pick<LevelEngineOutput, "majorSupport" | "majorResistance" | "intermediateSupport" | "intermediateResistance" | "intradaySupport" | "intradayResistance">;
export type EnrichmentDiagnostics = {
    totalRuntimeZones: number;
    enrichedZones: number;
    unenrichedZones: number;
    unmatchedRuntimeZoneIds: string[];
    enrichedHistoricalZones: number;
    unenrichedHistoricalZones: number;
    enrichedExtensionZones: number;
    unenrichedExtensionZones: number;
    unenrichedSyntheticZones: number;
    unmatchedHistoricalRuntimeZoneIds: string[];
    unmatchedExtensionRuntimeZoneIds: string[];
    unmatchedSyntheticRuntimeZoneIds: string[];
};
export type NewRuntimeCompatibleLevelOutput = {
    output: LevelEngineOutput;
    rankedOutput: RankedLevelsOutput;
    surfacedSelection: SurfacedSelectionResult;
    comparableOutput: ComparablePathOutput;
    enrichmentDiagnostics: EnrichmentDiagnostics;
    mappingNotes: string[];
};
export type LevelRuntimeOutputAdapterInput = {
    symbol: string;
    rawCandidates: RawLevelCandidate[];
    candlesByTimeframe: Partial<Record<CandleTimeframe, Candle[]>>;
    metadata: LevelEngineOutput["metadata"];
    specialLevels: LevelEngineOutput["specialLevels"];
    legacyRuntimeBuckets?: LegacyRuntimeBuckets;
    legacyExtensionLevels?: LevelEngineOutput["extensionLevels"];
    levelCandidates?: LevelCandidate[];
    generatedAt?: number;
};
export declare function buildNewRuntimeCompatibleLevelOutput(input: LevelRuntimeOutputAdapterInput): NewRuntimeCompatibleLevelOutput;
//# sourceMappingURL=level-runtime-output-adapter.d.ts.map