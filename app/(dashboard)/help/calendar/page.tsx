import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { CALENDAR_HELP_GUIDES } from "@/src/modules/help/calendar-guides";

export const metadata: Metadata = { description: "Learn how to read Calendar's completed-trade month and week views.", title: "Calendar Help | TraderLink Platform" };

export default function CalendarHelpPage() {
  return <HelpCollectionOverview actions={Object.freeze([Object.freeze({ href: "/calendar", label: "Open Calendar", variant: "contained" as const }), Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "outlined" as const })])} description="See completed Trade Tracker trades by month or week and open the details behind a selected trading day." guides={CALENDAR_HELP_GUIDES} highlights={Object.freeze(["Calendar is a factual review surface for accepted completed trades.", "Open positions are kept separate from realized P/L.", "Unavailable facts remain unavailable rather than appearing as zeroes."])} href="/help/calendar" steps={Object.freeze([Object.freeze({ title: "Choose a view", description: "Use Month or Week to arrange the available trading dates." }), Object.freeze({ title: "Read the period", description: "Review the selected period's P/L, trade count and win rate." }), Object.freeze({ title: "Inspect a day", description: "Open a date or ticker to see the saved trade details." })])} title="Calendar" />;
}
