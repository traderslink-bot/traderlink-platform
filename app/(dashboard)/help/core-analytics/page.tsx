import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { CORE_ANALYTICS_HELP_GUIDES } from "@/src/modules/help/core-analytics-guides";

export const metadata: Metadata = {
  description: "Learn how to read TraderLink's completed-trade Analytics and Trade Explorer pages.",
  title: "Core Analytics Help | TraderLink Platform",
};

export default function CoreAnalyticsHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/analytics", label: "Open Analytics Overview", variant: "contained" as const }),
        Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "outlined" as const }),
      ])}
      description="Use Core Analytics to compare confirmed Trade Tracker results by date, ticker, timing and execution characteristics."
      guides={CORE_ANALYTICS_HELP_GUIDES}
      highlights={Object.freeze([
        "Analytics is a factual, read-only view of available completed trades.",
        "Open positions and unresolved facts stay separate from realized results.",
        "Money values remain separated by currency when no conversion fact is available.",
      ])}
      href="/help/core-analytics"
      steps={Object.freeze([
        Object.freeze({ title: "Set the view", description: "Choose the Analytics page and date range that answers your question." }),
        Object.freeze({ title: "Compare the facts", description: "Use the tables and charts to compare the recorded completed-trade groups." }),
        Object.freeze({ title: "Check coverage", description: "Read an empty, zero or unavailable state before drawing a conclusion." }),
      ])}
      title="Core Analytics"
    />
  );
}
