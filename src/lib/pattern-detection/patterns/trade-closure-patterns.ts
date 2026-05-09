// =========================
// 2026-04-12 03:42 PM America/Toronto
// TRADE CLOSURE PATTERNS
// =========================
//
// PURPOSE:
// Detects isolated closure state facts from PatternInput.
//
// CURRENT DESIGN:
// These are atomic patterns.
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import {
  PATTERN_FAMILIES,
  THRESHOLDS,
} from "../types/pattern-detection-types";

export const FULLY_CLOSED_TRADE: PatternDefinition = {
  id: "fully_closed_trade",
  name: "Fully Closed Trade",
  family: PATTERN_FAMILIES.TRADE_CLOSURE,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    return {
      matched: input.tradeStructure.closedToFlat === true,
      evidence: {
        closedToFlat: input.tradeStructure.closedToFlat,
        finalPositionSize: input.tradeStructure.finalPositionSize,
      },
      thresholdsUsed: {},
    };
  },
};

export const PARTIAL_POSITION_LEFT: PatternDefinition = {
  id: "partial_position_left",
  name: "Partial Position Left",
  family: PATTERN_FAMILIES.TRADE_CLOSURE,
  patternType: "atomic",
  structuralLevel: "atomic",

  evaluate: (input) => {
    const threshold =
      THRESHOLDS.TRADE_CLOSURE.MIN_REMAINING_POSITION_FOR_PARTIAL;

    return {
      matched: input.tradeStructure.finalPositionSize >= threshold,
      evidence: {
        finalPositionSize: input.tradeStructure.finalPositionSize,
        closedToFlat: input.tradeStructure.closedToFlat,
      },
      thresholdsUsed: {
        minRemainingPosition: threshold,
      },
    };
  },
};

export const TRADE_CLOSURE_PATTERNS: PatternDefinition[] = [
  FULLY_CLOSED_TRADE,
  PARTIAL_POSITION_LEFT,
];


