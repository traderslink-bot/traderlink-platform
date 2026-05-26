export type TraderAnalyticsChartKind =
  | "bar"
  | "donut"
  | "histogram"
  | "distribution";

export type TraderAnalyticsChartTone =
  | "positive"
  | "negative"
  | "neutral"
  | "warning"
  | "info"
  | "accent";

export interface TraderAnalyticsChartDatum {
  id: string;
  label: string;
  value: number;
  pctOfTotal: number | null;
  category?: string;
  tone: TraderAnalyticsChartTone;
}

export interface TraderAnalyticsChart {
  id: string;
  kind: TraderAnalyticsChartKind;
  title: string;
  total: number;
  empty: boolean;
  data: TraderAnalyticsChartDatum[];
}

export interface TraderAnalyticsChartData {
  grossPnlByTrade: TraderAnalyticsChart;
  winLossDonut: TraderAnalyticsChart;
  openClosedDonut: TraderAnalyticsChart;
  topRisksBar: TraderAnalyticsChart;
  topStrengthsBar: TraderAnalyticsChart;
  primaryFocusDistribution: TraderAnalyticsChart;
  riskCategoryDistribution: TraderAnalyticsChart;
  strengthCategoryDistribution: TraderAnalyticsChart;
  durationHistogram: TraderAnalyticsChart;
  behaviorRiskRates: TraderAnalyticsChart;
  entrySessionPerformance: TraderAnalyticsChart;
  entryHourPerformance: TraderAnalyticsChart;
}
