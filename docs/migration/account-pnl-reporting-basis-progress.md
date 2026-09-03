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
that view. It does not write a second setting. A blank fee on a new or edited
manual execution records an intentional $0 fee and remains Net-eligible.
Historical/imported missing-fee facts remain unavailable for Net.

## Implementation record

- [x] Add the migration and repository-backed user preference with Gross as the
  safe default.
- [x] Add the Account General P/L preference control.
- [x] Connect Workspace to the saved preference.
- [x] Connect all eight requested presentation defaults and preserve explicit
  page-level overrides.
- [x] Treat a blank fee on a new or edited manual execution as an intentional
  $0 fee, so it remains included in Net P/L. A trader enters a fee only when a
  broker charged one; historical/imported missing-fee facts remain unchanged.
- [x] Record whether a manual fee was left blank separately from the $0 fee
  fact, and add the Workspace **Fees not entered** filter. This starts with
  the released schema; no older $0 trade is guessed to have been blank.
- [x] Complete narrow static review.
- [ ] Complete staging visual acceptance before any release handoff.
