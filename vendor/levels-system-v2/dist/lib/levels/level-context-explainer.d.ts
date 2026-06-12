import type { MarketContextFactsBundle, MarketContextProfile } from "../market-context/index.js";
import type { SessionMarketFacts } from "../session/index.js";
import type { VolumeMarketFacts, VolumeShelf } from "../volume/index.js";
import type { FinalLevelZone } from "./level-types.js";
export type LevelContextExplanation = {
    levelId: string;
    symbol: string;
    kind: "support" | "resistance";
    representativePrice: number;
    explanation: string;
    facts: string[];
    confluences: string[];
    warnings: string[];
    nearbySessionFacts: string[];
    nearbyVolumeFacts: string[];
    nearbyShelfFacts: string[];
    contextTags: string[];
};
export type ExplainLevelContextRequest = {
    level: FinalLevelZone;
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    marketContext?: MarketContextProfile;
    factsBundle?: MarketContextFactsBundle;
    currentPrice?: number;
    proximityThresholdPct?: number;
};
export declare function explainLevelContext(request: ExplainLevelContextRequest): LevelContextExplanation;
//# sourceMappingURL=level-context-explainer.d.ts.map