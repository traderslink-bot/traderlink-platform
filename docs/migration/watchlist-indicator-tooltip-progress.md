# Watchlist indicator tooltips

Owner request: every indicator in the ticker-detail card must have working click/tap help.

- Found default MUI Tooltip hover/long-press only, and icons conditional on calculation
  text (Trend/Momentum/RSI/VWAP absent; some unavailable rows also absent).
- All seven rows now have meaning explanations independent of available data.
- Explicit click/tap/Enter/Space toggles; Escape, outside click and timeframe changes
  close help. One open explanation per card; 44px touch targets.
- Preserved values, chips, timeframes, calculations, provider calls and polling.
- Focused seven-indicator/four-timeframe checks and targeted ESLint pass. Help guide
  updated for click/tap, unavailable values and dismissal. Coordinator release and
  live browser interaction acceptance remain pending.
