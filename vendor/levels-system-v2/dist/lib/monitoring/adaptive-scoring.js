import { AdaptiveStabilityLayer, DEFAULT_ADAPTIVE_STABILITY_CONFIG, } from "./adaptive-stability.js";
const DEFAULT_CONFIG = {
    positiveExpectancyThreshold: 0.15,
    positiveExpectancyBoost: 0.12,
    negativeExpectancyPenalty: 0.18,
    disableBelowExpectancy: -0.25,
    globalPositiveThreshold: 0.1,
    globalPositiveBoost: 0.05,
    globalNegativePenalty: 0.08,
    driftPenalty: 0.06,
    minMultiplier: 0.4,
    maxMultiplier: 1.4,
};
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function resolveAdaptiveEventType(opportunity) {
    return opportunity.eventType ?? opportunity.type;
}
function normalizeExpectancy(expectancy) {
    return clamp(expectancy / 2, -1, 1);
}
function buildGlobalTargetMultiplier(summary, config) {
    let multiplier = 1;
    if (summary.expectancy > config.globalPositiveThreshold) {
        multiplier += config.globalPositiveBoost * normalizeExpectancy(summary.expectancy);
    }
    else if (summary.expectancy < 0) {
        multiplier -= config.globalNegativePenalty * Math.abs(normalizeExpectancy(summary.expectancy));
    }
    if (summary.performanceDrift.declining) {
        multiplier -= config.driftPenalty * Math.abs(normalizeExpectancy(summary.performanceDrift.delta));
    }
    return round(clamp(multiplier, config.minMultiplier, config.maxMultiplier));
}
function buildEventTypeTarget(eventType, summary, config) {
    const eventTypeSummary = summary.expectancyByEventType[eventType];
    const expectancy = eventTypeSummary?.expectancy ?? summary.expectancy;
    const sampleSize = eventTypeSummary?.totalEvaluated ?? 0;
    let targetMultiplier = 1;
    if (expectancy < 0) {
        targetMultiplier -= config.negativeExpectancyPenalty * Math.abs(normalizeExpectancy(expectancy));
    }
    else if (expectancy > config.positiveExpectancyThreshold) {
        targetMultiplier += config.positiveExpectancyBoost * normalizeExpectancy(expectancy);
    }
    return {
        eventType,
        targetMultiplier: round(clamp(targetMultiplier, config.minMultiplier, config.maxMultiplier)),
        disableIntent: expectancy <= config.disableBelowExpectancy,
        disableReason: expectancy <= config.disableBelowExpectancy ? "negative_expectancy" : null,
        expectancy: round(expectancy),
        sampleSize,
    };
}
export function buildAdaptiveTargetState(opportunities, summary, config = DEFAULT_CONFIG) {
    const eventTypes = new Set(opportunities.map((opportunity) => resolveAdaptiveEventType(opportunity)));
    return {
        targetGlobalMultiplier: buildGlobalTargetMultiplier(summary, config),
        globalSampleSize: summary.totalEvaluated,
        driftDeclining: summary.performanceDrift.declining,
        driftDelta: round(summary.performanceDrift.delta),
        eventTypeTargets: Object.fromEntries([...eventTypes].map((eventType) => [
            eventType,
            buildEventTypeTarget(eventType, summary, config),
        ])),
    };
}
export class AdaptiveScoringEngine {
    config;
    stabilityLayer;
    constructor(config = DEFAULT_CONFIG, stabilityConfig = DEFAULT_ADAPTIVE_STABILITY_CONFIG, initialState) {
        this.config = config;
        this.stabilityLayer = new AdaptiveStabilityLayer(config, stabilityConfig, initialState);
    }
    getState() {
        return this.stabilityLayer.getState();
    }
    adapt(opportunities, summary) {
        return this.adaptWithDiagnostics(opportunities, summary).opportunities;
    }
    adaptWithDiagnostics(opportunities, summary) {
        if (opportunities.length === 0) {
            return {
                opportunities: [],
                diagnostics: {
                    targetState: buildAdaptiveTargetState([], summary, this.config),
                    stability: this.stabilityLayer.applyTargets({
                        targetGlobalMultiplier: 1,
                        globalSampleSize: summary.totalEvaluated,
                        driftDeclining: summary.performanceDrift.declining,
                        driftDelta: summary.performanceDrift.delta,
                        eventTypeTargets: {},
                    }),
                },
            };
        }
        const targetState = buildAdaptiveTargetState(opportunities, summary, this.config);
        const stability = this.stabilityLayer.applyTargets(targetState);
        const adapted = opportunities
            .map((opportunity) => {
            const eventType = resolveAdaptiveEventType(opportunity);
            const eventTypeTarget = targetState.eventTypeTargets[eventType];
            const eventTypeExpectancy = eventTypeTarget?.expectancy ?? round(summary.expectancy);
            const eventTypeMultiplier = stability.appliedEventTypeMultipliers[eventType] ?? 1;
            const disabledState = stability.disabledEventTypes[eventType] ?? {
                disabled: false,
                disableReason: null,
            };
            const adaptiveMultiplier = clamp(stability.appliedGlobalMultiplier * eventTypeMultiplier, this.config.minMultiplier, this.config.maxMultiplier);
            return {
                ...opportunity,
                adaptiveScore: round(opportunity.score * adaptiveMultiplier),
                adaptiveMultiplier: round(adaptiveMultiplier),
                eventTypeExpectancy,
                disabled: disabledState.disabled,
                disableReason: disabledState.disableReason,
            };
        })
            .filter((opportunity) => !opportunity.disabled)
            .sort((left, right) => {
            if (right.adaptiveScore !== left.adaptiveScore) {
                return right.adaptiveScore - left.adaptiveScore;
            }
            if (right.normalizedScore !== left.normalizedScore) {
                return right.normalizedScore - left.normalizedScore;
            }
            return right.timestamp - left.timestamp;
        });
        return {
            opportunities: adapted,
            diagnostics: {
                targetState,
                stability,
            },
        };
    }
}
export { DEFAULT_CONFIG as DEFAULT_ADAPTIVE_SCORING_CONFIG };
