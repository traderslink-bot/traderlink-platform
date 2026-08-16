# Category 5: Fees and Costs Metrics

# Category Metadata

| Field | Value |
|---|---|
| Category name | Fees and Costs Metrics |
| Category number | 5 |
| Category slug | metrics-fees-costs |
| File name | 05-metrics-fees-costs.md |
| Category type | Charge, fee-coverage, and fee-effect metric vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-10 |
| Last updated | 2026-08-10 |
| Dependencies | Category 1 Intents version 1; Category 2 Profit and Loss Metrics version 1; replacement Journal Analytics Fact Set, charge-allocation, metric-registry, query/result, account-scope, currency, and coverage contracts; Category 4 and Category 11 remain later owners for expectancy and broker grouping semantics |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** A current mapping cannot infer
> charge kind, fee coverage, broker identity, or a `Planned`/`Unavailable` fee result.

---

# 1. Category Purpose

Category 5 gives the future TraderLink AI Companion stable names for questions
about fees, commissions, regulatory charges, transaction costs, the effect of
fees on an otherwise gross result, and whether the evidence is complete enough
to make a fee-based statement. It prevents language such as â€œwhat did fees
cost,â€ â€œcommissions,â€ â€œnet,â€ and â€œfees ate my profitâ€ from silently selecting a
charge kind, an included-cost set, a fee basis, a denominator, a broker group,
or a complete population that the facts do not establish.

The category interprets metric language only. Replacement Journal Analytics
services remain responsible for reading the server-authorized account scope,
constructing the accepted execution/allocation graph, applying the versioned
broker sign policy, allocating fees exactly, preserving coverage, and returning
exact values or a partial/unavailable result. The AI Chat interpreter,
validator, tool router, provider runtime, and any protected action path remain
planned; this file does not claim that a Chat request can currently execute.

This category does not own gross or net P/L, outcome classification,
expectancy, quantity semantics, broker dimensions, dates, comparison/ranking
grammar, slang, or policy. It also cannot claim that a fee caused a trading
decision, a loss, an expectancy change, or future performance. It reports a
defined arithmetic relationship with visible evidence limits, not advice or
causation.

---

# 2. Category Boundaries

## Included

The controlling inventory covers exactly these fee and cost concepts:

- total commissions;
- total regulatory fees;
- total transaction costs;
- fees per trade;
- fees per share;
- fees as a percentage of gross profit;
- trades turned from green to red by fees;
- fee impact on expectancy;
- fee impact by broker; and
- fee completeness.

Every money result must use the accepted current execution/allocation graph,
one server-authorized owner/account scope, a declared currency partition, and
an explicit fee-coverage state. A normalized **charge cost** is a non-negative
derived amount from a supported negative broker-signed/cash-effect fee. A
normalized **charge credit** is separately derived from a supported positive
broker-signed/cash-effect fee. The original fee value, sign, reported kind, and
source provenance remain preserved evidence; no metric may rewrite them.

## Excluded

The following are related but belong elsewhere:

- gross P/L, net P/L, realized P/L, P/L before fees, and P/L after fees belong
  to Category 2; this category supplies their charge and coverage vocabulary;
- wins, losses, flat outcomes, and green/red outcome language belong to
  Category 3, although `trades_turned_from_green_to_red_by_fees` uses an exact
  gross-versus-net outcome transition;
- expectancy and its selected gross/net basis belong to Category 4; this
  category owns only the requested fee-impact relationship and must not define
  a second expectancy metric;
- share/entered-quantity, position size, and exposure definitions belong to
  Category 6; this category consumes the approved denominator for
  `fees_per_share`;
- broker, account, source, import provenance, currency, ticker, and other
  grouping/filtering fields belong to Category 11;
- date/time resolution belongs to Category 13; comparisons and rankings belong
  to Category 14; conversation context, terminology, ambiguity, response
  presentation, and safety policy belong to Categories 15-19;
- rebates, financing, borrow, exchange, platform, tax, interest, FX, and
  market-impact costs are not silently included in transaction costs. The
  approved transaction-cost measure is limited to normalized `charge_cost`
  values from supported fee facts; `charge_credit` is reported separately in
  coverage and is never silently netted into costs;
- broker statements, adapter configurations, Journal source records, and
  deterministic analytics calculations are not AI Chat writes; and
- causal explanations, trading recommendations, fee forecasts, and model-made
  fee estimates are unsupported.

## Cross-Category References

Category 5 references but does not redefine:

- Category 1 calculation, summarization, grouping, comparison, explanation,
  diagnosis, and data-coverage intents;
- Category 2 gross/net P/L basis, realized closed-trade population, currency
  partition, partial-result presentation, and gross-to-net formula;
- Category 3 gross/net outcome classification and the owner of â€œgreenâ€ and
  â€œredâ€ outcome wording;
- Category 4 expectancy definition, population, and selected P/L basis;
- Category 6 entered-share/quantity denominator and quantity eligibility;
- Category 11 stable broker/source grouping identity and account/currency
  dimensions;
- Categories 12-14 filters, operators, dates, grouping, comparison, ranking,
  zero-denominator presentation, and deterministic tie behaviour; and
- Category 19 server-authoritative account isolation, privacy, no-invention,
  no-causation, and unsupported-request policy.

---

# 3. Planning Analysis

Planning establishes the approved 10-name controlling list and its factual
boundaries. Sections 5-7 are complete and approved at Version 1, including all
10 registries and 220 passed evaluation cases. Version 1 is locked and
Complete; the explicit Category 4 and Category 11 capability gaps remain.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?**

   It maps fee/cost language to one exact requested measure while retaining
   charge kind, original-sign provenance, inclusion contract, gross/net basis,
   population, currency, denominator, and coverage. It prevents a response
   from calling all fees commissions, treating a fee credit as a cost, summing
   unlike currencies, or calling a fee-incomplete net result complete.

2. **What canonical concepts belong here?**

   Exactly the 10 plan-listed names in Section 4 and in that order. They come
   from Section 5.4 of the AI Chatbot Complete Language Plan. No related
   charge kind, broker dimension, P/L alias, rebate, tax, quantity, or outcome
   is inserted into the controlling list.

3. **What related concepts belong elsewhere?**

   Category 2 owns the gross/net calculation itself; Category 3 owns outcome
   vocabulary; Category 4 owns expectancy; Category 6 owns quantity; and
   Category 11 owns broker identity and grouping. Categories 12-19 own the
   surrounding query language and policy. This category supplies no separate
   calculation for `pnl_after_fees` and does not double count a charge already
   used in the gross-to-net relationship.

4. **What data is required?**

   Every fee metric requires a current server-authorized owner/account scope,
   accepted current execution versions and allocation graph, supported source
   provenance, original charge evidence, a versioned sign policy, charge
   allocation that conserves original-scale units, trade currency, and the
   metric-specific eligible population. Kind-specific metrics additionally
   require a supported adapter/source classification for commission or
   regulatory kind. `total_transaction_costs` is the sum of all normalized
   non-negative `charge_cost` values from supported fee facts over the declared
   population and currency; `charge_credit` is separate coverage evidence and
   is not netted into costs. Per-trade measures need a declared eligible
   closed-trade denominator; per-share uses total entered shares: the sum of
   position-increasing allocated quantities with roles `opening`, `adding`,
   and `flip_opening` over the identical eligible population. The gross-profit
   percentage needs positive gross profit; green-to-red needs exact gross and
   net selected-basis outcomes; expectancy impact needs the Category 4
   expectancy contract; and broker impact needs the Category 11 stable
   grouping identity. Open and decision rows must remain visible in coverage
   and outside realized fee-effect values unless a future metric explicitly
   defines another population.

5. **Which deterministic tools will answer these requests?**

   Current replacement primitives include the Journal Analytics Fact Set,
   read-only `JournalAnalyticsService`, versioned metric registry, exact math,
   charge allocator, typed analytics query/result contracts, coverage
   accumulators, and deterministic grouped results. They evidence charge and
   net-P/L calculations only when facts and policies are complete. No current
   repository evidence establishes a dedicated AI Chat handler or all ten
   named public metrics; later routing must validate the canonical metric,
   scope, basis, currency partition, eligible population, and groupings.

6. **Which concepts are directly observed?**

   Original broker/source fee values, their reported sign and kind evidence,
   source/adapter provenance, currency, executions, allocated quantities,
   account scope, and coverage reasons are accepted Journal facts where
   present. They are not themselves the normalized cost result. No total,
   rate, percentage, transition, or impact metric in this category is a
   directly observed financial aggregate.

7. **Which concepts are deterministically derived?**

   Every controlling concept is deterministically derived when its declared
   facts and contract exist: normalizing cost/credit under a versioned sign
   policy; conserving allocation; summing supported normalized `charge_cost`
   values without netting charge credits; dividing by a declared denominator;
   comparing gross and net outcomes on the same eligible population;
   recomputing a defined expectancy basis; and grouping by a stable broker
   identity. Derived does not mean currently exposed through the AI Chat
   runtime.

8. **Which concepts are proxy indicators?**

   None. A fee result can quantify an arithmetic difference or outcome
   transition; it cannot infer a trader's intent, execution quality, broker
   quality, avoidability, or causal explanation. â€œImpactâ€ means the explicitly
   defined gross-to-net arithmetic delta, never a causal claim.

9. **Which concepts are user-labelled?**

   None. A user may later filter by a stored tag, rule, or setup through its
   owning category, but a trader label cannot supply a missing fee kind, sign
   policy, quantity denominator, broker identity, or fee value.

10. **Which concepts are not measurable?**

   A kind-specific total is unavailable without supported commission or
   regulatory provenance. Fee-per-share is unavailable when its entered-share
   denominator is zero or unknown, or its fee/quantity coverage is incomplete.
   Fee percentage is unavailable when gross profit is zero or negative. Fee
   impact on expectancy is unavailable until Category 4 defines the selected
   basis and formula. Broker impact is unavailable without a stable broker
   grouping identity. No metric may use a model estimate to fill missing fees.

11. **Which terms are ambiguous?**

   â€œFees,â€ â€œcosts,â€ â€œcharges,â€ â€œcommissions,â€ â€œrebates,â€ â€œwhat I paid,â€ â€œper
   trade,â€ â€œper share,â€ â€œimpact,â€ â€œgreen,â€ â€œred,â€ â€œbroker,â€ and â€œcompleteâ€ are
   ambiguous. â€œFeesâ€ can mean charge cost only or a signed net charge effect;
   the approved transaction-cost metric means supported `charge_cost` only;
   â€œper shareâ€ can mean entered shares, exited shares, maximum exposure, or
   contract units; and â€œbrokerâ€ can mean firm, import source, account, or a
   statement label.

12. **What defaults are safe?**

   `total_transaction_costs` defaults to the approved sum of supported
   non-negative `charge_cost` values, never charge credit, on the declared
   population and one currency partition. Charge credit appears separately in
   coverage. â€œPer tradeâ€ cannot silently switch between executions and round
   trips. `fees_per_share` uses total entered shares only, never exit volume,
   maximum exposure, or contract units. The word â€œimpactâ€ must state the
   chosen arithmetic relationship. A zero or unknown denominator returns
   unavailable, never zero, infinity, or a model estimate.

13. **What conditions require clarification?**

   Clarify a request when it omits a fee basis, a transaction versus round-trip
   denominator, a gross/net basis for a transition or expectancy comparison,
   an intended broker meaning, a selected account/currency scope, or a
   period/grouping that server context cannot safely resolve. The entered-share
   denominator and transaction-cost inclusion are now defined; unknown or zero
   factual denominators return unavailable rather than asking the trader to
   invent a formula.

14. **What combinations are invalid?**

   Invalid combinations include: summing monetary fees across currencies;
   treating fee-incomplete rows as complete net rows; selecting only charge
   credit while calling it fees paid; mixing gross-eligible and fee-covered
   populations without declaring partial coverage; using open/decision rows as
   realized fee-effect rows; deriving regulatory/commission kind from a label
   lacking source support; dividing by zero/unknown trade or share quantities;
   using exit volume, maximum exposure, or contract units for `fees_per_share`;
   using a gross-profit percentage when gross profit is not positive; treating
   a fee delta as advice or causation; and grouping by an unverified broker
   label.

15. **What evaluation coverage proves completion?**

   Later evaluation must cover each canonical name, formal and conversational
   fee wording, charge-cost versus credit distinction, supported/unknown sign
   policy, known/unknown kind provenance, cost-set clarification, execution
   versus round-trip and entered-share denominator clarification, complete and
   partial fee coverage, missing fee facts, fee-currency mismatch, zero and
   negative gross-profit denominator, exact gross-positive/net-negative
   transition, open/decision containment, authorised-account rejection,
   currency partitioning, broker-identity ambiguity, no-causation wording, and
   planned/unavailable Chat routing.

## 3.2 Dependencies

- **Required earlier categories:** Category 1 supplies intent routing and
  coverage inspection; locked Category 2 supplies gross/net P/L, realized
  population, fee-basis aliases, partial state, and currency boundaries.
- **Required Journal facts/services:** current accepted executions and
  allocations; source provenance; original fee sign/kind/currency evidence;
  versioned sign policy; exact conserving charge allocation; read-only fact
  snapshot; coverage counts/reasons; exact math; metric registry; and typed
  query/result contracts.
- **Required later category contracts:** Category 3 outcome terminology for
  gross winner/net loser; Category 4 expectancy formula/basis; Category 11
  broker grouping identity; and Categories 12-14 filtering, dates, grouping,
  comparison, ranking, and zero behaviour. Category 6 remains the owner that
  must reference, not replace, the fixed entered-share semantics below.
- **Required UI/context:** a server-authorized account scope, account timezone
  and selected date range when applicable, explicit currency partition, and a
  selected group only when it is already server-authoritative.
- **Required external data:** none for current Journal fee facts. New broker
  adapters require their own versioned source/sign/kind policy; external fee
  schedules cannot fill a missing recorded fee.
- **Unsupported dependencies:** model-generated fee estimates, V3 analytics
  fallback, unauthorised account selection, cross-currency conversion without
  an approved FX contract, and provider/runtime access are out of scope.

## 3.3 Risks

- **Sign and synonym collision:** â€œfeesâ€ could map to signed charges, cost,
  credit, commission, or a wider transaction-cost set. Preserve original sign
  and require the signed/cost distinction.
- **Kind-provenance risk:** a source string or UI label must not be guessed to
  be commission or regulatory fee; kind requires adapter/source evidence.
- **Double-counting risk:** a fee included in net P/L cannot be added again as
  a separate net adjustment. Gross-to-net uses charge cost and charge credit
  once through the accepted allocation graph.
- **Population risk:** gross and net comparisons must use the same fee-complete
  eligible rows, reporting partial coverage when gross-eligible rows are
  omitted from the net-covered set.
- **Denominator risk:** trade, execution, entered-share, gross-profit, and
  expectancy denominators are distinct. Unknown or zero denominators are
  unavailable, never model-estimated.
- **Broker-grouping risk:** firm, account, import source, and broker display
  label may not identify the same group; the later grouping contract must be
  stable and source-backed.
- **Privacy/account risk:** broker provenance and account facts remain scoped
  server-side; no raw broker identifiers, statement values, or private source
  evidence appears in language artifacts.
- **Causation risk:** â€œfee impactâ€ is an arithmetic comparison only; it cannot
  claim the broker, fee, or trader behaviour caused performance.
- **Coverage risk:** unknown sign policy, missing fee, currency mismatch, or
  failed allocation conservation makes the affected charge/net result
  unavailable; it must not hide unrelated gross facts or become zero.
- **Sample-size risk:** grouped and transition results need covered/eligible
  counts. Small samples must remain visible rather than supporting a broad
  performance conclusion.

## 3.4 Repository Evidence

The following privacy-safe repository evidence was read without accessing
private Journal values, broker identifiers, tokens, or secrets.

| Repository path | What it proves for this planning record |
|---|---|
| `docs/migration/traderslink_ai_language_inventory_master.md` | Mandatory workflow, Category 5 status/ownership, exact file and dependency order, capability status vocabulary, and the concurrent Markdown-only boundary. |
| `docs/migration/category_completion_template_example.md` | Required category structure, controlling-inventory statement, evidence classification and capability status fields, deferred-deliverable sections, coverage, review, and change-log requirements. |
| `docs/migration/language-inventory/categories/01-intents.md` | Locked intent, account-scope, deterministic evidence, ambiguity, no-invention, and planned-Chat conventions. |
| `docs/migration/language-inventory/categories/02-metrics-profit-loss.md` | Locked gross/net, realized/open, fee basis, partial coverage, currency, P/L alias, and `profit_per_share` ownership boundaries. |
| `docs/migration/traderslink_ai_chatbot_complete_language_plan.md` section 5.4 | The exact ordered ten-name Fees and Costs list and the user-facing requirement to state fee data as exact, estimated, partially available, or unavailable. Internal complete/partial evidence may support that display mapping; estimated requires explicit source evidence. |
| `docs/migration/analytics-capability-catalog.md` | Current charge capability state, non-negative normalized charge cost with separately preserved original sign/kind evidence, zero-denominator unavailability, and quantity/currency boundaries. |
| `docs/migration/phase-4-core-analytics-plan.md` sections 9 and 12 | Versioned broker-sign policy, charge cost/credit distinction, exact conserving allocation, fee-complete rule, partial covered-trade presentation, compatibility meaning for commission-only charges, and strict no-double-counting gross-to-net relationship. |
| `docs/migration/phase-4-core-analytics-progress.md` | Accepted deterministic replacement evidence: exact decimal math, versioned fee sign policy, conserving allocation, account/currency isolation, open/decision containment, charge family implementation, and privacy-safe fee-complete coverage proof. |

Evidence interpretation: current deterministic analytics establishes a
conditional charge/net foundation and now supports the approved
`total_transaction_costs`, gross-profit percentage, and fee-completeness
definitions subject to their stated coverage rules. It does not establish a
dedicated AI Chat route, universal commission/regulatory kind mappings, the
named fee-per-trade/share language metrics, a locked expectancy formula, or a
stable broker grouping identity.

## 3.5 Accepted Planning Decisions

1. **Transaction costs:** `total_transaction_costs` is the sum of all
   normalized non-negative `charge_cost` values from supported fee facts used
   by the accepted net-P&L policy over the declared population and currency.
   `charge_credit` is reported separately in coverage, never silently netted
   into costs, and never double-counted. No charge kind is inferred.
2. **Fees per share:** its denominator is total entered shares: the sum of
   position-increasing allocated quantities with roles `opening`, `adding`, and
   `flip_opening` over the identical eligible population. It never uses exit
   volume, maximum exposure, or contract units. A zero or unknown denominator
   is unavailable.
3. **Fee impact on expectancy:** it remains Unavailable until Category 4 locks
   the expectancy language contract. The proposed consuming formula is gross
   expectancy minus net expectancy over the identical fee-complete
   `ready_closed` population: positive means costs reduced expectancy and
   negative can reflect credits. Category 5 does not independently lock or
   redefine this formula.
4. **Fee impact by broker:** it remains Unavailable until Category 11 defines
   a stable, source-backed broker institution identity. Provenance groups,
   import labels, and account IDs are not silently broker groups.
5. **Coverage display labels:** the accepted user-facing labels are `exact`,
   `estimated`, `partially available`, and `unavailable`. Internal
   complete evidence maps to exact and internal partial evidence maps to
   partially available. `estimated` requires explicitly source-evidenced
   estimates; no model estimates are allowed. Current missing or unsupported
   facts are partially available or unavailable.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

The inventory preserves the ten Section 5.4 plan-listed names exactly and in
order. `Supported` means a current conditional deterministic capability with
the declared fact and coverage policy, not an executable AI Chat tool.
`Planned` means the named language metric is not yet exposed. `Unavailable`
means its required fact or cross-category contract is absent and it must return
an explicit unavailable state rather than an estimate. No row is executable
through AI Chat today.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Evidence classification | Capability status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|---|
| 1 | C5-FEE-001 | total_commissions | Total commissions | kind_specific_total | directly observed and deterministically derived | Unavailable | The accepted registry's unavailable families include the absent commission component; no supported commission-only component or universal kind mapping exists. Never infer commission from source text or amount. |
| 2 | C5-FEE-002 | total_regulatory_fees | Total regulatory fees | kind_specific_total | directly observed and deterministically derived | Unavailable | Original reported kind evidence may exist, but no accepted regulatory-fee kind mapping or dedicated deterministic metric is evidenced; never infer kind from text or amount. |
| 3 | C5-FEE-003 | total_transaction_costs | Total transaction costs | included_cost_total | directly observed and deterministically derived | Supported | Sum all normalized non-negative `charge_cost` values from supported fee facts used by accepted net-P&L policy, within the declared population and currency. Report `charge_credit` separately in coverage; never net it into costs or infer a kind. |
| 4 | C5-FEE-004 | fees_per_trade | Fees per trade | rate_per_trade | deterministically derived | Planned | Requires approved transaction-cost set and a declared same-population ready-closed round-trip denominator; current charge coverage can support it after those contracts are exposed. |
| 5 | C5-FEE-005 | fees_per_share | Fees per share | rate_per_share | deterministically derived | Planned | Use `total_transaction_costs` divided by total entered shares: position-increasing allocated quantities with roles `opening`, `adding`, and `flip_opening` over the identical eligible population. Exact facts exist; zero or unknown denominator is unavailable. |
| 6 | C5-FEE-006 | fees_as_percentage_of_gross_profit | Fees as a percentage of gross profit | gross_profit_ratio | deterministically derived | Supported | Current conditional capability: `total_transaction_costs` divided by positive gross profit in one currency partition and identical eligible population. Charge coverage remains explicit; zero or negative gross profit is unavailable. |
| 7 | C5-FEE-007 | trades_turned_from_green_to_red_by_fees | Trades turned from green to red by fees | gross_net_transition | deterministically derived | Planned | Derivable only for fee-complete ready-closed rows where exact gross P/L is greater than zero and exact net P/L is less than zero; Category 3 owns outcome wording and partial coverage must remain visible. |
| 8 | C5-FEE-008 | fee_impact_on_expectancy | Fee impact on expectancy | expectancy_delta | deterministically derived | Unavailable | Requires Category 4â€™s approved expectancy definition, direction, same-population formula, fee-basis selection, and partial/zero/sample policy; no separate fee-impact expectancy metric is evidenced. |
| 9 | C5-FEE-009 | fee_impact_by_broker | Fee impact by broker | broker_grouped_impact | directly observed and deterministically derived | Unavailable | Requires the C5-FEE-008 formula plus Category 11 stable, source-backed broker grouping identity and group coverage; current broker/import labels must not be silently treated as equivalent. |
| 10 | C5-FEE-010 | fee_completeness | Fee completeness | coverage_state | directly observed and deterministically derived | Supported | Current coverage path identifies supported fee facts, matching fee currency, sign-policy support, and allocation conservation. Display exact, estimated, partially available, or unavailable; map internal complete to exact and internal partial to partially available. Missing/unsupported facts are partially available or unavailable, never model-estimated. |

## Proposed Inventory Additions

None proposed. The controlling list is limited to the exact ten names in
Section 5.4. Charge cost, charge credit, signed charge effect, rebates, borrow,
financing, taxes, and fee kinds are evidence or contract terms, not new
canonical metrics in this category.

## Proposed Removals or Merges

None proposed. The following accepted overlap/alias boundaries are not silent
merges:

| Plan-listed name | Related concept | Boundary that must remain explicit |
|---|---|---|
| `total_commissions` | `commission_signed_charges` compatibility capability | Commission total must state cost versus signed-cash-effect treatment and requires supported source/adapter kind provenance. |
| `total_transaction_costs` | normalized charge cost / charge credit | It sums all supported normalized non-negative `charge_cost` values in scope. Charge credit is separate coverage evidence, never netted into costs or double-counted; original evidence remains preserved. |
| `fees_per_trade` | execution-level fee average | â€œTradeâ€ must resolve to the approved ready-closed round trip or be clarified; it is not automatically one execution. |
| `fees_per_share` | Category 2 `profit_per_share` and compatibility `net_pnl_per_100_shares` | Fee/share uses total entered shares only: `opening`, `adding`, and `flip_opening` allocated quantities in the identical eligible population. It never uses exit volume, maximum exposure, or per-100-share units. |
| `fees_as_percentage_of_gross_profit` | gross-to-net delta / fee percentage of gross loss | Positive gross profit is the approved denominator; it is not a percentage of gross P/L, gross loss, or account return. |
| `trades_turned_from_green_to_red_by_fees` | Category 3 green/red outcomes | The precise condition is gross P/L > 0 and net P/L < 0 on the same fee-complete row; it is not an intraday or market-path â€œgave it backâ€ event. |
| `fee_impact_on_expectancy` | Category 4 expectancy | Category 4 owns expectancy. The proposed consuming relationship is gross expectancy minus net expectancy over the identical fee-complete ready-closed population; it remains Unavailable until Category 4 locks it and is never a causal claim. |
| `fee_impact_by_broker` | Category 11 broker/source/account dimensions | Broker institution, adapter, import source, account, and display label cannot be silently merged into one group identity. |
| `fee_completeness` | generic import/source coverage | It is the fee-specific evidence state for a declared population; it is not an assertion that all Journal facts are complete. |

---

# 5. Canonical Inventory Deliverable

All ten Version 1 canonical records are approved and locked below. The AI Chat
interpreter, validator, and tool runtime remain planned; the capability status
describes only the deterministic Journal boundary.

Unless a record states a stricter rule, every money result uses one
server-authorized owner/account scope, one declared currency partition, the
same current accepted execution/allocation graph, and the declared population.
Legitimate-open and needs-decision rows remain visible in coverage and are not
realized fee-effect rows. A partial result states covered and eligible counts;
unknown or zero required denominators are unavailable. No record makes a
causal, quality, recommendation, or advice claim.

## `total_commissions`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-001 |
| Category | Fees and Costs Metrics |
| Subcategory | kind_specific_total |
| Canonical name | total_commissions |
| Display name | Total commissions |
| Exact definition | Future sum of normalized non-negative `charge_cost` values whose commission kind is explicitly established by a supported source/adapter mapping, over the declared eligible population and currency. Matching `charge_credit` is reported separately. |
| Distinction from related concepts | Not `total_transaction_costs`, which sums supported `charge_cost` without a commission-kind requirement; not a signed charge effect; not matching commission-kind charge credit; not regulatory fees. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Unavailable |
| Result units | Money in one declared trade-currency partition. |
| Open-trade support | No realized-result support. Open/decision rows remain coverage only. |
| Fee handling | Never infer commission kind from source text, amount, display label, or another fee kind. Sum only kind-backed non-negative `charge_cost`; report matching `charge_credit` separately and never net or double-count it. Preserve original sign/kind evidence. |
| Version | 1 |
| Required data | Authorized scope; current accepted execution/allocation graph; declared currency; supported source/adapter-backed commission kind; normalized `charge_cost` and matching `charge_credit`; supported sign policy; and exact allocation conservation. The required commission component is not currently supported. |
| Optional data | Date range and allowlisted filters from the typed query. |
| Valid filters and groupings | Only server-allowlisted scope/date/filter dimensions. Broker grouping is not available until Category 11 defines broker identity. |
| Valid operators and intents | Sum/calculate, summarize, compare, or coverage-inspection intents with compatible filter, comparison, and date operators. |
| Default interpretation | Return unavailable with the absent commission-component reason; do not substitute all costs or a signed-charge total. |
| Clarification conditions | Clarify only user scope/date/filter ambiguity that the server cannot resolve; do not ask the trader to classify a fee. |
| Unsupported conditions | Kind inferred from labels; cross-currency sum; model estimate; open/decision inclusion; AI Chat execution; causal or advisory interpretation. |
| Target analytics tool or query capability | Future metric-language validator and Journal Analytics metric registry entry; no current dedicated commission metric. |
| Sample-size considerations | If later supported, return covered/eligible counts and do not generalize from a small population. |
| Coverage behavior | `unavailable` now; later `partial` only if a declared eligible population has a supported commission component for some but not all rows. |

### Formula and Interpretation

No executable formula exists at Version 1 because the accepted registry lacks a
supported commission component. The future formula is:

```text
total_commissions = Î£ normalized charge_cost
  where supported source/adapter mapping establishes kind = commission
```

Matching commission-kind `charge_credit` is reported separately and is never
netted into this cost total or double-counted. The formula must not classify a
generic `charge_cost` as commission. The result describes reported component
amounts, not broker quality or avoidability.

### Related Concepts

- Broader concept: fee and cost metrics.
- Narrower concepts: none in the controlling list.
- Commonly confused concepts: `total_transaction_costs`, `total_regulatory_fees`, signed charges, and charge credit.
- Must not be merged with: `total_transaction_costs` or `total_regulatory_fees`.

---

## `total_regulatory_fees`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-002 |
| Category | Fees and Costs Metrics |
| Subcategory | kind_specific_total |
| Canonical name | total_regulatory_fees |
| Display name | Total regulatory fees |
| Exact definition | Future sum of normalized non-negative `charge_cost` values whose regulatory-fee kind is explicitly established by a supported source/adapter mapping, over the declared eligible population and currency. Matching `charge_credit` is reported separately. |
| Distinction from related concepts | Not all transaction costs, commissions, taxes, interest, borrow, a signed charge amount, or matching regulatory-kind charge credit. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Unavailable |
| Result units | Money in one declared trade-currency partition. |
| Open-trade support | No realized-result support. Open/decision rows remain coverage only. |
| Fee handling | A regulatory kind must be source/adapter-backed and cannot be inferred from a label or amount. Sum only kind-backed non-negative `charge_cost`; report matching `charge_credit` separately and never net or double-count it. Preserve original sign/kind evidence. |
| Version | 1 |
| Required data | Authorized scope; current accepted execution/allocation graph; declared currency; supported source/adapter-backed regulatory kind; normalized `charge_cost` and matching `charge_credit`; supported sign policy; and conserving allocation. The required regulatory component is not currently supported. |
| Optional data | Date range and server-allowlisted filters. |
| Valid filters and groupings | Typed-query allowlists only; no broker grouping until Category 11 supplies its stable identity. |
| Valid operators and intents | Calculate, summarize, compare, or inspect coverage with compatible query operators. |
| Default interpretation | Return unavailable; never replace the request with a total of all costs. |
| Clarification conditions | Clarify only unresolved scope/date/filter language. Do not ask the trader to identify regulatory rows from a statement label. |
| Unsupported conditions | Inferred kind; tax/interest/borrow substitution; cross-currency total; estimated fee; open/decision inclusion; causal/advice statement; AI Chat execution. |
| Target analytics tool or query capability | Future registry/language route after a supported regulatory component exists. |
| Sample-size considerations | Later results require covered/eligible counts; small samples do not establish a broker-level conclusion. |
| Coverage behavior | `unavailable` now; a future mixed supported population must report `partial`, not silently exclude it. |

### Formula and Interpretation

No executable formula is permitted at Version 1. The future formula is:

```text
total_regulatory_fees = Î£ normalized charge_cost
  where supported source/adapter mapping establishes kind = regulatory_fee
```

Matching regulatory-kind `charge_credit` is reported separately and is never
netted into this cost total or double-counted. The formula cannot turn an
unclassified fee, commission, tax, or other charge into a regulatory fee.

### Related Concepts

- Broader concept: fee and cost metrics.
- Narrower concepts: none in the controlling list.
- Commonly confused concepts: `total_commissions`, `total_transaction_costs`, taxes, and exchange fees.
- Must not be merged with: `total_commissions` or `total_transaction_costs`.

---

## `total_transaction_costs`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-003 |
| Category | Fees and Costs Metrics |
| Subcategory | included_cost_total |
| Canonical name | total_transaction_costs |
| Display name | Total transaction costs |
| Exact definition | Sum of all normalized non-negative `charge_cost` values from supported fee facts used by the accepted net-P&L policy over the declared population and one currency. |
| Distinction from related concepts | Not signed charges, not a net charge effect, and not commission-only/regulatory-only total. `charge_credit` is separate coverage evidence and is not a transaction cost. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Supported |
| Result units | Money in one declared trade-currency partition. |
| Open-trade support | No realized fee-effect support. Open/decision rows are coverage only. |
| Fee handling | Include supported normalized non-negative `charge_cost` once. Report `charge_credit` separately; never net it into costs or double-count it in gross-to-net. |
| Version | 1 |
| Required data | Authorized scope; current accepted execution/allocation graph; supported recorded fee facts; versioned source sign policy; normalized charge cost; exact conserving allocation; declared currency; and the identical declared population. |
| Optional data | Date range, server-allowlisted filters, and output grouping where a supported grouping contract exists. |
| Valid filters and groupings | Typed-query allowlists and same-population filters only. Currency is a partition, not a grouping that permits a cross-currency money total. |
| Valid operators and intents | Calculate, summarize, compare, group/aggregate where allowed, explain result, and inspect coverage. |
| Default interpretation | Sum supported `charge_cost` values only. If the requested scope is ambiguous, resolve server context or ask a focused scope question. |
| Clarification conditions | Account/currency/date/filter scope ambiguity; a request that actually asks for signed fees, credits, commissions, or regulatory fees. |
| Unsupported conditions | Netting credits; inferred fee kind; cross-currency sum; missing/unsupported fee treated as zero; model estimate; open/decision realized value; causal/advice conclusion; AI Chat execution. |
| Target analytics tool or query capability | Current Journal Analytics Fact Set/charge allocation and conditional charge metric path; future AI metric-language validator and tool router. |
| Sample-size considerations | Return covered/eligible counts, currency, and partial limitation. Grouped/comparative outputs must retain counts for each population. |
| Coverage behavior | `complete` when every required row has supported fee fact, matching currency, supported sign policy, and conserving allocation; `partial` for a covered subset; `unavailable` when no declared result can be computed; `estimated` only for explicitly source-evidenced estimates, never a model estimate. |

### Formula and Interpretation

```text
total_transaction_costs = Î£ normalized charge_cost
```

The summation includes only supported fee facts in the declared population and
currency. The accepted net-P&L relationship remains `gross P/L - charge_cost +
charge_credit`; this metric reports only the cost term and therefore does not
reapply it to net P/L or describe a causal broker effect.

### Related Concepts

- Broader concept: fee and cost metrics.
- Narrower concepts: `fees_per_trade`, `fees_per_share`, and the gross-profit percentage.
- Commonly confused concepts: signed charges, charge credit, net P/L, commissions, and regulatory fees.
- Must not be merged with: `total_commissions`, `total_regulatory_fees`, or `pnl_after_fees`.

---

## `fees_per_trade`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-004 |
| Category | Fees and Costs Metrics |
| Subcategory | rate_per_trade |
| Canonical name | fees_per_trade |
| Display name | Fees per trade |
| Exact definition | `total_transaction_costs` divided by the count of eligible same-population `ready_closed` round trips. |
| Distinction from related concepts | Not fees per execution/fill, not fees per share, and not average signed charges. â€œTradeâ€ means a ready-closed round trip under this record. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Money per eligible ready-closed round trip in one declared currency. |
| Open-trade support | No. Open/decision rows remain coverage only and are not denominator members. |
| Fee handling | Numerator is `total_transaction_costs`: supported normalized `charge_cost` only; credits remain separate and are not netted. |
| Version | 1 |
| Required data | All `total_transaction_costs` facts plus the exact same-population count of fee-complete `ready_closed` round trips. |
| Optional data | Date range and server-allowlisted filters/groupings. |
| Valid filters and groupings | Same typed-query scope/filter set for numerator and denominator; grouped output only when every group preserves that same-population rule. |
| Valid operators and intents | Calculate, summarize, compare, group/aggregate, rank where an approved grouping exists, explain, and inspect coverage. |
| Default interpretation | â€œTradeâ€ means ready-closed round trip, not execution. State the count and coverage. |
| Clarification conditions | Clarify if the trader means executions/fills, or if account/currency/date/filter scope is unresolved. |
| Unsupported conditions | Execution denominator substituted silently; zero denominator; mixed populations; cross-currency money rate; missing fees as zero; causal/advice interpretation; AI Chat execution. |
| Target analytics tool or query capability | Planned named metric over current charge-cost and closed-round-trip primitives; future AI validator/router. |
| Sample-size considerations | Show eligible covered-trade count. A small count makes the average descriptive only. |
| Coverage behavior | `complete`/`partial` follow the fee-cost numerator; `unavailable` when no fee-complete ready-closed denominator exists; `estimated` only from explicit source evidence. |

### Formula and Interpretation

```text
fees_per_trade = total_transaction_costs / count(fee-complete ready_closed round trips)
```

Numerator and denominator must use the identical scope, filter, currency, and
eligible population. The result describes an average reported cost per closed
round trip; it does not establish that more trades caused poorer performance.

### Related Concepts

- Broader concept: `total_transaction_costs`.
- Narrower concepts: none in the controlling list.
- Commonly confused concepts: fees per execution, `fees_per_share`, and average signed charges.
- Must not be merged with: `fees_per_share` or an execution-count metric.

---

## `fees_per_share`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-005 |
| Category | Fees and Costs Metrics |
| Subcategory | rate_per_share |
| Canonical name | fees_per_share |
| Display name | Fees per share |
| Exact definition | `total_transaction_costs` divided by total entered shares: the sum of position-increasing allocated quantities with roles `opening`, `adding`, and `flip_opening` over the identical eligible population. |
| Distinction from related concepts | Not profit per share, per-100-share output, exit volume, maximum exposure, contract units, or a per-execution fee. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Money per entered share in one declared currency. |
| Open-trade support | No realized-result support. Open/decision rows are coverage only. |
| Fee handling | Numerator is supported normalized non-negative `charge_cost`; credits remain separate and are never netted into costs. |
| Version | 1 |
| Required data | All `total_transaction_costs` facts plus the identical-population allocated quantity roles `opening`, `adding`, and `flip_opening`. |
| Optional data | Date range, compatible filters, and approved non-money groupings. |
| Valid filters and groupings | Same population for money numerator and entered-share denominator; only typed-query allowlists. Currency partitions must remain separate. |
| Valid operators and intents | Calculate, summarize, compare, group/aggregate where supported, explain, and inspect coverage. |
| Default interpretation | Use total entered shares only. Do not choose exit volume, maximum exposure, contract units, or per-100-share scaling. |
| Clarification conditions | Clarify scope/currency/filter ambiguity or a request explicitly using a different unit; do not reinterpret â€œsharesâ€ as contracts. |
| Unsupported conditions | Zero/unknown entered shares; quantity/allocation mismatch; exit/exposure/contract denominator; cross-currency rate; missing fees as zero; causal/advice statement; AI Chat execution. |
| Target analytics tool or query capability | Planned named metric consuming current exact allocation and entered-quantity facts; future AI validator/router. |
| Sample-size considerations | Return entered-share denominator and covered/eligible trade counts. High share count alone does not imply fee efficiency. |
| Coverage behavior | `complete`/`partial` require both charge and entered-share coverage on the same rows; `unavailable` for zero/unknown denominator or no covered population; `estimated` only from explicit source evidence. |

### Formula and Interpretation

```text
fees_per_share = total_transaction_costs /
  Î£ allocated_quantity(role in {opening, adding, flip_opening})
```

The exact denominator is total entered shares, not exited quantity, maximum
position, a contract multiplier, or a compatibility per-100-share measure.
This is a unit-normalized descriptive cost, not a claim about trade quality.

### Related Concepts

- Broader concept: `total_transaction_costs`.
- Narrower concepts: none in the controlling list.
- Commonly confused concepts: Category 2 `profit_per_share`, `net_pnl_per_100_shares`, exit volume, and maximum exposure.
- Must not be merged with: `fees_per_trade` or `profit_per_share`.

---

## `fees_as_percentage_of_gross_profit`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-006 |
| Category | Fees and Costs Metrics |
| Subcategory | gross_profit_ratio |
| Canonical name | fees_as_percentage_of_gross_profit |
| Display name | Fees as a percentage of gross profit |
| Exact definition | `total_transaction_costs` divided by positive gross profit for the identical eligible population and currency, expressed as a percentage. |
| Distinction from related concepts | Not percentage of gross P/L, gross loss, net P/L, account return, signed charges, or an expectancy delta. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | Percentage with exact numerator/denominator retained and display rounding applied only at presentation. |
| Open-trade support | No. Realized ready-closed population only; open/decision rows remain coverage only. |
| Fee handling | Numerator is `total_transaction_costs` using supported `charge_cost` only. Charge credit remains separate and is not netted. |
| Version | 1 |
| Required data | All `total_transaction_costs` facts; exact positive gross profit from Category 2; identical eligible ready-closed population; one currency partition. |
| Optional data | Date range and typed-query allowlisted filters/groupings. |
| Valid filters and groupings | Same filters/population/currency for numerator and denominator; group only where each group independently has positive gross profit and declared coverage. |
| Valid operators and intents | Calculate, summarize, compare, group/aggregate where supported, rank with an explicit metric, explain, and inspect coverage. |
| Default interpretation | Use positive gross profit only; return unavailable rather than zero or infinity when it is zero or negative. |
| Clarification conditions | Clarify ambiguous scope/currency/period or a request that means gross P/L, gross loss, return, or a different percentage basis. |
| Unsupported conditions | Zero/negative gross-profit denominator; cross-currency ratio; mixed populations; fee-incomplete rows represented as complete; model estimate; causal/advice claim; AI Chat execution. |
| Target analytics tool or query capability | Current conditional charge/gross-profit primitives and exact math; future named language metric/tool route. |
| Sample-size considerations | Return covered/eligible count, positive-gross-profit denominator, and partial limitation. A high percentage is descriptive, not a recommendation. |
| Coverage behavior | `complete` when all required rows are fee-complete; `partial` when gross-eligible rows lack fee coverage; `unavailable` for non-positive denominator or no computable covered population; `estimated` only from explicit source evidence. |

### Formula and Interpretation

```text
fees_as_percentage_of_gross_profit =
  total_transaction_costs / gross_profit * 100
```

`gross_profit` must be strictly positive and must cover the identical
fee-complete ready-closed population. The ratio reports the defined cost share
of positive gross profit; it does not assert the cause of a loss or recommend a
broker or trading change.

### Related Concepts

- Broader concept: fee-effect ratios.
- Narrower concepts: none in the controlling list.
- Commonly confused concepts: percentage of gross P/L, gross loss, net P/L, and account return.
- Must not be merged with: `fee_impact_on_expectancy` or Category 2 percentage-return metrics.

---

## `trades_turned_from_green_to_red_by_fees`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-007 |
| Category | Fees and Costs Metrics |
| Subcategory | gross_net_transition |
| Canonical name | trades_turned_from_green_to_red_by_fees |
| Display name | Trades turned from green to red by fees |
| Exact definition | Count of fee-complete `ready_closed` round trips in the declared population where exact gross P/L is greater than zero and exact net P/L is less than zero. |
| Distinction from related concepts | Not an intraday â€œgave it backâ€ path, a market-price reversal, all net losses, or a causal claim. Category 3 owns green/red outcome vocabulary. |
| Evidence classification | deterministically derived |
| Capability status | Planned |
| Result units | Count of qualifying ready-closed round trips; optional percentage requires a separately declared eligible denominator. |
| Open-trade support | No. Open/decision rows are excluded from the transition count and reported in coverage. |
| Fee handling | Gross and net values use the same fee-complete row; net follows accepted `gross - charge_cost + charge_credit` policy. |
| Version | 1 |
| Required data | Authorized scope; exact gross and fee-complete net P/L for the same current ready-closed row; supported sign policy; allocation conservation; matching currency; and declared population. |
| Optional data | Date range, typed-query filters, and later approved grouping dimensions. |
| Valid filters and groupings | Same eligible fee-complete ready-closed population; only allowlisted filters/groupings, with counts and coverage shown per group. |
| Valid operators and intents | Calculate, summarize, compare, group/aggregate, rank by explicit count, explain, and inspect coverage. |
| Default interpretation | Exact transition only: gross P/L > 0 and net P/L < 0. Gross zero or net zero does not qualify. |
| Clarification conditions | Clarify a request meaning intraday green-to-red, a day-level transition, or a different P/L basis; clarify unresolved scope/date/filter. |
| Unsupported conditions | Open/decision inclusion; mixed gross and fee-covered populations; inferred fee; cross-currency totals; market-path interpretation; causal/advice claim; AI Chat execution. |
| Target analytics tool or query capability | Planned named transition metric over current gross/net fact primitives; future AI validator/router. |
| Sample-size considerations | Return qualifying count and eligible fee-complete count. Small counts do not support a broad conclusion about fees or broker quality. |
| Coverage behavior | `complete`/`partial` follow fee-complete net coverage; `unavailable` when no fee-complete net result can be formed; `estimated` only from explicit source evidence. |

### Formula and Interpretation

```text
trades_turned_from_green_to_red_by_fees =
  count(round_trip where gross_pnl > 0 and net_pnl < 0)
```

Both comparisons are exact, use the same fee-complete ready-closed round trip,
and have the same currency. This identifies an arithmetic gross-to-net outcome
transition only; it does not prove a fee or broker caused a trading loss.

### Related Concepts

- Broader concept: gross/net fee-effect analysis.
- Narrower concepts: none in the controlling list.
- Commonly confused concepts: Category 3 gross winner/net loser labels, intraday green-to-red, and total net losses.
- Must not be merged with: day-level giveback or market-path analytics.

---

## `fee_impact_on_expectancy`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-008 |
| Category | Fees and Costs Metrics |
| Subcategory | expectancy_delta |
| Canonical name | fee_impact_on_expectancy |
| Display name | Fee impact on expectancy |
| Exact definition | A future Category 4-consuming comparison of gross expectancy minus net expectancy over the identical fee-complete `ready_closed` population. Positive means costs reduced expectancy; negative can reflect credits. |
| Distinction from related concepts | Not a Category 5 expectancy metric, not total transaction costs, not a causal effect, and not an inferred performance diagnosis. |
| Evidence classification | deterministically derived |
| Capability status | Unavailable |
| Result units | Money per eligible ready-closed round trip in one currency, once Category 4 defines expectancy. |
| Open-trade support | No. Open/decision rows remain coverage only. |
| Fee handling | Future net expectancy must consume accepted fee-complete net P/L. Charge credits can make the stated delta negative; they are not silently removed or double-counted. |
| Version | 1 |
| Required data | All future Category 4 gross/net expectancy facts and formula version; identical fee-complete ready-closed population; supported charge coverage; one currency; sample and zero/partial rules. Category 4 contract is currently absent. |
| Optional data | Date range, filters, and later approved dimensions. |
| Valid filters and groupings | None executable until Category 4 locks the formula. Any later filter/group must preserve identical gross/net population and currency. |
| Valid operators and intents | Recognition may route to unavailable/clarification handling; calculation, comparison, explanation, and grouping await Category 4. |
| Default interpretation | Return unavailable and name the missing Category 4 expectancy contract; do not calculate a substitute average. |
| Clarification conditions | Clarify scope/date/filter only when it changes the future request; do not ask the trader to choose an expectancy formula. |
| Unsupported conditions | Category 5-defined expectancy; mismatched populations; cross-currency money delta; missing fees estimated; causal/advice wording; AI Chat execution. |
| Target analytics tool or query capability | Future Category 4 expectancy metric consumed by a Category 5 delta adapter; no current tool. |
| Sample-size considerations | Future result must state identical covered sample count, gross/net coverage, and Category 4 sample policy. |
| Coverage behavior | `unavailable` until Category 4 locks the contract. A future response displays exact, estimated, partially available, or unavailable, mapped from internal evidence; it never model-estimates missing fees. |

### Formula and Interpretation

The proposed consuming formula, which Category 5 does not independently lock,
is:

```text
fee_impact_on_expectancy = gross_expectancy - net_expectancy
```

It uses the identical fee-complete ready-closed population. A positive value
means the defined cost treatment reduced expectancy; a negative value may
reflect charge credits. It is arithmetic only, not causal advice.

### Related Concepts

- Broader concept: fee-effect analysis.
- Narrower concepts: none in the controlling list.
- Commonly confused concepts: Category 4 expectancy, `total_transaction_costs`, and fees per trade.
- Must not be merged with: the Category 4 expectancy metric or a broker-quality claim.

---

## `fee_impact_by_broker`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-009 |
| Category | Fees and Costs Metrics |
| Subcategory | broker_grouped_impact |
| Canonical name | fee_impact_by_broker |
| Display name | Fee impact by broker |
| Exact definition | Future grouping of the Category 4-owned gross-expectancy-minus-net-expectancy delta over the identical fee-complete `ready_closed` population by the stable, source-backed broker institution identity defined by Category 11. |
| Distinction from related concepts | Not grouping by import label, adapter, provenance group, account ID, or a broker display string unless Category 11 explicitly defines it as the stable broker institution identity. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Unavailable |
| Result units | Future grouped money-per-ready-closed-round-trip expectancy delta, within separate currencies. |
| Open-trade support | No realized fee-effect support. Open/decision rows remain coverage only. |
| Fee handling | Future groups must preserve the accepted charge-cost/credit, internal complete/partial evidence, display-state mapping, and no-double-counting rules for each group. |
| Version | 1 |
| Required data | Category 4-owned gross-minus-net expectancy contract; Category 11 stable source-backed broker institution identity; authorized scope; identical fee-complete `ready_closed` population; currency partition; and group coverage. Both owning contracts are currently absent. |
| Optional data | Date range and other later-approved dimensions, provided they do not redefine broker identity. |
| Valid filters and groupings | None executable. A later request may group only by Category 11 broker institution identity and must not merge provenance, account, or import labels. |
| Valid operators and intents | Recognition may return unavailable. Calculation/grouping/comparison/ranking await both Category 4's expectancy-delta contract and Category 11's broker-identity contract. |
| Default interpretation | Return unavailable, naming the missing Category 4 gross-minus-net expectancy-delta contract and Category 11 stable broker identity. No other fee-impact measure substitutes. |
| Clarification conditions | Clarify whether the trader means broker institution, account, adapter, or import source; do not silently choose one. |
| Unsupported conditions | Grouping by labels/IDs alone; cross-currency money comparison; inferred broker; causal/advice claim; AI Chat execution. |
| Target analytics tool or query capability | Future grouped Category 4 gross-minus-net expectancy-delta query after Category 11 broker grouping is defined; no current tool. |
| Sample-size considerations | Future output must show group covered/eligible counts and avoid rankings or conclusions from insufficient groups. |
| Coverage behavior | `unavailable` until stable broker identity and underlying impact formula exist. Future groups independently display exact, estimated, partially available, or unavailable coverage. |

### Formula and Interpretation

No executable formula exists. The future consuming formula is exactly:

```text
for each Category 11 broker institution group:
  gross_expectancy(identical fee-complete ready_closed population)
  - net_expectancy(identical fee-complete ready_closed population)
```

Category 4 owns and must lock the expectancy-delta contract; Category 11 owns
and must define the stable broker identity. Until both exist this metric remains
Unavailable. It cannot substitute another fee-impact measure or turn source
provenance, an import label, or an account ID into broker identity by inference.

### Related Concepts

- Broader concept: grouped fee-effect analysis.
- Narrower concepts: none in the controlling list.
- Commonly confused concepts: broker import source, adapter, account, and `fee_impact_on_expectancy`.
- Must not be merged with: Category 11 broker dimension or an ungrouped fee-impact metric.

---

## `fee_completeness`

| Field | Value |
|---|---|
| Inventory ID | C5-FEE-010 |
| Category | Fees and Costs Metrics |
| Subcategory | coverage_state |
| Canonical name | fee_completeness |
| Display name | Fee completeness |
| Exact definition | Fee-specific coverage state for a declared population, determined from supported fee facts, matching fee/trade currency, supported sign policy, and exact allocation conservation. |
| Distinction from related concepts | Not generic Journal/import coverage, not an amount, and not a guarantee that all trade facts or all accounts are complete. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Supported |
| Result units | Categorical state plus covered/eligible counts and factual limitation reasons; no money unit. |
| Open-trade support | Open/decision rows are reported as coverage populations and are not silently treated as realized fee-effect rows. |
| Fee handling | Preserve original sign/kind evidence. A reported charge requires supported sign policy, matching fee currency, and conserving allocation; missing/unsupported facts are never filled by a model. |
| Version | 1 |
| Required data | Authorized scope; declared population/currency; current execution/allocation graph; fee fact presence; source sign-policy support; fee-currency agreement; allocation-conservation result; and coverage reason counts. |
| Optional data | Date range, typed-query filters, and source/provenance detail that remains privacy-safe and server-scoped. |
| Valid filters and groupings | Allowlisted scope/date/filter dimensions. Grouping must show state and counts independently and cannot combine currencies into a money total. |
| Valid operators and intents | Inspect coverage, calculate/summarize a coverage result, compare coverage populations, group where allowed, explain, and unavailable handling. |
| Default interpretation | Return one of `exact`, `estimated`, `partially available`, or `unavailable`, with covered/eligible counts and factual reasons. Internal complete maps to exact and internal partial maps to partially available. |
| Clarification conditions | Clarify population/scope/date/filter only. â€œCompleteâ€ never implies all Journal facts are complete. |
| Unsupported conditions | Model-estimated fee coverage; treating missing/unsupported fee as zero; exposing private source identifiers; cross-account inference; causal/advice claim; AI Chat execution. |
| Target analytics tool or query capability | Current Journal Analytics Fact Set coverage path and result contract; future AI coverage-language validator/router. |
| Sample-size considerations | Always report covered/eligible counts. A complete small sample is not a broad performance conclusion. |
| Coverage behavior | Display `exact` when every required row has supported fee facts, matching currency, supported sign policy, and conserving allocation; `partially available` when only a subset qualifies; `estimated` only for an explicitly source-evidenced estimate; and `unavailable` when no valid coverage state/result can be formed. |

### Formula and Interpretation

```text
complete  = every required row has a supported fee fact, matching currency,
            supported sign policy, and conserving allocation
partial   = a declared subset qualifies and the omitted rows/reasons are shown
estimated = an explicitly source-evidenced estimate exists; never model-made.
User-facing output maps internal complete evidence to exact and internal partial evidence to partially available.
unavailable = no valid state/result can be formed for the declared request
```

This state is evidence reporting, not permission to estimate missing fees or to
describe a result as financially complete outside its declared population.

### Related Concepts

- Broader concept: Journal factual coverage.
- Narrower concepts: complete, partial, estimated, and unavailable states.
- Commonly confused concepts: import completeness, net-P&L availability, and generic data quality.
- Must not be merged with: generic Journal coverage or a money metric.

---

# 6. Language Registry Deliverable

All ten Version 1 language registries are complete, approved, and locked. Each
has the required 38 subsections. They describe planned AI Chat language routing
only; they do not claim an AI Chat runtime.

## `total_commissions` Language Registry

### Exact Definition

- An unavailable commission-only total: a future sum of explicit kind-backed, normalized non-negative commission `charge_cost` in one authorized account scope, one currency, and the declared eligible population; matching `charge_credit` is separately reported.

### Formal Wording

- Return total commissions for the selected eligible closed-trade population.

### Normal Conversational Wording

- What did I pay in commissions this month?; show my commission total.

### Trader Slang

- What did commissions cost me?; commission bill for July.

### Abbreviations

- `COM` maps only with explicit commission metric grammar or trusted context; bare `COM` remains ticker-shaped and must not auto-route.

### Common Misspellings

- Commisions; commisions; commision total.

### Noisy or Incomplete Input

- com July; commissions NVDA.

### Singular and Plural Forms

- Commission; commissions; commission total.

### Full Questions

- What were my commissions on eligible closed trades last week?; show total commissions for July in USD.

### Commands

- Calculate commissions for this month; show commission coverage for NVDA.

### Sentence Fragments

- Commissions this week; total commission cost.

### Follow-Up Wording

- What about the prior month?; now only the selected ticker.

### Correction Wording

- I meant commissions, not all transaction costs; do not use regulatory fees.

### Comparison Wording

- Compare commissions this month with last month; which valid period had more commissions?

### Ranking Wording

- Rank eligible tickers by commissions; show the highest commission days.

### Negated Wording

- Do not use all fees; not regulatory fees; exclude open trades.

### Exclusion Wording

- Exclude TSLA; leave out rows that need a decision.

### Multi-Filter Wording

- Commissions for NVDA in July, excluding trades that need a decision.

### Multi-Part Question Wording

- Show commissions for July, compare June, and explain the coverage.

### Ambiguous Wording

- â€œFeesâ€ does not mean commissions. A bare `COM` remains ticker-safe; an explicit request for a commission component recognizes this metric but returns its unavailable contract.

### Negative Examples

- What were all my transaction costs?; what were my regulatory fees?; estimate the commissions I should have paid.

### Context Requirements

- Server-authorized account scope and one currency are required. Trusted date, ticker, or selected-trade context may narrow the request; the trader cannot select another account or broker.

### Required Data

- Authorized scope, declared currency, eligible current accepted execution/allocation graph, exact allocation conservation, explicit supported commission-kind provenance, normalized non-negative commission `charge_cost`, and matching credit handling; that component is absent now.

### Optional Data

- Declared date range, ticker, selected trade, and server-allowlisted filters.

### Valid Filters

- Server-enforced scope, date range, ticker, selected trade, and approved eligible-population filters; no broker or account selection.

### Valid Groupings

- A future supported commission result may group by approved date buckets or ticker within one currency; no broker grouping and no cross-currency total.

### Valid Operators

- Recognize calculate, summarize, compare, group, rank, explain, and coverage inspection; calculation returns unavailable until the component contract exists.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- All-cost or regulatory substitution, inferred kind, account/broker selection, cross-currency total, model estimate, causation, advice, or AI Chat execution.

### Default Interpretation

- Treat an explicit commission request as the unavailable commission-only metric; never fall back to `total_transaction_costs`, signed charges, or a user-invented formula.

### Clarification Conditions

- Ask one direct question only for an unresolved date, currency, or filter field; do not ask the trader to classify statement rows.

### Recommended Clarification Wording

- Which period should I use for total commissions?

### Unsupported Conditions

- An absent supported commission component, invalid query contract, inferred kind, or unsupported currency returns `unavailable` with the factual reason.

### Target Analytics Tool or Query Capability

- Planned metric-language validator and Journal Analytics metric registry route; no current dedicated commission calculation or AI Chat tool.

### Result Units

- Future money amount in one declared currency, with user-facing `exact`, `estimated`, `partially available`, or `unavailable` coverage; currently `unavailable`.

### Fee Handling

- Sum kind-backed normalized non-negative commission `charge_cost` only. Never infer commission from labels, amounts, or another fee kind; report matching `charge_credit` separately and never net or double-count it.

### Open-Trade Handling

- Legitimate-open and `needs_decision` rows remain coverage only and never enter a realized commission result.

### Sample-Size Considerations

- A future result must return covered and eligible counts; a small population does not support a broker-quality conclusion.

## `total_regulatory_fees` Language Registry

### Exact Definition

- An unavailable regulatory-fee-only total: a future sum of explicit kind-backed, normalized non-negative regulatory `charge_cost` in one authorized account scope, one currency, and the declared eligible population; matching `charge_credit` is separately reported.

### Formal Wording

- Return total regulatory fees for the selected eligible closed-trade population.

### Normal Conversational Wording

- How much did I pay in regulatory fees?; show my regulatory fee total.

### Trader Slang

- What were the SEC-type fees?; regulatory fee bill for July.

### Abbreviations

- `REG` maps only with explicit regulatory-fee metric grammar or trusted context; bare `REG` remains ticker-shaped and must not auto-route.

### Common Misspellings

- Regulatry fees; regulartory fee; regulatorys.

### Noisy or Incomplete Input

- reg fees July; regulatory NVDA.

### Singular and Plural Forms

- Regulatory fee; regulatory fees; regulation fee.

### Full Questions

- What were my regulatory fees on eligible closed trades last week?; show regulatory fees for July in USD.

### Commands

- Calculate regulatory fees for this month; inspect regulatory-fee coverage.

### Sentence Fragments

- Regulatory fees this week; REG total.

### Follow-Up Wording

- Now compare the prior month; show only the selected ticker.

### Correction Wording

- I meant regulatory fees, not commissions; do not use all transaction costs.

### Comparison Wording

- Compare regulatory fees this month with last month; which valid period had more?

### Ranking Wording

- Rank eligible tickers by regulatory fees; show the highest regulatory-fee days.

### Negated Wording

- Do not use commissions; not all fees; exclude open trades.

### Exclusion Wording

- Exclude AAPL; leave out trades that need a decision.

### Multi-Filter Wording

- Regulatory fees for NVDA in July, excluding rows that need a decision.

### Multi-Part Question Wording

- Show regulatory fees for July, compare June, and explain the coverage.

### Ambiguous Wording

- â€œFeesâ€ does not mean regulatory fees. Bare `REG` remains ticker-safe; an explicit regulatory request recognizes this metric but retains its unavailable contract.

### Negative Examples

- What were all my transaction costs?; what commissions did I pay?; infer the regulatory fee from the amount.

### Context Requirements

- Server-authorized account scope and one currency are required. Date, ticker, and selected-trade context may narrow the request; account and broker selection are not user controls.

### Required Data

- Authorized scope, declared currency, eligible current accepted execution/allocation graph, exact conservation, explicit supported regulatory-kind provenance, normalized non-negative regulatory `charge_cost`, and matching credit handling; that component is absent now.

### Optional Data

- Declared date range, ticker, selected trade, and server-allowlisted filters.

### Valid Filters

- Server-enforced scope, date range, ticker, selected trade, and approved eligible-population filters; no broker or account selection.

### Valid Groupings

- A future supported regulatory result may group by approved date buckets or ticker within one currency; no broker group and no cross-currency total.

### Valid Operators

- Recognize calculate, summarize, compare, group, rank, explain, and coverage inspection; calculation returns unavailable until the component contract exists.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Commission/tax/interest/borrow substitution, inferred kind, account/broker selection, cross-currency total, estimate, causation, advice, or AI Chat execution.

### Default Interpretation

- Treat an explicit regulatory-fee request as unavailable; never substitute all costs, commissions, signed charges, or a user-invented formula.

### Clarification Conditions

- Ask one direct question only for an unresolved date, currency, or filter field; do not ask the trader to identify regulatory rows.

### Recommended Clarification Wording

- Which period should I use for total regulatory fees?

### Unsupported Conditions

- An absent supported regulatory component, invalid query contract, inferred kind, or unsupported currency returns `unavailable` with the factual reason.

### Target Analytics Tool or Query Capability

- Planned metric-language validator and Journal Analytics metric registry route; no current regulatory-fee calculation or AI Chat tool.

### Result Units

- Future money amount in one declared currency, with user-facing `exact`, `estimated`, `partially available`, or `unavailable` coverage; currently `unavailable`.

### Fee Handling

- Sum kind-backed normalized non-negative regulatory `charge_cost` only. Preserve original sign/kind evidence; report matching `charge_credit` separately and never net or double-count it. Do not infer a regulatory component from labels, amounts, tax, interest, borrow, or another charge kind.

### Open-Trade Handling

- Legitimate-open and `needs_decision` rows remain coverage only and never enter a realized regulatory-fee result.

### Sample-Size Considerations

- A future result must return covered and eligible counts; small samples do not establish a broker or regulatory conclusion.

## `total_transaction_costs` Language Registry

### Exact Definition

- Sum supported normalized non-negative `charge_cost` exactly once over the declared eligible same-population and one currency; `charge_credit` is separately reported and never netted or double-counted.

### Formal Wording

- Return total transaction costs for the selected eligible closed-trade population.

### Normal Conversational Wording

- What did my trades cost in fees this month?; show total transaction costs.

### Trader Slang

- What was the fee drag?; total trading costs for July.

### Abbreviations

- `TTC` maps only with explicit total-transaction-cost metric grammar or trusted context; bare `TTC` remains ticker-shaped and must not auto-route.

### Common Misspellings

- Transation costs; transaction costts; total trans costs.

### Noisy or Incomplete Input

- ttc July; fees NVDA.

### Singular and Plural Forms

- Transaction cost; transaction costs; total fees.

### Full Questions

- What were my total transaction costs on eligible closed trades last week?; show all supported trading costs for July in USD.

### Commands

- Calculate transaction costs for this month; show fee-cost coverage by ticker.

### Sentence Fragments

- Fees this week; TTC by day.

### Follow-Up Wording

- Now only shorts; compare that with the prior month.

### Correction Wording

- I meant all supported transaction costs, not just commissions; keep credits separate.

### Comparison Wording

- Compare transaction costs this month with last month; were costs higher for NVDA than AAPL?

### Ranking Wording

- Rank eligible tickers by transaction costs; show the highest-cost valid weeks.

### Negated Wording

- Do not net credits into fees; not commissions only; exclude open trades.

### Exclusion Wording

- Exclude TSLA; leave out trades that need a decision.

### Multi-Filter Wording

- Transaction costs for long NVDA trades in July, excluding rows that need a decision.

### Multi-Part Question Wording

- Show transaction costs for July, compare June, and explain the partial coverage.

### Ambiguous Wording

- â€œFeesâ€ defaults here only when it clearly asks for all transaction costs; â€œcommission,â€ â€œregulatory,â€ â€œsigned fees,â€ and â€œcreditsâ€ route separately. Bare `TTC` remains ticker-safe.

### Negative Examples

- Net my fee credits against costs; show commissions only; tell me why this broker cost more.

### Context Requirements

- Server-authorized account scope, one currency, and a declared eligible population are required. Trusted date, ticker, direction, or selected-trade context may narrow scope; user account/broker selection is unavailable.

### Required Data

- Authorized scope, current accepted execution/allocation graph, declared currency, supported recorded fee facts, versioned sign policy, normalized non-negative `charge_cost`, exact conserving allocation, and identical eligible population.

### Optional Data

- Date range, ticker, direction, selected trade, and an approved grouping request.

### Valid Filters

- Server-enforced account scope, date range, ticker, directly observed direction, selected trade, and typed-query eligible-population filters; no user broker/account filter.

### Valid Groupings

- Approved closing-date buckets, ticker, and directly observed direction when each group keeps the same fee/population contract and one currency.

### Valid Operators

- Sum, compare, group and aggregate, rank, summarize, explain, and inspect coverage over separately valid same-currency populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Credit netting, charge-kind inference, cross-currency sum, missing fees as zero, account/broker selection, causation, advice, or AI Chat execution.

### Default Interpretation

- Sum only supported normalized `charge_cost` once for the resolved population and currency. Return coverage with costs; never fall back to signed charges or a user-created net-fee formula.

### Clarification Conditions

- Ask one direct question only for one unresolved date, currency, filter, or request for a distinct fee basis.

### Recommended Clarification Wording

- Do you want all supported transaction costs or commissions only?

### Unsupported Conditions

- Invalid query contract, cross-currency request, unsupported fee facts, zero-valid population, or a request to net credits returns the valid `unavailable`/coverage result, not a substitute formula.

### Target Analytics Tool or Query Capability

- Current Journal Analytics Fact Set charge allocation and conditional charge metric path; planned AI metric-language validator and router.

### Result Units

- Money in one declared currency with covered/eligible counts and user-facing `exact`, `estimated`, `partially available`, or `unavailable` coverage.

### Fee Handling

- Include supported normalized non-negative `charge_cost` once. Report `charge_credit` separately; never net it into cost or reapply it to gross-to-net.

### Open-Trade Handling

- Legitimate-open and `needs_decision` rows remain coverage populations, not realized fee-effect members or zero-cost rows.

### Sample-Size Considerations

- Return covered and eligible counts for totals, comparisons, rankings, and every group; counts are descriptive, not a quality or causal conclusion.

## `fees_per_trade` Language Registry

### Exact Definition

- Planned average supported transaction cost per identical eligible `ready_closed` round trip: `total_transaction_costs` divided by its fee-complete ready-closed count.

### Formal Wording

- Return average transaction cost per eligible closed round trip for the selected population.

### Normal Conversational Wording

- What did I pay in fees per trade?; show my average trade fee.

### Trader Slang

- What was my fee per play?; average cost per closed trade.

### Abbreviations

- `FPT` maps only with explicit fees-per-trade metric grammar or trusted context; bare `FPT` remains ticker-shaped and must not auto-route.

### Common Misspellings

- Fees per trad; fee per tradee; fee per traid.

### Noisy or Incomplete Input

- fpt July; average fees trade.

### Singular and Plural Forms

- Fee per trade; fees per trade; average trade fee.

### Full Questions

- What were my fees per eligible closed trade last week?; show the average transaction cost per round trip in July.

### Commands

- Calculate fees per trade for this month; compare average trade fees by ticker.

### Sentence Fragments

- Fee per trade July; average trade cost.

### Follow-Up Wording

- Now just long trades; what about the prior month?

### Correction Wording

- I mean closed round trips, not executions or fills; do not net credits.

### Comparison Wording

- Compare fees per trade this month with last month; which ticker had the higher average fee per trade?

### Ranking Wording

- Rank eligible tickers by fees per trade; show the highest average-cost valid weeks.

### Negated Wording

- Not fees per execution; do not include open trades; do not net credits.

### Exclusion Wording

- Exclude AAPL; leave out trades that need a decision.

### Multi-Filter Wording

- Fees per trade for long NVDA trades in July, excluding rows that need a decision.

### Multi-Part Question Wording

- Show fees per trade for July, compare June, and explain the denominator.

### Ambiguous Wording

- â€œTradeâ€ defaults to a fee-complete `ready_closed` round trip, never an execution. Bare `FPT` remains ticker-safe; â€œper fillâ€ requires clarification rather than a silent denominator change.

### Negative Examples

- What was my fee per execution?; divide all fees by every fill; estimate the average for missing fee rows.

### Context Requirements

- Server-authorized account scope, one currency, identical numerator/denominator population, and a ready-closed trade basis are required. User account/broker selection is unavailable.

### Required Data

- All exact `total_transaction_costs` facts plus the count of fee-complete eligible `ready_closed` round trips in the identical scope, filter, currency, and population.

### Optional Data

- Date range, ticker, direction, selected trade, and approved grouping.

### Valid Filters

- Server-enforced scope, date range, ticker, directly observed direction, selected trade, and typed-query eligible-population filters, applied identically to numerator and denominator.

### Valid Groupings

- Approved closing-date buckets, ticker, and directly observed direction when each group retains identical cost/count populations and one currency.

### Valid Operators

- Calculate, summarize, compare, group and aggregate, rank, explain, and inspect coverage over valid same-basis groups.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Execution/fill denominator without direct clarification, zero denominator, mixed population, cross-currency rate, missing fees as zero, account/broker selection, causation, advice, or AI Chat execution.

### Default Interpretation

- Use `total_transaction_costs` divided by identical eligible fee-complete `ready_closed` round trips. This planned metric has no runtime fallback or user-invented denominator.

### Clarification Conditions

- Ask one direct question only when â€œtradeâ€ materially means executions/fills or one scope, currency, date, or filter field remains unresolved.

### Recommended Clarification Wording

- Do you mean fees per eligible closed round trip or per execution?

### Unsupported Conditions

- Invalid query contract, zero/no eligible fee-complete denominator, cross-currency request, or substitute denominator returns `unavailable`, not a calculated approximation.

### Target Analytics Tool or Query Capability

- Planned named metric over Journal charge-cost and closed-round-trip primitives, with a planned AI validator/router; no AI Chat runtime.

### Result Units

- Money per eligible ready-closed round trip in one declared currency, with user-facing `exact`, `estimated`, `partially available`, or `unavailable` coverage.

### Fee Handling

- Numerator is supported normalized non-negative `charge_cost` only; `charge_credit` is separately reported and never netted or double-counted.

### Open-Trade Handling

- Legitimate-open and `needs_decision` rows stay in coverage and never join the realized numerator or ready-closed denominator.

### Sample-Size Considerations

- Return covered/eligible round-trip count for every result and group. A small average is descriptive, not advice or a broker-quality finding.

## `fees_per_share` Language Registry

### Exact Definition

- Planned supported transaction cost per entered share: `total_transaction_costs` divided by total allocated quantities with roles `opening`, `adding`, and `flip_opening` in the identical eligible population; zero or unknown entered shares are unavailable.

### Formal Wording

- Return transaction cost per total entered share for the selected eligible population.

### Normal Conversational Wording

- What did I pay in fees per share?; show my average fee for each share entered.

### Trader Slang

- What was my cents-per-share fee?; fee rate per share.

### Abbreviations

- `FPS` maps only with explicit fees-per-share metric grammar or trusted context; bare `FPS` remains ticker-shaped and must not auto-route.

### Common Misspellings

- Fees per shre; fee per sharee; fees per shair.

### Noisy or Incomplete Input

- fps July; fee share NVDA.

### Singular and Plural Forms

- Fee per share; fees per share; per-share fee.

### Full Questions

- What were my fees per entered share last week?; show transaction costs per share for eligible July trades.

### Commands

- Calculate fees per share for this month; rank tickers by per-share cost.

### Sentence Fragments

- Fees per share July; FPS by ticker.

### Follow-Up Wording

- Now only long trades; compare the prior month.

### Correction Wording

- Use entered shares, not exit volume or maximum exposure; do not use a per-100-share rate.

### Comparison Wording

- Compare fees per share this month with last month; which ticker had the higher per-share cost?

### Ranking Wording

- Rank eligible tickers by fees per share; show the highest per-share-cost valid weeks.

### Negated Wording

- Not profit per share; do not use exit shares, contracts, or per-100-share scaling.

### Exclusion Wording

- Exclude TSLA; leave out trades that need a decision.

### Multi-Filter Wording

- Fees per share for long NVDA trades in July, excluding rows that need a decision.

### Multi-Part Question Wording

- Show fees per share for July, compare June, and explain the entered-share denominator.

### Ambiguous Wording

- â€œPer shareâ€ means total entered shares only. Bare `FPS` remains ticker-safe; â€œper contract,â€ â€œper exit share,â€ or â€œper 100 sharesâ€ requires one direct clarification.

### Negative Examples

- What was profit per share?; divide fees by exited shares; use my maximum position or estimate missing quantities.

### Context Requirements

- Server-authorized account scope, one currency, identical numerator/denominator population, and exact entered-share allocation roles are required. Account and broker selection are unavailable.

### Required Data

- All exact `total_transaction_costs` facts plus total allocated `opening`, `adding`, and `flip_opening` quantities for the identical eligible population, with exact allocation conservation and known nonzero denominator.

### Optional Data

- Date range, ticker, direction, selected trade, and approved grouping.

### Valid Filters

- Server-enforced scope, date range, ticker, directly observed direction, selected trade, and typed-query eligible-population filters, applied identically to cost and entered shares.

### Valid Groupings

- Approved closing-date buckets, ticker, and directly observed direction when every group preserves identical cost/entered-share population and one currency.

### Valid Operators

- Calculate, summarize, compare, group and aggregate, rank, explain, and inspect coverage over valid same-basis groups.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Exit/exposure/contract/per-100 denominator, zero or unknown entered shares, quantity mismatch, cross-currency rate, missing fees as zero, account/broker selection, causation, advice, or AI Chat execution.

### Default Interpretation

- Divide supported `total_transaction_costs` by identical-population entered shares from `opening`, `adding`, and `flip_opening` only. This planned metric has no substitute denominator or fallback formula.

### Clarification Conditions

- Ask one direct question only for a materially different unit or one unresolved scope, currency, date, or filter field.

### Recommended Clarification Wording

- Do you mean fees per entered share or a different unit such as per contract?

### Unsupported Conditions

- Invalid query contract, zero/unknown entered shares, allocation mismatch, cross-currency request, or unapproved denominator returns `unavailable`, not an estimated or user-invented rate.

### Target Analytics Tool or Query Capability

- Planned named metric consuming exact charge allocation and entered-quantity facts, with a planned AI validator/router; no AI Chat runtime.

### Result Units

- Money per entered share in one declared currency, with user-facing `exact`, `estimated`, `partially available`, or `unavailable` coverage.

### Fee Handling

- Numerator is supported normalized non-negative `charge_cost` once; `charge_credit` is separately reported and never netted or double-counted.

### Open-Trade Handling

- Legitimate-open and `needs_decision` rows remain coverage only; they never enter the realized cost/share population or become zeroes.

### Sample-Size Considerations

- Return entered-share denominator plus covered/eligible trade counts for every result and group. The rate is descriptive, not causation or trading advice.

---

## `fees_as_percentage_of_gross_profit` Language Registry

### Exact Definition

- Supported `total_transaction_costs` divided by strictly positive gross profit, in one currency and over the identical fee-complete `ready_closed` population, expressed as a percentage.

### Formal Wording

- Calculate transaction costs as a percentage of positive gross profit for the selected eligible population.

### Normal Conversational Wording

- How much of my gross profit went to fees?; what percentage of gross profit did fees take?

### Trader Slang

- How much did fees eat from my gross?; fee drag on gross winners.

### Abbreviations

- `fee %` maps only with explicit fee and gross-profit grammar or trusted context. Bare symbol-like abbreviations do not auto-route.

### Common Misspellings

- Fees as percent of gross profitt; fee percentage gross profit; fees percent gross.

### Noisy or Incomplete Input

- Fee % gross July; what did fees eat.

### Singular and Plural Forms

- Fee as a percentage of gross profit; fees as a percentage of gross profits; gross-profit fee percentage.

### Full Questions

- What percentage of my gross profit went to fees last month?; show the fee percentage of gross profit for eligible July trades.

### Commands

- Calculate fees as a percentage of gross profit; compare my gross-profit fee percentage by month.

### Sentence Fragments

- Fees percent gross profit; gross winner fee percentage.

### Follow-Up Wording

- Now only NVDA; compare that with the prior month.

### Correction Wording

- Use positive gross profit, not gross P/L, gross loss, net P/L, or account return.

### Comparison Wording

- Compare the fee percentage of gross profit this month with last month; which valid week had the higher percentage?

### Ranking Wording

- Rank eligible tickers by fees as a percentage of gross profit; show the highest valid months.

### Negated Wording

- Not a percentage of gross losses or net profit; do not include credits as a cost.

### Exclusion Wording

- Exclude TSLA; leave out rows that need a decision.

### Multi-Filter Wording

- Fee percentage of gross profit for long NVDA trades in July, excluding rows that need a decision.

### Multi-Part Question Wording

- Show fees as a percentage of gross profit for July, compare June, and explain the denominator.

### Ambiguous Wording

- â€œGrossâ€ may mean gross P/L, gross profit, or account return. This metric means strictly positive gross profit only; another percentage basis needs one direct clarification.

### Negative Examples

- What percentage of my gross loss was fees?; use net P/L as the denominator; estimate the ratio where gross profit is zero.

### Context Requirements

- Server-authorized scope, one currency, identical numerator/denominator population, positive gross profit, and fee-complete realized rows are required. Account and broker selection are unavailable.

### Required Data

- Exact supported `total_transaction_costs`, exact Category 2 gross profit greater than zero, identical fee-complete `ready_closed` population, and matching currency.

### Optional Data

- Date range, ticker, directly observed direction, selected trade, and approved grouping.

### Valid Filters

- Server-enforced scope, date range, ticker, directly observed direction, selected trade, and typed-query eligible-population filters applied identically to both numerator and denominator.

### Valid Groupings

- Approved closing-date buckets, ticker, and directly observed direction only when each group independently has positive gross profit, identical population, declared coverage, and one currency.

### Valid Operators

- Calculate, summarize, compare, group and aggregate, rank, explain, and inspect coverage over valid same-basis groups.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Zero or negative gross profit, mismatched populations, cross-currency ratios, fee-incomplete rows presented as complete, credits netted into costs, account/broker selection, causation, advice, or AI Chat execution.

### Default Interpretation

- Divide supported `charge_cost`-only transaction costs by identical-population positive gross profit. Return unavailable, never zero, infinity, or a model estimate, when the denominator is not positive.

### Clarification Conditions

- Ask one direct question only for a different percentage basis or one unresolved scope, currency, date, or filter field.

### Recommended Clarification Wording

- Do you mean fees as a percentage of positive gross profit, or a different basis such as gross P/L or account return?

### Unsupported Conditions

- Non-positive denominator, invalid population/currency contract, missing fee coverage, or an unapproved percentage basis returns `unavailable`.

### Target Analytics Tool or Query Capability

- Current conditional charge and gross-profit primitives with exact math; future named language metric and AI validator/router, with no AI Chat runtime.

### Result Units

- Percentage with exact money numerator and positive gross-profit denominator retained, plus user-facing `exact`, `estimated`, `partially available`, or `unavailable` coverage.

### Fee Handling

- Numerator is supported normalized non-negative `charge_cost` once; `charge_credit` is separately reported and never netted or double-counted.

### Open-Trade Handling

- Open and `needs_decision` rows remain coverage only and never enter the realized gross-profit ratio.

### Sample-Size Considerations

- Return covered/eligible count and positive-gross-profit denominator for every result and group. The percentage is descriptive, not causal advice.

---

## `trades_turned_from_green_to_red_by_fees` Language Registry

### Exact Definition

- Planned count of identical fee-complete `ready_closed` rows where exact gross P/L is greater than zero and exact net P/L is less than zero.

### Formal Wording

- Count eligible closed trades whose exact gross P/L is positive and exact fee-complete net P/L is negative.

### Normal Conversational Wording

- How many winning trades became losers after fees?; show trades fees turned from green to red.

### Trader Slang

- How many green trades went red after fees?; fee-flipped winners.

### Abbreviations

- No standalone abbreviation is accepted. `G2R` is ticker-shaped and does not auto-route.

### Common Misspellings

- Green to red fee trades; trades turned red by fee; winning trades became looser after fees.

### Noisy or Incomplete Input

- Green red fees July; fee flipped winners.

### Singular and Plural Forms

- Trade turned from green to red by fees; trades turned green to red after fees; fee-flipped winner.

### Full Questions

- How many trades had positive gross P/L but negative net P/L last month?; show fee-complete green-to-red transitions for July.

### Commands

- Count trades turned from green to red by fees; rank valid months by green-to-red transition count.

### Sentence Fragments

- Green to red fees; gross winner net loser count.

### Follow-Up Wording

- Now only long trades; compare that count with June.

### Correction Wording

- Use the exact gross-positive/net-negative transition on the same fee-complete closed row, not intraday giveback or all net losses.

### Comparison Wording

- Compare green-to-red trade counts this month with last month; which valid ticker had more transitions?

### Ranking Wording

- Rank valid months by green-to-red transition count; show the highest eligible tickers by count.

### Negated Wording

- Not intraday green-to-red; do not include gross zero, net zero, open trades, or rows that need a decision.

### Exclusion Wording

- Exclude TSLA; leave out trades that need a decision.

### Multi-Filter Wording

- Count green-to-red fee transitions for long NVDA trades in July, excluding rows that need a decision.

### Multi-Part Question Wording

- Show the July count, compare June, and explain the eligible fee-complete trade count.

### Ambiguous Wording

- â€œGreen to redâ€ can mean an intraday price path, day-level result, or gross-to-net outcome. This metric is only the exact same-row gross-positive/net-negative outcome transition; other meanings need one direct clarification.

### Negative Examples

- Find trades that were green intraday then red at close; count every net loser; infer a fee caused the loss.

### Context Requirements

- Server-authorized scope, declared eligible population, exact matching-currency gross/net values, and fee-complete realized rows are required. Account and broker selection are unavailable.

### Required Data

- Exact Category 2 gross P/L and accepted fee-complete net P/L for the same current `ready_closed` row, supported sign policy, conserving allocation, and matching currency.

### Optional Data

- Date range, ticker, directly observed direction, selected trade, and later approved grouping.

### Valid Filters

- Server-enforced scope, date range, ticker, directly observed direction, selected trade, and typed-query eligible-population filters applied to the same fee-complete closed rows.

### Valid Groupings

- Approved closing-date buckets, ticker, and directly observed direction, with qualifying and eligible fee-complete counts shown independently per group.

### Valid Operators

- Calculate, summarize, compare, group and aggregate, rank by explicit count, explain, and inspect coverage.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Intraday/path interpretation, open/decision inclusion, mismatched gross/net populations, cross-currency totals, inferred fees, account/broker selection, causation, advice, or AI Chat execution.

### Default Interpretation

- Count only rows where gross P/L is exactly greater than zero and net P/L is exactly less than zero. Gross zero or net zero never qualifies.

### Clarification Conditions

- Ask one direct question only when â€œgreen to redâ€ means an intraday or different P/L-basis transition, or when one scope/date/filter field is unresolved.

### Recommended Clarification Wording

- Do you mean the exact closed-trade transition from positive gross P/L to negative net P/L, rather than an intraday move?

### Unsupported Conditions

- Missing fee-complete net results, invalid currency/population contract, intraday-path request, or unapproved basis returns `unavailable`.

### Target Analytics Tool or Query Capability

- Planned named transition metric over current gross/net fact primitives and a future AI validator/router; no AI Chat runtime.

### Result Units

- Count of qualifying `ready_closed` rows, with eligible fee-complete count and user-facing `exact`, `estimated`, `partially available`, or `unavailable` coverage.

### Fee Handling

- Net P/L follows accepted `gross - charge_cost + charge_credit` policy once on the same row; costs and credits are never double counted.

### Open-Trade Handling

- Open and `needs_decision` rows remain coverage only; they never enter the transition count.

### Sample-Size Considerations

- Return qualifying and eligible fee-complete counts for every result and group. A small count does not establish fee or broker quality.

---

## `fee_impact_on_expectancy` Language Registry

### Exact Definition

- Unavailable until Category 4 defines the gross and net expectancy formulas: the future result is gross expectancy minus net expectancy over the identical fee-complete `ready_closed` population.

### Formal Wording

- Report the future gross-expectancy-minus-net-expectancy delta for the identical fee-complete closed-trade population.

### Normal Conversational Wording

- What do fees do to my expectancy?; show the difference between gross and net expectancy.

### Trader Slang

- Fee drag on expectancy; how much do fees hit my edge?

### Abbreviations

- No standalone abbreviation is accepted. `EV` without explicit expectancy context remains ambiguous and does not auto-route.

### Common Misspellings

- Fee impact on expectency; fees effect on expectancy; expectancy fee imapct.

### Noisy or Incomplete Input

- Fee expectancy July; EV after fees.

### Singular and Plural Forms

- Fee impact on expectancy; fees impact expectancy; expectancy fee impact.

### Full Questions

- What is the difference between my gross and net expectancy last month?; show fee impact on expectancy for eligible July trades.

### Commands

- Calculate fee impact on expectancy; compare gross-versus-net expectancy impact by month.

### Sentence Fragments

- Fee impact expectancy; EV fee drag.

### Follow-Up Wording

- Now only long trades; compare the prior month.

### Correction Wording

- Use only Category 4's future gross expectancy minus net expectancy on the identical fee-complete population; do not substitute average P/L or total fees.

### Comparison Wording

- Compare the future expectancy delta this month with last month; which valid period had the larger positive delta?

### Ranking Wording

- Rank valid periods by the future gross-minus-net expectancy delta once the Category 4 contract exists.

### Negated Wording

- Not total transaction costs, not a separate Category 5 expectancy formula, and not proof that fees caused future performance.

### Exclusion Wording

- Exclude TSLA; leave out rows that need a decision once the future contract allows the filter.

### Multi-Filter Wording

- Show fee impact on expectancy for long NVDA trades in July, excluding rows that need a decision, once available.

### Multi-Part Question Wording

- Show the future expectancy impact for July, compare June, and explain the identical covered population.

### Ambiguous Wording

- â€œImpactâ€ can mean total cost, expectancy difference, causation, or advice. This record recognizes only the future signed gross-minus-net expectancy delta; another meaning needs one direct clarification.

### Negative Examples

- Estimate expectancy from incomplete fees; use a different gross and net population; tell me whether fees ruined my strategy.

### Context Requirements

- A future Category 4 formula version, server-authorized scope, one currency, identical fee-complete realized population, and its sample rules are required. Account and broker selection are unavailable.

### Required Data

- All future Category 4 gross/net expectancy facts and formula contract, identical fee-complete `ready_closed` population, supported charge coverage, one currency, and Category 4 sample/partial rules.

### Optional Data

- Date range, ticker, directly observed direction, selected trade, and later approved dimensions.

### Valid Filters

- None executable while Category 4 is absent. Any future allowlisted filter must preserve the identical gross/net fee-complete population.

### Valid Groupings

- None executable while Category 4 is absent. Any future grouping must preserve the identical population, one currency, and Category 4 sample policy.

### Valid Operators

- Recognition may return unavailable or clarification. Calculation, comparison, grouping, ranking, and explanation await Category 4.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality` route only to unavailable handling until the dependency exists.

### Incompatible Combinations

- A Category 5-defined expectancy, mismatched populations, cross-currency delta, model-estimated missing fees, account/broker selection, causation, advice, or AI Chat execution.

### Default Interpretation

- Return `unavailable` and name the missing Category 4 expectancy contract; no competing formula or substitute average is permitted.

### Clarification Conditions

- Ask one direct question only if â€œimpactâ€ means something other than the future gross-minus-net expectancy delta, or one future scope/date/filter field is unresolved.

### Recommended Clarification Wording

- Do you mean the future difference between gross and net expectancy on the same fee-complete closed-trade population?

### Unsupported Conditions

- Until Category 4 locks expectancy, every calculation, comparison, grouping, and ranking request returns `unavailable`, never an estimate.

### Target Analytics Tool or Query Capability

- Future Category 4 expectancy metric consumed by a Category 5 delta adapter and future AI validator/router; no current tool or AI Chat runtime.

### Result Units

- Future money per eligible ready-closed round trip in one declared currency, with coverage state and exact signed delta.

### Fee Handling

- Future net expectancy consumes accepted fee-complete net P/L. Charge credits may make the delta negative and are neither removed nor double counted.

### Open-Trade Handling

- Open and `needs_decision` rows remain coverage only and never enter the realized expectancy population.

### Sample-Size Considerations

- A future result must show identical gross/net covered sample count and Category 4 sample policy. The delta is arithmetic, not causal advice.

---

## `fee_impact_by_broker` Language Registry

### Exact Definition

- Unavailable future grouping of the Category 4 gross-expectancy-minus-net-expectancy delta over the identical fee-complete `ready_closed` population by Category 11's stable broker institution identity.

### Formal Wording

- Group the future identical-population gross-minus-net expectancy delta by the stable broker institution identity defined by Category 11.

### Normal Conversational Wording

- How do fees affect my expectancy by broker?; show fee impact for each broker.

### Trader Slang

- Fee drag by broker; which broker hits my edge more?

### Abbreviations

- No broker-code or standalone abbreviation is accepted as a grouping. A broker name requires Category 11 stable-identity resolution; an adapter, import label, or account label does not substitute.

### Common Misspellings

- Fee impact by brocker; broker fee expectency; fees affect expectancy per broker.

### Noisy or Incomplete Input

- Broker fee impact July; fee drag IBKR.

### Singular and Plural Forms

- Fee impact by broker; fee impacts by brokers; broker-level fee impact.

### Full Questions

- Show the future fee impact on expectancy by broker last month; compare the gross-versus-net expectancy delta for each broker institution.

### Commands

- Group fee impact by broker; rank valid broker institutions by future expectancy delta once available.

### Sentence Fragments

- Broker fee impact; fee drag per broker.

### Follow-Up Wording

- Now only long trades; compare the prior month once the future contracts exist.

### Correction Wording

- Group only by Category 11's stable broker institution identity, not by adapter, import source, account, or display label.

### Comparison Wording

- Compare the future fee-impact delta across valid broker institution groups; do not compare unlike currencies.

### Ranking Wording

- Rank valid broker institution groups by the future signed expectancy delta once both owning contracts exist.

### Negated Wording

- Not a broker-quality score, account comparison, import-source comparison, or a causal conclusion.

### Exclusion Wording

- Exclude TSLA; leave out rows that need a decision once future contract filters permit it.

### Multi-Filter Wording

- Show future broker fee impact for long NVDA trades in July, excluding rows that need a decision.

### Multi-Part Question Wording

- Group the future fee impact by broker for July, compare June, rank valid groups, and explain coverage.

### Ambiguous Wording

- â€œBrokerâ€ can mean institution, account, adapter, import source, or statement label. Only the future Category 11 stable broker institution identity is valid; another meaning needs one direct clarification.

### Negative Examples

- Use my import label as broker; group by account ID; infer which broker is best; estimate a missing broker identity.

### Context Requirements

- Future Category 4 expectancy and Category 11 broker-identity contracts, server-authorized scope, one currency per result, identical fee-complete realized population, and group coverage are required. Account selection is unavailable.

### Required Data

- Category 4 gross-minus-net expectancy contract, Category 11 stable source-backed broker institution identity, identical fee-complete `ready_closed` population, authorized scope, currency partition, and group coverage.

### Optional Data

- Date range, ticker, directly observed direction, selected trade, and later approved dimensions that do not redefine broker identity.

### Valid Filters

- None executable until both dependencies exist. Any future allowlisted filter must preserve the Category 4 identical fee-complete population and cannot select an account as a broker surrogate.

### Valid Groupings

- None executable until both dependencies exist. The sole future broker grouping is Category 11 stable broker institution identity, with coverage and currency shown independently per group.

### Valid Operators

- Recognition may return unavailable or clarification. Calculation, grouping, comparison, ranking, and explanation await both Category 4 and Category 11.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`, and `inspect_data_quality` route only to unavailable handling until both dependencies exist.

### Incompatible Combinations

- Adapter/import/account/display-label grouping, inferred broker identity, cross-currency comparison, different gross/net populations, model estimates, broker advice, causation, or AI Chat execution.

### Default Interpretation

- Return `unavailable`, naming the missing Category 4 expectancy-delta and Category 11 stable broker-identity contracts. No alternate fee metric or grouping substitutes.

### Clarification Conditions

- Ask one direct question only when â€œbrokerâ€ means something other than a broker institution, or when one future scope/date/filter field is unresolved.

### Recommended Clarification Wording

- Do you mean a broker institution rather than an account, adapter, or import source? This comparison remains unavailable until the broker-identity and expectancy contracts exist.

### Unsupported Conditions

- Until both contracts exist, all calculation, grouping, comparison, and ranking requests return `unavailable`; labels and IDs are never inferred into broker identity.

### Target Analytics Tool or Query Capability

- Future grouped Category 4 gross-minus-net expectancy-delta query after Category 11 identity is defined, plus a future AI validator/router; no current tool or AI Chat runtime.

### Result Units

- Future grouped money per eligible ready-closed round trip in separate declared currencies, with exact signed delta and group coverage.

### Fee Handling

- Future groups preserve accepted charge-cost/credit and no-double-counting treatment within each identical fee-complete group.

### Open-Trade Handling

- Open and `needs_decision` rows remain coverage only and never enter realized broker-grouped fee impact.

### Sample-Size Considerations

- A future result must show covered/eligible count for every broker institution group and avoid broad rankings or conclusions from insufficient groups.

---

## `fee_completeness` Language Registry

### Exact Definition

- Supported fee-specific coverage state for a declared population: user-facing `exact`, `estimated`, `partially available`, or `unavailable`, based on supported fee facts, matching fee/trade currency, sign policy, and conserving allocation.

### Formal Wording

- Report fee coverage state and covered/eligible counts for the selected declared population.

### Normal Conversational Wording

- Are my fee numbers complete?; how much of this result has fee data?

### Trader Slang

- Do I have all the fee data?; fee coverage check.

### Abbreviations

- `fee coverage` is accepted wording. Bare `FC` is ticker-shaped and does not auto-route.

### Common Misspellings

- Fee completness; fee compelte; fees coverage.

### Noisy or Incomplete Input

- Fee complete July; fee data all there.

### Singular and Plural Forms

- Fee completeness; fee coverage; complete fee data; fees complete.

### Full Questions

- Is my fee data complete for July?; show fee completeness by eligible week and explain missing coverage.

### Commands

- Check fee completeness; group fee coverage by valid month; rank valid periods by coverage state and count.

### Sentence Fragments

- Fee coverage July; fees complete?

### Follow-Up Wording

- Now only NVDA; show why the excluded rows are not covered.

### Correction Wording

- Report fee-specific coverage, not generic import completeness or a money amount; do not call missing fees zero.

### Comparison Wording

- Compare fee coverage this month with last month; which valid ticker has the larger covered/eligible count?

### Ranking Wording

- Rank valid periods by fee-coverage state, then covered/eligible count; do not rank estimated evidence as complete.

### Negated Wording

- Not a guarantee that every Journal fact is complete; do not treat unsupported or missing fees as zero.

### Exclusion Wording

- Exclude TSLA; leave out rows that need a decision from the realized fee-effect result while still reporting them in coverage.

### Multi-Filter Wording

- Show fee completeness for long NVDA trades in July, excluding rows that need a decision from the realized population.

### Multi-Part Question Wording

- Show July fee coverage, compare June, group by ticker, and explain every partial or unavailable reason.

### Ambiguous Wording

- â€œCompleteâ€ can mean all Journal data, every account, an import, or a fee result. This metric means fee-specific evidence coverage for the declared server-authorized population only; another meaning needs one direct clarification.

### Negative Examples

- Assume missing fees are zero; say my whole account is complete; model-fill missing fees; expose source identifiers.

### Context Requirements

- Server-authorized scope, declared population/currency, current execution/allocation graph, source-supported fee evidence, and privacy-safe coverage reasons are required. Account and broker selection are unavailable.

### Required Data

- Fee fact presence, source sign-policy support, fee-currency agreement, allocation-conservation result, current accepted execution/allocation graph, and coverage reason counts for the declared population.

### Optional Data

- Date range, ticker, directly observed direction, selected trade, and approved privacy-safe grouping or provenance detail.

### Valid Filters

- Server-enforced scope, date range, ticker, directly observed direction, selected trade, and typed-query allowlisted population filters.

### Valid Groupings

- Approved closing-date buckets, ticker, and directly observed direction when each group reports its own categorical state, counts, reasons, and separate currency context rather than a combined money total.

### Valid Operators

- Inspect coverage, calculate or summarize coverage, compare, group and aggregate, rank by explicit coverage/count rule, explain, and unavailable handling.

### Compatible Intents

- `inspect_data_quality`, `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Model-estimated fees, missing fees treated as zero, private source exposure, cross-account inference, account/broker selection, generic-data-completeness claim, causation, advice, or AI Chat execution.

### Default Interpretation

- Return exactly `exact`, `estimated`, `partially available`, or `unavailable`, with covered/eligible counts and factual reasons. `estimated` is allowed only for explicit source-evidenced estimates, never model output.

### Clarification Conditions

- Ask one direct question only if â€œcompleteâ€ means something beyond fee coverage, or one population, date, currency, or filter field is unresolved.

### Recommended Clarification Wording

- Do you mean fee-data coverage for this declared result, rather than general import or account completeness?

### Unsupported Conditions

- Missing/unsupported fee facts, invalid scope, privacy-unsafe detail, or no valid state result returns `unavailable`; no model or user-invented completion is permitted.

### Target Analytics Tool or Query Capability

- Current Journal Analytics Fact Set coverage path and result contract, with a future AI coverage-language validator/router; no AI Chat runtime.

### Result Units

- Categorical `exact`, `estimated`, `partially available`, or `unavailable` state with covered/eligible counts and factual reasons; no money unit.

### Fee Handling

- Preserve original sign/kind evidence. `complete` requires supported fee facts, matching currency, supported sign policy, and conserving allocation; credits remain distinct from costs.

### Open-Trade Handling

- Open and `needs_decision` rows remain visible as coverage populations and are never silently presented as realized fee-effect rows.

### Sample-Size Considerations

- Always return covered/eligible counts for every result and group. A complete small sample does not establish broad performance or broker conclusions.

---

# 7. Evaluation Cases Deliverable

## 7.1 Evaluation Case Schema

Every object uses the locked Category 1 and Category 2/3 exact 21-key schema
and key order. All arrays passed independent review as Version 1 evaluation
evidence; approval and locking do not claim an AI Chat runtime.

## 7.2 Required Case Types

Each saved array contains the required ordered case types: canonical, formal
paraphrase, conversational paraphrase, trader slang, abbreviation, misspelling,
noisy input, command, fragment, follow-up, correction, comparison, ranking,
negation, exclusion, multi-filter, multi-part, ambiguity, negative example,
unsupported data, selected entity, and cross-category.

## 7.3 Batch Coverage Summary

| Case Type | Required | Saved | Passed | Notes |
|---|---:|---:|---:|---|
| Each required ordered type | 10 | 10 | 10 | Arrays 1-10 passed independent review. |
| Clarification expected | 10 | 10 | 10 | One focused ambiguity case per array passed. |
| Unsupported expected | 94 | 94 | 94 | Includes unavailable capabilities, unsupported data, and unsupported requests. |
| Cross-category | 10 | 10 | 10 | One ordered cross-category case per array passed. |

## 7.4 Structured Evaluation Arrays

### total_commissions

```json
[{"caseId":"C5-E1-01","caseType":"canonical","input":"Show my total commissions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-02","caseType":"formal_paraphrase","input":"Calculate the total normalized commission cost for the July eligible population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-03","caseType":"conversational_paraphrase","input":"How much did I pay in commissions in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-04","caseType":"trader_slang","input":"What was my commission bill for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-05","caseType":"abbreviation","input":"COM total commissions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit commission metric grammar","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-06","caseType":"misspelling","input":"Show my commisions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-07","caseType":"noisy_input","input":"commissions July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-08","caseType":"command","input":"Calculate commissions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-09","caseType":"fragment","input":"Commission total, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-10","caseType":"follow_up","input":"What about commissions for the prior month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-11","caseType":"correction","input":"I meant commissions, not all transaction costs.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-12","caseType":"comparison","input":"Compare my July and June commissions.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"commission total"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authoritative account scope","separate same-currency populations","coverage for each population"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-13","caseType":"ranking","input":"Rank July tickers by commissions.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum","supported normalized charge_cost","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency per result","covered and eligible counts per ticker"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-14","caseType":"negation","input":"Show commissions, not all transaction costs, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July","exclude other fee basis"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-15","caseType":"exclusion","input":"Show July commissions excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-16","caseType":"multi_filter","input":"Show commissions for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-17","caseType":"multi_part","input":"Show commissions for July and the coverage counts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","covered and eligible counts","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-18","caseType":"ambiguous","input":"What were my fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["one candidate concept must be fixed before calculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean all supported transaction costs, commissions only, or regulatory fees only?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-19","caseType":"negative_example","input":"Which broker should I use to lower commissions?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no broker selection","no recommendation or causation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Broker selection, predictions, recommendations, and causal claims are unsupported; no fee result can recommend a broker.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-20","caseType":"unsupported_data","input":"Show commissions by treating unlabeled fee amounts as commission.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["supported source/adapter kind provenance","no label or amount inference"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-21","caseType":"selected_entity_context","input":"For the selected review period, show commissions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","selected review period"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","server-authoritative account scope","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A commission-only total is unavailable because no supported source/adapter commission-kind component exists; commission cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E1-22","caseType":"cross_category","input":"Explain the documented commission coverage difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["total_commissions"],"expectedFilters":["eligible ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"commission total"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","server-authoritative account scope","one currency per result"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."}]
```

### total_regulatory_fees

```json
[{"caseId":"C5-E2-01","caseType":"canonical","input":"Show my total regulatory fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-02","caseType":"formal_paraphrase","input":"Calculate the normalized regulatory-fee cost for the July eligible population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-03","caseType":"conversational_paraphrase","input":"How much did I pay in regulatory fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-04","caseType":"trader_slang","input":"What was my SEC-type fee bill for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-05","caseType":"abbreviation","input":"REG total regulatory fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit regulatory-fee metric grammar","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-06","caseType":"misspelling","input":"Show my regulatry fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-07","caseType":"noisy_input","input":"reg fees July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-08","caseType":"command","input":"Calculate regulatory fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-09","caseType":"fragment","input":"Regulatory fees, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-10","caseType":"follow_up","input":"What about regulatory fees for the prior month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-11","caseType":"correction","input":"I meant regulatory fees, not commissions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-12","caseType":"comparison","input":"Compare my July and June regulatory fees.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"regulatory-fee total"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authoritative account scope","separate same-currency populations","coverage for each population"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-13","caseType":"ranking","input":"Rank July tickers by regulatory fees.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum","supported normalized charge_cost","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency per result","covered and eligible counts per ticker"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-14","caseType":"negation","input":"Show regulatory fees, not commissions, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July","exclude other fee basis"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-15","caseType":"exclusion","input":"Show July regulatory fees excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-16","caseType":"multi_filter","input":"Show regulatory fees for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-17","caseType":"multi_part","input":"Show regulatory fees for July and the coverage counts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","covered and eligible counts","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-18","caseType":"ambiguous","input":"What were my fee charges in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["one candidate concept must be fixed before calculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean all supported transaction costs, commissions only, or regulatory fees only?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-19","caseType":"negative_example","input":"Which broker should I use to reduce regulatory fees?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no broker selection","no recommendation or causation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Broker selection, predictions, recommendations, and causal claims are unsupported; no fee result can recommend a broker.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-20","caseType":"unsupported_data","input":"Show regulatory fees by inferring them from statement labels.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["supported source/adapter kind provenance","no label or amount inference"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-21","caseType":"selected_entity_context","input":"For the selected review period, show regulatory fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","selected review period"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","server-authoritative account scope","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A regulatory-fee total is unavailable because no supported source/adapter regulatory-kind component exists; regulatory fees cannot be inferred from labels or amounts.","notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."},{"caseId":"C5-E2-22","caseType":"cross_category","input":"Explain the documented regulatory-fee coverage difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["total_regulatory_fees"],"expectedFilters":["eligible ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"regulatory-fee total"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","server-authoritative account scope","one currency per result"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the requested kind-specific metric but return its exact unavailable reason; never infer a kind from labels or amounts, substitute another fee metric, net credits, or include open/decision rows in realized results."}]
```

### total_transaction_costs

```json
[{"caseId":"C5-E3-01","caseType":"canonical","input":"Show my total transaction costs for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-02","caseType":"formal_paraphrase","input":"Calculate the sum of supported normalized transaction charge costs for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-03","caseType":"conversational_paraphrase","input":"How much did my trades cost in fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-04","caseType":"trader_slang","input":"What was my fee drag for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-05","caseType":"abbreviation","input":"TTC total transaction costs for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit transaction-cost metric grammar","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-06","caseType":"misspelling","input":"Show my transation costs for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-07","caseType":"noisy_input","input":"ttc July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-08","caseType":"command","input":"Calculate transaction costs for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-09","caseType":"fragment","input":"Transaction costs, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-10","caseType":"follow_up","input":"What about transaction costs for the prior month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-11","caseType":"correction","input":"I meant all transaction costs, not commissions only.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-12","caseType":"comparison","input":"Compare my July and June transaction costs.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"transaction-cost total"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authoritative account scope","separate same-currency populations","coverage for each population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-13","caseType":"ranking","input":"Rank July tickers by transaction costs.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum","supported normalized charge_cost","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency per result","covered and eligible counts per ticker"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-14","caseType":"negation","input":"Show transaction costs, not commissions only, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July","exclude other fee basis"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-15","caseType":"exclusion","input":"Show July transaction costs excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-16","caseType":"multi_filter","input":"Show transaction costs for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","equals"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one declared currency"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-17","caseType":"multi_part","input":"Show transaction costs for July and the coverage counts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","covered and eligible counts","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-18","caseType":"ambiguous","input":"Show my fees for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["one candidate concept must be fixed before calculation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean all supported transaction costs, commissions only, or regulatory fees only?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-19","caseType":"negative_example","input":"Which broker should I use because its fees will be lower?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no broker selection","no recommendation or causation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Broker selection, predictions, recommendations, and causal claims are unsupported; no fee result can recommend a broker.","notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-20","caseType":"unsupported_data","input":"Show one total by adding my USD and CAD transaction costs.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","USD","CAD"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one declared currency per money result","cross-currency totals are not permitted"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Transaction costs cannot be summed across currencies; return separate currency partitions with their coverage.","notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-21","caseType":"selected_entity_context","input":"For the selected review period, show transaction costs.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","selected review period"],"expectedGroupings":[],"expectedOperators":["sum","supported normalized charge_cost"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","server-authoritative account scope","one declared currency","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."},{"caseId":"C5-E3-22","caseType":"cross_category","input":"Explain the documented transaction-cost difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["total_transaction_costs"],"expectedFilters":["eligible ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"transaction-cost total"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","server-authoritative account scope","one currency per result"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the declared same-population currency partition; charge_credit remains separate, and coverage labels may be complete, partial, estimated only when source-evidenced, or unavailable."}]
```


---

+
### fees_per_trade

```json
[{"caseId":"C5-E4-01","caseType":"canonical","input":"Show my fees per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-02","caseType":"formal_paraphrase","input":"Calculate transaction costs divided by eligible closed round trips for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-03","caseType":"conversational_paraphrase","input":"What did fees cost me per trade in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-04","caseType":"trader_slang","input":"What was my fee hit per trade in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-05","caseType":"abbreviation","input":"FPT fees per closed trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit fees-per-closed-trade metric grammar","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"FPT is accepted only with explicit fees-per-closed-trade grammar; use the identical eligible fee-covered ready_closed population, keep charge_credit separate, and retain explicit coverage."},{"caseId":"C5-E4-06","caseType":"misspelling","input":"Show my fees per trad for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-07","caseType":"noisy_input","input":"fee per trade July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-08","caseType":"command","input":"Calculate fees per trade for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-09","caseType":"fragment","input":"Fees per trade, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-10","caseType":"follow_up","input":"What about fees per trade for the prior month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-11","caseType":"correction","input":"I meant per closed round trip, not per execution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","prior requested population"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior context","expectedContextRequirements":["trusted prior query","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-12","caseType":"comparison","input":"Compare fees per trade in July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"fees per trade"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained","same account scope and separate same-currency populations","coverage for each population"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-13","caseType":"ranking","input":"Rank July tickers by fees per trade.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July"],"expectedGroupings":["ticker"],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count","group by ticker","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained","covered and eligible counts per ticker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-14","caseType":"negation","input":"Show fees per trade, not fees per execution, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","exclude alternate denominator or metric"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-15","caseType":"exclusion","input":"Show fees per trade for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-16","caseType":"multi_filter","input":"Show fees per trade for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count","filter"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-17","caseType":"multi_part","input":"Show fees per trade for July, compare June, and explain the denominator.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["compare_groups","explain_result"],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count","period comparison","explain exact denominator"],"expectedComparison":{"left":"July","right":"June","basis":"fees per trade"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained","coverage for each population"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-18","caseType":"ambiguous","input":"Show my average fees in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one unresolved metric or denominator field"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean fees per eligible closed round trip or fees per execution?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-19","caseType":"negative_example","input":"Which fee-per-trade result proves I should trade less?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency"],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no recommendation, advice, prediction, or causation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Recommendations, trading advice, predictions, and causal claims are unsupported; this descriptive fee metric cannot prove an action or outcome.","notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-20","caseType":"unsupported_data","input":"Show fees per trade when there are no eligible closed round trips.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","zero eligible ready_closed round trips"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained","known nonzero eligible ready_closed round-trip count"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fees per trade is unavailable because the identical eligible ready_closed round-trip count is zero or unavailable; do not substitute executions, open rows, or an estimate.","notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-21","caseType":"selected_entity_context","input":"For the selected closed-trade group, show fees per trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","trusted selected closed-trade group"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count"],"expectedComparison":null,"expectedTimeRange":"selected closed-trade group","expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E4-22","caseType":"cross_category","input":"Explain the documented fees-per-trade difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["fees_per_trade"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","count identical eligible ready_closed round trips","divide cost by round-trip count","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"fees per trade"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","known nonzero eligible ready_closed round-trip count","open and needs_decision coverage retained","comparison evidence","no causation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."}]
```

### fees_per_share

```json
[{"caseId":"C5-E5-01","caseType":"canonical","input":"Show my fees per entered share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-02","caseType":"formal_paraphrase","input":"Calculate transaction costs divided by total entered shares for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-03","caseType":"conversational_paraphrase","input":"What did I pay in fees per share in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-04","caseType":"trader_slang","input":"What was my cents-per-share fee in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-05","caseType":"abbreviation","input":"FPS fees per entered share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit fees-per-entered-share metric grammar","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"FPS is accepted only with explicit fees-per-entered-share grammar; use opening, adding, and flip_opening quantities in the identical eligible population, keep charge_credit separate, and retain explicit coverage."},{"caseId":"C5-E5-06","caseType":"misspelling","input":"Show my fees per shre for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-07","caseType":"noisy_input","input":"fee share July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-08","caseType":"command","input":"Calculate fees per share for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-09","caseType":"fragment","input":"Fees per share, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-10","caseType":"follow_up","input":"What about fees per share for the prior month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["trusted prior query","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-11","caseType":"correction","input":"Use entered shares, not exit shares or contracts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-12","caseType":"comparison","input":"Compare fees per share in July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"fees per entered share"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained","same account scope and separate same-currency populations","coverage for each population"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-13","caseType":"ranking","input":"Rank July tickers by fees per share.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":["ticker"],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares","group by ticker","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained","covered and eligible counts per ticker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-14","caseType":"negation","input":"Show fees per share, not profit per share, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only","exclude alternate denominator or metric"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-15","caseType":"exclusion","input":"Show fees per share for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-16","caseType":"multi_filter","input":"Show fees per share for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares","filter"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-17","caseType":"multi_part","input":"Show fees per share for July, compare June, and explain entered shares.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["compare_groups","explain_result"],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares","period comparison","explain exact denominator"],"expectedComparison":{"left":"July","right":"June","basis":"fees per entered share"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained","coverage for each population"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-18","caseType":"ambiguous","input":"Show my FPS for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one unresolved metric or denominator field"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean fees per entered share or a different unit such as per contract?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-19","caseType":"negative_example","input":"Which per-share fee means I should avoid a ticker?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","entered shares from opening, adding, and flip_opening only"],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no recommendation, advice, prediction, or causation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Recommendations, trading advice, predictions, and causal claims are unsupported; this descriptive fee metric cannot prove an action or outcome.","notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-20","caseType":"unsupported_data","input":"Show fees per share when entered-share quantity is unknown.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","entered shares from opening, adding, and flip_opening only","unknown entered-share quantity"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained","known nonzero entered-share total from opening, adding, and flip_opening"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fees per share is unavailable because the identical-population entered-share denominator is zero or unknown; do not use exit shares, maximum exposure, per-100-share scaling, contracts, or an estimate.","notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-21","caseType":"selected_entity_context","input":"For the selected closed-trade group, show fees per share.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","trusted selected closed-trade group"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E5-22","caseType":"cross_category","input":"Explain the documented fees-per-share difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["fees_per_share"],"expectedFilters":["identical eligible fee-covered ready_closed round trips","one declared currency","July","entered shares from opening, adding, and flip_opening only","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum opening, adding, and flip_opening entered shares","divide cost by total entered shares","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"fees per entered share"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","exact allocation conservation","known nonzero entered-share denominator","open and needs_decision coverage retained","comparison evidence","no causation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."}]
```

### fees_as_percentage_of_gross_profit

```json
[{"caseId":"C5-E6-01","caseType":"canonical","input":"Show fees as a percentage of gross profit for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-02","caseType":"formal_paraphrase","input":"Calculate transaction costs as a percentage of positive gross profit for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-03","caseType":"conversational_paraphrase","input":"How much of my gross profit went to fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-04","caseType":"trader_slang","input":"How much did fees eat from my gross in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-05","caseType":"abbreviation","input":"Fee % of gross profit for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-06","caseType":"misspelling","input":"Show fees as a percent of gross profitt for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-07","caseType":"noisy_input","input":"fee % gross July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-08","caseType":"command","input":"Calculate fees as a percentage of gross profit for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-09","caseType":"fragment","input":"Fees percent gross profit, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-10","caseType":"follow_up","input":"What about the fee percentage of gross profit for the prior month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["trusted prior query","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-11","caseType":"correction","input":"Use positive gross profit, not net P/L or gross loss.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-12","caseType":"comparison","input":"Compare fee percentage of gross profit in July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"fees as a percentage of gross profit"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained","same account scope and separate same-currency populations","coverage for each population"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-13","caseType":"ranking","input":"Rank July tickers by fees as a percentage of gross profit.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit"],"expectedGroupings":["ticker"],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100","group by ticker","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained","covered and eligible counts per ticker"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-14","caseType":"negation","input":"Show fees as a percentage of gross profit, not gross P/L, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit","exclude alternate denominator or metric"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-15","caseType":"exclusion","input":"Show the fee percentage of gross profit for July excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit","exclude AMD"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-16","caseType":"multi_filter","input":"Show the fee percentage of gross profit for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100","filter"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-17","caseType":"multi_part","input":"Show the July fee percentage of gross profit, compare June, and explain the denominator.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["compare_groups","explain_result"],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100","period comparison","explain exact denominator"],"expectedComparison":{"left":"July","right":"June","basis":"fees as a percentage of gross profit"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained","coverage for each population"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-18","caseType":"ambiguous","input":"Show my fee percentage for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one unresolved metric or denominator field"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean fees as a percentage of positive gross profit, or a different basis such as gross P/L or account return?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-19","caseType":"negative_example","input":"Which fee percentage proves a setup will lose money?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","strictly positive gross profit"],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no recommendation, advice, prediction, or causation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Recommendations, trading advice, predictions, and causal claims are unsupported; this descriptive fee metric cannot prove an action or outcome.","notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-20","caseType":"unsupported_data","input":"Show the fee percentage when gross profit is zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","strictly positive gross profit","zero gross profit"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained","known nonzero positive gross profit"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fees as a percentage of gross profit is unavailable because the identical-population gross-profit denominator is zero or negative; never use gross P/L, gross loss, net P/L, infinity, or an estimate.","notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-21","caseType":"selected_entity_context","input":"For the selected closed-trade group, show fees as a percentage of gross profit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","trusted selected closed-trade group"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."},{"caseId":"C5-E6-22","caseType":"cross_category","input":"Explain the documented gross-profit fee-percentage difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["fees_as_percentage_of_gross_profit"],"expectedFilters":["identical fee-complete ready_closed population","one declared currency","July","strictly positive gross profit","June"],"expectedGroupings":[],"expectedOperators":["sum supported normalized charge_cost","sum identical-population positive gross profit","divide cost by positive gross profit","multiply by 100","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"fees as a percentage of gross profit"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","identical numerator and denominator population","complete supported fee coverage","strictly positive gross-profit denominator","open and needs_decision coverage retained","comparison evidence","no causation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use supported non-negative charge_cost once in the identical eligible population and declared currency; charge_credit remains separate and is never netted or double-counted. Return covered and eligible counts with complete, partial, estimated only when source-evidenced, or unavailable coverage."}]
```


### trades_turned_from_green_to_red_by_fees

```json
[{"caseId":"C5-E7-01","caseType":"canonical","input":"Show trades turned from green to red by fees in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-02","caseType":"formal_paraphrase","input":"Calculate fee-complete closed trades with gross P/L above zero and net P/L below zero for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-03","caseType":"conversational_paraphrase","input":"How many trades were green before fees but red after fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-04","caseType":"trader_slang","input":"How many green trades did fees turn red in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-05","caseType":"abbreviation","input":"Show G2R fee flips for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-06","caseType":"misspelling","input":"Show green-to-red fee transitions for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-07","caseType":"noisy_input","input":"green to red from fees July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-08","caseType":"command","input":"Calculate July green-to-red fee transitions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-09","caseType":"fragment","input":"July fee green-to-red trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-10","caseType":"follow_up","input":"What about green-to-red fee transitions for the prior month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice","trusted prior query"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-11","caseType":"correction","input":"Use gross-positive and net-negative same-row transitions, not green-to-flat rows.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice","trusted prior date context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-12","caseType":"comparison","input":"Compare July and June green-to-red fee-transition counts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"trades_turned_from_green_to_red_by_fees"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-13","caseType":"ranking","input":"Rank July tickers by green-to-red fee-transition count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":["ticker"],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows","group by ticker","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-14","caseType":"negation","input":"Show green-to-red fee transitions, not all net losses, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","exclude alternate basis"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-15","caseType":"exclusion","input":"Show July green-to-red fee transitions excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-16","caseType":"multi_filter","input":"Show green-to-red fee transitions for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows","filter"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-17","caseType":"multi_part","input":"Show July green-to-red fee-transition counts, compare June, and explain the exact rule.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["compare_groups","explain_result"],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows","period comparison","explain exact basis"],"expectedComparison":{"left":"July","right":"June","basis":"trades_turned_from_green_to_red_by_fees"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-18","caseType":"ambiguous","input":"Show trades fees turned red in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one unresolved formula or basis field"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean closed trades with gross P/L above zero and net P/L below zero on the same row, rather than a day or intraday path?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-19","caseType":"negative_example","input":"Which setup should I avoid because fees turn green trades red?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no recommendation, advice, prediction, causation, broker blame, or broker selection"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Recommendations, trading advice, predictions, causal claims, broker blame, and broker or strategy selection are unsupported; this descriptive metric cannot prescribe an action.","notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-20","caseType":"unsupported_data","input":"Count intraday green-to-red paths even when final net P/L is positive.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["final same-row gross and net P/L facts only","no intraday path inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"This metric is unavailable for an intraday-path request; it counts only fee-complete ready_closed rows with gross P/L above zero and net P/L below zero, never a path or causation.","notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-21","caseType":"selected_entity_context","input":"For the selected closed-trade group, show green-to-red fee transitions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","trusted selected closed-trade group"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."},{"caseId":"C5-E7-22","caseType":"cross_category","input":"Explain the documented July-versus-June green-to-red fee-transition difference.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["trades_turned_from_green_to_red_by_fees"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["select same rows with gross P/L greater than zero","select same rows with net P/L less than zero","count transition rows","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"trades_turned_from_green_to_red_by_fees"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","same-row gross-positive and net-negative outcome facts","no intraday path, causation, broker blame, or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only same fee-complete ready_closed rows with gross P/L above zero and net P/L below zero. Never infer a day or intraday path, causation, broker blame, or advice. Keep charge_credit separate and never double count; report partial coverage explicitly."}]
```

### fee_impact_on_expectancy

```json
[{"caseId":"C5-E8-01","caseType":"canonical","input":"Show fee impact on expectancy for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-02","caseType":"formal_paraphrase","input":"Calculate the proposed gross-expectancy minus net-expectancy delta for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-03","caseType":"conversational_paraphrase","input":"How much do fees change my expectancy in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-04","caseType":"trader_slang","input":"How much do fees hit my expectancy in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-05","caseType":"abbreviation","input":"Fee exp delta for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-06","caseType":"misspelling","input":"Show fee impact on expectency for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-07","caseType":"noisy_input","input":"fee expectancy impact July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-08","caseType":"command","input":"Calculate the fee impact on expectancy for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-09","caseType":"fragment","input":"Fee impact on expectancy, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-10","caseType":"follow_up","input":"What about the fee impact on expectancy for the prior month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value","trusted prior query"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-11","caseType":"correction","input":"Use gross expectancy minus net expectancy on the same fee-complete population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value","trusted prior date context"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-12","caseType":"comparison","input":"Compare fee impact on expectancy in July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"fee_impact_on_expectancy"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-13","caseType":"ranking","input":"Rank July tickers by fee impact on expectancy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":["ticker"],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy","group by ticker","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-14","caseType":"negation","input":"Show fee impact on expectancy, not gross expectancy alone, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","exclude alternate basis"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-15","caseType":"exclusion","input":"Show July fee impact on expectancy excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-16","caseType":"multi_filter","input":"Show fee impact on expectancy for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy","filter"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-17","caseType":"multi_part","input":"Show July fee impact on expectancy, compare June, and explain the formula.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["compare_groups","explain_result"],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy","period comparison","explain exact basis"],"expectedComparison":{"left":"July","right":"June","basis":"fee_impact_on_expectancy"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-18","caseType":"ambiguous","input":"Show my expectancy impact for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one unresolved formula or basis field"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the future same-population gross-expectancy minus net-expectancy delta, once Category 4 locks that formula and basis?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-19","caseType":"negative_example","input":"Which strategy should I trade because fees improve its expectancy?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no recommendation, advice, prediction, causation, broker blame, or broker selection"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Recommendations, trading advice, predictions, causal claims, broker blame, and broker or strategy selection are unsupported; this descriptive metric cannot prescribe an action.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-20","caseType":"unsupported_data","input":"Calculate a fee-impact expectancy delta before Category 4 defines expectancy.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["Category 4 locked expectancy contract required","no independent calculation, estimate, or invention"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy cannot be calculated before Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-21","caseType":"selected_entity_context","input":"For the selected closed-trade group, show fee impact on expectancy.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","trusted selected closed-trade group"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."},{"caseId":"C5-E8-22","caseType":"cross_category","input":"Explain the documented fee-impact expectancy difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["fee_impact_on_expectancy"],"expectedFilters":["same fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["proposed future gross expectancy minus net expectancy","identical fee-complete population","interpret positive as reduced expectancy and negative as credits improved expectancy","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"fee_impact_on_expectancy"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current accepted execution/allocation graph","one declared currency","open and needs_decision coverage retained","partial coverage explicit","Category 4 locked expectancy definition, formula, and selected P/L basis","identical fee-complete population","no independent calculation or invented value"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact on expectancy is unavailable until Category 4 locks the expectancy definition, formula, selected P/L basis, and identical-population contract; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy. The future relationship is signed gross expectancy minus net expectancy on the identical fee-complete population: positive means fees reduced expectancy; negative means credits improved it. Keep credits separate and never double count."}]
```


### fee_impact_by_broker

```json
[{"caseId":"C5-E9-01","caseType":"canonical","input":"Show fee impact by broker for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-02","caseType":"formal_paraphrase","input":"Calculate the future fee-impact expectancy delta by broker for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-03","caseType":"conversational_paraphrase","input":"How do fees affect expectancy at each broker in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-04","caseType":"trader_slang","input":"Which broker got hit hardest by fees in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-05","caseType":"abbreviation","input":"FIB broker view for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-06","caseType":"misspelling","input":"Show fee impact by brokr for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-07","caseType":"noisy_input","input":"broker fee impact July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-08","caseType":"command","input":"Calculate fee impact by broker for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-09","caseType":"fragment","input":"Fee impact per broker, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-10","caseType":"follow_up","input":"What about fee impact by broker for the prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values","trusted prior date context"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-11","caseType":"correction","input":"Keep the prior period but use broker institution, not account labels.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values","trusted prior date context"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-12","caseType":"comparison","input":"Compare July and June fee impact by broker.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"fee_impact_by_broker"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-13","caseType":"ranking","input":"Rank broker institutions by July fee impact.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":["stable broker institution identity"],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population","group and rank only when capability and populations exist","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-14","caseType":"negation","input":"Show fee impact by broker, not by import source, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","exclude alternate basis"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-15","caseType":"exclusion","input":"Show July fee impact by broker excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-16","caseType":"multi_filter","input":"Show fee impact by broker for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population","filter"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-17","caseType":"multi_part","input":"Show July fee impact by broker, compare June, and explain the future basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["compare_groups","explain_result"],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population","period comparison","explain exact basis"],"expectedComparison":{"left":"July","right":"June","basis":"fee_impact_by_broker"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-18","caseType":"ambiguous","input":"Show my broker fee impact for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one unresolved field"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the future fee-impact expectancy delta grouped by a stable broker institution, once Categories 4 and 11 lock those contracts?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-19","caseType":"negative_example","input":"Which broker should I use because fees improve expectancy?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no broker selection, blame, advice, prediction, or causation"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Broker or strategy selection, broker blame, trading advice, predictions, and causal claims are unsupported; this descriptive metric cannot prescribe an action.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-20","caseType":"unsupported_data","input":"Treat my import source or account label as the broker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["Category 4 expectancy contract and Category 11 stable source-backed broker institution identity required","no account label, source, or import provenance treated as broker"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not substitute an account label, source, or import provenance.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-21","caseType":"selected_entity_context","input":"For the selected closed-trade group, show fee impact by broker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","trusted selected closed-trade group"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."},{"caseId":"C5-E9-22","caseType":"cross_category","input":"Explain the documented fee-impact-by-broker difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["fee_impact_by_broker"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["future gross expectancy minus net expectancy","stable broker institution grouping","identical fee-complete population","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"fee_impact_by_broker"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one declared currency","Category 4 locked expectancy definition and identical-population basis","Category 11 stable source-backed broker institution identity","no account label, source, or import provenance as broker","no invented values"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee impact by broker is unavailable until Category 4 locks expectancy and Category 11 defines a stable source-backed broker institution identity; do not calculate, estimate, or invent it independently.","notes":"Unavailable until Category 4 locks expectancy and Category 11 defines stable source-backed broker institution identity. Never treat account labels, sources, or imports as brokers; never invent a value or make broker-selection, blame, causal, or advice claims."}]
```

### fee_completeness

```json
[{"caseId":"C5-E10-01","caseType":"canonical","input":"Show fee completeness for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-02","caseType":"formal_paraphrase","input":"Classify July fee coverage for the declared population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-03","caseType":"conversational_paraphrase","input":"Is my July fee data exact, partially available, estimated, or unavailable?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-04","caseType":"trader_slang","input":"Are my July fees fully covered?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-05","caseType":"abbreviation","input":"Fee cov for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-06","caseType":"misspelling","input":"Show fee completenss for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-07","caseType":"noisy_input","input":"fee coverage July pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-08","caseType":"command","input":"Classify fee completeness for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-09","caseType":"fragment","input":"Fee data state, July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-10","caseType":"follow_up","input":"What about fee completeness for the prior period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made","trusted prior date context"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-11","caseType":"correction","input":"Keep the prior period and show display states, not an amount.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","prior date range"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons","metric correction"],"expectedComparison":null,"expectedTimeRange":"prior request","expectedSelectedEntity":"trusted prior date context","expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made","trusted prior date context"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-12","caseType":"comparison","input":"Compare July and June fee completeness.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"fee_completeness"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-13","caseType":"ranking","input":"Rank valid periods by fee completeness and covered count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July"],"expectedGroupings":["valid period"],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons","group and rank only when capability and populations exist","descending","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-14","caseType":"negation","input":"Show fee completeness, not transaction-cost totals, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","exclude alternate basis"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-15","caseType":"exclusion","input":"Show July fee completeness excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-16","caseType":"multi_filter","input":"Show fee completeness for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","directly observed long direction","NVDA"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons","filter"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","directly observed Journal direction","server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-17","caseType":"multi_part","input":"Show July fee completeness, compare June, and explain the coverage reasons.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["compare_groups","explain_result"],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons","period comparison","explain exact basis"],"expectedComparison":{"left":"July","right":"June","basis":"fee_completeness"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-18","caseType":"ambiguous","input":"Check my fee data.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one unresolved field"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean fee completeness for the declared closed-trade population, or a different coverage scope?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-19","caseType":"negative_example","input":"Which coverage state means I should place a trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no broker selection, blame, advice, prediction, or causation"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Broker or strategy selection, broker blame, trading advice, predictions, and causal claims are unsupported; this descriptive metric cannot prescribe an action.","notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-20","caseType":"unsupported_data","input":"Mark missing fee data as estimated without source evidence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["supported fee facts, currency, sign-policy, and allocation evidence required","no model estimate or invented coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee completeness is unavailable when the declared population lacks supported fee facts, matching currency, supported sign policy, or conserving allocation; never model-estimate or invent coverage.","notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-21","caseType":"selected_entity_context","input":"For the selected closed-trade group, show fee completeness.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","trusted selected closed-trade group"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected closed-trade group from prior context","expectedContextRequirements":["trusted selected entity context","server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."},{"caseId":"C5-E10-22","caseType":"cross_category","input":"Explain the documented fee-completeness difference between July and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["fee_completeness"],"expectedFilters":["declared fee-complete ready_closed population","one declared currency","July","June"],"expectedGroupings":[],"expectedOperators":["classify exact, estimated, partially available, or unavailable","report covered and eligible counts","report factual reasons","period comparison","coverage evidence only"],"expectedComparison":{"left":"July","right":"June","basis":"fee_completeness"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","declared population","supported fee facts","matching fee currency","supported sign policy","conserving allocation","covered and eligible counts","estimated only when explicitly source-evidenced, never model-made"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Display exact for internally complete evidence, partially available for internally partial evidence, estimated only when explicitly source-evidenced, or unavailable. Return covered and eligible counts and factual reasons; never use a model estimate."}]
```

# 8. Coverage Report Deliverable

## 8.1 Inventory Coverage

| Measure | Count |
|---|---:|
| Controlling inventory items | 10 |
| Completed canonical records | 10 |
| Deferred canonical records | 0 |
| Proposed additions | 0 |
| Proposed removals or merges | 0 |
| Locked canonical names | 10 |

## 8.2 Language and Evaluation Coverage

Section 6 completes and locks **10 of 10** Version 1 language registries and
**380 of 380** mandatory subsection instances. Section 7 has **220 of 220**
passed evaluation cases: the 22 ordered cases for each of arrays 1-10.
Independent review passed and the category is approved, locked, and Complete.

## 8.3 Data and Tool Coverage

- **Required data:** authorized account scope; current execution/allocation
  graph; original fee evidence; source/adapter provenance; versioned sign and
  kind policy; fee currency; exact allocation conservation; declared eligible
  population; and metric-specific denominator/grouping facts.
- **Optional data:** stored user filters, selected UI context, and a supported
  broker grouping once later category contracts define them.
- **Missing or unresolved data/contracts:** universal commission/regulatory
  kind mapping, Category 4 expectancy-impact contract, and Category 11 stable
  broker grouping identity. Transaction-cost cost/credit treatment and the
  entered-share denominator are accepted planning decisions.
- **Current deterministic targets:** Journal Analytics Fact Set, read-only
  analytics service, metric registry, exact math, charge allocator, typed
  query/result contract, and coverage output.
- **Tools not yet implemented:** named fee/cost metric registry entries where
  absent, AI metric-language validator, AI tool router, provider runtime, and
  language-facing fee-completeness response contract.
- **Unsupported capabilities:** model-estimated fees, unapproved cross-currency
  totals, inferred charge kinds, causal/advice claims, and V3 fallback.

## 8.4 Remaining Gaps

1. Category 4 must lock the expectancy language contract before
   `fee_impact_on_expectancy` can become available; until then its canonical,
   language, and evaluation records must retain the explicit unavailable state.
2. Category 11 must define stable source-backed broker institution identity
   before `fee_impact_by_broker` can become available; until then its records
   must retain the explicit unavailable state.
3. Sections 6-7 are complete, reviewed, passed, and locked. The remaining
   Category 4 and Category 11 dependency gaps retain their explicit Unavailable
   capability boundaries and do not reopen or downgrade Category 5.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete.
- [x] Boundaries are complete.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete 10-item canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] Ordered IDs `C5-FEE-001` through `C5-FEE-010` are present once each.
- [x] No listed item was silently omitted, renamed, merged, or added.
- [x] Proposed additions are separated and empty.
- [x] Lead has reviewed and accepted planning/overlap decisions.
- [x] Accepted alias boundaries are recorded without merges.

## Deliverables and Approval

- [x] All 10 Version 1 canonical records in Section 5 are approved and locked.
- [x] All 10 language registry entries and 380 required subsections in Section 6 are approved and locked.
- [x] All 220 evaluation cases in Section 7 passed independent review.
- [x] Coverage and remaining capability gaps are recorded.
- [x] Planning inventory is approved for language-coverage production.
- [x] Canonical names are locked.
- [x] Category is Approved and Complete.

---

# 10. Review and Approval Notes

- Version 1 is **Complete**, approved, and locked following the accepted final
  independent Terra review PASS.
- Sections 5 and 6 contain all ten approved Version 1 canonical records and
  all ten locked language registries. Section 7 contains 220 passed cases for
  arrays 1-10: 10 clarification-expected cases, 94 unsupported-expected cases,
  and 10 cross-category cases. This approval does not claim an AI Chat runtime.
- The current fee-complete development proof is evidence of a deterministic
  replacement boundary, not a claim of universal fee coverage, all broker-kind
  mappings, or public AI Chat availability.
- `total_transaction_costs` now has an accepted conditional deterministic
  definition: sum supported normalized non-negative `charge_cost` values in
  the declared population/currency. Charge credit remains separate coverage
  evidence and is never silently netted or double-counted.
- `fee_impact_on_expectancy` and `fee_impact_by_broker` intentionally remain
  Unavailable until their Category 4 and Category 11 owners establish the
  missing formula and grouping identity.
- Approval is limited to this language inventory. No user-facing UI, database,
  code, test, configuration, provider call, or Git operation is authorized or
  performed by this category finalization.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-10 | Accepted the final independent Terra review PASS; promoted Category 5 to Complete Version 1; locked all 10 canonical names and registries; and recorded all 220 evaluation cases as passed, including 10 clarification, 94 unsupported, and 10 cross-category cases. | Finalize the controller-approved category without changing formulas, names, arrays, display-state rules, capability statuses, or the explicit Category 4 and Category 11 unavailable boundaries. | 1 |
| 2026-08-10 | Applied final-review remediation to the eight Section 6 result-unit/display-state entries, corrected C5-E7-19 and C5-E7-20 unsupported flags, replaced the stale Sections 6-7 deferral statement, and recorded 10 clarification, 94 unsupported, and 10 cross-category saved cases. | Align every cited user-facing state with exact, estimated, partially available, or unavailable; keep both E7 unsupported cases consistent with their reasons while preserving null dates; and make Version 0 progress truthful without claiming review, pass, approval, lock, or completion. | 0 |
| 2026-08-10 | Applied the Section 5.4 user-facing fee-data-state correction and saved unreviewed Section 7 arrays 9-10: 44 ordered cases for fee_impact_by_broker and fee_completeness. | User-facing output now maps internal complete evidence to exact and internal partial evidence to partially available; estimated remains explicit-source-only. Preserve unavailable broker impact pending Category 4 expectancy and Category 11 stable broker identity, and Supported factual fee-completeness classification. All 220 cases are saved but unreviewed; no pass, lock, approval, or version change is claimed. | 0 |
| 2026-08-10 | Saved unreviewed Section 7 evaluation arrays 7-8: 44 ordered cases for trades_turned_from_green_to_red_by_fees and fee_impact_on_expectancy. | Preserve the same-row, fee-complete ready-closed gross-positive/net-negative transition without intraday-path, causation, broker-blame, or advice claims; keep fee-impact expectancy unavailable until Category 4 locks its identical-population formula and basis. Arrays 9-10 remain pending; no pass, lock, approval, or version change is claimed. | 0 |
| 2026-08-10 | Saved unreviewed Section 7 evaluation arrays 4-6: 66 ordered cases for `fees_per_trade`, `fees_per_share`, and `fees_as_percentage_of_gross_profit`. | Preserve identical eligible ready-closed cost denominators, entered-share roles, positive gross-profit-only percentage math, one currency, separate credits, coverage, unavailable denominator states, and planned explanation/unsupported-request routing. Arrays 7-10 remain pending; no pass, lock, approval, or version change is claimed. | 0 |
| 2026-08-10 | Saved unreviewed Section 7 evaluation arrays 1-3: 66 ordered cases for total_commissions, total_regulatory_fees, and total_transaction_costs. | Preserve unavailable kind-specific totals without label/amount inference; retain supported non-netted transaction costs, currency partitions, coverage, open/decision boundaries, and planned explanation/unsupported-request routing. Arrays 4-10 remain pending; no pass, lock, approval, or version change is claimed. | 0 |
| 2026-08-10 | Completed Section 6 Version 0 language registries for `fees_as_percentage_of_gross_profit`, `trades_turned_from_green_to_red_by_fees`, `fee_impact_on_expectancy`, `fee_impact_by_broker`, and `fee_completeness`: all 10 registries and 380 required subsection instances now exist. Preserved positive-gross-profit and same-population conditions; same-row gross-positive/net-negative transition without path or causation claims; the Category 4-only expectancy delta; Category 11-only broker institution grouping; source-evidenced-only estimated coverage; separate credits; and planned AI Chat routing. | Finish the Section 6 batch without changing Version 0, locking names, modifying Section 7, or inventing account/broker selection, formulas, coverage, or runtime capability. | 0 |
| 2026-08-10 | Applied independent Section 5 review corrections: aligned planning state to completed Section 5; made future commission/regulatory totals kind-backed non-negative charge-cost sums with credits separate; and restricted broker impact to the Category 4 gross-minus-net expectancy delta grouped by Category 11 broker identity. | Remove remaining formula ambiguity while preserving the 3 Supported/3 Planned/4 Unavailable classification and leaving Sections 6-7 unchanged. | 0 |
| 2026-08-10 | Completed Section 6 Version 0 language-registry Batch 1 for `total_commissions`, `total_regulatory_fees`, `total_transaction_costs`, `fees_per_trade`, and `fees_per_share`: 5 of 10 records and 190 required subsection instances. Preserved unavailable commission/regulatory contracts; the supported non-netted transaction-cost contract; planned identical-population per-trade and entered-share rates; server scope, ticker-safe abbreviations, coverage states, and planned AI Chat boundary. | Advance the first controlled language batch without locking names, modifying Section 7, changing Version 0, or claiming runtime availability. | 0 |
| 2026-08-10 | Produced all 10 Version 0 Section 5 canonical records with exact formulas/interpretations, template fields, related-concept boundaries, data/query/coverage contracts, and current capability states; Sections 6-7 remain deferred. | Advance the accepted planning inventory into canonical-record production without locking names, changing Version 0, or widening to language/evaluation deliverables. | 0 |
| 2026-08-10 | Recorded accepted Category 5 planning decisions; changed status to Deliverables In Progress; reconciled the inventory to 3 Supported, 3 Planned, and 4 Unavailable rows; retained deferred Sections 5-7 and unlocked Version 0. | Advance the accepted planning inventory into deliverable production without claiming final approval, a locked name, or an AI Chat runtime. | 0 |
| 2026-08-10 | Created Category 5 Version 0 planning record with exact ordered 10-item controlling inventory, factual charge/coverage boundaries, evidence, initial lead-decision list, deferred Sections 5-7, and draft review/coverage records. | Complete the approved second concurrent Markdown-only planning lane without widening to implementation, language coverage, or controller-owned master edits. | 0 |
