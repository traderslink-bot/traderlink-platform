import type {
  JournalOpenPositionStatus,
  JournalTradeStyle,
  JournalTradeStyleLifecycle,
} from "./journal-trade-style-contracts";
import type { JournalSwingDailyNoteRecord } from "./journal-swing-note-contracts";

export type JournalTrackedPosition = Readonly<{
  positionRef: string;
  symbol: string;
  currency: string;
  timezone: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string | null;
  remainingQuantityDecimal: string;
  averageEntryPriceDecimal: string | null;
  projectionState: "ready_closed" | "legitimate_open" | "needs_decision";
  style: Readonly<{
    revision: number;
    tradeStyle: JournalTradeStyle;
    openStatus: JournalOpenPositionStatus;
    plannedFromEntry: boolean;
    claimedEffectiveAtUtc: string;
    declaredAtUtc: string;
    lifecycleState: JournalTradeStyleLifecycle;
    updatedAtUtc: string;
  }> | null;
  latestSwingNote: JournalSwingDailyNoteRecord | null;
  reviewDateSwingNote: JournalSwingDailyNoteRecord | null;
}>;

export type JournalTrackedExecution = Readonly<{
  executionId: string;
  executedAtUtc: string;
  sourceTimestampText: string;
  side: "buy" | "sell";
  quantityDecimal: string;
  priceDecimal: string | null;
  feesDecimal: string | null;
  allocationRole:
    | "opening"
    | "adding"
    | "reducing"
    | "closing"
    | "flip_closing"
    | "flip_opening";
}>;

export type JournalTrackedPositionDetail = JournalTrackedPosition & Readonly<{
  executions: readonly JournalTrackedExecution[];
}>;

export type JournalSwingPositionDetail = JournalTrackedPositionDetail & Readonly<{
  notes: readonly JournalSwingDailyNoteRecord[];
}>;
