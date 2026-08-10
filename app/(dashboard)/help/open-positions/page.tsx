import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { OPEN_POSITIONS_HELP_GUIDES } from "@/src/modules/help/open-positions-guides";

export const metadata: Metadata = { description: "Learn how TraderLink shows confirmed open positions and current position types.", title: "Open Positions Help | TraderLink Platform" };

export default function OpenPositionsHelpPage() {
  return <HelpCollectionOverview actions={Object.freeze([Object.freeze({ href: "/trades/open", label: "Open Positions", variant: "contained" as const }), Object.freeze({ href: "/data-decisions", label: "Open Data Decisions", variant: "outlined" as const })])} description="See confirmed open positions, choose their current trader-defined status and keep factual questions separate until they are resolved." guides={OPEN_POSITIONS_HELP_GUIDES} highlights={Object.freeze(["Time held never changes a position type automatically.", "The same position status is shared across Daily Tracker, Swing Tracker and Open Positions.", "Confirmed open positions remain separate from realized P/L."])} href="/help/open-positions" steps={Object.freeze([Object.freeze({ title: "Review confirmed positions", description: "See the remaining quantity, average entry, age and current status." }), Object.freeze({ title: "Choose a status", description: "Record the status that best describes your current intent." }), Object.freeze({ title: "Resolve a question", description: "Open Data Decisions when a source fact is not yet confirmed." })])} title="Open Positions" />;
}
