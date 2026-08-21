# Links Beta Aggregate Routing Progress

**Status:** Source and saved-answer acceptance passed on 2026-08-21. This is
the first aggregate checkpoint after the completed-trade routing gate. It is
not a Links AI Chat beta-release decision or owner UI acceptance.

**Controlling plan:** [Links Beta Performance Language Engine Plan](links-beta-performance-language-engine-plan.md)

## Purpose of this batch

Extend Links' exact Journal-data answers from individual completed trades to
ranked **ticker**, **trading-day**, and **time** aggregates. The trader-facing
questions are things such as which ticker was most profitable, which trading
day was strongest or weakest, and which weekday or session performed best.

## Exact scope

- Instrument aggregates: highest/lowest net P/L, highest trade count, and
  highest/lowest win rate by ticker.
- Trading-day aggregate: highest/lowest net P/L day.
- Time aggregates: highest/lowest net P/L weekday and session, plus highest
  net P/L entry and exit time bucket.
- Existing canonical Journal reads only: `get_results_by_ticker`,
  `get_timing_analytics`, and `get_analytics_overview` grouped by closing day.
- The same selected-account, reporting-currency, timezone, immutable
  reference-time, and calendar-scope contract as the completed-trade slice.
- Typed plan components, deterministic fact rendering, expected-plan fixtures,
  collision cases, and complete-master-inventory classification.

## Explicitly outside this batch

- Holding-duration and direction aggregates.
- Comparisons, contextual patches, rules/setups/tags/behavior evidence, Luna,
  readiness UI, AI Reviews, Links AI Chat activation, migrations, provider
  calls, database-schema changes, server work, Railway, Discord access,
  pricing, and any launch UI. Owner-authorized labeled QA conversations are
  retained only as saved-answer acceptance evidence.

## Acceptance gate

- [x] Every one of the 2,985 inventory rows is classified for this expanded
      boundary; deferred is visible rather than silently counted as coverage.
- [x] Every applicable aggregate question matches its independently maintained
      expected entity, metric, operation, rank, filter, calendar scope, handler
      and factual request.
- [x] Ticker, trading-day, and time-aggregate collisions cannot fall through to
      all-trade P/L or each other.
- [x] Static aggregate, collision, date, and full-master evaluation all pass
      with zero provider calls.
- [x] The source result and exact counts are recorded before another language
      family begins.

## Implemented bounded aggregate contract

The initial direct ticker acceptance exposed a real production constraint: the
general-purpose ticker response contained every instrument group and exceeded
the existing 48 KB factual-result cap before Links could select the answer.
Raising the cap would have made model prompts larger and more expensive, so it
was not used.

The typed deterministic request now carries an allowlisted aggregate selection
of grouping, metric, and rank direction. The canonical Journal analytics
service calculates the selected-account result, the application ranks it, and
only the one eligible winning group crosses the Links factual-result boundary.
The same contract is used for ticker, closing-day, weekday, session, entry-time
and exit-time rankings. It does not add arbitrary queries, new analytics
calculations, a model tool choice, or a provider call.

## Source evaluation — 2026-08-21

`src/scripts/evaluate-links-completed-trade-performance-master.ts` completed
with no provider call:

| Measure | Result |
| --- | ---: |
| Master inventory classified | 2,985 / 2,985 |
| Currently resolved applicable cases | 365 |
| Deferred, visible future cases | 2,620 |
| Unsupported / ambiguous cases | 0 / 0 |
| Correct resolved plans | 365 / 365 |
| Wrong plans / silently dropped modifiers | 0 / 0 |
| Completed-trade fixtures / boundary fixtures | 32 / 5 |
| Aggregate fixtures / boundary fixtures | 17 / 5 |
| Date grammar and boundary fixtures | 610 |
| Component-evaluation failures | 0 |
| Provider calls | 0 |

This is executable source proof, not a claim that a browser UI or the later
Links beta release has passed.

## Real saved-answer acceptance — 2026-08-21

Sixteen individually labeled, local development QA conversations exercised
the normal `generateCoachAiChatSavedAnswer` path against the selected account's
real Journal data. All 16 completed with the deterministic fast path and zero
generation receipts/provider calls.

- Completed-trade questions: best trade across all history, this year and
  March; March trade count; worst three losses; best long trade in March; and
  best short trade in March.
- Aggregate questions: most-profitable ticker in March; most-traded ticker in
  March; most-profitable day across all history and in March; best session;
  best entry-time window; and weakest weekday.
- Calendar transmission: an exact non-March day (April 15, 2026) and the
  relative `last year` scope. Both completed with the correct canonical
  handler; neither scope had an eligible ranked result, so Links returned the
  approved no-result answer rather than a made-up fact.
- Every returned result had factual evidence except the best-short case, which
  returned the approved deterministic no-result response because that scoped
  population had no eligible ranked result. It did not invent a trade fact.

The former ticker-cap failure and the former three-loss answer-validation
failure are preserved as failed QA records, followed by passing reruns. The
passing records are the acceptance evidence; the older failures remain useful
regressions rather than being hidden.

## Calendar grammar hardening — 2026-08-21

The first 12 date fixtures proved ordinary forms and boundaries, but did not
prove the full general grammar. The expanded suite now evaluates every full
month name and abbreviation, all 372 day-of-month positions across the twelve
months of a leap year, and every explicit year from 1900 through 2099. It also
checks numeric and ISO invalid dates.

That expansion found and corrected six invalid-date fallthroughs. For example,
`February 30, 2024` had been rejected as a day but then incorrectly treated as
the current February. An invalid explicit date now returns no calendar scope;
it cannot silently change the trader's requested period. The final 610-case
date suite passes with zero provider calls.

## Next boundary

No new language family begins from this record until the owner reviews this
checkpoint. Browser/UI acceptance remains separate because Links AI Chat is
currently behind the hosted beta Coming soon boundary.
