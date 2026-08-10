import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { TRADE_TAGS_HELP_GUIDES } from "@/src/modules/help/trade-tags-guides";

export const metadata: Metadata = {
  description: "Learn how to choose, create and manage TraderLink Trade Tags.",
  title: "Trade Tags Help | TraderLink Platform",
};

export default function TradeTagsHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "contained" as const }),
        Object.freeze({ href: "/trade-tracker/swings", label: "Open Swing Trade Tracker", variant: "outlined" as const }),
      ])}
      description="Label individual trades with preset or custom observations you choose, keep the wording consistent, and understand where those saved tags can be used."
      guides={TRADE_TAGS_HELP_GUIDES}
      highlights={Object.freeze([
        "Tags belong to one completed trade or supported Swing position, not an entire ticker or trading day.",
        "You choose every tag; TraderLink does not infer setups, mistakes, emotions or market conditions.",
        "Preset and custom tags share one reusable list for the selected Trade Tracker account.",
        "Tags add review context but never change executions, P/L, Rules or Analyzer results.",
      ])}
      href="/help/trade-tags"
      steps={Object.freeze([
        Object.freeze({ title: "Open one trade", description: "Select the exact completed Day trade or supported Swing position you want to describe." }),
        Object.freeze({ title: "Choose tags", description: "Check useful presets or existing custom tags that genuinely fit the trade." }),
        Object.freeze({ title: "Create when needed", description: "Add short reusable wording when the preset list does not match your process." }),
        Object.freeze({ title: "Save the selection", description: "Save the complete checked set and reuse the same meaning on later trades." }),
      ])}
      title="Trade Tags"
    />
  );
}
