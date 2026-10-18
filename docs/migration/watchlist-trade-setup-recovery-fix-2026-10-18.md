# Watchlist Setup Recovery Fix and Final QA

Date: 2026-10-18

Revision 9 corrects the stuck recovery flag reproduced in the [previous recovery QA](watchlist-trade-setup-recovery-qa-2026-10-17.md). Local source and offline checks pass. Deployment, current-main integration, native live capacity and browser visual acceptance remain separate.

## Corrections

- The coordinator owns recovery state across the entire attempt, including its first eligibility check, serialized admission checks and response processing. A `finally` block releases only that attempt's captured recovery owner on every exit.
- An eligibility or admission exception before HTTP dispatch no longer records a nonexistent finished transport, consumes another provider attempt or extends provider backoff.
- Existing publication eligibility checks, spacing, cooldown, request coalescing and owner approval behavior are preserved. Detector logic, card markup, admin controls and notification behavior did not change.

## Verification

The actual coordinator and admission classes ran with virtual clocks, in-memory persistence and HTTP doubles. Network access is disabled in the recovery harness. Eight cases cover synchronous exceptions and rejected promises at the four eligibility checkpoints. Each is followed by a successful valid request without restarting the service. A concurrent recovery test confirms a second request cannot release the active owner's flag or launch another recovery probe.

Fresh receipts, with earlier evidence preserved:

- Recovery: `data/watchlist-setup-validation/recovery-qa-1792299218184-fd848bf2/results.json`. Eight exception cases recovered; one concurrent recovery execution; zero network calls.
- Spacing/cooldown: `data/watchlist-setup-validation/concurrency-qa-1792299116782-0c6cbce5/results.json`. Starts are 750 ms apart; delayed persistence remains spaced; cooldown and cancellation before launch prevent dispatch; storage failure after launch does not duplicate execution. Identical normalized concurrent requests share one execution and its transport IDs.
- Recorded setup engine: `data/watchlist-setup-validation/1792299139499-c0530040/results.json`. All nine recorded tickers and all four initial setup families pass 1,111 assertions.

The standard checks were rerun: 1,111 recorded-engine assertions, 27 shared-runtime/feed checks, 23 actual-component harness checks, 44 route/config/storage checks and 268 existing Indicator regressions, totaling 1,473. Recovery and spacing fault cases are additional. Focused TypeScript over the coordinator, admission, setup verifier and two setup components reports zero target and imported-graph diagnostics.

No duplicate provider execution was observed in these offline scenarios. The component harness checks actual TSX through deterministic React/browser/MUI doubles; it does not establish real browser layout or portal behavior. The request budget applies to the shared hosted Watchlist path, not every consumer of the Moomoo account.

## Unchanged boundaries

The feature remains disabled and undeployed. No live provider request, application settings/data change, notification, service restart, commit or push occurred. Test receipts use isolated or in-memory data. No local application build was run. Help guides for Trade Setups and Setup Detection were reviewed; this internal cleanup does not change their instructions. The other three setup families remain deferred in the [plan](watchlist-trade-setup-detection-plan.md).

## Final independent recheck

The subsequent owner-requested final QA found no new actionable issue. All four setups (VWAP reclaim and hold, EMA9 pullback and bounce, EMA20 pullback and bounce, and higher low reversal), the shared feed, member card and admin controls passed the same 1,473 assertions again. Focused TypeScript and scoped whitespace checks also passed. No application source was changed during this recheck.

Fresh additional receipts preserve the earlier runs:

- `data/watchlist-setup-validation/recovery-qa-1792334585179-c634220e/results.json`: all eight eligibility exceptions recover; concurrent recovery remains one execution.
- `data/watchlist-setup-validation/concurrency-qa-1792334585926-b158b0d0/results.json`: actual starts remain 750 ms apart, slow persistence gives 1,050 ms spacing, known cooldown and late cancellation prevent dispatch, and shared identical requests execute once. A persistence error after launch still executes once.
- `data/watchlist-setup-validation/1792334618051-d0cd8c8d/results.json`: 1,111 engine assertions across nine recorded tickers, with all four setup families represented by recorded confirmations.
- `data/watchlist-setup-validation/final-qa-1792334676452-d49acac6/results.json`: stale-5m fault checks preserve normal incomplete intervals and independent higher-low results; unknown-ledger/storage recovery remains setup-only while genuine provider cooldowns apply to existing Indicators too.

Source review confirms the detector consumes accepted calculation evidence, member reads remain cache-only, publisher and setup scheduling converge on the shared refresh, and notifications remain disabled. The 27 runtime, 23 component, 44 route/storage and 268 existing Indicator checks passed in this recheck. Help remains aligned; no wording change is needed. No live request or notification was sent, and no release action was taken. This does not establish native live capacity, actual browser appearance, or behavior of unrelated consumers outside the shared Watchlist coordinator.
