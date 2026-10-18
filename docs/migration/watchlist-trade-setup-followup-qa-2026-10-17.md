# Watchlist Setup Followup QA

Date: 2026-10-17

Result: **one remaining release-blocking finding** in shared Moomoo request dispatch. The prior three fixes still pass their regression checks. No detector, card, admin, settings, runtime or delivery source was changed during this QA. Only an offline probe and documentation were added. No live provider request, notification, app storage mutation, restart, commit, push or deployment occurred.

Plan: [Trade Setup Detection](watchlist-trade-setup-detection-plan.md). Previous corrections: [correction QA](watchlist-trade-setup-corrections-qa-2026-10-17.md).

## P1 Admission happens before an asynchronous eligibility check

`src/lib/live-watchlist/indicators/indicator-request-coordinator.ts:127–145` obtains admission and records the gate's start before awaiting `request.isCurrent()`. That check reads current publication/settings state asynchronously. Actual transport begins later. Another request can obtain admission, execute and even establish a provider cooldown before the first eligibility check finishes. The first request does not reacquire admission or recheck that new cooldown before dispatch.

The actual coordinator and actual admission class were composed with a virtual clock and in-memory HTTP/persistence doubles:

| Observation | Recorded result |
| --- | --- |
| Gate reservation times | 100,000 ms and 100,750 ms |
| Actual transport start order | B at 100,750 ms, A at 100,800 ms |
| Actual spacing | 50 ms instead of the intended 750 ms |
| Separate cooldown case | B returned a simulated 429 with retry deadline 230,750 ms; A still executed at 200,800 ms |
| Same normalized request shared by two consumers | One execution; both received the same transport ID |

This is one admission/dispatch ordering defect with two consequences, not duplicate fetching or evidence of an actual production rate limit. It affects the shared Indicator/setup coordinator, so existing Indicators cannot yet be called unaffected under concurrent slow eligibility checks.

Correction needed: couple final admission, cooldown/start accounting and the synchronous transport start. Complete asynchronous eligibility work before committing that start; preserve a final current-demand check without introducing an unbounded await after the admission reservation. A new cooldown received while waiting must defer the request. Preserve removal/activation protection, existing Indicator startup behavior, one shared transport per compatible request, and one retry owner. Do not replace this with another independent fetcher or an owner publication restriction.

Probe: `src/scripts/qa-watchlist-setup-concurrency.mjs`, run with `node --experimental-transform-types`. Its assertions deliberately verify the reproduced fault and deduplication control; an exit code of zero means the reproduction completed, not that admission is correct. Network is forbidden.

Receipt: `data/watchlist-setup-validation/concurrency-qa-1792293897406-767bc20b/results.json`. Earlier receipts remain unchanged.

## Four setups and existing behavior checks

- **VWAP reclaim/hold:** named-anchor weighted volume and chronological reclaim/later hold still pass. Missing full anchor coverage remains unavailable rather than fabricated.
- **EMA9 and EMA20:** normal 5m/1m sequences retain their recorded results. The independent stale-5m fault suite still verifies that missing completed 5m context cannot confirm a new EMA setup, while a normally unfinished 5m interval remains usable.
- **Higher low:** causal pivot/trigger sequences remain unchanged and independent of 5m availability.
- **Shared feed:** 27 actual-wrapper checks pass for concurrent publisher/setup request reuse, unchanged-window cache reuse, incremental frame demand, current publication identity and setup-only versus existing Indicator classification. The new dispatch fault is outside those earlier scenarios.
- **Member card/admin:** React source review and 23 actual-component checks pass for four readings, missing/stale state, tooltip handlers, hidden-tab suppression, cleanup, per-publication controls and save behavior. Actual route/storage checks pass 44 assertions, including member/Premium/owner access and file/byte retention recovery.
- **Existing Indicators:** 268 offline refresh, calendar/session, correction-cache, history-adapter and publisher-refresh-route assertions pass. They do not negate the dispatch race.

The unchanged standard suites total 1,473 assertions, including the 1,111 recorded-engine checks across nine tickers. Latest normal replay: `data/watchlist-setup-validation/1792293873176-95ce9eb3/results.json`. No new ticker-specific interpretation rule or price was introduced.

Previous-fix fault receipt: `data/watchlist-setup-validation/final-qa-1792293943519-4bb83bc7/results.json`; stale-frame, normal partial-interval, independent higher-low and ledger recovery checks remain passing.

No change was made to analysis generation/approval, editing, publication prices/times, gain controls, notes, levels or Discord/email/push delivery. No member/admin read acquired provider data in the tests. Current source has no setup-readiness dependency that blocks the owner's publication controls. These checks are scoped offline evidence, not an exhaustive hosted acceptance of every Watchlist feature.

## Limits and next boundary

No browser layout/paint, hosted authentication, live native Moomoo timing/capacity or delivery verification was performed. MUI/browser APIs in component checks are doubles. TypeScript was not rerun in this pass because no application TypeScript changed; the previous zero-target-diagnostic result and 24 unrelated migration-import diagnostics remain historical evidence, not a new full-app pass. Help needs no change for this QA-only finding.

Keep detection disabled and undeployed. Correct the dispatch race, then rerun the concurrency probe as a passing regression plus the shared-feed and existing Indicator suites. Other three setup families remain deferred. No coordinator contact is needed for this coding/QA boundary.
