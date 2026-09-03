import type { AnalyticsLabPlatformQuery } from "../lab/analytics-lab-platform-types";
import type { TradeExplorerTradeSort } from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
import { TRADE_EXPLORER_SAVED_VIEW_VERSION } from "@/src/modules/journal-analytics/contracts/trade-explorer-saved-view";

export type TradeExplorerResultView =
  | "trades"
  | "days"
  | "tickers"
  | "entry_times"
  | "holding_time"
  | "position_size"
  | "periods";

export type TradeExplorerSavedViewDefinition = Readonly<{
  viewVersion: typeof TRADE_EXPLORER_SAVED_VIEW_VERSION;
  query: AnalyticsLabPlatformQuery;
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
