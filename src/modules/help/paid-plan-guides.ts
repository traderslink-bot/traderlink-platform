import type { HelpGuide } from "./help-guide-types";

export const PAID_PLAN_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "membership-plans",
    title: "Plans and membership access",
    description: "Choose an available plan and check the access confirmed for your account.",
    sections: Object.freeze([
      Object.freeze({
        id: "choose-a-plan", title: "Choose a plan", summary: "Review the exact offer before continuing.",
        keywords: Object.freeze(["plans", "Stripe", "Whop", "private offer", "trial", "membership"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Watchlist is one feature for the shared list managed by the owner. Its nested options are Ticker details, Trade analysis, Support and Resistance, and Indicator card. Private Watchlist is a separate personal list for each member. Specific-ticker restrictions remain separate from these plan-wide options." }),
          Object.freeze({ kind: "paragraph", text: "Select New add-on in Memberships to build an optional package with the same editor used for plans. Add-ons contain only the features you select. Publish a public add-on to offer it with monthly or free plans. Customers select one or more add-ons inside the plan card and see the combined monthly price before checkout. Feature upgrade links include matching add-ons; when an add-on provides the feature, compatible public monthly or free plans stay available so it can be selected. Display-only packages can be previewed but do not charge or grant access. Paid combined checkout uses Stripe; matching feature allowances add together and unlimited stays unlimited. Overlapping metered allowances need matching reset periods. Published package edits apply to new selections; existing purchases keep their saved features and prices. Existing eligible monthly Stripe subscribers can select Add to your current plan on an add-on card, or open Account → Membership. Review today's prorated charge, the new monthly total and the unchanged renewal date before confirming. Added access starts after successful payment. If payment needs authentication, follow the payment link and select Check payment afterward; current access remains available while payment is pending. A payment under review cannot be submitted again. Subscriptions with special billing terms may need support before adding a package." }),
          Object.freeze({ kind: "paragraph", text: "The owner can arrange a plan card's features with Move up and Move down under Plan card feature order. The preview updates immediately. Save the draft to keep that order; publishing makes the saved order available on the plan page." }),
          Object.freeze({ kind: "paragraph", text: "Trade Analyzer generates analysis for trades; Trade Analyzer Analysis is a separate plan feature for pages that explore those results. Levels Generator shows its generation allowance and reset period in the brief description, not its title." }),
          Object.freeze({ kind: "paragraph", text: "Import broker statements is a selectable plan feature with brief and expanded descriptions. It uses the existing Journal import permission and has no quantity or reset controls." }),
          Object.freeze({ kind: "paragraph", text: "Session Tracker can be listed as a plan feature with editable brief and expanded descriptions. It has no quantity or reset settings." }),
          Object.freeze({ kind: "paragraph", text: "Trade Explorer is one plan feature. Reports and exports are optional within it: a plan can let you explore your trades while keeping reports and exports unavailable." }),
          Object.freeze({ kind: "paragraph", text: "Trading Journal is one plan feature. Its brief description explains the included Journal account allowance and Journal options. Trade Analyzer's brief description shows how many analyses are included and how often the allowance resets; those quantities are not part of the feature names." }),
          Object.freeze({ kind: "paragraph", text: "Journal account allowances count active personal accounts across your workspaces; Demo accounts do not count. Reaching the allowance prevents creating another account and offers a link to Journal plans; existing accounts remain available. Tags are part of Journal. Preset tags are included; your plan's Journal description shows the number of active custom tags allowed across all your Journal accounts, or Unlimited. Retiring a custom tag frees a slot. Existing tags remain preserved after a plan change." }),
          Object.freeze({ kind: "paragraph", text: "Free access shows $0 with the same small dollar sign and currency row as paid prices; the plan name is chosen by the owner. Add-on packages appear below base plans as wide cards with an Add-on corner label, title, price, descriptions and expandable features. Choose add-ons inside the selected base plan card. Plan cards show prices near the top and included features in compact rows below. Brief descriptions, allowances and news delays remain visible. Select a feature row with an arrow to expand its details. Owners can edit brief and expanded descriptions inside each plan, or use shared descriptions managed under Features. Plan-specific descriptions are published with that plan." }),
          Object.freeze({ kind: "paragraph", text: "In Memberships, open Plans and select New plan. Configure details, features, prices and access, providers, trials, Discord rules and private-page placement together. Enable Requires a connected Discord account for packages with Discord benefits. This is shown before signup and includes selected add-ons. Members can continue into the app and connect Discord later; a reminder stays visible while their active plan requires it. Access option name is a label, such as Monthly access; enter the amount in Initial price and, for recurring access, Renewal price. Save keeps an unpublished draft; Publish validates the current form and makes configured access options available. A display-only plan shows a disabled button and a purchases-unavailable note; it cannot start signup or checkout. Plans collapse after a successful save." }),
          Object.freeze({ kind: "paragraph", text: "Journal Administration uses the Light or Navy Dark appearance chosen in Account preferences." }),
          Object.freeze({ kind: "paragraph", text: "Edit reopens the saved configuration. Duplicate creates a separate unpublished copy without copying members, billing, usage or invitation secrets. Delete draft removes an unpublished draft. Published plans show their published name; saved edits appear as Draft changes with any draft name shown separately. Discard draft changes removes only those edits. If publication reports a stale baseline, Refresh draft for publishing keeps your saved edits while accepting the current published baseline; review the draft before publishing. Archive stops new signups while preserving member access and lets you republish later. Delete plan removes an active or archived plan from the owner list and enrollment; it preserves membership and billing history and existing access, and the deleted plan cannot be republished." }),
          Object.freeze({ kind: "paragraph", text: "When publishing edits, Apply feature/access changes to existing members updates this plan's access together. Leaving it off keeps existing access unchanged. Neither choice changes existing subscription charges, grant expiry dates, usage records or unrelated grants. Discord-based access still requires current server membership and the applicable roles." }),
          Object.freeze({ kind: "paragraph", text: "Broker connection allowances apply across your workspaces. Connections are preserved after a downgrade; the oldest connections occupy the available slots. Connections outside the allowance cannot authorize, refresh tokens or import new trades. You can still disconnect them, and upgrade links show compatible plans and add-ons. Private Watchlist allowance settings distinguish ticker additions, active ticker slots, generations and generation budgets. Budgets are entered and displayed in USD. Metered allowances can use calendar months in UTC, a custom number of days or no reset; active ticker slots do not reset. A member override replaces the chosen allowance, but does not grant private Watchlist or card access. Generation also requires the configured private runtime and verified provider pricing." }),
          Object.freeze({ kind: "paragraph", text: "Private Watchlist is your own saved ticker list, separate from the group Watchlist. If your plan does not include it, the page offers plans with this feature and your saved tickers remain preserved. Add a ticker, open its saved cards and choose which permitted cards to generate. Analysis, indicators and levels have independent plan permissions. Adding or archiving a ticker never publishes to the group or sends notifications. Generated cards are saved snapshots, not live monitoring. Archiving retains saved work; reactivating uses an addition and an active slot." }),
          Object.freeze({ kind: "paragraph", text: "One selected-card request uses one generation allowance. Its maximum provider cost is held before generation, then adjusted to the confirmed usage cost. A failed generation returns its generation allowance but still records any confirmed provider cost. A timeout or uncertain result keeps its reservation: use Check generation status instead of starting another request. Checking status does not generate again. Cards excluded by your current plan are not sent to your browser, but saved work is retained." }),
          Object.freeze({ kind: "paragraph", text: "Stock Press Releases is one feature. Its plan description explains when press releases become available, whether notifications are included, and any notification delay. Week Ahead includes its own notifications. Every plan includes Journal, manual trade entry and Trading Rules. Plans differ in statement import access, preset rule access and the number of active custom rules allowed. Trader Calendar can include monthly or weekly views. Compare trades is listed separately. Allowed notifications default to on unless you previously saved an off preference. Browser push still requires device permission, email requires a confirmed address, and Discord messages require a linked Discord identity. Turning a channel off also suppresses its pending deliveries." }),
          Object.freeze({ kind: "paragraph", text: "Plans can specify separate delays for news appearing in the signed-in dashboard and for press-release notifications. The owner chooses the duration; zero means immediate. The clock starts when the article is first available in the app, or at its publication time if that is later. Where multiple plans explicitly provide different delays, the shortest applies. Notification timing and dashboard visibility are independent, so a notification can arrive before its dashboard article is available if the owner chooses those timings. Public website news is not changed by these dashboard settings." }),
          Object.freeze({ kind: "paragraph", text: "Notifications shows unavailable categories with the names of matching public plans and upgrade links. Saved preferences do not override expired or revoked access; queued remote deliveries are checked again before sending. You can turn included notifications off yourself. In-app records and important account information are retained." }),
          Object.freeze({ kind: "paragraph", text: "Watchlist, Ticker details, and Trade analysis & preparation can be included independently. When the owner enables these membership settings, you can retain the main Watchlist while detail pages require another feature, or open details while the analysis card shows an access message. View plans with this feature lists matching public offers; ask the owner about private access. Archived ticker details use the same settings." }),
          Object.freeze({ kind: "paragraph", text: "When membership plans are available, use Plans or an invitation supplied by the owner. Each offer shows its currency, initial payment and renewal period. A fixed number of days is different from a calendar month. Trial offers show their duration and whether access ends or the offer renews afterward." }),
          Object.freeze({ kind: "paragraph", text: "An invitation page can temporarily have no offers. The owner can add or change its selected plans later without changing the invitation link; this does not add those plans to the public Plans page." }),
          Object.freeze({ kind: "paragraph", text: "Sign in before choosing an offer. A free plan or a free trial without a payment method can grant access immediately. Stripe checkout grants access after the payment provider confirms the checkout. Returning from checkout alone does not confirm access." }),
          Object.freeze({ kind: "paragraph", text: "Use Sign in on the plans page to return to the same offer page after Discord login, including an unlisted invitation. You do not need to join a Discord server to sign in for website plans and billing. Server-based offers still require the server membership or roles chosen by the owner." }),
          Object.freeze({ kind: "paragraph", text: "External offers, including owner-configured Whop links, can require the owner to confirm access after payment. Follow the offer's instructions. If the invitation expires after you pay, contact the owner: they can verify payment and give you a separate owner grant. This does not change or cancel billing with the external provider. The existing linked Whop subscription flow remains separate." }),
          Object.freeze({ kind: "paragraph", text: "If a Stripe payment succeeds but an invitation is no longer available, contact the owner rather than purchasing again. The owner can approve recovery for that checkout. Access still waits for Stripe's verified payment confirmation and follows the purchased plan; approval does not create a second charge." }),
          Object.freeze({ kind: "paragraph", text: "Journal and Analytics can be included separately. When the owner enforces those settings, Workspace requires Journal access, while its performance cards require Analytics. Losing Analytics does not remove your Journal review or delete your records." }),
          Object.freeze({ kind: "paragraph", text: "Opening Workspace while connected saves the review available to your current plan for offline use. A Journal-only saved Workspace can include your trading-day review without Analytics cards. Existing device snapshots are not remotely erased when a plan changes." }),
          Object.freeze({ kind: "paragraph", text: "The Analytics analyzed-trades list, candle setup occurrences and their saved chart replays also require Analytics access when enforced. If access changes while a page is open, the next request shows the plan-access message instead of asking you to keep retrying." }),
          Object.freeze({ kind: "paragraph", text: "Single-trade execution details, saved analysis and factual reflection summaries are shared by Journal and Analytics: either permitted feature can provide that read access. Trade Explorer review editing follows Trade Explorer access. Confirming a broker execution mismatch is a Journal action and follows Journal access. These settings never give access to another member's records." }),
          Object.freeze({ kind: "paragraph", text: "Discord access can depend on your server and roles. The owner can change those rules later, including adding new roles or making an offer available to every verified server member. Purchase eligibility alone does not mean the plan has already been granted." }),
          Object.freeze({ kind: "paragraph", text: "For an external-provider trial, review the price, duration and renewal shown by the provider before paying. If they differ from the offer here, stop and contact the owner. External trial checkout is configured separately from the regular offer." }),
        ]),
      }),
      Object.freeze({
        id: "plan-and-billing", title: "Plan & billing", summary: "Check confirmed plans and manage linked Stripe billing.",
        keywords: Object.freeze(["billing", "cancel", "membership", "access expiry"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Open Account, then Plan & billing, to see your active membership plans and their end dates. Manage Stripe billing opens the provider's billing portal when a Stripe subscription is linked. A recent payment may need time to be confirmed." }),
          Object.freeze({ kind: "paragraph", text: "Plan & billing remains available to your signed-in account when dashboard plan access ends. A website membership does not require joining a Discord server; server-specific offers still require the server and roles configured for them." }),
          Object.freeze({ kind: "paragraph", text: "An owner grant and a paid plan can coexist. Expiry or cancellation of one source does not remove a separate active source. Discord plan access depends on the server and roles selected by the owner and a current membership verification." }),
          Object.freeze({ kind: "paragraph", text: "If the owner enables membership requirements for Community, you also need a plan that includes Community. This includes Community Watchlists, profiles, publishing, edits and following. Stopping an existing follow remains available. A plan does not grant community administration, Discord roles, editing rights over another member's watchlist or access to someone else's Journal." }),
          Object.freeze({ kind: "paragraph", text: "If Coaching membership requirements are enabled, the student needs Coaching access for new coaching work and delivery. The coach does not need to purchase the student's plan. Access expiry pauses new work without deleting saved history or restoring revoked Journal-sharing permission." }),
          Object.freeze({ kind: "paragraph", text: "Academy can be available independently of dashboard access. Lessons remain public unless the owner enables Academy membership requirements. When enabled, an eligible plan is required to read lessons and change completion progress. Expiry does not delete saved completions. Sign in with Discord to save progress; joining a server is not required for website Academy access." }),
          Object.freeze({ kind: "paragraph", text: "When Journal membership requirements are enabled, Calendar, the trade trackers, Open Positions, Candle Review, Trading Rules and Rule Results require Journal access. Notes, tags, daily rule reviews, rule changes and Rule ideas follow the same Journal setting. Changing a plan does not delete your trades, rules or previously saved offline views. Manual trade entry is part of Journal. Statement imports and broker connections follow their configured plan options. Starting Moomoo history or latest imports follows the import permission and requires an allowed broker connection; existing import status and connection management are not removed when import access ends." }),
          Object.freeze({ kind: "paragraph", text: "If AI Chat access expires, confirming a pending AI-suggested change requires renewed access when enforcement is enabled. Saved drafts remain readable and can be dismissed. Retrying an already completed change does not apply it again." }),
          Object.freeze({ kind: "paragraph", text: "The live Watchlist uses your signed-in account and the owner's Watchlist membership setting. A website plan with Watchlist access does not also require a dashboard plan or Discord server membership. Server Community Watchlists keep their separate server and role permissions." }),
          Object.freeze({ kind: "paragraph", text: "Recurring owner access shows its chosen interval in Plan & billing. It continues until its end date or owner revocation and does not charge a payment. A paid subscription's renewal and charges are separate." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "getting-started",
    title: "Get paid access",
    description: "Choose a TraderLink plan, review its access options and use its configured checkout.",
    sections: Object.freeze([
      Object.freeze({
        id: "what-paid-plan-is",
        title: "What the paid plan is",
        summary: "Use the access included in the plans confirmed for your account.",
        keywords: Object.freeze(["paid plan", "subscription", "features", "AI Reviews", "Whop"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "TraderLink plans can be free, one-time, recurring or lifetime and may include a trial. The plan card lists included features and allowances. Separate active memberships can coexist; a plan never grants access to another person's private data." }),
          Object.freeze({ kind: "callout", title: "Current plan terms", text: "Use the public Plans page or the owner's private invitation for current prices, access options and trials. Review the payment provider's terms before confirming checkout." }),
        ]),
      }),
      Object.freeze({
        id: "subscribe",
        title: "Choose a plan",
        summary: "Complete enrollment using the access option shown on the plan.",
        keywords: Object.freeze(["checkout", "subscribe", "purchase", "payment", "Whop plan"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Plans", text: "Use Plans or a private invitation supplied by the owner. Sign in to the account that should receive access." }),
            Object.freeze({ title: "2. Review the access option", text: "Confirm its price, billing period, duration, features, allowances and trial terms." }),
            Object.freeze({ title: "3. Enroll", text: "Free enrollment may be immediate. Paid options use the configured provider, such as Stripe or Whop. Do not share card details with the owner." }),
            Object.freeze({ title: "4. Check access", text: "Open Account, then Plan & billing. Paid access requires verified confirmation; returning from checkout alone is not proof of payment." }),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "connect-whop",
        title: "Connect your Whop account",
        summary: "For the existing linked-Whop flow, use the account that owns the subscription.",
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
