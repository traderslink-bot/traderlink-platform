// 2026-04-14
// PURPOSE:
// Measures whether price meaningfully reacts away from a touched level.

import { SUPPORT_RESISTANCE_CONFIG } from "../config/support-resistance-config";
import type { Candle } from "../../raw-trade-timeline/types/candle";
import type {
  StructuralLevel,
  StructuralLevelReactionStrength,
} from "../../raw-trade-timeline/types/structural-level";

function getReactionStrengthFromPct(pctMove: number): StructuralLevelReactionStrength {
  if (pctMove >= SUPPORT_RESISTANCE_CONFIG.strongReactionThresholdPct) {
    return "strong";
  }

  if (pctMove >= SUPPORT_RESISTANCE_CONFIG.moderateReactionThresholdPct) {
    return "moderate";
  }

  if (pctMove >= SUPPORT_RESISTANCE_CONFIG.weakReactionThresholdPct) {
    return "weak";
  }

  return "none";
}

function pickStrongerReaction(
  left: StructuralLevelReactionStrength,
  right: StructuralLevelReactionStrength,
): StructuralLevelReactionStrength {
  const rank: Record<StructuralLevelReactionStrength, number> = {
    none: 0,
    weak: 1,
    moderate: 2,
    strong: 3,
  };

  return rank[right] > rank[left] ? right : left;
}

export function measureLevelReactions(
  levels: StructuralLevel[],
  candles: Candle[],
): StructuralLevel[] {
  return levels.map((level) => {
    let reactionStrength: StructuralLevelReactionStrength = "none";

    candles.forEach((candle, index) => {
      const tolerance = level.price * SUPPORT_RESISTANCE_CONFIG.touchTolerancePct / 100;
      const touched = candle.low - tolerance <= level.price && candle.high + tolerance >= level.price;

      if (!touched) {
        return;
      }

      const reactionWindow = candles.slice(
        index + 1,
        index + 1 + SUPPORT_RESISTANCE_CONFIG.reactionLookaheadCandles,
      );

      if (reactionWindow.length === 0) {
        return;
      }

      const pctMove =
        level.side === "resistance"
          ? Math.max(
              ((level.price - Math.min(...reactionWindow.map((next) => next.low))) /
                level.price) *
                100,
              ((level.price - Math.min(...reactionWindow.map((next) => next.close))) /
                level.price) *
                100,
            )
          : Math.max(
              ((Math.max(...reactionWindow.map((next) => next.high)) - level.price) /
                level.price) *
                100,
              ((Math.max(...reactionWindow.map((next) => next.close)) - level.price) /
                level.price) *
                100,
            );

      reactionStrength = pickStrongerReaction(
        reactionStrength,
        getReactionStrengthFromPct(pctMove),
      );
    });

    return {
      ...level,
      reactionStrength,
    };
  });
}
