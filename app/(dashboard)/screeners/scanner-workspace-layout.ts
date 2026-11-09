export type ScannerWorkspaceSlotId="slot-1"|"slot-2"|"slot-3"|"slot-4"|"slot-5"|"slot-6";
export type ScannerWorkspaceWidget="gainers"|"momentum"|"top-losers"|"high-drops"|"market-events"|"ticker-workspace";

export type ScannerWorkspaceLayout=Readonly<{
  id:string;
  desktopAreas:string;
  mobileAreas:string;
  assignments:Readonly<Record<ScannerWorkspaceWidget,ScannerWorkspaceSlotId>>;
}>;

/** Initial workspace preset. User-selected presets can replace this configuration later. */
export const DEFAULT_SCANNER_WORKSPACE_LAYOUT:ScannerWorkspaceLayout={
  id:"four-screeners-and-workspace",
  desktopAreas:'"slot-1 slot-2 slot-3 slot-4" "slot-5 slot-6 slot-6 slot-6"',
  mobileAreas:'"slot-1" "slot-2" "slot-3" "slot-4" "slot-5"',
  assignments:{
    gainers:"slot-1",
    momentum:"slot-2",
    "top-losers":"slot-3",
    "high-drops":"slot-4",
    "market-events":"slot-5",
    "ticker-workspace":"slot-6",
  },
};
