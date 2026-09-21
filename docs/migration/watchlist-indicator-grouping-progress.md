# Watchlist indicator grouping

Owner approved combining Trend with Moving averages and RSI with Momentum, and
requested coordinator production release. Display-only scope; keep all readings,
coloured states, explanations, timeframes, help, timestamps and provider behavior.

- Five sections: Trend & moving averages, RSI & momentum, VWAP, Volume, ATR.
- Combined sections retain both original readings and their tooltip explanations.
- No indicator formula, thresholds, requests, caching, notifications or schema changes.
- Focused grouping tests pass for all four timeframes, populated/partial/unavailable
  readings and both RSI extremes. Tooltip wiring checks and targeted ESLint pass.
  Help updated. Coordinator handoff and live acceptance pending.
