// 2026-04-14
// PURPOSE:
// Holds the first deterministic config values for the support/resistance lane.
// These values should stay factual defaults, not trading opinions.

export interface SupportResistanceConfig {
  minimumCandlesForStructuralContext: number;
  minimumPreTradeCandlesForPreEntryContext: number;
  defaultIncludedTimeframes: string[];
  ema9Length: number;
  ema20Length: number;
  tightPivotWindow: number;
  strictPivotWindow: number;
  mergeDistancePct: number;
  touchTolerancePct: number;
  openAirThresholdPct: number;
  stackedLevelClusterDistancePct: number;
  stackedLevelMinimumCount: number;
  reactionLookaheadCandles: number;
  strongReactionThresholdPct: number;
  moderateReactionThresholdPct: number;
  weakReactionThresholdPct: number;
}

export const SUPPORT_RESISTANCE_CONFIG: SupportResistanceConfig = {
  minimumCandlesForStructuralContext: 5,
  minimumPreTradeCandlesForPreEntryContext: 3,
  defaultIncludedTimeframes: [],
  ema9Length: 9,
  ema20Length: 20,
  tightPivotWindow: 2,
  strictPivotWindow: 3,
  mergeDistancePct: 0.5,
  touchTolerancePct: 0.35,
  openAirThresholdPct: 1.5,
  stackedLevelClusterDistancePct: 1.25,
  stackedLevelMinimumCount: 2,
  reactionLookaheadCandles: 3,
  strongReactionThresholdPct: 2,
  moderateReactionThresholdPct: 1,
  weakReactionThresholdPct: 0.5,
};
