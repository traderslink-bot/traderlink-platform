/** Missing candles do not establish why trading data is absent. */
export function tradeAnalysisAvailabilityMessage(status: string): string {
  if (status === "pending") return "Trade Analyzer is collecting market data.";
  if (status === "no_coverage") return "Not enough candle data to analyze this trade. This can happen when a stock trades very little.";
  if (status === "provider_unavailable") return "We couldn't retrieve the candle data. Please try again later.";
  return "Trade Analyzer could not collect the market data needed for this trade.";
}
