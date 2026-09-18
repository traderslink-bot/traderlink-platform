# Indicator meanings — 2026-09-17

Owner approved direct state explanations and tags on the ticker-detail Indicators
card. No calculation, provider, refresh, AI or publication change.

- Moving averages: bullish/bearish alignment, or mixed within the existing
  Trend alignment tolerance of 5% ATR. Without ATR only equality is mixed.
- Volume: elevated, quiet, typical or early comparison; never a directional tag.
- ATR: widening, narrowing or steady swings; direction is not inferred. Existing
  ATR comparison is relative to the preceding twenty ATR readings, not absolute
  high/low volatility.
- Preserve Trend, Momentum, RSI, VWAP, timeframe selection, timestamps and missing
  values. Calculation details are in accessible focus/hover/touch tooltips.
- Text-bearing badges supplement color; moving averages use green/red/orange,
  participation and volatility use blue so they do not imply a bullish trade.

Focused state checks across all four timeframes, strict presentation/engine
TypeScript and targeted ESLint passed. No hosted visual check or local server.
No deployment authorized by this slice. Existing dirty
Watchlist repair files must not be absorbed into this change. Final hosted visual
acceptance remains separate. Help must describe states rather than buy/sell signals.
