import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { SWING_TRADE_TRACKER_HELP_GUIDES } from "@/src/modules/help/swing-trade-tracker-guides";

export const metadata: Metadata = { description: "Learn the currently available Swing Trade Tracker workflow.", title: "Swing Trade Tracker Help | TraderLink Platform" };

export default function SwingTradeTrackerHelpPage() {
  return <HelpCollectionOverview actions={Object.freeze([Object.freeze({ href: "/trade-tracker/swings", label: "Open Swing Trade Tracker", variant: "contained" as const }), Object.freeze({ href: "/trades/open", label: "Open Positions", variant: "outlined" as const })])} description="Use the Swing Trade Tracker to review intentional positions, keep their dated notes and record completed execution changes." guides={SWING_TRADE_TRACKER_HELP_GUIDES} highlights={Object.freeze(["A Swing is a trader-chosen position type; time held does not select it automatically.", "A confirmed position can stay visible without guessed unrealized P/L."])} href="/help/swing-trade-tracker" steps={Object.freeze([Object.freeze({ title: "Find the swing", description: "Review active positions first, then recently completed swings." }), Object.freeze({ title: "Record a fill", description: "Add a completed execution when you add to, reduce or close the position." }), Object.freeze({ title: "Track the review", description: "Keep dated notes, tags and the current position status useful." })])} title="Swing Trade Tracker" />;
}
