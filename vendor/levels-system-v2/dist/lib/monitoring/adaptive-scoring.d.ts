import { type AdaptiveStabilityConfig, type AdaptiveStabilityResult, type AdaptiveStabilityState, type AdaptiveTargetState } from "./adaptive-stability.js";
import type { RankedOpportunity } from "./opportunity-engine.js";
import type { OpportunityEvaluationSummary } from "./opportunity-evaluator.js";
export type AdaptiveScoringConfig = {
    positiveExpectancyThreshold: number;
    positiveExpectancyBoost: number;
    negativeExpectancyPenalty: number;
    disableBelowExpectancy: number;
    globalPositiveThreshold: number;
    globalPositiveBoost: number;
    globalNegativePenalty: number;
    driftPenalty: number;
    minMultiplier: number;
    maxMultiplier: number;
};
export type AdaptedOpportunity = RankedOpportunity & {
    adaptiveScore: number;
    adaptiveMultiplier: number;
    eventTypeExpectancy: number;
    disabled: boolean;
    disableReason: string | null;
};
export type AdaptiveScoringDiagnostics = {
    targetState: AdaptiveTargetState;
    stability: AdaptiveStabilityResult;
};
export type AdaptiveScoringResult = {
    opportunities: AdaptedOpportunity[];
    diagnostics: AdaptiveScoringDiagnostics;
};
declare const DEFAULT_CONFIG: AdaptiveScoringConfig;
export declare function buildAdaptiveTargetState(opportunities: RankedOpportunity[], summary: OpportunityEvaluationSummary, config?: AdaptiveScoringConfig): AdaptiveTargetState;
export declare class AdaptiveScoringEngine {
    private readonly config;
    private readonly stabilityLayer;
    constructor(config?: AdaptiveScoringConfig, stabilityConfig?: AdaptiveStabilityConfig, initialState?: AdaptiveStabilityState);
    getState(): AdaptiveStabilityState;
    adapt(opportunities: RankedOpportunity[], summary: OpportunityEvaluationSummary): AdaptedOpportunity[];
    adaptWithDiagnostics(opportunities: RankedOpportunity[], summary: OpportunityEvaluationSummary): AdaptiveScoringResult;
}
export { DEFAULT_CONFIG as DEFAULT_ADAPTIVE_SCORING_CONFIG };
//# sourceMappingURL=adaptive-scoring.d.ts.map