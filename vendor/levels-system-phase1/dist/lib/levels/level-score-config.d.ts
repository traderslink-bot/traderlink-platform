export declare const LEVEL_SCORE_CONFIG: {
    readonly structuralWeights: {
        readonly timeframe: 20;
        readonly touches: 15;
        readonly reactionQuality: 15;
        readonly reactionMagnitude: 10;
        readonly volume: 10;
        readonly cleanliness: 10;
        readonly roleFlip: 8;
        readonly defense: 8;
        readonly recency: 8;
    };
    readonly penalties: {
        readonly overtestMax: 10;
        readonly clusterMax: 8;
    };
    readonly activeWeights: {
        readonly distanceToPrice: 35;
        readonly freshReaction: 20;
        readonly intradayPressure: 20;
        readonly recentVolumeActivity: 15;
        readonly currentInteraction: 10;
    };
    readonly combineWeights: {
        readonly structural: 0.75;
        readonly active: 0.25;
    };
    readonly touchThresholds: {
        readonly minReactionMovePct: 0.015;
        readonly minVolumeRatioForMeaningfulReaction: 1.2;
        readonly maxTouchDistanceIntoZonePct: 0.0025;
        readonly reactionLookaheadBars: 8;
        readonly closeAwayBufferPct: 0.001;
        readonly rollingVolumeLookbackBars: 10;
    };
    readonly zoneRules: {
        readonly sub2DollarZoneWidthPct: 0.0035;
        readonly sub10DollarZoneWidthPct: 0.0025;
        readonly defaultZoneWidthPct: 0.0015;
    };
    readonly clustering: {
        readonly maxRepresentativeDistancePct: 0.004;
        readonly zoneOverlapThreshold: 0.6;
    };
    readonly recencyBars: {
        readonly fresh: 3;
        readonly recent: 8;
        readonly warm: 15;
        readonly aging: 30;
    };
    readonly stateThresholds: {
        readonly respectedMeaningfulTouches: 2;
        readonly heavilyTestedTouchCount: 6;
        readonly weakenedTouchCount: 5;
        readonly shallowReactionPct: 0.018;
    };
    readonly activeThresholds: {
        readonly strongDistancePct: 0.005;
        readonly moderateDistancePct: 0.01;
        readonly nearDistancePct: 0.02;
        readonly localDistancePct: 0.03;
        readonly farDistancePct: 0.05;
        readonly currentInteractionDistancePct: 0.0025;
        readonly recentVolumeHighRatio: 1.5;
        readonly pressureLookbackBars: 8;
    };
};
export type LevelScoreConfig = typeof LEVEL_SCORE_CONFIG;
//# sourceMappingURL=level-score-config.d.ts.map