export const TRADERLINK_OPEN_WORKSPACE_TRADE_DRAWER_EVENT =
  "traderlink:open-workspace-trade-drawer";

export function openWorkspaceTradeDrawer(): void {
  window.dispatchEvent(new Event(TRADERLINK_OPEN_WORKSPACE_TRADE_DRAWER_EVENT));
}
