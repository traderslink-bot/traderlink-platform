export const WATCHLIST_INDICATOR_HELP: Readonly<Record<string, string>> = Object.freeze({
  Trend: "Shows whether price and EMA9/EMA20 agree on an upward or downward trend. Uptrend means both averages are rising, EMA9 is above EMA20 and price is at or above EMA20. Downtrend is the reverse. Sideways means the averages are close and relatively flat; mixed means the signals disagree.",
  Momentum: "Shows whether RSI has strengthened or weakened over three completed candles in the selected timeframe. Increasing means RSI rose at least 3 points; easing means it fell at least 3 points. Little change means a smaller move. Momentum can improve while price is still in a downtrend, or ease during an uptrend.",
  RSI: "RSI measures the balance of recent upward and downward price changes over 14 candles. Above 50 suggests bullish momentum; below 50 suggests bearish momentum; 50 is neutral. Above 70 is overbought and below 30 is oversold. These describe stretched conditions, not an automatic reversal or a buy/sell signal.",
  VWAP: "Today's average traded price weighted by volume, including extended hours. Price above it suggests intraday strength; below it suggests weakness. It resets each trading day and is the same session measure across timeframe tabs. Unavailable means sufficient session price and volume data could not be confirmed.",
  "Moving averages": "EMA9 follows recent price changes faster than EMA20. EMA9 above EMA20 suggests short-term strength; below suggests weakness. Averages close together have no clear alignment. Use Trend to see whether price and the direction of both averages agree. Each tab uses candles from its selected timeframe.",
  Volume: "Shares traded in the latest completed candle. Elevated activity means more participation than the recent average; quiet means less; typical means near the average. Volume alone does not say whether buyers or sellers are in control. Early comparison uses only the previous candle. Unavailable is missing data, not zero shares.",
  ATR: "Average True Range measures typical price movement over 14 candles, including gaps. A larger ATR means wider fluctuations; a smaller ATR means tighter movement. Widening and narrowing compare current ATR with recent readings. ATR does not tell you whether price will rise or fall; its percentage is relative to price, not a projected gain.",
});

export function watchlistIndicatorHelp(label: string, calculation?: string): string {
  const meaning = WATCHLIST_INDICATOR_HELP[label] ?? "Uses completed candles from the selected timeframe. Unavailable means there is not enough confirmed data for this reading.";
  return calculation ? `${meaning} ${calculation}` : meaning;
}
