export type JournalTradeStyle = "day_trade" | "swing" | "other";

export type JournalOpenPositionStatus =
  | "day_trade_still_open"
  | "swing"
  | "unplanned_hold"
  | "other"
  | "unclassified"
  | "closed";

export type JournalTradeStyleLifecycle = "active" | "closed" | "needs_relink";

export type JournalSwingPositionPlan = Readonly<{
  entryReason: string;
  hasUpcomingCatalyst: boolean;
  catalystDetails: string | null;
  plannedHoldTradingDays: number;
}>;

export type JournalTradeStyleRecord = Readonly<{
  positionRef: string;
  revision: number;
  tradeStyle: JournalTradeStyle;
  openStatus: JournalOpenPositionStatus;
  plannedFromEntry: boolean;
  claimedEffectiveAtUtc: string;
  declaredAtUtc: string;
  lifecycleState: JournalTradeStyleLifecycle;
  updatedAtUtc: string;
  swingPlan: JournalSwingPositionPlan | null;
}>;

export type JournalSwingPositionPlanChange = Readonly<{
  positionRef: string;
  expectedRevision: number;
  entryReason: string;
  hasUpcomingCatalyst: boolean;
  catalystDetails: string | null;
  plannedHoldTradingDays: number;
  sourceUi: "day_trade_tracker" | "swing_trade_tracker";
  idempotencyKey: string;
}>;

export type JournalTradeStyleChange = Readonly<{
  positionRef: string;
  expectedRevision: number | null;
  tradeStyle: JournalTradeStyle;
  openStatus: Exclude<JournalOpenPositionStatus, "closed">;
  plannedFromEntry: boolean;
  claimedEffectiveAtUtc: string;
  reason: "planned_from_entry" | "reclassified" | "unplanned_hold" | "other";
  sourceUi:
    | "data_decisions"
    | "day_trade_tracker"
    | "swing_trade_tracker"
    | "open_positions"
    | "ai_chat";
  idempotencyKey: string;
}>;
