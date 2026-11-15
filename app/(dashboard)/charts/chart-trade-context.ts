import { candlePatternName } from "@/src/lib/trade-candle-analysis/pattern-presentation";
import type { ChartJournalOverlay } from "@/src/modules/journal/contracts/journal-chart-contracts";
import type { DaySessionTradeAnalyzer } from "../trade-tracker/[sessionDate]/day-session-types";

export type ChartRuleEvidence = Readonly<{
  label: string;
  netPnl: string | null;
  occurredAt: string;
  ruleId: string;
  triggerAt: string | null;
}>;

type TradeMarkKind = ChartJournalOverlay["kind"] | "rule" | "pattern";

export type MarketTradeMark = Readonly<{
  id: string;
  time: number;
  kind: Exclude<TradeMarkKind, "note">;
  label: string;
  details?: string;
}>;

export type MarketTradeContext = Readonly<{
  from: number;
  to: number;
  marks: readonly MarketTradeMark[];
}>;

const executionLabels = {
  entry: "Entry",
  add: "Add",
  partial_exit: "Partial exit",
  temporary_flat: "Temporary flat",
  final_exit: "Final exit",
} as const;

export function buildMarketTradeContext(
  analysis: {
    status: DaySessionTradeAnalyzer["status"];
    events: readonly Pick<DaySessionTradeAnalyzer["events"][number], "eventId" | "executedAt" | "kind" | "patterns" | "price" | "quantity">[];
  }, direction: "long" | "short", currency: string,
  rules: readonly ChartRuleEvidence[],
): MarketTradeContext | null {
  if (analysis.status !== "ready") return null;
  const fills = analysis.events.flatMap((event): MarketTradeMark[] => {
    const time = Date.parse(event.executedAt) / 1000;
    if (!Number.isFinite(time)) return [];
    const opening = event.kind === "entry" || event.kind === "add";
    const kind = opening === (direction === "long") ? "buy" : "sell";
    return [{
      id: `analysis-fill-${event.eventId}`,
      time, kind, label: executionLabels[event.kind],
      details: `${kind === "buy" ? "Buy" : "Sell"} ${event.quantity} shares at ${event.price} ${currency}`,
    }];
  });
  if (fills.length === 0) return null;
  const marks = new Map(fills.map(mark => [mark.id, mark]));
  for (const { patterns } of analysis.events) {
    for (const pattern of patterns) {
      if (!Number.isFinite(pattern.time)) continue;
      const id = `analysis-pattern-${pattern.time}-${pattern.kind}-${pattern.timeframe}`;
      marks.set(id, {
        id, time: pattern.time, kind: "pattern", label: candlePatternName(pattern.kind), details: pattern.timeframe,
      });
    }
  }
  rules.forEach((rule, index) => {
    const time = Date.parse(rule.occurredAt) / 1000;
    if (!Number.isFinite(time)) return;
    const id = `analysis-rule-${index}`;
    marks.set(id, {
      id, time, kind: "rule", label: rule.label,
      details: rule.netPnl === null ? undefined : `P/L ${rule.netPnl} ${currency}`,
    });
  });
  return {
    from: fills.reduce((first, fill) => Math.min(first, fill.time), Infinity),
    to: fills.reduce((last, fill) => Math.max(last, fill.time), -Infinity),
    marks: [...marks.values()].sort((left, right) => left.time - right.time),
  };
}
