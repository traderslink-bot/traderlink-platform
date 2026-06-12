import type { MarketContextFactsBundle, MarketContextProfile } from "../market-context/index.js";
import type { SessionMarketFacts } from "../session/index.js";
import type { VolumeMarketFacts, VolumeShelf } from "../volume/index.js";
import type { FinalLevelZone, LevelDataFreshness, LevelExtensionMetadata, LevelState } from "./level-types.js";
export type LevelDistanceCategory = "near" | "approaching" | "extended" | "far";
export type LevelRoundNumberType = "whole" | "half" | "quarter" | "ten_cent";
export type LevelIntelligenceProfile = {
    levelId: string;
    symbol: string;
    kind: "support" | "resistance";
    representativePrice: number;
    zoneLow: number;
    zoneHigh: number;
    zoneWidthPercent: number;
    origin: {
        sourceTypes: string[];
        timeframeSources: string[];
        primaryTimeframe: string;
        isExtension: boolean;
    };
    extension?: {
        source: LevelExtensionMetadata["extensionSource"];
        label: string;
        generationMethod?: LevelExtensionMetadata["generationMethod"];
        evidenceLimitations: NonNullable<LevelExtensionMetadata["evidenceLimitations"]>;
        referencePrice?: number;
        coveragePct?: number;
        maxCoveragePct?: number;
        syntheticIndex?: number;
        notes: string[];
        isSyntheticContinuationMap: boolean;
    };
    freshness: {
        firstTimestamp: number;
        lastTimestamp: number;
        label: LevelDataFreshness;
        state?: LevelState;
    };
    reaction: {
        touchCount: number;
        reactionQualityScore: number;
        rejectionScore: number;
        displacementScore: number;
        followThroughScore: number;
        meaningfulTouchCount?: number;
        rejectionCount?: number;
        failedBreakCount?: number;
        cleanBreakCount?: number;
        reclaimCount?: number;
        averageReactionMovePct?: number;
        strongestReactionMovePct?: number;
        bestVolumeRatio?: number;
        averageVolumeRatio?: number;
        cleanlinessStdDevPct?: number;
    };
    distance?: {
        referencePrice: number;
        distanceFromReferencePct: number;
        category: LevelDistanceCategory;
    };
    volume?: {
        volumeState: VolumeMarketFacts["volumeState"];
        relativeVolume?: number;
        dollarVolume?: number;
        liquidityQuality: VolumeMarketFacts["liquidityQuality"];
        accelerationState: VolumeMarketFacts["accelerationState"];
        pullbackVolumeState: VolumeMarketFacts["pullbackVolumeState"];
        breakoutVolumeState: VolumeMarketFacts["breakoutVolumeState"];
        nearbyShelfIds: string[];
    };
    confluence: {
        nearSessionFacts: string[];
        nearVolumeFacts: string[];
        nearShelfFacts: string[];
        contextTags: string[];
        nearRoundNumber?: {
            value: number;
            type: LevelRoundNumberType;
            distancePct: number;
        };
    };
    marketContext?: {
        primaryContext: MarketContextProfile["primaryContext"];
        runnerPhase: MarketContextProfile["runnerPhase"];
        confidence: number;
    };
    confidence?: number;
    diagnostics: string[];
    reason: string;
    safety: {
        factsOnly: true;
        noRuntimeBehaviorChange: true;
        vwapFactsOnly: true;
        shelvesAreFactsOnly: true;
    };
};
export type BuildLevelIntelligenceProfileRequest = {
    level: FinalLevelZone;
    referencePrice?: number;
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    marketContext?: MarketContextProfile;
    factsBundle?: MarketContextFactsBundle;
    proximityThresholdPct?: number;
};
export declare function buildLevelIntelligenceProfile(request: BuildLevelIntelligenceProfileRequest): LevelIntelligenceProfile;
//# sourceMappingURL=level-intelligence-profile.d.ts.map