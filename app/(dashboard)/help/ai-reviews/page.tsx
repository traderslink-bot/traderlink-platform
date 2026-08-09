import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { AI_REVIEWS_HELP_GUIDES } from "@/src/modules/help/ai-reviews-guides";

export const metadata: Metadata = {
  description: "Learn how TraderLink AI Reviews use your trading activity and saved Trade Tracker input.",
  title: "AI Reviews Help | TraderLink Platform",
};

export default function AiReviewsHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/ai-reviews", label: "Open AI Reviews", variant: "contained" as const }),
        Object.freeze({ href: "/account", label: "Open Account settings", variant: "outlined" as const }),
      ])}
      description="Choose when TraderLink reviews your trading periods, understand what evidence can be used, and turn each saved review into a practical next focus."
      guides={AI_REVIEWS_HELP_GUIDES}
      highlights={Object.freeze([
        "Verified executions can support a review even when a daily Trade Tracker review is not marked complete.",
        "Weekly reviews keep a full trading week together, including holiday-shortened and cross-month weeks.",
        "Monthly reviews use exact calendar-month facts and never borrow out-of-month statistics.",
        "Saved reviews remain available after AI Reviews are turned off or paid access ends.",
      ])}
      href="/help/ai-reviews"
      steps={Object.freeze([
        Object.freeze({ title: "Choose your schedule", description: "Turn AI Reviews on for a Trade Tracker account and choose weekly, two-week or monthly-only reviews." }),
        Object.freeze({ title: "Record what matters", description: "Keep trading normally and save any notes, tags or rule results you want available." }),
        Object.freeze({ title: "Check availability", description: "See when the period ends, what Trade Tracker pages exist and whether the review is ready." }),
        Object.freeze({ title: "Use the feedback", description: "Read the saved review, coverage note and focused priorities for the next period." }),
      ])}
      title="AI Reviews"
    />
  );
}
