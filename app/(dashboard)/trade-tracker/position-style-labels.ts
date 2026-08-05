import type { JournalTradeStyleRecord } from "@/src/modules/journal/contracts/journal-trade-style-contracts";

export type PositionStyleDisplay = Omit<JournalTradeStyleRecord, "positionRef"> &
  Partial<Pick<JournalTradeStyleRecord, "positionRef">>;

export function positionStatusLabel(style: PositionStyleDisplay | null): string {
  if (!style) return "Not classified";
  if (style.lifecycleState === "needs_relink") return "Needs review";
  if (style.openStatus === "closed") {
    if (style.tradeStyle === "swing") return "Completed swing";
    if (style.tradeStyle === "day_trade") return "Completed day trade";
    return "Completed trade";
  }
  if (style.openStatus === "swing") return "Active swing";
  if (style.openStatus === "day_trade_still_open") return "Day trade still open";
  if (style.openStatus === "unplanned_hold") return "Unplanned hold (bag hold)";
  if (style.openStatus === "other") return "Long-term hold";
  return "Not classified";
}
