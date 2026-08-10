import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { TRADE_ANALYZER_HELP_GUIDES } from "@/src/modules/help/trade-analyzer-guides";

export const metadata: Metadata = {
  description: "Learn how TraderLink chart replay, entry and exit analysis, Green-to-red analysis and candle patterns work.",
  title: "Trade Analyzer Help | TraderLink Platform",
};

export default function TradeAnalyzerHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/analytics/trade-analyzer/day", label: "Open Day Trade Analysis", variant: "contained" as const }),
        Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "outlined" as const }),
      ])}
      description="Replay a supported trade, understand every execution and chart result, and compare saved Analyzer evidence over time."
      guides={TRADE_ANALYZER_HELP_GUIDES}
      highlights={Object.freeze([
        "Use exact broker-shown execution dates, seconds, prices and quantities.",
        "A free Moomoo account can unlock supported chart data without opening a trading account.",
        "Actual results remain separate from measured potential and missed opportunity.",
        "Completed analysis remains readable after paid access ends.",
      ])}
      href="/help/trade-analyzer"
      steps={Object.freeze([
        Object.freeze({ title: "Connect chart data", description: "Connect a supported free Moomoo account for chart replay and Analyzer market data." }),
        Object.freeze({ title: "Record exact executions", description: "Import or enter the exact execution time, price and quantity shown by the broker." }),
        Object.freeze({ title: "Review one trade", description: "Use Daily Trade Tracker to select a trade, replay its chart and inspect every fill." }),
        Object.freeze({ title: "Compare saved results", description: "Use Day Trade Analysis to study entry, exit, Green-to-red and pattern outcomes across eligible trades." }),
      ])}
      title="Trade Analyzer"
    />
  );
}
