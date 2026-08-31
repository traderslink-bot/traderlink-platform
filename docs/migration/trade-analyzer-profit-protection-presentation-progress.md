# Trade Analyzer Profit-Protection Presentation Progress

**Status:** Phase 1 source QA complete — real-data owner review pending

**Plan:** [Trade Analyzer Profit-Protection Presentation Plan](trade-analyzer-profit-protection-presentation-plan.md)

## Current phase

**Phase 1 — Trade Tracker card only.** The full Trade Analyzer results page is
explicitly blocked until the owner approves the individual card against real
saved data.

## Completed planning work

- [x] Separated the card-first delivery from the later results-page delivery.
- [x] Established that the main card leads with a direct conclusion and impact;
  technical Analyzer facts belong behind **View more**.
- [x] Reconfirmed the owner-controlled hierarchy: the visible summary is limited
  to profit taking, capital protection and risk management. VWAP, EMA, volume,
  other indicators and patterns remain lower evidence while their saved facts
  remain eligible for separately approved long-term statistics.
- [x] Recorded the mandatory explicit persisted 30-minute final-exit observation
  rule and the prohibition on 5-, 15-, 60-minute or live-price substitution.
- [x] Recorded that avoided-loss and actual-vs-counterfactual amounts are not
  existing raw Analyzer metrics and require an approved execution-ledger
  allocation before display.
- [x] Identified the long-term results sections: profit protection, scaling,
  post-exit follow-through, reversals, adding after peak, entry heat,
  post-event follow-through, and individual-trade evidence.
- [x] Completed the read-only Phase 1 field audit: saved Analyzer snapshots and
  path summaries prove the event/path facts, while canonical Journal allocation
  facts prove the later fill and quantity inputs. Avoided loss is not a raw
  Analyzer metric; the implemented comparison remains quantity-conserving and
  fee coverage does not gate the conclusion.

## Active review gates

- [x] Updated the review-only responsive composition to make the main card
  conclusion-only and move raw evidence behind **View more**.
- [ ] Owner approves or revises the Phase 1 composition and copy.
- [x] Performed the field-level audit for the actual ledger/counterfactual
  formula, including the need to handle multiple partial reductions and use
  the same saved prices and quantities on both sides of the comparison.
- [x] Kept fees outside this profit-protection conclusion. Existing detailed fee
  evidence remains unchanged and fee coverage does not gate the comparison.
- [x] Implemented and statically reviewed the card-only source slice within the approved allowlist:
  account-scoped current allocation read, quantity-conserving later-exit
  comparison, direct conclusion card, **View more** evidence control, and Help
  explanation. The exact comparison rejects unresolved Journal executions and
  multiple partial reductions; it uses one actual reduction without depending
  on noisy first-green/first-red crossings. No runtime review has run.
- [x] Kept first-entry excursion, VWAP, EMA, volume, patterns and other
  technical context below the main conclusion under **View more**.
- [x] Completed the persisted 30-minute final-exit variants: favorable, zero,
  adverse, and explicit unavailable. The card never substitutes the saved
  60-minute reconciliation or a live price.
- [x] Replaced repetitive peak/red/recovery sentences with one selected
  profit-taking or risk-management conclusion and an honest no-meaningful-
  conclusion state.
- [x] Removed first-green-to-first-red and recovery timing from the main card so
  repeated microcap breakeven crossings do not become trader-facing noise.
  Persisted crossings remain detailed historical evidence.
- [x] Added microcap-specific sustained-opportunity gates: 50% for 3 completed
  minutes, 30% for 5, 20% for 10, and 15% for 15. A 15-second or isolated
  one-minute spike never creates a card conclusion.
- [x] Included substantial giveback that still finishes profitable without
  judging it: the statement appears only when final return is no more than half
  of the selected sustained threshold. Near-threshold profitable finishes stay
  silent.
- [x] Kept the complete conclusion broader than unrealized P/L: opportunity on
  shares still open, profit already realized through scaling, actual final
  result, proved avoided loss and the saved 30-minute exit review remain
  distinct facts.
- [x] Restarted the sustained-opportunity window after an add or partial exit so
  a later opportunity measures the changed remaining position. When profit was
  already realized before that later window, the card states both without
  double-counting them.
- [x] Changed the add-after-high wording to describe increased exposure before
  the losing finish without claiming that the add itself caused the result or
  relying on a noisy first-red boundary.
- [x] Limited the microcap threshold-duration matrix to single-trade feedback.
  Future long-term results consume the continuous stored peak, duration,
  realized/open-position, final-result and counterfactual facts without turning
  the card thresholds into permanent cohorts.
- [x] Verified the long-term source boundary: the current analysis version
  retains the verified one-minute candle rows and event snapshots required to
  reproduce the same opportunity windows later. No new collection, market-data
  request, schema or migration is required.
- [x] Proposed and received collision clearance for the exact Phase 1 source-file
  allowlist before implementation.
- [ ] Owner approves real saved-data Tracker card rendering on desktop/mobile.
- [ ] Begin Phase 2 composition only after the Phase 1 completion gate.

## Boundaries

- This checkpoint includes local app source and linked documentation only. It
  includes no runtime server, Vitest suite, build, migration, configuration,
  market-data request, commit, push, staging, or deployment.
- Do not expose a dollar amount for avoided loss, protected capital, or a
  counterfactual total until the approved ledger calculation can prove it.
- No average or cohort statistic substitutes for an individual trade outcome.
