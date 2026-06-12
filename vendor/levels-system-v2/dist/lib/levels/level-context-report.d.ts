import type { MarketContextFactsBundle, MarketContextProfile } from "../market-context/index.js";
import type { SessionMarketFacts } from "../session/index.js";
import type { VolumeMarketFacts, VolumeShelf } from "../volume/index.js";
import { type LevelContextExplanation } from "./level-context-explainer.js";
import type { LevelEngineOutput } from "./level-types.js";
export type LevelContextReportCounts = {
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
export type LevelContextReportSafety = {
    levelOutputUnchanged: true;
    factsOnlyVWAP: true;
    shelvesAreFactsOnly: true;
    noRuntimeBehaviorChange: true;
};
export type LevelContextReport = {
    symbol: string;
    generatedAt: number;
    explanations: LevelContextExplanation[];
    counts: LevelContextReportCounts;
    safety: LevelContextReportSafety;
};
export type BuildLevelContextReportRequest = {
    output: LevelEngineOutput;
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    marketContext?: MarketContextProfile;
    factsBundle?: MarketContextFactsBundle;
    proximityThresholdPct?: number;
};
export declare function buildLevelContextReport(request: BuildLevelContextReportRequest): LevelContextReport;
//# sourceMappingURL=level-context-report.d.ts.map