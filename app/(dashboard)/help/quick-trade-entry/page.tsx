import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { QUICK_TRADE_ENTRY_HELP_GUIDES } from "@/src/modules/help/quick-trade-entry-guides";

export const metadata: Metadata = { description: "Enter Trade Tracker executions across past trading dates without starting a Tracker review.", title: "Quick Trade Entry Help | TraderLink Platform" };

export default function QuickTradeEntryHelpPage() {
  return <HelpCollectionOverview actions={Object.freeze([Object.freeze({ href: "/quick-trade-entry", label: "Open Quick Trade Entry", variant: "contained" as const }), Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "outlined" as const })])} description="Enter completed broker fills across past trading dates, then choose the Trade Tracker review page that fits the trade." guides={QUICK_TRADE_ENTRY_HELP_GUIDES} highlights={Object.freeze(["One batch can contain executions from more than one past trading date.", "Quick Trade Entry is execution-only: it does not create notes, tags, rules or a day review.", "Manual and imported fills remain in the same Trade Tracker history."])} href="/help/quick-trade-entry" steps={Object.freeze([Object.freeze({ title: "Enter the fills", description: "Add the broker-shown date, time, ticker, side, quantity, price and reported fees." }), Object.freeze({ title: "Save the batch", description: "TradersLink preserves every execution on its actual trading date." }), Object.freeze({ title: "Choose the review", description: "Open the Daily Tracker, Swing Tracker, Open Positions or Data Decisions when needed." })])} title="Quick Trade Entry" />;
}
