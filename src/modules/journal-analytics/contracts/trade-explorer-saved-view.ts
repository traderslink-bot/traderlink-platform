export const TRADE_EXPLORER_SAVED_VIEW_VERSION =
  "trade_explorer_saved_view_v1" as const;

export type TradeExplorerSavedViewLifecycleState = "active" | "retired";

export type TradeExplorerSavedViewPayload = Readonly<{
  viewVersion: typeof TRADE_EXPLORER_SAVED_VIEW_VERSION;
  normalizedViewJson: string;
  viewSha256: string;
}>;

export type TradeExplorerSavedViewRecord = Readonly<{
  savedViewId: string;
  name: string;
  revision: number;
  lifecycleState: TradeExplorerSavedViewLifecycleState;
  viewVersion: typeof TRADE_EXPLORER_SAVED_VIEW_VERSION;
  normalizedViewJson: string;
  viewSha256: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;
