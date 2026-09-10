import type { TradersLinkAiReadPayload } from "@/src/lib/live-watchlist/live-watchlist-types";

import type { DailyRecapBreakoutPlan } from "./ai-read-pullback-recap";

function validPrice(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Uses the published AI Read's own "Where the trade could go next" prices.
 * Generic level maps never stand in for those analysis horizons.
 */
export function breakoutPlanFromAiRead(
  read: TradersLinkAiReadPayload,
  publishedAtMs: number,
): DailyRecapBreakoutPlan | null {
  if (!Number.isSafeInteger(publishedAtMs) || publishedAtMs <= 0) return null;
  if (!validPrice(read.mustClear.price) || !validPrice(read.breakoutContinuation.price)) return null;
  const v4Levels = read.version === 4
    ? [
      read.forwardPlan.nearestRealistic,
      read.forwardPlan.continuedMomentum,
      read.forwardPlan.strongExpansion,
      read.forwardPlan.extremeMomentum,
      ...read.forwardPlan.additionalObservedOutcomes,
    ].filter((horizon) => horizon.available && validPrice(horizon.price)).map((horizon) => horizon.price)
    : read.targets.map((target) => target.price).filter(validPrice);
  const nextLevelPrices = [...new Set(v4Levels)]
    .filter((price) => price >= read.breakoutContinuation.price)
    .sort((left, right) => left - right);
  return Object.freeze({
    breakoutTriggerPrice: read.breakoutContinuation.price,
    clearedPrice: read.mustClear.price,
    nextLevelPrices: Object.freeze(nextLevelPrices),
    publishedAtMs,
  });
}
