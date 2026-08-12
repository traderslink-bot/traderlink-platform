# Category 2: Profit and Loss Metrics

# Category Metadata

| Field | Value |
|---|---|
| Category name | Profit and Loss Metrics |
| Category number | 2 |
| Category slug | metrics-profit-loss |
| File name | 02-metrics-profit-loss.md |
| Category type | Financial performance metric vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-05 |
| Last updated | 2026-08-10 |
| Dependencies | Category 1 Intents version 1; replacement Journal Analytics Fact Set, metric registry, query/result contracts, dimensions, operators, dates, fees, and account-scope contracts |
| Owner | AI language inventory workflow |

---

# 1. Category Purpose

Category 2 defines the exact financial performance measures that the future
TraderLink AI Companion may recognize and request. It gives metric language a
stable canonical target while preserving the population, money basis, fee
coverage, currency, date attribution, denominator, and open-trade rules that
make a result mathematically meaningful.

This category supports the structured interpretation of requests routed by
Category 1 intents such as `calculate_metric`, `summarize_performance`,
`compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and
`diagnose_performance`. The deterministic Journal Analytics query and result
contracts remain responsible for retrieving facts, calculating exact values,
reporting coverage, and returning unavailable or partial states. The AI Chat
interpreter, validator, tool router, and answer runtime are still planned and
are not claimed here.

The category solves the difference between closely related trader language:
gross versus net, realized versus unrealized, trade P/L versus account return,
before-fee versus after-fee, a per-trade average versus a calendar average,
and a direction grouping versus a new metric. It must let the later language
registry ask for the missing field when a phrase such as “P&L,” “return,”
“profit per share,” or “best win” does not safely determine the intended
metric.

This category does not own action routing, dimensions, operators, dates,
comparison or ranking grammar, trader slang, response formatting, policy, or
protected actions. It also does not turn an exact deterministic metric into a
prediction, recommendation, motive claim, or account-level conclusion.

---

# 2. Category Boundaries

## Included

The controlling inventory contains exactly these financial metric families:

- gross profit, gross loss, and gross P/L;
- net P/L and realized P/L for eligible closed round trips;
- unrealized P/L only when an approved current mark exists;
- total return only when an approved account denominator and cash-flow basis
  exist;
- average and median net P/L per eligible closed trade;
- average and median percentage return with an explicit approved denominator;
- largest win and largest loss with a declared gross/net basis and deterministic
  tie behavior;
- average winning and average losing trade;
- average daily, weekly, and monthly P/L with account-timezone calendar rules;
- profit per share with an exact quantity denominator;
- P/L grouped by the separately owned direction dimension; and
- P/L before fees and P/L after fees with exact fee-coverage semantics.

Every included metric must preserve its exact formula, population, units,
currency partition, date attribution, coverage state, fee policy, open-trade
policy, denominator behavior, and version when its later canonical record is
produced.

## Excluded

The following related concepts are not owned by Category 2:

- outcome counts and rates, streaks, profitable days, and other Category 3
  outcome metrics;
- expectancy, profit factor, consistency, dispersion, edge, and quality
  concepts owned by Category 4;
- commissions, regulatory fees, transaction costs, fee completeness, and fee
  impact metrics owned by Category 5, although Category 2 must state the fee
  coverage required by its P/L basis;
- quantity, exposure, position-size, and size-bucket metrics owned by Category
  6, although `profit_per_share` consumes an exact quantity denominator;
- holding duration and other time metrics owned by Category 7;
- execution counts, prices, slippage, and execution-quality metrics owned by
  Category 8;
- behavioral, rule, setup, label, and edge interpretations owned by later
  metric categories;
- candle, quote, market, benchmark, catalyst, or external-data metrics owned
  by Category 10 or their later source owners;
- direction, ticker, account, provenance, session, weekday, and other
  dimensions owned by Category 11;
- comparison, ranking, tie, superlative, and ordering language owned by
  Category 14;
- date and time expressions and timezone resolution owned by Category 13;
- response preferences, policy, privacy, account ownership, causation, and
  protected-action handling owned by Categories 18 and 19; and
- the AI Chat provider, runtime, persistence, or Journal mutation itself.

## Cross-Category References

Category 2 references but does not redefine:

- Category 1 intents, including metric calculation, summarization, grouping,
  comparison, ranking, explanation, and diagnosis;
- Category 3 outcome populations and measures when a P/L metric is filtered or
  compared by win, loss, or flat outcome;
- Categories 4 and 5 for quality/edge interpretation and exact charge facts;
- Category 6 for quantity and exposure denominators;
- Category 7 and Category 13 for calendar windows, trading dates, and timezone
  resolution;
- Category 10 and approved market-data contracts for any current valuation or
  external denominator;
- Category 11 for direction and all other filter/grouping dimensions;
- Category 12 for operators and fee/population exclusions;
- Category 14 for ranking, comparison, extrema, and deterministic ties;
- Category 15 for selected entities and conversation scope;
- Category 16 for slang, abbreviations, and ticker-shaped token safety;
- Category 17 for ambiguity and focused clarification wording;
- Category 18 for result presentation; and
- Category 19 for account scope, privacy, unsupported requests, causation, and
  protected actions.

Category 2 owns the metric meaning and basis boundary. A later category may
reference one of these names but must not create a second name for the same
metric or silently reinterpret a denominator.

---

# 3. Planning Analysis

Planning is complete for the initial 22-name inventory. Sections 5–7 remain
deferred until lead review approves the controlling list and its overlap
decisions.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?**

   It maps financial-performance wording to one exact metric while preserving
   gross/net basis, realized/open population, fee coverage, currency, date
   attribution, denominator, and result units. It prevents “profit,” “return,”
   and “P&L” from being silently treated as interchangeable.

2. **What canonical concepts belong here?**

   Exactly the 22 plan-listed names in Section 4, in the specified order. The
   list is controlling for this category even where two names require an
   explicit alias or distinction review. No metric is omitted, renamed, merged,
   or replaced because the current registry uses a different compatibility ID.

3. **What related concepts belong elsewhere?**

   Outcome rates, edge and quality measures, fees/cost measures, size and
   exposure, time/duration, execution, candle analytics, dimensions, operators,
   date resolution, ranking/comparison grammar, response preferences, and
   policy all belong to the owners listed in Section 2. Category 2 consumes
   those contracts but does not redefine them.

4. **What data is required?**

   Core gross and realized metrics require a server-authorized account scope,
   current active ready-closed Stock round trips, ordered allocation facts,
   exact quantities, prices, direction, trade currency, and closing trading
   date in the account timezone. Net and after-fee measures additionally
   require complete supported charge facts, fee-currency agreement, fee-sign
   policy, and conserving fee allocation. Calendar averages require the
   declared account-timezone closing date and explicit day/week/month contract.
   Percentage returns require an approved per-trade denominator such as exact
   entry notional; total return requires account equity, cash-flow, and FX
   facts; unrealized P/L requires a current approved valuation mark.

5. **Which deterministic tools will answer these requests?**

   The replacement `JournalAnalyticsService`, typed
   `journal_analytics_query_v1`, versioned metric registry, exact math helpers,
   extended metric calculator, shared population/accumulator, grouped result
   service, and `JournalAnalyticsFactSet` provide the current deterministic
   primitives. The service supports exact gross/net first-slice metrics,
   conditional fee coverage, closed-trade date grouping, direction grouping,
   exact averages/medians/extrema, and bounded result contracts. A future
   metric validator and AI Chat tool router must still map natural language to
   these tools; no Chat runtime is claimed.

6. **Which concepts are directly observed?**

   No P/L amount in the controlling list is accepted as a directly observed
   financial result. The underlying Journal facts are directly observed or
   accepted facts: executions, quantities, prices, fees, trade currency,
   direction, round-trip state, timestamps, account timezone, and coverage.
   `pnl_by_direction` also consumes the directly observed Journal direction
   dimension, but its money values are still deterministically derived.

7. **Which concepts are deterministically derived?**

   All 22 canonical metric concepts are intended to be deterministically
   derived from declared facts and formulas, including sums, means, medians,
   extrema, calendar aggregation, per-share normalization, basis selection,
   and direction partitions. A concept may therefore be deterministically
   derived in principle while its current capability is Planned or Unavailable
   because the named implementation or required fact is absent.

8. **Which concepts are proxy indicators?**

   None of the 22 P/L metrics is a proxy indicator. A P/L result may be used by
   Category 4 or Category 1 diagnosis/coaching as evidence, but it cannot by
   itself establish motive, emotion, cause, quality, edge, or advice.

9. **Which concepts are user-labelled?**

   None of the 22 metrics is user-labelled. User-provided setup, tag, rule,
   goal, or Journal labels may define a later filter or comparison population,
   but they do not change a P/L formula and are not inferred by this category.

10. **Which concepts are not measurable?**

   Current replacement evidence cannot measure `unrealized_pnl` without a
   current approved mark or `total_return` without account equity, cash-flow,
   and FX facts. Average and median percentage return have exact source facts
   for some normalized returns but no approved named capability in the current
   registry. Weekly/monthly average metrics and exact per-share output are also
   not exposed as named current capabilities. None may use V3, sample data,
   zeroes, or inferred denominators as a fallback.

11. **Which terms are ambiguous?**

   `profit`, `P&L`, `pnl`, and bare `PL` may mean gross, net, realized, or
   unrealized; bare `PL` is also ticker-shaped and must not auto-map to a
   metric. `return` may mean account return or return on entry notional.
   `before fees` and `after fees` specify a basis but not necessarily a
   population or period. `average`, `median`, `largest`, `win`, `loss`,
   `daily`, `weekly`, `monthly`, and `per share` each require the relevant
   population, denominator, or calendar definition.

12. **What defaults are safe?**

   There is no silent default for bare `PL`, `P&L`, `pnl`, `return`, or
   `profit per share` when the basis or denominator changes the answer. The
   chatbot plan permits “profit” to mean net realized P/L only when reliable
   fee coverage and closed-trade scope are explicit or safely established;
   otherwise it must state the interpretation or ask one focused question.
   Realized values exclude open, pending, excluded, and unresolved rows.
   Money stays within one trade-currency partition. A missing fee or denominator
   produces partial or unavailable state, never an estimate.

13. **What conditions require clarification?**

   Ask one focused question when the user has not specified a materially
   different basis or population, when “return” could mean account or trade
   return, when percentage-return denominator is absent, when “average” lacks a
   period/population, when “largest win/loss” lacks gross/net basis, when a
   calendar window lacks a timezone or date boundary, when direction is being
   requested as a dimension rather than a metric, or when a requested open or
   account result depends on unavailable facts. Do not combine metric, date,
   population, fee, and denominator questions into one compound prompt.

14. **What combinations are invalid?**

   Invalid combinations include net/after-fee output over fee-incomplete rows
   without a partial/unavailable state; realized P/L that silently includes
   open, pending, excluded, or needs-decision rows; total return without an
   account-equity/cash-flow denominator; unrealized P/L without a current mark;
   percentage return without an approved denominator; cross-currency money
   aggregation without FX facts; per-share output with missing or non-reconciling
   quantity; a direction request that redefines Category 11; and a ranking or
   comparison that hides the selected metric, population, tie policy, or sample
   count.

15. **What evaluation coverage proves completion?**

   Later production must cover every controlling metric with canonical, formal,
   conversational, trader-slang, abbreviation, misspelling, noisy,
   singular/plural, question, command, fragment, follow-up, correction,
   comparison, ranking, negation, exclusion, multi-filter, multi-part,
   ambiguity, negative, unsupported-data, selected-context, and applicable
   cross-category cases. Structured expectations must assert the metric, basis,
   population, denominator, date/timezone, fee state, open-trade behavior,
   units, and unavailable reason. No language or evaluation coverage is claimed
   in this Phase 1–2 draft.

## 3.2 Dependencies

- **Earlier inventory:** Category 1 Intents version 1 is the required locked
  action vocabulary dependency. Its metric-related intents provide routing but
  do not define any metric.
- **Journal facts:** `JournalAnalyticsFactSet` v1, current active allocations,
  exact execution quantities/prices, round-trip projection state, direction,
  currency, timestamps, account timezone, fee evidence, source provenance,
  and coverage/Data Decision states.
- **Deterministic implementation:** `journal_analytics_query_v1`, the versioned
  metric registry, exact decimal/rational math, population and accumulator,
  grouped analytics service, bounded round-trip table, result coverage and
  limitation contract, and current replacement dashboard read models.
- **Later language categories:** Categories 3–19 provide outcomes, fees,
  dimensions, operators, dates, comparison/ranking, context, slang,
  ambiguity, response, and policy contracts required for full language
  production.
- **User-defined vocabulary:** Accepted setup, tag, rule, goal, and Journal
  facts may be used as filters only when their owning workflow accepts them.
- **Account and currency:** Server-authoritative workspace/account scope,
  account base currency metadata, selected trade-currency partition, and an
  approved FX observation only where a conversion is explicitly supported.
- **Unsupported dependencies:** Current price/mark data for unrealized P/L;
  account equity, balances, deposits/withdrawals, transfers, dividends,
  interest, and FX for total return; a dedicated percentage-return distribution
  contract; the weekly/monthly average metric definitions; exact per-share
  capability; and the AI Chat interpreter, validator, provider, and answer
  runtime.

## 3.3 Risks

- **Basis ambiguity:** Gross, net, before-fee, after-fee, realized, and
  unrealized wording can produce materially different values.
- **Alias collision:** `pnl_before_fees` routes to the exact `gross_pnl`
  deterministic calculation and `pnl_after_fees` routes to the exact `net_pnl`
  deterministic calculation. Their plan-listed records remain separate
  language-routing entries, but must never create duplicate calculations or
  double-counted metrics. `realized_pnl`/basis-specific P/L,
  `largest_win`/`best_trade`, and `largest_loss`/`worst_trade` remain distinct
  public-mapping questions for lead review.
- **Return-denominator risk:** Account return, return on entry notional, and
  per-share normalization are not interchangeable. Missing account equity,
  cash-flow, FX, or quantity facts must remain visible.
- **Fee risk:** Missing, conflicting, unsupported, or currency-mismatched fees
  make only the affected charge/net result unavailable or partial. Gross must
  not be reconstructed from net, and net must not be reconstructed from gross.
- **Open-trade risk:** Open activity is factual Journal coverage but is not a
  realized closed-trade result. Unrealized P/L requires a current approved
  mark and must not be estimated from the last execution.
- **Calendar risk:** Daily, weekly, and monthly windows require inclusive
  boundaries, account timezone, and explicit treatment of days or periods with
  no eligible closed trades.
- **Currency risk:** Money, notional, averages, and percentage denominators may
  not be silently combined across currency partitions or converted using
  account base currency alone.
- **Sample-size risk:** Averages, medians, extrema, and period comparisons need
  counts and the shared communication bands; those bands are not statistical
  guarantees.
- **Ticker collision risk:** Bare `PL` is a symbol candidate and must not be
  treated as profit/loss shorthand. P&L and pnl require explicit metric grammar
  and still do not choose net/gross or realized/unrealized without context.
- **Legacy contamination risk:** V3 registry names, saved reports, fixtures,
  and sample data cannot establish replacement support.
- **Account/privacy risk:** Natural language cannot choose another account or
  request another user's financial results; server-authoritative scope is
  mandatory.
- **Chat-runtime risk:** Existing deterministic analytics does not mean an AI
  Chat metric handler exists. Capability status in Section 4 describes the
  deterministic evidence boundary, not an authorization to execute Chat.

## 3.4 Repository Evidence

The following privacy-safe paths were inspected read-only. They establish
contracts, formulas, capability states, and implementation boundaries only; no
private identifiers, statement values, tokens, hashes, or secrets are recorded.

| Repository path | What it proves |
|---|---|
| `docs/migration/traderslink_ai_language_inventory_master.md` | Category workflow, mandatory controlling-inventory statement, status vocabulary, ownership rules, fee/open-trade/unsupported boundaries, and exact Category 2 plan-list location. |
| `docs/migration/category_completion_template_example.md` | Required metadata, Sections 1–11, inventory fields, evidence/status vocabulary, deferred-deliverable structure, coverage tables, and approval gates. |
| `docs/migration/language-inventory/categories/01-intents.md` | Accepted Category 1 version-1 conventions for account scope, deterministic evidence, planned Chat status, explicit confirmation, no-V3 fallback, ambiguity, and protected-action boundaries. |
| `docs/migration/traderslink_ai_chatbot_complete_language_plan.md` | The exact 22 plan-listed P/L names, metric dictionary requirements, structured-query validation, fee states, open-trade rules, evidence, sample bands, ambiguity, and testing boundaries. |
| `docs/migration/ai-chat-plan.md` | AI Companion planning boundary, account scope, no-invention, explicit confirmation, privacy, and no-V3 direction. |
| `docs/migration/analytics-capability-catalog.md` | Replacement capability states, first-slice gross/net metrics, fee and population policy, account/market missing facts, currency/date rules, and realized/open separation. |
| `docs/migration/phase-4-core-analytics-plan.md` | Journal Analytics Fact Set, exact financial math, fee allocation, realized population, currency/timezone partitions, query allowlists, registry policy, and result contract. |
| `docs/migration/phase-4-core-analytics-progress.md` | Accepted replacement implementation boundary: exact math, fee coverage, first-slice/extended registry, unavailable reason codes, deterministic grouping, and no active Chat runtime. |
| `src/modules/journal-analytics/contracts/metric-registry.ts` | Versioned metric definitions, implemented/conditional/unavailable capability states, units, basis, coverage, and unavailable reasons. |
| `src/modules/journal-analytics/server/analytics-capability-manifest.ts` | Machine-readable legacy and additional capability identifiers; confirms which exact named capabilities exist and which do not. |
| `src/modules/journal-analytics/server/analytics-metric-registry.ts` | First-slice formulas and policies for gross/net/average/median/extrema, conditional fee coverage, unrealized unavailability, and compatibility aliases. |
| `src/modules/journal-analytics/server/analytics-extended-metrics.ts` | Deterministic extended calculations for daily P/L, winner/loser averages, normalized return, quantity/notional, and grouped coverage where implemented. |
| `src/modules/journal-analytics/contracts/analytics-query.ts` | Account/date/currency scope, gross/net basis, allowlisted filters/groupings, time buckets, and bounded pagination. |
| `src/modules/journal-analytics/contracts/analytics-result.ts` | Exact result values, complete/partial/empty/unavailable states, coverage counts, limitations, units, basis, currency, timezone, and result provenance. |
| `src/modules/journal-analytics/server/exact-analytics-math.ts` | Exact decimal/rational addition, subtraction, division, percentage, median, and deterministic rounding behavior. |
| `src/modules/journal-analytics/server/analytics-service.ts` | Read-only deterministic analytics overview, grouped responses, partitioning, and bounded round-trip evidence access. |

Evidence interpretation: the replacement currently supports deterministic
Journal analytics primitives and an accepted metric registry, but the AI Chat
interpreter, metric-language router, validator, provider runtime, and protected
Chat action paths remain planned. A metric marked Supported below is not a
claim that a Chat handler is executable.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

The inventory preserves the 22 plan-listed names exactly. `Supported` means a
replacement deterministic metric or grouped path exists, including a declared
conditional coverage policy; it does not mean the AI Chat runtime exists.
`Planned` means the required Journal facts or primitives are present or
identified, but the named metric/formula/tool is not currently exposed.
`Unavailable` means a required fact or denominator is absent and the result
must remain unavailable rather than estimated. Evidence classification describes
the metric's factual basis, not Chat execution status.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Evidence classification | Capability status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|---|
| 1 | C2-PNL-001 | gross_profit | Gross profit | gross | deterministically derived | Supported | Sum of positive gross P/L from eligible `ready_closed` Stock round trips; exact cash effects; no fee facts required. |
| 2 | C2-PNL-002 | gross_loss | Gross loss | gross | deterministically derived | Supported | Sum of negative gross P/L retained as a negative trade-currency value; exact ready-closed cash effects; no fee reconstruction. |
| 3 | C2-PNL-003 | gross_pnl | Gross P&L | gross | deterministically derived | Supported | Gross profit plus gross loss for eligible ready-closed Stock trades; single trade-currency partition; open/decision rows excluded from value and reported in coverage. |
| 4 | C2-PNL-004 | net_pnl | Net P&L | net | deterministically derived | Supported | Gross P/L minus allocated charge cost plus charge credit over fee-complete rows; partial or unavailable when fee coverage is incomplete or unsupported. |
| 5 | C2-PNL-005 | realized_pnl | Realized P&L | realized | deterministically derived | Supported | Scope concept for eligible ready-closed P/L on a declared gross or net basis; no dedicated runtime ID; never includes legitimate-open or needs-decision rows. |
| 6 | C2-PNL-006 | unrealized_pnl | Unrealized P&L | unrealized | deterministically derived | Unavailable | Legitimate-open facts and execution-derived cost exist, but an approved current market-price mark is absent; never estimate from the last execution or cost. |
| 7 | C2-PNL-007 | total_return | Total return | account_return | deterministically derived | Unavailable | Requires account equity/balance history, cash flows, distributions, and approved FX policy; realized trade P/L or entry-notional return is not account return. |
| 8 | C2-PNL-008 | average_net_pnl_per_trade | Average net P&L per trade | distribution | deterministically derived | Supported | `average_pnl` on net basis over fee-covered eligible closed trades; exact rational result; unavailable when the eligible denominator is zero and partial when gross rows lack fee coverage. |
| 9 | C2-PNL-009 | median_net_pnl_per_trade | Median net P&L per trade | distribution | deterministically derived | Supported | Exact sorted median of net P/L over fee-covered eligible closed trades; even populations average the two middle exact values; fee coverage remains explicit. |
| 10 | C2-PNL-010 | average_percentage_return | Average percentage return | normalized_return | deterministically derived | Planned | Exact entry-notional and P/L facts can support per-trade return, but no named average percentage-return capability or approved aggregate distribution contract is exposed in the current registry. |
| 11 | C2-PNL-011 | median_percentage_return | Median percentage return | normalized_return | deterministically derived | Planned | Exact per-trade return could be derived from an approved P/L and entry-notional basis, but the named median percentage-return capability and coverage contract are not exposed. |
| 12 | C2-PNL-012 | largest_win | Largest win | extrema | deterministically derived | Supported | Positive maximum selected-basis trade P/L, using the deterministic best-trade close-time/stable-ID tie policy; gross versus net basis must be declared. |
| 13 | C2-PNL-013 | largest_loss | Largest loss | extrema | deterministically derived | Supported | Most negative selected-basis trade P/L, using the deterministic worst-trade close-time/stable-ID tie policy; gross versus net basis must be declared. |
| 14 | C2-PNL-014 | average_winning_trade | Average winning trade | outcome_partition | deterministically derived | Supported | Arithmetic mean of positive selected-basis P/L; net basis is fee-conditional; unavailable when no qualifying winning population exists. |
| 15 | C2-PNL-015 | average_losing_trade | Average losing trade | outcome_partition | deterministically derived | Supported | Arithmetic mean of negative selected-basis P/L; net basis is fee-conditional; unavailable when no qualifying losing population exists. |
| 16 | C2-PNL-016 | average_daily_pnl | Average daily P&L | calendar_aggregation | deterministically derived | Supported | Average of eligible realized P/L by closing trading date in the account IANA timezone; selected gross/net basis; open-only days are not realized days. |
| 17 | C2-PNL-017 | average_weekly_pnl | Average weekly P&L | calendar_aggregation | deterministically derived | Planned | Closing ISO-week grouping exists, but a named average across weekly P/L values and its empty-week/calendar contract are not currently exposed. |
| 18 | C2-PNL-018 | average_monthly_pnl | Average monthly P&L | calendar_aggregation | deterministically derived | Planned | Closing-month grouping exists, but a named average across monthly P/L values and its empty-month/calendar contract are not currently exposed. |
| 19 | C2-PNL-019 | profit_per_share | Profit per share | unit_normalized | deterministically derived | Planned | Exact entered quantity and P/L facts exist; `net_pnl_per_100_shares` is a different compatibility metric, so an exact per-share formula, fee basis, and public capability remain to be defined. |
| 20 | C2-PNL-020 | pnl_by_direction | P&L by direction | directional_grouping | directly observed and deterministically derived | Supported | P/L metrics can be grouped by the directly observed Journal direction dimension; Category 11 owns direction semantics and Category 2 does not redefine them. |
| 21 | C2-PNL-021 | pnl_before_fees | P&L before fees | fee_basis_alias | deterministically derived | Supported | Separate plan-listed language-routing entry for the exact `gross_pnl` deterministic calculation; never create a duplicate calculation or double-counted metric. |
| 22 | C2-PNL-022 | pnl_after_fees | P&L after fees | fee_basis_alias | deterministically derived | Supported | Separate plan-listed language-routing entry for the exact `net_pnl` deterministic calculation; never create a duplicate calculation or double-counted metric; missing fees yield partial/unavailable state. |

## Proposed Inventory Additions

None proposed. The current replacement registry contains many additional
capabilities, but none is added because this draft is limited to the exact
22-name plan list and later categories own the adjacent metric families.

## Proposed Removals or Merges

None proposed. The following are documented alias or distinction risks for lead
review, not silent merges:

| Plan-listed name | Current deterministic path or related name | Boundary that must remain explicit |
|---|---|---|
| `gross_pnl` / `pnl_before_fees` | `gross_pnl` | `pnl_before_fees` routes to the exact `gross_pnl` deterministic calculation. Both plan-listed records remain separate language-routing entries and must never create duplicate calculations or double-counted metrics. |
| `net_pnl` / `pnl_after_fees` | `net_pnl` | `pnl_after_fees` routes to the exact `net_pnl` deterministic calculation. Both plan-listed records remain separate language-routing entries and must never create duplicate calculations or double-counted metrics; fee completeness and partial state remain explicit. |
| `realized_pnl` | Gross or net P/L on the ready-closed population | Realized is a population/scope qualifier, not permission to choose gross or net silently. |
| `average_net_pnl_per_trade` / `median_net_pnl_per_trade` | `average_pnl` / `median_pnl` with net basis | Average versus median and net fee coverage remain distinct. |
| `largest_win` / `largest_loss` | `best_trade` / `worst_trade` with a selected basis | Extrema require explicit metric basis and deterministic tie/order behavior. |
| `average_percentage_return` / `median_percentage_return` | `return_on_entry_notional` is an aggregate percentage path | Entry-notional return is not account return and is not silently treated as an average or median distribution. |
| `profit_per_share` | `net_pnl_per_100_shares` compatibility capability | Per-share and per-100-entered-share units are not interchangeable without an approved formula and fee basis. |

---

# 5. Canonical Inventory Deliverable

All 22 canonical records in the controlling inventory are approved and locked
at version 1 following the controller-recorded independent Terra PASS.

## `gross_profit`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-001 |
| Category | Profit and Loss Metrics |
| Subcategory | gross |
| Canonical name | gross_profit |
| Display name | Gross profit |
| Exact definition | The sum of positive gross P/L amounts from eligible `ready_closed` Stock round trips in one selected trade-currency partition, before allocated charge costs or credits. |
| Distinction from related concepts | Includes only positive gross-P/L closed trades; it is not gross P/L, net P/L, realized P/L on an undeclared basis, unrealized P/L, or account return. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the value and remain visible only through coverage. |
| Fee handling | Before fees. No fee facts are required and gross profit must not be reconstructed from net results. |
| Version | 1 |

### Related Concepts

- Broader concept: Gross P/L on eligible `ready_closed` round trips.
- Narrower concepts: Positive gross-P/L trade contributions within the selected currency partition.
- Commonly confused concepts: `gross_pnl`, `net_pnl`, `realized_pnl`, `pnl_before_fees`, and unrealized P/L.
- Must not be merged with: `gross_loss`; `gross_pnl`; `pnl_before_fees`; or any after-fee, open-position, or account-return measure.

## `gross_loss`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-002 |
| Category | Profit and Loss Metrics |
| Subcategory | gross |
| Canonical name | gross_loss |
| Display name | Gross loss |
| Exact definition | The sum of negative gross P/L amounts from eligible `ready_closed` Stock round trips in one selected trade-currency partition, retained as a negative monetary value before allocated charge costs or credits. |
| Distinction from related concepts | Includes only negative gross-P/L closed trades and retains their negative sign; it is not an absolute loss total, gross P/L, net P/L, realized P/L on an undeclared basis, unrealized P/L, or account return. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact negative monetary amount in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the value and remain visible only through coverage. |
| Fee handling | Before fees. No fee facts are required and gross loss must not be reconstructed from net results. |
| Version | 1 |

### Related Concepts

- Broader concept: Gross P/L on eligible `ready_closed` round trips.
- Narrower concepts: Negative gross-P/L trade contributions within the selected currency partition.
- Commonly confused concepts: `gross_pnl`, `net_pnl`, `realized_pnl`, `pnl_before_fees`, largest loss, and unrealized P/L.
- Must not be merged with: `gross_profit`; `gross_pnl`; `pnl_before_fees`; absolute-loss wording; or any after-fee, open-position, or account-return measure.

## `gross_pnl`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-003 |
| Category | Profit and Loss Metrics |
| Subcategory | gross |
| Canonical name | gross_pnl |
| Display name | Gross P&L |
| Exact definition | `gross_profit` plus `gross_loss` over eligible `ready_closed` Stock round trips in one selected trade-currency partition, before allocated charge costs or credits. |
| Distinction from related concepts | Combines positive and negative gross-P/L closed trades; it is not gross profit alone, gross loss alone, fee-covered net P/L, realized P/L with an unstated basis, unrealized P/L, or account return. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the value and remain visible only through coverage. |
| Fee handling | Before fees. No fee facts are required and gross P/L must not be reconstructed from net results. |
| Version | 1 |

### Related Concepts

- Broader concept: Realized closed-trade P/L when the declared basis is gross.
- Narrower concepts: `gross_profit` and `gross_loss`.
- Commonly confused concepts: `pnl_before_fees`, `net_pnl`, `pnl_after_fees`, `realized_pnl`, and unrealized P/L.
- Must not be merged with: `pnl_before_fees` as a second calculation or metric contribution; it remains a separate language-routing entry to this exact calculation. Also do not merge with `net_pnl`, `realized_pnl`, or an open-position/account-return measure.

## `net_pnl`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-004 |
| Category | Profit and Loss Metrics |
| Subcategory | net |
| Canonical name | net_pnl |
| Display name | Net P&L |
| Exact definition | Gross P/L minus allocated charge costs plus allocated charge credits over eligible `ready_closed` Stock round trips in one selected trade-currency partition, using complete supported fee facts, agreed fee currency, fee-sign policy, and conserving fee allocation. |
| Distinction from related concepts | Is after-fee P/L for a fee-covered closed population; it is not gross P/L, profit after an assumed fee estimate, realized P/L with an unstated basis, unrealized P/L, or account return. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the value and remain visible only through coverage. |
| Fee handling | Exact only for complete supported fee facts with the required currency/sign/allocation policy. Fee-incomplete or unsupported affected rows require an explicit partial or unavailable state; never estimate or reconstruct missing fees. |
| Version | 1 |

### Related Concepts

- Broader concept: Realized closed-trade P/L when the declared basis is net.
- Narrower concepts: Fee-covered positive and negative net-P/L trade contributions.
- Commonly confused concepts: `gross_pnl`, `pnl_after_fees`, `realized_pnl`, gross profit/loss, and unrealized P/L.
- Must not be merged with: `pnl_after_fees` as a second calculation or metric contribution; it remains a separate language-routing entry to this exact calculation. Also do not merge with `gross_pnl`, `realized_pnl`, or any result using estimated, partial-as-exact, or missing fee data.

## `realized_pnl`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-005 |
| Category | Profit and Loss Metrics |
| Subcategory | realized |
| Canonical name | realized_pnl |
| Display name | Realized P&L |
| Exact definition | P/L from eligible `ready_closed` Stock round trips in one selected trade-currency partition on a declared gross or net basis. Gross basis is before fees; net basis requires the complete supported fee facts and allocation policy defined for `net_pnl`. |
| Distinction from related concepts | Names the realized closed-trade population and requires an explicit gross or net basis; it is not a separate permission to choose a basis silently, gross P/L alone, net P/L alone, unrealized P/L, or account return. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount in the selected trade currency on the declared gross or net basis; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Legitimate-open, pending, excluded, and `needs-decision` rows never enter realized P/L and remain visible only through coverage. |
| Fee handling | Declared gross basis uses no fee facts. Declared net basis is exact only with complete supported fee facts; fee-incomplete or unsupported affected rows require an explicit partial or unavailable state, never an estimated result. |
| Version | 1 |

### Related Concepts

- Broader concept: Closed-trade P/L scope over the Journal round-trip population.
- Narrower concepts: Gross realized P/L and net realized P/L after an explicit basis declaration.
- Commonly confused concepts: `gross_pnl`, `net_pnl`, `pnl_before_fees`, `pnl_after_fees`, and unrealized P/L.
- Must not be merged with: `gross_pnl` or `net_pnl` because realized P/L has no implicit basis; unrealized P/L; or any value that includes legitimate-open or `needs-decision` rows.

## `unrealized_pnl`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-006 |
| Category | Profit and Loss Metrics |
| Subcategory | unrealized |
| Canonical name | unrealized_pnl |
| Display name | Unrealized P&L |
| Exact definition | The marked P/L on legitimate-open positions in one selected trade-currency partition, calculated from execution-derived open cost and an approved current market-price mark under an approved valuation policy. |
| Distinction from related concepts | Applies to legitimately open positions and requires a current approved mark; it is not realized P/L, gross/net P/L for `ready_closed` round trips, last-execution-price P/L, or account return. |
| Evidence classification | deterministically derived |
| Capability status | Unavailable |
| Result units | Monetary amount in the selected trade currency if supported; no silent cross-currency aggregation or conversion. |
| Open-trade support | Required, but unavailable: legitimate-open facts and execution-derived cost exist, while an approved current market-price mark is missing. Pending, excluded, and `needs-decision` rows are not treated as legitimate-open positions. |
| Fee handling | No fee estimate or reconstruction is permitted. Any future gross/net treatment must declare its fee basis and coverage; missing fees cannot be inferred. |
| Version | 1 |

### Related Concepts

- Broader concept: Position valuation and open-position performance.
- Narrower concepts: Marked gain and marked loss on a legitimate-open position after an approved current mark is available.
- Commonly confused concepts: `realized_pnl`, `gross_pnl`, `net_pnl`, entry cost, and last execution price.
- Must not be merged with: Any realized closed-trade metric; a cost-basis value; a stale or last-execution estimate; or an account-return measure.

## `total_return`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-007 |
| Category | Profit and Loss Metrics |
| Subcategory | account_return |
| Canonical name | total_return |
| Display name | Total return |
| Exact definition | Account-level return over a declared period and approved denominator, using approved account equity or balance history, external cash flows, distributions, and FX policy. It is not defined by realized trade P/L or entry notional alone. |
| Distinction from related concepts | Measures account-level return, not a trade-level percentage return, gross/net realized P/L, unrealized P/L, or a raw account-balance change that ignores deposits, withdrawals, distributions, or FX. |
| Evidence classification | deterministically derived |
| Capability status | Unavailable |
| Result units | Percentage return for one declared account scope, period, denominator, and approved FX policy. |
| Open-trade support | Not currently supported. A future account-level return contract would need to state whether and how current marked open-position value enters account equity; it cannot infer this from executions alone. |
| Fee handling | No fee estimate or reconstruction is permitted. Fees may affect a future account-return result only through approved account-equity/cash-flow facts and an explicit calculation policy. |
| Version | 1 |

### Related Concepts

- Broader concept: Account-level performance return.
- Narrower concepts: Period-specific total return under an approved account-equity, cash-flow, distribution, FX, and denominator contract.
- Commonly confused concepts: `average_percentage_return`, per-trade return on entry notional, `gross_pnl`, `net_pnl`, and account balance change.
- Must not be merged with: Realized trade P/L; unrealized P/L; any trade-level percentage-return metric; or a balance change that omits approved cash-flow, distribution, FX, and denominator treatment.

## `average_net_pnl_per_trade`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-008 |
| Category | Profit and Loss Metrics |
| Subcategory | distribution |
| Canonical name | average_net_pnl_per_trade |
| Display name | Average net P&L per trade |
| Exact definition | The exact arithmetic mean of `net_pnl` across eligible fee-covered `ready_closed` Stock round trips in one selected trade-currency partition: total eligible net P/L divided by the count of eligible fee-covered closed trades. |
| Distinction from related concepts | Is a per-trade net-P/L mean, not total net P/L, median net P/L, gross P/L, a percentage return, or an average that includes open, pending, excluded, or `needs-decision` rows. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount per eligible closed trade in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Only eligible fee-covered `ready_closed` trades form the denominator. Legitimate-open, pending, excluded, and `needs-decision` rows remain visible only through coverage. The result is unavailable when the eligible denominator is zero. |
| Fee handling | Net basis requires complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation. Fee-incomplete or unsupported affected rows require an explicit partial or unavailable state; never estimate or treat gross rows as fee-covered. |
| Version | 1 |

### Related Concepts

- Broader concept: Net realized P/L distribution over eligible closed trades.
- Narrower concepts: Eligible fee-covered trade-level net-P/L contributions and their closed-trade denominator.
- Commonly confused concepts: `net_pnl`, `median_net_pnl_per_trade`, average percentage return, gross P/L, and average winning/losing trade.
- Must not be merged with: `median_net_pnl_per_trade`; total `net_pnl`; a gross-basis average; any percentage-return average; or a result with a zero, incomplete, or mixed-currency denominator.

## `median_net_pnl_per_trade`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-009 |
| Category | Profit and Loss Metrics |
| Subcategory | distribution |
| Canonical name | median_net_pnl_per_trade |
| Display name | Median net P&L per trade |
| Exact definition | The exact sorted median of trade-level `net_pnl` over eligible fee-covered `ready_closed` Stock round trips in one selected trade-currency partition. For an even eligible count, it is the exact arithmetic mean of the two middle sorted net-P/L values. |
| Distinction from related concepts | Is the middle net-P/L value by sorted trade-level distribution, not the arithmetic mean, total net P/L, gross P/L, a percentage return, or a value based on open or unresolved rows. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount per eligible closed trade in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Only eligible fee-covered `ready_closed` trades form the sorted population. Legitimate-open, pending, excluded, and `needs-decision` rows remain visible only through coverage. The result is unavailable when the eligible population is empty. |
| Fee handling | Net basis requires complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation. Fee-incomplete or unsupported affected rows require an explicit partial or unavailable state; never estimate or treat gross rows as fee-covered. |
| Version | 1 |

### Related Concepts

- Broader concept: Net realized P/L distribution over eligible closed trades.
- Narrower concepts: The middle eligible net-P/L trade value, or the exact mean of the two middle values for an even population.
- Commonly confused concepts: `average_net_pnl_per_trade`, `net_pnl`, median percentage return, gross P/L, and median winning/losing trade.
- Must not be merged with: `average_net_pnl_per_trade`; total `net_pnl`; a gross-basis median; any percentage-return median; or a result with an empty, incomplete, or mixed-currency population.

## `average_percentage_return`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-010 |
| Category | Profit and Loss Metrics |
| Subcategory | normalized_return |
| Canonical name | average_percentage_return |
| Display name | Average percentage return |
| Exact definition | The arithmetic mean of an explicitly defined per-trade percentage-return value over an eligible closed-trade population, using an approved per-trade denominator and an approved aggregate distribution/coverage contract. No such named public capability is currently exposed. |
| Distinction from related concepts | Is a trade-level percentage-return average with an explicit denominator, not account-level `total_return`, net-P/L average, gross/net P/L, entry-notional return without an approved definition, or a percentage inferred from account base currency. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Percentage per eligible closed trade, once an approved per-trade denominator, aggregation, currency, and coverage contract is exposed. |
| Open-trade support | Not currently supported. A future contract must declare the eligible closed population; legitimate-open, pending, excluded, and `needs-decision` rows cannot be included by inference. |
| Fee handling | A future contract must declare gross or net P/L basis. Net basis requires complete supported fee facts and an explicit partial/unavailable policy; no missing-fee estimate is permitted. |
| Version | 1 |

### Related Concepts

- Broader concept: Trade-level normalized-return distribution.
- Narrower concepts: Per-trade percentage return under a declared P/L basis and approved denominator, then its arithmetic mean.
- Commonly confused concepts: `total_return`, `average_net_pnl_per_trade`, entry-notional return, percentage account-balance change, and `median_percentage_return`.
- Must not be merged with: `total_return`; monetary P/L averages; a percentage calculated with an implicit denominator; a gross/net basis selected silently; or a V3, sample, guessed, or unsupported fallback.

## `median_percentage_return`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-011 |
| Category | Profit and Loss Metrics |
| Subcategory | normalized_return |
| Canonical name | median_percentage_return |
| Display name | Median percentage return |
| Exact definition | The median of an explicitly defined per-trade percentage-return value over an eligible closed-trade population, using an approved per-trade denominator and an approved median distribution/coverage contract. No such named public capability is currently exposed. |
| Distinction from related concepts | Is the middle trade-level percentage-return value under an explicit denominator, not an arithmetic average, account-level `total_return`, gross/net P/L, entry-notional return without an approved definition, or a percentage inferred from account base currency. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Percentage per eligible closed trade, once an approved per-trade denominator, median rule, currency, and coverage contract is exposed. |
| Open-trade support | Not currently supported. A future contract must declare the eligible closed population; legitimate-open, pending, excluded, and `needs-decision` rows cannot be included by inference. |
| Fee handling | A future contract must declare gross or net P/L basis. Net basis requires complete supported fee facts and an explicit partial/unavailable policy; no missing-fee estimate is permitted. |
| Version | 1 |

### Related Concepts

- Broader concept: Trade-level normalized-return distribution.
- Narrower concepts: Per-trade percentage return under a declared P/L basis and approved denominator, then its median.
- Commonly confused concepts: `average_percentage_return`, `total_return`, `median_net_pnl_per_trade`, entry-notional return, and percentage account-balance change.
- Must not be merged with: `average_percentage_return`; `total_return`; monetary P/L medians; a percentage calculated with an implicit denominator; a gross/net basis selected silently; or a V3, sample, guessed, or unsupported fallback.

## `largest_win`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-012 |
| Category | Profit and Loss Metrics |
| Subcategory | extrema |
| Canonical name | largest_win |
| Display name | Largest win |
| Exact definition | The maximum positive selected-basis P/L of an eligible `ready_closed` Stock round trip in one selected trade-currency partition. Gross or net basis must be declared. Ties use the deterministic best-trade close-time, then stable-ID, policy. |
| Distinction from related concepts | Is one positive closed-trade P/L extreme on a declared basis, not gross profit total, net P/L total, largest loss, best percentage return, an open-position gain, or a conclusion about why the trade won. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact positive monetary amount in the selected trade currency on the declared gross or net basis; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Only eligible `ready_closed` trades participate. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the ranking and remain visible only through coverage. |
| Fee handling | Declared gross basis uses no fee facts. Declared net basis requires complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation; fee-incomplete or unsupported affected rows require an explicit partial or unavailable state. |
| Version | 1 |

### Related Concepts

- Broader concept: Selected-basis realized closed-trade P/L extrema.
- Narrower concepts: The deterministic first-ranked positive P/L trade under the declared basis and tie policy.
- Commonly confused concepts: `gross_profit`, `net_pnl`, `largest_loss`, `best_trade`, and highest percentage return.
- Must not be merged with: `gross_profit`; an undeclared-basis best trade; a percentage-return ranking; an open-position gain; or any causal explanation, trade-quality judgment, or recommendation.

## `largest_loss`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-013 |
| Category | Profit and Loss Metrics |
| Subcategory | extrema |
| Canonical name | largest_loss |
| Display name | Largest loss |
| Exact definition | The most negative selected-basis P/L of an eligible `ready_closed` Stock round trip in one selected trade-currency partition. Gross or net basis must be declared. Ties use the deterministic worst-trade close-time, then stable-ID, policy. |
| Distinction from related concepts | Is one negative closed-trade P/L extreme on a declared basis, not gross loss total, net P/L total, largest win, a maximum percentage drawdown, an open-position loss, or a conclusion about why the trade lost. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact negative monetary amount in the selected trade currency on the declared gross or net basis; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Only eligible `ready_closed` trades participate. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the ranking and remain visible only through coverage. |
| Fee handling | Declared gross basis uses no fee facts. Declared net basis requires complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation; fee-incomplete or unsupported affected rows require an explicit partial or unavailable state. |
| Version | 1 |

### Related Concepts

- Broader concept: Selected-basis realized closed-trade P/L extrema.
- Narrower concepts: The deterministic first-ranked negative P/L trade under the declared basis and tie policy.
- Commonly confused concepts: `gross_loss`, `net_pnl`, `largest_win`, `worst_trade`, and maximum percentage drawdown.
- Must not be merged with: `gross_loss`; an undeclared-basis worst trade; a percentage-return or drawdown ranking; an open-position loss; or any causal explanation, trade-quality judgment, or recommendation.

## `average_winning_trade`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-014 |
| Category | Profit and Loss Metrics |
| Subcategory | outcome_partition |
| Canonical name | average_winning_trade |
| Display name | Average winning trade |
| Exact definition | The exact arithmetic mean of positive selected-basis P/L across eligible `ready_closed` Stock round trips in one selected trade-currency partition: total positive selected-basis P/L divided by the count of qualifying positive closed trades. Gross or net basis must be declared. |
| Distinction from related concepts | Averages only positive closed trades on a declared basis; it is not overall average P/L, average losing trade, gross profit total, win rate, a percentage-return average, or evidence that a trading behavior caused wins. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact positive monetary amount per qualifying closed trade in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Only positive eligible `ready_closed` trades form the denominator. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the population and remain visible only through coverage. The result is unavailable when no qualifying winning population exists. |
| Fee handling | Declared gross basis uses no fee facts. Declared net basis requires complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation; fee-incomplete or unsupported affected rows require an explicit partial or unavailable state. |
| Version | 1 |

### Related Concepts

- Broader concept: Selected-basis realized P/L outcome partition over eligible closed trades.
- Narrower concepts: Positive selected-basis P/L trade contributions and their qualifying closed-trade denominator.
- Commonly confused concepts: `average_losing_trade`, `average_net_pnl_per_trade`, `gross_profit`, win rate, and average percentage return.
- Must not be merged with: `average_losing_trade`; overall average P/L; a gross/net basis selected silently; a zero-denominator result; or any causal, quality, or recommendation claim.

## `average_losing_trade`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-015 |
| Category | Profit and Loss Metrics |
| Subcategory | outcome_partition |
| Canonical name | average_losing_trade |
| Display name | Average losing trade |
| Exact definition | The exact arithmetic mean of negative selected-basis P/L across eligible `ready_closed` Stock round trips in one selected trade-currency partition: total negative selected-basis P/L divided by the count of qualifying negative closed trades. Gross or net basis must be declared. |
| Distinction from related concepts | Averages only negative closed trades on a declared basis and retains the negative result; it is not overall average P/L, average winning trade, gross loss total, loss rate, a percentage-return average, or evidence that a trading behavior caused losses. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact negative monetary amount per qualifying closed trade in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Only negative eligible `ready_closed` trades form the denominator. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the population and remain visible only through coverage. The result is unavailable when no qualifying losing population exists. |
| Fee handling | Declared gross basis uses no fee facts. Declared net basis requires complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation; fee-incomplete or unsupported affected rows require an explicit partial or unavailable state. |
| Version | 1 |

### Related Concepts

- Broader concept: Selected-basis realized P/L outcome partition over eligible closed trades.
- Narrower concepts: Negative selected-basis P/L trade contributions and their qualifying closed-trade denominator.
- Commonly confused concepts: `average_winning_trade`, `average_net_pnl_per_trade`, `gross_loss`, loss rate, and average percentage return.
- Must not be merged with: `average_winning_trade`; overall average P/L; a gross/net basis selected silently; a zero-denominator result; or any causal, quality, or recommendation claim.

## `average_daily_pnl`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-016 |
| Category | Profit and Loss Metrics |
| Subcategory | calendar_aggregation |
| Canonical name | average_daily_pnl |
| Display name | Average daily P&L |
| Exact definition | The exact arithmetic mean of daily realized P/L values over eligible realized trading days in one selected trade-currency partition. Each eligible `ready_closed` Stock round trip is attributed to its closing trading date in the account IANA timezone; gross or net basis must be declared. |
| Distinction from related concepts | Is an average of realized daily P/L buckets, not total P/L divided by all calendar days, average P/L per trade, weekly/monthly P/L, unrealized P/L, or a claim that a date caused performance. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount per eligible realized trading day in the selected trade currency; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Only eligible `ready_closed` trades create daily realized P/L. The denominator includes only days with at least one eligible realized closed trade; no-trade days are excluded rather than zero-filled. Legitimate-open, pending, excluded, and `needs-decision` rows remain visible only through coverage. |
| Fee handling | Declared gross basis uses no fee facts. Declared net basis requires complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation; fee-incomplete or unsupported affected rows require an explicit partial or unavailable state. |
| Version | 1 |

### Related Concepts

- Broader concept: Time-bucketed selected-basis realized closed-trade P/L.
- Narrower concepts: Daily realized P/L by account-timezone closing date and the eligible realized-day denominator.
- Commonly confused concepts: `average_net_pnl_per_trade`, `average_weekly_pnl`, `average_monthly_pnl`, total P/L divided by calendar days, and unrealized P/L.
- Must not be merged with: Per-trade averages; a zero-filled all-calendar-days average; weekly/monthly averages; a gross/net basis selected silently; or any causal, quality, or recommendation claim.

## `average_weekly_pnl`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-017 |
| Category | Profit and Loss Metrics |
| Subcategory | calendar_aggregation |
| Canonical name | average_weekly_pnl |
| Display name | Average weekly P&L |
| Exact definition | The arithmetic mean of weekly realized P/L values over an eligible closed-trade population grouped by closing ISO week in the account IANA timezone, on a declared gross or net basis. Closing ISO-week grouping exists, but the named average and empty-week/calendar contract are not exposed. |
| Distinction from related concepts | Is a planned average across weekly P/L buckets, not average daily P/L, total P/L divided by calendar weeks, per-trade average P/L, monthly P/L, or an inferred performance trend. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Monetary amount per eligible ISO week in the selected trade currency, once the average, calendar, currency, and coverage contract is exposed. |
| Open-trade support | Not currently supported. A future contract must define the eligible `ready_closed` population and whether no-trade ISO weeks are excluded or zero-filled; legitimate-open, pending, excluded, and `needs-decision` rows cannot be included by inference. |
| Fee handling | A future contract must declare gross or net P/L basis. Net basis requires complete supported fee facts and an explicit partial/unavailable policy; no missing-fee estimate is permitted. |
| Version | 1 |

### Related Concepts

- Broader concept: Time-bucketed selected-basis realized closed-trade P/L.
- Narrower concepts: Closing ISO-week P/L buckets and their approved eligible-week denominator.
- Commonly confused concepts: `average_daily_pnl`, `average_monthly_pnl`, total P/L divided by calendar weeks, and average P/L per trade.
- Must not be merged with: `average_daily_pnl`; `average_monthly_pnl`; a zero-filled or excluded-empty-week policy selected silently; a gross/net basis selected silently; or a V3, sample, guessed, or unsupported fallback.

## `average_monthly_pnl`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-018 |
| Category | Profit and Loss Metrics |
| Subcategory | calendar_aggregation |
| Canonical name | average_monthly_pnl |
| Display name | Average monthly P&L |
| Exact definition | The arithmetic mean of monthly realized P/L values over an eligible closed-trade population grouped by closing month in the account IANA timezone, on a declared gross or net basis. Closing-month grouping exists, but the named average and empty-month/calendar contract are not exposed. |
| Distinction from related concepts | Is a planned average across monthly P/L buckets, not average daily/weekly P/L, total P/L divided by calendar months, per-trade average P/L, or an inferred performance trend. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Monetary amount per eligible closing month in the selected trade currency, once the average, calendar, currency, and coverage contract is exposed. |
| Open-trade support | Not currently supported. A future contract must define the eligible `ready_closed` population and whether no-trade months are excluded or zero-filled; legitimate-open, pending, excluded, and `needs-decision` rows cannot be included by inference. |
| Fee handling | A future contract must declare gross or net P/L basis. Net basis requires complete supported fee facts and an explicit partial/unavailable policy; no missing-fee estimate is permitted. |
| Version | 1 |

### Related Concepts

- Broader concept: Time-bucketed selected-basis realized closed-trade P/L.
- Narrower concepts: Closing-month P/L buckets and their approved eligible-month denominator.
- Commonly confused concepts: `average_daily_pnl`, `average_weekly_pnl`, total P/L divided by calendar months, and average P/L per trade.
- Must not be merged with: `average_daily_pnl`; `average_weekly_pnl`; a zero-filled or excluded-empty-month policy selected silently; a gross/net basis selected silently; or a V3, sample, guessed, or unsupported fallback.

## `profit_per_share`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-019 |
| Category | Profit and Loss Metrics |
| Subcategory | unit_normalized |
| Canonical name | profit_per_share |
| Display name | Profit per share |
| Exact definition | A per-share selected-basis P/L measure requiring an approved formula that divides eligible closed-trade P/L by an exact, reconciling share-quantity denominator. Exact entered-quantity facts exist, but the per-share formula, fee basis, and public capability are not defined. |
| Distinction from related concepts | Is a planned money-per-share measure, not total P/L, percentage return, account return, or `net_pnl_per_100_shares`, which is a distinct compatibility metric with different units. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Monetary amount per share in the selected trade currency, once an approved numerator, share denominator, basis, currency, and coverage contract is exposed. |
| Open-trade support | Not currently supported. A future contract must declare the eligible `ready_closed` population and exact quantity reconciliation; legitimate-open, pending, excluded, and `needs-decision` rows cannot be included by inference. |
| Fee handling | A future contract must declare gross or net P/L basis. Net basis requires complete supported fee facts and an explicit partial/unavailable policy; no missing-fee estimate is permitted. |
| Version | 1 |

### Related Concepts

- Broader concept: Quantity-normalized selected-basis realized P/L.
- Narrower concepts: Approved selected-basis P/L numerator and exact reconciling share-quantity denominator.
- Commonly confused concepts: `net_pnl_per_100_shares`, percentage return, `net_pnl`, `gross_pnl`, and total return.
- Must not be merged with: `net_pnl_per_100_shares`; a percentage-return metric; an implicit or non-reconciling quantity denominator; a gross/net basis selected silently; or a V3, sample, guessed, or unsupported fallback.

## `pnl_by_direction`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-020 |
| Category | Profit and Loss Metrics |
| Subcategory | directional_grouping |
| Canonical name | pnl_by_direction |
| Display name | P&L by direction |
| Exact definition | A selected-basis P/L metric grouped by the directly observed Journal direction dimension over eligible `ready_closed` Stock round trips in one selected trade-currency partition. Gross or net basis must be declared; Category 11 owns the definition of direction. |
| Distinction from related concepts | Is a grouping of P/L by observed direction, not a new direction definition, a trade recommendation, a causal explanation, or a comparison that silently mixes gross/net basis, currencies, or open/unresolved rows. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount per directly observed direction group in the selected trade currency on the declared gross or net basis; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. Only eligible `ready_closed` trades are grouped. Legitimate-open, pending, excluded, and `needs-decision` rows are outside the values and remain visible only through coverage. |
| Fee handling | Declared gross basis uses no fee facts. Declared net basis requires complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation; fee-incomplete or unsupported affected rows require an explicit partial or unavailable state. |
| Version | 1 |

### Related Concepts

- Broader concept: Selected-basis realized closed-trade P/L grouped by an owned dimension.
- Narrower concepts: Long and short P/L groups only where Category 11's directly observed direction vocabulary authorizes them.
- Commonly confused concepts: `gross_pnl`, `net_pnl`, direction performance comparisons, win rate by direction, and a recommendation to trade a direction.
- Must not be merged with: Category 11 direction definitions; an ungrouped total P/L metric; a gross/net basis selected silently; cross-currency groups; or any causal, quality, or recommendation claim.

## `pnl_before_fees`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-021 |
| Category | Profit and Loss Metrics |
| Subcategory | fee_basis_alias |
| Canonical name | pnl_before_fees |
| Display name | P&L before fees |
| Exact definition | A separate plan-listed language-routing entry that routes to the exact `gross_pnl` deterministic calculation: gross P/L over eligible `ready_closed` Stock round trips in one selected trade-currency partition before allocated charge costs or credits. |
| Distinction from related concepts | Uses before-fee wording to select the exact gross-P/L calculation; it remains a language-routing entry, not a second calculation, metric contribution, net-P/L result, unrealized P/L, or account return. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount in the selected trade currency, identical to the routed `gross_pnl` calculation; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. The routed `gross_pnl` calculation includes only eligible `ready_closed` trades. Legitimate-open, pending, excluded, and `needs-decision` rows remain visible only through coverage. |
| Fee handling | Before fees. No fee facts are required; never reconstruct gross P/L from net results. |
| Version | 1 |

### Related Concepts

- Broader concept: Gross realized closed-trade P/L language routing.
- Narrower concepts: Before-fee wording that routes to the single exact `gross_pnl` calculation.
- Commonly confused concepts: `gross_pnl`, `net_pnl`, `pnl_after_fees`, `realized_pnl`, and gross profit/loss.
- Must not be merged with: A second `gross_pnl` calculation or metric contribution. This plan-listed language-routing record must never create duplicate calculations or double-counted metrics; it also must not be treated as net or unrealized P/L.

## `pnl_after_fees`

| Field | Value |
|---|---|
| Inventory ID | C2-PNL-022 |
| Category | Profit and Loss Metrics |
| Subcategory | fee_basis_alias |
| Canonical name | pnl_after_fees |
| Display name | P&L after fees |
| Exact definition | A separate plan-listed language-routing entry that routes to the exact `net_pnl` deterministic calculation: gross P/L minus allocated charge costs plus allocated charge credits over eligible fee-covered `ready_closed` Stock round trips in one selected trade-currency partition. |
| Distinction from related concepts | Uses after-fee wording to select the exact net-P/L calculation; it remains a language-routing entry, not a second calculation, metric contribution, gross-P/L result, unrealized P/L, or account return. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact monetary amount in the selected trade currency, identical to the routed `net_pnl` calculation; no silent cross-currency aggregation or conversion. |
| Open-trade support | No. The routed `net_pnl` calculation includes only eligible fee-covered `ready_closed` trades. Legitimate-open, pending, excluded, and `needs-decision` rows remain visible only through coverage. |
| Fee handling | Exact only with complete supported fee facts, agreed fee currency, fee-sign policy, and conserving allocation. Fee-incomplete or unsupported affected rows require an explicit partial or unavailable state; never estimate or reconstruct missing fees. |
| Version | 1 |

### Related Concepts

- Broader concept: Net realized closed-trade P/L language routing.
- Narrower concepts: After-fee wording that routes to the single exact `net_pnl` calculation.
- Commonly confused concepts: `net_pnl`, `gross_pnl`, `pnl_before_fees`, `realized_pnl`, and gross profit/loss.
- Must not be merged with: A second `net_pnl` calculation or metric contribution. This plan-listed language-routing record must never create duplicate calculations or double-counted metrics; it also must not be treated as gross or unrealized P/L.

Canonical record count: **22 of 22**. All canonical records are approved and
locked at version 1, and Category 2 is Complete.

---

# 6. Language Registry Deliverable

Production batches 1 through 10 complete all 22 registry entries in the controlling
inventory. These records are approved and locked at version 1; they do not
authorize an AI Chat runtime.

## `gross_profit` Language Registry

### Exact Definition

Sum positive gross P/L from eligible `ready_closed` Stock round trips in one selected trade-currency partition, before charges or credits.

### Formal Wording

- Gross profit; aggregate positive pre-fee realized P/L; positive gross closed-trade P/L.

### Normal Conversational Wording

- How much did my winning trades make before fees?; show the gross profit for this month.

### Trader Slang

- Winner dollars before commissions; green trade money before fees.

### Abbreviations

- `GP` may map only when surrounding language clearly establishes gross profit; a bare `GP` remains a symbol/ticker candidate and must not auto-route. Bare `PL` is not an abbreviation for this metric because it is ticker-shaped and unsafe.

### Common Misspellings

- Gros profit; gross profitt; gross profet.

### Noisy or Incomplete Input

- gross profit wk; winners before fees; gp last 5.

### Singular and Plural Forms

- Gross profit; gross profits. Plural does not mean a count of winning trades.

### Full Questions

- What was my gross profit on closed trades last week?; How much positive P/L did I make before fees in USD?

### Commands

- Show gross profit for NVDA in July; calculate my pre-fee winner total.

### Sentence Fragments

- Before-fee winners; gross profit by day.

### Follow-Up Wording

- Now show that just for shorts; what about the prior week?

### Correction Wording

- I meant gross profit, not net P&L; use only closed trades.

### Comparison Wording

- Compare gross profit this month with last month; which week had more gross profit?

### Ranking Wording

- Rank my tickers by gross profit; show the days with the most pre-fee winner dollars.

### Negated Wording

- Do not use net P&L; not including fees; do not include open trades.

### Exclusion Wording

- Exclude TSLA; leave out trades that need a decision.

### Multi-Filter Wording

- Gross profit for long NVDA trades in July, excluding trades that need a decision.

### Multi-Part Question Wording

- Show gross profit for July and compare it with June; then list the winning trades.

### Ambiguous Wording

- Profit; winner money; `PL`. Ask whether gross or net is intended; bare `PL` must remain ticker-safe.

### Negative Examples

These examples must not map to this concept.

- What is my net P&L after fees?; what is the unrealized gain on my open trade?; predict whether this ticker will profit tomorrow.

### Context Requirements

- Server-authorized account scope is required. A current date, ticker, direction, or selected-trade context may narrow the query, but cannot change gross to net or include open rows.

### Required Data

- Authorized account scope; selected trade-currency partition; active eligible `ready_closed` Stock round trips; exact allocations, prices, quantities, closing dates, and coverage state.

### Optional Data

- Declared date range, ticker, Category 11 direction filter, selected trade, and account-timezone display grouping.

### Valid Filters

- Account scope enforced server-side; date range; ticker/symbol; eligible closed-trade scope; selected trade; and an approved directly observed direction filter.

### Valid Groupings

- Approved closing-date buckets, ticker, and Category 11 direction where the deterministic query exposes them; no cross-currency aggregate.

### Valid Operators

- Sum; approved comparison and ranking operations over separately defined candidate populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Net/after-fee basis; legitimate-open positions; missing server account scope; cross-currency total without approved FX; causal, predictive, or trade-advice requests.

### Default Interpretation

- When gross profit is explicit, use one server-authorized account scope, one trade currency, and eligible `ready_closed` trades. Do not default a bare “profit” request to gross.

### Clarification Conditions

- Clarify a bare profit/basis request, an unspecified currency when multiple partitions apply, or an ambiguous period before calculating.

### Recommended Clarification Wording

- Do you want gross profit before fees or net P&L after fees?

### Unsupported Conditions

- No eligible closed population, approved FX conversion, or any request to estimate from V3, samples, open positions, or missing evidence.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService` through `journal_analytics_query_v1` and `journal_analytics_metrics_v1`, using exact Journal Analytics Fact Set allocations.

### Result Units

- Exact monetary amount in one selected trade currency, with coverage and limitations returned beside the value.

### Fee Handling

- Before-fee result: fees are not required and gross profit is never reconstructed from net P/L.

### Open-Trade Handling

- Exclude legitimate-open, pending, excluded, and `needs-decision` rows from the value; report their coverage rather than treating them as zero.

### Sample-Size Considerations

- Return eligible closed-trade count and coverage. A zero eligible population is empty/unavailable, not zero gross profit.

## `gross_loss` Language Registry

### Exact Definition

Sum negative gross P/L from eligible `ready_closed` Stock round trips in one selected trade-currency partition, retained as a negative value before charges or credits.

### Formal Wording

- Gross loss; aggregate negative pre-fee realized P/L; negative gross closed-trade P/L.

### Normal Conversational Wording

- How much did my losing trades lose before fees?; show my gross losses this month.

### Trader Slang

- Loser dollars before commissions; red trade money before fees.

### Abbreviations

- `GL` may map only when surrounding language clearly establishes gross loss; a bare `GL` remains a symbol/ticker candidate and must not auto-route. Bare `PL` is ticker-shaped and must not route here.

### Common Misspellings

- Gros loss; gross losse; gross los.

### Noisy or Incomplete Input

- gross loss wk; losers before fees; gl this month.

### Singular and Plural Forms

- Gross loss; gross losses. Plural is still a monetary total, not the number of losses.

### Full Questions

- What was my gross loss on closed trades last week?; How much negative P/L did I take before fees?

### Commands

- Show gross losses for AMD in June; calculate my pre-fee loss total.

### Sentence Fragments

- Before-fee losers; gross loss by ticker.

### Follow-Up Wording

- Only the short losses; show the previous month too.

### Correction Wording

- I mean gross loss, not largest loss; keep the loss value negative.

### Comparison Wording

- Compare gross losses in June and July; which ticker had the most negative gross loss?

### Ranking Wording

- Rank symbols by gross loss; show my biggest aggregate loser days before fees.

### Negated Wording

- Do not convert losses to positive numbers; not after fees; do not include open trades.

### Exclusion Wording

- Exclude SPY trades; leave out unresolved rows.

### Multi-Filter Wording

- Gross loss for short small-cap trades in June, excluding SPY and unresolved trades.

### Multi-Part Question Wording

- Show my gross loss for June and compare it with May; then show the losing trades.

### Ambiguous Wording

- Losses; red money; `PL`. Clarify gross versus net and aggregate loss versus largest individual loss.

### Negative Examples

These examples must not map to this concept.

- What was my largest loss?; show net P&L after fees; what is my open-position loss right now?

### Context Requirements

- Server-authorized account scope is required. Date, symbol, direction, or selected-trade context can narrow the population, but cannot silently change loss sign, fee basis, or state.

### Required Data

- Authorized account scope; selected trade currency; active eligible `ready_closed` Stock round trips; exact allocations and coverage state.

### Optional Data

- Date range, ticker, directly observed direction filter, selected trade, and account-timezone display grouping.

### Valid Filters

- Server-enforced account scope; date range; ticker/symbol; eligible closed-trade scope; selected trade; and approved direction filter.

### Valid Groupings

- Approved closing-date buckets, ticker, and Category 11 direction; keep each currency partition separate.

### Valid Operators

- Sum; approved comparisons and rankings with explicit candidate populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Absolute-value loss unless explicitly defined elsewhere; net/after-fee basis; legitimate-open rows; cross-currency total without FX; causal, predictive, or advice claims.

### Default Interpretation

- When gross loss is explicit, return the negative aggregate for eligible `ready_closed` trades in one currency. Do not treat “loss” as largest loss or net loss by default.

### Clarification Conditions

- Clarify gross versus net, aggregate versus largest loss, ambiguous currency, or ambiguous time window.

### Recommended Clarification Wording

- Do you want total gross loss before fees or your single largest losing trade?

### Unsupported Conditions

- Empty eligible population, approved FX conversion, absolute-value reconstruction, or any V3/sample/guessed/open-position fallback.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService` via `journal_analytics_query_v1` and `journal_analytics_metrics_v1` with exact closed-trade allocations.

### Result Units

- Exact negative monetary amount in one selected trade currency, with coverage and limitations.

### Fee Handling

- Before-fee result: no fee facts are required and gross loss is never reconstructed from net P/L.

### Open-Trade Handling

- Exclude legitimate-open, pending, excluded, and `needs-decision` rows; show coverage instead of folding them into loss.

### Sample-Size Considerations

- Return qualifying closed-trade count and coverage. No qualifying negative trades is an empty population, not a zero or invented loss.

## `gross_pnl` Language Registry

### Exact Definition

`gross_profit` plus `gross_loss` over eligible `ready_closed` Stock round trips in one selected trade-currency partition, before charges or credits.

### Formal Wording

- Gross P&L; pre-fee realized P/L; netted positive and negative gross closed-trade P/L.

### Normal Conversational Wording

- What was my P&L before fees?; show gross P&L for this week.

### Trader Slang

- Pre-commish P&L; before-fee damage and gains; raw P&L.

### Abbreviations

- Gross P&L; GP&L. Bare `PL` remains unsafe because it can be a ticker.

### Common Misspellings

- Gross pnl; gross p&l; gros PL.

### Noisy or Incomplete Input

- gross pnl july; raw p&l; before fees nvda.

### Singular and Plural Forms

- Gross P&L; gross P&Ls by ticker. A plural grouping does not permit combined currencies.

### Full Questions

- What was my gross P&L last month?; Did I make or lose money before fees on closed trades?

### Commands

- Show pre-fee P&L by day; calculate gross P&L for my AMD trades.

### Sentence Fragments

- Raw P&L; gross before fees; July gross.

### Follow-Up Wording

- Split that by long and short; compare it to June.

### Correction Wording

- Use gross P&L, not gross profit; include both winners and losers.

### Comparison Wording

- Compare gross P&L for June versus July; did gross P&L improve before fees?

### Ranking Wording

- Rank tickers by gross P&L; show the best gross-P&L weeks.

### Negated Wording

- Not net; do not subtract fees; do not count open positions.

### Exclusion Wording

- Exclude trades needing a decision; leave out AAPL.

### Multi-Filter Wording

- Gross P&L for long NVDA trades in July, excluding trades that need a decision.

### Multi-Part Question Wording

- Show gross P&L for July, compare it with June, and list the contributing trades.

### Ambiguous Wording

- P&L; profit; raw. Clarify gross versus net when wording does not establish before-fee basis; bare `PL` stays ticker-safe.

### Negative Examples

These examples must not map to this concept.

- What is net P&L after fees?; how much gross profit came only from winners?; what is my account return?

### Context Requirements

- Server-authorized account scope is required. Prior gross basis may be retained only when the user continues the same factual query; selected ticker/date context narrows, not redefines, the metric.

### Required Data

- Authorized account scope, one trade currency, eligible `ready_closed` Stock round trips, exact allocations, and coverage/Data Decision state.

### Optional Data

- Date range, ticker, observed direction, closing-date grouping, and selected closed trade.

### Valid Filters

- Server-enforced account scope; date range; ticker/symbol; eligible closed-trade scope; selected trade; approved direction filter.

### Valid Groupings

- Ticker, account-timezone closing-date buckets, and Category 11 direction where supported; no silent currency merge.

### Valid Operators

- Sum; approved comparison, ranking, and grouping operations with explicit populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Net/after-fee output; gross-profit-only outcome partition; legitimate-open rows; account return; missing scope; causal, predictive, or advice assertions.

### Default Interpretation

- “Gross P&L” and “before fees” route to this gross calculation for eligible closed trades in one currency. A bare “P&L” has no safe gross/net default.

### Clarification Conditions

- Clarify bare P&L/profit basis, multi-currency scope, or missing time range when it materially changes the answer.

### Recommended Clarification Wording

- Do you want gross P&L before fees or net P&L after fees?

### Unsupported Conditions

- FX-less cross-currency totals, empty eligible population, or a request to fill gaps with V3, sample, zero, guessed, or open-position values.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService`, `journal_analytics_query_v1`, and `journal_analytics_metrics_v1` on the exact Journal Analytics Fact Set.

### Result Units

- Exact monetary amount in the selected trade currency with population coverage and limitations.

### Fee Handling

- Before fees: do not require, estimate, subtract, or reconstruct fees.

### Open-Trade Handling

- Value includes only eligible `ready_closed` rows; legitimate-open, pending, excluded, and `needs-decision` rows are reported as coverage.

### Sample-Size Considerations

- Return eligible closed-trade count. An empty population is empty/unavailable rather than a fabricated zero P&L.

## `net_pnl` Language Registry

### Exact Definition

Gross P/L minus allocated charge costs plus allocated charge credits over eligible fee-covered `ready_closed` Stock round trips in one selected trade-currency partition.

### Formal Wording

- Net P&L; after-fee realized P/L; realized P/L after allocated charges and credits.

### Normal Conversational Wording

- What did I make after fees?; show my net P&L for this month.

### Trader Slang

- After commish P&L; what I actually kept; post-fee number.

### Abbreviations

- Net P&L; NP&L. Bare `PL` is not a safe net-P&L shortcut.

### Common Misspellings

- Net pnl; nett p&l; net proffit.

### Noisy or Incomplete Input

- after fee pnl; net july; what i kept.

### Singular and Plural Forms

- Net P&L; net P&Ls by symbol. Plural views still require one currency per result partition.

### Full Questions

- What was my net P&L after fees last week?; How much did I actually keep on closed trades?

### Commands

- Show net P&L for TSLA in June; calculate after-fee P&L by day.

### Sentence Fragments

- After commissions; net this week; actual keep.

### Follow-Up Wording

- Use the after-fee number instead; which direction was net positive?

### Correction Wording

- I meant net P&L, not gross; include allocated fee credits too.

### Comparison Wording

- Compare net P&L this month against last month; was net P&L higher after fees?

### Ranking Wording

- Rank my symbols by net P&L; show the best after-fee days.

### Negated Wording

- Do not show gross P&L; not before fees; do not estimate missing commissions.

### Exclusion Wording

- Exclude fee-incomplete trades; leave out unresolved rows.

### Multi-Filter Wording

- Net P&L for long NVDA trades in July, excluding fee-incomplete and unresolved trades.

### Multi-Part Question Wording

- Show net P&L for July, compare it with gross P&L, and list the fee coverage limits.

### Ambiguous Wording

- Profit; P&L; what I made. Clarify gross versus net unless after-fee language or preserved factual context establishes net; bare `PL` stays ticker-safe.

### Negative Examples

These examples must not map to this concept.

- Show gross P&L before fees; what is my unrealized gain?; estimate fees that are missing.

### Context Requirements

- Server-authorized account scope and fee coverage state are required. Prior net basis can continue only within the same factual context; no context can turn missing fee evidence into exact net P/L.

### Required Data

- Authorized account scope; selected trade currency; eligible `ready_closed` Stock round trips; complete supported charge facts; fee currency, sign policy, conserving allocation, and coverage state.

### Optional Data

- Date range, ticker, observed direction, selected trade, closing-date grouping, and a request to display fee limitations.

### Valid Filters

- Server-enforced account scope; date range; ticker/symbol; eligible fee-covered closed-trade scope; selected trade; approved direction filter.

### Valid Groupings

- Ticker, account-timezone closing-date buckets, and Category 11 direction where supported; currency partitions remain separate.

### Valid Operators

- Sum; approved grouping, comparison, and ranking operations that retain fee coverage state.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Gross/before-fee basis; fee estimates; fee-incomplete rows presented as exact; legitimate-open rows; cross-currency total without FX; causal, predictive, or advice claims.

### Default Interpretation

- Explicit net/after-fee wording selects net P&L over fee-covered eligible closed trades in one currency. Bare profit or P&L has no safe net default.

### Clarification Conditions

- Clarify gross versus net when absent, then clarify currency or period if needed. Explain partial/unavailable fee coverage rather than silently dropping or estimating affected rows.

### Recommended Clarification Wording

- Do you want gross P&L before fees or net P&L after fees?

### Unsupported Conditions

- Missing/conflicting/unsupported fee facts without a valid partial state, approved FX conversion, empty eligible population, or any V3/sample/guessed fee fallback.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService` through `journal_analytics_query_v1` and `journal_analytics_metrics_v1`, with exact charge allocation and coverage contract.

### Result Units

- Exact monetary amount in one selected trade currency, marked complete, partial, empty, or unavailable with coverage.

### Fee Handling

- Exact only with complete supported fees, agreed currency/sign policy, and conserving allocation. Otherwise return explicit partial/unavailable state; never estimate.

### Open-Trade Handling

- Exclude legitimate-open, pending, excluded, and `needs-decision` rows from net realized value; retain coverage disclosure.

### Sample-Size Considerations

- Return eligible fee-covered trade count and excluded/partial coverage. An empty denominator is not zero net P&L.

## `realized_pnl` Language Registry

### Exact Definition

P/L from eligible `ready_closed` Stock round trips in one selected trade-currency partition on a declared gross or net basis; gross is before fees and net requires complete supported fee facts.

### Formal Wording

- Realized P&L; closed-trade P/L; realized gross or net P/L after the basis is declared.

### Normal Conversational Wording

- How much did I realize on closed trades?; show P&L I locked in this week.

### Trader Slang

- Booked P&L; locked-in gains and losses; closed-trade money.

### Abbreviations

- Realized P&L; `RPL` may map only when surrounding language clearly establishes realized P&L; a bare `RPL` remains a symbol/ticker candidate and must not auto-route. Bare `PL` remains ticker-shaped and cannot establish basis.

### Common Misspellings

- Realised pnl; relized p&l; realized pl.

### Noisy or Incomplete Input

- booked pnl; closed money; realized this wk.

### Singular and Plural Forms

- Realized P&L; realized P&Ls by day. Neither form selects gross or net automatically.

### Full Questions

- What was my realized P&L last week?; How much did I book on closed trades after fees?

### Commands

- Show realized P&L for July; calculate booked P&L for my closed NVDA trades.

### Sentence Fragments

- Booked gains; closed trade P&L; realized July.

### Follow-Up Wording

- Make that gross instead; only show the closed trades from yesterday.

### Correction Wording

- I meant realized, not unrealized; use net basis after fees.

### Comparison Wording

- Compare realized P&L in June and July; did I book more after fees this month?

### Ranking Wording

- Rank tickers by realized P&L; show the days with the most booked P&L.

### Negated Wording

- Do not include open P&L; not gross—use net; do not include unresolved trades.

### Exclusion Wording

- Exclude open positions; leave out trades that need a decision.

### Multi-Filter Wording

- Net realized P&L for short AMD trades in July, excluding unresolved rows.

### Multi-Part Question Wording

- Show gross realized P&L for July, compare it to net realized P&L, and explain fee coverage.

### Ambiguous Wording

- Realized P&L; booked profit; closed P&L. These establish closed-trade scope but not gross/net basis, so clarify basis one question at a time.

### Negative Examples

These examples must not map to this concept.

- What is the unrealized P&L on my open position?; show gross profit only from winners; forecast next week's return.

### Context Requirements

- Server-authorized account scope and one trade currency are required. A previous explicit gross or net basis may continue in the same query context; otherwise realized wording alone requires basis clarification.

### Required Data

- Authorized account scope; selected trade currency; eligible `ready_closed` Stock round trips; exact allocations and coverage state; complete fee facts only when net basis is requested.

### Optional Data

- Date range, ticker, observed direction, selected closed trade, account-timezone closing-date grouping, and requested gross/net basis.

### Valid Filters

- Server-enforced account scope; date range; ticker/symbol; eligible `ready_closed` scope; selected trade; approved direction filter; explicit gross or net basis.

### Valid Groupings

- Ticker, account-timezone closing-date buckets, and Category 11 direction where supported; never merge currencies.

### Valid Operators

- Sum; approved grouping, comparison, and ranking operations after basis is declared.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Legitimate-open/pending/excluded/`needs-decision` rows; unstated gross/net basis; cross-currency total without FX; forced fee estimate; causal, predictive, or advice requests.

### Default Interpretation

- Realized means eligible closed-trade scope only. There is no safe default gross/net basis unless preserved factual context explicitly established it.

### Clarification Conditions

- Ask for gross or net first whenever realized P&L lacks a safely established basis. After that, clarify currency or time range only if material.

### Recommended Clarification Wording

- Do you want realized P&L before fees (gross) or after fees (net)?

### Unsupported Conditions

- Any request to include open/unresolved rows, mix currencies without approved FX, derive net from missing fees, or use V3, sample, zero, guessed, or advisory fallback.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService` via `journal_analytics_query_v1` and `journal_analytics_metrics_v1`, with declared gross/net basis and coverage result contract.

### Result Units

- Exact monetary amount in one selected trade currency on the declared basis, with complete/partial/empty/unavailable coverage state.

### Fee Handling

- Gross basis needs no fees. Net basis requires complete supported fee facts and preserving allocation; missing/unsupported fees require explicit partial/unavailable state.

### Open-Trade Handling

- Never include legitimate-open, pending, excluded, or `needs-decision` rows in realized P&L; disclose coverage rather than estimating.

### Sample-Size Considerations

- Return eligible closed-trade count and coverage. No eligible closed trades is empty/unavailable, not a zero realized value.

## `unrealized_pnl` Language Registry

### Exact Definition

Marked P/L on legitimate-open positions, requiring execution-derived cost and an approved current market-price mark in one trade currency.

### Formal Wording

- Unrealized P&L; marked open-position gain or loss.

### Normal Conversational Wording

- What is my open P&L right now?; how much am I up on this open trade?

### Trader Slang

- Open green/red; paper gains; floating P&L.

### Abbreviations

- `UPL` may map only with explicit unrealized/open-P&L grammar; bare `UPL` is a symbol/ticker candidate and cannot auto-route.

### Common Misspellings

- Unrealised pnl; unrealized pl; unralized P&L.

### Noisy or Incomplete Input

- Open pnl now; floating gain; am i green.

### Singular and Plural Forms

- Unrealized P&L; unrealized P&Ls by position, if an approved mark contract later supports them.

### Full Questions

- What is my unrealized P&L on open positions?; what is my current marked gain on NVDA?

### Commands

- Show unrealized P&L; mark my open positions.

### Sentence Fragments

- Open trade P&L; current mark; floating loss.

### Follow-Up Wording

- What about the other open one?; use the latest mark.

### Correction Wording

- I mean unrealized, not booked P&L; do not use entry price as the mark.

### Comparison Wording

- Compare unrealized P&L across my open positions, if current marks are available.

### Ranking Wording

- Which open position has the largest marked gain?

### Negated Wording

- Do not show realized P&L; not the last execution price.

### Exclusion Wording

- Exclude positions without an approved current mark.

### Multi-Filter Wording

- Show unrealized P&L for open long NVDA positions in USD.

### Multi-Part Question Wording

- Show my open P&L and explain which positions lack current marks.

### Ambiguous Wording

- Open P&L; current gain; green. Clarify the selected open position only after stating that current marks are unavailable.

### Negative Examples

These examples must not map to this concept.

- What was my realized P&L?; use my last fill as today's price; predict where NVDA closes.

### Context Requirements

- Authorized account scope and a selected open-position context may be needed, but context cannot substitute for an approved current mark.

### Required Data

- Legitimate-open position facts, execution-derived cost, selected currency, and an approved current market-price mark.

### Optional Data

- Selected ticker/position, mark timestamp/source, and display grouping.

### Valid Filters

- Server-enforced account scope; legitimate-open position; ticker; selected position; approved mark timestamp.

### Valid Groupings

- Position or ticker only after a supported mark contract; no cross-currency total.

### Valid Operators

- Marked calculation, comparison, and ranking only when approved marks exist.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- `ready_closed` realized population; last-fill estimate; missing mark; V3/sample/guessed data; prediction or advice.

### Default Interpretation

- Recognize unrealized/open P&L, then return unavailable because the approved current-mark dependency is absent.

### Clarification Conditions

- After the unavailable reason, clarify the position only if it helps describe the missing mark; do not ask for a substitute price.

### Recommended Clarification Wording

- Which open position do you want checked once an approved current market mark is available?

### Unsupported Conditions

- Current marks are absent; never estimate from cost, last execution, V3, samples, or guesses.

### Target Analytics Tool or Query Capability

- Planned mark-aware Journal Analytics capability; no current executable query for this metric.

### Result Units

- Monetary amount in one trade currency if current marks are approved; currently unavailable with reason.

### Fee Handling

- No fee estimate. A future gross/net mark policy must be explicit and cannot infer missing fees.

### Open-Trade Handling

- Legitimate-open is required; pending, excluded, and `needs-decision` rows are not marked as open positions.

### Sample-Size Considerations

- Report marked-position coverage if supported; missing marks are unavailable, not zero P&L.

## `total_return` Language Registry

### Exact Definition

Account-level return for a declared period using approved equity/balance history, cash flows, distributions, FX policy, and denominator.

### Formal Wording

- Total return; account return after cash-flow treatment.

### Normal Conversational Wording

- What was my account return this year?; how much did the whole account return?

### Trader Slang

- Account ROI; portfolio return.

### Abbreviations

- `TR` or `ROI` may map only with account-return grammar; bare short tokens are symbol/ticker candidates and cannot auto-route.

### Common Misspellings

- Total retun; acount return; portfoilio ROI.

### Noisy or Incomplete Input

- Account roi ytd; total return; portfolio percent.

### Singular and Plural Forms

- Total return; total returns across approved periods within the fixed server-authorized account scope.

### Full Questions

- What was my total account return year to date?; what did my portfolio return after deposits?

### Commands

- Show total return for Q2; calculate portfolio return year to date.

### Sentence Fragments

- Account ROI; portfolio return ytd.

### Follow-Up Wording

- Include deposits correctly; compare that with last year.

### Correction Wording

- I mean account return, not trade P&L; do not use entry notional return.

### Comparison Wording

- Compare total return for Q1 and Q2 after cash flows.

### Ranking Wording

- Rank approved periods by total return within the authorized account scope, if required facts exist.

### Negated Wording

- Not trade P&L; do not treat deposits as profits.

### Exclusion Wording

- Use April through December rather than the full year.

### Multi-Filter Wording

- Total return for 2026 in the authorized account scope after deposits and FX.

### Multi-Part Question Wording

- Show total return and explain the cash-flow and FX coverage.

### Ambiguous Wording

- Return; ROI; performance. Clarify account total return versus per-trade return before calculating.

### Negative Examples

These examples must not map to this concept.

- What is my net P&L?; average percentage return per trade; use balance change without deposits.

### Context Requirements

- Server-authorized account scope is fixed; a declared period is required. Prior trade-return context cannot become account return.

### Required Data

- Approved account equity/balance history, deposits/withdrawals, transfers, distributions, FX facts, period, and denominator policy.

### Optional Data

- Benchmark context is not part of this metric and requires separate approved data.

### Valid Filters

- Declared period within the server-authorized account scope only after the account-return contract exists.

### Valid Groupings

- Approved time periods within the fixed server-authorized account scope; never infer a cross-account or cross-currency aggregate.

### Valid Operators

- Approved period comparison/ranking within the fixed server-authorized account scope only after a denominator and cash-flow contract exists.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Trade P/L, entry-notional return, raw balance change, missing FX/cash flows, V3/sample/guessed data, advice claims.

### Default Interpretation

- Recognize account-return wording but return unavailable; there is no safe proxy from trade P/L.

### Clarification Conditions

- After explaining that required account facts are unavailable, clarify only the period first. Any denominator question is separate and only relevant if a future contract exists.

### Recommended Clarification Wording

- What period should total return cover?

### Unsupported Conditions

- Required equity/cash-flow/distribution/FX/denominator facts are absent; never use balance change or trade P&L as a proxy.

### Target Analytics Tool or Query Capability

- Planned account-return capability; no current Journal Analytics metric query exposes it.

### Result Units

- Percentage return for the fixed server-authorized account scope and declared period if supported; currently unavailable with missing-fact reason.

### Fee Handling

- Fees matter only through approved account facts and explicit policy; do not infer them from executions.

### Open-Trade Handling

- A future equity policy must explicitly state mark treatment; executions alone cannot decide it.

### Sample-Size Considerations

- Coverage requires the full period's equity/cash-flow/FX facts, not a number of trades.

## `average_net_pnl_per_trade` Language Registry

### Exact Definition

Exact arithmetic mean of net P/L over eligible fee-covered `ready_closed` trades: total net P/L divided by eligible closed-trade count in one currency.

### Formal Wording

- Average net P&L per trade; mean after-fee closed-trade P/L.

### Normal Conversational Wording

- What do I make per trade after fees?; what is my average net trade?

### Trader Slang

- Average take-home per trade; net per ticket.

### Abbreviations

- No standalone short abbreviation is safe; `avg net P&L per trade` needs metric grammar, and bare tokens remain symbol candidates.

### Common Misspellings

- Averge net pnl; avg nett trade; net per traid.

### Noisy or Incomplete Input

- Avg net trade; after fee per trade; what i keep avg.

### Singular and Plural Forms

- Average net P&L per trade; average net P&Ls across trade populations, never a total.

### Full Questions

- What is my average net P&L per closed trade?; what did I keep per trade after fees in July?

### Commands

- Calculate average net P&L per trade; show it for my NVDA trades.

### Sentence Fragments

- Avg net trade; after-fee average.

### Follow-Up Wording

- Only the fee-covered ones; compare it with June.

### Correction Wording

- I mean the average, not total net P&L; exclude incomplete fee rows.

### Comparison Wording

- Compare average net P&L per trade in June versus July.

### Ranking Wording

- Rank my setups by average net P&L per trade, with eligible counts.

### Negated Wording

- Not gross; do not average open trades; do not treat missing fees as zero.

### Exclusion Wording

- Exclude fee-incomplete and `needs-decision` trades.

### Multi-Filter Wording

- Average net P&L per trade for long NVDA trades in July, excluding fee-incomplete rows.

### Multi-Part Question Wording

- Show my average net P&L per trade and the eligible trade count; compare it with June.

### Ambiguous Wording

- Average trade; average profit. Clarify net versus gross and per-trade versus daily total.

### Negative Examples

These examples must not map to this concept.

- What is total net P&L?; what is median net P&L?; average my open-position P&L.

### Context Requirements

- Authorized account scope, one currency, and fee-coverage context are required; a selected date/ticker context may narrow the denominator.

### Required Data

- Eligible fee-covered `ready_closed` trades, exact net P/L, complete fees, and nonzero eligible denominator.

### Optional Data

- Date range, ticker, direction, setup label where separately authorized, and comparison period.

### Valid Filters

- Server-enforced account; date; ticker; fee-covered closed population; selected trade; approved direction.

### Valid Groupings

- Ticker, date buckets, and Category 11 direction when exposed; one currency per result.

### Valid Operators

- Exact mean; approved comparisons/rankings with denominator and coverage displayed.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Gross basis, zero denominator, missing-fee estimate, open/unresolved rows, cross-currency mean, causal/advice claims.

### Default Interpretation

- Explicit average net per trade uses eligible fee-covered closed trades; never default average profit to net.

### Clarification Conditions

- Clarify gross/net first for “average profit,” then period/currency if material; return empty when no eligible denominator exists.

### Recommended Clarification Wording

- Do you want average gross P&L or average net P&L after fees per closed trade?

### Unsupported Conditions

- Empty denominator, invalid fee coverage without valid partial state, FX-less currency mixing, or V3/sample/guessed fallback.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService` and `journal_analytics_metrics_v1` average-net calculation with coverage contract.

### Result Units

- Exact money per eligible closed trade in one currency, with count and complete/partial/empty/unavailable state.

### Fee Handling

- Complete supported fees are required; incomplete rows remain explicit partial/unavailable coverage and are never estimated.

### Open-Trade Handling

- Exclude legitimate-open, pending, excluded, and `needs-decision` rows from numerator and denominator.

### Sample-Size Considerations

- Always display eligible denominator and coverage; no eligible trades is empty/unavailable, not zero average.

## `median_net_pnl_per_trade` Language Registry

### Exact Definition

Exact sorted median of net P/L over eligible fee-covered `ready_closed` trades in one currency; for even count, exact mean of the two middle values.

### Formal Wording

- Median net P&L per trade; middle after-fee closed-trade P/L.

### Normal Conversational Wording

- What is my middle net trade?; what is the median after-fee P&L?

### Trader Slang

- Typical net ticket; middle take-home trade.

### Abbreviations

- No bare short abbreviation is safe; `median net P&L` requires metric grammar and bare tokens remain symbol candidates.

### Common Misspellings

- Medain net pnl; median nett trade; med net p&l.

### Noisy or Incomplete Input

- Middle net trade; med after fee; typical pnl.

### Singular and Plural Forms

- Median net P&L per trade; medians by approved group, never total net P&L.

### Full Questions

- What is my median net P&L per closed trade?; what was the middle after-fee trade result in July?

### Commands

- Calculate median net P&L; show median net P&L by ticker.

### Sentence Fragments

- Median net; middle trade; typical after-fee.

### Follow-Up Wording

- Use the median, not the average; only fee-covered trades.

### Correction Wording

- I meant median net P&L, not average net P&L; use the even-count rule.

### Comparison Wording

- Compare median net P&L per trade in June and July.

### Ranking Wording

- Rank setups by median net P&L, showing eligible counts.

### Negated Wording

- Not the average; do not include open trades; do not invent missing fees.

### Exclusion Wording

- Exclude fee-incomplete and unresolved trades.

### Multi-Filter Wording

- Median net P&L for short AMD trades in July, excluding incomplete-fee rows.

### Multi-Part Question Wording

- Show median net P&L and average net P&L for July, with both eligible counts.

### Ambiguous Wording

- Typical trade; middle P&L. Clarify median versus average and net versus gross.

### Negative Examples

These examples must not map to this concept.

- What is my average net trade?; total net P&L; median percentage return.

### Context Requirements

- Authorized account, one currency, fee coverage, and explicit sorted trade population are required.

### Required Data

- Eligible fee-covered `ready_closed` net-P/L values, complete fee facts, and nonempty sorted population.

### Optional Data

- Date range, ticker, direction, selected group, and comparison window.

### Valid Filters

- Server-enforced account; date; ticker; fee-covered closed scope; selected trade; approved direction.

### Valid Groupings

- Ticker, date bucket, and Category 11 direction where exposed; do not mix currencies.

### Valid Operators

- Exact median and approved comparisons/rankings retaining population coverage.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Arithmetic mean, gross basis, empty population, estimated fees, open/unresolved rows, causal/advice claims.

### Default Interpretation

- Explicit median net P&L uses the fee-covered closed population and even-count rule; “typical” needs clarification.

### Clarification Conditions

- Clarify median versus average, then net versus gross when not established; return empty for no eligible population.

### Recommended Clarification Wording

- Do you want the median or the average net P&L per closed trade?

### Unsupported Conditions

- Empty population, missing fee coverage without valid partial state, cross-currency sort, or V3/sample/guessed fallback.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService` and exact `journal_analytics_metrics_v1` median path with even-count calculation.

### Result Units

- Exact money per eligible closed trade in one currency, with population count and coverage state.

### Fee Handling

- Requires complete supported fees and allocation; never turn fee-incomplete gross values into exact net median.

### Open-Trade Handling

- Exclude legitimate-open, pending, excluded, and `needs-decision` rows from the sorted population.

### Sample-Size Considerations

- Return population count; no eligible values is empty/unavailable, and even counts must expose exact two-middle-value rule.

## `average_percentage_return` Language Registry

### Exact Definition

Arithmetic mean of an explicitly defined per-trade percentage return over eligible closed trades, requiring an approved denominator and distribution/coverage contract; not currently exposed.

### Formal Wording

- Average percentage return; mean per-trade normalized return.

### Normal Conversational Wording

- What is my average percent return per trade?; how many percent do I make on average?

### Trader Slang

- Avg percent per trade; average move return.

### Abbreviations

- `APR` may map only with explicit per-trade percentage-return grammar; bare `APR` is a symbol/ticker candidate and cannot auto-route.

### Common Misspellings

- Averge percent return; avg precent; percentage retun.

### Noisy or Incomplete Input

- Avg % per trade; percent avg; average return.

### Singular and Plural Forms

- Average percentage return; average percentage returns by approved population, not account return.

### Full Questions

- What is my average percentage return per trade?; what percent do I return on average for closed trades?

### Commands

- Calculate average percentage return; show average percent return by ticker.

### Sentence Fragments

- Avg percent; return per trade; avg %.

### Follow-Up Wording

- Use entry notional if that becomes approved; compare it with last month.

### Correction Wording

- I mean per-trade percentage return, not total account return; do not use P&L dollars.

### Comparison Wording

- Compare average percentage return this month and last month once the denominator is defined.

### Ranking Wording

- Rank tickers by average percentage return once the public metric exists.

### Negated Wording

- Not total return; do not assume entry notional; not a dollar average.

### Exclusion Wording

- Exclude trades without the approved denominator.

### Multi-Filter Wording

- Average percentage return for long NVDA trades in July, using the approved denominator.

### Multi-Part Question Wording

- Show average percentage return and net P&L per trade; explain their different denominators.

### Ambiguous Wording

- Average return; percent return; ROI. Clarify trade-level versus account-level return and denominator before execution.

### Negative Examples

These examples must not map to this concept.

- What is my total account return?; average net P&L in dollars; calculate percent using account base currency only.

### Context Requirements

- Authorized account, selected currency/population, declared P/L basis, and approved per-trade denominator are required; existing context cannot invent them.

### Required Data

- Exact eligible closed-trade P/L, approved per-trade denominator, approved gross/net basis, and named aggregate distribution/coverage contract.

### Optional Data

- Date range, ticker, direction, and comparison period after the planned contract exists.

### Valid Filters

- Planned only: server account, date, ticker, eligible closed population, approved direction, and denominator coverage.

### Valid Groupings

- Planned only: approved ticker/date/direction groups within one currency and denominator contract.

### Valid Operators

- Planned exact mean and comparison/ranking only after denominator/distribution contract approval.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- `total_return`, dollar P/L average, implicit denominator, unselected gross/net basis, open/unresolved rows, V3/sample/guessed fallback, advice claims.

### Default Interpretation

- Recognize the request as planned trade-level return; do not substitute account return, entry-notional assumptions, or dollar P/L.

### Clarification Conditions

- Explain planned status, then ask trade-level versus account-level return; if trade-level is confirmed, ask the approved denominator only when the contract exists.

### Recommended Clarification Wording

- Do you mean average percentage return per trade or total return for the account?

### Unsupported Conditions

- No named public denominator/distribution capability exists; never estimate from P&L, account currency, V3, samples, or guesses.

### Target Analytics Tool or Query Capability

- Planned normalized-return distribution capability; current registry does not expose this named average.

### Result Units

- Percentage per eligible closed trade if planned capability is approved; currently planned, not executable.

### Fee Handling

- Future contract must declare gross/net basis; net requires complete supported fees and explicit partial/unavailable policy.

### Open-Trade Handling

- Future contract must declare eligible closed population; never infer open-position inclusion.

### Sample-Size Considerations

- Future result must show denominator/population and coverage; do not produce a percentage for empty or uncontracted population.

## `median_percentage_return` Language Registry
### Exact Definition
Median of approved per-trade percentage returns over eligible closed trades; the denominator/distribution contract is not exposed.
### Formal Wording
- Median percentage return.
### Normal Conversational Wording
- What is my middle percent return per trade?
### Trader Slang
- Typical percent trade.
### Abbreviations
- `MPR` needs explicit median-return grammar; bare `MPR` is a ticker candidate.
### Common Misspellings
- Medain percent return; median precent.
### Noisy or Incomplete Input
- Median %; typical return.
### Singular and Plural Forms
- Median percentage return; medians by approved population.
### Full Questions
- What is my median percentage return per closed trade?
### Commands
- Calculate median percent return when supported.
### Sentence Fragments
- Middle percent trade.
### Follow-Up Wording
- Use median, not average.
### Correction Wording
- I mean trade return, not account return.
### Comparison Wording
- Compare median percent return by month when supported.
### Ranking Wording
- Rank tickers by median percent return when the contract exists.
### Negated Wording
- Not average; not total return.
### Exclusion Wording
- Exclude trades without the approved denominator.
### Multi-Filter Wording
- Median percent return for long NVDA trades in July.
### Multi-Part Question Wording
- Show median percent return and average net P&L; explain the difference.
### Ambiguous Wording
- Typical return: clarify median versus average, then trade versus account.
### Negative Examples
These examples must not map to this concept.
- Total account return; median net P&L; guessed percentage.
### Context Requirements
- Fixed server account scope, one currency/population, declared basis, and approved denominator are required.
### Required Data
- Eligible closed P/L, approved per-trade denominator, basis, and distribution contract.
### Optional Data
- Date, ticker, and directly observed direction.
### Valid Filters
- Planned: authorized scope, date, ticker, eligible closed population, denominator coverage.
### Valid Groupings
- Planned approved ticker/date/direction groups; never mixed currencies.
### Valid Operators
- Planned exact median and approved comparisons/rankings.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- Account return, dollar P/L, implicit denominator, open rows, V3/sample/guess/advice.
### Default Interpretation
- Recognize as planned; do not substitute average or total return.
### Clarification Conditions
- Explain planned status, then ask median versus average only if needed.
### Recommended Clarification Wording
- Do you mean median percentage return per trade or average percentage return per trade?
### Unsupported Conditions
- No named approved denominator/distribution capability; never estimate.
### Target Analytics Tool or Query Capability
- Planned normalized-return distribution capability.
### Result Units
- Percentage per eligible closed trade when supported; currently planned.
### Fee Handling
- Future gross/net basis must be declared; net needs complete fees.
### Open-Trade Handling
- Future contract must declare closed population; never infer open inclusion.
### Sample-Size Considerations
- Future result needs population/denominator coverage; no empty-population result.

## `largest_win` Language Registry
### Exact Definition
Maximum positive declared gross/net P/L among eligible `ready_closed` trades in one currency; ties use close-time then stable ID.
### Formal Wording
- Largest win; maximum positive realized P/L.
### Normal Conversational Wording
- What was my biggest winning trade?
### Trader Slang
- Biggest green; top winner.
### Abbreviations
- No bare short abbreviation is safe; explicit largest-win grammar is required.
### Common Misspellings
- Largst win; biggest winner.
### Noisy or Incomplete Input
- Biggest green; top win.
### Singular and Plural Forms
- Largest win; largest wins by approved group.
### Full Questions
- What was my largest net win last month?
### Commands
- Show my biggest gross winner.
### Sentence Fragments
- Top green trade.
### Follow-Up Wording
- Use gross instead; show its close time.
### Correction Wording
- I mean largest win, not gross profit total.
### Comparison Wording
- Compare my largest win in June and July.
### Ranking Wording
- Rank closed trades by declared-basis P/L.
### Negated Wording
- Not percentage return; do not use open gains.
### Exclusion Wording
- Exclude unresolved trades.
### Multi-Filter Wording
- Largest net win among long NVDA trades in July.
### Multi-Part Question Wording
- Show largest win and largest loss with their declared basis.
### Ambiguous Wording
- Best trade: clarify dollar P/L versus percentage return and gross versus net.
### Negative Examples
These examples must not map to this concept.
- Total gross profit; largest unrealized gain; why was it a good trade?
### Context Requirements
- Fixed server scope, one currency, eligible closed population, and basis are required.
### Required Data
- Exact closed P/L, close time, stable ID, coverage, and fees for net basis.
### Optional Data
- Date, ticker, direction, selected trade.
### Valid Filters
- Authorized scope, date, ticker, eligible closed population, direction.
### Valid Groupings
- Approved date/ticker/direction; no currency merge.
### Valid Operators
- Positive maximum; deterministic ranking/tie policy.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `rank_results`, `compare_groups`, `explain_result`.
### Incompatible Combinations
- Gross total, percentage extrema, open rows, unstated basis, causal/advice claims.
### Default Interpretation
- No basis default; explicit largest win selects closed positive dollar P/L.
### Clarification Conditions
- Ask gross or net before currency/period when basis is absent.
### Recommended Clarification Wording
- Should largest win use gross P&L before fees or net P&L after fees?
### Unsupported Conditions
- Empty positive population, FX-less merge, fee estimate, V3/sample/guess.
### Target Analytics Tool or Query Capability
- `JournalAnalyticsService` extrema metric with close-time/stable-ID ties.
### Result Units
- Positive money in one currency with population coverage.
### Fee Handling
- Gross needs none; net needs complete supported fees or partial/unavailable state.
### Open-Trade Handling
- Exclude open, pending, excluded, and `needs-decision` rows.
### Sample-Size Considerations
- Show eligible positive count; no winner is empty, not zero.

## `largest_loss` Language Registry
### Exact Definition
Most negative declared gross/net P/L among eligible `ready_closed` trades in one currency; ties use close-time then stable ID.
### Formal Wording
- Largest loss; minimum realized P/L.
### Normal Conversational Wording
- What was my biggest losing trade?
### Trader Slang
- Biggest red; worst loser.
### Abbreviations
- No bare short abbreviation is safe; explicit largest-loss grammar is required.
### Common Misspellings
- Largst loss; biggest looser.
### Noisy or Incomplete Input
- Biggest red; worst loss.
### Singular and Plural Forms
- Largest loss; largest losses by approved group.
### Full Questions
- What was my largest gross loss in July?
### Commands
- Show my worst net losing trade.
### Sentence Fragments
- Top red trade.
### Follow-Up Wording
- Use net; show the closed trade.
### Correction Wording
- I mean largest loss, not gross loss total.
### Comparison Wording
- Compare largest loss in June and July.
### Ranking Wording
- Rank closed trades from most negative P/L.
### Negated Wording
- Not drawdown; do not use open losses.
### Exclusion Wording
- Exclude trades needing a decision.
### Multi-Filter Wording
- Largest net loss among short AMD trades in July.
### Multi-Part Question Wording
- Show largest loss and its fee coverage.
### Ambiguous Wording
- Worst trade: clarify dollar loss versus percentage/drawdown and gross versus net.
### Negative Examples
These examples must not map to this concept.
- Total gross loss; open-position loss; why did I lose?
### Context Requirements
- Fixed scope, one currency, closed population, and basis are required.
### Required Data
- Exact closed P/L, close time, stable ID, coverage, and fees for net basis.
### Optional Data
- Date, ticker, direction, selected trade.
### Valid Filters
- Authorized scope, date, ticker, eligible closed scope, direction.
### Valid Groupings
- Approved date/ticker/direction; no currency merge.
### Valid Operators
- Negative minimum; deterministic ranking/tie policy.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `rank_results`, `compare_groups`, `explain_result`.
### Incompatible Combinations
- Gross total, drawdown/percentage extrema, open rows, unstated basis, causal/advice claims.
### Default Interpretation
- No basis default; explicit largest loss selects most-negative closed dollar P/L.
### Clarification Conditions
- Ask gross or net first when basis is absent.
### Recommended Clarification Wording
- Should largest loss use gross P&L before fees or net P&L after fees?
### Unsupported Conditions
- Empty negative population, FX-less merge, fee estimate, V3/sample/guess.
### Target Analytics Tool or Query Capability
- `JournalAnalyticsService` extrema metric with deterministic ties.
### Result Units
- Negative money in one currency with coverage.
### Fee Handling
- Gross needs none; net needs complete fees or partial/unavailable state.
### Open-Trade Handling
- Exclude open, pending, excluded, and `needs-decision` rows.
### Sample-Size Considerations
- Show eligible negative count; no loser is empty, not zero.

## `average_winning_trade` Language Registry
### Exact Definition
Exact mean positive declared gross/net P/L over eligible `ready_closed` trades in one currency; unavailable when no qualifying winners exist.
### Formal Wording
- Average winning trade; mean positive realized P/L.
### Normal Conversational Wording
- What does my average winner make?
### Trader Slang
- Average green; typical winner.
### Abbreviations
- No bare short abbreviation is safe; explicit average-winner grammar is required.
### Common Misspellings
- Averge winner; avrg winning trade.
### Noisy or Incomplete Input
- Avg green; typical winner.
### Singular and Plural Forms
- Average winning trade; average winners by approved group.
### Full Questions
- What is my average net winning trade?
### Commands
- Show average gross winner for July.
### Sentence Fragments
- Avg winner.
### Follow-Up Wording
- Only fee-covered winners; compare June.
### Correction Wording
- Average winners, not all trades.
### Comparison Wording
- Compare average winning trade by month.
### Ranking Wording
- Rank setups by average winning trade with counts.
### Negated Wording
- Not win rate; do not include losers/open trades.
### Exclusion Wording
- Exclude incomplete-fee rows for net basis.
### Multi-Filter Wording
- Average net winner for long NVDA in July.
### Multi-Part Question Wording
- Show average winner and loser with qualifying counts.
### Ambiguous Wording
- Average win: clarify gross/net and winner mean versus win rate.
### Negative Examples
These examples must not map to this concept.
- Win rate; gross profit total; why are my winners better?
### Context Requirements
- Fixed scope, one currency, basis, and positive closed population are required.
### Required Data
- Positive eligible P/L and exact qualifying count; complete fees for net.
### Optional Data
- Date, ticker, direction, comparison group.
### Valid Filters
- Authorized scope, date, ticker, positive closed population, direction.
### Valid Groupings
- Approved date/ticker/direction; no currency merge.
### Valid Operators
- Exact mean, comparison, ranking with counts.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- Win rate, total profit, zero denominator, open rows, causal/advice claims.
### Default Interpretation
- Explicit average winner uses positive closed P/L; no gross/net default.
### Clarification Conditions
- Ask basis first for average win; report empty if no winners.
### Recommended Clarification Wording
- Do you want average gross winner or average net winner after fees?
### Unsupported Conditions
- No qualifying winner, fee estimate, FX-less merge, V3/sample/guess.
### Target Analytics Tool or Query Capability
- `JournalAnalyticsService` positive selected-basis mean.
### Result Units
- Positive money per qualifying trade in one currency.
### Fee Handling
- Net is fee-conditional; incomplete fees are partial/unavailable, never estimated.
### Open-Trade Handling
- Exclude open, pending, excluded, and decision rows.
### Sample-Size Considerations
- Show winner count; empty population is unavailable, not zero.

## `average_losing_trade` Language Registry
### Exact Definition
Exact mean negative declared gross/net P/L over eligible `ready_closed` trades in one currency; unavailable when no qualifying losers exist.
### Formal Wording
- Average losing trade; mean negative realized P/L.
### Normal Conversational Wording
- What does my average loser cost?
### Trader Slang
- Average red; typical loser.
### Abbreviations
- No bare short abbreviation is safe; explicit average-loser grammar is required.
### Common Misspellings
- Averge loser; avrg losing trade.
### Noisy or Incomplete Input
- Avg red; typical loser.
### Singular and Plural Forms
- Average losing trade; average losers by approved group.
### Full Questions
- What is my average net losing trade?
### Commands
- Show average gross loser for July.
### Sentence Fragments
- Avg loser.
### Follow-Up Wording
- Only fee-covered losses; compare June.
### Correction Wording
- Average losers, not all trades.
### Comparison Wording
- Compare average losing trade by month.
### Ranking Wording
- Rank setups by average losing trade with counts.
### Negated Wording
- Not loss rate; do not include winners/open trades.
### Exclusion Wording
- Exclude incomplete-fee rows for net basis.
### Multi-Filter Wording
- Average net loser for short AMD in July.
### Multi-Part Question Wording
- Show average loser and winner with qualifying counts.
### Ambiguous Wording
- Average loss: clarify gross/net and loser mean versus loss rate.
### Negative Examples
These examples must not map to this concept.
- Loss rate; gross loss total; why are my losses bad?
### Context Requirements
- Fixed scope, one currency, basis, and negative closed population are required.
### Required Data
- Negative eligible P/L and exact qualifying count; complete fees for net.
### Optional Data
- Date, ticker, direction, comparison group.
### Valid Filters
- Authorized scope, date, ticker, negative closed population, direction.
### Valid Groupings
- Approved date/ticker/direction; no currency merge.
### Valid Operators
- Exact mean, comparison, ranking with counts.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- Loss rate, total loss, zero denominator, open rows, causal/advice claims.
### Default Interpretation
- Explicit average loser uses negative closed P/L; no gross/net default.
### Clarification Conditions
- Ask basis first for average loss; report empty if no losers.
### Recommended Clarification Wording
- Do you want average gross loser or average net loser after fees?
### Unsupported Conditions
- No qualifying loser, fee estimate, FX-less merge, V3/sample/guess.
### Target Analytics Tool or Query Capability
- `JournalAnalyticsService` negative selected-basis mean.
### Result Units
- Negative money per qualifying trade in one currency.
### Fee Handling
- Net is fee-conditional; incomplete fees are partial/unavailable, never estimated.
### Open-Trade Handling
- Exclude open, pending, excluded, and decision rows.
### Sample-Size Considerations
- Show loser count; empty population is unavailable, not zero.

## `average_daily_pnl` Language Registry
### Exact Definition
Exact arithmetic mean of declared gross or net daily realized P/L buckets in one currency. Each eligible `ready_closed` Stock round trip is attributed to its closing trading date in the account IANA timezone; the denominator contains only dates with at least one eligible realized close and never zero-fills no-trade or open-only dates.
### Formal Wording
- Average daily P/L; mean daily realized P/L.
### Normal Conversational Wording
- What do I make on an average trading day?
### Trader Slang
- Average day; typical day P&L.
### Abbreviations
- No bare short alphabetic abbreviation is safe; `ADP`, `ADPL`, and similar forms remain ticker candidates unless explicit average-daily-P/L grammar is present.
### Common Misspellings
- Averge daily pnl; avg daliy P&L.
### Noisy or Incomplete Input
- Avg daily pnl; typical daily result.
### Singular and Plural Forms
- Average daily P/L; average realized days by approved group.
### Full Questions
- What is my average net daily P/L this month?
### Commands
- Show average gross daily P/L for July.
### Sentence Fragments
- Avg daily P&L.
### Follow-Up Wording
- Only fee-covered days; compare June.
### Correction Wording
- Average daily P/L, not average P/L per trade.
### Comparison Wording
- Compare average daily P/L by month.
### Ranking Wording
- Rank setups by average daily P/L with eligible-day counts.
### Negated Wording
- Do not divide by all calendar days or include no-trade/open-only days.
### Exclusion Wording
- Exclude fee-incomplete affected days for net basis.
### Multi-Filter Wording
- Average net daily P/L for short AMD in July.
### Multi-Part Question Wording
- Show average daily P/L and average P/L per trade with their denominators.
### Ambiguous Wording
- Average daily P/L: clarify gross or net basis; do not infer calendar-day zero filling.
### Negative Examples
These examples must not map to this concept.
- Average P/L per trade; average weekly P/L; how should I improve my daily P/L?
### Context Requirements
- Server-authorized account scope, date range, one currency, declared gross/net basis, and account IANA timezone closing-date attribution are required.
### Required Data
- Eligible `ready_closed` Stock round trips, exact realized P/L, closing timestamp, account IANA timezone, daily-bucket membership, and exact eligible-day denominator; complete supported fee facts for net.
### Optional Data
- Date, ticker, direction, accepted setup/tag filter, and comparison group.
### Valid Filters
- Authorized scope, closing-date range, ticker, direction, and accepted labels; no implicit cross-currency merge.
### Valid Groupings
- Approved closing-date periods, ticker, direction, and accepted labels with separate currency partitions.
### Valid Operators
- Exact eligible-day mean, comparison, and ranking with eligible-day counts.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- Average P/L per trade, weekly/monthly averages, total P/L divided by calendar days, zero-filled no-trade dates, open rows, causal/advice claims, or silent currency conversion.
### Default Interpretation
- Explicit average daily P/L uses eligible realized closing-date buckets only; it has no gross/net default and never substitutes all calendar days for the eligible-day denominator.
### Clarification Conditions
- Ask for gross or net basis when it is not supplied; return an explicit empty population when no eligible realized day exists.
### Recommended Clarification Wording
- Do you want average daily gross P/L or net P/L after fees?
### Unsupported Conditions
- No eligible realized day, incomplete or unsupported fees for requested net basis, cross-currency merge without supported conversion, V3/sample data, guessed values, or a causal/advice request.
### Target Analytics Tool or Query Capability
- `JournalAnalyticsService` selected-basis closing-date daily-bucket mean with an eligible-realized-day denominator.
### Result Units
- Monetary amount per eligible realized trading day in one currency.
### Fee Handling
- Gross needs no fee facts. Net is conditional on complete supported fees, fee currency/sign policy, and conserving allocation; fee-incomplete affected rows are partial or unavailable, never estimated.
### Open-Trade Handling
- Exclude open, pending, excluded, and `needs-decision` rows from daily realized buckets and denominator; retain them only through coverage.
### Sample-Size Considerations
- Show eligible realized-day count and contributing closed-trade count; an empty eligible-day population is unavailable, not zero.

## `average_weekly_pnl` Language Registry
### Exact Definition
Planned arithmetic mean of declared gross or net weekly realized P/L buckets in one currency. Eligible `ready_closed` P/L can be grouped by closing ISO week in the account IANA timezone, but the named average across weekly buckets and its empty-week/calendar denominator contract are not exposed.
### Formal Wording
- Average weekly P/L; mean weekly realized P/L.
### Normal Conversational Wording
- What do I make in an average week?
### Trader Slang
- Average week; typical weekly P&L.
### Abbreviations
- No bare short alphabetic abbreviation is safe; `AWP`, `AWPL`, and similar forms remain ticker candidates unless explicit average-weekly-P/L grammar is present.
### Common Misspellings
- Averge weekly pnl; avg wekly P&L.
### Noisy or Incomplete Input
- Avg weekly pnl; typical week result.
### Singular and Plural Forms
- Average weekly P/L; average realized weeks by approved group.
### Full Questions
- What is my average net weekly P/L this quarter?
### Commands
- Show average gross weekly P/L for the year.
### Sentence Fragments
- Avg weekly P&L.
### Follow-Up Wording
- Only fee-covered weeks; compare this year with last year.
### Correction Wording
- Average weekly P/L, not average daily P/L or P/L per trade.
### Comparison Wording
- Compare average weekly P/L by quarter.
### Ranking Wording
- Rank setups by average weekly P/L with eligible-week counts.
### Negated Wording
- Do not assume no-trade ISO weeks are excluded or zero-filled.
### Exclusion Wording
- Exclude fee-incomplete affected weeks for requested net basis only after the denominator policy is defined.
### Multi-Filter Wording
- Average net weekly P/L for short AMD this quarter.
### Multi-Part Question Wording
- Show average weekly P/L and average daily P/L with their denominators.
### Ambiguous Wording
- Average weekly P/L: clarify basis first; never silently choose an empty-week calendar rule.
### Negative Examples
These examples must not map to this concept.
- Average daily P/L; average monthly P/L; total P/L divided by calendar weeks; how should I improve my weekly P/L?
### Context Requirements
- Server-authorized account scope, date range, one currency, declared gross/net basis, account IANA timezone, closing ISO-week attribution, and an explicit empty-week/calendar denominator rule are required.
### Required Data
- Eligible `ready_closed` P/L, exact closing timestamp, account IANA timezone, closing ISO-week bucket membership, one currency, and exact declared denominator policy; complete supported fee facts for net.
### Optional Data
- Date, ticker, direction, accepted setup/tag filter, and comparison group.
### Valid Filters
- Authorized scope, closing-date range, ticker, direction, and accepted labels; no implicit cross-currency merge.
### Valid Groupings
- Closing ISO week in the account IANA timezone, approved periods, ticker, direction, and accepted labels with separate currency partitions.
### Valid Operators
- Planned weekly-bucket mean, comparison, and ranking with eligible-week counts once the named metric and denominator contract are exposed.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- Average daily/monthly P/L, average P/L per trade, total P/L divided by calendar weeks, silently excluded or zero-filled no-trade weeks, open rows, causal/advice claims, or silent currency conversion.
### Default Interpretation
- No gross/net basis or empty-week/calendar denominator default exists. The current capability may group realized P/L by closing ISO week, but it does not expose the named weekly average.
### Clarification Conditions
- If basis is absent, ask for gross or net first. After basis is fixed, address the empty-week calendar rule separately; do not compound the questions.
### Recommended Clarification Wording
- Do you want average weekly gross P/L or net P/L after fees?
### Unsupported Conditions
- The requested named average is Planned until its weekly-bucket and empty-week denominator contract is exposed; also unsupported are incomplete or unsupported fees for requested net basis, cross-currency merge without supported conversion, V3/sample data, guessed values, and causal/advice requests.
### Target Analytics Tool or Query Capability
- Planned `JournalAnalyticsService` selected-basis closing-ISO-week bucket mean with an explicit eligible-week or zero-filled calendar denominator contract.
### Result Units
- Planned monetary amount per declared eligible realized ISO week or per explicitly zero-filled ISO-week calendar in one currency.
### Fee Handling
- Gross needs no fee facts. Net is conditional on complete supported fees, fee currency/sign policy, and conserving allocation; fee-incomplete affected rows are partial or unavailable, never estimated.
### Open-Trade Handling
- Open, pending, excluded, and `needs-decision` rows cannot create realized weekly buckets or denominator membership; retain them only through coverage.
### Sample-Size Considerations
- When exposed, show the selected denominator rule, eligible-week count, contributing closed-trade count, and any zero-filled weeks separately; do not represent an unexposed or empty population as zero.

## `average_monthly_pnl` Language Registry
### Exact Definition
Planned arithmetic mean of declared gross or net monthly realized P/L buckets in one currency. Eligible `ready_closed` P/L can be grouped by closing month in the account IANA timezone, but the named average across monthly buckets and its empty-month/calendar denominator contract are not exposed.
### Formal Wording
- Average monthly P/L; mean monthly realized P/L.
### Normal Conversational Wording
- What do I make in an average month?
### Trader Slang
- Average month; typical monthly P&L.
### Abbreviations
- No bare short alphabetic abbreviation is safe; `AMP`, `AMPL`, and similar forms remain ticker candidates unless explicit average-monthly-P/L grammar is present.
### Common Misspellings
- Averge monthly pnl; avg montly P&L.
### Noisy or Incomplete Input
- Avg monthly pnl; typical month result.
### Singular and Plural Forms
- Average monthly P/L; average realized months by approved group.
### Full Questions
- What is my average net monthly P/L this year?
### Commands
- Show average gross monthly P/L for the last year.
### Sentence Fragments
- Avg monthly P&L.
### Follow-Up Wording
- Only fee-covered months; compare this year with last year.
### Correction Wording
- Average monthly P/L, not average daily P/L, weekly P/L, or P/L per trade.
### Comparison Wording
- Compare average monthly P/L by year.
### Ranking Wording
- Rank setups by average monthly P/L with eligible-month counts.
### Negated Wording
- Do not assume no-trade months are excluded or zero-filled.
### Exclusion Wording
- Exclude fee-incomplete affected months for requested net basis only after the denominator policy is defined.
### Multi-Filter Wording
- Average net monthly P/L for short AMD this year.
### Multi-Part Question Wording
- Show average monthly P/L and average weekly P/L with their denominators.
### Ambiguous Wording
- Average monthly P/L: clarify basis first; never silently choose an empty-month calendar rule.
### Negative Examples
These examples must not map to this concept.
- Average daily P/L; average weekly P/L; total P/L divided by calendar months; how should I improve my monthly P/L?
### Context Requirements
- Server-authorized account scope, date range, one currency, declared gross/net basis, account IANA timezone, closing-month attribution, and an explicit empty-month/calendar denominator rule are required.
### Required Data
- Eligible `ready_closed` P/L, exact closing timestamp, account IANA timezone, closing-month bucket membership, one currency, and exact declared denominator policy; complete supported fee facts for net.
### Optional Data
- Date, ticker, direction, accepted setup/tag filter, and comparison group.
### Valid Filters
- Authorized scope, closing-date range, ticker, direction, and accepted labels; no implicit cross-currency merge.
### Valid Groupings
- Closing month in the account IANA timezone, approved periods, ticker, direction, and accepted labels with separate currency partitions.
### Valid Operators
- Planned monthly-bucket mean, comparison, and ranking with eligible-month counts once the named metric and denominator contract are exposed.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- Average daily/weekly P/L, average P/L per trade, total P/L divided by calendar months, silently excluded or zero-filled no-trade months, open rows, causal/advice claims, or silent currency conversion.
### Default Interpretation
- No gross/net basis or empty-month/calendar denominator default exists. The current capability may group realized P/L by closing month, but it does not expose the named monthly average.
### Clarification Conditions
- If basis is absent, ask for gross or net first. After basis is fixed, address the empty-month calendar rule separately; do not compound the questions.
### Recommended Clarification Wording
- Do you want average monthly gross P/L or net P/L after fees?
### Unsupported Conditions
- The requested named average is Planned until its monthly-bucket and empty-month denominator contract is exposed; also unsupported are incomplete or unsupported fees for requested net basis, cross-currency merge without supported conversion, V3/sample data, guessed values, and causal/advice requests.
### Target Analytics Tool or Query Capability
- Planned `JournalAnalyticsService` selected-basis closing-month bucket mean with an explicit eligible-month or zero-filled calendar denominator contract.
### Result Units
- Planned monetary amount per declared eligible realized month or per explicitly zero-filled calendar month in one currency.
### Fee Handling
- Gross needs no fee facts. Net is conditional on complete supported fees, fee currency/sign policy, and conserving allocation; fee-incomplete affected rows are partial or unavailable, never estimated.
### Open-Trade Handling
- Open, pending, excluded, and `needs-decision` rows cannot create realized monthly buckets or denominator membership; retain them only through coverage.
### Sample-Size Considerations
- When exposed, show the selected denominator rule, eligible-month count, contributing closed-trade count, and any zero-filled months separately; do not represent an unexposed or empty population as zero.

## `profit_per_share` Language Registry
### Exact Definition
Planned P/L amount per an approved, exact, reconciling share denominator for eligible `ready_closed` trades in one currency on a declared gross or net basis. Exact quantity and eligible closed P/L facts exist, but the approved per-share numerator, denominator, fee basis, and named public capability are not exposed.
### Formal Wording
- Profit per share; P/L per share.
### Normal Conversational Wording
- How much profit did I make per share?
### Trader Slang
- Per-share P&L; profit a share.
### Abbreviations
- `PPS` and every other bare short alphabetic token remain ticker candidates unless explicit profit/per-share metric grammar is present.
### Common Misspellings
- Profit per shre; profitt per share.
### Noisy or Incomplete Input
- P&L a share; how much per share.
### Singular and Plural Forms
- Profit per share; profits per share by approved group.
### Full Questions
- What is my net profit per share for AMD this month?
### Commands
- Show gross profit per share for my closed trades.
### Sentence Fragments
- P&L per share.
### Follow-Up Wording
- Only fee-covered trades; use the same share denominator.
### Correction Wording
- Profit per share, not net P&L per 100 shares or percentage return.
### Comparison Wording
- Compare profit per share by ticker with denominators.
### Ranking Wording
- Rank setups by profit per share with exact share denominators.
### Negated Wording
- Do not divide by shares outstanding or infer a quantity denominator.
### Exclusion Wording
- Exclude fee-incomplete affected trades for requested net basis after the denominator contract is defined.
### Multi-Filter Wording
- Net profit per share for short AMD in July.
### Multi-Part Question Wording
- Show profit per share and net P&L per 100 shares with their denominators.
### Ambiguous Wording
- Profit per share: clarify P/L basis first; do not assume a share denominator.
### Negative Examples
These examples must not map to this concept.
- Net P&L per 100 shares; percentage return; account return; earnings per share; how should I increase my profit per share?
### Context Requirements
- Server-authorized account scope, eligible `ready_closed` population, one currency, declared gross/net basis, and an approved exact reconciling share numerator and denominator are required.
### Required Data
- Eligible closed P/L, exact executed quantity and direction, approved numerator/denominator policy, one currency, and complete supported fee facts for net; the named public capability is currently absent.
### Optional Data
- Date, ticker, direction, accepted setup/tag filter, and comparison group.
### Valid Filters
- Planned authorized scope, closing-date range, ticker, direction, and accepted labels; no implicit cross-currency merge or quantity inference.
### Valid Groupings
- Planned approved date/ticker/direction/label groupings with separate currency partitions and an exact reconciling share denominator per result.
### Valid Operators
- Planned exact per-share calculation, comparison, and ranking with numerator and denominator disclosure once the named capability is exposed.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- `net_pnl_per_100_shares`, percentage return, account return, shares outstanding, implicit quantity, open rows, causal/advice claims, silent currency conversion, or a V3/sample/guessed fallback.
### Default Interpretation
- No gross/net basis or share-denominator default exists. This named per-share metric remains Planned even though exact quantities and eligible closed P/L facts exist.
### Clarification Conditions
- If P/L basis is absent, ask for gross or net first. After basis is fixed, address the approved reconciling share denominator separately; do not compound the questions.
### Recommended Clarification Wording
- Do you want gross profit per share or net profit per share after fees?
### Unsupported Conditions
- The requested named metric is Planned until approved per-share numerator, reconciling denominator, gross/net fee basis, and public capability are exposed; also unsupported are shares-outstanding division, inferred quantities, incomplete or unsupported net fees, cross-currency merge, V3/sample data, guessed values, and causal/advice requests.
### Target Analytics Tool or Query Capability
- Planned `JournalAnalyticsService` closed-P/L-per-approved-share-denominator capability with exact numerator/denominator reconciliation and declared selected basis.
### Result Units
- Planned monetary amount per approved reconciling share in one currency.
### Fee Handling
- Gross needs no fee facts. Net is conditional on complete supported fees, fee currency/sign policy, conserving allocation, and an approved per-share numerator; fee-incomplete affected rows are partial or unavailable, never estimated.
### Open-Trade Handling
- Only eligible `ready_closed` trades may contribute once the contract exists. Open, pending, excluded, and `needs-decision` rows remain coverage only and cannot supply an inferred denominator.
### Sample-Size Considerations
- When exposed, show closed-trade count, total exact approved share denominator, numerator, basis, and any exclusions; never report missing or zero denominator as zero.

## `pnl_by_direction` Language Registry
### Exact Definition
Selected gross or net realized P/L grouped by directly observed Journal direction over eligible `ready_closed` Stock trades in one currency. Category 11 owns direction semantics; this registry consumes the observed group and cannot redefine, infer, or derive direction.
### Formal Wording
- P/L by direction; realized P/L grouped by observed long or short direction.
### Normal Conversational Wording
- How does my P&L break down between longs and shorts?
### Trader Slang
- Long versus short P&L; long/short breakdown.
### Abbreviations
- No bare short alphabetic abbreviation is safe; `PBD`, `LSP`, and similar forms remain ticker candidates unless explicit P/L-by-direction or long/short metric grammar is present.
### Common Misspellings
- Pnl by diretion; profit by dirction.
### Noisy or Incomplete Input
- Long short pnl; pnl by dir.
### Singular and Plural Forms
- P/L by direction; long and short P/L groups.
### Full Questions
- Show my net realized P/L by direction this month.
### Commands
- Break down gross P/L by long and short direction for July.
### Sentence Fragments
- Long vs short P&L.
### Follow-Up Wording
- Only fee-covered groups; compare June.
### Correction Wording
- Group P/L by observed direction, not trade side or a direction you infer.
### Comparison Wording
- Compare net P/L for observed long versus short groups.
### Ranking Wording
- Rank accepted setups by net P/L within each observed direction, with counts.
### Negated Wording
- Do not say long or short is better, and do not infer direction from P/L or order side.
### Exclusion Wording
- Exclude fee-incomplete affected trades for requested net basis.
### Multi-Filter Wording
- Net P/L by direction for AMD in July.
### Multi-Part Question Wording
- Show gross P/L by direction and closed-trade counts for each group.
### Ambiguous Wording
- Direction P&L: clarify gross or net basis; Category 11 controls the meaning of direction.
### Negative Examples
These examples must not map to this concept.
- Is long better than short? Which direction should I trade? Buy versus sell order side; infer direction from my winners.
### Context Requirements
- Server-authorized account scope, one currency, declared gross/net basis, eligible `ready_closed` Stock population, and directly observed Journal direction supplied under Category 11 semantics are required.
### Required Data
- Eligible closed P/L, direct Journal direction value, exact closed-trade/group counts, one currency, and complete supported fee facts for net.
### Optional Data
- Closing-date range, ticker, accepted setup/tag filter, and comparison group.
### Valid Filters
- Authorized scope, closing-date range, ticker, directly observed direction, and accepted labels; no implicit cross-currency merge or inferred direction.
### Valid Groupings
- Directly observed Category 11 direction, approved date/ticker/label groupings, with separate currency partitions and exact group counts.
### Valid Operators
- Exact selected-basis grouping, comparison, and ranking within observed direction groups with counts and coverage.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- Direction inference, order-side substitution, causal claims that a direction is better, long/short recommendations, zero evidence for a missing direction group, open rows, silent currency conversion, or V3/sample/guessed fallback.
### Default Interpretation
- A request to group P/L by direction returns only observed eligible direction groups within the authorized scope. It has no gross/net basis default and does not fabricate an empty group as zero evidence.
### Clarification Conditions
- Ask for gross or net basis when absent. Do not ask the user to define direction here; use only the directly observed Category 11 direction or report coverage.
### Recommended Clarification Wording
- Do you want P/L by direction before fees or net after fees?
### Unsupported Conditions
- Missing directly observed direction, incomplete or unsupported fees for requested net basis, cross-currency merge without supported conversion, requests to infer direction or recommend long/short, V3/sample data, guessed values, and causal claims are unsupported.
### Target Analytics Tool or Query Capability
- `JournalAnalyticsService` selected-basis realized-P/L grouping by directly observed Journal direction with exact group counts and coverage.
### Result Units
- Monetary amount per observed direction group in one currency, with closed-trade count and coverage.
### Fee Handling
- Gross needs no fee facts. Net is conditional on complete supported fees, fee currency/sign policy, and conserving allocation; fee-incomplete affected trades are partial or unavailable, never estimated.
### Open-Trade Handling
- Exclude open, pending, excluded, and `needs-decision` rows from realized direction-group P/L; retain them only through coverage and never turn them into a direction result.
### Sample-Size Considerations
- Show each observed eligible direction group's closed-trade count and coverage. A direction with no eligible trades is an empty group, not zero P/L evidence.

## `pnl_before_fees` Language Registry
### Exact Definition
Language-routing alias for the single exact `gross_pnl` deterministic calculation: realized P/L before fees over eligible `ready_closed` Stock round trips in one currency. It is not a second metric calculation, contribution, stored value, or population and must never double count `gross_pnl`.
### Formal Wording
- P/L before fees; realized gross P/L.
### Normal Conversational Wording
- What was my P&L before fees?
### Trader Slang
- Pre-fee P&L; P&L before commissions.
### Abbreviations
- Bare `PL`, `P/L`, and any short alphabetic token remain ticker candidates unless explicit before-fees or gross-P/L metric grammar is present.
### Common Misspellings
- Pnl before fee; profit before feees.
### Noisy or Incomplete Input
- Before fees pnl; pre fee profit.
### Singular and Plural Forms
- P/L before fees; before-fee P/L by approved group.
### Full Questions
- What is my realized P/L before fees for July?
### Commands
- Show gross P/L before fees for my closed trades.
### Sentence Fragments
- P&L before fees.
### Follow-Up Wording
- Compare that before-fee P&L with June; do not count it twice.
### Correction Wording
- P/L before fees, not net P/L after fees or gross profit alone.
### Comparison Wording
- Compare realized P/L before fees by month.
### Ranking Wording
- Rank accepted setups by before-fee P/L with closed-trade counts.
### Negated Wording
- Do not include fees, open P/L, gross profit only, gross loss only, or a duplicate gross-P/L contribution.
### Exclusion Wording
- Exclude open, pending, excluded, and `needs-decision` rows; no fee-incomplete exclusion is needed for before-fee P/L.
### Multi-Filter Wording
- P/L before fees for short AMD in July.
### Multi-Part Question Wording
- Show P/L before fees and net P/L after fees as separate bases for the same closed population.
### Ambiguous Wording
- Before-fee P/L: clarify whether the request is realized closed P/L when open scope is unclear; do not create a second gross metric.
### Negative Examples
These examples must not map to this concept.
- Net P/L after fees; gross profit; gross loss; open P/L before fees; count gross P/L and P/L before fees separately; why did fees hurt my trading?
### Context Requirements
- Server-authorized account scope, eligible `ready_closed` Stock population, one currency, realized closing scope, and an explicit or current date context are required.
### Required Data
- Eligible closed gross P/L and exact closed-trade coverage in one currency. No fee facts are required because this wording routes to the before-fee gross calculation.
### Optional Data
- Closing-date range, ticker, direction, accepted setup/tag filter, and comparison group.
### Valid Filters
- Authorized scope, closing-date range, ticker, directly observed direction, and accepted labels; no implicit cross-currency merge or open-trade inclusion.
### Valid Groupings
- Approved date/ticker/direction/label groupings with separate currency partitions and exact closed-trade counts.
### Valid Operators
- Exact single `gross_pnl` calculation, comparison, and ranking with counts; the alias may not add, sum, or contribute a duplicate value.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- `net_pnl`, `pnl_after_fees`, gross profit alone, gross loss alone, open/unrealized P/L, fee causation/advice, a second calculation or contribution, silent currency conversion, or V3/sample/guessed fallback.
### Default Interpretation
- Explicit before-fee P/L routes to the one `gross_pnl` calculation for eligible realized closed trades in one currency. It has no open-trade default and never creates a second result or double count.
### Clarification Conditions
- If realized versus open scope is unclear, ask that focused question first. After realized scope is fixed, ask for a period separately only when no explicit or current date context exists.
### Recommended Clarification Wording
- Are you asking for realized closed P/L before fees?
### Unsupported Conditions
- Open or unrealized before-fee P/L without a supported valuation contract, cross-currency merge without supported conversion, a request to treat this alias as a second metric, V3/sample data, guessed values, and causal/advice requests are unsupported.
### Target Analytics Tool or Query Capability
- `JournalAnalyticsService` exact `gross_pnl` selected-currency realized closed-trade calculation; `pnl_before_fees` is a language alias only.
### Result Units
- Monetary amount of realized gross P/L in one currency, with closed-trade coverage; no duplicate alias value is emitted.
### Fee Handling
- Before-fee/gross P/L has no fee dependency and must not reconstruct, estimate, subtract, or require fee facts. Net after-fee P/L is a distinct requested basis with its own conditional fee coverage.
### Open-Trade Handling
- Exclude open, pending, excluded, and `needs-decision` rows from the `gross_pnl` population; retain them only through coverage.
### Sample-Size Considerations
- Show eligible closed-trade count and coverage. An empty realized population is unavailable, not zero, and the alias must not increase any metric count or aggregate.

## `pnl_after_fees` Language Registry
### Exact Definition
Language-routing alias for the single exact `net_pnl` deterministic calculation: realized P/L after complete supported fees over eligible `ready_closed` Stock round trips in one currency. It is not a second metric calculation, contribution, stored value, or population and must never double count `net_pnl`.
### Formal Wording
- P/L after fees; realized net P/L.
### Normal Conversational Wording
- What was my P&L after fees?
### Trader Slang
- Post-fee P&L; after-commission P&L.
### Abbreviations
- Bare `PL`, `P/L`, and any short alphabetic token remain ticker candidates unless explicit after-fees or net-P/L metric grammar is present.
### Common Misspellings
- Pnl after fee; profit after feees.
### Noisy or Incomplete Input
- After fees pnl; post fee profit.
### Singular and Plural Forms
- P/L after fees; after-fee P/L by approved group.
### Full Questions
- What is my realized P/L after fees for July?
### Commands
- Show net P/L after fees for my closed trades.
### Sentence Fragments
- P&L after fees.
### Follow-Up Wording
- Compare that after-fee P&L with June; do not count it twice.
### Correction Wording
- P/L after fees, not gross P/L before fees, gross profit alone, or unrealized P/L.
### Comparison Wording
- Compare realized P/L after fees by month.
### Ranking Wording
- Rank accepted setups by after-fee P/L with fee-covered closed-trade counts.
### Negated Wording
- Do not include open P/L, use a gross basis, estimate missing fees, or create a duplicate net-P/L contribution.
### Exclusion Wording
- Exclude affected rows with incomplete or unsupported fees for requested net basis; keep their coverage explicit rather than estimating.
### Multi-Filter Wording
- P/L after fees for short AMD in July.
### Multi-Part Question Wording
- Show P/L after fees and P/L before fees as separate bases for the same closed population.
### Ambiguous Wording
- After-fee P/L: clarify whether the request is realized closed P/L when open scope is unclear; do not create a second net metric.
### Negative Examples
These examples must not map to this concept.
- P/L before fees; gross profit; gross loss; unrealized P/L after fees; count net P/L and P/L after fees separately; why did fees hurt my trading?
### Context Requirements
- Server-authorized account scope, eligible `ready_closed` Stock population, one currency, realized closing scope, complete supported fee facts, and an explicit or current date context are required.
### Required Data
- Eligible closed gross P/L, complete supported fee facts, fee currency, fee-sign policy, conserving fee allocation, exact net P/L, and closed-trade coverage in one currency.
### Optional Data
- Closing-date range, ticker, direction, accepted setup/tag filter, and comparison group.
### Valid Filters
- Authorized scope, closing-date range, ticker, directly observed direction, and accepted labels; no implicit cross-currency merge or open-trade inclusion.
### Valid Groupings
- Approved date/ticker/direction/label groupings with separate currency partitions, exact fee-covered closed-trade counts, and explicit partial/unavailable coverage.
### Valid Operators
- Exact single `net_pnl` calculation, comparison, and ranking with counts; the alias may not add, sum, or contribute a duplicate value.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`.
### Incompatible Combinations
- `gross_pnl`, `pnl_before_fees`, gross profit alone, gross loss alone, open/unrealized P/L, missing-fee reconstruction, fee causation/advice, a second calculation or contribution, silent currency conversion, or V3/sample/guessed fallback.
### Default Interpretation
- Explicit after-fee P/L routes to the one `net_pnl` calculation for eligible realized closed trades in one currency. It has no open-trade default, requires complete supported fees, and never creates a second result or double count.
### Clarification Conditions
- If realized versus open scope is unclear, ask that focused question first. After realized scope is fixed, ask for a period separately only when no explicit or current date context exists.
### Recommended Clarification Wording
- Are you asking for realized closed P/L after fees?
### Unsupported Conditions
- Affected rows with incomplete or unsupported fees, unsupported fee currency/sign/allocation, open or unrealized after-fee P/L without a supported valuation contract, cross-currency merge without supported conversion, a request to treat this alias as a second metric, V3/sample data, guessed values, and causal/advice requests are unsupported or explicitly partial/unavailable.
### Target Analytics Tool or Query Capability
- `JournalAnalyticsService` exact `net_pnl` selected-currency realized closed-trade calculation with complete supported fee coverage; `pnl_after_fees` is a language alias only.
### Result Units
- Monetary amount of realized net P/L in one currency, with fee-covered closed-trade coverage; no duplicate alias value is emitted.
### Fee Handling
- Net P/L requires complete supported fee facts, fee currency/sign policy, and conserving allocation. Affected missing or unsupported fees produce explicit partial or unavailable coverage; never estimate, reconstruct, or silently omit them.
### Open-Trade Handling
- Exclude open, pending, excluded, and `needs-decision` rows from the `net_pnl` population; retain them only through coverage.
### Sample-Size Considerations
- Show fee-covered eligible closed-trade count, excluded/partial coverage, and fee completeness. An empty net population is unavailable, not zero, and the alias must not increase any metric count or aggregate.

Language registry record count: **22 of 22**. All Section 6 registry records
are approved and locked at version 1; this does not authorize an AI Chat runtime.

---

# 7. Evaluation Cases Deliverable

## 7.1 Evaluation Case Schema

Evaluation production is authorized after lead production review of the 22-name
inventory and Sections 5–6. The target is **484 cases**: 22 case types for
each of the 22 controlling metrics. Every saved object must use this exact
21-field schema and key order.

```json
{
  "caseId": "",
  "caseType": "canonical",
  "input": "",
  "expectedPrimaryIntent": "",
  "expectedSecondaryIntents": [],
  "expectedCanonicalConcepts": [],
  "expectedFilters": [],
  "expectedGroupings": [],
  "expectedOperators": [],
  "expectedComparison": null,
  "expectedTimeRange": null,
  "expectedSelectedEntity": null,
  "expectedContextRequirements": [],
  "expectedCapabilityStatus": "Supported",
  "expectedProtectedAction": null,
  "confirmationExpected": false,
  "clarificationExpected": false,
  "expectedClarificationQuestion": null,
  "unsupportedExpected": false,
  "expectedUnsupportedReason": null,
  "notes": ""
}
```

## 7.2 Required Case Types

Authorized next deliverable. Evaluation production must cover canonical, formal
paraphrase, conversational paraphrase, trader slang, abbreviation,
misspelling, noisy input, command, fragment, follow-up, correction,
comparison, ranking, negation, exclusion, multi-filter, multi-part, ambiguity,
negative examples, unsupported data, selected entity, and cross-category
cases. The target is 22 case types for each of 22 metrics; no case is claimed
until saved.

## 7.3 Evaluation Summary

| Case Type | Required | Completed | Passed | Notes |
|---|---:|---:|---:|---|
| Canonical | 22 | 22 | | C2-E1-01 through C2-E22-01 saved |
| Formal paraphrase | 22 | 22 | | C2-E1-02 through C2-E22-02 saved |
| Conversational paraphrase | 22 | 22 | | C2-E1-03 through C2-E22-03 saved |
| Slang | 22 | 22 | | C2-E1-04 through C2-E22-04 saved |
| Abbreviations | 22 | 22 | | C2-E1-05 through C2-E22-05 saved |
| Misspelling | 22 | 22 | | C2-E1-06 through C2-E22-06 saved |
| Noisy input | 22 | 22 | | C2-E1-07 through C2-E22-07 saved |
| Commands | 22 | 22 | | C2-E1-08 through C2-E22-08 saved |
| Fragments | 22 | 22 | | C2-E1-09 through C2-E22-09 saved |
| Follow-ups | 22 | 22 | | C2-E1-10 through C2-E22-10 saved |
| Corrections | 22 | 22 | | C2-E1-11 through C2-E22-11 saved |
| Comparisons | 22 | 22 | | C2-E1-12 through C2-E22-12 saved |
| Rankings | 22 | 22 | | C2-E1-13 through C2-E22-13 saved |
| Negation | 22 | 22 | | C2-E1-14 through C2-E22-14 saved |
| Exclusion | 22 | 22 | | C2-E1-15 through C2-E22-15 saved |
| Multi-filter | 22 | 22 | | C2-E1-16 through C2-E22-16 saved |
| Multi-part | 22 | 22 | | C2-E1-17 through C2-E22-17 saved |
| Ambiguity | 22 | 22 | | C2-E1-18 through C2-E22-18 saved |
| Negative examples | 22 | 22 | | C2-E1-19 through C2-E22-19 saved |
| Unsupported data | 22 | 22 | | C2-E1-20 through C2-E22-20 saved |
| Selected entity | 22 | 22 | | C2-E1-21 through C2-E22-21 saved |
| Cross-category | 22 | 22 | | C2-E1-22 through C2-E22-22 saved |

## 7.4 Structured Evaluation Arrays

### gross_profit

```json
[
  {"caseId":"C2-E1-01","caseType":"canonical","input":"Show my gross profit for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Canonical gross-profit request; use only ready_closed positive gross P/L and never reconstruct fees or include open trades."},
  {"caseId":"C2-E1-02","caseType":"formal_paraphrase","input":"Calculate total positive realized P/L before fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording maps to gross_profit, not gross_pnl; no fee facts or open-trade value is needed."},
  {"caseId":"C2-E1-03","caseType":"conversational_paraphrase","input":"How much gross profit did my winning closed trades make before fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit winning closed-trade population","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording explicitly selects winning ready_closed trades, so it maps to positive realized gross P/L rather than generic gross_pnl."},
  {"caseId":"C2-E1-04","caseType":"trader_slang","input":"Show my green before-fee profit for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Green is positive P/L slang here; it does not request causation, advice, fees, or open positions."},
  {"caseId":"C2-E1-05","caseType":"abbreviation","input":"GP (gross profit) for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit gross profit metric grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare GP remains ticker-shaped unless explicit gross-profit grammar is present; AMD is the only symbol filter here."},
  {"caseId":"C2-E1-06","caseType":"misspelling","input":"Show my gross profitt for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correct the spelling noise without changing gross-profit before-fee meaning or adding open trades."},
  {"caseId":"C2-E1-07","caseType":"noisy_input","input":"gross profit July closed only before fees","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens still explicitly restrict the metric to closed positive gross P/L before fees."},
  {"caseId":"C2-E1-08","caseType":"command","input":"Calculate gross profit for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests one deterministic gross-profit calculation; do not reconstruct fees or include open P/L."},
  {"caseId":"C2-E1-09","caseType":"fragment","input":"Gross profit, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short fragment has explicit metric and period grammar; it remains a before-fee positive closed-P/L calculation."},
  {"caseId":"C2-E1-10","caseType":"follow_up","input":"Now show gross profit before fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves the trusted prior account and date context; it does not create a fee-reconstruction or open-trade request."},
  {"caseId":"C2-E1-11","caseType":"correction","input":"No, I meant gross profit before fees, not net P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes the selected basis to gross positive P/L before fees and does not double count or calculate net P/L."},
  {"caseId":"C2-E1-12","caseType":"comparison","input":"Compare my gross profit for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum","positive only","before fees","separate populations"],"expectedComparison":"AMD versus MSFT gross profit","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compare separately computed positive ready_closed gross P/L populations; do not merge currencies or reconstruct fees."},
  {"caseId":"C2-E1-13","caseType":"ranking","input":"Rank my accepted setups by gross profit for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sum","positive only","before fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses exact group counts and positive closed gross P/L; it does not recommend a setup or infer an unaccepted label."},
  {"caseId":"C2-E1-14","caseType":"negation","input":"Show gross profit for July, not net P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July","exclude net basis"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation explicitly selects positive gross P/L before fees and excludes net-basis interpretation."},
  {"caseId":"C2-E1-15","caseType":"exclusion","input":"Show gross profit for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion removes only AMD from the eligible closed gross-profit population; it does not delete or alter Journal facts."},
  {"caseId":"C2-E1-16","caseType":"multi_filter","input":"Show gross profit for short AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","directly observed short direction","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple explicit filters retain Category 11 direction semantics and never infer direction or include open trades."},
  {"caseId":"C2-E1-17","caseType":"multi_part","input":"Show gross profit for AMD in July and include the closed trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["gross_profit","retrieve_records"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Primary operation is the metric; retrieve_records is secondary only because evidence rows are explicitly requested."},
  {"caseId":"C2-E1-18","caseType":"ambiguous","input":"Profit for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit","gross_pnl","net_pnl"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","metric-basis disambiguation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean positive-only gross profit before fees, combined gross P/L before fees, or net P/L after fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Generic profit must not silently select gross_profit, gross_pnl, or net_pnl; ask one focused metric-choice question that distinguishes positive-only gross profit, combined gross P/L, and net P/L."},
  {"caseId":"C2-E1-19","caseType":"negative_example","input":"Show my net P/L after fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative gross-profit case: map to net_pnl after fees, never to positive-only gross_profit."},
  {"caseId":"C2-E1-20","caseType":"unsupported_data","input":"Show gross profit for my imported rows with missing execution allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["imported rows","missing execution allocation"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","exact execution allocation","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Eligible ready_closed execution allocation is missing, so positive gross P/L cannot be determined exactly in one currency without a fallback.","notes":"Recognize gross_profit but return unsupported for missing execution allocation; never estimate, use sample data, or invent a fallback."},
  {"caseId":"C2-E1-21","caseType":"selected_entity_context","input":"Show gross profit for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["selected closed-trade group","eligible ready_closed Stock round trips","positive gross P/L","one currency"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and server-authorized; do not accept an untrusted identifier or expand beyond its account scope."},
  {"caseId":"C2-E1-22","caseType":"cross_category","input":"Show gross profit by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_profit","pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sum","positive only","before fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Category 11 direction","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; the cross-category grouping consumes provisional Category 11 direction semantics without redefining, inferring, or claiming that the later category is locked."}
]
```

### gross_loss

```json
[
  {"caseId":"C2-E2-01","caseType":"canonical","input":"Show my gross loss for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Canonical gross-loss request; sum only negative ready_closed gross P/L and retain its negative sign before fees."},
  {"caseId":"C2-E2-02","caseType":"formal_paraphrase","input":"Calculate aggregate negative realized P/L before fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal aggregate-negative wording maps to gross_loss, not gross_pnl, absolute loss, or net_pnl."},
  {"caseId":"C2-E2-03","caseType":"conversational_paraphrase","input":"How much did my losing closed trades lose before fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit losing closed-trade population","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording explicitly selects losing ready_closed trades and preserves the negative gross-P/L result."},
  {"caseId":"C2-E2-04","caseType":"trader_slang","input":"Show my red trade money before commissions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Red trade money here means aggregate negative closed gross P/L before fees; it is not a recommendation or open-position value."},
  {"caseId":"C2-E2-05","caseType":"abbreviation","input":"GL (gross loss) for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit gross-loss metric grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"GL routes only because explicit gross-loss grammar is present; bare GL or PL stays ticker-shaped and must not auto-route."},
  {"caseId":"C2-E2-06","caseType":"misspelling","input":"Show my gros losse for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correct spelling noise without changing the aggregate negative before-fee result or adding open trades."},
  {"caseId":"C2-E2-07","caseType":"noisy_input","input":"gross loss July closed only before fees","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens still explicitly restrict the metric to closed negative gross P/L before fees."},
  {"caseId":"C2-E2-08","caseType":"command","input":"Calculate gross loss for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests one deterministic gross-loss calculation with no fee reconstruction or open P/L."},
  {"caseId":"C2-E2-09","caseType":"fragment","input":"Gross losses, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short fragment has explicit aggregate-loss and period grammar; plural does not request a count of losses."},
  {"caseId":"C2-E2-10","caseType":"follow_up","input":"Now show gross loss before fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior account and date context without reconstructing fees or including open trades."},
  {"caseId":"C2-E2-11","caseType":"correction","input":"No, I meant gross loss before fees, not absolute loss dollars.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects signed aggregate gross loss and rejects an absolute-value transformation."},
  {"caseId":"C2-E2-12","caseType":"comparison","input":"Compare my gross loss for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum","negative only","retain negative value","before fees","separate populations"],"expectedComparison":"AMD versus MSFT gross loss","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compare separately computed negative ready_closed gross-P/L populations; do not merge currencies or convert the sign to an absolute loss."},
  {"caseId":"C2-E2-13","caseType":"ranking","input":"Rank my accepted setups by gross loss for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sum","negative only","retain negative value","before fees","ascending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking preserves signed gross-loss totals and does not recommend a setup or infer an unaccepted label."},
  {"caseId":"C2-E2-14","caseType":"negation","input":"Show gross loss for July, not net P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July","exclude net basis"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation explicitly selects negative gross P/L before fees and excludes net-basis interpretation."},
  {"caseId":"C2-E2-15","caseType":"exclusion","input":"Show gross loss for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion removes only AMD from the eligible closed gross-loss population; it does not delete or alter Journal facts."},
  {"caseId":"C2-E2-16","caseType":"multi_filter","input":"Show gross loss for short AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","directly observed short direction","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple explicit filters retain Category 11 direction semantics and never infer direction or include open trades."},
  {"caseId":"C2-E2-17","caseType":"multi_part","input":"Show gross loss for AMD in July and include the closed trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["gross_loss","retrieve_records"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Primary operation is the metric; retrieve_records is secondary only because evidence rows are explicitly requested."},
  {"caseId":"C2-E2-18","caseType":"ambiguous","input":"Loss for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss","largest_loss","net_pnl"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","metric-basis and aggregation disambiguation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean aggregate gross loss before fees, the single largest losing trade, or net P/L after fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Generic loss must not silently select aggregate gross_loss, largest_loss, or a net-basis result; ask one focused metric-choice question."},
  {"caseId":"C2-E2-19","caseType":"negative_example","input":"Show the largest loss for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July","declared gross or net basis required"],"expectedGroupings":[],"expectedOperators":["minimum","single trade"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared selected P/L basis","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative gross-loss case: map to largest_loss, which is one extreme trade rather than the aggregate signed gross-loss total."},
  {"caseId":"C2-E2-20","caseType":"unsupported_data","input":"Show gross loss for my imported rows without execution allocation or a resolved trade currency.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["imported rows","missing execution allocation","missing trade currency"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","exact execution allocation","one resolved trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Eligible ready_closed execution allocation and the trade-currency partition are missing, so signed gross loss cannot be determined exactly without a fallback.","notes":"Recognize gross_loss but return unsupported for missing execution allocation and currency; never estimate, use sample data, or invent a fallback."},
  {"caseId":"C2-E2-21","caseType":"selected_entity_context","input":"Show gross loss for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["selected closed-trade group","eligible ready_closed Stock round trips","negative gross P/L","one currency"],"expectedGroupings":[],"expectedOperators":["sum","negative only","retain negative value","before fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and server-authorized; do not accept an untrusted identifier or expand beyond its account scope."},
  {"caseId":"C2-E2-22","caseType":"cross_category","input":"Show gross loss by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_loss","pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","negative gross P/L","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sum","negative only","retain negative value","before fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Category 11 direction","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; the cross-category grouping consumes provisional Category 11 direction semantics without redefining, inferring, or claiming that the later category is locked."}
]
```

### gross_pnl

```json
[
  {"caseId":"C2-E3-01","caseType":"canonical","input":"Show my gross P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Canonical gross-P&L request combines positive and negative ready_closed gross P/L before fees without reconstructing fees."},
  {"caseId":"C2-E3-02","caseType":"formal_paraphrase","input":"Calculate combined realized P/L before allocated fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal combined before-fee wording maps to gross_pnl, not positive-only gross_profit, signed gross_loss alone, or net_pnl."},
  {"caseId":"C2-E3-03","caseType":"conversational_paraphrase","input":"What was all my closed-trade P&L before fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit closed-trade population","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational all-closed-trade wording selects the combined signed gross-P&L population before fees."},
  {"caseId":"C2-E3-04","caseType":"trader_slang","input":"Give me the green plus red before commissions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Green plus red means both gains and losses; this is not a request for gross_profit only or a net-after-fee result."},
  {"caseId":"C2-E3-05","caseType":"abbreviation","input":"Gross P&L (P/L) for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit gross P&L metric grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"P&L routes only because explicit gross-P&L grammar is present; bare PL or other short tokens remain ticker-shaped and must not auto-route."},
  {"caseId":"C2-E3-06","caseType":"misspelling","input":"Show my gros P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correct the spelling noise without changing the combined before-fee closed-trade meaning."},
  {"caseId":"C2-E3-07","caseType":"noisy_input","input":"gross pnl July all closed before fees","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens still explicitly request all closed combined gross P/L before fees."},
  {"caseId":"C2-E3-08","caseType":"command","input":"Calculate gross P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests the one deterministic gross-P&L calculation, with no duplicate alias calculation or fee reconstruction."},
  {"caseId":"C2-E3-09","caseType":"fragment","input":"Gross P&L, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short fragment has explicit combined gross-P&L and period grammar; it excludes open and unresolved rows."},
  {"caseId":"C2-E3-10","caseType":"follow_up","input":"Now show P&L before fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl","pnl_before_fees"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The before-fees alias routes to the same gross_pnl calculation once and preserves trusted prior account and date context."},
  {"caseId":"C2-E3-11","caseType":"correction","input":"No, I meant P&L before fees, not P&L after fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl","pnl_before_fees"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction switches from the net-after-fee routing to the single gross_pnl calculation; the alias must not create a duplicate or double count."},
  {"caseId":"C2-E3-12","caseType":"comparison","input":"Compare my gross P&L for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum","combined gains and losses","before fees","separate populations"],"expectedComparison":"AMD versus MSFT gross P&L","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compare separately computed combined gross-P&L populations; do not merge currencies or reconstruct fees."},
  {"caseId":"C2-E3-13","caseType":"ranking","input":"Rank my accepted setups by gross P&L for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sum","combined gains and losses","before fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses exact grouped gross P&L and does not recommend a setup or infer an unaccepted label."},
  {"caseId":"C2-E3-14","caseType":"negation","input":"Show gross P&L for July, not net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July","exclude net basis"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation explicitly selects combined before-fee gross P&L and excludes net-basis interpretation."},
  {"caseId":"C2-E3-15","caseType":"exclusion","input":"Show gross P&L for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion removes only AMD from the eligible closed gross-P&L population; it does not delete or alter Journal facts."},
  {"caseId":"C2-E3-16","caseType":"multi_filter","input":"Show gross P&L for short AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","directly observed short direction","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple explicit filters retain Category 11 direction semantics and never infer direction or include open trades."},
  {"caseId":"C2-E3-17","caseType":"multi_part","input":"Show gross P&L for AMD in July and include the closed trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["gross_pnl","retrieve_records"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Primary operation is the metric; retrieve_records is secondary only because evidence rows are explicitly requested."},
  {"caseId":"C2-E3-18","caseType":"ambiguous","input":"P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl","net_pnl","unrealized_pnl"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized-basis and open-position-scope disambiguation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean realized gross P&L before fees, realized net P&L after fees, or unrealized P&L on open positions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Generic P&L must not silently force a realized gross basis, realized net basis, or unrealized open-position scope; ask one focused metric-choice question."},
  {"caseId":"C2-E3-19","caseType":"negative_example","input":"Show July gross profit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","positive gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","positive only","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative gross-P&L case: map to positive-only gross_profit, never to combined gross_pnl."},
  {"caseId":"C2-E3-20","caseType":"unsupported_data","input":"Show gross P&L for imported rows without execution allocation or a resolved trade currency.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["imported rows","missing execution allocation","missing trade currency"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","exact execution allocation","one resolved trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Eligible ready_closed execution allocation and the trade-currency partition are missing, so gross P&L cannot be determined exactly without a fallback.","notes":"Recognize gross_pnl but return unsupported for missing execution allocation and currency; never estimate, use sample data, or invent a fallback."},
  {"caseId":"C2-E3-21","caseType":"selected_entity_context","input":"Show gross P&L for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["selected closed-trade group","eligible ready_closed Stock round trips","positive and negative gross P/L","one currency"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and server-authorized; do not accept an untrusted identifier or expand beyond its account scope."},
  {"caseId":"C2-E3-22","caseType":"cross_category","input":"Show gross P&L by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["gross_pnl","pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sum","combined gains and losses","before fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Category 11 direction","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; the cross-category grouping consumes provisional Category 11 direction semantics without redefining, inferring, or claiming that the later category is locked."}
]
```

### net_pnl

```json
[
  {"caseId":"C2-E4-01","caseType":"canonical","input":"Show my net P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Canonical net-P&L request uses only fee-covered ready_closed trades with complete supported fee facts and conserving allocation."},
  {"caseId":"C2-E4-02","caseType":"formal_paraphrase","input":"Calculate realized P/L after allocated fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal after-fee realized wording maps to net_pnl, not gross P&L or a result with estimated or incomplete fees."},
  {"caseId":"C2-E4-03","caseType":"conversational_paraphrase","input":"How much P&L did I keep after fees from closed trades in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit closed-trade population","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational after-fee closed-trade wording selects net P&L only when exact fee coverage is complete."},
  {"caseId":"C2-E4-04","caseType":"trader_slang","input":"What did I keep after commissions in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep after commissions is after-fee P&L slang; it never authorizes estimated fees or an open-position value."},
  {"caseId":"C2-E4-05","caseType":"abbreviation","input":"Net P&L (P/L) for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit net-P&L metric grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"P&L routes only because explicit net-P&L grammar is present; bare PL and other short tokens remain ticker-shaped and must not auto-route."},
  {"caseId":"C2-E4-06","caseType":"misspelling","input":"Show my nett P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correct spelling noise without changing the exact fee-covered after-fee result."},
  {"caseId":"C2-E4-07","caseType":"noisy_input","input":"net pnl July closed complete fees","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens still explicitly require fee-covered closed net P&L, not an estimate or gross fallback."},
  {"caseId":"C2-E4-08","caseType":"command","input":"Calculate net P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests the exact fee-covered net-P&L calculation with no missing-fee reconstruction."},
  {"caseId":"C2-E4-09","caseType":"fragment","input":"Net P&L, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short fragment has explicit net metric and period grammar and excludes open or unresolved rows."},
  {"caseId":"C2-E4-10","caseType":"follow_up","input":"Now show P&L after fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl","pnl_after_fees"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The after-fees alias routes to the same net_pnl calculation once and preserves trusted prior account and date context."},
  {"caseId":"C2-E4-11","caseType":"correction","input":"No, I meant P&L after fees, not P&L before fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl","pnl_after_fees"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction switches from gross-before-fee routing to the single net_pnl calculation; the alias must not create a duplicate or double count."},
  {"caseId":"C2-E4-12","caseType":"comparison","input":"Compare my net P&L for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees","separate populations"],"expectedComparison":"AMD versus MSFT net P&L","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compare separately computed fee-covered net-P&L populations; do not merge currencies or use incomplete fee rows as exact."},
  {"caseId":"C2-E4-13","caseType":"ranking","input":"Rank my accepted setups by net P&L for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses exact grouped net P&L and does not recommend a setup or infer an unaccepted label."},
  {"caseId":"C2-E4-14","caseType":"negation","input":"Show net P&L for July, not gross P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","exclude gross basis"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation explicitly selects the fee-covered net basis and excludes gross-basis interpretation."},
  {"caseId":"C2-E4-15","caseType":"exclusion","input":"Show net P&L for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion removes only AMD from the eligible fee-covered net-P&L population; it does not delete or alter Journal facts."},
  {"caseId":"C2-E4-16","caseType":"multi_filter","input":"Show net P&L for short AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","directly observed short direction","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple explicit filters retain Category 11 direction semantics and never infer direction or include open trades."},
  {"caseId":"C2-E4-17","caseType":"multi_part","input":"Show net P&L for AMD in July and include the closed trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["net_pnl","retrieve_records"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Primary operation is the metric; retrieve_records is secondary only because evidence rows are explicitly requested."},
  {"caseId":"C2-E4-18","caseType":"ambiguous","input":"P&L for the July statement.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl","net_pnl","unrealized_pnl"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized-basis and open-position-scope disambiguation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean realized gross P&L before fees, realized net P&L after fees, or unrealized P&L on open positions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ambiguous P&L must not silently force gross, net, or unrealized scope; ask one focused metric-choice question."},
  {"caseId":"C2-E4-19","caseType":"negative_example","input":"Show my gross P&L before fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","positive and negative gross P/L","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","combined gains and losses","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative net-P&L case: map to gross_pnl before fees, never to the fee-covered net calculation."},
  {"caseId":"C2-E4-20","caseType":"unsupported_data","input":"Show net P&L for imported rows with missing fee currency, fee sign, and allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["imported rows","missing fee currency","missing fee sign","missing fee allocation"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one resolved trade-currency partition","complete fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Required fee currency, fee sign, and conserving allocation facts are missing, so net P&L cannot be determined exactly without an estimated or reconstructed fallback.","notes":"Recognize net_pnl but return unavailable for incomplete fee facts; never estimate, reconstruct, or substitute gross P&L as net."},
  {"caseId":"C2-E4-21","caseType":"selected_entity_context","input":"Show net P&L for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["selected closed-trade group","eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and server-authorized; do not accept an untrusted identifier or expand beyond its account scope."},
  {"caseId":"C2-E4-22","caseType":"cross_category","input":"Show net P&L by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["net_pnl","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","directly observed Category 11 direction","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; the cross-category grouping consumes provisional Category 11 direction semantics without redefining, inferring, or claiming that the later category is locked."}
]
```

### realized_pnl

```json
[
  {"caseId":"C2-E5-01","caseType":"canonical","input":"Show my realized gross P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Realized P&L is a scope selector; the explicit gross basis routes to the before-fee closed-trade calculation."},
  {"caseId":"C2-E5-02","caseType":"formal_paraphrase","input":"Calculate realized net P/L after allocated fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","net basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared net basis","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal realized net wording is executable only with the declared net basis and complete supported fee facts."},
  {"caseId":"C2-E5-03","caseType":"conversational_paraphrase","input":"How much realized gross P&L did I make before fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording remains executable because it explicitly declares realized gross before-fee scope."},
  {"caseId":"C2-E5-04","caseType":"trader_slang","input":"Show my closed-book net after commissions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","net basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared net basis","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Closed-book net after commissions is realized net P&L slang, never an open-position mark or estimated-fee result."},
  {"caseId":"C2-E5-05","caseType":"abbreviation","input":"RPL (realized gross P&L) for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit realized gross-P&L grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"RPL routes only because explicit realized-gross grammar is present; bare RPL or PL remains ticker-shaped and must not auto-route."},
  {"caseId":"C2-E5-06","caseType":"misspelling","input":"Show my realised net P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","net basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","declared net basis","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the spelling variant without losing the explicit net basis or fee-completeness requirement."},
  {"caseId":"C2-E5-07","caseType":"noisy_input","input":"realized gross pnl July closed before fees","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens retain the declared realized gross basis and exclude open or unresolved rows."},
  {"caseId":"C2-E5-08","caseType":"command","input":"Calculate realized net P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","net basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared net basis","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command is executable because net basis is declared and must retain complete fee coverage."},
  {"caseId":"C2-E5-09","caseType":"fragment","input":"Realized gross P&L, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short fragment is executable because it declares gross basis; realized P&L never chooses one silently."},
  {"caseId":"C2-E5-10","caseType":"follow_up","input":"Now show realized net P&L after fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","net basis","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","declared net basis","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior account/date context while explicitly selecting the fee-covered net basis."},
  {"caseId":"C2-E5-11","caseType":"correction","input":"No, I meant realized gross P&L before fees, not net after fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","declared gross basis","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes the declared basis to gross; realized P&L remains the population scope rather than a third calculation."},
  {"caseId":"C2-E5-12","caseType":"comparison","input":"Compare realized gross P&L for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum","realized closed trades","before fees","separate populations"],"expectedComparison":"AMD versus MSFT realized gross P&L","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison is exact because gross basis is declared for both separate closed-trade populations."},
  {"caseId":"C2-E5-13","caseType":"ranking","input":"Rank my accepted setups by realized net P&L for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","net basis","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared net basis","accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses exact grouped realized net P&L and does not recommend a setup or infer an unaccepted label."},
  {"caseId":"C2-E5-14","caseType":"negation","input":"Show realized net P&L for July, not gross P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","net basis","complete supported fees","one currency","July","exclude gross basis"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared net basis","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation explicitly selects realized net basis and excludes gross-basis interpretation."},
  {"caseId":"C2-E5-15","caseType":"exclusion","input":"Show realized gross P&L for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","AMD symbol resolution","server-authoritative account scope","one trade-currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion removes only AMD from the declared-basis realized population; it does not delete or alter Journal facts."},
  {"caseId":"C2-E5-16","caseType":"multi_filter","input":"Show realized net P&L for short AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","net basis","complete supported fees","one currency","directly observed short direction","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared net basis","AMD symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple explicit filters preserve the selected net basis, Category 11 direction semantics, and exclusion of open trades."},
  {"caseId":"C2-E5-17","caseType":"multi_part","input":"Show realized gross P&L for AMD in July and include the closed trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["realized_pnl","gross_pnl","retrieve_records"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Primary operation is the declared-basis metric; retrieve_records is secondary only because supporting closed rows are explicitly requested."},
  {"caseId":"C2-E5-18","caseType":"ambiguous","input":"Realized P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl","net_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized-basis disambiguation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean realized gross P&L before fees or realized net P&L after fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Realized P&L selects the closed-trade population but must not silently choose gross or net basis; ask one focused basis question."},
  {"caseId":"C2-E5-19","caseType":"negative_example","input":"Show the open-position P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","July"],"expectedGroupings":[],"expectedOperators":["current market-price mark"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative realized-P&L case: map to unrealized_pnl on legitimate-open positions, which remains unavailable without an approved current mark."},
  {"caseId":"C2-E5-20","caseType":"unsupported_data","input":"Calculate realized net P&L for imports with missing execution allocation and fee allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","net_pnl"],"expectedFilters":["imported rows","net basis","missing execution allocation","missing fee allocation"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["declared net basis","server-authoritative account scope","exact execution allocation","complete fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Required execution allocation and complete fee-allocation facts are missing, so realized net P&L cannot be determined exactly without a fallback.","notes":"Recognize the realized net request but return unavailable for missing execution or fee facts; never estimate, reconstruct, or silently switch to gross."},
  {"caseId":"C2-E5-21","caseType":"selected_entity_context","input":"Show realized gross P&L for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["selected closed-trade group","eligible ready_closed Stock round trips","gross basis","one currency"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","declared gross basis","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and server-authorized; do not accept an untrusted identifier or expand beyond its account scope."},
  {"caseId":"C2-E5-22","caseType":"cross_category","input":"Show realized gross P&L by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["realized_pnl","gross_pnl","pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sum","realized closed trades","before fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","server-authoritative account scope","one trade-currency partition","directly observed Category 11 direction","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; the cross-category grouping consumes provisional Category 11 direction semantics without redefining, inferring, or claiming that the later category is locked."}
]
```

### unrealized_pnl

```json
[
  {"caseId":"C2-E6-01","caseType":"canonical","input":"Show my current unrealized P&L for legitimate-open positions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Current unrealized P&L requires a current approved mark; do not estimate from cost, last execution, V3, samples, or guesses."},
  {"caseId":"C2-E6-02","caseType":"formal_paraphrase","input":"Calculate marked P/L on legitimate-open positions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","July"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Marked open-position P/L is unavailable until an approved current mark exists; do not substitute a stale or last-execution price."},
  {"caseId":"C2-E6-03","caseType":"conversational_paraphrase","input":"How much am I up or down on the trades I still have open?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Open trades means legitimate-open only; pending, excluded, and needs-decision rows are not treated as open positions."},
  {"caseId":"C2-E6-04","caseType":"trader_slang","input":"Show my floating P&L right now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Floating P&L is marked P&L on legitimate-open positions, not realized P&L or advice."},
  {"caseId":"C2-E6-05","caseType":"abbreviation","input":"UPL (unrealized P&L) for AMD right now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","AMD","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["explicit unrealized-P&L metric grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"UPL routes only because explicit unrealized-P&L grammar is present; bare UPL remains ticker-shaped and must not auto-route."},
  {"caseId":"C2-E6-06","caseType":"misspelling","input":"Show my unrealised P&L right now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Normalize the spelling variant but retain the unavailable current-mark boundary."},
  {"caseId":"C2-E6-07","caseType":"noisy_input","input":"unrealized pnl open now mark","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Noisy open-P&L wording still requires an approved current mark and cannot fall back to a guess."},
  {"caseId":"C2-E6-08","caseType":"command","input":"Calculate unrealized P&L for AMD right now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","AMD","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Command is recognized but unavailable; do not create a current-value estimate from execution facts."},
  {"caseId":"C2-E6-09","caseType":"fragment","input":"Unrealized P&L, now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Short fragment identifies an unavailable marked open-position metric and must not produce a sampled or guessed result."},
  {"caseId":"C2-E6-10","caseType":"follow_up","input":"Now show the unrealized P&L on those open positions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["trusted prior legitimate-open position context","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":"prior trusted server-authorized open-position context","expectedContextRequirements":["required prior legitimate-open position context","server-authoritative account scope","one trade-currency partition","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Follow-up preserves only trusted open-position context; it remains unavailable without a current approved mark."},
  {"caseId":"C2-E6-11","caseType":"correction","input":"No, I meant unrealized P&L on open positions, not realized P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["legitimate-open position scope","server-authoritative account scope","one trade-currency partition","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Correction changes from closed realized scope to unavailable marked legitimate-open scope without accepting pending or decision rows as open."},
  {"caseId":"C2-E6-12","caseType":"comparison","input":"Compare unrealized P&L for AMD and MSFT right now.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","AMD","MSFT","current request"],"expectedGroupings":["ticker"],"expectedOperators":["approved current market-price mark","separate populations"],"expectedComparison":"AMD versus MSFT unrealized P&L","expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","approved current market-price marks"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Comparison intent is recognized but unavailable; do not compare estimates or merge currencies."},
  {"caseId":"C2-E6-13","caseType":"ranking","input":"Rank my open positions by unrealized P&L right now.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request"],"expectedGroupings":["open position"],"expectedOperators":["approved current market-price mark","descending rank"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","separate trade-currency partitions","approved current market-price marks"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Ranking intent is recognized but unavailable; do not rank positions from last executions, samples, or guesses."},
  {"caseId":"C2-E6-14","caseType":"negation","input":"Show unrealized P&L, not realized P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request","exclude realized scope"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark","exclude"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["legitimate-open position scope","server-authoritative account scope","one trade-currency partition","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Negation explicitly selects unavailable marked open-position scope and excludes realized P&L."},
  {"caseId":"C2-E6-15","caseType":"exclusion","input":"Show unrealized P&L excluding AMD right now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","current request","exclude AMD"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark","exclude"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Exclusion is recognized but cannot yield an exact unavailable open-position metric without current marks."},
  {"caseId":"C2-E6-16","caseType":"multi_filter","input":"Show unrealized P&L for the open AMD short right now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","AMD","directly observed short direction","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark","equals"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Multiple filters retain legitimate-open and Category 11 direction semantics, but no mark is available to calculate the value."},
  {"caseId":"C2-E6-17","caseType":"multi_part","input":"Show unrealized P&L for AMD and list the open position evidence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["unrealized_pnl","retrieve_records"],"expectedFilters":["legitimate-open positions","one currency","AMD","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","bounded open-position evidence","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"The unavailable metric remains primary; retrieve_records is secondary only for bounded evidence and cannot manufacture a current mark."},
{"caseId":"C2-E6-18","caseType":"ambiguous","input":"What is my P&L right now?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","unrealized_pnl"],"expectedFilters":["current request"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","realized-versus-open-position scope disambiguation","approved current market-price mark if unrealized is selected"],"expectedCapabilityStatus":"","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want realized P&L on closed trades or unrealized P&L on open positions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"First response is clarification-only; defer selected-concept capability status and any unavailable reason until the user chooses."},
  {"caseId":"C2-E6-19","caseType":"negative_example","input":"Show my realized gross P&L before fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["realized_pnl","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","gross basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum","realized closed trades","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["declared gross basis","server-authoritative account scope","one trade-currency partition","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative unrealized-P&L case: map to supported declared-basis realized gross P&L, not an open-position mark."},
  {"caseId":"C2-E6-20","caseType":"unsupported_data","input":"Calculate unrealized P&L for open positions using the last execution price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["legitimate-open positions","one currency","last execution price requested"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Recognize the requested metric but reject last-execution pricing as an unsupported substitute for a current approved market mark."},
  {"caseId":"C2-E6-21","caseType":"selected_entity_context","input":"Show unrealized P&L for the selected open position.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unrealized_pnl"],"expectedFilters":["trusted selected legitimate-open position","one currency","current request"],"expectedGroupings":[],"expectedOperators":["approved current market-price mark"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":"trusted server-authorized selected legitimate-open position from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","legitimate-open cost","approved current market-price mark"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Selected entity must be trusted and server-authorized, but selection cannot overcome the missing approved current mark."},
  {"caseId":"C2-E6-22","caseType":"cross_category","input":"Show unrealized P&L by observed direction right now.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["unrealized_pnl","pnl_by_direction"],"expectedFilters":["legitimate-open positions","one currency","current request","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["approved current market-price mark","group by"],"expectedComparison":null,"expectedTimeRange":"current request","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","approved current market-price mark","directly observed Category 11 direction"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An approved current market-price mark is missing for legitimate-open positions, so unrealized P/L cannot be determined exactly without a fallback.","notes":"Grouping intent is recognized but unavailable; provisional Category 11 direction does not create a price mark or claim later-category lock."}
]
```

### total_return

```json
[
  {"caseId":"C2-E7-01","caseType":"canonical","input":"Show my account total return for 2026.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Account total return is unavailable; never use trade P/L, balance change, or entry-notional return as a proxy."},
  {"caseId":"C2-E7-02","caseType":"formal_paraphrase","input":"Calculate account-level total return for Q1 2026.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","Q1 2026"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"Q1 2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Formal account-return wording remains unavailable without the complete account-performance fact set."},
  {"caseId":"C2-E7-03","caseType":"conversational_paraphrase","input":"How much did my whole account return this year?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","current calendar year"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"current calendar year","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Whole-account return is not reconstructed from closed-trade P/L, open equity guesses, or a raw balance change."},
  {"caseId":"C2-E7-04","caseType":"trader_slang","input":"What was my account ROI for this quarter?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","current quarter"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"current quarter","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Account ROI is treated as account total return only with an approved account-return denominator, never entry notional."},
  {"caseId":"C2-E7-05","caseType":"abbreviation","input":"TR (total return) for the authorized account in 2026.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["explicit total-return metric grammar","fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"TR routes only because explicit total-return grammar is present; bare TR or ROI remains ticker-shaped and must not auto-route."},
  {"caseId":"C2-E7-06","caseType":"misspelling","input":"Show my total retrun for 2026.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Normalize spelling but retain the unavailable complete-account-facts boundary."},
  {"caseId":"C2-E7-07","caseType":"noisy_input","input":"total return 2026 account whole","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Noisy account-return wording is recognized but cannot use a balance-change, P/L, or guessed fallback."},
  {"caseId":"C2-E7-08","caseType":"command","input":"Calculate total return for the authorized account in 2026.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"The account scope is server-authoritative and fixed; language must not choose another account."},
  {"caseId":"C2-E7-09","caseType":"fragment","input":"Account total return, 2026.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Short fragment identifies the unavailable account-return metric for the fixed authorized account."},
  {"caseId":"C2-E7-10","caseType":"follow_up","input":"Now show total return for that same quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","prior quarter"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"prior quarter","expectedSelectedEntity":"prior trusted server-authorized account/date context","expectedContextRequirements":["required prior period context","fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Follow-up preserves only trusted prior period context; it cannot switch or select an account."},
  {"caseId":"C2-E7-11","caseType":"correction","input":"No, I meant total account return for Q1, not net trade P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","Q1"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"Q1","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Correction selects account total return over a period, not a proxy based on net trade P&L."},
  {"caseId":"C2-E7-12","caseType":"comparison","input":"Compare total return for Q1 and Q2 2026 in my authorized account.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","Q1 2026","Q2 2026"],"expectedGroupings":["period"],"expectedOperators":["approved account-return formula","declared period denominator","separate periods"],"expectedComparison":"Q1 2026 versus Q2 2026 total return","expectedTimeRange":"Q1 and Q2 2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominators"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Comparison is between periods inside the fixed authorized account, never between accounts."},
  {"caseId":"C2-E7-13","caseType":"ranking","input":"Rank the months of 2026 by total return for my authorized account.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":["month"],"expectedOperators":["approved account-return formula","declared period denominator","descending rank"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominators"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Ranking is across periods within the fixed account; it must not rank or choose accounts."},
  {"caseId":"C2-E7-14","caseType":"negation","input":"Show total return for 2026, not net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026","exclude net trade P&L proxy"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator","exclude"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Negation explicitly rejects a net-P&L proxy and does not make account return available."},
  {"caseId":"C2-E7-15","caseType":"exclusion","input":"Show total return for 2026 excluding deposits and withdrawals.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026","external cash-flow treatment requested"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator","cash-flow adjustment"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Cash-flow treatment is part of the missing approved account-return contract, not permission to ignore deposits or withdrawals."},
  {"caseId":"C2-E7-16","caseType":"multi_filter","input":"Show total return for Q1 2026 after distributions in my authorized account.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","Q1 2026","distribution treatment requested"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator","distribution treatment"],"expectedComparison":null,"expectedTimeRange":"Q1 2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Multiple account-return filters remain unavailable; they must not imply current open-equity or FX facts."},
  {"caseId":"C2-E7-17","caseType":"multi_part","input":"Show total return for 2026 and the cash flows behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["total_return","retrieve_records"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator","bounded account evidence"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"The unavailable metric remains primary; retrieve_records is secondary evidence only and cannot invent the account-return contract."},
{"caseId":"C2-E7-18","caseType":"ambiguous","input":"What was my return in 2026?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return","average_percentage_return"],"expectedFilters":["2026"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account-total-return versus per-trade-return disambiguation","period required"],"expectedCapabilityStatus":"","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean total return for your authorized account or a per-trade percentage return?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"First response is clarification-only; defer selected-concept capability status and any unavailable reason until the user chooses."},
  {"caseId":"C2-E7-19","caseType":"negative_example","input":"Show net P&L after fees for August.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","August"],"expectedGroupings":[],"expectedOperators":["sum","gross minus allocated charge costs plus allocated charge credits","after fees"],"expectedComparison":null,"expectedTimeRange":"August","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","realized closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative total-return case: map to supported exact net P&L, never treat it as account return."},
  {"caseId":"C2-E7-20","caseType":"unsupported_data","input":"Calculate total return from my trade P&L and account balance change for 2026.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026","trade P&L proxy requested","balance-change proxy requested"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Recognize total return but reject trade P&L and balance change as unsupported proxies."},
  {"caseId":"C2-E7-21","caseType":"selected_entity_context","input":"Show total return for the selected authorized account period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","trusted selected period"],"expectedGroupings":[],"expectedOperators":["approved account-return formula","declared period denominator"],"expectedComparison":null,"expectedTimeRange":"selected trusted period","expectedSelectedEntity":"trusted server-authorized period context only","expectedContextRequirements":["fixed server-authoritative account scope","trusted selected period context","approved equity or balance history","external cash flows","distributions","FX policy","period denominator"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Only the selected period may come from trusted context; account selection remains fixed and server-authoritative."},
  {"caseId":"C2-E7-22","caseType":"cross_category","input":"Show total return by calendar quarter for the authorized account in 2026.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["total_return"],"expectedFilters":["server-authorized account","2026"],"expectedGroupings":["calendar quarter under provisional Calendar semantics"],"expectedOperators":["approved account-return formula","declared period denominators","group by"],"expectedComparison":null,"expectedTimeRange":"2026","expectedSelectedEntity":null,"expectedContextRequirements":["fixed server-authoritative account scope","approved equity or balance history","external cash flows","distributions","FX policy","period denominators","provisional Calendar grouping semantics"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Approved account equity or balance history, external cash flows, distributions, FX policy, and period denominator facts are missing, so total return cannot be determined exactly without a fallback.","notes":"Grouping is across calendar periods within the fixed account; provisional Calendar semantics do not authorize account grouping or an unavailable fallback."}
]
```

### average_net_pnl_per_trade

```json
[
  {"caseId":"C2-E8-01","caseType":"canonical","input":"Show my average net P&L per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee currency/sign/allocation coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact arithmetic mean of fee-covered closed-trade net P&L; never substitute gross or include open rows."},
  {"caseId":"C2-E8-02","caseType":"formal_paraphrase","input":"Calculate the mean net realized P/L per eligible closed trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal mean wording maps to the per-trade net average, not total net P&L or a median."},
  {"caseId":"C2-E8-03","caseType":"conversational_paraphrase","input":"What did I make or lose per trade after fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational per-trade after-fee wording selects the full eligible closed-trade mean, not winners or losers only."},
  {"caseId":"C2-E8-04","caseType":"trader_slang","input":"What was my after-commission average per ticket in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticket slang here means closed trade and does not authorize a gross, daily, or percentage average."},
  {"caseId":"C2-E8-05","caseType":"abbreviation","input":"Avg net P&L/trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit average-net-per-trade grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation routes only with explicit metric grammar; bare short tokens remain ticker-shaped."},
  {"caseId":"C2-E8-06","caseType":"misspelling","input":"Show my avrage net P&L per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing net basis or the closed-trade denominator."},
  {"caseId":"C2-E8-07","caseType":"noisy_input","input":"avg net pnl trade July closed fees complete","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens still require complete fee-covered closed-trade net P&L and a nonzero denominator."},
  {"caseId":"C2-E8-08","caseType":"command","input":"Calculate average net P&L per trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests the exact arithmetic mean, not total net P&L."},
  {"caseId":"C2-E8-09","caseType":"fragment","input":"Average net P&L per trade, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment is explicit about net basis and per-trade denominator."},
  {"caseId":"C2-E8-10","caseType":"follow_up","input":"Now show the average net P&L per trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior context and does not widen the denominator."},
  {"caseId":"C2-E8-11","caseType":"correction","input":"No, I meant average net P&L per trade, not median net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects arithmetic mean rather than median."},
  {"caseId":"C2-E8-12","caseType":"comparison","input":"Compare average net P&L per trade for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum net P&L","divide by each eligible count","after fees","separate populations"],"expectedComparison":"AMD versus MSFT average net P&L per trade","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","complete fee coverage","nonzero eligible denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compare each group using its own exact fee-covered denominator."},
  {"caseId":"C2-E8-13","caseType":"ranking","input":"Rank my accepted setups by average net P&L per trade for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sum net P&L","divide by each eligible count","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","complete fee coverage","nonzero eligible denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses exact group denominators and does not recommend a setup."},
  {"caseId":"C2-E8-14","caseType":"negation","input":"Show average net P&L per trade for July, not gross average P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","exclude gross basis"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible count","after fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation explicitly retains fee-covered net basis."},
  {"caseId":"C2-E8-15","caseType":"exclusion","input":"Show average net P&L per trade for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible count","after fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the eligible population; it does not alter facts."},
  {"caseId":"C2-E8-16","caseType":"multi_filter","input":"Show average net P&L per trade for short AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","directly observed short direction","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible count","after fees","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters retain net basis and observed direction without including open rows."},
  {"caseId":"C2-E8-17","caseType":"multi_part","input":"Show average net P&L per trade for AMD in July and list the trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["average_net_pnl_per_trade","retrieve_records"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible count","after fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric is primary; retrieval is secondary evidence only."},
  {"caseId":"C2-E8-18","caseType":"ambiguous","input":"What was my average result in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade","average_daily_pnl"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","per-closed-trade versus per-realized-trading-day disambiguation","gross-versus-net basis follow-up if per-trade is selected"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should the average be per closed trade or per realized trading day?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask the highest-impact denominator question first; if per-trade is chosen, ask gross versus net basis separately next rather than combining fields."},
  {"caseId":"C2-E8-19","caseType":"negative_example","input":"Show median net P&L per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sorted median","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative average case maps to median, not arithmetic mean."},
  {"caseId":"C2-E8-20","caseType":"unsupported_data","input":"Show average net P&L per trade for otherwise eligible July closed trades with missing fee allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["otherwise eligible ready_closed Stock round trips","missing or unsupported fee allocation","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Required supported fee allocation coverage is incomplete, so average net P&L per trade cannot be determined exactly without substituting gross rows or estimating fees.","notes":"Recognize the metric but return partial or unavailable for the exact net-fee blocker; never substitute gross rows or estimate fees."},
  {"caseId":"C2-E8-21","caseType":"selected_entity_context","input":"Show average net P&L per trade for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible count","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope."},
  {"caseId":"C2-E8-22","caseType":"cross_category","input":"Show average net P&L per trade by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_net_pnl_per_trade","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sum net P&L","divide by each eligible count","after fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominators","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; provisional direction semantics do not infer direction or claim later-category lock."}
]
```

### median_net_pnl_per_trade

```json
[
  {"caseId":"C2-E9-01","caseType":"canonical","input":"Show my median net P&L per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact sorted median of fee-covered ready-closed trade-level net P/L; an empty population is unavailable, not zero."},
  {"caseId":"C2-E9-02","caseType":"formal_paraphrase","input":"Calculate the median net realized P/L across eligible closed trades for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal median wording selects the middle fee-covered net trade result, not an average or total."},
  {"caseId":"C2-E9-03","caseType":"conversational_paraphrase","input":"What was my middle after-fee trade result in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Middle after-fee trade wording selects the sorted trade-level net median, not winners or losers only."},
  {"caseId":"C2-E9-04","caseType":"trader_slang","input":"What was my typical take-home ticket in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["typical trade wording resolved to median","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Typical take-home ticket refers to the median net closed trade here, not a gross or percentage result."},
  {"caseId":"C2-E9-05","caseType":"abbreviation","input":"Med net P&L/trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit median-net-per-trade grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation routes only with explicit metric grammar; bare short tokens remain ticker-shaped."},
  {"caseId":"C2-E9-06","caseType":"misspelling","input":"Show my medain net P&L per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the spelling without changing the sorted net basis or eligible population."},
  {"caseId":"C2-E9-07","caseType":"noisy_input","input":"median net pnl trade July closed fees complete","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens retain the exact fee-covered closed-trade median and do not imply a total or average."},
  {"caseId":"C2-E9-08","caseType":"command","input":"Calculate median net P&L per trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests the exact sorted net median, not total net P/L."},
  {"caseId":"C2-E9-09","caseType":"fragment","input":"Median net P&L per trade, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment explicitly identifies the fee-covered per-trade net median."},
  {"caseId":"C2-E9-10","caseType":"follow_up","input":"Now show the median net P&L per trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior context and selects median instead of a previously requested average."},
  {"caseId":"C2-E9-11","caseType":"correction","input":"No, I meant median net P&L per trade, not average net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction switches from arithmetic mean to the exact sorted median."},
  {"caseId":"C2-E9-12","caseType":"comparison","input":"Compare median net P&L per trade for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sort each trade-level net P&L population","select each middle value or exact mean of two middle values when even","after fees","separate populations"],"expectedComparison":"AMD versus MSFT median net P&L per trade","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","complete fee coverage","nonzero eligible populations"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison keeps independent sorted fee-covered populations and does not combine currencies."},
  {"caseId":"C2-E9-13","caseType":"ranking","input":"Rank my accepted setups by median net P&L per trade for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sort each trade-level net P&L population","select each middle value or exact mean of two middle values when even","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","complete fee coverage","nonzero eligible populations"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses each accepted setup's own sorted eligible population and makes no recommendation."},
  {"caseId":"C2-E9-14","caseType":"negation","input":"Show median net P&L per trade for July, not gross median P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","exclude gross basis"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation retains the fee-covered net basis and excludes a gross median."},
  {"caseId":"C2-E9-15","caseType":"exclusion","input":"Show median net P&L per trade for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the eligible population before the exact sorted median is taken."},
  {"caseId":"C2-E9-16","caseType":"multi_filter","input":"Show median net P&L per trade for short AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","directly observed short direction","AMD","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters retain observed direction, exact net basis, and closed-trade eligibility."},
  {"caseId":"C2-E9-17","caseType":"multi_part","input":"Show median net P&L per trade for AMD in July and list the trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["median_net_pnl_per_trade","retrieve_records"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric remains primary; retrieval provides bounded evidence only."},
  {"caseId":"C2-E9-18","caseType":"ambiguous","input":"What was my typical trade result in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade","average_net_pnl_per_trade"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","median-versus-average disambiguation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should typical mean the median or the average per trade?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask median versus average first only; do not combine a basis question until it is later needed."},
  {"caseId":"C2-E9-19","caseType":"negative_example","input":"Show median percentage return per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["named percentage-return capability","explicit approved percentage basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative monetary-net case maps to the separate median percentage-return concept, not a net-P/L median."},
  {"caseId":"C2-E9-20","caseType":"unsupported_data","input":"Show median net P&L per trade for otherwise eligible July closed trades with missing fee allocation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["otherwise eligible ready_closed Stock round trips","missing or unsupported fee allocation","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Required supported fee allocation coverage is incomplete, so median net P&L per trade cannot be determined exactly without substituting gross rows or estimating fees.","notes":"Recognize the metric but return partial or unavailable for the exact missing-fee blocker; never substitute gross rows or estimate fees."},
  {"caseId":"C2-E9-21","caseType":"selected_entity_context","input":"Show median net P&L per trade for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope."},
  {"caseId":"C2-E9-22","caseType":"cross_category","input":"Show median net P&L per trade by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_net_pnl_per_trade","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sort each trade-level net P&L population","select each middle value or exact mean of two middle values when even","after fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible populations","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; provisional direction semantics do not infer direction or claim later-category lock."}
]
```

### average_percentage_return

```json
[
  {"caseId":"C2-E10-01","caseType":"canonical","input":"Show my average percentage return per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the planned trade-level percentage average; do not substitute aggregate return_on_entry_notional, total return, or a dollar average."},
  {"caseId":"C2-E10-02","caseType":"formal_paraphrase","input":"Calculate the arithmetic mean of defined per-trade percentage returns for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording requires the declared numerator, per-trade denominator, and coverage contract."},
  {"caseId":"C2-E10-03","caseType":"conversational_paraphrase","input":"What percent did I make on average per closed trade in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational percent-per-trade language is planned interpretation, not account return or net-P/L averaging."},
  {"caseId":"C2-E10-04","caseType":"trader_slang","input":"What was my avg percent per ticket in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticket slang here means eligible closed trade only under the future declared percentage-return contract."},
  {"caseId":"C2-E10-05","caseType":"abbreviation","input":"APR (average percentage return) per trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","AMD","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit average-percentage-return grammar","AMD symbol resolution","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"APR routes only with explicit per-trade percentage-return grammar; bare APR remains ticker-shaped."},
  {"caseId":"C2-E10-06","caseType":"misspelling","input":"Show my averge precent return per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing a denominator, numerator basis, or exposed capability."},
  {"caseId":"C2-E10-07","caseType":"noisy_input","input":"avg percent return trade July closed","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy input is recognized as planned per-trade percentage-return language without inventing a denominator or exposed capability."},
  {"caseId":"C2-E10-08","caseType":"command","input":"Calculate average percentage return per trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","AMD","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command is recognized as planned language and must not fall back to aggregate entry-notional return."},
  {"caseId":"C2-E10-09","caseType":"fragment","input":"Average percentage return per trade, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment names the planned per-trade percentage distribution, not an account-base-currency percentage."},
  {"caseId":"C2-E10-10","caseType":"follow_up","input":"Now show the average percentage return per trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","prior date range"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior account and date context without supplying a missing future contract."},
  {"caseId":"C2-E10-11","caseType":"correction","input":"No, I meant per-trade percentage return, not total account return.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","prior date range"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects planned trade-level percentage-return averaging rather than account-level total return."},
  {"caseId":"C2-E10-12","caseType":"comparison","input":"Compare average percentage return per trade for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values","separate populations"],"expectedComparison":"AMD versus MSFT average percentage return per trade","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison intent is exact, but planned interpretation cannot merge currency partitions or invent the future formula."},
  {"caseId":"C2-E10-13","caseType":"ranking","input":"Rank my accepted setups by average percentage return per trade for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking intent is exact and remains planned until the named metric contract is exposed."},
  {"caseId":"C2-E10-14","caseType":"negation","input":"Show average percentage return per trade for July, not total return.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July","exclude account-level total return"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation rejects account-level total return and does not silently select entry notional or a dollar basis."},
  {"caseId":"C2-E10-15","caseType":"exclusion","input":"Show average percentage return per trade for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the future eligible population; it does not provide the missing metric contract."},
  {"caseId":"C2-E10-16","caseType":"multi_filter","input":"Show average percentage return per trade for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters retain planned percentage-return boundaries and observed direction semantics."},
  {"caseId":"C2-E10-17","caseType":"multi_part","input":"Show average percentage return per trade for AMD in July and list the closed trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["average_percentage_return","retrieve_records"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","AMD","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","bounded closed-trade evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The planned metric is primary and retrieval is bounded evidence only."},
  {"caseId":"C2-E10-18","caseType":"ambiguous","input":"What was my average return in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return","total_return"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","trade-level versus account-level return disambiguation","per-trade denominator follow-up if trade-level is selected"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean average return per trade or account-level total return?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask trade-level versus account-level first; ask the per-trade denominator separately next only if trade-level is selected."},
  {"caseId":"C2-E10-19","caseType":"negative_example","input":"Calculate my after-fee dollar average per closed trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum net P&L","divide by eligible fee-covered closed-trade count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative percentage-return case maps to the supported dollar average, not a percentage-return calculation."},
  {"caseId":"C2-E10-20","caseType":"unsupported_data","input":"Show average percentage return per trade for July when the per-trade denominator and coverage contract are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["eligible closed-trade population","missing approved per-trade denominator or distribution/coverage contract","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The required approved per-trade denominator and distribution/coverage contract are missing, so average percentage return cannot be determined without inventing a formula or fallback.","notes":"Recognize the planned metric but report the exact missing contract; do not use aggregate return_on_entry_notional or account base currency as a proxy."},
  {"caseId":"C2-E10-21","caseType":"selected_entity_context","input":"Show average percentage return per trade for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_percentage_return"],"expectedFilters":["trusted selected closed-trade group","eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope or supply a metric contract."},
  {"caseId":"C2-E10-22","caseType":"cross_category","input":"Show average percentage return per trade by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_percentage_return","pnl_by_direction"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","one selected trade-currency partition","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["calculate each explicitly defined per-trade percentage return","arithmetic mean across eligible values","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved distribution and coverage contract","directly observed Category 11 direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; direction remains provisional Category 11 semantics and the planned metric is not exposed."}
]
```

### median_percentage_return

```json
[
  {"caseId":"C2-E11-01","caseType":"canonical","input":"Show my median percentage return per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the planned sorted per-trade percentage median; do not substitute average percentage return, total return, dollar P/L, or aggregate entry-notional return."},
  {"caseId":"C2-E11-02","caseType":"formal_paraphrase","input":"Calculate the median of defined per-trade percentage returns for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal median wording requires declared numerator basis, denominator, median coverage, and even-count rule."},
  {"caseId":"C2-E11-03","caseType":"conversational_paraphrase","input":"What was my middle percent return per closed trade in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Middle percentage-return wording is planned trade-level median interpretation, not account return or monetary P/L."},
  {"caseId":"C2-E11-04","caseType":"trader_slang","input":"What was my typical percent ticket in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Typical percent ticket identifies a planned trade-level distribution and does not create a denominator or metric capability."},
  {"caseId":"C2-E11-05","caseType":"abbreviation","input":"MPR (median percentage return) per trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","AMD","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit median-percentage-return grammar","AMD symbol resolution","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"MPR routes only with explicit per-trade metric grammar; bare MPR remains ticker-shaped."},
  {"caseId":"C2-E11-06","caseType":"misspelling","input":"Show my medain precent return per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inventing the planned denominator, coverage, or even-count contract."},
  {"caseId":"C2-E11-07","caseType":"noisy_input","input":"median percent return trade July closed","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy input remains planned per-trade percentage median language and does not authorize a fallback."},
  {"caseId":"C2-E11-08","caseType":"command","input":"Calculate median percentage return per trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","AMD","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command is recognized as planned language and must not fall back to aggregate entry-notional return."},
  {"caseId":"C2-E11-09","caseType":"fragment","input":"Median percentage return per trade, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment names the planned per-trade percentage median, not an account-base-currency percentage."},
  {"caseId":"C2-E11-10","caseType":"follow_up","input":"Now show the median percentage return per trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","prior date range"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior scope without providing the missing named capability."},
  {"caseId":"C2-E11-11","caseType":"correction","input":"No, I meant median percentage return per trade, not average percentage return.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","prior date range"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects planned median rather than planned arithmetic average."},
  {"caseId":"C2-E11-12","caseType":"comparison","input":"Compare median percentage return per trade for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result","separate populations"],"expectedComparison":"AMD versus MSFT median percentage return per trade","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison intent is exact, but each group still needs the exposed per-trade median contract."},
  {"caseId":"C2-E11-13","caseType":"ranking","input":"Rank my accepted setups by median percentage return per trade for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking intent is exact and remains planned until the named median contract is exposed."},
  {"caseId":"C2-E11-14","caseType":"negation","input":"Show median percentage return per trade for July, not average percentage return.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July","exclude arithmetic-average interpretation"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation preserves median semantics and does not silently select total return or a dollar median."},
  {"caseId":"C2-E11-15","caseType":"exclusion","input":"Show median percentage return per trade for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the planned eligible population; it does not supply a denominator or median contract."},
  {"caseId":"C2-E11-16","caseType":"multi_filter","input":"Show median percentage return per trade for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters preserve the planned return boundary and observed direction semantics."},
  {"caseId":"C2-E11-17","caseType":"multi_part","input":"Show median percentage return per trade for AMD in July and list the closed trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["median_percentage_return","retrieve_records"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","AMD","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule","bounded closed-trade evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The planned metric is primary and retrieval is bounded evidence only."},
  {"caseId":"C2-E11-18","caseType":"ambiguous","input":"What was my typical percentage return per trade in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return","average_percentage_return"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","median-versus-average per-trade return disambiguation","per-trade denominator follow-up if later needed"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should typical mean the median or the average percentage return per trade?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask median versus average first only; ask the denominator separately later if needed."},
  {"caseId":"C2-E11-19","caseType":"negative_example","input":"Calculate median net P&L per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_net_pnl_per_trade"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sort trade-level net P&L","select middle value or exact mean of two middle values when even","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","nonzero eligible population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative percentage-return case maps to the supported monetary net-P/L median, not a percentage-return metric."},
  {"caseId":"C2-E11-20","caseType":"unsupported_data","input":"Show median percentage return per trade for July when the denominator and median coverage contract are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["eligible closed-trade population","missing approved per-trade denominator or median distribution/coverage contract","July"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The required approved per-trade denominator and median distribution/coverage contract are missing, so median percentage return cannot be determined without inventing a formula or fallback.","notes":"Recognize the planned metric but return the exact missing contract; do not use total return, aggregate entry-notional return, or account base currency as a proxy."},
  {"caseId":"C2-E11-21","caseType":"selected_entity_context","input":"Show median percentage return per trade for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_percentage_return"],"expectedFilters":["trusted selected closed-trade group","eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition"],"expectedGroupings":[],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope or supply a median contract."},
  {"caseId":"C2-E11-22","caseType":"cross_category","input":"Show median percentage return per trade by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_percentage_return","pnl_by_direction"],"expectedFilters":["eligible closed-trade population","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","one selected trade-currency partition","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["calculate each explicitly defined per-trade percentage return","sort eligible values","select middle value or defined even-count middle-pair result","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named capability not exposed","declared gross-or-net numerator basis","approved per-trade denominator","approved median distribution and coverage contract","defined even-count median rule","directly observed Category 11 direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation is secondary; direction remains provisional Category 11 semantics and the planned median is not exposed."}
]
```

### largest_win

```json
[
  {"caseId":"C2-E12-01","caseType":"canonical","input":"Show my largest net win for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct largest-win language ranks eligible positive closed-trade net P/L and excludes open, unresolved, and total P/L."},
  {"caseId":"C2-E12-02","caseType":"formal_paraphrase","input":"Identify the maximum positive gross P/L among eligible July closed trades.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal maximum-positive wording selects one gross-basis closed-trade extreme, not gross profit total."},
  {"caseId":"C2-E12-03","caseType":"conversational_paraphrase","input":"What was my biggest after-fee winning trade in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Biggest after-fee winner maps to the deterministic net largest-win ranking."},
  {"caseId":"C2-E12-04","caseType":"trader_slang","input":"What was my top green net ticket in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Top green ticket is a direct net P/L extreme request, not advice or a quality judgment."},
  {"caseId":"C2-E12-05","caseType":"abbreviation","input":"Largest net win (LWIN) for AMD in July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit largest-win grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation routes only with explicit largest-win grammar; bare LWIN remains ticker-shaped."},
  {"caseId":"C2-E12-06","caseType":"misspelling","input":"Show my largst gross win for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the spelling while retaining explicit gross basis and deterministic ties."},
  {"caseId":"C2-E12-07","caseType":"noisy_input","input":"largest net win July closed positive","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy extrema tokens preserve the positive, eligible closed-trade, after-fee ranking boundary."},
  {"caseId":"C2-E12-08","caseType":"command","input":"Find my biggest gross winning AMD trade in July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command selects a gross positive maximum, not an aggregate profit result."},
  {"caseId":"C2-E12-09","caseType":"fragment","input":"Top net winner, July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment is a direct net largest-win ranking request."},
  {"caseId":"C2-E12-10","caseType":"follow_up","input":"Now show the largest gross win.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["select positive maximum","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior scope and changes only the declared basis to gross."},
  {"caseId":"C2-E12-11","caseType":"correction","input":"No, I meant my largest net win, not total gross profit.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects a single net P/L extreme rather than a gross aggregate."},
  {"caseId":"C2-E12-12","caseType":"comparison","input":"Compare my largest gross win for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["rank_results","calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["select each positive maximum","deterministic ties by close time then stable ID","separate populations"],"expectedComparison":"AMD versus MSFT largest gross win","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","declared gross P&L basis","eligible positive closed-trade populations","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison keeps independent per-ticker positive-extrema populations and does not merge currencies."},
  {"caseId":"C2-E12-13","caseType":"ranking","input":"Rank my closed July trades by gross P&L to show the largest win.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":["closed trade"],"expectedOperators":["rank positive gross P&L descending","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct ranking language is primary and the first positive result is the largest win."},
  {"caseId":"C2-E12-14","caseType":"negation","input":"Show my largest net win for July, not a percentage return or open gain.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","exclude percentage-return basis","exclude open positions"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation retains closed-trade net P/L and excludes percentage and open-position interpretations."},
  {"caseId":"C2-E12-15","caseType":"exclusion","input":"Show my largest gross win for July excluding AMD.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["select positive maximum","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the eligible population before deterministic ranking."},
  {"caseId":"C2-E12-16","caseType":"multi_filter","input":"Show my largest net win among long NVDA trades in July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple filters retain explicit net basis and observed direction without admitting open rows."},
{"caseId":"C2-E12-17","caseType":"multi_part","input":"Explain why I was profitable in July, then show my largest net win.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["rank_results","calculate_metric"],"expectedCanonicalConcepts":["net_pnl","largest_win"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["evidence-grounded explanation","select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","eligible positive closed-trade population","close time","stable ID","bounded result evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The non-superlative explanation request is primary; the largest win is a secondary ranked fact and does not establish cause, quality, or advice."},
  {"caseId":"C2-E12-18","caseType":"ambiguous","input":"What was my best trade in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","dollar P/L versus percentage-return disambiguation","gross-versus-net basis follow-up if dollar P/L is selected"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean best by dollar P/L or by percentage return?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask dollar P/L versus percentage first; ask gross versus net separately only if dollar P/L is selected."},
  {"caseId":"C2-E12-19","caseType":"negative_example","input":"Calculate my total gross profit for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_profit"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum positive gross P&L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","eligible positive closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative extrema case maps to supported gross profit total, not one largest trade."},
  {"caseId":"C2-E12-20","caseType":"unsupported_data","input":"Show my largest gross win for July when no eligible closed trade has positive gross P&L.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July","no qualifying positive trade"],"expectedGroupings":[],"expectedOperators":["select positive maximum","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No eligible ready-closed trade has positive gross P/L, so a largest win is unavailable rather than zero or a non-positive trade.","notes":"Recognize the metric but return unavailable for the exact empty positive population; never substitute a loss, zero, or open gain."},
  {"caseId":"C2-E12-21","caseType":"selected_entity_context","input":"Show the largest net win in the selected closed-trade group.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_win"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["select positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope."},
  {"caseId":"C2-E12-22","caseType":"cross_category","input":"Show my largest net win by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["rank_results","calculate_metric"],"expectedCanonicalConcepts":["largest_win","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by","select each positive maximum after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","close time","stable ID","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and ranking is secondary; provisional direction semantics do not infer direction or make a causal claim."}
]
```

### largest_loss

```json
[
  {"caseId":"C2-E13-01","caseType":"canonical","input":"Show my largest net loss for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct largest-loss language ranks eligible negative closed-trade net P/L and excludes open, unresolved, and total P/L."},
  {"caseId":"C2-E13-02","caseType":"formal_paraphrase","input":"Identify the most negative gross P/L among eligible July closed trades.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["select most negative value","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal most-negative wording selects one gross-basis closed-trade extreme, not gross loss total."},
  {"caseId":"C2-E13-03","caseType":"conversational_paraphrase","input":"What was my biggest after-fee losing trade in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Biggest after-fee loser maps to the deterministic net largest-loss ranking."},
  {"caseId":"C2-E13-04","caseType":"trader_slang","input":"What was my worst red net ticket in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Worst red ticket is a direct net P/L extreme request, not advice or a quality judgment."},
  {"caseId":"C2-E13-05","caseType":"abbreviation","input":"Largest net loss (LLOSS) for AMD in July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit largest-loss grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation routes only with explicit largest-loss grammar; bare LLOSS remains ticker-shaped."},
  {"caseId":"C2-E13-06","caseType":"misspelling","input":"Show my largst gross loss for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["select most negative value","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling while retaining explicit gross basis and deterministic ties."},
  {"caseId":"C2-E13-07","caseType":"noisy_input","input":"largest net loss July closed negative","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy extrema tokens preserve negative, eligible closed-trade, after-fee ranking boundaries."},
  {"caseId":"C2-E13-08","caseType":"command","input":"Find my worst gross losing AMD trade in July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["select most negative value","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command selects a gross negative extreme, not aggregate gross loss."},
  {"caseId":"C2-E13-09","caseType":"fragment","input":"Worst net loser, July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment is a direct net largest-loss ranking request."},
  {"caseId":"C2-E13-10","caseType":"follow_up","input":"Now show the largest gross loss.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["select most negative value","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior scope and changes only declared basis to gross."},
  {"caseId":"C2-E13-11","caseType":"correction","input":"No, I meant my largest net loss, not total gross loss.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects a single net P/L extreme rather than a gross aggregate."},
  {"caseId":"C2-E13-12","caseType":"comparison","input":"Compare my largest gross loss for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["rank_results","calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["select each most negative value","deterministic ties by close time then stable ID","separate populations"],"expectedComparison":"AMD versus MSFT largest gross loss","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","declared gross P&L basis","eligible negative closed-trade populations","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison keeps independent negative-extrema populations and does not merge currencies."},
  {"caseId":"C2-E13-13","caseType":"ranking","input":"Rank my closed July trades by gross P&L to show the largest loss.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":["closed trade"],"expectedOperators":["rank gross P&L ascending","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct ranking language is primary and the first negative result is the largest loss."},
  {"caseId":"C2-E13-14","caseType":"negation","input":"Show my largest net loss for July, not a drawdown percentage or open loss.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","exclude percentage/drawdown basis","exclude open positions"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation retains closed-trade net P/L and excludes percentage, drawdown, and open-position interpretations."},
  {"caseId":"C2-E13-15","caseType":"exclusion","input":"Show my largest gross loss for July excluding AMD.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["select most negative value","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only eligible population before deterministic ranking."},
  {"caseId":"C2-E13-16","caseType":"multi_filter","input":"Show my largest net loss among short NVDA trades in July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","directly observed short direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple filters retain explicit net basis and observed direction without admitting open rows."},
{"caseId":"C2-E13-17","caseType":"multi_part","input":"Explain why I lost money in July, then show my largest net loss.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["rank_results","calculate_metric"],"expectedCanonicalConcepts":["net_pnl","largest_loss"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["evidence-grounded explanation","select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete fee coverage","eligible negative closed-trade population","close time","stable ID","bounded result evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Non-superlative explanation is primary; the largest loss is a secondary ranked fact and does not establish cause, quality, or advice."},
  {"caseId":"C2-E13-18","caseType":"ambiguous","input":"What was my worst trade in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","dollar P/L versus percentage/drawdown disambiguation","gross-versus-net basis follow-up if dollar P/L is selected"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean worst by dollar P/L or by percentage return or drawdown?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask dollar P/L versus percentage/drawdown first; ask gross versus net separately only if dollar P/L is selected."},
  {"caseId":"C2-E13-19","caseType":"negative_example","input":"Calculate my total gross loss for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["gross_loss"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative gross P&L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","eligible negative closed-trade population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative extrema case maps to supported gross loss total, not one largest trade."},
  {"caseId":"C2-E13-20","caseType":"unsupported_data","input":"Show my largest gross loss for July when no eligible closed trade has negative gross P&L.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July","no qualifying negative trade"],"expectedGroupings":[],"expectedOperators":["select most negative value","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No eligible ready-closed trade has negative gross P/L, so a largest loss is unavailable rather than zero or a non-negative trade.","notes":"Recognize the metric but return unavailable for the exact empty negative population; never substitute a win, zero, or open loss."},
  {"caseId":"C2-E13-21","caseType":"selected_entity_context","input":"Show the largest net loss in the selected closed-trade group.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["largest_loss"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["select most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope."},
  {"caseId":"C2-E13-22","caseType":"cross_category","input":"Show my largest net loss by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["rank_results","calculate_metric"],"expectedCanonicalConcepts":["largest_loss","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by","select each most negative value after fees","deterministic ties by close time then stable ID"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","close time","stable ID","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and ranking is secondary; provisional direction semantics do not infer direction or make a causal claim."}
]
```

### average_winning_trade

```json
[
  {"caseId":"C2-E14-01","caseType":"canonical","input":"Show my average net winning trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact arithmetic mean of positive net P/L over eligible closed trades; never include open, decision, or non-positive rows."},
  {"caseId":"C2-E14-02","caseType":"formal_paraphrase","input":"Calculate the mean gross P/L of eligible positive July closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum positive gross P&L","divide by eligible winner count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal mean wording selects positive gross-trade arithmetic average, not gross profit total."},
  {"caseId":"C2-E14-03","caseType":"conversational_paraphrase","input":"How much did I make on my winning trades on average in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational winning-trade average uses positive fee-covered closed trades only."},
  {"caseId":"C2-E14-04","caseType":"trader_slang","input":"What was my avg green net ticket in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Green ticket slang maps to positive net closed-trade mean, not a causal quality claim."},
  {"caseId":"C2-E14-05","caseType":"abbreviation","input":"Avg win net P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit average-winning-trade grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation routes with explicit metric grammar; bare short tokens remain ticker-shaped."},
  {"caseId":"C2-E14-06","caseType":"misspelling","input":"Show my avrage gross winning trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum positive gross P&L","divide by eligible winner count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing basis, positive population, or denominator."},
  {"caseId":"C2-E14-07","caseType":"noisy_input","input":"avg win net pnl July closed positive","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens retain the exact positive fee-covered closed-trade mean."},
  {"caseId":"C2-E14-08","caseType":"command","input":"Calculate average gross winning trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive ready_closed Stock round trips","declared gross P&L basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum positive gross P&L","divide by eligible winner count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests a gross positive-trade mean, not aggregate gross profit."},
  {"caseId":"C2-E14-09","caseType":"fragment","input":"Average net winner, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment explicitly identifies a positive net closed-trade average."},
  {"caseId":"C2-E14-10","caseType":"follow_up","input":"Now show the average gross winning trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive ready_closed Stock round trips","declared gross P&L basis","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum positive gross P&L","divide by eligible winner count"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior scope and changes only the basis to gross."},
  {"caseId":"C2-E14-11","caseType":"correction","input":"No, I meant average net winning trade, not overall average net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction narrows from all eligible closed trades to winners only."},
  {"caseId":"C2-E14-12","caseType":"comparison","input":"Compare average gross winning trade for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive ready_closed Stock round trips","declared gross P&L basis","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum each positive gross P&L","divide by each eligible winner count","separate populations"],"expectedComparison":"AMD versus MSFT average gross winning trade","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","declared gross P&L basis","eligible positive closed-trade populations","nonzero eligible denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison keeps separate positive populations and denominators."},
  {"caseId":"C2-E14-13","caseType":"ranking","input":"Rank my accepted setups by average net winning trade for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sum each positive net P&L","divide by each eligible winner count","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade populations","nonzero eligible denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses each setup's own positive fee-covered population and does not recommend a setup."},
  {"caseId":"C2-E14-14","caseType":"negation","input":"Show average net winning trade for July, not win rate or percentage return.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","exclude outcome-rate metric","exclude percentage-return basis"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation retains dollar P/L winner mean and excludes win rate and percentage interpretations."},
  {"caseId":"C2-E14-15","caseType":"exclusion","input":"Show average gross winning trade for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive ready_closed Stock round trips","declared gross P&L basis","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum positive gross P&L","divide by eligible winner count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the eligible winner population."},
  {"caseId":"C2-E14-16","caseType":"multi_filter","input":"Show average net winning trade for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters retain positive closed-trade and observed-direction boundaries."},
  {"caseId":"C2-E14-17","caseType":"multi_part","input":"Show average net winning trade for AMD in July and list the winners behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["average_winning_trade","retrieve_records"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric is primary; retrieval is bounded evidence only and makes no causal claim."},
  {"caseId":"C2-E14-18","caseType":"ambiguous","input":"What was my average win in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","mean-dollar-P/L versus win-rate disambiguation","gross-versus-net basis follow-up if mean P/L is selected"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean average winning-trade dollars or win rate?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask mean dollars versus win rate first; ask gross versus net separately only if mean P/L is selected."},
  {"caseId":"C2-E14-19","caseType":"negative_example","input":"Show my average gross losing trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative gross P&L","divide by eligible loser count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative winner-average case maps to the separate supported average losing trade."},
  {"caseId":"C2-E14-20","caseType":"unsupported_data","input":"Show average gross winning trade for July when no eligible closed trade has positive gross P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July","no qualifying positive trade"],"expectedGroupings":[],"expectedOperators":["sum positive gross P&L","divide by eligible winner count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No eligible ready-closed trade has positive gross P/L, so average winning trade is unavailable rather than zero or an all-trade average.","notes":"Recognize the metric but return unavailable for the exact empty positive population; never use total profit or an overall average as a substitute."},
  {"caseId":"C2-E14-21","caseType":"selected_entity_context","input":"Show average net winning trade for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["trusted selected closed-trade group","eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["sum positive net P&L","divide by eligible winner count","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope."},
  {"caseId":"C2-E14-22","caseType":"cross_category","input":"Show average net winning trade by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_winning_trade","pnl_by_direction"],"expectedFilters":["eligible positive fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sum each positive net P&L","divide by each eligible winner count","after fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible positive closed-trade population","nonzero eligible denominator","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation secondary; provisional direction does not infer trade quality or cause."}
]
```

### average_losing_trade

```json
[
  {"caseId":"C2-E15-01","caseType":"canonical","input":"Show my average net losing trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact arithmetic mean of negative net P/L, retained negative, over eligible closed losing trades."},
  {"caseId":"C2-E15-02","caseType":"formal_paraphrase","input":"Calculate the mean gross P/L of eligible negative July closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative gross P&L","divide by eligible loser count","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal mean selects negative gross-trade arithmetic average, not gross loss total."},
  {"caseId":"C2-E15-03","caseType":"conversational_paraphrase","input":"How much did I lose on my losing trades on average in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational loss average keeps the negative fee-covered closed-trade result."},
  {"caseId":"C2-E15-04","caseType":"trader_slang","input":"What was my avg red net ticket in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Red ticket slang maps to a negative net closed-trade mean, not causal evidence."},
  {"caseId":"C2-E15-05","caseType":"abbreviation","input":"Avg loss net P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit average-losing-trade grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation routes with metric grammar; bare short tokens remain ticker-shaped."},
  {"caseId":"C2-E15-06","caseType":"misspelling","input":"Show my avrage gross losing trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative ready_closed Stock round trips","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative gross P&L","divide by eligible loser count","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing negative population or basis."},
  {"caseId":"C2-E15-07","caseType":"noisy_input","input":"avg loss net pnl July closed negative","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens retain the exact negative fee-covered closed-trade mean."},
  {"caseId":"C2-E15-08","caseType":"command","input":"Calculate average gross losing trade for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative ready_closed Stock round trips","declared gross P&L basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum negative gross P&L","divide by eligible loser count","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests a gross negative-trade mean, not aggregate gross loss."},
  {"caseId":"C2-E15-09","caseType":"fragment","input":"Average net loser, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment explicitly identifies a negative net closed-trade average."},
  {"caseId":"C2-E15-10","caseType":"follow_up","input":"Now show the average gross losing trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative ready_closed Stock round trips","declared gross P&L basis","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum negative gross P&L","divide by eligible loser count","retain negative result"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior scope and changes only basis to gross."},
  {"caseId":"C2-E15-11","caseType":"correction","input":"No, I meant average net losing trade, not overall average net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction narrows from all eligible trades to losers only."},
  {"caseId":"C2-E15-12","caseType":"comparison","input":"Compare average gross losing trade for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative ready_closed Stock round trips","declared gross P&L basis","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum each negative gross P&L","divide by each eligible loser count","retain negative result","separate populations"],"expectedComparison":"AMD versus MSFT average gross losing trade","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","declared gross P&L basis","eligible negative closed-trade populations","nonzero eligible denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison keeps separate negative populations and denominators."},
  {"caseId":"C2-E15-13","caseType":"ranking","input":"Rank my accepted setups by average net losing trade for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["sum each negative net P&L","divide by each eligible loser count","after fees","retain negative result","ascending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","separate trade-currency partitions","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade populations","nonzero eligible denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses each setup's own negative fee-covered population and makes no recommendation."},
  {"caseId":"C2-E15-14","caseType":"negation","input":"Show average net losing trade for July, not loss rate or percentage return.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","exclude outcome-rate metric","exclude percentage-return basis"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation retains dollar P/L loser mean and excludes loss rate and percentage interpretations."},
  {"caseId":"C2-E15-15","caseType":"exclusion","input":"Show average gross losing trade for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative ready_closed Stock round trips","declared gross P&L basis","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum negative gross P&L","divide by eligible loser count","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the eligible loser population."},
  {"caseId":"C2-E15-16","caseType":"multi_filter","input":"Show average net losing trade for short NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","directly observed short direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters retain negative closed-trade and observed-direction boundaries."},
  {"caseId":"C2-E15-17","caseType":"multi_part","input":"Show average net losing trade for AMD in July and list the losers behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["average_losing_trade","retrieve_records"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator","bounded closed-trade evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric is primary; retrieval is bounded evidence only and makes no causal claim."},
  {"caseId":"C2-E15-18","caseType":"ambiguous","input":"What was my average loss in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","mean-dollar-P/L versus loss-rate disambiguation","gross-versus-net basis follow-up if mean P/L is selected"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean average losing-trade dollars or loss rate?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask mean dollars versus loss rate first; ask gross versus net separately only if mean P/L is selected."},
{"caseId":"C2-E15-19","caseType":"negative_example","input":"Show my average gross winning trade for August.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_winning_trade"],"expectedFilters":["eligible positive ready_closed Stock round trips","declared gross P&L basis","one currency","August"],"expectedGroupings":[],"expectedOperators":["sum positive gross P&L","divide by eligible winner count"],"expectedComparison":null,"expectedTimeRange":"August","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible positive closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative loser-average case maps to the separate supported average winning trade."},
  {"caseId":"C2-E15-20","caseType":"unsupported_data","input":"Show average gross losing trade for July when no eligible closed trade has negative gross P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["eligible ready_closed Stock round trips","declared gross P&L basis","one currency","July","no qualifying negative trade"],"expectedGroupings":[],"expectedOperators":["sum negative gross P&L","divide by eligible loser count","retain negative result"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared gross P&L basis","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No eligible ready-closed trade has negative gross P/L, so average losing trade is unavailable rather than zero or an all-trade average.","notes":"Recognize the metric but return unavailable for the exact empty negative population; never use total loss or overall average as a substitute."},
  {"caseId":"C2-E15-21","caseType":"selected_entity_context","input":"Show average net losing trade for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_losing_trade"],"expectedFilters":["trusted selected closed-trade group","eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["sum negative net P&L","divide by eligible loser count","after fees","retain negative result"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope."},
  {"caseId":"C2-E15-22","caseType":"cross_category","input":"Show average net losing trade by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_losing_trade","pnl_by_direction"],"expectedFilters":["eligible negative fee-covered ready_closed Stock round trips","declared net P&L basis","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["sum each negative net P&L","divide by each eligible loser count","after fees","retain negative result","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible negative closed-trade population","nonzero eligible denominator","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation secondary; provisional direction does not infer trade quality or cause."}
]
```

### average_daily_pnl

```json
[
  {"caseId":"C2-E16-01","caseType":"canonical","input":"Show my average daily net P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact mean of daily realized net P/L buckets; no-trade and open-only days are excluded, never zero-filled."},
  {"caseId":"C2-E16-02","caseType":"formal_paraphrase","input":"Calculate the mean gross realized P/L per eligible closing trading date for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing trading date","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized gross P&L","divide by dates with eligible realized closes"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared gross P&L basis","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal daily wording selects closing-date buckets in account timezone, not calendar-day division."},
  {"caseId":"C2-E16-03","caseType":"conversational_paraphrase","input":"What did I make or lose on an average trading day in July after fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational daily result uses eligible realized-close days only."},
  {"caseId":"C2-E16-04","caseType":"trader_slang","input":"What was my avg daily take-home in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Daily take-home maps to realized net daily buckets, not open marks or a trend claim."},
  {"caseId":"C2-E16-05","caseType":"abbreviation","input":"Avg daily P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit daily-P&L grammar","AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation routes with explicit daily metric grammar; bare short tokens remain ticker-shaped."},
  {"caseId":"C2-E16-06","caseType":"misspelling","input":"Show my avrage daily gross P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing trading date","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized gross P&L","divide by dates with eligible realized closes"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared gross P&L basis","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing closing-date attribution or denominator."},
  {"caseId":"C2-E16-07","caseType":"noisy_input","input":"avg daily net pnl July realized closes","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens retain account-timezone realized-day buckets and no zero fill."},
  {"caseId":"C2-E16-08","caseType":"command","input":"Calculate average daily gross P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing trading date","declared gross P&L basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized gross P&L","divide by dates with eligible realized closes"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared gross P&L basis","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command requests daily realized gross-bucket mean, not total P/L."},
  {"caseId":"C2-E16-09","caseType":"fragment","input":"Average daily net P&L, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment explicitly identifies daily realized net buckets."},
  {"caseId":"C2-E16-10","caseType":"follow_up","input":"Now show the average daily gross P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing trading date","declared gross P&L basis","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized gross P&L","divide by dates with eligible realized closes"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared gross P&L basis","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted prior scope and changes only basis to gross."},
  {"caseId":"C2-E16-11","caseType":"correction","input":"No, I meant average daily net P&L, not average net P&L per trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects daily realized-date denominator rather than closed-trade denominator."},
  {"caseId":"C2-E16-12","caseType":"comparison","input":"Compare average daily gross P&L for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing trading date","declared gross P&L basis","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["bucket each group by closing trading date","sum each daily gross P&L","divide by each eligible-day count","separate populations"],"expectedComparison":"AMD versus MSFT average daily gross P&L","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","account IANA timezone","separate trade-currency partitions","declared gross P&L basis","nonzero eligible-day denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison keeps each ticker's daily-bucket population and denominator separate."},
  {"caseId":"C2-E16-13","caseType":"ranking","input":"Rank my accepted setups by average daily net P&L for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["bucket each group by closing trading date","sum each daily net P&L","divide by each eligible-day count","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","account IANA timezone","separate trade-currency partitions","declared net P&L basis","complete supported fee coverage","nonzero eligible-day denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses each setup's own realized-day population and makes no recommendation."},
  {"caseId":"C2-E16-14","caseType":"negation","input":"Show average daily net P&L for July, not total P&L or a calendar-day average.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","July","exclude total P&L","exclude zero-filled calendar days"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation preserves eligible realized-day denominator and rejects total or calendar-day division."},
  {"caseId":"C2-E16-15","caseType":"exclusion","input":"Show average daily gross P&L for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing trading date","declared gross P&L basis","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized gross P&L","divide by dates with eligible realized closes"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared gross P&L basis","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only eligible realized-close facts before bucketing."},
  {"caseId":"C2-E16-16","caseType":"multi_filter","input":"Show average daily net P&L for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters retain closing-date attribution and observed direction."},
  {"caseId":"C2-E16-17","caseType":"multi_part","input":"Show average daily net P&L for AMD in July and list the closing-date buckets behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["average_daily_pnl","retrieve_records"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator","bounded daily-bucket evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric is primary and retrieval gives bounded bucket evidence only."},
  {"caseId":"C2-E16-18","caseType":"ambiguous","input":"What was my July average P&L?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl","average_net_pnl_per_trade"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","per-realized-day versus per-trade disambiguation","gross-versus-net basis follow-up after population unit is selected"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should the average be per realized trading day or per closed trade?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask the population unit first; ask gross versus net separately only after per-realized-day or per-closed-trade is selected."},
  {"caseId":"C2-E16-19","caseType":"negative_example","input":"Show my average weekly P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["named weekly-average capability"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative daily case maps to the separate planned weekly average, not daily realized buckets."},
  {"caseId":"C2-E16-20","caseType":"unsupported_data","input":"Show average daily gross P&L for July when the account timezone is missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","missing account IANA timezone","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized gross P&L","divide by dates with eligible realized closes"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared gross P&L basis","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The account IANA timezone is missing, so closing trading-date buckets and average daily P/L cannot be determined exactly.","notes":"Recognize the metric but return unavailable for the exact timezone blocker; do not use UTC, submission date, or a guessed calendar."},
  {"caseId":"C2-E16-21","caseType":"selected_entity_context","input":"Show average daily net P&L for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["bucket by closing trading date","sum each daily realized net P&L","divide by dates with eligible realized closes","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope."},
  {"caseId":"C2-E16-22","caseType":"cross_category","input":"Show average daily net P&L by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_daily_pnl","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing trading date","declared net P&L basis","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by","bucket each group by closing trading date","sum each daily net P&L","divide by each eligible-day count","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","declared net P&L basis","complete supported fee coverage","eligible realized close dates","nonzero eligible-day denominator","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation secondary; provisional direction does not change daily eligibility."}
]
```

### average_weekly_pnl

```json
[
  {"caseId":"C2-E17-01","caseType":"canonical","input":"Show my average weekly net P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize planned weekly-bucket mean; do not silently choose excluded versus zero-filled empty weeks."},
  {"caseId":"C2-E17-02","caseType":"formal_paraphrase","input":"Calculate the arithmetic mean of gross realized P/L by closing ISO week for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing ISO week","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal weekly mean requires named weekly-bucket and denominator contract."},
  {"caseId":"C2-E17-03","caseType":"conversational_paraphrase","input":"What did I make or lose in an average week in July after fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational weekly average remains planned and cannot zero-fill or omit empty weeks silently."},
  {"caseId":"C2-E17-04","caseType":"trader_slang","input":"What was my avg weekly take-home in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Weekly take-home is planned realized net weekly-bucket language, not a trend claim."},
  {"caseId":"C2-E17-05","caseType":"abbreviation","input":"Avg weekly P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit weekly-P&L grammar","AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Abbreviation routes with explicit weekly metric grammar; bare tokens remain ticker-shaped."},
  {"caseId":"C2-E17-06","caseType":"misspelling","input":"Show my avrage weekly gross P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing ISO week","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without choosing an empty-week denominator."},
  {"caseId":"C2-E17-07","caseType":"noisy_input","input":"avg weekly net pnl July ISO close","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy tokens retain closing-ISO-week attribution and planned contract limits."},
  {"caseId":"C2-E17-08","caseType":"command","input":"Calculate average weekly gross P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing ISO week","declared gross P&L basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Command is planned and cannot fall back to total, daily, or per-trade P/L."},
  {"caseId":"C2-E17-09","caseType":"fragment","input":"Average weekly net P&L, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fragment names planned weekly bucket averaging."},
  {"caseId":"C2-E17-10","caseType":"follow_up","input":"Now show the average weekly gross P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing ISO week","declared gross P&L basis","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up preserves trusted scope without supplying the named weekly contract."},
  {"caseId":"C2-E17-11","caseType":"correction","input":"No, I meant average weekly net P&L, not average daily P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects weekly rather than daily bucket language; both need their respective contracts."},
  {"caseId":"C2-E17-12","caseType":"comparison","input":"Compare average weekly gross P&L for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing ISO week","declared gross P&L basis","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","separate populations"],"expectedComparison":"AMD versus MSFT average weekly gross P&L","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","account IANA timezone","separate trade-currency partitions","named weekly-average capability not exposed","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison intent is exact but the planned metric cannot invent each group denominator."},
  {"caseId":"C2-E17-13","caseType":"ranking","input":"Rank my accepted setups by average weekly net P&L for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking intent is exact and remains planned until the weekly contract is exposed."},
  {"caseId":"C2-E17-14","caseType":"negation","input":"Show average weekly net P&L for July, not daily, monthly, or per-trade P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","July","exclude daily/monthly/per-trade grouping"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation retains closing-ISO-week buckets and rejects other periods or denominators."},
  {"caseId":"C2-E17-15","caseType":"exclusion","input":"Show average weekly gross P&L for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing ISO week","declared gross P&L basis","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the planned eligible weekly population."},
  {"caseId":"C2-E17-16","caseType":"multi_filter","input":"Show average weekly net P&L for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters preserve closing-week and observed-direction boundaries."},
  {"caseId":"C2-E17-17","caseType":"multi_part","input":"Show average weekly net P&L for AMD in July and list the weekly buckets behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["average_weekly_pnl","retrieve_records"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract","bounded weekly-bucket evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned metric is primary; retrieval is bounded evidence only."},
  {"caseId":"C2-E17-18","caseType":"ambiguous","input":"What was my weekly average in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing ISO week","one currency","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","gross-versus-net basis disambiguation","weekly-bucket mean versus weekly-total disambiguation after basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should the weekly average use gross or net P&L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask gross versus net first; ask weekly-bucket mean versus weekly total separately only after basis is selected."},
  {"caseId":"C2-E17-19","caseType":"negative_example","input":"Show my average monthly P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["named monthly-average capability"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative weekly case maps to the separate planned monthly average."},
  {"caseId":"C2-E17-20","caseType":"unsupported_data","input":"Show average weekly gross P&L for July when the empty-week denominator contract is missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing ISO week","declared gross P&L basis","one currency","July","missing named empty-week/calendar denominator contract"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The named weekly average and empty-week/calendar denominator contract are missing, so average weekly P/L cannot be determined without silently excluding or zero-filling weeks.","notes":"Recognize the metric but return the exact missing contract; do not choose an empty-week policy implicitly."},
  {"caseId":"C2-E17-21","caseType":"selected_entity_context","input":"Show average weekly net P&L for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_weekly_pnl"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected entity must be trusted and cannot expand account scope or create a weekly contract."},
  {"caseId":"C2-E17-22","caseType":"cross_category","input":"Show average weekly net P&L by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_weekly_pnl","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing ISO week","declared net P&L basis","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by","bucket by closing ISO week","sum each weekly realized P&L","arithmetic mean under named empty-week/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named weekly-average capability not exposed","declared gross-or-net basis","named weekly-bucket and empty-week denominator contract","directly observed Category 11 direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping is primary and calculation secondary; direction does not resolve weekly contract gaps."}
]
```

### average_monthly_pnl

```json
[
  {"caseId":"C2-E18-01","caseType":"canonical","input":"Show my average monthly net P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize planned monthly-bucket mean; no silent exclude-versus-zero-fill."},
  {"caseId":"C2-E18-02","caseType":"formal_paraphrase","input":"Calculate the arithmetic mean of gross realized P/L by closing month for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing month","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized P&L","arithmetic mean under named empty-month/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-03","caseType":"conversational_paraphrase","input":"What did I make or lose in an average month in July after fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-04","caseType":"trader_slang","input":"What was my avg monthly take-home in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-05","caseType":"abbreviation","input":"Avg monthly P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit monthly-P&L grammar","AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-06","caseType":"misspelling","input":"Show my avrage monthly gross P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing month","declared gross P&L basis","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized P&L","arithmetic mean under named empty-month/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-07","caseType":"noisy_input","input":"avg monthly net pnl July closing month","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-08","caseType":"command","input":"Calculate average monthly gross P&L for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing month","declared gross P&L basis","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized P&L","arithmetic mean under named empty-month/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-09","caseType":"fragment","input":"Average monthly net P&L, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-10","caseType":"follow_up","input":"Now show the average monthly gross P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing month","declared gross P&L basis","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized P&L","arithmetic mean under named empty-month/calendar contract"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-11","caseType":"correction","input":"No, I meant average monthly net P&L, not average weekly P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-12","caseType":"comparison","input":"Compare average monthly gross P&L for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing month","declared gross P&L basis","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["bucket each group by closing month","sum each monthly gross P&L","arithmetic mean under named contract","separate populations"],"expectedComparison":"AMD versus MSFT average monthly gross P&L","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-13","caseType":"ranking","input":"Rank my accepted setups by average monthly net P&L for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["accepted setup-label coverage","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-14","caseType":"negation","input":"Show average monthly net P&L for July, not daily, weekly, or per-trade P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","July","exclude daily/weekly/per-trade grouping"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-15","caseType":"exclusion","input":"Show average monthly gross P&L for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing month","declared gross P&L basis","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized P&L","arithmetic mean under named empty-month/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-16","caseType":"multi_filter","input":"Show average monthly net P&L for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-17","caseType":"multi_part","input":"Show average monthly net P&L for AMD in July and list the monthly buckets behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["average_monthly_pnl","retrieve_records"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract","bounded monthly-bucket evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-18","caseType":"ambiguous","input":"What was my monthly average in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing month","one currency","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","gross-versus-net basis disambiguation","monthly-bucket mean versus monthly-total follow-up after basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should the monthly average use gross or net P&L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask gross versus net first; ask bucket mean versus total separately only after basis is selected."},
{"caseId":"C2-E18-19","caseType":"negative_example","input":"Show my average daily P&L for August.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_daily_pnl"],"expectedFilters":["August"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"August","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA timezone","eligible realized close dates"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative monthly case maps to supported daily average."},
  {"caseId":"C2-E18-20","caseType":"unsupported_data","input":"Show average monthly gross P&L for July when the empty-month denominator contract is missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","account-timezone closing month","declared gross P&L basis","one currency","July","missing named empty-month/calendar denominator contract"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized P&L","arithmetic mean under named empty-month/calendar contract"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The named monthly average and empty-month/calendar denominator contract are missing, so average monthly P/L cannot be determined without silently excluding or zero-filling months.","notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-21","caseType":"selected_entity_context","input":"Show average monthly net P&L for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_monthly_pnl"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."},
  {"caseId":"C2-E18-22","caseType":"cross_category","input":"Show average monthly net P&L by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_monthly_pnl","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","account-timezone closing month","declared net P&L basis","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by","bucket by closing month","sum each monthly realized net P&L","arithmetic mean under named empty-month/calendar contract","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA timezone","one trade-currency partition","named monthly-average capability not exposed","declared gross-or-net basis","named monthly-bucket and empty-month denominator contract","directly observed Category 11 direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned monthly-bucket mean; do not silently choose an empty-month policy."}
]
```

### profit_per_share

```json
[
  {"caseId":"C2-E19-01","caseType":"canonical","input":"Show my gross profit per share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-02","caseType":"formal_paraphrase","input":"Calculate selected-basis realized P/L per reconciled share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-03","caseType":"conversational_paraphrase","input":"What did I make per share on average in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-04","caseType":"trader_slang","input":"What was my take per share in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-05","caseType":"abbreviation","input":"PPS (profit per share) for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit profit-per-share grammar","AMD symbol resolution","server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"PPS routes only with explicit metric grammar; bare PPS remains ticker-shaped."},
  {"caseId":"C2-E19-06","caseType":"misspelling","input":"Show my profitt per share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-07","caseType":"noisy_input","input":"profit share July realized","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-08","caseType":"command","input":"Calculate net profit per share for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-09","caseType":"fragment","input":"Profit per share, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-10","caseType":"follow_up","input":"Now show profit per share.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["required prior metric context","server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-11","caseType":"correction","input":"No, I meant profit per share, not percentage return.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-12","caseType":"comparison","input":"Compare profit per share for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":"AMD versus MSFT profit per share","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-13","caseType":"ranking","input":"Rank my accepted setups by profit per share for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-14","caseType":"negation","input":"Show profit per share, not account return.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-15","caseType":"exclusion","input":"Show profit per share for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-16","caseType":"multi_filter","input":"Show net profit per share for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-17","caseType":"multi_part","input":"Show profit per share for AMD in July and list the trades behind it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["profit_per_share","retrieve_records"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-18","caseType":"ambiguous","input":"What is my profit per share?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share","gross_pnl","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","gross-versus-net basis disambiguation","exact share-denominator follow-up after basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should profit per share use gross or net P&L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask gross versus net first; ask the exact share denominator separately only after basis is selected."},
  {"caseId":"C2-E19-19","caseType":"negative_example","input":"Show net P&L per 100 shares for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["net_pnl_per_100_shares"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["net P&L per 100 entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","complete fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is the separate implemented/conditional per-100-entered-shares compatibility capability, not a Category 2 profit-per-share result; net fee coverage remains required."},
  {"caseId":"C2-E19-20","caseType":"unsupported_data","input":"Show profit per share for otherwise eligible closed trades missing exact reconciled entered share quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["otherwise eligible ready_closed Stock round trips","missing exact reconciled entered share quantity","July"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","exact reconciled entered share quantity","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Exact reconciled entered share quantity is missing, so profit per share cannot be determined without inferring a denominator.","notes":"Recognize the planned metric but return the one exact quantity blocker; do not infer a denominator from open positions, aggregate quantity, or a fallback."},
  {"caseId":"C2-E19-21","caseType":"selected_entity_context","input":"Show profit per share for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_per_share"],"expectedFilters":["trusted selected closed-trade group","eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency"],"expectedGroupings":[],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."},
  {"caseId":"C2-E19-22","caseType":"cross_category","input":"Show profit per share by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_per_share","pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","selected-basis realized P&L","reconciled share denominator","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["apply approved P/L numerator","divide by approved reconciling share denominator","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","named profit-per-share capability not exposed","exact quantity facts","approved P/L numerator","approved reconciling share denominator","declared gross-or-net fee basis","directly observed Category 11 direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned money-per-share P/L; no implicit quantity, open rows, cross-currency conversion, or fallback."}
]
```

### pnl_by_direction

```json
[
  {"caseId":"C2-E20-01","caseType":"canonical","input":"Show my net P&L by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-02","caseType":"formal_paraphrase","input":"Group realized gross P/L by directly observed Journal direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","directly observed Journal direction","declared gross P&L basis","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum gross P&L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-03","caseType":"conversational_paraphrase","input":"How did my longs and shorts do after fees in July?","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-04","caseType":"trader_slang","input":"Show green and red P&L by side for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-05","caseType":"abbreviation","input":"P&L by direction for AMD in July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit direction-grouping grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-06","caseType":"misspelling","input":"Show P&L by direciton for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-07","caseType":"noisy_input","input":"pnl direction July closed net","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-08","caseType":"command","input":"Calculate gross P&L by observed direction for AMD in July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","directly observed Journal direction","declared gross P&L basis","one currency","AMD","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum gross P&L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-09","caseType":"fragment","input":"Net P&L by direction, July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-10","caseType":"follow_up","input":"Now show P&L by direction.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-11","caseType":"correction","input":"No, I meant net P&L by observed direction, not total P&L.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","prior date range"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-12","caseType":"comparison","input":"Compare net P&L by observed direction for AMD versus MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker","directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":"AMD versus MSFT net P&L by observed direction","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","declared net P&L basis","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-13","caseType":"ranking","input":"Rank observed direction groups by net P&L for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July","rank direction groups"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-14","caseType":"negation","input":"Show P&L by direction, not inferred direction.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-15","caseType":"exclusion","input":"Show net P&L by direction excluding AMD.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July","exclude AMD"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-16","caseType":"multi_filter","input":"Show net P&L by observed direction for NVDA in July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","NVDA","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-17","caseType":"multi_part","input":"Show net P&L by direction for AMD and list the grouped trades.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric","retrieve_records"],"expectedCanonicalConcepts":["pnl_by_direction","retrieve_records"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","AMD","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees","bounded retrieval"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-18","caseType":"ambiguous","input":"P&L by direction.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","directly observed Journal direction","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","gross-versus-net basis disambiguation","Category 11 owns direction semantics"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should P&L by direction use gross or net P&L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask gross versus net basis first; do not ask or infer direction semantics."},
{"caseId":"C2-E20-19","caseType":"negative_example","input":"Which direction should I trade to make more money?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unsupported_request"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trade-direction advice is outside factual analytics"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trade-direction advice is unsupported; factual direction grouping cannot recommend long or short.","notes":"Negative case routes to locked unsupported_request, not factual P/L grouping."},
  {"caseId":"C2-E20-20","caseType":"unsupported_data","input":"Show net P&L by direction when observed Journal direction is missing.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","missing directly observed Journal direction","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","directly observed Journal direction","Category 11 owns direction semantics"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Directly observed Journal direction is missing, so P/L cannot be grouped by direction without inference.","notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-21","caseType":"selected_entity_context","input":"Show net P&L by direction for the selected closed-trade group.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","directly observed Journal direction","declared net P&L basis","complete supported fees","one currency"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","directly observed Journal direction","Category 11 owns direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Observed direction only; no inferred direction, open rows, cross-currency merge, cause, or recommendation."},
  {"caseId":"C2-E20-22","caseType":"cross_category","input":"Show net P&L for long versus short trades in July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","provisional directly observed long/short direction under Category 11 semantics","declared net P&L basis","complete supported fees","one currency","July"],"expectedGroupings":["provisional directly observed long/short direction under Category 11 semantics"],"expectedOperators":["group by directly observed direction","sum net P&L","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","provisional directly observed Category 11 direction semantics","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Long/short consumes provisional directly observed Category 11 direction semantics without inference, recommendation, or any claim that the later-category semantics are locked."}
]
```

### pnl_before_fees

```json
[
  {"caseId":"C2-E21-01","caseType":"canonical","input":"Show my P&L before fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-02","caseType":"formal_paraphrase","input":"Calculate gross realized P/L for eligible July closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-03","caseType":"conversational_paraphrase","input":"What was my P&L before commissions in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-04","caseType":"trader_slang","input":"Show my pre-fee P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-05","caseType":"abbreviation","input":"P&L before fees for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit before-fees grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Alias routes only with metric grammar; bare PL remains ticker-shaped."},
  {"caseId":"C2-E21-06","caseType":"misspelling","input":"Show my P&L befor fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-07","caseType":"noisy_input","input":"pnl before fees July closed","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-08","caseType":"command","input":"Calculate P&L before fees for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-09","caseType":"fragment","input":"Pre-fee P&L, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-10","caseType":"follow_up","input":"Switch to before-fees P&L for the same period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-11","caseType":"correction","input":"No, I meant before fees, not after fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-12","caseType":"comparison","input":"Compare P&L before fees for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":"AMD versus MSFT P&L before fees","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-13","caseType":"ranking","input":"Rank my accepted setups by P&L before fees for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["single exact gross_pnl calculation","before fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-14","caseType":"negation","input":"Show P&L before fees, not net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-15","caseType":"exclusion","input":"Show P&L before fees for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-16","caseType":"multi_filter","input":"Show P&L before fees for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-17","caseType":"multi_part","input":"Show P&L before and after fees for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","pnl_after_fees","gross_pnl","net_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["single gross_pnl calculation before fees","single net_pnl calculation after fees","same population; no addition or double count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Before and after compare two bases for the same population; neither adds a second calculation or contribution."},
{"caseId":"C2-E21-18","caseType":"ambiguous","input":"Show my P&L before fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","realized closed P/L versus open/unrealized disambiguation","period follow-up required unless trusted current context exists"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean realized closed P&L before fees or open/unrealized P&L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask realized closed versus open/unrealized scope only when warranted; period is a separate follow-up unless trusted current context exists."},
  {"caseId":"C2-E21-19","caseType":"negative_example","input":"Show P&L after fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","complete fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative alias case maps to after-fees net P/L, not gross P/L."},
  {"caseId":"C2-E21-20","caseType":"unsupported_data","input":"Show P&L before fees when execution allocation currency facts are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","missing execution allocation or trade-currency facts","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Required execution, allocation, or trade-currency facts are missing, so gross P/L before fees cannot be determined exactly.","notes":"Before fees needs no fee facts; do not reconstruct gross P/L from net P/L."},
  {"caseId":"C2-E21-21","caseType":"selected_entity_context","input":"Show P&L before fees for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["trusted selected closed-trade group","eligible ready_closed Stock round trips","one currency"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E21-22","caseType":"cross_category","input":"Show P&L before fees by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl","pnl_by_direction"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["single exact gross_pnl calculation","before fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete execution/allocation/currency facts","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one gross_pnl calculation; it creates no second value, contribution, or double count."}
]
```

### pnl_after_fees

```json
[
  {"caseId":"C2-E22-01","caseType":"canonical","input":"Show my P&L after fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-02","caseType":"formal_paraphrase","input":"Calculate net realized P/L for eligible July closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-03","caseType":"conversational_paraphrase","input":"What was my P&L after commissions in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-04","caseType":"trader_slang","input":"Show my take-home P&L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-05","caseType":"abbreviation","input":"P&L after fees for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit after-fees grammar","AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Alias routes with metric grammar; bare PL remains ticker-shaped."},
  {"caseId":"C2-E22-06","caseType":"misspelling","input":"Show my P&L after feees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-07","caseType":"noisy_input","input":"pnl after fees July closed","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-08","caseType":"command","input":"Calculate P&L after fees for AMD in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-09","caseType":"fragment","input":"After-fee P&L, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-10","caseType":"follow_up","input":"Switch to after-fees P&L for the same period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-11","caseType":"correction","input":"No, I meant after fees, not before fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","prior date range"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"prior authorized account/date context","expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-12","caseType":"comparison","input":"Compare net P&L by after-fee basis for AMD and MSFT in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","AMD","MSFT","July"],"expectedGroupings":["ticker"],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":"AMD versus MSFT P&L after fees","expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["two resolved ticker groups","server-authoritative account scope","separate trade-currency partitions","complete supported fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-13","caseType":"ranking","input":"Rank my accepted setups by P&L after fees for July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","accepted setup labels"],"expectedGroupings":["accepted setup"],"expectedOperators":["single exact net_pnl calculation","after fees","descending rank"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-14","caseType":"negation","input":"Show P&L after fees, not gross P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-15","caseType":"exclusion","input":"Show P&L after fees for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-16","caseType":"multi_filter","input":"Show P&L after fees for long NVDA in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","directly observed long direction","NVDA","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-17","caseType":"multi_part","input":"Show P&L before and after fees for MSFT in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","pnl_after_fees","gross_pnl","net_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","complete supported fees","one currency","MSFT","July"],"expectedGroupings":[],"expectedOperators":["single gross_pnl calculation before fees","single net_pnl calculation after fees","same population; no addition or double count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["MSFT symbol resolution","server-authoritative account scope","one trade-currency partition","complete fee coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Before and after compare two bases for the same population; neither adds a second calculation or contribution."},
{"caseId":"C2-E22-18","caseType":"ambiguous","input":"Show my P&L after fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","realized closed after-fee versus open/unrealized disambiguation","period follow-up required unless trusted current context exists"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean realized closed P&L after fees or open/unrealized P&L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask realized closed versus open/unrealized scope only when warranted; period is a separate follow-up unless trusted current context exists."},
  {"caseId":"C2-E22-19","caseType":"negative_example","input":"Show P&L before fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_before_fees","gross_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","one currency","July"],"expectedGroupings":[],"expectedOperators":["single exact gross_pnl calculation","before fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","complete execution/allocation/currency facts"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative alias case maps to before-fees gross P/L, not net P/L."},
  {"caseId":"C2-E22-20","caseType":"unsupported_data","input":"Show P&L after fees when supported fee allocation facts are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["eligible ready_closed Stock round trips","missing supported fee currency/sign/conserving allocation","July"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Required supported fee currency, sign, or conserving allocation facts are missing, so P/L after fees cannot be determined exactly without estimating fees.","notes":"Recognize the alias but return partial or unavailable for the one exact fee blocker; never estimate or reconstruct fees."},
  {"caseId":"C2-E22-21","caseType":"selected_entity_context","input":"Show P&L after fees for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl"],"expectedFilters":["trusted selected closed-trade group","eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency"],"expectedGroupings":[],"expectedOperators":["single exact net_pnl calculation","after fees"],"expectedComparison":null,"expectedTimeRange":"selected entity date scope","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."},
  {"caseId":"C2-E22-22","caseType":"cross_category","input":"Show P&L after fees by observed direction for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["pnl_after_fees","net_pnl","pnl_by_direction"],"expectedFilters":["eligible fee-covered ready_closed Stock round trips","complete supported fees","one currency","July","directly observed Journal direction"],"expectedGroupings":["directly observed direction under Category 11 semantics"],"expectedOperators":["single exact net_pnl calculation","after fees","group by"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one trade-currency partition","complete supported fee currency/sign/conserving allocation","directly observed Category 11 direction"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Plan-listed alias routes to one net_pnl calculation; it creates no second value, contribution, or double count."}
]
```

---

# 8. Coverage Report Deliverable

## 8.1 Inventory Coverage

| Measure | Count |
|---|---:|
| Controlling inventory items | 22 |
| Completed items | 22 inventory rows and 22 canonical records |
| Incomplete items | 0 |
| Proposed additions | 0 |
| Proposed removals or merges | 0 |
| Locked canonical names | 22 |

The 22 count means every required plan-listed name appears once in Section 4
with its stable ID and current evidence/status boundary, once as a complete
version-1 Section 5 canonical record, and once as a complete version-1 Section
6 language registry. All evaluation cases passed independent review; the
category is approved, locked, and complete.

## 8.2 Language Coverage

| Measure | Count |
|---|---:|
| Complete registry entries | 22 of 22 |
| Registries pending | 0 of 22 |
| Per-subsection example totals | Not aggregated in this batch-level report |

Production batches 1 through 10 provide complete registries for all 22 items.
The report does not invent aggregate variant counts.

## 8.3 Evaluation Coverage

| Measure | Count |
|---|---:|
| Total evaluation cases | 484 |
| Passed | 484 |
| Failed | 0 |
| Clarification cases | 22 |
| Unsupported cases | 61 |
| Cross-category cases | 22 |

All 484 evaluation cases passed final independent Terra review. Evaluation
coverage is complete; this does not activate the still-planned AI Chat runtime.

## 8.4 Data and Tool Coverage

- **Required data:** Server-authorized workspace/account scope; selected account
  and trade-currency partition; current active ready-closed Stock round trips;
  ordered allocations; exact quantities, prices, direction, and timestamps;
  account IANA timezone; supported fee facts and sign policy for net metrics;
  and approved denominators for normalized returns.
- **Optional data:** Accepted user labels for population filters; provenance
  groupings; selected UI trade or date context; additional currencies as
  separate partitions; and approved FX observations where a conversion is
  explicitly supported.
- **Missing data:** Current market mark for unrealized P/L; account equity,
  cash-flow, distribution, and FX facts for total return; a named average or
  median percentage-return capability; named weekly/monthly average formulas;
  and the exact per-share capability contract.
- **Tool targets:** `JournalAnalyticsService`; `journal_analytics_query_v1`;
  `journal_analytics_metrics_v1`; `JournalAnalyticsFactSet`; exact decimal and
  rational math; normalized population/accumulator; grouped analytics and
  bounded round-trip evidence result contracts.
- **Tools not yet implemented:** AI Chat metric-language interpreter, metric
  validator, conversation/context resolver, tool router, answer composer, and
  dedicated named deterministic capability/formula contracts for the five Planned metrics.
- **Unsupported capabilities:** Unrealized P/L without a current mark; total
  return without account facts; any silent cross-currency conversion; any
  missing-fee reconstruction; and any V3, sample, zero, or guessed fallback.

## 8.5 Overlap Review

- **Duplicate concepts found:** No plan-listed names were removed or merged.
  `pnl_before_fees` routes to the exact `gross_pnl` calculation and
  `pnl_after_fees` routes to the exact `net_pnl` calculation; both remain
  separate language-routing entries without duplicate calculations or
  double-counted metrics. Lead production review resolved the remaining
  mappings: `realized_pnl` is an explicit realized-population selector requiring
  gross/net basis; average/median net P/L route to the existing selected-basis
  average/median paths with net selected; and largest win/loss route to the
  deterministic best_trade/worst_trade extrema paths under the plan-listed
  language names, without duplicate calculations.
- **Synonym collisions:** `profit`, `P&L`, `pnl`, `net`, `gross`, `return`,
  `before fees`, `after fees`, `win`, `loss`, `average`, `median`, `daily`,
  `weekly`, `monthly`, and `per share` must not select a hidden basis or
  denominator. Bare `PL` remains ticker-shaped and unsafe as a metric alias.
- **Cross-category conflicts:** Outcome rates/counts, fees/costs, size,
  duration, execution, direction, date, ranking/comparison, response, and
  policy ownership remain outside this category. `pnl_by_direction` references
  Category 11 and does not redefine direction.
- **Terms requiring global ambiguity policy:** `profit`, `P&L`, bare `PL`,
  `return`, `performance`, `best`, `worst`, `win`, `loss`, `average`, `median`,
  `daily`, `weekly`, `monthly`, and `per share`.
- **Terms requiring user-defined aliases:** Accepted setup/tag/rule/goal names
  may be used as filters only after their owning Journal workflow accepts them;
  they must never be inferred from P/L language.

## 8.6 Remaining Gaps

- Section 5 contains all 22 approved, locked version-1 canonical records,
  including exact formulas, related concepts, units, fee policy, open-trade
  policy, and versions.
- Section 6 contains all 22 approved, locked version-1 language registry
  records; no invented aggregate example totals are claimed.
- Section 7 contains all 484 cases across all 22 concepts; independent Terra
  review passed every case.
- The gross/before-fee and net/after-fee routing decision is recorded: the
  plan-listed aliases route to their exact gross/net deterministic calculations
  without duplicate calculations or double-counted metrics. Lead production
  review also resolved realized scope, best/largest, worst/largest, and
  selected-basis average/median mappings without changing the controlling list.
- The five Planned metrics need named formula/capability contracts before they
  can become Supported: average percentage return, median percentage return,
  average weekly P/L, average monthly P/L, and profit per share.
- The two Unavailable metrics need missing facts before support can be assessed:
  current valuation marks for unrealized P/L and account equity/cash-flow/FX
  facts for total return.
- Evaluation proof for metric-language ambiguity, ticker collision, fee,
  currency, open-trade, sample-band, and cross-category cases remains to be
  saved.
- The AI Chat runtime and deterministic natural-language metric router remain
  planned.
- The controller-owned master tracker already records Category 2 as
  Complete.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete.
- [x] Boundaries are complete.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete 22-name canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] No listed item was silently omitted.
- [x] No listed item was silently renamed.
- [x] No listed item was silently merged.
- [x] Proposed additions are separated.
- [x] Duplicate/alias concepts are resolved by lead production review.

## Canonical Inventory

- [x] Every item has a completed Section 5 record.
- [x] Every item has a stable inventory ID in Section 4.
- [x] Every item has a canonical name in Section 4.
- [x] Every item has a completed exact-definition record.
- [x] Related concepts are completed for every item.
- [x] Evidence classification and capability status are present in Section 4.
- [x] Versioned canonical records are approved and locked at version 1.

## Language Registry

- [x] Twenty-two approved, locked version-1 registry entries contain every required subsection.
- [x] Every controlling item has a complete language registry entry.
- [x] Formal wording is complete.
- [x] Conversational wording is complete.
- [x] Trader slang is complete.
- [x] Abbreviations are complete.
- [x] Misspellings are complete.
- [x] Questions are complete.
- [x] Commands are complete.
- [x] Fragments are complete.
- [x] Follow-ups are complete.
- [x] Corrections are complete.
- [x] Comparisons are complete.
- [x] Rankings are complete.
- [x] Negation and exclusion are complete.
- [x] Multi-filter examples are complete.
- [x] Multi-part examples are complete.
- [x] Ambiguity is complete.
- [x] Negative examples are complete.

## Execution Requirements

- [x] Complete required/optional data mappings exist for every metric record.
- [x] Complete filters, groupings, and operators exist for every metric record.
- [x] Compatible and incompatible combinations are complete per metric.
- [x] Defaults, clarification, unsupported conditions, and tool targets are
  complete per metric.
- [x] Units, fees, open trades, and sample-size rules are complete per metric.

## Evaluation

- [x] Evaluation cases exist for every controlling metric.
- [x] Expected structured interpretations are present.
- [x] Negative examples are tested.
- [x] Ambiguous cases are tested.
- [x] Unsupported cases are tested.
- [x] Cross-category cases are tested where needed.

## Coverage Report

- [x] Planning/inventory counts are complete for this draft stage.
- [x] Remaining gaps are listed.
- [x] Overlap risks are documented.
- [x] Unsupported and missing-data boundaries are listed.
- [x] No incomplete language/evaluation scope is hidden; all Section 6
  registries are production-complete and Section 7 is complete with 484
  saved, independently reviewed cases.

## Approval

- [x] Category reached Ready for Review.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] Version is updated.
- [x] Master tracker is updated.
- [x] Change log reflects approval.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Initial Category 2 planning and the complete 22-name controlling inventory
  were created on 2026-08-05 after Category 1 version 1. The lead project
  controller approved and locked Category 2 at version 1 after independent Terra PASS.
- The current replacement evidence supports deterministic gross, conditional
  net, selected-basis distribution, extrema, daily, and direction-grouped
  paths. It does not evidence an executable AI Chat metric interpreter.
- The approved gross/before-fee and net/after-fee routing preserves separate
  plan-listed language entries while routing each to its exact deterministic
  calculation without duplication or double counting. Lead production review
  also resolved realized_pnl as the explicit realized-population selector with
  required gross/net basis, average/median net P/L as selected-basis paths with
  net selected, and largest win/loss as deterministic best_trade/worst_trade
  extrema paths under the plan-listed names. These decisions are included in
  the approved canonical-name lock.

## Required Changes

- No required review changes remain. Independent Terra review remediations were
  applied and the final independent review passed.
- The five Planned metrics retain documented non-blocking capability boundaries
  until their named formula/capability contracts are implemented.
- The two Unavailable metrics retain documented non-blocking data boundaries:
  current-mark facts for unrealized P/L and account equity/cash-flow/FX facts
  for total return.

## Completed Changes

- Created the scoped Category 2 planning and controlling-inventory document.
- Added exactly 22 required rows with stable IDs C2-PNL-001 through C2-PNL-022,
  in the requested order.
- Completed all 22 version-1 approved and locked Section 5 canonical records with exact
  definitions, distinctions, evidence/status, units, open-trade and fee
  boundaries, and related concepts. They are approved and locked at version 1
  as part of the Complete category.
- Completed Section 6 registry production batches 1 through 10 for all 22 items with all
  required language, context, capability, clarification, and safety sections.
  All 484 cases across all 22 concepts were independently reviewed and passed
  final Terra validation.
- Recorded evidence classifications, deterministic support boundaries,
  overlaps, dependencies, risks, coverage counts, and completion of
  Section 5 canonical production and all Section 6 registry production.
- All 484 evaluation cases passed independent Terra review; the controller
  recorded approval, version 1, canonical-name lock, and Category completion.

## Approval Decision

- Status: Complete
- Approved by: Lead project controller after independent Terra review
- Approval date: 2026-08-10
- Version: 1
- Canonical names locked: Yes

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-10 | Final independent Terra PASS; controller approval and canonical-name lock recorded | The lead project controller approved Category 2 version 1 after all 484 evaluation cases passed independent Terra review; implementation/data capability gaps and planned AI Chat runtime remain documented boundaries | 1 |
| 2026-08-10 | Saved 22 independently reviewed pnl_after_fees Section 7 evaluation cases | Complete all required case types with plan-listed after-fees alias routing to one exact net P/L calculation, fee-completeness blocker, safe PL handling, focused realized-versus-open ambiguity, same-population before/after comparison, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed pnl_before_fees Section 7 evaluation cases | Cover plan-listed before-fees alias routing to one exact gross P/L calculation without duplicate value or double count, safe PL handling, focused realized-versus-open ambiguity, exact execution/allocation/currency blocker, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed pnl_by_direction Section 7 evaluation cases | Cover observed-direction grouped realized P/L under Category 11 semantics, explicit gross/net fee boundaries, no inference or advice, focused basis ambiguity, missing-direction and advice blockers, trusted context, and later-semantics cross-category handling | 0 |
| 2026-08-10 | Saved 22 independently reviewed profit_per_share Section 7 evaluation cases | Cover planned selected-basis realized money-per-share language with exact quantity facts but missing numerator, reconciled denominator, fee basis, and named capability contract; safe PPS handling, focused basis clarification, exact contract blocker, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed average_monthly_pnl Section 7 evaluation cases | Cover all 22 required case types with planned account-timezone closing-month realized P/L buckets, unresolved named monthly mean and empty-month denominator contract, explicit gross/net basis and fee conditions, focused basis ambiguity, exact contract blocker, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed average_weekly_pnl Section 7 evaluation cases | Cover all 22 required case types with planned account-timezone closing-ISO-week realized P/L buckets, unresolved named weekly mean and empty-week denominator contract, explicit gross/net basis and fee conditions, focused basis ambiguity, exact contract blocker, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed average_daily_pnl Section 7 evaluation cases | Cover all 22 required case types with supported account-timezone closing-date realized P/L buckets, eligible-day-only denominator without zero fill, explicit gross/net basis and fee conditions, focused daily-versus-per-trade ambiguity, exact timezone blocker, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed average_losing_trade Section 7 evaluation cases | Cover all 22 required case types with supported selected-basis negative closed-trade arithmetic mean retained negative, fee-conditional net basis, loser-only population and empty-population handling, safe abbreviations, focused mean-versus-loss-rate ambiguity, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed average_winning_trade Section 7 evaluation cases | Cover all 22 required case types with supported selected-basis positive closed-trade arithmetic mean, fee-conditional net basis, winner-only population and empty-population handling, safe abbreviations, focused mean-versus-win-rate ambiguity, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed largest_loss Section 7 evaluation cases | Cover all 22 required case types with supported declared-basis negative closed-trade extrema, fee-conditional net basis, deterministic close-time and stable-ID ties, safe abbreviations, focused dollar-versus-percentage/drawdown ambiguity, empty-negative-population handling, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed largest_win Section 7 evaluation cases | Cover all 22 required case types with supported declared-basis positive closed-trade extrema, fee-conditional net basis, deterministic close-time and stable-ID ties, safe abbreviations, focused dollar-versus-percentage ambiguity, empty-positive-population handling, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed median_percentage_return Section 7 evaluation cases | Cover all 22 required case types with planned sorted per-trade percentage-return interpretation, declared gross-or-net basis, approved denominator, median coverage, and even-count contract, ticker-safe MPR handling, focused median-versus-average ambiguity, exact missing-contract handling, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed average_percentage_return Section 7 evaluation cases | Cover all 22 required case types with planned trade-level arithmetic mean interpretation, declared gross-or-net basis, approved denominator and coverage contracts, ticker-safe APR handling, focused trade-versus-account ambiguity, exact missing-contract handling, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed median_net_pnl_per_trade Section 7 evaluation cases | Cover all 22 required case types with exact fee-covered sorted trade-level net median, even-count middle-pair mean, symbol-safe short-token handling, focused median-versus-average ambiguity, missing-fee partial or unavailable handling, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed total_return Section 7 evaluation cases | Cover all 22 required case types with unavailable account-return facts, no P&L or balance-change proxies, fixed server-authorized account scope, period-only comparison/ranking/grouping, focused return ambiguity, trusted period context, and provisional Calendar grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed unrealized_pnl Section 7 evaluation cases | Cover all 22 required case types with unavailable current-mark boundaries, no estimate or fallback, symbol-safe UPL handling, recognized unavailable comparison/ranking/grouping, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed realized_pnl Section 7 evaluation cases | Cover all 22 required case types with explicit gross/net basis declarations, a focused missing-basis clarification, fee and execution unavailable handling, symbol-safe short tokens, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed net_pnl Section 7 evaluation cases | Cover all 22 required case types with exact fee-covered net scope, single-calculation after-fee alias routing, symbol-safe short-token handling, focused ambiguity, unavailable incomplete-fee handling, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed gross_pnl Section 7 evaluation cases | Cover all 22 required case types with combined signed before-fee scope, single-calculation alias routing, ticker-safe short-token handling, focused ambiguity, unsupported-data handling, trusted context, and provisional direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed gross_loss Section 7 evaluation cases | Cover all 22 required case types with signed aggregate-loss scope, ticker-safe abbreviation handling, one focused ambiguity, unsupported-data handling, trusted entity context, and provisional cross-category direction grouping | 0 |
| 2026-08-10 | Saved 22 independently reviewed gross_profit Section 7 evaluation cases | Cover all 22 required case types with exact schema, explicit gross-profit scope, one focused ambiguity, unsupported-data handling, trusted entity context, and provisional cross-category direction grouping | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 10 for item 22 | Add supported after-fee P/L language that routes only to net_pnl with complete-fee coverage and without a duplicate calculation, contribution, or double count | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 9 for item 21 | Add supported before-fee P/L language that routes only to `gross_pnl` without a duplicate calculation, contribution, or double count | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 8 for item 20 | Add supported P/L-by-direction language that consumes Category 11 observed direction without inference, recommendations, or causal claims | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 7 for item 19 | Add planned profit-per-share language with exact numerator/denominator, explicit basis, quantity, fee, currency, and no-causation boundaries | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 6 for item 18 | Add planned average monthly P/L language with closing-month grouping, explicit gross/net and empty-month denominator boundaries, and no-causation safeguards | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 5 for item 17 | Add planned average weekly P/L language with closing ISO-week grouping, explicit gross/net and empty-week denominator boundaries, and no-causation safeguards | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 4 for item 16 | Add supported average daily realized P/L language with account-timezone closing-date attribution, eligible-day denominator, explicit basis, fee, currency, and no-causation boundaries | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 3 for items 11–15 | Add planned percentage-median and exact closed-trade extrema/outcome-mean language with explicit basis, tie, fee, and no-causation boundaries | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 2 for items 6–10 | Add explicit unavailable, supported fee-covered distribution, and planned normalized-return language without widening runtime capability | 0 |
| 2026-08-10 | Completed Section 6 language registry production batch 1 for items 1–5 | Establish complete safe language coverage for the first gross/net/realized P&L concepts while keeping registries 6–22 and all evaluations pending | 0 |
| 2026-08-10 | Completed all 22 version-0 Section 5 canonical records | Finish the controlling inventory's canonical-record deliverable while preserving deferred language/evaluation work and pending lead review, approval, and locking | 0 |
| 2026-08-05 | Initial Category 2 planning and controlling inventory created | Establish the complete 22-name profit-and-loss metric vocabulary and evidence boundary before canonical records, language coverage, or evaluations | 0 |
