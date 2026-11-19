# Unified Press Releases — proposed plan

Status: owner-approved design; implementation and QA underway. Production deployment remains on hold. Prior outbound-link correction and its 14-file preservation checkpoint remain intact.

## Outcome and routes

One `Press Releases` navigation item under existing `Market News`, opening `/press-releases`. Remove separate News Scanner and market-cap page links and replace those pages with redirects to the unified page, preserving a valid `article` deep link. Do not map old market-cap URLs into premium filter settings for free users. Do not remove The Week Ahead or General Market News: these are separate products/data sources.

Combine the existing canonical press-release routes in the all feed, deduplicated by article identity. Retain published data, collector routing tags, source URLs, read receipts and existing notification subscriptions. This task changes browsing, not notification targeting; push links must resolve into the unified page without breaking existing subscribers. No record replay, historical mutation or duplicate ingestion.

## Proposed interface

Keep the existing compact feed columns and article drawer. Page title `Press Releases`, no generic subtitle. Top controls: `Manage alerts`, `Mark all read`. When future membership enforcement is enabled, the free feed uses fixed `Newest first`; no search, All/Unread toggle, cap controls or sort dropdown. Until the owner enables restriction, all existing readers have the approved controls. Existing source actually has search and All/Unread controls: their removal for free users is deliberate and requires design approval.

Premium toolbar: `Search ticker or headline`, `Filters`, `Sort`. Filters opens a compact responsive panel: desktop popover/side panel, mobile full-width drawer. Controls have explicit labels and `Apply filters`, `Reset`, `Cancel`; cancel preserves the applied view. Active removable chips and a single `Clear all` action appear above the list. Empty results explain how to reset. Retain focus/scroll when applying, opening/closing an article and receiving new articles. Do not move the selected row during reading.

Recommended first release:

| Filter | Choices / behavior |
| --- | --- |
| Market cap | Minimum and maximum in USD millions; shortcuts Under $30M, $30M–$50M, $50M–$100M, $100M–$300M, $300M–$500M, $500M+; include an explicit Unknown option. These are UI choices, never inferred from channel tags. |
| Ticker | One or multiple exact tickers; separate headline keyword search. |
| Published date | Today, last 7 days, last 30 days, custom From/To; clear Eastern-time boundaries. |
| News type | Press releases and actual recorded types such as earnings, financing, SEC filings. No invented classifications from headline prose. |
| Read state | All, unread, read. |
| Summary | Any, summary available, summary unavailable. |

Sort choices: `Newest first` (default), `Oldest first`, `Market cap: low to high`, `Market cap: high to low`, `Ticker: A–Z`. Every order has deterministic time/ID ties. Unknown market cap stays last in both cap orders.

Remember the user's last applied view on this browser, scoped to the stable authenticated user; provide Reset. On another user's login, membership loss or incompatible stored settings, restore the appropriate safe default. Cross-device named saved views are deferred to avoid promising new storage/migrations before design approval.

## Query correctness and data coverage

The existing page loads only 150 newest articles and filters them locally. Do not implement premium filtering over that subset. Query the authorized eligible feed first with validated filters, deterministic ordering and bounded pagination. Preserve identity/account boundaries, plan visibility delays and article/read permissions for every request. Apply the same rules to page loads, deep links and any API/action, not just UI visibility.

Market cap currently arrives as display metadata, not a guaranteed indexed numeric column. Audit actual stored formats/units and precision before designing comparisons. Parse only supported unambiguous values; unknown/malformed data stays unknown. Never estimate cap from route tags or compare values lexicographically. Inspect query plans/load budgets before enabling historical range or cap sorting; report any index/schema requirement rather than hiding it inside the UI change. Date windows cannot bypass delayed visibility.

## Membership contract and ownership

Proposed boolean capability `news.filters_sorting`, owner-facing label `Press release filters and sorting`, under existing `Stock Press Releases` product. Basic reading and filter/sort permission are separate. When its policy is enforced, the server falls back to the free fixed feed for missing entitlement. A plan name, client flag or URL cannot grant access. The owner explicitly keeps the existing default-off policy now, so controls remain open until restriction is deliberately enabled.

Prepare a narrow feature-owned reader/gating contract, premium/free fixtures and tests. Coordinate read-only ownership/interface discovery through the Coordinator now; do NOT start Membership implementation yet. After news implementation and its QA pass, contact the identified VPS Membership task with the exact capability, UI label, denial behavior, dependencies, plan-editor requirements and tests. Membership task then registers the feature in plan options and handles any subscription/catalog migration. Do not edit shared subscription authoring, prices, billing, production plans or grants here. Integrated membership QA is a final requirement before release.

Preserve existing notification categories/delivery settings unless the owner explicitly expands this scope. Clarify in membership help copy that browsing filters do not automatically change notifications.

## Work sequence and QA

1. Owner approves exact layout, labels and recommended first-release options. Coordinator confirms workspace/shared-file ownership and identifies Membership task.
2. Audit actual cap metadata and query coverage. Finalize validated filter/sort/pagination contracts and entitlement boundary, including free baseline access.
3. Implement one coherent news batch: unified navigation/routes, premium controls, server query, per-user browser preferences, stable drawer/deep links, Help Center updates and focused tests. Retain the outbound URL guard.
4. QA free/premium/expired permission, forged URL/API requests, all filter combinations/reset/cancel/preferences, pagination/ties, missing cap, date boundaries, delay/read isolation, duplicate channel records, old links/push deep links, drawer/read/focus/scroll, Light/Navy Dark and desktop/mobile. Verify actual component/runtime behavior in a coordinated safe lane; source tests alone are insufficient.
5. Send completed news contract and QA evidence to VPS Membership task. Its integration then receives a joint feature/plan-editor/entitlement QA pass.
6. Only after owner deployment hold clears and all applicable QA passes, hand off exact source allowlist and release evidence to Coordinator. If any migration is required, owner gate is after 20:00 America/Toronto on November 18, 2026. Do not claim migration-free until the query/catalog implementation is known.

No production/UI/notification changes have been made for this proposal. Old Market Cap work remains preserved; this plan supersedes its page/navigation direction only after approval.

## Owner approval and clarification

Owner approved this design and implementation on November 18, then explicitly deferred premium enforcement: filters/sorting stay available to existing readers now. Use the existing membership policy mechanism with `news.filters_sorting` default enforcement off, not a new active premium restriction. A later enforced policy denies advanced controls/server predicates to unentitled readers while retaining the basic newest-first feed. Membership plan registration remains a handoff after News QA.

Owner additionally requires no dashboard PR details/sidebar/page action to the public TradersLink news/PR pages. Successful summaries have no external article/source button. Only unavailable-summary records can offer a guarded legitimate publisher action, never NuntioBot. This supersedes the earlier successful-summary public-link rule within dashboard surfaces only; public pages and Discord link contracts retain their existing scope.

Cap limits use inclusive minimum / exclusive upper bound (`Below`) so shortcut bands do not overlap. Known numeric USD `marketCapValue` takes precedence over formatted display metadata; ambiguous unsuffixed display values remain unknown. Query paging freezes ingestion, visibility-delay eligibility and read-state against an `asOf` snapshot to prevent newly arriving articles or newly read rows from shifting later pages.

Implementation and QA: [progress record](press-releases-unified-feed-progress-20261118.md). Subscription handoff: [Membership contract](press-releases-membership-handoff-20261118.md).
