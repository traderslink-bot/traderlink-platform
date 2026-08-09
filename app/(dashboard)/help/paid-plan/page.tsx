import type { Metadata } from "next";

import { HelpCollectionOverview } from "../help-collection-overview";
import { PAID_PLAN_HELP_GUIDES } from "@/src/modules/help/paid-plan-guides";

export const metadata: Metadata = {
  description: "Learn how TraderLink paid access, Whop billing, renewal and cancellation work.",
  title: "Paid Plan And Billing Help | TraderLink Platform",
};

export default function PaidPlanHelpPage() {
  return (
    <HelpCollectionOverview
      actions={Object.freeze([
        Object.freeze({ href: "/account", label: "Open Account", variant: "contained" as const }),
      ])}
      description="Learn how the wider TraderLink paid plan works, connect the Whop account used for your subscription, and manage billing without losing saved app data."
      guides={PAID_PLAN_HELP_GUIDES}
      highlights={Object.freeze([
        "The paid plan is not limited to AI Reviews. Whop shows the current included features and price.",
        "A monthly subscription follows your own renewal date rather than the calendar month.",
        "Cancelling at period end keeps access through the time already paid for.",
        "Saved Trade Tracker data and issued AI Reviews remain after paid access ends.",
      ])}
      href="/help/paid-plan"
      steps={Object.freeze([
        Object.freeze({ title: "Review the plan", description: "Open Whop to see the current offer, included features, price and billing period." }),
        Object.freeze({ title: "Complete checkout", description: "Use Whop for payment and subscription details." }),
        Object.freeze({ title: "Connect Whop", description: "Link the same Whop account to your TraderLink sign-in from Account." }),
        Object.freeze({ title: "Manage access", description: "Use Whop for renewal, payment and cancellation, then check the confirmed status in TraderLink." }),
      ])}
      title="Paid plan and billing"
    />
  );
}
