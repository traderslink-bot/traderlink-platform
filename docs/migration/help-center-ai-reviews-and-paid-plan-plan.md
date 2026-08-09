# AI Reviews And Paid Plan Help Guides Plan

Status: owner approved for one continuous implementation run on 2026-08-09

Progress record: [AI Reviews And Paid Plan Help Guides Progress](./help-center-ai-reviews-and-paid-plan-progress.md)

Related records:

- [Help Center And Daily Trade Tracker Guides Plan](./help-center-daily-trade-tracker-plan.md)
- [AI Reviews Beta Handoff](./ai-reviews-beta-handoff.md)
- [AI Reviews Provider Acceptance And Whop Access Plan](./ai-reviews-provider-and-whop-access-plan.md)

## 1. Outcome

Extend the existing authenticated Help Center with two separate collections:

1. **AI Reviews** explains how traders configure, prepare, generate, read and
   troubleshoot weekly, two-week and monthly AI Reviews.
2. **Paid plan and billing** explains the wider TraderLink paid subscription,
   Whop connection, renewal, cancellation, billing management and access
   troubleshooting. It must never imply that the paid plan exists only for AI
   Reviews.

Both collections reuse the approved Help Center layout, navigation, search,
article structure, responsive behavior and plain-language editorial standard.

## 2. Fixed product decisions

- Use the product name **AI Reviews**. Do not expose internal Coach, provider,
  repository, migration, snapshot, entitlement or scheduler terminology.
- Use **Trade Tracker**, not Journal, in user-facing Help copy.
- AI Reviews and paid-plan information are separate Help collections. AI
  Reviews may link to the paid-plan guide when access is unavailable.
- Whop remains the place where the current product, price, trial, renewal and
  billing details are shown. Help must not duplicate values that can change.
- A paid plan can unlock more than AI Reviews. Each paid feature may still have
  its own settings and availability requirements.
- Help examples are generic and contain no real account, broker, payment or
  review data.
- User-facing Help explains observable behavior and next actions. It does not
  explain internal safety limits, model prices or administrator controls.

## 3. Routes and guide inventory

### AI Reviews

| Route | Coverage |
| --- | --- |
| `/help/ai-reviews` | Collection overview and complete workflow |
| `/help/ai-reviews/getting-started` | Requirements, page tour, first review |
| `/help/ai-reviews/choose-schedule` | On/Off, frequency and timing choices |
| `/help/ai-reviews/what-ai-uses` | Executions, notes, tags, rules and analysis |
| `/help/ai-reviews/weekly-two-week` | Trading weeks, short weeks, thin activity and cross-month weeks |
| `/help/ai-reviews/monthly-reviews` | Exact months, partial first month and month boundaries |
| `/help/ai-reviews/read-your-review` | Saved review sections, coverage and follow-through |
| `/help/ai-reviews/availability-troubleshooting` | Statuses, Generate now, delayed work and access links |

### Paid plan and billing

| Route | Coverage |
| --- | --- |
| `/help/paid-plan` | App-wide paid-plan overview |
| `/help/paid-plan/getting-started` | Checkout, sign-in and connecting Whop |
| `/help/paid-plan/manage-subscription` | Renewal, cancellation and billing management |
| `/help/paid-plan/access-troubleshooting` | Missing access, payment issues, reconnecting and preserved data |

Guide slugs, titles, descriptions, keywords, sections and navigation order come
from typed registries. Search indexes both guide summaries and section anchors.

## 4. Required AI Reviews coverage

The guides must explain all accepted user-visible behavior:

- AI Reviews On/Off is per Trade Tracker account; paid access belongs to the
  signed-in TraderLink user.
- Frequency choices are every trading week, every two trading weeks and
  monthly only. Every choice includes monthly reviews.
- Weekly timing choices are **Automatic after 12 hours** and **Give me extra
  time for Trade Tracker reviews**.
- Automatic timing starts 12 hours after post-market ends on the final open
  session of the trading week. A holiday-shortened week is complete even when
  it has fewer than five trading days.
- Extra-time mode can generate sooner when the created daily reviews are
  marked complete or the trader selects **Generate now**. Otherwise it uses
  everything saved by the end of the following trading week.
- Verified execution facts do not require a completed daily review. Every
  non-empty saved note, saved tag and recorded rule result available when
  generation begins may be used. Marking complete affects early timing only.
- AI may receive compact Trade Tracker analysis for supported trades,
  including 1-minute and 5-minute context, market activity, candle patterns,
  favorable/adverse path, Green-to-red behavior and post-exit movement. Raw
  candle histories are not presented as part of the review package.
- A context-free week with only one closed trade may combine once with the
  next trading week. The activity is not discarded. Thin evidence produces a
  narrow review and must not create invented patterns.
- A trading week that crosses a month is not split.
- A monthly review uses exact Eastern calendar-month facts. It does not depend
  on weekly reviews and does not borrow out-of-month statistics. Any weekly
  context is clearly secondary and cannot alter monthly counts.
- The first month after enabling may be a partial month beginning on the
  enabled date. Monthly reviews become available at 8:00 AM Eastern on the
  first calendar day after month end, including weekends and holidays.
- Saved reviews remain available after AI Reviews are turned off or paid
  access ends.
- The guide defines Upcoming, In progress, Scheduled, Ready, Combines with next
  week, Not ready, Pending, Generating, Retrying, AI Reviews are off, Paid
  access unavailable and Platform unavailable.
- Daily review coverage shows created Trade Tracker pages as Marked complete
  or Not marked complete and links to those pages. It does not claim the user
  must trade or complete a review every day.

## 5. Required paid-plan coverage

- The paid plan is a TraderLink subscription, not an AI Reviews-only purchase.
- Whop shows the current plan, included features, price, trial if offered,
  renewal date and payment method.
- The trader connects the same Whop account used for the subscription. The app
  does not ask the user to expose payment details.
- Monthly subscriptions renew on the subscriber's own renewal date, not at
  calendar month end.
- Cancellation at period end keeps paid access through the current paid
  period. The plan does not renew after that date unless renewed.
- A failed payment can be retried by Whop and is not described as an immediate
  permanent loss. If the membership becomes inactive, new paid work pauses.
- Saved TraderLink data and issued AI Reviews remain available when paid access
  ends. Help must not promise access to a paid live tool after the paid period.
- Missing or conflicting access tells the user to verify the Whop account,
  refresh the Account page, use **Manage subscription in Whop** when available,
  and contact support if it still does not match.

## 6. Shared design and accessibility

- Keep the existing light Material dashboard and authenticated Help layout.
- Add one clear collection card for each new collection on `/help`.
- Add distinct Help-navigation icons for Daily Trade Tracker, AI Reviews and
  Paid plan and billing.
- Reuse breadcrumbs, **In this guide** anchors, short sections, tables,
  callouts, previous/next cards and responsive **Browse help** navigation.
- Use one `h1`, logical headings, semantic lists/sections, visible focus,
  `aria-current`, minimum practical touch targets and no horizontal overflow.
- Use product labels exactly and write for an average app user.

## 7. Implementation sequence

1. Generalize the existing Daily Trade Tracker article model and renderer
   without changing its visible content.
2. Add typed AI Reviews and Paid plan and billing content registries.
3. Add both collection overview pages and dynamic article routes.
4. Add both collections to Help navigation, search, popular links and the Help
   start page.
5. Update the original Help plan/progress records so these collections are no
   longer deferred.
6. Run serial, low-resource focused lint, TypeScript and static registry/link
   checks. Do not run Vitest.
7. Start the canonical app only for one bounded final desktop/mobile browser
   review if the shared runtime is free.
8. Present the completed UI to the owner for one final approval, then preserve
   the verified slice in a narrow local commit.

## 8. Acceptance criteria

The slice is complete when both collections, all ten guide routes, section
anchors, search results, navigation, metadata, cross-links and mobile/desktop
presentation are present; the content covers the inventories above without
internal language or invented product promises; focused checks pass; plan and
progress records are current; and the owner approves the final UI.

## 9. Deferred scope

- Publishing current Whop price, trial or a permanent included-feature list in
  Help.
- Public unauthenticated Help, screenshots, video, AI Help search or feedback
  storage.
- Administrator launch controls, provider configuration and internal cost
  safeguards.
- Production deployment, hosted scheduling, live Whop activation or provider
  activation.
