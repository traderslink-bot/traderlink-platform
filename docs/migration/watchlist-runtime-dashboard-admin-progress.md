# Watchlist Runtime Dashboard Admin Progress

**Status:** In progress

**Controlling plan:** [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md)

**Usage-panel record:** [Watchlist Usage Admin Progress](watchlist-usage-admin-progress.md)

## Completed

- [x] Confirmed the existing Watchlist runtime has the required status,
  provider, AI Read, live-website and deterministic Day Trade Adapter endpoints.
- [x] Keep the member-facing Watchlist route family separate from the
  owner-only runtime Admin document and relay.
- [x] Confirmed the existing two-owner stable Discord-subject access predicate
  is the correct authorization boundary.

## In progress

- [x] Reject the partial React control recreation after owner review found that
  it omitted most runtime controls.
- [x] Replace that recreation with a server-fetched copy of the runtime-owned
  Manual Watchlist document inside the existing Dashboard page.
- [x] Add owner-authorized document routes and an exact-path API relay for the
  complete Manual Watchlist, AI Clean Read and Trade Plan Review controls.
- [x] Verify source-document section, control and request-path parity: 34
  representative control/section checks and all 35 API paths across Manual
  Watchlist, AI Clean Read and Trade Plan Review are present with zero misses.
- [x] Reject the hosted preview's broad content-matching navigation after it
  moved the full AI Read section into the persistent summary.
- [x] Correct the relay navigation from the observed runtime DOM: move only
  the two AI grid IDs to the summary, retain all AI controls and consoles in AI
  Controls, hide only the direct `Skipped` audit card after refresh, and use
  direct section headings/provider controls for each approved section.
- [x] Allow the exact runtime-owned
  `POST /api/runtime/same-day-candle-provider` path so the Yahoo/Moomoo selector can
  operate through the existing owner-authenticated Dashboard relay without
  opening any additional runtime path.
- [x] Correct the hosted section grouping so the runtime-owned Same-Day Candle
  Provider control moves into Market Data beside Historical Candle Provider
  and Live Price Provider.
- [x] Record the 2026-08-26 runtime correction slice for staging review: the
  runtime-owned document now exposes immediate AI model state, factual
  market-data/Moomoo/fallback health, failed-generation attempts, cached live
  five-minute volume confirmation, new-date activation eligibility, and
  Finnhub Company Details resilience. The existing document relay requires no
  Platform application-code change.
- [x] Apply the current owner-iteration display corrections in the member
  Watchlist without changing its data contract: remove the repeated
  non-actionable five-minute note outside mapped decision states, hide
  `Analysis pending` in both list and detail contexts, show the exact rejected
  AI-analysis note, and render the catalyst section only for a confirmed
  source-backed catalyst.
- [x] Remove the archived-ticker entry point from the live Watchlist, replace
  the experimental-data disclaimer with the owner-approved code/algorithm/AI
  and chart-history explanation, and label the Potential Path header `Support
  and Resistance`.
- [x] Render a session Watchlist section only when it contains a ticker; the
  live page no longer displays zero-count Top Regular, Main Session, or
  Post-Market headings and empty-state copy.
- [x] Keep factual Watchlist market-data and Moomoo connection cards at the
  top of the Admin document. AI Read Operations remains in the AI Controls
  view, where its existing ticker selection exposes expandable prior-operation
  history.
- [x] Define the separate Platform-owned owner usage-panel scope for review:
  client-confirmed active Watchlist index/detail page-view events only, New
  York daily distinct visitors, factual visit totals, and display-name-only
  owner rows. Runtime, provider and AI data remain excluded.
- [ ] Obtain owner approval of the proposed usage-panel layout, ordering and
  page-view de-duplication semantics before application or migration work.
- [ ] Complete the paired runtime source corrections for canonical
  TradersLink article precedence, the AI Operations default filter, and a
  wider evidence-backed initial outer target when the supplied daily history
  supports one.
- [ ] Configure the hosted runtime connection and verify the complete page
  without a browser-side fetch failure before release acceptance.

## Release boundary

The existing runtime remains the sole publisher. Its URL and token must be
configured server-side in the relevant Railway environment and must never be
committed or exposed to the browser. No duplicate publisher or data migration
is allowed.

The Watchlist correction scope remains in active owner iteration. This record
does not request a release, deployment, restart, provider call, or hosted
configuration change.
