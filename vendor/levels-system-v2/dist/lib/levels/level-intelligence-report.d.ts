import type { MarketContextFactsBundle, MarketContextProfile } from "../market-context/index.js";
import type { SessionMarketFacts } from "../session/index.js";
import type { VolumeMarketFacts, VolumeShelf } from "../volume/index.js";
import { type LevelIntelligenceProfile } from "./level-intelligence-profile.js";
import type { LevelEngineOutput } from "./level-types.js";
export type LevelIntelligenceReportCounts = {
    majorSupport: number;
    majorResistance: number;
    intermediateSupport: number;
    intermediateResistance: number;
    intradaySupport: number;
    intradayResistance: number;
    extensionSupport: number;
    extensionResistance: number;
    total: number;
};
export type LevelIntelligenceReportBuckets = {
    majorSupport: LevelIntelligenceProfile[];
    majorResistance: LevelIntelligenceProfile[];
    intermediateSupport: LevelIntelligenceProfile[];
    intermediateResistance: LevelIntelligenceProfile[];
    intradaySupport: LevelIntelligenceProfile[];
    intradayResistance: LevelIntelligenceProfile[];
    extensionSupport: LevelIntelligenceProfile[];
    extensionResistance: LevelIntelligenceProfile[];
};
export type LevelIntelligenceReportSafety = {
    levelOutputUnchanged: true;
    factsOnly: true;
    vwapFactsOnly: true;
    shelvesAreFactsOnly: true;
    noRuntimeBehaviorChange: true;
};
export type LevelIntelligenceReport = {
    symbol: string;
    generatedAt: number;
    referencePrice?: number;
    profiles: LevelIntelligenceProfile[];
    buckets: LevelIntelligenceReportBuckets;
    counts: LevelIntelligenceReportCounts;
    diagnostics: string[];
    safety: LevelIntelligenceReportSafety;
};
export type BuildLevelIntelligenceReportRequest = {
    output: LevelEngineOutput;
    referencePrice?: number;
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    marketContext?: MarketContextProfile;
    factsBundle?: MarketContextFactsBundle;
    proximityThresholdPct?: number;
};
export declare function buildLevelIntelligenceReport(request: BuildLevelIntelligenceReportRequest): LevelIntelligenceReport;
//# sourceMappingURL=level-intelligence-report.d.ts.map