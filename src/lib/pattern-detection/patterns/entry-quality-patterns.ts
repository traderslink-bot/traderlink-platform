// =========================
// 2026-04-12 05:08 PM America/Toronto
// ENTRY QUALITY PATTERNS
// =========================
//
// PURPOSE:
// Detects higher-order entry quality structure from PatternInput.
//
// IMPORTANT:
// These are composite patterns.
// They combine entry positioning with remaining opportunity and post-entry pain.
//
// THESE PATTERNS DO NOT:
// - assign scores
// - generate coaching
// - claim specific market-structure concepts like breakout confirmation
//
// FUTURE EXPANSION MAY INCLUDE:
// - richer breakout/pullback/reclaim-aware entry patterns
// - stronger dependency metadata linking atomics to composites
// - suppression or prioritization rules for overlapping entry patterns
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

function getDirectionNormalizedRecentNetMovePct(args: {
  tradeDirection: "long" | "short";
  recentNetMovePct: number | null;
}): number | null {
  const { tradeDirection, recentNetMovePct } = args;

  if (recentNetMovePct === null) {
    return null;
  }

  return tradeDirection === "long"
    ? recentNetMovePct
    : -recentNetMovePct;
}

function getPreEntryDirectionalContext(args: {
  tradeDirection: "long" | "short";
  recentRunUpPct: number | null;
  recentDropPct: number | null;
  bullishCandles: number;
  bearishCandles: number;
  recentNetMovePct: number | null;
}) {
  const {
    tradeDirection,
    recentRunUpPct,
    recentDropPct,
    bullishCandles,
    bearishCandles,
    recentNetMovePct,
  } = args;

  if (tradeDirection === "long") {
    return {
      favorableMovePct: recentRunUpPct,
      adverseMovePct: recentDropPct,
      directionalCandles: bullishCandles,
      counterDirectionalCandles: bearishCandles,
      normalizedNetMovePct: getDirectionNormalizedRecentNetMovePct({
        tradeDirection,
        recentNetMovePct,
      }),
    };
  }

  return {
    favorableMovePct: recentDropPct,
    adverseMovePct: recentRunUpPct,
    directionalCandles: bearishCandles,
    counterDirectionalCandles: bullishCandles,
    normalizedNetMovePct: getDirectionNormalizedRecentNetMovePct({
      tradeDirection,
      recentNetMovePct,
    }),
  };
}

interface FavorableExtensionEntryPatternConfig {
  id: string;
  name: string;
  structuralLevel: PatternDefinition["structuralLevel"];
  rangeThresholdLabel: string;
  rangeThresholdValue: number;
  rangeComparator: "min" | "max";
  captureThresholdLabel: string;
  captureThresholdValue: number;
  captureComparator: "min" | "max";
  adverseThresholdLabel: string;
  adverseThresholdValue: number;
  adverseComparator: "min" | "max";
  directionalMoveThresholdLabel: string;
  directionalMoveThresholdValue: number;
  netMoveMinThresholdLabel: string;
  netMoveMinThresholdValue: number;
  netMoveMaxThresholdLabel?: string;
  netMoveMaxThresholdValue?: number;
}

function satisfiesThreshold(args: {
  value: number;
  comparator: "min" | "max";
  threshold: number;
}): boolean {
  const { value, comparator, threshold } = args;
  return comparator === "min" ? value >= threshold : value <= threshold;
}

function createFavorableExtensionEntryPattern(
  config: FavorableExtensionEntryPatternConfig,
): PatternDefinition {
  return {
    id: config.id,
    name: config.name,
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: config.structuralLevel,

    evaluate: (input) => {
      const rangePosition = input.entryContext.firstEntryPricePositionInTradeRangePct;
      const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
      const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
      const {
        favorableMovePct,
        directionalCandles,
        counterDirectionalCandles,
        normalizedNetMovePct,
      } = getPreEntryDirectionalContext({
        tradeDirection: input.tradeDirection,
        recentRunUpPct: input.entryContext.firstEntryRecentRunUpPctBeforeEntry,
        recentDropPct: input.entryContext.firstEntryRecentDropPctBeforeEntry,
        bullishCandles: input.entryContext.firstEntryBullishCandlesBeforeEntryCount,
        bearishCandles: input.entryContext.firstEntryBearishCandlesBeforeEntryCount,
        recentNetMovePct: input.entryContext.firstEntryRecentNetMovePctBeforeEntry,
      });

      const directionalCandleEdge =
        THRESHOLDS.ENTRY_CONTEXT.RECENT_DIRECTIONAL_CANDLE_EDGE;

      const matched =
        rangePosition !== null &&
        capturedMfe !== null &&
        adverseAfterEntry !== null &&
        favorableMovePct !== null &&
        normalizedNetMovePct !== null &&
        satisfiesThreshold({
          value: rangePosition,
          comparator: config.rangeComparator,
          threshold: config.rangeThresholdValue,
        }) &&
        satisfiesThreshold({
          value: capturedMfe,
          comparator: config.captureComparator,
          threshold: config.captureThresholdValue,
        }) &&
        satisfiesThreshold({
          value: adverseAfterEntry,
          comparator: config.adverseComparator,
          threshold: config.adverseThresholdValue,
        }) &&
        favorableMovePct >= config.directionalMoveThresholdValue &&
        normalizedNetMovePct >= config.netMoveMinThresholdValue &&
        (config.netMoveMaxThresholdValue === undefined ||
          normalizedNetMovePct <= config.netMoveMaxThresholdValue) &&
        directionalCandles >=
          counterDirectionalCandles + directionalCandleEdge;

      return {
        matched,
        evidence: {
          tradeDirection: input.tradeDirection,
          firstEntryPricePositionInTradeRangePct: rangePosition,
          firstEntryCapturedPercentOfTradeMfe: capturedMfe,
          firstEntryToWorstMovePct: adverseAfterEntry,
          favorableMovePctBeforeEntry: favorableMovePct,
          normalizedRecentNetMovePctBeforeEntry: normalizedNetMovePct,
          directionalCandlesBeforeEntryCount: directionalCandles,
          counterDirectionalCandlesBeforeEntryCount:
            counterDirectionalCandles,
        },
        thresholdsUsed: {
          [config.rangeThresholdLabel]: config.rangeThresholdValue,
          [config.captureThresholdLabel]: config.captureThresholdValue,
          [config.adverseThresholdLabel]: config.adverseThresholdValue,
          [config.directionalMoveThresholdLabel]:
            config.directionalMoveThresholdValue,
          [config.netMoveMinThresholdLabel]: config.netMoveMinThresholdValue,
          ...(config.netMoveMaxThresholdLabel !== undefined &&
          config.netMoveMaxThresholdValue !== undefined
            ? {
                [config.netMoveMaxThresholdLabel]:
                  config.netMoveMaxThresholdValue,
              }
            : {}),
          directionalCandleEdge,
        },
      };
    },
  };
}

// =========================
// ADVANTAGED ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry was low enough in the trade range
// - substantial move still remained after entry
// - adverse movement after entry stayed controlled
//
export const ADVANTAGED_ENTRY_STRUCTURE: PatternDefinition = {
  id: "advantaged_entry_structure",
  name: "Advantaged Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const rangePosition = input.entryContext.firstEntryPricePositionInTradeRangePct;
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;

    const maxRangePosition =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_RANGE_POSITION;
    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;

    const matched =
      rangePosition !== null &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      rangePosition <= maxRangePosition &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry;

    return {
      matched,
      evidence: {
        firstEntryPricePositionInTradeRangePct: rangePosition,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        maxRangePosition,
        minCapturedMfe,
        maxAdverseAfterEntry,
      },
    };
  },
};

// =========================
// DISADVANTAGED ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry was high in the trade range
// - limited move remained after entry
// - adverse movement after entry was meaningful
//
export const DISADVANTAGED_ENTRY_STRUCTURE: PatternDefinition = {
  id: "disadvantaged_entry_structure",
  name: "Disadvantaged Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const rangePosition = input.entryContext.firstEntryPricePositionInTradeRangePct;
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;

    const minRangePosition =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_RANGE_POSITION;
    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT;

    const matched =
      rangePosition !== null &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      rangePosition >= minRangePosition &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry;

    return {
      matched,
      evidence: {
        firstEntryPricePositionInTradeRangePct: rangePosition,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        minRangePosition,
        maxCapturedMfe,
        minAdverseAfterEntry,
      },
    };
  },
};

// =========================
// EFFICIENT ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - a strong portion of the move remained after entry
// - post-entry pain stayed controlled
//
// NOTE:
// This is intentionally broader than advantaged_entry_structure.
// It focuses more on outcome efficiency after entry, less on exact range position.
//
export const EFFICIENT_ENTRY_STRUCTURE: PatternDefinition = {
  id: "efficient_entry_structure",
  name: "Efficient Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;

    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.EFFICIENT_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.EFFICIENT_MAX_ADVERSE_AFTER_ENTRY_PCT;

    const matched =
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry;

    return {
      matched,
      evidence: {
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        minCapturedMfe,
        maxAdverseAfterEntry,
      },
    };
  },
};

// =========================
// INEFFICIENT ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - limited move remained after entry
// - post-entry pain was meaningful
//
// NOTE:
// This is intentionally broader than disadvantaged_entry_structure.
// It focuses on weak opportunity-to-pain structure after entry.
//
export const INEFFICIENT_ENTRY_STRUCTURE: PatternDefinition = {
  id: "inefficient_entry_structure",
  name: "Inefficient Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.INEFFICIENT_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.INEFFICIENT_MIN_ADVERSE_AFTER_ENTRY_PCT;

    const matched =
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry;

    return {
      matched,
      evidence: {
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
      },
    };
  },
};

// =========================
// LATE FAVORABLE EXTENSION ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry happened late in the eventual trade range
// - only limited favorable move remained after entry
// - meaningful pain followed after entry
// - pre-entry context had already moved in the trade's favorable direction
//
// IMPORTANT:
// This stays direction-aware:
// - for longs, the favorable pre-entry move is a recent run-up
// - for shorts, the favorable pre-entry move is a recent drop
//
export const LATE_FAVORABLE_EXTENSION_ENTRY_STRUCTURE: PatternDefinition = {
  ...createFavorableExtensionEntryPattern({
    id: "late_favorable_extension_entry_structure",
    name: "Late Favorable Extension Entry Structure",
    structuralLevel: "structural_composite",
    rangeThresholdLabel: "minRangePosition",
    rangeThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_RANGE_POSITION,
    rangeComparator: "min",
    captureThresholdLabel: "maxCapturedMfe",
    captureThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE,
    captureComparator: "max",
    adverseThresholdLabel: "minAdverseAfterEntry",
    adverseThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT,
    adverseComparator: "min",
    directionalMoveThresholdLabel: "minDirectionalMovePct",
    directionalMoveThresholdValue: THRESHOLDS.ENTRY_CONTEXT.RECENT_RUN_UP_MIN_PCT,
    netMoveMinThresholdLabel: "minNetMovePct",
    netMoveMinThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.LATE_FAVORABLE_EXTENSION_MIN_NET_MOVE_PCT,
  }),
};

// =========================
// CONSTRUCTIVE PULLBACK ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry happened low in the eventual trade range
// - strong favorable move still remained after entry
// - post-entry pain stayed controlled
// - pre-entry context had recently moved against the trade direction
//
// IMPORTANT:
// This stays direction-aware:
// - for longs, the adverse pre-entry move is a recent drop
// - for shorts, the adverse pre-entry move is a recent run-up
//
export const CONSTRUCTIVE_PULLBACK_ENTRY_STRUCTURE: PatternDefinition = {
  id: "constructive_pullback_entry_structure",
  name: "Constructive Pullback Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const rangePosition = input.entryContext.firstEntryPricePositionInTradeRangePct;
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const {
      adverseMovePct,
      directionalCandles,
      counterDirectionalCandles,
      normalizedNetMovePct,
    } = getPreEntryDirectionalContext({
      tradeDirection: input.tradeDirection,
      recentRunUpPct: input.entryContext.firstEntryRecentRunUpPctBeforeEntry,
      recentDropPct: input.entryContext.firstEntryRecentDropPctBeforeEntry,
      bullishCandles: input.entryContext.firstEntryBullishCandlesBeforeEntryCount,
      bearishCandles: input.entryContext.firstEntryBearishCandlesBeforeEntryCount,
      recentNetMovePct: input.entryContext.firstEntryRecentNetMovePctBeforeEntry,
    });

    const maxRangePosition =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_RANGE_POSITION;
    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;
    const minCounterMovePct =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DROP_MIN_PCT;
    const maxNetMovePct =
      THRESHOLDS.ENTRY_QUALITY.CONSTRUCTIVE_PULLBACK_MAX_NET_MOVE_PCT;
    const directionalCandleEdge =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DIRECTIONAL_CANDLE_EDGE;

    const matched =
      rangePosition !== null &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      adverseMovePct !== null &&
      normalizedNetMovePct !== null &&
      rangePosition <= maxRangePosition &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry &&
      adverseMovePct >= minCounterMovePct &&
      normalizedNetMovePct <= maxNetMovePct &&
      counterDirectionalCandles >=
        directionalCandles + directionalCandleEdge;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryPricePositionInTradeRangePct: rangePosition,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        adverseMovePctBeforeEntry: adverseMovePct,
        normalizedRecentNetMovePctBeforeEntry: normalizedNetMovePct,
        directionalCandlesBeforeEntryCount: directionalCandles,
        counterDirectionalCandlesBeforeEntryCount:
          counterDirectionalCandles,
      },
      thresholdsUsed: {
        maxRangePosition,
        minCapturedMfe,
        maxAdverseAfterEntry,
        minCounterMovePct,
        maxNetMovePct,
        directionalCandleEdge,
      },
    };
  },
};

// =========================
// DISCIPLINED FAVORABLE EXTENSION ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a direction-aware favorable extension
// - despite that extension, the eventual entry still retained strong structure
// - this is the constructive continuation counterpart to the late extension subtype
//
export const DISCIPLINED_FAVORABLE_EXTENSION_ENTRY_STRUCTURE: PatternDefinition =
  {
    ...createFavorableExtensionEntryPattern({
      id: "disciplined_favorable_extension_entry_structure",
      name: "Disciplined Favorable Extension Entry Structure",
      structuralLevel: "structural_composite",
      rangeThresholdLabel: "maxRangePosition",
      rangeThresholdValue: THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_RANGE_POSITION,
      rangeComparator: "max",
      captureThresholdLabel: "minCapturedMfe",
      captureThresholdValue: THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE,
      captureComparator: "min",
      adverseThresholdLabel: "maxAdverseAfterEntry",
      adverseThresholdValue:
        THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT,
      adverseComparator: "max",
      directionalMoveThresholdLabel: "minDirectionalMovePct",
      directionalMoveThresholdValue:
        THRESHOLDS.ENTRY_CONTEXT.RECENT_RUN_UP_MIN_PCT,
      netMoveMinThresholdLabel: "minNetMovePct",
      netMoveMinThresholdValue:
        THRESHOLDS.ENTRY_QUALITY.LATE_FAVORABLE_EXTENSION_MIN_NET_MOVE_PCT,
    }),
  };

// =========================
// BREAKOUT ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a real favorable extension in the trade direction
// - the extension was measured rather than extremely stretched
// - the eventual entry still retained strong structure
//
// IMPORTANT:
// This is the first explicit named breakout-style entry family.
// It still uses only the structural facts currently available in Layer 1.
//
export const BREAKOUT_ENTRY_STRUCTURE: PatternDefinition = {
  ...createFavorableExtensionEntryPattern({
    id: "breakout_entry_structure",
    name: "Breakout Entry Structure",
    structuralLevel: "structural_composite",
    rangeThresholdLabel: "maxRangePosition",
    rangeThresholdValue: THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_RANGE_POSITION,
    rangeComparator: "max",
    captureThresholdLabel: "minCapturedMfe",
    captureThresholdValue: THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE,
    captureComparator: "min",
    adverseThresholdLabel: "maxAdverseAfterEntry",
    adverseThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT,
    adverseComparator: "max",
    directionalMoveThresholdLabel: "minDirectionalMovePct",
    directionalMoveThresholdValue: THRESHOLDS.ENTRY_CONTEXT.RECENT_RUN_UP_MIN_PCT,
    netMoveMinThresholdLabel: "minNetMovePct",
    netMoveMinThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.BREAKOUT_ENTRY_MIN_NET_MOVE_PCT,
    netMoveMaxThresholdLabel: "maxNetMovePct",
    netMoveMaxThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.BREAKOUT_ENTRY_MAX_NET_MOVE_PCT,
  }),
};

// =========================
// MEASURED FAVORABLE EXTENSION ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a direction-aware favorable extension
// - the extension was real, but not yet extremely stretched
// - the eventual entry still retained strong structure
// - this is the cleaner continuation counterpart above the broad disciplined extension subtype
//
export const MEASURED_FAVORABLE_EXTENSION_ENTRY_STRUCTURE: PatternDefinition = {
  ...createFavorableExtensionEntryPattern({
    id: "measured_favorable_extension_entry_structure",
    name: "Measured Favorable Extension Entry Structure",
    structuralLevel: "structural_composite",
    rangeThresholdLabel: "maxRangePosition",
    rangeThresholdValue: THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_RANGE_POSITION,
    rangeComparator: "max",
    captureThresholdLabel: "minCapturedMfe",
    captureThresholdValue: THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE,
    captureComparator: "min",
    adverseThresholdLabel: "maxAdverseAfterEntry",
    adverseThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT,
    adverseComparator: "max",
    directionalMoveThresholdLabel: "minDirectionalMovePct",
    directionalMoveThresholdValue: THRESHOLDS.ENTRY_CONTEXT.RECENT_RUN_UP_MIN_PCT,
    netMoveMinThresholdLabel: "minNetMovePct",
    netMoveMinThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.LATE_FAVORABLE_EXTENSION_MIN_NET_MOVE_PCT,
    netMoveMaxThresholdLabel: "maxNetMovePct",
    netMoveMaxThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.MEASURED_FAVORABLE_EXTENSION_MAX_NET_MOVE_PCT,
  }),
};

// =========================
// OVEREXTENDED CHASE ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a strong direction-aware favorable extension
// - the entry still arrived very high in the eventual trade range
// - limited favorable move remained and post-entry pain was meaningful
// - this is the sharper chase-style extreme above the broader late extension subtype
//
export const OVEREXTENDED_CHASE_ENTRY_STRUCTURE: PatternDefinition = {
  ...createFavorableExtensionEntryPattern({
    id: "overextended_chase_entry_structure",
    name: "Overextended Chase Entry Structure",
    structuralLevel: "structural_composite",
    rangeThresholdLabel: "minRangePosition",
    rangeThresholdValue: THRESHOLDS.ENTRY_CONTEXT.NEAR_HIGH_MIN_POSITION,
    rangeComparator: "min",
    captureThresholdLabel: "maxCapturedMfe",
    captureThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE,
    captureComparator: "max",
    adverseThresholdLabel: "minAdverseAfterEntry",
    adverseThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT,
    adverseComparator: "min",
    directionalMoveThresholdLabel: "minDirectionalMovePct",
    directionalMoveThresholdValue: THRESHOLDS.ENTRY_CONTEXT.RECENT_RUN_UP_MIN_PCT,
    netMoveMinThresholdLabel: "minNetMovePct",
    netMoveMinThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.OVEREXTENDED_CHASE_MIN_NET_MOVE_PCT,
  }),
};

// =========================
// BREAKOUT CHASE ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a strong favorable extension
// - the entry arrived in a structurally stretched spot
// - limited move remained and post-entry pain was meaningful
//
export const BREAKOUT_CHASE_ENTRY_STRUCTURE: PatternDefinition = {
  ...createFavorableExtensionEntryPattern({
    id: "breakout_chase_entry_structure",
    name: "Breakout Chase Entry Structure",
    structuralLevel: "structural_composite",
    rangeThresholdLabel: "minRangePosition",
    rangeThresholdValue: THRESHOLDS.ENTRY_CONTEXT.NEAR_HIGH_MIN_POSITION,
    rangeComparator: "min",
    captureThresholdLabel: "maxCapturedMfe",
    captureThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE,
    captureComparator: "max",
    adverseThresholdLabel: "minAdverseAfterEntry",
    adverseThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT,
    adverseComparator: "min",
    directionalMoveThresholdLabel: "minDirectionalMovePct",
    directionalMoveThresholdValue: THRESHOLDS.ENTRY_CONTEXT.RECENT_RUN_UP_MIN_PCT,
    netMoveMinThresholdLabel: "minNetMovePct",
    netMoveMinThresholdValue:
      THRESHOLDS.ENTRY_QUALITY.BREAKOUT_ENTRY_MIN_NET_MOVE_PCT,
  }),
};

// =========================
// FAILED BREAKOUT ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a measured favorable extension in the trade direction
// - but the eventual structure after entry stayed weak
// - this is the first explicit named failed-breakout-style entry branch
//
export const FAILED_BREAKOUT_ENTRY_STRUCTURE: PatternDefinition = {
  id: "failed_breakout_entry_structure",
  name: "Failed Breakout Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const rangePosition = input.entryContext.firstEntryPricePositionInTradeRangePct;
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const {
      favorableMovePct,
      directionalCandles,
      counterDirectionalCandles,
      normalizedNetMovePct,
    } = getPreEntryDirectionalContext({
      tradeDirection: input.tradeDirection,
      recentRunUpPct: input.entryContext.firstEntryRecentRunUpPctBeforeEntry,
      recentDropPct: input.entryContext.firstEntryRecentDropPctBeforeEntry,
      bullishCandles: input.entryContext.firstEntryBullishCandlesBeforeEntryCount,
      bearishCandles: input.entryContext.firstEntryBearishCandlesBeforeEntryCount,
      recentNetMovePct: input.entryContext.firstEntryRecentNetMovePctBeforeEntry,
    });

    const minDirectionalMovePct =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_RUN_UP_MIN_PCT;
    const minNetMovePct =
      THRESHOLDS.ENTRY_QUALITY.BREAKOUT_ENTRY_MIN_NET_MOVE_PCT;
    const maxNetMovePct =
      THRESHOLDS.ENTRY_QUALITY.BREAKOUT_ENTRY_MAX_NET_MOVE_PCT;
    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.FAILED_BREAKOUT_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY
        .FAILED_BREAKOUT_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const directionalCandleEdge =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DIRECTIONAL_CANDLE_EDGE;

    const matched =
      rangePosition !== null &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      favorableMovePct !== null &&
      normalizedNetMovePct !== null &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      favorableMovePct >= minDirectionalMovePct &&
      normalizedNetMovePct >= minNetMovePct &&
      normalizedNetMovePct <= maxNetMovePct &&
      directionalCandles >=
        counterDirectionalCandles + directionalCandleEdge;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryPricePositionInTradeRangePct: rangePosition,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        favorableMovePctBeforeEntry: favorableMovePct,
        normalizedRecentNetMovePctBeforeEntry: normalizedNetMovePct,
        directionalCandlesBeforeEntryCount: directionalCandles,
        counterDirectionalCandlesBeforeEntryCount:
          counterDirectionalCandles,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        minDirectionalMovePct,
        minNetMovePct,
        maxNetMovePct,
        directionalCandleEdge,
      },
    };
  },
};

// =========================
// RECLAIM ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - pre-entry price first broke through a recent reference level against the trade
// - price then reclaimed that reference and held it into entry
// - the eventual entry stayed close enough to the reclaimed level
// - post-entry structure still remained constructive
//
// IMPORTANT:
// This is intentionally the first reclaim-style family only.
// It is grounded in a recent pre-entry reference reclaim, not an arbitrary
// market-structure reclaim that Layer 1 cannot yet prove cleanly.
//
export const RECLAIM_ENTRY_STRUCTURE: PatternDefinition = {
  id: "reclaim_entry_structure",
  name: "Reclaim Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const breakDepthPct = input.entryContext.firstEntryRecentReferenceBreakDepthPctBeforeEntry;
    const confirmationCandles =
      input.entryContext.firstEntryRecentReferenceConfirmationCandlesCount;
    const distanceFromReference =
      input.entryContext.firstEntryDistanceFromRecentReferenceLevelPct;
    const hadReclaim = input.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry;
    const heldIntoEntry =
      input.entryContext.firstEntryRecentReferenceReclaimHeldIntoEntry;

    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;
    const minReferenceBreakDepthPct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_REFERENCE_BREAK_DEPTH_PCT;
    const maxDistanceFromReferencePct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MAX_DISTANCE_FROM_REFERENCE_PCT;
    const minConfirmationCandles =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_CONFIRMATION_CANDLES;

    const matched =
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      breakDepthPct !== null &&
      distanceFromReference !== null &&
      hadReclaim &&
      heldIntoEntry &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry &&
      breakDepthPct >= minReferenceBreakDepthPct &&
      distanceFromReference <= maxDistanceFromReferencePct &&
      confirmationCandles >= minConfirmationCandles;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: breakDepthPct,
        firstEntryRecentReferenceConfirmationCandlesCount:
          confirmationCandles,
        firstEntryDistanceFromRecentReferenceLevelPct: distanceFromReference,
        firstEntryHadRecentReferenceReclaimBeforeEntry: hadReclaim,
        firstEntryRecentReferenceReclaimHeldIntoEntry: heldIntoEntry,
        firstEntryRecentReferenceLevelBeforeEntry:
          input.entryContext.firstEntryRecentReferenceLevelBeforeEntry,
      },
      thresholdsUsed: {
        minCapturedMfe,
        maxAdverseAfterEntry,
        minReferenceBreakDepthPct,
        maxDistanceFromReferencePct,
        minConfirmationCandles,
      },
    };
  },
};

// =========================
// FAILED RECLAIM ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - pre-entry price reclaimed a recent reference level after first breaking it
// - the eventual entry still happened near that reclaimed level
// - despite that setup recovery, post-entry structure stayed weak
//
export const FAILED_RECLAIM_ENTRY_STRUCTURE: PatternDefinition = {
  id: "failed_reclaim_entry_structure",
  name: "Failed Reclaim Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const breakDepthPct = input.entryContext.firstEntryRecentReferenceBreakDepthPctBeforeEntry;
    const confirmationCandles =
      input.entryContext.firstEntryRecentReferenceConfirmationCandlesCount;
    const distanceFromReference =
      input.entryContext.firstEntryDistanceFromRecentReferenceLevelPct;
    const hadReclaim = input.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry;
    const heldIntoEntry =
      input.entryContext.firstEntryRecentReferenceReclaimHeldIntoEntry;

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.FAILED_RECLAIM_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.FAILED_RECLAIM_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const minReferenceBreakDepthPct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_REFERENCE_BREAK_DEPTH_PCT;
    const maxDistanceFromReferencePct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MAX_DISTANCE_FROM_REFERENCE_PCT;
    const minConfirmationCandles =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_CONFIRMATION_CANDLES;

    const matched =
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      breakDepthPct !== null &&
      distanceFromReference !== null &&
      hadReclaim &&
      heldIntoEntry &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      breakDepthPct >= minReferenceBreakDepthPct &&
      distanceFromReference <= maxDistanceFromReferencePct &&
      confirmationCandles >= minConfirmationCandles;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: breakDepthPct,
        firstEntryRecentReferenceConfirmationCandlesCount:
          confirmationCandles,
        firstEntryDistanceFromRecentReferenceLevelPct: distanceFromReference,
        firstEntryHadRecentReferenceReclaimBeforeEntry: hadReclaim,
        firstEntryRecentReferenceReclaimHeldIntoEntry: heldIntoEntry,
        firstEntryRecentReferenceLevelBeforeEntry:
          input.entryContext.firstEntryRecentReferenceLevelBeforeEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        minReferenceBreakDepthPct,
        maxDistanceFromReferencePct,
        minConfirmationCandles,
      },
    };
  },
};

// =========================
// MEAN REVERSION ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a meaningful countertrend move against the trade
// - that counter move reclaimed a recent reference level before entry
// - entry stayed near the reclaimed reference
// - despite the deeper reversal context, post-entry structure remained strong
//
export const MEAN_REVERSION_ENTRY_STRUCTURE: PatternDefinition = {
  id: "mean_reversion_entry_structure",
  name: "Mean Reversion Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const breakDepthPct = input.entryContext.firstEntryRecentReferenceBreakDepthPctBeforeEntry;
    const confirmationCandles =
      input.entryContext.firstEntryRecentReferenceConfirmationCandlesCount;
    const distanceFromReference =
      input.entryContext.firstEntryDistanceFromRecentReferenceLevelPct;
    const hadReclaim = input.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry;
    const heldIntoEntry =
      input.entryContext.firstEntryRecentReferenceReclaimHeldIntoEntry;
    const {
      adverseMovePct,
      normalizedNetMovePct,
    } = getPreEntryDirectionalContext({
      tradeDirection: input.tradeDirection,
      recentRunUpPct: input.entryContext.firstEntryRecentRunUpPctBeforeEntry,
      recentDropPct: input.entryContext.firstEntryRecentDropPctBeforeEntry,
      bullishCandles: input.entryContext.firstEntryBullishCandlesBeforeEntryCount,
      bearishCandles: input.entryContext.firstEntryBearishCandlesBeforeEntryCount,
      recentNetMovePct: input.entryContext.firstEntryRecentNetMovePctBeforeEntry,
    });

    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;
    const minReferenceBreakDepthPct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_REFERENCE_BREAK_DEPTH_PCT;
    const maxDistanceFromReferencePct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MAX_DISTANCE_FROM_REFERENCE_PCT;
    const minConfirmationCandles =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_CONFIRMATION_CANDLES;
    const minCounterMovePct =
      THRESHOLDS.ENTRY_QUALITY.MEAN_REVERSION_MIN_COUNTER_MOVE_PCT;
    const maxNetMovePct =
      THRESHOLDS.ENTRY_QUALITY.MEAN_REVERSION_MAX_NET_MOVE_PCT;

    const matched =
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      breakDepthPct !== null &&
      distanceFromReference !== null &&
      adverseMovePct !== null &&
      normalizedNetMovePct !== null &&
      hadReclaim &&
      heldIntoEntry &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry &&
      breakDepthPct >= minReferenceBreakDepthPct &&
      distanceFromReference <= maxDistanceFromReferencePct &&
      confirmationCandles >= minConfirmationCandles &&
      adverseMovePct >= minCounterMovePct &&
      normalizedNetMovePct <= maxNetMovePct;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: breakDepthPct,
        firstEntryRecentReferenceConfirmationCandlesCount:
          confirmationCandles,
        firstEntryDistanceFromRecentReferenceLevelPct: distanceFromReference,
        firstEntryHadRecentReferenceReclaimBeforeEntry: hadReclaim,
        firstEntryRecentReferenceReclaimHeldIntoEntry: heldIntoEntry,
        adverseMovePctBeforeEntry: adverseMovePct,
        normalizedRecentNetMovePctBeforeEntry: normalizedNetMovePct,
        firstEntryRecentReferenceLevelBeforeEntry:
          input.entryContext.firstEntryRecentReferenceLevelBeforeEntry,
      },
      thresholdsUsed: {
        minCapturedMfe,
        maxAdverseAfterEntry,
        minReferenceBreakDepthPct,
        maxDistanceFromReferencePct,
        minConfirmationCandles,
        minCounterMovePct,
        maxNetMovePct,
      },
    };
  },
};

// =========================
// FAILED MEAN REVERSION ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a deeper countertrend move and recent reference reclaim
// - the setup looked like a real mean-reversion attempt into entry
// - post-entry structure still remained weak
//
export const FAILED_MEAN_REVERSION_ENTRY_STRUCTURE: PatternDefinition = {
  id: "failed_mean_reversion_entry_structure",
  name: "Failed Mean Reversion Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const breakDepthPct = input.entryContext.firstEntryRecentReferenceBreakDepthPctBeforeEntry;
    const confirmationCandles =
      input.entryContext.firstEntryRecentReferenceConfirmationCandlesCount;
    const distanceFromReference =
      input.entryContext.firstEntryDistanceFromRecentReferenceLevelPct;
    const hadReclaim = input.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry;
    const heldIntoEntry =
      input.entryContext.firstEntryRecentReferenceReclaimHeldIntoEntry;
    const {
      adverseMovePct,
      normalizedNetMovePct,
    } = getPreEntryDirectionalContext({
      tradeDirection: input.tradeDirection,
      recentRunUpPct: input.entryContext.firstEntryRecentRunUpPctBeforeEntry,
      recentDropPct: input.entryContext.firstEntryRecentDropPctBeforeEntry,
      bullishCandles: input.entryContext.firstEntryBullishCandlesBeforeEntryCount,
      bearishCandles: input.entryContext.firstEntryBearishCandlesBeforeEntryCount,
      recentNetMovePct: input.entryContext.firstEntryRecentNetMovePctBeforeEntry,
    });

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.FAILED_MEAN_REVERSION_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.FAILED_MEAN_REVERSION_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const minReferenceBreakDepthPct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_REFERENCE_BREAK_DEPTH_PCT;
    const maxDistanceFromReferencePct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MAX_DISTANCE_FROM_REFERENCE_PCT;
    const minConfirmationCandles =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_CONFIRMATION_CANDLES;
    const minCounterMovePct =
      THRESHOLDS.ENTRY_QUALITY.MEAN_REVERSION_MIN_COUNTER_MOVE_PCT;
    const maxNetMovePct =
      THRESHOLDS.ENTRY_QUALITY.MEAN_REVERSION_MAX_NET_MOVE_PCT;

    const matched =
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      breakDepthPct !== null &&
      distanceFromReference !== null &&
      adverseMovePct !== null &&
      normalizedNetMovePct !== null &&
      hadReclaim &&
      heldIntoEntry &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      breakDepthPct >= minReferenceBreakDepthPct &&
      distanceFromReference <= maxDistanceFromReferencePct &&
      confirmationCandles >= minConfirmationCandles &&
      adverseMovePct >= minCounterMovePct &&
      normalizedNetMovePct <= maxNetMovePct;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: breakDepthPct,
        firstEntryRecentReferenceConfirmationCandlesCount:
          confirmationCandles,
        firstEntryDistanceFromRecentReferenceLevelPct: distanceFromReference,
        firstEntryHadRecentReferenceReclaimBeforeEntry: hadReclaim,
        firstEntryRecentReferenceReclaimHeldIntoEntry: heldIntoEntry,
        adverseMovePctBeforeEntry: adverseMovePct,
        normalizedRecentNetMovePctBeforeEntry: normalizedNetMovePct,
        firstEntryRecentReferenceLevelBeforeEntry:
          input.entryContext.firstEntryRecentReferenceLevelBeforeEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        minReferenceBreakDepthPct,
        maxDistanceFromReferencePct,
        minConfirmationCandles,
        minCounterMovePct,
        maxNetMovePct,
      },
    };
  },
};

// =========================
// OPENING RANGE BREAKOUT ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - the first entry happened during the market-open session with at least a
//   small opening-range window available
// - entry occurred beyond that true opening range in the trade direction
// - the breakout distance stayed controlled
// - post-entry structure still remained constructive
//
export const OPENING_RANGE_BREAKOUT_ENTRY_STRUCTURE: PatternDefinition = {
  id: "opening_range_breakout_entry_structure",
  name: "Opening Range Breakout Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const distanceBeyondRange = input.entryContext.firstEntryDistanceBeyondOpeningRangePct;

    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;
    const maxDistanceBeyondRangePct =
      THRESHOLDS.ENTRY_QUALITY.OPENING_RANGE_BREAKOUT_MAX_DISTANCE_BEYOND_RANGE_PCT;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry >= 3 &&
      input.entryContext.firstEntryOccurredBeyondOpeningRangeInTradeDirection &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      distanceBeyondRange !== null &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry &&
      distanceBeyondRange <= maxDistanceBeyondRangePct;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOpeningRangeCandlesCountBeforeEntry:
          input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry,
        firstEntryOccurredDuringMarketOpenSession:
          input.entryContext.firstEntryOccurredDuringMarketOpenSession,
        firstEntryOccurredBeyondOpeningRangeInTradeDirection:
          input.entryContext.firstEntryOccurredBeyondOpeningRangeInTradeDirection,
        firstEntryDistanceBeyondOpeningRangePct: distanceBeyondRange,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        minCapturedMfe,
        maxAdverseAfterEntry,
        maxDistanceBeyondRangePct,
      },
    };
  },
};

// =========================
// OPENING RANGE BREAKOUT CHASE ENTRY STRUCTURE
// =========================
export const OPENING_RANGE_BREAKOUT_CHASE_ENTRY_STRUCTURE: PatternDefinition = {
  id: "opening_range_breakout_chase_entry_structure",
  name: "Opening Range Breakout Chase Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const distanceBeyondRange = input.entryContext.firstEntryDistanceBeyondOpeningRangePct;

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const minDistanceBeyondRangePct =
      THRESHOLDS.ENTRY_QUALITY.OPENING_RANGE_BREAKOUT_CHASE_MIN_DISTANCE_BEYOND_RANGE_PCT;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry >= 3 &&
      input.entryContext.firstEntryOccurredBeyondOpeningRangeInTradeDirection &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      distanceBeyondRange !== null &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      distanceBeyondRange >= minDistanceBeyondRangePct;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOpeningRangeCandlesCountBeforeEntry:
          input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry,
        firstEntryOccurredDuringMarketOpenSession:
          input.entryContext.firstEntryOccurredDuringMarketOpenSession,
        firstEntryOccurredBeyondOpeningRangeInTradeDirection:
          input.entryContext.firstEntryOccurredBeyondOpeningRangeInTradeDirection,
        firstEntryDistanceBeyondOpeningRangePct: distanceBeyondRange,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        minDistanceBeyondRangePct,
      },
    };
  },
};

// =========================
// FAILED OPENING RANGE BREAKOUT ENTRY STRUCTURE
// =========================
export const FAILED_OPENING_RANGE_BREAKOUT_ENTRY_STRUCTURE: PatternDefinition = {
  id: "failed_opening_range_breakout_entry_structure",
  name: "Failed Opening Range Breakout Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const distanceBeyondRange = input.entryContext.firstEntryDistanceBeyondOpeningRangePct;

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.FAILED_BREAKOUT_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.FAILED_BREAKOUT_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const maxDistanceBeyondRangePct =
      THRESHOLDS.ENTRY_QUALITY.OPENING_RANGE_BREAKOUT_MAX_DISTANCE_BEYOND_RANGE_PCT;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry >= 3 &&
      input.entryContext.firstEntryOccurredBeyondOpeningRangeInTradeDirection &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      distanceBeyondRange !== null &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      distanceBeyondRange <= maxDistanceBeyondRangePct;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOpeningRangeCandlesCountBeforeEntry:
          input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry,
        firstEntryOccurredDuringMarketOpenSession:
          input.entryContext.firstEntryOccurredDuringMarketOpenSession,
        firstEntryOccurredBeyondOpeningRangeInTradeDirection:
          input.entryContext.firstEntryOccurredBeyondOpeningRangeInTradeDirection,
        firstEntryDistanceBeyondOpeningRangePct: distanceBeyondRange,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        maxDistanceBeyondRangePct,
      },
    };
  },
};

export const OPENING_RANGE_RECLAIM_ENTRY_STRUCTURE: PatternDefinition = {
  id: "opening_range_reclaim_entry_structure",
  name: "Opening Range Reclaim Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const breakDepthPct =
      input.entryContext.firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry;
    const confirmationCandles =
      input.entryContext.firstEntryOpeningRangeConfirmationCandlesCount;
    const distanceFromReference =
      input.entryContext.firstEntryDistanceFromOpeningRangeReferenceLevelPct;

    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;
    const minReferenceBreakDepthPct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_REFERENCE_BREAK_DEPTH_PCT;
    const maxDistanceFromReferencePct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MAX_DISTANCE_FROM_REFERENCE_PCT;
    const minConfirmationCandles =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_CONFIRMATION_CANDLES;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry >= 3 &&
      input.entryContext.firstEntryHadOpeningRangeReclaimBeforeEntry &&
      input.entryContext.firstEntryOpeningRangeReclaimHeldIntoEntry &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      breakDepthPct !== null &&
      distanceFromReference !== null &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry &&
      breakDepthPct >= minReferenceBreakDepthPct &&
      distanceFromReference <= maxDistanceFromReferencePct &&
      confirmationCandles >= minConfirmationCandles;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOpeningRangeCandlesCountBeforeEntry:
          input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry,
        firstEntryHadOpeningRangeReclaimBeforeEntry:
          input.entryContext.firstEntryHadOpeningRangeReclaimBeforeEntry,
        firstEntryOpeningRangeReclaimHeldIntoEntry:
          input.entryContext.firstEntryOpeningRangeReclaimHeldIntoEntry,
        firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry: breakDepthPct,
        firstEntryOpeningRangeConfirmationCandlesCount: confirmationCandles,
        firstEntryDistanceFromOpeningRangeReferenceLevelPct:
          distanceFromReference,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        minCapturedMfe,
        maxAdverseAfterEntry,
        minReferenceBreakDepthPct,
        maxDistanceFromReferencePct,
        minConfirmationCandles,
      },
    };
  },
};

export const FAILED_OPENING_RANGE_RECLAIM_ENTRY_STRUCTURE: PatternDefinition = {
  id: "failed_opening_range_reclaim_entry_structure",
  name: "Failed Opening Range Reclaim Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const breakDepthPct =
      input.entryContext.firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry;
    const confirmationCandles =
      input.entryContext.firstEntryOpeningRangeConfirmationCandlesCount;
    const distanceFromReference =
      input.entryContext.firstEntryDistanceFromOpeningRangeReferenceLevelPct;

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.FAILED_RECLAIM_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.FAILED_RECLAIM_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const minReferenceBreakDepthPct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_REFERENCE_BREAK_DEPTH_PCT;
    const maxDistanceFromReferencePct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MAX_DISTANCE_FROM_REFERENCE_PCT;
    const minConfirmationCandles =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_CONFIRMATION_CANDLES;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry >= 3 &&
      input.entryContext.firstEntryHadOpeningRangeReclaimBeforeEntry &&
      input.entryContext.firstEntryOpeningRangeReclaimHeldIntoEntry &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      breakDepthPct !== null &&
      distanceFromReference !== null &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      breakDepthPct >= minReferenceBreakDepthPct &&
      distanceFromReference <= maxDistanceFromReferencePct &&
      confirmationCandles >= minConfirmationCandles;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOpeningRangeCandlesCountBeforeEntry:
          input.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry,
        firstEntryHadOpeningRangeReclaimBeforeEntry:
          input.entryContext.firstEntryHadOpeningRangeReclaimBeforeEntry,
        firstEntryOpeningRangeReclaimHeldIntoEntry:
          input.entryContext.firstEntryOpeningRangeReclaimHeldIntoEntry,
        firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry: breakDepthPct,
        firstEntryOpeningRangeConfirmationCandlesCount: confirmationCandles,
        firstEntryDistanceFromOpeningRangeReferenceLevelPct:
          distanceFromReference,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        minReferenceBreakDepthPct,
        maxDistanceFromReferencePct,
        minConfirmationCandles,
      },
    };
  },
};

// =========================
// MARKET OPEN BREAKOUT ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - the first entry happened during the market-open session
// - entry occurred beyond the pre-entry opening range in the trade direction
// - the breakout distance stayed controlled
// - post-entry structure still remained constructive
//
export const MARKET_OPEN_BREAKOUT_ENTRY_STRUCTURE: PatternDefinition = {
  id: "market_open_breakout_entry_structure",
  name: "Market Open Breakout Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const distanceBeyondRange = input.entryContext.firstEntryDistanceBeyondPreEntryRangePct;

    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;
    const maxDistanceBeyondRangePct =
      THRESHOLDS.ENTRY_QUALITY.MARKET_OPEN_BREAKOUT_MAX_DISTANCE_BEYOND_RANGE_PCT;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryOccurredBeyondPreEntryRangeInTradeDirection &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      distanceBeyondRange !== null &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry &&
      distanceBeyondRange <= maxDistanceBeyondRangePct;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOccurredDuringMarketOpenSession:
          input.entryContext.firstEntryOccurredDuringMarketOpenSession,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection:
          input.entryContext.firstEntryOccurredBeyondPreEntryRangeInTradeDirection,
        firstEntryDistanceBeyondPreEntryRangePct: distanceBeyondRange,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        minCapturedMfe,
        maxAdverseAfterEntry,
        maxDistanceBeyondRangePct,
      },
    };
  },
};

// =========================
// MARKET OPEN BREAKOUT CHASE ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - the first entry happened during the market-open session
// - entry occurred beyond the pre-entry opening range in the trade direction
// - the breakout distance was already stretched
// - post-entry structure still remained weak
//
export const MARKET_OPEN_BREAKOUT_CHASE_ENTRY_STRUCTURE: PatternDefinition = {
  id: "market_open_breakout_chase_entry_structure",
  name: "Market Open Breakout Chase Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const distanceBeyondRange = input.entryContext.firstEntryDistanceBeyondPreEntryRangePct;

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const minDistanceBeyondRangePct =
      THRESHOLDS.ENTRY_QUALITY.MARKET_OPEN_BREAKOUT_CHASE_MIN_DISTANCE_BEYOND_RANGE_PCT;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryOccurredBeyondPreEntryRangeInTradeDirection &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      distanceBeyondRange !== null &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      distanceBeyondRange >= minDistanceBeyondRangePct;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOccurredDuringMarketOpenSession:
          input.entryContext.firstEntryOccurredDuringMarketOpenSession,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection:
          input.entryContext.firstEntryOccurredBeyondPreEntryRangeInTradeDirection,
        firstEntryDistanceBeyondPreEntryRangePct: distanceBeyondRange,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        minDistanceBeyondRangePct,
      },
    };
  },
};

// =========================
// FAILED MARKET OPEN BREAKOUT ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - the first entry happened during the market-open session
// - entry occurred beyond the pre-entry opening range in the trade direction
// - the breakout distance was still controlled
// - post-entry structure still remained weak
//
export const FAILED_MARKET_OPEN_BREAKOUT_ENTRY_STRUCTURE: PatternDefinition = {
  id: "failed_market_open_breakout_entry_structure",
  name: "Failed Market Open Breakout Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const distanceBeyondRange = input.entryContext.firstEntryDistanceBeyondPreEntryRangePct;

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.FAILED_BREAKOUT_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.FAILED_BREAKOUT_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const maxDistanceBeyondRangePct =
      THRESHOLDS.ENTRY_QUALITY.MARKET_OPEN_BREAKOUT_MAX_DISTANCE_BEYOND_RANGE_PCT;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryOccurredBeyondPreEntryRangeInTradeDirection &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      distanceBeyondRange !== null &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      distanceBeyondRange <= maxDistanceBeyondRangePct;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOccurredDuringMarketOpenSession:
          input.entryContext.firstEntryOccurredDuringMarketOpenSession,
        firstEntryOccurredBeyondPreEntryRangeInTradeDirection:
          input.entryContext.firstEntryOccurredBeyondPreEntryRangeInTradeDirection,
        firstEntryDistanceBeyondPreEntryRangePct: distanceBeyondRange,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        maxDistanceBeyondRangePct,
      },
    };
  },
};

// =========================
// MARKET OPEN RECLAIM ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - the first entry happened during the market-open session
// - pre-entry price reclaimed a recent reference level and held it into entry
// - the eventual entry stayed near that reclaimed level
// - post-entry structure still remained constructive
//
export const MARKET_OPEN_RECLAIM_ENTRY_STRUCTURE: PatternDefinition = {
  id: "market_open_reclaim_entry_structure",
  name: "Market Open Reclaim Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const breakDepthPct = input.entryContext.firstEntryRecentReferenceBreakDepthPctBeforeEntry;
    const confirmationCandles =
      input.entryContext.firstEntryRecentReferenceConfirmationCandlesCount;
    const distanceFromReference =
      input.entryContext.firstEntryDistanceFromRecentReferenceLevelPct;

    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;
    const minReferenceBreakDepthPct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_REFERENCE_BREAK_DEPTH_PCT;
    const maxDistanceFromReferencePct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MAX_DISTANCE_FROM_REFERENCE_PCT;
    const minConfirmationCandles =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_CONFIRMATION_CANDLES;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry &&
      input.entryContext.firstEntryRecentReferenceReclaimHeldIntoEntry &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      breakDepthPct !== null &&
      distanceFromReference !== null &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry &&
      breakDepthPct >= minReferenceBreakDepthPct &&
      distanceFromReference <= maxDistanceFromReferencePct &&
      confirmationCandles >= minConfirmationCandles;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOccurredDuringMarketOpenSession:
          input.entryContext.firstEntryOccurredDuringMarketOpenSession,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: breakDepthPct,
        firstEntryRecentReferenceConfirmationCandlesCount:
          confirmationCandles,
        firstEntryDistanceFromRecentReferenceLevelPct: distanceFromReference,
        firstEntryHadRecentReferenceReclaimBeforeEntry:
          input.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry,
        firstEntryRecentReferenceReclaimHeldIntoEntry:
          input.entryContext.firstEntryRecentReferenceReclaimHeldIntoEntry,
      },
      thresholdsUsed: {
        minCapturedMfe,
        maxAdverseAfterEntry,
        minReferenceBreakDepthPct,
        maxDistanceFromReferencePct,
        minConfirmationCandles,
      },
    };
  },
};

// =========================
// FAILED MARKET OPEN RECLAIM ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - the first entry happened during the market-open session
// - pre-entry price reclaimed a recent reference level and held it into entry
// - the eventual entry still stayed near that reclaimed level
// - post-entry structure still remained weak
//
export const FAILED_MARKET_OPEN_RECLAIM_ENTRY_STRUCTURE: PatternDefinition = {
  id: "failed_market_open_reclaim_entry_structure",
  name: "Failed Market Open Reclaim Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const breakDepthPct = input.entryContext.firstEntryRecentReferenceBreakDepthPctBeforeEntry;
    const confirmationCandles =
      input.entryContext.firstEntryRecentReferenceConfirmationCandlesCount;
    const distanceFromReference =
      input.entryContext.firstEntryDistanceFromRecentReferenceLevelPct;

    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.FAILED_RECLAIM_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.FAILED_RECLAIM_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const minReferenceBreakDepthPct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_REFERENCE_BREAK_DEPTH_PCT;
    const maxDistanceFromReferencePct =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MAX_DISTANCE_FROM_REFERENCE_PCT;
    const minConfirmationCandles =
      THRESHOLDS.ENTRY_QUALITY.RECLAIM_ENTRY_MIN_CONFIRMATION_CANDLES;

    const matched =
      input.entryContext.firstEntryOccurredDuringMarketOpenSession &&
      input.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry &&
      input.entryContext.firstEntryRecentReferenceReclaimHeldIntoEntry &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      breakDepthPct !== null &&
      distanceFromReference !== null &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      breakDepthPct >= minReferenceBreakDepthPct &&
      distanceFromReference <= maxDistanceFromReferencePct &&
      confirmationCandles >= minConfirmationCandles;

    return {
      matched,
      evidence: {
        sessionBucket: input.sessionBucket,
        firstEntryOccurredDuringMarketOpenSession:
          input.entryContext.firstEntryOccurredDuringMarketOpenSession,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        firstEntryRecentReferenceBreakDepthPctBeforeEntry: breakDepthPct,
        firstEntryRecentReferenceConfirmationCandlesCount:
          confirmationCandles,
        firstEntryDistanceFromRecentReferenceLevelPct: distanceFromReference,
        firstEntryHadRecentReferenceReclaimBeforeEntry:
          input.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry,
        firstEntryRecentReferenceReclaimHeldIntoEntry:
          input.entryContext.firstEntryRecentReferenceReclaimHeldIntoEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe,
        minAdverseAfterEntry,
        minReferenceBreakDepthPct,
        maxDistanceFromReferencePct,
        minConfirmationCandles,
      },
    };
  },
};

export const BREAKOUT_WITH_ROOM_ABOVE_STRUCTURE: PatternDefinition = {
  id: "breakout_with_room_above_structure",
  name: "Breakout With Room Above Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const roomAbovePct = input.supportResistanceContext.firstEntryDistanceToNearestResistancePct;
    const distanceAboveBrokenResistancePct =
      input.supportResistanceContext.firstEntryDistanceAboveNearestResistanceBelowPct;
    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;

    const matched =
      input.supportResistanceContext.hadSupportResistanceContextAvailable &&
      input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
      input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
      !input.supportResistanceContext.firstEntryOccurredNearResistance &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.supportResistanceContext.hadSupportResistanceContextAvailable,
        firstEntryClearedNearestResistanceBelow:
          input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
        firstEntryHadRoomAboveAfterClearingResistance:
          input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance,
        firstEntryDistanceAboveNearestResistanceBelowPct:
          distanceAboveBrokenResistancePct,
        firstEntryDistanceToNearestResistancePct: roomAbovePct,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        minCapturedMfe,
        maxAdverseAfterEntry,
      },
    };
  },
};

export const BREAKOUT_INTO_OVERHEAD_RESISTANCE_STRUCTURE: PatternDefinition = {
  id: "breakout_into_overhead_resistance_structure",
  name: "Breakout Into Overhead Resistance Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;

    const matched =
      input.supportResistanceContext.hadSupportResistanceContextAvailable &&
      input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
      input.supportResistanceContext.firstEntryHasStackedResistanceAbove &&
      !input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      capturedMfe <=
        THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE &&
      adverseAfterEntry >=
        THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.supportResistanceContext.hadSupportResistanceContextAvailable,
        firstEntryClearedNearestResistanceBelow:
          input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
        firstEntryHasStackedResistanceAbove:
          input.supportResistanceContext.firstEntryHasStackedResistanceAbove,
        firstEntryResistanceLevelsAboveWithinClusterCount:
          input.supportResistanceContext.firstEntryResistanceLevelsAboveWithinClusterCount,
        firstEntryHadRoomAboveAfterClearingResistance:
          input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
      },
      thresholdsUsed: {
        maxCapturedMfe:
          THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE,
        minAdverseAfterEntry:
          THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT,
      },
    };
  },
};

export const BREAKOUT_WITH_ROOM_ABOVE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "breakout_with_room_above_and_constructive_final_exit",
    name: "Breakout With Room Above And Constructive Final Exit",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
      const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.supportResistanceContext.hadSupportResistanceContextAvailable &&
        input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
        input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
        !input.supportResistanceContext.firstEntryOccurredNearResistance &&
        capturedMfe !== null &&
        adverseAfterEntry !== null &&
        capturedMfe >= THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE &&
        adverseAfterEntry <=
          THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct !== null &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.tradeStructure.closedToFlat &&
        input.exitContext.postExitCandleCount > 0 &&
        input.exitContext.maxAdverseMovePctAfterExit !== null &&
        input.exitContext.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.exitContext.netMovePctAtEndOfPostExitWindow !== null &&
        input.exitContext.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.exitContext.maxAdverseMovePctAfterExit >
          (input.exitContext.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.supportResistanceContext.hadSupportResistanceContextAvailable,
          firstEntryClearedNearestResistanceBelow:
            input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
          firstEntryHadRoomAboveAfterClearingResistance:
            input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance,
          firstEntryDistanceAboveNearestResistanceBelowPct:
            input.supportResistanceContext.firstEntryDistanceAboveNearestResistanceBelowPct,
          firstEntryDistanceToNearestResistancePct:
            input.supportResistanceContext.firstEntryDistanceToNearestResistancePct,
          firstEntryCapturedPercentOfTradeMfe: capturedMfe,
          firstEntryToWorstMovePct: adverseAfterEntry,
          maxGivebackFromPeakOpenProfitPct:
            input.recoveryContext.maxGivebackFromPeakOpenProfitPct,
          maxAdverseMovePctAfterExit: input.exitContext.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.exitContext.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.exitContext.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minCapturedMfe:
            THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE,
          maxAdverseAfterEntry:
            THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const BREAKOUT_WITH_ROOM_ABOVE_AND_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "breakout_with_room_above_and_failed_profit_protection",
    name: "Breakout With Room Above And Failed Profit Protection",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
      const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.supportResistanceContext.hadSupportResistanceContextAvailable &&
        input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
        input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
        !input.supportResistanceContext.firstEntryOccurredNearResistance &&
        capturedMfe !== null &&
        adverseAfterEntry !== null &&
        capturedMfe >= THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE &&
        adverseAfterEntry <=
          THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct !== null &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.recoveryContext.peakOpenProfitPctOfBasis !== null &&
        input.recoveryContext.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis;

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.supportResistanceContext.hadSupportResistanceContextAvailable,
          firstEntryClearedNearestResistanceBelow:
            input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
          firstEntryHadRoomAboveAfterClearingResistance:
            input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance,
          firstEntryDistanceAboveNearestResistanceBelowPct:
            input.supportResistanceContext.firstEntryDistanceAboveNearestResistanceBelowPct,
          firstEntryDistanceToNearestResistancePct:
            input.supportResistanceContext.firstEntryDistanceToNearestResistancePct,
          firstEntryCapturedPercentOfTradeMfe: capturedMfe,
          firstEntryToWorstMovePct: adverseAfterEntry,
          maxGivebackFromPeakOpenProfitPct:
            input.recoveryContext.maxGivebackFromPeakOpenProfitPct,
          peakOpenProfitPctOfBasis: input.recoveryContext.peakOpenProfitPctOfBasis,
        },
        thresholdsUsed: {
          minCapturedMfe: THRESHOLDS.ENTRY_QUALITY.BREAKOUT_ENTRY_MIN_NET_MOVE_PCT,
          maxAdverseAfterEntry:
            THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT,
          minGivebackPct,
          minPeakOpenProfitPctOfBasis,
        },
      };
    },
  };

export const BREAKOUT_INTO_OVERHEAD_RESISTANCE_WITH_DEFENSIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "breakout_into_overhead_resistance_with_defensive_final_exit",
    name: "Breakout Into Overhead Resistance With Defensive Final Exit",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
      const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
      const favorablePct = input.exitContext.maxFavorableMovePctAfterExit;
      const adversePct = input.exitContext.maxAdverseMovePctAfterExit;
      const netEndPct = input.exitContext.netMovePctAtEndOfPostExitWindow;
      const givebackPct = input.recoveryContext.maxGivebackFromPeakOpenProfitPct;

      const maxCapturedMfe =
        THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE;
      const minAdverseAfterEntry =
        THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.DISCIPLINED_DEFENSIVE_EXIT_MAX_GIVEBACK_PCT;

      const matched =
        input.supportResistanceContext.hadSupportResistanceContextAvailable &&
        input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
        input.supportResistanceContext.firstEntryHasStackedResistanceAbove &&
        !input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
        capturedMfe !== null &&
        capturedMfe <= maxCapturedMfe &&
        adverseAfterEntry !== null &&
        adverseAfterEntry >= minAdverseAfterEntry &&
        input.tradeStructure.closedToFlat &&
        input.tradeStructure.totalPositionDecreaseCount > 0 &&
        input.exitContext.postExitCandleCount > 0 &&
        adversePct !== null &&
        adversePct >= minAdversePct &&
        netEndPct !== null &&
        netEndPct <= maxNetEndPct &&
        adversePct > (favorablePct ?? Number.NEGATIVE_INFINITY) &&
        givebackPct !== null &&
        givebackPct <= maxGivebackPct;

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.supportResistanceContext.hadSupportResistanceContextAvailable,
          firstEntryClearedNearestResistanceBelow:
            input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
          firstEntryHasStackedResistanceAbove:
            input.supportResistanceContext.firstEntryHasStackedResistanceAbove,
          firstEntryResistanceLevelsAboveWithinClusterCount:
            input.supportResistanceContext.firstEntryResistanceLevelsAboveWithinClusterCount,
          firstEntryCapturedPercentOfTradeMfe: capturedMfe,
          firstEntryToWorstMovePct: adverseAfterEntry,
          maxGivebackFromPeakOpenProfitPct: givebackPct,
          maxAdverseMovePctAfterExit: adversePct,
          maxFavorableMovePctAfterExit: favorablePct,
          netMovePctAtEndOfPostExitWindow: netEndPct,
        },
        thresholdsUsed: {
          maxCapturedMfe,
          minAdverseAfterEntry,
          minAdversePct,
          maxNetEndPct,
          maxGivebackPct,
        },
      };
    },
  };

export const BREAKOUT_INTO_OVERHEAD_RESISTANCE_WITH_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "breakout_into_overhead_resistance_with_failed_profit_protection",
    name: "Breakout Into Overhead Resistance With Failed Profit Protection",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
      const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.supportResistanceContext.hadSupportResistanceContextAvailable &&
        input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
        input.supportResistanceContext.firstEntryHasStackedResistanceAbove &&
        !input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
        capturedMfe !== null &&
        capturedMfe <= THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE &&
        adverseAfterEntry !== null &&
        adverseAfterEntry >=
          THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct !== null &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.recoveryContext.peakOpenProfitPctOfBasis !== null &&
        input.recoveryContext.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis;

      return {
        matched,
        evidence: {
          hadSupportResistanceContextAvailable:
            input.supportResistanceContext.hadSupportResistanceContextAvailable,
          firstEntryClearedNearestResistanceBelow:
            input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
          firstEntryHasStackedResistanceAbove:
            input.supportResistanceContext.firstEntryHasStackedResistanceAbove,
          firstEntryResistanceLevelsAboveWithinClusterCount:
            input.supportResistanceContext.firstEntryResistanceLevelsAboveWithinClusterCount,
          firstEntryCapturedPercentOfTradeMfe: capturedMfe,
          firstEntryToWorstMovePct: adverseAfterEntry,
          maxGivebackFromPeakOpenProfitPct:
            input.recoveryContext.maxGivebackFromPeakOpenProfitPct,
          peakOpenProfitPctOfBasis: input.recoveryContext.peakOpenProfitPctOfBasis,
        },
        thresholdsUsed: {
          maxCapturedMfe:
            THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE,
          minAdverseAfterEntry:
            THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT,
          minGivebackPct,
          minPeakOpenProfitPctOfBasis,
        },
      };
    },
  };

export const RECOVERY_WITH_BREAKOUT_WITH_ROOM_ABOVE_AND_CONSTRUCTIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_breakout_with_room_above_and_constructive_final_exit",
    name: "Recovery With Breakout With Room Above And Constructive Final Exit",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .BALANCED_WITH_PROFIT_PROTECTION_MAX_GIVEBACK_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;

      const matched =
        input.recoveryContext.hadOpenLossBeforePeakOpenProfit &&
        input.recoveryContext.peakOpenProfitPctOfBasis !== null &&
        input.recoveryContext.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.exitContext.realizedReturnPct !== null &&
        input.exitContext.realizedReturnPct > 0 &&
        input.supportResistanceContext.hadSupportResistanceContextAvailable &&
        input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
        input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
        !input.supportResistanceContext.firstEntryOccurredNearResistance &&
        input.entryContext.firstEntryCapturedPercentOfTradeMfe !== null &&
        input.entryContext.firstEntryCapturedPercentOfTradeMfe >=
          THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE &&
        input.entryContext.firstEntryToWorstMovePct !== null &&
        input.entryContext.firstEntryToWorstMovePct <=
          THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct !== null &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct &&
        input.tradeStructure.closedToFlat &&
        input.exitContext.postExitCandleCount > 0 &&
        input.exitContext.maxAdverseMovePctAfterExit !== null &&
        input.exitContext.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.exitContext.netMovePctAtEndOfPostExitWindow !== null &&
        input.exitContext.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.exitContext.maxAdverseMovePctAfterExit >
          (input.exitContext.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY);

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.recoveryContext.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.recoveryContext.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.exitContext.realizedReturnPct,
          hadSupportResistanceContextAvailable:
            input.supportResistanceContext.hadSupportResistanceContextAvailable,
          firstEntryClearedNearestResistanceBelow:
            input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
          firstEntryHadRoomAboveAfterClearingResistance:
            input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance,
          firstEntryDistanceAboveNearestResistanceBelowPct:
            input.supportResistanceContext.firstEntryDistanceAboveNearestResistanceBelowPct,
          firstEntryDistanceToNearestResistancePct:
            input.supportResistanceContext.firstEntryDistanceToNearestResistancePct,
          firstEntryCapturedPercentOfTradeMfe:
            input.entryContext.firstEntryCapturedPercentOfTradeMfe,
          firstEntryToWorstMovePct: input.entryContext.firstEntryToWorstMovePct,
          maxGivebackFromPeakOpenProfitPct:
            input.recoveryContext.maxGivebackFromPeakOpenProfitPct,
          maxAdverseMovePctAfterExit: input.exitContext.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.exitContext.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.exitContext.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          minCapturedMfe:
            THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE,
          maxAdverseAfterEntry:
            THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT,
          maxGivebackPct,
          minAdversePct,
          maxNetEndPct,
        },
      };
    },
  };

export const RECOVERY_WITH_BREAKOUT_WITH_ROOM_ABOVE_AND_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "recovery_with_breakout_with_room_above_and_failed_profit_protection",
    name: "Recovery With Breakout With Room Above And Failed Profit Protection",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minRecoveryPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
      const minPeakOpenProfitForFailurePctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.recoveryContext.hadOpenLossBeforePeakOpenProfit &&
        input.recoveryContext.peakOpenProfitPctOfBasis !== null &&
        input.recoveryContext.peakOpenProfitPctOfBasis >= minRecoveryPeakOpenProfitPctOfBasis &&
        input.supportResistanceContext.hadSupportResistanceContextAvailable &&
        input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
        input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
        !input.supportResistanceContext.firstEntryOccurredNearResistance &&
        input.entryContext.firstEntryCapturedPercentOfTradeMfe !== null &&
        input.entryContext.firstEntryCapturedPercentOfTradeMfe >=
          THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE &&
        input.entryContext.firstEntryToWorstMovePct !== null &&
        input.entryContext.firstEntryToWorstMovePct <=
          THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct !== null &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.recoveryContext.peakOpenProfitPctOfBasis >= minPeakOpenProfitForFailurePctOfBasis;

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.recoveryContext.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.recoveryContext.peakOpenProfitPctOfBasis,
          hadSupportResistanceContextAvailable:
            input.supportResistanceContext.hadSupportResistanceContextAvailable,
          firstEntryClearedNearestResistanceBelow:
            input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
          firstEntryHadRoomAboveAfterClearingResistance:
            input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance,
          firstEntryDistanceAboveNearestResistanceBelowPct:
            input.supportResistanceContext.firstEntryDistanceAboveNearestResistanceBelowPct,
          firstEntryDistanceToNearestResistancePct:
            input.supportResistanceContext.firstEntryDistanceToNearestResistancePct,
          firstEntryCapturedPercentOfTradeMfe:
            input.entryContext.firstEntryCapturedPercentOfTradeMfe,
          firstEntryToWorstMovePct: input.entryContext.firstEntryToWorstMovePct,
          maxGivebackFromPeakOpenProfitPct:
            input.recoveryContext.maxGivebackFromPeakOpenProfitPct,
        },
        thresholdsUsed: {
          minRecoveryPeakOpenProfitPctOfBasis,
          minCapturedMfe:
            THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE,
          maxAdverseAfterEntry:
            THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT,
          minGivebackPct,
          minPeakOpenProfitForFailurePctOfBasis,
        },
      };
    },
  };

export const RECOVERY_WITH_BREAKOUT_INTO_OVERHEAD_RESISTANCE_AND_DEFENSIVE_FINAL_EXIT: PatternDefinition =
  {
    id: "recovery_with_breakout_into_overhead_resistance_and_defensive_final_exit",
    name: "Recovery With Breakout Into Overhead Resistance And Defensive Final Exit",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const maxCapturedMfe =
        THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE;
      const minAdverseAfterEntry =
        THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT;
      const minAdversePct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MIN_ADVERSE_PCT;
      const maxNetEndPct =
        THRESHOLDS.EXIT_QUALITY
          .EXIT_AVOIDED_ADVERSE_FOLLOWTHROUGH_MAX_NET_END_PCT;
      const maxGivebackPct =
        THRESHOLDS.EXIT_QUALITY.DISCIPLINED_DEFENSIVE_EXIT_MAX_GIVEBACK_PCT;

      const matched =
        input.recoveryContext.hadOpenLossBeforePeakOpenProfit &&
        input.recoveryContext.peakOpenProfitPctOfBasis !== null &&
        input.recoveryContext.peakOpenProfitPctOfBasis >= minPeakOpenProfitPctOfBasis &&
        input.exitContext.realizedReturnPct !== null &&
        input.exitContext.realizedReturnPct > 0 &&
        input.supportResistanceContext.hadSupportResistanceContextAvailable &&
        input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
        input.supportResistanceContext.firstEntryHasStackedResistanceAbove &&
        !input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
        input.entryContext.firstEntryCapturedPercentOfTradeMfe !== null &&
        input.entryContext.firstEntryCapturedPercentOfTradeMfe <= maxCapturedMfe &&
        input.entryContext.firstEntryToWorstMovePct !== null &&
        input.entryContext.firstEntryToWorstMovePct >= minAdverseAfterEntry &&
        input.tradeStructure.closedToFlat &&
        input.tradeStructure.totalPositionDecreaseCount > 0 &&
        input.exitContext.postExitCandleCount > 0 &&
        input.exitContext.maxAdverseMovePctAfterExit !== null &&
        input.exitContext.maxAdverseMovePctAfterExit >= minAdversePct &&
        input.exitContext.netMovePctAtEndOfPostExitWindow !== null &&
        input.exitContext.netMovePctAtEndOfPostExitWindow <= maxNetEndPct &&
        input.exitContext.maxAdverseMovePctAfterExit >
          (input.exitContext.maxFavorableMovePctAfterExit ?? Number.NEGATIVE_INFINITY) &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct !== null &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct <= maxGivebackPct;

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.recoveryContext.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.recoveryContext.peakOpenProfitPctOfBasis,
          realizedReturnPct: input.exitContext.realizedReturnPct,
          hadSupportResistanceContextAvailable:
            input.supportResistanceContext.hadSupportResistanceContextAvailable,
          firstEntryClearedNearestResistanceBelow:
            input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
          firstEntryHasStackedResistanceAbove:
            input.supportResistanceContext.firstEntryHasStackedResistanceAbove,
          firstEntryResistanceLevelsAboveWithinClusterCount:
            input.supportResistanceContext.firstEntryResistanceLevelsAboveWithinClusterCount,
          firstEntryCapturedPercentOfTradeMfe:
            input.entryContext.firstEntryCapturedPercentOfTradeMfe,
          firstEntryToWorstMovePct: input.entryContext.firstEntryToWorstMovePct,
          maxGivebackFromPeakOpenProfitPct:
            input.recoveryContext.maxGivebackFromPeakOpenProfitPct,
          maxAdverseMovePctAfterExit: input.exitContext.maxAdverseMovePctAfterExit,
          maxFavorableMovePctAfterExit: input.exitContext.maxFavorableMovePctAfterExit,
          netMovePctAtEndOfPostExitWindow:
            input.exitContext.netMovePctAtEndOfPostExitWindow,
        },
        thresholdsUsed: {
          minPeakOpenProfitPctOfBasis,
          maxCapturedMfe,
          minAdverseAfterEntry,
          minAdversePct,
          maxNetEndPct,
          maxGivebackPct,
        },
      };
    },
  };

export const RECOVERY_WITH_BREAKOUT_INTO_OVERHEAD_RESISTANCE_AND_FAILED_PROFIT_PROTECTION: PatternDefinition =
  {
    id: "recovery_with_breakout_into_overhead_resistance_and_failed_profit_protection",
    name: "Recovery With Breakout Into Overhead Resistance And Failed Profit Protection",
    family: PATTERN_FAMILIES.ENTRY_QUALITY,
    patternType: "composite",
    structuralLevel: "storyline_composite",

    evaluate: (input) => {
      const minRecoveryPeakOpenProfitPctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .CONSTRUCTIVE_RECOVERY_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;
      const minGivebackPct =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_GIVEBACK_PCT;
      const minPeakOpenProfitForFailurePctOfBasis =
        THRESHOLDS.SCALING_QUALITY
          .AGGRESSIVE_ADDING_FAILED_PROTECTION_MIN_PEAK_OPEN_PROFIT_PCT_OF_BASIS;

      const matched =
        input.recoveryContext.hadOpenLossBeforePeakOpenProfit &&
        input.recoveryContext.peakOpenProfitPctOfBasis !== null &&
        input.recoveryContext.peakOpenProfitPctOfBasis >= minRecoveryPeakOpenProfitPctOfBasis &&
        input.supportResistanceContext.hadSupportResistanceContextAvailable &&
        input.supportResistanceContext.firstEntryClearedNearestResistanceBelow &&
        input.supportResistanceContext.firstEntryHasStackedResistanceAbove &&
        !input.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance &&
        input.entryContext.firstEntryCapturedPercentOfTradeMfe !== null &&
        input.entryContext.firstEntryCapturedPercentOfTradeMfe <=
          THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE &&
        input.entryContext.firstEntryToWorstMovePct !== null &&
        input.entryContext.firstEntryToWorstMovePct >=
          THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct !== null &&
        input.recoveryContext.maxGivebackFromPeakOpenProfitPct >= minGivebackPct &&
        input.recoveryContext.peakOpenProfitPctOfBasis >= minPeakOpenProfitForFailurePctOfBasis;

      return {
        matched,
        evidence: {
          hadOpenLossBeforePeakOpenProfit:
            input.recoveryContext.hadOpenLossBeforePeakOpenProfit,
          peakOpenProfitPctOfBasis: input.recoveryContext.peakOpenProfitPctOfBasis,
          hadSupportResistanceContextAvailable:
            input.supportResistanceContext.hadSupportResistanceContextAvailable,
          firstEntryClearedNearestResistanceBelow:
            input.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
          firstEntryHasStackedResistanceAbove:
            input.supportResistanceContext.firstEntryHasStackedResistanceAbove,
          firstEntryResistanceLevelsAboveWithinClusterCount:
            input.supportResistanceContext.firstEntryResistanceLevelsAboveWithinClusterCount,
          firstEntryCapturedPercentOfTradeMfe:
            input.entryContext.firstEntryCapturedPercentOfTradeMfe,
          firstEntryToWorstMovePct: input.entryContext.firstEntryToWorstMovePct,
          maxGivebackFromPeakOpenProfitPct:
            input.recoveryContext.maxGivebackFromPeakOpenProfitPct,
        },
        thresholdsUsed: {
          minRecoveryPeakOpenProfitPctOfBasis,
          maxCapturedMfe:
            THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE,
          minAdverseAfterEntry:
            THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT,
          minGivebackPct,
          minPeakOpenProfitForFailurePctOfBasis,
        },
      };
    },
  };

export const ENTRY_NEAR_SUPPORT_STRUCTURE: PatternDefinition = {
  id: "entry_near_support_structure",
  name: "Entry Near Support Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.supportResistanceContext.hadSupportResistanceContextAvailable &&
      input.supportResistanceContext.firstEntryOccurredNearSupport &&
      !input.supportResistanceContext.firstEntryOccurredNearResistance;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.supportResistanceContext.hadSupportResistanceContextAvailable,
        firstEntryOccurredNearSupport: input.supportResistanceContext.firstEntryOccurredNearSupport,
        firstEntryOccurredNearResistance:
          input.supportResistanceContext.firstEntryOccurredNearResistance,
        firstEntryNearestSupportBelowPrice:
          input.supportResistanceContext.firstEntryNearestSupportBelowPrice,
        firstEntryDistanceToNearestSupportPct:
          input.supportResistanceContext.firstEntryDistanceToNearestSupportPct,
        firstEntryNearestReferenceLevelLabel:
          input.supportResistanceContext.firstEntryNearestReferenceLevelLabel,
      },
      thresholdsUsed: {},
    };
  },
};

export const ENTRY_UNDER_RESISTANCE_STRUCTURE: PatternDefinition = {
  id: "entry_under_resistance_structure",
  name: "Entry Under Resistance Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.supportResistanceContext.hadSupportResistanceContextAvailable &&
      input.supportResistanceContext.firstEntryOccurredNearResistance &&
      !input.supportResistanceContext.firstEntryOccurredNearSupport;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.supportResistanceContext.hadSupportResistanceContextAvailable,
        firstEntryOccurredNearResistance:
          input.supportResistanceContext.firstEntryOccurredNearResistance,
        firstEntryOccurredNearSupport: input.supportResistanceContext.firstEntryOccurredNearSupport,
        firstEntryNearestResistanceAbovePrice:
          input.supportResistanceContext.firstEntryNearestResistanceAbovePrice,
        firstEntryDistanceToNearestResistancePct:
          input.supportResistanceContext.firstEntryDistanceToNearestResistancePct,
      },
      thresholdsUsed: {},
    };
  },
};

export const ENTRY_FAR_FROM_SUPPORT_STRUCTURE: PatternDefinition = {
  id: "entry_far_from_support_structure",
  name: "Entry Far From Support Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.supportResistanceContext.hadSupportResistanceContextAvailable &&
      input.supportResistanceContext.firstEntryDistanceToNearestSupportPct !== null &&
      input.supportResistanceContext.firstEntryDistanceToNearestSupportPct >= 0.03 &&
      !input.supportResistanceContext.firstEntryOccurredNearSupport;

    return {
      matched,
      evidence: {
        hadSupportResistanceContextAvailable:
          input.supportResistanceContext.hadSupportResistanceContextAvailable,
        firstEntryDistanceToNearestSupportPct:
          input.supportResistanceContext.firstEntryDistanceToNearestSupportPct,
        firstEntryOccurredNearSupport: input.supportResistanceContext.firstEntryOccurredNearSupport,
        firstEntryOccurredInOpenAir: input.supportResistanceContext.firstEntryOccurredInOpenAir,
      },
      thresholdsUsed: {
        minDistanceToNearestSupportPct: 0.03,
      },
    };
  },
};

// =========================
// WEAK PULLBACK ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a direction-aware pullback
// - but the eventual entry still had weak structure
// - this is the weak pullback counterpart to the constructive pullback subtype
//
export const WEAK_PULLBACK_ENTRY_STRUCTURE: PatternDefinition = {
  id: "weak_pullback_entry_structure",
  name: "Weak Pullback Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const rangePosition = input.entryContext.firstEntryPricePositionInTradeRangePct;
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const {
      adverseMovePct,
      directionalCandles,
      counterDirectionalCandles,
      normalizedNetMovePct,
    } = getPreEntryDirectionalContext({
      tradeDirection: input.tradeDirection,
      recentRunUpPct: input.entryContext.firstEntryRecentRunUpPctBeforeEntry,
      recentDropPct: input.entryContext.firstEntryRecentDropPctBeforeEntry,
      bullishCandles: input.entryContext.firstEntryBullishCandlesBeforeEntryCount,
      bearishCandles: input.entryContext.firstEntryBearishCandlesBeforeEntryCount,
      recentNetMovePct: input.entryContext.firstEntryRecentNetMovePctBeforeEntry,
    });

    const minRangePosition =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_RANGE_POSITION;
    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const minCounterMovePct =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DROP_MIN_PCT;
    const maxNetMovePct =
      THRESHOLDS.ENTRY_QUALITY.CONSTRUCTIVE_PULLBACK_MAX_NET_MOVE_PCT;
    const directionalCandleEdge =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DIRECTIONAL_CANDLE_EDGE;

    const matched =
      rangePosition !== null &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      adverseMovePct !== null &&
      normalizedNetMovePct !== null &&
      rangePosition >= minRangePosition &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      adverseMovePct >= minCounterMovePct &&
      normalizedNetMovePct <= maxNetMovePct &&
      counterDirectionalCandles >=
        directionalCandles + directionalCandleEdge;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryPricePositionInTradeRangePct: rangePosition,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        adverseMovePctBeforeEntry: adverseMovePct,
        normalizedRecentNetMovePctBeforeEntry: normalizedNetMovePct,
        directionalCandlesBeforeEntryCount: directionalCandles,
        counterDirectionalCandlesBeforeEntryCount:
          counterDirectionalCandles,
      },
      thresholdsUsed: {
        minRangePosition,
        maxCapturedMfe,
        minAdverseAfterEntry,
        minCounterMovePct,
        maxNetMovePct,
        directionalCandleEdge,
      },
    };
  },
};

// =========================
// DEEP CONSTRUCTIVE PULLBACK ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a larger direction-aware pullback against the trade
// - despite that deeper counter move, the eventual entry still retained strong structure
// - this is the stronger constructive counterpart above the broad constructive pullback subtype
//
export const DEEP_CONSTRUCTIVE_PULLBACK_ENTRY_STRUCTURE: PatternDefinition = {
  id: "deep_constructive_pullback_entry_structure",
  name: "Deep Constructive Pullback Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const rangePosition = input.entryContext.firstEntryPricePositionInTradeRangePct;
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const {
      adverseMovePct,
      directionalCandles,
      counterDirectionalCandles,
      normalizedNetMovePct,
    } = getPreEntryDirectionalContext({
      tradeDirection: input.tradeDirection,
      recentRunUpPct: input.entryContext.firstEntryRecentRunUpPctBeforeEntry,
      recentDropPct: input.entryContext.firstEntryRecentDropPctBeforeEntry,
      bullishCandles: input.entryContext.firstEntryBullishCandlesBeforeEntryCount,
      bearishCandles: input.entryContext.firstEntryBearishCandlesBeforeEntryCount,
      recentNetMovePct: input.entryContext.firstEntryRecentNetMovePctBeforeEntry,
    });

    const maxRangePosition =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_RANGE_POSITION;
    const minCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MIN_CAPTURED_MFE;
    const maxAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.ADVANTAGED_MAX_ADVERSE_AFTER_ENTRY_PCT;
    const minCounterMovePct =
      THRESHOLDS.ENTRY_QUALITY.DEEP_CONSTRUCTIVE_PULLBACK_MIN_COUNTER_MOVE_PCT;
    const maxNetMovePct =
      THRESHOLDS.ENTRY_QUALITY.DEEP_CONSTRUCTIVE_PULLBACK_MAX_NET_MOVE_PCT;
    const directionalCandleEdge =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DIRECTIONAL_CANDLE_EDGE;

    const matched =
      rangePosition !== null &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      adverseMovePct !== null &&
      normalizedNetMovePct !== null &&
      rangePosition <= maxRangePosition &&
      capturedMfe >= minCapturedMfe &&
      adverseAfterEntry <= maxAdverseAfterEntry &&
      adverseMovePct >= minCounterMovePct &&
      normalizedNetMovePct <= maxNetMovePct &&
      counterDirectionalCandles >=
        directionalCandles + directionalCandleEdge;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryPricePositionInTradeRangePct: rangePosition,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        adverseMovePctBeforeEntry: adverseMovePct,
        normalizedRecentNetMovePctBeforeEntry: normalizedNetMovePct,
        directionalCandlesBeforeEntryCount: directionalCandles,
        counterDirectionalCandlesBeforeEntryCount:
          counterDirectionalCandles,
      },
      thresholdsUsed: {
        maxRangePosition,
        minCapturedMfe,
        maxAdverseAfterEntry,
        minCounterMovePct,
        maxNetMovePct,
        directionalCandleEdge,
      },
    };
  },
};

// =========================
// DEEP WEAK PULLBACK ENTRY STRUCTURE
// =========================
//
// Structural meaning:
// - entry followed a large direction-aware pullback against the trade
// - despite that deeper counter move, the eventual entry still had weak structure
// - this is the sharper weak-pullback extreme above the broad weak pullback subtype
//
export const DEEP_WEAK_PULLBACK_ENTRY_STRUCTURE: PatternDefinition = {
  id: "deep_weak_pullback_entry_structure",
  name: "Deep Weak Pullback Entry Structure",
  family: PATTERN_FAMILIES.ENTRY_QUALITY,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const rangePosition = input.entryContext.firstEntryPricePositionInTradeRangePct;
    const capturedMfe = input.entryContext.firstEntryCapturedPercentOfTradeMfe;
    const adverseAfterEntry = input.entryContext.firstEntryToWorstMovePct;
    const {
      adverseMovePct,
      directionalCandles,
      counterDirectionalCandles,
      normalizedNetMovePct,
    } = getPreEntryDirectionalContext({
      tradeDirection: input.tradeDirection,
      recentRunUpPct: input.entryContext.firstEntryRecentRunUpPctBeforeEntry,
      recentDropPct: input.entryContext.firstEntryRecentDropPctBeforeEntry,
      bullishCandles: input.entryContext.firstEntryBullishCandlesBeforeEntryCount,
      bearishCandles: input.entryContext.firstEntryBearishCandlesBeforeEntryCount,
      recentNetMovePct: input.entryContext.firstEntryRecentNetMovePctBeforeEntry,
    });

    const minRangePosition =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_RANGE_POSITION;
    const maxCapturedMfe =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MAX_CAPTURED_MFE;
    const minAdverseAfterEntry =
      THRESHOLDS.ENTRY_QUALITY.DISADVANTAGED_MIN_ADVERSE_AFTER_ENTRY_PCT;
    const minCounterMovePct =
      THRESHOLDS.ENTRY_QUALITY.DEEP_WEAK_PULLBACK_MIN_COUNTER_MOVE_PCT;
    const maxNetMovePct =
      THRESHOLDS.ENTRY_QUALITY.DEEP_WEAK_PULLBACK_MAX_NET_MOVE_PCT;
    const directionalCandleEdge =
      THRESHOLDS.ENTRY_CONTEXT.RECENT_DIRECTIONAL_CANDLE_EDGE;

    const matched =
      rangePosition !== null &&
      capturedMfe !== null &&
      adverseAfterEntry !== null &&
      adverseMovePct !== null &&
      normalizedNetMovePct !== null &&
      rangePosition >= minRangePosition &&
      capturedMfe <= maxCapturedMfe &&
      adverseAfterEntry >= minAdverseAfterEntry &&
      adverseMovePct >= minCounterMovePct &&
      normalizedNetMovePct <= maxNetMovePct &&
      counterDirectionalCandles >=
        directionalCandles + directionalCandleEdge;

    return {
      matched,
      evidence: {
        tradeDirection: input.tradeDirection,
        firstEntryPricePositionInTradeRangePct: rangePosition,
        firstEntryCapturedPercentOfTradeMfe: capturedMfe,
        firstEntryToWorstMovePct: adverseAfterEntry,
        adverseMovePctBeforeEntry: adverseMovePct,
        normalizedRecentNetMovePctBeforeEntry: normalizedNetMovePct,
        directionalCandlesBeforeEntryCount: directionalCandles,
        counterDirectionalCandlesBeforeEntryCount:
          counterDirectionalCandles,
      },
      thresholdsUsed: {
        minRangePosition,
        maxCapturedMfe,
        minAdverseAfterEntry,
        minCounterMovePct,
        maxNetMovePct,
        directionalCandleEdge,
      },
    };
  },
};

export const ENTRY_QUALITY_PATTERNS: PatternDefinition[] = [
  ADVANTAGED_ENTRY_STRUCTURE,
  DISADVANTAGED_ENTRY_STRUCTURE,
  EFFICIENT_ENTRY_STRUCTURE,
  INEFFICIENT_ENTRY_STRUCTURE,
  LATE_FAVORABLE_EXTENSION_ENTRY_STRUCTURE,
  CONSTRUCTIVE_PULLBACK_ENTRY_STRUCTURE,
  DISCIPLINED_FAVORABLE_EXTENSION_ENTRY_STRUCTURE,
  BREAKOUT_ENTRY_STRUCTURE,
  MEASURED_FAVORABLE_EXTENSION_ENTRY_STRUCTURE,
  OVEREXTENDED_CHASE_ENTRY_STRUCTURE,
  BREAKOUT_CHASE_ENTRY_STRUCTURE,
  FAILED_BREAKOUT_ENTRY_STRUCTURE,
  RECLAIM_ENTRY_STRUCTURE,
  FAILED_RECLAIM_ENTRY_STRUCTURE,
  MEAN_REVERSION_ENTRY_STRUCTURE,
  FAILED_MEAN_REVERSION_ENTRY_STRUCTURE,
  OPENING_RANGE_BREAKOUT_ENTRY_STRUCTURE,
  OPENING_RANGE_BREAKOUT_CHASE_ENTRY_STRUCTURE,
  FAILED_OPENING_RANGE_BREAKOUT_ENTRY_STRUCTURE,
  OPENING_RANGE_RECLAIM_ENTRY_STRUCTURE,
  FAILED_OPENING_RANGE_RECLAIM_ENTRY_STRUCTURE,
  MARKET_OPEN_BREAKOUT_ENTRY_STRUCTURE,
  MARKET_OPEN_BREAKOUT_CHASE_ENTRY_STRUCTURE,
  FAILED_MARKET_OPEN_BREAKOUT_ENTRY_STRUCTURE,
  MARKET_OPEN_RECLAIM_ENTRY_STRUCTURE,
  FAILED_MARKET_OPEN_RECLAIM_ENTRY_STRUCTURE,
  BREAKOUT_WITH_ROOM_ABOVE_STRUCTURE,
  BREAKOUT_INTO_OVERHEAD_RESISTANCE_STRUCTURE,
  BREAKOUT_WITH_ROOM_ABOVE_AND_CONSTRUCTIVE_FINAL_EXIT,
  BREAKOUT_WITH_ROOM_ABOVE_AND_FAILED_PROFIT_PROTECTION,
  BREAKOUT_INTO_OVERHEAD_RESISTANCE_WITH_DEFENSIVE_FINAL_EXIT,
  BREAKOUT_INTO_OVERHEAD_RESISTANCE_WITH_FAILED_PROFIT_PROTECTION,
  RECOVERY_WITH_BREAKOUT_WITH_ROOM_ABOVE_AND_CONSTRUCTIVE_FINAL_EXIT,
  RECOVERY_WITH_BREAKOUT_WITH_ROOM_ABOVE_AND_FAILED_PROFIT_PROTECTION,
  RECOVERY_WITH_BREAKOUT_INTO_OVERHEAD_RESISTANCE_AND_DEFENSIVE_FINAL_EXIT,
  RECOVERY_WITH_BREAKOUT_INTO_OVERHEAD_RESISTANCE_AND_FAILED_PROFIT_PROTECTION,
  ENTRY_NEAR_SUPPORT_STRUCTURE,
  ENTRY_FAR_FROM_SUPPORT_STRUCTURE,
  ENTRY_UNDER_RESISTANCE_STRUCTURE,
  WEAK_PULLBACK_ENTRY_STRUCTURE,
  DEEP_CONSTRUCTIVE_PULLBACK_ENTRY_STRUCTURE,
  DEEP_WEAK_PULLBACK_ENTRY_STRUCTURE,
];


