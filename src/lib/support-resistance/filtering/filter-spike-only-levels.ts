// 2026-04-14
// PURPOSE:
// Removes one-print weak levels that never earned follow-up interaction.

import type { StructuralLevel } from "../../raw-trade-timeline/types/structural-level";

export function filterSpikeOnlyLevels(levels: StructuralLevel[]): StructuralLevel[] {
  return levels.filter((level) => {
    if (level.isMandatoryAnchor) {
      return true;
    }

    const isSinglePrint =
      level.sourcePrices.length <= 1 &&
      level.touchCount <= 1 &&
      level.touchClusterCount <= 1 &&
      level.reactionStrength === "none";

    return !isSinglePrint;
  });
}
