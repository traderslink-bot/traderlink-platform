import type { HelpGuide } from "./help-guide-types";

export const PAID_PLAN_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "getting-started",
    title: "Get paid access",
    description: "Understand the TraderLink paid plan, complete checkout in Whop and connect the correct account.",
    sections: Object.freeze([
      Object.freeze({
        id: "what-paid-plan-is",
        title: "What the paid plan is",
        summary: "Use one TraderLink subscription for the paid features included in your current plan.",
        keywords: Object.freeze(["paid plan", "subscription", "features", "AI Reviews", "Whop"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "The paid plan is a TraderLink subscription. It is not an AI Reviews-only purchase. The features included in the plan can grow or change, and an included feature may still have its own setup or On/Off setting." }),
          Object.freeze({ kind: "callout", title: "Whop shows the current offer", text: "Use the TraderLink plan page in Whop for the current price, included features and any trial. Help does not repeat those changeable details." }),
        ]),
      }),
      Object.freeze({
        id: "subscribe",
        title: "Subscribe through Whop",
        summary: "Complete payment and subscription setup on Whop.",
        keywords: Object.freeze(["checkout", "subscribe", "purchase", "payment", "Whop plan"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open the paid-plan action", text: "Use the paid access or subscription action shown in TraderLink." }),
            Object.freeze({ title: "2. Review the plan in Whop", text: "Confirm the current price, billing period, included features and trial if one is offered." }),
            Object.freeze({ title: "3. Complete checkout", text: "Enter and manage payment information on Whop. TraderLink does not ask you to copy card details into the app." }),
            Object.freeze({ title: "4. Return to TraderLink", text: "Select Account in the top bar to connect the Whop account and confirm access." }),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "connect-whop",
        title: "Connect your Whop account",
        summary: "Link the account that actually owns the subscription.",
        keywords: Object.freeze(["connect Whop", "link account", "same account", "not linked", "access"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Select Connect Whop in Account and sign in to the same Whop account used at checkout. TraderLink confirms access from that connection instead of guessing from an email address." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "If you have more than one Whop account, choose the one that owns the TraderLink membership.",
            "Allow the connection to return to TraderLink before closing the window.",
            "Refresh Account after linking if the status does not update immediately.",
            "Use Manage subscription in Whop for billing changes; the connection itself does not expose payment details to TraderLink.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "feature-settings",
        title: "Turn on included features",
        summary: "Paid access and a feature's personal settings can be separate.",
        keywords: Object.freeze(["feature settings", "turn on", "AI Reviews", "Trade Tracker account", "included feature"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "An active paid plan makes its included features available, but some features still require setup. For example, AI Reviews must be turned on for each Trade Tracker account and given a frequency and timing choice." }),
          Object.freeze({ kind: "callout", title: "Access does not change your settings", text: "Renewing or reconnecting the paid plan should not silently turn a personal feature setting on or change how you configured it." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "manage-subscription",
    title: "Manage your subscription",
    description: "Check renewal, update billing and understand what happens when you cancel.",
    sections: Object.freeze([
      Object.freeze({
        id: "renewal-period",
        title: "Your renewal period",
        summary: "A monthly subscription follows your own signup and renewal date.",
        keywords: Object.freeze(["renewal date", "billing period", "monthly", "anniversary", "auto renew"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A monthly paid plan normally renews on the subscriber's own renewal date. It does not reset for everyone on the first or last day of a calendar month." }),
          Object.freeze({ kind: "paragraph", text: "Open Manage subscription in Whop to see the current renewal date, plan status and payment method. Whop is the source for these billing details." }),
        ]),
      }),
      Object.freeze({
        id: "update-billing",
        title: "Update payment or plan details",
        summary: "Make billing changes in Whop rather than inside TraderLink.",
        keywords: Object.freeze(["payment method", "card", "billing", "manage subscription", "change plan"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Select Account", text: "Use the top-bar Account icon to find the paid-plan or subscription status." }),
            Object.freeze({ title: "2. Select Manage subscription in Whop", text: "The action opens Whop in a new page when it is available." }),
            Object.freeze({ title: "3. Make the billing change", text: "Update the payment method, review the plan or use the available cancellation controls in Whop." }),
            Object.freeze({ title: "4. Return to TraderLink", text: "Refresh Account so the latest confirmed access status can appear." }),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "cancel-at-period-end",
        title: "Cancel at the end of the paid period",
        summary: "Keep access through the time already paid for.",
        keywords: Object.freeze(["cancel", "period end", "ends after current period", "renew", "access"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "When a subscription is set to cancel at period end, paid access continues through the current paid period. The Account page may show Ends after current period and the date when available." }),
          Object.freeze({ kind: "paragraph", text: "The subscription will not automatically renew after that period unless you renew or change the cancellation in Whop." }),
          Object.freeze({ kind: "callout", title: "Your saved work remains", text: "Ending paid access does not delete Trade Tracker data or AI Reviews already issued. New work from paid features pauses when access becomes inactive." }),
        ]),
      }),
      Object.freeze({
        id: "payment-problem",
        title: "If a payment does not go through",
        summary: "Use Whop's billing controls and wait for the membership status to update.",
        keywords: Object.freeze(["payment failed", "declined card", "retry", "inactive", "membership"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A payment problem may be retried by Whop and does not always mean the membership ended immediately. Open Manage subscription in Whop to review the payment status and update the payment method." }),
          Object.freeze({ kind: "paragraph", text: "If Whop makes the membership inactive, new paid-feature work pauses. After the membership is active again and TraderLink confirms the update, future eligible work can resume." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "access-troubleshooting",
    title: "Fix paid-access problems",
    description: "Resolve a missing connection, inactive membership or account mismatch without losing saved data.",
    sections: Object.freeze([
      Object.freeze({
        id: "read-access-status",
        title: "Read the access status",
        summary: "Identify whether the account is not connected, inactive or needs support.",
        keywords: Object.freeze(["not linked", "inactive", "conflict", "support", "access status"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["What you see", "What it means"]), rows: Object.freeze([
            Object.freeze(["Connect Whop", "TraderLink has not linked this sign-in to a Whop account."]),
            Object.freeze(["Whop connected, no active access", "The account is linked, but an active accepted membership has not been confirmed."]),
            Object.freeze(["Access active", "Whop currently confirms paid access for this TraderLink sign-in."]),
            Object.freeze(["Needs support review", "The connection contains conflicting information and access was not granted from it."]),
            Object.freeze(["Being prepared", "The paid connection is not ready in this TraderLink environment yet."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "wrong-whop-account",
        title: "Check the Whop account",
        summary: "Use the account that owns the TraderLink subscription.",
        keywords: Object.freeze(["wrong account", "multiple Whop accounts", "reconnect", "subscription owner"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Whop", text: "Confirm which signed-in Whop account shows the active TraderLink plan." }),
            Object.freeze({ title: "2. Return to TraderLink Account", text: "Check whether that Whop account is the one you connected." }),
            Object.freeze({ title: "3. Connect the correct account", text: "Use Connect Whop if no connection exists. If the wrong account is already linked, contact support rather than creating another purchase." }),
            Object.freeze({ title: "4. Refresh the status", text: "Allow the connection to return to TraderLink and refresh Account." }),
          ]) }),
          Object.freeze({ kind: "callout", tone: "warning", title: "Do not purchase twice to fix a connection", text: "A missing status can be an account-link problem. Confirm the subscription in Whop and contact support before buying another plan." }),
        ]),
      }),
      Object.freeze({
        id: "active-in-whop-not-traderlink",
        title: "Whop is active but TraderLink is not",
        summary: "Check the connection and allow time for the confirmed update.",
        keywords: Object.freeze(["active in Whop", "not active TraderLink", "refresh", "delay", "support"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Confirm the Whop plan is active and belongs to the connected account.",
            "Return to TraderLink and refresh the Account page.",
            "If you just paid, renewed or updated a payment method, allow a short time for the confirmed status to arrive.",
            "If the mismatch remains, contact support with the time of the change and the status shown in both places. Do not send card details.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "what-remains-saved",
        title: "What remains saved without paid access",
        summary: "Keep your account history while new paid work pauses.",
        keywords: Object.freeze(["saved data", "saved reviews", "after cancellation", "reactivate", "resume"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Trade Tracker data and AI Reviews already issued remain saved when paid access ends. You can still return to saved reviews where the app provides that read access." }),
          Object.freeze({ kind: "paragraph", text: "New generation or other paid-feature activity pauses while the membership is inactive. Reactivating the plan restores future access after TraderLink confirms it; it does not create duplicate past reviews." }),
        ]),
      }),
      Object.freeze({
        id: "contact-support",
        title: "When to contact support",
        summary: "Ask for help when the connection and Whop status still disagree.",
        keywords: Object.freeze(["contact support", "conflict", "billing help", "privacy", "what to send"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Contact support when the Account page says the connection needs review, the wrong Whop account is linked, or active Whop access still does not appear after reconnecting and refreshing." }),
          Object.freeze({ kind: "callout", title: "Share only what support needs", text: "Describe the status and when it changed. Never send a full card number, password, login code or private trading notes." }),
        ]),
      }),
    ]),
  }),
]);

export function paidPlanGuideBySlug(slug: string): HelpGuide | undefined {
  return PAID_PLAN_HELP_GUIDES.find((guide) => guide.slug === slug);
}
