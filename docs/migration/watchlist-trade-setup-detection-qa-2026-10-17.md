# Watchlist Trade Setup Detection Plan QA

Date: 2026-10-17

Reviewed: [Complete seven setup plan](watchlist-trade-setup-detection-plan.md)

Progress: [Setup detection progress](watchlist-trade-setup-detection-progress.md)

## Result

Retain all seven setups, but correct the plan before building it unchanged. Eight findings cover shared data integration, confirmation behavior, precise rules and acceptance. They do not establish that any setup is unworkable or that a proposed numeric threshold is empirically wrong.

This review covers all 464 lines of the plan and checks the relevant local indicator/feed implementation at HEAD `e718689bfef3bcbd2c966567e913dfd0638437db`. It is a document and source review, not a live provider test, replay result or production audit. No detector, prompt, setting, Watchlist data, service or notification changed. The proposed rules in the plan remain unchanged pending the owner's direction.

## Findings

### Q1 Define the faster feed without accelerating unrelated requests

Priority: P1. Applies to all seven setups.

Plan locations: Feed cadence and request budget, lines 124–143; implementation checkpoints, lines 369–374.

The plan correctly identifies the existing two-minute throttle, but does not yet specify the scheduling contract that replaces it for setup demand. In current code, `IndicatorRefreshService.refresh()` returns cached results inside 120 seconds. Its `perform()` iterates 1m, 5m, 15m and Daily, with per-frame caches, history, fallbacks and retries. Calling that same operation every minute will not create the proposed fresh minute feed; removing its throttle alone can also increase other-frame traffic.

The request coordinator is scoped to its instantiated service. The inspected Analyzer provider constructs its own provider path; a two-concurrent Watchlist coordinator is not proof that the whole shared Moomoo connection is globally limited to two requests.

Correction needed:

- Name one hosted scheduler and its startup/restart ownership, independent of member/admin page visits.
- Specify separate due times for 1m setup evidence, 5m structure, slower indicator frames and initialization work; share accepted results rather than duplicate requests.
- Give the new consumer its own bounded queue/demand budget. Do not let a long warm-up or setup backlog starve manual analysis or Analyzer requests.
- Measure actual request totals alongside existing users of the same connection. Do not claim the estimate of one request per ticker per minute as an existing guarantee.
- Include a cold-start sequence that restores saved seeds, obtains a current window promptly and backfills older context within a bounded budget.

Source: `src/lib/live-watchlist/indicators/indicator-refresh-service.ts`, lines 118, 181–224; `indicator-request-coordinator.ts`, lines 93–98; `src/modules/watchlist/server/indicators/indicator-refresh-runtime.ts`, line 35; `src/modules/level-analysis/server/daily-trade-analyzer-runtime.ts`, lines 16–22.

### Q2 Sparse premarket coverage can disable two detectors unnecessarily

Priority: P1. Applies directly to VWAP and Premarket High Breakout and Retest; affects shared data readiness.

Plan locations: VWAP/history, lines 100–122; premarket high, lines 240–250.

The plan requires sufficient premarket coverage without defining how that is established when a stock had no prints in some minutes. The inspected VWAP helper checks every minute from the premarket open and counts absent bars as unknown unless it receives explicit no-trade evidence. Its current caller does not pass that optional evidence. Reusing this check for regular-session VWAP would also incorrectly make missing 4 AM history a prerequisite for a 9:30 AM anchored calculation.

An omitted candle does not prove zero volume, but requiring a physical row for every quiet minute is not a workable alternative. This can leave an active runner without a reclaim or premarket-high setup even when relevant price history exists.

Correction needed:

- Define anchor-specific coverage: regular VWAP starts at the regular open, not the day's premarket open.
- Distinguish provider-established range completion, observed price bars, confirmed no-trade intervals, unknown retrieval gaps and unavailable volume. Do not equate them.
- Identify whether this actual transport supplies an authoritative premarket high or enough complete range evidence to establish one. Preserve its scope and timestamp.
- If only the observed high is supported, allow an accurately named observed-high retest rather than claiming a verified full-session high or suppressing all useful price information. This is a labeling/data-contract correction, not permission to invent missing prices.
- Keep VWAP unavailable when its required volume really cannot be established; independent detectors must continue.

Source: `src/lib/live-watchlist/indicators/indicator-sessions.ts`, lines 104–112; `indicator-refresh-service.ts`, lines 254–258.

### Q3 Separate completed price behavior from the strength of its volume evidence

Priority: P1 design risk. Applies to all seven confirmation paths.

Plan locations: numeric definitions, lines 166–168; state table, lines 179–188; detector confirmations; missing evidence, line 278.

Every detector currently requires expansion, defined as at least 1.30 times the recent minute average, before it can reach Confirmed. The specification can therefore leave an actual price reclaim/bounce/breakout in Forming merely because volume is missing or below that multiplier. During a retest, its baseline can also include an earlier high-volume breakout, making the same rule behave differently from an initial breakout. No replay has yet established that this is the appropriate common threshold.

The original intention includes volume evidence; removing it entirely would not address this issue. The price event and volume qualification should be recorded separately, without describing unavailable volume as weak volume.

Correction needed:

- Define price confirmation and volume evidence as separate fields, with exact member labels for expanded, not expanded and unavailable volume.
- Decide, per setup, which completed price event is announced and which stronger combination merits a volume-confirmed announcement. Keep those labels honest rather than keeping completed events indefinitely Forming.
- Define an appropriate pre-trigger baseline for breakout versus retest, including early-session cases with fewer than three prior bars.
- Replay the proposed 1.30 seed against alternatives before finalizing it. Do not replace it with another untested universal constant.
- Specify whether volume may confirm later, how long that association remains valid, and why that does not trigger a stale notification.

This is a correction to automatic setup classification, not an additional restriction on owner publishing or analysis approval.

### Q4 Several structural formulas still permit materially different implementations

Priority: P2. Applies to momentum context, higher lows, flags, wedges and volume evidence.

Plan locations: causal swings/numeric definitions, lines 147–171; higher low, lines 228–238; flag/wedge, lines 252–274.

Terms such as earlier local high, meaningful decline, slowing, bounded upper boundary and relevant base are not all tied to deterministic selection/tie-breaking rules. Flag geometry lacks a boundary fit and tolerance procedure. The wedge specification calls for residuals/touches within tolerance but leaves the fit, outliers and touch counting unspecified. A developer could implement different prices while appearing to follow the plan.

The contraction formula also leaves window allocation ambiguous at four or five bars. For example, a synthetic sequence of 100, 40, 70 and 60 shares per bar gives 56.7/100 using first one versus last three, but 60/70 using first three versus last one. One passes the proposed 0.80 threshold and the other fails. Both use nonoverlapping windows of up to three bars.

Correction needed:

- Specify causal pivot recognition, equality/tolerance handling, significance, search bounds and deterministic tie-breaking.
- Define impulse endpoints and how a continuing prior-session leg survives or is replaced; handle one-bar surges explicitly instead of leaving the 2–12-bar wording ambiguous.
- Define exact flag boundary fitting, allowed slopes, wick treatment, frozen anchors and breakout-candle exclusion.
- Define wedge fit method, minimum time separation, residual calculation, touch tolerance, outlier policy and finite descending-pullback fallback rules.
- Fix equal-length contraction windows, such as first/last `min(3, floor(n/2))` eligible bars, and name the bar timeframe.
- Assign a single versioned tolerance source to each comparison; distinguish 5m structure tolerance from 1m trigger tolerance.

The example demonstrates ambiguity, not an empirical trading result. No ticker-specific prices or special cases are needed to fix it.

### Q5 The proposed formation lengths can miss the fast setups the feature is intended to find

Priority: P2 calibration and scope decision. Applies mainly to flags and wedges.

Plan locations: timeframe contract, line 149; flag duration, line 254; wedge duration, line 266.

Three completed 5m flag bars require 15 minutes of consolidation data. An eight-bar 5m wedge window contains 40 minutes of data. The one-minute trigger does not make those formations recognizable sooner. These may be suitable longer patterns, but the plan also aims to identify developing opportunities on fast nano-cap runners.

Correction needed:

- Explicitly choose whether short 1m formations are included as separately labeled variants under these same setup families, with 5m context, or whether this first release intentionally covers only longer 5m formations.
- If using 5m-only geometry, state that limitation in the feature/Help and test missed fast patterns rather than claiming broad early coverage.
- If including 1m variants, define their own bar/time bounds and grouping; never relabel a 1m pattern as a 5m pattern.

This finding does not establish that the 5m patterns or their proposed durations are invalid. It identifies a mismatch that must be made deliberate before implementation.

### Q6 Moving averages and fixed structural references need different update rules

Priority: P2. Applies to EMA9, EMA20 and VWAP, with a related wedge boundary issue.

Plan locations: frozen references, lines 161–164; VWAP, lines 202–204; EMA confirmation, lines 214–226; persistence, line 343.

The plan says to freeze candidate reference values, while also testing the current EMA or contemporaneous VWAP. Those are not interchangeable. Freezing the moving average for an entire candidate makes it cease to represent the actual average; recomputing historical tests against the latest average makes past outcomes change. A 1m trigger must not use the final close of a 5m candle that had not completed then.

Correction needed:

- Keep structural swing lows and the selected reversal-high trigger fixed for the episode, subject to a documented new-version transition when structure changes.
- At each 1m observation use the EMA from the latest 5m candle that was completed and received at that moment. Store that value, its timestamp and the frozen volatility scale used for the comparison.
- Evaluate VWAP against its same-time, same-anchor value; keep the recovery swing low separate.
- Define how a newly completed 5m average can change a still-forming candidate, including a slope reversal before confirmation.
- Distinguish a real pullback/recovery from an average or sloping boundary simply moving into stationary price.

[Fidelity's EMA description](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/ema/) establishes that an EMA updates recursively from price; it does not supply this application's missing multi-timeframe observation contract.

### Q7 Finish the lifecycle and overlap rules before implementing alerts

Priority: P2. Applies to all seven; particularly EMA9/20 and higher-low/flag overlap.

Plan locations: identity/states, lines 177–192; expiries across detector sections; member card, lines 294–305; delivery, lines 326–330.

The plan specifies several pre-confirmation timeouts but no complete common lifecycle after confirmation, and no explicit premarket-high retest timeout. It does not define when a confirmed setup has moved too far away to remain a current opportunity. The shared grouping rule also does not define what happens when an EMA20 setup is Confirmed while an overlapping higher-low setup remains Forming.

A changed swing or group membership could otherwise create another event ID for the same leg, or make an unfinished sibling appear confirmed. Session changes and uncertain-data recovery also need a transition precedence rule.

Correction needed:

- Separate the historical event Confirmed from the current opportunity's availability. Preserve the confirmation but stop displaying an already-extended move as a fresh pending setup.
- Complete expiry/rearm rules for every detector, including premarket-high retests, new pullback legs and session transitions.
- Define failed/expired/data-unavailable precedence and finite rules for recovery and clocks after an outage or halt.
- Give each constituent detector its own state within a stable price-leg group. A group's green label cannot confirm its unfinished siblings.
- Deduplicate notifications by stable episode and transition, not mutable display membership or the latest pivot timestamp.
- Explicitly cancel or reroute queued alerts on category/access/enable changes without replaying an event to a new destination merely because its route changed.

### Q8 Acceptance needs real chart coverage for each detector

Priority: P2. Applies to the completed seven-setup feature.

Plan locations: verification/market review, lines 408–436; acceptance, lines 438–450.

The plan includes positive and negative checks for all seven, but its real-market sample count is aggregate. Twenty active ticker-days could contain many EMA tests and no genuine wedge. All seven can pass synthetic formula checks without every detector having real holdout evidence. It also records missed/false/late detections without defining how those results determine readiness.

Correction needed:

- Require real held-out positive and confusable-negative chart examples for every enabled detector, with known event/knowledge times. Synthetic examples remain useful but do not replace those.
- Define the chart-review labeling process, disagreement handling and what counts as one eligible opportunity before seeing detector output.
- Agree practical readiness criteria for timeliness, duplicates, false pattern labels and missed recognizable setups before evaluating the holdout. Do not introduce an arbitrary claimed win rate.
- Report no evidence as unverified, not successful. A detector that lacks its required evidence stays unfinished or disabled with the owner's agreement; do not describe the entire seven-setup goal as accepted.
- Expand deterministic checks to include dynamic EMA timestamps, nonoverlapping contraction windows, simultaneous mixed-state siblings and the different formation-duration paths.

## Coverage of all seven setups

| Setup | Reviewed elements | Relevant findings |
| --- | --- | --- |
| VWAP Reclaim and Hold | Two anchors, recovery, reclaim, later hold, volume, failure and expiry | Q1, Q2, Q3, Q4, Q6, Q7, Q8 |
| EMA9 Pullback and Bounce | Upward context, rising 5m average, actual test, reversal trigger and failure | Q1, Q3, Q4, Q6, Q7, Q8 |
| EMA20 Pullback and Bounce | Later/deeper opportunity, falling-average exclusion, EMA9 overlap and distinct later leg | Q1, Q3, Q4, Q6, Q7, Q8 |
| Higher Low Reversal | Causal L1/H1/L2, separated tests, H1 trigger and L2 failure | Q1, Q3, Q4, Q7, Q8 |
| Premarket High Breakout and Retest | Session coverage, frozen high, breakout then retest order, undercut and failure | Q1, Q2, Q3, Q4, Q7, Q8 |
| Bull Flag or Momentum Consolidation Breakout | Impulse, pause geometry, duration, trigger boundary and failure | Q1, Q3, Q4, Q5, Q7, Q8 |
| Falling Wedge or Descending Pullback Breakout | Multiple causal pivots, convergence, fit, duration, honest fallback label and breakout | Q1, Q3, Q4, Q5, Q6, Q7, Q8 |

## Owner choices rather than defects

The proposed Regular-session versus Day VWAP default, exact new-card placement, setup-card audience and optional member notification destinations remain explicit product choices. They are not evidence that the existing Watchlist is broken. Keep them separate from the engineering findings so another agent does not silently change the existing Indicators VWAP, restrict owner approvals or alter free/Premium access.

The plan's separate deterministic engine, shared candles, no OpenAI requests, no trade execution, no ticker-specific rules, private/Premium protections, audit, phased development and independent rollback remain sensible foundations. Nothing in this QA calls for discarding a setup or restarting the existing analysis project.

## Verification boundary and next step

Completed: full plan read, cross-reference of the relevant local feed/indicator contracts, static arithmetic review of the ambiguous windows, all-seven traceability and a review of the cited EMA/pattern source material. The [Fidelity chart-pattern guide](https://www.fidelity.com/bin-public/060_www_fidelity_com/documents/learning-center/Idenitfying-Chart-Patterns.pdf) supports defining pattern geometry and confirmation, not these specific nano-cap thresholds or success rates.

No application tests, Vitest, builds, paid API calls, provider calls, replay execution, browser changes, approvals, publishing, service restarts, Git publication or deployment occurred. Only this QA report and its progress link were added.

Next: obtain the owner's direction to revise the plan for these findings, then check the revised specification once more before starting implementation. Do not confuse document corrections with measured proof that a detector works.
