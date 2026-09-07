import type { AnalyticsLabPlatformQuery } from "../lab/analytics-lab-platform-types";
import type { TradeExplorerTradeSort } from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
import { TRADE_EXPLORER_SAVED_VIEW_VERSION } from "@/src/modules/journal-analytics/contracts/trade-explorer-saved-view";

export type TradeExplorerResultView =
  | "trades"
  | "days"
  | "tickers"
  | "entry_times"
  | "exit_times"
  | "entry_weekday"
  | "direction"
  | "entered_quantity"
  | "entry_value"
  | "entry_price"
  | "holding_time"
  | "position_size"
  | "position_value"
  | "periods";

export type TradeExplorerRuleStatus =
  | "followed"
  | "broken"
  | "not_reviewed"
  | "not_applicable";

export type TradeExplorerQuery = AnalyticsLabPlatformQuery & Readonly<{
  tagId: string | null;
  untaggedOnly: boolean;
  noteState: "present" | "missing" | null;
  reviewIncompleteOnly: boolean;
  ruleId: string | null;
  ruleVersionId: string | null;
  ruleStatus: TradeExplorerRuleStatus | null;
  dayNoteState: "present" | "missing" | null;
  dayRuleId: string | null;
  dayRuleVersionId: string | null;
  dayRuleStatus: TradeExplorerRuleStatus | null;
}>;

export type TradeExplorerSavedViewDefinition = Readonly<{
  viewVersion: typeof TRADE_EXPLORER_SAVED_VIEW_VERSION;
  query: TradeExplorerQuery;
  resultView: TradeExplorerResultView;
  tradeSort: TradeExplorerTradeSort;
  sortDirection: "descending" | "ascending";
}>;

export type TradeExplorerSavedView = Readonly<{
  savedViewId: string;
  name: string;
  revision: number;
  view: TradeExplorerSavedViewDefinition;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type TradeExplorerSavedViewMutationResult =
  | Readonly<{
    ok: true;
    savedViews: readonly TradeExplorerSavedView[];
    selectedSavedViewId: string;
  }>
  | Readonly<{
    ok: false;
    message: string;
    refreshRequired: boolean;
  }>;
