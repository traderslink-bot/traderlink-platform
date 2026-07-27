import type {
  AnalyticsAgentIntent,
  AnalyticsAgentIntentResolution,
} from "./contracts";

function normalize(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9$.:]+/g, " ").replace(/\s+/g, " ").trim();
}

function hasAny(question: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => question.includes(phrase));
}

function priceRange(question: string): AnalyticsAgentIntentResolution["priceRange"] {
  const match = question.match(/(?:under|below|less than|above|over|greater than)\s*\$?([0-9]+(?:\.[0-9]+)?)/);
  if (match === null) return null;
  const value = match[1];
  return Object.freeze({
    minimum: hasAny(question, ["above", "over", "greater than"]) ? value : null,
    maximum: hasAny(question, ["under", "below", "less than"]) ? value : null,
  });
}

function result(
  intent: AnalyticsAgentIntent,
  previousOutcome: "gain" | "loss" | null = null,
  range: AnalyticsAgentIntentResolution["priceRange"] = null,
): AnalyticsAgentIntentResolution {
  return Object.freeze({ intent, previousOutcome, priceRange: range });
}

/**
 * Deliberately deterministic. Natural-language model interpretation belongs at
 * a later boundary; this router only recognizes the governed v1 vocabulary.
 */
export function resolveAnalyticsAgentIntent(
  question: string,
  hint?: AnalyticsAgentIntent,
): AnalyticsAgentIntentResolution {
  if (hint !== undefined) return result(hint);
  const normalized = normalize(question);
  if (hasAny(normalized, ["vwap", "ema", "candle", "breakout", "setup", "float", "market cap", "relative volume", "news", "catalyst", "dilution", "support", "resistance"])) {
    return result("unsupported_market_or_setup");
  }
  if (hasAny(normalized, ["sell too early", "cut winners", "held losers too long", "optimal exit", "high of day", "mfe", "mae"])) {
    return result("unsupported_exit_quality");
  }
  if (hasAny(normalized, ["planned risk", "risk reward", "daily goal", "max loss", "followed my stop", "broke my risk"])) {
    return result("unsupported_planned_risk");
  }
  if (hasAny(normalized, ["fee", "fees", "commission", "gross vs net", "gross versus net"])) return result("fee_impact");
  if (hasAny(normalized, ["give back", "giving back", "giveback", "drawdown", "green then red", "red then green"])) return result("giveback_drawdown");
  if (hasAny(normalized, ["after a loss", "after loss", "revenge trade"])) return result("prior_outcome_behavior", "loss");
  if (hasAny(normalized, ["after a win", "after win", "after wins"])) return result("prior_outcome_behavior", "gain");
  if (hasAny(normalized, ["fourth", "later trades", "first trade", "trade sequence", "stop after three"])) return result("trade_sequence_behavior");
  if (hasAny(normalized, ["repeat attempt", "same ticker", "same symbol", "overtrade"])) return result("repeat_attempt_behavior");
  const range = priceRange(normalized);
  if (range !== null || hasAny(normalized, ["price range", "low priced", "penny stock"])) return result("price_range_performance", null, range);
  if (hasAny(normalized, ["ticker", "tickers", "symbol", "stocks hurt", "stocks help"])) return result("ticker_performance");
  if (hasAny(normalized, ["time of day", "times of day", "time do i", "market open", "premarket", "late day", "opening"])) return result("time_of_day_performance");
  if (hasAny(normalized, ["data quality", "missing data", "can this result be trusted", "manual trades incomplete"])) return result("data_quality");
  if (hasAny(normalized, ["p l", "p/l", "profit factor", "expectancy", "win rate", "how am i doing", "overall", "net pnl", "net p l"])) return result("core_performance");
  return result("unsupported_unknown");
}
