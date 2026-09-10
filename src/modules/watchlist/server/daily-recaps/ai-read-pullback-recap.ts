export type DailyRecapPullbackPlan = Readonly<{
  kind: "shallow" | "deep";
  publishedAtMs: number;
  zoneHigh: number;
  zoneLow: number;
}>;

export type DailyRecapPriceObservation = Readonly<{
  observedAtMs: number;
  price: number;
}>;

export type DailyRecapPullbackResult = Readonly<{
  scenario: "pullback_recovery" | "near_zone_recovery";
  recoveryHigh: number;
  pullbackAtMs: number;
  text: string;
}>;

export type DailyRecapInvalidationPlan = Readonly<{
  momentumFailurePrice: number;
  publishedAtMs: number;
  zoneHigh: number;
  zoneLow: number;
}>;

export type DailyRecapBreakoutPlan = Readonly<{
  breakoutTriggerPrice: number;
  clearedPrice: number;
  nextLevelPrices: readonly number[];
  publishedAtMs: number;
}>;

function assertPrice(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`watchlist_daily_recap_invalid_${field}`);
}

function assertTimestamp(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`watchlist_daily_recap_invalid_${field}`);
}

function formatPrice(value: number): string {
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function formatPercent(value: number): string {
  return value.toFixed(1);
}

function formatPostedTime(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

function normalizedObservations(
  postedAtMs: number,
  values: readonly DailyRecapPriceObservation[],
): readonly DailyRecapPriceObservation[] {
  return Object.freeze(values.map((value) => {
    assertPrice(value.price, "observation_price");
    assertTimestamp(value.observedAtMs, "observation_at");
    if (value.observedAtMs < postedAtMs) {
      throw new Error("watchlist_daily_recap_observation_precedes_post");
    }
    return Object.freeze({ ...value });
  }).sort((left, right) => left.observedAtMs - right.observedAtMs));
}

/** Retain an already completed recovery even if a lower low occurs later. */
function bestRecovery(observations: readonly DailyRecapPriceObservation[], postedPrice: number, zoneHigh: number): {
  low: DailyRecapPriceObservation; high: DailyRecapPriceObservation;
} | null {
  let low: DailyRecapPriceObservation | null = null;
  let best: { low: DailyRecapPriceObservation; high: DailyRecapPriceObservation } | null = null;
  for (const value of observations) {
    if (low && value.observedAtMs > low.observedAtMs && value.price > low.price
      && (!best || value.price / low.price > best.high.price / best.low.price)) {
      best = { low, high: value };
    }
    if ((value.price < postedPrice || value.price <= zoneHigh) && (!low || value.price < low.price)) low = value;
  }
  return best;
}

/**
 * Identifies an AI Read pullback-plan outcome from facts published before the
 * relevant price sequence. The pullback result uses the actual accepted
 * pullback price, never the original alert price or an assumed zone edge.
 */
export function buildAiReadPullbackRecoveryRecap(input: Readonly<{
  observations: readonly DailyRecapPriceObservation[];
  plan: DailyRecapPullbackPlan;
  postedAtMs: number;
  postedPrice: number;
  symbol: string;
}>): DailyRecapPullbackResult | null {
  if (input.plan.kind === "deep") return null;
  if (!/^[A-Z0-9.-]{1,20}$/.test(input.symbol)) {
    throw new Error("watchlist_daily_recap_invalid_symbol");
  }
  assertTimestamp(input.postedAtMs, "posted_at");
  assertPrice(input.postedPrice, "posted_price");
  assertTimestamp(input.plan.publishedAtMs, "pullback_plan_published_at");
  assertPrice(input.plan.zoneLow, "pullback_zone_low");
  assertPrice(input.plan.zoneHigh, "pullback_zone_high");
  if (input.plan.zoneHigh < input.plan.zoneLow) {
    throw new Error("watchlist_daily_recap_invalid_pullback_zone");
  }
  const observations = normalizedObservations(input.postedAtMs, input.observations)
    .filter((value) => value.observedAtMs >= input.plan.publishedAtMs);
  if (observations.length === 0) return null;

  const breakAt = observations.find((value) => value.price < input.plan.zoneLow)?.observedAtMs;
  const recovery = bestRecovery(observations.filter((value) => breakAt === undefined || value.observedAtMs < breakAt), input.postedPrice, input.plan.zoneHigh);
  if (!recovery) return null;
  const { low: actualLow, high: recoveryHigh } = recovery;
  if (actualLow.price >= input.plan.zoneLow && actualLow.price <= input.plan.zoneHigh) {
    const pullbackGain = ((recoveryHigh.price - actualLow.price) / actualLow.price) * 100;
    return Object.freeze({
      scenario: "pullback_recovery",
      recoveryHigh: recoveryHigh.price,
      pullbackAtMs: actualLow.observedAtMs,
      text: `${input.symbol} was posted to the Watchlist at ${formatPostedTime(input.postedAtMs)}. Analysis included a ${input.plan.kind} pullback area of $${formatPrice(input.plan.zoneLow)}-$${formatPrice(input.plan.zoneHigh)}. Price traded into that area, reached $${formatPrice(actualLow.price)}, and then ran to $${formatPrice(recoveryHigh.price)}—a ${formatPercent(pullbackGain)}% move from the actual pullback price.`,
    });
  }

  if (actualLow.price >= input.postedPrice || actualLow.price <= input.plan.zoneHigh) return null;
  const nearest = actualLow;
  const pullbackGain = ((recoveryHigh.price - nearest.price) / nearest.price) * 100;
  const decline = ((input.postedPrice - nearest.price) / input.postedPrice) * 100;
  return Object.freeze({
    scenario: "near_zone_recovery",
    recoveryHigh: recoveryHigh.price,
    pullbackAtMs: nearest.observedAtMs,
    text: `${input.symbol} was posted to the Watchlist at ${formatPostedTime(input.postedAtMs)}. Analysis included a ${input.plan.kind} pullback area of $${formatPrice(input.plan.zoneLow)}-$${formatPrice(input.plan.zoneHigh)}. Price pulled back ${formatPercent(decline)}% to $${formatPrice(nearest.price)}, turned higher before reaching that area, and then ran to $${formatPrice(recoveryHigh.price)}—a ${formatPercent(pullbackGain)}% move from the actual pullback price.`,
  });
}

/** Produces a continuation recap only from the analysis levels that were actually cleared. */
export function buildAnalysisBreakoutRecap(input: Readonly<{
  observations: readonly DailyRecapPriceObservation[];
  plan: DailyRecapBreakoutPlan;
  postedAtMs: number;
  postedPrice: number;
  symbol: string;
}>): string | null {
  if (!/^[A-Z0-9.-]{1,20}$/.test(input.symbol)) throw new Error("watchlist_daily_recap_invalid_symbol");
  assertTimestamp(input.postedAtMs, "posted_at");
  assertPrice(input.postedPrice, "posted_price");
  assertTimestamp(input.plan.publishedAtMs, "breakout_plan_published_at");
  assertPrice(input.plan.clearedPrice, "cleared_price");
  assertPrice(input.plan.breakoutTriggerPrice, "breakout_trigger_price");
  const observations = normalizedObservations(input.postedAtMs, input.observations)
    .filter((value) => value.observedAtMs >= input.plan.publishedAtMs);
  const high = observations.reduce<DailyRecapPriceObservation | null>(
    (highest, value) => !highest || value.price > highest.price ? value : highest,
    null,
  );
  if (!high || high.price < input.plan.breakoutTriggerPrice || high.price < input.plan.clearedPrice) return null;
  const reachedLevels = input.plan.nextLevelPrices.filter((level) => Number.isFinite(level) && level > 0 && high.price >= level);
  const levelText = reachedLevels.length === 0 ? "" : ` and reached the next analysis level${reachedLevels.length === 1 ? "" : "s"} ${reachedLevels.map((level) => `$${formatPrice(level)}`).join(", ")}`;
  const overallHigh = input.observations.reduce((highest, value) => value.price > highest.price ? value : highest, high);
  const gain = ((overallHigh.price - input.postedPrice) / input.postedPrice) * 100;
  return `${input.symbol} was posted to the Watchlist at ${formatPostedTime(input.postedAtMs)}. Price cleared $${formatPrice(input.plan.clearedPrice)} and the breakout trigger of $${formatPrice(input.plan.breakoutTriggerPrice)}${levelText}. Price reached a high of $${formatPrice(overallHigh.price)} for a potential gain of ${formatPercent(gain)}%.`;
}

export function buildAiReadSetupInvalidationRecap(input: Readonly<{
  observations: readonly DailyRecapPriceObservation[];
  plan: DailyRecapInvalidationPlan;
  postedAtMs: number;
  symbol: string;
}>): string | null {
  if (!/^[A-Z0-9.-]{1,20}$/.test(input.symbol)) throw new Error("watchlist_daily_recap_invalid_symbol");
  assertTimestamp(input.postedAtMs, "posted_at");
  assertTimestamp(input.plan.publishedAtMs, "invalidation_plan_published_at");
  assertPrice(input.plan.zoneLow, "pullback_zone_low");
  assertPrice(input.plan.zoneHigh, "pullback_zone_high");
  assertPrice(input.plan.momentumFailurePrice, "momentum_failure_price");
  const afterRead = normalizedObservations(input.postedAtMs, input.observations)
    .filter((value) => value.observedAtMs >= input.plan.publishedAtMs);
  const pullbackBreak = afterRead.find((value) => value.price < input.plan.zoneLow);
  if (!pullbackBreak) return null;
  const failure = afterRead.find((value) =>
    value.observedAtMs >= pullbackBreak.observedAtMs && value.price < input.plan.momentumFailurePrice,
  );
  if (!failure) return null;
  return `${input.symbol} was posted to the Watchlist at ${formatPostedTime(input.postedAtMs)}. Price failed to hold the $${formatPrice(input.plan.zoneLow)}-$${formatPrice(input.plan.zoneHigh)} pullback area and then broke below the $${formatPrice(input.plan.momentumFailurePrice)} momentum-failure level, invalidating the setup.`;
}
