# GA1-D Coach Trading Intelligence Inventory

Status: controlling inventory for GA1-D and later Coach work. This is one
user-facing Coach, not a collection of public agents. An LLM may later map a
question into a request, but only this deterministic backend validates,
executes, calculates, records evidence, and returns limitations.

Status values are deliberately exhaustive: `implemented_now`,
`deferred_checkpoint`, `blocked_by_missing_data`, `out_of_scope`, and
`already_available_foundation`. A comma-separated item list in this inventory
uses the listed status for every item in that row; no omitted item is silently
treated as implemented.

## Engine 1 - Analytics Engine

| Inventory items | Status | GA1-D handling |
| --- | --- | --- |
| verified trade rows, exact analytical rows, owner/account/currency/instrument isolation, source/query/partition authority, bounded result ordering, evidence IDs, replay/digests, tamper/foreign/polluted/re-digested rejection | already_available_foundation | GA0-B through GA1-C authority is reused directly. |
| gross/net P/L, fee states, trade/win/loss/flat counts and rates, average/median trade, average/median win/loss, profit factor, expectancy, gross-vs-net, fee drag, largest win/loss, daily counts and daily P/L | implemented_now | Query metric registry and Coach core summary. |
| day/week/month, session/time-window, hold-time, price bucket, direction, ticker, repeat attempt, sequence, prior outcome, position-size performance | implemented_now | Approved Coach capabilities compile to GA1-A/GA1-B only. |
| green/red/flat day, trades/day, streaks, maximum intraday drawdown, peak-profit giveback | implemented_now | Exact accumulator projections; no floating-point financial math. |
| current-versus-prior trend, after-win, fee-authority comparison, green-day-versus-red-day, first-N-versus-later comparison | deferred_checkpoint | Registry records the comparison type; a later checkpoint supplies complete governed comparisons. |
| unrealized P/L, risk-normalized P/L, planned-risk performance | blocked_by_missing_data | Requires open-position or risk-plan authority. |

## Engine 2 - Simulation Engine

| Inventory items | Status | GA1-D handling |
| --- | --- | --- |
| generic counterfactual plan/engine, content-addressed plans, governed-preset/generic origin, replay envelope/receipt, exact reconstruction, bounded evidence, isolation, no-lookahead, ambiguity handling, precedence, actual/simulated outcomes | already_available_foundation | GA1-C remains the sole simulator. |
| stop-after-losses, max trades, direction-only, daily drawdown, profit giveback, fourth-plus, wait-after-loss, ticker attempt, time cutoff, price exclusion, repeat attempts, after-outcome, reduce-size-after-loss | already_available_foundation | Coach returns these only as `rules_to_test`; it does not run them automatically. |
| additional stop/win/goal/time/direction/whitelist/size/tag/rule combinations and full counterfactual result inventory | deferred_checkpoint | Preserve GA1-C compiler boundary. |

## Engine 3 - Evidence and Replay Engine

| Inventory items | Status | GA1-D handling |
| --- | --- | --- |
| source/query/plan/result/replay/receipt/evidence digests; semantic row/execution/occurrence identity; bounded evidence; emitted/omitted counts; deterministic ordering; reconciliation; privacy boundary proof | already_available_foundation | Coach result references accepted GA1-A receipts and bounded evidence. |
| Coach result digest and evidence-to-finding linkage | implemented_now | Versioned result object is content-addressed. |
| replay of a persisted Coach envelope | deferred_checkpoint | Query and simulation replay remain the trusted replay mechanisms. |

## Engine 4 - Import and Data Quality Engine

Generic CSV import, broker detection/format registry, mappings, normalization,
partial fills, round-trip reconstruction, duplicate/correction/cancellation
handling, fee classification, confidence/errors/warnings, preview/confirmation,
audit receipt, and manual-entry validation are `already_available_foundation`
where already governed by GA0/import work. New broker adapters, migrations, and
importer changes are `out_of_scope` for GA1-D.

## Engine 5 - Trade Behaviour Engine

| Inventory items | Status | GA1-D handling |
| --- | --- | --- |
| after-loss, repeat ticker, fourth-and-later, overtrading proxy, giveback, large-size weakness, ranked leaks/strengths | implemented_now | Deterministic findings use observed execution-only segments and bounded evidence. |
| after-win/breakeven, streak/green-red behaviour, chasing, late-entry, held-too-long, cut-winner, rule compliance/reminder response, discipline scores | deferred_checkpoint | No emotional or causal assertions are inferred. |
| planned/unplanned, rule-break, emotional, FOMO, boredom, forcing, hesitation tags | blocked_by_missing_data | Requires explicit validated tag authority. |

## Engine 6 - Risk Engine

Execution-only size/quantity/notional, loss distribution, maximum intraday
drawdown, giveback, and size-after-loss candidate are `implemented_now` or
`already_available_foundation`. Risk-per-trade, account-risk percentage,
planned-versus-actual loss, stops, slippage, liquidity/float/dilution risk, and
lockout thresholds are `blocked_by_missing_data` because no validated risk plan
or market/quote authority exists.

## Engine 7 - Rule Engine

Rule-candidate ranking, candidate-to-GA1-C-preset links, rule evidence, and
`rule_to_test` status are `implemented_now`. User-saved/active rules, conflicts,
compliance, reminders, hard lockouts, review history, and prospective rule
effectiveness are `deferred_checkpoint`. No candidate is a claim of improved
performance unless a separate GA1-C simulation executes it.

## Engine 8 - Pattern and Setup Engine

Manual/imported setup tags and tag-performance capability are
`blocked_by_missing_data` until tag authority is exposed. Candle setup labels,
VWAP/EMA/opening-range/breakout/pullback/halt/support/resistance patterns,
market-context grouping, and automated detection are `out_of_scope` for this
execution-only checkpoint.

## Engine 9 - Market Context Engine

Ticker metadata, float/market-cap/volume/gap/range/catalyst/filing/sector
facts, micro-cap flags, EODHD authority, and stale/missing provider handling
are `blocked_by_missing_data` or `out_of_scope` for GA1-D. No market fact,
candle fact, liquidity claim, or live trading instruction is inferred here.

## Engine 10 - Guardrails and Notification Engine

Check-ins, push/in-app/email notifications, alerts, cooldown/mute/quiet-hour
settings, reminder history, and reminder-outcome tracking are `out_of_scope`.
The deterministic findings can later be inputs to an internal guardrails worker,
but GA1-D creates no notification or UI surface.

## Engine 11 - Coach Insight Layer

Structured Coach-ready findings, evidence, sample-size/authority/limitation and
unsupported-data responses are `implemented_now`. Plain-English personality,
daily/weekly/monthly recaps, marketing copy, memory, and LLM explanation are
`deferred_checkpoint`. The product boundary is fixed: no trade signals,
investment advice, or live buy/sell instructions.

## Engine 12 - Coach Memory and Profile Engine

Trading profile, preferences, goals, saved/active rules, mistake/strength
history, reminder preferences, broker accounts, and Coach memory are
`deferred_checkpoint`. Persistent profile storage and public multi-user
hardening are `out_of_scope` for this private execution-only foundation.

## Engine 13 - Reporting and Dashboard Engine

Metric/evidence tables in the deterministic result are `implemented_now`.
Daily/weekly/monthly dashboards, charts, exports, printable/shareable reports,
and UI cards are `out_of_scope`.

## Agent-to-engine map

Only **Coach** is user-facing. It may later call the Analytics, Simulation,
Evidence/Replay, Import, Behaviour, Risk, Rule, Pattern, Market Context,
Guardrails, Insight, Memory, and Reporting engines through approved internal
workers. Separate Analytics Agent, Simulation Bot, Risk Agent, Import Agent,
or Market Agent must never be exposed as user-facing products.
