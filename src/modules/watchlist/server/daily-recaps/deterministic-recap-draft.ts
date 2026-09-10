export type DailyWatchlistRecapEvidence = Readonly<{
  highPrice: number;
  highPriceAtMs: number;
  latestPrice: number;
  latestPriceAtMs: number;
  postedAtMs: number;
  postedPrice: number;
  symbol: string;
}>;

export type DailyWatchlistRecapDraft = Readonly<{
  evidence: DailyWatchlistRecapEvidence;
  maximumGainPct: number;
  scenario: "follow_through" | "follow_through_then_fade" | "no_upside_follow_through";
  text: string;
}>;

const NEW_YORK_TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
});

function assertPositivePrice(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`watchlist_daily_recap_invalid_${field}`);
  }
}

function assertTimestamp(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`watchlist_daily_recap_invalid_${field}`);
  }
}

function formatPrice(value: number): string {
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function formatGain(value: number): string {
  return value.toFixed(1);
}

function validateEvidence(evidence: DailyWatchlistRecapEvidence): void {
  if (!/^[A-Z0-9.-]{1,20}$/.test(evidence.symbol)) {
    throw new Error("watchlist_daily_recap_invalid_symbol");
  }
  assertPositivePrice(evidence.postedPrice, "posted_price");
  assertPositivePrice(evidence.highPrice, "high_price");
  assertPositivePrice(evidence.latestPrice, "latest_price");
  assertTimestamp(evidence.postedAtMs, "posted_at");
  assertTimestamp(evidence.highPriceAtMs, "high_price_at");
  assertTimestamp(evidence.latestPriceAtMs, "latest_price_at");
  if (evidence.highPriceAtMs < evidence.postedAtMs || evidence.latestPriceAtMs < evidence.postedAtMs) {
    throw new Error("watchlist_daily_recap_observation_precedes_post");
  }
}

/**
 * Generates only sentences that the supplied, immutable evidence proves. The
 * caller is responsible for persisting the evidence snapshot with the draft.
 */
export function buildDeterministicWatchlistRecapDraft(
  evidence: DailyWatchlistRecapEvidence,
): DailyWatchlistRecapDraft {
  validateEvidence(evidence);
  const maximumGainPct = ((evidence.highPrice - evidence.postedPrice) / evidence.postedPrice) * 100;
  const postedTime = NEW_YORK_TIME.format(new Date(evidence.postedAtMs));
  const postedFact = `${evidence.symbol} was posted to the Watchlist at ${postedTime}`;
  const reachedHighFact = `Price reached a high of $${formatPrice(evidence.highPrice)}`;

  if (maximumGainPct <= 0) {
    return Object.freeze({
      evidence,
      maximumGainPct,
      scenario: "no_upside_follow_through",
      text: `${postedFact}. Price later traded at $${formatPrice(evidence.latestPrice)} without moving above the Watchlist post price.`,
    });
  }

  const followThrough = `${postedFact}. ${reachedHighFact} for a potential gain of ${formatGain(maximumGainPct)}%.`;
  if (evidence.latestPriceAtMs > evidence.highPriceAtMs && evidence.latestPrice < evidence.highPrice) {
    return Object.freeze({
      evidence,
      maximumGainPct,
      scenario: "follow_through_then_fade",
      text: `${followThrough} It later traded at $${formatPrice(evidence.latestPrice)}.`,
    });
  }

  return Object.freeze({
    evidence,
    maximumGainPct,
    scenario: "follow_through",
    text: followThrough,
  });
}
