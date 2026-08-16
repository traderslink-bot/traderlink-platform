# Category 4: Edge and Quality Metrics

# Category Metadata

| Field | Value |
|---|---|
| Category name | Edge and Quality Metrics |
| Category number | 4 |
| Category slug | metrics-edge-quality |
| File name | 04-metrics-edge-quality.md |
| Category type | Performance quality and edge metric vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-10 |
| Last updated | 2026-08-10 |
| Dependencies | Category 1 Intents version 1; Category 2 Profit and Loss Metrics version 1; Category 3 Outcome Metrics version 1; replacement Journal Analytics Fact Set, metric registry, query/result contracts, fee, currency, account-scope, date, and coverage contracts |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** A language mapping does not make
> an edge/quality metric predictive, causal, executable, or supported beyond
> its individual source capability status.

**Controller state:** Final comprehensive independent Terra review passed and
the controller accepted Category 4. All 286 C4-E1 through C4-E13 cases passed
with Clarification 16, Unsupported 132, and Cross-category 13; those arrays
are unchanged. All 13 Version 1 canonical records and registries are approved,
their canonical names are locked, and Category 4 is Complete. The seven
Supported and six Planned capability boundaries remain unchanged; no active
AI Chat runtime is claimed.

---

# 1. Category Purpose

Category 4 defines the performance-quality and edge language that a future
TraderLink AI Companion may recognize without turning historical results into a
prediction, skill judgment, cause, or trading recommendation. It gives each
request a stable metric target and preserves the selected P/L basis, eligible
population, fee coverage, currency partition, formula, denominator, outlier
rule, and sample boundary that make an edge-oriented result reproducible.

This category supports Category 1 metric, summary, comparison, ranking,
explanation, and diagnosis intents. The replacement Journal Analytics fact set
and deterministic calculators remain responsible for retrieving facts,
calculating values, and reporting complete, partial, empty, or unavailable
coverage. The AI Chat interpreter, validator, tool router, and answer runtime
remain planned; this inventory does not claim that a Chat request is currently
executable.

The category addresses common but non-interchangeable trader wording: expected
P/L per trade versus profit factor; ratio of average outcomes versus an
undefined payoff ratio; P/L dispersion versus return dispersion; one largest
winner's contribution versus a user-defined set of top trades; and a
sensitivity calculation versus proof that results are dependent on outliers.
It does not decide whether a trader has an edge, is consistent, will be
profitable, or should take an action.

---

# 2. Category Boundaries

## Included

The controlling inventory contains exactly these performance-quality and edge
concepts:

- expectancy and profit factor;
- payoff ratio, average win-to-average-loss ratio, and median
  win-to-median-loss ratio;
- consistency, return dispersion, and standard deviation;
- percentage of total profit from top trades and percentage of total loss from
  worst trades;
- dependency on outliers; and
- results excluding the best trade or worst trade.

Each later canonical record must preserve whether its value is money, ratio,
percentage, dispersion, or an explicitly scoped sensitivity result; the
selected gross/net basis; fee coverage; eligible closed population; currency
partition; exact denominator; deterministic tie/removal rule; and sample-size
limitations.

## Excluded

The following related concepts are owned elsewhere:

- gross/net P/L, average/median P/L, best/worst trade, and winning/losing-trade
  value inputs belong to Category 2;
- trade populations, outcome rates, day outcomes, and streaks belong to
  Category 3;
- charge facts, fee completeness, and fee-impact metrics belong to Category 5,
  although net-basis Category 4 results must state their fee dependency;
- quantities, notionals, and percentage-return denominators belong to Category
  6 and Category 2's normalized-return boundary;
- calendar/day-of-week/session consistency dimensions belong to Categories 11
  and 13, not to a generic `consistency` default;
- execution quality, behavioral claims, rules, trader labels, candle context,
  market data, and account-return/equity analytics belong to their later
  metric/source owners;
- filters, operators, dates, comparisons, rankings, context, slang,
  ambiguity handling, response style, account authorization, privacy,
  causation, advice, and protected actions belong to Categories 11--19; and
- the AI Chat provider, runtime, persistence, and any Journal write action are
  outside this category.

## Cross-Category References

Category 4 references but does not redefine:

- Category 1 intent routing and the rule that deterministic evidence is not a
  live AI Chat capability;
- Category 2's gross/net selected P/L basis, eligible closed-trade population,
  exact averages/medians/extrema, and money/currency rules;
- Category 3's winning/losing populations and exact-zero outcome boundary;
- Category 5's charge facts and fee-completeness state;
- Categories 6, 11, 12, and 13 for return denominators, dimensions, operators,
  and dates/timezones;
- Category 14 for comparison, ranking, top-N, and tie language;
- Categories 15--19 for trusted context, terminology, clarification,
  presentation, account isolation, and no-causation/no-advice policy.

Category 4 owns only the metric meanings and sensitivity boundaries listed in
Section 4. Referencing a related concept must not create a second calculation
or silently choose a basis, denominator, or outlier set.

---

# 3. Planning Analysis

The controller approved the exact 13-name Section 4 inventory for Version 1
and locked its canonical names after final comprehensive independent Terra
review passed. All 13 records, all 13 language registries, and all 286
evaluation cases are complete, reviewed, and accepted.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?**

   It maps quality/edge language to an exact historical-performance measure or
   returns an explicit planned/unavailable state. It prevents P/L expectancy,
   profit factor, win/loss ratios, dispersion, concentration, and outlier
   sensitivity from being treated as proof of an enduring edge, consistent
   process, cause, or future probability.

2. **What canonical concepts belong here?**

   Exactly the 13 ordered names in Section 4. The list is controlling even
   where an accepted deterministic capability uses a different implementation
   name. No item is renamed, merged, omitted, or expanded in this draft.

3. **What related concepts belong elsewhere?**

   P/L inputs and selected-basis definitions belong to Category 2; winning and
   losing populations to Category 3; fee facts to Category 5; denominators and
   dimensions to their owners; and comparison/ranking/outlier-count grammar to
   Category 14. A setup- or rule-level conclusion additionally needs accepted
   trader facts under its owner; this category cannot infer one.

4. **What data is required?**

   Every measurable P/L-based concept requires server-authorized account scope,
   one trade-currency partition, current active eligible `ready_closed` Stock
   round trips, exact selected-basis P/L, deterministic close-time/stable-ID
   order where an extreme must be selected, and Journal coverage/Data Decision
   state. Net-basis results additionally require fee-complete eligible rows
   with supported fee policy and currency agreement. Ratios also require their
   stated nonzero denominator and, for win/loss ratios, both positive and
   negative outcome populations.

   Return dispersion further requires an approved exact per-trade return
   denominator and aggregate distribution contract; neither may be replaced by
   account return or an inferred denominator. Consistency needs a controller-
   approved formula, time grain, population, and minimum sample rule. Top/worst
   contribution needs an approved definition of the selected top/bottom set
   (for example, a fixed N versus percentage), a deterministic tie rule, and
   a nonzero matching gross-profit or absolute-gross-loss denominator.

5. **Which deterministic tools will answer these requests?**

   The replacement `JournalAnalyticsService`, `JournalAnalyticsFactSet`, typed
   `journal_analytics_query_v1`, versioned metric registry, exact
   decimal/rational math, shared population/accumulator, extended metric
   calculator, and result coverage contract supply the current evidence path.
   They expose selected-basis expectancy and profit factor, average/median
   win/loss ratios, population P/L variance and rounded P/L standard deviation,
   largest winner/loser contribution, and fee-complete net P/L excluding one
   deterministic largest winner or loser. A future language validator and Chat
   router must still map requests to those primitives.

6. **Which concepts are directly observed?**

   None of the 13 concepts is directly observed. The accepted source facts are
   executions, quantities, prices, allocations, charges, trade currency,
   timestamps, active projection state, and coverage. All listed metrics and
   sensitivity results derive deterministically from a declared population and
   formula, except that several remain planned because their formula or named
   capability is not yet established.

7. **Which concepts are deterministically derived?**

   Expectancy is selected-basis P/L divided by eligible closed-trade count.
   Profit factor is selected-basis gross profit divided by absolute selected-
   basis gross loss. The average and median win-to-loss ratios divide positive
   average or median P/L by absolute negative average or median P/L. Current
   P/L standard deviation is a labeled rounded square root of exact population
   P/L variance. Existing one-extreme sensitivity paths subtract exactly one
   selected net winner/loser under deterministic ties before summing the
   remaining net rows.

   A future top/worst contribution calculation can be derived only after the
   selection-set rule is approved. Consistency, return dispersion, payoff
   ratio, and dependency-on-outliers also require the definitions recorded in
   the controller questions below before they can be claimed as deterministic.

8. **Which concepts are proxy indicators?**

   `consistency` and `dependency_on_outliers`, if later computed, are
   descriptive proxy indicators rather than facts of skill, discipline, edge,
   or future performance. Expectancy, profit factor, ratios, dispersion,
   contribution, and exclusion results are factual historical summaries under
   their declared conditions, but none establishes a durable edge or cause.

9. **Which concepts are user-labelled?**

   None is user-labelled. An accepted setup, rule, tag, or review may later
   filter the eligible population under its owning contract, but it does not
   create an edge or consistency label and must not change this category's
   formulas.

10. **Which concepts are not measurable?**

    The current evidence does not define a generic payoff ratio distinct from
    `average_win_loss_ratio`; a consistency formula; per-trade return
    dispersion; a multi-trade top/worst contribution set; or an outlier-
    dependency threshold. Account return, equity volatility, predicted odds,
    and unaccepted setup/rule quality are not substitutes. Each must remain
    planned or unavailable as specified in Section 4 rather than being inferred
    from a P/L result.

11. **Which terms are ambiguous?**

    `edge`, `quality`, `consistent`, `payoff`, `dispersion`, `standard
    deviation`, `top trades`, `worst trades`, `outlier`, `best trade`, and
    `results excluding` each lack safe unqualified meaning in at least one
    important dimension. `Payoff ratio` may colloquially mean average win/
    average loss, but the plan lists it separately. `Standard deviation` may
    refer to P/L or returns. `Top`/`worst` need a count/selection rule and tie
    behavior. `Results` may mean net P/L, gross P/L, a ratio, or a complete
    report. None may silently default across those meanings.

12. **What defaults are safe?**

    For the exact current `expectancy`, `profit_factor`, average ratio, median
    ratio, and P/L-standard-deviation primitives, use only the declared
    selected P/L basis, eligible current `ready_closed` population, one
    currency partition, and explicit fee coverage. Do not silently default
    gross versus net when that changes a result. A multi-metric performance
    summary may use Category 1's locked net-with-reliable-fees, otherwise-
    gross-with-explicit-limitation summary rule, but it does not establish a
    default for an individual ambiguous Category 4 request.

    The current `results_excluding_*` evidence may only return its named net
    P/L sensitivity result on fee-complete rows. It cannot silently become a
    gross-basis result, a removal of all ties, or a generic quality judgment.
    No safe default exists for payoff ratio, consistency, return dispersion,
    top/worst set size, dependency threshold, or return versus P/L standard
    deviation.

13. **What conditions require clarification?**

    Ask one focused question when gross versus net is not safely established;
    when `payoff ratio` must be distinguished from the separately listed
    average ratio; when standard deviation/dispersion might mean P/L or return;
    when consistency lacks a time grain/formula; when top/worst lacks an N,
    percentage, or tie policy; when `results excluding` does not identify P/L
    basis or the one-extreme sensitivity rule; or when the date/account/currency
    scope is missing. Do not compound basis, formula, period, and set-size
    questions. If required facts/definitions are absent, return the limitation
    rather than asking the trader to supply an invented result.

14. **What combinations are invalid?**

    Invalid combinations include eligible realized results that include
    `legitimate_open`, `needs_decision`, excluded, superseded, or unsupported
    rows; net results with incomplete/conflicting/unsupported/currency-mismatched
    fee evidence without partial or unavailable coverage; cross-currency money
    aggregation without an approved FX contract; a ratio with a zero/missing
    denominator or absent win/loss population; return dispersion computed from
    P/L or account return substituted for per-trade return; unlabelled rounded
    standard deviation presented as exact; a top/worst set selected without a
    fixed rule; removing all tied extremes when the rule is one deterministic
    trade; and an outlier or consistency result presented as proof of edge,
    causation, prediction, or advice.

15. **What evaluation coverage proves completion?**

    Later Sections 5--7 must cover every controlling concept with canonical,
    formal, conversational, slang, abbreviation, misspelling, noisy,
    singular/plural, question, command, fragment, follow-up, correction,
    comparison, ranking, negation, exclusion, multi-filter, multi-part,
    ambiguity, negative, unsupported-data, selected-context, and applicable
    cross-category cases. Structured expectations must assert the concept,
    formula, P/L/return basis, fee state, eligible population, denominator,
    account/currency/timezone partition, outlier-set/tie/removal rule, sample
    disclosure, coverage state, and unavailable reason. The completed Version
    1 evaluation deliverable covers these boundaries.

## 3.2 Dependencies

- **Earlier inventory:** locked Categories 1--3 provide intent routing and the
  P/L, fee-aware outcome, population, currency, and date vocabulary this
  category consumes.
- **Journal facts:** current projection state, round-trip ID, close time,
  selected-basis P/L inputs, exact allocations, fee evidence, trade currency,
  account IANA timezone, source/decision coverage, and server-authoritative
  account scope.
- **Deterministic implementation:** the replacement fact set, metric/capability
  registry, exact decimal/rational math, population builder, extended metric
  calculator, grouped accumulator, and typed result/coverage contract.
- **Later language categories:** dimensions, operators, dates, comparison and
  ranking, context, slang, ambiguity, response, and policy records are
  required before complete language/evaluation production.
- **External or new facts:** no external mark is required for P/L-based first
  slice metrics. Return dispersion requires an approved per-trade return
  denominator/distribution contract; account/equity volatility needs account
  balances, cash flows, and FX; setup/rule edge needs accepted trader facts.
- **Unsupported dependencies:** a generic payoff-ratio definition separate
  from the average ratio; consistency and outlier-dependency policies; top-N or
  top-percentage selection and tie rules; gross-basis exclusion variants; and
  the production AI Chat interpreter, validator, provider, and answer runtime.

## 3.3 Risks

- **Edge-claim risk:** no historical metric demonstrates skill, a durable edge,
  cause, probability, discipline, or recommended trade action.
- **Basis/fee risk:** gross and net produce different inputs and classifications.
  Net results require complete supported charge coverage; missing fees cannot
  be filled from gross values or estimates.
- **Population risk:** only active eligible `ready_closed` round trips are
  realized metric rows. Open, pending-decision, excluded, superseded, and
  unsupported rows remain coverage, not inputs.
- **Formula/alias risk:** payoff ratio is not silently merged with the
  separately listed average win-to-average-loss ratio. Median and average
  ratios are distinct, as are profit factor and either ratio.
- **Denominator risk:** no-loss profit factor, zero/missing ratio populations,
  zero contribution denominators, and empty eligible populations return
  unavailable rather than infinity, zero, or an estimated value.
- **Currency/return risk:** money values, variance, and standard deviation stay
  in one currency partition. P/L dispersion is not return dispersion; account
  return and equity volatility are not substitutes.
- **Outlier risk:** `top`, `worst`, `best`, and `outlier` require explicit
  selection and deterministic ties. A removal calculation is a counterfactual
  sensitivity result, not proof that a population depends on outliers.
- **Precision/sample risk:** authoritative math remains exact through the
  result boundary; population variance is exact rational and standard deviation
  is explicitly rounded. All quality/edge communication needs eligible count,
  coverage, and an appropriate sample limitation; no universal minimum sample
  threshold is approved yet.
- **Isolation/privacy risk:** natural language cannot select another account.
  Server authorization, partitioning, and privacy-safe aggregate presentation
  are mandatory; raw private trade/account identifiers must not appear here.
- **Runtime/legacy risk:** accepted deterministic analytics does not establish
  an active Chat path. V3 names, fixtures, and sample data do not establish
  replacement support.

## 3.4 Repository Evidence

The following privacy-safe paths were inspected read-only. They establish
replacement contracts and capability boundaries; no private statement values,
account identifiers, tokens, hashes, or secrets are recorded.

| Repository path | What it proves |
|---|---|
| `docs/migration/traderslink_ai_language_inventory_master.md` | Mandatory category workflow, controller-only tracker rule, Category 4 planning authorization, status vocabulary, and controlling-inventory rule. |
| `docs/migration/category_completion_template_example.md` | Required category structure, capability-status values, deferred deliverables, checklist, review, and approval gates. |
| `docs/migration/language-inventory/categories/02-metrics-profit-loss.md` | Locked P/L, selected-basis, fee, realized/open, currency, denominator, and planned-Chat boundaries inherited here. |
| `docs/migration/language-inventory/categories/03-metrics-outcomes.md` | Locked ready-closed/outcome/zero/fee/currency and coverage boundaries inherited here. |
| `docs/migration/traderslink_ai_chatbot_complete_language_plan.md` | Exact ordered 13-name Category 4 list in section 5.3. |
| `docs/migration/analytics-capability-catalog.md` | Accepted first-slice expectancy/profit-factor policy; supported average/median win-loss ratios, standard deviation, concentration, and realized-path exclusion targets; their factual-state limits. |
| `docs/migration/phase-4-core-analytics-plan.md` | Exact decimal/rational math, rounded-standard-deviation rule, fee/currency/population rules, and required distribution/concentration/outlier boundaries. |
| `docs/migration/phase-4-core-analytics-progress.md` | Accepted replacement status: 210 registry definitions, including exact population variance, rounded standard deviation, concentration, and no active Chat runtime. |
| `src/modules/journal-analytics/server/analytics-metric-registry.ts` | Current selected-basis `profit_factor` and `expectancy` definitions and zero-denominator policies. |
| `src/modules/journal-analytics/server/analytics-extended-metrics.ts` | Current average/median ratio formulas, one-extreme net-P/L removal, largest-winner/loser contributions, population variance, and rounded P/L standard deviation. |

Evidence interpretation: `Supported` in Section 4 means an accepted replacement
deterministic metric or conditional result path exists under its stated
conditions. It does not mean the future AI Chat runtime recognizes or executes
the language.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

`Supported` means a replacement deterministic capability or conditional
coverage path exists, not that an AI Chat handler exists. `Planned` means a
definition, public metric contract, or required facts remain to be approved.
Every P/L money/ratio result stays within one currency partition and eligible
current `ready_closed` population; selected net-basis results are fee-
conditional. Open and `needs_decision` rows are not silently included.

The controller approved and locked this exact inventory for Version 1 after
final comprehensive independent Terra review: C4-EDGE-001, C4-EDGE-002,
C4-EDGE-004, C4-EDGE-005,
C4-EDGE-008, C4-EDGE-012, and C4-EDGE-013 are `Supported`; C4-EDGE-003,
C4-EDGE-006, C4-EDGE-007, C4-EDGE-009, C4-EDGE-010, and C4-EDGE-011 are
`Planned`. `payoff_ratio` remains a distinct plan-listed recognition concept,
not an alias or duplicate calculation. Gross-basis exclusion variants remain
deferred future scope.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Evidence classification | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|---|
| 1 | C4-EDGE-001 | expectancy | Expectancy | expected realized P/L | deterministically derived | Supported | Current `expectancy`: average selected-basis P/L per eligible closed trade; money in one trade currency; unavailable at zero eligible denominator; net is fee-conditional. It is not predicted expectancy or proof of edge. |
| 2 | C4-EDGE-002 | profit_factor | Profit factor | profit/loss efficiency ratio | deterministically derived | Supported | Current selected-basis gross profit divided by absolute selected-basis gross loss; ratio, not percentage; unavailable without a losing denominator; net is fee-conditional. |
| 3 | C4-EDGE-003 | payoff_ratio | Payoff ratio | undefined reward/risk-style ratio | not applicable pending definition | Planned | No approved generic payoff-ratio formula exists. It may overlap colloquially with `average_win_to_average_loss_ratio`, but remains a separate plan-listed item pending controller definition/mapping; never infer R-multiple, planned risk, or the average ratio. |
| 4 | C4-EDGE-004 | average_win_to_average_loss_ratio | Average win-to-average-loss ratio | outcome magnitude ratio | deterministically derived | Supported | Current `average_win_loss_ratio`: average positive selected-basis P/L divided by absolute average negative selected-basis P/L; ratio; unavailable without both populations; net is fee-conditional. |
| 5 | C4-EDGE-005 | median_win_to_median_loss_ratio | Median win-to-median-loss ratio | robust outcome magnitude ratio | deterministically derived | Supported | Current `median_win_loss_ratio`: exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; ratio; unavailable without both populations; net is fee-conditional. |
| 6 | C4-EDGE-006 | consistency | Consistency | repeatability descriptor | proxy-based pending definition | Planned | The capability catalog identifies calendar consistency as derivable, but no approved formula, grain, denominator, sample threshold, or public metric ID is established. It must not default to win rate, standard deviation, streak, or profitability. |
| 7 | C4-EDGE-007 | return_dispersion | Return dispersion | per-trade return distribution | deterministically derived pending contract | Planned | P/L variance/standard deviation exists, but an approved per-trade return denominator and aggregate return-distribution contract do not. P/L dispersion or account/equity volatility must not be substituted. |
| 8 | C4-EDGE-008 | standard_deviation | Standard deviation | P/L dispersion | deterministically derived | Supported | Current `population_pnl_standard_deviation`: deterministic rounded square root of exact selected-basis population P/L variance; money in one trade currency, explicitly not an exact decimal. Clarify P/L versus return; return standard deviation remains planned. |
| 9 | C4-EDGE-009 | percentage_of_total_profit_from_top_trades | Percentage of total profit from top trades | positive-P/L concentration | deterministically derived pending selection rule | Planned | Current `largest_winner_contribution` supports one largest winner divided by total positive P/L. A multi-trade `top` set needs an approved N/percentage/tie rule and nonzero gross-profit denominator; do not silently map it to one trade. |
| 10 | C4-EDGE-010 | percentage_of_total_loss_from_worst_trades | Percentage of total loss from worst trades | negative-P/L concentration | deterministically derived pending selection rule | Planned | Current `largest_loser_contribution` supports one largest absolute loser divided by total absolute loss. A multi-trade `worst` set needs an approved N/percentage/tie rule and nonzero absolute-loss denominator; do not silently map it to one trade. |
| 11 | C4-EDGE-011 | dependency_on_outliers | Dependency on outliers | sensitivity interpretation | proxy-based pending definition | Planned | Existing largest-winner/loser contribution and one-extreme removal are evidence inputs only. No approved dependency threshold, comparison rule, or interpretation policy exists; never label historical results as dependent solely from a removal result. |
| 12 | C4-EDGE-012 | results_excluding_best_trade | Results excluding best trade | one-extreme sensitivity | deterministically derived | Supported | Current `net_pnl_excluding_largest_winner` subtracts one deterministic largest positive net-P/L row, then sums remaining fee-complete net rows. It is unavailable without a winner, does not remove all ties, and is not a generic gross/result report. |
| 13 | C4-EDGE-013 | results_excluding_worst_trade | Results excluding worst trade | one-extreme sensitivity | deterministically derived | Supported | Current `net_pnl_excluding_largest_loser` subtracts one deterministic most-negative net-P/L row, then sums remaining fee-complete net rows. It is unavailable without a loser, does not remove all ties, and is not a generic gross/result report. |

## Proposed Inventory Additions

None proposed. The controlling list remains exactly the 13 section-5.3 names.
Adjacent capabilities such as population P/L variance, largest individual
winner/loser contribution, and exclusion of both extremes are evidence inputs
or later candidates, not additions to this category without approval.

## Proposed Removals or Merges

None proposed. The following are controller decisions or future-scope
boundaries, not silent merges. The current supported and planned boundaries in
Section 4 are sufficient for the approved Version 1 canonical records. These
decisions are needed only to add or map new formulas/capabilities beyond those
boundaries; they do not authorize that future work.

| Controlling name | Related deterministic path or concept | Decision/boundary required |
|---|---|---|
| `payoff_ratio` | `average_win_loss_ratio` | Controller decision only if a new mapping/formula is to be added: decide whether payoff ratio is an approved language alias for the average ratio or a distinct formula. Keep both controlling entries regardless; do not infer planned-risk R-multiple. |
| `consistency` | calendar consistency, win rate, streak, standard deviation | Future formula boundary: approve one formula, time grain, population, denominator, minimum-sample/communication rule, and whether it is descriptive only before adding a capability. |
| `return_dispersion` / `standard_deviation` | population P/L variance / `population_pnl_standard_deviation` | Future return-capability boundary: decide the approved per-trade return denominator/distribution contract. Preserve P/L standard deviation as a distinct currently supported path. |
| top/worst-trade contribution names | `largest_winner_contribution` / `largest_loser_contribution` | Future multi-trade capability boundary: approve the top/bottom selection size and deterministic tie behavior; single-largest contribution is not a silent multi-trade mapping. |
| `dependency_on_outliers` | contribution and one-extreme removal paths | Future interpretation boundary: approve whether this is an explicit descriptive comparison, its threshold if any, and mandatory non-causal wording. |
| exclusion-result names | `net_pnl_excluding_largest_winner` / `net_pnl_excluding_largest_loser` | Gross-basis variants are deferred future scope. Current support remains fee-complete net P/L removing exactly one deterministic extreme. |

---

# 5. Canonical Inventory Deliverable

All 13 Version 1 canonical records are complete, approved, and locked after
final comprehensive independent Terra review. Planned records retain their
explicit current limits and do not invent a formula or capability.

## Shared Version 1 Section 5 Contract

Every C4-EDGE-001 through C4-EDGE-013 record inherits this contract. All
current and future P/L-based results operate only within server-authoritative
account scope; natural language must not select another account, infer a
user-selectable account scope, include accounts outside the server-authoritative
selected set, or combine incompatible account/currency/timezone partitions.
Compatible partitions in an authorized multi-account selected set remain
allowed. Money/ratio calculations retain authoritative exact decimal or
rational values through calculation, and display rounding occurs only at the
result boundary; a rounded value never feeds a later calculation.
`standard_deviation` retains its separately documented
deterministic rounded-square-root result: its underlying population P/L
variance is exact rational, and the returned rounded square root is explicitly
labeled rather than represented as an exact decimal.

## `expectancy`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-001 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | expected realized P/L |
| Canonical name | expectancy |
| Display name | Expectancy |
| Exact definition | Arithmetic mean selected-basis P/L per current active eligible `ready_closed` Stock round trip in one trade-currency partition: sum of selected-basis P/L divided by eligible closed-trade count. It is unavailable when that count is zero. The returned eligible count and coverage are required sample context; the result is historical evidence, not a forecast or proof of edge. |
| Distinction from related concepts | It is an average money result per eligible closed trade, not profit factor, a win/loss ratio, account return, a probability, or a prediction. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | money in the declared trade currency |
| Open-trade support | No. `legitimate_open`, `needs_decision`, excluded, superseded, and unsupported rows are not realized inputs and remain coverage. |
| Fee handling | Gross basis uses eligible gross P/L. Net basis is fee-conditional and must expose partial or unavailable coverage when supported complete fee evidence is absent. |
| Version | 1 |

### Related Concepts

- Broader concept: historical performance quality evidence.
- Narrower concepts: none.
- Commonly confused concepts: `average_net_pnl_per_trade`, profit factor, and expected future return.
- Must not be merged with: `profit_factor`, `average_win_to_average_loss_ratio`, or `payoff_ratio`.

---

## `profit_factor`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-002 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | profit/loss efficiency ratio |
| Canonical name | profit_factor |
| Display name | Profit factor |
| Exact definition | Selected-basis gross profit from current active eligible `ready_closed` Stock round trips in one trade-currency partition divided by the absolute selected-basis gross loss from that same population. It is unavailable when there is no losing denominator. The result must retain eligible count and coverage as sample context and is historical evidence, not proof of edge or future profitability. |
| Distinction from related concepts | It compares aggregate positive and negative P/L totals, not average or median outcome magnitudes, expectancy, a percentage, or a probability. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | ratio |
| Open-trade support | No. Only eligible realized `ready_closed` rows participate; open and decision rows remain coverage. |
| Fee handling | Gross basis requires no fee facts. Net basis is fee-conditional and must return its explicit partial or unavailable state instead of reconstructing missing fees. |
| Version | 1 |

### Related Concepts

- Broader concept: historical profit/loss efficiency evidence.
- Narrower concepts: none.
- Commonly confused concepts: expectancy, win rate, average win-to-average-loss ratio, and payoff ratio.
- Must not be merged with: `expectancy`, `payoff_ratio`, or `average_win_to_average_loss_ratio`.

---

## `payoff_ratio`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-003 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | undefined reward/risk-style ratio |
| Canonical name | payoff_ratio |
| Display name | Payoff ratio |
| Exact definition | A distinct plan-listed recognition concept whose formula, numerator, denominator, P/L basis, and result unit are not approved. It must remain planned rather than resolve to average win/loss, median win/loss, planned-risk R-multiple, or another calculation. Any future measurable form must state its selected basis, current active eligible `ready_closed` population, one-currency partition, fee treatment, zero-denominator behavior, and sample context. |
| Distinction from related concepts | It is not an alias or duplicate calculation for `average_win_to_average_loss_ratio`; it is also not R-multiple or a planned-risk/reward measure. |
| Evidence classification | not applicable pending definition |
| Capability status | Planned |
| Result units | not defined until its formula is approved |
| Open-trade support | Not defined; no open-trade result may be inferred. Any future realized metric must explicitly exclude open and decision rows. |
| Fee handling | Not defined. A future net-basis formula would require fee-complete coverage; no gross/net default exists. |
| Version | 1 |

### Related Concepts

- Broader concept: reward/loss magnitude language.
- Narrower concepts: none.
- Commonly confused concepts: `average_win_to_average_loss_ratio`, `median_win_to_median_loss_ratio`, and R-multiple.
- Must not be merged with: `average_win_to_average_loss_ratio`.

---

## `average_win_to_average_loss_ratio`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-004 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | outcome magnitude ratio |
| Canonical name | average_win_to_average_loss_ratio |
| Display name | Average win-to-average-loss ratio |
| Exact definition | Arithmetic mean positive selected-basis P/L divided by the absolute arithmetic mean negative selected-basis P/L, calculated from current active eligible `ready_closed` Stock round trips in one trade-currency partition. It is unavailable unless both winning and losing populations exist. The eligible count, winning/losing counts, and coverage are required sample context; it does not prove edge or predict future outcomes. |
| Distinction from related concepts | It compares average positive and negative trade magnitudes, not aggregate gross profit/loss, median magnitudes, expectancy, payoff ratio, or win rate. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | ratio |
| Open-trade support | No. Only eligible realized `ready_closed` outcomes form the positive and negative populations; open and decision rows remain coverage. |
| Fee handling | Gross or declared net selected basis. Net is fee-conditional and must be partial or unavailable when fee evidence is incomplete, unsupported, conflicting, or currency-mismatched. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome magnitude evidence.
- Narrower concepts: average positive P/L and average absolute negative P/L.
- Commonly confused concepts: `median_win_to_median_loss_ratio`, profit factor, payoff ratio, and breakeven win rate.
- Must not be merged with: `median_win_to_median_loss_ratio` or `payoff_ratio`.

---

## `median_win_to_median_loss_ratio`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-005 |
| Category | Category 4: Edge and Quality Metrics |
| Canonical name | median_win_to_median_loss_ratio |
| Display name | Median win-to-median-loss ratio |
| Subcategory | robust outcome magnitude ratio |
| Exact definition | Exact median positive selected-basis P/L divided by the absolute exact median negative selected-basis P/L, calculated from current active eligible `ready_closed` Stock round trips in one trade-currency partition. Medians use the accepted exact ordering rule; an even population uses the exact average of its two middle values. It is unavailable unless both winning and losing populations exist. Eligible counts and coverage are required sample context; it is not a durable-edge claim. |
| Distinction from related concepts | It compares median, not average, positive and negative magnitudes. It is not profit factor, expectancy, payoff ratio, or a percentage. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | ratio |
| Open-trade support | No. Only eligible realized `ready_closed` outcomes form the positive and negative populations; open and decision rows remain coverage. |
| Fee handling | Gross or declared net selected basis. Net is fee-conditional and must expose partial or unavailable coverage rather than infer fee-complete values. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome magnitude evidence.
- Narrower concepts: median positive P/L and median absolute negative P/L.
- Commonly confused concepts: `average_win_to_average_loss_ratio`, profit factor, and payoff ratio.
- Must not be merged with: `average_win_to_average_loss_ratio` or `payoff_ratio`.

---

## `consistency`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-006 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | repeatability descriptor |
| Canonical name | consistency |
| Display name | Consistency |
| Exact definition | A planned descriptive concept with no approved formula, time grain, population, denominator, minimum-sample rule, or public metric ID. It must not default to win rate, standard deviation, streak, profitability, or calendar activity. Any future calculation must declare selected P/L/return basis, current active eligible `ready_closed` population where realized performance is used, one-currency/timezone partition, fee policy, zero-denominator behavior, and sample context. |
| Distinction from related concepts | It is a descriptive repeatability concept, not a fact of discipline, skill, edge, causation, or a prediction. It is not standard deviation, a streak, or a win rate. |
| Evidence classification | proxy-based pending definition |
| Capability status | Planned |
| Result units | not defined until a formula is approved |
| Open-trade support | Not defined; it must not derive a realized-performance result from open or `needs_decision` rows. |
| Fee handling | Not defined. A future net-basis calculation would require explicit fee-complete coverage. |
| Version | 1 |

### Related Concepts

- Broader concept: historical repeatability description.
- Narrower concepts: none.
- Commonly confused concepts: standard deviation, streaks, win rate, and profitable-day percentage.
- Must not be merged with: `standard_deviation` or `dependency_on_outliers`.

---

## `return_dispersion`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-007 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | per-trade return distribution |
| Canonical name | return_dispersion |
| Display name | Return dispersion |
| Exact definition | A planned distribution measure across per-trade returns. No approved return denominator, return formula, aggregate dispersion formula, or public capability contract exists. P/L variance, P/L standard deviation, account return, and equity volatility must not be substituted. Any future calculation must use a declared selected P/L basis and approved per-trade return denominator over current active eligible `ready_closed` rows in one compatible currency partition, state fee coverage and zero-denominator behavior, and provide eligible count/coverage as sample context. |
| Distinction from related concepts | It is dispersion of approved per-trade returns, not the supported P/L `standard_deviation`, account return, or an account-equity volatility measure. |
| Evidence classification | deterministically derived pending contract |
| Capability status | Planned |
| Result units | not defined until the return and dispersion contracts are approved |
| Open-trade support | Not defined; no open-trade return or mark-based fallback may be inferred. A future realized-return metric must explicitly exclude open and decision rows. |
| Fee handling | Not defined. A future net-return basis would require fee-complete coverage and may not substitute gross values. |
| Version | 1 |

### Related Concepts

- Broader concept: return-distribution evidence.
- Narrower concepts: none.
- Commonly confused concepts: `standard_deviation`, population P/L variance, account return, and account-equity volatility.
- Must not be merged with: `standard_deviation`.

---

## `standard_deviation`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-008 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | P/L dispersion |
| Canonical name | standard_deviation |
| Display name | Standard deviation |
| Exact definition | Current `population_pnl_standard_deviation`: the deterministic rounded square root of exact population selected-basis P/L variance over current active eligible `ready_closed` Stock round trips in one trade-currency partition and server-authorized account scope. The underlying population variance remains exact rational; the standard-deviation value is explicitly rounded and is never represented as an exact decimal. It is unavailable when the eligible population is empty. Eligible count and coverage are required sample context; the result describes historical P/L spread only and cannot certify consistency, edge, or future risk. |
| Distinction from related concepts | It is supported P/L dispersion, not return dispersion, account/equity volatility, a confidence interval, or a consistency score. A request that might mean return standard deviation requires clarification because return dispersion remains Planned. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | money in the declared trade currency |
| Open-trade support | No. Only eligible realized `ready_closed` P/L rows participate; `legitimate_open`, `needs_decision`, excluded, superseded, and unsupported rows remain coverage. |
| Fee handling | Gross or declared net selected basis. Net is fee-conditional and must expose partial or unavailable coverage instead of deriving missing fees. |
| Version | 1 |

### Related Concepts

- Broader concept: historical P/L distribution evidence.
- Narrower concepts: exact population P/L variance and deterministic rounded square root.
- Commonly confused concepts: `return_dispersion`, consistency, account volatility, and confidence statistics.
- Must not be merged with: `return_dispersion` or `consistency`.

---

## `percentage_of_total_profit_from_top_trades`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-009 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | positive-P/L concentration |
| Canonical name | percentage_of_total_profit_from_top_trades |
| Display name | Percentage of total profit from top trades |
| Exact definition | A planned concentration metric for the selected top-trade set's positive selected-basis P/L divided by total positive selected-basis P/L over current active eligible `ready_closed` rows in one trade-currency partition and server-authorized account scope. No multi-trade set formula exists until an N or percentage selection rule and deterministic tie policy are approved. A future value requires a nonzero total-positive-P/L denominator, declared basis, fee state, and eligible-count/coverage sample context. |
| Distinction from related concepts | Current `largest_winner_contribution` is evidence for one largest winner only; it is not a silent substitute for an unqualified multi-trade `top` set. This concept is not profit factor, expectancy, or a claim that results depend on outliers. |
| Evidence classification | deterministically derived pending selection rule |
| Capability status | Planned |
| Result units | not defined until the top-set formula is approved; any future result is expected to be a percentage |
| Open-trade support | Not defined. A future realized metric must use only eligible `ready_closed` rows and exclude `legitimate_open` and `needs_decision` rows from the numerator and denominator. |
| Fee handling | Not defined. A future net-basis calculation requires fee-complete coverage; no gross/net default is permitted. |
| Version | 1 |

### Related Concepts

- Broader concept: positive-P/L concentration evidence.
- Narrower concepts: a future approved top-trade selection set.
- Commonly confused concepts: `largest_winner_contribution`, profit factor, and `dependency_on_outliers`.
- Must not be merged with: `largest_winner_contribution` or `dependency_on_outliers`.

---

## `percentage_of_total_loss_from_worst_trades`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-010 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | negative-P/L concentration |
| Canonical name | percentage_of_total_loss_from_worst_trades |
| Display name | Percentage of total loss from worst trades |
| Exact definition | A planned concentration metric for the selected worst-trade set's absolute negative selected-basis P/L divided by total absolute negative selected-basis P/L over current active eligible `ready_closed` rows in one trade-currency partition and server-authorized account scope. No multi-trade set formula exists until an N or percentage selection rule and deterministic tie policy are approved. A future value requires a nonzero total-absolute-loss denominator, declared basis, fee state, and eligible-count/coverage sample context. |
| Distinction from related concepts | Current `largest_loser_contribution` is evidence for one largest absolute loser only; it is not a silent substitute for an unqualified multi-trade `worst` set. This concept is not loss rate, profit factor, or a claim that results depend on outliers. |
| Evidence classification | deterministically derived pending selection rule |
| Capability status | Planned |
| Result units | not defined until the worst-set formula is approved; any future result is expected to be a percentage |
| Open-trade support | Not defined. A future realized metric must use only eligible `ready_closed` rows and exclude `legitimate_open` and `needs_decision` rows from the numerator and denominator. |
| Fee handling | Not defined. A future net-basis calculation requires fee-complete coverage; no gross/net default is permitted. |
| Version | 1 |

### Related Concepts

- Broader concept: negative-P/L concentration evidence.
- Narrower concepts: a future approved worst-trade selection set.
- Commonly confused concepts: `largest_loser_contribution`, loss rate, and `dependency_on_outliers`.
- Must not be merged with: `largest_loser_contribution` or `dependency_on_outliers`.

---

## `dependency_on_outliers`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-011 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | sensitivity interpretation |
| Canonical name | dependency_on_outliers |
| Display name | Dependency on outliers |
| Exact definition | A planned descriptive sensitivity concept. Current largest-winner/loser contribution and one-extreme net-P/L exclusion results are evidence inputs only; no approved outlier definition, comparison method, threshold, label, or capability exists. It must not classify a trader or result as dependent, consistent, skilled, or likely to perform a certain way. Any future calculation must declare the outlier rule, selected basis, current active eligible `ready_closed` population, one-currency partition, fee state, sample context, and non-causal presentation. |
| Distinction from related concepts | It is not a largest-winner/loser contribution, a one-extreme exclusion result, standard deviation, or a proof that historical results lack edge. |
| Evidence classification | proxy-based pending definition |
| Capability status | Planned |
| Result units | not defined until an approved descriptive comparison exists |
| Open-trade support | Not defined. No conclusion may be drawn from open or `needs_decision` rows; any future realized analysis must exclude them. |
| Fee handling | Not defined. A future net-basis comparison requires fee-complete coverage and must preserve its limitation state. |
| Version | 1 |

### Related Concepts

- Broader concept: descriptive historical sensitivity evidence.
- Narrower concepts: none.
- Commonly confused concepts: one-extreme exclusions, contribution metrics, standard deviation, and consistency.
- Must not be merged with: `results_excluding_best_trade`, `results_excluding_worst_trade`, or `consistency`.

---

## `results_excluding_best_trade`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-012 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | one-extreme sensitivity |
| Canonical name | results_excluding_best_trade |
| Display name | Results excluding best trade |
| Exact definition | Current `net_pnl_excluding_largest_winner`: from fee-complete selected net P/L for current active eligible `ready_closed` Stock round trips in one trade-currency partition and server-authorized account scope, remove exactly one deterministic largest positive P/L row using the accepted P/L then close-time/stable-round-trip-ID tie policy, then sum the remaining net rows. It is unavailable without a relevant winning row. It is a historical one-extreme sensitivity result with eligible count and coverage as sample context, not an outlier-dependency label, causal conclusion, or trading advice. |
| Distinction from related concepts | It is a net-P/L sum after removing one best trade, not removal of every tied best trade, a generic results report, a gross-basis calculation, or proof of dependence on outliers. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | net money in the declared trade currency |
| Open-trade support | No. It uses only fee-complete eligible `ready_closed` net rows; `legitimate_open`, `needs_decision`, excluded, superseded, and unsupported rows are not inputs and remain coverage. |
| Fee handling | Requires complete supported fee coverage for every participating net row. Missing, conflicting, unsupported-policy, or currency-mismatched fee evidence must remain partial or unavailable; gross-basis variants are deferred future scope. |
| Version | 1 |

### Related Concepts

- Broader concept: historical one-extreme sensitivity evidence.
- Narrower concepts: the deterministic largest positive net-P/L row selected for removal.
- Commonly confused concepts: `dependency_on_outliers`, best trade, and `results_excluding_worst_trade`.
- Must not be merged with: `dependency_on_outliers` or a future gross-basis exclusion metric.

---

## `results_excluding_worst_trade`

| Field | Value |
|---|---|
| Inventory ID | C4-EDGE-013 |
| Category | Category 4: Edge and Quality Metrics |
| Subcategory | one-extreme sensitivity |
| Canonical name | results_excluding_worst_trade |
| Display name | Results excluding worst trade |
| Exact definition | Current `net_pnl_excluding_largest_loser`: from fee-complete selected net P/L for current active eligible `ready_closed` Stock round trips in one trade-currency partition and server-authorized account scope, remove exactly one deterministic most-negative P/L row using the accepted P/L then close-time/stable-round-trip-ID tie policy, then sum the remaining net rows. It is unavailable without a relevant losing row. It is a historical one-extreme sensitivity result with eligible count and coverage as sample context, not an outlier-dependency label, causal conclusion, or trading advice. |
| Distinction from related concepts | It is a net-P/L sum after removing one worst trade, not removal of every tied worst trade, a generic results report, a gross-basis calculation, or proof of dependence on outliers. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | net money in the declared trade currency |
| Open-trade support | No. It uses only fee-complete eligible `ready_closed` net rows; `legitimate_open`, `needs_decision`, excluded, superseded, and unsupported rows are not inputs and remain coverage. |
| Fee handling | Requires complete supported fee coverage for every participating net row. Missing, conflicting, unsupported-policy, or currency-mismatched fee evidence must remain partial or unavailable; gross-basis variants are deferred future scope. |
| Version | 1 |

### Related Concepts

- Broader concept: historical one-extreme sensitivity evidence.
- Narrower concepts: the deterministic most-negative net-P/L row selected for removal.
- Commonly confused concepts: `dependency_on_outliers`, worst trade, and `results_excluding_best_trade`.
- Must not be merged with: `dependency_on_outliers` or a future gross-basis exclusion metric.

---

# 6. Language Registry Deliverable

All 13 Version 1 registries are complete, approved, and locked after final
comprehensive independent Terra review. They describe future recognition and
validated read-only routing only; no active AI Chat runtime is claimed. All
Section 7 evaluation batches and the matching count/behavior coverage report
are complete and accepted.

## `expectancy` Language Registry

### Exact Definition

Historical selected-basis P/L divided by eligible current `ready_closed` trade
count, within a server-authoritative compatible account set and one compatible
currency/timezone partition; zero eligible denominator is unavailable.

### Formal Wording

- Calculate my expectancy for the selected period.

### Normal Conversational Wording

- What did I make per closed trade?

### Trader Slang

- What's my expected bucks per trade?

### Abbreviations

- No standalone abbreviation is safely accepted: bare `exp` or `EXP` must not
  auto-route and needs explicit expectancy metric grammar.

### Common Misspellings

- `expectency`, `expecancy`, and `expectensy` may resolve only in clear metric
  context.

### Noisy or Incomplete Input

- `expectancy last month pls` requests the metric but still requires a safe
  selected P/L basis if none is trusted.

### Singular and Plural Forms

- `expectancy` is the accepted invariant metric name; `expectancies` is not a
  separate metric.

### Full Questions

- What was my gross expectancy in July?

### Commands

- Show net expectancy for the selected account set this month.

### Sentence Fragments

- Expectancy by direction.

### Follow-Up Wording

- What about the same expectancy before fees?

### Correction Wording

- I meant gross expectancy, not net.

### Comparison Wording

- Compare my gross expectancy for longs and shorts.

### Ranking Wording

- Rank compatible ticker groups by gross expectancy, with the deterministic
  tie policy and eligible counts shown.

### Negated Wording

- Show expectancy without including open trades.

### Exclusion Wording

- Calculate gross expectancy excluding the selected ticker.

### Multi-Filter Wording

- Show gross expectancy for long trades in July in the selected account set.

### Multi-Part Question Wording

- Show gross expectancy and profit factor for July, then explain their stated
  historical limits.

### Ambiguous Wording

- How is my edge?

### Negative Examples

- What expectancy proves I will make money tomorrow? must not map to a
  prediction or advice claim.

### Context Requirements

Trusted selected account set, date scope, selected P/L basis, and compatible
currency/timezone partition are required; the server authorizes account scope.

### Required Data

Current active eligible `ready_closed` Stock rows, selected-basis P/L, trade
currency, coverage, and a nonzero eligible count are required.

### Optional Data

Existing typed date, instrument, direction, and compatible grouping context may
narrow the population when the query contract accepts it.

### Valid Filters

No registry-specific filter is added: inherit only the typed read-only Journal
Analytics allowlist and compatible server-authorized scope; unapproved labels
or cross-partition aggregation are invalid.

### Valid Groupings

No registry-specific grouping is added. Use only an existing typed grouping
that preserves the formula and compatible account/currency/timezone partitions.

### Valid Operators

Calculate, compare, group, rank, and explain are valid only through their
locked planned intents and existing validated query/result contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

Do not combine with open P/L, a zero denominator, untrusted account access,
cross-currency/timezone mixing, predicted performance, causation, or advice.

### Default Interpretation

No individual gross/net default is safe. Use a trusted selected basis or ask
one basis question; the Category 1 multi-metric summary rule does not silently
select an individual metric basis.

### Clarification Conditions

Clarify gross versus net when it can change the value and no trusted basis
exists; clarify a missing date or comparison target only when material.

### Recommended Clarification Wording

- Should I calculate expectancy on gross P/L or fee-covered net P/L?

### Unsupported Conditions

Zero eligible closed trades, incomplete net fee coverage, unsupported value
convention, incompatible partitions, and future/prescriptive requests return a
stated unavailable or policy limitation.

### Target Analytics Tool or Query Capability

Future validated routing to read-only `journal_analytics_query_v1` using the
current `expectancy` metric; no Chat handler exists.

### Result Units

Money in the declared trade currency; exact values remain authoritative and
display rounding occurs only at the result boundary.

### Fee Handling

Gross requires no fee facts. Net is fee-conditional and must preserve
complete, partial, or unavailable coverage without reconstructing fees.

### Open-Trade Handling

`legitimate_open` and `needs_decision` rows are excluded from realized inputs
and reported only through coverage.

### Sample-Size Considerations

Show eligible count and coverage; no sample size establishes an edge,
prediction, certainty, or trading recommendation.

---

## `profit_factor` Language Registry

### Exact Definition

Selected-basis aggregate positive P/L divided by absolute aggregate negative
P/L for current active eligible `ready_closed` rows within a
server-authoritative compatible account set and one compatible
currency/timezone partition; no-loss denominator is unavailable.

### Formal Wording

- Calculate my profit factor for the selected period.

### Normal Conversational Wording

- How much do my winners make compared with my losers overall?

### Trader Slang

- What's my profit factor on these trades?

### Abbreviations

- Bare `PF` is ambiguous/ticker-like and must not auto-route; it is accepted
  only with explicit profit-factor metric grammar.

### Common Misspellings

- `profit facor`, `proffit factor`, and `profitfacter` may resolve only in
  clear metric context.

### Noisy or Incomplete Input

- `pf for july` needs explicit metric context and a safe selected P/L basis.

### Singular and Plural Forms

- `profit factor` and `profit factors` refer to the same metric, not separate
  calculations.

### Full Questions

- What was my gross profit factor last month?

### Commands

- Show net profit factor for the selected account set.

### Sentence Fragments

- Profit factor by direction.

### Follow-Up Wording

- Now show it on gross P/L.

### Correction Wording

- I meant profit factor, not win rate.

### Comparison Wording

- Compare gross profit factor for the two selected periods.

### Ranking Wording

- Rank compatible ticker groups by gross profit factor with eligible counts and
  a deterministic tie policy.

### Negated Wording

- Show profit factor without open trades.

### Exclusion Wording

- Calculate gross profit factor excluding the selected ticker.

### Multi-Filter Wording

- Show gross profit factor for long trades in July in the selected account set.

### Multi-Part Question Wording

- Show gross profit factor and expectancy, then state their coverage.

### Ambiguous Wording

- Is my PF good?

### Negative Examples

- Does a profit factor above one mean I should trade this setup tomorrow? must
  not map to advice or prediction.

### Context Requirements

Trusted selected account set, date scope, selected P/L basis, compatible
currency/timezone partition, and an eligible loss population are required.

### Required Data

Eligible `ready_closed` selected-basis P/L rows, positive and negative totals,
trade currency, coverage, and nonzero absolute loss denominator are required.

### Optional Data

Existing typed date, instrument, direction, and compatible grouping context may
narrow the population when accepted by the query contract.

### Valid Filters

No registry-specific filter is added: inherit only typed read-only Journal
Analytics filters and compatible server-authorized scope.

### Valid Groupings

No registry-specific grouping is added. Existing typed grouping is valid only
when each result preserves the same formula and compatible partitions.

### Valid Operators

Calculate, compare, group, rank, and explain remain limited to locked planned
intents and existing validated query/result behavior.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

Do not combine with a no-loss denominator treated as infinity, open/decision
rows, cross-partition totals, untrusted accounts, causation, or advice.

### Default Interpretation

No individual gross/net default is safe; use a trusted basis or ask only for
the basis.

### Clarification Conditions

Clarify gross versus net when not trusted; return unavailable rather than ask a
compound question when no loss denominator exists.

### Recommended Clarification Wording

- Should I calculate profit factor on gross P/L or fee-covered net P/L?

### Unsupported Conditions

No eligible loss, incomplete net fee coverage, unsupported value convention,
incompatible partitions, and prescriptive/future claims are unsupported.

### Target Analytics Tool or Query Capability

Future validated routing to read-only `journal_analytics_query_v1` using the
current `profit_factor` metric; no Chat handler exists.

### Result Units

Ratio with exact numerator/denominator retained; result-boundary display
rounding never feeds a later calculation.

### Fee Handling

Gross requires no fee facts. Net is fee-conditional with explicit coverage;
missing fees must not be estimated.

### Open-Trade Handling

Only eligible realized `ready_closed` rows participate; `legitimate_open` and
`needs_decision` remain coverage.

### Sample-Size Considerations

Show eligible, winning, and losing counts plus coverage; no ratio certifies
quality, edge, or future results.

---

## `payoff_ratio` Language Registry

### Exact Definition

A distinct Planned recognition concept with no approved formula, numerator,
denominator, basis, result unit, or deterministic calculation.

### Formal Wording

- What is my payoff ratio?

### Normal Conversational Wording

- What's my payoff on these trades?

### Trader Slang

- What's the payoff here?

### Abbreviations

- Bare `PR`, `payoff`, or ticker-like shorthand must not auto-route; no safe
  standalone payoff-ratio abbreviation is accepted.

### Common Misspellings

- `payoff ration`, `pay off ratio`, and `payout ratio` require clarification,
  not automatic mapping.

### Noisy or Incomplete Input

- `payoff ratio pls` is recognized as Planned but has no calculation.

### Singular and Plural Forms

- `payoff ratio` and `payoff ratios` retain the same single Planned concept.

### Full Questions

- Can you calculate my payoff ratio for July?

### Commands

- Show my payoff ratio for the selected account set.

### Sentence Fragments

- Payoff ratio by ticker.

### Follow-Up Wording

- Is that the same as average win to average loss?

### Correction Wording

- I meant payoff ratio, not average win-to-average-loss ratio.

### Comparison Wording

- Compare payoff ratio between these months.

### Ranking Wording

- Rank my tickers by payoff ratio.

### Negated Wording

- Do not substitute average win/loss for payoff ratio.

### Exclusion Wording

- Show payoff ratio excluding the selected ticker.

### Multi-Filter Wording

- Show payoff ratio for long July trades in the selected account set.

### Multi-Part Question Wording

- Show payoff ratio and average win-to-average-loss ratio.

### Ambiguous Wording

- What's my reward to risk?

### Negative Examples

- Use my planned stop and target to calculate payoff ratio must not map here;
  planned-risk R-multiple is not this concept.

### Context Requirements

Even trusted account, date, and basis context cannot supply the missing payoff
formula; server-authoritative scope remains mandatory for any future result.

### Required Data

No current data set is sufficient because the formula and required facts are
unapproved.

### Optional Data

None can make this Planned concept executable without an approved definition.

### Valid Filters

No valid executable filters exist. A future contract may inherit only typed
read-only filters and compatible server-authorized partitions.

### Valid Groupings

No valid executable grouping exists until a formula and capability are
approved.

### Valid Operators

Recognition and one-field clarification are valid; calculation, comparison,
grouping, and ranking are unavailable.

### Compatible Intents

- `calculate_metric` may recognize the request and return the Planned limit;
  `explain_result` may explain that no formula is approved.

### Incompatible Combinations

Do not silently alias it to average/median win-loss ratio, R-multiple, profit
factor, a future claim, or an account-selection request.

### Default Interpretation

No calculation default exists. Preserve the exact `payoff_ratio` recognition
concept and report its Planned status.

### Clarification Conditions

Clarify only when the user asks whether they mean the distinct payoff concept,
the separately named average ratio, or planned-risk R-multiple.

### Recommended Clarification Wording

- Do you mean the distinct planned payoff-ratio concept, average win-to-average-loss ratio, or a planned-risk R-multiple?

### Unsupported Conditions

Any numeric payoff-ratio result is unavailable until its formula and capability
are approved; no value, zero, or alias fallback is allowed.

### Target Analytics Tool or Query Capability

No current deterministic metric. Future routing is recognition-only; no Chat
handler or calculation tool exists.

### Result Units

Not defined until the formula is approved.

### Fee Handling

Not defined. A future net-basis formula would require explicit fee-complete
coverage and cannot assume gross or net.

### Open-Trade Handling

Not defined; no open-trade or `needs_decision` result may be inferred.

### Sample-Size Considerations

No sample can validate an undefined formula; a future result must disclose its
eligible population and coverage without claiming certainty or advice.

---

## `average_win_to_average_loss_ratio` Language Registry

### Exact Definition

Average positive selected-basis P/L divided by absolute average negative
selected-basis P/L for eligible current `ready_closed` rows in a
server-authoritative compatible account set and one compatible
currency/timezone partition; both outcome populations are required.

### Formal Wording

- Calculate my average win-to-average-loss ratio for July.

### Normal Conversational Wording

- On average, how big are my wins versus my losses?

### Trader Slang

- What's my average win/loss ratio?

### Abbreviations

- Bare `AWL`, `W/L`, or ticker-like shorthand must not auto-route; accept only
  explicit average-win/average-loss metric grammar.

### Common Misspellings

- `average win loss ration`, `avg win to avg lose`, and `avrage win loss` need
  clear metric context.

### Noisy or Incomplete Input

- `avg win loss july` requests the metric but needs a trusted P/L basis.

### Singular and Plural Forms

- `average win-to-average-loss ratio` and explicit `average win/loss ratios`
  name the same metric.

### Full Questions

- What was my gross average win-to-average-loss ratio last month?

### Commands

- Show net average win-to-average-loss ratio for the selected account set.

### Sentence Fragments

- Average win/loss by direction.

### Follow-Up Wording

- Use the same ratio but on gross P/L.

### Correction Wording

- I meant the average ratio, not the median ratio.

### Comparison Wording

- Compare my gross average win-to-average-loss ratio for longs and shorts.

### Ranking Wording

- Rank compatible ticker groups by gross average win-to-average-loss ratio with
  eligible win/loss counts and deterministic ties.

### Negated Wording

- Do not include open trades in my average win/loss ratio.

### Exclusion Wording

- Calculate the gross average ratio excluding the selected ticker.

### Multi-Filter Wording

- Show gross average win-to-average-loss ratio for long July trades in the
  selected account set.

### Multi-Part Question Wording

- Show average and median win-to-loss ratios, then state their populations.

### Ambiguous Wording

- What's my win/loss ratio?

### Negative Examples

- Tell me my reward-to-risk ratio from planned stops must not map here.

### Context Requirements

Trusted selected account set, date scope, selected P/L basis, compatible
currency/timezone partition, and both outcome populations are required.

### Required Data

Eligible `ready_closed` selected-basis P/L rows, positive/negative partitions,
trade currency, coverage, and nonzero average-loss denominator are required.

### Optional Data

Existing typed date, instrument, direction, and compatible grouping context may
narrow the population only when accepted by the query contract.

### Valid Filters

No registry-specific filter is added: use only typed read-only Journal
Analytics filters in compatible server-authorized scope.

### Valid Groupings

No registry-specific grouping is added. Existing typed grouping is valid only
where each group retains compatible account/currency/timezone partitions.

### Valid Operators

Calculate, compare, group, rank, and explain are valid only through locked
planned intents and the validated query/result contract.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

Do not substitute median ratio, profit factor, payoff ratio, R-multiple, a
missing win/loss population, open rows, cross-partition totals, or advice.

### Default Interpretation

No individual gross/net default is safe; use trusted basis or ask one basis
question. Do not resolve bare win/loss wording to average rather than median.

### Clarification Conditions

Clarify average versus median when omitted, then gross versus net only if the
selected basis is not trusted; ask one unresolved field at a time.

### Recommended Clarification Wording

- Do you mean the average win-to-average-loss ratio or the median ratio?

### Unsupported Conditions

Missing winning/losing populations, zero/missing denominator, incomplete net
fee coverage, incompatible partitions, and planned-risk language are unavailable.

### Target Analytics Tool or Query Capability

Future validated routing to read-only `journal_analytics_query_v1` using
`average_win_loss_ratio`; no Chat handler exists.

### Result Units

Ratio with exact numerator/denominator retained; result-boundary rounding never
feeds later calculations.

### Fee Handling

Gross requires no fee facts. Net is fee-conditional and returns explicit
coverage rather than reconstructed values.

### Open-Trade Handling

Only eligible current `ready_closed` rows form outcome populations;
`legitimate_open` and `needs_decision` remain coverage.

### Sample-Size Considerations

Show eligible/winning/losing counts and coverage; no ratio demonstrates skill,
edge, causation, certainty, or advice.

---

## `median_win_to_median_loss_ratio` Language Registry

### Exact Definition

Exact median positive selected-basis P/L divided by absolute exact median
negative selected-basis P/L for eligible current `ready_closed` rows in a
server-authoritative compatible account set and one compatible
currency/timezone partition; both populations are required and an even median
uses the exact average of the two middle values.

### Formal Wording

- Calculate my median win-to-median-loss ratio for July.

### Normal Conversational Wording

- What's the middle win size compared with the middle loss size?

### Trader Slang

- What's my median win/loss ratio?

### Abbreviations

- Bare `MWL`, `W/L`, or ticker-like shorthand must not auto-route; accept only
  explicit median-win/median-loss metric grammar.

### Common Misspellings

- `median win loss ration`, `medain win loss`, and `median win to lose` need
  clear metric context.

### Noisy or Incomplete Input

- `median win loss july` requests the metric but needs a trusted P/L basis.

### Singular and Plural Forms

- `median win-to-median-loss ratio` and explicit `median win/loss ratios` name
  the same metric.

### Full Questions

- What was my gross median win-to-median-loss ratio last month?

### Commands

- Show net median win-to-median-loss ratio for the selected account set.

### Sentence Fragments

- Median win/loss by direction.

### Follow-Up Wording

- Now compare that median ratio with my average ratio.

### Correction Wording

- I meant the median ratio, not the average ratio.

### Comparison Wording

- Compare gross median win-to-median-loss ratio for these two periods.

### Ranking Wording

- Rank compatible ticker groups by gross median win-to-median-loss ratio with
  eligible win/loss counts and deterministic ties.

### Negated Wording

- Do not include open trades in my median win/loss ratio.

### Exclusion Wording

- Calculate the gross median ratio excluding the selected ticker.

### Multi-Filter Wording

- Show gross median win-to-median-loss ratio for long July trades in the
  selected account set.

### Multi-Part Question Wording

- Show median and average win-to-loss ratios with their coverage.

### Ambiguous Wording

- What's my typical win/loss ratio?

### Negative Examples

- Give me the median reward-to-risk from my planned stops must not map here.

### Context Requirements

Trusted selected account set, date scope, selected P/L basis, compatible
currency/timezone partition, and both outcome populations are required.

### Required Data

Eligible `ready_closed` selected-basis P/L rows, exact positive/negative
medians, trade currency, coverage, and both nonempty populations are required.

### Optional Data

Existing typed date, instrument, direction, and compatible grouping context may
narrow the population only when accepted by the query contract.

### Valid Filters

No registry-specific filter is added: use only typed read-only Journal
Analytics filters in compatible server-authorized scope.

### Valid Groupings

No registry-specific grouping is added. Existing typed grouping is valid only
where each group retains compatible account/currency/timezone partitions.

### Valid Operators

Calculate, compare, group, rank, and explain are valid only through locked
planned intents and the validated query/result contract.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

Do not substitute average ratio, profit factor, payoff ratio, R-multiple, a
missing win/loss population, open rows, cross-partition totals, or advice.

### Default Interpretation

No individual gross/net default is safe. Bare `typical` or win/loss wording
does not silently choose median rather than average.

### Clarification Conditions

Clarify median versus average when omitted, then gross versus net only if the
selected basis is not trusted; ask one unresolved field at a time.

### Recommended Clarification Wording

- Do you mean the median win-to-median-loss ratio or the average ratio?

### Unsupported Conditions

Missing winning/losing populations, incomplete net fee coverage, incompatible
partitions, unsupported value convention, and planned-risk language are unavailable.

### Target Analytics Tool or Query Capability

Future validated routing to read-only `journal_analytics_query_v1` using
`median_win_loss_ratio`; no Chat handler exists.

### Result Units

Ratio with exact median inputs and exact rational result retained; display
rounding occurs only at the result boundary.

### Fee Handling

Gross requires no fee facts. Net is fee-conditional and preserves explicit
complete, partial, or unavailable coverage.

### Open-Trade Handling

Only eligible current `ready_closed` rows form outcome populations;
`legitimate_open` and `needs_decision` remain coverage.

### Sample-Size Considerations

Show eligible/winning/losing counts and coverage; exact medians do not create
statistical certainty, causal claims, predictions, or advice.

---

## `consistency` Language Registry

### Exact Definition

Planned descriptive concept: no approved formula, baseline, time grain,
population, denominator, sample rule, or public metric exists.

### Formal Wording

- Calculate my consistency.

### Normal Conversational Wording

- How consistent have I been?

### Trader Slang

- Am I steady lately?

### Abbreviations

- Bare `cons`, `C`, or ticker-like shorthand must not auto-route.

### Common Misspellings

- `consistancy` and `consistant` require clear metric context.

### Noisy or Incomplete Input

- `consistency july pls` is Planned recognition, not a calculation.

### Singular and Plural Forms

- `consistency` and `consistent results` name one Planned concept.

### Full Questions

- Can you calculate my trading consistency for July?

### Commands

- Show consistency for the selected account set.

### Sentence Fragments

- Consistency by month.

### Follow-Up Wording

- Is that based on my win rate?

### Correction Wording

- I mean consistency, not standard deviation.

### Comparison Wording

- Compare consistency between these months.

### Ranking Wording

- Rank my tickers by consistency.

### Negated Wording

- Do not treat a streak as consistency.

### Exclusion Wording

- Show consistency excluding the selected ticker.

### Multi-Filter Wording

- Show consistency for long July trades in the selected account set.

### Multi-Part Question Wording

- Show consistency and standard deviation.

### Ambiguous Wording

- Am I disciplined?

### Negative Examples

- Does consistency prove I have an edge? must not map to a skill claim.

### Context Requirements

No account/date/basis context supplies the missing definition; future scope
must remain server-authoritative and partition-compatible.

### Required Data

No current data is sufficient until formula, baseline, and population are
approved; win rate, streak, and P/L dispersion are not substitutes.

### Optional Data

None makes the concept executable without an approved definition.

### Valid Filters

No executable filters exist; future filters may only inherit typed read-only
scope and compatible account/currency/timezone partitions.

### Valid Groupings

No executable grouping exists until a formula and capability are approved.

### Valid Operators

Recognition and one-field clarification are valid; calculation, comparison,
grouping, and ranking are unavailable.

### Compatible Intents

- `calculate_metric` may recognize Planned status; `explain_result` may state
  the missing definition.

### Incompatible Combinations

Do not substitute win rate, streak, standard deviation, profitability,
discipline, causation, prediction, advice, or another account.

### Default Interpretation

No calculation default exists; return the Planned limitation.

### Clarification Conditions

Do not ask the trader to define consistency; state that its definition and
capability remain Planned.

### Recommended Clarification Wording

- Consistency remains Planned because no formula or time grain is approved.

### Unsupported Conditions

Any numeric consistency result is unavailable until its definition and
capability are approved.

### Target Analytics Tool or Query Capability

No deterministic metric or Chat handler exists; current evidence inputs are
not a substitute.

### Result Units

Not defined until an approved formula exists.

### Fee Handling

Not defined; a future net-basis metric requires explicit fee-complete coverage.

### Open-Trade Handling

Not defined; no realized result may infer from `legitimate_open` or
`needs_decision` rows.

### Sample-Size Considerations

No sample validates an undefined formula; a future result must show coverage
without certainty, causation, or advice.

---

## `return_dispersion` Language Registry

### Exact Definition

Planned dispersion of approved per-trade returns; no return denominator,
return formula, aggregate formula, or public capability is approved.

### Formal Wording

- Calculate dispersion of my per-trade returns.

### Normal Conversational Wording

- How spread out are my returns?

### Trader Slang

- How wild are my returns?

### Abbreviations

- Bare `RD`, `disp`, or ticker-like shorthand must not auto-route.

### Common Misspellings

- `return dispertion` and `return dispursion` require clear metric context.

### Noisy or Incomplete Input

- `return spread july` is Planned recognition, not a calculation.

### Singular and Plural Forms

- `return dispersion` and `return dispersions` identify one Planned concept.

### Full Questions

- What was my return dispersion in July?

### Commands

- Show return dispersion for the selected account set.

### Sentence Fragments

- Return dispersion by ticker.

### Follow-Up Wording

- Is that P/L standard deviation?

### Correction Wording

- I mean return dispersion, not P/L standard deviation.

### Comparison Wording

- Compare return dispersion between these periods.

### Ranking Wording

- Rank tickers by return dispersion.

### Negated Wording

- Do not use account return for return dispersion.

### Exclusion Wording

- Show return dispersion excluding the selected ticker.

### Multi-Filter Wording

- Show return dispersion for long July trades in the selected account set.

### Multi-Part Question Wording

- Show return dispersion and P/L standard deviation.

### Ambiguous Wording

- How volatile are my results?

### Negative Examples

- Use my equity curve volatility as return dispersion must not map here.

### Context Requirements

No trusted account/date/basis context supplies the missing per-trade return
denominator; future scope must remain server-authoritative and compatible.

### Required Data

No current data is sufficient: P/L variance, P/L standard deviation, account
return, and equity volatility are evidence inputs, not substitutes.

### Optional Data

None makes return dispersion executable without approved return/distribution
contracts.

### Valid Filters

No executable filters exist; future filters may only inherit typed read-only
scope and compatible account/currency/timezone partitions.

### Valid Groupings

No executable grouping exists until return and dispersion contracts are approved.

### Valid Operators

Recognition and one-field clarification are valid; calculation, comparison,
grouping, and ranking are unavailable.

### Compatible Intents

- `calculate_metric` may recognize Planned status; `explain_result` may state
  the missing return contract.

### Incompatible Combinations

Do not substitute P/L standard deviation, account/equity volatility, an
invented return denominator, causation, prediction, advice, or another account.

### Default Interpretation

No default denominator or calculation exists; return the Planned limitation.

### Clarification Conditions

Clarify only when the supported P/L standard-deviation alternative is plausible;
otherwise state that return dispersion remains Planned.

### Recommended Clarification Wording

- Do you mean supported selected-basis P/L standard deviation instead of planned return dispersion?

### Unsupported Conditions

Any numeric result is unavailable until return and aggregate-dispersion
contracts are approved.

### Target Analytics Tool or Query Capability

No deterministic metric or Chat handler exists; current P/L dispersion is not
a substitute.

### Result Units

Not defined until the return/distribution contract is approved.

### Fee Handling

Not defined; a future net-return calculation requires explicit fee-complete
coverage.

### Open-Trade Handling

Not defined; no open-trade mark or `needs_decision` fallback may be inferred.

### Sample-Size Considerations

No sample validates an undefined return formula; future output must show
coverage without small-sample certainty, causation, or advice.

---

## `standard_deviation` Language Registry

### Exact Definition

Supported selected-basis population P/L standard deviation: exact population
variance followed by a deterministically rounded, explicitly labeled square
root over eligible current `ready_closed` rows in one compatible
server-authoritative account/currency/timezone partition.

### Formal Wording

- Calculate my P/L standard deviation for July.

### Normal Conversational Wording

- How spread out is my trade P/L?

### Trader Slang

- How wild is my P/L per trade?

### Abbreviations

- Bare `SD`, `std dev`, or ticker-like shorthand must not auto-route; P/L
  metric grammar is required.

### Common Misspellings

- `standrad deviation`, `standard devation`, and `stdviation` need clear P/L
  context.

### Noisy or Incomplete Input

- `std dev july` requires clarification between P/L and return dispersion.

### Singular and Plural Forms

- `standard deviation` and explicit `P/L standard deviations` name this metric.

### Full Questions

- What was my gross P/L standard deviation last month?

### Commands

- Show net P/L standard deviation for the selected account set.

### Sentence Fragments

- P/L standard deviation by direction.

### Follow-Up Wording

- Is that return volatility instead?

### Correction Wording

- I meant P/L standard deviation, not return dispersion.

### Comparison Wording

- Compare gross P/L standard deviation between these periods.

### Ranking Wording

- Rank compatible ticker groups by gross P/L standard deviation with eligible
  counts and deterministic ties.

### Negated Wording

- Do not include open trades in P/L standard deviation.

### Exclusion Wording

- Show gross P/L standard deviation excluding the selected ticker.

### Multi-Filter Wording

- Show gross P/L standard deviation for long July trades in the selected set.

### Multi-Part Question Wording

- Show P/L standard deviation and expectancy with coverage.

### Ambiguous Wording

- What's my volatility?

### Negative Examples

- Does low standard deviation prove I will be profitable? must not map to a
  certainty or advice claim.

### Context Requirements

Trusted selected account set, date, selected P/L basis, and compatible
currency/timezone partition are required; server authorization controls scope.

### Required Data

Eligible `ready_closed` selected-basis P/L rows, trade currency, coverage, and
a nonempty population are required.

### Optional Data

Existing typed date, instrument, direction, and compatible grouping context may
narrow the population when accepted by the query contract.

### Valid Filters

No registry-specific filter is added: use only typed read-only filters and
compatible server-authorized scope.

### Valid Groupings

No registry-specific grouping is added. Existing typed grouping is valid only
when each result preserves compatible partitions.

### Valid Operators

Calculate, compare, group, rank, and explain are valid only through locked
planned intents and validated query/result behavior.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

Do not substitute return dispersion, account/equity volatility, cross-partition
aggregation, open rows, causation, prediction, or advice.

### Default Interpretation

No gross/net default is safe. Bare volatility/std-dev wording requires P/L
versus return clarification before selecting a basis.

### Clarification Conditions

Clarify P/L versus return first, then gross versus net if no trusted basis;
ask one unresolved field at a time.

### Recommended Clarification Wording

- Do you mean selected-basis P/L standard deviation or planned return dispersion?

### Unsupported Conditions

Empty population, incomplete net fee coverage, incompatible partitions,
unsupported value convention, return volatility, and prescriptive claims are unavailable.

### Target Analytics Tool or Query Capability

Future validated routing to `journal_analytics_query_v1` using
`population_pnl_standard_deviation`; no Chat handler exists.

### Result Units

Money in the declared trade currency. Exact variance is retained; only the
explicitly labeled deterministic square root is rounded at result boundary.

### Fee Handling

Gross needs no fee facts. Net is fee-conditional and preserves explicit
complete, partial, or unavailable coverage.

### Open-Trade Handling

Only eligible `ready_closed` rows participate; `legitimate_open` and
`needs_decision` rows remain coverage.

### Sample-Size Considerations

Show eligible count and coverage; small samples and rounded square root never
establish statistical certainty, edge, causation, prediction, or advice.

---

## `percentage_of_total_profit_from_top_trades` Language Registry

### Exact Definition

Planned positive-P/L concentration for an approved top-trade set divided by
total positive selected-basis P/L; no multi-trade N/percentage selection or tie
rule is approved.

### Formal Wording

- Calculate the percentage of total profit from my top trades.

### Normal Conversational Wording

- How much of my profit came from my best trades?

### Trader Slang

- Are my top winners carrying the profits?

### Abbreviations

- Bare `top P/L`, `TP`, or ticker-like shorthand must not auto-route.

### Common Misspellings

- `top trade profitt`, `profit from top trade`, and `top winners share` need
  clear metric context.

### Noisy or Incomplete Input

- `top trades profit percent` is Planned recognition and needs a top-set rule.

### Singular and Plural Forms

- The plan-listed plural `top trades` is distinct from one largest winner.

### Full Questions

- What percentage of gross profit came from my top trades in July?

### Commands

- Show top-trades profit percentage for the selected account set.

### Sentence Fragments

- Top-trade profit share by ticker.

### Follow-Up Wording

- Do you mean only my single largest winner?

### Correction Wording

- I mean top trades, not the largest winner contribution.

### Comparison Wording

- Compare top-trades profit share between these months.

### Ranking Wording

- Rank tickers by top-trades profit share.

### Negated Wording

- Do not treat my single best trade as all top trades.

### Exclusion Wording

- Show top-trades profit share excluding the selected ticker.

### Multi-Filter Wording

- Show top-trades profit share for long July trades in the selected set.

### Multi-Part Question Wording

- Show top-trades profit share and largest-winner contribution.

### Ambiguous Wording

- Did a few trades make all my money?

### Negative Examples

- Prove my strategy depends on outliers from top-trade share must not map to a
  causal/dependency label.

### Context Requirements

Account/date/basis context is insufficient without one approved top-set N or
percentage rule; future scope remains server-authoritative and compatible.

### Required Data

No current data is sufficient for plural top trades: one-largest contribution
is evidence only, not a substitute; future formula needs nonzero positive P/L.

### Optional Data

None can define the unapproved top set or deterministic ties.

### Valid Filters

No executable filters exist; future filters may inherit only typed read-only
scope and compatible account/currency/timezone partitions.

### Valid Groupings

No executable grouping exists until top-set and tie rules are approved.

### Valid Operators

Recognition and one-field clarification are valid; calculate/compare/group/rank
are unavailable.

### Compatible Intents

- `calculate_metric` may recognize Planned status; `explain_result` may state
  the missing top-set rule.

### Incompatible Combinations

Do not silently map plural top trades to `largest_winner_contribution`, invent
N/ties, use open rows, infer dependency, causation, prediction, or advice.

### Default Interpretation

No top-set default exists; preserve Planned status and do not choose one winner.

### Clarification Conditions

Clarify only when the current single-largest-winner contribution is plausible;
otherwise state that plural top-trades concentration remains Planned.

### Recommended Clarification Wording

- Do you mean the current single-largest-winner contribution instead of planned plural top-trades concentration?

### Unsupported Conditions

Any plural top-trades percentage is unavailable until selection/tie rules and a
nonzero positive-P/L denominator are approved.

### Target Analytics Tool or Query Capability

No current deterministic metric or Chat handler; `largest_winner_contribution`
is evidence only and cannot be silently routed here.

### Result Units

Not defined until formula approval; any future result is expected to be a
percentage with result-boundary rounding only.

### Fee Handling

Not defined; future net basis requires fee-complete coverage and no gross/net
default is allowed.

### Open-Trade Handling

Not defined; any future realized result excludes `legitimate_open` and
`needs_decision` rows.

### Sample-Size Considerations

Future output must show selected-set and eligible counts plus coverage; no share
proves outlier dependency, edge, certainty, causation, or advice.

---

## `percentage_of_total_loss_from_worst_trades` Language Registry

### Exact Definition

Planned absolute-negative-P/L concentration for an approved plural worst-trade
set divided by total absolute negative selected-basis P/L; no N/percentage or
tie rule is approved.

### Formal Wording

- Calculate the percentage of total loss from my worst trades.

### Normal Conversational Wording

- How much of my loss came from my worst trades?

### Trader Slang

- Are a few losers causing all the damage?

### Abbreviations

- Bare `WL`, `worst loss`, or ticker-like shorthand must not auto-route.

### Common Misspellings

- `worst trade loss`, `worst loos share`, and `worse trades` need clear context.

### Noisy or Incomplete Input

- `worst losses percent` is Planned recognition and needs a worst-set rule.

### Singular and Plural Forms

- Plan-listed plural `worst trades` is distinct from one largest loser.

### Full Questions

- What percentage of gross loss came from my worst trades in July?

### Commands

- Show worst-trades loss percentage for the selected account set.

### Sentence Fragments

- Worst-trade loss share by ticker.

### Follow-Up Wording

- Do you mean only my single largest loser?

### Correction Wording

- I mean worst trades, not largest-loser contribution.

### Comparison Wording

- Compare worst-trades loss share between these months.

### Ranking Wording

- Rank tickers by worst-trades loss share.

### Negated Wording

- Do not treat my single worst trade as all worst trades.

### Exclusion Wording

- Show worst-trades loss share excluding the selected ticker.

### Multi-Filter Wording

- Show worst-trades loss share for short July trades in the selected set.

### Multi-Part Question Wording

- Show worst-trades loss share and largest-loser contribution.

### Ambiguous Wording

- Did a few losers create all my losses?

### Negative Examples

- Prove I depend on outliers from worst-trade share must not map to dependency.

### Context Requirements

No trusted scope/date/basis supplies the missing plural worst-set rule; future
scope remains server-authoritative and account/currency/timezone compatible.

### Required Data

No current data is sufficient: single-largest-loss contribution is evidence,
not a plural-set substitute; future denominator must be nonzero absolute loss.

### Optional Data

No optional context defines N, percentage, or deterministic ties.

### Valid Filters

No executable filters; future filters inherit only typed read-only compatible scope.

### Valid Groupings

No executable grouping until worst-set and tie rules are approved.

### Valid Operators

Recognition and one-field clarification only; calculate/compare/group/rank unavailable.

### Compatible Intents

- `calculate_metric` recognizes Planned status; `explain_result` states its limit.

### Incompatible Combinations

Do not map to `largest_loser_contribution`, invent N/ties, use open/decision
rows, or infer dependency, causation, prediction, or advice.

### Default Interpretation

No worst-set default exists; retain Planned status.

### Clarification Conditions

Clarify only when the current single-largest-loser contribution is plausible;
otherwise state that plural worst-trades concentration remains Planned.

### Recommended Clarification Wording

- Do you mean the current single-largest-loser contribution instead of planned plural worst-trades concentration?

### Unsupported Conditions

Numeric plural-set result is unavailable until selection/ties and nonzero
absolute-loss denominator are approved.

### Target Analytics Tool or Query Capability

No deterministic metric or Chat handler; `largest_loser_contribution` is evidence only.

### Result Units

Not defined until formula approval; future output is expected percentage with boundary rounding.

### Fee Handling

Not defined; future net basis requires fee-complete coverage and no basis default.

### Open-Trade Handling

Future realized result excludes `legitimate_open` and `needs_decision` rows.

### Sample-Size Considerations

Future output states selected-set/eligible counts and coverage, never certainty,
dependency, causation, or advice.

---

## `dependency_on_outliers` Language Registry

### Exact Definition

Planned descriptive non-causal sensitivity concept; no outlier definition,
comparison method, threshold, dependency label, or capability is approved.

### Formal Wording

- Determine whether my results depend on outliers.

### Normal Conversational Wording

- Are a few trades carrying my results?

### Trader Slang

- Am I getting saved by outliers?

### Abbreviations

- Bare `DO`, `outlier dep`, or ticker-like shorthand must not auto-route.

### Common Misspellings

- `dependancy on outliers` and `outlyer dependency` need clear context.

### Noisy or Incomplete Input

- `outlier dependency pls` is Planned recognition, not a label.

### Singular and Plural Forms

- `dependency on outliers` and `outlier dependence` name one Planned concept.

### Full Questions

- Do my July results depend on outliers?

### Commands

- Show dependency on outliers for the selected account set.

### Sentence Fragments

- Outlier dependency by ticker.

### Follow-Up Wording

- Is that based on excluding my best trade?

### Correction Wording

- I mean dependency, not the exclusion result itself.

### Comparison Wording

- Compare outlier dependency between months.

### Ranking Wording

- Rank tickers by outlier dependency.

### Negated Wording

- Do not label me dependent on outliers.

### Exclusion Wording

- Show dependency excluding the selected ticker.

### Multi-Filter Wording

- Show outlier dependency for long July trades in the selected set.

### Multi-Part Question Wording

- Show exclusion results and explain their stated limits.

### Ambiguous Wording

- Are my results real without the big winner?

### Negative Examples

- Prove my strategy has no edge because of one trade must not map to a claim.

### Context Requirements

Scope/date/basis cannot supply the missing outlier/threshold definition; future
scope remains server-authoritative and compatible.

### Required Data

No current data is sufficient: contributions and one-extreme exclusions are
evidence inputs, not substitutes for a dependency label.

### Optional Data

No optional context creates an approved threshold or interpretation.

### Valid Filters

No executable filters; future filters inherit only typed read-only compatible scope.

### Valid Groupings

No executable grouping until descriptive comparison policy is approved.

### Valid Operators

Recognition and one-field clarification only; calculate/compare/group/rank unavailable.

### Compatible Intents

- `calculate_metric` recognizes Planned status; `explain_result` states the limit.

### Incompatible Combinations

Do not turn contribution/exclusion evidence into a dependency label, skill,
edge, causation, prediction, advice, or cross-account inference.

### Default Interpretation

No threshold/default exists; state Planned non-causal limitation.

### Clarification Conditions

Clarify only when supported one-extreme sensitivity is plausible; otherwise
state that dependency on outliers remains Planned.

### Recommended Clarification Wording

- Do you mean supported net P/L excluding one best or worst trade instead of planned dependency on outliers?

### Unsupported Conditions

Any dependency label or threshold result is unavailable until policy is approved.

### Target Analytics Tool or Query Capability

No deterministic metric or Chat handler; existing sensitivity inputs are not substitutes.

### Result Units

Not defined until descriptive comparison policy is approved.

### Fee Handling

Not defined; future net comparison requires fee-complete coverage.

### Open-Trade Handling

No conclusion from `legitimate_open` or `needs_decision`; future realized scope excludes them.

### Sample-Size Considerations

Future output must show coverage without dependency certainty, causation,
prediction, or advice.

---

## `results_excluding_best_trade` Language Registry

### Exact Definition

Supported fee-complete selected net P/L after removing exactly one deterministic
largest positive eligible `ready_closed` row by P/L then close-time/stable-ID.

### Formal Wording

- Calculate net results excluding my best trade.

### Normal Conversational Wording

- What remains if my biggest winner is removed?

### Trader Slang

- P/L without my top winner.

### Abbreviations

- Bare `ex best`, `BE`, or ticker-like shorthand must not auto-route.

### Common Misspellings

- `excluding best traid` and `without best trade` need clear metric context.

### Noisy or Incomplete Input

- `pnl w/o best trade` identifies the net-only sensitivity result.

### Singular and Plural Forms

- `best trade` means exactly one deterministic row, never all tied best trades.

### Full Questions

- What is my net P/L excluding my best trade in July?

### Commands

- Show net results without my best trade for the selected account set.

### Sentence Fragments

- Net P/L excluding best trade.

### Follow-Up Wording

- Now remove the worst trade instead.

### Correction Wording

- Remove one best trade, not every tied winner.

### Comparison Wording

- Compare net P/L before and after removing the best trade.

### Ranking Wording

- Rank compatible ticker groups by net P/L excluding one best trade with ties shown.

### Negated Wording

- Do not remove all tied winners.

### Exclusion Wording

- Exclude the best trade and the selected ticker from net P/L.

### Multi-Filter Wording

- Show net P/L excluding best trade for long July trades in the selected set.

### Multi-Part Question Wording

- Show net P/L with and without the best trade and state coverage.

### Ambiguous Wording

- What are my results without the big winner?

### Negative Examples

- Prove I depend on outliers after removing my best trade must not map to a label.

### Context Requirements

Server-authorized compatible account/currency/timezone set, date scope, and
fee-complete net basis are required.

### Required Data

Fee-complete eligible `ready_closed` net rows, deterministic tie facts,
currency, coverage, and at least one positive row are required.

### Optional Data

Typed date/instrument/direction context may narrow the population if accepted.

### Valid Filters

Only existing typed read-only filters in compatible authorized scope are valid.

### Valid Groupings

Only existing typed grouping that preserves compatible partitions is valid.

### Valid Operators

Calculate, compare, group, rank, and explain use locked planned intents only.

### Compatible Intents

- `calculate_metric`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

No gross variant, all-ties removal, open/decision inputs, incomplete fees,
cross-partition mixing, dependency label, causation, prediction, or advice.

### Default Interpretation

Use only current net one-extreme rule; gross variants remain deferred.

### Clarification Conditions

Clarify net result versus a different requested result type; do not infer gross.

### Recommended Clarification Wording

- Do you want the supported fee-complete net P/L sensitivity result removing one best trade?

### Unsupported Conditions

No winner, incomplete fees, gross request, all-ties request, or incompatible scope is unavailable.

### Target Analytics Tool or Query Capability

Future validated `journal_analytics_query_v1` route using `net_pnl_excluding_largest_winner`.

### Result Units

Net money in trade currency; exact values calculate first and display rounding is boundary-only.

### Fee Handling

All participating rows require complete supported fees; gross is deferred.

### Open-Trade Handling

`legitimate_open` and `needs_decision` are coverage, never inputs.

### Sample-Size Considerations

Show eligible/removed-row coverage; result is sensitivity, not certainty or advice.

---

## `results_excluding_worst_trade` Language Registry

### Exact Definition

Supported fee-complete selected net P/L after removing exactly one deterministic
most-negative eligible `ready_closed` row by P/L then close-time/stable-ID.

### Formal Wording

- Calculate net results excluding my worst trade.

### Normal Conversational Wording

- What remains if my biggest loser is removed?

### Trader Slang

- P/L without my worst loser.

### Abbreviations

- Bare `ex worst`, `BW`, or ticker-like shorthand must not auto-route.

### Common Misspellings

- `excluding worst traid` and `without worst trade` need clear metric context.

### Noisy or Incomplete Input

- `pnl w/o worst trade` identifies the net-only sensitivity result.

### Singular and Plural Forms

- `worst trade` means exactly one deterministic row, never all tied worst trades.

### Full Questions

- What is my net P/L excluding my worst trade in July?

### Commands

- Show net results without my worst trade for the selected account set.

### Sentence Fragments

- Net P/L excluding worst trade.

### Follow-Up Wording

- Now remove the best trade instead.

### Correction Wording

- Remove one worst trade, not every tied loser.

### Comparison Wording

- Compare net P/L before and after removing the worst trade.

### Ranking Wording

- Rank compatible ticker groups by net P/L excluding one worst trade with ties shown.

### Negated Wording

- Do not remove all tied losers.

### Exclusion Wording

- Exclude the worst trade and selected ticker from net P/L.

### Multi-Filter Wording

- Show net P/L excluding worst trade for short July trades in the selected set.

### Multi-Part Question Wording

- Show net P/L with and without the worst trade and state coverage.

### Ambiguous Wording

- What are my results without the big loser?

### Negative Examples

- Prove I depend on outliers after removing my worst trade must not map to a label.

### Context Requirements

Server-authorized compatible account/currency/timezone set, date scope, and
fee-complete net basis are required.

### Required Data

Fee-complete eligible `ready_closed` net rows, deterministic tie facts,
currency, coverage, and at least one negative row are required.

### Optional Data

Typed date/instrument/direction context may narrow the population if accepted.

### Valid Filters

Only existing typed read-only filters in compatible authorized scope are valid.

### Valid Groupings

Only existing typed grouping that preserves compatible partitions is valid.

### Valid Operators

Calculate, compare, group, rank, and explain use locked planned intents only.

### Compatible Intents

- `calculate_metric`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

No gross variant, all-ties removal, open/decision inputs, incomplete fees,
cross-partition mixing, dependency label, causation, prediction, or advice.

### Default Interpretation

Use only current net one-extreme rule; gross variants remain deferred.

### Clarification Conditions

Clarify net result versus a different requested result type; do not infer gross.

### Recommended Clarification Wording

- Do you want the supported fee-complete net P/L sensitivity result removing one worst trade?

### Unsupported Conditions

No loser, incomplete fees, gross request, all-ties request, or incompatible scope is unavailable.

### Target Analytics Tool or Query Capability

Future validated `journal_analytics_query_v1` route using `net_pnl_excluding_largest_loser`.

### Result Units

Net money in trade currency; exact values calculate first and display rounding is boundary-only.

### Fee Handling

All participating rows require complete supported fees; gross is deferred.

### Open-Trade Handling

`legitimate_open` and `needs_decision` are coverage, never inputs.

### Sample-Size Considerations

Show eligible/removed-row coverage; result is sensitivity, not certainty or advice.

---

# 7. Evaluation Cases Deliverable

Section 7 Batches 1--4 passed independent review and are controller accepted
for `expectancy`, `profit_factor`, `payoff_ratio`,
`average_win_to_average_loss_ratio`, `median_win_to_median_loss_ratio`, and
`consistency`, `return_dispersion`, `standard_deviation`,
`percentage_of_total_profit_from_top_trades`,
`percentage_of_total_loss_from_worst_trades`, `dependency_on_outliers`,
`results_excluding_best_trade`, and `results_excluding_worst_trade`: all
286 cases passed. These cases test future
read-only routing and safety only; they do not claim an active Chat runtime,
formula approval, or category approval.

## 7.1 Evaluation Case Schema and Type Coverage

Every object below uses the locked 21-key schema and the ordered required case
types: `canonical`, `formal_paraphrase`, `conversational_paraphrase`,
`trader_slang`, `abbreviation`, `misspelling`, `noisy_input`, `command`,
`fragment`, `follow_up`, `correction`, `comparison`, `ranking`, `negation`,
`exclusion`, `multi_filter`, `multi_part`, `ambiguous`, `negative_example`,
`unsupported_data`, `selected_entity_context`, and `cross_category`.
`expectedPrimaryIntent` and ordered `expectedSecondaryIntents` use the locked
Category 1 intent names. Empty arrays and `null` values are explicit; a
protected action is never implied.

| Case type | Required | Saved / batch-reviewed | Passed | Notes |
|---|---:|---:|---:|---|
| Each of the 22 ordered types | 13 | 13 | 13 | One case per type is saved and batch-reviewed for every C4-E1 through C4-E13 array. |
| Total | 286 | 286 | 286 | Batches 1--4 and final comprehensive independent Terra review accepted. |

All batch-reviewed behavior counts are `clarificationExpected: 16`,
`unsupportedExpected: 132`, and `cross_category: 13`. Batches 1--3
contribute Clarification 14, Unsupported 86, and Cross-category 9; final
Batch 4 contributes Clarification 2, Unsupported 46, and Cross-category 4.
All four batches passed independent review and controller acceptance.

## 7.2 `expectancy` Cases

```json
[
{"caseId":"C4-E1-01","caseType":"canonical","input":"Show my gross expectancy for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","account IANA timezone"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical average gross P/L per eligible closed trade; return eligible count and coverage."},
{"caseId":"C4-E1-02","caseType":"formal_paraphrase","input":"Calculate the arithmetic mean gross realized P/L for eligible closed round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition","timezone"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses the exact selected-basis sum divided by eligible count."},
{"caseId":"C4-E1-03","caseType":"conversational_paraphrase","input":"What did I make per closed trade last month before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","last month"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Before fees explicitly chooses gross P/L."},
{"caseId":"C4-E1-04","caseType":"trader_slang","input":"What's my expected bucks per trade in June gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","June"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang is historical money-per-trade wording, not a forecast."},
{"caseId":"C4-E1-05","caseType":"abbreviation","input":"EXP expectancy for July gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit expectancy metric grammar","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"EXP is accepted only beside explicit expectancy grammar; bare EXP remains symbol-safe."},
{"caseId":"C4-E1-06","caseType":"misspelling","input":"Show my expectency for July gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear metric context","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize only the clear metric misspelling."},
{"caseId":"C4-E1-07","caseType":"noisy_input","input":"expectancy july gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not add an account, date, or unsupported grouping."},
{"caseId":"C4-E1-08","caseType":"command","input":"Calculate gross expectancy for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","June"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Read-only metric request."},
{"caseId":"C4-E1-09","caseType":"fragment","input":"Net expectancy this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","net P/L","this month"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net coverage","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Net is supported only with explicit fee coverage."},
{"caseId":"C4-E1-10","caseType":"follow_up","input":"Now show that expectancy after fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["prior ready_closed population","net P/L"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"prior time range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","fee-complete net coverage","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses only trusted prior scope and must surface fee coverage."},
{"caseId":"C4-E1-11","caseType":"correction","input":"I meant gross expectancy, not net, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction replaces only the trusted P/L basis."},
{"caseId":"C4-E1-12","caseType":"comparison","input":"Compare my gross expectancy for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July","June"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross expectancy"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","same currency partition","same timezone"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both periods retain their eligible counts and coverage."},
{"caseId":"C4-E1-13","caseType":"ranking","input":"Rank compatible ticker groups by July gross expectancy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":["ticker"],"expectedOperators":["mean selected-basis P/L","descending"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["compatible partitions","deterministic tie policy","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each ticker result must retain an eligible count and coverage."},
{"caseId":"C4-E1-14","caseType":"negation","input":"Show July gross expectancy without open trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July","exclude legitimate_open"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L","exclude open"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and pending-decision rows never enter realized expectancy."},
{"caseId":"C4-E1-15","caseType":"exclusion","input":"Calculate July gross expectancy excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The visible exclusion narrows only the eligible population."},
{"caseId":"C4-E1-16","caseType":"multi_filter","input":"Show July gross expectancy for long trades entered from 09:30 through 09:59 in the account's local time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July","long","entry time 09:30 through 09:59 account-local"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit local entry-time bucket","account IANA timezone","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit account-local entry-time bucket and observed direction narrow the eligible realized population."},
{"caseId":"C4-E1-17","caseType":"multi_part","input":"Show July gross expectancy and profit factor with their eligible counts.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["expectancy","profit_factor"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L","profit/loss ratio"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","one currency partition","per-metric denominator checks"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each metric retains its own formula and unavailable condition."},
{"caseId":"C4-E1-18","caseType":"ambiguous","input":"How is my edge in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want historical expectancy, profit factor, or another defined metric for July?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not infer one quality metric from the broad word edge."},
{"caseId":"C4-E1-19","caseType":"negative_example","input":"Will my July expectancy guarantee profit next month?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no prediction or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical expectancy cannot guarantee or predict future profitability.","notes":"Rejects a future-certainty claim without giving trading advice."},
{"caseId":"C4-E1-20","caseType":"unsupported_data","input":"Show July net expectancy even though fee coverage is incomplete.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","net P/L","July","incomplete fee coverage"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee coverage","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Net expectancy requires fee-complete supported coverage and must not reconstruct missing fees.","notes":"Return the explicit unavailable or partial-coverage state."},
{"caseId":"C4-E1-21","caseType":"selected_entity_context","input":"Show gross expectancy for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","selected review period"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context is used only when trusted and authorized."},
{"caseId":"C4-E1-22","caseType":"cross_category","input":"Explain why my July gross expectancy differed from June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["expectancy"],"expectedFilters":["ready_closed","gross P/L","July","June"],"expectedGroupings":[],"expectedOperators":["mean selected-basis P/L","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross expectancy"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A future explanation may describe documented differences but cannot assert causation."}
]
```

## 7.3 `profit_factor` Cases

```json
[
{"caseId":"C4-E2-01","caseType":"canonical","input":"Show my gross profit factor for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","account IANA timezone","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical ratio with eligible, winning, losing, and coverage context."},
{"caseId":"C4-E2-02","caseType":"formal_paraphrase","input":"Determine aggregate gross profit divided by the absolute aggregate gross loss for eligible July round trips.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The denominator is loss magnitude, not a count or average."},
{"caseId":"C4-E2-03","caseType":"conversational_paraphrase","input":"How much did my winners make versus losers overall last month before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","last month"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Before fees selects gross P/L."},
{"caseId":"C4-E2-04","caseType":"trader_slang","input":"What's my PF on June gross trades?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","June"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["explicit profit-factor grammar","account scope","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"PF is supported only in clear metric grammar."},
{"caseId":"C4-E2-05","caseType":"abbreviation","input":"PF profit factor for July gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit profit-factor metric grammar","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare PF remains ticker-like and does not auto-route."},
{"caseId":"C4-E2-06","caseType":"misspelling","input":"Calculate my profit facor for July gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear metric context","account scope","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize a clear misspelling only."},
{"caseId":"C4-E2-07","caseType":"noisy_input","input":"profit factor july gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not create an account, grouping, or infinity fallback."},
{"caseId":"C4-E2-08","caseType":"command","input":"Calculate gross profit factor for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","June"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Read-only calculation request."},
{"caseId":"C4-E2-09","caseType":"fragment","input":"Net profit factor this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","net P/L","this month"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net coverage","account scope","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Net requires explicit fee coverage."},
{"caseId":"C4-E2-10","caseType":"follow_up","input":"Now show that profit factor after fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["prior ready_closed population","net P/L"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"prior time range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","fee-complete net coverage","eligible loss denominator","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted prior scope does not bypass the net fee or loss-denominator checks."},
{"caseId":"C4-E2-11","caseType":"correction","input":"I meant gross profit factor, not win rate, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total","metric correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects the ratio of P/L totals, not a winning-trade rate."},
{"caseId":"C4-E2-12","caseType":"comparison","input":"Compare my gross profit factor for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July","June"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross profit factor"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","same currency partition","same timezone","loss denominator per period"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each comparison side independently needs a loss denominator."},
{"caseId":"C4-E2-13","caseType":"ranking","input":"Rank compatible ticker groups by July gross profit factor.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":["ticker"],"expectedOperators":["positive P/L total divided by absolute negative P/L total","descending"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["compatible partitions","deterministic tie policy","loss denominator per group","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Groups without losses return their unavailable state, not infinity."},
{"caseId":"C4-E2-14","caseType":"negation","input":"Show July gross profit factor without open trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July","exclude legitimate_open"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total","exclude open"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are never ratio inputs."},
{"caseId":"C4-E2-15","caseType":"exclusion","input":"Calculate July gross profit factor excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","account scope","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The exclusion may make the denominator unavailable and must show that state."},
{"caseId":"C4-E2-16","caseType":"multi_filter","input":"Show July gross profit factor for long trades entered from 09:30 through 09:59 in the account's local time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July","long","entry time 09:30 through 09:59 account-local"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit local entry-time bucket","account IANA timezone","account scope","one currency partition","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit account-local entry-time bucket and observed direction narrow the eligible realized population."},
{"caseId":"C4-E2-17","caseType":"multi_part","input":"Show July gross profit factor and expectancy with their coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_factor","expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total","mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","one currency partition","per-metric denominator checks"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The profit-factor denominator and expectancy count remain independent."},
{"caseId":"C4-E2-18","caseType":"ambiguous","input":"Is my PF good in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","no quality judgment"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want your historical profit factor for July on gross P/L or fee-covered net P/L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Good is not inferred; request can be narrowed to the defined historical ratio."},
{"caseId":"C4-E2-19","caseType":"negative_example","input":"Does a profit factor above one mean I should trade this setup tomorrow?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no prediction or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A historical profit factor cannot prescribe or predict a future trade.","notes":"Rejects advice and prediction without evaluating the setup."},
{"caseId":"C4-E2-20","caseType":"unsupported_data","input":"Show July gross profit factor when there were no eligible losing trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","July","no eligible losing trades"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Profit factor is unavailable when the eligible loss denominator is zero; do not return infinity.","notes":"Return the explicit no-loss-denominator limitation."},
{"caseId":"C4-E2-21","caseType":"selected_entity_context","input":"Show gross profit factor for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_factor"],"expectedFilters":["ready_closed","gross P/L","selected review period"],"expectedGroupings":[],"expectedOperators":["positive P/L total divided by absolute negative P/L total"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope","one currency partition","eligible loss denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected scope is used only when trusted and authorized."},
{"caseId":"C4-E2-22","caseType":"cross_category","input":"Explain the difference between my July gross profit factor and expectancy.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_factor","expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["definition comparison"],"expectedComparison":{"left":"profit_factor","right":"expectancy","basis":"July gross realized population"},"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","one currency partition","no causation claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Future explanation distinguishes a ratio of totals from average money per trade."}
]
```

## 7.4 `payoff_ratio` Cases

```json
[
{"caseId":"C4-E3-01","caseType":"canonical","input":"Show my payoff ratio for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio is Planned and has no approved formula, basis, numerator, denominator, or result unit.","notes":"Recognition only; no numeric result or alias fallback."},
{"caseId":"C4-E3-02","caseType":"formal_paraphrase","input":"Calculate the payoff ratio for eligible closed round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved payoff-ratio calculation exists, including for eligible closed round trips.","notes":"Population language cannot supply a missing formula."},
{"caseId":"C4-E3-03","caseType":"conversational_paraphrase","input":"What's my payoff on these trades?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no implicit selected period"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The recognized payoff-ratio concept is Planned and cannot produce a numeric result.","notes":"Do not invent a date, selected entity, or formula."},
{"caseId":"C4-E3-04","caseType":"trader_slang","input":"What's the payoff here?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no implicit selected trade"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio remains Planned with no approved calculation.","notes":"Recognition does not infer a selected trade or reward/risk formula."},
{"caseId":"C4-E3-05","caseType":"abbreviation","input":"PR payoff ratio for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit payoff-ratio grammar"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio is Planned and has no approved formula.","notes":"PR alone is ticker-like and must not auto-route; explicit wording enables recognition only."},
{"caseId":"C4-E3-06","caseType":"misspelling","input":"Calculate my payoff ration for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear metric context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio is Planned and cannot calculate a value.","notes":"Clear misspelling may be recognized without creating an alias."},
{"caseId":"C4-E3-07","caseType":"noisy_input","input":"payoff ratio july pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":[],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio has no approved formula or executable query capability.","notes":"No formula, basis, or account scope is inferred."},
{"caseId":"C4-E3-08","caseType":"command","input":"Calculate payoff ratio for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["June"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio is Planned and no deterministic calculation is approved.","notes":"Read-only recognition response only."},
{"caseId":"C4-E3-09","caseType":"fragment","input":"Payoff ratio by ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":[],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved payoff-ratio formula exists to group by ticker.","notes":"Do not create a grouping calculation for an undefined metric."},
{"caseId":"C4-E3-10","caseType":"follow_up","input":"Is that the same as average win to average loss?","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio","average_win_to_average_loss_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"payoff_ratio","right":"average_win_to_average_loss_ratio","basis":"definition status"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior payoff-ratio reference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that payoff ratio has no approved formula and is not an alias, without offering a numeric payoff result."},
{"caseId":"C4-E3-11","caseType":"correction","input":"I meant payoff ratio, not average win-to-average-loss ratio.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["prior query"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The corrected payoff-ratio request remains Planned and cannot be aliased to average win-to-average-loss ratio.","notes":"Correction preserves the distinct recognized concept."},
{"caseId":"C4-E3-12","caseType":"comparison","input":"Compare payoff ratio between July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["July","June"],"expectedGroupings":[],"expectedOperators":["period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"payoff ratio"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio has no approved formula to calculate or compare.","notes":"Do not substitute a supported ratio."},
{"caseId":"C4-E3-13","caseType":"ranking","input":"Rank my tickers by payoff ratio.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["descending"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio is undefined and cannot be grouped or ranked.","notes":"No proxy or fallback ranking is permitted."},
{"caseId":"C4-E3-14","caseType":"negation","input":"Do not substitute average win/loss for payoff ratio.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["do not alias"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":[],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio remains a distinct Planned concept with no approved numeric calculation.","notes":"The negation expressly blocks an alias fallback."},
{"caseId":"C4-E3-15","caseType":"exclusion","input":"Show payoff ratio excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["trusted selected ticker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Filtering cannot make the undefined payoff-ratio formula executable.","notes":"Trusted context is retained but does not supply a calculation."},
{"caseId":"C4-E3-16","caseType":"multi_filter","input":"Show payoff ratio for long July trades entered from 09:30 through 09:59 in the account's local time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["July","long","entry time 09:30 through 09:59 account-local"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit local entry-time bucket","account IANA timezone","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No filter set can supply the missing payoff-ratio formula or basis.","notes":"The explicit filters are recognized but cannot make the Planned metric executable."},
{"caseId":"C4-E3-17","caseType":"multi_part","input":"Show payoff ratio and average win-to-average-loss ratio for July.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["payoff_ratio","average_win_to_average_loss_ratio"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","per-metric capability status"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio remains unavailable even when a separately named alternative is requested.","notes":"Return the Planned limitation for payoff ratio; do not calculate it as the alternative."},
{"caseId":"C4-E3-18","caseType":"ambiguous","input":"What's my reward to risk?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":[],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the distinct planned payoff-ratio concept, average win-to-average-loss ratio, or a planned-risk R-multiple?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarification names alternatives only because the wording makes them plausible; no formula is inferred."},
{"caseId":"C4-E3-19","caseType":"negative_example","input":"Use my planned stop and target to calculate payoff ratio.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no planned-risk alias"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Planned stop and target data describe a different planned-risk R-multiple concept, not payoff ratio.","notes":"Rejects a formula substitution and provides no trade advice."},
{"caseId":"C4-E3-20","caseType":"unsupported_data","input":"Calculate payoff ratio from my open positions and incomplete fee data.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["legitimate_open","incomplete fee coverage"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no inferred open-trade policy","no inferred fee policy"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Payoff ratio has no approved formula, open-trade treatment, or fee policy.","notes":"Missing data is not repaired and open positions are not inferred into a future formula."},
{"caseId":"C4-E3-21","caseType":"selected_entity_context","input":"Show payoff ratio for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio"],"expectedFilters":["selected review period"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Selected context cannot supply the undefined payoff-ratio formula.","notes":"A trusted selection affects no unapproved metric calculation."},
{"caseId":"C4-E3-22","caseType":"cross_category","input":"Explain the difference between payoff ratio and profit factor.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["payoff_ratio","profit_factor"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"payoff_ratio","right":"profit_factor","basis":"definition and capability status"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no formula inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that payoff ratio has no approved formula while profit factor is a distinct supported ratio of realized P/L totals; do not conflate them."}
]
```

---

## `average_win_to_average_loss_ratio` Cases

```json
[
  {"caseId":"C4-E4-01","caseType":"canonical","input":"Show my gross average_win_to_average_loss_ratio for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-02","caseType":"formal_paraphrase","input":"Calculate average positive selected-basis P/L divided by absolute average negative selected-basis P/L for eligible gross round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-03","caseType":"conversational_paraphrase","input":"How do my gross wins compare with my losses in June?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","June"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-04","caseType":"trader_slang","input":"What's my gross average win to average loss ratio for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-05","caseType":"abbreviation","input":"Show my AWL (average win to average loss ratio) ratio, gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross","explicit abbreviation expansion"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-06","caseType":"misspelling","input":"Calculate my avrage win to average loss ratio ratio, gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross","misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-07","caseType":"noisy_input","input":"average win to average loss ratio gross July please","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-08","caseType":"command","input":"Calculate my net average_win_to_average_loss_ratio for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","net P/L","fee-complete net","June"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","net"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding","fee-complete net coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-09","caseType":"fragment","input":"Gross average win to average loss ratio, this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","this month"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-10","caseType":"follow_up","input":"Use that same ratio for the prior range, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","prior range"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-11","caseType":"correction","input":"I meant average win to average loss ratio, not median win to median loss ratio, gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross","metric correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-12","caseType":"comparison","input":"Compare my gross average win to average loss ratio for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July","June"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross average_win_to_average_loss_ratio"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-13","caseType":"ranking","input":"Rank my tickers by gross average win to average loss ratio in July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":["ticker"],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross","descending"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding","deterministic ties"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-14","caseType":"negation","input":"Show my gross average win to average loss ratio without open trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross","exclude open rows"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-15","caseType":"exclusion","input":"Show my gross average win to average loss ratio excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["trusted selected ticker","server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-16","caseType":"multi_filter","input":"Show my net average win to average loss ratio for long July trades entered from 09:30 through 09:59 in the account's local time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","net P/L","fee-complete net","July","long","entry time 09:30 through 09:59 account-local"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding","fee-complete net coverage","explicit account-local entry-time bucket"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-17","caseType":"multi_part","input":"Show my average win to average loss ratio and median win to median loss ratio for July, gross, with populations.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio","median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each named ratio stays distinct and reports both populations."},
  {"caseId":"C4-E4-18","caseType":"ambiguous","input":"What's my win/loss ratio for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["average versus median required","P/L basis required"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the average win-to-average-loss ratio or the median ratio?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not select a ratio, basis, or formula."},
  {"caseId":"C4-E4-19","caseType":"negative_example","input":"Use my planned stop and target to calculate average_win_to_average_loss_ratio.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no planned-risk alias"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Planned stop and target data describe R-multiple, not a realized win-to-loss ratio.","notes":"No advice or formula substitution."},
  {"caseId":"C4-E4-20","caseType":"unsupported_data","input":"Calculate my gross average_win_to_average_loss_ratio despite a missing winning or losing population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","missing winning or losing population","zero/missing absolute-loss denominator"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","both positive and negative selected-basis populations required","nonzero absolute-loss denominator required","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"average_win_to_average_loss_ratio is unavailable without both required winning and losing populations or with a zero/missing absolute-loss denominator.","notes":"Return the explicit unavailable state; do not substitute zero, infinity, or another metric."},
  {"caseId":"C4-E4-21","caseType":"selected_entity_context","input":"For the selected review period, show my gross average_win_to_average_loss_ratio.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","selected review period"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E4-22","caseType":"cross_category","input":"Explain the documented difference between average win to average loss ratio and median win to median loss ratio for July.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_win_to_average_loss_ratio","median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["average positive selected-basis P/L divided by absolute average negative selected-basis P/L","gross","concept distinction"],"expectedComparison":{"left":"average_win_to_average_loss_ratio","right":"median_win_to_median_loss_ratio","basis":"documented calculation difference"},"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding","no causation or advice"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain calculation differences only."}
]
```

## `median_win_to_median_loss_ratio` Cases

```json
[
  {"caseId":"C4-E5-01","caseType":"canonical","input":"Show my gross median_win_to_median_loss_ratio for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-02","caseType":"formal_paraphrase","input":"Calculate exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values for eligible gross round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-03","caseType":"conversational_paraphrase","input":"What is the middle gross win size compared with the middle loss size in June?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","June"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-04","caseType":"trader_slang","input":"What's my gross median win to median loss ratio for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-05","caseType":"abbreviation","input":"Show my MWL (median win to median loss ratio) ratio, gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross","explicit abbreviation expansion"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-06","caseType":"misspelling","input":"Calculate my medain win to median loss ratio ratio, gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross","misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-07","caseType":"noisy_input","input":"median win to median loss ratio gross July please","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-08","caseType":"command","input":"Calculate my net median_win_to_median_loss_ratio for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","net P/L","fee-complete net","June"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","net"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding","fee-complete net coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-09","caseType":"fragment","input":"Gross median win to median loss ratio, this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","this month"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-10","caseType":"follow_up","input":"Use that same median ratio for the prior range, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","prior range"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-11","caseType":"correction","input":"I meant median win to median loss ratio, not average win to average loss ratio, gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross","metric correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-12","caseType":"comparison","input":"Compare my gross median win to median loss ratio for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July","June"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross median_win_to_median_loss_ratio"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-13","caseType":"ranking","input":"Rank my tickers by gross median win to median loss ratio in July.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":["ticker"],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross","descending"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding","deterministic ties"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-14","caseType":"negation","input":"Show my gross median win to median loss ratio without open trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross","exclude open rows"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-15","caseType":"exclusion","input":"Show my gross median win to median loss ratio excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["trusted selected ticker","server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-16","caseType":"multi_filter","input":"Show my net median win to median loss ratio for long July trades entered from 09:30 through 09:59 in the account's local time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","net P/L","fee-complete net","July","long","entry time 09:30 through 09:59 account-local"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding","fee-complete net coverage","explicit account-local entry-time bucket"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-17","caseType":"multi_part","input":"Show my median win to median loss ratio and average win to average loss ratio for July, gross, with populations.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio","average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each named ratio stays distinct and reports both populations."},
  {"caseId":"C4-E5-18","caseType":"ambiguous","input":"What's my typical win/loss ratio for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["average versus median required","P/L basis required"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the average win-to-average-loss ratio or the median ratio?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not select a ratio, basis, or formula."},
  {"caseId":"C4-E5-19","caseType":"negative_example","input":"Use my planned stop and target to calculate median_win_to_median_loss_ratio.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no planned-risk alias"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Planned stop and target data describe R-multiple, not a realized win-to-loss ratio.","notes":"No advice or formula substitution."},
  {"caseId":"C4-E5-20","caseType":"unsupported_data","input":"Calculate my gross median_win_to_median_loss_ratio despite a missing winning or losing population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","missing winning or losing population","zero/missing absolute-loss denominator"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","both positive and negative selected-basis populations required","nonzero absolute-loss denominator required","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"median_win_to_median_loss_ratio is unavailable without both required winning and losing populations or with a zero/missing absolute-loss denominator.","notes":"Return the explicit unavailable state; do not substitute zero, infinity, or another metric."},
  {"caseId":"C4-E5-21","caseType":"selected_entity_context","input":"For the selected review period, show my gross median_win_to_median_loss_ratio.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","selected review period"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return eligible, winning, losing, and coverage counts."},
  {"caseId":"C4-E5-22","caseType":"cross_category","input":"Explain the documented difference between median win to median loss ratio and average win to average loss ratio for July.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_win_to_median_loss_ratio","average_win_to_average_loss_ratio"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact median positive selected-basis P/L divided by absolute exact median negative selected-basis P/L; even median averages two middle values","gross","concept distinction"],"expectedComparison":{"left":"median_win_to_median_loss_ratio","right":"average_win_to_average_loss_ratio","basis":"documented calculation difference"},"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible currency/account/timezone partition","ready_closed winning and losing populations","exact source precision and result-boundary rounding","no causation or advice"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain calculation differences only."}
]
```

## `consistency` Cases

```json
[
  {"caseId":"C4-E6-01","caseType":"canonical","input":"Calculate my trading consistency for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-02","caseType":"formal_paraphrase","input":"Determine my consistency across July results.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-03","caseType":"conversational_paraphrase","input":"How consistent have I been lately?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-04","caseType":"trader_slang","input":"Am I steady this month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["this month"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-05","caseType":"abbreviation","input":"Show my CONS (consistency metric) for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["explicit consistency metric grammar"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-06","caseType":"misspelling","input":"Calculate my consistancy for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear consistency metric context","no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-07","caseType":"noisy_input","input":"consistency july please","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-08","caseType":"command","input":"Show consistency for the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected account set","expectedContextRequirements":["trusted selected account set","no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-09","caseType":"fragment","input":"Consistency by month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["group by month"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-10","caseType":"follow_up","input":"Is that consistency based on my win rate?","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency","win_rate"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior consistency reference","no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"State that consistency is Planned; win rate is a distinct supported alternative."},
  {"caseId":"C4-E6-11","caseType":"correction","input":"I mean consistency, not P/L standard deviation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["prior query","no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-12","caseType":"comparison","input":"Compare consistency between July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["July","June"],"expectedGroupings":[],"expectedOperators":["period comparison"],"expectedComparison":null,"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-13","caseType":"ranking","input":"Rank my tickers by consistency.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["consistency"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["descending"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-14","caseType":"negation","input":"Do not treat a winning streak as consistency.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["do not substitute streak"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-15","caseType":"exclusion","input":"Show consistency excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["trusted selected ticker","no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-16","caseType":"multi_filter","input":"Show consistency for long July trades entered from 09:30 through 09:59 in the account's local time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["July","long","entry time 09:30 through 09:59 account-local"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit account-local entry-time bucket","no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-17","caseType":"multi_part","input":"Show consistency and my July win rate.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["consistency","win_rate"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["per-metric capability status","no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Return the supported July win rate separately; consistency remains Planned and unsupported."},
  {"caseId":"C4-E6-18","caseType":"ambiguous","input":"Am I consistent, or do you mean my July win rate?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["supported alternative is explicit","no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want the supported July win rate instead of the Planned consistency concept?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarify only because a supported alternative is explicitly plausible; do not ask for a consistency definition."},
  {"caseId":"C4-E6-19","caseType":"negative_example","input":"Does consistency prove I have an edge?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no causation or skill claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency has no approved formula and cannot prove edge, skill, or causation.","notes":"Do not infer an edge claim."},
  {"caseId":"C4-E6-20","caseType":"unsupported_data","input":"Calculate consistency from open positions and incomplete fee data.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["legitimate_open","incomplete fee coverage"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved consistency formula exists, and open or incomplete-fee data cannot supply one.","notes":"Do not infer an open-trade or fee policy."},
  {"caseId":"C4-E6-21","caseType":"selected_entity_context","input":"Show consistency for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency"],"expectedFilters":["selected review period"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","no approved formula, grain, threshold, default, or public metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Consistency remains Planned because no formula, grain, threshold, or default is approved.","notes":"Do not ask the trader to author a definition or create a numeric result."},
  {"caseId":"C4-E6-22","caseType":"cross_category","input":"Explain the difference between consistency and win rate.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency","win_rate"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that consistency is Planned while win rate is distinct; do not calculate consistency."}
]
```


## 7.8 `return_dispersion` Cases

```json
[
{"caseId":"C4-E7-01","caseType":"canonical","input":"Show my return dispersion for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved return denominator or distribution contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion remains Planned because no return denominator, return formula, or distribution formula is approved.","notes":"Recognition only; do not ask the trader to create a product contract."},
{"caseId":"C4-E7-02","caseType":"formal_paraphrase","input":"Calculate the dispersion of approved per-trade returns for eligible closed trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved return denominator or aggregate dispersion formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved per-trade return or aggregate-dispersion contract exists.","notes":"Do not infer return from P/L, account value, or equity."},
{"caseId":"C4-E7-03","caseType":"conversational_paraphrase","input":"How spread out were my returns last month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["last month"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["no approved return denominator or distribution contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion is Planned and no calculation is approved.","notes":"No account-return or P/L substitute."},
{"caseId":"C4-E7-04","caseType":"trader_slang","input":"How wild were my returns in June?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["June"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["clear return metric context","no approved return formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion remains Planned because no return definition is approved.","notes":"Historical wording is not a volatility or skill claim."},
{"caseId":"C4-E7-05","caseType":"abbreviation","input":"RD return dispersion for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["explicit return-dispersion grammar"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear metric grammar","no approved return formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion is Planned and cannot calculate a value.","notes":"Bare RD must not auto-route."},
{"caseId":"C4-E7-06","caseType":"misspelling","input":"Calculate my return dispertion for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear metric context","no approved return formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion remains Planned because its return and distribution formulas are unapproved.","notes":"Normalize only the clear metric misspelling."},
{"caseId":"C4-E7-07","caseType":"noisy_input","input":"return spread july pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear return metric context","no approved return denominator"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion is Planned and no calculation is available.","notes":"Noise does not create a return convention."},
{"caseId":"C4-E7-08","caseType":"command","input":"Show return dispersion for the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected account set","expectedContextRequirements":["trusted selected account set","no approved return or distribution formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Selected scope cannot supply the missing return-dispersion contract.","notes":"Do not ask the trader to define a denominator."},
{"caseId":"C4-E7-09","caseType":"fragment","input":"Return dispersion by ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["group by ticker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved return or grouping formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved return-dispersion formula exists to group by ticker.","notes":"Do not create a grouped proxy."},
{"caseId":"C4-E7-10","caseType":"follow_up","input":"Is that P/L standard deviation?","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion","standard_deviation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"return_dispersion","right":"standard_deviation","basis":"return versus P/L"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior return-dispersion reference","no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that supported P/L standard deviation is distinct from Planned return dispersion."},
{"caseId":"C4-E7-11","caseType":"correction","input":"I mean return dispersion, not P/L standard deviation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["prior query","no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The corrected return-dispersion request remains Planned because no return contract is approved.","notes":"Do not calculate P/L standard deviation as a silent substitute."},
{"caseId":"C4-E7-12","caseType":"comparison","input":"Compare return dispersion between July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["July","June"],"expectedGroupings":[],"expectedOperators":["period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"return dispersion"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved return or comparison formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion has no approved formula to calculate or compare.","notes":"Do not compare P/L dispersion instead."},
{"caseId":"C4-E7-13","caseType":"ranking","input":"Rank my tickers by return dispersion.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["descending"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved return, grouping, or ranking formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion is Planned and cannot be grouped or ranked.","notes":"No proxy ranking is permitted."},
{"caseId":"C4-E7-14","caseType":"negation","input":"Do not use account return for return dispersion.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["do not substitute account return"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no invented denominator"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved per-trade return definition exists for return dispersion.","notes":"The negation blocks a non-equivalent substitute."},
{"caseId":"C4-E7-15","caseType":"exclusion","input":"Show return dispersion excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["trusted selected ticker","no approved return formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Filtering cannot make the unapproved return-dispersion formula executable.","notes":"Trusted context does not supply a calculation."},
{"caseId":"C4-E7-16","caseType":"multi_filter","input":"Show return dispersion for long July trades in the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["July","long","selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":"selected account set","expectedContextRequirements":["trusted selected account set","no approved return denominator or distribution formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No filter set can supply the missing return-dispersion contract.","notes":"No account, currency, timezone, or filter is invented."},
{"caseId":"C4-E7-17","caseType":"multi_part","input":"Show return dispersion and P/L standard deviation for July.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["return_dispersion","standard_deviation"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["per-metric capability status","no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion remains Planned even when supported P/L standard deviation is requested separately.","notes":"Return the supported P/L result separately only if its requirements are met."},
{"caseId":"C4-E7-18","caseType":"ambiguous","input":"How volatile are my results in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["P/L versus return ambiguity"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean supported selected-basis P/L standard deviation or planned return dispersion?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarify only because a supported P/L alternative is plausibly meant; do not ask for a denominator."},
{"caseId":"C4-E7-19","caseType":"negative_example","input":"Does return dispersion prove I have an edge?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no causation, skill, or edge claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Return dispersion has no approved formula and cannot prove edge, skill, causation, or certainty.","notes":"Do not infer an edge claim."},
{"caseId":"C4-E7-20","caseType":"unsupported_data","input":"Calculate return dispersion from open positions and account equity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["legitimate_open","account equity"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no inferred open-trade or equity-return policy"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Open positions and account equity cannot supply an approved return-dispersion definition.","notes":"Do not infer marks, an equity curve, or a return denominator."},
{"caseId":"C4-E7-21","caseType":"selected_entity_context","input":"Show return dispersion for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion"],"expectedFilters":["selected review period"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","no approved return formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Selected context cannot supply the unapproved return-dispersion contract.","notes":"Do not ask the trader to author a formula."},
{"caseId":"C4-E7-22","caseType":"cross_category","input":"Explain the difference between return dispersion and P/L standard deviation.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["return_dispersion","standard_deviation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"return_dispersion","right":"standard_deviation","basis":"return versus selected-basis P/L"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no formula substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain the Planned return boundary and supported P/L alternative without calculating return dispersion."}
]
```

## 7.9 `standard_deviation` Cases

```json
[
{"caseId":"C4-E8-01","caseType":"canonical","input":"Show my gross P/L standard deviation for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["one compatible account/currency/timezone partition","eligible ready_closed population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return money, eligible count, coverage, exact variance, and the explicitly labeled rounded square root; zero is valid."},
{"caseId":"C4-E8-02","caseType":"formal_paraphrase","input":"Calculate population standard deviation of gross realized P/L for eligible closed round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["one compatible account/currency/timezone partition","eligible ready_closed population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is population P/L dispersion, not return dispersion."},
{"caseId":"C4-E8-03","caseType":"conversational_paraphrase","input":"How spread out was my trade P/L last month before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","last month"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root"],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["one compatible account/currency/timezone partition","eligible ready_closed population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Before fees explicitly chooses gross P/L."},
{"caseId":"C4-E8-04","caseType":"trader_slang","input":"How wild was my P/L per trade in June?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","P/L","June"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["selected P/L basis","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want gross or net P/L standard deviation?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"P/L is clear and June is explicit; clarify only the gross or net basis."},
{"caseId":"C4-E8-05","caseType":"abbreviation","input":"P/L SD for July gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root","explicit P/L standard-deviation grammar"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["one compatible account/currency/timezone partition","eligible ready_closed population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare SD must not auto-route."},
{"caseId":"C4-E8-06","caseType":"misspelling","input":"Show my standrad deviation of gross P/L for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root","misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear P/L metric context","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize only the clear metric misspelling."},
{"caseId":"C4-E8-07","caseType":"noisy_input","input":"std dev july","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["P/L versus return ambiguity"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean selected-basis P/L standard deviation or planned return dispersion?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not choose P/L or return from bare standard-deviation wording."},
{"caseId":"C4-E8-08","caseType":"command","input":"Show net P/L standard deviation for the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","net P/L","selected account set"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected account set","expectedContextRequirements":["trusted selected account set","fee-complete net coverage","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Net P/L is fee-conditional; preserve complete, partial, or unavailable coverage."},
{"caseId":"C4-E8-09","caseType":"fragment","input":"P/L standard deviation by direction.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","P/L"],"expectedGroupings":["direction"],"expectedOperators":["exact population variance","deterministically labeled rounded square root","group by direction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["selected P/L basis","explicit time range","compatible partition per result"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want gross or net P/L standard deviation?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Basis and period are both absent; ask for basis first, then the period, without inventing either."},
{"caseId":"C4-E8-10","caseType":"follow_up","input":"Is that return volatility instead?","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation","return_dispersion"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"standard_deviation","right":"return_dispersion","basis":"P/L versus return"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior P/L standard-deviation reference"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that this is supported P/L dispersion, not a return-volatility result."},
{"caseId":"C4-E8-11","caseType":"correction","input":"I meant gross P/L standard deviation, not net, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes only the trusted P/L basis."},
{"caseId":"C4-E8-12","caseType":"comparison","input":"Compare gross P/L standard deviation between July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","July","June"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross P/L standard deviation"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same compatible account/currency/timezone partition","eligible populations per period"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return each period's eligible count and coverage; no statistical certainty claim."},
{"caseId":"C4-E8-13","caseType":"ranking","input":"Rank compatible ticker groups by July gross P/L standard deviation.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":["ticker"],"expectedOperators":["exact population variance","deterministically labeled rounded square root","descending","deterministic ties"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["compatible partition per group","eligible count and coverage per group"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not compare incompatible currencies, accounts, or timezones."},
{"caseId":"C4-E8-14","caseType":"negation","input":"Do not include open trades in P/L standard deviation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","P/L","exclude legitimate_open","exclude needs_decision"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["selected P/L basis","explicit time range","one compatible account/currency/timezone partition","eligible ready_closed population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want gross or net P/L standard deviation?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Basis and period are both absent; ask for basis first, then the period, without inventing either. Eligible ready_closed rows remain the population."},
{"caseId":"C4-E8-15","caseType":"exclusion","input":"Show gross P/L standard deviation excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["trusted selected ticker","explicit time range","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"What time period should I use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Gross P/L and the selected ticker are clear; clarify only the missing period."},
{"caseId":"C4-E8-16","caseType":"multi_filter","input":"Show gross P/L standard deviation for long July trades in the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","July","long","selected account set"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":"selected account set","expectedContextRequirements":["trusted selected account set","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not invent dates, accounts, filters, or partitions."},
{"caseId":"C4-E8-17","caseType":"multi_part","input":"Show gross P/L standard deviation and expectancy for July with coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["standard_deviation","expectancy"],"expectedFilters":["ready_closed","gross P/L","July"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root","mean selected-basis P/L"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["one compatible account/currency/timezone partition","eligible ready_closed population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return the metrics separately; neither establishes certainty or edge."},
{"caseId":"C4-E8-18","caseType":"ambiguous","input":"What's my volatility?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["P/L versus return ambiguity"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean selected-basis P/L standard deviation or planned return dispersion?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not infer equity volatility, a return measure, or a P/L basis."},
{"caseId":"C4-E8-19","caseType":"negative_example","input":"Does low P/L standard deviation prove I will be profitable?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no certainty, prediction, or advice claim"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Historical P/L standard deviation cannot prove future profitability, edge, causation, or certainty.","notes":"Do not infer a trading recommendation."},
{"caseId":"C4-E8-20","caseType":"unsupported_data","input":"Calculate net P/L standard deviation with incomplete fee data.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","net P/L","incomplete fee coverage"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net coverage","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Net P/L standard deviation is unavailable without fee-complete coverage.","notes":"Do not silently use gross P/L or partial fees."},
{"caseId":"C4-E8-21","caseType":"selected_entity_context","input":"Show gross P/L standard deviation for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation"],"expectedFilters":["ready_closed","gross P/L","selected review period"],"expectedGroupings":[],"expectedOperators":["exact population variance","deterministically labeled rounded square root"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return an empty-population state when no eligible rows exist; do not fabricate a value."},
{"caseId":"C4-E8-22","caseType":"cross_category","input":"Explain the difference between P/L standard deviation and return dispersion.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["standard_deviation","return_dispersion"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"standard_deviation","right":"return_dispersion","basis":"selected-basis P/L versus return"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no formula substitution"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain supported P/L population dispersion and the Planned return boundary."}
]
```


## 7.10 `percentage_of_total_profit_from_top_trades` Cases

```json
[
{"caseId":"C4-E9-01","caseType":"canonical","input":"Show the percentage of total profit from my top trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural top-set N, percentage, tie, or positive-P/L denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Plural top-trades concentration remains Planned because no top-set selection, tie, or denominator rule is approved.","notes":"Do not ask the trader to create a product contract or silently substitute one largest winner."},
{"caseId":"C4-E9-02","caseType":"formal_paraphrase","input":"Calculate the share of total positive gross P/L attributable to my top trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["gross P/L","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural top-set selection or deterministic ties"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved multi-trade selection or tie rule exists for top-trades concentration.","notes":"Positive P/L wording does not choose an unapproved set."},
{"caseId":"C4-E9-03","caseType":"conversational_paraphrase","input":"How much of my profit came from my best trades last month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["last month"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural top-set or denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Plural top-trades concentration remains Planned because no top-set selection, tie, or denominator rule is approved.","notes":"Do not ask the trader to create a product contract or silently substitute one largest winner."},
{"caseId":"C4-E9-04","caseType":"trader_slang","input":"Are my top winners carrying the profits in June?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["June"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["clear plural top-trades context","no approved top-set rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Plural top-trades concentration remains Planned because no set-selection rule is approved.","notes":"Do not infer dependence, causation, or advice."},
{"caseId":"C4-E9-05","caseType":"abbreviation","input":"TTS top-trades share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["explicit top-trades-share grammar"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear metric grammar","no approved top-set rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Top-trades concentration is Planned and cannot calculate a value.","notes":"Bare top P/L or TP must not auto-route."},
{"caseId":"C4-E9-06","caseType":"misspelling","input":"Show my top trade profitt percentage for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["clear plural top-trades context","no approved top-set rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved plural top-trades formula exists.","notes":"Normalize only the clear metric misspelling."},
{"caseId":"C4-E9-07","caseType":"noisy_input","input":"top trades profit percent july","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural top-set N, percentage, tie, or positive-P/L denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Top-trades concentration is Planned and needs an approved top-set contract.","notes":"Noise does not create an N, percentage, or tie rule."},
{"caseId":"C4-E9-08","caseType":"command","input":"Show top-trades profit percentage for the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected account set","expectedContextRequirements":["trusted selected account set","no approved top-set or positive-P/L denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Selected scope cannot supply the missing plural top-trades contract.","notes":"Do not ask the trader to create a product contract or silently substitute one largest winner."},
{"caseId":"C4-E9-09","caseType":"fragment","input":"Top-trade profit share by ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["group by ticker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved top-set, grouping, or tie rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No plural top-trades formula exists to group by ticker.","notes":"Do not create a grouped concentration proxy."},
{"caseId":"C4-E9-10","caseType":"follow_up","input":"Do you mean only my single largest winner?","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades","largest_winner_contribution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"percentage_of_total_profit_from_top_trades","right":"largest_winner_contribution","basis":"plural top set versus one winner"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior top-trades reference","no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that current single-largest-winner contribution is a distinct supported alternative."},
{"caseId":"C4-E9-11","caseType":"correction","input":"I mean top trades, not the largest winner contribution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["prior query","no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The corrected plural top-trades request remains Planned because no set-selection rule is approved.","notes":"Do not calculate the single-largest-winner alternative."},
{"caseId":"C4-E9-12","caseType":"comparison","input":"Compare top-trades profit share between July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["July","June"],"expectedGroupings":[],"expectedOperators":["period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"top-trades profit share"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved top-set or comparison rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Top-trades concentration has no approved formula to calculate or compare.","notes":"Do not ask the trader to create a product contract or silently substitute one largest winner."},
{"caseId":"C4-E9-13","caseType":"ranking","input":"Rank my tickers by top-trades profit share.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["descending"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved top-set, grouping, or tie rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Plural top-trades concentration is Planned and cannot be grouped or ranked.","notes":"No proxy ranking is permitted."},
{"caseId":"C4-E9-14","caseType":"negation","input":"Do not treat my single best trade as all top trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["do not substitute largest winner"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved plural top-set selection exists for this metric.","notes":"The negation expressly blocks the one-winner alternative."},
{"caseId":"C4-E9-15","caseType":"exclusion","input":"Show top-trades profit share excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["trusted selected ticker","no approved top-set rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Filtering cannot make the unapproved top-trades formula executable.","notes":"Do not ask the trader to create a product contract or silently substitute one largest winner."},
{"caseId":"C4-E9-16","caseType":"multi_filter","input":"Show top-trades profit share for long July trades in the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["July","long","selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":"selected account set","expectedContextRequirements":["trusted selected account set","no approved top-set, tie, or denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No filter set can supply the missing plural top-trades contract.","notes":"No account, date, filter, or grouping is invented."},
{"caseId":"C4-E9-17","caseType":"multi_part","input":"Show top-trades profit share and largest-winner contribution for July.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades","largest_winner_contribution"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["per-metric capability status","no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Plural top-trades concentration remains Planned even when the single-largest-winner alternative is requested separately.","notes":"Return the supported alternative separately only if its own requirements are met."},
{"caseId":"C4-E9-18","caseType":"ambiguous","input":"Did a few trades make all my money?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["plural concentration versus single-largest-winner alternative"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the current single-largest-winner contribution instead of planned plural top-trades concentration?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Offer the distinct supported alternative only because it is plausibly meant; do not ask for N or a percentage."},
{"caseId":"C4-E9-19","caseType":"negative_example","input":"Prove my strategy depends on outliers from top-trade share.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no dependency, causation, or edge claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Top-trades concentration is Planned and cannot prove outlier dependency, causation, edge, or certainty.","notes":"Do not infer a dependency label."},
{"caseId":"C4-E9-20","caseType":"unsupported_data","input":"Calculate top-trades profit share from open positions with incomplete fee data.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["legitimate_open","incomplete fee coverage"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no inferred open-trade, fee, or top-set policy"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No plural top-trades formula is approved, and open or incomplete-fee data cannot supply one.","notes":"Do not infer a realized denominator or a net basis."},
{"caseId":"C4-E9-21","caseType":"selected_entity_context","input":"Show top-trades profit share for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades"],"expectedFilters":["selected review period"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","no approved top-set or denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Selected context cannot supply the unapproved plural top-trades contract.","notes":"Do not ask the trader to create a product contract or silently substitute one largest winner."},
{"caseId":"C4-E9-22","caseType":"cross_category","input":"Explain the difference between top-trades profit share and largest-winner contribution.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_profit_from_top_trades","largest_winner_contribution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"percentage_of_total_profit_from_top_trades","right":"largest_winner_contribution","basis":"plural top set versus one winner"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that plural top-trades concentration is Planned while the one-largest contribution is a distinct supported alternative."}
]
```

+## 7.11 `percentage_of_total_loss_from_worst_trades` Cases

```json
[
{"caseId":"C4-E10-01","caseType":"canonical","input":"Show my worst-trades loss share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Do not silently substitute one largest loser."},
{"caseId":"C4-E10-02","caseType":"formal_paraphrase","input":"Calculate the share of total absolute loss attributable to my worst trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Do not silently substitute one largest loser."},
{"caseId":"C4-E10-03","caseType":"conversational_paraphrase","input":"How much of my loss came from my worst trades last month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["last month"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Do not silently substitute one largest loser."},
{"caseId":"C4-E10-04","caseType":"trader_slang","input":"Are a few losers causing all the damage in June?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["June"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Do not silently substitute one largest loser."},
{"caseId":"C4-E10-05","caseType":"abbreviation","input":"WTS worst-trades loss share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["explicit metric grammar"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Bare shorthand must not auto-route."},
{"caseId":"C4-E10-06","caseType":"misspelling","input":"Show my worst trade loos percentage for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Normalize only the clear metric misspelling."},
{"caseId":"C4-E10-07","caseType":"noisy_input","input":"worst trades loss percent july","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Noise does not create a product contract."},
{"caseId":"C4-E10-08","caseType":"command","input":"Show worst-trades loss share for the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected account set","expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Trusted scope cannot supply the missing product contract."},
{"caseId":"C4-E10-09","caseType":"fragment","input":"Worst-trade loss share by ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["group by ticker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Do not create a grouped proxy."},
{"caseId":"C4-E10-10","caseType":"follow_up","input":"Do you mean only my single largest loser?","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades","largest_loser_contribution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"percentage_of_total_loss_from_worst_trades","right":"largest_loser_contribution","basis":"plural worst set versus one loser"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior reference","no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that the current single-largest-loser contribution is a distinct supported alternative."},
{"caseId":"C4-E10-11","caseType":"correction","input":"I mean worst trades, not the largest-loser contribution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Do not calculate a supported alternative as a silent substitute."},
{"caseId":"C4-E10-12","caseType":"comparison","input":"Compare worst-trades loss share between July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["July","June"],"expectedGroupings":[],"expectedOperators":["period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"worst-trades loss share"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"No proxy comparison is permitted."},
{"caseId":"C4-E10-13","caseType":"ranking","input":"Rank my tickers by worst-trades loss share.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["descending"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"No proxy ranking is permitted."},
{"caseId":"C4-E10-14","caseType":"negation","input":"Do not treat my single worst trade as all worst trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["do not substitute"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Do not silently substitute one largest loser."},
{"caseId":"C4-E10-15","caseType":"exclusion","input":"Show worst-trades loss share excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Filtering cannot make the planned calculation executable."},
{"caseId":"C4-E10-16","caseType":"multi_filter","input":"Show worst-trades loss share for July long trades in the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["July","long","selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":"selected account set","expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"No account, date, filter, or grouping is invented."},
{"caseId":"C4-E10-17","caseType":"multi_part","input":"Show worst-trades loss share and largest-loser contribution for July.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades","largest_loser_contribution"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["per-metric capability status","no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Return a supported alternative separately only if its own requirements are met."},
{"caseId":"C4-E10-18","caseType":"ambiguous","input":"Did a few losers create all my losses?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["plural concentration versus single-largest-loser alternative"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the current single-largest-loser contribution instead of planned plural worst-trades concentration?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Offer the supported alternative only because it is plausibly meant; do not ask the trader to create a contract."},
{"caseId":"C4-E10-19","caseType":"negative_example","input":"Prove I depend on outliers from worst-trade loss share.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no dependency, causation, skill, edge, or certainty claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share cannot prove dependency, causation, edge, skill, or certainty.","notes":"Do not infer a causal conclusion."},
{"caseId":"C4-E10-20","caseType":"unsupported_data","input":"Calculate worst-trades loss share when total absolute loss is zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["total absolute loss = 0"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["zero total absolute-loss denominator","no approved plural worst-set N, percentage, or tie rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A zero total absolute-loss denominator is unavailable; plural worst-trades concentration also remains Planned because no plural worst-set selection or tie rule is approved.","notes":"Do not infer a denominator, set rule, or result from zero total absolute loss."},
{"caseId":"C4-E10-21","caseType":"selected_entity_context","input":"Show worst-trades loss share for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades"],"expectedFilters":["selected review period"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["no approved plural worst-set N, percentage, tie, or absolute-loss denominator rule"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"worst-trades loss share remains Planned because no plural worst-set selection, tie, or absolute-loss denominator rule is approved.","notes":"Selected context cannot supply the missing product contract."},
{"caseId":"C4-E10-22","caseType":"cross_category","input":"Explain the difference between worst-trades loss share and largest-loser contribution.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_total_loss_from_worst_trades","largest_loser_contribution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"percentage_of_total_loss_from_worst_trades","right":"largest_loser_contribution","basis":"plural worst set versus one loser"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that plural worst-trades concentration is Planned while the one-largest contribution is a distinct supported alternative."}
]
```

## 7.12 `dependency_on_outliers` Cases

```json
[
{"caseId":"C4-E11-01","caseType":"canonical","input":"Show my dependency on outliers for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Do not infer a threshold or causal conclusion."},
{"caseId":"C4-E11-02","caseType":"formal_paraphrase","input":"Calculate whether eligible closed-trade results are dependent on defined outliers in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Do not infer a threshold or causal conclusion."},
{"caseId":"C4-E11-03","caseType":"conversational_paraphrase","input":"Are a few trades carrying my results last month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["last month"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Do not infer a threshold or causal conclusion."},
{"caseId":"C4-E11-04","caseType":"trader_slang","input":"Am I getting saved by outliers in June?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["June"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Do not infer a threshold or causal conclusion."},
{"caseId":"C4-E11-05","caseType":"abbreviation","input":"OD dependency on outliers for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["explicit metric grammar"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Bare shorthand must not auto-route."},
{"caseId":"C4-E11-06","caseType":"misspelling","input":"Show my outlyer dependancy for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Normalize only the clear metric misspelling."},
{"caseId":"C4-E11-07","caseType":"noisy_input","input":"outlier dependency pls july","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Noise does not create a product contract."},
{"caseId":"C4-E11-08","caseType":"command","input":"Show dependency on outliers for the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected account set","expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Trusted scope cannot supply the missing product contract."},
{"caseId":"C4-E11-09","caseType":"fragment","input":"Outlier dependency by ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["group by ticker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Do not create a grouped proxy."},
{"caseId":"C4-E11-10","caseType":"follow_up","input":"Is that based on excluding my best trade?","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers","results_excluding_best_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"dependency_on_outliers","right":"results_excluding_best_trade","basis":"planned label versus one-extreme sensitivity"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior reference","no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that one-extreme sensitivity is distinct evidence, not a dependency label."},
{"caseId":"C4-E11-11","caseType":"correction","input":"I mean dependency, not the exclusion result itself.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Do not calculate a supported alternative as a silent substitute."},
{"caseId":"C4-E11-12","caseType":"comparison","input":"Compare dependency on outliers between July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["July","June"],"expectedGroupings":[],"expectedOperators":["period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"dependency on outliers"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"No proxy comparison is permitted."},
{"caseId":"C4-E11-13","caseType":"ranking","input":"Rank my tickers by dependency on outliers.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":[],"expectedGroupings":["ticker"],"expectedOperators":["descending"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"No proxy ranking is permitted."},
{"caseId":"C4-E11-14","caseType":"negation","input":"Do not label me dependent on outliers.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["do not substitute"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Do not infer a threshold or causal conclusion."},
{"caseId":"C4-E11-15","caseType":"exclusion","input":"Show dependency on outliers excluding the selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Filtering cannot make the planned calculation executable."},
{"caseId":"C4-E11-16","caseType":"multi_filter","input":"Show dependency on outliers for July long trades in the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["July","long","selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":"selected account set","expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"No account, date, filter, or grouping is invented."},
{"caseId":"C4-E11-17","caseType":"multi_part","input":"Show net P/L excluding one best trade and explain whether I depend on outliers.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["dependency_on_outliers","results_excluding_best_trade"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["per-metric capability status","no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Return a supported alternative separately only if its own requirements are met."},
{"caseId":"C4-E11-18","caseType":"ambiguous","input":"Are my results real without the big winner?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["planned dependency label versus supported one-extreme sensitivity"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean supported fee-complete net P/L excluding one best trade instead of planned dependency on outliers?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Offer the supported alternative only because it is plausibly meant; do not ask the trader to create a contract."},
{"caseId":"C4-E11-19","caseType":"negative_example","input":"Prove my strategy has no edge because of one trade.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no dependency, causation, skill, edge, or certainty claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers cannot prove dependency, causation, edge, skill, or certainty.","notes":"Do not infer a causal conclusion."},
{"caseId":"C4-E11-20","caseType":"unsupported_data","input":"Calculate dependency on outliers from open positions and account equity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["legitimate_open","account equity"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Do not infer facts or policies from unsupported data."},
{"caseId":"C4-E11-21","caseType":"selected_entity_context","input":"Show dependency on outliers for the selected review period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers"],"expectedFilters":["selected review period"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["no approved outlier definition, comparison method, threshold, or dependency label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"dependency on outliers remains Planned because no outlier definition, comparison method, threshold, or dependency label is approved.","notes":"Selected context cannot supply the missing product contract."},
{"caseId":"C4-E11-22","caseType":"cross_category","input":"Explain the difference between dependency on outliers and excluding one best trade.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["dependency_on_outliers","results_excluding_best_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"dependency_on_outliers","right":"results_excluding_best_trade","basis":"planned label versus one-extreme sensitivity"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no silent substitute"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain the Planned dependency boundary and supported sensitivity alternative without a label."}
]
```

## 7.13 `results_excluding_best_trade` Cases

```json
[
{"caseId":"C4-E12-01","caseType":"canonical","input":"Show my net P/L excluding my best trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["ready_closed","net P/L","July"],"expectedGroupings":[],"expectedOperators":["exactly one deterministic largest positive ready_closed row"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-02","caseType":"formal_paraphrase","input":"Calculate fee-complete selected net P/L after removing exactly one deterministic largest positive ready_closed row in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["ready_closed","net P/L","July"],"expectedGroupings":[],"expectedOperators":["exactly one deterministic largest positive ready_closed row"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["P/L then close-time then stable-ID tie order","fee-complete eligible ready_closed rows","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-03","caseType":"conversational_paraphrase","input":"What remains if my biggest winner is removed last month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["ready_closed","net P/L","last month"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-04","caseType":"trader_slang","input":"P/L without my best winner in June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["ready_closed","net P/L","June"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-05","caseType":"abbreviation","input":"Net P/L excluding best trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L","July"],"expectedGroupings":[],"expectedOperators":["explicit net exclusion grammar"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clear grammar is required; bare abbreviations must not auto-route."},
{"caseId":"C4-E12-06","caseType":"misspelling","input":"Show net P/L excludng my best traid for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L","July"],"expectedGroupings":[],"expectedOperators":["misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-07","caseType":"noisy_input","input":"net pnl w/o best trade july","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-08","caseType":"command","input":"Show net results without my best trade for the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L","selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected account set","expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-09","caseType":"fragment","input":"Net P/L excluding best trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-10","caseType":"follow_up","input":"Now remove the best trade instead.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["trusted follow-up"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior compatible net sensitivity context","fee-complete eligible ready_closed rows","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-11","caseType":"correction","input":"I mean gross P/L excluding my best trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["gross exclusion variant is deferred"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Gross P/L excluding one trade is deferred; only the fee-complete net sensitivity result is supported.","notes":"Do not silently change gross to net."},
{"caseId":"C4-E12-12","caseType":"comparison","input":"Compare net P/L before and after removing the best trade in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["ready_closed","net P/L","July"],"expectedGroupings":[],"expectedOperators":["exactly one deterministic largest positive ready_closed row","before-and-after comparison"],"expectedComparison":{"left":"net P/L before removal","right":"net P/L excluding best trade","basis":"fee-complete selected net P/L"},"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["P/L then close-time then stable-ID tie order","fee-complete eligible ready_closed rows","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Report both factual sums and coverage; no causal conclusion."},
{"caseId":"C4-E12-13","caseType":"ranking","input":"Rank compatible ticker groups by net P/L excluding one best trade.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L"],"expectedGroupings":["compatible ticker groups"],"expectedOperators":["descending","one deterministic removal per compatible partition"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete eligible ready_closed rows","compatible account/currency/timezone partitions"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not mix partitions or remove all ties."},
{"caseId":"C4-E12-14","caseType":"negation","input":"Do not remove all tied winners.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exactly one deterministic largest positive ready_closed row","P/L then close-time then stable-ID tie order"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-15","caseType":"exclusion","input":"Exclude the best trade and the selected ticker from net P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L","exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exclude","exactly one deterministic largest positive ready_closed row"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-16","caseType":"multi_filter","input":"Show net P/L excluding best trade for July trades in the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L","July","selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":"selected account set","expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-17","caseType":"multi_part","input":"Show net P/L with and without the best trade and state coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L"],"expectedGroupings":[],"expectedOperators":["exactly one deterministic largest positive ready_closed row"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete eligible ready_closed rows","eligible and removed-row coverage","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return a sensitivity comparison, not a dependency label."},
{"caseId":"C4-E12-18","caseType":"ambiguous","input":"What are my results without the big winner?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current net-only one-extreme sensitivity interpretation","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E12-19","caseType":"negative_example","input":"Does removing my best trade prove I depend on outliers?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no dependency, causation, skill, edge, or certainty claim"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A one-extreme sensitivity result cannot prove outlier dependency, causation, edge, skill, or certainty.","notes":"Do not infer a label from the result."},
{"caseId":"C4-E12-20","caseType":"unsupported_data","input":"Calculate net P/L excluding my best trade with incomplete fee coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["net P/L","incomplete fee coverage"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The supported net sensitivity result is unavailable without complete supported fee coverage.","notes":"Do not estimate fees or substitute gross P/L."},
{"caseId":"C4-E12-21","caseType":"selected_entity_context","input":"Show net P/L excluding the best trade for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade"],"expectedFilters":["ready_closed","net P/L","selected closed-trade group","no eligible positive net row"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected closed-trade group","expectedContextRequirements":["trusted selected closed-trade group","server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows","no eligible positive net row"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The supported net sensitivity result is unavailable because the trusted selected closed-trade group has no eligible positive net row to remove.","notes":"Retain selected context and fee-complete net-only semantics; no winner can be removed."},
{"caseId":"C4-E12-22","caseType":"cross_category","input":"Explain the difference between net P/L excluding one best trade and dependency on outliers.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_best_trade","dependency_on_outliers"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"results_excluding_best_trade","right":"dependency_on_outliers","basis":"one-extreme sensitivity versus planned descriptive label"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no label substitution"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that the supported sensitivity result is not a dependency conclusion."}
]
```

## 7.14 `results_excluding_worst_trade` Cases

```json
[
{"caseId":"C4-E13-01","caseType":"canonical","input":"Show my net P/L excluding my worst trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["ready_closed","net P/L","July"],"expectedGroupings":[],"expectedOperators":["exactly one deterministic most-negative ready_closed row"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-02","caseType":"formal_paraphrase","input":"Calculate fee-complete selected net P/L after removing exactly one deterministic most-negative ready_closed row in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["ready_closed","net P/L","July"],"expectedGroupings":[],"expectedOperators":["exactly one deterministic most-negative ready_closed row"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["P/L then close-time then stable-ID tie order","fee-complete eligible ready_closed rows","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-03","caseType":"conversational_paraphrase","input":"What remains if my biggest loser is removed last month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["ready_closed","net P/L","last month"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"last month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-04","caseType":"trader_slang","input":"P/L without my worst loser in June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["ready_closed","net P/L","June"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-05","caseType":"abbreviation","input":"Net P/L excluding worst trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L","July"],"expectedGroupings":[],"expectedOperators":["explicit net exclusion grammar"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clear grammar is required; bare abbreviations must not auto-route."},
{"caseId":"C4-E13-06","caseType":"misspelling","input":"Show net P/L excludng my worst traid for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L","July"],"expectedGroupings":[],"expectedOperators":["misspelling normalization"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-07","caseType":"noisy_input","input":"net pnl w/o worst trade july","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L","July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-08","caseType":"command","input":"Show net results without my worst trade for the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L","selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected account set","expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-09","caseType":"fragment","input":"Net P/L excluding worst trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-10","caseType":"follow_up","input":"Now remove the worst trade instead.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["trusted follow-up"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior compatible net sensitivity context","fee-complete eligible ready_closed rows","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-11","caseType":"correction","input":"I mean gross P/L excluding my worst trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["gross exclusion variant is deferred"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Gross P/L excluding one trade is deferred; only the fee-complete net sensitivity result is supported.","notes":"Do not silently change gross to net."},
{"caseId":"C4-E13-12","caseType":"comparison","input":"Compare net P/L before and after removing the worst trade in July.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["ready_closed","net P/L","July"],"expectedGroupings":[],"expectedOperators":["exactly one deterministic most-negative ready_closed row","before-and-after comparison"],"expectedComparison":{"left":"net P/L before removal","right":"net P/L excluding worst trade","basis":"fee-complete selected net P/L"},"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["P/L then close-time then stable-ID tie order","fee-complete eligible ready_closed rows","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Report both factual sums and coverage; no causal conclusion."},
{"caseId":"C4-E13-13","caseType":"ranking","input":"Rank compatible ticker groups by net P/L excluding one worst trade.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L"],"expectedGroupings":["compatible ticker groups"],"expectedOperators":["descending","one deterministic removal per compatible partition"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete eligible ready_closed rows","compatible account/currency/timezone partitions"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not mix partitions or remove all ties."},
{"caseId":"C4-E13-14","caseType":"negation","input":"Do not remove all tied losers.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exactly one deterministic most-negative ready_closed row","P/L then close-time then stable-ID tie order"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-15","caseType":"exclusion","input":"Exclude the worst trade and the selected ticker from net P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L","exclude selected ticker"],"expectedGroupings":[],"expectedOperators":["exclude","exactly one deterministic most-negative ready_closed row"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected ticker","expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-16","caseType":"multi_filter","input":"Show net P/L excluding worst trade for July trades in the selected account set.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L","July","selected account set"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":"selected account set","expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-17","caseType":"multi_part","input":"Show net P/L with and without the worst trade and state coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L"],"expectedGroupings":[],"expectedOperators":["exactly one deterministic most-negative ready_closed row"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete eligible ready_closed rows","eligible and removed-row coverage","one compatible account/currency/timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return a sensitivity comparison, not a dependency label."},
{"caseId":"C4-E13-18","caseType":"ambiguous","input":"What are my results without the big loser?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["current net-only one-extreme sensitivity interpretation","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Historical net P/L sensitivity only; return eligible and removed-row coverage."},
{"caseId":"C4-E13-19","caseType":"negative_example","input":"Does removing my worst trade prove I depend on outliers?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no dependency, causation, skill, edge, or certainty claim"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A one-extreme sensitivity result cannot prove outlier dependency, causation, edge, skill, or certainty.","notes":"Do not infer a label from the result."},
{"caseId":"C4-E13-20","caseType":"unsupported_data","input":"Calculate net P/L excluding my worst trade with incomplete fee coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["net P/L","incomplete fee coverage"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The supported net sensitivity result is unavailable without complete supported fee coverage.","notes":"Do not estimate fees or substitute gross P/L."},
{"caseId":"C4-E13-21","caseType":"selected_entity_context","input":"Show net P/L excluding the worst trade for the selected closed-trade group.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade"],"expectedFilters":["ready_closed","net P/L","selected closed-trade group","no eligible negative net row"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"selected closed-trade group","expectedContextRequirements":["trusted selected closed-trade group","server-authoritative account scope","one compatible account/currency/timezone partition","fee-complete eligible ready_closed rows","no eligible negative net row"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The supported net sensitivity result is unavailable because the trusted selected closed-trade group has no eligible negative net row to remove.","notes":"Retain selected context and fee-complete net-only semantics; no loser can be removed."},
{"caseId":"C4-E13-22","caseType":"cross_category","input":"Explain the difference between net P/L excluding one worst trade and dependency on outliers.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["results_excluding_worst_trade","dependency_on_outliers"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["concept distinction"],"expectedComparison":{"left":"results_excluding_worst_trade","right":"dependency_on_outliers","basis":"one-extreme sensitivity versus planned descriptive label"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no label substitution"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain that the supported sensitivity result is not a dependency conclusion."}
]
```

# 8. Coverage Report Deliverable

The final coverage report is complete and accepted. The Category 4 controlling
inventory has 13 records, and all 13 canonical records, language registries,
and evaluation arrays are complete and reviewed. Section 7 has all 286 of 286
cases passed independent review and controller acceptance. All 22 required
types appear once in every array.

| Coverage item | Current count | Status |
|---|---:|---|
| Controlling concepts | 13 / 13 | Approved and locked at Version 1. |
| Canonical records | 13 / 13 | Complete, reviewed, and approved. |
| Language registries | 13 / 13 | Complete, reviewed, and approved. |
| Evaluation cases | 286 / 286 | All C4-E1 through C4-E13 arrays passed independent review and controller acceptance. |
| Required type instances | 286 / 286 | Each ordered type appears once in every batch-reviewed concept array. |
| All saved behavior counts | Clarification 16; Unsupported 132; Cross-category 13 | Batches 1--4 passed. |
| Passed cases | 286 | All C4-E1 through C4-E13 cases passed independent review and controller acceptance. |
| Pending evaluation concepts | 0 / 13 | All concept arrays passed; six capability definitions remain Planned exactly as approved. |

No proposed addition, formula, alias, account selection, date, runtime,
causation claim, forecast, or advice is introduced by approval. Duplicate and
overlap review passed with the exact Supported/Planned boundary preserved.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete.
- [x] Boundaries are complete.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] No listed item was silently omitted.
- [x] No listed item was silently renamed.
- [x] No listed item was silently merged.
- [x] Proposed additions are separated.
- [x] Duplicate concepts are resolved.

## Canonical Inventory

- [x] Every item has a stable inventory ID.
- [x] Every item has an approved and locked canonical name.
- [x] Every item has a complete Version 1 exact definition.
- [x] Related concepts are approved as distinguished.
- [x] Classification, status, and Version 1 are present in every approved record.

## Language Registry

- [x] Batch 1 registries are complete for C4-EDGE-001 through C4-EDGE-005.
- [x] Batch 2 registries are complete for C4-EDGE-006 through C4-EDGE-009.
- [x] Batch 3 registries are complete for C4-EDGE-010 through C4-EDGE-013; all 13 Version 1 registries are complete, approved, and locked.
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

- [x] Required and optional data are documented at planning level.
- [x] Valid filters are documented per canonical record.
- [x] Valid groupings are documented per canonical record.
- [x] Valid operators are documented per canonical record.
- [x] Compatible intents are documented per canonical record.
- [x] Incompatible combinations are documented per canonical record.
- [x] Defaults are documented per canonical record.
- [x] Clarification conditions are documented per canonical record.
- [x] Unsupported conditions are documented per canonical record.
- [x] Tool targets are documented per canonical record.
- [x] Units, fees, open trades, and sample-size rules are documented per canonical record.

## Evaluation

- [x] Evaluation cases exist for every important concept; all C4-E1 through C4-E13 arrays are complete and batch-reviewed.
- [x] Independent PASS and controller acceptance are recorded for all C4-E1 through C4-E13: 286 passed cases, Clarification 16, Unsupported 132, and Cross-category 13.
- [x] Expected structured interpretations, negative examples, ambiguous cases, unsupported-data cases, and cross-category cases are batch-reviewed for C4-E10 through C4-E13.
- [x] All saved behavior counts reconcile to Clarification 16, Unsupported 132, and Cross-category 13.
- [x] Batch 3 C4-E7 through C4-E9 has received independent final PASS and controller acceptance.
- [x] Final Batch 4 C4-E10 through C4-E13 has received independent final PASS and controller acceptance.

## Coverage Report

- [x] Counts are recorded: 286 / 286 saved and passed; all arrays are batch-reviewed.
- [x] Final comprehensive independent Terra review passed and is recorded.
- [x] Overlaps are reviewed and resolved.
- [x] Batches 1--4 accepted and supported/Planned boundaries are recorded without a runtime claim.
- [x] No unresolved blocker is hidden.

## Approval

- [x] Category passed the required pre-approval review gate.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] Version is updated.
- [x] Master tracker is updated by the controller.
- [x] Change log is updated after review.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Independent review restored the required deferred Coverage Report placeholder
  and clarified that the six Section 4 rows are controller decisions or future-
  scope boundaries, not blockers to the approved Version 1 canonical records.
- Final comprehensive independent Terra review passed, and the controller
  approved and locked the exact 13-name Version 1 inventory with seven
  Supported and six Planned boundaries.
- Independent Section 5 remediation added the shared inherited server-authoritative
  account-scope and exact-calculation/result-boundary rounding contract for all
  13 records, including authorized compatible multi-account selected sets and
  the separately labeled standard-deviation exception.
- Section 5 is accepted after independent PASS. Section 6 is complete,
  approved, locked, and passed its final registry audit and whole-file
  recheck. Independent review passed and the
  controller accepted Section 7 Batch 1 for C4-E1 through C4-E3: 66 passed
  cases with Clarification 3, Unsupported 23, and Cross-category 3.
- Independent review passed and the controller accepted Section 7 Batch 2 for
  C4-E4 through C4-E6: 66 additional passed cases. Independent review also
  passed and the controller accepted Batch 3 C4-E7 through C4-E9: 66
  additional passed cases. Independent review also passed and the controller
  accepted final Batch 4 C4-E10 through C4-E13: 88 additional passed cases.
  The final saved and passed total is 286 of 286; final comprehensive
  independent Terra review also passed.
- Independent evaluation review remediation replaced unsupported `regular
  hours` session filtering with explicit account-local entry-time buckets in
  C4-E1-16, C4-E2-16, and C4-E3-16. It also corrected recognition-only
  concept explanations C4-E3-10 and C4-E3-22 and focused clarification
  C4-E3-18 so they do not claim unsupported outcomes. Batch counts now
  reconcile to Clarification 3, Unsupported 23, and Cross-category 3; the
  remediated cases subsequently passed independent review.
- Batch 3 clarification review found that C4-E8-04 lacked a gross/net basis,
  C4-E8-09 and C4-E8-14 lacked both basis and period, and C4-E8-15 lacked a
  period. The batch-reviewed cases now use focused or staged clarification
  without inventing a date, basis, account, filter, grouping, or runtime.

## Required Changes

- None. Before future work adds or maps a new formula/capability, apply the relevant
  payoff-ratio, consistency, return-dispersion, top/worst-set,
  outlier-dependency, or gross-exclusion boundary from Section 4.

## Completed Changes

- Initial planning draft completed.
- Independent review correction restored Section 8 and clarified the Section 4
  future-scope decision boundaries without changing capability status, approval,
  lock, or version.
- Completed the first Section 5 canonical-record batch for C4-EDGE-001 through
  C4-EDGE-007.
- Completed the remaining Section 5 canonical records C4-EDGE-008 through
  C4-EDGE-013; all 13 records passed review and are approved at Version 1.
- Added the shared Section 5 account-scope and precision contract without
  changing a formula, capability status, approval, lock, or version.
- Completed all 38 required non-placeholder subsections for each Section 6
  Batch 1 registry C4-EDGE-001 through C4-EDGE-005; Sections 7--8 and the
  remaining eight registries were not started.
- Completed all 38 required non-placeholder subsections for each Section 6
  Batch 2 registry C4-EDGE-006 through C4-EDGE-009; Sections 7--8 and the
  remaining four registries were not started.
- Completed all 38 required non-placeholder subsections for each Section 6
  Batch 3 registry C4-EDGE-010 through C4-EDGE-013; all 13/494 registry
  subsection instances are complete and accepted.
- Remediated planned-registry clarification wording so it reports the Planned
  limit unless a supported alternative is plausible; no formula or capability
  was added.
- Saved Section 7 Batch 1 evaluation arrays for C4-E1 through C4-E3: 66 cases
  in the locked 21-key schema, with all 22 required types once per concept;
  subsequent independent PASS and controller acceptance are recorded.
- Applied the independent Batch 1 remediation for the three multi-filter cases
  and three payoff-ratio recognition/clarification cases. Reconciled the saved
  counts to Clarification 3, Unsupported 23, and Cross-category 3; no case was
  added, removed, approved, locked, or marked passed.
- Recorded controller acceptance of independent PASS for C4-E1 through C4-E3:
  66 passed cases with Clarification 3, Unsupported 23, and Cross-category 3;
  the accepted arrays remain unchanged.
- Saved Section 7 Batch 2 evaluation arrays for C4-E4 through C4-E6: 66 cases
  in the locked 21-key schema, with all 22 required types once per concept;
  subsequent independent PASS and controller acceptance are recorded.
- Recorded controller acceptance of independent PASS for C4-E4 through C4-E6:
  66 additional passed cases; C4-E1 through C4-E6 now total 132 accepted
  passed cases without changing their arrays.
- Saved Section 7 Batch 3 evaluation arrays for C4-E7 through C4-E9: 66 cases
  in the locked 21-key schema, with all 22 required types once per concept;
  independent PASS and controller acceptance are recorded without changing
  those arrays.
- Applied the Batch 3 C4-E8 focused and staged clarification findings to
  C4-E8-04, C4-E8-09, C4-E8-14, and C4-E8-15. Batch 3 now has eight
  clarification cases and is accepted.
- Saved final Section 7 Batch 4 evaluation arrays for C4-E10 through C4-E13:
  88 cases in the locked 21-key schema, with all 22 required types once per
  concept. Independent PASS and controller acceptance now bring the document
  to 286 saved and passed cases, Clarification 16, Unsupported 132, and
  Cross-category 13.
- Applied final Batch 4 review remediation: C4-E10-20 now directly records the
  zero absolute-loss-denominator unavailability, while C4-E12-21 and
  C4-E13-21 retain trusted selected-group context and prove unavailable when no
  eligible positive or negative net row exists to remove.
- Reconciled the final documentation state: all 13 records, all 13 registries,
  and all 286 evaluation cases are complete and reviewed; registry and
  per-record execution-requirement checklist items match the completed
  deliverables.
- Recorded final comprehensive independent Terra PASS and controller approval:
  Category 4 is Complete at Version 1, all 13 canonical names and registries
  are approved and locked, all 286 evaluation cases passed, and the seven
  Supported/six Planned boundary remains unchanged without a runtime claim.

## Approval Decision

- Status: Complete
- Approved by: Lead controller after final comprehensive independent Terra review
- Approval date: 2026-08-10
- Version: 1
- Canonical names locked: Yes

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-10 | Approved and locked Category 4 complete after final comprehensive independent Terra PASS | Finalize all 13 canonical records and registries plus 286 of 286 passed evaluation cases with Clarification 16, Unsupported 132, and Cross-category 13; preserve seven Supported and six Planned capability boundaries and no runtime claim | 1 |
| 2026-08-10 | Reconciled final Category 4 documentation and checklist state | Remove stale deferred and awaiting-review claims, mark completed registry and per-record execution requirements truthfully, and retain Ready for Review Version 0 with final whole-file independent remediation/recheck pending | 0 |
| 2026-08-10 | Recorded controller acceptance of independent PASS for final Section 7 Batch 4 C4-E10 through C4-E13 | Preserve every evaluation array and Version 0 boundary; record all 286 of 286 cases passed with Clarification 16, Unsupported 132, and Cross-category 13, then move the category to Ready for Review without approval, lock, or version change | 0 |
| 2026-08-10 | Applied final Batch 4 unavailable-row and zero-denominator remediation | Preserve final Batch 4 as unreviewed while proving zero absolute-loss denominator unavailability for planned worst-trade concentration and no eligible positive/negative net-row unavailability for the supported net one-extreme sensitivities | 0 |
| 2026-08-10 | Recorded controller acceptance of independent PASS for Section 7 Batch 3 and saved unreviewed final Batch 4 C4-E10 through C4-E13 | Preserve the accepted C4-E1 through C4-E9 arrays; add 88 exact-structure cases for planned worst-trade concentration and non-causal outlier-dependency boundaries plus supported fee-complete net one-extreme sensitivities, update truthful 286-saved/198-passed counts, and leave final Batch 4 unreviewed | 0 |
| 2026-08-10 | Applied Batch 3 C4-E8 clarification findings | Clarify missing gross/net basis in C4-E8-04, ask basis first when basis and period are both absent in C4-E8-09 and C4-E8-14, and ask only for the missing period in C4-E8-15; preserve 198 saved, 132 passed, 86 unsupported, nine cross-category, and the unreviewed Batch 3 state | 0 |
| 2026-08-10 | Recorded controller acceptance of independent PASS for Section 7 Batch 2 and saved unreviewed Batch 3 C4-E7 through C4-E9 | Preserve the accepted C4-E1 through C4-E6 arrays; add 66 exact-structure cases for Planned return dispersion and plural top-trades concentration plus supported selected-basis P/L standard deviation, update truthful 198-saved/132-passed counts, and leave C4-E10 through C4-E13 pending | 0 |
| 2026-08-10 | Recorded controller acceptance of independent PASS for Section 7 Batch 1 and saved unreviewed Batch 2 C4-E4 through C4-E6 | Preserve the accepted 66-case C4-E1 through C4-E3 result without changing those arrays; add 66 exact-structure cases for the two supported win/loss ratios and Planned consistency, update truthful 132-saved/66-passed counts, and leave C4-E7 through C4-E13 pending | 0 |
| 2026-08-10 | Applied independent remediation to Section 7 Batch 1 and reconciled Clarification 3, Unsupported 23, and Cross-category 3 | Replace unsupported regular-hours session filtering with explicit account-local entry-time buckets and distinguish payoff-ratio explanation or clarification handling from unsupported calculation handling without claiming a pass | 0 |
| 2026-08-10 | Saved unreviewed Section 7 Evaluation Batch 1 for C4-E1 through C4-E3 and recorded the count-only Section 8 checkpoint | Add 66 of 286 exact-structure cases across all required types without claiming evaluation pass, formula approval, runtime availability, name lock, or Category completion; C4-E4 through C4-E13 remain pending | 0 |
| 2026-08-10 | Remediated planned Section 6 clarification wording and corrected worst-set default wording | Do not ask traders to define missing product concepts; offer only a plausible supported alternative or state the Planned limit | 0 |
| 2026-08-10 | Completed Section 6 Language Registry Batch 3 for C4-EDGE-010 through C4-EDGE-013 | Finish all Version 0 language registries with planned plural-set/dependency limits and supported net-only one-extreme boundaries; leave evaluation and coverage deliverables deferred | 0 |
| 2026-08-10 | Completed Section 6 Language Registry Batch 2 for C4-EDGE-006 through C4-EDGE-009 | Record planned consistency/return-dispersion/top-trade boundaries and supported selected-basis P/L standard deviation without inventing formulas or starting later deliverables | 0 |
| 2026-08-10 | Completed Section 6 Language Registry Batch 1 for C4-EDGE-001 through C4-EDGE-005 | Record complete future-recognition language, clarification, query-boundary, and policy coverage without starting remaining registries, evaluation, or coverage deliverables | 0 |
| 2026-08-10 | Added the inherited Section 5 server-authoritative account-scope and exact-calculation/result-boundary rounding contract | Make account isolation and precision explicit for all 13 records while preserving authorized compatible multi-account selected sets and the separately labeled rounded standard-deviation result | 0 |
| 2026-08-10 | Completed canonical records C4-EDGE-008 through C4-EDGE-013; all 13 Version 0 Section 5 records are now complete and unreviewed | Record exact supported P/L-dispersion/net-one-extreme paths and planned concentration/outlier boundaries without inventing formulas, approval, or a name lock | 0 |
| 2026-08-10 | Controller accepted the exact 13-name inventory for Version 0 deliverable production; completed canonical records C4-EDGE-001 through C4-EDGE-007 | Record accepted Supported/Planned boundaries without approving or locking names; leave the remaining records and Sections 6--8 deferred | 0 |
| 2026-08-10 | Restored the deferred Section 8 placeholder and clarified the six Section 4 decision rows as controller/future-scope boundaries | Keep template order and avoid treating current planned/supported Version 0 boundaries as blocked canonical records | 0 |
| 2026-08-10 | Initial Category 4 planning draft and exact 13-item controlling inventory created; Sections 5--7 deferred | Establish formula, denominator, currency, fee, sample, outlier, and capability boundaries before future formula/capability expansion | 0 |
