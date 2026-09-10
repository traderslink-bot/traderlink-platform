import type { TradersLinkAiReadPayload } from "@/src/lib/live-watchlist/live-watchlist-types";

import { breakoutPlanFromAiRead } from "./ai-read-breakout-plan";
import {
  buildAiReadPullbackRecoveryRecap,
  buildAiReadSetupInvalidationRecap,
  buildAnalysisBreakoutRecap,
  type DailyRecapPriceObservation,
  type DailyRecapPullbackPlan,
} from "./ai-read-pullback-recap";
import { buildDeterministicWatchlistRecapDraft } from "./deterministic-recap-draft";

function pullbackPlans(
  read: TradersLinkAiReadPayload,
  publishedAtMs: number,
): readonly DailyRecapPullbackPlan[] {
  if (read.version !== 3 && read.version !== 4) return [];
  return (["shallow", "deep"] as const).flatMap((kind) => {
    const plan = read.pullbackPlans[kind];
    return plan ? [{ kind, publishedAtMs, zoneHigh: plan.zoneHigh, zoneLow: plan.zoneLow }] : [];
  });
}

function withoutPostedSentence(value: string): string {
  const index = value.indexOf(". ");
  return index < 0 ? value : value.slice(index + 2);
}

function breakoutContextOnly(value: string): string {
  return withoutPostedSentence(value).replace(/ Price reached a high of .*$/u, "");
}

/** Builds one natural ticker recap; analysis details enrich but never gate it. */
export function buildDailyWatchlistAnalysisRecap(input: Readonly<{
  aiRead?: Readonly<{ publishedAtMs: number; read: TradersLinkAiReadPayload }>;
  observations: readonly DailyRecapPriceObservation[];
  postedAtMs: number;
  postedPrice: number;
  symbol: string;
}>): string {
  if (input.observations.length === 0) throw new Error("watchlist_daily_recap_missing_observations");
  const high = input.observations.reduce((value, item) => item.price > value.price ? item : value);
  const latest = input.observations.reduce((value, item) => item.observedAtMs > value.observedAtMs ? item : value);
  const basic = buildDeterministicWatchlistRecapDraft({
    highPrice: high.price,
    highPriceAtMs: high.observedAtMs,
    latestPrice: latest.price,
    latestPriceAtMs: latest.observedAtMs,
    postedAtMs: input.postedAtMs,
    postedPrice: input.postedPrice,
    symbol: input.symbol,
  }).text;
  if (!input.aiRead) return basic;

  const recovery = pullbackPlans(input.aiRead.read, input.aiRead.publishedAtMs)
    .filter((plan) => plan.kind === "shallow")
    .map((plan) => buildAiReadPullbackRecoveryRecap({ ...input, plan }))
    .find((result) => result !== null);
  // A later, larger run after the regular area breaks is a posted-price story,
  // not credit for an earlier small bounce or a deep-recovery success.
  const laterHigh = recovery ? input.observations
    .filter((value) => value.observedAtMs >= recovery.pullbackAtMs)
    .reduce((highest, value) => Math.max(highest, value.price), recovery.recoveryHigh) : null;
  const reportableRecovery = recovery && recovery.recoveryHigh === laterHigh ? recovery : null;
  const pullback = reportableRecovery && reportableRecovery.recoveryHigh >= high.price ? reportableRecovery : null;
  const breakoutPlan = breakoutPlanFromAiRead(input.aiRead.read, input.aiRead.publishedAtMs);
  const breakout = breakoutPlan
    ? buildAnalysisBreakoutRecap({ ...input, plan: breakoutPlan })
    : null;
  const initialObservations = recovery ? input.observations.filter((value) => value.observedAtMs < recovery.pullbackAtMs) : [];
  const initialHigh = initialObservations.reduce<DailyRecapPriceObservation | null>((highest, value) => !highest || value.price > highest.price ? value : highest, null);
  if (reportableRecovery && recovery && initialHigh && initialHigh.price > input.postedPrice) {
    const initialBreakout = breakoutPlan ? buildAnalysisBreakoutRecap({ ...input, observations: initialObservations, plan: breakoutPlan }) : null;
    const initialMove = buildDeterministicWatchlistRecapDraft({
      highPrice: initialHigh.price, highPriceAtMs: initialHigh.observedAtMs,
      latestPrice: initialHigh.price, latestPriceAtMs: initialHigh.observedAtMs,
      postedAtMs: input.postedAtMs, postedPrice: input.postedPrice, symbol: input.symbol,
    }).text;
    const newLevels = breakoutPlan?.nextLevelPrices.filter((price) => price > initialHigh.price && price <= recovery.recoveryHigh) ?? [];
    const laterLevels = newLevels.length ? ` The later run also reached the next analysis level${newLevels.length === 1 ? "" : "s"} ${newLevels.map((price) => `$${price >= 1 ? price.toFixed(2) : price.toFixed(4)}`).join(", ")}.` : "";
    return `${initialBreakout ?? initialMove} ${withoutPostedSentence(recovery.text)}${laterLevels}`;
  }
  if (pullback && breakout) return `${pullback.text} ${breakoutContextOnly(breakout)}`;
  if (pullback) return pullback.text;
  if (high.price > input.postedPrice) return breakout ?? basic;
  const failurePrice = input.aiRead.read.momentumFailure.price;
  if (failurePrice !== null) {
    const invalidation = pullbackPlans(input.aiRead.read, input.aiRead.publishedAtMs)
      .map((plan) => buildAiReadSetupInvalidationRecap({
        observations: input.observations,
        plan: { ...plan, momentumFailurePrice: failurePrice },
        postedAtMs: input.postedAtMs,
        symbol: input.symbol,
      }))
      .find((text) => text !== null);
    if (invalidation) return invalidation;
  }
  return basic;
}
