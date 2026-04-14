// 2026-04-14
// PURPOSE:
// Converts raw confluence and interaction evidence into a deterministic
// structural-level score and strength bucket.

import type {
  StructuralLevel,
  StructuralLevelStrengthBucket,
} from "../../raw-trade-timeline/types/structural-level";

function getReactionBonus(reactionStrength: StructuralLevel["reactionStrength"]): number {
  switch (reactionStrength) {
    case "strong":
      return 3;
    case "moderate":
      return 2;
    case "weak":
      return 1;
    default:
      return 0;
  }
}

function getStrengthBucket(score: number): StructuralLevelStrengthBucket {
  if (score >= 9) {
    return "strong";
  }

  if (score >= 5) {
    return "medium";
  }

  return "weak";
}

export function scoreStructuralLevels(levels: StructuralLevel[]): StructuralLevel[] {
  return levels.map((level) => {
    const score =
      (level.isMandatoryAnchor ? 3 : 1) +
      level.confluenceCount +
      level.touchClusterCount +
      Math.min(level.touchCount, 3) +
      getReactionBonus(level.reactionStrength);

    return {
      ...level,
      score,
      strengthBucket: getStrengthBucket(score),
    };
  });
}
