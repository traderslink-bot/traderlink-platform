# Watchlist Trade Setup Detection Second Plan QA

Date: 2026-10-17

Plan: [Revision 2](watchlist-trade-setup-detection-plan.md)

Previous findings: [First full plan QA](watchlist-trade-setup-detection-qa-2026-10-17.md)

Progress: [Setup detection progress](watchlist-trade-setup-detection-progress.md)

## Result

All eight first-round findings are addressed in the controlling plan. A fresh review of all seven setup families found no unresolved blocking document contradictions after the follow-up corrections recorded below. This is a specification review, not a claim that the detectors, numeric settings, feed capacity or notifications have passed implementation testing.

The plan remains ready for the owner's pre-build review, with UI approval and actual feed/replay acceptance retained at the named checkpoints. No feature implementation started.

Reviewed plan SHA-256: `30f2d087b205eb8401aea292787b9d2f34e7e2cf9763156d4d5dba8d2006f432`.

The first QA report is preserved unchanged: SHA-256 `edc013e1af128f601ac607ce6ffb0c5002ef015031ba7014b4aed4639e4f59ff`.

## Closure of the eight findings

| Finding | Plan correction | Second review result |
| --- | --- | --- |
| Q1 Faster feed | Named hosted scheduler; per-frame due times; independent setup demand; two-transport Watchlist budget; current-window priority; bounded backfill; no global provider-limit claim | Closed at plan level. The old whole-refresh throttle is not removed or blindly invoked every minute; existing other consumers remain outside silent refactoring scope. |
| Q2 Sparse coverage | Separate regular/day VWAP anchors; range-completion evidence; no invented quiet-minute rows; authoritative versus observed premarket-high labels | Closed at plan level. Unknown data cannot become zero, an observed high cannot masquerade as the full high, and missing 4 AM history does not block a complete 9:30 anchor. |
| Q3 Price versus volume | Confirmed price sequence plus an independent volume qualifier; named recent/pullback baselines; minimum baseline count; no retrospective volume credit | Closed at plan level. Every family can complete its genuine price sequence without a hard 1.30 volume gate or false claim of volume expansion. |
| Q4 Exact rules | Causal pivots, explicit impulse spans/ties, equal contraction windows, flag/channel/range geometry, bounded wedge fits and per-frame tolerances | Closed at plan level. Finite algorithm definitions replace the most important discretionary phrases. Numeric values remain calibration seeds. |
| Q5 Fast formations | Explicit 1m and 5m flag/wedge variants within the same seven families; actual bar and elapsed-time bounds; true frame labels | Closed at plan level. A 1m trigger no longer disguises a 15-/40-minute minimum as fast detection. |
| Q6 Moving references | Separate immutable structure from as-known EMA/VWAP values; start/end observation snapshots; slope changes; pre-trigger line coefficients | Closed at plan level. A later 5m close cannot be projected back into an earlier minute test, and drifting lines/averages cannot substitute for actual price recovery. |
| Q7 Lifecycle and grouping | Per-detector states; stable same-leg groups; phase-level notification identity; route retargeting rules; complete deadlines/rearm/history rules; bounded arrival grace | Closed at plan level. A green sibling cannot confirm an unfinished one; a moved destination or new fit cannot recreate the same alert or erase a pending failure. |
| Q8 Real acceptance | Real held-out positive/negative floors per family and per fast/slow geometry variant; frozen chart labels; defined missed/false/late/duplicate populations | Closed at plan level. An aggregate ticker count or synthetic fixtures alone cannot establish all-seven acceptance. |

## All seven setup specifications reviewed again

| Setup | Developing and confirming behavior checked | Failure and repeat behavior checked | Status |
| --- | --- | --- | --- |
| VWAP Reclaim and Hold | Real below-anchor phase, upward recovery, reclaim, later hold; same-time anchor and independent volume | Recovery-low failure versus lost reclaim; 15-/5-minute deadlines; new below-anchor phase required | Specification coherent; market validation pending |
| EMA9 Pullback and Bounce | Rising 5m EMA, actual decline/test, response, later local-high trigger; as-known start/end EMA | Original swing reference; pending-loss preservation; slope/context expiry; distinct later leg | Specification coherent; market validation pending |
| EMA20 Pullback and Bounce | Same explicit response sequence using EMA20, not falling-average reclaim; mixed-state EMA9 overlap | Independent constituent states and same-leg notification budget; later separate EMA20 opportunity | Specification coherent; market validation pending |
| Higher Low Reversal | Causal L1/H1/L2 selection, meaningful rebound, H1 trigger; direct response-close confirmation where ordering is provable | L2/parent low distinction, candidate revision, 30-minute deadline and new swing rearm | Specification coherent; market validation pending |
| Premarket High Breakout and Retest | Verified/observed anchor distinction; open-above versus break; later test, response and next trigger | No borrowed EMA requirement; defended-low failure; first-retest/confirmation deadlines; corrected anchors | Specification coherent; market validation pending |
| Bull Flag or Momentum Consolidation Breakout | Real impulse, exact specific/generic geometry, 1m/5m labels, prior-fit breakout and volume qualifier | Projected forming boundary versus fixed post-confirmation low; preserved first breach; duration/rearm | Specification coherent; market validation pending |
| Falling Wedge or Descending Pullback Breakout | Both frames, confirmed pivot contacts, converging slopes, bounded fitting, honest generic branch and actual upward break | Valid lower lows inside the formation do not fail it; lower-envelope breach counter; fixed post-confirmation low | Specification coherent; market validation pending |

## Follow-up inconsistencies corrected during this review

1. **Premarket retest response:** The shared response rule now names the premarket anchor explicitly, rather than accidentally inheriting the EMA bounce's above-EMA condition.
2. **Geometry failures:** A descending flag/wedge uses the prior lower-envelope projection while Forming, not a horizontal low that ordinary lower lows would inevitably cross. A pending first breach freezes the fit/counter so the next revision cannot absorb it.
3. **Sparse coordinates:** Flag regression uses elapsed formation-frame coordinates, not compressed observed-row indices. Missing intervals do not change the meaning of slope per minute/frame.
4. **Deadline receipt timing:** Eligibility uses inclusive candle-completion deadlines with bounded arrival grace. The ordinary five-second provider fetch offset does not automatically invalidate the last eligible candle; much later data cannot revive a stale live alert.
5. **Direct higher-low confirmation:** A response close may also confirm H1 when the required preceding sequence is known. The engine does not impose an unnecessary extra candle or manufacture an earlier Forming alert.
6. **Stable identities and readiness:** A new rolling impulse preference does not create a new episode. Missing 5m grouping evidence does not withhold an otherwise ready 1m geometry detector, and display/gain-time edits cannot change the saved publication identity.

These are document corrections within the authorized findings, not new changes to the existing application.

## Scenario review

The following are desk walkthroughs of the revised specification, not executed tests:

- A real price trigger with unavailable volume completes the price state and includes the unavailable qualifier. It does not claim zero volume, expansion or an earlier entry opportunity.
- A 9:34–9:35 minute range test uses the 5m value available at its start; its closing comparison can use a newly completed/received value at its end. Replay retains both timestamps.
- Four pullback bars use two versus two for contraction, five use two versus two, and six use three versus three. The windows cannot overlap or change after the event.
- A 1m pause is labeled a 1m formation even while showing 5m context. A later 5m version shares alerts only when the same-leg tests are satisfied.
- An intact descending wedge can make a lower low inside its envelope without becoming Failed. Two completed closes beyond the frozen pending failure fit cannot be hidden by widening the fit afterward.
- An EMA20 confirmation does not paint an overlapping higher-low candidate green. Its later sibling confirmation changes the card, not the first group's two-event notification budget.
- A list move before sending retargets one unsent intent; after a send started its destination cannot be silently duplicated. Unknown external outcomes are reconciled, not claimed exactly once.
- A delayed last eligible candle is considered within bounded event freshness; a later candle or restart cannot resurrect an expired opportunity.
- Sparse premarket price data can yield an accurately named observed-high retest while genuinely unavailable VWAP remains unavailable. Independent detectors do not disappear with it.

## Checks and remaining acceptance

Completed: full revised-plan review across all seven families, cross-reference against the first eight findings and inspected source contracts, static formula/boundary walkthroughs, stale-wording searches, document links, whitespace and preservation of the first QA evidence. No application tests, Vitest, builds, scripts exercising detectors, provider/AI calls, live data changes, posts, service restarts, commits, pushes or deployment ran.

The following remain future implementation/acceptance work, not hidden passes from this review:

- Actual provider minute/volume/coverage capability, shared-connection request capacity and measured arrival latency.
- Calculation/state implementation, chronological replay, per-family real held-out chart review and observed false/missed/late results.
- Owner-approved desktop/mobile presentation, VWAP default, audience and optional notification destinations.
- Authorized private delivery checks, proportionate final regression, release coordination and production verification.

No additional paid AI analysis, whole-market scanning, order-book/tape feature or new restriction on owner approval is introduced by these corrections.
