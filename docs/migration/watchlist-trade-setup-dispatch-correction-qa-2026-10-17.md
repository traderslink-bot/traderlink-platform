# Watchlist Shared Dispatch Correction and QA

Date: 2026-10-17

The admission/dispatch race from [followup QA](watchlist-trade-setup-followup-qa-2026-10-17.md) is corrected in local source. Its spacing and cooldown reproductions now pass as regressions, including additional slow-storage and cancellation cases. The four detectors, shared feed, member card and admin controls pass focused offline QA. No deployment, live provider request, notification, application settings/data change or service restart occurred.

Plan: [Trade Setup Detection](watchlist-trade-setup-detection-plan.md). Progress: [current implementation boundary](watchlist-trade-setup-detection-progress.md).

## Correction

The shared coordinator now uses the admission gate's serialized `dispatch` operation rather than reserving admission and awaiting eligibility outside it. Asynchronous current-publication checks are completed/rechecked around queue and persistence waits. Final cooldown and actual-start accounting are followed immediately by synchronous transport invocation, with no intervening await. The network response promise is returned as a value, so the gate does not wait for the full HTTP request before admitting another eligible transport.

A received 429 publishes its cooldown in memory immediately, even while another dispatch owns the persistence queue. The durable update follows through that queue. Final dispatch checks therefore see newly received cooldowns. Actual launch timestamps are persisted; a persistence failure after launch remains an audit failure and cannot turn the launched operation into a new request or extra retry.

Cancellation after queue/persistence waits returns permission failure with no transport ID or HTTP request, and restores the unused reservation. Existing Indicator versus setup-only recovery behavior, request-key coalescing, two-transport concurrency, page/retry ownership and provider timeout remain in place. No owner publication control or detector rule changed.

Changed application modules are only `src/lib/live-watchlist/setups/setup-admission.ts` and `src/lib/live-watchlist/indicators/indicator-request-coordinator.ts`. This is an incremental correction on top of this worktree's earlier feature work, not permission to replace whole older files on current main. Narrow regression-harness and documentation changes accompany them.

## Dispatch regression results

The actual gate and coordinator run with a virtual clock, in-memory persistence and HTTP doubles. No provider was contacted.

| Case | Result |
| --- | --- |
| Original slow-eligibility race | Actual starts 100,000 and 100,750 ms: 750 ms apart, matching recorded starts. |
| Cooldown received while another preflight waits | Waiting request deferred; zero dispatches before retry deadline. |
| Slow persistence | Actual starts remained 1,050 ms apart, not compressed by earlier reservation times. |
| Cooldown arriving during reservation persistence | Zero dispatches. |
| Late current-publication cancellation | Zero dispatches and no consumed actual-start entry. |
| Actual-start persistence fails after launch | One execution; successful transport result preserved; storage failure visible. |
| 429 response arrives during actual-start persistence | The following different-scope request deferred; only the rate-limited request executed. |
| Identical normalized request from two consumers | One execution and identical transport IDs. |

Receipt: `data/watchlist-setup-validation/concurrency-qa-1792294597264-564dd7a5/results.json`. Run `node --experimental-transform-types src/scripts/qa-watchlist-setup-concurrency.mjs`. The script now asserts correct behavior rather than asserting the old fault reproduction. Earlier failing receipts remain unchanged.

## Whole slice QA

- **Four setups:** 1,111 assertions across nine recorded tickers pass. VWAP uses its named covered anchor and a later hold; EMA9/EMA20 preserve 5m context with later 1m confirmation; higher-low keeps causal 1m structure. Normal detector counts remain unchanged. Recorded replay: `data/watchlist-setup-validation/1792294550046-b5b2a652/results.json`.
- **Earlier fixes:** stale completed-5m input cannot confirm new EMA setups; normal unfinished intervals and independent higher-low events remain intact. Existing Indicator cold-start/storage recovery and real cooldown checks pass. Receipt: `data/watchlist-setup-validation/final-qa-1792294626062-6ba88189/results.json`.
- **Shared feed:** 27 actual-wrapper checks pass for publisher/setup coalescing, unchanged-window cache reuse, additional frame demand, publication identity and setup-only classification. The admission test double was aligned with the new dispatch contract.
- **Existing Indicators:** all 268 refresh, session/calendar, correction-cache, history-adapter and actual publisher-route assertions pass. No duplicate Moomoo request was observed in the tested shared paths.
- **Card/admin:** 23 actual-component checks and 44 actual-route/parser/virtual-store checks pass for four readings, stale/missing data, tooltip handlers, hidden-tab behavior, cleanup, settings saves, current-publication overrides, owner/member/Premium access, file/byte rotation and control reserves. Component checks use deterministic hook/browser/MUI doubles; they do not establish browser paint/layout or actual MUI portal behavior.
- **Focused TypeScript:** zero diagnostics in the changed gate/coordinator, recorded verification script and member/admin component roots, with zero diagnostics in that selected import graph. This smaller graph does not establish that previously reported migration imports elsewhere were repaired; no whole-app check/build was run.

The standard counted suites remain 1,473 assertions, plus the separate concurrency and earlier-fix fault checks. No ticker-specific branch, target or setup threshold was added. React source review found no necessary component change. Help already describes the shared feed and independent controls; an internal dispatch correction requires no Help wording update.

## Acceptance boundary

No additional blocking finding was identified in this focused pass. Analysis generation/approval, publication time/price, gains, notes, levels and Discord/email/push delivery code were not modified. Setup availability does not gate the owner's existing controls. Test transport failures/cooldowns were synthetic; these results do not demonstrate live provider latency, native-feed parity, real account authentication or full hosted Watchlist behavior.

Detection remains disabled and undeployed. Live capacity and browser/owner visual acceptance remain separate. The limiter/deduplication scope remains the shared hosted Watchlist path, not every Analyzer, scanner, OAuth or external process. The three deferred setup families remain in the plan.
