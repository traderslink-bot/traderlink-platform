export const JOURNAL_ANALYTICS_QUERY_VERSION =
  "journal_analytics_query_v1" as const;
export const JOURNAL_ANALYTICS_MAX_METRICS_PER_QUERY = 256 as const;
export const JOURNAL_ANALYTICS_MAX_SYMBOLS_PER_QUERY = 100 as const;
export const JOURNAL_ANALYTICS_MAX_GROUP_ROWS = 2_000 as const;
export const JOURNAL_ANALYTICS_MAX_TABLE_PAGE_SIZE = 200 as const;
export const JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES = Object.freeze([
  5,
  15,
  30,
  60,
] as const);

export type JournalAnalyticsMoneyBasis = "gross" | "net";
export type JournalAnalyticsTableSortField =
  | "closed_at"
  | "selected_pnl"
  | "return_percent"
  | "holding_duration"
  | "entered_quantity"
  | "entry_notional";
export type JournalAnalyticsTableOrder = Readonly<{
  field: JournalAnalyticsTableSortField;
  direction: "ascending" | "descending";
}>;
export type JournalAnalyticsDirection = "long" | "short";
export type JournalAnalyticsOutcome = "win" | "loss" | "flat";
/**
 * A factual completed-trade classification derived from the account's trading
 * timezone. This is deliberately separate from the trader-authored style
 * (such as an intentional Swing).
 */
export type JournalAnalyticsTradeClassification = "day_trade" | "multi_day_trade";
export type JournalAnalyticsWeekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type JournalAnalyticsDecimalRange = Readonly<{
  minimumInclusive: string | null;
  maximumInclusive: string | null;
}>;

export type JournalAnalyticsDurationRange = Readonly<{
  minimumMillisecondsInclusive: number | null;
  maximumMillisecondsInclusive: number | null;
}>;
export type JournalAnalyticsProvenanceGroup =
  | "broker_only"
  | "manual_only"
  | "correction_only"
  | "mixed"
  | "unknown";

export type JournalAnalyticsGrouping =
  | "total"
  | "closing_day"
  | "closing_iso_week"
  | "closing_month"
  | "closing_year"
  | "entry_weekday"
  | "entry_time_bucket"
  | "exit_time_bucket"
  | "entry_session"
  | "instrument"
  | "direction"
  | "account"
  | "provenance"
  | "holding_duration_bucket"
  | "entered_quantity_bucket"
  | "maximum_position_bucket"
  | "entry_notional_bucket"
  | "entry_price_bucket"
  | "realized_outcome";

export const JOURNAL_ANALYTICS_ENTRY_PRICE_BANDS = Object.freeze([
  Object.freeze({ key: "under_0_50", label: "Under $0.50", maximumExclusive: "0.5" }),
  Object.freeze({ key: "0_50_to_1", label: "$0.50 to under $1.00", maximumExclusive: "1" }),
  Object.freeze({ key: "1_to_2", label: "$1.00 to under $2.00", maximumExclusive: "2" }),
  Object.freeze({ key: "2_to_3", label: "$2.00 to under $3.00", maximumExclusive: "3" }),
  Object.freeze({ key: "3_to_5", label: "$3.00 to under $5.00", maximumExclusive: "5" }),
  Object.freeze({ key: "5_to_10", label: "$5.00 to under $10.00", maximumExclusive: "10" }),
  Object.freeze({ key: "10_to_20", label: "$10.00 to under $20.00", maximumExclusive: "20" }),
  Object.freeze({ key: "20_and_over", label: "$20.00+", maximumExclusive: null }),
] as const);

export type JournalAnalyticsQuery = Readonly<{
  queryVersion: typeof JOURNAL_ANALYTICS_QUERY_VERSION;
  accountIds: readonly string[];
  metricIds: readonly string[];
  moneyBasis: JournalAnalyticsMoneyBasis;
  closingDateRange:
    | Readonly<{ kind: "all_available" }>
    | Readonly<{
        kind: "inclusive_closing_date";
        startDate: string;
        endDate: string;
      }>;
  currency: string | null;
  instrumentIds: readonly string[];
  symbols: readonly string[];
  directions: readonly JournalAnalyticsDirection[];
  tradeClassifications: readonly JournalAnalyticsTradeClassification[];
  provenance: readonly JournalAnalyticsProvenanceGroup[];
  outcomes: readonly JournalAnalyticsOutcome[];
  entryWeekdays: readonly JournalAnalyticsWeekday[];
  entryTimeBuckets: readonly string[];
  holdingDurationRange: JournalAnalyticsDurationRange;
  enteredQuantityRange: JournalAnalyticsDecimalRange;
  maximumPositionRange: JournalAnalyticsDecimalRange;
  entryNotionalRange: JournalAnalyticsDecimalRange;
  groupings: readonly JournalAnalyticsGrouping[];
  entryTimeBucketMinutes: (typeof JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES)[number];
  asOfUtc: string;
  table: Readonly<{
    pageSize: number;
    afterCursor: string | null;
  }>;
}>;
