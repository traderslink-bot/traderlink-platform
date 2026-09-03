# Account P/L Reporting Basis Progress

**Status:** In progress

**Controlling plan:** [Account Settings And Erasure Plan](account-settings-and-erasure-plan.md)

## Single saved user choice

Account General stores one P/L reporting preference for the signed-in user:

- **I enter fees** uses Net P/L.
- **I don't enter fees** uses Gross P/L and is the migration default.

The user requested this one saved choice to supply the default P/L basis for
the complete current analytics inventory:

1. Workspace
2. Analytics Overview
3. Analytics Results
4. Analytics Timing
5. Analytics Trade Breakdown
6. Trade Analyzer
7. Trade Explorer
8. Compare

An explicit Gross/Net selection on an individual page remains an override for
that view. It does not write a second setting. Raw trade rows remain visible;
Net can mark a calculated result unavailable when fees are blank, while an
explicit zero fee remains Net-eligible.

## Implementation record

- [x] Add the migration and repository-backed user preference with Gross as the
  safe default.
- [x] Add the Account General P/L preference control.
- [x] Connect Workspace to the saved preference.
- [x] Connect all eight requested presentation defaults and preserve explicit
  page-level overrides.
- [x] Explain at manual entry and editing that a blank fee keeps the raw trade
  visible but excludes it from Net P/L; tell the trader to enter 0 when there
  was no fee.
- [x] Complete narrow static review.
- [ ] Complete staging visual acceptance before any release handoff.
