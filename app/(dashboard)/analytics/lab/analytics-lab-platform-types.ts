import type {
  JournalAnalyticsGrouping,
  JournalAnalyticsMoneyBasis,
} from "@/src/modules/journal-analytics/contracts/analytics-query";
import type {
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
  JournalAnalyticsRoundTripTableResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import type {
  JournalAnalyticsCapabilityState,
  JournalAnalyticsMetricDefinition,
} from "@/src/modules/journal-analytics/contracts/metric-registry";

export type AnalyticsLabMetricOption = Pick<
  JournalAnalyticsMetricDefinition,
  | "metricId"
  | "title"
  | "description"
  | "valueKind"
  | "unit"
  | "moneyBasis"
  | "displayPolicy"
  | "unavailableReasonCode"
> & Readonly<{
  capabilityState: JournalAnalyticsCapabilityState;
}>;

export type AnalyticsLabPlatformQuery = Readonly<{
  expectedAccountSelectionRef: string;
  metricId: string;
  grouping: JournalAnalyticsGrouping;
  moneyBasis: JournalAnalyticsMoneyBasis;
  currency: string | null;
  symbol: string | null;
  direction: "long" | "short" | null;
  tradeClassification: "day_trade" | "multi_day_trade" | null;
  provenance:
    | "broker_only"
    | "manual_only"
    | "correction_only"
    | "mixed"
    | "unknown"
    | null;
  outcome: "win" | "loss" | "flat" | null;
  entryWeekday:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
    | null;
  entryTimeBucketMinutes: 5 | 15 | 30 | 60;
  entryTimeBucket: string | null;
  startDate: string;
  endDate: string;
  minimumHoldingSeconds: string | null;
  maximumHoldingSeconds: string | null;
  minimumEnteredQuantity: string | null;
  maximumEnteredQuantity: string | null;
  minimumPositionQuantity: string | null;
  maximumPositionQuantity: string | null;
  minimumEntryNotional: string | null;
  maximumEntryNotional: string | null;
  evidenceRows: 12 | 24 | 50 | 100;
}>;

export type AnalyticsLabSavedViewQuery = Omit<
  AnalyticsLabPlatformQuery,
  "expectedAccountSelectionRef"
>;

export type AnalyticsLabSavedView = Readonly<{
  savedViewId: string;
  name: string;
  revision: number;
  query: AnalyticsLabPlatformQuery;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type AnalyticsLabPlatformPreview = Readonly<{
  selectedMetric: JournalAnalyticsMetricResult | null;
  response: JournalAnalyticsPartitionedResponse;
  evidence: JournalAnalyticsRoundTripTableResponse | null;
  evidenceUnavailableReason: string | null;
}>;

export type AnalyticsLabPlatformPageModel = Readonly<{
  expectedAccountSelectionRef: string;
  metrics: readonly AnalyticsLabMetricOption[];
  groupings: readonly Readonly<{
    value: JournalAnalyticsGrouping;
    label: string;
  }>[];
  currencies: readonly string[];
  symbols: readonly string[];
  minimumDate: string;
  maximumDate: string;
  initialQuery: AnalyticsLabPlatformQuery;
  initialPreview: AnalyticsLabPlatformPreview;
  savedViews: readonly AnalyticsLabSavedView[];
}>;

export type AnalyticsLabPlatformQueryResult =
  | Readonly<{ ok: true; preview: AnalyticsLabPlatformPreview }>
  | Readonly<{ ok: false; message: string }>;

export type AnalyticsLabSavedViewMutationResult =
  | Readonly<{
    ok: true;
    savedViews: readonly AnalyticsLabSavedView[];
    selectedSavedViewId: string | null;
  }>
  | Readonly<{ ok: false; message: string }>;
