export const SCANNER_FILTER_IDS = [
  "price", "market-cap", "daily-change", "amplitude", "average-volume", "average-turnover", "turnover-rate", "pe", "pe-ttm", "pb", "dividend-yield", "listing-date", "security-type",
  "net-profit", "profit-growth", "revenue", "revenue-growth", "net-margin", "gross-margin", "debt-ratio", "roe", "eps", "float-market-cap", "ps-ttm",
  "price-vs-average", "kdj", "macd", "rsi", "bollinger", "trend-pattern", "bullish-chart-pattern", "bearish-chart-pattern",
  "chip-profit", "chip-overlap", "beta", "trade-heat", "search-heat", "combined-heat", "institutional-holdings", "analyst-rating", "target-price", "morningstar-rating", "broker-concentration", "broker-holding-change",
  "option-iv", "option-iv-rank", "option-iv-percentile", "option-earnings-iv", "option-hv", "option-volume", "option-open-interest",
] as const;

export type ScannerFilterId = typeof SCANNER_FILTER_IDS[number];

export type ScannerFilterInput = Readonly<{
  id: ScannerFilterId;
  lower?: string;
  upper?: string;
  choice?: string;
  averageType?: "MA" | "EMA";
  averageLength?: "5" | "9" | "10" | "20" | "50" | "100" | "200";
  period?: "1" | "5" | "20" | "60";
  timeframe?: "1 minute" | "5 minutes" | "15 minutes" | "1 hour" | "Daily" | "Weekly" | "Monthly";
}>;

export type ScannerSort = "daily-change" | "average-volume" | "market-cap" | "trade-heat" | "option-volume";

export type ScannerRunRequest = Readonly<{
  filters: readonly ScannerFilterInput[];
  limit: 25 | 50 | 100;
  sortBy: ScannerSort;
}>;

export type ScannerResultRow = Readonly<{
  changePercent: string | null;
  company: string;
  last: string | null;
  marketCap: string | null;
  symbol: string;
  updatedAtUtc: string;
  volume: string | null;
}>;

export type ScannerRunResult = Readonly<{
  cached: boolean;
  rows: readonly ScannerResultRow[];
  total: number;
  updatedAtUtc: string;
}>;
