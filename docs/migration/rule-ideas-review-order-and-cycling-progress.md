# Rule Ideas Review Order And Cycling Progress

**Controlling plan:** [Trade Explorer Comparison And Rule Ideas Plan](trade-explorer-comparison-and-rule-ideas-plan.md)

## Goal

Let a trader dismiss one supported Rule idea and deliberately review another
supported idea, without presenting any one rule as a universal or predicted
best choice.

## Contract

- **Not for me — show another** appends the existing dismissal event, keeps the
  same preset suppressed for 90 days, and then checks the remaining supported
  presets from the same selected-account facts.
- One normal **Check my trades** still starts at most one new review cycle in
  28 days. Only a direct trader dismissal may continue through other candidates
  in that cycle.
- Candidate order is deterministic evidence breadth: supporting trading days,
  affected completed trades, trigger events, then a stable preset and
  configuration tie-break. It is a review order, not a recommendation score or
  claim that the first idea is best.
- Existing account scope, optimistic revision checks, immutable lifecycle
  events, active-preset exclusion, explicit Add rule confirmation and factual
  evidence gates remain unchanged.
- If no other candidate qualifies, the Rules card tells the trader that they
  have gone through every currently supported idea. No rule is activated or
  changed.

## Progress

- [x] Add the explicit dismiss-and-next server action within the existing
  account-scoped, immutable lifecycle service.
- [x] Add the Rule ideas card control and truthful end-of-list state.
- [x] Update the Trading Rules Help guide and controlling plan/progress record.
- [x] Run focused ESLint for the Rules client, Rule ideas API, detector,
  runtime and lifecycle service.
- [ ] Complete the controlled Railway deployment and hosted health checkpoint.
