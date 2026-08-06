export const JOURNAL_MANUAL_ENTRY_RECENT_CALENDAR_DAYS = 7;

export type JournalManualTrackerKind = "day" | "quick" | "swing";

export type JournalManualTradeRelationship =
  | "start_new_trade"
  | "continue_tracked_position"
  | "close_tracked_position"
  | "not_finished";

export type JournalTradeStyle = "day_trade" | "swing" | "other";

export type JournalManualTradeEntry = Readonly<{
  clientRowRef: string;
  localDate: string;
  localTime: string;
  sourceTimezone: string;
  normalizedSymbol: string;
  tradeCurrency: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string;
  feesDecimal: string | null;
}>;

export type JournalManualTradePreviewAllocation = Readonly<{
  clientRowRef: string;
  role:
    | "opening"
    | "adding"
    | "reducing"
    | "closing"
    | "flip_closing"
    | "flip_opening";
  quantityDecimal: string;
}>;

export type JournalManualExistingPositionOption = Readonly<{
  positionRef: string;
  version: number;
  direction: "long" | "short";
  openedAtUtc: string;
  remainingQuantityDecimal: string;
}>;

export type JournalManualTradePreviewGroup = Readonly<{
  groupRef: string;
  symbol: string;
  currency: string;
  direction: "long" | "short";
  openedAtUtc: string;
  lastExecutionAtUtc: string;
  state:
    | "complete_trade"
    | "open_trade"
    | "existing_position_closed"
    | "existing_position_changed";
  remainingQuantityDecimal: string;
  allocations: readonly JournalManualTradePreviewAllocation[];
  existingPosition: JournalManualExistingPositionOption | null;
  allowedRelationships: readonly JournalManualTradeRelationship[];
  allowedStyles: readonly JournalTradeStyle[];
  suggestedStyle: JournalTradeStyle;
}>;

export type JournalManualTradePreview = Readonly<{
  previewRef: string;
  expiresAtUtc: string;
  tracker: JournalManualTrackerKind;
  affectedDates: readonly string[];
  executionCount: number;
  groups: readonly JournalManualTradePreviewGroup[];
}>;

export type JournalManualTradeGroupConfirmation = Readonly<{
  groupRef: string;
  relationship: JournalManualTradeRelationship;
  style: JournalTradeStyle;
  existingPositionRef: string | null;
  completeExecutionSetConfirmed: boolean;
}>;

export type JournalManualTradeCommitRequest = Readonly<{
  tracker: JournalManualTrackerKind;
  entries: readonly JournalManualTradeEntry[];
  previewRef: string;
  expectedAccountSelectionRef: string;
  idempotencyKey: string;
  confirmations: readonly JournalManualTradeGroupConfirmation[];
  preparedBy?: "ai_chat";
}>;
