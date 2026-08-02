export const JOURNAL_ANALYTICS_QUERY_VERSION =
  "journal_analytics_query_v1" as const;
export const JOURNAL_ANALYTICS_MAX_METRICS_PER_QUERY = 256 as const;
export const JOURNAL_ANALYTICS_MAX_SYMBOLS_PER_QUERY = 100 as const;
export const JOURNAL_ANALYTICS_MAX_GROUP_ROWS = 500 as const;
export const JOURNAL_ANALYTICS_MAX_TABLE_PAGE_SIZE = 200 as const;
export const JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES = Object.freeze([
  5,
  15,
  30,
  60,
] as const);

export type JournalAnalyticsMoneyBasis = "gross" | "net";
export type JournalAnalyticsDirection = "long" | "short";
export type JournalAnalyticsOutcome = "win" | "loss" | "flat";
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
  | "instrument"
  | "direction"
  | "account"
  | "provenance"
  | "holding_duration_bucket"
  | "entered_quantity_bucket"
  | "maximum_position_bucket"
  | "entry_notional_bucket"
  | "realized_outcome";

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
  provenance: readonly JournalAnalyticsProvenanceGroup[];
  outcomes: readonly JournalAnalyticsOutcome[];
  groupings: readonly JournalAnalyticsGrouping[];
  entryTimeBucketMinutes: (typeof JOURNAL_ANALYTICS_TIME_BUCKET_MINUTES)[number];
  asOfUtc: string;
  table: Readonly<{
    pageSize: number;
    afterCursor: string | null;
  }>;
}>;
