// These filters share the Scanner's completed candles and authorized market-event reads.
export const candleStudyFilters = {
  barVolumeSpike: {
    label: "Candle volume vs preceding average",
    unit: "multiple",
    category: "Volume",
  },
  averageBarVolume: {
    label: "Average candle volume",
    unit: "number",
    category: "Volume",
  },
  windowReturn: {
    label: "Return over completed candles",
    unit: "percent",
    category: "Price",
  },
  reboundFromLow: {
    label: "Rebound from prior candle-window low",
    unit: "percent",
    category: "Price",
  },
  smaDistance: {
    label: "Close vs configurable SMA %",
    unit: "percent",
    category: "Indicators",
  },
  emaDistance: {
    label: "Close vs configurable EMA %",
    unit: "percent",
    category: "Indicators",
  },
  smaSlope: {
    label: "SMA change per candle %",
    unit: "percent",
    category: "Indicators",
  },
  rangePosition: {
    label: "Close position in candle-window range %",
    unit: "percent",
    category: "Indicators",
  },
  rangeWidth: {
    label: "Candle-window range width %",
    unit: "percent",
    category: "Indicators",
  },
  historicalVolatility: {
    label: "Volatility per candle (log returns %)",
    unit: "percent",
    category: "Indicators",
  },
  averageBarDollars: {
    label: "Average dollar volume per candle",
    unit: "money",
    category: "Volume",
  },
  anchoredFromLow: {
    label: "Close vs VWAP anchored to window low %",
    unit: "percent",
    category: "Indicators",
  },
  smaHold: {
    label: "Consecutive closes above SMA",
    unit: "number",
    category: "Indicators",
  },
  smaRejection: {
    label: "SMA rejection on latest candle (1 = rejected)",
    unit: "number",
    category: "Indicators",
  },
  macdHistogram: {
    label: "Configurable MACD histogram %",
    unit: "percent",
    category: "Indicators",
  },
  candlePattern: {
    label: "Confirmed chart pattern",
    unit: "number",
    category: "Indicators",
  },
  volumeWindowSum: {
    label: "Volume over completed candles",
    unit: "number",
    category: "Volume",
  },
  smaAlignment: {
    label: "9/20/50 SMA alignment (−1 to +1)",
    unit: "number",
    category: "Indicators",
  },
  bandCompression: {
    label: "Bollinger width vs preceding window",
    unit: "multiple",
    category: "Indicators",
  },
  rsiDistance: {
    label: "RSI on completed candles",
    unit: "number",
    category: "Indicators",
  },
  betaSpy: { label: "Beta vs SPY", unit: "number", category: "Market context" },
  returnVsSpy: {
    label: "Return vs SPY (percentage points)",
    unit: "number",
    category: "Market context",
  },
  strengthAdx: {
    label: "ADX trend strength",
    unit: "number",
    category: "Indicators",
  },
  stochasticJ: {
    label: "KDJ oscillator J",
    unit: "number",
    category: "Indicators",
  },
} as const;
export type CandleStudy = keyof typeof candleStudyFilters;
export const isCandleStudy = (key: string): key is CandleStudy =>
  Object.hasOwn(candleStudyFilters, key);
export const needsBarVwap = (metric: string) =>
  metric === "averageBarDollars" || metric === "anchoredFromLow";
export const isBenchmarkStudy = (metric: string) =>
  metric === "betaSpy" || metric === "returnVsSpy";
export const studyFrames = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1D",
  "1W",
] as const;
export type StudyFrame = (typeof studyFrames)[number];
export const studyPeriods = [3, 5, 9, 10, 14, 20, 26, 50, 100, 200] as const;
export const eventFilters = {
  crossReference: {
    label: "1m close crosses a reference level",
    unit: "event",
    category: "Session levels",
  },
  prThenVwap: {
    label: "PR followed by a 1m VWAP reclaim",
    unit: "event",
    category: "Catalyst",
  },
  resumeThenVolume: {
    label: "Trading resumption followed by 1m volume expansion",
    unit: "event",
    category: "Catalyst",
  },
  breakPremarketHigh: {
    label: "1m close crosses above premarket high",
    unit: "event",
    category: "Session levels",
  },
  breakOpeningHigh: {
    label: "1m close crosses above 5m opening range",
    unit: "event",
    category: "Session levels",
  },
} as const;
export const isReaction = (metric: string) =>
  metric === "prThenVwap" || metric === "resumeThenVolume";
export const usesNews = (metric: string) =>
  metric === "pressRelease" ||
  metric === "prThenVwap" ||
  metric === "prHeadline";
export const otherAuditFilters = {
  ...eventFilters,
  prHeadline: {
    label: "PR headline contains (past 24h)",
    unit: "event",
    category: "Catalyst",
  },
  haltCode: {
    label: "Active halt reason code",
    unit: "number",
    category: "Catalyst",
  },
  floatMissing: {
    label: "Float unavailable",
    unit: "number",
    category: "Company",
  },
  timedRebound: {
    label: "Timed rebound from confirmed low on rising volume %",
    unit: "percent",
    category: "Price",
  },
  floatMarketCap: {
    label: "Float market cap",
    unit: "money",
    category: "Company",
  },
  rollingFloatTurnover: {
    label: "Float turnover in past minutes",
    unit: "percent",
    category: "Volume",
  },
  largestTradeShares: {
    label: "Largest eligible print this session (shares)",
    unit: "number",
    category: "Volume",
  },
  largestTradeDollars: {
    label: "Largest eligible print this session ($)",
    unit: "money",
    category: "Volume",
  },
  zoneRewardRisk: {
    label: "First verified target reward/risk",
    unit: "multiple",
    category: "Session levels",
  },
  zoneState: {
    label: "Verified retest state",
    unit: "number",
    category: "Session levels",
  },
  sectorRelativeMove: {
    label: "Day change vs sector mean (percentage points)",
    unit: "number",
    category: "Market context",
  },
  advancingShare: {
    label: "Advancing share of covered roster %",
    unit: "percent",
    category: "Market context",
  },
  sectorAdvancingShare: {
    label: "Advancing share of covered sector %",
    unit: "percent",
    category: "Market context",
  },
  averageDailyDollars20: {
    label: "20-session average daily dollar volume",
    unit: "money",
    category: "Volume",
  },
  ipoAgeDays: { label: "Days since IPO", unit: "number", category: "Company" },
  ...candleStudyFilters,
} as const;
export const zoneStates = {
  IN_RETEST_AREA: "Inside retest zone",
  WAITING: "Waiting for retest",
  BEYOND_TARGET: "Beyond first target",
  PAST_INVALIDATION: "Past invalidation",
} as const;

export const companyFilterLabels = {
  annualRevenue: "Reported annual revenue (USD)",
  annualIncome: "Reported annual net income (USD)",
  revenueGrowth: "Annual revenue growth %",
  incomeGrowth: "Annual net income growth %",
  annualNetMargin: "Annual net margin %",
  annualGrossMargin: "Annual gross margin %",
  annualEps: "Annual diluted EPS (USD)",
  priceEarningsTtm: "P/E (TTM)",
  priceSalesTtm: "Price/sales (TTM)",
  priceBookQuarter: "Price/book (quarterly)",
  dividendYieldTtm: "Dividend yield (TTM) %",
  recentFiling: "SEC filing form in past 30 days",
} as const;
export type CompanyMetric = keyof typeof companyFilterLabels;
export const isCompanyMetric = (key: string): key is CompanyMetric =>
  Object.hasOwn(companyFilterLabels, key);
export type CompanyFilingOperand = {
  accession: string; metric: string; scope: string; unit: string; start: string; end: string; value: number;
};
export type CompanyReadings = {
  values: Partial<Record<Exclude<CompanyMetric, "recentFiling">, number>>;
  forms?: string[];
  formsComplete?: boolean;
  evidence?: {
    revision: number;
    asOf: number;
    filingsByMetric: Partial<Record<CompanyMetric, string[]>>;
    operands: Partial<Record<CompanyMetric, CompanyFilingOperand[]>>;
  };
};

export const crossReferences = {
  previousDayHigh: "Previous day high",
  previousDayLow: "Previous day low",
  previousDayClose: "Previous close",
  premarketHigh: "Premarket high",
  premarketLow: "Premarket low",
  sessionOpen: "Session open",
  opening5High: "5m opening high",
  opening5Low: "5m opening low",
  opening15High: "15m opening high",
  opening15Low: "15m opening low",
  opening30High: "30m opening high",
  opening30Low: "30m opening low",
} as const;
export type CrossReference = keyof typeof crossReferences;

export function studyHistorySize(
  metric: CandleStudy,
  period: number,
  signalPeriod = 9,
) {
  if (metric === "strengthAdx" || metric === "bandCompression")
    return 2 * period;
  if (metric === "macdHistogram") return period + signalPeriod;
  return Math.max(metric === "smaAlignment" ? 50 : 0, period + 1);
}
