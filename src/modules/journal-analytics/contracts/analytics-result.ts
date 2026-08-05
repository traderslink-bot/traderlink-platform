import type {
  JournalAnalyticsGrouping,
  JournalAnalyticsMoneyBasis,
} from "./analytics-query";

export const JOURNAL_ANALYTICS_RESULT_VERSION =
  "journal_analytics_result_v1" as const;

export type JournalAnalyticsResultState =
  | "complete"
  | "partial"
  | "empty"
  | "unavailable";

export type JournalAnalyticsExactValue =
  | Readonly<{ kind: "integer"; value: number }>
  | Readonly<{ kind: "decimal"; valueDecimal: string }>
  | Readonly<{
      kind: "rational";
      numeratorDecimal: string;
      denominatorInteger: string;
      roundedDecimal: string;
      roundingPolicy: string;
    }>
  | Readonly<{ kind: "duration"; milliseconds: number }>
  | Readonly<{ kind: "text"; value: string }>;

export type JournalAnalyticsCoverage = Readonly<{
  state: JournalAnalyticsResultState;
  candidateCount: number;
  includedCount: number;
  excludedCount: number;
  readyClosedCount: number;
  legitimateOpenCount: number;
  needsDecisionCount: number;
  unsupportedCount: number;
  feeCompleteCount: number;
  feeIncompleteCount: number;
  unavailableCount: number;
  reasonCounts: Readonly<Record<string, number>>;
}>;

export type JournalAnalyticsMetricResult = Readonly<{
  metricId: string;
  formulaVersion: string;
  title: string;
  description: string;
  valueKind: string;
  unit: string;
  state: JournalAnalyticsResultState;
  value: JournalAnalyticsExactValue | null;
  moneyBasis: JournalAnalyticsMoneyBasis | "not_applicable";
  chargePolicy: string;
  currency: string | null;
  timezonePolicy: string;
  dateAttributionPolicy: string;
  coverage: JournalAnalyticsCoverage;
  limitationReasonCodes: readonly string[];
  factSetRevisionSha256: string;
  registryVersion: string;
  resultDigestSha256: string;
}>;

export type JournalAnalyticsGroupResult = Readonly<{
  grouping: JournalAnalyticsGrouping;
  groupKey: string;
  label: string;
  metrics: readonly JournalAnalyticsMetricResult[];
}>;

export type JournalAnalyticsResponse = Readonly<{
  resultVersion: typeof JOURNAL_ANALYTICS_RESULT_VERSION;
  factSetRevisionSha256: string;
  registryVersion: string;
  generatedAtUtc: string;
  currency: string | null;
  timezone: string | null;
  metrics: readonly JournalAnalyticsMetricResult[];
  groups: readonly JournalAnalyticsGroupResult[];
  coverage: JournalAnalyticsCoverage;
  continuationCursor: string | null;
  limitations: readonly string[];
  reconciliation: Readonly<{
    status: "reconciled" | "not_applicable" | "failed";
    reasonCode: string | null;
  }>;
}>;

export type JournalAnalyticsPartitionedResponse = Readonly<{
  resultVersion: typeof JOURNAL_ANALYTICS_RESULT_VERSION;
  factSetRevisionSha256: string;
  registryVersion: string;
  generatedAtUtc: string;
  partitions: readonly JournalAnalyticsResponse[];
  selectedAccountSourceCoverage: Readonly<{
    excludedExecutionCount: number;
    unsupportedSourceRecordCount: number;
    attribution: "selected_accounts_full_scope";
  }>;
  crossPartitionCounts: Readonly<{
    candidateCount: number;
    includedCount: number;
    readyClosedCount: number;
    legitimateOpenCount: number;
    needsDecisionCount: number;
    feeCompleteCount: number;
    feeIncompleteCount: number;
  }>;
  limitations: readonly string[];
}>;

export type JournalAnalyticsRoundTripTableRow = Readonly<{
  roundTripId: string;
  displayedSymbol: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string;
  entryLocalDate: string;
  closeLocalDate: string;
  tradeClassification: "day_trade" | "multi_day_trade";
  provenance: string;
  selectedPnlDecimal: string | null;
  grossPnlDecimal: string;
  chargeCoverage: "complete" | "unavailable";
  chargeCostDecimal: string | null;
  chargeCreditDecimal: string | null;
  uniqueExecutionCount: number;
  enteredQuantityDecimal: string;
  maximumPositionQuantityDecimal: string;
  entryNotionalDecimal: string;
  averageEntryPriceDecimal?: string | null;
  averageExitPriceDecimal?: string | null;
  returnPercentDecimal?: string | null;
  holdingDurationMilliseconds: number;
}>;

export type JournalAnalyticsRoundTripTableResponse = Readonly<{
  resultVersion: typeof JOURNAL_ANALYTICS_RESULT_VERSION;
  factSetRevisionSha256: string;
  generatedAtUtc: string;
  moneyBasis: JournalAnalyticsMoneyBasis;
  currency: string | null;
  timezone: string;
  totalRowCount: number;
  rows: readonly JournalAnalyticsRoundTripTableRow[];
  continuationCursor: string | null;
  limitations: readonly string[];
}>;
