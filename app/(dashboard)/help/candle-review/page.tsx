import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { CANDLE_REVIEW_HELP_GUIDES } from "@/src/modules/help/candle-review-guides";

export const metadata: Metadata = { description: "Learn how to request, read and understand Candle Review for an eligible completed Trade Tracker trade.", title: "Candle Review Help | TraderLink Platform" };

export default function CandleReviewHelpPage() {
  return <HelpCollectionOverview actions={Object.freeze([Object.freeze({ href: "/trade-tracker", label: "Open Daily Trade Tracker", variant: "contained" as const })])} description="Use Candle Review to inspect the available one-minute market context around an eligible completed stock trade without changing the Trade Tracker facts." guides={CANDLE_REVIEW_HELP_GUIDES} highlights={Object.freeze(["Market data is requested only after you choose Analyze this trade or Refresh candle review.", "An unavailable review does not change the completed Trade Tracker trade.", "Candle observations are context and assistance, not a trade grade or recommendation."])} href="/help/candle-review" steps={Object.freeze([Object.freeze({ title: "Choose a completed trade", description: "Open the available Candle Review follow-up link from Daily Trade Tracker." }), Object.freeze({ title: "Request the review", description: "Choose Analyze this trade when you are ready to request the bounded market-data window." }), Object.freeze({ title: "Use the context", description: "Compare the price path and observations with your own Trade Tracker review." })])} title="Candle Review" />;
}
