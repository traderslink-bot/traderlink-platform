import type { JournalAnalyticsExactValue } from "@/src/modules/journal-analytics/contracts/analytics-result";

import type {
  AnalyticsLabPlatformPreview,
  AnalyticsLabPlatformQuery,
} from "../lab/analytics-lab-platform-types";

export const TRADE_EXPLORER_COMPARISON_VERSION =
  "trade_explorer_comparison_v1" as const;

export const TRADE_EXPLORER_COMPARISON_METRIC_IDS = Object.freeze([
  "total_trades",
  "net_pnl",
  "gross_pnl",
  "win_rate",
  "average_pnl",
  "profit_factor",
  "expectancy",
  "return_on_entry_notional",
  "average_holding_time",
] as const);

export type TradeExplorerComparisonGroupInput = Readonly<{
  name: string;
  query: AnalyticsLabPlatformQuery;
}>;

export type TradeExplorerComparisonInput = Readonly<{
  comparisonVersion: typeof TRADE_EXPLORER_COMPARISON_VERSION;
  groups: readonly TradeExplorerComparisonGroupInput[];
}>;

export type TradeExplorerComparisonDifference = Readonly<{
  baselineGroupName: string;
  comparedGroupName: string;
  metricId: string;
  state: "complete" | "unavailable";
  value: JournalAnalyticsExactValue | null;
  unavailableReason: string | null;
}>;

export type TradeExplorerComparisonResult = Readonly<{
  comparisonVersion: typeof TRADE_EXPLORER_COMPARISON_VERSION;
  factSetRevisionSha256: string;
  generatedAtUtc: string;
  groups: readonly Readonly<{
    name: string;
    query: AnalyticsLabPlatformQuery;
    preview: AnalyticsLabPlatformPreview;
  }>[];
  differences: readonly TradeExplorerComparisonDifference[];
  limitations: readonly string[];
}>;

export type TradeExplorerComparisonStudy = Readonly<{
  studyId: string;
  name: string;
  revision: number;
  groups: readonly TradeExplorerComparisonGroupInput[];
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type TradeExplorerComparisonStudyMutationResult =
  | Readonly<{
    ok: true;
    studies: readonly TradeExplorerComparisonStudy[];
    selectedStudyId: string | null;
  }>
  | Readonly<{ ok: false; message: string }>;
