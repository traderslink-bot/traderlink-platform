import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { TRADE_EXPLORER_HELP_GUIDES } from "@/src/modules/help/trade-explorer-guides";

export const metadata: Metadata = {
  description: "Learn how to inspect, review and compare completed trades in TraderLink.",
  title: "Trade Explorer Help | TraderLink Platform",
};

export default function TradeExplorerHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/analytics/trade-explorer", label: "Open Trade Explorer", variant: "contained" as const }),
        Object.freeze({ href: "/analytics/trade-explorer/compare", label: "Open Compare Trades", variant: "outlined" as const }),
      ])}
      description="Inspect individual completed trades in Trade Explorer or compare the factual results of two to four groups in Compare Trades."
      guides={TRADE_EXPLORER_HELP_GUIDES}
      highlights={Object.freeze([
        "Trade Explorer is where you maintain trade notes, tags and custom-rule review results.",
        "Compare Trades uses separate groups and never changes your Trade Explorer records.",
        "Both features stay within the currently selected Trade Tracker account.",
      ])}
      href="/help/trade-explorer"
      steps={Object.freeze([
        Object.freeze({ title: "Choose the job", description: "Inspect individual trades or open Compare Trades to study groups." }),
        Object.freeze({ title: "Set the view", description: "Choose the filters, sorting or group definitions you need." }),
        Object.freeze({ title: "Read the facts", description: "Check the P/L basis, coverage and unavailable states before comparing results." }),
      ])}
      title="Trade Explorer"
    />
  );
}
