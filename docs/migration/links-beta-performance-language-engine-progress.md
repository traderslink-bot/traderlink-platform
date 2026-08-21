# Links Beta Performance Language Engine Progress

**Status:** The first completed-trade performance source checkpoint passes its
local zero-provider inventory, modifier and calendar gate. Later purpose
families remain deferred; this is not a live Links AI Chat beta-readiness
claim.

**Controlling plan:** [Links Beta Performance Language Engine Plan](links-beta-performance-language-engine-plan.md)

## Current truth

- The existing 2,985-question bank and 417-entry language inventory are useful
  source material, but neither proves executable understanding.
- The prior live Links sample exposed both deterministic successes and normal
  provider-path failures. It is evidence that the first-purpose engine is not
  beta-ready; it is not a coverage score.
- No percentage in this record is a release claim until a fixed inventory
  version, local component evaluator, handler checks, and owner-visible
  readiness view exist.

## Architecture checkpoint

- [x] Define the one beta purpose: trader performance and pattern understanding
      from exact Journal data.
- [x] Preserve the full existing inventory while separating the fixed beta
      denominator from deferred-purpose cases.
- [x] Define final router outcomes, typed request-plan components, registered
  handler validation, collision rules, defaults, ambiguity, bounded context,
  Luna fallback validation, replay, and component-level evaluation.
- [x] Add server-resolved selected-account, reporting-currency, timezone and
      fixed-reference-time semantics; bounded metadata-only entity resolution;
      lexical collision precedence; static independent expected-plan fixtures;
      registered composite handlers; and deterministic factual rendering.
- [x] Define the required owner-visible Links Beta Readiness dashboard and its
      release-control data.
- [x] Owner approves the architecture and authorizes only the first
      completed-trade performance implementation slice.

## Planned implementation checkpoints

- [x] Build the local typed-plan contract, vocabulary registry and evaluator.
- [x] Implement completed-trade performance language with component diagnostics.
- [ ] Add performance aggregates and collision coverage.
- [ ] Add comparisons, contextual plan patches, and behavior evidence.
- [ ] Add validated Luna plan fallback and replay records.
- [ ] Build and obtain owner approval for the Links Beta Readiness dashboard.
- [ ] Run owner-authorized real Links batches and make the beta decision from
      the dashboard evidence.

## First implementation target after approval

Completed-trade performance language: P/L, gain/loss outcome, trade count,
best/worst and top/bottom completed trades, and calendar date scope. The target
is a validated request plan and component-level result for every case, not a
collection of literal phrase checks.

## Active first-slice record

- The active implementation is limited to a typed completed-trade planner,
  static independent fixtures, a component evaluator, calendar-scope context,
  and deterministic use of the existing completed-trade summary and Trade
  Explorer handlers.
- The planner receives the server-selected account scope, existing reporting
  currency, account timezone, and fixed request reference time. It does not
  choose an account, combine currencies, make a provider call, or query a new
  data source.
- Ticker/day/session aggregates, comparisons, behavior/rule analysis, Luna
  fallback/replay, and the owner readiness UI remain deliberately untouched.
- The in-progress source adds a versioned completed-trade planner, account-
  timezone-aware calendar resolver, deterministic answer rendering, and
  persisted typed-plan diagnostics. It reuses only `summarize_closed_trades`
  and `query_trade_explorer` from the current canonical Journal contracts.
- The first static evaluation corpus contains 32 independently authored
  resolved plans plus five boundary cases. The boundary cases explicitly prove
  that a trading-day or ticker question is not misread as all-trade P/L, and
  that a deferred metric or invalid rank count remains visible at its failed
  component. No provider or live-account execution has been run for this
  in-progress checkpoint.

## First-checkpoint remediation outcome

- [x] Carry long/short ranking direction into the typed plan and factual-tool
      filter; prove no material first-slice modifier is silently discarded.
- [x] Classify all 2,985 master question-bank rows as resolved, deferred,
      unsupported, or ambiguous for this first-slice checkpoint.
- [x] Compare every applicable case with independently maintained expected
      plan components and emit a real zero-provider evaluation report.
- [x] Repair month-end calendar shifting and add calendar boundary fixtures.
- [x] Publish the exact remediation counts and acceptance outcome. No next
      performance family may begin before this line is accepted.

### Local executed result — 2026-08-21

`npx.cmd tsx src/scripts/evaluate-links-completed-trade-performance-master.ts`
ran with the repository-local Node user-info fallback only because this Windows
machine returned `ENOMEM` before `tsx` could resolve the normal OS profile. The
evaluator does not invoke a provider, Links AI Chat, a database, or a handler.

| Measure | Result |
| --- | --- |
| Complete master inventory classified | 2,985 / 2,985 |
| First-slice applicable cases | 193 |
| Resolved correctly | 193 / 193 |
| Wrong-plan cases | 0 |
| Silently dropped modifiers | 0 |
| Deferred / unsupported / ambiguous | 2,792 / 0 / 0 |
| Collision and boundary suite | PASS (5 cases) |
| Date-edge suite | PASS (12 cases) |
| Component evaluator | PASS (32 resolved fixtures) |
| Provider calls during local evaluation | 0 |

This clears only the first-slice local source acceptance gate. It does not
claim that deferred question-bank families work, and it does not authorize the
next implementation slice.
