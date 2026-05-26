// =========================
// 2026-04-12 03:42 PM America/Toronto
// POSITION STRUCTURE PATTERNS
// =========================
//
// PURPOSE:
// Detects higher-order trade structure patterns from PatternInput.
//
// CURRENT DESIGN:
// These are composite patterns because they combine multiple structural facts.
//
// IMPORTANT:
// Right now, composite patterns still evaluate directly from PatternInput.
// We are NOT yet building composites from previously matched atomic patterns.
//
// FUTURE EXPANSION MAY INCLUDE:
// - dependency metadata showing which atomic patterns support each composite
// - suppression rules to reduce redundant output
// - downstream prioritization of composites over atomics
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

export const AGGRESSIVE_SCALE_IN: PatternDefinition = {
  id: "aggressive_scale_in",
  name: "Aggressive Scale In",
  family: PATTERN_FAMILIES.POSITION_STRUCTURE,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minIncreaseEvents =
      THRESHOLDS.POSITION_BUILDING.MULTI_INCREASE_MIN_EVENTS;
    const minExecutionsPerMinute =
      THRESHOLDS.EXECUTION_FREQUENCY.HIGH_MIN_EXECUTIONS_PER_MINUTE;

    const executionsPerMinute = input.timingContext.executionsPerMinute ?? 0;

    const matched =
      input.tradeStructure.totalPositionIncreaseCount >= minIncreaseEvents &&
      executionsPerMinute >= minExecutionsPerMinute;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: input.tradeStructure.totalPositionIncreaseCount,
        executionsPerMinute,
        hadMultipleIncreases: input.tradeStructure.hadMultipleIncreases,
      },
      thresholdsUsed: {
        minIncreaseEvents,
        minExecutionsPerMinute,
      },
    };
  },
};

export const PASSIVE_SCALE_IN: PatternDefinition = {
  id: "passive_scale_in",
  name: "Passive Scale In",
  family: PATTERN_FAMILIES.POSITION_STRUCTURE,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minIncreaseEvents =
      THRESHOLDS.POSITION_BUILDING.MULTI_INCREASE_MIN_EVENTS;
    const maxExecutionsPerMinute =
      THRESHOLDS.EXECUTION_FREQUENCY.LOW_MAX_EXECUTIONS_PER_MINUTE;

    const executionsPerMinute = input.timingContext.executionsPerMinute ?? 0;

    const matched =
      input.tradeStructure.totalPositionIncreaseCount >= minIncreaseEvents &&
      executionsPerMinute <= maxExecutionsPerMinute;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: input.tradeStructure.totalPositionIncreaseCount,
        executionsPerMinute,
        hadMultipleIncreases: input.tradeStructure.hadMultipleIncreases,
      },
      thresholdsUsed: {
        minIncreaseEvents,
        maxExecutionsPerMinute,
      },
    };
  },
};

export const SINGLE_BUILD_FULL_EXIT: PatternDefinition = {
  id: "single_build_full_exit",
  name: "Single Build Full Exit",
  family: PATTERN_FAMILIES.POSITION_STRUCTURE,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.tradeStructure.totalPositionIncreaseCount === 1 &&
      input.tradeStructure.closedToFlat === true &&
      input.tradeStructure.finalPositionSize === 0;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: input.tradeStructure.totalPositionIncreaseCount,
        closedToFlat: input.tradeStructure.closedToFlat,
        finalPositionSize: input.tradeStructure.finalPositionSize,
      },
      thresholdsUsed: {
        requiredIncreaseEvents: 1,
      },
    };
  },
};

export const MULTI_BUILD_FULL_EXIT: PatternDefinition = {
  id: "multi_build_full_exit",
  name: "Multi Build Full Exit",
  family: PATTERN_FAMILIES.POSITION_STRUCTURE,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minIncreaseEvents =
      THRESHOLDS.POSITION_BUILDING.MULTI_INCREASE_MIN_EVENTS;

    const matched =
      input.tradeStructure.totalPositionIncreaseCount >= minIncreaseEvents &&
      input.tradeStructure.closedToFlat === true &&
      input.tradeStructure.finalPositionSize === 0;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: input.tradeStructure.totalPositionIncreaseCount,
        closedToFlat: input.tradeStructure.closedToFlat,
        finalPositionSize: input.tradeStructure.finalPositionSize,
      },
      thresholdsUsed: {
        minIncreaseEvents,
      },
    };
  },
};

export const MULTI_BUILD_PARTIAL_EXIT: PatternDefinition = {
  id: "multi_build_partial_exit",
  name: "Multi Build Partial Exit",
  family: PATTERN_FAMILIES.POSITION_STRUCTURE,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minIncreaseEvents =
      THRESHOLDS.POSITION_BUILDING.MULTI_INCREASE_MIN_EVENTS;
    const minRemainingPosition =
      THRESHOLDS.TRADE_CLOSURE.MIN_REMAINING_POSITION_FOR_PARTIAL;

    const matched =
      input.tradeStructure.totalPositionIncreaseCount >= minIncreaseEvents &&
      input.tradeStructure.finalPositionSize >= minRemainingPosition;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: input.tradeStructure.totalPositionIncreaseCount,
        finalPositionSize: input.tradeStructure.finalPositionSize,
        closedToFlat: input.tradeStructure.closedToFlat,
      },
      thresholdsUsed: {
        minIncreaseEvents,
        minRemainingPosition,
      },
    };
  },
};

export const SCALE_IN_THEN_REDUCE: PatternDefinition = {
  id: "scale_in_then_reduce",
  name: "Scale In Then Reduce",
  family: PATTERN_FAMILIES.POSITION_STRUCTURE,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const minIncreaseEvents =
      THRESHOLDS.POSITION_BUILDING.MULTI_INCREASE_MIN_EVENTS;
    const minDecreaseEvents =
      THRESHOLDS.POSITION_REDUCTION.MULTI_DECREASE_MIN_EVENTS;

    const matched =
      input.tradeStructure.totalPositionIncreaseCount >= minIncreaseEvents &&
      input.tradeStructure.totalPositionDecreaseCount >= minDecreaseEvents;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: input.tradeStructure.totalPositionIncreaseCount,
        totalPositionDecreaseCount: input.tradeStructure.totalPositionDecreaseCount,
      },
      thresholdsUsed: {
        minIncreaseEvents,
        minDecreaseEvents,
      },
    };
  },
};

export const ONE_AND_DONE_ROUND_TRIP: PatternDefinition = {
  id: "one_and_done_round_trip",
  name: "One And Done Round Trip",
  family: PATTERN_FAMILIES.POSITION_STRUCTURE,
  patternType: "composite",
  structuralLevel: "structural_composite",

  evaluate: (input) => {
    const matched =
      input.tradeStructure.totalPositionIncreaseCount === 1 &&
      input.tradeStructure.totalPositionDecreaseCount === 1 &&
      input.tradeStructure.closedToFlat === true &&
      input.tradeStructure.finalPositionSize === 0;

    return {
      matched,
      evidence: {
        totalPositionIncreaseCount: input.tradeStructure.totalPositionIncreaseCount,
        totalPositionDecreaseCount: input.tradeStructure.totalPositionDecreaseCount,
        closedToFlat: input.tradeStructure.closedToFlat,
        finalPositionSize: input.tradeStructure.finalPositionSize,
      },
      thresholdsUsed: {
        requiredIncreaseEvents: 1,
        requiredDecreaseEvents: 1,
      },
    };
  },
};

export const POSITION_STRUCTURE_PATTERNS: PatternDefinition[] = [
  AGGRESSIVE_SCALE_IN,
  PASSIVE_SCALE_IN,
  SINGLE_BUILD_FULL_EXIT,
  MULTI_BUILD_FULL_EXIT,
  MULTI_BUILD_PARTIAL_EXIT,
  SCALE_IN_THEN_REDUCE,
  ONE_AND_DONE_ROUND_TRIP,
];


