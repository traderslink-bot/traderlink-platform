import type { ChartTimeframe } from "./candles";

// Pixel spacing keeps candle bodies and wicks legible in a phone or grid pane.
// Each interval can be tuned independently without changing saved chart views.
export const DEFAULT_CANDLE_SPACING: Record<ChartTimeframe, number> = {
  "1m": 9, "5m": 10, "15m": 10, "1h": 11, "4h": 11, "1D": 12,
};

export function defaultChartView(timeframe: ChartTimeframe, plotWidth: number, count: number) {
  const width = Number.isFinite(plotWidth) && plotWidth > 0 ? plotWidth : 300;
  const slots = Math.max(8, width / DEFAULT_CANDLE_SPACING[timeframe]);
  const rightSpace = 3;
  // Keep spacing when only a few bars exist; don't stretch them to fill the pane.
  const to = Math.max(0, count - 1) + rightSpace;
  return { visibleBars: Math.max(1, Math.ceil(slots - rightSpace)), range: { from: to - slots, to } };
}
