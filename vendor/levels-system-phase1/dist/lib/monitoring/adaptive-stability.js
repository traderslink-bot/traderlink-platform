const DEFAULT_STABILITY_CONFIG = {
    baseSmoothingFactor: 0.3,
    driftSmoothingFactor: 0.18,
    minSamplesForConfidence: 3,
    samplesForFullConfidence: 20,
    globalMinSamplesForConfidence: 5,
    globalSamplesForFullConfidence: 40,
    maxIncreasePerUpdate: 0.08,
    maxDecreasePerUpdate: 0.05,
    disableMinSamples: 12,
    disableWeakStreakThreshold: 3,
    protectedFloorMultiplier: 0.72,
    driftDampeningFactor: 0.65,
    driftDecreaseMultiplier: 0.75,
    driftDisableProtection: 1,
};
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function interpolateConfidence(sampleSize, minSamples, fullSamples) {
    if (sampleSize <= 0) {
        return 0;
    }
    if (sampleSize <= minSamples) {
        return round(clamp(sampleSize / Math.max(minSamples, 1), 0.05, 1));
    }
    if (sampleSize >= fullSamples) {
        return 1;
    }
    const range = Math.max(1, fullSamples - minSamples);
    return round(clamp((sampleSize - minSamples) / range, 0.05, 1));
}
function clampDelta(delta, maxIncrease, maxDecrease) {
    if (delta >= 0) {
        return Math.min(delta, maxIncrease);
    }
    return Math.max(delta, -maxDecrease);
}
function applyTransition(params) {
    const desiredDelta = (params.target - params.current) * params.confidence * params.smoothingFactor;
    const deltaApplied = clampDelta(desiredDelta, params.maxIncrease, params.maxDecrease);
    return {
        next: params.current + deltaApplied,
        deltaApplied,
    };
}
function createInitialState() {
    return {
        globalMultiplier: 1,
        eventTypes: {},
    };
}
export class AdaptiveStabilityLayer {
    scoringConfig;
    config;
    state;
    constructor(scoringConfig, config = DEFAULT_STABILITY_CONFIG, initialState) {
        this.scoringConfig = scoringConfig;
        this.config = config;
        this.state = initialState
            ? {
                globalMultiplier: initialState.globalMultiplier,
                eventTypes: { ...initialState.eventTypes },
            }
            : createInitialState();
    }
    getState() {
        return {
            globalMultiplier: this.state.globalMultiplier,
            eventTypes: Object.fromEntries(Object.entries(this.state.eventTypes).map(([eventType, value]) => [eventType, { ...value }])),
        };
    }
    applyTargets(targets) {
        const driftActive = targets.driftDeclining;
        const globalConfidence = interpolateConfidence(targets.globalSampleSize, this.config.globalMinSamplesForConfidence, this.config.globalSamplesForFullConfidence);
        const globalTransition = applyTransition({
            current: this.state.globalMultiplier,
            target: targets.targetGlobalMultiplier,
            confidence: globalConfidence,
            smoothingFactor: driftActive
                ? this.config.driftSmoothingFactor
                : this.config.baseSmoothingFactor,
            maxIncrease: this.config.maxIncreasePerUpdate * (driftActive ? this.config.driftDampeningFactor : 1),
            maxDecrease: this.config.maxDecreasePerUpdate *
                (driftActive ? this.config.driftDecreaseMultiplier : 1),
        });
        const nextState = {
            globalMultiplier: round(clamp(globalTransition.next, this.scoringConfig.minMultiplier, this.scoringConfig.maxMultiplier)),
            eventTypes: {},
        };
        const appliedEventTypeMultipliers = {};
        const disabledEventTypes = {};
        const eventTypeDiagnostics = {};
        for (const [eventType, target] of Object.entries(targets.eventTypeTargets)) {
            const previousState = this.state.eventTypes[eventType] ?? {
                eventType,
                multiplier: 1,
                disabled: false,
                disableReason: null,
                weakUpdateStreak: 0,
            };
            const confidence = interpolateConfidence(target.sampleSize, this.config.minSamplesForConfidence, this.config.samplesForFullConfidence);
            const transition = applyTransition({
                current: previousState.multiplier,
                target: target.targetMultiplier,
                confidence,
                smoothingFactor: driftActive
                    ? this.config.driftSmoothingFactor
                    : this.config.baseSmoothingFactor,
                maxIncrease: this.config.maxIncreasePerUpdate * (driftActive ? this.config.driftDampeningFactor : 1),
                maxDecrease: this.config.maxDecreasePerUpdate *
                    (driftActive ? this.config.driftDecreaseMultiplier : 1),
            });
            const requiredWeakStreak = this.config.disableWeakStreakThreshold +
                (driftActive ? this.config.driftDisableProtection : 0);
            const weakUpdateStreak = target.disableIntent ? previousState.weakUpdateStreak + 1 : 0;
            const disableEligible = target.disableIntent &&
                target.sampleSize >= this.config.disableMinSamples &&
                weakUpdateStreak >= requiredWeakStreak;
            const disableProtected = target.disableIntent && !disableEligible;
            const protectedFloor = disableProtected
                ? Math.max(this.scoringConfig.minMultiplier, this.config.protectedFloorMultiplier)
                : this.scoringConfig.minMultiplier;
            const nextMultiplier = round(clamp(transition.next, protectedFloor, this.scoringConfig.maxMultiplier));
            const disabled = disableEligible
                ? true
                : (!target.disableIntent && previousState.disabled ? false : previousState.disabled);
            const disableReason = disabled ? target.disableReason ?? "sustained_negative_expectancy" : null;
            nextState.eventTypes[eventType] = {
                eventType,
                multiplier: nextMultiplier,
                disabled,
                disableReason,
                weakUpdateStreak,
                lastTargetMultiplier: round(target.targetMultiplier),
                lastConfidence: confidence,
            };
            appliedEventTypeMultipliers[eventType] = nextMultiplier;
            disabledEventTypes[eventType] = {
                disabled,
                disableReason,
            };
            eventTypeDiagnostics[eventType] = {
                confidence,
                deltaApplied: round(transition.deltaApplied),
                disableProtected,
                weakUpdateStreak,
            };
        }
        this.state = nextState;
        return {
            state: this.getState(),
            appliedGlobalMultiplier: nextState.globalMultiplier,
            appliedEventTypeMultipliers,
            disabledEventTypes,
            diagnostics: {
                globalConfidence,
                globalDeltaApplied: round(globalTransition.deltaApplied),
                driftDampeningActive: driftActive,
                eventTypeDiagnostics,
            },
        };
    }
}
export function createAdaptiveStabilityLayer(scoringConfig, config, initialState) {
    return new AdaptiveStabilityLayer(scoringConfig, config, initialState);
}
export const DEFAULT_ADAPTIVE_STABILITY_CONFIG = DEFAULT_STABILITY_CONFIG;
