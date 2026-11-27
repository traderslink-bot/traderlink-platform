# Chart indicator readouts by pane

Price overlays keep their indicator names and values at the top left of the candle pane. RSI and MACD show their names, values and options in the top left of their own panes. Each pane's details can collapse independently. The existing indicator settings, visibility controls and live readout formatting still apply.

The chart positions lower legends from the chart library's public pane geometry. The layout follows pane resizing and the optional Volume pane. Readout values are matched to the plotted indicator instance, so two lower panes do not take each other's values.

Targeted ESLint and scoped TypeScript passed, and 78 focused indicator tests passed. The browser fixture used the actual shared chart and Lightweight Charts with sample candles. It verified price and lower readout contents, independent collapse and hide controls, geometry with Volume on and off, and geometry after resizing. It ran at 1280 × 740 desktop, 390 × 844 touch portrait and 844 × 390 touch landscape. The isolated fixture stubbed the unused Journal drawer. There was no deployment.
