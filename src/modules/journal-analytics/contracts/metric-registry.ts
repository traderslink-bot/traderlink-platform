import type { JournalAnalyticsMoneyBasis } from "./analytics-query";

export const JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION =
  "journal_analytics_metrics_v1" as const;

export type JournalAnalyticsCapabilityState =
  | "implemented"
  | "conditional"
  | "unavailable";

export type JournalAnalyticsMetricDefinition = Readonly<{
  metricId: string;
  title: string;
  description: string;
  formulaVersion: string;
  capabilityState: JournalAnalyticsCapabilityState;
  valueKind:
    | "count"
    | "money"
    | "decimal"
    | "percentage"
    | "ratio"
    | "duration"
    | "date"
    | "text";
  unit: string;
  requiredFacts: readonly string[];
  moneyBasis: JournalAnalyticsMoneyBasis | "selectable" | "not_applicable";
  currencyPolicy: string;
  dateTimePolicy: string;
  openPositionPolicy: string;
  decisionPolicy: string;
  exclusionPolicy: string;
  zeroDenominatorPolicy: string;
  displayPolicy: string;
  coveragePolicy: string;
  unavailableReasonCode: string | null;
  compatibilityAliases: readonly string[];
}>;

export type JournalAnalyticsMetricRegistry = Readonly<{
  registryVersion: typeof JOURNAL_ANALYTICS_METRIC_REGISTRY_VERSION;
  definitions: readonly JournalAnalyticsMetricDefinition[];
}>;
