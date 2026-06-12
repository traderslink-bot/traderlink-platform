import type { LevelEngineOutput, FinalLevelZone, EnrichedLevelAnalysis } from "../levels/level-types.js";
import type { MarketContextProfile, MarketContextFactsBundle } from "../market-context/index.js";
import type { SessionMarketFacts } from "../session/index.js";
import type { VolumeMarketFacts, VolumeShelf } from "../volume/index.js";
export type ExecutionSide = "buy" | "sell";
export type ExecutionTradeLocationLabel = "near_support" | "near_resistance" | "middle_of_range" | "above_resistance" | "below_support" | "breakout_area" | "breakdown_area" | "extended_above_vwap" | "below_vwap" | "chop_zone" | "unknown";
export type ExecutionLevelRoleAtExecution = "entry_area" | "breakout_trigger" | "profit_target" | "invalidation_area" | "avoid_chop_zone" | "context_only";
export type ExecutionContextDiagnosticCode = "symbol_mismatch" | "as_of_after_execution" | "missing_support_below" | "missing_resistance_above" | "vwap_facts_only" | "volume_shelves_facts_only";
export type ExecutionContextDiagnostic = {
    code: ExecutionContextDiagnosticCode;
    severity: "info" | "warning";
    message: string;
};
export type ExecutionInput = {
    symbol: string;
    executionId: string;
    executionTimestamp: number;
    side: ExecutionSide;
    price: number;
    shares?: number;
    asOfTimestamp?: number;
};
export type ExecutionLevelSnapshot = {
    id: string;
    kind: "support" | "resistance";
    representativePrice: number;
    zoneLow: number;
    zoneHigh: number;
    distanceFromExecutionPct: number;
    strengthScore: number;
    strengthLabel: "weak" | "moderate" | "strong" | "major";
    freshness: "fresh" | "aging" | "stale";
    timeframeBias: "daily" | "4h" | "5m" | "mixed";
    sourceTypes: string[];
    timeframeSources: string[];
    isExtension: boolean;
    enrichedAnalysis?: EnrichedLevelAnalysis;
    roleAtExecution: ExecutionLevelRoleAtExecution;
    reason: string;
};
export type ExecutionTradeLocation = {
    label: ExecutionTradeLocationLabel;
    confidence: number;
    evidence: string[];
};
export type ExecutionRiskContext = {
    nearestInvalidationLevel: number | null;
    distanceToInvalidationPct: number | null;
    nearestTargetLevel: number | null;
    distanceToTargetPct: number | null;
    riskRewardToNearestTarget?: number | null;
    hasDefinedRisk: boolean;
    reason: string;
};
export type ExecutionMarketContextSnapshot = {
    symbol: string;
    executionId: string;
    executionTimestamp: number;
    side: ExecutionSide;
    price: number;
    shares?: number;
    asOfTimestamp: number;
    nearestSupport: ExecutionLevelSnapshot | null;
    nearestResistance: ExecutionLevelSnapshot | null;
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    marketContext?: MarketContextProfile;
    factsBundle?: MarketContextFactsBundle;
    tradeLocation: ExecutionTradeLocation;
    riskContext: ExecutionRiskContext;
    diagnostics: ExecutionContextDiagnostic[];
    safety: {
        noLookaheadApplied: true;
        partialCandlesExcluded: boolean;
        futureCandlesExcluded: boolean;
        levelOutputUnchanged: true;
        factsOnlyVWAP: true;
        shelvesFactsOnly: true;
    };
};
export type BuildExecutionMarketContextSnapshotRequest = {
    execution: ExecutionInput;
    levelOutput: LevelEngineOutput;
    sessionFacts?: SessionMarketFacts;
    volumeFacts?: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    marketContext?: MarketContextProfile;
    factsBundle?: MarketContextFactsBundle;
    nearLevelThresholdPct?: number;
    extendedFromVwapThresholdPct?: number;
};
export declare function findNearestSupportLevel(levelOutput: LevelEngineOutput, executionPrice: number): FinalLevelZone | null;
export declare function findNearestResistanceLevel(levelOutput: LevelEngineOutput, executionPrice: number): FinalLevelZone | null;
export declare function buildExecutionLevelSnapshot(zone: FinalLevelZone, executionPrice: number, roleAtExecution?: ExecutionLevelRoleAtExecution): ExecutionLevelSnapshot;
export declare function buildExecutionMarketContextSnapshot(request: BuildExecutionMarketContextSnapshotRequest): ExecutionMarketContextSnapshot;
//# sourceMappingURL=execution-market-context.d.ts.map