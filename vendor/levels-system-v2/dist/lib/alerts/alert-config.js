// 2026-04-14 10:18 PM America/Toronto
// Config for Phase 3 alert intelligence.
export const DEFAULT_ALERT_INTELLIGENCE_CONFIG = {
    eventBaseScores: {
        level_touch: 8,
        breakout: 32,
        breakdown: 32,
        rejection: 26,
        fake_breakout: 38,
        fake_breakdown: 38,
        reclaim: 30,
        compression: 12,
    },
    strengthLabelScores: {
        weak: 0,
        moderate: 8,
        strong: 16,
        major: 24,
    },
    timeframeConfluenceBonus: 4,
    weakZonePenalty: 10,
    weak5mOnlyPenalty: 12,
    notifyThreshold: 32,
    severityThresholds: {
        critical: 64,
        high: 48,
        medium: 28,
    },
    confidenceThresholds: {
        high: 52,
        medium: 32,
    },
    freshnessScores: {
        fresh: 8,
        aging: 3,
        stale: -6,
    },
    originScores: {
        canonical: 0,
        extension_inventory: -4,
        promoted_extension: 6,
    },
    ladderPositionScores: {
        inner: 0,
        outermost: 8,
        extension: 5,
    },
    remapScores: {
        new: 0,
        preserved: 1,
        merged: 2,
        split: 3,
        replaced: 4,
    },
    recentRefreshBonus: 3,
    promotedExtensionBonus: 4,
    dataQualityPenalty: 12,
    lowValueInnerTouchPenalty: 10,
    lowValueInnerCompressionPenalty: 14,
    structureStrengthScale: 10,
    postingWindowsMs: {
        zone_context: 5 * 60 * 1000,
        bullish_resolution: 8 * 60 * 1000,
        bearish_resolution: 8 * 60 * 1000,
        failure: 8 * 60 * 1000,
    },
    materialScoreDeltaForRepost: 8,
};
