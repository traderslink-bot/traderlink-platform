# Watchlist Setup Recovery QA

Date: 2026-10-17

Result: **one remaining recovery error-path finding**. The spacing/cooldown correction still passes its concurrency regressions, and the four-setup, shared-feed, card/admin and existing Indicator suites pass 1,473 standard assertions. No application source, live data/settings, service or notification was changed during this QA. An offline reproduction harness and these documentation updates are the only new work.

Plan: [Trade Setup Detection](watchlist-trade-setup-detection-plan.md). Previous result: [dispatch correction QA](watchlist-trade-setup-dispatch-correction-qa-2026-10-17.md).

## P2 Eligibility failure leaves rate limit recovery locked

In `src/lib/live-watchlist/indicators/indicator-request-coordinator.ts`, `perform()` sets a recovering scope's `probing` flag before awaiting its first `request.isCurrent()` check. That await is outside the later `try/finally` which clears the flag. If the current-publication/settings read throws, the request rejects without clearing `probing`. Later valid requests for that same provider scope return `recovery_probe` repeatedly, even after the returned retry deadline has passed.

This can keep the shared Moomoo Indicator/setup feed deferred after a transient storage/read problem during rate-limit recovery. It does not prevent owner analysis approval or publishing and is not a duplicate-request issue. It was reproduced offline, not observed as a live incident.

The actual coordinator was exercised with a virtual clock, simulated 429 and throwing eligibility callback:

1. Simulated request at 100,000 ms returns 429 with a 1,000 ms cooldown.
2. At 102,000 ms, the first recovery attempt throws during its eligibility read.
3. A subsequent valid request is deferred as `recovery_probe` until 222,000 ms.
4. At 222,001 ms, another valid request is still deferred, now until 342,001 ms. Only the initial simulated HTTP execution occurred.

Correction needed: guarantee cleanup of recovery ownership across **every** eligibility, admission and transport exit, including thrown/rejected preflight reads. Keep the actual cooldown intact, allow only one legitimate recovery probe at a time, preserve late removal checks and avoid a provider start or fictitious transport ID when eligibility cannot be established. Add regression cases for eligibility exceptions before dispatch and during gate rechecks, then confirm valid recovery resumes without restarting the service. Do not turn this into an owner publication restriction.

Probe: `src/scripts/qa-watchlist-setup-recovery.mjs`, run with `node --experimental-transform-types`. It intentionally asserts the reproduced fault; a successful exit is a reproduction receipt, not a fix pass. Network access is forbidden by the script.

Receipt: `data/watchlist-setup-validation/recovery-qa-1792294894678-275d17dd/results.json`.

## Passing checks

| Scope | Result |
| --- | --- |
| VWAP reclaim/hold, EMA9 bounce, EMA20 bounce, higher-low reversal | 1,111 recorded assertions across nine tickers; normal results unchanged. |
| Shared refresh/feed | 27 actual-wrapper checks, including concurrent publisher/setup reuse, cache reuse, frame demand and publication identity. |
| Card/admin | 23 actual-component checks plus 44 route/parser/virtual-store checks. Four readings, stale/missing states, tooltip handlers, hidden-tab behavior, cleanup, settings, access and retention recovery pass. |
| Existing Indicators | 268 assertions for refresh, calendar/sessions, correction cache, history adapter and actual publisher refresh route. |
| Spacing/cooldown correction | Actual starts remain 750 ms apart (1,050 ms under slow persistence). Waiting requests do not start during new cooldowns. Late cancellation sends nothing; post-launch persistence failure does not duplicate a request. |
| Identical normalized request from two consumers | One execution and the same transport IDs. |

Current passing replay: `data/watchlist-setup-validation/1792294895243-b4266c73/results.json`.

Current passing dispatch receipt: `data/watchlist-setup-validation/concurrency-qa-1792294863063-fcce0022/results.json`.

No new detector rule or ticker-specific handling was added. The React checklist and component tests found no additional card/admin defect; source remains unchanged. Help still describes the intended shared-feed behavior, and this QA-only result requires no Help edit. No build or new TypeScript check was run because application TypeScript was not changed; earlier typecheck receipts remain historical.

## Release boundary

The recovery cleanup finding remains outstanding. Keep setup detection disabled and undeployed until corrected and regression-checked. No duplicate Moomoo request occurred in the tested scenarios, but this is scoped offline evidence, not a guarantee about every caller/process. Live native-data capacity, actual authentication and browser visual/portal behavior remain unverified. The three later setup families remain deferred.
