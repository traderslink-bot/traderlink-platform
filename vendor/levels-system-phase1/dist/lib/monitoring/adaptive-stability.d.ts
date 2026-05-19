import type { AdaptiveScoringConfig } from "./adaptive-scoring.js";
export type AdaptiveStabilityConfig = {
    baseSmoothingFactor: number;
    driftSmoothingFactor: number;
    minSamplesForConfidence: number;
    samplesForFullConfidence: number;
    globalMinSamplesForConfidence: number;
    globalSamplesForFullConfidence: number;
    maxIncreasePerUpdate: number;
    maxDecreasePerUpdate: number;
    disableMinSamples: number;
    disableWeakStreakThreshold: number;
    protectedFloorMultiplier: number;
    driftDampeningFactor: number;
    driftDecreaseMultiplier: number;
    driftDisableProtection: number;
};
export type AdaptiveEventTypeState = {
    eventType: string;
    multiplier: number;
    disabled: boolean;
    disableReason: string | null;
    weakUpdateStreak: number;
    lastTargetMultiplier?: number;
    lastConfidence?: number;
};
export type AdaptiveStabilityState = {
    globalMultiplier: number;
    eventTypes: Record<string, AdaptiveEventTypeState>;
};
export type AdaptiveEventTypeTarget = {
    eventType: string;
    targetMultiplier: number;
    disableIntent: boolean;
    disableReason: string | null;
    expectancy: number;
    sampleSize: number;
};
export type AdaptiveTargetState = {
    targetGlobalMultiplier: number;
    globalSampleSize: number;
    driftDeclining: boolean;
    driftDelta: number;
    eventTypeTargets: Record<string, AdaptiveEventTypeTarget>;
};
export type AdaptiveStabilityDiagnostics = {
    globalConfidence: number;
    globalDeltaApplied: number;
    driftDampeningActive: boolean;
    eventTypeDiagnostics: Record<string, {
        confidence: number;
        deltaApplied: number;
        disableProtected: boolean;
        weakUpdateStreak: number;
    }>;
};
export type AdaptiveStabilityResult = {
    state: AdaptiveStabilityState;
    appliedGlobalMultiplier: number;
    appliedEventTypeMultipliers: Record<string, number>;
    disabledEventTypes: Record<string, {
        disabled: boolean;
        disableReason: string | null;
    }>;
    diagnostics: AdaptiveStabilityDiagnostics;
};
export declare class AdaptiveStabilityLayer {
    private readonly scoringConfig;
    private readonly config;
    private state;
    constructor(scoringConfig: Pick<AdaptiveScoringConfig, "minMultiplier" | "maxMultiplier">, config?: AdaptiveStabilityConfig, initialState?: AdaptiveStabilityState);
    getState(): AdaptiveStabilityState;
    applyTargets(targets: AdaptiveTargetState): AdaptiveStabilityResult;
}
export declare function createAdaptiveStabilityLayer(scoringConfig: Pick<AdaptiveScoringConfig, "minMultiplier" | "maxMultiplier">, config?: AdaptiveStabilityConfig, initialState?: AdaptiveStabilityState): AdaptiveStabilityLayer;
export declare const DEFAULT_ADAPTIVE_STABILITY_CONFIG: AdaptiveStabilityConfig;
//# sourceMappingURL=adaptive-stability.d.ts.map