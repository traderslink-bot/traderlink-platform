import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { TRADING_RULES_HELP_GUIDES } from "@/src/modules/help/trading-rules-guides";

export const metadata: Metadata = {
  description: "Learn how to choose, review and understand TraderLink Trading Rules.",
  title: "Trading Rules Help | TraderLink Platform",
};

export default function TradingRulesHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/rules", label: "Open Trading Rules", variant: "contained" as const }),
        Object.freeze({ href: "/rules/results", label: "Open Rule Results", variant: "outlined" as const }),
      ])}
      description="Choose rules that match your trading plan, understand automatic and manual results, and use the evidence and history without being told what decision to make."
      guides={TRADING_RULES_HELP_GUIDES}
      highlights={Object.freeze([
        "Preset rules are checked automatically after you activate them; no daily confirmation or explanation is required.",
        "Custom rules begin as Not selected until you explicitly choose Followed or Broken.",
        "Broken preset details show when the limit was reached and which later trade broke the rule.",
        "Rule Results reports factual counts, P/L and coverage without recommending whether to keep or change a rule.",
      ])}
      href="/help/trading-rules"
      steps={Object.freeze([
        Object.freeze({ title: "Choose a rule", description: "Add a preset from the Rule library or create a custom rule in your own words." }),
        Object.freeze({ title: "Trade normally", description: "Preset checks use accepted completed Day trades from the time the rule becomes active." }),
        Object.freeze({ title: "Review the day", description: "Read automatic details and choose results or optional notes for custom rules." }),
        Object.freeze({ title: "Compare the history", description: "Use Rule Results to search checks and review each rule version separately." }),
      ])}
      title="Trading Rules"
    />
  );
}
