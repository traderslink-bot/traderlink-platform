export type ScannerWorkspaceSlotId="slot-1"|"slot-2"|"slot-3"|"slot-4"|"slot-5"|"slot-6"|"slot-7";
export type ScannerWorkspaceWidget="gainers"|"momentum"|"top-losers"|"high-drops"|"market-events"|"ticker-workspace"|"breakouts";

export const extraWorkspaceCardSlots = {"scanner-8":"slot-8", "scanner-9":"slot-9"} as const;
export type ExtraWorkspaceCard = keyof typeof extraWorkspaceCardSlots;
export type WorkspaceCardWidget = ScannerWorkspaceWidget | ExtraWorkspaceCard;
export type WorkspaceCardSlotId = ScannerWorkspaceSlotId | (typeof extraWorkspaceCardSlots)[ExtraWorkspaceCard];

export type ScannerWorkspaceLayout=Readonly<{
  id:string;
  desktopAreas:string;
  mobileAreas:string;
  assignments:Readonly<Record<ScannerWorkspaceWidget,ScannerWorkspaceSlotId>>;
}>;

/** Initial workspace preset. User-selected presets can replace this configuration later. */
export const DEFAULT_SCANNER_WORKSPACE_LAYOUT:ScannerWorkspaceLayout={
  id:"four-screeners-and-workspace",
  desktopAreas:'"slot-1 slot-2 slot-3 slot-4" "slot-5 slot-7 slot-6 slot-6"',
  mobileAreas:'"slot-1" "slot-2" "slot-3" "slot-4" "slot-5" "slot-7" "slot-6"',
  assignments:{
    gainers:"slot-1",
    momentum:"slot-2",
    "top-losers":"slot-3",
    "high-drops":"slot-4",
    "market-events":"slot-5",
    breakouts:"slot-7",
    "ticker-workspace":"slot-6",
  },
};
