# Watchlist Runtime Dashboard Admin Progress

**Status:** In progress

**Controlling plan:** [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md)

## Completed

- [x] Confirmed the existing Watchlist runtime has the required status,
  provider, AI Read, live-website and deterministic Day Trade Adapter endpoints.
- [x] Confirmed the member-facing Watchlist route family is out of scope.
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
- [ ] Configure the hosted runtime connection and verify the complete page
  without a browser-side fetch failure before release acceptance.

## Release boundary

The existing runtime remains the sole publisher. Its URL and token must be
configured server-side in the relevant Railway environment and must never be
committed or exposed to the browser. No duplicate publisher or data migration
is allowed.
