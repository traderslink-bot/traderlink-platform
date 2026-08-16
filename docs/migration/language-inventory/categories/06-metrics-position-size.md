# Category 6: Position Size and Exposure Metrics

# Category Metadata

| Field | Value |
|---|---|
| Category name | Position Size and Exposure Metrics |
| Category number | 6 |
| Category slug | metrics-position-size |
| File name | 06-metrics-position-size.md |
| Category type | Quantity, position-size, exposure, and size-sequence metric vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-10 |
| Last updated | 2026-08-10 |
| Dependencies | Category 1 Intents version 1; Category 2 P/L basis; Category 3 outcome/sequence terminology; Category 5 fee basis; replacement Journal Analytics Fact Set, allocation graph, metric registry, query/result, account-scope, currency, timezone, and coverage contracts; later dimensions, operators, dates, comparison/ranking, context, terminology, ambiguity, presentation, and policy categories |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** Mapped language does not authorize
> a size calculation, exposure inference, or mutation absent its owning service.

**Controller state:** The controller accepted and locked all 14 Version 1
canonical records and all 14 language registries after comprehensive
independent PASS, including the seven-case final recheck. All 308 of 308
evaluation cases pass: 14 clarification, 108 unsupported, and 14
cross-category cases. The category is Complete and approved. No Chat route or
runtime metric is created here.

---

# 1. Category Purpose

Category 6 gives the future TraderLink AI Companion stable targets for questions
about bought or sold share volume, the largest quantity held during a round
trip, execution-derived notional, size relative to an approved personal
baseline, results across approved size groups, and changes in size after a
prior outcome. It prevents “size,” “shares,” “exposure,” and “dollars” from
silently switching among execution-side volume, entered or exited quantity,
maximum open position, cost notional, current market value, account equity, or
buying-power usage.

The category interprets metric language; Journal Analytics remains responsible
for reading the server-authorized account scope, constructing the current
accepted allocation graph, enforcing exact quantity and money math, preserving
coverage, and returning a deterministic complete, partial, empty, or
unavailable result. The language interpreter, validator, tool router, and AI
Chat runtime remain planned. A `Supported` row below therefore means an
existing conditional deterministic analytic primitive, not executable Chat.

This category does not infer intended risk, conviction, discipline, revenge,
overtrading, account utilization, margin use, current market value, or a
recommendation to size up or down. It reports a defined historical quantity or
arithmetic relationship with coverage limits only.

---

# 2. Category Boundaries

## Included

The controlling inventory contains exactly the 14 Section 5.5 names for:

- execution-side purchased and sold share quantities;
- the locked entered-share/entered-quantity denominator: the sum of
  position-increasing allocated quantities with roles `opening`, `adding`, and
  `flip_opening`, referenced from Category 5 and owned here for size/exposure
  metric semantics;
- per-round-trip maximum absolute open quantity and its average, median, and
  maximum across an eligible population;
- proposed execution-derived dollar-exposure aggregates, subject to a
  controller-approved exposure basis;
- size relative to an approved personal normal-size baseline;
- performance grouped into approved size buckets;
- size following an eligible prior win or loss; and
- defined size escalation, reduction, and realized profit per approved dollar
  exposure.

All results must retain Stock/unit eligibility, quantity or money basis,
population, gross/net and fee basis where P/L is used, one authorized account,
one currency partition for money, account-timezone date attribution where a
range applies, exact numerator/denominator, coverage, and formula version.

## Excluded

The following related concepts are not owned here:

- execution sequencing, allocation-role construction, entry/add/reduction/exit
  counts, execution counts, execution prices, and flip mechanics are execution
  concerns owned by Category 8. Category 8 supplies those mechanics but does
  not redefine Category 6's locked entered-share/entered-quantity denominator
  semantics;
- gross/net P/L, return, realized result, and `profit_per_share` belong to
  Category 2; Category 6 supplies only an approved size/exposure denominator
  to its own metrics;
- win/loss/flat meanings, rates, and streaks belong to Category 3;
- expectancy, quality, consistency, and edge interpretation belong to Category
  4; a size/P&L association is not an edge or causal conclusion;
- fees, fee completeness, and gross/net fee policy belong to Category 5;
- duration, time between trades, and date language belong to Categories 7 and
  13;
- market marks, quote-derived market value, intraday peak value, account
  equity, buying power, margin, portfolio exposure, FX conversion, and
  multi-asset multiplier contracts require their own account/market-data
  owners and are not inferred from execution notional;
- account, ticker, direction, provenance, currency, outcome, and size-bucket
  dimensions belong to Category 11; operators to Category 12; comparison and
  ranking grammar to Category 14; and context, terminology, ambiguity,
  presentation, privacy, causation, and safety policy to Categories 15-19;
- a trader-entered intended risk amount, normal-size preference, or risk plan
  is a later trader fact, not an inferred value; and
- Journal writes, manual execution changes, protected actions, and the AI Chat
  provider/runtime are outside this category.

## Cross-Category References

Category 6 references but does not redefine:

- Category 1 calculation, summary, grouping, comparison, ranking, sequence,
  explanation, diagnosis, and data-quality intents;
- Category 2 selected realized gross/net P/L basis, `profit_per_share`, money
  partitioning, and partial-result rules;
- Category 3 win/loss/flat outcome basis and ordered prior-trade sequence;
- Category 5 complete-fee coverage and charge policy when a net P/L basis is
  selected, plus its locked entered-share denominator definition that Category
  6 adopts as the size/exposure quantity boundary;
- Category 8 allocation-role, execution-side, flip, and running-position
  mechanics, without transferring Category 6's entered-share/entered-quantity
  denominator ownership;
- Categories 11-14 for dimensions, operators, dates, account timezone,
  bucket/group contracts, comparisons, rankings, and deterministic ties; and
- Categories 15-19 for trusted selected context, terminology, clarification,
  answer presentation, server-authorized account isolation, no invention, and
  no-causation policy.

Category 6 owns the 14 metric meanings below and the entered-share/
entered-quantity denominator semantic they consume. In particular, purchase/
sale execution volume, entered/exited quantity, and maximum open quantity are
not aliases and must not be merged. Category 8 owns the execution mechanics,
not a competing quantity-denominator definition.

---

# 3. Planning Analysis

Planning establishes the controller-accepted 14-name controlling list and its
ownership boundaries. All 14 Section 5 canonical records, all 14 Section 6
registries, and all 14 Section 7 arrays are complete, passed their bounded
batch reviews, and passed the comprehensive whole-file independent review.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?**

   It maps size/exposure wording to one declared quantity, position, notional,
   sequence, or ratio basis. It prevents a result from calling an execution
   buy “position size,” treating entry cost as market exposure, treating one
   account's currency as another's, or describing a size change as a motive.

2. **What canonical concepts belong here?**

   Exactly the 14 ordered names in Section 4, with IDs `C6-SIZE-001` through
   `C6-SIZE-014`. They remain controlling even if the current registry has a
   differently named compatibility metric or lacks the named metric entirely.

3. **What related concepts belong elsewhere?**

   Category 8 owns execution construction, allocation roles, side facts, and
   flip mechanics, while Category 6 retains the locked entered-share/
   entered-quantity denominator semantic referenced from Category 5. P/L/fees
   own performance basis; outcomes own wins/losses; and account or market-data
   owners own equity, margin, marks, and live exposure. Later categories own
   the dimensions, bucket language, date interpretation, comparison language,
   and safety policy around this category's metrics.

4. **What data is required?**

   Every current quantity metric requires a server-authorized account scope,
   current accepted execution versions and allocation graph, Stock multiplier
   one eligibility, exact quantity, side and allocation role, ordered
   execution sequence, active round-trip projection state, and coverage
   reasons. Maximum-position metrics additionally require a reconciled running
   position after each allocation. Money/exposure or P/L relationships require
   one trade-currency partition, exact price and quantity, an explicitly
   approved exposure denominator, and a declared gross or fee-complete net P/L
   basis. Sequence metrics additionally require a controller-approved prior
   closed-trade order, selected outcome basis, treatment of flat/decision/open
   barriers, and an exact comparison unit.

5. **Which deterministic tools will answer these requests?**

   The current evidence path is the read-only `JournalAnalyticsFactSet`, typed
   `journal_analytics_query_v1`, current allocation/population builder,
   `JournalAnalyticsService`, exact decimal/rational math, extended metric
   calculator, versioned metric registry, grouped result service, and coverage
   contract. Existing filters include entered-quantity, maximum-position, and
   entry-notional ranges. The current registry exposes conditional
   `average_position_size` and `median_position_size` using per-round-trip
   maximum absolute open quantity. No current named tool establishes the
   remaining draft metrics or a Chat route.

6. **Which concepts are directly observed?**

   Execution side, exact execution quantity, allocated quantity, price,
   allocation role, sequence, currency, timestamp, and current projection
   state are accepted Journal facts where covered. They are evidence for
   `shares_purchased` and `shares_sold`, not aggregate metric results. No
   average, median, maximum across trades, dollar exposure, baseline, bucket
   performance, sequence comparison, or profit ratio is directly observed.

7. **Which concepts are deterministically derived?**

   Per-round-trip maximum position quantity is the maximum absolute running
   position after each allocation. Current average and median position size
   aggregate that exact value. Purchase/sale totals can be derived from an
   approved execution-side side rule. Other listed metrics can be derived only
   after their required exposure, bucket, baseline, sequence, P/L, and
   denominator contracts are approved; derivable in principle is not current
   runtime support.

8. **Which concepts are proxy indicators?**

   `size_relative_to_normal_size`, `performance_by_size_bucket`,
   `size_after_wins`, `size_after_losses`, `size_escalation`, and
   `size_reduction` are descriptive proxy indicators when later supported.
   They may show an observed historical relationship; they do not establish
   risk tolerance, intent, discipline, confidence, causation, skill, edge, or
   future performance. Quantity and exact arithmetic ratios are factual under
   their stated definitions.

9. **Which concepts are user-labelled?**

   None is user-labelled today. A future user-approved normal-size target or
   risk plan could be an input to `size_relative_to_normal_size`, but it must
   be versioned trader fact with an effective date and cannot be inferred from
   the trade history. Tags, setups, rules, and manual/broker provenance may
   only filter an otherwise valid population under their owners' contracts.

10. **Which concepts are not measurable?**

   Current Journal facts do not establish generic dollar exposure, market-value
   exposure, peak intraday value, account equity exposure, buying-power use,
   margin use, portfolio exposure, cross-currency exposure, a personal normal
   size, size-bucket thresholds, or a sequence/escalation policy. Option
   contracts, fractional-unit conventions outside Stock, multiplier/quote
   treatment, live marks, and FX conversion are not substitutes. Missing facts
   must yield explicit unavailable/partial coverage, never a model estimate or
   a zero.

11. **Which terms are ambiguous?**

   “Shares bought/sold” may mean buy/sell execution side or shares entered/
   exited from a long or short position. “Size” may mean execution quantity,
   entered quantity, maximum open quantity, dollar notional, risk, buying
   power, or account percentage. “Exposure” may mean execution-derived entry
   notional, peak cost basis, marked market value, gross long-plus-short
   exposure, net directional exposure, or equity utilization. “Normal” may
   mean historical median, recent rolling median, a trader target, or an
   account-size percentage. “After a win/loss” needs prior-order, outcome
   basis, flat, intervening, and same-ticker/account decisions. “Profit per
   dollar” needs gross/net basis and a precisely defined nonzero denominator.

12. **What defaults are safe?**

   The only safe current position-size default is a Stock-only, eligible
   ready-closed round trip's maximum absolute open quantity; the current
   `average_position_size` and `median_position_size` primitives use it. It
   must be labelled quantity, not dollars, risk, or account exposure. Realized
   P/L relationships use `ready_closed` rows; legitimate open positions and
   `needs_decision` chains remain visible coverage and do not enter a realized
   value by default. No safe default exists for bare shares, dollars/exposure,
   normal size, bucket thresholds, previous-trade comparator, gross versus
   net, or a zero denominator.

13. **What conditions require clarification?**

   Ask one focused question when “shares bought/sold” could mean execution side
   or position entry/exit; “size” could mean maximum quantity or dollars;
   “exposure” lacks cost/market/equity basis; “normal” lacks a selected
   baseline; a bucket request lacks approved threshold/basis; “after” lacks a
   prior-trade sequence/outcome basis; or “profit per dollar” lacks gross/net
   basis or exposure denominator. Also clarify selected account/currency
   scope, period, and whether a trusted selected UI group already supplies
   them. Do not ask the trader to make up missing historical facts.

14. **What combinations are invalid?**

   Invalid combinations include summing quantities across incompatible asset
   units while calling them shares; treating execution buys/sells as entered/
   exited quantity; using buy quantity to mean maximum position; aggregating
   money/notional/P&L across currencies; using execution notional as marked or
   account/equity exposure; applying a Stock multiplier-one formula to
   contracts without an approved multiplier/quote policy; including
   legitimate-open or needs-decision rows in realized P/L performance; mixing
   fee-incomplete net values with gross rows without visible partial coverage;
   comparing a trade to a baseline that includes the trade unless the formula
   explicitly says so; skipping a flat, decision, or open barrier without an
   approved sequence policy; dividing by zero/unknown exposure; and presenting
   an association as advice, causation, or a behavior diagnosis.

15. **What evaluation coverage proves completion?**

   Later evaluation must cover all 14 names; execution-side buy/sell versus
   entered/exited and short/flip distinctions; maximum-open-quantity scale-in,
   partial-exit, and flip cases; Stock-only versus unsupported contract units;
   exact quantity precision and display rounding; gross/net and fee-complete
   P/L basis; one account/currency/timezone partition; ready-closed/open/
   decision coverage; no dollar/market/equity exposure conflation; approved
   versus missing baseline and bucket policies; win/loss/flat prior-sequence
   barriers; escalation/equality/reduction transitions; zero/unknown
   denominator; privacy/account denial; no-causation language; and planned or
   unavailable Chat routing.

## 3.2 Dependencies

- **Required earlier categories:** Category 1 intent/coverage routing;
  Category 2 P/L basis and exact result rules; Category 3 selected outcome and
  sequence-order rules; Category 5 fee-complete net policy.
- **Required Journal facts/services:** server-authorized scope; accepted current
  executions, allocation roles, side, exact quantity/price, currency,
  timestamps, running position reconstruction, ready/open/decision state,
  read-only fact snapshot, exact decimal/rational math, coverage reasons,
  query ranges, metric registry, and grouped response contract.
- **Required later contracts:** Category 8 must define execution-side, role,
  flip, and running-position mechanics without replacing Category 6's locked
  entered-share/entered-quantity denominator semantic; Category 11 must own
  size-bucket and stable group dimensions; Categories 12-14 must own filter,
  operator, date, comparison, ranking, equality, and language policy around
  deterministic ties; Categories 15-19 must own context, terminology,
  clarification, presentation, privacy, and safety.
- **Required UI/context:** a server-authorized account selection, explicit
  date/currency partition when money is requested, account timezone for date
  ranges/order labels, and only trusted server-authorized selected trade/group
  context.
- **Required external/trader facts:** current marked exposure requires an
  approved quote/market-data contract; equity, margin, buying-power, or
  portfolio exposure requires account facts; non-Stock units require
  multiplier/quote contracts; personal normal-size requires a versioned trader
  baseline or an approved historical-baseline formula. None is present merely
  because an execution has a price.
- **Unsupported dependencies:** V3 fallback, source-text inference, model-made
  values, client-supplied account identifiers, cross-currency conversion
  without timestamped approved FX, live market/equity claims without facts,
  and provider/runtime access are out of scope.

## 3.3 Risks

- **Quantity-semantic risk:** Buy/sell execution volume, entered/exited volume,
  and maximum open quantity diverge for shorts, reductions, and flips.
- **Unit risk:** “Shares” is not a safe universal synonym for contracts,
  fractional units, or multiplier-based assets. Current monetary analytics are
  Stock multiplier-one only.
- **Exposure-conflation risk:** Entry notional, running cost, marked value,
  gross/net market exposure, equity percentage, margin, and buying power are
  different quantities with different facts and timing.
- **Currency risk:** Exact quantity may be grouped only where units are
  comparable; money/notional/P&L must stay in one trade-currency partition and
  must not treat account base currency as an FX conversion.
- **Baseline/bucket risk:** A rolling, lifetime, account-specific, or
  user-target baseline changes the answer. Unapproved thresholds can turn a
  descriptive group into an invented conclusion.
- **Sequence risk:** Prior-trade outcome, close order, same-account/ticker
  scope, flats, open positions, unresolved decisions, and equal size each
  change “after,” escalation, and reduction results.
- **Population/fee risk:** Performance or profit ratios require one identical
  eligible population and declared gross/net fee basis. Missing fees cannot be
  hidden by a net result.
- **Privacy/account risk:** Account, broker, raw execution, source, and private
  identifier facts remain server-authorized; aggregate answers and artifacts do
  not expose them.
- **Causation and sample risk:** Small bucket/sequence groups need counts and
  coverage. Association does not prove that a win/loss caused size change or
  that changing size improves results.

## 3.4 Repository Evidence

The following privacy-safe evidence was reviewed without accessing private
Journal values, broker identifiers, tokens, statements, or database content.

| Repository path | What it proves for this planning record |
|---|---|
| `docs/migration/traderslink_ai_language_inventory_master.md` | Required category workflow, exact Category 6 file/order, controlling-inventory rule, capability vocabulary, and Markdown-only boundary. |
| `docs/migration/category_completion_template_example.md` | Required metadata and Sections 1-11, status vocabulary, evidence classification, deferred-deliverable structure, checklist, review, and change-log conventions. |
| `docs/migration/language-inventory/categories/01-intents.md` | Locked intent, account-scope, planned-Chat, ambiguity, no-invention, open-trade, and policy conventions. |
| `docs/migration/language-inventory/categories/02-metrics-profit-loss.md` | Locked P/L gross/net, ready-closed, fee, currency, display, partial-coverage, and `profit_per_share` ownership boundaries. |
| `docs/migration/language-inventory/categories/03-metrics-outcomes.md` | Locked outcome, realized-population, ending sequence, date/timezone, and no-causation boundaries used by later prior-outcome analysis. |
| `docs/migration/language-inventory/categories/04-metrics-edge-quality.md` | Existing quality/edge ownership and requirement not to interpret descriptive size relationships as edge or causation. |
| `docs/migration/language-inventory/categories/05-metrics-fees-costs.md` | Exact complete-fee/net-coverage policy and the locked entered-share denominator: position-increasing allocated quantity for `opening`, `adding`, and `flip_opening`. Category 6 adopts and owns this boundary for size/exposure metric semantics. |
| `docs/migration/traderslink_ai_chatbot_complete_language_plan.md` section 5.5 | The exact ordered 14-name Size and Exposure list; no additions, removals, aliases, or runtime claim are authorized here. |
| `docs/migration/analytics-capability-catalog.md` | Conditional quantity/notional evidence, proposed maximum-absolute-open-quantity position-size semantics, Stock-only money basis, currency separation, and unavailable account/market fact families. |
| `docs/migration/phase-4-core-analytics-plan.md` sections 8, 10, 12, and 13 | Exact allocation roles, entered versus maximum-position quantity, entry notional, Stock multiplier-one rule, ready/open/decision coverage, single currency/timezone partitions, filters/groupings, result contract, and review-signal limits. |
| `docs/migration/phase-4-core-analytics-progress.md` | Accepted deterministic implementation: exact math, current allocation/coverage foundation, conditional quantity/notional metrics, open/decision containment, privacy-safe aggregation, and no active Chat runtime. |

Evidence interpretation: accepted deterministic analytics establishes the
maximum-absolute-open-quantity formula, Stock multiplier-one money eligibility,
exact quantity/money math, exact median and zero handling, one-currency and
account-timezone partitions, `ready_closed` realized values with legitimate-
open/decision coverage, fee-complete net basis, stable close ordering and
ties, and maximum-position/entered-quantity/entry-notional filter and grouping
primitives. It conditionally supports `average_position_size` and
`median_position_size`. It does not establish the remaining named canonical
metrics or resolve the future boundaries below.

## 3.5 Accepted Evidence and Remaining Controller Decisions

### Accepted evidence that is not being reopened

1. **Position quantity and asset eligibility:** Position size uses each
   eligible round trip's maximum absolute running position quantity. Current
   money eligibility is Stock multiplier one; unsupported unit/multiplier
   cases fail closed rather than changing the accepted formula.
2. **Exactness and partitions:** Quantity and money math remain exact; median,
   zero-denominator, and display-rounding rules are already accepted. Money
   stays in one currency partition, and date attribution/order stays in the
   authorized account-timezone partition.
3. **Population and fees:** Realized size-performance values use
   `ready_closed`; legitimate-open and `needs_decision` rows remain separately
   visible coverage. Net P/L requires the accepted fee-complete population and
   does not silently mix incomplete rows.
4. **Ordering and ties:** Existing deterministic close ordering and stable tie
   behavior remain the factual order foundation. Future predecessor scope or
   barrier rules may narrow that order but must not replace it.
5. **Existing query primitives:** Maximum-position, entered-quantity, and
   entry-notional filter/group primitives, including the accepted size-bucket
   grouping capability, are existing deterministic building blocks. Their
   existence does not choose the default size semantic, threshold set, or P/L
   contract for `performance_by_size_bucket`.

### Controller-accepted Category 6 semantic decisions

1. **Purchased/sold phrase mapping:** `shares_purchased` is the exact sum of
   accepted Stock Buy execution-side quantities and `shares_sold` is the exact
   sum of accepted Stock Sell execution-side quantities. They are not entered
   or exited allocation quantities. Short entries, covers, reductions, and
   flips retain their factual execution side without reinterpretation.
2. **Maximum position size:** `maximum_position_size` is the maximum across
   eligible per-round-trip maximum absolute open quantities. This exact formula
   is accepted, while the canonical name remains `Planned` because the named
   capability/compatibility mapping is not currently exposed.

### Genuine future/controller boundaries

1. **Dollar exposure:** Approve one denominator and time point. Entry notional,
   peak execution-derived cost/notional, marked market value, equity exposure,
   margin, and buying-power use are not interchangeable.
2. **Normal size:** Approve a user-saved effective-dated target or an exact
   historical baseline, including lookback, subject-trade exclusion, account/
   instrument/direction scope, and missing/zero handling.
3. **Default size-bucket contract:** Choose the default semantic among accepted
   maximum-position, entered-quantity, or entry-notional grouping primitives;
   approve thresholds and the Category 2 gross or fee-complete net P/L result
   contract. Existing group support does not supply these defaults.
4. **Predecessor scope and barriers:** Keep accepted stable close ordering, then
   decide same-account/ticker versus broader scope, selected outcome basis,
   flat treatment, and whether legitimate-open or `needs_decision` rows form
   barriers. They must not be skipped invisibly.
5. **Escalation/reduction:** Approve the compared size basis, exact delta or
   percentage formula, equality state, fractional handling, applicable
   transitions, and count/rate denominator.
6. **Profit per dollar exposed:** Approve one exposure denominator and declared
   gross or fee-complete net P/L basis over the identical `ready_closed`
   population. Zero, unknown, unsupported, or mixed-currency denominators remain
   unavailable; this is not account return.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

The 14 names below preserve Section 5.5 order exactly. `Supported` means an
existing conditional deterministic capability with the declared fact and
coverage policy, not an AI Chat handler. `Planned` means the named metric has a
draft evidence path but is not currently exposed as that canonical capability.
`Unavailable` means an essential factual or controller-approved contract is
absent. The controller accepted this exact inventory and these statuses for
Section 5 production. The controller approved and locked the category at
Version 1 after comprehensive review.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Evidence classification | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|---|
| 1 | C6-SIZE-001 | shares_purchased | Shares purchased | execution_side_volume | directly observed and deterministically derived | Planned | Exact accepted Stock Buy execution-side quantity total. It includes factual Buy-side activity as scoped and must not be substituted with entered quantity; no named capability is exposed. |
| 2 | C6-SIZE-002 | shares_sold | Shares sold | execution_side_volume | directly observed and deterministically derived | Planned | Exact accepted Stock Sell execution-side quantity total. It includes factual Sell-side activity as scoped and must not be substituted with exited quantity; no named capability is exposed. |
| 3 | C6-SIZE-003 | average_position_size | Average position size | maximum_open_quantity_aggregate | deterministically derived | Supported | Current conditional metric: arithmetic mean of each eligible Stock round trip's maximum absolute running position quantity. Incomplete quantity/allocation coverage remains partial or unavailable; no Chat route exists. |
| 4 | C6-SIZE-004 | median_position_size | Median position size | maximum_open_quantity_aggregate | deterministically derived | Supported | Current conditional metric: exact median of each eligible Stock round trip's maximum absolute running position quantity, with deterministic display rounding only. No Chat route exists. |
| 5 | C6-SIZE-005 | maximum_position_size | Maximum position size | maximum_open_quantity_extremum | deterministically derived | Planned | Accepted formula: maximum across eligible per-round-trip maximum absolute open quantities. Existing `maximum_share_quantity` evidence supports the primitive, but the named canonical capability/compatibility mapping is not exposed. |
| 6 | C6-SIZE-006 | average_dollar_exposure | Average dollar exposure | exposure_notional_aggregate | deterministically derived | Unavailable | “Dollar exposure” has no approved denominator/time-point definition. Current entry notional is not generic market, equity, margin, or peak exposure; no FX/multiplier/mark fallback is allowed. |
| 7 | C6-SIZE-007 | maximum_dollar_exposure | Maximum dollar exposure | exposure_notional_extremum | deterministically derived | Unavailable | Same missing approved exposure basis as C6-SIZE-006. No current contract proves peak market value, account utilization, or marked exposure. |
| 8 | C6-SIZE-008 | size_relative_to_normal_size | Size relative to normal size | baseline_relative_size | proxy-based and deterministically derived | Unavailable | Requires a controller-approved, versioned personal/historical baseline, scope, lookback, subject-trade inclusion rule, and zero/missing-baseline handling. Current facts do not establish “normal.” |
| 9 | C6-SIZE-009 | performance_by_size_bucket | Performance by size bucket | grouped_size_performance | proxy-based and deterministically derived | Planned | Accepted size-bucket grouping and maximum-position/entered-quantity/entry-notional filter/group primitives exist. The named metric remains Planned because no default size basis, thresholds, or Category 2 gross/fee-complete net P/L contract is approved. |
| 10 | C6-SIZE-010 | size_after_wins | Size after wins | outcome_sequence_size | proxy-based and deterministically derived | Planned | Requires Category 3 outcome basis and controller-approved predecessor/order/barrier rules. Current facts can support a future sequence calculation, but no named metric/runtime contract exists. |
| 11 | C6-SIZE-011 | size_after_losses | Size after losses | outcome_sequence_size | proxy-based and deterministically derived | Planned | Requires Category 3 outcome basis and controller-approved predecessor/order/barrier rules. Existing review-signal evidence must not be presented as a supported metric or motive claim. |
| 12 | C6-SIZE-012 | size_escalation | Size escalation | position_size_transition | proxy-based and deterministically derived | Planned | The accepted maximum-position facts and stable close order can support a future comparison; exact delta/percentage formula, equality state, applicable transitions, and denominator remain controller decisions. |
| 13 | C6-SIZE-013 | size_reduction | Size reduction | position_size_transition | proxy-based and deterministically derived | Planned | The accepted maximum-position facts and stable close order can support a future comparison where size decreases. Exact formula, equality state, applicable transitions, and denominator remain controller decisions; this is distinct from reducing one open position within a round trip. |
| 14 | C6-SIZE-014 | profit_per_dollar_exposed | Profit per dollar exposed | exposure_normalized_realized_pnl | deterministically derived | Unavailable | Requires one approved execution-derived exposure denominator plus declared gross or fee-complete net P/L basis, identical ready-closed population, one currency, and zero/unknown-denominator handling. It is not account return. |

## Proposed Inventory Additions

None proposed. Entered quantity, exited quantity, maximum position quantity,
entry notional, market value, account utilization, buying power, margin,
position risk, and average execution quantity are evidence terms or concepts
owned outside this exact Section 5.5 inventory.

## Proposed Removals or Merges

None proposed. The following accepted or still-open distinctions are not
permissions to rename, merge, omit, or add canonical items:

| Plan-listed name | Related concept | Boundary that must remain explicit |
|---|---|---|
| `shares_purchased` / `shares_sold` | entered / exited quantities | Accepted execution-side Buy/Sell totals differ from entered/exited allocation quantities for short entries, covers, reductions, and flips. |
| `average_position_size` / `median_position_size` / `maximum_position_size` | per-round-trip maximum open quantity | All three use the accepted maximum-absolute-open-quantity basis; `maximum_position_size` remains Planned only because its named capability/compatibility mapping is not exposed. |
| `average_dollar_exposure` / `maximum_dollar_exposure` | entry notional, marked market value, account/equity exposure | These are different bases with different timing, currency, market, and account facts. None is a safe alias for another. |
| `size_relative_to_normal_size` | historical median or trader target | A baseline must be approved and versioned; no inferred “normal” label is safe. |
| `performance_by_size_bucket` | accepted size-bucket and quantity/notional grouping primitives | The primitive exists, but it does not select the default size semantic, thresholds, or gross/fee-complete net P/L performance contract. |
| `size_after_wins` / `size_after_losses` | `size_escalation` / `size_reduction` | Outcome-conditioned level/aggregate requests differ from a transition-direction classification; both require explicit sequence policy. |
| `profit_per_dollar_exposed` | `return_on_entry_notional`, account return | Its denominator is not yet defined and must not silently reuse either concept. |

---

# 5. Canonical Inventory Deliverable

**Progress:** All 14 canonical records passed comprehensive independent review,
were controller accepted, and are approved and locked at Version 1.

All exact calculations retain source precision and round only for display.
Displayed trading-data decimals use at most two places under the accepted
half-up presentation policy; stored and returned exact facts/rationals remain
lossless. Server-authorized scope is mandatory. Incompatible account timezone,
currency, asset-unit, or multiplier partitions remain separate or unavailable.

## `shares_purchased`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-001 |
| Category | Position Size and Exposure Metrics |
| Subcategory | execution_side_volume |
| Canonical name | shares_purchased |
| Display name | Shares purchased |
| Exact definition | Sum the exact total execution quantity once for every current accepted Stock execution in the server-authorized query scope whose normalized execution side is Buy. Use the full execution-side quantity, not allocated entered/exited fragments; short covers, short reductions, and Buy-side flips remain Buy activity. |
| Distinction from related concepts | This is execution-side Buy volume. It is not entered quantity, long-entry quantity, maximum open position, current shares held, average shares per execution, or shares exited from a short. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Planned |
| Result units | Exact Stock shares in one compatible share-unit partition; display at most two decimal places without changing the exact value |
| Open-trade support | Yes for factual accepted Buy executions when the activity scope includes them. Keep `ready_closed`, factually `legitimate_open`, and `needs_decision` coverage visibly partitioned; never call open/decision activity realized performance or silently use unresolved rows to repair a position. |
| Fee handling | Fees are not required and do not change execution-side quantity. A later P/L comparison must independently declare gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: Execution-side share activity.
- Narrower concepts: Buy executions opening/adding long exposure; Buy
  executions reducing/closing short exposure; Buy-side flip executions.
- Commonly confused concepts: Entered shares, exited shares, current quantity,
  maximum position quantity, total execution count.
- Must not be merged with: `shares_sold`, entered quantity, or
  `average_position_size`.

The result uses only server-authorized accepted current executions. Date
attribution uses the declared account timezone. Multiple accounts or asset
units may be combined only under an explicitly compatible partition; account,
source, execution, and private identifiers are not exposed in aggregate output.
No sample-size or causation conclusion follows from purchased volume.

## `shares_sold`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-002 |
| Category | Position Size and Exposure Metrics |
| Subcategory | execution_side_volume |
| Canonical name | shares_sold |
| Display name | Shares sold |
| Exact definition | Sum the exact total execution quantity once for every current accepted Stock execution in the server-authorized query scope whose normalized execution side is Sell. Use the full execution-side quantity, not allocated entered/exited fragments; short entries, short adds, and Sell-side flips remain Sell activity. |
| Distinction from related concepts | This is execution-side Sell volume. It is not exited quantity, long-exit quantity, maximum open position, current shares held, average shares per execution, or shares entered into a short. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Planned |
| Result units | Exact Stock shares in one compatible share-unit partition; display at most two decimal places without changing the exact value |
| Open-trade support | Yes for factual accepted Sell executions when the activity scope includes them. Keep `ready_closed`, factually `legitimate_open`, and `needs_decision` coverage visibly partitioned; never call open/decision activity realized performance or silently use unresolved rows to repair a position. |
| Fee handling | Fees are not required and do not change execution-side quantity. A later P/L comparison must independently declare gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: Execution-side share activity.
- Narrower concepts: Sell executions reducing/closing long exposure; Sell
  executions opening/adding short exposure; Sell-side flip executions.
- Commonly confused concepts: Entered shares, exited shares, current quantity,
  maximum position quantity, total execution count.
- Must not be merged with: `shares_purchased`, exited quantity, or
  `average_position_size`.

The result uses only server-authorized accepted current executions. Date
attribution uses the declared account timezone. Multiple accounts or asset
units may be combined only under an explicitly compatible partition; account,
source, execution, and private identifiers are not exposed in aggregate output.
No sample-size or causation conclusion follows from sold volume.

## `average_position_size`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-003 |
| Category | Position Size and Exposure Metrics |
| Subcategory | maximum_open_quantity_aggregate |
| Canonical name | average_position_size |
| Display name | Average position size |
| Exact definition | For every eligible `ready_closed` Stock round trip, calculate its maximum absolute running position quantity after each accepted allocation. Sum those exact per-round-trip maxima and divide by the eligible round-trip count. Preserve the exact rational; a zero eligible count returns unavailable under the accepted zero-denominator policy. |
| Distinction from related concepts | This averages one maximum-open-quantity value per round trip. It is not average execution quantity, entered quantity, end quantity, dollar exposure, average cost, or current open-position size. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact rational Stock shares; display at most two decimal places using accepted half-up rounding |
| Open-trade support | Current realized aggregate uses `ready_closed` only. Factually `legitimate_open` positions and `needs_decision` chains remain separate coverage and are not included in the realized average. |
| Fee handling | Gross/net fee basis is not applicable to the quantity calculation. If performance is compared by size, the separate performance metric must declare gross or fee-complete net basis over an identical eligible population. |
| Version | 1 |

### Related Concepts

- Broader concept: Position-size distribution.
- Narrower concepts: Average maximum absolute open quantity for an eligible
  Stock round-trip population.
- Commonly confused concepts: `average_share_quantity`, average entered shares,
  average execution size, average dollar exposure, current open quantity.
- Must not be merged with: `median_position_size`,
  `maximum_position_size`, or `average_dollar_exposure`.

The scope must remain server-authorized and within compatible account,
account-timezone, and Stock share-unit partitions. Quantity is exact and does
not require currency conversion. Coverage and eligible sample count must be
shown; a small sample cannot support an edge, cause, or sizing recommendation.

## `median_position_size`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-004 |
| Category | Position Size and Exposure Metrics |
| Subcategory | maximum_open_quantity_aggregate |
| Canonical name | median_position_size |
| Display name | Median position size |
| Exact definition | For every eligible `ready_closed` Stock round trip, calculate its maximum absolute running position quantity after each accepted allocation, sort those exact values deterministically, and return the exact middle value for an odd count or the exact arithmetic midpoint of the two middle values for an even count. A zero eligible count returns unavailable. |
| Distinction from related concepts | This is the median of one maximum-open-quantity value per round trip. It is not a historical “normal size” baseline, an average, an extremum, entered quantity, dollar exposure, or a percentile chosen by approximation. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Exact decimal/rational Stock shares; display at most two decimal places using accepted half-up rounding |
| Open-trade support | Current realized aggregate uses `ready_closed` only. Factually `legitimate_open` positions and `needs_decision` chains remain separate coverage and are not included in the realized median. |
| Fee handling | Gross/net fee basis is not applicable to the quantity calculation. If performance is compared by size, the separate performance metric must declare gross or fee-complete net basis over an identical eligible population. |
| Version | 1 |

### Related Concepts

- Broader concept: Position-size distribution.
- Narrower concepts: Median maximum absolute open quantity for an eligible
  Stock round-trip population.
- Commonly confused concepts: Normal size, average position size, median
  entered quantity, median execution size, median dollar exposure.
- Must not be merged with: `average_position_size`,
  `maximum_position_size`, or `size_relative_to_normal_size`.

The scope must remain server-authorized and within compatible account,
account-timezone, and Stock share-unit partitions. Quantity is exact and does
not require currency conversion. Coverage and eligible sample count must be
shown; the median is descriptive and cannot establish normality, causation,
edge, or a sizing recommendation.

## `maximum_position_size`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-005 |
| Category | Position Size and Exposure Metrics |
| Subcategory | maximum_open_quantity_extremum |
| Canonical name | maximum_position_size |
| Display name | Maximum position size |
| Exact definition | For every eligible `ready_closed` Stock round trip, calculate its maximum absolute running position quantity after each accepted allocation, then return the greatest exact per-round-trip value across the eligible population. A zero eligible population returns unavailable. |
| Distinction from related concepts | This is the population maximum of per-round-trip maximum open quantity. It is not one execution's quantity, entered quantity, a dollar/notional maximum, the current open position, or a ranking that emits private trade identifiers. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Exact Stock shares; display at most two decimal places without changing the exact value |
| Open-trade support | Current named definition uses eligible `ready_closed` round trips. Factually `legitimate_open` positions and `needs_decision` chains remain visible coverage and are not included in this realized-population extremum. |
| Fee handling | Gross/net fee basis is not applicable to the quantity calculation. A later performance comparison must independently declare gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: Position-size distribution extrema.
- Narrower concepts: Greatest maximum absolute open quantity in the selected
  eligible Stock round-trip population.
- Commonly confused concepts: `maximum_share_quantity` compatibility metric,
  largest execution, maximum entered quantity, maximum dollar exposure,
  current open quantity.
- Must not be merged with: `maximum_dollar_exposure`,
  `average_position_size`, or `shares_purchased`/`shares_sold`.

The maximum-absolute-open-quantity formula is controller accepted. Capability
status remains Planned because `maximum_position_size` is not exposed as the
named canonical capability/approved compatibility mapping. Server-authorized
scope, compatible account/timezone/Stock-unit partitions, exact math,
coverage, deterministic ties, and privacy-safe output remain mandatory. A
single maximum does not prove typical size, causation, or advisable size.

## `average_dollar_exposure`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-006 |
| Category | Position Size and Exposure Metrics |
| Subcategory | exposure_notional_aggregate |
| Canonical name | average_dollar_exposure |
| Display name | Average dollar exposure |
| Exact definition | Recognize a request for the arithmetic mean of monetary exposure per eligible position under one explicit approved exposure basis and time point. No such generic dollar-exposure basis or time point is currently approved, so the metric must return Unavailable without calculating a value. |
| Distinction from related concepts | Generic dollar exposure is not automatically entry notional, peak execution-derived cost/notional, marked market value, equity percentage, margin, buying power, portfolio gross/net exposure, or account return. None is a fallback. |
| Evidence classification | deterministically derived |
| Capability status | Unavailable |
| Result units | Money in one declared trade-currency partition only after a future approved exposure contract; currently unavailable |
| Open-trade support | Unavailable for both `ready_closed` and factually `legitimate_open` positions because the exposure basis/time point is absent. `needs_decision` remains separate coverage and is never inferred as exposure. |
| Fee handling | Fees do not define exposure. Any later performance relationship must separately select gross or fee-complete net P/L over an identical `ready_closed` population. |
| Version | 1 |

### Related Concepts

- Broader concept: Monetary exposure.
- Narrower concepts: None approved; a future contract must name its basis and
  time point.
- Commonly confused concepts: Entry notional, maximum dollar exposure, marked
  position value, equity utilization, margin, buying-power use.
- Must not be merged with: `average_position_size`, `average_entry_notional`,
  `return_on_entry_notional`, or account exposure/return.

No entry-notional, current-mark, equity, FX, margin, or model-estimated fallback
is allowed. Stock multiplier-one eligibility, one currency, server-authorized
compatible account/timezone partitions, exact math, zero handling, and coverage
remain requirements for any future formula. No sample, causal, or advice claim
may be produced from an unavailable result.

## `maximum_dollar_exposure`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-007 |
| Category | Position Size and Exposure Metrics |
| Subcategory | exposure_notional_extremum |
| Canonical name | maximum_dollar_exposure |
| Display name | Maximum dollar exposure |
| Exact definition | Recognize a request for the greatest monetary exposure reached by an eligible position under one explicit approved exposure basis and time point. No such generic dollar-exposure basis or observation-time contract is currently approved, so the metric must return Unavailable without calculating a value. |
| Distinction from related concepts | Generic maximum dollar exposure is not automatically maximum entry notional, peak execution-derived cost/notional, highest marked market value, maximum equity percentage, margin, buying-power use, or maximum share quantity. None is a fallback. |
| Evidence classification | deterministically derived |
| Capability status | Unavailable |
| Result units | Money in one declared trade-currency partition only after a future approved exposure contract; currently unavailable |
| Open-trade support | Unavailable for both `ready_closed` and factually `legitimate_open` positions because the exposure basis/observation-time contract is absent. `needs_decision` remains separate coverage and is never inferred as exposure. |
| Fee handling | Fees do not define exposure. Any later performance relationship must separately select gross or fee-complete net P/L over an identical `ready_closed` population. |
| Version | 1 |

### Related Concepts

- Broader concept: Monetary exposure extrema.
- Narrower concepts: None approved; a future contract must name its basis,
  observation interval, and time point.
- Commonly confused concepts: Entry notional, average dollar exposure, marked
  position value, equity utilization, margin, buying-power use.
- Must not be merged with: `maximum_position_size`, `maximum_entry_notional`,
  `return_on_entry_notional`, or account exposure/return.

No entry-notional, current-mark, equity, FX, margin, or model-estimated fallback
is allowed. Stock multiplier-one eligibility, one currency, server-authorized
compatible account/timezone partitions, exact math, deterministic extrema/ties,
zero/empty handling, and coverage remain requirements for any future formula.
No single maximum supports a causal, typical-size, edge, or advice claim.

## `size_relative_to_normal_size`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-008 |
| Category | Position Size and Exposure Metrics |
| Subcategory | baseline_relative_size |
| Canonical name | size_relative_to_normal_size |
| Display name | Size relative to normal size |
| Exact definition | Recognize a request to express a declared position-size measure relative to one approved normal-size baseline over a compatible scope and effective period. No normal-size baseline, default size numerator, or relative-value formula is approved, so the metric must return Unavailable without calculating a value. |
| Distinction from related concepts | “Normal” is not automatically the current population median, lifetime average, recent rolling size, trader target, account percentage, or maximum position. The supported `median_position_size` metric is descriptive and does not become a personal baseline. |
| Evidence classification | proxy-based and deterministically derived |
| Capability status | Unavailable |
| Result units | Not established; any future ratio, percentage, delta, or size-unit result requires an approved formula and compatible unit partition |
| Open-trade support | Unavailable for both `ready_closed` and factually `legitimate_open` positions because the baseline and formula are absent. `needs_decision` remains separately visible coverage and cannot supply or alter “normal.” |
| Fee handling | Fees do not establish a normal-size baseline. Any future performance interpretation must independently select Category 2 gross or fee-complete net P/L over an identical eligible `ready_closed` population. |
| Version | 1 |

### Related Concepts

- Broader concept: Baseline-relative position size.
- Narrower concepts: None approved; a future baseline must define its source,
  effective period, scope, size measure, and relation formula.
- Commonly confused concepts: `median_position_size`, average position size,
  trader-planned size, account utilization, size bucket.
- Must not be merged with: `performance_by_size_bucket`,
  `size_escalation`, or a trader-entered risk target.

Accepted exact maximum-position, median, filter/group, and stable partition
primitives are evidence only; none defines “normal.” Server-authorized scope,
compatible account/timezone/unit partitions, exact math, missing/zero-baseline
handling, visible coverage, and privacy-safe output remain mandatory for any
future contract. An unavailable or small-sample comparison cannot establish
discipline, intent, edge, causation, or advice.

## `performance_by_size_bucket`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-009 |
| Category | Position Size and Exposure Metrics |
| Subcategory | grouped_size_performance |
| Canonical name | performance_by_size_bucket |
| Display name | Performance by size bucket |
| Exact definition | Recognize a request to group one identical eligible `ready_closed` Stock population by an explicitly declared size basis and bucket contract, then report an explicitly declared Category 2 realized performance metric for each group. Accepted grouping primitives exist, but no default size basis, thresholds, or P/L contract is approved; the named metric remains Planned. |
| Distinction from related concepts | A maximum-position, entered-quantity, or entry-notional filter/group primitive is not itself a default bucket definition. Grouped historical performance is not `size_relative_to_normal_size`, account exposure, an optimal-size recommendation, or proof that size caused the result. |
| Evidence classification | proxy-based and deterministically derived |
| Capability status | Planned |
| Result units | Units of the explicitly selected Category 2 metric per declared bucket; money remains in one currency partition and exact values round only for display |
| Open-trade support | Realized bucket performance uses one identical `ready_closed` population. Factually `legitimate_open` positions and `needs_decision` chains remain visible coverage and are not included or silently skipped into realized group values. |
| Fee handling | The result must explicitly select Category 2 gross P/L or fee-complete net P/L. Net groups use the identical fee-complete population and expose omitted/incomplete coverage; no mixed gross/net group comparison is allowed. |
| Version | 1 |

### Related Concepts

- Broader concept: Grouped realized performance.
- Narrower concepts: Performance under a future explicit maximum-position,
  entered-quantity, or entry-notional bucket contract.
- Commonly confused concepts: Quantity/notional range filter, normal size,
  account exposure, return on entry notional, largest-position ranking.
- Must not be merged with: `size_relative_to_normal_size`,
  `profit_per_dollar_exposed`, or an optimal-size recommendation.

The accepted maximum-position, entered-quantity, entry-notional, and
size-grouping primitives establish feasibility only. Bucket basis, inclusive
thresholds, default P/L metric, and presentation are still unapproved.
Server-authorized compatible account/currency/timezone/unit partitions, exact
math, deterministic group reconciliation, empty/zero behavior, eligible and
covered counts, and privacy-safe output remain required. Every bucket must show
sample size and limitations; association cannot support causation or advice.

## `size_after_wins`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-010 |
| Category | Position Size and Exposure Metrics |
| Subcategory | outcome_sequence_size |
| Canonical name | size_after_wins |
| Display name | Size after wins |
| Exact definition | Recognize a request to summarize an explicitly selected position-size measure for eligible `ready_closed` Stock trades that follow a winning predecessor under Category 3's selected-basis outcome contract and a future approved predecessor-scope/barrier rule. Stable close ordering exists, but predecessor scope and barriers are unresolved; the named metric remains Planned. |
| Distinction from related concepts | This is an outcome-conditioned size summary, not automatically a size increase, escalation count, same-ticker sequence, next execution, streak, motive, or causal effect of winning. |
| Evidence classification | proxy-based and deterministically derived |
| Capability status | Planned |
| Result units | Units of the explicitly selected approved size metric within compatible unit/currency partitions; no default size measure or aggregate is implied |
| Open-trade support | The realized sequence population is `ready_closed`. Factually `legitimate_open` positions and `needs_decision` rows remain visible and may be barriers only under a future approved rule; they must not be invisibly skipped or classified as wins. |
| Fee handling | The predecessor win must use Category 3's explicitly selected Category 2 gross basis or fee-complete net basis. Net outcome sequencing uses an identical fee-complete `ready_closed` population and preserves incomplete-fee coverage. |
| Version | 1 |

### Related Concepts

- Broader concept: Outcome-conditioned size sequence.
- Narrower concepts: None until predecessor scope, barriers, size measure, and
  aggregate are approved.
- Commonly confused concepts: `size_escalation`, winning streak, size during a
  winning trade, next execution size, same-ticker re-entry.
- Must not be merged with: `size_after_losses`, `size_escalation`, or a
  behavioral motive label.

Accepted stable close order, outcome, and maximum-position primitives provide
evidence only; they do not select predecessor scope, flat/open/decision
barriers, ticker scope, size basis, or summary formula. Server-authorized
compatible account/currency/timezone/unit partitions, exact math, zero/empty
handling, deterministic ties, coverage, and sample counts remain required.
Historical association cannot establish that a win caused a size choice or
support sizing advice.

## `size_after_losses`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-011 |
| Category | Position Size and Exposure Metrics |
| Subcategory | outcome_sequence_size |
| Canonical name | size_after_losses |
| Display name | Size after losses |
| Exact definition | Recognize a request to summarize an explicitly selected position-size measure for eligible `ready_closed` Stock trades that follow a losing predecessor under Category 3's selected-basis outcome contract and a future approved predecessor-scope/barrier rule. Stable close ordering exists, but predecessor scope and barriers are unresolved; the named metric remains Planned. |
| Distinction from related concepts | This is an outcome-conditioned size summary, not automatically a size increase, reduction, revenge/tilt signal, same-ticker sequence, next execution, streak, or causal effect of losing. |
| Evidence classification | proxy-based and deterministically derived |
| Capability status | Planned |
| Result units | Units of the explicitly selected approved size metric within compatible unit/currency partitions; no default size measure or aggregate is implied |
| Open-trade support | The realized sequence population is `ready_closed`. Factually `legitimate_open` positions and `needs_decision` rows remain visible and may be barriers only under a future approved rule; they must not be invisibly skipped or classified as losses. |
| Fee handling | The predecessor loss must use Category 3's explicitly selected Category 2 gross basis or fee-complete net basis. Net outcome sequencing uses an identical fee-complete `ready_closed` population and preserves incomplete-fee coverage. |
| Version | 1 |

### Related Concepts

- Broader concept: Outcome-conditioned size sequence.
- Narrower concepts: None until predecessor scope, barriers, size measure, and
  aggregate are approved.
- Commonly confused concepts: `size_reduction`, `size_escalation`, losing
  streak, size during a losing trade, same-ticker re-entry.
- Must not be merged with: `size_after_wins`, `size_escalation`,
  `size_reduction`, or a revenge/tilt label.

Accepted stable close order, outcome, review-signal, and maximum-position
primitives provide evidence only; they do not select predecessor scope,
flat/open/decision barriers, ticker scope, size basis, threshold, or summary
formula. Server-authorized compatible account/currency/timezone/unit
partitions, exact math, zero/empty handling, deterministic ties, coverage, and
sample counts remain required. Historical association cannot establish motive,
cause, discipline, or sizing advice.

## `size_escalation`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-012 |
| Category | Position Size and Exposure Metrics |
| Subcategory | position_size_transition |
| Canonical name | size_escalation |
| Display name | Size escalation |
| Exact definition | Recognize a request to identify or summarize eligible ordered transitions classified as an increase in position size under a future approved size basis, transition formula, equality rule, applicable-transition scope, and denominator. Accepted stable close order and maximum-position primitives exist, but none selects that contract; the named metric remains Planned. |
| Distinction from related concepts | Escalation is a between-trade size-transition classification under an approved formula. It is not adding to one open position, total shares purchased, a size-after-win/loss summary, a motive label, or any positive size difference inferred without the missing contract. |
| Evidence classification | proxy-based and deterministically derived |
| Capability status | Planned |
| Result units | Not established; any future count, rate, exact size delta, or relative change requires an approved transition formula and denominator |
| Open-trade support | The realized transition population uses eligible `ready_closed` rows. Factually `legitimate_open` and `needs_decision` rows remain visible and may be barriers only under an approved rule; they are not silently skipped or classified. |
| Fee handling | Fees do not define a size transition. If transitions are conditioned on outcome or compared by performance, Category 3 selected outcomes and Category 2 gross or fee-complete net P/L must use the identical eligible `ready_closed` population. |
| Version | 1 |

### Related Concepts

- Broader concept: Ordered position-size transition.
- Narrower concepts: None until size basis, transition formula, equality,
  scope, and denominator are approved.
- Commonly confused concepts: Scale-in/add execution, `size_after_wins`,
  `size_after_losses`, larger bucket, total Buy volume.
- Must not be merged with: `size_reduction`, position adding, or a
  risk-taking/behavior label.

Accepted stable close ordering, ties, maximum-position facts, exact math, and
filter/group primitives are evidence only; no delta, percentage, threshold,
denominator, or predecessor barrier is inferred. Server-authorized compatible
account/currency/timezone/unit partitions, zero/empty handling, open/decision
coverage, and sample counts remain mandatory. An escalation association cannot
establish intent, causation, poor discipline, future risk, or advice.

## `size_reduction`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-013 |
| Category | Position Size and Exposure Metrics |
| Subcategory | position_size_transition |
| Canonical name | size_reduction |
| Display name | Size reduction |
| Exact definition | Recognize a request to identify or summarize eligible ordered transitions classified as a decrease in position size under a future approved size basis, transition formula, equality rule, applicable-transition scope, and denominator. Accepted stable close order and maximum-position primitives exist, but none selects that contract; the named metric remains Planned. |
| Distinction from related concepts | Reduction here is a between-trade size-transition classification under an approved formula. It is not reducing/exiting one open position, total shares sold, a size-after-win/loss summary, or any negative size difference inferred without the missing contract. |
| Evidence classification | proxy-based and deterministically derived |
| Capability status | Planned |
| Result units | Not established; any future count, rate, exact size delta, or relative change requires an approved transition formula and denominator |
| Open-trade support | The realized transition population uses eligible `ready_closed` rows. Factually `legitimate_open` and `needs_decision` rows remain visible and may be barriers only under an approved rule; they are not silently skipped or classified. |
| Fee handling | Fees do not define a size transition. If transitions are conditioned on outcome or compared by performance, Category 3 selected outcomes and Category 2 gross or fee-complete net P/L must use the identical eligible `ready_closed` population. |
| Version | 1 |

### Related Concepts

- Broader concept: Ordered position-size transition.
- Narrower concepts: None until size basis, transition formula, equality,
  scope, and denominator are approved.
- Commonly confused concepts: Scale-out/reduction execution,
  `size_after_wins`, `size_after_losses`, smaller bucket, total Sell volume.
- Must not be merged with: `size_escalation`, position reduction/exit, or a
  risk-control/behavior label.

Accepted stable close ordering, ties, maximum-position facts, exact math, and
filter/group primitives are evidence only; no delta, percentage, threshold,
denominator, or predecessor barrier is inferred. Server-authorized compatible
account/currency/timezone/unit partitions, zero/empty handling, open/decision
coverage, and sample counts remain mandatory. A reduction association cannot
establish intent, causation, discipline, future safety, or advice.

## `profit_per_dollar_exposed`

| Field | Value |
|---|---|
| Inventory ID | C6-SIZE-014 |
| Category | Position Size and Exposure Metrics |
| Subcategory | exposure_normalized_realized_pnl |
| Canonical name | profit_per_dollar_exposed |
| Display name | Profit per dollar exposed |
| Exact definition | Recognize a request to divide one explicitly selected Category 2 realized gross or fee-complete net P/L numerator by one approved dollar-exposure denominator over the identical eligible `ready_closed` population. No dollar-exposure denominator or time-point contract is approved, so the metric must return Unavailable without calculating a value. |
| Distinction from related concepts | This is not account return, return on entry notional, profit per share, margin return, equity return, buying-power efficiency, or a permission to use entry notional, marked value, or account equity as an exposure fallback. |
| Evidence classification | deterministically derived |
| Capability status | Unavailable |
| Result units | Exact money-per-money ratio only after an approved same-currency exposure denominator exists; currently unavailable |
| Open-trade support | Realized numerator eligibility is `ready_closed` only. Factually `legitimate_open` positions and `needs_decision` chains remain visible coverage and are not included in realized P/L or inferred exposure. |
| Fee handling | The numerator must explicitly select Category 2 gross P/L or fee-complete net P/L. A net result uses the identical fee-complete population and reports incomplete coverage; fees do not create or substitute for the exposure denominator. |
| Version | 1 |

### Related Concepts

- Broader concept: Exposure-normalized realized performance.
- Narrower concepts: None until one dollar-exposure denominator and time-point
  contract are approved.
- Commonly confused concepts: `return_on_entry_notional`, total return, account
  return, profit per share, buying-power utilization, risk/reward ratio.
- Must not be merged with: `average_dollar_exposure`,
  `maximum_dollar_exposure`, or Category 2 account/entry-notional returns.

Accepted entry-notional, maximum-position, exact-math, and result primitives are
evidence only; none supplies the missing exposure denominator. The numerator
and denominator must use one identical server-authorized compatible account,
currency, account-timezone, Stock multiplier-one, and `ready_closed`
population. Zero, unknown, unsupported, mixed-currency, or fee-incomplete
required inputs return unavailable/partial coverage rather than zero,
infinity, or an estimate. Sample size and limitations remain visible; the
ratio cannot establish edge, cause, optimal size, future performance, or
advice.

---

# 6. Language Registry Deliverable

**Progress:** All 14 language registries are complete, independently passed,
controller accepted, approved, and locked: 14 registries multiplied by 38
required populated subsections equals 532 subsections. Canonical names are
Version 1; no AI
Chat runtime is claimed.

## `shares_purchased` Language Registry

### Exact Definition

- Sum each current accepted Stock Buy execution's exact total execution quantity once within the server-authorized scope. This is Buy-side execution activity, never entered quantity or allocated fragments.

### Formal Wording

- Calculate the total quantity of accepted Stock shares purchased on Buy-side executions.

### Normal Conversational Wording

- How many shares did I buy?; show my total shares purchased.

### Trader Slang

- How many shares did I scoop?; total buys in shares.

### Abbreviations

- `sh bought` and `buy qty` may map only with explicit quantity grammar; bare `B`, `BUY`, `SQ`, or `QTY` is side-, ticker-, or field-shaped and must not auto-route.

### Common Misspellings

- Shares purchsed; shares purcahsed; total shars bought.

### Noisy or Incomplete Input

- bought how many sh; buy qty July; shares bot NVDA.

### Singular and Plural Forms

- Share purchased; shares purchased; purchased share quantity; Buy-share total.

### Full Questions

- How many accepted Stock shares did I purchase for NVDA in the selected period?; what was my Buy-side share quantity?

### Commands

- Calculate shares purchased; show accepted Buy quantity for the selected scope.

### Sentence Fragments

- Shares purchased; total Buy shares; Buy-side quantity.

### Follow-Up Wording

- What about the prior period?; now only the selected ticker; use Sell-side quantity instead.

### Correction Wording

- I meant Buy execution quantity, not shares entered; count each accepted execution once.

### Comparison Wording

- Compare shares purchased between the two declared periods; did I buy more shares in the first group?

### Ranking Wording

- Rank approved ticker groups by shares purchased; show the largest Buy-side share totals.

### Negated Wording

- Do not use entered shares; not Sell quantity; exclude unsupported asset units.

### Exclusion Wording

- Leave out the selected ticker; exclude execution facts outside the accepted scope; do not fold decision rows into realized results.

### Multi-Filter Wording

- Shares purchased for the selected ticker and declared period within my authorized account scope.

### Multi-Part Question Wording

- Show shares purchased, compare the prior period, and report eligible and decision coverage.

### Ambiguous Wording

- “Bought shares” can mean Buy-side execution quantity or shares entered into a position. This canonical metric means execution-side Buy quantity; an explicit entry/exit request belongs to the entered/exited semantic boundary.

### Negative Examples

- How many shares did I enter?; what is my current position?; show my average Buy price; how many contracts did I buy?

### Context Requirements

- Require server-authorized scope, accepted current Stock execution facts, one compatible share-unit partition, and a declared date interpretation in the account timezone. Trusted selected ticker/period context may narrow scope; client-supplied account identifiers cannot.

### Required Data

- Current accepted execution identity/version, normalized Buy side, exact total execution quantity, Stock asset eligibility, timestamp/account timezone, projection/coverage state, and source revision sufficient to count each execution once.

### Optional Data

- Trusted selected ticker, declared period, approved source provenance, and only filters already allowlisted by the eventual deterministic query contract.

### Valid Filters

- Server-authorized account scope plus only an eventual tool's allowlisted ticker, source, period, and factual coverage filters. Execution-time versus round-trip-close date meaning must be declared; no new client account or asset filter is invented here.

### Valid Groupings

- None is approved specifically for this named Planned metric. A future tool may expose only existing approved compatible date, ticker, or provenance groups after its activity-date contract is declared.

### Valid Operators

- Exact sum; supported language operations are calculate, summarize, compare, group, rank, explain, and coverage inspection, subject to a future validated tool contract.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Entered/exited substitution, allocation-fragment double counting, Sell-side substitution, non-Stock/contracts without an approved unit policy, unauthorized account selection, incompatible-unit aggregation, model estimates, causation, advice, or claimed Chat execution.

### Default Interpretation

- Explicit “shares purchased” means exact accepted Stock Buy execution-side quantity total. It never defaults to entered shares, current holdings, contracts, notional, or number of executions.

### Clarification Conditions

- Ask one focused question when “bought” could mean execution-side Buy quantity versus position-entered quantity, or when the date basis is materially unresolved. Resolve only one field at a time.

### Recommended Clarification Wording

- Do you mean total Buy-side execution quantity or shares entered into positions?

### Unsupported Conditions

- Missing/invalid Buy side or quantity, non-Stock/incompatible units, stale or duplicate execution versions, unauthorized scope, or an unsupported date/filter contract returns unavailable or partial coverage rather than an estimate.

### Target Analytics Tool or Query Capability

- Planned metric-language validator and Journal Analytics activity aggregate over accepted execution facts; no current dedicated `shares_purchased` capability or AI Chat route.

### Result Units

- Exact Stock shares in one compatible unit partition; preserve fractional share precision and display at most two decimal places under the accepted half-up presentation policy.

### Fee Handling

- Fees do not change Buy execution quantity. Any performance comparison must independently declare Category 2 gross or fee-complete net P/L over an identical eligible population.

### Open-Trade Handling

- Factual accepted Buy activity may exist in `ready_closed` and factually `legitimate_open` lifecycles. Keep them partitioned; keep `needs_decision` visible under its factual coverage policy and never call open/decision activity realized performance.

### Sample-Size Considerations

- Return execution/eligible/coverage counts with the exact total. Volume alone and any small sample cannot establish intent, overtrading, conviction, edge, causation, or sizing advice.

## `shares_sold` Language Registry

### Exact Definition

- Sum each current accepted Stock Sell execution's exact total execution quantity once within the server-authorized scope. This is Sell-side execution activity, never exited quantity or allocated fragments.

### Formal Wording

- Calculate the total quantity of accepted Stock shares sold on Sell-side executions.

### Normal Conversational Wording

- How many shares did I sell?; show my total shares sold.

### Trader Slang

- How many shares did I dump?; total sells in shares.

### Abbreviations

- `sh sold` and `sell qty` may map only with explicit quantity grammar; bare `S`, `SELL`, `SQ`, or `QTY` is side-, ticker-, or field-shaped and must not auto-route.

### Common Misspellings

- Shares selled; shares slod; total shars sold.

### Noisy or Incomplete Input

- sold how many sh; sell qty July; shares sld NVDA.

### Singular and Plural Forms

- Share sold; shares sold; sold share quantity; Sell-share total.

### Full Questions

- How many accepted Stock shares did I sell for NVDA in the selected period?; what was my Sell-side share quantity?

### Commands

- Calculate shares sold; show accepted Sell quantity for the selected scope.

### Sentence Fragments

- Shares sold; total Sell shares; Sell-side quantity.

### Follow-Up Wording

- What about the prior period?; now only the selected ticker; use Buy-side quantity instead.

### Correction Wording

- I meant Sell execution quantity, not shares exited; count each accepted execution once.

### Comparison Wording

- Compare shares sold between the two declared periods; did I sell more shares in the first group?

### Ranking Wording

- Rank approved ticker groups by shares sold; show the largest Sell-side share totals.

### Negated Wording

- Do not use exited shares; not Buy quantity; exclude unsupported asset units.

### Exclusion Wording

- Leave out the selected ticker; exclude execution facts outside the accepted scope; do not fold decision rows into realized results.

### Multi-Filter Wording

- Shares sold for the selected ticker and declared period within my authorized account scope.

### Multi-Part Question Wording

- Show shares sold, compare the prior period, and report eligible and decision coverage.

### Ambiguous Wording

- “Sold shares” can mean Sell-side execution quantity or shares exited from a position. This canonical metric means execution-side Sell quantity; an explicit entry/exit request belongs to the entered/exited semantic boundary.

### Negative Examples

- How many shares did I exit?; what is my current short position?; show my average Sell price; how many contracts did I sell?

### Context Requirements

- Require server-authorized scope, accepted current Stock execution facts, one compatible share-unit partition, and a declared date interpretation in the account timezone. Trusted selected ticker/period context may narrow scope; client-supplied account identifiers cannot.

### Required Data

- Current accepted execution identity/version, normalized Sell side, exact total execution quantity, Stock asset eligibility, timestamp/account timezone, projection/coverage state, and source revision sufficient to count each execution once.

### Optional Data

- Trusted selected ticker, declared period, approved source provenance, and only filters already allowlisted by the eventual deterministic query contract.

### Valid Filters

- Server-authorized account scope plus only an eventual tool's allowlisted ticker, source, period, and factual coverage filters. Execution-time versus round-trip-close date meaning must be declared; no new client account or asset filter is invented here.

### Valid Groupings

- None is approved specifically for this named Planned metric. A future tool may expose only existing approved compatible date, ticker, or provenance groups after its activity-date contract is declared.

### Valid Operators

- Exact sum; supported language operations are calculate, summarize, compare, group, rank, explain, and coverage inspection, subject to a future validated tool contract.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Entered/exited substitution, allocation-fragment double counting, Buy-side substitution, non-Stock/contracts without an approved unit policy, unauthorized account selection, incompatible-unit aggregation, model estimates, causation, advice, or claimed Chat execution.

### Default Interpretation

- Explicit “shares sold” means exact accepted Stock Sell execution-side quantity total. It never defaults to exited shares, current holdings, contracts, notional, or number of executions.

### Clarification Conditions

- Ask one focused question when “sold” could mean execution-side Sell quantity versus position-exited quantity, or when the date basis is materially unresolved. Resolve only one field at a time.

### Recommended Clarification Wording

- Do you mean total Sell-side execution quantity or shares exited from positions?

### Unsupported Conditions

- Missing/invalid Sell side or quantity, non-Stock/incompatible units, stale or duplicate execution versions, unauthorized scope, or an unsupported date/filter contract returns unavailable or partial coverage rather than an estimate.

### Target Analytics Tool or Query Capability

- Planned metric-language validator and Journal Analytics activity aggregate over accepted execution facts; no current dedicated `shares_sold` capability or AI Chat route.

### Result Units

- Exact Stock shares in one compatible unit partition; preserve fractional share precision and display at most two decimal places under the accepted half-up presentation policy.

### Fee Handling

- Fees do not change Sell execution quantity. Any performance comparison must independently declare Category 2 gross or fee-complete net P/L over an identical eligible population.

### Open-Trade Handling

- Factual accepted Sell activity may exist in `ready_closed` and factually `legitimate_open` lifecycles. Keep them partitioned; keep `needs_decision` visible under its factual coverage policy and never call open/decision activity realized performance.

### Sample-Size Considerations

- Return execution/eligible/coverage counts with the exact total. Volume alone and any small sample cannot establish intent, overtrading, conviction, edge, causation, or sizing advice.

## `average_position_size` Language Registry

### Exact Definition

- For eligible `ready_closed` Stock round trips, compute each maximum absolute running position quantity, sum the exact values, and divide by eligible count; retain the exact rational and return unavailable for a zero denominator.

### Formal Wording

- Calculate the arithmetic mean of per-round-trip maximum absolute open quantities.

### Normal Conversational Wording

- What was my average position size?; on average, what was the most shares I held per closed trade?

### Trader Slang

- What was my usual max size on average?; average full size.

### Abbreviations

- `avg pos size` and `avg max sh` may map with explicit metric grammar; bare `APS`, `AVG`, `POS`, or `SIZE` remains ticker-shaped or ambiguous and must not auto-route.

### Common Misspellings

- Avarage position size; avg postion size; average positon shares.

### Noisy or Incomplete Input

- avg size July; av pos sh NVDA; average max held.

### Singular and Plural Forms

- Average position size; average of position sizes; mean maximum position quantity.

### Full Questions

- What was my average maximum position size for eligible closed Stock trades this month?; how many shares did I hold at maximum per trade on average?

### Commands

- Calculate average position size; show the mean maximum-open share quantity.

### Sentence Fragments

- Average position size; mean max shares; avg full position.

### Follow-Up Wording

- What about the prior period?; now use the selected ticker; show the median instead.

### Correction Wording

- I meant average maximum shares held per closed trade, not average execution quantity or dollar exposure.

### Comparison Wording

- Compare average position size between the two approved groups; was my average maximum size larger this month?

### Ranking Wording

- Rank approved groups by average position size; show groups with the largest average maximum-open quantity.

### Negated Wording

- Do not use entered quantity; not average execution size; exclude open and decision rows from the realized aggregate.

### Exclusion Wording

- Exclude the selected ticker; leave out unsupported asset units; omit rows without reconciled maximum-position facts while reporting their coverage.

### Multi-Filter Wording

- Average position size for eligible closed long Stock trades in the declared period and selected ticker.

### Multi-Part Question Wording

- Show average position size, compare the prior period, and include eligible/open/decision coverage and sample counts.

### Ambiguous Wording

- “Average size” may mean average execution quantity, entered quantity, maximum-open quantity, dollars, or risk. This metric defaults only when “position size” safely resolves to the accepted per-round-trip maximum absolute open quantity.

### Negative Examples

- What was my average execution size?; average entry notional; average current open quantity; what size should I use?

### Context Requirements

- Require server-authorized scope, eligible current `ready_closed` Stock round trips, compatible share-unit/account-timezone partitions, and trusted selected filters/groups. Currency is not a quantity conversion and must not be used to merge incompatible units.

### Required Data

- Accepted allocation sequence/roles, exact allocated quantity, reconciled running position, per-round-trip maximum absolute open quantity, `ready_closed` state, Stock multiplier-one eligibility, eligible count, coverage reasons, and fact revision.

### Optional Data

- Trusted selected ticker/date range/direction/outcome/provenance and existing maximum-position, entered-quantity, entry-notional, duration, or accepted-label filters only when the deterministic query allowlists them.

### Valid Filters

- Only existing Journal Analytics allowlisted `ready_closed` filters: server-authorized account scope, closing-date range in account timezone, ticker, direction, provenance, realized outcome, and covered quantity/notional/duration/label ranges where exposed.

### Valid Groupings

- Only existing approved compatible total, closing date bucket, weekday/time bucket, ticker, direction, provenance, duration/size bucket, and accepted-label groupings where exposed; no new thresholds, account merge, or market session is invented.

### Valid Operators

- Exact sum and count followed by rational division; calculate, summarize, compare, group, rank, explain, and coverage inspection under the validated query.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Execution/entered/notional substitution, legitimate-open/decision inclusion in realized average, incompatible units/timezones, cross-asset multiplier guessing, unauthorized account selection, zero-as-value fallback, causal diagnosis, advice, or Chat write/execution claims.

### Default Interpretation

- “Average position size” means exact mean of eligible per-round-trip maximum absolute open quantities in shares. It does not default to executions, entered shares, dollars, risk, or current holdings.

### Clarification Conditions

- Ask one focused size-basis question when “average size” does not safely distinguish maximum shares held from execution quantity, entered quantity, or dollars.

### Recommended Clarification Wording

- Do you mean average maximum shares held per closed trade, average execution quantity, or dollar exposure?

### Unsupported Conditions

- Zero eligible denominator, unreconciled/missing quantity or allocation facts, non-Stock/incompatible units, unsupported filter/group, unauthorized scope, or mixed timezone partition returns empty/unavailable/partial coverage, never zero or an estimate.

### Target Analytics Tool or Query Capability

- Current conditional Journal Analytics `average_position_size` metric over the normalized `ready_closed` population; future language validator/AI Chat router remains unimplemented.

### Result Units

- Exact rational Stock shares; preserve fractional quantities and display at most two decimals with accepted half-up rounding.

### Fee Handling

- Fees are not required for the quantity mean. Any performance comparison by size must separately declare Category 2 gross or fee-complete net P/L over an identical eligible population.

### Open-Trade Handling

- Current realized aggregate uses `ready_closed` only. Factually `legitimate_open` and `needs_decision` populations remain visible coverage and are not included in the mean.

### Sample-Size Considerations

- Always show eligible and coverage counts. A small or concentrated sample can describe the mean but cannot establish typical behavior, edge, cause, optimal size, or advice.

## `median_position_size` Language Registry

### Exact Definition

- For eligible `ready_closed` Stock round trips, sort exact per-round-trip maximum absolute open quantities and return the exact middle value, or exact arithmetic midpoint of the two middle values; return unavailable for zero eligible count.

### Formal Wording

- Calculate the median of per-round-trip maximum absolute open quantities.

### Normal Conversational Wording

- What was my median position size?; what was the middle maximum share size across my closed trades?

### Trader Slang

- What was my middle full size?; median max size.

### Abbreviations

- `med pos size` and `median max sh` may map with explicit metric grammar; bare `MPS`, `MED`, `POS`, or `SIZE` remains ticker-shaped or ambiguous and must not auto-route.

### Common Misspellings

- Medain position size; median postion size; mediam max shares.

### Noisy or Incomplete Input

- med size July; middle pos sh; median max held NVDA.

### Singular and Plural Forms

- Median position size; median of position sizes; middle maximum position quantity.

### Full Questions

- What was my median maximum position size for eligible closed Stock trades this month?; what was the middle maximum-open share quantity?

### Commands

- Calculate median position size; show the middle maximum-open share quantity.

### Sentence Fragments

- Median position size; middle max shares; median full position.

### Follow-Up Wording

- What about the prior period?; now use the selected ticker; show the average instead.

### Correction Wording

- I meant the median maximum shares held per closed trade, not a normal-size baseline or median execution quantity.

### Comparison Wording

- Compare median position size between the two approved groups; was the median maximum size larger this month?

### Ranking Wording

- Rank approved groups by median position size; show groups with the largest median maximum-open quantity.

### Negated Wording

- Do not treat median as normal size; not median execution quantity; exclude open and decision rows from the realized aggregate.

### Exclusion Wording

- Exclude the selected ticker; leave out unsupported asset units; omit rows without reconciled maximum-position facts while reporting their coverage.

### Multi-Filter Wording

- Median position size for eligible closed short Stock trades in the declared period and selected ticker.

### Multi-Part Question Wording

- Show median position size, compare the prior period, and include eligible/open/decision coverage and sample counts.

### Ambiguous Wording

- “Median size” may mean median execution quantity, entered quantity, maximum-open quantity, dollar amount, or an inferred normal baseline. This metric uses only the accepted per-round-trip maximum absolute open quantity.

### Negative Examples

- What is my normal size?; median execution quantity; median entry notional; what size should I trade?

### Context Requirements

- Require server-authorized scope, eligible current `ready_closed` Stock round trips, compatible share-unit/account-timezone partitions, and trusted selected filters/groups. Currency is not a quantity conversion and must not merge incompatible units.

### Required Data

- Accepted allocation sequence/roles, exact allocated quantity, reconciled running position, per-round-trip maximum absolute open quantity, `ready_closed` state, Stock multiplier-one eligibility, eligible count, deterministic sorting/ties, coverage reasons, and fact revision.

### Optional Data

- Trusted selected ticker/date range/direction/outcome/provenance and existing maximum-position, entered-quantity, entry-notional, duration, or accepted-label filters only when the deterministic query allowlists them.

### Valid Filters

- Only existing Journal Analytics allowlisted `ready_closed` filters: server-authorized account scope, closing-date range in account timezone, ticker, direction, provenance, realized outcome, and covered quantity/notional/duration/label ranges where exposed.

### Valid Groupings

- Only existing approved compatible total, closing date bucket, weekday/time bucket, ticker, direction, provenance, duration/size bucket, and accepted-label groupings where exposed; no new thresholds, account merge, or market session is invented.

### Valid Operators

- Exact sort and median selection/midpoint; calculate, summarize, compare, group, rank, explain, and coverage inspection under the validated query.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Execution/entered/notional substitution, treating median as user-normal baseline, legitimate-open/decision inclusion, incompatible units/timezones, multiplier guessing, unauthorized account selection, zero-as-value fallback, causal diagnosis, advice, or Chat execution claims.

### Default Interpretation

- “Median position size” means exact median of eligible per-round-trip maximum absolute open quantities in shares. It does not define personal normal size or default to executions, entered shares, dollars, risk, or current holdings.

### Clarification Conditions

- Ask one focused size-basis question when “median size” could mean maximum shares held, execution quantity, entered quantity, dollars, or a requested normal-size baseline.

### Recommended Clarification Wording

- Do you mean median maximum shares held per closed trade or a different size measure?

### Unsupported Conditions

- Zero eligible count, unreconciled/missing quantity or allocation facts, non-Stock/incompatible units, unsupported filter/group, unauthorized scope, or mixed timezone partition returns empty/unavailable/partial coverage, never zero or an estimate.

### Target Analytics Tool or Query Capability

- Current conditional Journal Analytics `median_position_size` metric over the normalized `ready_closed` population; future language validator/AI Chat router remains unimplemented.

### Result Units

- Exact decimal/rational Stock shares; preserve fractional quantities and display at most two decimals with accepted half-up rounding.

### Fee Handling

- Fees are not required for the quantity median. Any performance comparison by size must separately declare Category 2 gross or fee-complete net P/L over an identical eligible population.

### Open-Trade Handling

- Current realized aggregate uses `ready_closed` only. Factually `legitimate_open` and `needs_decision` populations remain visible coverage and are not included in the median.

### Sample-Size Considerations

- Always show eligible and coverage counts. A median from a small population is descriptive only and cannot establish normality, edge, cause, optimal size, or advice.

## `maximum_position_size` Language Registry

### Exact Definition

- For eligible `ready_closed` Stock round trips, calculate each maximum absolute running position quantity and return the greatest exact value across the population; return unavailable for a zero eligible population.

### Formal Wording

- Return the maximum of the per-round-trip maximum absolute open quantities.

### Normal Conversational Wording

- What was my maximum position size?; what was the most shares I held in any eligible closed trade?

### Trader Slang

- What was my biggest full size?; largest max size.

### Abbreviations

- `max pos size` and `max sh held` may map with explicit metric grammar; bare `MPS`, `MAX`, `POS`, or `SIZE` remains ticker-shaped or ambiguous and must not auto-route.

### Common Misspellings

- Maxium position size; maximum postion size; max positon shars.

### Noisy or Incomplete Input

- biggest size July; max pos sh; most held NVDA.

### Singular and Plural Forms

- Maximum position size; largest position size; greatest maximum position quantity.

### Full Questions

- What was my maximum position size among eligible closed Stock trades this month?; what was the greatest maximum-open share quantity?

### Commands

- Calculate maximum position size; show the greatest maximum-open share quantity.

### Sentence Fragments

- Maximum position size; biggest max shares; largest full position.

### Follow-Up Wording

- What about the prior period?; now use the selected ticker; show the average instead.

### Correction Wording

- I meant the population maximum of each trade's maximum shares held, not the largest execution or dollar exposure.

### Comparison Wording

- Compare maximum position size between the two approved groups; which period had the larger maximum-open quantity?

### Ranking Wording

- Rank approved groups by maximum position size; show groups with the greatest maximum-open quantity.

### Negated Wording

- Do not use the largest execution; not maximum dollar exposure; exclude open and decision rows from the realized extremum.

### Exclusion Wording

- Exclude the selected ticker; leave out unsupported asset units; omit rows without reconciled maximum-position facts while reporting their coverage.

### Multi-Filter Wording

- Maximum position size for eligible closed long Stock trades in the declared period and selected ticker.

### Multi-Part Question Wording

- Show maximum position size, compare the prior period, and include eligible/open/decision coverage and sample counts.

### Ambiguous Wording

- “Maximum size” may mean largest execution, entered quantity, maximum-open quantity, current open quantity, dollar notional, or account exposure. This metric uses the population maximum of per-round-trip maximum absolute open quantity.

### Negative Examples

- What was my largest execution?; maximum entry notional; current biggest open position; what is the maximum size I should use?

### Context Requirements

- Require server-authorized scope, eligible current `ready_closed` Stock round trips, compatible share-unit/account-timezone partitions, and trusted selected filters/groups. Currency cannot merge incompatible quantity units.

### Required Data

- Accepted allocation sequence/roles, exact allocated quantity, reconciled running position, per-round-trip maximum absolute open quantity, `ready_closed` state, Stock multiplier-one eligibility, eligible count, deterministic extrema/ties, coverage reasons, and fact revision.

### Optional Data

- Trusted selected ticker/date range/direction/outcome/provenance and existing maximum-position, entered-quantity, entry-notional, duration, or accepted-label filters only when the deterministic query allowlists them.

### Valid Filters

- Only existing Journal Analytics allowlisted `ready_closed` filters: server-authorized account scope, closing-date range in account timezone, ticker, direction, provenance, realized outcome, and covered quantity/notional/duration/label ranges where exposed.

### Valid Groupings

- Only existing approved compatible total, closing date bucket, weekday/time bucket, ticker, direction, provenance, duration/size bucket, and accepted-label groupings where exposed; no new thresholds, account merge, or market session is invented.

### Valid Operators

- Exact maximum with deterministic ties; calculate, summarize, compare, group, rank, explain, and coverage inspection under a future validated named route.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Largest-execution/entered/notional substitution, silent `maximum_share_quantity` alias claim, legitimate-open/decision inclusion, incompatible units/timezones, multiplier guessing, unauthorized account selection, zero-as-value fallback, causal diagnosis, advice, or claimed Chat execution.

### Default Interpretation

- “Maximum position size” means greatest eligible per-round-trip maximum absolute open quantity in shares. It does not default to executions, entered shares, dollars, risk, or current holdings.

### Clarification Conditions

- Ask one focused size-basis question when “maximum size” could mean maximum-open shares, largest execution, entered quantity, dollars, or current open position.

### Recommended Clarification Wording

- Do you mean the most shares held at once in any closed trade, the largest execution, or dollar exposure?

### Unsupported Conditions

- Zero eligible population, unreconciled/missing quantity or allocation facts, non-Stock/incompatible units, unsupported filter/group, unauthorized scope, or mixed timezone partition returns empty/unavailable/partial coverage, never zero or an estimate.

### Target Analytics Tool or Query Capability

- Planned named `maximum_position_size` route using the accepted maximum-position primitive. Existing `maximum_share_quantity` evidence is not silently declared the approved canonical capability; AI Chat routing remains unimplemented.

### Result Units

- Exact Stock shares; preserve fractional quantities and display at most two decimals without changing the exact value.

### Fee Handling

- Fees are not required for the quantity maximum. Any performance comparison by size must separately declare Category 2 gross or fee-complete net P/L over an identical eligible population.

### Open-Trade Handling

- Current canonical realized extremum uses `ready_closed` only. Factually `legitimate_open` and `needs_decision` populations remain visible coverage and are not included.

### Sample-Size Considerations

- Always show eligible and coverage counts. One maximum is an extremum, not a typical size, and cannot establish intent, edge, cause, optimal size, or advice.

## `average_dollar_exposure` Language Registry

### Exact Definition

- Recognize a request for the arithmetic mean of monetary exposure per eligible position under one approved exposure basis and time point. No generic exposure basis or time point is approved, so return Unavailable without calculating or substituting a value.

### Formal Wording

- Calculate average dollar exposure under the approved exposure contract.

### Normal Conversational Wording

- What was my average dollar exposure?; how many dollars did I usually have exposed?

### Trader Slang

- Average dollars at work; avg cash exposed; usual dollar size.

### Abbreviations

- `avg $ exposure` and `avg dol exp` may identify the generic request only with explicit metric grammar; bare `ADE`, `EXP`, `$`, or `AVG` is ticker-, operator-, or field-shaped and must not auto-route.

### Common Misspellings

- Avarage dollar exposure; avg dolar exposer; average doller expsoure.

### Noisy or Incomplete Input

- avg $ exp July; usual dollars in; avg exposure NVDA.

### Singular and Plural Forms

- Average dollar exposure; mean monetary exposure; average exposure amount.

### Full Questions

- What was my average dollar exposure for eligible positions in the selected period?; show the mean exposure in USD.

### Commands

- Calculate average dollar exposure; show why average exposure is unavailable.

### Sentence Fragments

- Average dollar exposure; mean dollars exposed; avg monetary size.

### Follow-Up Wording

- What about the prior period?; use the selected ticker; show average entry notional instead if that is what I asked for.

### Correction Wording

- I meant generic dollar exposure, not entry notional, market value, equity percentage, margin, or buying power.

### Comparison Wording

- Compare average dollar exposure between the two periods; recognize the request but return unavailable until one basis/time point is approved.

### Ranking Wording

- Rank approved groups by average dollar exposure; the request remains unavailable and must not rank entry notional or marked value as a fallback.

### Negated Wording

- Do not use entry notional; not market value; exclude account equity, margin, buying power, and FX estimates.

### Exclusion Wording

- Exclude unsupported asset units and mixed currencies; do not infer exposure for open or decision rows.

### Multi-Filter Wording

- Average dollar exposure for the selected ticker and period in one declared currency; recognition does not create the missing basis.

### Multi-Part Question Wording

- Show average dollar exposure, compare the prior period, and explain which exposure fact is missing.

### Ambiguous Wording

- “Dollar exposure” may mean entry notional, peak cost/notional, marked market value, gross/net portfolio exposure, equity use, margin, or buying power. None is the approved generic meaning.

### Negative Examples

- What was my average entry notional?; average marked position value; average equity utilization; invent a reasonable exposure estimate.

### Context Requirements

- Require server-authorized compatible account/currency/account-timezone/Stock-unit scope and an approved exposure basis/time point. Trusted selected context may narrow a request but cannot supply the missing product definition.

### Required Data

- One approved per-position dollar-exposure definition, observation time/interval, Stock multiplier/quote policy, exact monetary facts, declared currency, eligible population, zero/empty policy, coverage, and fact revision; the basis/time contract is absent.

### Optional Data

- Trusted selected ticker, period, and already allowlisted scope filters. Entry-notional or mark facts are optional alternatives only when the trader explicitly asks for those separately named metrics.

### Valid Filters

- No filter makes the unavailable generic metric calculable. Preserve only server-authorized and already allowlisted context while returning the missing-basis reason; do not create an exposure filter.

### Valid Groupings

- None for a calculated generic exposure result. Existing account/date/ticker/notional group primitives do not establish an exposure basis and must not produce values for this metric.

### Valid Operators

- Recognize calculate, summarize, compare, rank, explain, and coverage inspection; numerical operators return Unavailable until the exposure contract exists.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Silent entry-notional/market/equity/margin/buying-power substitution, cross-currency total, unsupported multiplier/contract units, trader-authored missing product definition, model estimate, unauthorized account selection, causal claim, advice, or claimed Chat execution.

### Default Interpretation

- Explicit “average dollar exposure” identifies this generic unavailable metric. There is no default exposure basis, time point, denominator, mark, account percentage, or fallback.

### Clarification Conditions

- Clarify only when wording plausibly names a separately supported metric, such as average entry notional. Do not ask the trader to invent the missing generic exposure contract.

### Recommended Clarification Wording

- Did you mean average entry notional? Generic average dollar exposure does not have an approved basis yet.

### Unsupported Conditions

- Missing exposure basis/time point, unavailable mark/account facts, mixed currency, unsupported units/multiplier, zero/unknown required inputs, unauthorized scope, or invalid query returns Unavailable with the factual reason.

### Target Analytics Tool or Query Capability

- Unavailable metric-registry response through a future language validator; no current `average_dollar_exposure` calculation or AI Chat route. Existing entry-notional tools are not fallbacks.

### Result Units

- Future exact money amount in one declared trade currency only after an approved contract; currently Unavailable, never zero, infinity, or estimated by the model.

### Fee Handling

- Fees do not define exposure. Any later performance relationship must independently select Category 2 gross or fee-complete net P/L over an identical eligible `ready_closed` population.

### Open-Trade Handling

- Unavailable for both `ready_closed` and factually `legitimate_open` positions because the exposure basis/time point is absent. `needs_decision` remains separate coverage and is never inferred as exposure.

### Sample-Size Considerations

- No numeric sample result exists while unavailable. A future result must show eligible/covered counts; average exposure cannot establish risk quality, cause, optimal size, or advice.

## `maximum_dollar_exposure` Language Registry

### Exact Definition

- Recognize a request for the greatest monetary exposure reached by an eligible position under one approved exposure basis and observation-time contract. No generic exposure basis or observation time is approved, so return Unavailable without calculating or substituting a value.

### Formal Wording

- Calculate maximum dollar exposure under the approved exposure contract.

### Normal Conversational Wording

- What was my maximum dollar exposure?; what was the most money I had exposed?

### Trader Slang

- Biggest dollars at work; max cash exposed; largest dollar size.

### Abbreviations

- `max $ exposure` and `max dol exp` may identify the generic request only with explicit metric grammar; bare `MDE`, `EXP`, `$`, or `MAX` is ticker-, operator-, or field-shaped and must not auto-route.

### Common Misspellings

- Maxium dollar exposure; max dolar exposer; maximum doller expsoure.

### Noisy or Incomplete Input

- max $ exp July; most dollars in; biggest exposure NVDA.

### Singular and Plural Forms

- Maximum dollar exposure; greatest monetary exposure; largest exposure amount.

### Full Questions

- What was my maximum dollar exposure for eligible positions in the selected period?; show the greatest exposure in USD.

### Commands

- Calculate maximum dollar exposure; show why maximum exposure is unavailable.

### Sentence Fragments

- Maximum dollar exposure; most dollars exposed; largest monetary size.

### Follow-Up Wording

- What about the prior period?; use the selected ticker; show maximum entry notional instead if that is what I asked for.

### Correction Wording

- I meant generic maximum dollar exposure, not maximum entry notional, market value, equity percentage, margin, or buying power.

### Comparison Wording

- Compare maximum dollar exposure between the two periods; recognize the request but return unavailable until one basis/time contract is approved.

### Ranking Wording

- Rank approved groups by maximum dollar exposure; the request remains unavailable and must not rank entry notional or marked value as a fallback.

### Negated Wording

- Do not use maximum entry notional; not peak marked value; exclude account equity, margin, buying power, and FX estimates.

### Exclusion Wording

- Exclude unsupported asset units and mixed currencies; do not infer exposure for open or decision rows.

### Multi-Filter Wording

- Maximum dollar exposure for the selected ticker and period in one declared currency; recognition does not create the missing basis.

### Multi-Part Question Wording

- Show maximum dollar exposure, compare the prior period, and explain which exposure fact is missing.

### Ambiguous Wording

- “Maximum dollar exposure” may mean maximum entry notional, peak cost/notional, highest marked market value, gross/net portfolio exposure, equity use, margin, or buying power. None is the approved generic meaning.

### Negative Examples

- What was my maximum entry notional?; highest marked position value; peak equity utilization; estimate the most I probably had exposed.

### Context Requirements

- Require server-authorized compatible account/currency/account-timezone/Stock-unit scope and an approved exposure basis/observation time. Trusted selected context may narrow a request but cannot supply the missing product definition.

### Required Data

- One approved per-position dollar-exposure definition, observation time/interval, Stock multiplier/quote policy, exact monetary facts, declared currency, eligible population, extrema/tie and zero/empty policies, coverage, and fact revision; the basis/time contract is absent.

### Optional Data

- Trusted selected ticker, period, and already allowlisted scope filters. Entry-notional or mark facts are optional alternatives only when the trader explicitly asks for those separately named metrics.

### Valid Filters

- No filter makes the unavailable generic metric calculable. Preserve only server-authorized and already allowlisted context while returning the missing-basis reason; do not create an exposure filter.

### Valid Groupings

- None for a calculated generic exposure result. Existing account/date/ticker/notional group primitives do not establish an exposure basis and must not produce values for this metric.

### Valid Operators

- Recognize calculate, summarize, compare, rank, explain, and coverage inspection; numerical extrema return Unavailable until the exposure contract exists.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Silent entry-notional/market/equity/margin/buying-power substitution, cross-currency extremum, unsupported multiplier/contract units, trader-authored missing product definition, model estimate, unauthorized account selection, causal claim, advice, or claimed Chat execution.

### Default Interpretation

- Explicit “maximum dollar exposure” identifies this generic unavailable metric. There is no default exposure basis, observation time, mark, account percentage, or fallback.

### Clarification Conditions

- Clarify only when wording plausibly names a separately supported metric, such as maximum entry notional. Do not ask the trader to invent the missing generic exposure contract.

### Recommended Clarification Wording

- Did you mean maximum entry notional? Generic maximum dollar exposure does not have an approved basis yet.

### Unsupported Conditions

- Missing exposure basis/observation time, unavailable mark/account facts, mixed currency, unsupported units/multiplier, zero/unknown required inputs, unauthorized scope, or invalid query returns Unavailable with the factual reason.

### Target Analytics Tool or Query Capability

- Unavailable metric-registry response through a future language validator; no current `maximum_dollar_exposure` calculation or AI Chat route. Existing entry-notional tools are not fallbacks.

### Result Units

- Future exact money amount in one declared trade currency only after an approved contract; currently Unavailable, never zero or model-estimated.

### Fee Handling

- Fees do not define exposure. Any later performance relationship must independently select Category 2 gross or fee-complete net P/L over an identical eligible `ready_closed` population.

### Open-Trade Handling

- Unavailable for both `ready_closed` and factually `legitimate_open` positions because the exposure basis/observation time is absent. `needs_decision` remains separate coverage and is never inferred as exposure.

### Sample-Size Considerations

- No numeric sample result exists while unavailable. A future maximum must show eligible/covered counts and deterministic ties; one extremum cannot establish risk quality, cause, optimal size, or advice.

## `size_relative_to_normal_size` Language Registry

### Exact Definition

- Recognize a request to express a declared position-size measure relative to one approved normal-size baseline over a compatible scope/effective period. No baseline, default numerator, or relation formula is approved, so return Unavailable without calculation.

### Formal Wording

- Calculate position size relative to the approved normal-size baseline.

### Normal Conversational Wording

- How big was this compared with my normal size?; was I larger than usual?

### Trader Slang

- How many times normal size?; was I sized up versus usual?; bigger than my norm.

### Abbreviations

- `vs normal size` and `rel norm sz` may identify the generic request with explicit grammar; bare `SNS`, `NORM`, `REL`, or `SIZE` is ticker-, operator-, or field-shaped and must not auto-route.

### Common Misspellings

- Size reletive to normal; relitive normal size; size vs nromal.

### Noisy or Incomplete Input

- vs normal?; how big than usual; rel norm size NVDA.

### Singular and Plural Forms

- Size relative to normal size; sizes relative to normal; normal-relative position size.

### Full Questions

- How did the selected position size compare with my approved normal-size baseline?; show size relative to normal for the selected period.

### Commands

- Calculate size relative to normal; explain why normal-relative size is unavailable.

### Sentence Fragments

- Versus normal size; relative to usual; normal-size multiple.

### Follow-Up Wording

- What about the prior period?; use the selected trade; show median position size instead if I meant the historical median.

### Correction Wording

- I meant relative to an approved normal baseline, not simply the population median, average, or a size bucket.

### Comparison Wording

- Compare normal-relative size between the two groups; recognize the request but do not invent the missing baseline/formula.

### Ranking Wording

- Rank trades by size relative to normal; unavailable until a baseline, numerator, and relation formula are approved.

### Negated Wording

- Do not assume median is normal; not average size; exclude trader targets that are not versioned accepted facts.

### Exclusion Wording

- Exclude incompatible units and baseline periods; do not use open or decision rows to infer normal.

### Multi-Filter Wording

- Size relative to normal for the selected ticker and period under one compatible account/unit scope; filters do not create a baseline.

### Multi-Part Question Wording

- Show size relative to normal, compare the prior period, and explain which baseline fact is missing.

### Ambiguous Wording

- “Normal” may mean median, mean, recent rolling size, lifetime history, trader target, instrument-specific size, direction-specific size, or account percentage. None is approved as the default.

### Negative Examples

- What was my median position size?; compare large versus small buckets; let me tell you now what normal should have meant historically; estimate my normal size.

### Context Requirements

- Require server-authorized compatible account/account-timezone/unit scope, one approved size numerator, and a versioned baseline with source, effective period, lookback, exclusions, and zero/missing policy. Selected context cannot create those facts.

### Required Data

- Approved numerator size measure, approved normal-size baseline and provenance, effective dates/lookback, scope rules, exact relation formula, compatible Stock/fractional units, eligible population, zero/missing handling, coverage, and fact revision; these contracts are absent.

### Optional Data

- Trusted selected trade/ticker/period and accepted size facts. The supported median position size is only a separately named alternative, never an implicit baseline.

### Valid Filters

- No filter makes the unavailable baseline metric calculable. Preserve only server-authorized and already allowlisted context while returning the missing-baseline/formula reason.

### Valid Groupings

- None for a calculated normal-relative result. Existing size/date/ticker group primitives do not define the normal baseline or relation formula.

### Valid Operators

- Recognize calculate, summarize, compare, rank, explain, and coverage inspection; ratio/delta operators remain unavailable until the baseline and formula are approved.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `rank_results`, `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Median/average/target/account-percent substitution, trader-authored missing product definition, look-ahead baseline leakage, incompatible-unit comparison, open/decision inference, model estimate, unauthorized account selection, motive/causal claim, advice, or Chat execution.

### Default Interpretation

- Explicit “size relative to normal size” identifies this unavailable baseline-relative metric. No numerator, baseline, lookback, relation, or zero behavior defaults beyond returning the missing-contract state.

### Clarification Conditions

- Clarify only when the wording plausibly asks for a separately supported descriptive metric such as median position size. Do not ask the trader to author the missing baseline contract in conversation.

### Recommended Clarification Wording

- Did you mean median position size? A normal-size baseline has not been defined for this metric.

### Unsupported Conditions

- Missing/unapproved baseline or formula, zero/unknown baseline, incompatible units, look-ahead scope, unsupported filter/group, unauthorized scope, or absent coverage returns Unavailable with the factual reason.

### Target Analytics Tool or Query Capability

- Unavailable metric-registry response through a future language validator; no current `size_relative_to_normal_size` calculation or AI Chat route. Median/average metrics are not fallbacks.

### Result Units

- Not established; any future exact ratio, percentage, delta, or size-unit result requires an approved formula. Currently Unavailable, never zero, infinity, or model-estimated.

### Fee Handling

- Fees do not define normal size. Any future performance interpretation must independently select Category 2 gross or fee-complete net P/L over an identical eligible `ready_closed` population.

### Open-Trade Handling

- Unavailable for `ready_closed` and factually `legitimate_open` positions because the baseline/formula is absent. `needs_decision` stays separate coverage and cannot define or alter normal.

### Sample-Size Considerations

- No numeric result exists while unavailable. A future historical baseline needs disclosed sample/lookback coverage; relative size cannot establish motive, discipline, cause, edge, or advice.

## `performance_by_size_bucket` Language Registry

### Exact Definition

- Recognize a request to group one identical eligible `ready_closed` Stock population by an explicitly approved size basis/bucket contract and report one explicitly selected Category 2 realized performance metric per group. Grouping primitives exist, but no default basis, thresholds, or P/L contract is approved; the metric remains Planned.

### Formal Wording

- Group eligible realized performance by the approved position-size bucket definition.

### Normal Conversational Wording

- How did I perform at different sizes?; show results for small, medium, and large positions.

### Trader Slang

- How do my small-size trades compare with full size?; P&L by size tier.

### Abbreviations

- `perf by size` and `P&L by sz bucket` may identify the request with explicit grammar; bare `PBS`, `SIZE`, `BUCKET`, or `P&L` is ticker-, field-, or basis-ambiguous and must not auto-route.

### Common Misspellings

- Performance by size buket; perfomance size buckets; PNL by sze group.

### Noisy or Incomplete Input

- results by size; small vs big PnL; size buckets July.

### Singular and Plural Forms

- Performance by size bucket; performance across size buckets; size-grouped results.

### Full Questions

- How did my eligible closed-trade performance differ across approved position-size buckets?; show net P/L by declared maximum-position bucket.

### Commands

- Break down performance by size bucket; explain which bucket contract is still missing.

### Sentence Fragments

- P/L by size bucket; results by position tier; small versus large size.

### Follow-Up Wording

- Use gross P/L instead; compare the prior period; now show eligible counts; change the size basis only after clarification.

### Correction Wording

- I meant performance grouped by position size, not size relative to normal or profit per dollar exposed.

### Comparison Wording

- Compare performance between the approved small and large size buckets; include identical-population counts and coverage.

### Ranking Wording

- Rank approved size buckets by the selected performance metric; do not call the top historical bucket optimal.

### Negated Wording

- Do not choose entry notional automatically; not account exposure; exclude open and decision rows from realized performance.

### Exclusion Wording

- Exclude the selected bucket only under a validated query; leave out fee-incomplete rows from net results while reporting coverage.

### Multi-Filter Wording

- Net P/L by an approved size bucket for the selected ticker and closing-date range in one currency/account-timezone partition.

### Multi-Part Question Wording

- Show performance by size bucket, compare the prior period, and report eligible, fee-complete, open, and decision coverage.

### Ambiguous Wording

- “Size bucket” may mean maximum-open shares, entered shares, entry notional, dollar exposure, or normal-relative size; “performance” may mean gross P/L, fee-complete net P/L, win rate, or another explicit Category 2/3 metric. No default is approved here.

### Negative Examples

- What is my normal size?; profit per dollar exposed; group by price bucket; tell me which size I should trade.

### Context Requirements

- Require server-authorized compatible account/currency/account-timezone/Stock-unit scope, one approved size basis and threshold contract, one explicit Category 2 realized metric/basis, identical `ready_closed` population, and trusted selected filters.

### Required Data

- Accepted maximum-position/entered-quantity/entry-notional grouping facts as explicitly selected, approved bucket boundaries/inclusivity, exact Category 2 gross or fee-complete net P/L facts, identical eligible population, group reconciliation, zero/empty policy, coverage, and fact revision; the default contract is absent.

### Optional Data

- Trusted ticker, closing-date range, direction, provenance, outcome, accepted labels, and only existing allowlisted grouping/filter context. No threshold is inferred from prose such as small/large.

### Valid Filters

- Only existing Journal Analytics `ready_closed` filters within server scope: closing-date range, ticker, direction, provenance, realized outcome, and covered quantity/notional/duration/accepted-label filters where exposed. No invented exposure or threshold filter.

### Valid Groupings

- Accepted maximum-position, entered-quantity, and entry-notional/size grouping primitives only after one basis and approved threshold contract are explicit; compatible total/date/ticker/direction/provenance groups may be nested only if the deterministic query already allows them.

### Valid Operators

- Exact grouping/reconciliation plus the explicitly selected Category 2 aggregate; calculate, summarize, compare, group, rank, explain, and coverage inspection under a future validated named contract.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, `diagnose_performance`, and `inspect_data_quality`.

### Incompatible Combinations

- Invented default basis/threshold, gross/net mixing, fee-incomplete net claims, cross-currency P/L, incompatible units/timezones, open/decision realized inclusion, market/equity exposure fallback, optimal-size/causal claim, advice, unauthorized account selection, or claimed Chat runtime.

### Default Interpretation

- No default size basis, thresholds, or performance metric exists. Explicit `performance_by_size_bucket` remains Planned until the complete contract is approved and exposed.

### Clarification Conditions

- Ask one field at a time, beginning with size basis when it is unresolved; later ask thresholds or performance basis separately if still missing.

### Recommended Clarification Wording

- Should the size buckets use maximum shares held, entered shares, or entry notional?

### Unsupported Conditions

- Missing basis/threshold/P&L contract, zero/empty eligible population, incompatible unit/currency/timezone, incomplete net fees, unsupported nested grouping/filter, unauthorized scope, or unresolved open/decision population returns Planned/unavailable/partial state, never invented buckets.

### Target Analytics Tool or Query Capability

- Planned named metric-language route using accepted size grouping/filter primitives and Category 2 aggregates; no current `performance_by_size_bucket` contract or AI Chat route.

### Result Units

- Units of the explicitly selected Category 2 metric per declared bucket; exact values remain lossless and money stays in one currency, with display rounding only.

### Fee Handling

- Explicit gross P/L or fee-complete net P/L only. Net groups use one identical fee-complete `ready_closed` population and expose omitted/incomplete coverage; never compare gross and net buckets as if identical.

### Open-Trade Handling

- Realized bucket performance uses `ready_closed` only. Factually `legitimate_open` and `needs_decision` populations remain visible coverage and cannot be folded into or invisibly skipped from realized group values.

### Sample-Size Considerations

- Show eligible/covered count per bucket and parent reconciliation. Small, empty, or imbalanced buckets cannot support an optimal-size, edge, cause, or advice claim.

## `size_after_wins` Language Registry

### Exact Definition

- Recognize a request to summarize an explicitly selected position-size measure for eligible `ready_closed` Stock trades that follow a winning predecessor under Category 3's selected-basis outcome contract and a future approved predecessor-scope/barrier rule. Stable close order exists, but the named sequence contract is absent; the metric remains Planned.

### Formal Wording

- Summarize position size following winning trades under the approved predecessor and outcome contracts.

### Normal Conversational Wording

- How big do I trade after a win?; what is my size after winning trades?

### Trader Slang

- Do I size up after green trades?; how big is my next shot after a winner?

### Abbreviations

- `size after W` and `sz post win` may identify the sequence request with explicit grammar; bare `SAW`, `W`, `WIN`, or `SIZE` is ticker-, outcome-, or field-shaped and must not auto-route.

### Common Misspellings

- Size afer wins; sze after winers; size post winns.

### Noisy or Incomplete Input

- size after W?; after green how big; next size winners.

### Singular and Plural Forms

- Size after a win; size after wins; post-win position size; sizes following winners.

### Full Questions

- What was my selected position-size measure on eligible closed trades following wins?; show post-win size under the selected gross outcome basis.

### Commands

- Analyze size after wins; explain which predecessor/barrier rule is missing.

### Sentence Fragments

- Size after wins; post-winner size; next size after green.

### Follow-Up Wording

- Use fee-complete net outcomes instead; now only the selected ticker; compare size after losses after that contract exists.

### Correction Wording

- I meant size on trades following wins, not size during winning trades, a winning streak, or an automatic escalation signal.

### Comparison Wording

- Compare the selected size measure after wins versus another approved sequence group; keep predecessor scope and basis identical.

### Ranking Wording

- Rank approved post-win groups by the selected size metric only after the sequence/group contract exists; do not infer the “best” response to winning.

### Negated Wording

- Do not infer revenge or confidence; not size during winners; do not skip open or decision barriers silently.

### Exclusion Wording

- Exclude a ticker/period only through validated filters; keep flats, legitimate-open, and decision rows visible under the future barrier policy.

### Multi-Filter Wording

- Size after wins for the selected ticker and closing-date range under one account/currency/timezone/unit partition and selected gross/net outcome basis.

### Multi-Part Question Wording

- Show size after wins, compare the prior period, and report eligible, flat, open, decision, and fee coverage.

### Ambiguous Wording

- “After a win” does not establish same account versus same ticker, immediate predecessor eligibility, flat/open/decision barriers, gross versus net outcome, or which size measure/aggregate to use.

### Negative Examples

- What was my size on winning trades?; show my winning streak; count size escalations; why did winning make me overconfident?

### Context Requirements

- Require server-authorized compatible account/currency/account-timezone/Stock-unit scope, accepted stable close ordering/ties, Category 3 selected-basis outcome, one approved predecessor scope/barrier policy, one explicit size measure/aggregate, and identical eligible `ready_closed` population.

### Required Data

- Stable close order, accepted `ready_closed` round trips, selected Category 2 gross or fee-complete net P/L outcome facts, exact selected size facts, approved predecessor scope/barriers, compatible partitions, zero/empty policy, coverage, and fact revision; the predecessor contract is absent.

### Optional Data

- Trusted ticker, closing-date range, direction, provenance, accepted labels, and existing size/filter/group context only when the future deterministic sequence query allowlists them.

### Valid Filters

- Only existing server-authorized `ready_closed` filters such as closing-date range, ticker, direction, provenance, realized outcome, and covered size/duration/label filters where exposed. No predecessor or barrier filter is invented.

### Valid Groupings

- None approved specifically for this named sequence metric. Existing date/ticker/direction/provenance/size group primitives may be used only after the predecessor/barrier and selected-size contracts are approved.

### Valid Operators

- Stable ordering plus a future approved predecessor selection and explicit size aggregate; analyze sequence, calculate, summarize, compare, group, explain, and inspect coverage under a validated route.

### Compatible Intents

- Locked Category 1 intents: `analyze_sequence`, `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `explain_result`, `detect_pattern`, and `inspect_data_quality`.

### Incompatible Combinations

- Invented predecessor/barrier/same-ticker rule, gross/net outcome mixing, fee-incomplete net claim, open/decision silent skipping, size-escalation substitution, motive/causal diagnosis, advice, incompatible partitions, unauthorized account selection, or claimed Chat runtime.

### Default Interpretation

- No default predecessor scope, barriers, size measure, aggregate, or gross/net outcome basis exists. Stable close ordering is evidence only and does not complete the Planned named metric.

### Clarification Conditions

- Ask one focused question beginning with predecessor scope when “after” is unresolved; ask outcome or size basis separately in later turns if needed.

### Recommended Clarification Wording

- Should “after a win” use the next eligible closed trade in the same account scope or only the next closed trade for the same ticker?

### Unsupported Conditions

- Missing predecessor/barrier/size/outcome contract, zero eligible transitions, incompatible partitions, fee-incomplete selected net outcomes, unsupported filter/group, unauthorized scope, or unresolved coverage returns Planned/unavailable/partial state rather than an invented sequence.

### Target Analytics Tool or Query Capability

- Planned sequence-language route using accepted stable close order, Category 3 selected outcomes, and exact size facts; no current `size_after_wins` metric or AI Chat route.

### Result Units

- Units of the explicitly selected approved size metric within compatible partitions; exact fractional quantities remain lossless and round only for display. No default aggregate unit is implied.

### Fee Handling

- The predecessor win must explicitly use Category 2 gross P/L or fee-complete net P/L through Category 3's selected-basis outcome. Net sequencing uses one identical fee-complete `ready_closed` population and reports incomplete coverage.

### Open-Trade Handling

- Sequence outcomes use `ready_closed`. Factually `legitimate_open` and `needs_decision` rows remain visible and may be barriers only under an approved rule; they must not be skipped invisibly or classified as wins.

### Sample-Size Considerations

- Show eligible predecessor-transition and coverage counts, including flats/barriers when defined. Small or selected sequences cannot establish that winning caused size change, motive, discipline, edge, future behavior, or advice.

## `size_after_losses` Language Registry

### Exact Definition

- Recognize a request to summarize an explicitly selected position-size measure for eligible `ready_closed` Stock trades that follow a losing predecessor under Category 3's selected-basis outcome contract and a future approved predecessor-scope/barrier rule. Stable close order exists, but the named sequence contract is absent; the metric remains Planned.

### Formal Wording

- Summarize position size following losing trades under the approved predecessor and outcome contracts.

### Normal Conversational Wording

- How big do I trade after a loss?; what is my size after losing trades?

### Trader Slang

- Do I size up after red trades?; how big is my next shot after a loser?

### Abbreviations

- `size after L` and `sz post loss` may identify the sequence request with explicit grammar; bare `SAL`, `L`, `LOSS`, or `SIZE` is ticker-, outcome-, or field-shaped and must not auto-route.

### Common Misspellings

- Size afer losses; sze after losers; size post losss.

### Noisy or Incomplete Input

- size after L?; after red how big; next size losers.

### Singular and Plural Forms

- Size after a loss; size after losses; post-loss position size; sizes following losers.

### Full Questions

- What was my selected position-size measure on eligible closed trades following losses?; show post-loss size under the selected fee-complete net outcome basis.

### Commands

- Analyze size after losses; explain which predecessor/barrier rule is missing.

### Sentence Fragments

- Size after losses; post-loser size; next size after red.

### Follow-Up Wording

- Use gross outcomes instead; now only the selected ticker; compare size after wins under the same approved contract.

### Correction Wording

- I meant size on trades following losses, not size during losing trades, a losing streak, or an automatic escalation/reduction signal.

### Comparison Wording

- Compare the selected size measure after losses versus another approved sequence group; keep predecessor scope and basis identical.

### Ranking Wording

- Rank approved post-loss groups by the selected size metric only after the sequence/group contract exists; do not infer the “best” response to losing.

### Negated Wording

- Do not infer revenge, tilt, or discipline; not size during losers; do not skip open or decision barriers silently.

### Exclusion Wording

- Exclude a ticker/period only through validated filters; keep flats, legitimate-open, and decision rows visible under the future barrier policy.

### Multi-Filter Wording

- Size after losses for the selected ticker and closing-date range under one account/currency/timezone/unit partition and selected gross/net outcome basis.

### Multi-Part Question Wording

- Show size after losses, compare the prior period, and report eligible, flat, open, decision, and fee coverage.

### Ambiguous Wording

- “After a loss” does not establish same account versus same ticker, immediate predecessor eligibility, flat/open/decision barriers, gross versus net outcome, or which size measure/aggregate to use.

### Negative Examples

- What was my size on losing trades?; show my losing streak; count size reductions; why did losing make me revenge trade?

### Context Requirements

- Require server-authorized compatible account/currency/account-timezone/Stock-unit scope, accepted stable close ordering/ties, Category 3 selected-basis outcome, one approved predecessor scope/barrier policy, one explicit size measure/aggregate, and identical eligible `ready_closed` population.

### Required Data

- Stable close order, accepted `ready_closed` round trips, selected Category 2 gross or fee-complete net P/L outcome facts, exact selected size facts, approved predecessor scope/barriers, compatible partitions, zero/empty policy, coverage, and fact revision; the predecessor contract is absent.

### Optional Data

- Trusted ticker, closing-date range, direction, provenance, accepted labels, and existing size/filter/group context only when the future deterministic sequence query allowlists them.

### Valid Filters

- Only existing server-authorized `ready_closed` filters such as closing-date range, ticker, direction, provenance, realized outcome, and covered size/duration/label filters where exposed. No predecessor or barrier filter is invented.

### Valid Groupings

- None approved specifically for this named sequence metric. Existing date/ticker/direction/provenance/size group primitives may be used only after the predecessor/barrier and selected-size contracts are approved.

### Valid Operators

- Stable ordering plus a future approved predecessor selection and explicit size aggregate; analyze sequence, calculate, summarize, compare, group, explain, and inspect coverage under a validated route.

### Compatible Intents

- Locked Category 1 intents: `analyze_sequence`, `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `explain_result`, `detect_pattern`, and `inspect_data_quality`.

### Incompatible Combinations

- Invented predecessor/barrier/same-ticker rule, gross/net outcome mixing, fee-incomplete net claim, open/decision silent skipping, transition substitution, revenge/tilt/motive or causal diagnosis, advice, incompatible partitions, unauthorized account selection, or claimed Chat runtime.

### Default Interpretation

- No default predecessor scope, barriers, size measure, aggregate, or gross/net outcome basis exists. Stable close ordering is evidence only and does not complete the Planned named metric.

### Clarification Conditions

- Ask one focused question beginning with predecessor scope when “after” is unresolved; ask outcome or size basis separately in later turns if needed.

### Recommended Clarification Wording

- Should “after a loss” use the next eligible closed trade in the same account scope or only the next closed trade for the same ticker?

### Unsupported Conditions

- Missing predecessor/barrier/size/outcome contract, zero eligible transitions, incompatible partitions, fee-incomplete selected net outcomes, unsupported filter/group, unauthorized scope, or unresolved coverage returns Planned/unavailable/partial state rather than an invented sequence.

### Target Analytics Tool or Query Capability

- Planned sequence-language route using accepted stable close order, Category 3 selected outcomes, and exact size facts; no current `size_after_losses` metric or AI Chat route.

### Result Units

- Units of the explicitly selected approved size metric within compatible partitions; exact fractional quantities remain lossless and round only for display. No default aggregate unit is implied.

### Fee Handling

- The predecessor loss must explicitly use Category 2 gross P/L or fee-complete net P/L through Category 3's selected-basis outcome. Net sequencing uses one identical fee-complete `ready_closed` population and reports incomplete coverage.

### Open-Trade Handling

- Sequence outcomes use `ready_closed`. Factually `legitimate_open` and `needs_decision` rows remain visible and may be barriers only under an approved rule; they must not be skipped invisibly or classified as losses.

### Sample-Size Considerations

- Show eligible predecessor-transition and coverage counts, including flats/barriers when defined. Small or selected sequences cannot establish that losing caused size change, revenge, tilt, discipline, edge, future behavior, or advice.

## `size_escalation` Language Registry

### Exact Definition

- Recognize a request to identify or summarize across-trade ordered transitions classified as increased position size under a future approved size basis, transition formula, equality rule, applicable-transition scope, unit, and denominator. Existing order/size facts do not select that contract; the metric remains Planned.

### Formal Wording

- Identify position-size escalation across eligible trades under the approved transition contract.

### Normal Conversational Wording

- When did I increase my size from one trade to the next?; show my size escalations.

### Trader Slang

- When did I size up?; show where I went bigger on the next trade.

### Abbreviations

- `sz escalation` and `size-up seq` may identify the across-trade request with explicit grammar; bare `SE`, `SU`, `UP`, or `SIZE` is ticker-, direction-, or field-shaped and must not auto-route.

### Common Misspellings

- Size escaltion; sze escalation; size escallation.

### Noisy or Incomplete Input

- where sized up; size up next trades; escalated sz July.

### Singular and Plural Forms

- Size escalation; size escalations; position-size increase transition; across-trade size increases.

### Full Questions

- Which eligible ordered trades met the approved size-escalation contract?; how often did position size escalate across closed trades?

### Commands

- Analyze size escalation; explain which transition formula or denominator is missing.

### Sentence Fragments

- Size escalations; sized-up transitions; bigger next trade.

### Follow-Up Wording

- What about reductions?; use the prior period; condition on post-loss outcomes only after the sequence contract exists.

### Correction Wording

- I meant an across-trade size transition, not adding shares within one open position or total shares purchased.

### Comparison Wording

- Compare size escalation between two approved groups only after one identical transition formula, unit, and denominator are defined.

### Ranking Wording

- Rank approved groups by size escalation only after the transition metric exists; do not infer that more or less escalation is better.

### Negated Wording

- Do not count scale-ins; not Buy volume; do not assume any positive quantity difference is the approved formula.

### Exclusion Wording

- Exclude a group only through validated filters; do not skip flats, open positions, or decision rows without an approved barrier/equality policy.

### Multi-Filter Wording

- Size escalation for the selected ticker and period within one compatible account/timezone/unit partition; filters do not define the transition formula.

### Multi-Part Question Wording

- Show size escalations, compare the prior period, and explain the transition, equality, denominator, and coverage states.

### Ambiguous Wording

- “Sized up” may mean adding within one open position, increasing the next trade's maximum shares, increasing entered shares, increasing notional, or increasing account risk. No across-trade formula/unit is approved.

### Negative Examples

- How many scale-ins did I make?; total shares added to open positions; show Buy volume; tell me why I became reckless.

### Context Requirements

- Require server-authorized compatible account/currency/account-timezone/Stock-unit scope, accepted stable ordering/ties, one approved across-trade size basis/formula/equality policy, applicable transitions/barriers, denominator, exact facts, and `ready_closed` population.

### Required Data

- Accepted ordered `ready_closed` round trips, explicitly approved size measure, transition pairing/scope, exact comparison formula/unit, equality/tolerance rule, denominator, compatible partitions, zero/empty handling, coverage, and fact revision; the transition contract is absent.

### Optional Data

- Trusted ticker, closing-date range, direction, provenance, accepted labels, Category 3 selected outcome, and existing size/group context only when the future deterministic transition query allowlists them.

### Valid Filters

- Only existing server-authorized `ready_closed` filters where exposed. No transition, predecessor, barrier, equality, or threshold filter is invented by this registry.

### Valid Groupings

- None approved specifically for this named transition metric. Existing date/ticker/direction/provenance/size groups are evidence only until one transition formula and denominator are approved.

### Valid Operators

- Recognize ordered comparison, calculate, summarize, compare, group, rank, explain, sequence analysis, and coverage inspection; no numerical transition operator executes before the contract exists.

### Compatible Intents

- Locked Category 1 intents: `analyze_sequence`, `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, `detect_pattern`, and `inspect_data_quality`.

### Incompatible Combinations

- Category 8 scale-in/add substitution, invented delta/percentage/unit/equality/denominator, open/decision silent skipping, incompatible partitions, gross/net or outcome inference, motive/causal label, advice, unauthorized account selection, or claimed Chat runtime.

### Default Interpretation

- Explicit “size escalation” identifies this Planned across-trade transition concept. No size basis, pairing, formula, unit, equality rule, threshold, barrier, or denominator defaults.

### Clarification Conditions

- First clarify whether the user means across-trade size change versus adding within one open position. Do not ask the trader to author the missing product formula or denominator.

### Recommended Clarification Wording

- Do you mean increasing size across separate closed trades, or adding shares within one open position?

### Unsupported Conditions

- Missing transition contract, zero eligible transitions, incompatible units/timezones, unsupported filters/groups, unresolved open/decision barriers, unauthorized scope, or absent exact facts returns Planned/unavailable/partial state rather than an invented escalation.

### Target Analytics Tool or Query Capability

- Planned transition-language route using accepted stable order and exact size facts; no current `size_escalation` metric, approved transition formula, or AI Chat route.

### Result Units

- Not established. Any future count, rate, exact size difference, or relative change requires an approved unit/formula/denominator; exact facts remain lossless and display rounding occurs only afterward.

### Fee Handling

- Fees do not define escalation. If transitions are conditioned on Category 3 outcome or compared by performance, Category 2 gross or fee-complete net P/L must use one identical eligible `ready_closed` population.

### Open-Trade Handling

- Across-trade realized transitions use `ready_closed`. Factually `legitimate_open` and `needs_decision` rows remain visible and may be barriers only under an approved rule; they are never silently skipped or classified.

### Sample-Size Considerations

- A future result must show eligible transition, unchanged/equality, and barrier coverage counts. Small samples cannot establish risk-taking, intent, cause, edge, future behavior, or advice.

## `size_reduction` Language Registry

### Exact Definition

- Recognize a request to identify or summarize across-trade ordered transitions classified as decreased position size under a future approved size basis, transition formula, equality rule, applicable-transition scope, unit, and denominator. Existing order/size facts do not select that contract; the metric remains Planned.

### Formal Wording

- Identify position-size reduction across eligible trades under the approved transition contract.

### Normal Conversational Wording

- When did I reduce my size from one trade to the next?; show my size reductions.

### Trader Slang

- When did I size down?; show where I went smaller on the next trade.

### Abbreviations

- `sz reduction` and `size-down seq` may identify the across-trade request with explicit grammar; bare `SR`, `SD`, `DOWN`, or `SIZE` is ticker-, direction-, or field-shaped and must not auto-route.

### Common Misspellings

- Size reducton; sze reduction; size redution.

### Noisy or Incomplete Input

- where sized down; size down next trades; reduced sz July.

### Singular and Plural Forms

- Size reduction; size reductions; position-size decrease transition; across-trade size decreases.

### Full Questions

- Which eligible ordered trades met the approved size-reduction contract?; how often did position size decrease across closed trades?

### Commands

- Analyze size reduction; explain which transition formula or denominator is missing.

### Sentence Fragments

- Size reductions; sized-down transitions; smaller next trade.

### Follow-Up Wording

- What about escalations?; use the prior period; condition on post-win outcomes only after the sequence contract exists.

### Correction Wording

- I meant an across-trade size transition, not reducing or exiting shares within one open position or total shares sold.

### Comparison Wording

- Compare size reduction between two approved groups only after one identical transition formula, unit, and denominator are defined.

### Ranking Wording

- Rank approved groups by size reduction only after the transition metric exists; do not infer that more or less reduction is better.

### Negated Wording

- Do not count scale-outs or exits; not Sell volume; do not assume any negative quantity difference is the approved formula.

### Exclusion Wording

- Exclude a group only through validated filters; do not skip flats, open positions, or decision rows without an approved barrier/equality policy.

### Multi-Filter Wording

- Size reduction for the selected ticker and period within one compatible account/timezone/unit partition; filters do not define the transition formula.

### Multi-Part Question Wording

- Show size reductions, compare the prior period, and explain the transition, equality, denominator, and coverage states.

### Ambiguous Wording

- “Sized down” may mean reducing/exiting one open position, decreasing the next trade's maximum shares, decreasing entered shares, decreasing notional, or lowering account risk. No across-trade formula/unit is approved.

### Negative Examples

- How many scale-outs did I make?; total shares exited from open positions; show Sell volume; tell me why I became disciplined.

### Context Requirements

- Require server-authorized compatible account/currency/account-timezone/Stock-unit scope, accepted stable ordering/ties, one approved across-trade size basis/formula/equality policy, applicable transitions/barriers, denominator, exact facts, and `ready_closed` population.

### Required Data

- Accepted ordered `ready_closed` round trips, explicitly approved size measure, transition pairing/scope, exact comparison formula/unit, equality/tolerance rule, denominator, compatible partitions, zero/empty handling, coverage, and fact revision; the transition contract is absent.

### Optional Data

- Trusted ticker, closing-date range, direction, provenance, accepted labels, Category 3 selected outcome, and existing size/group context only when the future deterministic transition query allowlists them.

### Valid Filters

- Only existing server-authorized `ready_closed` filters where exposed. No transition, predecessor, barrier, equality, or threshold filter is invented by this registry.

### Valid Groupings

- None approved specifically for this named transition metric. Existing date/ticker/direction/provenance/size groups are evidence only until one transition formula and denominator are approved.

### Valid Operators

- Recognize ordered comparison, calculate, summarize, compare, group, rank, explain, sequence analysis, and coverage inspection; no numerical transition operator executes before the contract exists.

### Compatible Intents

- Locked Category 1 intents: `analyze_sequence`, `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, `detect_pattern`, and `inspect_data_quality`.

### Incompatible Combinations

- Category 8 scale-out/reduction/exit substitution, invented delta/percentage/unit/equality/denominator, open/decision silent skipping, incompatible partitions, gross/net or outcome inference, motive/causal label, advice, unauthorized account selection, or claimed Chat runtime.

### Default Interpretation

- Explicit “size reduction” identifies this Planned across-trade transition concept. No size basis, pairing, formula, unit, equality rule, threshold, barrier, or denominator defaults.

### Clarification Conditions

- First clarify whether the user means across-trade size change versus reducing one open position. Do not ask the trader to author the missing product formula or denominator.

### Recommended Clarification Wording

- Do you mean decreasing size across separate closed trades, or reducing shares within one open position?

### Unsupported Conditions

- Missing transition contract, zero eligible transitions, incompatible units/timezones, unsupported filters/groups, unresolved open/decision barriers, unauthorized scope, or absent exact facts returns Planned/unavailable/partial state rather than an invented reduction.

### Target Analytics Tool or Query Capability

- Planned transition-language route using accepted stable order and exact size facts; no current `size_reduction` metric, approved transition formula, or AI Chat route.

### Result Units

- Not established. Any future count, rate, exact size difference, or relative change requires an approved unit/formula/denominator; exact facts remain lossless and display rounding occurs only afterward.

### Fee Handling

- Fees do not define reduction. If transitions are conditioned on Category 3 outcome or compared by performance, Category 2 gross or fee-complete net P/L must use one identical eligible `ready_closed` population.

### Open-Trade Handling

- Across-trade realized transitions use `ready_closed`. Factually `legitimate_open` and `needs_decision` rows remain visible and may be barriers only under an approved rule; they are never silently skipped or classified.

### Sample-Size Considerations

- A future result must show eligible transition, unchanged/equality, and barrier coverage counts. Small samples cannot establish risk control, intent, cause, edge, future behavior, or advice.

## `profit_per_dollar_exposed` Language Registry

### Exact Definition

- Recognize a request to divide one explicitly selected Category 2 realized gross or fee-complete net P/L numerator by one approved dollar-exposure denominator over the identical eligible `ready_closed` population. Neither exposure denominator nor default gross/net basis contract is approved, so return Unavailable without calculation.

### Formal Wording

- Calculate realized profit per approved dollar of exposure for an identical eligible population and selected P/L basis.

### Normal Conversational Wording

- How much profit did I make per dollar exposed?; what did each exposed dollar earn?

### Trader Slang

- P&L per dollar in play; profit per dollar at work; dollars made per exposed buck.

### Abbreviations

- `P/$ exposed` and `PnL per exp $` may identify the request with explicit grammar; bare `PDE`, `ROI`, `P/$`, or `EXP` is ticker-, return-, or field-ambiguous and must not auto-route.

### Common Misspellings

- Profit per dolar exposed; PNL per doller expsoure; profit per expsoed dollar.

### Noisy or Incomplete Input

- profit / exposed $; pnl each dollar in; per buck exposure.

### Singular and Plural Forms

- Profit per dollar exposed; profit per exposed dollar; P/L per exposure dollar.

### Full Questions

- What was my fee-complete net profit per approved dollar exposed for eligible closed trades?; calculate gross P/L per exposure dollar in USD.

### Commands

- Calculate profit per dollar exposed; explain why the exposure denominator is unavailable.

### Sentence Fragments

- Profit per exposed dollar; P/L per dollar in play; exposure-normalized profit.

### Follow-Up Wording

- Use gross P/L instead; what about the prior period?; show return on entry notional instead if that is what I meant.

### Correction Wording

- I meant profit per approved exposure dollar, not return on entry notional, account return, profit per share, or equity return.

### Comparison Wording

- Compare profit per dollar exposed between two periods only under one identical exposure denominator and selected gross/net basis; currently return unavailable.

### Ranking Wording

- Rank approved groups by profit per dollar exposed only after the denominator/basis contract exists; do not rank entry-notional return as a fallback.

### Negated Wording

- Do not use entry notional; not account return; exclude FX estimates, mixed currencies, open P/L, and fee-incomplete net rows.

### Exclusion Wording

- Exclude unsupported denominator rows while reporting coverage; do not silently remove open/decision rows or convert currencies without approved FX.

### Multi-Filter Wording

- Net profit per dollar exposed for the selected ticker and period in one authorized account/currency/timezone/Stock-unit partition; filters do not create the denominator.

### Multi-Part Question Wording

- Show profit per dollar exposed, compare the prior period, and explain denominator, fee, zero, open, and decision coverage.

### Ambiguous Wording

- “Dollar exposed” may mean entry notional, peak cost/notional, marked value, equity, margin, or buying power; “profit” may mean gross or fee-complete net P/L. Neither meaning defaults here.

### Negative Examples

- What was my return on entry notional?; total account return; profit per share; choose entry notional as a reasonable denominator; estimate exposure using current price.

### Context Requirements

- Require server-authorized compatible account/currency/account-timezone/Stock multiplier-one scope, one approved dollar-exposure denominator/time contract, one explicit Category 2 gross or fee-complete net numerator, identical eligible `ready_closed` population, and exact zero/coverage policy.

### Required Data

- Approved exposure denominator definition/time point, exact same-currency denominator values, selected exact realized P/L numerator, fee-complete facts for net, identical `ready_closed` population, Stock multiplier/quote eligibility, zero/unknown policy, coverage, and fact revision; denominator and basis contract are absent.

### Optional Data

- Trusted ticker, closing-date range, direction, provenance, and accepted labels. `return_on_entry_notional` is a separately named alternative only when explicitly requested, never optional denominator evidence for this metric.

### Valid Filters

- No filter makes the unavailable metric calculable. Preserve only server-authorized existing `ready_closed` filters while returning missing-denominator/basis reasons; do not create exposure or FX filters.

### Valid Groupings

- None for a calculated result until the denominator/basis contract exists. Existing date/ticker/direction/provenance/notional groups do not establish exposure and cannot emit this ratio.

### Valid Operators

- Recognize calculate, summarize, compare, group, rank, explain, and coverage inspection; exact division remains unavailable until numerator basis and nonzero exposure denominator are approved.

### Compatible Intents

- Locked Category 1 intents: `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, `explain_concept`, and `inspect_data_quality`.

### Incompatible Combinations

- Entry-notional/account/equity/market/margin fallback, gross/net default or mixing, fee-incomplete net claims, zero/unknown/mixed-currency denominator, unapproved FX, open/decision realized inclusion, trader-authored missing product definition, model estimate, unauthorized scope, causation, advice, or claimed Chat runtime.

### Default Interpretation

- Explicit `profit_per_dollar_exposed` identifies this unavailable exposure-normalized realized P/L metric. No exposure denominator, time point, gross/net basis, FX conversion, or alternative-return fallback defaults.

### Clarification Conditions

- Clarify only when wording plausibly asks for a separately supported metric such as return on entry notional. Do not ask the trader to invent the missing exposure denominator or product formula.

### Recommended Clarification Wording

- Did you mean return on entry notional? Profit per dollar exposed does not have an approved exposure denominator yet.

### Unsupported Conditions

- Missing denominator/basis contract, zero or unknown denominator, mixed currency, unsupported units/multiplier, fee-incomplete required net rows, unsupported filter/group, unauthorized scope, or absent exact facts returns Unavailable/partial coverage, never zero, infinity, FX guess, or estimate.

### Target Analytics Tool or Query Capability

- Unavailable metric-registry response through a future language validator; no current `profit_per_dollar_exposed` calculation or AI Chat route. `return_on_entry_notional` is not a fallback.

### Result Units

- Future exact money-per-money ratio within one declared currency after approval; currently Unavailable. Preserve exact numerator/denominator and round only for display; never return zero/infinity for a missing or zero denominator.

### Fee Handling

- Numerator must explicitly select Category 2 gross P/L or fee-complete net P/L. Net uses one identical fee-complete `ready_closed` population and reports incomplete coverage; fees cannot define or replace exposure.

### Open-Trade Handling

- Realized numerator uses `ready_closed` only. Factually `legitimate_open` and `needs_decision` rows remain visible coverage and are not included in realized P/L or inferred denominator.

### Sample-Size Considerations

- No numeric result exists while unavailable. A future ratio must show eligible, denominator-covered, fee-covered, open, and decision counts; a small sample cannot establish efficiency, edge, cause, optimal size, future performance, or advice.

## Section 6 Completion State

- All 14 canonical language registries received an independent PASS and
  controller acceptance for evaluation production. Comprehensive review also
  passed; the canonical names and registries are approved and locked at
  Version 1.

---

# 7. Evaluation Cases Deliverable

## 7.1 Evaluation Case Schema and Batch Boundary

Every object below uses the locked Category 1 exact 21-key schema and key
order, with explicit empty arrays and `null` values. An independent review
passed the 66 cases for `C6-SIZE-001` through `C6-SIZE-003`, and the
controller accepted that bounded result: 66 passed, with 3 clarification, 6
unsupported, and 3 cross-category cases. An independent review then passed
all 66 Batch 2 cases for `C6-SIZE-004` through `C6-SIZE-006`; the
controller accepted the 132 passed cases globally, with 6 clarification, 32
unsupported, and 6 cross-category cases. An independent review then passed
all 66 Batch 3 cases for `C6-SIZE-007` through `C6-SIZE-009`; the controller
accepted the 198 passed cases globally, with 9 clarification, 78 unsupported,
and 9 cross-category cases. Batch 4 then passed independent review and received
controller acceptance, bringing the global result to 264 passed cases with 12
clarification, 84 unsupported, and 12 cross-category cases. Final Batch 5 also
passed independent review and received controller acceptance. The
comprehensive audit remediated seven cases, and the final recheck passed. All
308 of 308 cases pass with 14 clarification, 108 unsupported, and 14
cross-category cases. This approval and name lock do not authorize Chat or
claim a named runtime.

All quantity cases retain server-authorized compatible account, recorded
currency, account-timezone, and share-unit partitions; they never create a
currency conversion or merge incompatible units. Trusted selected entities,
periods, and result groups may narrow a request only when already present in
authorized context. Exact quantity math retains fractional shares and the
accepted display rule rounds presentation only, to at most two decimals.

## 7.2 Required Case Types

Each saved array has this exact order: canonical, formal paraphrase,
conversational paraphrase, trader slang, abbreviation, misspelling, noisy
input, command, fragment, follow-up, correction, comparison, ranking,
negation, exclusion, multi-filter, multi-part, ambiguity, negative example,
unsupported data, selected entity, and cross-category.

## 7.3 Batch Coverage Summary

| Evaluation state | Count |
|---|---:|
| Saved cases | 308 |
| Passed cases | 308 |
| Final recheck failures | 0 |
| Unsaved cases | 0 |
| Complete 22-case arrays | 14 |

## 7.4 Structured Evaluation Arrays

### `shares_purchased`

```json
[{"caseId":"C6-E1-01","caseType":"canonical","input":"Show my shares purchased.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","current accepted Stock Buy execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Buy-side execution quantity only; preserve fractional shares and presentation-only rounding. Never substitute entered quantity, position size, or allocation fragments."},{"caseId":"C6-E1-02","caseType":"formal_paraphrase","input":"Calculate the exact accepted Stock Buy execution-side quantity total.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","current accepted Stock Buy execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize only execution-side Buy quantity; no named capability or runtime is implied."},{"caseId":"C6-E1-03","caseType":"conversational_paraphrase","input":"How many shares did I buy?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","current accepted Stock Buy execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit Buy wording maps to Buy-side execution activity, not shares entered."},{"caseId":"C6-E1-04","caseType":"trader_slang","input":"How many shares did I scoop?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock Buy side is resolved","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang describes factual Buy-side quantity and makes no intent, conviction, or causation claim."},{"caseId":"C6-E1-05","caseType":"abbreviation","input":"Show buy qty.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit Buy quantity grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"`buy qty` is safe only with explicit quantity grammar; bare ticker-shaped abbreviations do not auto-route."},{"caseId":"C6-E1-06","caseType":"misspelling","input":"Show shares purchsed.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the spelling without changing the Buy-side quantity meaning."},{"caseId":"C6-E1-07","caseType":"noisy_input","input":"buy sh total pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit Buy and share-total grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy input still requires an exact scoped factual total."},{"caseId":"C6-E1-08","caseType":"command","input":"Calculate shares purchased.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","current accepted Stock Buy execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A calculation request does not authorize a write or claim an available language runtime."},{"caseId":"C6-E1-09","caseType":"fragment","input":"Buy-side shares.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit Buy-side quantity grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is a total request, not an instruction to buy."},{"caseId":"C6-E1-10","caseType":"follow_up","input":"How many shares did I purchase in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted prior metric and period context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only trusted prior context; never invent a date range."},{"caseId":"C6-E1-11","caseType":"correction","input":"I meant Buy execution quantity, not shares entered.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted prior context when present","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correct to execution-side quantity and do not substitute the entered-quantity semantic."},{"caseId":"C6-E1-12","caseType":"comparison","input":"Compare shares purchased across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once","comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"shares_purchased"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two trusted compatible selections","same server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","separate coverage for each selection"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compare only compatible scoped totals; no causal explanation follows."},{"caseId":"C6-E1-13","caseType":"ranking","input":"Rank trusted compatible result groups by shares purchased.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["trusted compatible approved group context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","coverage for every ranked group"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No unapproved grouping or tie rule is invented."},{"caseId":"C6-E1-14","caseType":"negation","input":"Show shares purchased, not shares entered.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":["exclude entered-quantity interpretation"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock Buy execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The negation protects the execution-side definition."},{"caseId":"C6-E1-15","caseType":"exclusion","input":"Show shares purchased excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["trusted selected ticker context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not infer an identifier or widen account scope."},{"caseId":"C6-E1-16","caseType":"multi_filter","input":"Show shares purchased for the trusted selected ticker and trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["trusted selected ticker and period context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","declared execution-time date interpretation","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The eventual query must allowlist both trusted filters."},{"caseId":"C6-E1-17","caseType":"multi_part","input":"Show shares purchased, compare the trusted prior period, and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"shares_purchased"},"expectedTimeRange":"trusted current and prior date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted current and prior period context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","separate quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep ready_closed, legitimate_open, and needs_decision activity coverage factual and separate."},{"caseId":"C6-E1-18","caseType":"ambiguity","input":"How many shares did I buy into positions?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved quantity basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean total Buy-side execution quantity or shares entered into positions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose execution-side quantity when entry semantics are requested."},{"caseId":"C6-E1-19","caseType":"negative_example","input":"What share size should I buy?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no advice, prediction, or prescribed sizing"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; a descriptive quantity total cannot recommend an action.","notes":"This must not map to a Buy-side factual aggregate."},{"caseId":"C6-E1-20","caseType":"unsupported_data","input":"Sum Buy-side quantities across incompatible units.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum only within compatible share-unit partition"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["compatible share-unit partition required","no quantity conversion or mixed-unit aggregation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Buy-side quantity is unavailable for incompatible units, missing accepted side or quantity, stale/duplicate versions, or unauthorized scope; never convert, estimate, or merge it.","notes":"Coverage may be partial or unavailable, never invented."},{"caseId":"C6-E1-21","caseType":"selected_entity_context","input":"For the trusted selected ticker, show shares purchased.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":["trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Buy execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ticker context","expectedContextRequirements":["trusted selected entity context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use selected context only when trusted; no client-provided account authority is accepted."},{"caseId":"C6-E1-22","caseType":"cross_category","input":"Explain whether the trusted result's shares purchased is Buy-side quantity rather than shares entered.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["shares_purchased"],"expectedFilters":["trusted result selection"],"expectedGroupings":[],"expectedOperators":["exact execution-side quantity basis","explain boundary"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["trusted result context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","Category 8 entered-quantity boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category explanation preserves the distinction without inventing an entry metric result."}]
```

### `shares_sold`

```json
[{"caseId":"C6-E2-01","caseType":"canonical","input":"Show my shares sold.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","current accepted Stock Sell execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Sell-side execution quantity only; preserve fractional shares and presentation-only rounding. Never substitute exited quantity, position size, or allocation fragments."},{"caseId":"C6-E2-02","caseType":"formal_paraphrase","input":"Calculate the exact accepted Stock Sell execution-side quantity total.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","current accepted Stock Sell execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize only execution-side Sell quantity; no named capability or runtime is implied."},{"caseId":"C6-E2-03","caseType":"conversational_paraphrase","input":"How many shares did I sell?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","current accepted Stock Sell execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit Sell wording maps to Sell-side execution activity, not shares exited."},{"caseId":"C6-E2-04","caseType":"trader_slang","input":"How many shares did I dump?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock Sell side is resolved","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang describes factual Sell-side quantity and makes no motive or causation claim."},{"caseId":"C6-E2-05","caseType":"abbreviation","input":"Show sell qty.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit Sell quantity grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"`sell qty` is safe only with explicit quantity grammar; bare ticker-shaped abbreviations do not auto-route."},{"caseId":"C6-E2-06","caseType":"misspelling","input":"Show shares slod.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the spelling without changing the Sell-side quantity meaning."},{"caseId":"C6-E2-07","caseType":"noisy_input","input":"sell sh total pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit Sell and share-total grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy input still requires an exact scoped factual total."},{"caseId":"C6-E2-08","caseType":"command","input":"Calculate shares sold.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","current accepted Stock Sell execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A calculation request does not authorize a write or claim an available language runtime."},{"caseId":"C6-E2-09","caseType":"fragment","input":"Sell-side shares.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit Sell-side quantity grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is a total request, not an instruction to sell."},{"caseId":"C6-E2-10","caseType":"follow_up","input":"How many shares did I sell in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted prior metric and period context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only trusted prior context; never invent a date range."},{"caseId":"C6-E2-11","caseType":"correction","input":"I meant Sell execution quantity, not shares exited.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted prior context when present","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correct to execution-side quantity and do not substitute the exited-quantity semantic."},{"caseId":"C6-E2-12","caseType":"comparison","input":"Compare shares sold across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once","comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"shares_sold"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two trusted compatible selections","same server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","separate coverage for each selection"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compare only compatible scoped totals; no causal explanation follows."},{"caseId":"C6-E2-13","caseType":"ranking","input":"Rank trusted compatible result groups by shares sold.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["trusted compatible approved group context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","coverage for every ranked group"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No unapproved grouping or tie rule is invented."},{"caseId":"C6-E2-14","caseType":"negation","input":"Show shares sold, not shares exited.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":["exclude exited-quantity interpretation"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock Sell execution facts","quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The negation protects the execution-side definition."},{"caseId":"C6-E2-15","caseType":"exclusion","input":"Show shares sold excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["trusted selected ticker context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not infer an identifier or widen account scope."},{"caseId":"C6-E2-16","caseType":"multi_filter","input":"Show shares sold for the trusted selected ticker and trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["trusted selected ticker and period context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","declared execution-time date interpretation","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The eventual query must allowlist both trusted filters."},{"caseId":"C6-E2-17","caseType":"multi_part","input":"Show shares sold, compare the trusted prior period, and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"shares_sold"},"expectedTimeRange":"trusted current and prior date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted current and prior period context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","separate quantity/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep ready_closed, legitimate_open, and needs_decision activity coverage factual and separate."},{"caseId":"C6-E2-18","caseType":"ambiguity","input":"How many shares did I sell out of positions?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved quantity basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean total Sell-side execution quantity or shares exited from positions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose execution-side quantity when exit semantics are requested."},{"caseId":"C6-E2-19","caseType":"negative_example","input":"What share size should I sell?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no advice, prediction, or prescribed sizing"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; a descriptive quantity total cannot recommend an action.","notes":"This must not map to a Sell-side factual aggregate."},{"caseId":"C6-E2-20","caseType":"unsupported_data","input":"Sum Sell-side quantities across incompatible units.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum only within compatible share-unit partition"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["compatible share-unit partition required","no quantity conversion or mixed-unit aggregation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Sell-side quantity is unavailable for incompatible units, missing accepted side or quantity, stale/duplicate versions, or unauthorized scope; never convert, estimate, or merge it.","notes":"Coverage may be partial or unavailable, never invented."},{"caseId":"C6-E2-21","caseType":"selected_entity_context","input":"For the trusted selected ticker, show shares sold.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":["trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact sum of accepted Stock Sell execution quantities once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ticker context","expectedContextRequirements":["trusted selected entity context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","accepted Stock facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use selected context only when trusted; no client-provided account authority is accepted."},{"caseId":"C6-E2-22","caseType":"cross_category","input":"Explain whether the trusted result's shares sold is Sell-side quantity rather than shares exited.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["shares_sold"],"expectedFilters":["trusted result selection"],"expectedGroupings":[],"expectedOperators":["exact execution-side quantity basis","explain boundary"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["trusted result context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","Category 8 exited-quantity boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category explanation preserves the distinction without inventing an exit metric result."}]
```

### `average_position_size`

```json
[{"caseId":"C6-E3-01","caseType":"canonical","input":"Show my average position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","quantity/allocation coverage","legitimate_open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Arithmetic mean of each eligible closed trade's maximum absolute open quantity; preserve fractional shares and presentation-only rounding."},{"caseId":"C6-E3-02","caseType":"formal_paraphrase","input":"Calculate the arithmetic mean of per-round-trip maximum absolute open quantities.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","quantity/allocation coverage","legitimate_open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No execution-quantity, entered-quantity, notional, or dollar-exposure substitution."},{"caseId":"C6-E3-03","caseType":"conversational_paraphrase","input":"On average, what was the most shares I held per closed trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","quantity/allocation coverage","legitimate_open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The denominator is eligible closed round trips, not executions."},{"caseId":"C6-E3-04","caseType":"trader_slang","input":"What's my usual max size on average?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit average and maximum-position grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Descriptive average only; it does not establish a normal baseline, ideal size, edge, or advice."},{"caseId":"C6-E3-05","caseType":"abbreviation","input":"Show avg pos size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit average position-size grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit grammar is required; bare ticker-shaped abbreviations do not auto-route."},{"caseId":"C6-E3-06","caseType":"misspelling","input":"Show avarage postion size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing the maximum-open-quantity definition."},{"caseId":"C6-E3-07","caseType":"noisy_input","input":"avg max held","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit average maximum-held grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy language remains a quantity mean, never a money or risk result."},{"caseId":"C6-E3-08","caseType":"command","input":"Calculate average position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","quantity/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A calculation request does not authorize a write or infer a language runtime."},{"caseId":"C6-E3-09","caseType":"fragment","input":"Mean max shares.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit mean maximum-share grammar","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment refers to the exact average of per-round-trip maxima."},{"caseId":"C6-E3-10","caseType":"follow_up","input":"What was my average position size in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":"trusted prior closing-date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted prior metric and closing-date context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only trusted closing-date context in the account timezone; never invent a date."},{"caseId":"C6-E3-11","caseType":"correction","input":"I meant average maximum shares held per closed trade, not average execution quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior closing-date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted prior context when present","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correct to the accepted per-round-trip maximum-open quantity basis."},{"caseId":"C6-E3-12","caseType":"comparison","input":"Compare average position size across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division","comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"average_position_size"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two trusted compatible selections","same server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","separate eligible/open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compare descriptive means only; do not infer cause, quality, or an action."},{"caseId":"C6-E3-13","caseType":"ranking","input":"Rank trusted compatible result groups by average position size.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["trusted compatible approved group context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible and coverage counts for every group"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No new threshold, account merge, or unapproved group is introduced."},{"caseId":"C6-E3-14","caseType":"negation","input":"Show average position size, not average execution quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":["exclude execution-quantity interpretation"],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","quantity/allocation coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The negation protects the maximum-open-quantity basis."},{"caseId":"C6-E3-15","caseType":"exclusion","input":"Show average position size excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["trusted selected ticker context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Report coverage after applying the trusted exclusion."},{"caseId":"C6-E3-16","caseType":"multi_filter","input":"Show average position size for the trusted selected ticker and trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["trusted selected ticker and period context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","declared closing-date interpretation","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only existing allowlisted filters from trusted context."},{"caseId":"C6-E3-17","caseType":"multi_part","input":"Show average position size, compare the trusted prior period, and include eligible, open, and decision coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"average_position_size"},"expectedTimeRange":"trusted current and prior closing-date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted current and prior period context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","separate ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows remain visible coverage and never enter the realized mean."},{"caseId":"C6-E3-18","caseType":"ambiguity","input":"What's my average size?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved size basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean average maximum shares held per closed trade, average execution quantity, or dollar exposure?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not default a bare average-size request to shares, dollars, or risk."},{"caseId":"C6-E3-19","caseType":"negative_example","input":"What average position size should I use?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no advice, prediction, or prescribed sizing"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; a descriptive historical mean cannot recommend an action.","notes":"The metric describes covered history only."},{"caseId":"C6-E3-20","caseType":"unsupported_data","input":"Include open or decision rows in the realized average position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["ready_closed eligible mean only","coverage inspection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["accepted allocation and maximum-position facts","eligible covered Stock ready_closed round trips","open and decision rows retained as coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The realized mean is unavailable for zero eligible count, missing or unreconciled quantity/allocation facts, incompatible units, unauthorized scope, or unsupported filters; legitimate_open and needs_decision rows are coverage, never mean members.","notes":"Never return zero or an estimate for an unavailable denominator."},{"caseId":"C6-E3-21","caseType":"selected_entity_context","input":"For the trusted selected result, show average position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_position_size"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact per-round-trip maximum absolute open quantity","exact sum","eligible count","rational division"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected result context","expectedContextRequirements":["trusted selected entity context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use trusted selected context only and preserve its coverage."},{"caseId":"C6-E3-22","caseType":"cross_category","input":"Compare average position size with the trusted selection's net P&L without treating either as a cause.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["average_position_size","net_pnl"],"expectedFilters":["trusted compatible selection"],"expectedGroupings":[],"expectedOperators":["exact position-size mean","declared fee basis for net P&L","descriptive comparison only"],"expectedComparison":{"left":"average_position_size","right":"net_pnl","basis":"trusted compatible selection"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["trusted compatible result context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible ready_closed population","fee coverage for net P&L"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category comparison keeps quantity and money units distinct and reports association only, never causation or advice."}]
```

### `median_position_size`

```json
[{"caseId":"C6-E4-01","caseType":"canonical","input":"Show my median position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-02","caseType":"formal_paraphrase","input":"Calculate the median of maximum open quantities.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-03","caseType":"conversational_paraphrase","input":"What was my middle maximum share amount?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-04","caseType":"trader_slang","input":"What's my middle max size?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-05","caseType":"abbreviation","input":"Show med pos size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-06","caseType":"misspelling","input":"Show medain postion size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-07","caseType":"noisy_input","input":"middle max held","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-08","caseType":"command","input":"Calculate median position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-09","caseType":"fragment","input":"Median max shares.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-10","caseType":"follow_up","input":"What was my median position size in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":"trusted prior closing-date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted prior context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-11","caseType":"correction","input":"I meant median maximum shares held, not execution quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior closing-date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-12","caseType":"comparison","input":"Compare median position size across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities","comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"median_position_size"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-13","caseType":"ranking","input":"Rank trusted compatible result groups by median position size.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["exact median of maximum absolute open quantities","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-14","caseType":"negation","input":"Show median position size, not execution quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":["exclude alternate meaning"],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-15","caseType":"exclusion","input":"Show median position size excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-16","caseType":"multi_filter","input":"Show median position size for the trusted selected ticker and trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-17","caseType":"multi_part","input":"Show median position size, compare the trusted prior period, and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"median_position_size"},"expectedTimeRange":"trusted current and prior closing-date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-18","caseType":"ambiguity","input":"What's my median size?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean maximum shares held per closed trade, execution quantity, or dollar exposure?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-19","caseType":"negative_example","input":"What median position size should I use?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no advice or prescribed sizing"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; a descriptive historical metric cannot recommend an action.","notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-20","caseType":"unsupported_data","input":"Include open or decision rows in the realized median position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Open and decision rows are coverage, never realized members; zero eligible, missing facts, incompatible units, unauthorized scope, or unsupported filters return unavailable.","notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-21","caseType":"selected_entity_context","input":"For the trusted selected result, show median position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_position_size"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected result context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."},{"caseId":"C6-E4-22","caseType":"cross_category","input":"Compare median position size with the trusted selection's net P&L without treating either as a cause.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["median_position_size","net_pnl"],"expectedFilters":["trusted compatible selection"],"expectedGroupings":[],"expectedOperators":["exact median of maximum absolute open quantities","descriptive comparison only"],"expectedComparison":{"left":"median_position_size","right":"net_pnl","basis":"trusted compatible selection"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact quantity math, exact even median midpoint, and presentation-only rounding to at most two decimals."}]
```

---

### `maximum_position_size`

```json
[{"caseId":"C6-E5-01","caseType":"canonical","input":"Show my maximum position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-02","caseType":"formal_paraphrase","input":"Calculate the maximum of per-round-trip maximum open quantities.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-03","caseType":"conversational_paraphrase","input":"What was the most shares I held in a closed trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-04","caseType":"trader_slang","input":"What's my biggest full size?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-05","caseType":"abbreviation","input":"Show max pos size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-06","caseType":"misspelling","input":"Show maxium postion size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-07","caseType":"noisy_input","input":"biggest max held","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-08","caseType":"command","input":"Calculate maximum position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-09","caseType":"fragment","input":"Biggest max shares.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-10","caseType":"follow_up","input":"What was my maximum position size in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":"trusted prior closing-date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["trusted prior context","server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-11","caseType":"correction","input":"I meant maximum shares held, not the largest execution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior closing-date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-12","caseType":"comparison","input":"Compare maximum position size across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities","comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"maximum_position_size"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-13","caseType":"ranking","input":"Rank trusted compatible result groups by maximum position size.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-14","caseType":"negation","input":"Show maximum position size, not the largest execution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":["exclude alternate meaning"],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-15","caseType":"exclusion","input":"Show maximum position size excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-16","caseType":"multi_filter","input":"Show maximum position size for the trusted selected ticker and trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-17","caseType":"multi_part","input":"Show maximum position size, compare the trusted prior period, and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"maximum_position_size"},"expectedTimeRange":"trusted current and prior closing-date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-18","caseType":"ambiguity","input":"What's my maximum size?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean maximum shares held per closed trade, execution quantity, or dollar exposure?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-19","caseType":"negative_example","input":"What maximum position size should I use?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no advice or prescribed sizing"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; a descriptive historical metric cannot recommend an action.","notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-20","caseType":"unsupported_data","input":"Include open or decision rows in the realized maximum position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Open and decision rows are coverage, never realized members; zero eligible, missing facts, incompatible units, unauthorized scope, or unsupported filters return unavailable.","notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-21","caseType":"selected_entity_context","input":"For the trusted selected result, show maximum position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_position_size"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected result context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."},{"caseId":"C6-E5-22","caseType":"cross_category","input":"Compare maximum position size with the trusted selection's net P&L without treating either as a cause.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["maximum_position_size","net_pnl"],"expectedFilters":["trusted compatible selection"],"expectedGroupings":[],"expectedOperators":["exact maximum of per-round-trip maximum absolute open quantities","descriptive comparison only"],"expectedComparison":{"left":"maximum_position_size","right":"net_pnl","basis":"trusted compatible selection"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and share-unit partitions","eligible covered Stock ready_closed round trips","open and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned named capability only; no silent alias, runtime claim, or entered-quantity substitution."}]
```

---

### `average_dollar_exposure`

```json
[{"caseId":"C6-E6-01","caseType":"canonical","input":"Show my average dollar exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-02","caseType":"formal_paraphrase","input":"Calculate average dollar exposure under an approved exposure contract.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-03","caseType":"conversational_paraphrase","input":"How many dollars did I usually have exposed?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-04","caseType":"trader_slang","input":"What's my average dollars at work?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-05","caseType":"abbreviation","input":"Show avg $ exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-06","caseType":"misspelling","input":"Show avarage dolar exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-07","caseType":"noisy_input","input":"avg $ exp","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-08","caseType":"command","input":"Calculate average dollar exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-09","caseType":"fragment","input":"Average dollars exposed.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-10","caseType":"follow_up","input":"What about average dollar exposure in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":"trusted prior closing-date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-11","caseType":"correction","input":"I meant generic dollar exposure, not entry notional.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior closing-date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-12","caseType":"comparison","input":"Compare average dollar exposure across the two trusted selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point","comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"average_dollar_exposure"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-13","caseType":"ranking","input":"Rank trusted compatible result groups by average dollar exposure.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-14","caseType":"negation","input":"Show average dollar exposure, not entry notional.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":["exclude alternate meaning"],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-15","caseType":"exclusion","input":"Show average dollar exposure excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-16","caseType":"multi_filter","input":"Show average dollar exposure for the trusted selected ticker and trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-17","caseType":"multi_part","input":"Show average dollar exposure, compare the trusted prior period, and explain what is missing.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"average_dollar_exposure"},"expectedTimeRange":"trusted current and prior closing-date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-18","caseType":"ambiguity","input":"What's my average dollars in a position?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean average entry notional? Generic average dollar exposure has no approved basis yet.","unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-19","caseType":"negative_example","input":"What average dollar exposure should I use?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; a descriptive historical metric cannot recommend an action.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-20","caseType":"unsupported_data","input":"Use entry notional, market value, equity, margin, buying power, or FX as a fallback.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved generic exposure basis or time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-21","caseType":"selected_entity_context","input":"For the trusted selected result, show average dollar exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected result context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."},{"caseId":"C6-E6-22","caseType":"cross_category","input":"Compare average dollar exposure with the trusted selection's net P&L without treating either as a cause.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["average_dollar_exposure"],"expectedFilters":["trusted compatible selection"],"expectedGroupings":[],"expectedOperators":["unavailable generic exposure: no approved denominator, basis, or time point","descriptive comparison only"],"expectedComparison":{"left":"average_dollar_exposure","right":"net_pnl","basis":"trusted compatible selection"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible scope","open and decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic average dollar exposure is unavailable because the product has no approved denominator, exposure basis, or time point; no fallback may be substituted.","notes":"Recognition never creates a product contract or numeric result; preserve authorized context."}]
```

### `maximum_dollar_exposure`

```json
[{"caseId":"C6-E7-01","caseType":"canonical","input":"Show my maximum dollar exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-02","caseType":"formal_paraphrase","input":"Calculate the maximum dollar exposure using an approved exposure basis and observation time point.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-03","caseType":"conversational_paraphrase","input":"What was the most money I had exposed?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-04","caseType":"trader_slang","input":"What was my biggest dollar risk on?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-05","caseType":"abbreviation","input":"Show max dollar exp.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-06","caseType":"misspelling","input":"Show my maximum dollar expossure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-07","caseType":"noisy_input","input":"max dollar exposure pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-08","caseType":"command","input":"Calculate maximum dollar exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-09","caseType":"fragment","input":"Maximum dollar exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-10","caseType":"follow_up","input":"What was my maximum dollar exposure in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-11","caseType":"correction","input":"I meant maximum dollar exposure, not maximum share position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-12","caseType":"comparison","input":"Compare maximum dollar exposure across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point","comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"maximum_dollar_exposure"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-13","caseType":"ranking","input":"Rank trusted compatible result groups by maximum dollar exposure.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-14","caseType":"negation","input":"Show maximum dollar exposure, not maximum position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":["exclude maximum_position_size interpretation"],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-15","caseType":"exclusion","input":"Show maximum dollar exposure excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-16","caseType":"multi_filter","input":"Show maximum dollar exposure for the trusted selected ticker and trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-17","caseType":"multi_part","input":"Show maximum dollar exposure, compare the trusted prior period, and explain what is missing.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"maximum_dollar_exposure"},"expectedTimeRange":"trusted current and prior date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-18","caseType":"ambiguity","input":"What is the most dollars I had in a position?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean maximum entry notional? Generic maximum dollar exposure has no approved basis yet.","unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-19","caseType":"negative_example","input":"What maximum dollar exposure should I use?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; a descriptive historical metric cannot recommend an action.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-20","caseType":"unsupported_data","input":"Use entry notional, market value, equity, margin, buying power, or FX as the maximum-exposure fallback.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved generic exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-21","caseType":"selected_entity_context","input":"For the trusted selected result, show maximum dollar exposure.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected result context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E7-22","caseType":"cross_category","input":"Compare maximum dollar exposure with the trusted selection's net P&L without treating either as a cause.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["maximum_dollar_exposure"],"expectedFilters":["trusted compatible selection"],"expectedGroupings":[],"expectedOperators":["unavailable generic maximum exposure: no approved basis or observation time point","descriptive comparison only"],"expectedComparison":{"left":"maximum_dollar_exposure","right":"net_pnl","basis":"trusted compatible selection"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["no approved generic exposure basis or observation time point","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic maximum dollar exposure is unavailable because no approved exposure basis or observation time point exists; do not substitute entry notional, market value, equity, margin, buying power, or FX.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."}]
```

### `size_relative_to_normal_size`

```json
[{"caseId":"C6-E8-01","caseType":"canonical","input":"Show my size relative to normal size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-02","caseType":"formal_paraphrase","input":"Calculate the ratio of each position size to its approved normal-size baseline.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-03","caseType":"conversational_paraphrase","input":"How big was I trading compared with normal?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-04","caseType":"trader_slang","input":"Was I sizing up from my usual?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-05","caseType":"abbreviation","input":"Show normal-size ratio.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-06","caseType":"misspelling","input":"Show size relative to normal sze.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-07","caseType":"noisy_input","input":"normal size compare pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-08","caseType":"command","input":"Calculate size relative to normal size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-09","caseType":"fragment","input":"Relative to normal size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-10","caseType":"follow_up","input":"How was my size relative to normal in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-11","caseType":"correction","input":"I meant size relative to normal, not absolute maximum position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-12","caseType":"comparison","input":"Compare size relative to normal across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract","comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"size_relative_to_normal_size"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-13","caseType":"ranking","input":"Rank trusted compatible result groups by size relative to normal size.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-14","caseType":"negation","input":"Show size relative to normal, not a recommended size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":["exclude recommended-size interpretation"],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-15","caseType":"exclusion","input":"Show size relative to normal excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-16","caseType":"multi_filter","input":"Show size relative to normal for the trusted selected ticker and trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-17","caseType":"multi_part","input":"Show size relative to normal, compare the trusted prior period, and explain what is missing.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"size_relative_to_normal_size"},"expectedTimeRange":"trusted current and prior date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-18","caseType":"ambiguity","input":"Was I trading bigger than usual?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size","median_position_size"],"expectedFilters":["trusted selected period"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"trusted selected period context","expectedSelectedEntity":"trusted selected period context","expectedContextRequirements":["size_relative_to_normal_size remains unavailable because no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule exists","trusted selected period and server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","the separately Supported median_position_size is a descriptive result over eligible ready_closed Stock round trips; legitimate_open and needs_decision coverage remains separate"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Would you like to see your median position size for the selected period instead?","unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; the separately Supported median_position_size may be offered only as a descriptive alternative for the trusted selected period.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-19","caseType":"negative_example","input":"What normal size should I use?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; a descriptive historical metric cannot recommend an action.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-20","caseType":"unsupported_data","input":"Use the current average, an unversioned lookback, or a zero baseline as the normal-size fallback.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; do not infer a current average, unversioned lookback, or zero baseline.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-21","caseType":"selected_entity_context","input":"For the trusted selected result, show size relative to normal size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected result context","expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E8-22","caseType":"cross_category","input":"Compare size relative to normal with the trusted selection's net P&L without treating either as a cause.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["size_relative_to_normal_size"],"expectedFilters":["trusted compatible selection"],"expectedGroupings":[],"expectedOperators":["unavailable normal-size ratio: no approved versioned baseline contract","descriptive comparison only"],"expectedComparison":{"left":"size_relative_to_normal_size","right":"net_pnl","basis":"trusted compatible selection"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["no approved versioned normal-size baseline, scope, lookback, subject-exclusion, or zero rule","server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","ready_closed, legitimate_open, and needs_decision coverage retained separately"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Size relative to normal size is unavailable because no approved versioned normal baseline, scope, lookback, subject-exclusion, or zero rule exists; no trader-authored historical product definition or fallback may be inferred.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."}]
```

### `performance_by_size_bucket`

```json
[{"caseId":"C6-E9-01","caseType":"canonical","input":"Show performance by size bucket.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-02","caseType":"formal_paraphrase","input":"Group realized performance by an explicitly selected approved size basis and bucket definition.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-03","caseType":"conversational_paraphrase","input":"How did I do small versus big?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-04","caseType":"trader_slang","input":"Did my bigger size trade better?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-05","caseType":"abbreviation","input":"Show size-bucket P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-06","caseType":"misspelling","input":"Show performance by size buket.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-07","caseType":"noisy_input","input":"small vs big perf pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-08","caseType":"command","input":"Group performance by size bucket.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-09","caseType":"fragment","input":"Performance by size bucket.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-10","caseType":"follow_up","input":"How did size buckets perform in that trusted prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":["trusted prior period"],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-11","caseType":"correction","input":"I meant performance grouped by size bucket, not a size recommendation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract","metric correction"],"expectedComparison":null,"expectedTimeRange":"trusted prior date context","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-12","caseType":"comparison","input":"Compare performance by the two trusted explicitly defined size-bucket selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":["trusted first explicitly defined size-bucket selection","trusted second explicitly defined size-bucket selection"],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract","comparison"],"expectedComparison":{"left":"trusted first explicitly defined size-bucket selection","right":"trusted second explicitly defined size-bucket selection","basis":"performance_by_size_bucket"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-13","caseType":"ranking","input":"Rank trusted compatible approved size-bucket result groups by explicitly selected gross performance.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved size-bucket result group"],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-14","caseType":"negation","input":"Show performance by size bucket, not a claim that size caused results.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":["exclude causal interpretation"],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-15","caseType":"exclusion","input":"Show performance by size bucket excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract","exclude"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-16","caseType":"multi_filter","input":"Show performance by the trusted selected size-bucket grouping for the trusted period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":["trusted selected size-bucket grouping","trusted declared period"],"expectedGroupings":["trusted selected size-bucket grouping"],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract","filter"],"expectedComparison":null,"expectedTimeRange":"trusted declared period","expectedSelectedEntity":"trusted selected size-bucket grouping context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-17","caseType":"multi_part","input":"Show performance by size bucket, compare the trusted prior period, and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract","comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"performance_by_size_bucket"},"expectedTimeRange":"trusted current and prior date contexts","expectedSelectedEntity":"trusted prior query context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-18","caseType":"ambiguity","input":"Did small or big size work better?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which size basis should apply: maximum position, entered quantity, or entry notional?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-19","caseType":"negative_example","input":"Which size bucket should I trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed sizing are unsupported; descriptive historical grouping cannot recommend an action.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-20","caseType":"unsupported_data","input":"Use an unstated size basis, automatic thresholds, or mixed gross and fee-incomplete net P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return planned boundary and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No default size basis, bucket thresholds, or Category 2 gross or fee-complete net performance contract is approved; do not invent one.","notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-21","caseType":"selected_entity_context","input":"For the trusted selected result grouping, show performance by size bucket.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":["trusted selected result grouping"],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected result grouping context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."},{"caseId":"C6-E9-22","caseType":"cross_category","input":"Compare performance by size bucket with the trusted selection's net P&L without treating size as a cause.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["performance_by_size_bucket"],"expectedFilters":["trusted compatible selection"],"expectedGroupings":[],"expectedOperators":["planned size-bucket performance: no default size basis, thresholds, or P/L contract","descriptive comparison only"],"expectedComparison":{"left":"performance_by_size_bucket","right":"net_pnl","basis":"trusted compatible selection"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted result context","expectedContextRequirements":["server-authorized compatible account, recorded-currency, account-timezone, and Stock multiplier-one scope","accepted ready_closed round trips for realized performance; legitimate_open and needs_decision coverage retained separately","explicit size basis, bucket thresholds, and Category 2 gross or fee-complete net P/L contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Analytical interpretation only; no runtime, mutation, prediction, advice, or causal claim."}]
```

---


### `size_after_wins`

```json
[
  {
    "caseId": "C6-E10-01",
    "caseType": "canonical",
    "input": "Show size after wins.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-02",
    "caseType": "formal_paraphrase",
    "input": "Summarize position size following wins under the approved predecessor and outcome contracts.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-03",
    "caseType": "conversational_paraphrase",
    "input": "How big do I trade after a win?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-04",
    "caseType": "trader_slang",
    "input": "Do I size up after green trades?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-05",
    "caseType": "abbreviation",
    "input": "Show sz post win.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-06",
    "caseType": "misspelling",
    "input": "Show size afer wins.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-07",
    "caseType": "noisy_input",
    "input": "after green how big",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-08",
    "caseType": "command",
    "input": "Analyze size after wins.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-09",
    "caseType": "fragment",
    "input": "Post-winner size.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-10",
    "caseType": "follow_up",
    "input": "What about size after wins in that trusted prior period?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted prior date context",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-11",
    "caseType": "correction",
    "input": "I mean size on trades following wins, not size during winning trades.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-12",
    "caseType": "comparison",
    "input": "Compare size after wins across two trusted compatible selections.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [
      "trusted first selection",
      "trusted second selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": {
      "left": "trusted first selection",
      "right": "trusted second selection",
      "basis": "size_after_wins"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-13",
    "caseType": "ranking",
    "input": "Rank trusted compatible result groups by size after wins.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [
      "group_and_aggregate",
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [
      "trusted compatible approved result group"
    ],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "descending",
      "deterministic tie policy"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted group context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-14",
    "caseType": "negation",
    "input": "Show size after wins, not a claim that winning caused the size.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [
      "exclude causal or alternate meaning"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "exclude alternate meaning"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-15",
    "caseType": "exclusion",
    "input": "Show size after wins excluding the trusted selected ticker.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [
      "exclude trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "exclude"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-16",
    "caseType": "multi_filter",
    "input": "Show size after wins for the trusted selected ticker and trusted declared period.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [
      "trusted selected ticker",
      "trusted declared period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "filter"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted declared period",
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-17",
    "caseType": "multi_part",
    "input": "Show size after wins, compare the trusted prior period, and include coverage.",
    "expectedPrimaryIntent": "summarize_performance",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "compare_groups",
      "inspect_data_quality"
    ],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [
      "trusted current period",
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "comparison",
      "coverage inspection"
    ],
    "expectedComparison": {
      "left": "trusted current period",
      "right": "trusted prior period",
      "basis": "size_after_wins"
    },
    "expectedTimeRange": "trusted current and prior date contexts",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-18",
    "caseType": "ambiguity",
    "input": "For size after a win, what size basis and which next trade count?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "metric routing"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Should 'after a win' use the next eligible closed trade in the same account scope or only the next closed trade for the same ticker?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-19",
    "caseType": "negative_example",
    "input": "What size should I use after a win?",
    "expectedPrimaryIntent": "unsupported_request",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unsupported request"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "no advice, prediction, prescribed sizing, motive, or causal diagnosis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Trading advice and prescribed sizing are unsupported; descriptive historical analysis cannot recommend an action.",
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-20",
    "caseType": "unsupported_data",
    "input": "Calculate size after wins without a predecessor or barrier policy.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "return planned boundary and coverage"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "No predecessor scope, barrier policy, selected size measure, aggregate, or outcome contract is approved; do not invent one.",
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-21",
    "caseType": "selected_entity_context",
    "input": "For the trusted selected ticker, show size after wins.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_wins"
    ],
    "expectedFilters": [
      "trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted server-authorized selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E10-22",
    "caseType": "cross_category",
    "input": "Compare size after wins with size after losses for the trusted compatible selection without assigning a cause.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "explain_result"
    ],
    "expectedCanonicalConcepts": [
      "size_after_wins",
      "size_after_losses"
    ],
    "expectedFilters": [
      "trusted compatible selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-win sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "descriptive comparison only"
    ],
    "expectedComparison": {
      "left": "size_after_wins",
      "right": "size_after_losses",
      "basis": "trusted compatible selection"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted result context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  }
]
```

### `size_after_losses`

```json
[
  {
    "caseId": "C6-E11-01",
    "caseType": "canonical",
    "input": "Show size after losses.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-02",
    "caseType": "formal_paraphrase",
    "input": "Summarize position size following losses under the approved predecessor and outcome contracts.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-03",
    "caseType": "conversational_paraphrase",
    "input": "How big do I trade after a loss?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-04",
    "caseType": "trader_slang",
    "input": "Do I size up after red trades?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-05",
    "caseType": "abbreviation",
    "input": "Show sz post loss.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-06",
    "caseType": "misspelling",
    "input": "Show size afer losses.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-07",
    "caseType": "noisy_input",
    "input": "after red how big",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-08",
    "caseType": "command",
    "input": "Analyze size after losses.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-09",
    "caseType": "fragment",
    "input": "Post-loser size.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-10",
    "caseType": "follow_up",
    "input": "What about size after losses in that trusted prior period?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted prior date context",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-11",
    "caseType": "correction",
    "input": "I mean size on trades following losses, not size during losing trades.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-12",
    "caseType": "comparison",
    "input": "Compare size after losses across two trusted compatible selections.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [
      "trusted first selection",
      "trusted second selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": {
      "left": "trusted first selection",
      "right": "trusted second selection",
      "basis": "size_after_losses"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-13",
    "caseType": "ranking",
    "input": "Rank trusted compatible result groups by size after losses.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [
      "group_and_aggregate",
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [
      "trusted compatible approved result group"
    ],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "descending",
      "deterministic tie policy"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted group context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-14",
    "caseType": "negation",
    "input": "Show size after losses, not a claim that losing caused the size.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [
      "exclude causal or alternate meaning"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "exclude alternate meaning"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-15",
    "caseType": "exclusion",
    "input": "Show size after losses excluding the trusted selected ticker.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [
      "exclude trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "exclude"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-16",
    "caseType": "multi_filter",
    "input": "Show size after losses for the trusted selected ticker and trusted declared period.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [
      "trusted selected ticker",
      "trusted declared period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "filter"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted declared period",
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-17",
    "caseType": "multi_part",
    "input": "Show size after losses, compare the trusted prior period, and include coverage.",
    "expectedPrimaryIntent": "summarize_performance",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "compare_groups",
      "inspect_data_quality"
    ],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [
      "trusted current period",
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "comparison",
      "coverage inspection"
    ],
    "expectedComparison": {
      "left": "trusted current period",
      "right": "trusted prior period",
      "basis": "size_after_losses"
    },
    "expectedTimeRange": "trusted current and prior date contexts",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-18",
    "caseType": "ambiguity",
    "input": "For size after a loss, which following trade and size measure apply?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "metric routing"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Should 'after a loss' use the next eligible closed trade in the same account scope or only the next closed trade for the same ticker?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-19",
    "caseType": "negative_example",
    "input": "What size should I use after a loss?",
    "expectedPrimaryIntent": "unsupported_request",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unsupported request"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "no advice, prediction, prescribed sizing, motive, or causal diagnosis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Trading advice and prescribed sizing are unsupported; descriptive historical analysis cannot recommend an action.",
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-20",
    "caseType": "unsupported_data",
    "input": "Calculate size after losses without a predecessor or barrier policy.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "return planned boundary and coverage"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "No predecessor scope, barrier policy, selected size measure, aggregate, or outcome contract is approved; do not invent one.",
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-21",
    "caseType": "selected_entity_context",
    "input": "For the trusted selected ticker, show size after losses.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_after_losses"
    ],
    "expectedFilters": [
      "trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted server-authorized selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E11-22",
    "caseType": "cross_category",
    "input": "Compare size after losses with size after wins for the trusted compatible selection without diagnosing revenge or tilt.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "explain_result"
    ],
    "expectedCanonicalConcepts": [
      "size_after_losses",
      "size_after_wins"
    ],
    "expectedFilters": [
      "trusted compatible selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned post-loss sequence: no default predecessor scope, barrier, size measure, aggregate, or outcome basis",
      "descriptive comparison only"
    ],
    "expectedComparison": {
      "left": "size_after_losses",
      "right": "size_after_wins",
      "basis": "trusted compatible selection"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted result context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and tie handling",
      "accepted ready_closed outcome facts; flat outcomes, legitimate_open, and needs_decision rows remain visible under a future barrier policy",
      "Category 3 selected-basis outcome plus an approved predecessor scope/barrier and selected size measure/aggregate contract"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  }
]
```

### `size_escalation`

```json
[
  {
    "caseId": "C6-E12-01",
    "caseType": "canonical",
    "input": "Show size escalation.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-02",
    "caseType": "formal_paraphrase",
    "input": "Identify eligible across-trade position-size increases under the approved transition contract.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-03",
    "caseType": "conversational_paraphrase",
    "input": "When was my next trade bigger?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-04",
    "caseType": "trader_slang",
    "input": "Where did I size up on the next trade?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-05",
    "caseType": "abbreviation",
    "input": "Show sz escalation.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-06",
    "caseType": "misspelling",
    "input": "Show size escaltion.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-07",
    "caseType": "noisy_input",
    "input": "bigger next trades",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-08",
    "caseType": "command",
    "input": "Analyze size escalation.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-09",
    "caseType": "fragment",
    "input": "Bigger next trade.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-10",
    "caseType": "follow_up",
    "input": "What about size escalation in that trusted prior period?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted prior date context",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-11",
    "caseType": "correction",
    "input": "I mean across-trade size increases, not adding shares within one open position.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-12",
    "caseType": "comparison",
    "input": "Compare size escalation across two trusted compatible selections.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [
      "trusted first selection",
      "trusted second selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": {
      "left": "trusted first selection",
      "right": "trusted second selection",
      "basis": "size_escalation"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-13",
    "caseType": "ranking",
    "input": "Rank trusted compatible result groups by size escalation.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [
      "group_and_aggregate",
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [
      "trusted compatible approved result group"
    ],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "descending",
      "deterministic tie policy"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted group context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-14",
    "caseType": "negation",
    "input": "Show size escalation, not within-position scale-ins.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [
      "exclude causal or alternate meaning"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "exclude alternate meaning"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-15",
    "caseType": "exclusion",
    "input": "Show size escalation excluding the trusted selected ticker.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [
      "exclude trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "exclude"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-16",
    "caseType": "multi_filter",
    "input": "Show size escalation for the trusted selected ticker and trusted declared period.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [
      "trusted selected ticker",
      "trusted declared period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "filter"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted declared period",
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-17",
    "caseType": "multi_part",
    "input": "Show size escalation, compare the trusted prior period, and include coverage.",
    "expectedPrimaryIntent": "summarize_performance",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "compare_groups",
      "inspect_data_quality"
    ],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [
      "trusted current period",
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "comparison",
      "coverage inspection"
    ],
    "expectedComparison": {
      "left": "trusted current period",
      "right": "trusted prior period",
      "basis": "size_escalation"
    },
    "expectedTimeRange": "trusted current and prior date contexts",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-18",
    "caseType": "ambiguity",
    "input": "Did I size up?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "metric routing"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Do you mean increasing size across separate closed trades, or adding shares within one open position?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-19",
    "caseType": "negative_example",
    "input": "Should I increase size after every winner?",
    "expectedPrimaryIntent": "unsupported_request",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unsupported request"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "no advice, prediction, prescribed sizing, motive, or causal diagnosis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Trading advice and prescribed sizing are unsupported; descriptive historical analysis cannot recommend an action.",
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-20",
    "caseType": "unsupported_data",
    "input": "Calculate escalations using an unstated delta, percentage, equality rule, and denominator.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "return planned boundary and coverage"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "No across-trade size basis, transition pairing, formula, equality rule, applicable-transition scope, unit, or denominator is approved; do not invent one.",
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-21",
    "caseType": "selected_entity_context",
    "input": "For the trusted selected ticker, show size escalation.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_escalation"
    ],
    "expectedFilters": [
      "trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted server-authorized selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E12-22",
    "caseType": "cross_category",
    "input": "Distinguish size escalation across separate closed trades from a Category 8 scale-in within one open position for the trusted selection.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "explain_result"
    ],
    "expectedCanonicalConcepts": [
      "size_escalation",
      "scale_in"
    ],
    "expectedFilters": [
      "trusted compatible selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade transition: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "descriptive comparison only"
    ],
    "expectedComparison": {
      "left": "size_escalation",
      "right": "scale_in",
      "basis": "trusted compatible selection"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted result context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, causal claim, or invented contract."
  }
]
```


### `size_reduction`

```json
[
  {
    "caseId": "C6-E13-01",
    "caseType": "canonical",
    "input": "Show size reduction.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-02",
    "caseType": "formal_paraphrase",
    "input": "Identify eligible across-trade position-size decreases under the approved transition contract.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-03",
    "caseType": "conversational_paraphrase",
    "input": "When was my next trade smaller?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-04",
    "caseType": "trader_slang",
    "input": "Where did I size down on the next trade?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-05",
    "caseType": "abbreviation",
    "input": "Show sz reduction.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-06",
    "caseType": "misspelling",
    "input": "Show size reducton.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-07",
    "caseType": "noisy_input",
    "input": "smaller next trades",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-08",
    "caseType": "command",
    "input": "Analyze size reduction.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-09",
    "caseType": "fragment",
    "input": "Smaller next trade.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-10",
    "caseType": "follow_up",
    "input": "What about size reduction in that trusted prior period?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted prior date context",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-11",
    "caseType": "correction",
    "input": "I mean across-trade size decreases, not reducing shares within one open position.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-12",
    "caseType": "comparison",
    "input": "Compare size reduction across two trusted compatible selections.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [
      "trusted first selection",
      "trusted second selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": {
      "left": "trusted first selection",
      "right": "trusted second selection",
      "basis": "size_reduction"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-13",
    "caseType": "ranking",
    "input": "Rank trusted compatible result groups by size reduction.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [
      "group_and_aggregate",
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [
      "trusted compatible approved result group"
    ],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "descending",
      "deterministic tie policy"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted group context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-14",
    "caseType": "negation",
    "input": "Show size reduction, not within-position scale-outs.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [
      "exclude causal or alternate meaning"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "exclude alternate meaning"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-15",
    "caseType": "exclusion",
    "input": "Show size reduction excluding the trusted selected ticker.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [
      "exclude trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "exclude"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-16",
    "caseType": "multi_filter",
    "input": "Show size reduction for the trusted selected ticker and trusted declared period.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [
      "trusted selected ticker",
      "trusted declared period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "filter"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted declared period",
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-17",
    "caseType": "multi_part",
    "input": "Show size reduction, compare the trusted prior period, and include coverage.",
    "expectedPrimaryIntent": "summarize_performance",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "compare_groups",
      "inspect_data_quality"
    ],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [
      "trusted current period",
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "comparison",
      "coverage inspection"
    ],
    "expectedComparison": {
      "left": "trusted current period",
      "right": "trusted prior period",
      "basis": "size_reduction"
    },
    "expectedTimeRange": "trusted current and prior date contexts",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-18",
    "caseType": "ambiguity",
    "input": "Did I size down?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "metric routing"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Do you mean decreasing size across separate closed trades, or reducing shares within one open position?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-19",
    "caseType": "negative_example",
    "input": "Should I reduce size after every loser?",
    "expectedPrimaryIntent": "unsupported_request",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unsupported request"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "no advice, prediction, prescribed sizing, trader-authored motive, or causal diagnosis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Trading advice and prescribed sizing are unsupported; descriptive historical analysis cannot infer a trader motive or recommend an action.",
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-20",
    "caseType": "unsupported_data",
    "input": "Calculate reductions using an unstated delta, percentage, equality rule, and denominator.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "return planned boundary and coverage"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "No across-trade size basis, decrease-transition pairing, formula, equality rule, applicable-transition scope, unit, or denominator is approved; do not invent one.",
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-21",
    "caseType": "selected_entity_context",
    "input": "For the trusted selected ticker, show size reduction.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "size_reduction"
    ],
    "expectedFilters": [
      "trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted server-authorized selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  },
  {
    "caseId": "C6-E13-22",
    "caseType": "cross_category",
    "input": "Distinguish size reduction across separate closed trades from a Category 8 scale-out within one open position for the trusted selection.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "explain_result"
    ],
    "expectedCanonicalConcepts": [
      "size_reduction",
      "scale_out"
    ],
    "expectedFilters": [
      "trusted compatible selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "planned across-trade size decrease: no default size basis, pairing, formula, equality rule, unit, barrier, or denominator",
      "descriptive comparison only"
    ],
    "expectedComparison": {
      "left": "size_reduction",
      "right": "scale_out",
      "basis": "trusted compatible selection"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted result context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted stable close ordering and exact maximum-position facts",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and may be barriers only under an approved rule",
      "an approved across-trade size basis, decrease-transition pairing, formula, equality policy, applicable-transition scope, unit, and denominator"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Planned language interpretation only; no runtime, mutation, prediction, advice, trader-authored motive, causal claim, or invented contract."
  }
]
```

### `profit_per_dollar_exposed`

```json
[
  {
    "caseId": "C6-E14-01",
    "caseType": "canonical",
    "input": "Show profit per dollar exposed.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-02",
    "caseType": "formal_paraphrase",
    "input": "Calculate profit per dollar exposed under approved profit and exposure contracts.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-03",
    "caseType": "conversational_paraphrase",
    "input": "How much profit did I make per dollar exposed?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-04",
    "caseType": "trader_slang",
    "input": "What's my profit per dollar at work?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-05",
    "caseType": "abbreviation",
    "input": "Show P/$ exposed.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-06",
    "caseType": "misspelling",
    "input": "Show profit per dolar exposed.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-07",
    "caseType": "noisy_input",
    "input": "P/$ exp",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-08",
    "caseType": "command",
    "input": "Calculate profit per dollar exposed.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-09",
    "caseType": "fragment",
    "input": "Profit per dollar exposed.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-10",
    "caseType": "follow_up",
    "input": "What about profit per dollar exposed in that trusted prior period?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted prior closing-date context",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-11",
    "caseType": "correction",
    "input": "I mean profit per dollar exposed, not entry-notional return.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "exclude entry-notional return"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback",
      "metric correction"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted prior closing-date context",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-12",
    "caseType": "comparison",
    "input": "Compare profit per dollar exposed across the two trusted selections.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "trusted first selection",
      "trusted second selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback",
      "comparison"
    ],
    "expectedComparison": {
      "left": "trusted first selection",
      "right": "trusted second selection",
      "basis": "profit_per_dollar_exposed"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-13",
    "caseType": "ranking",
    "input": "Rank trusted compatible result groups by profit per dollar exposed.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [
      "group_and_aggregate",
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [
      "trusted compatible approved result group"
    ],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback",
      "descending",
      "deterministic tie policy"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted group context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-14",
    "caseType": "negation",
    "input": "Show profit per dollar exposed, not account return.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "exclude account return"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback",
      "exclude"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-15",
    "caseType": "exclusion",
    "input": "Show profit per dollar exposed excluding the trusted selected ticker.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "exclude trusted selected ticker"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback",
      "exclude"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-16",
    "caseType": "multi_filter",
    "input": "Show profit per dollar exposed for the trusted selected ticker and trusted period.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "trusted selected ticker",
      "trusted declared period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback",
      "filter"
    ],
    "expectedComparison": null,
    "expectedTimeRange": "trusted declared closing-date period",
    "expectedSelectedEntity": "trusted selected ticker context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-17",
    "caseType": "multi_part",
    "input": "Show profit per dollar exposed, compare the trusted prior period, and explain what is missing.",
    "expectedPrimaryIntent": "summarize_performance",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "compare_groups",
      "inspect_data_quality"
    ],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "trusted current period",
      "trusted prior period"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback",
      "comparison",
      "coverage inspection"
    ],
    "expectedComparison": {
      "left": "trusted current period",
      "right": "trusted prior period",
      "basis": "profit_per_dollar_exposed"
    },
    "expectedTimeRange": "trusted current and prior closing-date contexts",
    "expectedSelectedEntity": "trusted prior query context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-18",
    "caseType": "ambiguity",
    "input": "What's my return on exposure?",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed",
      "return_on_entry_notional"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "metric routing without selecting an alternative before clarification"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable",
      "return_on_entry_notional is a separately supported alternative only after explicit trader confirmation and is never an exposure fallback"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Do you mean return on entry notional?",
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-19",
    "caseType": "negative_example",
    "input": "What profit per dollar exposed should I target?",
    "expectedPrimaryIntent": "unsupported_request",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "unsupported request"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "no advice, prediction, prescribed targets, motive, or causal diagnosis"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Trading advice and prescribed targets are unsupported; descriptive historical analysis cannot recommend an action.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-20",
    "caseType": "unsupported_data",
    "input": "Use entry notional, account return, equity, or FX as a fallback.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "return unavailable and coverage"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "No approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-21",
    "caseType": "selected_entity_context",
    "input": "For the trusted selected result, show profit per dollar exposed.",
    "expectedPrimaryIntent": "calculate_metric",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "trusted selected result"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback"
    ],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted server-authorized selected result context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  },
  {
    "caseId": "C6-E14-22",
    "caseType": "cross_category",
    "input": "Compare profit per dollar exposed with the trusted selection's net P&L without treating either as a cause.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [
      "calculate_metric",
      "explain_result"
    ],
    "expectedCanonicalConcepts": [
      "profit_per_dollar_exposed"
    ],
    "expectedFilters": [
      "trusted compatible selection"
    ],
    "expectedGroupings": [],
    "expectedOperators": [
      "unavailable: no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract; no entry-notional, account-return, equity, or FX fallback",
      "descriptive comparison only"
    ],
    "expectedComparison": {
      "left": "profit_per_dollar_exposed",
      "right": "net_pnl",
      "basis": "trusted compatible selection"
    },
    "expectedTimeRange": null,
    "expectedSelectedEntity": "trusted result context",
    "expectedContextRequirements": [
      "server-authorized compatible account, recorded-currency, account-timezone, share-unit, and Stock multiplier-one partitions",
      "accepted ready_closed population; legitimate_open and needs_decision rows remain visible and are not silently included",
      "an approved gross-versus-fee-complete-net P/L contract and an approved exposure denominator and time point",
      "same account, currency, and unit scope; zero, unknown, or mixed-currency exposure remains unavailable"
    ],
    "expectedCapabilityStatus": "Unavailable",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Profit per dollar exposed is unavailable because no approved exposure denominator/time point or gross-versus-fee-complete-net P/L contract exists; do not substitute entry notional, account return, equity, or FX.",
    "notes": "Recognition never creates a product contract, denominator, fallback, or numeric result; preserve authorized context."
  }
]
```


# 8. Coverage Report Deliverable

## 8.1 Inventory and Registry Coverage

| Measure | Count |
|---|---:|
| Controlling inventory items | 14 |
| Completed canonical records | 14 |
| Accepted language registries | 14 |
| Locked canonical names | 14 |
| Saved evaluation cases | 308 of 308 |
| Passed evaluation cases | 308 |
| Final recheck failures | 0 |
| Pending evaluation arrays | 0 |

## 8.2 Batch Evaluation Coverage

- `shares_purchased`, `shares_sold`, and `average_position_size` each have 22
  exact-schema cases in the required order. Independent review passed all 66,
  and the controller accepted the bounded result: 3 clarification, 6
  unsupported, and 3 cross-category cases.
- `median_position_size`, `maximum_position_size`, and
  `average_dollar_exposure` each have 22 exact-schema cases in the required
  order. Independent review passed all 66 Batch 2 cases, and the controller
  accepted 132 passed cases globally: 6 clarification, 32 unsupported, and 6
  cross-category cases. The supported median preserves the exact even-count
  midpoint; the planned maximum has no alias or runtime claim; generic exposure
  remains unavailable without a fallback.
- `maximum_dollar_exposure`, `size_relative_to_normal_size`, and
  `performance_by_size_bucket` each have 22 exact-schema cases in the
  required order. Independent review passed all 66 Batch 3 cases, and the
  controller accepted 198 passed cases globally: 9 clarification, 78
  unsupported, and 9 cross-category cases. They retain unavailable exposure
  and normal-baseline contracts, the planned size-bucket boundary, and no
  invented fallback, default, or runtime.
- `size_after_wins`, `size_after_losses`, and `size_escalation` each have 22
  exact-schema cases in the required order. Independent review passed all 66
  Batch 4 cases, and the controller accepted 264 passed cases globally: 12
  clarification, 84 unsupported, and 12 cross-category cases. The post-outcome arrays preserve Category 3 selected-basis
  outcomes and stable close ordering without supplying predecessor/barrier,
  flat/open/decision, size, or aggregate defaults. The escalation array
  preserves maximum-position evidence without inventing a transition basis,
  formula, equality rule, unit, scope, or denominator, and distinguishes an
  across-trade transition from a Category 8 within-position scale-in.
- `size_reduction` and `profit_per_dollar_exposed` each have 22
  exact-schema cases in the required order. Independent review passed all 44
  final Batch 5 cases. The later comprehensive audit remediated seven cases,
  and their final recheck passed. All 308 of 308 cases pass with 14
  clarification, 108 unsupported, and 14 cross-category. Reduction preserves
  maximum-position and stable-order
  evidence without supplying a formula, unit, equality rule, transition,
  denominator, motive, or causation contract, and distinguishes a
  cross-trade decrease from Category 8 within-position scale-out/reduction.
  Profit per dollar exposed remains unavailable without an approved exposure
  denominator/time point and gross-versus-fee-complete-net P/L contract; no
  entry-notional, account-return, equity, or FX fallback is supplied.
- The cases preserve exact share math, fractional quantities, two-decimal
  presentation-only rounding, server-authorized partitions, trusted-context
  limits, ready_closed/open/decision treatment, quantity/allocation coverage,
  and non-advice/non-causation boundaries.
- No date, account, ticker, result group, allowlisted filter, capability,
  runtime, or currency conversion is invented. Planned and Unavailable metrics
  retain their explicit capability boundaries rather than receiving placeholder
  objects.

## 8.3 Completion State

1. The comprehensive whole-file independent review and seven-case final
   recheck passed.
2. The controller approved and locked all 14 canonical names and registries at
   Version 1. Planned and Unavailable capability gaps remain explicit product
   boundaries and do not imply runtime implementation.

---

# 9. Acceptance Checklist

## Planning

- [x] Read the master, completion template, Section 5.5 source list, completed
  Categories 1-5, capability catalog, and accepted Phase 4 plan/progress
  evidence.
- [x] Preserved exactly 14 ordered canonical names and IDs `C6-SIZE-001`
  through `C6-SIZE-014`.
- [x] Recorded quantity, money/exposure, gross/net fee, population, currency,
  timezone, sequence, denominator, privacy, and display-rounding boundaries.
- [x] Separated accepted deterministic evidence from genuine future/controller
  decisions without reopening accepted formulas or claiming Chat support.
- [x] Recorded the controller-accepted execution-side purchase/sale semantics,
  maximum-position formula, and exact status distribution.
- [x] Completed Sections 5-8 in dependency order.

## Controlling Inventory

- [x] Drafted the complete controlling inventory table.
- [x] Controller reviewed duplicate, overlap, alias, and status decisions.
- [x] Controller accepted the exact 14-name inventory, status classifications,
  `shares_purchased`/`shares_sold` semantics, and
  `maximum_position_size` formula for deliverable production.
- [x] Canonical names locked.

## Deliverables and Approval

- [x] Section 5 canonical records `C6-SIZE-001` through `C6-SIZE-007`
  completed for this checkpoint.
- [x] Section 5 canonical records `C6-SIZE-008` through `C6-SIZE-014`
  completed without inventing unresolved contracts.
- [x] Section 5 all 14 canonical records completed.
- [x] Section 5 all 14 canonical records passed independent review and were
  controller accepted for language-registry production.
- [x] Section 6 Batch 1 language registries `C6-SIZE-001` through
  `C6-SIZE-005` completed with 38 populated subsections each.
- [x] Section 6 Batch 2 language registries `C6-SIZE-006` through
  `C6-SIZE-010` completed with 38 populated subsections each.
- [x] Section 6 Batch 3 language registries `C6-SIZE-011` through
  `C6-SIZE-014` completed with 38 populated subsections each.
- [x] Section 6 all 14 language registries completed with 532 required
  populated subsections and received independent PASS plus controller
  acceptance for evaluation production.
- [x] Section 7 Batch 1 saved 66 exact-schema cases for `C6-SIZE-001` through
  `C6-SIZE-003`; independent review passed all 66 and the controller accepted
  the bounded result: 3 clarification, 6 unsupported, and 3 cross-category
  cases.
- [x] Section 7 Batch 2 saved and independently passed 66 exact-schema cases
  for `C6-SIZE-004` through `C6-SIZE-006`; the controller accepted 132
  passed cases globally with 6 clarification, 32 unsupported, and 6
  cross-category cases.
- [x] Section 7 Batch 3 saved and independently passed 66 exact-schema cases
  for `C6-SIZE-007` through `C6-SIZE-009`; the controller accepted 198 passed
  cases globally with 9 clarification, 78 unsupported, and 9 cross-category
  cases.
- [x] Section 7 Batch 4 independently passed and received controller acceptance
  for 66 exact-schema cases `C6-SIZE-010` through `C6-SIZE-012`, bringing
  the global result to 264 passed cases with 12 clarification, 84 unsupported,
  and 12 cross-category cases.
- [x] Section 7 Batch 5 saved and independently passed 44 exact-schema cases
  for `C6-SIZE-013` through `C6-SIZE-014`.
- [x] Final recheck of seven comprehensive-audit remediations passed; all 308
  cases pass with 14 clarification, 108 unsupported, and 14 cross-category.
- [x] Section 8 records truthful Batch 1-5 counts and coverage boundaries.
- [x] Section 5 independent PASS recorded.
- [x] Full-category independent review recorded.
- [x] Category approved and marked Complete.

---

# 10. Review and Approval Notes

- **Review state:** All 14 Section 5 canonical records received an independent
  PASS and controller acceptance. All 14 Section 6 language registries then
  received an independent PASS and controller acceptance for evaluation
  production. Section 7 Batch 1 received an independent PASS and controller
  acceptance for its 66 cases. Section 7 Batch 2 then received an independent
  PASS and controller acceptance, bringing the global passed result to 132
  cases with 6 clarification, 32 unsupported, and 6 cross-category cases.
  Section 7 Batch 3 then received an independent PASS and controller
  acceptance, bringing the global passed result to 198 cases with 9
  clarification, 78 unsupported, and 9 cross-category cases. Batch 4 then
  received an independent PASS and controller acceptance, bringing the global
  result to 264 passed cases with 12 clarification, 84 unsupported, and 12
  cross-category cases. Batch 5 then received an independent PASS and
  controller acceptance. The comprehensive audit subsequently remediated seven
  cases, and their final recheck passed. All 308 of 308 cases pass with 14
  clarification, 108 unsupported, and 14 cross-category cases. The
  comprehensive whole-file review passed.
- **Approval state:** Category 6 is Complete; all 14 canonical names and
  registries are approved and locked at Version 1.
- **Accepted decisions:** `shares_purchased` and `shares_sold` use exact
  accepted Stock execution-side Buy/Sell quantity totals, not entered/exited
  quantity. `maximum_position_size` uses the maximum across eligible
  per-round-trip maximum absolute open quantities and remains Planned as a
  named capability.
- **Remaining future boundaries:** Dollar-exposure denominator/time point,
  normal-size baseline, default size-bucket basis/thresholds/P&L contract,
  predecessor scope/barriers beyond accepted stable order,
  escalation/reduction formula and denominator, and profit-per-dollar-exposed
  denominator remain unresolved. No formula is inferred in this checkpoint.
- **Runtime boundary:** This document does not authorize code, database,
  provider, UI, deployment, or AI Chat changes.

---

# 11. Change Log

| Date | Version | Change | Status |
|---|---:|---|---|
| 2026-08-10 | 0 | Created Category 6 planning draft with Sections 1-4, controller decisions, truthful unapproved checklist/review notes, and deferred Sections 5-8. | Inventory Drafted |
| 2026-08-10 | 0 | Applied independent planning-review corrections: retained Category 6 ownership of the locked entered-share semantic, restored the C6-SIZE-012/013 display-name columns, separated accepted evidence from future decisions, and acknowledged existing size grouping primitives. No approval, lock, deliverable production, or version change. | Inventory Drafted |
| 2026-08-10 | 0 | Recorded controller acceptance of the exact inventory/status distribution and the purchase/sale and maximum-position semantics; advanced metadata to Deliverables In Progress; completed canonical records C6-SIZE-001 through C6-SIZE-007; retained 008-014 pending and Sections 6-8 deferred. No lock, Version 1, runtime, or category approval. | Deliverables In Progress |
| 2026-08-10 | 0 | Completed canonical records C6-SIZE-008 through C6-SIZE-014 with unresolved baseline, bucket, predecessor, transition, and exposure contracts left explicit; all 14 Section 5 records are complete and unreviewed while Sections 6-8 remain deferred. No approval, lock, Version 1, runtime, tests, or Git action. | Deliverables In Progress |
| 2026-08-10 | 0 | Recorded independent PASS and controller acceptance for all 14 canonical records; completed Section 6 Batch 1 registries C6-SIZE-001 through C6-SIZE-005 with 38 populated subsections each; retained registries 006-014 and Sections 7-8 deferred. No category approval, lock, Version 1, runtime, tests, or Git action. | Deliverables In Progress |
| 2026-08-10 | 0 | Completed Section 6 Batch 2 registries C6-SIZE-006 through C6-SIZE-010 with 38 populated subsections each; retained unavailable exposure/baseline and planned bucket/sequence boundaries without fallbacks; registries 011-014 and Sections 7-8 remain deferred. No category approval, lock, Version 1, runtime, tests, or Git action. | Deliverables In Progress |
| 2026-08-10 | 0 | Completed Section 6 Batch 3 registries C6-SIZE-011 through C6-SIZE-014 with 38 populated subsections each; all 14 registries and 532 required subsections are complete and unreviewed while Sections 7-8 remain deferred. No category approval, lock, Version 1, runtime, tests, or Git action. | Deliverables In Progress |
| 2026-08-10 | 0 | Recorded independent PASS and controller acceptance for all 14 Section 6 registries; replaced the Section 7 deferment with the exact 21-key schema/type/coverage boundary and saved three 22-case arrays for C6-SIZE-001 through C6-SIZE-003. All 66 of 308 cases remain unreviewed; C6-SIZE-004 through C6-SIZE-014 remain pending. No category approval, lock, Version 1, runtime, tests, or Git action. | Deliverables In Progress |
| 2026-08-10 | 0 | Recorded independent PASS and controller acceptance for the 66 Batch 1 cases (3 clarification, 6 unsupported, 3 cross-category); saved Batch 2 exact-schema arrays C6-SIZE-004 through C6-SIZE-006. The 66 new cases are unreviewed, 176 remain pending, and no category approval, lock, Version 1, runtime, tests, or Git action occurred. | Deliverables In Progress |
| 2026-08-10 | 0 | Recorded independent PASS and controller acceptance for the 66 Batch 2 cases, bringing the global passed result to 132 cases with 6 clarification, 32 unsupported, and 6 cross-category cases; saved Batch 3 exact-schema arrays C6-SIZE-007 through C6-SIZE-009. The 66 new cases are unreviewed, 110 remain pending, and no category approval, lock, Version 1, runtime, tests, or Git action occurred. | Deliverables In Progress |
| 2026-08-10 | 0 | Recorded independent PASS and controller acceptance for the 66 Batch 3 cases, bringing the global passed result to 198 cases with 9 clarification, 78 unsupported, and 9 cross-category cases; saved Batch 4 exact-schema arrays C6-SIZE-010 through C6-SIZE-012, bringing all 264 saved cases to 12 clarification, 84 unsupported, and 12 cross-category cases. The 66 new cases are unreviewed, 44 remain pending for C6-SIZE-013 through C6-SIZE-014, and no category approval, lock, Version 1, runtime, tests, or Git action occurred. | Deliverables In Progress |
| 2026-08-10 | 0 | Recorded independent PASS and controller acceptance for Batch 4 C6-SIZE-010 through C6-SIZE-012: 264 passed cases globally with 12 clarification, 84 unsupported, and 12 cross-category cases; saved final Batch 5 arrays C6-SIZE-013 through C6-SIZE-014, bringing saved cases to 308 of 308. The final 44 are unreviewed; canonical names remain unlocked and Version 1 is not assigned. | Deliverables In Progress |
| 2026-08-10 | 0 | Recorded independent PASS and controller acceptance for final Batch 5 C6-SIZE-013 through C6-SIZE-014, bringing all 308 of 308 evaluation cases to passed with 14 clarification, 108 unsupported, and 14 cross-category cases. All 14 records, registries, and arrays are complete and batch-reviewed; advanced metadata to Ready for Review while the comprehensive whole-file review, approval, name lock, and Version 1 remain pending. | Ready for Review |
| 2026-08-10 | 0 | Applied comprehensive-audit remediation to seven cases: retained the distinct conversational post-win/post-loss prompts, made their ambiguity prompts globally unique, and removed confirmation flags from five clarification-only cases. Set the active result to 301 of 308 passed with seven remediated cases pending final recheck; preserved 14 clarification, 108 unsupported, and 14 cross-category classifications. No approval, lock, Version 1, runtime, tests, or Git action occurred. | Ready for Review |
| 2026-08-10 | 1 | Recorded comprehensive independent PASS and the accepted seven-case final recheck. All 14 canonical records, 14 registries with 532 populated subsections, and 14 evaluation arrays with 308 passed cases are complete; locked the canonical names and registries with 14 clarification, 108 unsupported, and 14 cross-category cases while preserving all Planned, Supported, Unavailable, formula, missing-data, and no-runtime boundaries. | Complete |
