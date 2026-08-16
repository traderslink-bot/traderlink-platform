# Category 8: Execution Metrics

# Category Metadata

| Field | Value |
|---|---|
| Category name | Execution Metrics |
| Category number | 8 |
| Category slug | metrics-execution |
| File name | 08-metrics-execution.md |
| Category type | Execution, allocation-event, lifecycle-construction, reconciliation, and open-quantity metric vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-10 |
| Last updated | 2026-08-10 |
| Dependencies | Category 1 Intents version 1; locked Categories 2-6; active Category 7 time/duration boundaries; replacement Journal Analytics Fact Set, accepted allocation graph, current execution versions, round-trip projections, account scope, unit/currency/timezone, and coverage contracts; later dimensions, operators, date/time language, comparison/ranking, context, terminology, presentation, and policy categories |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** Mapped terms do not authorize
> execution reconstruction, reconciliation, or a write.

**Controller state:** After final independent PASS, the controller accepted the
exact 19-item planning inventory and authorized Section 5 canonical production.
All Section 5 records `C8-EXEC-001` through `C8-EXEC-019` are complete below
in exact controlling-inventory order. Every capability status remains
`Planned`. All Section 6 registry records `C8-EXEC-001` through
`C8-EXEC-019` are complete in exact canonical order. Section 7 Batches 1-6
save all 418/418 cases for `C8-E1` through `C8-E19`; comprehensive independent
Terra review passed all 418 with zero failures, and Section 8 review also
passed. The controller approved and locked the nineteen canonical names and
registries, assigned Version 1, accepted the final clerical transition, and
marked Category 8 Complete. This approval does not create runtime support or
authorize an AI Chat route or metric implementation.

---

# 1. Category Purpose

Category 8 gives the future TraderLink AI Companion stable targets for
questions about how a position lifecycle was constructed from accepted
executions: its position-increasing and position-reducing allocation events,
prices, execution IDs, scale actions, partial exits, flips, repeats, sequence,
conservation, unmatched evidence, and factually open remainder. It prevents
`entry`, `exit`, `fill`, `buy`, `sell`, `average price`, `scale`, `flip`, and
`open quantity` from silently changing between execution side, allocated
lifecycle role, a distinct execution ID, a raw source row, or a realized
round-trip result.

Journal Analytics remains responsible for the server-authorized account scope,
current accepted execution versions, ordered allocation graph, exact
quantity/price arithmetic, active round-trip projection state, and coverage.
The language layer can name a requested metric but cannot manufacture a
missing role, price, timestamp, unit convention, source match, opening
inventory, or trader Data Decision. A `Planned` row below is a proposed named
analytic-language target; it is not a claim that an AI Chat route or named
metric-registry entry already exists.

This category describes historical facts and deterministic relationships only.
It does not infer order intent, fill quality, broker quality, discipline,
motivation, edge, cause, or advice from an execution sequence. It never
exposes raw broker/source identifiers, execution IDs, account identities, or
private statement evidence in an aggregate response.

---

# 2. Category Boundaries

## Included

The controlling inventory contains exactly the 19 Section 5.7 names for:

- position-increasing entry allocation-event counts and position-reducing exit
  allocation-event counts, distinct from counts of execution IDs;
- simple and quantity-weighted allocated entry/exit prices;
- unique execution-ID counts that carry an entry or exit allocation;
- scale-in/scale-out roles, partial reductions, and a single flip event that
  closes one lifecycle while opening the next;
- repeat zero-to-nonzero lifecycle attempts, deterministic lifecycle order,
  and execution-span endpoints;
- average quantity per accepted Stock execution, without relabelling contracts
  or other units as shares;
- exact entered-versus-exited quantity reconciliation, unmatched
  source/execution evidence, and factually legitimate open remainder.

All results retain server-authorized workspace/account scope; compatible
instrument, currency, and unit partitions; accepted current execution and
allocation versions; raw UTC instants where ordering/duration is needed; an
account IANA timezone where a trading-date bucket is needed; formula version;
and explicit `ready_closed`, `legitimate_open`, and `needs_decision` coverage.
Stored quantities, prices, and ratios remain exact. Display rounding never
changes the underlying value. A zero denominator or a missing required fact is
unavailable or partial coverage, never a fabricated zero.

## Excluded

The following related concepts are not owned here:

- entered-share/entered-quantity denominator, maximum open position, position
  size/exposure, and performance by size: Category 6. Category 8 supplies
  allocation-role facts but does not redefine that locked denominator;
- realized gross/net P/L, money/currency rules, outcomes, and fee completeness:
  Categories 2, 3, and 5;
- lifecycle first-entry/final-exit time rendering, holding duration, calendar
  buckets, and time-between-trade language: Category 7. Category 8 supplies
  allocation endpoints only;
- behavioral or quality conclusions from repetition, scaling, partial exits,
  or flips: Categories 4 and 9;
- generic account, instrument, ticker, provenance, currency, unit, and date
  dimensions; operators; date grammar; comparison/ranking; context;
  terminology; presentation; privacy; causation; and policy: Categories 11-19;
- order submission, order lifecycle, venue fills, intended price, bid/ask,
  NBBO, slippage, VWAP, candle/quote replay, tax lots, account equity, market
  value, and FX conversion; and
- writes, manual-entry amendments, Data Decision actions, protected actions,
  external provider calls, and an AI Chat runtime.

## Cross-Category References

Category 8 references but does not redefine:

- Category 1 calculation, summary, grouping, comparison, ranking, sequence,
  explanation, diagnosis, and data-quality intents;
- Categories 2, 3, and 5 when an execution result is compared with realized
  P/L/outcome or fee-complete net results;
- Category 6's owner-controlled entered-quantity and maximum-position
  semantics, including its Stock multiplier-one boundary;
- Category 7's first-entry/final-exit lifecycle endpoint and duration
  semantics; and
- Categories 11-19 for dimensions, UTC/local-time interpretation,
  account/instrument/currency/unit compatibility, terminology, ambiguity,
  results, privacy, no-invention, no-causation, and safety.

Category 8 owns the requested names as separate vocabulary targets. It must not
silently merge an allocation-event count with a unique execution-ID count, a
simple mean with a quantity-weighted mean, a scale role with execution side,
an open remainder with realized quantity, or a source mismatch with a resolved
Data Decision.

---

# 3. Planning Analysis

Planning establishes the controller-accepted exact 19-name controlling list
and evidence boundary. Section 5 canonical production is authorized only
through Batch 3 (`C8-EXEC-001` through `C8-EXEC-019`). Section 6 registry
production is authorized and complete through final Batch 4 (`C8-EXEC-001`
through `C8-EXEC-019`). Section 7 Batches 1-6 and Section 8 coverage-report
production passed comprehensive independent review. The controller accepted
the final clerical transition, approved and locked the category, assigned
Version 1, and marked it Complete.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?**

   It turns construction language into one declared observation layer. A Buy
   or Sell is an execution-side fact; an entry, exit, add, reduction, close,
   or flip-opening/flip-closing is an allocation role. This prevents a short
   entry from being called an exit because it is a Sell, or a short cover from
   being called an entry because it is a Buy.

2. **What canonical concepts belong here?**

   Exactly the 19 ordered names and IDs in Section 4, `C8-EXEC-001` through
   `C8-EXEC-019`. They remain controlling even if a current Journal primitive
   has a differently named lower-level field or no exposed named metric.

3. **What related concepts belong elsewhere?**

   Category 6 owns size/exposure denominators; Category 7 owns duration and
   calendar language; Categories 2, 3, and 5 own realized money/outcome/fee
   meanings. Later categories own dimensions, query grammar, and safety.
   Category 9 may only interpret a completed factual result under its own
   policy; it cannot assign motive to a repeat, scale, or partial exit.

4. **What data is required?**

   Every item needs a server-authorized account scope, current accepted
   execution version, normalized side, exact quantity, price where relevant,
   raw UTC timestamp where relevant, ordered accepted allocations, allocation
   role, round-trip identity/projection state, and coverage/Data Decision
   state. Price averages additionally need price and positive allocated
   quantity; weighted prices need a positive quantity denominator. Trading-date
   repeats need the account IANA timezone. `average_shares_per_execution`
   needs a compatible Stock share-unit partition; contracts and unknown
   multipliers cannot be relabelled as shares.

5. **Which deterministic tools will answer these requests?**

   The evidence path is the read-only `JournalAnalyticsFactSet`, its current
   allocation/population builder, exact decimal/rational math, the Journal
   Analytics service/query/result contracts, coverage contract, and
   Data-Decision visibility. Accepted implementation verifies roles, ordered
   allocation direction, exact conservation, and current projection state.
   It does not yet establish a named language registry, a Chat route, or all
   nineteen named metric/query outputs.

6. **Which concepts are directly observed?**

   Current accepted execution side, quantity, price, raw UTC instant, source
   provenance, stable allocation identity, allocation role/quantity, and active
   projection state are observed Journal facts when covered. A Data Decision
   and an unsupported or unmatched source record are factual coverage states,
   not resolved execution facts. Execution and allocation identities are
   observed privately but must not be exposed.

7. **Which concepts are deterministically derived?**

   Unique allocation-event counts, distinct execution-ID counts,
   simple/weighted prices, scale and partial-exit classification, flip count,
   repeat-attempt count, lifecycle sequence, arithmetic mean execution
   quantity, the Category 7 holding-duration result selected through the
   execution-duration alias, reconciliation result, and remaining quantity are
   derived from accepted facts and the current allocation graph. Exact
   arithmetic retains numerator and denominator; a zero or missing denominator
   is unavailable, not zero.

8. **Which concepts are proxy indicators?**

   None is itself a proxy. Repeats, scaling, partial exits, and flips can
   describe a factual pattern only; they do not prove intent, quality, or a
   causal performance relationship.

9. **Which concepts are user-labelled?**

   None. Trader-confirmed Data Decisions can determine whether a disputed
   chain is accepted, separate, corrected, or otherwise resolved, but neither
   the metric nor the language layer invents that decision.

10. **Which concepts are not measurable?**

   Accepted execution facts do not prove order-submission duration, intended
   entry/exit, individual exchange fill quality, intrabar sequence, broker tax
   lots, market impact, slippage, a missing source-to-execution match, or the
   motive for scaling/re-entering. A missing price, quantity, role, timestamp,
   unit convention, or decision stays visible as coverage.

11. **Which terms are ambiguous?**

   `Entry` and `exit` can mean allocation events, execution IDs, fills, sides,
   first/final lifecycle endpoints, or order actions. `Average price` may mean
   simple mean or quantity-weighted average. `Scale in/out` may be mistaken for
   Buy/Sell despite short direction. `Partial exit` can mean any reduction,
   one execution, or quantity percentage. `Execution duration` can mean an
   order's lifecycle, a fill interval, or the span from first to final
   allocated execution. `Open quantity` can mean a factually legitimate open
   position, a disputed nonzero chain, or an unrealized P/L request.

12. **What defaults are safe?**

   No generic `entry`, `exit`, or `average price` default is safe when the
   request could mean an allocation event versus a distinct execution-ID count
   or a simple versus weighted price; request clarification unless trusted
   context already supplies the missing basis. The fixed canonical names do
   have exact planning meanings: `number_of_entries`/`number_of_exits` count
   unique qualifying allocation events by stable allocation identity;
   `entry_execution_count`/`exit_execution_count` count distinct current
   execution IDs across the full declared scope; simple price names weight each
   qualifying allocation event equally; weighted price names weight by exact
   allocated quantity. Position-increasing roles are `opening`, `adding`, and
   `flip_opening`; position-reducing roles are `reducing`, `closing`, and
   `flip_closing`. A flip may contribute both role types but remains one
   scope-wide execution ID. Realized construction aggregates default to
   eligible current `ready_closed` projections; `legitimate_open` and
   `needs_decision` remain separately visible coverage. No zero is substituted
   for a missing price, quantity, or denominator. For repeat/sequence metrics,
   build the server-authorized current lifecycle candidate sequence before
   applying analytic date, result, or projection-state filters. Those filters
   may select output but must not remove a predecessor/barrier or renumber later
   candidates across it.

13. **What conditions require clarification?**

   Clarify generic `entries/exits` when it does not select allocation-event or
   distinct-execution count, and generic `average price` when it does not
   select simple or allocated-quantity-weighted price. Clarify a request for
   quantity-based partial-exit percentage because the fixed canonical metric is
   an event rate. `execution_duration` is fixed as a terminology/selection
   alias to Category 7 `hold_duration`; clarify only when the user instead asks
   for unavailable order/fill duration, last-activity span, or open age.
   Clarify whether results cover closed lifecycles, factual open activity, or
   all state-labelled coverage when wording and trusted context do not resolve
   that population, and reject incompatible account/instrument/currency/unit
   scopes.

14. **What combinations are invalid?**

   Do not aggregate prices across currencies, quantity across incompatible
   units, or shares with contracts. Do not treat Buy/Sell as entry/exit without
   allocation role. Do not include `needs_decision` chains as resolved open or
   realized facts. Do not use an unmatched source record to repair a missing
   execution. Do not produce a weighted price with zero total allocated
   quantity, a partial-exit percentage with no eligible exits, or a realized
   result from open remainder. Do not treat a flip as two unique scope-wide
   execution IDs, apply analytic filters before constructing the current
   lifecycle sequence, remove a predecessor/barrier, renumber later candidates
   across a barrier, turn a Data Decision into a match/countable execution, or
   double-count one stable unmatched member across coverage labels. Do not
   derive causation/advice from construction counts.

15. **What evaluation coverage proves completion?**

   Later Sections 6-8 must cover every canonical name with formal,
   conversational, slang, abbreviated, noisy, correction, ambiguity,
   cross-category, selected-context, and unsupported-data cases. The proof
   must include long/short roles, scale-in/out, partials, flips, repeated same
   instrument/date lifecycles, missing price/quantity/role, zero denominators,
   unit/currency partitions, raw-UTC ordering, account-local date attribution,
   `ready_closed`/`legitimate_open`/`needs_decision` coverage, exact quantity
   conservation, source/execution mismatch, and privacy-safe output.

## 3.2 Dependencies

- **Earlier inventory:** Category 1 routing; locked Categories 2-5 for any
  realized P/L/outcome/fee comparison; locked Category 6 for entered-quantity,
  maximum-position, Stock unit, and exposure ownership; and Category 7 for
  time/duration endpoint wording.
- **Journal facts:** server-derived workspace/account authorization, current
  execution/allocation versions, normalized side, exact quantity/price,
  allocation role/sequence, round-trip state, raw UTC timestamps, account IANA
  timezone, instrument/unit/currency, source coverage, and Data Decisions.
- **Deterministic implementation:** read-only fact-set reader, allocation and
  projection builder, exact decimal/rational arithmetic, metric/query/result
  contracts, coverage partitioning, and current source revision.
- **UI/context:** an authorized selected account/instrument/trade/date context
  may constrain a later request but cannot broaden access or make a missing
  fact observable.
- **User-defined vocabulary:** none for the draft. Any later alias for
  `scalp`, `trim`, `add`, `cover`, or `flip` needs the terminology policy and
  cannot override the accepted role facts.
- **External data:** none for accepted execution construction. Order/quote/
  market-data requests remain separately unavailable.
- **Unsupported dependencies:** an AI language interpreter, validator, tool
  router, answer runtime, named registry/query fields for all draft names,
  order lifecycle data, and a source-matching policy that turns unmatched
  evidence into resolved facts.

## 3.3 Risks

- **Role/side collision:** Buy/Sell is not entry/exit. This is especially
  material for shorts and flip allocations.
- **Event/ID duplication:** `number_of_entries`/`number_of_exits` count stable
  qualifying allocation identities; `entry_execution_count`/
  `exit_execution_count` count distinct current execution IDs across the full
  declared scope. Grouping or display rows must not change either identity
  grain.
- **Price collision:** simple arithmetic prices and quantity-weighted prices
  cannot be presented as aliases; missing prices and zero weights fail closed.
  Existing analytics outputs named `average_entry_price` and
  `average_exit_price` are quantity-weighted `ready_closed` aggregates and are
  not evidence for the Category 8 simple allocation-event means. They cannot
  be reused as aliases or presented as duplicate truth.
- **Lifecycle collision:** a first entry/final exit, a partial reduction, a
  scale event, an open quantity, and a realized closed result have different
  populations.
- **Flip and sequence risk:** one flip participates in two adjacent lifecycles
  but must not double-count as two unique scope-wide executions. Repeat
  attempts are zero-to-nonzero lifecycle occurrences, not a motive label. The
  current candidate sequence must be constructed before analytic date, result,
  or projection-state filters so a predecessor/barrier cannot disappear or
  later candidates be renumbered across it.
- **Unit/currency/time risk:** quantity must stay in a compatible unit
  partition; price stays in a compatible currency partition; ordering is raw
  UTC and trading-date grouping uses the authorized account IANA timezone.
- **Evidence risk:** unmatched, unsupported, missing, or disputed evidence
  remains coverage/Data Decision state. It must not be guessed into a match,
  zero, or legitimate open position.
- **Privacy and causation risk:** server-authorized aggregation must not leak
  account, broker, source, execution, or statement identifiers, and factual
  construction does not support quality, causation, or trading advice.

## 3.4 Repository Evidence

The following privacy-safe documentation was reviewed without querying private
Journal values, broker identifiers, raw source rows, statements, tokens, or a
database.

| Repository path | What it proves for this planning record |
|---|---|
| `docs/migration/traderslink_ai_language_inventory_master.md` | Mandatory workflow, exact Category 8 file/order/status, delegated one-file boundary, and controlling-inventory rule. |
| `docs/migration/category_completion_template_example.md` | Required Sections 1-11, capability vocabulary, deferred deliverables, truthful checklist/review/change-log structure. |
| `docs/migration/traderslink_ai_chatbot_complete_language_plan.md` section 5.7 | The exact ordered nineteen-name Execution Metrics list; no addition, removal, rename, merge, or runtime claim is authorized here. |
| `docs/migration/language-inventory/categories/01-intents.md` | Locked routing, account-scope, deterministic-evidence, no-invention, privacy, and planned-Chat conventions. |
| `docs/migration/language-inventory/categories/02-metrics-profit-loss.md` through `06-metrics-position-size.md` | Locked P/L, outcome, quality, fee, and size/exposure ownership boundaries; Category 6 retains entered-quantity/max-position semantics. |
| `docs/migration/language-inventory/categories/07-metrics-time-duration.md` | Active time/duration ownership: raw UTC versus account-local rendering, lifecycle endpoints, coverage, and no implicit session/order-lifecycle facts. |
| `docs/migration/analytics-capability-catalog.md` | `ready_after_rebuild` trade-construction family, repeat-attempt definition, execution-count distinction, open-lifecycle family, fact limitations, and no causation/advice. |
| `docs/migration/phase-3-journal-integrity-plan.md` and `phase-3-journal-integrity-handoff.md` | Immutable source evidence, versioned execution ledger, allocation-role vocabulary, full-chain reconstruction, Data Decisions, and containment of unresolved chains. |
| `docs/migration/phase-4-core-analytics-plan.md` and `phase-4-core-analytics-progress.md` | Accepted roles, exact quantity conservation, unique execution-ID policy, flip behavior, Stock multiplier-one arithmetic boundary, read-only account isolation, exact math, and separate ready/open/decision coverage. |

Evidence interpretation: accepted Phase 3/4 documentation establishes the
underlying allocation, conservation, open-lifecycle, and coverage primitives.
It also establishes current quantity-weighted `ready_closed` analytics outputs
named `average_entry_price` and `average_exit_price`; those current outputs are
not evidence for C8-EXEC-003/004's fixed simple allocation-event means and
cannot be reused as aliases or a second source of truth. Existing primitives,
weighted aggregates, allocation counts, and flip counts do not establish any
of the nineteen canonical names as supported language contracts. Every Section
4 capability status therefore remains `Planned`, while its evidence boundary
states which lower-level fact exists and which named contract remains absent.

## 3.5 Accepted Evidence and Controller-Resolved Planning Decisions

### Accepted evidence that is not being reopened

1. **Allocation roles and side:** Position-increasing roles are `opening`,
   `adding`, and `flip_opening`; position-reducing roles are `reducing`,
   `closing`, and `flip_closing`. Execution side remains separate.
2. **Exactness and lifecycle states:** Current facts use exact quantity/price
   arithmetic, raw UTC ordering, active execution/allocation versions, and
   explicit `ready_closed`, `legitimate_open`, and `needs_decision` coverage.
3. **Conservation and flips:** Accepted reader behavior verifies exact quantity
   conservation. A flip execution can participate in both adjacent round trips
   while remaining one unique scope-wide execution ID.
4. **Open and decision containment:** A factually `legitimate_open` projection
   can expose exact current quantity. A `needs_decision` nonzero chain is not
   inferred to be legitimate open or realized.
5. **Partitions and privacy:** Account authorization is server-derived. Price
   and money require a compatible currency partition; quantity requires a
   compatible unit partition; account-local trading date requires its IANA
   timezone; outputs stay private-safe.

### Controller-resolved planning decisions

1. **Count identity:** `number_of_entries` and `number_of_exits` count unique
   qualifying allocation events by stable allocation identity for the accepted
   position-increasing and position-reducing roles. They do not count display
   rows or execution side. `entry_execution_count` and `exit_execution_count`
   count distinct current execution IDs across the full declared scope. One
   flip execution may contribute both allocation-role types but remains one
   scope-wide execution ID. The four names remain separate even when their
   values happen to match in a simple lifecycle.
2. **Price-name collision:** C8-EXEC-003/004 are fixed simple means over
   qualifying allocation-event prices; C8-EXEC-005/006 are exact
   allocated-quantity-weighted means. Current analytics outputs named
   `average_entry_price`/`average_exit_price` are quantity-weighted
   `ready_closed` aggregates. They are not evidence for the simple Category 8
   names and must not be reused as aliases or presented as duplicate truth.
3. **Scale and partial policy:** `scale_in_count` and `scale_out_count` count
   unique qualifying allocation events by stable allocation identity.
   `partial_exit_percentage` is the exact event rate: qualifying `reducing`
   allocation events divided by all qualifying `reducing`, `closing`, and
   `flip_closing` allocation events. A zero denominator is unavailable.
   Quantity-rate wording is a separate concept and is never inferred.
4. **Execution-duration ownership:** `execution_duration` is a terminology and
   selection alias to Category 7 `hold_duration` for eligible `ready_closed`
   lifecycles. Category 7 exclusively owns first-entry-to-final-exit raw UTC
   arithmetic. Category 8 performs no duplicate calculation and the alias does
   not mean order/fill duration, last-activity span, or open age.
5. **Repeat and sequence barriers:** Build the server-authorized current
   lifecycle candidate sequence before analytic date, result, or
   projection-state filters. Partition by server-authorized account, stable
   instrument, and account-local entry date, then order every candidate by
   first-entry raw UTC instant and stable round-trip ID. Filters may select
   output but must not remove a predecessor/barrier or renumber later
   candidates across it. `needs_decision` and incomplete candidates remain
   visible state-labelled barriers: report exact pre-barrier results and
   partial/unavailable coverage after the barrier; never skip across it.
6. **Shares and unmatched coverage:** `average_shares_per_execution` remains
   limited to a compatible Stock share-unit partition. `unmatched_executions`
   is a non-overlapping labelled coverage bundle with deterministic precedence.
   First assign label (c) to each distinct underlying provisional
   reconciliation candidate member; Data Decision state is metadata and the
   decision itself is never a counted member. Next assign label (b) to an
   accepted execution lacking required allocation only when its stable
   underlying identity is not already classified in (c). Last assign label (a)
   to a source record unable to form an accepted execution only when its stable
   underlying identity is not represented in (c). Deduplicate by stable
   underlying member identity and never count one member across labels. Do not
   convert a decision into a match or apply filters unsupported by source
   attribution. Use bounded server-authorized account-scope coverage where
   finer attribution is unavailable.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every
> listed item must be completed in later deliverables. Do not silently omit,
> rename, merge, or replace an item. The controller approved and locked this
> exact Version 1 list after comprehensive independent and clerical PASS.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | C8-EXEC-001 | `number_of_entries` | Number of entries | allocation_event_count | Planned | Count unique qualifying allocation events by stable allocation identity for roles `opening`, `adding`, and `flip_opening` within the declared population. It does not count display rows, execution side, or distinct execution IDs. Existing allocations do not make this named language contract Supported. |
| 2 | C8-EXEC-002 | `number_of_exits` | Number of exits | allocation_event_count | Planned | Count unique qualifying allocation events by stable allocation identity for roles `reducing`, `closing`, and `flip_closing`. It does not count display rows, execution side, or distinct execution IDs. Existing allocations do not make this named language contract Supported. |
| 3 | C8-EXEC-003 | `average_entry_price` | Average entry price | simple_allocated_price | Planned | Arithmetic mean of qualifying entry allocation-event prices, each stable allocation event weighted once. Current analytics output with the same name is a quantity-weighted `ready_closed` aggregate and is not evidence for, an alias of, or duplicate truth for this fixed simple mean. |
| 4 | C8-EXEC-004 | `average_exit_price` | Average exit price | simple_allocated_price | Planned | Arithmetic mean of qualifying exit allocation-event prices, each stable allocation event weighted once. Current analytics output with the same name is a quantity-weighted `ready_closed` aggregate and is not evidence for, an alias of, or duplicate truth for this fixed simple mean. |
| 5 | C8-EXEC-005 | `weighted_average_entry_price` | Weighted average entry price | quantity_weighted_allocated_price | Planned | Sum qualifying entry allocated quantity times price divided by total qualifying entry allocated quantity. The exact positive denominator is required; current quantity-weighted primitives do not make this named language contract Supported. |
| 6 | C8-EXEC-006 | `weighted_average_exit_price` | Weighted average exit price | quantity_weighted_allocated_price | Planned | Sum qualifying exit allocated quantity times price divided by total qualifying exit allocated quantity. The exact positive denominator is required; current quantity-weighted primitives do not make this named language contract Supported. |
| 7 | C8-EXEC-007 | `entry_execution_count` | Entry execution count | unique_execution_id_count | Planned | Count distinct current execution IDs across the full declared scope when each carries one or more qualifying position-increasing allocations. One flip may also qualify as an exit but remains one scope-wide execution ID. Existing ID/count primitives do not make this named language contract Supported. |
| 8 | C8-EXEC-008 | `exit_execution_count` | Exit execution count | unique_execution_id_count | Planned | Count distinct current execution IDs across the full declared scope when each carries one or more qualifying position-reducing allocations. One flip may also qualify as an entry but remains one scope-wide execution ID. Existing ID/count primitives do not make this named language contract Supported. |
| 9 | C8-EXEC-009 | `scale_in_count` | Scale-in count | allocation_role_count | Planned | Count unique qualifying `adding` allocation events by stable allocation identity. It is not Buy executions, every entry, display rows, or distinct execution IDs. Existing scale allocations do not make this named language contract Supported. |
| 10 | C8-EXEC-010 | `scale_out_count` | Scale-out count | allocation_role_count | Planned | Count unique qualifying `reducing` allocation events by stable allocation identity. It is not Sell executions, every exit, display rows, or distinct execution IDs. Existing scale allocations do not make this named language contract Supported. |
| 11 | C8-EXEC-011 | `partial_exit_percentage` | Partial exit percentage | partial_reduction_rate | Planned | Exact event rate: unique qualifying `reducing` allocation events divided by all unique qualifying `reducing`, `closing`, and `flip_closing` allocation events. Zero denominator is unavailable. A quantity-rate percentage is separate and never inferred. |
| 12 | C8-EXEC-012 | `position_flips` | Position flips | flip_execution_count | Planned | Draft meaning: count unique current execution IDs with both `flip_closing` and `flip_opening` allocated components. It closes one lifecycle and opens the next, and must not double-count as two scope-wide execution IDs. |
| 13 | C8-EXEC-013 | `repeat_attempts` | Repeat attempts | lifecycle_repeat_count | Planned | Build the server-authorized current lifecycle candidate sequence before analytic date, result, or projection-state filters. Within account, stable-instrument, and account-local entry-date partitions, order every candidate by first-entry raw UTC then stable round-trip ID and count the second/later zero-to-nonzero candidates. Filters cannot remove a predecessor/barrier or renumber later candidates across it. Retain `needs_decision`/incomplete candidates as state-labelled barriers; report exact pre-barrier results and partial/unavailable coverage after, never skip. It implies no motive or quality. |
| 14 | C8-EXEC-014 | `trade_sequence` | Trade sequence | lifecycle_order | Planned | Build the server-authorized current lifecycle candidate sequence before analytic date, result, or projection-state filters. Within account, stable-instrument, and account-local entry-date partitions, order every candidate by first-entry raw UTC then stable round-trip ID. Filters cannot remove a predecessor/barrier or renumber later candidates across it. Retain `needs_decision`/incomplete candidates as state-labelled barriers; report exact pre-barrier results and partial/unavailable coverage after, never skip. |
| 15 | C8-EXEC-015 | `average_shares_per_execution` | Average shares per execution | execution_quantity_mean | Planned | Draft meaning: sum exact absolute quantity once per unique current accepted Stock execution divided by unique execution count in one compatible share-unit partition. It is not contracts, allocated entered quantity, or maximum position size; zero count is unavailable. |
| 16 | C8-EXEC-016 | `execution_duration` | Execution duration | hold_duration_alias | Planned | Terminology/selection alias to Category 7 `hold_duration` for eligible `ready_closed` lifecycles. Category 7 owns first-entry-to-final-exit raw UTC arithmetic. Category 8 performs no duplicate calculation; this is not order/fill duration, last-activity span, or open age. |
| 17 | C8-EXEC-017 | `entry_to_exit_quantity_reconciliation` | Entry-to-exit quantity reconciliation | allocation_conservation | Planned | Draft meaning: publish entered position-increasing quantity, exited position-reducing quantity, and exact residual under declared state: zero for reconciling `ready_closed`; factual remaining quantity for `legitimate_open`; unresolved coverage for `needs_decision`. Conservation verification exists, but no named output contract is accepted. |
| 18 | C8-EXEC-018 | `unmatched_executions` | Unmatched executions | source_execution_coverage | Planned | Non-overlapping labelled coverage bundle with deterministic precedence: (c) distinct underlying provisional reconciliation candidate members first, with Data Decision state only metadata and never a counted member; then (b) accepted executions lacking required allocation only when not already classified in (c); then (a) source records unable to form an accepted execution only when not represented in (c). Deduplicate by stable underlying member identity and never double-count across labels. Never turn a decision into a match or apply unsupported source-attribution filters; use bounded server-authorized account coverage where necessary. |
| 19 | C8-EXEC-019 | `remaining_open_quantity` | Remaining open quantity | legitimate_open_quantity | Planned | Draft meaning: exact current signed/absolute quantity for a factually `legitimate_open` projection under a compatible unit partition. It is not realized quantity, a `needs_decision` remainder, an inferred opening balance, or unrealized P/L. An open-lifecycle fact exists; no named language metric is accepted. |

## Proposed Inventory Additions

None. The source plan fixes the 19-name list. Related candidates such as
`first_entry_price`, `final_exit_price`, `execution_side_buy_count`,
`execution_side_sell_count`, `partial_exit_quantity_percentage`,
`unmatched_source_records`, and `order_fill_duration` are not added to this
inventory draft.

## Proposed Removals or Merges

None proposed. The controller resolved the two semantic collisions without
altering the list:

- `number_of_entries` versus `entry_execution_count`, and
  `number_of_exits` versus `exit_execution_count`: allocation-event count
  versus distinct current execution-ID count remain separate even when values
  happen to match for a simple lifecycle.
- `execution_duration` remains a required Category 8 terminology/selection
  alias to Category 7 `hold_duration`. It selects Category 7's one calculation
  and does not create a duplicate metric truth.

---

# 5. Canonical Inventory Deliverable

Batch 1 through Batch 3 contain all nineteen approved and locked Version 1
canonical records in exact controlling-inventory order. These records define
planned language contracts only. Existing
Journal facts, allocation/count primitives, flip handling, and current
quantity-weighted price aggregates do not make any record `Supported` or
authorize a Chat/runtime path.

Every record uses current accepted Journal facts from the server-authorized
account scope. The default analytic population is eligible `ready_closed`
lifecycles. A request that explicitly includes factual `legitimate_open`
activity may return its accepted construction facts in a separate state-labelled
partition; `needs_decision` and incomplete chains remain visible coverage and
are never interpreted as resolved or realized. Instrument, currency, price
convention, and unit partitions must be compatible for the requested
calculation. Raw UTC remains the ordering fact, and date filtering or display
uses the server-authorized account IANA timezone where relevant. Exact values
and rational denominators are preserved; display rounding cannot alter them.

## `number_of_entries`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-001 |
| Category | Execution Metrics |
| Subcategory | Allocation-event count |
| Canonical name | `number_of_entries` |
| Display name | Number of entries |
| Exact definition | In the declared eligible population, count once each unique current accepted allocation identity whose role is position-increasing: `opening`, `adding`, or `flip_opening`. Deduplicate by stable allocation identity before presentation or grouping. A flip-opening allocation contributes one entry event to its new lifecycle. Return a non-negative integer; an exact zero is valid only when the authorized covered population is complete and contains no qualifying allocation. |
| Distinction from related concepts | This counts allocation events, not display rows, raw source rows, Buy/Sell execution side, distinct execution IDs, entered quantity, first entries only, or lifecycle count. Multiple qualifying allocations carried by one execution remain distinct events when their stable allocation identities differ. |
| Evidence classification | Directly observed accepted allocation identity/role; deterministically derived unique qualifying event count |
| Capability status | Planned |
| Result units | Non-negative integer allocation-event count in the declared compatible account/instrument/unit scope |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. When the request explicitly includes factual `legitimate_open` activity, count its accepted qualifying allocations in a separate open-state partition. `needs_decision`/incomplete activity remains visible coverage and is not silently included as resolved. |
| Fee handling | Not applicable. Fees do not change allocation-event identity or role. A combined P/L query separately retains its gross or fee-complete net basis and compatible currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: lifecycle construction event count.
- Narrower concepts: opening events; adding events; flip-opening events.
- Commonly confused concepts: `entry_execution_count`, Buy execution count,
  entered quantity, first entry, trade count.
- Must not be merged with: `entry_execution_count`, `number_of_exits`,
  `scale_in_count`, or Category 6 entered quantity.

Privacy and interpretation boundary: return the privacy-safe count, declared
scope, population, and coverage without raw allocation, execution, account, or
source identifiers. Entry-event frequency does not establish intent, quality,
cause, edge, or advice.

## `number_of_exits`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-002 |
| Category | Execution Metrics |
| Subcategory | Allocation-event count |
| Canonical name | `number_of_exits` |
| Display name | Number of exits |
| Exact definition | In the declared eligible population, count once each unique current accepted allocation identity whose role is position-reducing: `reducing`, `closing`, or `flip_closing`. Deduplicate by stable allocation identity before presentation or grouping. A flip-closing allocation contributes one exit event to its closing lifecycle. Return a non-negative integer; an exact zero is valid only when the authorized covered population is complete and contains no qualifying allocation. |
| Distinction from related concepts | This counts allocation events, not display rows, raw source rows, Buy/Sell execution side, distinct execution IDs, exited quantity, final exits only, or lifecycle count. A partial reduction is an exit event but not a final-flat close. |
| Evidence classification | Directly observed accepted allocation identity/role; deterministically derived unique qualifying event count |
| Capability status | Planned |
| Result units | Non-negative integer allocation-event count in the declared compatible account/instrument/unit scope |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. When the request explicitly includes factual `legitimate_open` activity, count accepted reductions in a separate open-state partition; the absence of a final exit is not an error. `needs_decision`/incomplete activity remains visible coverage. |
| Fee handling | Not applicable. Fees do not change allocation-event identity or role. A combined P/L query separately retains its gross or fee-complete net basis and compatible currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: lifecycle construction event count.
- Narrower concepts: reducing events; closing events; flip-closing events.
- Commonly confused concepts: `exit_execution_count`, Sell execution count,
  exited quantity, final exit, trade count.
- Must not be merged with: `exit_execution_count`, `number_of_entries`,
  `scale_out_count`, or a final-flat lifecycle count.

Privacy and interpretation boundary: return the privacy-safe count, declared
scope, population, and coverage without raw allocation, execution, account, or
source identifiers. Exit-event frequency does not establish exit quality,
intent, cause, edge, or advice.

## `average_entry_price`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-003 |
| Category | Execution Metrics |
| Subcategory | Simple allocated-event price |
| Canonical name | `average_entry_price` |
| Display name | Average entry price |
| Exact definition | For every unique qualifying current accepted allocation event with role `opening`, `adding`, or `flip_opening`, take its exact accepted execution price once, sum those event prices, and divide by the qualifying event count. Every stable allocation event has equal weight regardless of allocated quantity. Preserve the exact rational and round only for display. A zero qualifying-event denominator is unavailable. |
| Distinction from related concepts | This is a simple allocation-event mean. Current analytics outputs named `average_entry_price` are quantity-weighted `ready_closed` aggregates and are not evidence for, aliases of, or duplicate truth for this planned canonical meaning. It is not weighted average entry price, first-entry price, execution-side Buy average, entry cost basis, market value, or intended/order price. |
| Evidence classification | Directly observed accepted allocation identity/role and execution price; deterministically derived exact simple mean |
| Capability status | Planned |
| Result units | Exact rational price per instrument unit in one compatible instrument/price-convention/currency partition; display at most two decimal places without changing the exact value |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may calculate the simple mean from its accepted entry allocations in a separate open-state partition. `needs_decision`, missing/conflicting price, role, currency, or unit facts produce partial/unavailable coverage rather than an invented price or zero. |
| Fee handling | Fees are excluded from the execution price mean. This is not cost basis after charges. A combined P/L result separately declares gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: entry allocation price aggregate.
- Narrower concepts: simple mean of opening, adding, and flip-opening event
  prices in one compatible price partition.
- Commonly confused concepts: current quantity-weighted analytics
  `average_entry_price`, `weighted_average_entry_price`, first-entry price,
  weighted-average open cost, order price.
- Must not be merged with: `weighted_average_entry_price`, current
  quantity-weighted `ready_closed` output, or `average_exit_price`.

Privacy and interpretation boundary: report the exact/rounded value, eligible
event count, compatible currency/unit scope, and coverage without raw execution
or account identifiers. A price mean does not prove execution quality,
slippage, cause, edge, or an advisable entry.

## `average_exit_price`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-004 |
| Category | Execution Metrics |
| Subcategory | Simple allocated-event price |
| Canonical name | `average_exit_price` |
| Display name | Average exit price |
| Exact definition | For every unique qualifying current accepted allocation event with role `reducing`, `closing`, or `flip_closing`, take its exact accepted execution price once, sum those event prices, and divide by the qualifying event count. Every stable allocation event has equal weight regardless of allocated quantity. Preserve the exact rational and round only for display. A zero qualifying-event denominator is unavailable. |
| Distinction from related concepts | This is a simple allocation-event mean. Current analytics outputs named `average_exit_price` are quantity-weighted `ready_closed` aggregates and are not evidence for, aliases of, or duplicate truth for this planned canonical meaning. It is not weighted average exit price, final-exit price, execution-side Sell average, realized P/L, market value, or intended/order price. |
| Evidence classification | Directly observed accepted allocation identity/role and execution price; deterministically derived exact simple mean |
| Capability status | Planned |
| Result units | Exact rational price per instrument unit in one compatible instrument/price-convention/currency partition; display at most two decimal places without changing the exact value |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may calculate the simple mean of its accepted reduction allocations in a separate open-state partition; it does not invent a final exit. `needs_decision`, missing/conflicting price, role, currency, or unit facts produce partial/unavailable coverage rather than an invented price or zero. |
| Fee handling | Fees are excluded from the execution price mean. This is not realized proceeds after charges. A combined P/L result separately declares gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: exit allocation price aggregate.
- Narrower concepts: simple mean of reducing, closing, and flip-closing event
  prices in one compatible price partition.
- Commonly confused concepts: current quantity-weighted analytics
  `average_exit_price`, `weighted_average_exit_price`, final-exit price,
  realized P/L, order price.
- Must not be merged with: `weighted_average_exit_price`, current
  quantity-weighted `ready_closed` output, or `average_entry_price`.

Privacy and interpretation boundary: report the exact/rounded value, eligible
event count, compatible currency/unit scope, and coverage without raw execution
or account identifiers. A price mean does not prove exit quality, slippage,
cause, edge, or an advisable exit.

## `weighted_average_entry_price`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-005 |
| Category | Execution Metrics |
| Subcategory | Quantity-weighted allocated price |
| Canonical name | `weighted_average_entry_price` |
| Display name | Weighted average entry price |
| Exact definition | For unique qualifying current accepted allocation events with role `opening`, `adding`, or `flip_opening`, sum each exact allocated quantity multiplied by its accepted execution price, then divide by the exact sum of those allocated quantities. The denominator must be positive. Preserve the exact numerator, denominator, and rational result; round only for display. |
| Distinction from related concepts | This weights allocation-event prices by exact allocated entry quantity. It is not the equal-event `average_entry_price`, first-entry price, execution-side Buy average, broker tax-lot basis, current marked value, intended/order price, or a cross-currency average. Existing quantity-weighted primitives are implementation evidence only and do not make this named language contract Supported. |
| Evidence classification | Directly observed accepted allocation identity/role, quantity, and execution price; deterministically derived exact quantity-weighted mean |
| Capability status | Planned |
| Result units | Exact rational price per instrument unit in one compatible instrument/price-convention/currency/unit partition; display at most two decimal places without changing the exact value |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may calculate the weighted entry price from accepted entry allocations in a separate open-state partition. `needs_decision`, missing/conflicting price, quantity, role, currency, unit, or a non-positive denominator returns partial/unavailable coverage, never zero or an estimate. |
| Fee handling | Fees are excluded. This is execution-derived allocated entry price, not charge-adjusted cost or broker tax-lot basis. A combined P/L result separately declares gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: entry allocation price aggregate.
- Narrower concepts: allocated entry notional numerator; entered allocated
  quantity denominator.
- Commonly confused concepts: `average_entry_price`, weighted-average open
  cost, entry notional, first-entry price, broker cost basis.
- Must not be merged with: `average_entry_price`,
  `weighted_average_exit_price`, or current analytics names without an explicit
  compatibility contract.

Privacy and interpretation boundary: return the exact/rounded price,
denominator coverage, compatible currency/unit scope, and privacy-safe coverage
without raw allocation/execution identifiers. The weighted result does not
establish execution quality, cause, edge, or advice.

## `weighted_average_exit_price`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-006 |
| Category | Execution Metrics |
| Subcategory | Quantity-weighted allocated price |
| Canonical name | `weighted_average_exit_price` |
| Display name | Weighted average exit price |
| Exact definition | For unique qualifying current accepted allocation events with role `reducing`, `closing`, or `flip_closing`, sum each exact allocated quantity multiplied by its accepted execution price, then divide by the exact sum of those allocated quantities. The denominator must be positive. Preserve the exact numerator, denominator, and rational result; round only for display. |
| Distinction from related concepts | This weights allocation-event prices by exact allocated exit quantity. It is not the equal-event `average_exit_price`, final-exit price, execution-side Sell average, realized proceeds after charges, intended/order price, or a cross-currency average. Existing quantity-weighted primitives are implementation evidence only and do not make this named language contract Supported. |
| Evidence classification | Directly observed accepted allocation identity/role, quantity, and execution price; deterministically derived exact quantity-weighted mean |
| Capability status | Planned |
| Result units | Exact rational price per instrument unit in one compatible instrument/price-convention/currency/unit partition; display at most two decimal places without changing the exact value |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may calculate the weighted price of accepted reductions in a separate open-state partition; it never invents a final exit. `needs_decision`, missing/conflicting price, quantity, role, currency, unit, or a non-positive denominator returns partial/unavailable coverage, never zero or an estimate. |
| Fee handling | Fees are excluded. This is execution-derived allocated exit price, not charge-adjusted proceeds. A combined P/L result separately declares gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: exit allocation price aggregate.
- Narrower concepts: allocated exit notional numerator; exited allocated
  quantity denominator.
- Commonly confused concepts: `average_exit_price`, final-exit price, exit
  notional, realized P/L, net proceeds.
- Must not be merged with: `average_exit_price`,
  `weighted_average_entry_price`, or current analytics names without an
  explicit compatibility contract.

Privacy and interpretation boundary: return the exact/rounded price,
denominator coverage, compatible currency/unit scope, and privacy-safe coverage
without raw allocation/execution identifiers. The weighted result does not
establish execution quality, cause, edge, or advice.

## `entry_execution_count`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-007 |
| Category | Execution Metrics |
| Subcategory | Distinct execution-ID count |
| Canonical name | `entry_execution_count` |
| Display name | Entry execution count |
| Exact definition | Across the full declared eligible scope, count each distinct current accepted execution ID once when it carries at least one qualifying allocation with role `opening`, `adding`, or `flip_opening`. Deduplicate before grouping/presentation so repeated display rows or multiple qualifying allocations cannot repeat the execution. One flip execution may also qualify for `exit_execution_count`, but it remains one scope-wide execution ID within this metric. Return a non-negative integer; an exact zero is valid only for a complete covered scope with no qualifying execution. |
| Distinction from related concepts | This counts distinct current execution IDs, not stable allocation events, source rows, display rows, Buy execution side, entered quantity, or lifecycle count. It may differ from `number_of_entries` when one execution carries multiple qualifying allocation identities. |
| Evidence classification | Directly observed current accepted execution identity and allocation roles; deterministically derived distinct qualifying execution count |
| Capability status | Planned |
| Result units | Non-negative integer distinct-execution count across the declared server-authorized scope |
| Open-trade support | Default analytics use executions allocated to eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may count its accepted qualifying executions in a separate open-state partition. `needs_decision`/incomplete chains remain visible coverage and do not become resolved entry executions through inference. |
| Fee handling | Not applicable. Fees do not alter execution identity or entry-role qualification. A combined P/L query separately retains gross or fee-complete net basis and compatible currency. |
| Version | 1 |

### Related Concepts

- Broader concept: execution activity count.
- Narrower concepts: distinct executions carrying opening, adding, or
  flip-opening allocations.
- Commonly confused concepts: `number_of_entries`, total execution count, Buy
  execution count, entered quantity, trade count.
- Must not be merged with: `number_of_entries`, `exit_execution_count`,
  `scale_in_count`, or source-record count.

Privacy and interpretation boundary: expose only the privacy-safe count,
declared scope, and coverage. Do not expose current execution IDs or use the
count to infer intent, quality, causation, edge, or advice.

## `exit_execution_count`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-008 |
| Category | Execution Metrics |
| Subcategory | Distinct execution-ID count |
| Canonical name | `exit_execution_count` |
| Display name | Exit execution count |
| Exact definition | Across the full declared eligible scope, count each distinct current accepted execution ID once when it carries at least one qualifying allocation with role `reducing`, `closing`, or `flip_closing`. Deduplicate before grouping or presentation so repeated display rows or multiple qualifying allocations cannot repeat the execution. One flip execution may also qualify for `entry_execution_count`, but it remains one scope-wide execution ID within this metric. Return a non-negative integer; exact zero is valid only for a complete covered scope with no qualifying execution. |
| Distinction from related concepts | This counts distinct current execution IDs, not stable allocation events, source rows, display rows, Sell execution side, exited quantity, final exits, or lifecycle count. It may differ from `number_of_exits` when one execution carries multiple qualifying allocation identities. |
| Evidence classification | Directly observed current accepted execution identity and allocation roles; deterministically derived distinct qualifying execution count |
| Capability status | Planned |
| Result units | Non-negative integer distinct-execution count across the declared server-authorized scope |
| Open-trade support | Default analytics use executions allocated to eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may count its accepted qualifying reduction executions in a separate open-state partition; it does not require or invent a final exit. `needs_decision`/incomplete chains remain visible coverage and do not become resolved exit executions through inference. |
| Fee handling | Not applicable. Fees do not alter execution identity or exit-role qualification. A combined P/L query separately retains gross or fee-complete net basis and compatible currency. |
| Version | 1 |

### Related Concepts

- Broader concept: execution activity count.
- Narrower concepts: distinct executions carrying reducing, closing, or
  flip-closing allocations.
- Commonly confused concepts: `number_of_exits`, total execution count, Sell
  execution count, exited quantity, final-exit count, trade count.
- Must not be merged with: `number_of_exits`, `entry_execution_count`,
  `scale_out_count`, or source-record count.

Privacy and interpretation boundary: expose only the privacy-safe count,
declared scope, and coverage. Do not expose current execution IDs or use the
count to infer intent, quality, causation, edge, or advice.

## `scale_in_count`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-009 |
| Category | Execution Metrics |
| Subcategory | Allocation-role event count |
| Canonical name | `scale_in_count` |
| Display name | Scale-in count |
| Exact definition | In the declared eligible population, count once each unique current accepted allocation identity whose role is exactly `adding`. Deduplicate by stable allocation identity before presentation or grouping. Return a non-negative integer; exact zero is valid only when the authorized covered population is complete and contains no qualifying adding allocation. |
| Distinction from related concepts | This counts stable `adding` allocation events. It does not count Buy execution side, all entry events, opening or flip-opening allocations, distinct execution IDs, added quantity, or increases inferred from price/position display rows. Short-position adds qualify through the accepted `adding` role, not Sell-side wording. |
| Evidence classification | Directly observed accepted allocation identity and `adding` role; deterministically derived unique qualifying event count |
| Capability status | Planned |
| Result units | Non-negative integer allocation-event count in the declared compatible account/instrument/unit scope |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may count its accepted `adding` allocations in a separate open-state partition. `needs_decision`/incomplete chains remain visible coverage and are not silently classified as resolved scale-ins. |
| Fee handling | Not applicable. Fees do not alter stable allocation identity or the accepted `adding` role. A combined P/L query separately retains gross or fee-complete net basis and compatible currency. |
| Version | 1 |

### Related Concepts

- Broader concept: position-increasing lifecycle construction.
- Narrower concepts: stable accepted `adding` allocation events for long or
  short lifecycles.
- Commonly confused concepts: `number_of_entries`, `entry_execution_count`,
  Buy count, added quantity, position-size increase.
- Must not be merged with: opening/flip-opening count,
  `entry_execution_count`, `scale_out_count`, or execution-side activity.

Privacy and interpretation boundary: report only the privacy-safe event count,
scope, state partition, and coverage. Scaling in does not establish conviction,
discipline, quality, motive, causation, edge, or advice.

## `scale_out_count`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-010 |
| Category | Execution Metrics |
| Subcategory | Allocation-role event count |
| Canonical name | `scale_out_count` |
| Display name | Scale-out count |
| Exact definition | In the declared eligible population, count once each unique current accepted allocation identity whose role is exactly `reducing`. Deduplicate by stable allocation identity before presentation or grouping. Return a non-negative integer; exact zero is valid only when the authorized covered population is complete and contains no qualifying reducing allocation. |
| Distinction from related concepts | This counts stable `reducing` allocation events. It does not count Sell execution side, every exit event, closing or flip-closing allocations, distinct execution IDs, reduced quantity, or reductions inferred from price/position display rows. Short-position reductions qualify through the accepted `reducing` role, not Buy-side wording. |
| Evidence classification | Directly observed accepted allocation identity and `reducing` role; deterministically derived unique qualifying event count |
| Capability status | Planned |
| Result units | Non-negative integer allocation-event count in the declared compatible account/instrument/unit scope |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may count its accepted `reducing` allocations in a separate open-state partition without inventing a final close. `needs_decision`/incomplete chains remain visible coverage and are not silently classified as resolved scale-outs. |
| Fee handling | Not applicable. Fees do not alter stable allocation identity or the accepted `reducing` role. A combined P/L query separately retains gross or fee-complete net basis and compatible currency. |
| Version | 1 |

### Related Concepts

- Broader concept: position-reducing lifecycle construction.
- Narrower concepts: stable accepted `reducing` allocation events for long or
  short lifecycles.
- Commonly confused concepts: `number_of_exits`, `exit_execution_count`, Sell
  count, reduced quantity, final-close count.
- Must not be merged with: closing/flip-closing count,
  `exit_execution_count`, `scale_in_count`, or execution-side activity.

Privacy and interpretation boundary: report only the privacy-safe event count,
scope, state partition, and coverage. Scaling out does not establish prudence,
discipline, quality, motive, causation, edge, or advice.

## `partial_exit_percentage`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-011 |
| Category | Execution Metrics |
| Subcategory | Partial-reduction event rate |
| Canonical name | `partial_exit_percentage` |
| Display name | Partial exit percentage |
| Exact definition | In one declared eligible population, deduplicate by stable allocation identity. The numerator is the exact count of qualifying `reducing` allocation events. The denominator is the exact count of all qualifying position-reducing allocation events with roles `reducing`, `closing`, or `flip_closing`. Return the reduced exact ratio and its percentage representation. A zero denominator is unavailable, never zero percent. |
| Distinction from related concepts | This is an event-rate percentage, not the proportion of exited quantity, the percentage of the position reduced, a distinct execution-ID rate, Sell-side percentage, or final-close rate. A quantity-rate interpretation is a separate concept and is never inferred from this name. |
| Evidence classification | Directly observed accepted allocation identity/role; deterministically derived exact event-count ratio |
| Capability status | Planned |
| Result units | Exact dimensionless ratio and percentage, with exact numerator/denominator event counts retained; display rounding does not alter the ratio |
| Open-trade support | Default analytics use eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may calculate the event rate from its accepted reducing/closing-role evidence in a separate open-state partition; no final exit is invented. `needs_decision`/incomplete or missing-role activity remains visible partial/unavailable coverage. |
| Fee handling | Not applicable. Fees do not alter allocation role or event-rate membership. A combined P/L query separately retains gross or fee-complete net basis and compatible currency. |
| Version | 1 |

### Related Concepts

- Broader concept: position-reducing event composition.
- Narrower concepts: reducing-event numerator; all reducing/closing/
  flip-closing event denominator.
- Commonly confused concepts: partial-exit quantity percentage,
  `scale_out_count`, `number_of_exits`, exit execution rate, position-reduced
  percentage.
- Must not be merged with: any quantity-rate metric, `scale_out_count`, or
  `exit_execution_count`.

Privacy and interpretation boundary: return the exact ratio, numerator,
denominator, declared scope, and coverage without raw allocation/execution
identifiers. A higher or lower event rate does not establish exit quality,
discipline, motive, causation, edge, or advice.

## `position_flips`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-012 |
| Category | Execution Metrics |
| Subcategory | Flip execution count |
| Canonical name | `position_flips` |
| Display name | Position flips |
| Exact definition | Across the declared current lifecycle-candidate scope, count each distinct current accepted execution ID once when that same execution carries both an accepted `flip_closing` allocation for one lifecycle and an accepted `flip_opening` allocation for the adjacent lifecycle. Deduplicate by current execution ID across the full scope. Return a non-negative integer; exact zero is valid only for a complete covered scope with no qualifying flip execution. |
| Distinction from related concepts | A flip is one execution spanning the zero boundary: it closes one lifecycle and opens the adjacent lifecycle. It may contribute one exit-role event and one entry-role event, and may qualify for both entry/exit execution-count sets, but it remains one scope-wide flip execution. It is not two executions, an ordinary close followed by an unrelated later open, execution side, or reversal motive. |
| Evidence classification | Directly observed current accepted execution identity and paired flip allocation roles; deterministically derived unique flip-execution count |
| Capability status | Planned |
| Result units | Non-negative integer distinct flip-execution count in the declared server-authorized scope |
| Open-trade support | Default analytics retain eligible `ready_closed` closing lifecycles and expose the adjacent lifecycle state. A flip whose new adjacent lifecycle is factually `legitimate_open` remains one flip with separate open-state coverage. A `needs_decision`/incomplete side of the boundary prevents a resolved flip claim and remains visible partial/unavailable coverage. |
| Fee handling | Fees do not determine flip identity. Any allocated fee calculation remains a separate exact conserving contract across the paired allocations; a combined P/L result retains its gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: position lifecycle boundary event.
- Narrower concepts: paired `flip_closing` allocation; paired `flip_opening`
  allocation; one shared current execution identity.
- Commonly confused concepts: separate close/re-entry executions, reversal,
  `number_of_entries`, `number_of_exits`, entry/exit execution counts.
- Must not be merged with: two-execution close/re-entry, execution side,
  repeat attempt, or direction-change motive.

Privacy and interpretation boundary: expose only the privacy-safe flip count,
scope, adjacent-state coverage, and exact limitations. Never expose execution
IDs or infer reversal intent, quality, causation, edge, or advice.

## `repeat_attempts`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-013 |
| Category | Execution Metrics |
| Subcategory | Lifecycle repeat count |
| Canonical name | `repeat_attempts` |
| Display name | Repeat attempts |
| Exact definition | First build the complete server-authorized current lifecycle-candidate sequence before applying analytic date, result, or projection-state filters. Partition candidates by authorized account, stable instrument, and account-local entry date rendered from first-entry UTC in that account's IANA timezone. Within each partition, order every candidate by first-entry raw UTC instant then stable round-trip ID. The first zero-to-nonzero lifecycle is the initial attempt; each later zero-to-nonzero lifecycle is one repeat attempt. `needs_decision` and incomplete candidates remain state-labelled barriers. Report the exact repeat count before the first barrier and partial/unavailable coverage for the barrier and later segment; never skip a barrier or renumber later candidates across it. |
| Distinction from related concepts | This counts repeated zero-to-nonzero lifecycles, not execution rows, entry allocations, same-side fills, scale-ins, trades after an analytic filter removed predecessors, or a behavioral conclusion. A date/result/state filter selects output only after the full candidate order and attempt positions are fixed. |
| Evidence classification | Directly observed accepted first-entry instant, stable lifecycle/instrument/account identity, account IANA timezone, and projection state; deterministically derived partition, order, barrier, and repeat count |
| Capability status | Planned |
| Result units | Non-negative integer repeat-attempt count per authorized account/stable-instrument/account-local-entry-date partition, with exact pre-barrier and partial/unavailable coverage |
| Open-trade support | The sequence includes `ready_closed`, factually `legitimate_open`, `needs_decision`, and incomplete current lifecycle candidates before analytic state filters. A factual open candidate keeps its state label; a decision/incomplete candidate is a barrier. Neither is silently treated as a realized closed repeat. |
| Fee handling | Not applicable to attempt identity or ordering. If repeat results are later compared by P/L/outcome, the separate query must use one declared gross or fee-complete net basis and cannot filter the predecessor/barrier out before sequencing. |
| Version | 1 |

### Related Concepts

- Broader concept: ordered lifecycle activity.
- Narrower concepts: initial attempt; second/later attempt; exact pre-barrier
  repeat count; state-labelled barrier coverage.
- Commonly confused concepts: `trade_sequence`, entry count, execution count,
  scale-in count, rapid re-entry, overtrading, revenge trading.
- Must not be merged with: behavior/motive labels, execution rows,
  `scale_in_count`, or a post-filter trade ordinal.

Privacy and interpretation boundary: report only privacy-safe partition labels,
count, ordering rule, and coverage. A repeat attempt does not establish
overtrading, revenge, persistence, quality, causation, edge, or advice.

## `trade_sequence`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-014 |
| Category | Execution Metrics |
| Subcategory | Lifecycle ordinal sequence |
| Canonical name | `trade_sequence` |
| Display name | Trade sequence |
| Exact definition | First build the complete server-authorized current lifecycle-candidate sequence before applying analytic date, result, or projection-state filters. Unconditionally partition every candidate by server-authorized account, stable instrument, and account-local entry date rendered from first-entry UTC in the account IANA timezone. Order every candidate within that fixed partition by first-entry raw UTC instant then stable round-trip ID and assign its stable one-based ordinal in the pre-filter sequence. A non-day-specific request cannot bypass, broaden, or replace this partition. Filters may select displayed candidates but cannot remove a predecessor/barrier or renumber later candidates across it. `needs_decision` and incomplete candidates remain state-labelled barriers; ordinals/results before the first barrier are exact, while the barrier and later segment carry partial/unavailable coverage and are never silently presented as an uninterrupted exact sequence. |
| Distinction from related concepts | This is the preserved pre-filter lifecycle ordinal and state sequence within the fixed account/stable-instrument/account-local-entry-date partition, not execution order within a trade, allocation sequence, source-row ordinal, filtered row number, repeat-attempt count, outcome streak, or causal narrative. It does not skip open/decision/incomplete candidates or use non-day-specific wording to create a broader or cleaner sequence. |
| Evidence classification | Directly observed accepted first-entry instant, stable lifecycle/account/instrument identity, account IANA timezone, and projection state; deterministically derived partition, UTC/stable-ID order, ordinal, and barrier coverage |
| Capability status | Planned |
| Result units | One-based lifecycle ordinal plus state-labelled sequence/coverage within the declared authorized partition |
| Open-trade support | The current candidate sequence is built across `ready_closed`, factually `legitimate_open`, `needs_decision`, and incomplete candidates before analytic state filters. Open candidates retain their factual state; decision/incomplete candidates remain barriers. No candidate is reclassified as realized or removed to renumber later results. |
| Fee handling | Not applicable to sequence identity or order. A composed P/L/outcome sequence separately declares gross or fee-complete net basis after the pre-filter lifecycle sequence is fixed. |
| Version | 1 |

### Related Concepts

- Broader concept: deterministic lifecycle ordering.
- Narrower concepts: pre-filter candidate order; stable one-based ordinal;
  state-labelled barrier; exact pre-barrier segment.
- Commonly confused concepts: `repeat_attempts`, execution sequence,
  allocation ordinal, outcome streak, displayed row number, chronological
  source order.
- Must not be merged with: a filtered/rebased row number, execution order,
  outcome streak, or behavioral narrative.

Privacy and interpretation boundary: report only privacy-safe sequence
positions, scope, state, and coverage; stable internal IDs remain tie-breakers
but are not exposed. Sequence position does not establish quality, motive,
causation, edge, or advice.

## `average_shares_per_execution`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-015 |
| Category | Execution Metrics |
| Subcategory | Distinct-execution quantity mean |
| Canonical name | `average_shares_per_execution` |
| Display name | Average shares per execution |
| Exact definition | In the declared eligible scope, select distinct current accepted executions whose instrument is Stock with multiplier one and whose quantities share one compatible share-unit convention. Count each execution once, including a flip execution only once. Sum each selected execution's exact absolute quantity once and divide by the distinct selected execution count. Preserve the exact numerator, denominator, and rational result; a zero denominator is unavailable, never zero shares. |
| Distinction from related concepts | This averages one full execution quantity per distinct execution ID. It is not entered or exited allocated quantity, average allocation size, contracts per execution, mixed-unit activity, maximum position size, current open quantity, or dollar exposure. Allocation splitting and participation in adjacent flip lifecycles do not duplicate the execution quantity. |
| Evidence classification | Directly observed current accepted execution identity, exact quantity, instrument type, multiplier, and unit convention; deterministically derived deduplicated exact arithmetic mean |
| Capability status | Planned |
| Result units | Exact rational Stock shares per distinct execution in one compatible multiplier-one share-unit partition; display at most two decimal places without changing the exact value |
| Open-trade support | Default analytics use distinct executions allocated to eligible `ready_closed` lifecycles. An explicit factual `legitimate_open` request may calculate a separate open-state mean from its accepted executions without duplicating a flip or allocation split. `needs_decision`, incomplete, unsupported-instrument, non-unit-multiplier, or mixed-unit activity remains partial/unavailable coverage and is never treated as Stock shares. |
| Fee handling | Not applicable. Fees do not alter execution quantity or the distinct-execution denominator. A combined P/L query separately retains gross or fee-complete net basis and compatible currency. |
| Version | 1 |

### Related Concepts

- Broader concept: execution quantity distribution.
- Narrower concepts: exact Stock-share numerator; distinct current accepted
  execution denominator.
- Commonly confused concepts: average allocation quantity, entered shares,
  exited shares, average position size, contracts per execution, total volume.
- Must not be merged with: Category 6 position-size metrics,
  entered/exited quantity, mixed-unit execution averages, or dollar exposure.

Privacy and interpretation boundary: return only the privacy-safe exact/rounded
mean, numerator/denominator coverage, and compatible unit scope. Do not expose
execution/account/source IDs or infer conviction, quality, causation, edge, or
advice from execution size.

## `execution_duration`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-016 |
| Category | Execution Metrics |
| Subcategory | Holding-duration terminology alias |
| Canonical name | `execution_duration` |
| Display name | Execution duration |
| Exact definition | Terminology and selection alias to Category 7 `hold_duration` for an eligible `ready_closed` lifecycle. Select the same single deterministic result: final-flat accepted allocation raw UTC instant minus first position-opening accepted allocation raw UTC instant, returned as exact elapsed seconds. Category 7 owns the endpoint selection and UTC arithmetic; Category 8 performs no duplicate calculation or alternate formula. |
| Distinction from related concepts | It is not order-submission-to-fill duration, an order/fill lifecycle, first-to-last activity span, time to first exit, local-clock subtraction, market-hours duration, or open-position age. The Category 8 name selects Category 7's existing meaning and cannot produce a second duration truth. |
| Evidence classification | Directly observed accepted endpoint instants and allocation roles through Category 7; deterministically derived only by the Category 7 `hold_duration` calculation; terminology alias in Category 8 |
| Capability status | Planned |
| Result units | Exact elapsed seconds from Category 7, with optional display formatting that does not alter the value; endpoint display may identify the server-authorized account IANA timezone |
| Open-trade support | No completed duration exists for `legitimate_open`; open age is a separate as-of metric and is never selected by this alias. `needs_decision`, incomplete, missing, conflicting, or reversed endpoints remain visible partial/unavailable coverage. Only eligible `ready_closed` lifecycles produce the aliased value. |
| Fee handling | Not applicable. Duration is independent of fees and currency. A combined P/L/outcome query separately retains its compatible account/timezone/currency partition and gross or fee-complete net basis. |
| Version | 1 |

### Related Concepts

- Broader concept: lifecycle duration terminology.
- Narrower concepts: Category 7 first-entry/final-exit raw UTC elapsed
  duration selection.
- Commonly confused concepts: order duration, fill duration, last-activity
  span, `time_to_first_exit`, open age, local-clock difference.
- Must not be merged with: a duplicate duration calculation, order/fill
  lifecycle duration, last-activity span, or open-position age.

Privacy and interpretation boundary: return Category 7's privacy-safe duration
and coverage only; raw internal execution IDs remain private. Duration does not
establish patience, efficiency, quality, causation, edge, or advice.

## `entry_to_exit_quantity_reconciliation`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-017 |
| Category | Execution Metrics |
| Subcategory | Allocation quantity conservation |
| Canonical name | `entry_to_exit_quantity_reconciliation` |
| Display name | Entry-to-exit quantity reconciliation |
| Exact definition | For one current lifecycle in a compatible unit partition, publish three exact values from accepted allocations: entered quantity is the sum of position-increasing quantities with roles `opening`, `adding`, and `flip_opening`; exited quantity is the sum of position-reducing quantities with roles `reducing`, `closing`, and `flip_closing`; residual quantity is entered quantity minus exited quantity. A reconciled `ready_closed` lifecycle has exact residual zero. A factually `legitimate_open` lifecycle has an exact positive absolute residual equal to its factual remaining open quantity, with direction supplying the signed quantity. A `needs_decision` or incomplete lifecycle returns unresolved coverage rather than a reconciled value. Every accepted execution/allocation relationship must retain exact quantity conservation. |
| Distinction from related concepts | This is an allocation-conservation result, not P/L, trade outcome, current market value, unrealized P/L, broker tax-lot reconciliation, inferred opening inventory, or a license to repair missing evidence. Residual zero means quantity closure only; it does not prove complete prices, fees, or source coverage. |
| Evidence classification | Directly observed accepted allocation identities, roles, quantities, direction, and projection state; deterministically derived entered/exited sums, residual, and state-consistency check |
| Capability status | Planned |
| Result units | Exact entered, exited, and residual quantities in one compatible instrument/unit partition, plus explicit `ready_closed`, `legitimate_open`, or unresolved coverage state |
| Open-trade support | Yes only for factually `legitimate_open`, where the exact residual must agree with factual remaining quantity and direction. Eligible `ready_closed` requires exact zero residual. `needs_decision`, incomplete, conflicting, missing-opening-inventory, or non-conserving evidence remains unresolved partial/unavailable coverage and is never repaired, balanced, or forced to zero. |
| Fee handling | Not applicable to quantity conservation. Fees do not change entered/exited quantity. A combined P/L query separately retains exact fee allocation, gross/net basis, and compatible currency coverage. |
| Version | 1 |

### Related Concepts

- Broader concept: lifecycle quantity integrity.
- Narrower concepts: entered position-increasing quantity; exited
  position-reducing quantity; exact residual; state-consistency result.
- Commonly confused concepts: remaining open quantity, maximum position size,
  net execution-side volume, realized outcome, import/account reconciliation.
- Must not be merged with: `remaining_open_quantity`, P/L reconciliation,
  inferred opening inventory, or a Data Decision resolution action.

Privacy and interpretation boundary: report only exact privacy-safe quantities,
state, and coverage. Never expose raw allocation/execution/source identifiers,
invent a repair, resolve a Data Decision, or infer quality, causation, edge, or
advice from reconciliation state.

## `unmatched_executions`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-018 |
| Category | Execution Metrics |
| Subcategory | Source/execution reconciliation coverage |
| Canonical name | `unmatched_executions` |
| Display name | Unmatched executions |
| Exact definition | Produce a non-overlapping labelled coverage bundle after deduplicating by stable underlying member identity. Apply deterministic precedence: first, label (c) each distinct underlying provisional reconciliation candidate member; its Data Decision state is metadata, and the Data Decision itself is never a member or count. Second, label (b) each accepted execution lacking required allocation only when that stable member is not already classified in (c). Third, label (a) each source record unable to form an accepted execution only when its stable member is not represented in (c). Never count one underlying member more than once within or across labels. Preserve each label's exact count and coverage rather than collapsing the bundle to an ambiguous scalar. |
| Distinction from related concepts | This is privacy-safe evidence coverage, not a count of Data Decision rows, excluded executions, unsupported asset classes, duplicate trades, open positions, or automatically repairable records. A decision state does not become a member, prove a match, or authorize a correction. The `unmatched_executions` name does not imply that every labelled member is already an accepted execution. |
| Evidence classification | Directly observed source-record, accepted-execution, allocation, provisional-candidate, and Data Decision metadata states; deterministically derived stable-member deduplication, exclusive precedence labels, and counts |
| Capability status | Planned |
| Result units | Three separately labelled non-negative member counts with coverage/reasons: (c) provisional candidate members, (b) unallocated accepted executions not in (c), and (a) non-execution-forming source records not represented in (c) |
| Open-trade support | This is coverage across current source/execution/reconciliation state, not a realized/open performance population. A member associated with `ready_closed`, factually `legitimate_open`, `needs_decision`, or incomplete evidence retains that state as metadata where authorized; the metric never reclassifies it as resolved, realized, or legitimate open. |
| Fee handling | Not applicable to bundle membership. Missing/conflicting fee facts remain their own fee-coverage state and do not create, remove, or match an underlying member unless an approved reconciliation contract explicitly requires that allocation fact. |
| Version | 1 |

### Related Concepts

- Broader concept: Journal source/execution data-quality coverage.
- Narrower concepts: provisional reconciliation candidate members; accepted
  executions lacking required allocation; source records unable to form an
  accepted execution.
- Commonly confused concepts: Data Decision count, excluded execution count,
  unsupported-source count, duplicate trade count, open-position count.
- Must not be merged with: Data Decision rows, a single overlapping unmatched
  scalar, automatic-match output, or execution correction actions.

Authorization, attribution, privacy, and interpretation boundary: apply only
filters supported by each source/member's factual attribution. Where finer
date/instrument/state attribution is unavailable, return bounded
server-authorized account-scope coverage rather than silently filtering the
member away. Never expose raw source, execution, candidate, decision, account,
or broker identifiers; never turn a Data Decision into a match or infer cause,
quality, blame, or advice from unmatched coverage.

## `remaining_open_quantity`

| Field | Value |
|---|---|
| Inventory ID | C8-EXEC-019 |
| Category | Execution Metrics |
| Subcategory | Legitimate-open current quantity |
| Canonical name | `remaining_open_quantity` |
| Display name | Remaining open quantity |
| Exact definition | For each current projection factually classified `legitimate_open`, publish its exact current signed quantity and exact absolute quantity from the accepted conserving allocation path in one compatible instrument/unit partition. The signed value retains direction (positive long, negative short under the accepted convention); the absolute value reports magnitude. A selection with no factually legitimate-open projection returns valid empty coverage, not an invented per-lifecycle zero. |
| Distinction from related concepts | This is factual current open quantity only. It is not a `needs_decision` nonzero residual, inferred opening balance, entered quantity, maximum position size, execution-side net volume, marked market value, unrealized P/L, or a closed lifecycle's zero position. |
| Evidence classification | Directly observed accepted allocation quantities, direction, current projection state, and unit convention; deterministically derived exact signed and absolute current quantity |
| Capability status | Planned |
| Result units | Exact signed and absolute instrument quantity in one compatible unit partition, with explicit factual `legitimate_open` state and coverage |
| Open-trade support | Required: only factually `legitimate_open` projections are eligible. `ready_closed` is not returned as an open row. `needs_decision`, incomplete, conflicting, unsupported-unit, or inferred-opening-balance candidates remain separate partial/unavailable coverage and are never promoted to legitimate open. |
| Fee handling | Not applicable. Fees do not change factual open quantity. No unrealized P/L is calculated without separately accepted current market-price and valuation facts. |
| Version | 1 |

### Related Concepts

- Broader concept: factual open-position lifecycle state.
- Narrower concepts: signed current quantity; absolute current quantity;
  compatible unit partition.
- Commonly confused concepts: reconciliation residual, entered quantity,
  maximum position size, open-position cost basis, market value, unrealized
  P/L.
- Must not be merged with: a `needs_decision` remainder, inferred opening
  inventory, `entry_to_exit_quantity_reconciliation`, or unrealized P/L.

Privacy and interpretation boundary: report only privacy-safe ticker/group
context, exact quantity, state, and coverage authorized for the requester.
Never expose account/source/execution identifiers or infer risk suitability,
quality, causation, edge, or advice from the remaining quantity.

---

# 6. Language Registry Deliverable

Batch 1 through final Batch 4 contain all nineteen approved and locked Version
1 registries in exact canonical order: `C8-EXEC-001` through `C8-EXEC-019`.
Every target remains `Planned`; these language records do not expose a Chat
route or convert existing Journal primitives into supported named contracts.

## `number_of_entries` Language Registry

### Exact Definition

Count each unique current accepted allocation identity once when its role is
`opening`, `adding`, or `flip_opening` in the declared eligible population.
This is an allocation-event count, not an execution-side or execution-ID count.
Long Buy and short Sell events qualify only through an accepted increasing
role; execution side never determines entry membership. A flip-opening role is
an entry event in its new adjacent lifecycle.

### Formal Wording

- "number of position-increasing allocation events"
- "count of accepted entry allocation events"

### Normal Conversational Wording

- "How many entries did I make?"
- "How many times did I enter these trades?"

### Trader Slang

- "How many times did I get in?"
- "Count my opens and adds" maps to qualifying entry roles, not Buy side.

### Abbreviations

- `entry cnt`, `# entries`, and `ent count`.
- `NVDA ent cnt` treats `NVDA` as a ticker token only after authorized symbol
  validation; `EC` alone is too ambiguous.

### Common Misspellings

- `numbr of entries`
- `entrys count`

### Noisy or Incomplete Input

- `AAPL entries pls`
- `how many ins last wk` requires validated ticker/date interpretation and the
  account IANA timezone.

### Singular and Plural Forms

- Singular: "one entry event".
- Plural: "entries" or "entry events"; neither means executions by default.

### Full Questions

- "How many entry allocation events were in eligible closed NVDA trades?"
- "How many entries were recorded for the selected trade?"

### Commands

- "Count entry events for the selected eligible population."
- "Show the number of entries by validated ticker."

### Sentence Fragments

- "entry event count"
- "TSLA entries, selected period"

### Follow-Up Wording

- "What about the open positions?" adds a separately labelled factual
  `legitimate_open` partition without changing event identity.
- "And for NVDA?" reuses only trusted prior scope/basis and validates `NVDA`.

### Correction Wording

- "I meant allocation entry events, not entry executions."
- "Count adds too, not just the first opening."

### Comparison Wording

- "Compare entry-event counts for the two authorized ticker groups."
- Comparison retains the same role, population, and coverage definition.

### Ranking Wording

- "Rank validated tickers by number of entry events."
- Deterministic ties wait for the approved ranking contract.

### Negated Wording

- "Count entries, not Buy executions."
- "Show entry events without `needs_decision` values, but keep decision
  coverage visible."

### Exclusion Wording

- "Count entries excluding the validated selected ticker."
- "Exclude factual open activity from values" keeps open coverage separate.

### Multi-Filter Wording

- "Count entry events for eligible closed long AAPL lifecycles in the selected
  account-local period."

### Multi-Part Question Wording

- "Show number of entries and entry execution count for NVDA" returns two
  separately labelled metrics and never merges them.

### Ambiguous Wording

- "Entries" may mean allocation events, distinct execution IDs, first entries,
  execution-side buys/sells, or manual Journal rows.
- "How many times in?" needs a count-grain clarification without trusted
  canonical context.

### Negative Examples

These examples must not map to this concept.

- "How many Buy executions?" is execution-side activity.
- "How many shares did I enter?" is Category 6 entered quantity.
- "Add an entry" is a protected Journal-write request.

### Context Requirements

Require server-authorized account scope and a trusted selected lifecycle or
validated eligible population. Date filters/rendering use the account IANA
timezone; role selection comes only from current accepted allocations.

### Required Data

- Current accepted execution/allocation versions and stable allocation IDs.
- Roles `opening`, `adding`, and `flip_opening`, projection state, authorized
  scope, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Compatible currency only when combined with money/outcome results.

### Valid Filters

- Only validated Journal filters over authorized account, lifecycle state,
  ticker/instrument, direction, provenance, and account-local date range.
- Filters cannot turn execution side or display rows into allocation roles.

### Valid Groupings

- Approved account, ticker/instrument, direction, provenance, date/time, and
  lifecycle groupings when their owning categories validate them.
- Group after stable allocation-identity deduplication.

### Valid Operators

- Exact count, equality/threshold filtering, comparison, grouping, and ranking
  after Categories 12/14 validate the operator.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Buy/Sell-side substitution, execution-ID count substitution, mixed
  unauthorized accounts, hidden `needs_decision`, invented roles, writes,
  raw private identifier exposure, prediction, causation, or advice.

### Default Interpretation

The explicit canonical target counts unique qualifying allocation identities
for all three position-increasing roles in eligible `ready_closed` lifecycles.
Generic "entries" has no silent event-versus-execution default when ambiguous.

### Clarification Conditions

Clarify only when wording does not distinguish allocation events from distinct
entry execution IDs or execution-side activity and trusted context does not
already select this canonical metric.

### Recommended Clarification Wording

- "Do you mean entry allocation events or distinct entry executions?"

### Unsupported Conditions

- Missing/conflicting allocation identity or role, unauthorized scope,
  unsupported filter attribution, or unresolved chain required for the value.
- Requests to infer motive, quality, cause, edge, or a recommended entry count.

### Target Analytics Tool or Query Capability

- Planned Category 8 metric over read-only `JournalAnalyticsFactSet`, current
  allocation/population builder, exact counter, coverage contract, and
  validated `journal_analytics_query_v1` successor/extension.
- Existing allocation primitives do not make this named contract Supported;
  AI Chat interpretation/runtime is unimplemented.

### Result Units

- Non-negative integer allocation-event count plus population and coverage.
  Exact zero requires a complete covered eligible population.

### Fee Handling

- Not applicable. Combined P/L/outcome requests retain their separate gross or
  fee-complete net basis and compatible currency partition.

### Open-Trade Handling

- Default values use eligible `ready_closed`. Explicit factual
  `legitimate_open` activity is returned separately; `needs_decision` and
  incomplete chains remain visible coverage, never inferred values.

### Sample-Size Considerations

- An exact zero is valid only with complete coverage; empty/unavailable is not
  zero. Small counts are descriptive and do not establish behavior or advice.

## `number_of_exits` Language Registry

### Exact Definition

Count each unique current accepted allocation identity once when its role is
`reducing`, `closing`, or `flip_closing` in the declared eligible population.
This is an allocation-event count, not an execution-side or execution-ID count.
Long Sell and short Buy/cover events qualify only through an accepted reducing
role; execution side never determines exit membership. A flip-closing role is
an exit event in its closing adjacent lifecycle.

### Formal Wording

- "number of position-reducing allocation events"
- "count of accepted exit allocation events"

### Normal Conversational Wording

- "How many exits did I make?"
- "How many times did I exit these trades?"

### Trader Slang

- "How many trims and all-outs?"
- "How many times did I get out?" means exit events only after count-grain
  clarification or trusted canonical context.

### Abbreviations

- `exit cnt`, `# exits`, and `xits`.
- `AAPL exit cnt` validates `AAPL` as a ticker; bare `EC` is ambiguous.

### Common Misspellings

- `numbr of exits`
- `exitt count`

### Noisy or Incomplete Input

- `NVDA exits pls`
- `how many outs last mnth` requires validated date context and event grain.

### Singular and Plural Forms

- Singular: "one exit event".
- Plural: "exits" or "exit events"; neither means distinct executions by
  default.

### Full Questions

- "How many exit allocation events were in eligible closed AAPL trades?"
- "How many exits were recorded for the selected trade?"

### Commands

- "Count exit events for the selected eligible population."
- "Show number of exits by validated ticker."

### Sentence Fragments

- "exit event count"
- "NVDA exits, selected period"

### Follow-Up Wording

- "Include partial exits" retains the `reducing` role already in the metric.
- "What about factual open positions?" returns their accepted reductions in a
  separate open-state partition without inventing a final close.

### Correction Wording

- "I meant allocation exit events, not exit executions."
- "Include reductions, not only final closes."

### Comparison Wording

- "Compare exit-event counts for the two authorized ticker groups."
- Both sides retain identical role and coverage rules.

### Ranking Wording

- "Rank validated tickers by number of exit events."
- Deterministic ties require the approved ranking contract.

### Negated Wording

- "Count exits, not Sell executions."
- "Do not hide decision-state exit coverage."

### Exclusion Wording

- "Count exits excluding the validated selected ticker."
- "Exclude factual open reductions from values" preserves open coverage.

### Multi-Filter Wording

- "Count exit events for eligible closed short TSLA lifecycles in the selected
  account-local period."

### Multi-Part Question Wording

- "Show number of exits and exit execution count for AAPL" returns separate
  metrics without double counting or aliasing.

### Ambiguous Wording

- "Exits" may mean allocation events, distinct execution IDs, final exits,
  execution-side sells/buys, or Journal rows.
- "How many times out?" does not establish event versus execution grain.

### Negative Examples

These examples must not map to this concept.

- "How many Sell executions?" is execution-side activity.
- "What percentage of quantity did I exit?" is not this event count.
- "Delete this exit" is a protected Journal-write request.

### Context Requirements

Require server-authorized account scope and a trusted selected lifecycle or
validated eligible population. Account-local dates use the server-authorized
IANA timezone; exit roles come only from current accepted allocations.

### Required Data

- Current accepted execution/allocation versions and stable allocation IDs.
- Roles `reducing`, `closing`, and `flip_closing`, projection state,
  authorized scope, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Compatible currency only when combined with money/outcome results.

### Valid Filters

- Only validated Journal filters over authorized account, lifecycle state,
  ticker/instrument, direction, provenance, and account-local date range.
- Filters cannot substitute execution side for allocation role.

### Valid Groupings

- Approved account, ticker/instrument, direction, provenance, date/time, and
  lifecycle groupings when their owning categories validate them.
- Group after stable allocation-identity deduplication.

### Valid Operators

- Exact count, equality/threshold filtering, comparison, grouping, and ranking
  after Categories 12/14 validate the operator.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Buy/Sell-side substitution, execution-ID count substitution, mixed
  unauthorized accounts, hidden decision coverage, invented final exits,
  writes, raw private identifier exposure, prediction, causation, or advice.

### Default Interpretation

The explicit canonical target counts unique qualifying allocation identities
for all three position-reducing roles in eligible `ready_closed` lifecycles.
Generic "exits" has no silent event-versus-execution default when ambiguous.

### Clarification Conditions

Clarify only when wording does not distinguish allocation events from distinct
exit execution IDs or execution-side activity and trusted context does not
already select this canonical metric.

### Recommended Clarification Wording

- "Do you mean exit allocation events or distinct exit executions?"

### Unsupported Conditions

- Missing/conflicting allocation identity or role, unauthorized scope,
  unsupported filter attribution, or unresolved chain required for the value.
- Requests to invent a final exit or infer quality, cause, edge, or advice.

### Target Analytics Tool or Query Capability

- Planned Category 8 metric over read-only `JournalAnalyticsFactSet`, current
  allocation/population builder, exact counter, coverage contract, and
  validated `journal_analytics_query_v1` successor/extension.
- Existing allocation primitives do not make this named contract Supported;
  AI Chat interpretation/runtime is unimplemented.

### Result Units

- Non-negative integer allocation-event count plus population and coverage.
  Exact zero requires a complete covered eligible population.

### Fee Handling

- Not applicable. Combined P/L/outcome requests retain their separate gross or
  fee-complete net basis and compatible currency partition.

### Open-Trade Handling

- Default values use eligible `ready_closed`. Explicit factual
  `legitimate_open` reductions are returned separately without a fabricated
  final close; `needs_decision`/incomplete chains remain visible coverage.

### Sample-Size Considerations

- An exact zero is valid only with complete coverage; empty/unavailable is not
  zero. Small counts are descriptive and do not establish exit quality or
  advice.

## `average_entry_price` Language Registry

### Exact Definition

For unique accepted `opening`, `adding`, and `flip_opening` allocation events,
sum each exact execution price once and divide by the qualifying event count.
Every stable allocation event has equal weight. A zero denominator is
unavailable. This planned simple mean is not the current quantity-weighted
analytics output with the same name.
Long entries and short entries qualify through increasing allocation roles,
including `flip_opening`; Buy/Sell execution side never selects membership.

### Formal Wording

- "simple arithmetic mean of entry allocation-event prices"
- "equal-event average entry price"

### Normal Conversational Wording

- "What was my simple average entry price?"
- "Average the entry prices with each entry event counted once."

### Trader Slang

- "What was my avg in, equal weight?"
- "Average my get-in prices" maps only after simple-versus-weighted basis is
  explicit.

### Abbreviations

- `simple avg ent px`, `avg entry px (EW)`, and `AEP simple`.
- `NVDA avg ent px` validates `NVDA` but remains basis-ambiguous without
  `simple`/equal-event context; `VWAP` never maps here.

### Common Misspellings

- `averge entry price`
- `avg entery prise`

### Noisy or Incomplete Input

- `AAPL avg in simple pls`
- `avg entry??` requires one price-basis clarification.

### Singular and Plural Forms

- Singular result: "simple average entry price" for one lifecycle/population.
- Plural inputs: "entry prices" means qualifying allocation-event prices, not
  order quotes.

### Full Questions

- "What was the equal-event average entry price for eligible NVDA trades?"
- "What is the simple mean of entry allocation prices for the selected trade?"

### Commands

- "Calculate simple average entry price for the selected population."
- "Give each qualifying entry event one equal weight."

### Sentence Fragments

- "simple avg entry px"
- "TSLA entry prices, equal event weight"

### Follow-Up Wording

- "Use equal event weight" corrects a trusted generic-average request to this
  metric without changing the authorized population.
- "What about factual opens?" produces a separate open-state result only when
  exact covered prices exist.

### Correction Wording

- "I meant the simple event mean, not quantity-weighted entry price."
- "Count each accepted entry allocation once."

### Comparison Wording

- "Compare simple average entry price for the two authorized ticker groups."
- Both groups must share compatible instrument price convention, currency,
  unit, population, and event-grain rules.

### Ranking Wording

- "Rank validated tickers by simple average entry price."
- Ranking requires compatible price partitions and deterministic ties.

### Negated Wording

- "Average entry price, not weighted by shares."
- "Do not reuse the current quantity-weighted average-entry output."

### Exclusion Wording

- "Simple average entry price excluding the selected ticker."
- Exclusion occurs after authorization and allocation reconstruction; coverage
  remains visible.

### Multi-Filter Wording

- "Show simple average entry price for eligible closed long AAPL lifecycles in
  the selected account-local period and one USD price partition."

### Multi-Part Question Wording

- "Show simple and weighted average entry price for NVDA" returns two labelled
  values over explicitly related evidence, never aliases or duplicate truth.

### Ambiguous Wording

- "Average entry price" commonly means a quantity-weighted cost and collides
  with an existing quantity-weighted analytics output.
- "Avg in" may mean first price, broker cost basis, or simple/weighted mean.

### Negative Examples

These examples must not map to this concept.

- "What was my weighted average entry price?" maps to
  `weighted_average_entry_price`.
- "What was my first entry price?" is one endpoint price, not a mean.
- "Was my entry good?" asks for unsupported quality/benchmark evidence.

### Context Requirements

Require server-authorized account scope, a trusted selected lifecycle or
validated population, and an explicit simple/equal-event basis. Use one
compatible instrument price convention, currency, and unit partition.

### Required Data

- Current accepted allocation IDs/roles and exact execution prices.
- Positive qualifying event count, authorized scope, projection state,
  compatible instrument/currency/unit facts, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Exact quantities may be shown for contrast but never weight this simple mean.

### Valid Filters

- Validated authorized account, lifecycle state, ticker/instrument, direction,
  provenance, and account-IANA date filters.
- No filter may silently change simple event weighting or combine currencies.

### Valid Groupings

- Approved compatible account, ticker/instrument, direction, provenance, and
  date/time groupings after stable allocation-event deduplication.
- Groups with incompatible price/currency/unit conventions stay separate.

### Valid Operators

- Exact arithmetic mean, comparison, grouping, threshold filtering, and
  ranking after Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Silent quantity weighting, reuse/alias of current weighted output,
  cross-currency/unit averaging, missing price invention, unauthorized scope,
  raw private identifier exposure, order/quote substitution, causation,
  quality judgement, or advice.

### Default Interpretation

When this canonical metric is explicitly selected, use the equal-event simple
mean over eligible `ready_closed`. Generic "average entry price" has no silent
simple-versus-weighted default; clarify the basis unless trusted context fixes
it.

### Clarification Conditions

Clarify when "average entry price" or an abbreviation does not explicitly
select equal-event simple mean versus allocated-quantity-weighted mean and
trusted context does not fix the basis.

### Recommended Clarification Wording

- "Do you want the equal-event simple average or the quantity-weighted average
  entry price?"

### Unsupported Conditions

- Zero qualifying event count; missing/conflicting price, role, allocation,
  currency, unit, or price convention; unauthorized or unresolved required
  scope; or a request to use current weighted output as this simple value.

### Target Analytics Tool or Query Capability

- Planned Category 8 simple-price metric over read-only
  `JournalAnalyticsFactSet`, allocation builder, exact rational math, coverage
  contract, and a validated query extension.
- Current `average_entry_price` analytics output is quantity-weighted and must
  not route to this contract; AI Chat/runtime remains unimplemented.

### Result Units

- Exact rational price per instrument unit in one compatible currency/unit
  partition, plus event-count denominator and coverage; round only for display.

### Fee Handling

- Fees are excluded. This is not charge-adjusted cost basis. Combined P/L
  requests retain separate gross or fee-complete net semantics.

### Open-Trade Handling

- Default uses eligible `ready_closed`. Explicit factual `legitimate_open`
  entry allocations may produce a separately labelled result. `needs_decision`
  or missing/conflicting price/role facts remain partial/unavailable coverage.

### Sample-Size Considerations

- One qualifying event yields that exact price; zero events is unavailable.
  Always show event count/coverage. Small samples cannot establish execution
  quality, causation, edge, or advice.

## `average_exit_price` Language Registry

### Exact Definition

For unique accepted `reducing`, `closing`, and `flip_closing` allocation events,
sum each exact execution price once and divide by the qualifying event count.
Every stable allocation event has equal weight. A zero denominator is
unavailable. This planned simple mean is not the current quantity-weighted
analytics output with the same name.
Long exits and short exits/covers qualify through reducing allocation roles,
including `flip_closing`; Buy/Sell execution side never selects membership.

### Formal Wording

- "simple arithmetic mean of exit allocation-event prices"
- "equal-event average exit price"

### Normal Conversational Wording

- "What was my simple average exit price?"
- "Average the exit prices with each exit event counted once."

### Trader Slang

- "What was my avg out, equal weight?"
- "Average my get-out prices" requires an explicit simple/weighted basis.

### Abbreviations

- `simple avg exit px`, `avg xit px (EW)`, and `AEP exit simple`.
- `AAPL avg out` validates `AAPL` but remains price-basis ambiguous without
  equal-event context; `VWAP` never maps here.

### Common Misspellings

- `averge exit price`
- `avg exiit prise`

### Noisy or Incomplete Input

- `NVDA avg out simple pls`
- `avg exit??` requires one price-basis clarification.

### Singular and Plural Forms

- Singular result: "simple average exit price" for one lifecycle/population.
- Plural inputs: "exit prices" means qualifying allocation-event prices, not
  order quotes or final exits only.

### Full Questions

- "What was the equal-event average exit price for eligible AAPL trades?"
- "What is the simple mean of exit allocation prices for the selected trade?"

### Commands

- "Calculate simple average exit price for the selected population."
- "Give each qualifying exit event one equal weight."

### Sentence Fragments

- "simple avg exit px"
- "TSLA exit prices, equal event weight"

### Follow-Up Wording

- "Use equal event weight" corrects a trusted generic-average request to this
  metric without changing scope.
- "Include factual open reductions" adds a separate open-state result without
  inventing a final exit.

### Correction Wording

- "I meant the simple event mean, not quantity-weighted exit price."
- "Count each accepted exit allocation once."

### Comparison Wording

- "Compare simple average exit price for the two authorized ticker groups."
- Both groups retain compatible price convention, currency, unit, population,
  and event-grain rules.

### Ranking Wording

- "Rank validated tickers by simple average exit price."
- Ranking requires compatible price partitions and deterministic ties.

### Negated Wording

- "Average exit price, not weighted by shares."
- "Do not reuse the current quantity-weighted average-exit output."

### Exclusion Wording

- "Simple average exit price excluding the selected ticker."
- Exclusion follows authorization/allocation reconstruction and preserves
  coverage.

### Multi-Filter Wording

- "Show simple average exit price for eligible closed short NVDA lifecycles in
  the selected account-local period and one USD price partition."

### Multi-Part Question Wording

- "Show simple and weighted average exit price for AAPL" returns two labelled
  values, never aliases or duplicate truth.

### Ambiguous Wording

- "Average exit price" commonly means a quantity-weighted result and collides
  with an existing quantity-weighted analytics output.
- "Avg out" may mean final-exit price, simple mean, weighted mean, or proceeds.

### Negative Examples

These examples must not map to this concept.

- "What was my weighted average exit price?" maps to
  `weighted_average_exit_price`.
- "What was my final exit price?" is one endpoint price, not a mean.
- "Were my exits good?" requires unavailable quality/benchmark evidence.

### Context Requirements

Require server-authorized account scope, a trusted selected lifecycle or
validated population, and an explicit simple/equal-event basis. Use one
compatible instrument price convention, currency, and unit partition.

### Required Data

- Current accepted allocation IDs/roles and exact execution prices.
- Positive qualifying event count, authorized scope, projection state,
  compatible instrument/currency/unit facts, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Exact quantities may be shown for contrast but never weight this simple mean.

### Valid Filters

- Validated authorized account, lifecycle state, ticker/instrument, direction,
  provenance, and account-IANA date filters.
- No filter may silently change simple event weighting or combine currencies.

### Valid Groupings

- Approved compatible account, ticker/instrument, direction, provenance, and
  date/time groupings after stable allocation-event deduplication.
- Groups with incompatible price/currency/unit conventions stay separate.

### Valid Operators

- Exact arithmetic mean, comparison, grouping, threshold filtering, and
  ranking after Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Silent quantity weighting, reuse/alias of current weighted output,
  cross-currency/unit averaging, missing price invention, unauthorized scope,
  raw private identifier exposure, order/quote substitution, causation,
  quality judgement, or advice.

### Default Interpretation

When this canonical metric is explicitly selected, use the equal-event simple
mean over eligible `ready_closed`. Generic "average exit price" has no silent
simple-versus-weighted default; clarify unless trusted context fixes the basis.

### Clarification Conditions

Clarify when "average exit price" or an abbreviation does not explicitly
select equal-event simple mean versus allocated-quantity-weighted mean and
trusted context does not fix the basis.

### Recommended Clarification Wording

- "Do you want the equal-event simple average or the quantity-weighted average
  exit price?"

### Unsupported Conditions

- Zero qualifying event count; missing/conflicting price, role, allocation,
  currency, unit, or price convention; unauthorized or unresolved required
  scope; or a request to use current weighted output as this simple value.

### Target Analytics Tool or Query Capability

- Planned Category 8 simple-price metric over read-only
  `JournalAnalyticsFactSet`, allocation builder, exact rational math, coverage
  contract, and a validated query extension.
- Current `average_exit_price` analytics output is quantity-weighted and must
  not route to this contract; AI Chat/runtime remains unimplemented.

### Result Units

- Exact rational price per instrument unit in one compatible currency/unit
  partition, plus event-count denominator and coverage; round only for display.

### Fee Handling

- Fees are excluded. This is not charge-adjusted proceeds. Combined P/L
  requests retain separate gross or fee-complete net semantics.

### Open-Trade Handling

- Default uses eligible `ready_closed`. Explicit factual `legitimate_open`
  reductions may produce a separately labelled result without inventing final
  exit. `needs_decision` or missing/conflicting facts remain coverage.

### Sample-Size Considerations

- One qualifying event yields that exact price; zero events is unavailable.
  Always show event count/coverage. Small samples cannot establish execution
  quality, causation, edge, or advice.

## `weighted_average_entry_price` Language Registry

### Exact Definition

For unique accepted `opening`, `adding`, and `flip_opening` allocation events,
calculate exact `sum(allocated quantity * execution price) / sum(allocated
quantity)`. The denominator must be positive. Preserve exact numerator,
denominator, and rational result; round only for display.
Long entries and short entries qualify through increasing allocation roles,
including `flip_opening`; Buy/Sell execution side never selects membership.

### Formal Wording

- "allocated-quantity-weighted average entry price"
- "entry price weighted by accepted entry allocation quantity"

### Normal Conversational Wording

- "What was my weighted average entry price?"
- "Average my entry prices by the shares in each entry allocation."

### Trader Slang

- "What's my weighted avg in?"
- "What was my blended entry by size?" maps only when "size" means exact
  allocated entry quantity, not position size or dollars.

### Abbreviations

- `WAE`, `wavg ent px`, and `qty-wtd entry` in trusted metric context.
- `TSLA WAE` validates `TSLA` as a ticker; bare `WAP` is ambiguous with exit,
  VWAP, or another weighted price.

### Common Misspellings

- `wieghted average entry`
- `weigtd entery price`

### Noisy or Incomplete Input

- `NVDA weighted avg in pls`
- `entry wap?` requires clarification because the direction/basis is unclear.

### Singular and Plural Forms

- Singular: "weighted average entry price" for one lifecycle/population.
- Plural inputs: "entry prices weighted by allocated quantities."

### Full Questions

- "What was the quantity-weighted entry price for the selected trade?"
- "Show weighted average entry price for eligible AAPL lifecycles."

### Commands

- "Calculate weighted average entry price using allocated entry quantities."
- "Return exact entry notional numerator and quantity denominator."

### Sentence Fragments

- "weighted avg entry px"
- "NVDA entries weighted by qty"

### Follow-Up Wording

- "Weight it by allocated shares" selects this metric only with trusted prior
  entry-price context and compatible unit facts.
- "Now for factual opens" returns a separate open-state calculation.

### Correction Wording

- "I meant quantity-weighted, not equal-event average entry price."
- "Use allocated entry quantity, not maximum position size."

### Comparison Wording

- "Compare weighted average entry price across the two authorized ticker
  groups."
- Both groups retain compatible instrument/currency/unit and identical
  quantity-weight rules.

### Ranking Wording

- "Rank validated tickers by weighted average entry price."
- Ranking requires compatible price partitions and deterministic ties.

### Negated Wording

- "Use weighted average entry price, not the simple event mean."
- "Do not weight by dollar exposure or maximum position size."

### Exclusion Wording

- "Weighted average entry price excluding the selected ticker."
- Exclusions apply only after authorization/allocation reconstruction and keep
  excluded/decision coverage visible.

### Multi-Filter Wording

- "Show weighted average entry price for eligible closed long AAPL lifecycles
  in the selected account-local period and one USD/share partition."

### Multi-Part Question Wording

- "Show simple and weighted average entry price plus their event/quantity
  denominators" returns separately labelled exact results.

### Ambiguous Wording

- "Average entry price" alone does not choose simple versus quantity-weighted.
- "WAP" may mean weighted entry, weighted exit, or VWAP; "blended entry" may
  mean broker cost basis including unsupported adjustments.

### Negative Examples

These examples must not map to this concept.

- "Simple average of my entry fills" maps to `average_entry_price`.
- "Entry versus VWAP" requires market data.
- "What should my average entry be?" asks for advice, not a historical metric.

### Context Requirements

Require server-authorized account scope, a trusted selected lifecycle or
validated population, explicit entry/weighted basis, and one compatible
instrument price convention, currency, multiplier, and quantity unit.

### Required Data

- Current accepted allocation IDs/roles, exact positive allocated quantities,
  and exact execution prices.
- Positive summed quantity denominator, authorized scope, projection state,
  compatible instrument/currency/unit facts, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Simple event mean may be returned separately when explicitly requested.

### Valid Filters

- Validated authorized account, lifecycle state, ticker/instrument, direction,
  provenance, and account-IANA date filters.
- Filtering cannot change weights, mix units/currencies, or remove coverage.

### Valid Groupings

- Approved compatible account, ticker/instrument, direction, provenance, and
  date/time groupings after allocation reconstruction.
- Recompute exact `sum(q*p)/sum(q)` inside each group; never average averages.

### Valid Operators

- Exact weighted mean, comparison, grouping, threshold filtering, and ranking
  after Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Silent simple-mean routing, zero/missing denominator substitution,
  averaging pre-aggregated averages, cross-currency/unit weighting, order/quote
  substitution, invented price/quantity, unauthorized scope, raw private
  identifier exposure, prediction, causation, or advice.

### Default Interpretation

Explicit "weighted average entry price" uses exact allocated-quantity weights
over eligible `ready_closed`. Generic "average entry price" has no silent
simple-versus-weighted default and requires one basis clarification.

### Clarification Conditions

Clarify when generic average-price wording, `WAP`, or "blended entry" does not
establish entry versus exit and equal-event versus allocated-quantity weighting.

### Recommended Clarification Wording

1. If direction is unclear: "Do you mean entry price or exit price?"
2. After entry is fixed, if basis remains unclear: "For entry price, do you
   want the equal-event simple average or the allocated-quantity-weighted
   average?"

### Unsupported Conditions

- Non-positive denominator; missing/conflicting price, quantity, allocation
  role, currency, unit, or multiplier; unauthorized scope; `needs_decision`
  facts required for the value; requested mixed-unit/currency aggregation.

### Target Analytics Tool or Query Capability

- Planned Category 8 weighted-entry metric over read-only
  `JournalAnalyticsFactSet`, allocation builder, exact decimal/rational math,
  coverage contract, and a validated query extension.
- Existing weighted primitives do not make this named language contract
  Supported; AI Chat interpretation/runtime remains unimplemented.

### Result Units

- Exact rational price per instrument unit in one compatible currency/unit
  partition, with exact `sum(q*p)` numerator, positive `sum(q)` denominator,
  eligible event count, and coverage.

### Fee Handling

- Fees are excluded. This is execution-derived allocated entry price, not
  charge-adjusted or broker tax-lot cost basis. Net/P&L remains separate.

### Open-Trade Handling

- Default uses eligible `ready_closed`. Explicit factual `legitimate_open`
  entry allocations may produce a separately labelled result. `needs_decision`
  or missing/conflicting price/quantity/role facts remain coverage.

### Sample-Size Considerations

- One positive-quantity event yields its exact price; zero total quantity is
  unavailable. Report exact denominator/event count and coverage. Small samples
  cannot establish execution quality, causation, edge, or advice.

## `weighted_average_exit_price` Language Registry

### Exact Definition

For unique accepted `reducing`, `closing`, and `flip_closing` allocation events,
calculate exact `sum(allocated quantity * execution price) / sum(allocated
quantity)`. The denominator must be positive. Preserve the exact numerator,
denominator, and rational result; round only for display. Long exits and short
exits/covers qualify through reducing roles, including `flip_closing`; Buy/Sell
side never selects membership.

### Formal Wording

- "allocated-quantity-weighted average exit price"
- "exit price weighted by accepted exit allocation quantity"

### Normal Conversational Wording

- "What was my weighted average exit price?"
- "Average my exit prices by the shares in each exit allocation."

### Trader Slang

- "What's my weighted avg out?"
- "What was my blended exit by size?" maps only when size means allocated exit
  quantity, not position size or dollars.

### Abbreviations

- `wavg exit px`, `qty-wtd exit`, and `weighted avg out`.
- `AAPL wavg exit` validates `AAPL`; bare `WAP` is ambiguous with entry, VWAP,
  or another weighted price.

### Common Misspellings

- `wieghted average exit`
- `weigtd exiit price`

### Noisy or Incomplete Input

- `TSLA weighted avg out pls`
- `exit wap?` requires one focused basis/direction clarification.

### Singular and Plural Forms

- Singular: "weighted average exit price" for one lifecycle/population.
- Plural inputs: "exit prices weighted by allocated quantities."

### Full Questions

- "What was the quantity-weighted exit price for the selected trade?"
- "Show weighted average exit price for eligible NVDA lifecycles."

### Commands

- "Calculate weighted average exit price using allocated exit quantities."
- "Return the exact exit notional numerator and quantity denominator."

### Sentence Fragments

- "weighted avg exit px"
- "AAPL exits weighted by qty"

### Follow-Up Wording

- "Weight it by allocated shares" selects this metric only with trusted prior
  exit-price context and compatible unit facts.
- "Include factual open reductions" returns a separate open-state result and
  never invents a final exit.

### Correction Wording

- "I meant quantity-weighted, not equal-event average exit price."
- "Use allocated exit quantity, not maximum position size."

### Comparison Wording

- "Compare weighted average exit price across the two authorized ticker
  groups."
- Both groups retain compatible instrument/currency/unit and identical weights.

### Ranking Wording

- "Rank validated tickers by weighted average exit price."
- Ranking requires compatible price partitions and deterministic ties.

### Negated Wording

- "Use weighted average exit price, not the simple event mean."
- "Do not weight by dollar proceeds or maximum position size."

### Exclusion Wording

- "Weighted average exit price excluding the selected ticker."
- Exclusions follow authorization/allocation reconstruction and retain
  excluded/decision coverage.

### Multi-Filter Wording

- "Show weighted average exit price for eligible closed short NVDA lifecycles
  in the selected account-local period and one USD/share partition."

### Multi-Part Question Wording

- "Show simple and weighted average exit price plus their event/quantity
  denominators" returns separately labelled exact results.

### Ambiguous Wording

- "Average exit price" alone does not choose simple versus quantity-weighted.
- "WAP" may mean weighted entry, weighted exit, or VWAP; "blended exit" may
  mean proceeds after unsupported fee adjustments.

### Negative Examples

These examples must not map to this concept.

- "Simple average of my exit fills" maps to `average_exit_price`.
- "Exit versus VWAP" requires market data.
- "Where should I exit?" asks for advice, not a historical metric.

### Context Requirements

Require server-authorized account scope, a trusted selected lifecycle or
validated population, explicit exit/weighted basis, and one compatible
instrument price convention, currency, multiplier, and quantity unit.

### Required Data

- Current accepted allocation IDs/roles, exact positive allocated quantities,
  and exact execution prices.
- Positive summed quantity denominator, authorized scope, projection state,
  compatible instrument/currency/unit facts, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Simple event mean may be returned separately when explicitly requested.

### Valid Filters

- Validated authorized account, lifecycle state, ticker/instrument, direction,
  provenance, and account-IANA date filters.
- Filtering cannot change weights, mix units/currencies, or remove coverage.

### Valid Groupings

- Approved compatible account, ticker/instrument, direction, provenance, and
  date/time groupings after allocation reconstruction.
- Recompute exact `sum(q*p)/sum(q)` inside each group; never average averages.

### Valid Operators

- Exact weighted mean, comparison, grouping, threshold filtering, and ranking
  after Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Silent simple-mean routing, zero/missing denominator substitution,
  averaging pre-aggregated averages, cross-currency/unit weighting, order/quote
  substitution, invented price/quantity, unauthorized scope, raw private
  identifier exposure, prediction, causation, or advice.

### Default Interpretation

Explicit "weighted average exit price" uses exact allocated-quantity weights
over eligible `ready_closed`. Generic "average exit price" has no silent
simple-versus-weighted default and requires one basis clarification.

### Clarification Conditions

Clarify when generic average-price wording, `WAP`, or "blended exit" does not
establish exit versus entry and equal-event versus allocated-quantity weighting.

### Recommended Clarification Wording

1. If direction is unclear: "Do you mean entry price or exit price?"
2. After exit is fixed, if basis remains unclear: "For exit price, do you want
   the equal-event simple average or the allocated-quantity-weighted average?"

### Unsupported Conditions

- Non-positive denominator; missing/conflicting price, quantity, allocation
  role, currency, unit, or multiplier; unauthorized scope; `needs_decision`
  facts required for the value; requested mixed-unit/currency aggregation.

### Target Analytics Tool or Query Capability

- Planned Category 8 weighted-exit metric over read-only
  `JournalAnalyticsFactSet`, allocation builder, exact decimal/rational math,
  coverage contract, and a validated query extension.
- Existing weighted primitives do not make this named language contract
  Supported; AI Chat interpretation/runtime remains unimplemented.

### Result Units

- Exact rational price per instrument unit in one compatible currency/unit
  partition, with exact `sum(q*p)` numerator, positive `sum(q)` denominator,
  eligible event count, and coverage.

### Fee Handling

- Fees are excluded. This is execution-derived allocated exit price, not
  charge-adjusted proceeds. Net/P&L remains separate.

### Open-Trade Handling

- Default uses eligible `ready_closed`. Explicit factual `legitimate_open`
  reductions may produce a separately labelled result without inventing final
  exit. `needs_decision` or missing/conflicting facts remain coverage.

### Sample-Size Considerations

- One positive-quantity event yields its exact price; zero total quantity is
  unavailable. Report exact denominator/event count and coverage. Small samples
  cannot establish execution quality, causation, edge, or advice.

## `entry_execution_count` Language Registry

### Exact Definition

Across the full declared scope, count each distinct current accepted execution
ID once when it carries at least one `opening`, `adding`, or `flip_opening`
allocation. Deduplicate before grouping/presentation. One flip may also qualify
for exit execution count, but remains one scope-wide ID within this metric.

### Formal Wording

- "distinct current executions carrying a position-increasing allocation"
- "unique entry-role execution count"

### Normal Conversational Wording

- "How many distinct entry executions were there?"
- "How many executions contributed to entries?"

### Trader Slang

- "How many entry fills?" maps only when "fills" means distinct accepted
  executions, not source rows or allocation events.
- "Count my entry execs."

### Abbreviations

- `entry exec cnt`, `# ent execs`, and `EEC` in trusted metric context.
- `NVDA entry execs` validates `NVDA`; bare `EC` remains ambiguous.

### Common Misspellings

- `entry exection count`
- `entery execs`

### Noisy or Incomplete Input

- `AAPL entry exec cnt pls`
- `how many entry fills?` requires one count-grain clarification.

### Singular and Plural Forms

- Singular: "one entry execution".
- Plural: "distinct entry executions"; multiple entry allocations on one
  execution do not pluralize the execution ID.

### Full Questions

- "How many distinct entry executions were in the selected eligible trades?"
- "How many current executions carried an entry role for NVDA?"

### Commands

- "Count distinct entry execution IDs across the authorized scope."
- "Deduplicate entry executions before grouping."

### Sentence Fragments

- "entry execution count"
- "TSLA unique entry execs"

### Follow-Up Wording

- "What about the exit executions?" switches to the separate exit metric but
  retains authorized scope.
- "Include factual opens" adds a separately labelled open-state count.

### Correction Wording

- "I meant distinct execution IDs, not entry allocation events."
- "Count the flip execution once, not once per allocation."

### Comparison Wording

- "Compare entry execution counts for the two authorized ticker groups."
- Deduplicate inside the full declared scope before comparison.

### Ranking Wording

- "Rank validated tickers by distinct entry execution count."
- Ranking/ties require the approved operator contract.

### Negated Wording

- "Count entry executions, not entry allocation events."
- "Do not count display rows or source rows."

### Exclusion Wording

- "Entry execution count excluding the selected ticker."
- Exclusion follows authorization and current-execution deduplication while
  preserving coverage.

### Multi-Filter Wording

- "Count distinct entry executions for eligible closed short AAPL lifecycles
  in the selected account-local period."

### Multi-Part Question Wording

- "Show entry execution count and number of entries for NVDA" returns distinct
  execution-ID and allocation-event metrics, never one aliased count.

### Ambiguous Wording

- "Entry count" may mean allocation events, distinct executions, lifecycles,
  entered quantity, or Journal rows.
- "Entry fills" may mean order fills unavailable from accepted execution facts.

### Negative Examples

These examples must not map to this concept.

- "How many entry allocation events?" maps to `number_of_entries`.
- "How many shares did I enter?" is Category 6 entered quantity.
- "Create another entry execution" is a protected write request.

### Context Requirements

Require server-authorized account scope and a trusted selected lifecycle or
validated population. Qualification uses accepted allocation roles; long Buy,
short Sell, and flip-opening executions qualify only through those roles, not
execution side.

### Required Data

- Current accepted execution IDs and current accepted allocation IDs/roles.
- Full declared authorized scope, projection state, stable deduplication,
  instrument/unit facts, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Compatible currency only when combined with money/outcome results.

### Valid Filters

- Validated account, lifecycle state, ticker/instrument, direction, provenance,
  and account-IANA date filters over current accepted facts.
- Filters never substitute execution side for roles or duplicate one ID.

### Valid Groupings

- Approved account, ticker/instrument, direction, provenance, and date/time
  groupings; deduplicate distinct execution IDs across the declared scope first.
- A flip may appear in entry and exit metric sets but once in each scope-wide
  metric.

### Valid Operators

- Exact distinct count, equality/threshold filtering, comparison, grouping,
  and ranking after Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Allocation-event count substitution, Buy/Sell-side substitution, display or
  source-row counting, duplicate flip IDs, unauthorized access, raw private ID
  exposure, invented roles, prediction, causation, or advice.

### Default Interpretation

Explicit `entry_execution_count` counts distinct current accepted execution IDs
with increasing roles over eligible `ready_closed`. Generic "entry count" has
no silent allocation-event-versus-execution-ID default.

### Clarification Conditions

Clarify when "entry count" or "entry fills" does not distinguish unique
execution IDs from allocation events and trusted context does not fix the grain.

### Recommended Clarification Wording

- "Do you mean distinct entry executions or entry allocation events?"

### Unsupported Conditions

- Missing/conflicting current execution identity, allocation role, or required
  scope; unauthorized request; unresolved chain required for the value; or an
  order-fill count not established by accepted execution evidence.

### Target Analytics Tool or Query Capability

- Planned Category 8 distinct entry-execution metric over read-only
  `JournalAnalyticsFactSet`, current allocation/population builder, distinct-ID
  counter, coverage contract, and validated query extension.
- Existing count primitives do not make this named contract Supported; AI Chat
  interpretation/runtime remains unimplemented.

### Result Units

- Non-negative integer distinct current execution count with population and
  coverage. Exact zero requires a complete covered scope.

### Fee Handling

- Not applicable. Fees do not change current execution identity or entry-role
  qualification; combined net/P&L keeps separate fee/currency coverage.

### Open-Trade Handling

- Default uses executions allocated to eligible `ready_closed`. Explicit
  factual `legitimate_open` executions are separately labelled;
  `needs_decision`/incomplete chains remain coverage, never inferred values.

### Sample-Size Considerations

- Exact zero requires complete coverage; empty/unavailable is not zero. Small
  counts describe construction only and do not establish quality, causation,
  edge, or advice.

## `exit_execution_count` Language Registry

### Exact Definition

Across the full declared scope, count each distinct current accepted execution
ID once when it carries at least one `reducing`, `closing`, or `flip_closing`
allocation. Deduplicate before grouping/presentation. One flip may also qualify
for entry execution count, but remains one scope-wide ID within this metric.

### Formal Wording

- "distinct current executions carrying a position-reducing allocation"
- "unique exit-role execution count"

### Normal Conversational Wording

- "How many distinct exit executions were there?"
- "How many executions contributed to exits?"

### Trader Slang

- "How many exit fills?" maps only when "fills" means distinct accepted
  executions, not source rows or allocation events.
- "Count my exit execs."

### Abbreviations

- `exit exec cnt`, `# exit execs`, and `XEC` in trusted metric context.
- `AAPL exit execs` validates `AAPL`; bare `EC` remains ambiguous.

### Common Misspellings

- `exit exection count`
- `exiit execs`

### Noisy or Incomplete Input

- `NVDA exit exec cnt pls`
- `how many exit fills?` requires one count-grain clarification.

### Singular and Plural Forms

- Singular: "one exit execution".
- Plural: "distinct exit executions"; multiple exit allocations on one
  execution do not pluralize the execution ID.

### Full Questions

- "How many distinct exit executions were in the selected eligible trades?"
- "How many current executions carried an exit role for AAPL?"

### Commands

- "Count distinct exit execution IDs across the authorized scope."
- "Deduplicate exit executions before grouping."

### Sentence Fragments

- "exit execution count"
- "TSLA unique exit execs"

### Follow-Up Wording

- "What about the entry executions?" switches to the separate entry metric but
  retains authorized scope.
- "Include factual open reductions" adds a separately labelled open-state count.

### Correction Wording

- "I meant distinct execution IDs, not exit allocation events."
- "Count the flip execution once, not once per allocation."

### Comparison Wording

- "Compare exit execution counts for the two authorized ticker groups."
- Deduplicate inside the full declared scope before comparison.

### Ranking Wording

- "Rank validated tickers by distinct exit execution count."
- Ranking/ties require the approved operator contract.

### Negated Wording

- "Count exit executions, not exit allocation events."
- "Do not count display rows or source rows."

### Exclusion Wording

- "Exit execution count excluding the selected ticker."
- Exclusion follows authorization and current-execution deduplication while
  preserving coverage.

### Multi-Filter Wording

- "Count distinct exit executions for eligible closed short NVDA lifecycles in
  the selected account-local period."

### Multi-Part Question Wording

- "Show exit execution count and number of exits for AAPL" returns distinct
  execution-ID and allocation-event metrics, never one aliased count.

### Ambiguous Wording

- "Exit count" may mean allocation events, distinct executions, final closes,
  exited quantity, or Journal rows.
- "Exit fills" may mean order fills unavailable from accepted execution facts.

### Negative Examples

These examples must not map to this concept.

- "How many exit allocation events?" maps to `number_of_exits`.
- "How many shares did I exit?" is exited quantity, not execution count.
- "Delete an exit execution" is a protected write request.

### Context Requirements

Require server-authorized account scope and a trusted selected lifecycle or
validated population. Qualification uses accepted allocation roles; long Sell,
short Buy/cover, and flip-closing executions qualify only through those roles,
not execution side.

### Required Data

- Current accepted execution IDs and current accepted allocation IDs/roles.
- Full declared authorized scope, projection state, stable deduplication,
  instrument/unit facts, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Compatible currency only when combined with money/outcome results.

### Valid Filters

- Validated account, lifecycle state, ticker/instrument, direction, provenance,
  and account-IANA date filters over current accepted facts.
- Filters never substitute execution side for roles or duplicate one ID.

### Valid Groupings

- Approved account, ticker/instrument, direction, provenance, and date/time
  groupings; deduplicate distinct execution IDs across the declared scope first.
- A flip may appear in exit and entry metric sets but once in each scope-wide
  metric.

### Valid Operators

- Exact distinct count, equality/threshold filtering, comparison, grouping,
  and ranking after Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Allocation-event count substitution, Buy/Sell-side substitution, display or
  source-row counting, duplicate flip IDs, unauthorized access, raw private ID
  exposure, invented roles/final exits, prediction, causation, or advice.

### Default Interpretation

Explicit `exit_execution_count` counts distinct current accepted execution IDs
with reducing roles over eligible `ready_closed`. Generic "exit count" has no
silent allocation-event-versus-execution-ID default.

### Clarification Conditions

Clarify when "exit count" or "exit fills" does not distinguish unique
execution IDs from allocation events and trusted context does not fix the grain.

### Recommended Clarification Wording

- "Do you mean distinct exit executions or exit allocation events?"

### Unsupported Conditions

- Missing/conflicting current execution identity, allocation role, or required
  scope; unauthorized request; unresolved chain required for the value; or an
  order-fill count not established by accepted execution evidence.

### Target Analytics Tool or Query Capability

- Planned Category 8 distinct exit-execution metric over read-only
  `JournalAnalyticsFactSet`, current allocation/population builder, distinct-ID
  counter, coverage contract, and validated query extension.
- Existing count primitives do not make this named contract Supported; AI Chat
  interpretation/runtime remains unimplemented.

### Result Units

- Non-negative integer distinct current execution count with population and
  coverage. Exact zero requires a complete covered scope.

### Fee Handling

- Not applicable. Fees do not change current execution identity or exit-role
  qualification; combined net/P&L keeps separate fee/currency coverage.

### Open-Trade Handling

- Default uses executions allocated to eligible `ready_closed`. Explicit
  factual `legitimate_open` reductions are separately labelled and never imply
  final close; `needs_decision`/incomplete chains remain coverage.

### Sample-Size Considerations

- Exact zero requires complete coverage; empty/unavailable is not zero. Small
  counts describe construction only and do not establish exit quality,
  causation, edge, or advice.

## `scale_in_count` Language Registry

### Exact Definition

Count once each unique current accepted allocation identity whose role is
exactly `adding` in the declared eligible population. This is a stable
allocation-event count, not Buy/Sell activity or a distinct execution-ID count.
Long Buy adds and short Sell adds qualify only through the `adding` role.

### Formal Wording

- "count of accepted adding allocation events"
- "number of position-scale-in allocation events"

### Normal Conversational Wording

- "How many times did I scale in?"
- "How many adds were in these trades?"

### Trader Slang

- "How many adds did I take?"
- "How often did I size in again?" maps only to factual `adding` events, not
  inferred conviction or size escalation.

### Abbreviations

- `scale-in cnt`, `SI count`, and `# adds` in trusted context.
- `NVDA SI cnt` validates `NVDA`; bare `SI` may mean another concept.

### Common Misspellings

- `scal in count`
- `scaleing in`

### Noisy or Incomplete Input

- `AAPL adds cnt pls`
- `how many add-ons?` requires scale-event versus all-entry clarification.

### Singular and Plural Forms

- Singular: "one scale-in" or "one adding event".
- Plural: "scale-ins" or "adding events"; not added shares or executions.

### Full Questions

- "How many accepted scale-in events were in the selected trades?"
- "How many adding allocations did eligible short NVDA lifecycles have?"

### Commands

- "Count stable `adding` allocation events."
- "Show scale-in count by validated ticker."

### Sentence Fragments

- "scale-in count"
- "TSLA adds, selected period"

### Follow-Up Wording

- "What about short trades?" retains role-based membership; short Sell adds
  qualify without treating all sells as scale-ins.
- "Include factual opens" returns accepted adds in a separate open partition.

### Correction Wording

- "I meant adding events, not all entry events."
- "Use allocation roles, not Buy executions."

### Comparison Wording

- "Compare scale-in counts for the two authorized ticker groups."
- Both sides use the identical stable allocation-event grain.

### Ranking Wording

- "Rank validated tickers by scale-in count."
- Ranking/ties require the approved operator contract.

### Negated Wording

- "Count scale-ins, not opening entries."
- "Do not treat every Buy as an add."

### Exclusion Wording

- "Scale-in count excluding the selected ticker."
- Exclusion follows authorization/reconstruction and preserves coverage.

### Multi-Filter Wording

- "Count scale-in events for eligible closed short AAPL lifecycles in the
  selected account-local period."

### Multi-Part Question Wording

- "Show scale-in count and number of entries for NVDA" returns the narrower
  `adding` event count and broader increasing-event count separately.

### Ambiguous Wording

- "Adds" may mean `adding` allocation events, added quantity, manual rows, or
  notes; "scaled in" can be misread as inferred size behavior.
- "More entries" may mean all entry events rather than scale-ins only.

### Negative Examples

These examples must not map to this concept.

- "How many Buy executions?" is execution-side activity.
- "How many shares did I add?" is quantity, not event count.
- "Should I scale in?" asks for advice.

### Context Requirements

Require server-authorized account scope and trusted selected lifecycle or
validated population. Membership uses current accepted stable allocation IDs
with exact `adding` role; direction/side cannot replace role evidence.

### Required Data

- Current accepted allocation identities and `adding` roles linked to current
  accepted executions/lifecycles.
- Authorized scope, projection state, compatible instrument/unit facts, and
  coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Compatible currency only for composed money/outcome requests.

### Valid Filters

- Validated authorized account, lifecycle state, ticker/instrument, direction,
  provenance, and account-IANA date filters.
- Filters cannot turn execution side, quantity change, or display rows into an
  `adding` role.

### Valid Groupings

- Approved account, ticker/instrument, direction, provenance, and date/time
  groupings after stable allocation-identity deduplication.

### Valid Operators

- Exact event count, equality/threshold filtering, comparison, grouping, and
  ranking after Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Buy/Sell substitution, execution-ID or quantity count substitution, inferred
  roles, unauthorized access, raw private ID exposure, hidden decision
  coverage, behavioral motive, prediction, causation, or advice.

### Default Interpretation

Explicit scale-in wording counts stable `adding` allocation events over eligible
`ready_closed`; it excludes opening and `flip_opening`. Generic "entries" does
not silently map to scale-ins.

### Clarification Conditions

Clarify when "adds," "add-ons," or "more entries" could mean `adding` events
versus all entry events or added quantity and trusted context does not fix it.

### Recommended Clarification Wording

- "Do you mean adding allocation events or all entry events?"

### Unsupported Conditions

- Missing/conflicting allocation identity or `adding` role, unauthorized scope,
  unresolved required chain, unsupported filter attribution, or a request to
  infer scale-in behavior from side/quantity alone.

### Target Analytics Tool or Query Capability

- Planned Category 8 scale-in metric over read-only `JournalAnalyticsFactSet`,
  allocation/population builder, exact stable-event counter, coverage contract,
  and validated query extension.
- Existing scale primitives do not make this named contract Supported; AI Chat
  interpretation/runtime remains unimplemented.

### Result Units

- Non-negative integer stable `adding` allocation-event count plus population
  and coverage. Exact zero requires a complete covered eligible population.

### Fee Handling

- Not applicable. Fees do not alter allocation identity or `adding` role;
  composed net/P&L requests keep separate fee/currency coverage.

### Open-Trade Handling

- Default uses eligible `ready_closed`. Explicit factual `legitimate_open`
  adding events are returned separately; `needs_decision`/incomplete chains
  remain visible coverage and are never inferred as resolved scale-ins.

### Sample-Size Considerations

- Exact zero requires complete coverage; empty/unavailable is not zero. Small
  counts do not establish conviction, discipline, quality, causation, edge, or
  advice.

## `scale_out_count` Language Registry

### Exact Definition

Count once each unique current accepted allocation identity whose role is
exactly `reducing` in the declared eligible population. This is a stable
allocation-event count, not Buy/Sell activity or a distinct execution-ID count.
Long Sell reductions and short Buy/cover reductions qualify only through the
`reducing` role.

### Formal Wording

- "count of accepted reducing allocation events"
- "number of position-scale-out allocation events"

### Normal Conversational Wording

- "How many times did I scale out?"
- "How many partial reductions were in these trades?"

### Trader Slang

- "How many trims did I take?"
- "How often did I peel some off?" maps only to factual `reducing` events, not
  final closes or inferred prudence.

### Abbreviations

- `scale-out cnt`, `SO count`, and `# trims` in trusted context.
- `AAPL SO cnt` validates `AAPL`; bare `SO` is ambiguous.

### Common Misspellings

- `scal out count`
- `scaleing out`

### Noisy or Incomplete Input

- `NVDA trims cnt pls`
- `how many partials?` requires event versus quantity/final-close clarification.

### Singular and Plural Forms

- Singular: "one scale-out" or "one reducing event".
- Plural: "scale-outs," "trims," or "reducing events"; not reduced shares.

### Full Questions

- "How many accepted scale-out events were in the selected trades?"
- "How many reducing allocations did eligible short AAPL lifecycles have?"

### Commands

- "Count stable `reducing` allocation events."
- "Show scale-out count by validated ticker."

### Sentence Fragments

- "scale-out count"
- "TSLA trims, selected period"

### Follow-Up Wording

- "What about short trades?" retains role-based membership; short Buy covers
  qualify only when their accepted role is `reducing`.
- "Include factual opens" returns accepted reductions separately without a
  fabricated final close.

### Correction Wording

- "I meant reducing events, not all exit events."
- "Use allocation roles, not Sell executions."

### Comparison Wording

- "Compare scale-out counts for the two authorized ticker groups."
- Both sides use identical stable allocation-event grain.

### Ranking Wording

- "Rank validated tickers by scale-out count."
- Ranking/ties require the approved operator contract.

### Negated Wording

- "Count scale-outs, not final closes."
- "Do not treat every Sell as a trim."

### Exclusion Wording

- "Scale-out count excluding the selected ticker."
- Exclusion follows authorization/reconstruction and preserves coverage.

### Multi-Filter Wording

- "Count scale-out events for eligible closed short NVDA lifecycles in the
  selected account-local period."

### Multi-Part Question Wording

- "Show scale-out count and number of exits for AAPL" returns the narrower
  `reducing` event count and broader reducing/closing event count separately.

### Ambiguous Wording

- "Trims" may mean `reducing` events, quantity trimmed, manual notes, or every
  partial exit; "scaled out" can be confused with final closes.
- "Partials" may request event rate or quantity percentage instead of count.

### Negative Examples

These examples must not map to this concept.

- "How many Sell executions?" is execution-side activity.
- "What percentage of quantity did I trim?" is not this event count.
- "Should I scale out now?" asks for advice.

### Context Requirements

Require server-authorized account scope and trusted selected lifecycle or
validated population. Membership uses current accepted stable allocation IDs
with exact `reducing` role; direction/side cannot replace role evidence.

### Required Data

- Current accepted allocation identities and `reducing` roles linked to current
  accepted executions/lifecycles.
- Authorized scope, projection state, compatible instrument/unit facts, and
  coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Compatible currency only for composed money/outcome requests.

### Valid Filters

- Validated authorized account, lifecycle state, ticker/instrument, direction,
  provenance, and account-IANA date filters.
- Filters cannot turn execution side, quantity change, or display rows into a
  `reducing` role.

### Valid Groupings

- Approved account, ticker/instrument, direction, provenance, and date/time
  groupings after stable allocation-identity deduplication.

### Valid Operators

- Exact event count, equality/threshold filtering, comparison, grouping, and
  ranking after Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Buy/Sell substitution, execution-ID or quantity count substitution, inferred
  roles/final closes, unauthorized access, raw private ID exposure, hidden
  decision coverage, behavioral motive, prediction, causation, or advice.

### Default Interpretation

Explicit scale-out wording counts stable `reducing` allocation events over
eligible `ready_closed`; it excludes `closing` and `flip_closing`. Generic
"exits" does not silently map to scale-outs.

### Clarification Conditions

Clarify when "trims," "partials," or "scale-outs" could mean reducing events
versus all exit events or reduced quantity and trusted context does not fix it.

### Recommended Clarification Wording

- "Do you mean reducing allocation events or all exit events?"

### Unsupported Conditions

- Missing/conflicting allocation identity or `reducing` role, unauthorized
  scope, unresolved required chain, unsupported filter attribution, or a
  request to infer scale-out behavior from side/quantity alone.

### Target Analytics Tool or Query Capability

- Planned Category 8 scale-out metric over read-only `JournalAnalyticsFactSet`,
  allocation/population builder, exact stable-event counter, coverage contract,
  and validated query extension.
- Existing scale primitives do not make this named contract Supported; AI Chat
  interpretation/runtime remains unimplemented.

### Result Units

- Non-negative integer stable `reducing` allocation-event count plus population
  and coverage. Exact zero requires a complete covered eligible population.

### Fee Handling

- Not applicable. Fees do not alter allocation identity or `reducing` role;
  composed net/P&L requests keep separate fee/currency coverage.

### Open-Trade Handling

- Default uses eligible `ready_closed`. Explicit factual `legitimate_open`
  reducing events are returned separately without inventing final close;
  `needs_decision`/incomplete chains remain visible coverage.

### Sample-Size Considerations

- Exact zero requires complete coverage; empty/unavailable is not zero. Small
  counts do not establish prudence, discipline, quality, causation, edge, or
  advice.

## `partial_exit_percentage` Language Registry

### Exact Definition

Deduplicate accepted allocation events by stable identity. Divide the exact
count of `reducing` events by the exact count of all `reducing`, `closing`, and
`flip_closing` events in one eligible population. Preserve the reduced ratio;
zero denominator is unavailable, never zero percent.

### Formal Wording

- "percentage of position-reducing events that are partial reductions"
- "reducing-event count divided by all exit-role event count"

### Normal Conversational Wording

- "What percentage of my exits were partial exits?"
- "How often did I trim instead of fully closing?"

### Trader Slang

- "What percent of my outs were trims?"
- "How trim-heavy were my exits?" remains an event rate, not quantity share.

### Abbreviations

- `partial exit %`, `PE%`, and `trim event %` in trusted context.
- `NVDA PE%` validates `NVDA`; bare `PE` can mean price/earnings.

### Common Misspellings

- `partal exit percentage`
- `partial exiit precent`

### Noisy or Incomplete Input

- `AAPL partial exits % pls`
- `trim pct?` requires event-rate versus quantity-rate clarification.

### Singular and Plural Forms

- Singular numerator event: "a partial exit" or `reducing` event.
- Plural metric: "partial exit percentage" over qualifying exit-role events.

### Full Questions

- "What was the partial-exit event percentage for eligible NVDA trades?"
- "What share of accepted exit events were reductions rather than closes?"

### Commands

- "Calculate reducing events divided by all exit-role events."
- "Show exact partial-exit event rate and denominator."

### Sentence Fragments

- "partial exit event %"
- "TSLA trim rate"

### Follow-Up Wording

- "Show the quantity percentage instead" does not reuse this metric and needs
  a separate, approved quantity-rate concept.
- "What about factual opens?" returns a separate state-labelled event rate.

### Correction Wording

- "I meant event percentage, not percentage of quantity exited."
- "Use reductions over reductions plus closes and flip-closes."

### Comparison Wording

- "Compare partial-exit event percentages for two authorized ticker groups."
- Each group retains exact event numerator/denominator and coverage.

### Ranking Wording

- "Rank validated tickers by partial-exit event percentage."
- Zero-denominator groups remain unavailable, never ranked as zero.

### Negated Wording

- "Partial-exit percentage, not quantity trimmed percentage."
- "Do not treat final closes as numerator events."

### Exclusion Wording

- "Partial-exit percentage excluding the selected ticker."
- Exclusion follows reconstruction/deduplication and preserves coverage.

### Multi-Filter Wording

- "Show partial-exit event percentage for eligible closed short AAPL
  lifecycles in the selected account-local period."

### Multi-Part Question Wording

- "Show partial-exit percentage, reducing-event numerator, and full exit-event
  denominator" returns one exact ratio with its components.

### Ambiguous Wording

- "Partial exit percentage" may mean event rate, quantity share, percentage of
  original position, or percentage of executions.
- "Trim rate" may refer to behavioral frequency rather than this exact ratio.

### Negative Examples

These examples must not map to this concept.

- "What percentage of shares did I exit?" is a quantity-rate request.
- "How many trims?" maps to `scale_out_count`.
- "Should I take partials?" asks for advice.

### Context Requirements

Require server-authorized account scope and a trusted selected lifecycle or
validated population. Long Sell and short Buy/cover reductions qualify only by
accepted role; execution side never defines numerator/denominator membership.

### Required Data

- Current accepted stable allocation IDs and roles `reducing`, `closing`, and
  `flip_closing`.
- Positive denominator, authorized scope, projection state, compatible
  instrument/unit facts, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, period, and selected-trade context.
- Compatible currency only for composed money/outcome requests.

### Valid Filters

- Validated account, lifecycle state, ticker/instrument, direction, provenance,
  and account-IANA date filters.
- Apply identical filters to numerator and denominator after stable deduplication.

### Valid Groupings

- Approved account, ticker/instrument, direction, provenance, and date/time
  groupings; recompute exact counts/ratio within each group.

### Valid Operators

- Exact ratio/percentage, comparison, threshold, grouping, and ranking after
  Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Quantity-rate inference, execution-ID denominator, side-based membership,
  zero-denominator substitution, unauthorized access, raw private ID exposure,
  hidden decision coverage, motive, prediction, causation, or advice.

### Default Interpretation

When explicitly selected, use the exact reducing-event/all-exit-event ratio for
eligible `ready_closed`. Generic "partial exit percentage" has no silent event-
versus-quantity default when the wording/context is ambiguous.

### Clarification Conditions

Clarify when "partial exit percentage," "trim rate," or similar wording does
not distinguish event percentage from quantity percentage.

### Recommended Clarification Wording

- "Do you mean the percentage of exit events that were partial, or the
  percentage of quantity exited in partials?"

### Unsupported Conditions

- Zero denominator; missing/conflicting allocation identity/role; unauthorized
  scope; unresolved required chain; unsupported filters; requested quantity
  rate without its own approved metric contract.

### Target Analytics Tool or Query Capability

- Planned Category 8 event-rate metric over read-only
  `JournalAnalyticsFactSet`, allocation builder, exact counter/rational math,
  coverage contract, and validated query extension.
- Existing partial/scale primitives do not make this named contract Supported;
  AI Chat interpretation/runtime remains unimplemented.

### Result Units

- Exact dimensionless reduced ratio and percentage with exact reducing-event
  numerator, all-exit-event denominator, population, and coverage.

### Fee Handling

- Not applicable. Fees do not change event membership; composed P/L requests
  retain separate gross or fee-complete net and currency coverage.

### Open-Trade Handling

- Default uses eligible `ready_closed`. Explicit factual `legitimate_open`
  reductions may form a separate event rate; `needs_decision`/incomplete or
  missing-role activity remains partial/unavailable coverage.

### Sample-Size Considerations

- Report numerator and denominator. Zero denominator is unavailable. Small
  denominators are descriptive only and do not establish quality, motive,
  causation, edge, or advice.

## `position_flips` Language Registry

### Exact Definition

Count distinct current accepted execution IDs that carry both `flip_closing`
and `flip_opening` allocation roles. Deduplicate over the full declared scope:
one execution that crosses flat and joins adjacent lifecycles counts once.

### Formal Wording

- "count of distinct executions containing both accepted flip roles"
- "scope-wide unique position-flip execution count"

### Normal Conversational Wording

- "How many times did I flip the position?"
- "Count executions that took me through flat into the other direction."

### Trader Slang

- "How many flips did I make?"
- "Count my long-to-short and short-to-long flips."

### Abbreviations

- `flip count`, `flip cnt`, and `pos flips` in trusted context.
- `NVDA flip cnt` validates `NVDA`; a ticker-like token is never guessed.

### Common Misspellings

- `postion flips`
- `flip exectuions`

### Noisy or Incomplete Input

- `AAPL flips how many`
- `reversals?` requires flip-execution versus separate close/re-entry meaning.

### Singular and Plural Forms

- Singular: "one position flip" means one distinct qualifying execution ID.
- Plural: "position flips" means the exact deduplicated count.

### Full Questions

- "How many accepted executions flipped TSLA from long to short or back?"
- "What is my position-flip count for the selected authorized account?"

### Commands

- "Count distinct executions carrying both flip roles."
- "Show position flips without counting the adjacent lifecycles twice."

### Sentence Fragments

- "position flip count"
- "NVDA long-short flips"

### Follow-Up Wording

- "Only short to long" applies a validated direction-transition filter.
- "Show the two adjacent trades" changes presentation, not flip identity.

### Correction Wording

- "I meant executions that cross flat, not separate closes and entries."
- "Count each flip execution once across the whole scope."

### Comparison Wording

- "Compare unique position-flip counts for two authorized accounts."
- Coverage and scope accompany each count.

### Ranking Wording

- "Rank validated tickers by position-flip count."
- Ties and incomplete coverage remain explicit.

### Negated Wording

- "Count flips, not every execution on either side."
- "Do not count a close and later re-entry as one flip."

### Exclusion Wording

- "Position flips excluding the selected ticker."
- Exclude only after accepted role classification and ID deduplication.

### Multi-Filter Wording

- "Count short-to-long flips for accepted Stock executions in the selected
  account-local period."

### Multi-Part Question Wording

- "Show flip count and the adjacent lifecycle states" returns one deduplicated
  count plus privacy-safe coverage, not duplicate counts.

### Ambiguous Wording

- "Reversals" may mean a single flip execution, separate close/re-entry, price
  reversal, or directional performance.
- "Switched sides" does not prove both accepted flip roles.

### Negative Examples

These examples must not map to this concept.

- "How many exits?" maps to an exit event/execution concept.
- "Did the stock reverse after I sold?" asks about market movement.
- "Should I reverse here?" asks for advice.

### Context Requirements

Require server-authorized account scope and current accepted execution plus
allocation facts. Buy/Sell side alone is insufficient; long-to-short and
short-to-long qualify symmetrically only through both accepted flip roles.

### Required Data

- Stable current accepted execution ID and accepted `flip_closing` plus
  `flip_opening` allocations tied to that same execution.
- Authorized scope, compatible instrument/unit facts, projection state, and
  coverage/Data Decisions.

### Optional Data

- Validated ticker, transition direction, provenance, period, and adjacent
  lifecycle labels.
- Compatible currency only for composed money requests.

### Valid Filters

- Validated account, ticker/instrument, transition direction, provenance,
  lifecycle state, and account-IANA date filters.
- Filter after role classification and scope-wide execution-ID deduplication.

### Valid Groupings

- Approved account, ticker/instrument, transition direction, provenance, and
  date/time groupings that do not duplicate one execution between groups.

### Valid Operators

- Exact count, comparison, grouping, threshold, and ranking after Categories
  12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Side-based inference, separate close/re-entry merging, per-lifecycle double
  count, unauthorized scope, raw private IDs, hidden decision coverage,
  motive, prediction, causation, quality judgment, or advice.

### Default Interpretation

When explicitly selected, count unique current accepted execution IDs with
both flip roles in eligible `ready_closed` coverage. "Reversal" alone has no
silent flip-execution default.

### Clarification Conditions

Clarify when wording does not distinguish one through-flat execution from a
close and later re-entry, or from a market-price reversal.

### Recommended Clarification Wording

- "Do you mean one execution that crossed through flat, or separate close and
  re-entry executions?"

### Unsupported Conditions

- Missing/conflicting execution identity or either flip role; unsupported
  grouping that duplicates an ID; unauthorized scope; unresolved required
  chain; or an unsupported source-attribution filter.

### Target Analytics Tool or Query Capability

- Planned Category 8 distinct-ID metric over read-only
  `JournalAnalyticsFactSet`, accepted allocations, coverage, and validated
  query extension.
- Existing allocation/flip primitives do not make this named language
  contract Supported; AI Chat interpretation/runtime remains unimplemented.

### Result Units

- Exact count of unique flip execution IDs, with population and coverage;
  never expose raw execution identifiers.

### Fee Handling

- Not applicable. Fees do not define flip roles; composed P/L retains separate
  gross or fee-complete net and compatible-currency coverage.

### Open-Trade Handling

- Default uses eligible `ready_closed` lifecycle coverage. An explicit current
  flip adjoining a factual `legitimate_open` lifecycle is separately labelled;
  `needs_decision`/incomplete adjacency is partial or unavailable.

### Sample-Size Considerations

- Exact zero requires complete role/identity coverage; unavailable is not zero.
  Small counts establish no intent, quality, causation, edge, or advice.

## `repeat_attempts` Language Registry

### Exact Definition

Build the complete server-authorized current lifecycle candidate sequence
before analytic date, result, or projection-state filters. Unconditionally
partition by account, stable instrument, and account-local entry date; order by
first-entry raw UTC then stable round-trip ID. Attempts are qualifying zero-to-
nonzero lifecycles: the first qualifying zero-to-nonzero lifecycle is the
initial attempt and the second and later qualifying ones are repeat attempts.
An incomplete or otherwise nonqualifying candidate remains a state-labelled
barrier but is not counted as an attempt. Report exact pre-barrier results and
partial/unavailable coverage at and after the barrier; never skip it or
renumber later candidates.

### Formal Wording

- "count of second-and-later qualifying zero-to-nonzero lifecycles in the
  fixed daily instrument partition"
- "repeat-attempt count with state-labelled sequence barriers"

### Normal Conversational Wording

- "How many times did I trade the same ticker again that day?"
- "Count my repeat attempts after the first trade lifecycle."

### Trader Slang

- "How many re-entries did I take?"
- "Count the second tries and later tries on NVDA."

### Abbreviations

- `repeat count`, `re-entry cnt`, and `2nd+ attempts` in trusted context.
- `AMD repeats` validates `AMD`; abbreviations never authorize a guessed ticker.

### Common Misspellings

- `reapeat attempts`
- `re entery count`

### Noisy or Incomplete Input

- `TSLA again same day how many`
- `retries?` requires lifecycle-attempt versus execution meaning.

### Singular and Plural Forms

- Singular: "a repeat attempt" is one second-or-later qualifying zero-to-
  nonzero lifecycle.
- Plural: "repeat attempts" is the exact eligible count before any barrier.

### Full Questions

- "How many repeat NVDA lifecycle attempts occurred on each account-local
  entry date?"
- "Were there any exact repeats before a decision-state barrier?"

### Commands

- "Build the full candidate sequence, then count second-and-later attempts."
- "Keep unresolved candidates as barriers and do not renumber after them."

### Sentence Fragments

- "same-day repeat attempts"
- "AAPL second tries"

### Follow-Up Wording

- "Only winners" applies the result filter after sequence construction and
  cannot remove a predecessor or barrier.
- "Only last week" also selects after the full authorized sequence is built.

### Correction Wording

- "I meant repeated trade lifecycles, not repeated entry executions."
- "Keep the unresolved trade in place; do not renumber later attempts."

### Comparison Wording

- "Compare repeat-attempt counts for two authorized instruments."
- Compare exact pre-barrier results with coverage, never hidden candidates.

### Ranking Wording

- "Rank validated tickers by exact repeat-attempt count."
- Partial/unavailable post-barrier populations cannot be silently ranked as
  complete.

### Negated Wording

- "Repeat attempts, not executions within one trade."
- "Do not drop losing, open, or decision candidates before numbering."

### Exclusion Wording

- "Repeat attempts excluding the selected result" applies only after the
  authoritative candidate sequence exists and never changes ordinals.

### Multi-Filter Wording

- "Show profitable repeat attempts for authorized NVDA candidates entered on
  the selected account-local dates" builds and numbers before filters.

### Multi-Part Question Wording

- "Show repeat count, exact pre-barrier attempts, and the first barrier state"
  returns state-labelled coverage without exposing stable IDs.

### Ambiguous Wording

- "Another try" may mean a lifecycle, entry allocation, execution, or order.
- "Re-entry" may mean adding to an open position rather than a new lifecycle.

### Negative Examples

These examples must not map to this concept.

- "How many entry executions were in this trade?" maps to execution count.
- "Why did I revenge trade?" asks for unsupported motive/causation.
- "Should I try again?" asks for advice.

### Context Requirements

Require server-authorized account scope, stable instrument identity, account
IANA timezone, raw first-entry UTC, stable round-trip identity, and visible
candidate state. A non-day-specific request cannot bypass the fixed partition.

### Required Data

- Every current lifecycle candidate in the authorized account/instrument/day
  partition, including `ready_closed`, `legitimate_open`, `needs_decision`, and
  incomplete candidates.
- Raw first-entry UTC, stable ID, account IANA timezone, result/state facts,
  and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, selected result/date/state filters,
  and privacy-safe ordinal labels.
- Compatible currency only for composed P/L requests.

### Valid Filters

- Validated analytic date, result, projection state, direction, provenance,
  and ticker filters only after the full authorized candidate sequence exists.
- No filter may remove a predecessor/barrier or renumber across it.

### Valid Groupings

- The defining partition is always authorized account plus stable instrument
  plus account-local entry date. Results may then be summarized by approved
  account, ticker, direction, provenance, or date grouping without repartition.

### Valid Operators

- Exact count, comparison, grouping, threshold, and ranking over the preserved
  sequence and state-labelled coverage.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Pre-sequence analytic filtering, barrier removal, ordinal renumbering,
  execution/event substitution, cross-account/instrument/day coalescing,
  unauthorized scope, raw private IDs, motive, causation, prediction, or advice.

### Default Interpretation

When explicitly selected, count second-and-later qualifying zero-to-nonzero
lifecycles in the fixed partition. Incomplete/nonqualifying candidates remain
visible barriers but are not attempt counts; results are exact only before any
barrier. Generic "retries" has no silent lifecycle default.

### Clarification Conditions

Clarify when "attempt," "retry," or "re-entry" does not distinguish a new
zero-to-nonzero lifecycle from another execution/allocation in one lifecycle.

### Recommended Clarification Wording

- "Do you mean repeated zero-to-nonzero trade lifecycles, or repeated entry
  executions within one trade?"

### Unsupported Conditions

- Missing account timezone, stable instrument/round-trip identity, or first-
  entry UTC; unresolved candidate order; unauthorized scope; or requested
  filters/groupings that would remove a barrier or change ordinals.

### Target Analytics Tool or Query Capability

- Planned Category 8 lifecycle-sequence metric over read-only
  `JournalAnalyticsFactSet`, raw UTC ordering, IANA localization, coverage, and
  validated query extension.
- Existing lifecycle primitives do not make this named language contract
  Supported; AI Chat interpretation/runtime remains unimplemented.

### Result Units

- Exact count of second-and-later qualifying zero-to-nonzero lifecycle attempts,
  with fixed partition, visible noncounted barriers, exact pre-barrier range,
  and partial/unavailable coverage at and after a barrier.

### Fee Handling

- Fees do not define sequence membership. Result-filter compositions must use
  compatible gross or fee-complete net facts after sequencing.

### Open-Trade Handling

- `legitimate_open`, `needs_decision`, and incomplete candidates remain visible
  in sequence before state filters. Decision/incomplete candidates are barriers;
  factual opens are state-labelled and never silently treated as realized.

### Sample-Size Considerations

- Report candidate and repeat counts plus barrier coverage. Small counts do not
  establish persistence, revenge trading, quality, causation, edge, or advice.

## `trade_sequence` Language Registry

### Exact Definition

Build the complete server-authorized current lifecycle candidate sequence
before analytic date, result, or projection-state filters. Unconditionally
partition by account, stable instrument, and account-local entry date; order by
first-entry raw UTC then stable round-trip ID and assign stable one-based
ordinals. A `needs_decision` or incomplete candidate is a visible state-labelled
barrier: ordinals before it are exact and coverage at/after it is partial or
unavailable. Never skip a barrier or renumber later candidates.

### Formal Wording

- "one-based lifecycle ordinal within the fixed account-instrument-entry-date
  partition"
- "chronological trade sequence with state-labelled barriers"

### Normal Conversational Wording

- "Was this my first, second, or third trade on that ticker that day?"
- "Show the order of my same-day trade lifecycles."

### Trader Slang

- "Which try was this?"
- "Show first trade, second trade, third trade on AMD."

### Abbreviations

- `trade seq`, `seq #`, and `attempt #` in trusted context.
- `AMD seq` validates `AMD`; ticker-like abbreviations are never guessed.

### Common Misspellings

- `trade sequnce`
- `sequece numbr`

### Noisy or Incomplete Input

- `NVDA which trade # that day`
- `order of trades?` requires lifecycle versus execution clarification.

### Singular and Plural Forms

- Singular: "trade sequence number" is one candidate's stable ordinal.
- Plural: "trade sequence" is the ordered candidate list with coverage.

### Full Questions

- "What was this lifecycle's sequence number for its account-local entry day?"
- "Show the ordered AAPL lifecycle candidates and any decision barrier."

### Commands

- "Order all authorized candidates by first-entry UTC and stable ID."
- "Assign ordinals without filtering or skipping barriers first."

### Sentence Fragments

- "TSLA trade sequence"
- "same-day attempt number"

### Follow-Up Wording

- "Only winners" selects after sequence construction and preserves original
  ordinals and barriers.
- "For last week" cannot rebuild or renumber a narrower sequence.

### Correction Wording

- "I meant lifecycle order, not execution order."
- "Keep the unresolved candidate as a barrier and preserve later ordinals."

### Comparison Wording

- "Compare outcomes by original trade sequence number."
- Comparison retains the fixed partition and state-labelled coverage.

### Ranking Wording

- "Rank validated tickers by count of third-or-later sequence candidates."
- Do not rank partial/unavailable coverage as complete.

### Negated Wording

- "Sequence lifecycle candidates, not fills or allocation rows."
- "Do not filter losers or opens before assigning sequence numbers."

### Exclusion Wording

- "Show sequence excluding losing results" filters the already-numbered output;
  it cannot remove predecessors/barriers or close ordinal gaps.

### Multi-Filter Wording

- "Show ready-closed NVDA candidates numbered third or later in the selected
  date range" constructs each full authorized daily partition first.

### Multi-Part Question Wording

- "Show each trade sequence number, state, and exact pre-barrier coverage"
  returns privacy-safe ordinals without raw stable IDs.

### Ambiguous Wording

- "Trade order" may mean lifecycle ordinal, execution order, order ticket, or
  chronological display sort.
- "First trade" may mean first candidate, first fill, or first displayed row.

### Negative Examples

These examples must not map to this concept.

- "List the fills in execution order" is an execution-ledger request.
- "Was my third trade reckless?" asks for unsupported quality judgment.
- "What should my next trade be?" asks for advice/prediction.

### Context Requirements

Require server-authorized account, stable instrument, account IANA timezone,
raw first-entry UTC, stable round-trip identity, and visible candidate state. A
non-day-specific request never bypasses the fixed account/instrument/local-date
partition.

### Required Data

- Every current lifecycle candidate in each authorized fixed partition,
  including `ready_closed`, `legitimate_open`, `needs_decision`, and incomplete.
- Raw first-entry UTC, stable round-trip ID, account IANA timezone, projection
  state, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, analytic result/date/state filters,
  and privacy-safe ordinal display.
- Compatible currency only for composed outcome requests.

### Valid Filters

- Validated date, result, projection state, direction, provenance, ticker, and
  ordinal filters only after the complete authorized sequence is built.
- Filters never remove a predecessor/barrier or renumber across it.

### Valid Groupings

- The defining partition is unconditionally account plus stable instrument
  plus account-local entry date. Approved summaries may group preserved
  ordinals by account, ticker, date, direction, provenance, or state.

### Valid Operators

- Exact selection by ordinal, count, comparison, grouping, threshold, and
  ranking while preserving sequence and barrier coverage.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Pre-sequence analytic filtering, renumbering gaps, barrier removal,
  execution/order-row substitution, cross-partition sequence, unauthorized
  scope, raw private IDs, hidden decisions, motive, causation, or advice.

### Default Interpretation

When explicitly selected, return the original one-based lifecycle ordinal in
the fixed partition. Generic "order" or "sequence" has no silent lifecycle
interpretation without context.

### Clarification Conditions

Clarify when wording does not distinguish lifecycle ordinal from execution/fill
order, or when the user appears to request a cross-day sequence.

### Recommended Clarification Wording

- "Do you mean the lifecycle's same-instrument, account-local-day sequence
  number, or the order of its executions?"

### Unsupported Conditions

- Missing account timezone, stable instrument/round-trip identity, or first-
  entry UTC; unresolved ordering tie; unauthorized scope; or requested logic
  that bypasses the fixed partition, removes barriers, or renumbers candidates.

### Target Analytics Tool or Query Capability

- Planned Category 8 lifecycle-sequence selector over read-only
  `JournalAnalyticsFactSet`, raw UTC ordering, IANA localization, coverage, and
  validated query extension.
- Existing sequence primitives do not make this named language contract
  Supported; AI Chat interpretation/runtime remains unimplemented.

### Result Units

- Exact one-based ordinal and/or ordered privacy-safe lifecycle list with fixed
  partition, state labels, barrier position, and coverage.

### Fee Handling

- Fees do not affect sequence. Result-based compositions use compatible gross
  or fee-complete net facts only after ordinals are fixed.

### Open-Trade Handling

- All current candidate states enter the sequence before state filters.
  `needs_decision`/incomplete candidates are barriers; `legitimate_open` is
  state-labelled and never silently converted into realized output.

### Sample-Size Considerations

- Report partition size and barrier coverage with ordinals. Sequence position
  alone establishes no quality, motive, causation, edge, or advice.

## `average_shares_per_execution` Language Registry

### Exact Definition

Within one compatible share-unit partition, select distinct current accepted
Stock executions whose instrument multiplier is exactly one. Sum each distinct
execution's exact absolute quantity once and divide by the distinct execution
count. A flip execution contributes once. Preserve exact arithmetic; mixed
units, contracts, non-unit multipliers, or a zero denominator are unavailable.

### Formal Wording

- "mean absolute share quantity per distinct accepted Stock execution"
- "exact sum of execution share quantities divided by distinct execution count"

### Normal Conversational Wording

- "How many shares did I trade per execution on average?"
- "What was my average accepted fill size in shares?"

### Trader Slang

- "What was my avg shares per fill?"
- "How big were my prints on average?" requires execution interpretation.

### Abbreviations

- `avg sh/exec`, `shares/fill`, and `avg exec qty` in trusted context.
- `AAPL avg sh/exec` validates `AAPL`; `sh` is shares only in Stock context.

### Common Misspellings

- `average shars per execution`
- `avg shares per exectuion`

### Noisy or Incomplete Input

- `NVDA avg shares each fill pls`
- `avg size?` requires shares/execution versus allocation or position meaning.

### Singular and Plural Forms

- Singular member: one distinct accepted Stock execution's absolute shares.
- Plural metric: mean shares across distinct qualifying executions.

### Full Questions

- "What was my exact average shares per accepted AAPL execution?"
- "How many shares per distinct Stock execution did I average?"

### Commands

- "Calculate exact absolute shares per distinct accepted execution."
- "Deduplicate executions and count a flip only once."

### Sentence Fragments

- "average shares per execution"
- "TSLA avg sh/fill"

### Follow-Up Wording

- "Only exits" applies an accepted-role filter without duplicating an execution.
- "What about options?" is unavailable here because contracts are not shares.

### Correction Wording

- "I meant shares per distinct execution, not allocation-event size."
- "Use absolute quantity once per execution and exclude contracts."

### Comparison Wording

- "Compare average shares per execution for two authorized Stock tickers."
- Keep each comparison within a compatible share-unit partition.

### Ranking Wording

- "Rank validated Stock tickers by average shares per execution."
- Zero-denominator or incompatible-unit groups remain unavailable.

### Negated Wording

- "Average shares, not contracts per execution."
- "Do not count a flip twice through its two allocation roles."

### Exclusion Wording

- "Average shares per execution excluding the selected ticker."
- Exclusions occur after current accepted execution identity is established.

### Multi-Filter Wording

- "Average shares per accepted exit execution for long NVDA trades in the
  selected account-local period."

### Multi-Part Question Wording

- "Show average shares, exact total shares, and execution denominator" returns
  one exact ratio and its coverage in a single compatible unit.

### Ambiguous Wording

- "Average size" may mean shares, contracts, dollars, allocations, entries, or
  maximum position size.
- "Fill" may mean a source row rather than a current accepted execution.

### Negative Examples

These examples must not map to this concept.

- "Average contracts per options fill" uses contract units.
- "What was my average position size?" is a lifecycle exposure request.
- "What size should I trade?" asks for advice.

### Context Requirements

Require server-authorized account scope, current accepted execution identity,
Stock instrument type, exact multiplier one, and one compatible share unit.
Long/short and Buy/Sell do not change absolute-quantity membership.

### Required Data

- Stable current accepted execution ID, exact execution quantity, Stock type,
  multiplier one, compatible share unit, authorized scope, and projection state.
- Coverage and Data Decisions sufficient to distinguish unavailable from zero.

### Optional Data

- Validated ticker, accepted allocation role, direction, provenance, period,
  and selected lifecycle context.
- Currency is irrelevant unless a separate composed money metric is requested.

### Valid Filters

- Validated account, ticker/instrument, allocation role, direction, provenance,
  lifecycle state, and account-IANA date filters.
- Deduplicate execution IDs after qualification and before sum/count.

### Valid Groupings

- Approved account, ticker/instrument, role, direction, provenance, and date/time
  groups, each restricted to a compatible Stock share-unit partition.

### Valid Operators

- Exact rational mean, comparison, grouping, threshold, and ranking after
  Categories 12/14 validate their contracts.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Contracts, mixed quantity units, non-unit multipliers, allocated quantity
  counted per role, duplicate execution IDs, zero-denominator substitution,
  unauthorized access, raw private IDs, causation, prediction, or advice.

### Default Interpretation

When explicitly selected, use exact absolute shares once per distinct current
accepted Stock multiplier-one execution in eligible `ready_closed` coverage.
Generic "average size" has no silent shares-per-execution default.

### Clarification Conditions

Clarify when "average size," "fill size," or "shares" does not establish
distinct execution membership, Stock/share units, or allocation-versus-
execution basis.

### Recommended Clarification Wording

- "Do you mean shares per distinct Stock execution, or quantity per allocation
  event or position?"

### Unsupported Conditions

- Zero denominator; non-Stock instrument; multiplier other than one; mixed or
  missing quantity units; missing/conflicting current execution identity or
  quantity; unauthorized scope; unresolved required chain.

### Target Analytics Tool or Query Capability

- Planned Category 8 exact execution-quantity mean over read-only
  `JournalAnalyticsFactSet`, instrument/unit validation, distinct-ID
  aggregation, coverage, and validated query extension.
- Existing execution quantities do not make this named language contract
  Supported; AI Chat interpretation/runtime remains unimplemented.

### Result Units

- Exact shares per execution with exact absolute-share numerator, distinct-
  execution denominator, compatible share unit, population, and coverage.

### Fee Handling

- Not applicable. Fees do not change share quantity; composed money requests
  retain separate compatible-currency and gross/net coverage.

### Open-Trade Handling

- Default uses executions assigned to eligible `ready_closed` lifecycles.
  Explicit factual `legitimate_open` executions are separate state-labelled
  coverage; `needs_decision`/incomplete membership is partial/unavailable.

### Sample-Size Considerations

- Report exact share sum and distinct execution count. Zero denominator is
  unavailable; small samples imply no quality, causation, edge, or advice.

## `execution_duration` Language Registry

### Exact Definition

`execution_duration` is a terminology and selection alias to Category 7
`hold_duration` for an eligible `ready_closed` lifecycle. Category 7 solely
owns the exact final-exit UTC minus first-entry UTC arithmetic. Category 8
performs no duplicate calculation and never interprets this name as order
duration, fill duration, last-activity span, or open age.

### Formal Wording

- "Category 7 hold duration for the selected eligible closed lifecycle"
- "elapsed first-entry-to-final-exit duration"

### Normal Conversational Wording

- "How long was I in this completed trade?"
- "What was the execution duration for this closed position?"

### Trader Slang

- "How long was I in it?"
- "What was my hold time on NVDA?"

### Abbreviations

- `exec duration`, `hold dur`, and `time in trade` in trusted context.
- `AMD exec dur` validates `AMD`; `exec` alone does not mean an order/fill span.

### Common Misspellings

- `exection duration`
- `executon duraton`

### Noisy or Incomplete Input

- `AAPL how long in trade`
- `duration?` requires lifecycle versus execution-processing meaning.

### Singular and Plural Forms

- Singular: one eligible lifecycle's Category 7 `hold_duration`.
- Plural: duration summaries delegate each member to that same contract.

### Full Questions

- "What was the first-entry-to-final-exit duration for this ready-closed trade?"
- "How long were my eligible TSLA lifecycles held?"

### Commands

- "Use Category 7 hold duration for the selected closed lifecycle."
- "Show raw-endpoint-derived hold duration without recalculating it here."

### Sentence Fragments

- "execution duration"
- "NVDA time in trade"

### Follow-Up Wording

- "Show milliseconds" changes only Category 7 presentation precision.
- "What about the open trade?" is not execution duration; open age remains a
  separate Category 7 concept.

### Correction Wording

- "I meant the whole closed trade, not one fill's processing time."
- "Use first entry through final exit, not last activity."

### Comparison Wording

- "Compare execution duration for two eligible closed lifecycles."
- Comparison consumes Category 7 values with identical coverage semantics.

### Ranking Wording

- "Rank eligible closed trades by execution duration."
- Ranking never substitutes open age or unavailable endpoints.

### Negated Wording

- "Execution duration, not order-to-fill latency."
- "Do not use last activity or an open position's current age."

### Exclusion Wording

- "Execution-duration summary excluding the selected ticker."
- Exclusions select eligible Category 7 hold-duration results; they do not
  change endpoint arithmetic.

### Multi-Filter Wording

- "Show execution durations for eligible closed short NVDA lifecycles entered
  in the selected account-local period."

### Multi-Part Question Wording

- "Show execution duration, first-entry UTC, and final-exit UTC" returns the
  Category 7 result and privacy-safe endpoints, subject to authorization.

### Ambiguous Wording

- "Execution duration" may mean lifecycle hold duration, order latency, fill
  span, time between executions, last-activity span, or open age.
- "Trade time" may mean clock timestamp rather than elapsed duration.

### Negative Examples

These examples must not map to this concept.

- "How long did the order take to fill?" is order/fill latency.
- "How old is my open position?" is Category 7 open age.
- "Did holding longer cause the loss?" asks for causation.

### Context Requirements

Require server-authorized account scope and one eligible `ready_closed`
lifecycle with Category 7 endpoint coverage. Raw UTC owns arithmetic; account
IANA timezone is presentation/date context only.

### Required Data

- Category 7 `hold_duration`, its first-entry/final-exit raw UTC endpoints,
  eligible `ready_closed` state, stable lifecycle identity, authorization, and
  coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, account-IANA display timezone, and
  requested duration presentation unit.
- Currency and fees are irrelevant unless separately composed.

### Valid Filters

- Category 7-approved account, ticker/instrument, direction, provenance,
  eligible state, and raw-UTC/account-IANA date filters.
- Filters select results; they never redefine endpoints.

### Valid Groupings

- Approved account, ticker/instrument, direction, provenance, and date/time
  groupings over Category 7 hold-duration values.

### Valid Operators

- Exact selection, comparison, grouping, threshold, and ranking through the
  Category 7 duration contract and later validated operator categories.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Duplicate Category 8 arithmetic, order/fill latency, last-activity span,
  open age, invented endpoint, unauthorized scope, raw private IDs, hidden
  decision coverage, motive, causation, prediction, or advice.

### Default Interpretation

When explicitly selected for an eligible `ready_closed` lifecycle, resolve to
Category 7 `hold_duration`. Ambiguous standalone "duration" has no silent
lifecycle default.

### Clarification Conditions

Clarify when the request could mean whole-lifecycle hold duration, order/fill
processing time, last-activity span, or current open age.

### Recommended Clarification Wording

- "Do you mean the closed trade's first-entry-to-final-exit hold duration, or
  the timing of an individual order or fill?"

### Unsupported Conditions

- Non-`ready_closed` lifecycle; missing/conflicting Category 7 endpoint or
  eligibility; unauthorized scope; unresolved required chain; or a requested
  duration meaning outside the Category 7 hold-duration contract.

### Target Analytics Tool or Query Capability

- Planned Category 8 terminology/selection resolver that delegates to the
  Category 7 `hold_duration` result and coverage contract.
- Existing duration arithmetic does not make this named language alias
  Supported; no second calculator or AI Chat runtime exists.

### Result Units

- Exactly the Category 7 duration representation and precision, with endpoint,
  population, and coverage context.

### Fee Handling

- Not applicable. Fees never change duration endpoints; composed P/L retains
  its separate gross/net and compatible-currency contract.

### Open-Trade Handling

- Unsupported for this alias. `legitimate_open` uses Category 7 open age only
  when explicitly requested; `needs_decision`/incomplete coverage remains
  unavailable and is never assigned a final-exit timestamp.

### Sample-Size Considerations

- A single eligible lifecycle can have an exact duration. Aggregate summaries
  expose eligible count/coverage and imply no quality, causation, or advice.

## `entry_to_exit_quantity_reconciliation` Language Registry

### Exact Definition

For one authorized lifecycle and compatible quantity unit, publish exact total
position-increasing allocated quantity, exact total position-decreasing
allocated quantity, and exact residual `entered - exited`. An eligible
`ready_closed` lifecycle must reconcile to exactly zero. A factual
`legitimate_open` lifecycle must have an exact positive absolute residual equal
to its factual remaining open quantity; lifecycle direction supplies the sign
of the corresponding signed quantity. `needs_decision` or incomplete evidence
is unresolved coverage. Preserve exact quantity conservation; never invent,
net away, or repair a discrepancy.

### Formal Wording

- "exact increasing quantity, decreasing quantity, absolute residual, and
  direction-signed open quantity"
- "entry-to-exit allocation quantity reconciliation by projection state"

### Normal Conversational Wording

- "Do the shares I entered and exited balance?"
- "Show what went in, what came out, and what remains."

### Trader Slang

- "Do my ins and outs match?"
- "Am I flat on the books for this trade?"

### Abbreviations

- `qty recon`, `in/out qty`, and `entry-exit recon` in trusted context.
- `NVDA qty recon` validates `NVDA`; `recon` never authorizes invented repair.

### Common Misspellings

- `quantiy reconcilliation`
- `entry to exiit recon`

### Noisy or Incomplete Input

- `AAPL in vs out whats left`
- `does it balance` requires quantity versus money clarification.

### Singular and Plural Forms

- Singular: one lifecycle's entered, exited, and residual quantities.
- Plural: separate reconciliations; never sum incompatible units/states.

### Full Questions

- "Does this ready-closed Stock lifecycle reconcile to exactly zero shares?"
- "What exact quantity remains on this factually open position?"

### Commands

- "Reconcile exact increasing and decreasing allocated quantities."
- "Show the residual and projection-state coverage without repairing it."

### Sentence Fragments

- "entry exit quantity recon"
- "TSLA shares in/out/left"

### Follow-Up Wording

- "Why is it nonzero?" may explain factual evidence/coverage, not infer cause.
- "Treat it as closed" cannot override a legitimate-open or decision state.

### Correction Wording

- "I meant quantity conservation, not P/L reconciliation."
- "Keep the exact residual; do not force it to zero."

### Comparison Wording

- "Compare reconciliation states for two authorized lifecycles."
- Preserve each lifecycle's compatible unit, exact values, and coverage.

### Ranking Wording

- "Rank validated lifecycles by absolute factual residual" is allowed only
  within one compatible unit; unresolved states stay unavailable.

### Negated Wording

- "Reconcile quantities, not cash or P/L."
- "Do not infer a closing fill or opening balance to make it balance."

### Exclusion Wording

- "Reconcile accepted allocations excluding the disputed source member" is
  unsupported unless a trader-approved decision already authorizes exclusion.

### Multi-Filter Wording

- "Show reconciliation for eligible closed NVDA Stock lifecycles in the
  selected authorized account-local period."

### Multi-Part Question Wording

- "Show entered quantity, exited quantity, residual, state, and coverage" is
  the canonical complete reconciliation response.

### Ambiguous Wording

- "Balance" may mean residual quantity, cash balance, cost basis, or P/L.
- "Remaining" may mean factual open quantity or an unresolved discrepancy.

### Negative Examples

These examples must not map to this concept.

- "Did my cash balance reconcile?" is cash accounting.
- "Fill in the missing exit so it closes" requests invented repair.
- "Why did the broker lose shares?" asserts unsupported causation.

### Context Requirements

Require server-authorized account/lifecycle scope, accepted allocation roles,
projection state, and one compatible instrument quantity unit. Long and short
use increasing/decreasing roles rather than Buy/Sell side.

### Required Data

- Stable accepted allocation identities, exact quantities, increasing versus
  decreasing roles, compatible unit/instrument, lifecycle identity/state,
  authorization, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, provenance, raw UTC/account-IANA date context,
  and privacy-safe source-type labels.
- Currency/fees only for a separate composed money reconciliation.

### Valid Filters

- Validated account, lifecycle state, ticker/instrument, direction, provenance,
  and account-IANA date filters supported by allocation attribution.
- Apply identical filters before exact entered/exited totals.

### Valid Groupings

- Primarily lifecycle. Approved account/ticker/state/date summaries must retain
  per-lifecycle conservation and compatible units rather than netting errors.

### Valid Operators

- Exact add/subtract, equality to zero, absolute residual, comparison, grouping,
  and threshold within one compatible quantity unit.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Mixed units, side-only role inference, invented opening/closing quantity,
  silent residual repair, treating open quantity as realized, unauthorized
  scope, raw private IDs, hidden decisions, causation, prediction, or advice.

### Default Interpretation

When explicitly selected, report entered, exited, exact residual, projection
state, and coverage. Eligible `ready_closed` requires exact zero. Factual
`legitimate_open` requires an exact positive absolute residual equal to factual
remaining open quantity, with direction supplying its sign. Unresolved
candidates receive no inferred residual or state.

### Clarification Conditions

Clarify when "reconcile," "balance," or "remaining" does not distinguish
quantity conservation from cash/P&L, or when lifecycle/state is unspecified.

### Recommended Clarification Wording

- "Do you want the exact entered, exited, and remaining quantity for one trade
  lifecycle, or a cash/P&L reconciliation?"

### Unsupported Conditions

- Missing/conflicting allocation role, identity, quantity, unit, or projection
  state; mixed units; unauthorized scope; unresolved required chain; or a
  requested repair unsupported by accepted evidence.

### Target Analytics Tool or Query Capability

- Planned Category 8 exact conservation view over read-only
  `JournalAnalyticsFactSet`, allocation graph, projection state, unit validator,
  coverage, and validated query extension.
- Existing reconciliation primitives do not make this named language contract
  Supported; AI Chat runtime and repair authority remain absent.

### Result Units

- Exact entered and exited quantities plus residual in one compatible unit.
  Preserve exact zero for `ready_closed`; for factual `legitimate_open`, return
  positive absolute residual equal to remaining open quantity and the
  direction-signed quantity, plus state and coverage.

### Fee Handling

- Not applicable to quantity conservation. Fees remain separate money facts and
  must never be converted into or subtracted from quantity.

### Open-Trade Handling

- `ready_closed` requires exact zero; `legitimate_open` requires exact positive
  absolute residual equal to factual remaining open quantity, with direction
  supplying signed quantity. `needs_decision`/incomplete evidence reports
  unresolved coverage, never a fabricated zero or factual open classification.

### Sample-Size Considerations

- One lifecycle can reconcile exactly. Population summaries report state counts
  and coverage; netting residuals across trades cannot prove conservation.

## `unmatched_executions` Language Registry

### Exact Definition

Return a non-overlapping labelled coverage bundle, deduplicated by stable
underlying member identity with deterministic precedence: (c) distinct
provisional reconciliation candidate members first; Data Decision state is
metadata and is never itself a counted member; then (b) accepted executions
lacking a required allocation only when not already classified in (c); then
(a) source records unable to form an accepted execution only when not
represented in (c). Never double-count across labels or turn a decision into a
match. Apply only filters supported by source/member attribution, using bounded
server-authorized account coverage where narrower attribution is unavailable.

### Formal Wording

- "exclusive unmatched-member coverage by precedence c, then b, then a"
- "stable-identity-deduplicated provisional, allocation-missing, and source-
  formation coverage"

### Normal Conversational Wording

- "Which execution-related records are still unmatched?"
- "Show unmatched items by type without counting anything twice."

### Trader Slang

- "What fills are still hanging?"
- "Show the orphaned execution stuff" requires source/execution/member scope.

### Abbreviations

- `unmatched execs`, `unmatched cnt`, and `recon pending` in trusted context.
- `AMD unmatched` is used only when stable member attribution supports AMD.

### Common Misspellings

- `unmached executions`
- `unmatchd exectuions`

### Noisy or Incomplete Input

- `whats unmatched still`
- `orphan fills?` requires source-row versus accepted-execution clarification.

### Singular and Plural Forms

- Singular: one stable underlying member assigned to exactly one label.
- Plural: the exclusive labelled bundle and per-label exact counts.

### Full Questions

- "How many unmatched members are provisional reconciliation candidates?"
- "Show accepted executions missing allocation without double-counting
  provisional members."

### Commands

- "Classify unmatched members using c-then-b-then-a precedence."
- "Deduplicate stable members and show bounded attribution coverage."

### Sentence Fragments

- "unmatched execution coverage"
- "NVDA recon pending items"

### Follow-Up Wording

- "Count decisions too" is rejected: decision state is metadata, not a member.
- "Only this ticker" applies only when underlying attribution supports it.

### Correction Wording

- "I meant underlying candidate members, not Data Decision rows."
- "Put provisional members in c first and do not count them again in b or a."

### Comparison Wording

- "Compare exclusive unmatched-label counts for two authorized accounts."
- Each bundle retains its attribution limits and coverage boundary.

### Ranking Wording

- "Rank authorized accounts by unmatched-member count."
- Do not rank narrower ticker/source groups when attribution cannot support them.

### Negated Wording

- "Do not count the Data Decision itself."
- "Do not double-count one member across provisional and source labels."

### Exclusion Wording

- "Exclude provisional candidates" removes label (c) from presentation only;
  it cannot reclassify its members into (b) or (a).

### Multi-Filter Wording

- "Show unmatched members for the authorized account and attributed source
  type in the selected period" is valid only at supported attribution grain.

### Multi-Part Question Wording

- "Show total unmatched, counts for c/b/a, and attribution coverage" returns
  exclusive counts whose sum equals the deduplicated total.

### Ambiguous Wording

- "Unmatched executions" may refer to provisional source members, accepted
  executions without allocation, source rows without accepted execution, or
  Data Decision records.
- "Missing fills" may mean absent broker evidence rather than an existing member.

### Negative Examples

These examples must not map to this concept.

- "How many Data Decisions are open?" counts decision records, not members.
- "Assume these two records match" requests unsupported factual resolution.
- "Why did the broker fail?" asks for unsupported causation.

### Context Requirements

Require server-authorized account scope, current source/execution/allocation and
provisional-candidate evidence, stable underlying identities, and visible Data
Decision metadata. Narrow filters require factual attribution; otherwise use
and label bounded account-scope coverage.

### Required Data

- Stable identities for provisional candidate members, accepted executions,
  and source records; accepted-execution/allocation links; candidate membership;
  authorization; attribution facts; and coverage/Data Decision state metadata.

### Optional Data

- Supported source type, validated ticker/instrument, raw UTC/account-IANA date,
  provenance, decision state, and privacy-safe reason labels.
- Currency/unit only as coverage descriptors, not matching inventions.

### Valid Filters

- Server-authorized account always. Source, ticker/instrument, date, provenance,
  or state only when the underlying member has reliable attribution.
- Filters never create a match or alter c-before-b-before-a precedence.

### Valid Groupings

- Exclusive label, authorized account, and only reliably attributed source,
  instrument, provenance, date, or decision-state metadata groups.
- Deduplicate globally within declared scope before group totals.

### Valid Operators

- Exact distinct-member count, labelled breakdown, comparison, grouping,
  threshold, and ranking within supported attribution and coverage.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Counting decision records, treating decision metadata as a member/match,
  double-counting labels, changing precedence, unsupported attribution filters,
  invented resolution, unauthorized scope, raw private IDs, motive, causation,
  prediction, or advice.

### Default Interpretation

When explicitly selected, return the exclusive c/b/a bundle and deduplicated
total for the narrowest factually attributable authorized scope. Generic
"unmatched" requires clarification when the object or scope is unclear.

### Clarification Conditions

Clarify when the user may mean Data Decision count rather than underlying
members, or requests a ticker/source/date filter unsupported by attribution.

### Recommended Clarification Wording

- "Do you want the underlying unmatched source/execution members by exclusive
  label, or the number of Data Decision records?"

### Unsupported Conditions

- Missing/unstable member identity; ambiguous label membership; unauthorized
  scope; a requested filter below factual attribution grain; unresolved chain
  that prevents deterministic precedence; or a request to invent a match.

### Target Analytics Tool or Query Capability

- Planned Category 8 exclusive coverage bundle over read-only source records,
  accepted executions/allocations, provisional reconciliation candidates,
  Data Decision metadata, authorization, and validated query extension.
- Existing issue/candidate primitives do not make this named language contract
  Supported; AI Chat matching/resolution authority remains absent.

### Result Units

- Exact distinct underlying-member count and mutually exclusive c/b/a counts,
  with attribution limits and coverage; never expose raw stable identifiers.

### Fee Handling

- Not applicable. Fees do not classify unmatched membership; a missing charge
  fact is not silently converted into an unmatched execution member.

### Open-Trade Handling

- Membership is evidence-link coverage, not realized/open status. When a member
  affects `legitimate_open`, `needs_decision`, or incomplete projections, show
  that as metadata without duplicating or reclassifying the member.

### Sample-Size Considerations

- Report exclusive per-label counts and deduplicated total. Exact zero requires
  complete bounded coverage; small counts imply no source quality or causation.

## `remaining_open_quantity` Language Registry

### Exact Definition

For a factually confirmed `legitimate_open` lifecycle, return its exact current
signed residual quantity and exact absolute quantity in one compatible
instrument unit. The signed value preserves long/short direction; the absolute
value reports magnitude. Do not include `needs_decision`/incomplete candidates,
infer an opening balance or missing execution, treat the quantity as realized,
or calculate unrealized P/L.

### Formal Wording

- "exact signed and absolute residual quantity for legitimate-open state"
- "current factually open quantity in one compatible instrument unit"

### Normal Conversational Wording

- "How many shares are still open?"
- "What quantity remains in this confirmed open position?"

### Trader Slang

- "What size am I still holding?"
- "How many shares am I long or short right now?"

### Abbreviations

- `open qty`, `rem qty`, and `qty left` in trusted context.
- `NVDA open qty` validates `NVDA`; quantity unit must still be established.

### Common Misspellings

- `remaing open quantity`
- `open quantty left`

### Noisy or Incomplete Input

- `AAPL whats left open`
- `remaining?` requires quantity versus value/P&L clarification.

### Singular and Plural Forms

- Singular: one legitimate-open lifecycle's signed and absolute quantity.
- Plural: separate compatible-unit open quantities, never a mixed-unit total.

### Full Questions

- "What exact signed and absolute share quantity remains open in NVDA?"
- "How many contracts remain in this factually confirmed open lifecycle?"

### Commands

- "Show exact current legitimate-open quantity and unit."
- "Preserve the signed direction and absolute magnitude separately."

### Sentence Fragments

- "remaining open qty"
- "TSLA shares left"

### Follow-Up Wording

- "What's it worth?" is a separate valuation request requiring market price
  and currency; it is not inferred here.
- "Include decisions" is rejected because unresolved state is not factual open.

### Correction Wording

- "I meant quantity left, not unrealized P/L."
- "Show both signed and absolute size; do not infer missing opening shares."

### Comparison Wording

- "Compare remaining open quantity for two authorized Stock positions."
- Comparison requires compatible units; signed and absolute bases stay explicit.

### Ranking Wording

- "Rank confirmed open Stock positions by absolute shares remaining."
- Never rank mixed units or decision-state candidates as factual opens.

### Negated Wording

- "Open quantity, not market value or unrealized P/L."
- "Do not include unresolved or inferred positions."

### Exclusion Wording

- "Remaining open quantity excluding the selected ticker."
- Exclusions apply only to factually confirmed, authorized open lifecycles.

### Multi-Filter Wording

- "Show absolute shares remaining for confirmed open short Stock lifecycles in
  the selected authorized account."

### Multi-Part Question Wording

- "Show signed quantity, absolute quantity, unit, and coverage for each open
  position" returns exact facts without valuation.

### Ambiguous Wording

- "Remaining position" may mean quantity, market value, cost basis, or P/L.
- "Open balance" may invite an unsupported inferred opening inventory.

### Negative Examples

These examples must not map to this concept.

- "What is my unrealized P/L?" is a price/currency valuation metric.
- "Assume I started with 500 shares" requests an inferred opening balance.
- "Should I close what remains?" asks for advice.

### Context Requirements

Require server-authorized account scope, one factually confirmed
`legitimate_open` lifecycle, exact conserved residual, stable instrument, and
one compatible quantity unit. Direction comes from signed position, not advice.

### Required Data

- Accepted allocations/executions sufficient for exact current residual,
  `legitimate_open` projection state, stable lifecycle/instrument identity,
  compatible quantity unit, authorization, and coverage/Data Decisions.

### Optional Data

- Validated ticker, direction, instrument type, provenance, raw UTC/account-IANA
  date context, and privacy-safe state explanation.
- Current market price/currency only for a separately approved valuation metric.

### Valid Filters

- Validated account, `legitimate_open` state, ticker/instrument, direction,
  instrument type, provenance, compatible unit, and supported date context.
- Filters cannot convert an unresolved candidate into factual open.

### Valid Groupings

- Approved account, ticker/instrument, direction, type, provenance, and unit
  groupings; aggregate only quantities with compatible units and declared sign
  or absolute basis.

### Valid Operators

- Exact signed/absolute selection, sum within compatible unit, comparison,
  grouping, threshold, and ranking with explicit basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- `needs_decision`/incomplete as factual open, invented opening balance or fill,
  mixed-unit sum, realized-quantity treatment, implicit valuation/unrealized P/L,
  unauthorized scope, raw private IDs, causation, prediction, or advice.

### Default Interpretation

When explicitly selected, report both exact signed and absolute current
quantity for eligible `legitimate_open` lifecycles, with compatible unit and
coverage. Generic "remaining" has no silent quantity default.

### Clarification Conditions

Clarify when "remaining," "open size," or "position" does not distinguish
quantity from value/P&L, or when signed versus absolute basis/unit is unclear.

### Recommended Clarification Wording

- "Do you want the exact signed and absolute quantity still open, or its market
  value or unrealized P/L?"

### Unsupported Conditions

- State is not factually `legitimate_open`; missing/conflicting residual,
  instrument, or unit; mixed units; unauthorized scope; unresolved required
  chain; inferred opening inventory; or missing valuation facts for a separate
  value request.

### Target Analytics Tool or Query Capability

- Planned Category 8 exact open-residual selector over read-only
  `JournalAnalyticsFactSet`, accepted allocation graph, projection state, unit
  validation, coverage, and validated query extension.
- Existing open-quantity facts do not make this named language contract
  Supported; AI Chat interpretation/valuation remains unimplemented.

### Result Units

- Exact signed quantity and exact absolute quantity in one compatible
  instrument unit, plus `legitimate_open` state, population, and coverage.

### Fee Handling

- Not applicable. Fees never change instrument quantity; currency charges are
  not converted into quantity or implicit valuation.

### Open-Trade Handling

- Only factually confirmed `legitimate_open` lifecycles qualify.
  `ready_closed` has zero residual through reconciliation but is not an open
  result; `needs_decision`/incomplete remains unavailable, never inferred.

### Sample-Size Considerations

- One confirmed lifecycle can provide an exact quantity. Aggregates expose
  compatible-unit member counts/coverage and imply no risk judgment or advice.

---

# 7. Evaluation Cases Deliverable

## 7.1 Evaluation Case Schema and Batch Boundary

Every object below uses the locked Category 1 exact 21-key schema and key order,
with explicit empty arrays and `null` values. Batches 1-6 save all 418/418 cases
for `C8-EXEC-001` through `C8-EXEC-019`: nineteen complete 22-case arrays,
`C8-E1-01` through `C8-E19-22`. Comprehensive independent Terra review passed
all 418 cases with zero failures. The controller subsequently approved and
locked the category; neither review nor approval authorizes an AI Chat/runtime
capability.

All cases retain server-authorized compatible account/instrument scope, exact
accepted facts, projection state, and explicit included/limited/unavailable
coverage. Trusted entities and periods are used only when explicitly supplied
or present in trusted prior context. The cases do not invent dates,
identifiers, ticker meanings, execution/allocation facts, currency/unit
compatibility, causation, behavioral judgments, predictions, or advice.
Expected results remain privacy-safe and never expose raw account, broker,
execution, allocation, source, identity, or stable tie-break identifiers.

## 7.2 Required Case Types

Each saved array has this exact order: canonical, formal paraphrase,
conversational paraphrase, trader slang, abbreviation, misspelling, noisy input,
command, fragment, follow-up, correction, comparison, ranking, negation,
exclusion, multi-filter, multi-part, ambiguity, negative example, unsupported
data, selected entity, and cross-category.

## 7.3 Batch Coverage Summary

| Evaluation state | Count |
|---|---:|
| Target cases | 418 |
| Saved cases | 418 |
| Reviewed cases | 418 |
| Passed cases | 418 |
| Failed cases | 0 |
| Unreviewed saved cases | 0 |
| Unsaved cases | 0 |
| Complete 22-case arrays | 19 |
| Pending arrays | 0 |
| Clarification-expected cases saved | 19 |
| Unsupported-expected cases saved | 38 |
| Cross-category cases saved | 19 |

## 7.4 Structured Evaluation Arrays

### `number_of_entries`

```json
[{"caseId":"C8-E1-01","caseType":"canonical","input":"Show number of entries for the eligible population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-02","caseType":"formal_paraphrase","input":"Return the exact count of distinct position-increasing allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-03","caseType":"conversational_paraphrase","input":"How many entries did I have in the selected population?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-04","caseType":"trader_slang","input":"How many times did I get in or add?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-05","caseType":"abbreviation","input":"Show NVDA entry cnt for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-06","caseType":"misspelling","input":"Show my numbr of entires.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-07","caseType":"noisy_input","input":"entries how many pls selected acct","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-08","caseType":"command","input":"Count unique opening, adding, and flip-opening allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-09","caseType":"fragment","input":"Entry event count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-10","caseType":"follow_up","input":"For that trusted prior population, how many entries were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":["trusted prior selected population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-11","caseType":"correction","input":"For that trusted result, I meant entry events, not entry execution IDs.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-12","caseType":"comparison","input":"Compare number of entries for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles","exact comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"number_of_entries"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-13","caseType":"ranking","input":"Rank the trusted ticker groups by number of entries.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles","descending exact value","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-14","caseType":"negation","input":"Show entry events, not distinct entry executions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":["exclude distinct entry execution-ID count interpretation"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-15","caseType":"exclusion","input":"Show number of entries excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-16","caseType":"multi_filter","input":"Show entries for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-17","caseType":"multi_part","input":"For the trusted current and prior periods, show entry counts and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-18","caseType":"ambiguity","input":"How many entries did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean qualifying entry allocation events, or distinct executions that carried an entry allocation?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose allocation-event or execution-ID grain. Ask one basis question; ticker-like ordinary tokens require validated context."},{"caseId":"C8-E1-19","caseType":"negative_example","input":"How many entries should I take tomorrow?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and future increasing count prescriptions are unsupported; a factual historical event count cannot recommend future actions.","notes":"This requests advice/prediction, not a factual allocation-event count."},{"caseId":"C8-E1-20","caseType":"unsupported_data","input":"Count every Buy row as an entry even when allocation roles are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","stable accepted allocation identity and increasing role required","decision/incomplete evidence retained as partial or unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Buy/Sell side or display rows cannot establish increasing allocation-event membership; missing or unresolved allocation identity/role is unavailable rather than an invented count.","notes":"Do not convert side labels, source rows, or unresolved candidates into qualifying increasing events; unavailable is not zero."},{"caseId":"C8-E1-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show number of entries.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_entries"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying increasing-role allocation event once by stable identity, including long Buy, short Sell, and flip-opening by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E1-22","caseType":"cross_category","input":"Compare number of entries with net P&L for the trusted population without claiming entries caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["number_of_entries","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for opening, adding, and flip_opening roles","descriptive cross-category comparison"],"expectedComparison":{"left":"number_of_entries","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with opening, adding, or flip_opening role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L with compatible currency and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact allocation-event count separate from compatible net P&L; report state/coverage and make no causal, motivational, or advisory claim."}]
```

### `number_of_exits`

```json
[{"caseId":"C8-E2-01","caseType":"canonical","input":"Show number of exits for the eligible population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-02","caseType":"formal_paraphrase","input":"Return the exact count of distinct position-decreasing allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-03","caseType":"conversational_paraphrase","input":"How many exits did I have in the selected population?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-04","caseType":"trader_slang","input":"How many times did I trim or get out?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-05","caseType":"abbreviation","input":"Show AAPL exit cnt for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-06","caseType":"misspelling","input":"Show my numbr of exiits.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-07","caseType":"noisy_input","input":"exits how many pls selected acct","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-08","caseType":"command","input":"Count unique reducing, closing, and flip-closing allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-09","caseType":"fragment","input":"Exit event count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-10","caseType":"follow_up","input":"For that trusted prior population, how many exits were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":["trusted prior selected population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-11","caseType":"correction","input":"For that trusted result, I meant exit events, not exit execution IDs.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-12","caseType":"comparison","input":"Compare number of exits for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles","exact comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"number_of_exits"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-13","caseType":"ranking","input":"Rank the trusted ticker groups by number of exits.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles","descending exact value","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-14","caseType":"negation","input":"Show exit events, not distinct exit executions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":["exclude distinct exit execution-ID count interpretation"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-15","caseType":"exclusion","input":"Show number of exits excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-16","caseType":"multi_filter","input":"Show exits for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-17","caseType":"multi_part","input":"For the trusted current and prior periods, show exit counts and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-18","caseType":"ambiguity","input":"How many exits did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean qualifying exit allocation events, or distinct executions that carried an exit allocation?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose allocation-event or execution-ID grain. Ask one basis question; ticker-like ordinary tokens require validated context."},{"caseId":"C8-E2-19","caseType":"negative_example","input":"How many exits should I make on my next trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and future decreasing count prescriptions are unsupported; a factual historical event count cannot recommend future actions.","notes":"This requests advice/prediction, not a factual allocation-event count."},{"caseId":"C8-E2-20","caseType":"unsupported_data","input":"Count every Sell row as an exit even when allocation roles are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and instrument/unit scope","stable accepted allocation identity and decreasing role required","decision/incomplete evidence retained as partial or unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Buy/Sell side or display rows cannot establish decreasing allocation-event membership; missing or unresolved allocation identity/role is unavailable rather than an invented count.","notes":"Do not convert side labels, source rows, or unresolved candidates into qualifying decreasing events; unavailable is not zero."},{"caseId":"C8-E2-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show number of exits.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["number_of_exits"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each qualifying decreasing-role allocation event once by stable identity, including long Sell, short Buy/cover, and flip-closing by accepted role; never count display rows, execution side, or distinct execution IDs. Exact zero requires complete coverage. Validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no motive, causation, or advice."},{"caseId":"C8-E2-22","caseType":"cross_category","input":"Compare number of exits with net P&L for the trusted population without claiming exits caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["number_of_exits","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for reducing, closing, and flip_closing roles","descriptive cross-category comparison"],"expectedComparison":{"left":"number_of_exits","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and instrument/unit scope","current accepted allocations deduplicated by stable allocation identity with reducing, closing, or flip_closing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L with compatible currency and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact allocation-event count separate from compatible net P&L; report state/coverage and make no causal, motivational, or advisory claim."}]
```

### `average_entry_price`

```json
[{"caseId":"C8-E3-01","caseType":"canonical","input":"Show average entry price using the simple allocation-event mean.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-02","caseType":"formal_paraphrase","input":"Return the arithmetic mean of qualifying entry-event prices with equal event weights.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-03","caseType":"conversational_paraphrase","input":"What was my simple average entry price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-04","caseType":"trader_slang","input":"What was my avg get-in price per entry event?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-05","caseType":"abbreviation","input":"Show TSLA simple avg entry px for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-06","caseType":"misspelling","input":"Show averge entery prise by event.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-07","caseType":"noisy_input","input":"avg in px simple pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-08","caseType":"command","input":"Calculate average entry price with each qualifying allocation event counted once.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-09","caseType":"fragment","input":"Simple entry-event price mean.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-10","caseType":"follow_up","input":"For that trusted prior population, what was its simple average entry price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":["trusted prior selected population"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-11","caseType":"correction","input":"For that trusted result, I meant equal event weights, not quantity weights.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-12","caseType":"comparison","input":"Compare simple average entry price for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once","exact comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"average_entry_price"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-13","caseType":"ranking","input":"Rank the trusted compatible ticker groups by simple average entry price.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once","descending exact value","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-14","caseType":"negation","input":"Show simple average entry price, not quantity-weighted average entry price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":["exclude quantity-weighted average entry price interpretation"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-15","caseType":"exclusion","input":"Show simple average entry price excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-16","caseType":"multi_filter","input":"Show simple average entry price for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-17","caseType":"multi_part","input":"For the trusted current and prior periods, show simple average entry price and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-18","caseType":"ambiguity","input":"What's my average entry price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the simple mean that weights each qualifying entry event once, or the quantity-weighted average entry price?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Average entry price has a known basis collision. Ask exactly whether the user wants the simple equal-event mean or quantity-weighted mean; never reuse the current weighted output as simple truth."},{"caseId":"C8-E3-19","caseType":"negative_example","input":"What average entry price should I target next?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and target entry-price prescriptions are unsupported; a historical simple mean cannot recommend a future price.","notes":"This is a target/advice request, not a factual historical simple allocation-event mean."},{"caseId":"C8-E3-20","caseType":"unsupported_data","input":"Use the current quantity-weighted output as the simple mean even with mixed currencies.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying stable entry allocations with exact prices and positive event count required","weighted analytics output cannot substitute for the simple mean; decision/incomplete evidence remains coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Mixed currencies/price units, zero qualifying-event denominator, missing exact event prices, or reuse of the current quantity-weighted output cannot produce the simple average entry price.","notes":"Return unavailable with exact coverage; do not coerce a weighted aggregate, missing price, mixed unit, or empty population into this concept."},{"caseId":"C8-E3-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show simple average entry price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_entry_price"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying entry allocation-event prices, weighting every stable event equally regardless of quantity. This is distinct from weighted_average_entry_price and from the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E3-22","caseType":"cross_category","input":"Compare simple average entry price with net P&L for the trusted population without claiming price caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["average_entry_price","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying entry allocation-event prices with each stable event weighted once","descriptive cross-category comparison"],"expectedComparison":{"left":"average_entry_price","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying opening, adding, and flip_opening allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L with compatible currency and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact simple price mean and compatible net P&L as separate descriptive facts; show currency/unit and coverage and make no causal or advisory claim."}]
```

### `average_exit_price`

```json
[{"caseId":"C8-E4-01","caseType":"canonical","input":"Show average exit price using the simple allocation-event mean.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-02","caseType":"formal_paraphrase","input":"Return the arithmetic mean of qualifying exit-event prices with equal event weights.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-03","caseType":"conversational_paraphrase","input":"What was my simple average exit price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-04","caseType":"trader_slang","input":"What was my avg get-out price per exit event?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-05","caseType":"abbreviation","input":"Show NVDA simple avg exit px for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit price abbreviation and validated ticker grammar","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-06","caseType":"misspelling","input":"Show averge exiit prise by event.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-07","caseType":"noisy_input","input":"avg out px simple pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-08","caseType":"command","input":"Calculate average exit price with each qualifying allocation event counted once.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-09","caseType":"fragment","input":"Simple exit-event price mean.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-10","caseType":"follow_up","input":"For that trusted prior population, what was its simple average exit price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":["trusted prior selected population"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-11","caseType":"correction","input":"For that trusted result, I meant equal exit-event weights, not quantity weights.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-12","caseType":"comparison","input":"Compare simple average exit price for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once","exact price comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"average_exit_price"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-13","caseType":"ranking","input":"Rank the trusted compatible ticker groups by simple average exit price.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once","descending exact price","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-14","caseType":"negation","input":"Show simple average exit price, not quantity-weighted average exit price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":["exclude quantity-weighted average exit price interpretation"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once","exclude alternate average-price basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-15","caseType":"exclusion","input":"Show simple average exit price excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-16","caseType":"multi_filter","input":"Show simple average exit price for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-17","caseType":"multi_part","input":"For the trusted current and prior periods, show simple average exit price and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-18","caseType":"ambiguity","input":"What's my average exit price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["average-price-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved average-price basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the simple mean that weights each qualifying exit event once, or the quantity-weighted average exit price?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Average exit price has a known basis collision. Ask whether the user wants the simple equal-event mean or quantity-weighted mean; never reuse the current weighted output as simple truth or guess a ticker."},{"caseId":"C8-E4-19","caseType":"negative_example","input":"What average exit price should I target next?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, target price, motive, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and target exit-price prescriptions are unsupported; a historical simple mean cannot recommend a future price.","notes":"This is target/advice, not a factual historical simple exit-event mean."},{"caseId":"C8-E4-20","caseType":"unsupported_data","input":"Use the current quantity-weighted exit output as the simple mean even with mixed currencies.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, and price-unit scope","qualifying stable exit allocations with exact prices and positive event count required","weighted analytics output cannot substitute for the simple mean; decision/incomplete evidence remains coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Mixed currencies/price units, zero qualifying-event denominator, missing exact event prices, or reuse of the current quantity-weighted output cannot produce simple average exit price.","notes":"Return unavailable with exact coverage; never coerce weighted output, missing price, mixed units, side-only rows, or an empty population."},{"caseId":"C8-E4-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show simple average exit price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_exit_price"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact simple mean of qualifying exit allocation-event prices, weighting every stable event equally regardless of quantity. Long Sell, short Buy/cover, and flip-closing qualify by role, not side. This differs from weighted_average_exit_price and the current quantity-weighted analytics output, which is not evidence or an alias. Zero denominator is unavailable. Preserve currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E4-22","caseType":"cross_category","input":"Compare simple average exit price with net P&L for the trusted population without claiming price caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["average_exit_price","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact simple arithmetic mean of qualifying exit allocation-event prices with each stable event weighted once","descriptive cross-category comparison"],"expectedComparison":{"left":"average_exit_price","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument, currency, and price-unit scope","qualifying reducing, closing, and flip_closing allocations with stable identity and exact event price","positive qualifying event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in the same compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact simple exit-price mean and compatible net P&L separate; show currency/unit and coverage without causal or advisory claims."}]
```

### `weighted_average_entry_price`

```json
[{"caseId":"C8-E5-01","caseType":"canonical","input":"Show weighted average entry price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-02","caseType":"formal_paraphrase","input":"Return exact sum of entry allocated quantity times price divided by total entry allocated quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-03","caseType":"conversational_paraphrase","input":"What was my quantity-weighted average entry price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-04","caseType":"trader_slang","input":"What's my size-weighted get-in px?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-05","caseType":"abbreviation","input":"Show AAPL WAvg entry px for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit price abbreviation and validated ticker grammar","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-06","caseType":"misspelling","input":"Show wieghted averge entery prise.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-07","caseType":"noisy_input","input":"wtd in px pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-08","caseType":"command","input":"Calculate weighted average entry price with exact allocated quantities.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-09","caseType":"fragment","input":"Weighted entry px.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-10","caseType":"follow_up","input":"For that trusted prior population, what was weighted average entry price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":["trusted prior selected population"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-11","caseType":"correction","input":"For that trusted result, I meant quantity-weighted entry price, not the simple event mean.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-12","caseType":"comparison","input":"Compare weighted average entry price for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator","exact price comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"weighted_average_entry_price"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-13","caseType":"ranking","input":"Rank the trusted compatible ticker groups by weighted average entry price.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator","descending exact price","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-14","caseType":"negation","input":"Show weighted average entry price, not simple average entry price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":["exclude simple average entry price interpretation"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator","exclude alternate average-price basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-15","caseType":"exclusion","input":"Show weighted average entry price excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-16","caseType":"multi_filter","input":"Show weighted average entry price for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-17","caseType":"multi_part","input":"For the trusted current and prior periods, show weighted average entry price and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-18","caseType":"ambiguity","input":"What's my average buy-in price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["average-price-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved average-price basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the quantity-weighted average entry price, or the simple mean that weights each qualifying entry event once?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose simple or quantity-weighted entry price. Ask one basis question; never guess ticker meaning, denominator, currency, units, dates, or context."},{"caseId":"C8-E5-19","caseType":"negative_example","input":"What weighted entry price should I aim for next?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, target price, motive, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and target entry-price prescriptions are unsupported; a historical weighted mean cannot recommend a future price.","notes":"This is target/advice, not a factual historical quantity-weighted entry price."},{"caseId":"C8-E5-20","caseType":"unsupported_data","input":"Calculate weighted entry price with a zero denominator and missing split-allocation quantities.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying stable entry allocations with exact quantity and price required","exact positive allocated-quantity denominator and visible decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Zero or missing allocated-quantity denominator, missing exact quantity/price, mixed currency/units, or unresolved role/identity makes weighted average entry price unavailable.","notes":"Return unavailable with exact coverage; do not invent weights, repair split allocations, mix units/currencies, or substitute zero."},{"caseId":"C8-E5-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show weighted average entry price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_entry_price"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying entry allocation events, using exact allocated quantity and counting each stable split allocation once. Long Buy, short Sell, and flip-opening qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple entry-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E5-22","caseType":"cross_category","input":"Compare weighted average entry price with net P&L for the trusted population without claiming price caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["weighted_average_entry_price","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times entry price divided by exact positive qualifying allocated-quantity denominator","descriptive cross-category comparison"],"expectedComparison":{"left":"weighted_average_entry_price","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying opening, adding, and flip_opening allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in the same compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact weighted entry price and compatible net P&L separate; report denominator, currency/unit, state, and coverage without causal or advisory claims."}]
```

### `weighted_average_exit_price`

```json
[{"caseId":"C8-E6-01","caseType":"canonical","input":"Show weighted average exit price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-02","caseType":"formal_paraphrase","input":"Return exact sum of exit allocated quantity times price divided by total exit allocated quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-03","caseType":"conversational_paraphrase","input":"What was my quantity-weighted average exit price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-04","caseType":"trader_slang","input":"What's my size-weighted get-out px?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-05","caseType":"abbreviation","input":"Show TSLA WAvg exit px for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit price abbreviation and validated ticker grammar","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-06","caseType":"misspelling","input":"Show wieghted averge exiit prise.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-07","caseType":"noisy_input","input":"wtd out px pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-08","caseType":"command","input":"Calculate weighted average exit price with exact allocated quantities.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-09","caseType":"fragment","input":"Weighted exit px.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-10","caseType":"follow_up","input":"For that trusted prior population, what was weighted average exit price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":["trusted prior selected population"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-11","caseType":"correction","input":"For that trusted result, I meant quantity-weighted exit price, not the simple event mean.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-12","caseType":"comparison","input":"Compare weighted average exit price for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator","exact price comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"weighted_average_exit_price"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-13","caseType":"ranking","input":"Rank the trusted compatible ticker groups by weighted average exit price.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator","descending exact price","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-14","caseType":"negation","input":"Show weighted average exit price, not simple average exit price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":["exclude simple average exit price interpretation"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator","exclude alternate average-price basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-15","caseType":"exclusion","input":"Show weighted average exit price excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-16","caseType":"multi_filter","input":"Show weighted average exit price for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-17","caseType":"multi_part","input":"For the trusted current and prior periods, show weighted average exit price and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-18","caseType":"ambiguity","input":"What's my average sell-out price?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["average-price-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved average-price basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the quantity-weighted average exit price, or the simple mean that weights each qualifying exit event once?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose simple or quantity-weighted exit price. Ask one basis question; never guess ticker meaning, denominator, currency, units, dates, or context."},{"caseId":"C8-E6-19","caseType":"negative_example","input":"What weighted exit price should I aim for next?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, target price, motive, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and target exit-price prescriptions are unsupported; a historical weighted mean cannot recommend a future price.","notes":"This is target/advice, not a factual historical quantity-weighted exit price."},{"caseId":"C8-E6-20","caseType":"unsupported_data","input":"Calculate weighted exit price with a zero denominator and missing split-allocation quantities.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying stable exit allocations with exact quantity and price required","exact positive allocated-quantity denominator and visible decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Zero or missing allocated-quantity denominator, missing exact quantity/price, mixed currency/units, or unresolved role/identity makes weighted average exit price unavailable.","notes":"Return unavailable with exact coverage; do not invent weights, repair split allocations, mix units/currencies, or substitute zero."},{"caseId":"C8-E6-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show weighted average exit price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weighted_average_exit_price"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute exact sum(q*p)/sum(q) over qualifying exit allocation events, using exact allocated quantity and counting each stable split allocation once. Long Sell, short Buy/cover, and flip-closing qualify by accepted role, not side. The denominator must be positive; zero/missing is unavailable. Keep the quantity-weighted basis distinct from the simple exit-event mean, preserve compatible currency/unit, validate ticker tokens, expose no raw private IDs, invent no date/context, and infer no causation or advice."},{"caseId":"C8-E6-22","caseType":"cross_category","input":"Compare weighted average exit price with net P&L for the trusted population without claiming price caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["weighted_average_exit_price","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact sum of allocated quantity times exit price divided by exact positive qualifying allocated-quantity denominator","descriptive cross-category comparison"],"expectedComparison":{"left":"weighted_average_exit_price","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument, currency, quantity-unit, and price-unit scope","qualifying reducing, closing, and flip_closing allocations deduplicated by stable allocation identity with exact allocated quantity and price","exact positive qualifying allocated-quantity denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in the same compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact weighted exit price and compatible net P&L separate; report denominator, currency/unit, state, and coverage without causal or advisory claims."}]
```

### `entry_execution_count`

```json
[{"caseId":"C8-E7-01","caseType":"canonical","input":"Show entry execution count for the full declared scope.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-02","caseType":"formal_paraphrase","input":"Return the exact count of distinct current execution IDs carrying entry roles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-03","caseType":"conversational_paraphrase","input":"How many separate executions entered or added to positions?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-04","caseType":"trader_slang","input":"How many entry fills did I have, deduped by execution?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-05","caseType":"abbreviation","input":"Show NVDA entry exec cnt for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-06","caseType":"misspelling","input":"Show entery exectuion count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-07","caseType":"noisy_input","input":"entry execs how many pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-08","caseType":"command","input":"Count distinct current execution IDs with opening, adding, or flip-opening allocations.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-09","caseType":"fragment","input":"Entry execution ID count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-10","caseType":"follow_up","input":"For that trusted prior declared scope, how many entry executions were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":["trusted prior declared scope"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior declared scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-11","caseType":"correction","input":"For that trusted result, I meant distinct entry execution IDs, not entry events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope","metric-grain correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-12","caseType":"comparison","input":"Compare entry execution counts for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope","exact count comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"entry_execution_count"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-13","caseType":"ranking","input":"Rank the trusted ticker groups by entry execution count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope","descending exact count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-14","caseType":"negation","input":"Show entry execution IDs counted once, not entry allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":["exclude entry allocation-event count interpretation"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope","exclude alternate grain"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-15","caseType":"exclusion","input":"Show entry execution count excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-16","caseType":"multi_filter","input":"Show entry execution count for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-17","caseType":"multi_part","input":"For the trusted current and prior periods, show entry execution count and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-18","caseType":"ambiguity","input":"How many entries or entry executions did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count-grain clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved allocation-event versus execution-ID basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean distinct executions carrying a qualifying entry allocation, or the number of qualifying entry allocation events?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose entry allocation-event count or distinct entry execution-ID count. Ask one grain question and do not infer ordinary words as tickers."},{"caseId":"C8-E7-19","caseType":"negative_example","input":"Were my many entry executions bad trading?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Advice or prescriptions about how many entry executions to make are unsupported; a historical count cannot recommend behavior.","notes":"This is advice/quality framing, not a factual distinct-ID count."},{"caseId":"C8-E7-20","caseType":"unsupported_data","input":"Count entry executions even though current execution identity is missing and only Buy/Sell rows remain.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable current accepted execution identity and linked qualifying allocation role required","decision/incomplete identity or role coverage remains partial or unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Missing/conflicting execution identity or qualifying entry allocation role makes the distinct execution count unavailable; side, display, source, or allocation rows cannot substitute.","notes":"Do not invent execution IDs, deduplicate by display, or count flip components twice; unavailable is not zero."},{"caseId":"C8-E7-21","caseType":"selected_entity_context","input":"For the trusted selected compatible scope, show entry execution count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_execution_count"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying entry role. Long Buy, short Sell, and flip-opening executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E7-22","caseType":"cross_category","input":"Compare entry execution count with net P&L for the trusted population without claiming executions caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["entry_execution_count","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted entry allocation roles across the full declared scope","descriptive cross-category comparison"],"expectedComparison":{"left":"entry_execution_count","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to opening, adding, or flip_opening allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact distinct entry execution count separate from compatible net P&L; show scope/coverage without motive, causal, or advisory claims."}]
```

### `exit_execution_count`

```json
[{"caseId":"C8-E8-01","caseType":"canonical","input":"Show exit execution count for the full declared scope.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-02","caseType":"formal_paraphrase","input":"Return the exact count of distinct current execution IDs carrying exit roles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-03","caseType":"conversational_paraphrase","input":"How many separate executions reduced or closed positions?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-04","caseType":"trader_slang","input":"How many exit fills did I have, deduped by execution?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-05","caseType":"abbreviation","input":"Show AAPL exit exec cnt for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-06","caseType":"misspelling","input":"Show exiit exectuion count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-07","caseType":"noisy_input","input":"exit execs how many pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-08","caseType":"command","input":"Count distinct current execution IDs with reducing, closing, or flip-closing allocations.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-09","caseType":"fragment","input":"Exit execution ID count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-10","caseType":"follow_up","input":"For that trusted prior declared scope, how many exit executions were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":["trusted prior declared scope"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior declared scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-11","caseType":"correction","input":"For that trusted result, I meant distinct exit execution IDs, not exit events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope","metric-grain correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-12","caseType":"comparison","input":"Compare exit execution counts for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope","exact count comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"exit_execution_count"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-13","caseType":"ranking","input":"Rank the trusted ticker groups by exit execution count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope","descending exact count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-14","caseType":"negation","input":"Show exit execution IDs counted once, not exit allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":["exclude exit allocation-event count interpretation"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope","exclude alternate grain"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-15","caseType":"exclusion","input":"Show exit execution count excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-16","caseType":"multi_filter","input":"Show exit execution count for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-17","caseType":"multi_part","input":"For the trusted current and prior periods, show exit execution count and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-18","caseType":"ambiguity","input":"How many exits or exit executions did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count-grain clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved allocation-event versus execution-ID basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean distinct executions carrying a qualifying exit allocation, or the number of qualifying exit allocation events?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose exit allocation-event count or distinct exit execution-ID count. Ask one grain question and do not infer ordinary words as tickers."},{"caseId":"C8-E8-19","caseType":"negative_example","input":"Did too many exit executions cause my losses?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Advice or prescriptions about how many exit executions to make are unsupported; a historical count cannot recommend behavior.","notes":"This is advice/quality framing, not a factual distinct-ID count."},{"caseId":"C8-E8-20","caseType":"unsupported_data","input":"Count exit executions even though current execution identity is missing and only Sell/Buy rows remain.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable current accepted execution identity and linked qualifying allocation role required","decision/incomplete identity or role coverage remains partial or unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Missing/conflicting execution identity or qualifying exit allocation role makes the distinct execution count unavailable; side, display, source, or allocation rows cannot substitute.","notes":"Do not invent execution IDs, deduplicate by display, or count flip components twice; unavailable is not zero."},{"caseId":"C8-E8-21","caseType":"selected_entity_context","input":"For the trusted selected compatible scope, show exit execution count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_execution_count"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each distinct current execution ID once across the full declared scope when it carries a qualifying exit role. Long Sell, short Buy/cover, and flip-closing executions qualify by role, not side. One flip execution may appear in both entry- and exit-role counts but remains one global execution ID and one member of this count. Do not count allocation/display/source rows. Exact zero needs complete coverage. Validate tickers, use raw UTC/account-IANA time boundaries, expose no raw IDs, invent no dates/context, and infer no motive, causation, or advice."},{"caseId":"C8-E8-22","caseType":"cross_category","input":"Compare exit execution count with net P&L for the trusted population without claiming executions caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["exit_execution_count","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying one or more accepted exit allocation roles across the full declared scope","descriptive cross-category comparison"],"expectedComparison":{"left":"exit_execution_count","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted execution IDs linked to reducing, closing, or flip_closing allocation roles across the full declared scope","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact distinct exit execution count separate from compatible net P&L; show scope/coverage without motive, causal, or advisory claims."}]
```

### `scale_in_count`

```json
[{"caseId":"C8-E9-01","caseType":"canonical","input":"Show scale-in count for the eligible population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-02","caseType":"formal_paraphrase","input":"Return the exact count of stable accepted adding allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-03","caseType":"conversational_paraphrase","input":"How many times did I add to an open position?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-04","caseType":"trader_slang","input":"How many adds did I make?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-05","caseType":"abbreviation","input":"Show TSLA scale-in cnt for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-06","caseType":"misspelling","input":"Show scael in coutn.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-07","caseType":"noisy_input","input":"adds count pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-08","caseType":"command","input":"Count unique allocation events carrying the adding role.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-09","caseType":"fragment","input":"Scale-in event count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-10","caseType":"follow_up","input":"For that trusted prior declared scope, how many scale-ins were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":["trusted prior declared scope"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior declared scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-11","caseType":"correction","input":"For that trusted result, I meant adding events, not entry executions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles","metric-grain correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-12","caseType":"comparison","input":"Compare scale-in counts for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles","exact count comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"scale_in_count"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-13","caseType":"ranking","input":"Rank the trusted ticker groups by scale-in count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles","descending exact count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-14","caseType":"negation","input":"Show adding allocation events, not Buy executions or all entries.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":["exclude entry execution-ID or all-entry event count interpretation"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles","exclude alternate grain"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-15","caseType":"exclusion","input":"Show scale-in count excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-16","caseType":"multi_filter","input":"Show scale-in count for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-17","caseType":"multi_part","input":"For the trusted current and prior periods, show scale-in count and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-18","caseType":"ambiguity","input":"How many entries or scale-ins did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count-grain clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved allocation-event versus execution-ID basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean stable adding allocation events, all qualifying entry events, or distinct entry executions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Scale-in wording may mean adding allocation events, all entry events, or entry executions. Ask one grain/role question; never infer a ticker from ordinary text."},{"caseId":"C8-E9-19","caseType":"negative_example","input":"Should I scale in more on my next trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Advice or judgments about whether to scale in are unsupported; a historical adding-event count cannot recommend behavior.","notes":"This is advice/quality framing, not a factual stable adding-event count."},{"caseId":"C8-E9-20","caseType":"unsupported_data","input":"Count every Buy as a scale-in even when adding roles and stable allocation identities are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable current accepted allocation identity and adding role required","decision/incomplete role coverage remains partial or unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Missing/conflicting allocation identity or adding role makes scale-in count unavailable; Buy/Sell side, execution IDs, display rows, or all entry roles cannot substitute.","notes":"Do not turn opening events, Buy rows, short-side Sell rows without roles, or distinct execution IDs into scale-ins; unavailable is not zero."},{"caseId":"C8-E9-21","caseType":"selected_entity_context","input":"For the trusted selected compatible scope, show scale-in count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_in_count"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted adding allocation event once. It is not every opening/flip-opening event, Buy side, display/source rows, or a distinct execution-ID count. Long adds can be Buy and short adds can be Sell; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E9-22","caseType":"cross_category","input":"Compare scale-in count with net P&L for the trusted population without claiming adds caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["scale_in_count","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted adding roles","descriptive cross-category comparison"],"expectedComparison":{"left":"scale_in_count","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with adding role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exact adding-event count separate from compatible net P&L; report scope/coverage with no behavioral, causal, or advisory claim."}]
```

### `scale_out_count`

```json
[{"caseId":"C8-E10-01","caseType":"canonical","input":"Show scale-out count for the eligible population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-02","caseType":"formal_paraphrase","input":"Return the exact count of stable accepted reducing allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-03","caseType":"conversational_paraphrase","input":"How many times did I reduce an open position?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-04","caseType":"trader_slang","input":"How many trims did I make?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-05","caseType":"abbreviation","input":"Show NVDA scale-out cnt for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-06","caseType":"misspelling","input":"Show scael out coutn.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-07","caseType":"noisy_input","input":"trims count pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-08","caseType":"command","input":"Count unique allocation events carrying the reducing role.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-09","caseType":"fragment","input":"Scale-out event count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-10","caseType":"follow_up","input":"For that trusted prior declared population, how many scale-outs were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":["trusted prior declared population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior declared population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-11","caseType":"correction","input":"For that trusted result, I meant reducing events, not exit executions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-12","caseType":"comparison","input":"Compare scale-out counts for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles","exact comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"scale_out_count"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-13","caseType":"ranking","input":"Rank the trusted ticker groups by scale-out count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-14","caseType":"negation","input":"Show reducing allocation events, not Sell executions or all exits.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":["exclude exit execution-ID or all-exit event count interpretation"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles","exclude alternate grain or basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-15","caseType":"exclusion","input":"Show scale-out count excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-16","caseType":"multi_filter","input":"Show scale-out count for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-17","caseType":"multi_part","input":"For the trusted current and prior periods, show scale-out count and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-18","caseType":"ambiguity","input":"How many exits or scale-outs did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric grain or basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean stable reducing allocation events, all qualifying exit events, or distinct exit executions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Scale-out wording may mean reducing allocation events, all exit events, or exit executions. Ask one grain/role question; never infer a ticker from ordinary text."},{"caseId":"C8-E10-19","caseType":"negative_example","input":"Should I scale out more on my next trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Advice or judgments about whether to scale out are unsupported; a historical reducing-event count cannot recommend behavior.","notes":"This is advice/quality framing, not a factual stable reducing-event count."},{"caseId":"C8-E10-20","caseType":"unsupported_data","input":"Count every Sell as a scale-out even when reducing roles and stable allocation identities are missing.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable current accepted allocation identity and reducing role required","decision/incomplete role coverage remains partial or unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Missing/conflicting allocation identity or reducing role makes scale-out count unavailable; Sell/Buy side, execution IDs, display rows, or all exit roles cannot substitute.","notes":"Do not turn closing events, Sell rows, short-cover Buy rows without roles, or distinct execution IDs into scale-outs; unavailable is not zero."},{"caseId":"C8-E10-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show scale-out count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scale_out_count"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each stable accepted reducing allocation event once. It is not every closing/flip-closing event, Sell side, display/source rows, or a distinct execution-ID count. Long reductions can be Sell and short reductions can be Buy/cover; role alone controls membership. Exact zero needs complete coverage. Validate ticker tokens, use raw UTC/account-IANA scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E10-22","caseType":"cross_category","input":"Compare scale-out count with net P&L for the trusted population without claiming trims caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["scale_out_count","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact distinct stable allocation-event count for accepted reducing roles","descriptive cross-category comparison"],"expectedComparison":{"left":"scale_out_count","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument/unit, and declared time scope","current accepted allocations deduplicated by stable allocation identity with reducing role","ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exact reducing-event count separate from compatible net P&L; report scope/coverage with no behavioral, causal, or advisory claim."}]
```

### `partial_exit_percentage`

```json
[{"caseId":"C8-E11-01","caseType":"canonical","input":"Show partial exit percentage as an event rate.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-02","caseType":"formal_paraphrase","input":"Return reducing events divided by all reducing, closing, and flip-closing events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-03","caseType":"conversational_paraphrase","input":"What percentage of my exit events were partial reductions?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-04","caseType":"trader_slang","input":"How often were my outs trims instead of closes?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-05","caseType":"abbreviation","input":"Show AAPL partial-exit % for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-06","caseType":"misspelling","input":"Show partal exiit precent.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-07","caseType":"noisy_input","input":"trim event pct pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-08","caseType":"command","input":"Calculate the exact partial-exit event numerator and denominator.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-09","caseType":"fragment","input":"Partial exit event rate.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-10","caseType":"follow_up","input":"For that trusted prior declared population, what was partial exit percentage?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":["trusted prior declared population"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior declared population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-11","caseType":"correction","input":"For that trusted result, I meant event percentage, not quantity percentage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-12","caseType":"comparison","input":"Compare partial-exit event percentages for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events","exact comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"partial_exit_percentage"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-13","caseType":"ranking","input":"Rank the trusted ticker groups by partial-exit event percentage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-14","caseType":"negation","input":"Show partial-exit event rate, not percentage of quantity trimmed.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":["exclude quantity percentage exited in partial reductions interpretation"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events","exclude alternate grain or basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-15","caseType":"exclusion","input":"Show partial-exit percentage excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-16","caseType":"multi_filter","input":"Show partial-exit percentage for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-17","caseType":"multi_part","input":"For the trusted current and prior periods, show partial-exit event percentage and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-18","caseType":"ambiguity","input":"What's my partial exit percentage?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric grain or basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the percentage of exit events that were partial reductions, or the percentage of exited quantity handled by partial exits?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Partial-exit percentage may mean an event rate or quantity share. Ask exactly which basis the user means; do not silently infer quantity, ticker, date, or context."},{"caseId":"C8-E11-19","caseType":"negative_example","input":"Should I take partial exits more often?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Advice about whether or how often to take partial exits is unsupported; the historical event rate cannot recommend behavior.","notes":"This is advice/prescription, not the factual partial-exit event percentage."},{"caseId":"C8-E11-20","caseType":"unsupported_data","input":"Return zero percent when there are no reducing, closing, or flip-closing events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and declared time scope","stable reducing, closing, and flip_closing allocation identities required","positive event denominator with decision/incomplete coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A zero denominator, missing/conflicting allocation identity or role, or a requested quantity-rate substitution makes this event percentage unavailable.","notes":"Do not substitute zero percent, execution count, side rows, or quantity share; return exact unavailable/coverage state."},{"caseId":"C8-E11-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show partial-exit event percentage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["partial_exit_percentage"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact event rate: distinct reducing allocation events divided by all distinct reducing, closing, and flip_closing allocation events after identical filters. Long Sell and short Buy/cover qualify only by accepted role; flip-closing belongs in the denominator. Zero denominator is unavailable, never zero percent. Never infer a quantity rate. Preserve exact numerator/denominator, validate tickers, expose no raw IDs, invent no date/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E11-22","caseType":"cross_category","input":"Compare partial-exit event percentage with net P&L for the trusted population without claiming partials caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["partial_exit_percentage","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact reducing-event count divided by exact count of all reducing, closing, and flip_closing allocation events","descriptive cross-category comparison"],"expectedComparison":{"left":"partial_exit_percentage","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument/unit, and declared time scope","stable accepted reducing, closing, and flip_closing allocation-event identities","exact positive all-exit-event denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact partial-exit event rate and compatible net P&L separate; report numerator, denominator, coverage, and no causal/advisory claim."}]
```

### `position_flips`

```json
[{"caseId":"C8-E12-01","caseType":"canonical","input":"Show position flip count for the full declared scope.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-02","caseType":"formal_paraphrase","input":"Return distinct execution IDs carrying both flip-closing and flip-opening roles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-03","caseType":"conversational_paraphrase","input":"How many executions flipped me through flat?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-04","caseType":"trader_slang","input":"How many times did I switch from long to short or back in one fill?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-05","caseType":"abbreviation","input":"Show TSLA flip exec cnt for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-06","caseType":"misspelling","input":"Show postion fliips.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-07","caseType":"noisy_input","input":"flip cnt pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-08","caseType":"command","input":"Count each accepted through-flat flip execution once across adjacent lifecycles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-09","caseType":"fragment","input":"Position-flip execution count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-10","caseType":"follow_up","input":"For that trusted prior declared population, how many position flips were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":["trusted prior declared population"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior declared population context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-11","caseType":"correction","input":"For that trusted result, I meant one through-flat execution, not close and re-entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-12","caseType":"comparison","input":"Compare position-flip counts for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles","exact comparison"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"position_flips"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-13","caseType":"ranking","input":"Rank the trusted ticker groups by unique position-flip count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-14","caseType":"negation","input":"Show one-ID flips, not separate close and later re-entry executions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":["exclude separate close and later re-entry executions interpretation"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles","exclude alternate grain or basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-15","caseType":"exclusion","input":"Show position flips excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-16","caseType":"multi_filter","input":"Show position flips for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-17","caseType":"multi_part","input":"For the trusted current and prior periods, show position-flip count and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-18","caseType":"ambiguity","input":"How many reversals did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-basis clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric grain or basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean one execution that crossed through flat with both flip roles, or separate close and re-entry executions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Flip or reversal may mean one through-flat execution, separate close/re-entry, or market-price reversal. Ask one execution-structure question and do not infer ticker/date context."},{"caseId":"C8-E12-19","caseType":"negative_example","input":"Was flipping the position a bad decision?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Advice or judgment about reversing a position is unsupported; historical flip count cannot recommend a trade.","notes":"This is advice/quality framing, not a factual through-flat execution count."},{"caseId":"C8-E12-20","caseType":"unsupported_data","input":"Count a close execution and later re-entry as one flip even though no execution has both roles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, instrument/unit, and full declared scope","stable current execution ID with both accepted flip roles required","adjacent lifecycle and decision/incomplete coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Missing/conflicting execution identity or either flip role, side-only evidence, or separate close/re-entry executions cannot establish a position flip.","notes":"Return unavailable with coverage; never merge separate executions or count one flip once per adjacent lifecycle."},{"caseId":"C8-E12-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show position-flip count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_flips"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count each unique current execution ID once only when that same execution carries both flip_closing and flip_opening roles. It closes one lifecycle and opens the adjacent one but remains one global ID. Long-to-short and short-to-long qualify symmetrically; side alone or separate close/re-entry executions do not. Exact zero requires complete identity/role coverage. Validate tickers and time scope, expose no raw IDs, invent no dates/context, and infer no motive, causation, quality, or advice."},{"caseId":"C8-E12-22","caseType":"cross_category","input":"Compare position-flip count with net P&L for the trusted population without claiming flips caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["position_flips","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact count of distinct current execution IDs carrying both flip_closing and flip_opening roles, deduplicated once across adjacent lifecycles","descriptive cross-category comparison"],"expectedComparison":{"left":"position_flips","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, instrument/unit, and full declared scope","current accepted execution identity carrying both flip_closing and flip_opening allocation roles","adjacent lifecycle and ready_closed/legitimate_open/needs_decision coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the exact unique flip-execution count separate from compatible net P&L; report coverage without motive, causal, or advisory claims."}]
```

### `repeat_attempts`

```json
[{"caseId":"C8-E13-01","caseType":"canonical","input":"Show repeat attempts in the fixed lifecycle sequence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-02","caseType":"formal_paraphrase","input":"Return the count of second-and-later qualifying zero-to-nonzero lifecycles.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-03","caseType":"conversational_paraphrase","input":"How many times did I trade the same ticker again that account-local day?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-04","caseType":"trader_slang","input":"How many second tries and later tries did I take?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-05","caseType":"abbreviation","input":"Show NVDA repeat cnt for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-06","caseType":"misspelling","input":"Show reapeat atempts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-07","caseType":"noisy_input","input":"same-day retries pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-08","caseType":"command","input":"Build every candidate first, then count qualifying repeat lifecycles without skipping barriers.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-09","caseType":"fragment","input":"Repeat lifecycle attempt count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-10","caseType":"follow_up","input":"For that trusted prior selected scope, how many repeat attempts were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":["trusted prior selected scope"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-11","caseType":"correction","input":"For that trusted result, I meant lifecycle repeats, not repeated entry executions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-12","caseType":"comparison","input":"Compare repeat-attempt counts for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved","exact comparison with coverage"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"repeat_attempts"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-13","caseType":"ranking","input":"Rank the trusted ticker groups by exact pre-barrier repeat-attempt count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-14","caseType":"negation","input":"Show repeat lifecycles, not entry executions or allocation events.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":["exclude entry execution or allocation-event count interpretation"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved","exclude alternate grain"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-15","caseType":"exclusion","input":"Show repeat attempts excluding the trusted selected ticker without changing any original sequence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-16","caseType":"multi_filter","input":"Show repeat attempts for the trusted ticker and period after building its full fixed daily sequence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period applied only after authoritative sequence or member construction","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-17","caseType":"multi_part","input":"For the trusted current and prior periods, show repeat attempts and barrier coverage without renumbering.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods applied after authoritative construction","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-18","caseType":"ambiguity","input":"How many retries did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-grain clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric grain","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean repeated zero-to-nonzero trade lifecycles, or repeated entry executions or allocation events within one lifecycle?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Attempt or retry may mean lifecycle, execution, allocation, or order. Ask one grain question and do not infer ticker/date context or bypass the fixed partition."},{"caseId":"C8-E13-19","caseType":"negative_example","input":"Were my repeat attempts revenge trading?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Behavioral judgments, motive, and advice about repeating trades are unsupported; the sequence count cannot diagnose revenge trading or recommend another attempt.","notes":"This asks for motive/advice, not a factual repeat-lifecycle count."},{"caseId":"C8-E13-20","caseType":"unsupported_data","input":"Filter out incomplete candidates before sequencing and count later candidates as earlier attempts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete pre-filter candidate set with stable first-entry raw UTC and round-trip identity required","incomplete/nonqualifying candidates retained as noncounted barriers with partial/unavailable post-barrier coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Missing stable partition/order facts, a request to filter candidates before sequencing, skip a barrier, renumber later candidates, or count incomplete/nonqualifying candidates as attempts is unsupported.","notes":"Never invent ordering, discard a predecessor/barrier, or convert execution/allocation frequency into lifecycle attempts."},{"caseId":"C8-E13-21","caseType":"selected_entity_context","input":"For the trusted selected compatible scope, show repeat attempts with state-labelled barriers.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_attempts"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date; order by first-entry raw UTC then stable round-trip ID. The first qualifying zero-to-nonzero lifecycle is initial and second/later qualifying lifecycles are repeats. Incomplete/nonqualifying candidates remain visible noncounted barriers; never skip them or renumber later candidates. Report exact pre-barrier results and partial/unavailable coverage at/after barriers. Expose no raw IDs, invent no date/time/context, and infer no motive, revenge trading, quality, causation, or advice."},{"caseId":"C8-E13-22","caseType":"cross_category","input":"Compare repeat attempts with net P&L for the trusted population without claiming repeats caused results.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["repeat_attempts","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["count second-and-later qualifying zero-to-nonzero lifecycles in the fixed pre-filter candidate sequence with noncounted barriers preserved","descriptive cross-category comparison"],"expectedComparison":{"left":"repeat_attempts","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep repeat-attempt count and compatible net P&L descriptive and separate; retain original sequence/barriers and make no motive, causal, or advisory claim."}]
```

### `trade_sequence`

```json
[{"caseId":"C8-E14-01","caseType":"canonical","input":"Show trade sequence for the fixed lifecycle partition.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-02","caseType":"formal_paraphrase","input":"Return each lifecycle's stable one-based sequence ordinal.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-03","caseType":"conversational_paraphrase","input":"Was this my first, second, or third trade on that ticker that account-local day?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-04","caseType":"trader_slang","input":"Which try number was this lifecycle?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-05","caseType":"abbreviation","input":"Show AAPL trade seq for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-06","caseType":"misspelling","input":"Show trade sequnce numbr.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-07","caseType":"noisy_input","input":"which trade # pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-08","caseType":"command","input":"Build all candidates first and assign ordinals by first-entry UTC plus stable ID.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-09","caseType":"fragment","input":"Lifecycle sequence number.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-10","caseType":"follow_up","input":"For that trusted prior selected scope, show the original trade sequence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":["trusted prior selected scope"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-11","caseType":"correction","input":"For that trusted result, I meant lifecycle order, not fill order.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-12","caseType":"comparison","input":"Compare preserved trade-sequence positions for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering","exact comparison with coverage"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"trade_sequence"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-13","caseType":"ranking","input":"Rank the trusted ticker groups by count of third-or-later lifecycle ordinals.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-14","caseType":"negation","input":"Show lifecycle sequence, not execution, fill, or order-ticket sequence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":["exclude execution, fill, or order-ticket sequence interpretation"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering","exclude alternate grain"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-15","caseType":"exclusion","input":"Show trade sequence excluding the trusted selected ticker without renumbering remaining candidates.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-16","caseType":"multi_filter","input":"Show trade sequence for the trusted ticker and period after building every fixed daily partition.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period applied only after authoritative sequence or member construction","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-17","caseType":"multi_part","input":"For the trusted current and prior periods, show original sequence ordinals and barrier coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods applied after authoritative construction","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-18","caseType":"ambiguity","input":"What was my trade order?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-grain clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric grain","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the lifecycle's fixed account-instrument-local-day sequence number, or the order of its executions or fills?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trade sequence may mean lifecycle ordinal, execution/fill order, or order ticket. Ask one grain question; never infer missing date/ticker context or bypass the fixed partition."},{"caseId":"C8-E14-19","caseType":"negative_example","input":"Was my third trade reckless?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Advice or quality judgments based on sequence position are unsupported; an ordinal cannot prescribe the next trade.","notes":"This asks for judgment/advice, not a factual lifecycle ordinal."},{"caseId":"C8-E14-20","caseType":"unsupported_data","input":"Remove the decision-state barrier and renumber every later candidate from one.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account, stable instrument, and account-IANA timezone","complete pre-filter candidate set with first-entry raw UTC and stable round-trip identity required","state-labelled incomplete/needs_decision barriers retained with original ordinals and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Missing partition/order facts, pre-sequence filtering, a request to bypass the daily partition, remove barriers, or renumber across them makes the requested sequence unsupported.","notes":"Never substitute execution/fill order, invent a tie-break/date, or compress ordinal gaps created by filtered presentation."},{"caseId":"C8-E14-21","caseType":"selected_entity_context","input":"For the trusted selected compatible scope, show trade sequence with state labels.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_sequence"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Build all authorized current lifecycle candidates before analytic filters. Partition unconditionally by account, stable instrument, and account-local entry date—even for non-day-specific requests—then order by first-entry raw UTC and stable round-trip ID and assign stable one-based ordinals. Retain incomplete/needs_decision candidates as visible state-labelled barriers; exact pre-barrier results and partial/unavailable coverage follow, with no skipping or renumbering. Expose no raw IDs, invent no date/time/context, and infer no motive, quality, causation, or advice."},{"caseId":"C8-E14-22","caseType":"cross_category","input":"Compare trade sequence with net P&L for the trusted population without claiming ordinal caused outcome.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["trade_sequence","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["assign stable one-based lifecycle ordinals in the complete fixed pre-filter candidate sequence while preserving state-labelled barriers and original numbering","descriptive cross-category comparison"],"expectedComparison":{"left":"trade_sequence","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized account, stable instrument, and account-IANA timezone","complete current lifecycle candidate sequence built before analytic date, result, or projection-state filters","fixed account plus stable-instrument plus account-local-entry-date partition ordered by first-entry raw UTC then stable round-trip ID","ready_closed, legitimate_open, needs_decision, and incomplete state-labelled coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep original lifecycle ordinal and compatible net P&L descriptive and separate; preserve barriers/coverage and make no causal or advisory claim."}]
```

### `average_shares_per_execution`

```json
[{"caseId":"C8-E15-01","caseType":"canonical","input":"Show average shares per execution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-02","caseType":"formal_paraphrase","input":"Return exact absolute shares divided by distinct accepted Stock execution count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-03","caseType":"conversational_paraphrase","input":"How many shares did I trade per execution on average?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-04","caseType":"trader_slang","input":"What's my avg shares per fill?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-05","caseType":"abbreviation","input":"Show TSLA avg sh/exec for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-06","caseType":"misspelling","input":"Show averge shars per exectuion.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-07","caseType":"noisy_input","input":"avg shares each fill pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-08","caseType":"command","input":"Calculate absolute shares once per distinct Stock multiplier-one execution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-09","caseType":"fragment","input":"Mean shares per execution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-10","caseType":"follow_up","input":"For that trusted prior selected scope, what was average shares per execution?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":["trusted prior selected scope"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-11","caseType":"correction","input":"For that trusted result, I meant distinct executions, not allocation-event size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-12","caseType":"comparison","input":"Compare average shares per execution for the two trusted compatible Stock selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count","exact comparison with coverage"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"average_shares_per_execution"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-13","caseType":"ranking","input":"Rank the trusted Stock ticker groups by average shares per execution.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":["trusted validated ticker group"],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted validated ticker groups","expectedContextRequirements":["explicit trusted ticker groups","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-14","caseType":"negation","input":"Show shares per execution, not contracts or position size.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":["exclude contracts, allocation-event size, or position size interpretation"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count","exclude alternate grain"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-15","caseType":"exclusion","input":"Show average shares per execution excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-16","caseType":"multi_filter","input":"Show average shares per execution for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period applied only after authoritative sequence or member construction","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-17","caseType":"multi_part","input":"For the trusted current and prior periods, show average shares per execution and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods applied after authoritative construction","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-18","caseType":"ambiguity","input":"What's my average size?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-grain clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric grain","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean shares per distinct accepted Stock execution, or quantity per allocation event, contract, or position?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Average size may mean shares, contracts, dollars, allocation size, or position size. Ask one unit/member-basis question; never infer ticker/date context."},{"caseId":"C8-E15-19","caseType":"negative_example","input":"What average share size should I use next?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Position-sizing advice is unsupported; historical average shares per execution cannot prescribe future size.","notes":"This asks for advice, not a factual historical execution-quantity mean."},{"caseId":"C8-E15-20","caseType":"unsupported_data","input":"Mix option contracts and Stock shares, count a flip twice, and use zero when no executions qualify.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and Stock multiplier-one instrument scope","distinct current accepted execution identity with exact absolute quantity and one compatible share unit required","positive distinct execution denominator with decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Contracts, non-unit multipliers, mixed/missing quantity units, missing execution identity/quantity, or zero denominator make average shares per execution unavailable.","notes":"Do not convert contracts, allocations, mixed units, or missing quantities into shares; do not count a flip twice or replace empty with zero."},{"caseId":"C8-E15-21","caseType":"selected_entity_context","input":"For the trusted selected compatible Stock scope, show average shares per execution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_shares_per_execution"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"For one compatible share-unit partition, sum exact absolute quantity once per distinct current accepted Stock multiplier-one execution and divide by distinct execution count. A flip execution contributes once. Contracts, non-unit multipliers, mixed units, allocated role quantities, and zero denominator are unavailable. Preserve exact arithmetic and state/time coverage, validate tickers, expose no raw IDs, invent no dates/context, and infer no quality, causation, risk judgment, or advice."},{"caseId":"C8-E15-22","caseType":"cross_category","input":"Compare average shares per execution with net P&L for the trusted population without claiming size caused results.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["average_shares_per_execution","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact sum of absolute quantity once per distinct current accepted Stock multiplier-one execution divided by distinct qualifying execution count","descriptive cross-category comparison"],"expectedComparison":{"left":"average_shares_per_execution","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, Stock instrument, multiplier-one, and share-unit scope","distinct current accepted execution IDs with exact absolute execution quantity counted once","positive distinct execution denominator; ready_closed default with explicit legitimate_open and needs_decision/incomplete coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exact shares per execution and compatible net P&L separate; report numerator, denominator, unit, state, and coverage without causal or advisory claims."}]
```

### `execution_duration`

```json
[{"caseId":"C8-E16-01","caseType":"canonical","input":"Show execution duration for the eligible closed lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-02","caseType":"formal_paraphrase","input":"Return Category 7 hold duration for the selected ready-closed trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-03","caseType":"conversational_paraphrase","input":"How long was I in this completed trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-04","caseType":"trader_slang","input":"What was my time in the closed trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-05","caseType":"abbreviation","input":"Show NVDA exec duration for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-06","caseType":"misspelling","input":"Show exection duraton.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-07","caseType":"noisy_input","input":"exec dur pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-08","caseType":"command","input":"Select Category 7 hold duration without recalculating it.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-09","caseType":"fragment","input":"Closed-lifecycle execution duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-10","caseType":"follow_up","input":"For that trusted prior selected scope, show execution duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":["trusted prior selected scope"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-11","caseType":"correction","input":"For that trusted result, I meant whole-trade hold duration, not fill latency.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-12","caseType":"comparison","input":"Compare execution duration for the two trusted compatible closed lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic","exact comparison with coverage"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"execution_duration"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-13","caseType":"ranking","input":"Rank the trusted compatible ticker groups by Category 7 hold duration.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-14","caseType":"negation","input":"Show closed lifecycle duration, not order time, fill latency, last activity, or open age.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":["exclude order duration, fill latency, last-activity span, or open age interpretation"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-15","caseType":"exclusion","input":"Show execution duration excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-16","caseType":"multi_filter","input":"Show execution duration for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-17","caseType":"multi_part","input":"For the trusted current and prior periods, show execution duration and endpoint coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-18","caseType":"ambiguity","input":"What's the execution duration?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-meaning clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric meaning","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the closed lifecycle's Category 7 first-entry-to-final-exit hold duration, or the timing of an order, fill, last activity, or open age?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Execution duration may mean lifecycle hold duration or order/fill timing. Ask one endpoint/meaning question; do not invent dates, endpoints, or selected lifecycle."},{"caseId":"C8-E16-19","caseType":"negative_example","input":"How long should I hold my next trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Advice or causal claims about how long to hold are unsupported; historical hold duration cannot prescribe a future duration.","notes":"This asks for advice/causation, not selection of a factual Category 7 duration."},{"caseId":"C8-E16-20","caseType":"unsupported_data","input":"Use current time as final exit to calculate execution duration for an open position.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and lifecycle scope","eligible ready_closed state and Category 7 first-entry/final-exit raw UTC endpoints required","legitimate_open age and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Open, decision, or incomplete lifecycle state; missing/reversed endpoints; or a request for order/fill/last-activity duration cannot use the execution_duration alias.","notes":"Return Category 7 unavailable/coverage; never fabricate final exit, use current time, or create duplicate arithmetic."},{"caseId":"C8-E16-21","caseType":"selected_entity_context","input":"For the trusted selected compatible ready-closed scope, show execution duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["execution_duration"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Resolve execution_duration only as a terminology/selection alias to Category 7 hold_duration for eligible ready_closed lifecycles. Category 7 alone computes final-exit raw UTC minus first-entry raw UTC. Do not duplicate arithmetic or substitute order duration, fill latency, last-activity span, or legitimate-open age. Preserve raw UTC/IANA context and coverage, expose no raw IDs, invent no date/endpoint, and infer no causation, quality, or advice."},{"caseId":"C8-E16-22","caseType":"cross_category","input":"Compare execution duration with net P&L for the trusted population without claiming duration caused results.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["execution_duration","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["select Category 7 hold_duration for an eligible ready_closed lifecycle without duplicate duration arithmetic","descriptive cross-category comparison"],"expectedComparison":{"left":"execution_duration","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and lifecycle scope","eligible ready_closed lifecycle with Category 7 first-entry and final-exit raw UTC endpoints","Category 7 hold_duration arithmetic and account-IANA presentation/coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep Category 7 hold duration and compatible net P&L descriptive and separate; expose coverage with no causal or advisory claim."}]
```

### `entry_to_exit_quantity_reconciliation`

```json
[{"caseId":"C8-E17-01","caseType":"canonical","input":"Show entry-to-exit quantity reconciliation for the selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-02","caseType":"formal_paraphrase","input":"Return entered quantity, exited quantity, exact residual, state, and coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-03","caseType":"conversational_paraphrase","input":"Do my entered and exited shares balance exactly?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-04","caseType":"trader_slang","input":"Show my shares in, shares out, and shares left.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-05","caseType":"abbreviation","input":"Show AAPL qty recon for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-06","caseType":"misspelling","input":"Show quantiy reconcilliation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-07","caseType":"noisy_input","input":"in out qty whats left pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-08","caseType":"command","input":"Reconcile exact increasing and decreasing allocations without repairing discrepancies.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-09","caseType":"fragment","input":"Entry-exit quantity residual.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-10","caseType":"follow_up","input":"For that trusted prior selected scope, show quantity reconciliation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":["trusted prior selected scope"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-11","caseType":"correction","input":"For that trusted result, I meant share conservation, not cash reconciliation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-12","caseType":"comparison","input":"Compare quantity reconciliation for the two trusted compatible lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit","exact comparison with coverage"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"entry_to_exit_quantity_reconciliation"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-13","caseType":"ranking","input":"Rank compatible factual open lifecycles by absolute residual quantity.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-14","caseType":"negation","input":"Show quantity reconciliation, not cash or P&L balance.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":["exclude cash or P&L reconciliation or invented quantity repair interpretation"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-15","caseType":"exclusion","input":"Show reconciliation excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-16","caseType":"multi_filter","input":"Show reconciliation for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-17","caseType":"multi_part","input":"For the trusted current and prior periods, show entered, exited, residual, state, and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-18","caseType":"ambiguity","input":"Does it balance?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-meaning clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric meaning","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want exact entered, exited, and residual instrument quantity for one lifecycle, or a cash or P&L reconciliation?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Reconcile or balance may mean instrument quantity, cash, or P&L. Ask one object question; never infer lifecycle, state, unit, opening inventory, or missing fill."},{"caseId":"C8-E17-19","caseType":"negative_example","input":"Add a missing exit so this trade reconciles to zero.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Requests to invent, alter, or recommend executions to force reconciliation are unsupported; factual conservation cannot prescribe trades.","notes":"This requests repair/advice, not factual read-only quantity reconciliation."},{"caseId":"C8-E17-20","caseType":"unsupported_data","input":"Force a decision-state lifecycle to closed zero and mix its share and contract quantities.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted allocation identities, roles, exact quantities, and projection state required","mixed units and needs_decision/incomplete evidence remain unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Missing/conflicting identity, role, quantity, unit, or state; mixed units; or a request to force zero/invent opening or closing quantity makes reconciliation unavailable.","notes":"Never fabricate a repair. Ready_closed requires exact zero; legitimate_open requires positive absolute residual equal factual remaining quantity and direction supplies sign."},{"caseId":"C8-E17-21","caseType":"selected_entity_context","input":"For the trusted selected compatible lifecycle, show quantity reconciliation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Publish exact increasing quantity, decreasing quantity, and residual entered minus exited in one compatible unit. Ready_closed must be exact zero. Legitimate_open must have exact positive absolute residual equal factual remaining open quantity, with lifecycle direction supplying signed quantity. Needs_decision/incomplete is unresolved. Preserve conservation; never invent, net away, or repair quantity. Expose no raw IDs, invent no dates/context, and infer no cause or advice."},{"caseId":"C8-E17-22","caseType":"cross_category","input":"Compare reconciliation state with net P&L for the trusted population without claiming residual caused results.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["entry_to_exit_quantity_reconciliation","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["publish exact entered increasing quantity, exited decreasing quantity, residual, projection state, and conservation coverage in one compatible unit","descriptive cross-category comparison"],"expectedComparison":{"left":"entry_to_exit_quantity_reconciliation","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","stable accepted increasing/decreasing allocation identities with exact quantities","ready_closed exact-zero, legitimate_open factual-positive-residual, and needs_decision/incomplete unresolved coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exact quantity reconciliation and compatible net P&L separate; report state/unit/coverage without inventing repairs or causation."}]
```

### `unmatched_executions`

```json
[{"caseId":"C8-E18-01","caseType":"canonical","input":"Show unmatched executions as the exclusive labelled coverage bundle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-02","caseType":"formal_paraphrase","input":"Return stable-member-deduplicated counts using c then b then a precedence.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-03","caseType":"conversational_paraphrase","input":"Which underlying execution-related records are still unmatched?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-04","caseType":"trader_slang","input":"Show my orphaned fill members by type without duplicates.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-05","caseType":"abbreviation","input":"Show NVDA unmatched execs only if the trusted ticker attribution exists.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-06","caseType":"misspelling","input":"Show unmached exectuions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-07","caseType":"noisy_input","input":"unmatched stuff pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-08","caseType":"command","input":"Classify stable members exclusively as c, then b not c, then a not c.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-09","caseType":"fragment","input":"Exclusive unmatched-member counts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-10","caseType":"follow_up","input":"For that trusted prior selected scope, show unmatched execution coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":["trusted prior selected scope"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-11","caseType":"correction","input":"For that trusted result, I meant underlying members, not Data Decision rows.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-12","caseType":"comparison","input":"Compare exclusive unmatched-member counts for the two trusted authorized accounts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c","exact comparison with coverage"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"unmatched_executions"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-13","caseType":"ranking","input":"Rank authorized accounts by deduplicated unmatched-member count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-14","caseType":"negation","input":"Show underlying unmatched members, not Data Decision record count or overlapping labels.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":["exclude Data Decision record count or overlapping unmatched labels interpretation"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-15","caseType":"exclusion","input":"Show unmatched coverage excluding displayed label c without reclassifying its members.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-16","caseType":"multi_filter","input":"Show unmatched members for the trusted ticker and period only where member attribution supports both.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-17","caseType":"multi_part","input":"For the trusted current and prior periods, show c-b-a counts, total, and attribution coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-18","caseType":"ambiguity","input":"How many unmatched decisions or executions are there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-meaning clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric meaning","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want the underlying unmatched source/execution members by exclusive c-b-a label, or the number of Data Decision records?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unmatched executions may mean underlying members or Data Decision records. Ask one object question; do not infer source/ticker/date attribution or a match."},{"caseId":"C8-E18-19","caseType":"negative_example","input":"Which broker caused these unmatched executions?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Blame, causation, or advice based on unmatched coverage is unsupported; coverage facts cannot diagnose broker intent or recommend correction.","notes":"This asks for blame/causation, not an exclusive factual coverage bundle."},{"caseId":"C8-E18-20","caseType":"unsupported_data","input":"Count the Data Decision itself, then count its candidate again in b and a using an unsupported ticker filter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized bounded account scope","stable underlying identity and deterministic c-then-b-then-a membership required","narrow source/ticker/date filters only when factual member attribution supports them"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Unstable identity, overlapping/ambiguous labels, counting Data Decisions, invented matches, or filters below factual attribution grain make the requested unmatched result unavailable.","notes":"Never count one member twice, count a decision as a member, reclassify c into b/a after exclusion, or apply unsupported attribution filters."},{"caseId":"C8-E18-21","caseType":"selected_entity_context","input":"For the trusted selected bounded account scope, show exclusive unmatched coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["unmatched_executions"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Deduplicate by stable underlying member identity and assign exactly one label: (c) provisional reconciliation candidate members first, with Data Decision state metadata only and never a member; then (b) accepted executions lacking required allocation only when not c; then (a) source records unable to form accepted execution only when not represented in c. Never double-count, count a decision, or turn it into a match. Apply only supported attribution filters; otherwise label bounded authorized account coverage. Expose no raw IDs, invent no match/date/context, and infer no source blame or causation."},{"caseId":"C8-E18-22","caseType":"cross_category","input":"Compare unmatched-member coverage with net P&L without claiming unmatched records caused results.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["unmatched_executions","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["return stable-member-deduplicated exclusive unmatched coverage using precedence c provisional candidate, then b accepted execution lacking allocation not c, then a source record lacking accepted execution not c","descriptive cross-category comparison"],"expectedComparison":{"left":"unmatched_executions","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized bounded account scope and only factually supported source/member attribution","stable identities for provisional candidate members, accepted executions, and source records","Data Decision state as metadata only with exclusive c-then-b-then-a coverage","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exclusive unmatched-member coverage and compatible net P&L separate; report attribution limits without blame, causal, or advisory claims."}]
```

### `remaining_open_quantity`

```json
[{"caseId":"C8-E19-01","caseType":"canonical","input":"Show remaining open quantity for the confirmed open lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-02","caseType":"formal_paraphrase","input":"Return exact signed and absolute factual open quantity in its compatible unit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-03","caseType":"conversational_paraphrase","input":"How many shares are still factually open?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-04","caseType":"trader_slang","input":"What size am I still long or short?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-05","caseType":"abbreviation","input":"Show TSLA open qty for the trusted ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit metric abbreviation and validated ticker grammar; ordinary words are not inferred as tickers","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-06","caseType":"misspelling","input":"Show remaing open quantty.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-07","caseType":"noisy_input","input":"qty left open pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-08","caseType":"command","input":"Select legitimate-open signed quantity and absolute magnitude only.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-09","caseType":"fragment","input":"Remaining factual open quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-10","caseType":"follow_up","input":"For that trusted prior selected scope, show remaining open quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":["trusted prior selected scope"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected scope context","expectedContextRequirements":["explicit trusted prior context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-11","caseType":"correction","input":"For that trusted result, I meant quantity left, not unrealized P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-12","caseType":"comparison","input":"Compare remaining open quantity for the two trusted compatible open lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":["trusted first compatible selection","trusted second compatible selection"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit","exact comparison with coverage"],"expectedComparison":{"left":"trusted first compatible selection","right":"trusted second compatible selection","basis":"remaining_open_quantity"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-13","caseType":"ranking","input":"Rank trusted compatible open Stock positions by absolute shares remaining.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":["trusted compatible validated ticker group"],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit","descending exact result","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible ticker groups","expectedContextRequirements":["explicit trusted compatible ticker groups","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-14","caseType":"negation","input":"Show factual open quantity, not decision remainder, value, or unrealized P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":["exclude needs_decision remainder, inferred opening balance, market value, or unrealized P&L interpretation"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-15","caseType":"exclusion","input":"Show remaining open quantity excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-16","caseType":"multi_filter","input":"Show remaining open quantity for the trusted ticker in the trusted declared account-local period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":["trusted selected ticker","trusted declared account-local period"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":"trusted declared account-local period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate","no invented date, timezone, ticker, or missing context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-17","caseType":"multi_part","input":"For the trusted current and prior periods, show signed/absolute open quantity, unit, and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit","coverage inspection"],"expectedComparison":null,"expectedTimeRange":"trusted current and prior account-local periods","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-18","caseType":"ambiguity","input":"What's left in my position?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric-meaning clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved metric meaning","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want the exact signed and absolute quantity still factually open, or its market value or unrealized P&L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Remaining/open position may mean quantity, market value, cost basis, or unrealized P&L. Ask one quantity-versus-value question; never infer state, unit, opening balance, ticker, or date."},{"caseId":"C8-E19-19","caseType":"negative_example","input":"Should I close the remaining quantity now?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, motive, prediction, quality judgment, or causal prescription"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Position-sizing or close/hold advice is unsupported; factual remaining quantity cannot prescribe action.","notes":"This asks for advice, not a factual legitimate-open quantity."},{"caseId":"C8-E19-20","caseType":"unsupported_data","input":"Treat a needs-decision candidate as open, infer its starting shares, mix contracts, and calculate unrealized P&L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable with coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually legitimate_open state with exact conserved positive absolute residual required","needs_decision/incomplete, inferred inventory, mixed units, and valuation requests remain unavailable or separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Non-legitimate-open state, missing/conflicting residual or unit, mixed units, inferred opening inventory, or a request for market value/unrealized P&L cannot produce remaining_open_quantity.","notes":"Never convert decision state into factual open, invent quantity, mix contracts/shares, or substitute valuation; unavailable is not zero."},{"caseId":"C8-E19-21","caseType":"selected_entity_context","input":"For the trusted selected compatible legitimate-open scope, show remaining open quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["remaining_open_quantity"],"expectedFilters":["trusted selected compatible scope"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected scope context","expectedContextRequirements":["explicit trusted selected compatible scope","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Return exact current signed quantity and positive absolute quantity only for factually legitimate_open lifecycles in one compatible unit. Direction supplies sign; magnitude equals the factual conserved residual. Do not include needs_decision/incomplete candidates, infer opening inventory or missing fills, mix units, call quantity realized, or calculate market value/unrealized P&L. Expose no raw IDs, invent no dates/context, and infer no risk, causation, or advice."},{"caseId":"C8-E19-22","caseType":"cross_category","input":"Compare remaining open quantity with net P&L without treating it as realized or claiming quantity caused results.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["remaining_open_quantity","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["select exact signed and absolute factual residual for legitimate_open lifecycle in one compatible instrument unit","descriptive cross-category comparison"],"expectedComparison":{"left":"remaining_open_quantity","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account, lifecycle, instrument, and quantity-unit scope","factually confirmed legitimate_open state with exact conserved positive absolute residual","direction supplies signed quantity; ready_closed and needs_decision/incomplete coverage remain separate","Category 2 net P&L and Category 5 fee-completeness in compatible currency"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exact open quantity and compatible net P&L separate; state whether P&L is realized and never infer unrealized value, causation, or advice."}]
```

Final Batch 6 ends here. All nineteen arrays `C8-E1` through `C8-E19` passed
comprehensive independent review with zero failures. Review PASS is not
category approval or lock.

---

# 8. Coverage Report Deliverable

Production and comprehensive independent review passed. The controlling-list
count is 19. Section 5 has 19 independently reviewed canonical records;
Section 6 has 19 independently reviewed registries with all 38 subsections;
and Section 7 has 418/418 reviewed and passed cases with zero failures across
19 complete arrays. Accepted coverage is 19/19 concepts, 19/19
arrays, 418/418 cases, 19 clarification cases, 38 unsupported cases, and 19
cross-category cases. The canonical, registry, evaluation, and coverage review
gates are accepted. The controller approved and locked the canonical names and
registries, assigned Version 1, accepted the master-tracker transition, and
marked Category 8 Complete. These approvals do not claim runtime support.

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
- [x] Duplicate-concept boundaries are resolved for event counts versus
  execution-ID counts, simple versus weighted price names, and the Category 7
  duration alias without removing any controlling item.

## Canonical Inventory

- [x] Every item has a stable inventory ID.
- [x] Every item has a canonical name.
- [x] Batch 1 through Batch 3 records `C8-EXEC-001` through `C8-EXEC-019` each have a
  completed Section 5 exact-definition record.
- [x] Related concepts are complete for all nineteen canonical records.
- [x] Classification, status, units, open-trade support, fee handling, and
  version are present in all nineteen canonical records.
- [x] Every controlling item has a completed Section 5 record.
- [x] All nineteen canonical records passed independent review.

## Language Registry

- [x] Batch 1 through final Batch 4 registries `C8-EXEC-001` through
  `C8-EXEC-019` each contain all 38 required subsections in exact canonical
  order.
- [x] Every controlling item has a completed Section 6 registry.
- [x] All nineteen language registries passed independent review.

## Execution Requirements

- [x] Required/optional data, filters, groupings, operators, compatible intents,
  incompatible combinations, defaults, one-field clarifications, unsupported
  conditions, tool targets, units, fees, open handling, and sample rules are
  complete for all nineteen produced registries.

## Evaluation

- [x] Section 7 Batches 1-6 save exactly nineteen complete 22-case arrays with
  the locked 21-key schema and ordered case types: `C8-E1` through `C8-E19`.
- [x] Saved, reviewed, passed, unreviewed, and unsaved counts truthfully report
  418, 418, 418, 0, and 0 respectively, with 0 failures.
- [x] Evaluation case production is complete: 418/418 saved and 0 unsaved.
- [x] Comprehensive independent Terra review passed all 418/418 cases with 0
  failures.

## Coverage Report

- [x] Section 8 production counts are complete for 19 concepts, 19 registries,
  19 arrays, and 418 saved cases.
- [x] Section 8 comprehensive independent review passed and the
  canonical, registry, evaluation, and coverage gates are accepted.

## Approval

- [x] Pre-approval review gate was accepted before final approval.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] Version is updated to 1.
- [x] Master tracker transition is accepted by the lead controller.
- [x] Change log records approval/completion.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Independent planning review identified event-grain ambiguity, a collision
  with current quantity-weighted analytics price outputs, unresolved scale and
  partial-exit denominators, duplicate duration arithmetic risk, sequence
  barrier ambiguity, and overlapping unmatched-coverage populations.
- The controller accepted the bounded planning remediation. This acceptance
  resolved planning semantics and was carried through the subsequently
  approved and locked category.
- Final planning precision review required sequence construction before
  analytic filters and deterministic exclusive precedence/deduplication for
  unmatched coverage. Both remediations are recorded consistently in Sections
  3.5 and 4 without changing category state.
- Final independent planning review returned PASS, and the controller accepted
  the exact 19-item planning inventory. The controller has authorized Section 5
  production through Batch 3 records `C8-EXEC-001` through `C8-EXEC-019`; this
  completed the canonical records before their later final approval and lock;
  it was never a runtime-support decision.
- Canonical review found one residual conditional phrase in C8-EXEC-014 that
  could let non-day-specific wording bypass the fixed lifecycle partition. The
  remediation makes account, stable instrument, and account-local entry date
  unconditional without changing pre-filter ordering or barrier semantics.
- All nineteen canonical records independently passed review. Section 6 Batch
  1 through final Batch 4 authorization covers registries `C8-EXEC-001`
  through `C8-EXEC-019`; they subsequently passed review and were approved and
  locked without creating runtime support.
- Independent Section 6 review found that repeat-attempt wording could count an
  incomplete/nonqualifying candidate as an attempt, and that open
  reconciliation did not require its residual to equal factual remaining open
  quantity. Both definition-level ambiguities are remediated without changing
  candidate barriers, inventory status, or deliverable state.
- All nineteen Section 6 registries independently passed review. The controller
  authorized Section 7 Batches 1-6 through `remaining_open_quantity`; all 418
  cases and the Section 8 production report passed comprehensive independent
  Terra review with zero failures. The controller accepted the final clerical
  PASS and approved and locked the category.
- The controller accepted the exact nineteen canonical names and registries,
  418/418 passed evaluation cases, and Section 8 coverage, assigned Version 1,
  accepted the master-tracker transition, and marked Category 8 Complete.

## Required Changes

- None. Final controller approval, lock, Version 1, tracker transition, and
  Complete gates are accepted.

## Completed Changes

- Fixed entry/exit and scale counts to stable allocation-event identity while
  keeping distinct current execution-ID counts across the full declared scope.
- Separated simple Category 8 price means from current quantity-weighted
  analytics outputs and prohibited alias reuse or duplicate truth.
- Fixed partial-exit event-rate, Category 7 duration-alias, sequence-barrier,
  and non-overlapping unmatched-coverage semantics.
- Fixed repeat/sequence construction before analytic date, result, or
  projection-state filters so filters cannot remove a predecessor/barrier or
  renumber later candidates across it.
- Fixed unmatched-coverage precedence as (c), then (b) when not in (c), then
  (a) when not represented in (c), with stable-member deduplication, Data
  Decision state as metadata only, and no cross-label double count.
- Recorded final independent planning PASS and controller acceptance of the
  exact 19-item planning inventory.
- Completed all nineteen Section 5 canonical records in exact order:
  `C8-EXEC-001` through `C8-EXEC-019`.
- Batch 2 fixes distinct exit-execution identity; stable scale event counts;
  exact partial-exit event rate; one-ID flip counting; and pre-filter lifecycle
  sequence/barrier semantics without motive, quality, causation, or advice.
- Batch 3 fixes exact Stock-share execution means, Category 7 duration aliasing,
  quantity reconciliation, exclusive unmatched-member coverage, and factual
  legitimate-open quantity without invented repairs or valuation claims.
- Remediated C8-EXEC-014 so every request uses the fixed server-authorized
  account/stable-instrument/account-local-entry-date partition; non-day-specific
  wording cannot bypass it.
- Completed all nineteen Section 6 registries in exact order:
  `C8-EXEC-001` through `C8-EXEC-019`, each with all 38 required subsections.
- Batch 2 preserves the exact weighted-exit formula, current distinct
  entry/exit execution-ID grain with one-ID flip handling, and stable
  long/short-safe adding/reducing scale-event counts.
- Batch 3 preserves the exact reducing-event partial-exit rate, one-ID flip
  count, unconditional pre-filter lifecycle sequence and barriers, and exact
  Stock multiplier-one shares-per-distinct-execution mean.
- Final Batch 4 preserves Category 7-only hold-duration arithmetic, exact
  state-aware quantity conservation, exclusive unmatched-member precedence,
  and factual legitimate-open signed/absolute quantity without invention.
- Remediated `repeat_attempts` so only qualifying zero-to-nonzero lifecycles
  count as attempts while nonqualifying/incomplete candidates remain noncounted
  barriers, and remediated reconciliation so factual `legitimate_open`
  absolute residual is positive and exactly equals remaining open quantity
  with lifecycle direction supplying the signed quantity.
- Saved Section 7 Batch 1 as exactly three 22-case arrays for entry-event count,
  exit-event count, and simple average entry price, preserving allocation-event
  grain, long/short/flip roles, simple-versus-weighted separation, ambiguity,
  authorization, exactness, coverage, ticker, privacy, and no-advice limits.
- Saved Section 7 Batch 2 as exactly three 22-case arrays for simple average exit
  price and exact quantity-weighted entry/exit prices, preserving stable split-
  allocation grain, positive denominators, basis clarification, compatible
  currency/units, coverage, privacy, and no-advice limits.
- Saved Section 7 Batch 3 as exactly three 22-case arrays for distinct entry and
  exit execution IDs plus stable adding allocation events, preserving full-
  scope deduplication, one-ID flip handling, long/short roles, event-versus-ID
  clarification, authorization, coverage, privacy, and no-advice limits.
- Saved Section 7 Batch 4 as exactly three 22-case arrays for stable reducing
  allocation events, exact partial-exit event rate, and unique through-flat
  flip executions, preserving denominators, one-ID adjacency, role safety,
  ambiguity, authorization, coverage, privacy, and no-advice limits.
- Saved Section 7 Batch 5 as exactly three 22-case arrays for qualifying repeat
  lifecycles, fixed-partition trade sequence, and exact Stock multiplier-one
  shares per distinct execution, preserving pre-filter candidates, noncounted
  barriers, no-renumbering, units, coverage, privacy, and no-advice limits.
- Saved final Section 7 Batch 6 as exactly four 22-case arrays for the Category
  7 duration alias, state-aware quantity reconciliation, exclusive unmatched
  coverage, and factual legitimate-open quantity, preserving exactness,
  attribution, privacy, coverage, no-invention, and no-advice limits.
- Completed Section 8 production counts at 19/19 concepts, 19/19 arrays, and
  418/418 cases.
- Recorded comprehensive independent Terra PASS for 418 reviewed, 418 passed,
  and 0 failed cases and accepted the canonical, registry, evaluation, and
  coverage review gates.
- Recorded final clerical PASS and controller acceptance; approved and locked
  all nineteen canonical names and registries, updated all record versions to
  1, accepted the master-tracker transition, and marked the category Complete.
- Kept all nineteen capability statuses `Planned`; final approval does not
  inflate runtime support.

## Approval Decision

- Status: Complete.
- Approved by: Controller after comprehensive independent Terra PASS and final
  clerical PASS.
- Approval date: 2026-08-10.
- Version: 1.
- Canonical names locked: Yes.
- Language registries locked: Yes.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-10 | Controller approved and locked Category 8 after comprehensive independent Terra PASS and final clerical PASS | Finalize Complete status, Version 1 canonical records, approved/locked names and registries, 418/418 passed evaluation, accepted coverage and master-tracker transition, and all checklist gates without inflating any Planned runtime capability | 1 |
| 2026-08-10 | Recorded comprehensive independent Terra PASS and moved Category 8 to Ready for Review | Record 418 reviewed, 418 passed, and 0 failed; accept canonical, registry, evaluation, and coverage pre-lock gates while preserving Planned statuses, Version 0, unapproved/unlocked state, and no runtime claim | 0 |
| 2026-08-10 | Saved final Section 7 Evaluation Batch 6 for C8-E16 through C8-E19 and completed unreviewed Section 8 production counts | Add exactly 88 unreviewed 21-key cases for duration aliasing, quantity reconciliation, exclusive unmatched coverage, and factual open quantity; record 418/418 production without pass, approval, lock, or Complete claims | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 5 for C8-E13 through C8-E15 | Add exactly 66 unreviewed 21-key cases for qualifying repeat lifecycles, fixed-partition trade sequence, and exact Stock shares per distinct execution while preserving barriers, no-renumbering, unit safety, privacy, and no-pass boundaries | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 4 for C8-E10 through C8-E12 | Add exactly 66 unreviewed 21-key cases for stable scale-out events, exact partial-exit event rate, and unique through-flat flip executions while preserving denominators, role safety, coverage, privacy, and no-pass boundaries | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 3 for C8-E7 through C8-E9 | Add exactly 66 unreviewed 21-key cases for distinct entry/exit execution IDs and stable scale-in allocation events while preserving scope-wide deduplication, flip handling, role safety, coverage, privacy, and no-pass boundaries | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 2 for C8-E4 through C8-E6 | Add exactly 66 unreviewed 21-key cases for simple average exit price and exact quantity-weighted entry/exit prices while preserving basis separation, positive denominators, currency/unit compatibility, coverage, privacy, and no-pass boundaries | 0 |
| 2026-08-10 | Saved Section 7 Evaluation Batch 1 for C8-E1 through C8-E3 | Add exactly 66 unreviewed 21-key cases for stable entry/exit allocation-event counts and simple average entry price while preserving weighted-price separation, authorization, coverage, privacy, and no-pass boundaries | 0 |
| 2026-08-10 | Remediated Section 6 repeat-attempt qualification and legitimate-open reconciliation definitions | Count only qualifying zero-to-nonzero lifecycles as attempts while retaining noncounted candidate barriers, and require positive absolute open residual to equal factual remaining open quantity with direction supplying sign | 0 |
| 2026-08-10 | Completed final Section 6 Registry Batch 4 for C8-EXEC-016 through C8-EXEC-019 and all nineteen registries | Add four complete planned registries for the Category 7 duration alias, exact state-aware quantity conservation, exclusive unmatched-member coverage, and factual legitimate-open quantity while leaving Sections 7-8 deferred and the category unapproved/unlocked | 0 |
| 2026-08-10 | Completed Section 6 Registry Batch 3 for C8-EXEC-011 through C8-EXEC-015 | Add five complete planned registries for exact partial-exit event rate, unique flip executions, fixed-partition repeat/sequence barriers, and exact Stock shares per distinct execution while leaving registries 016-019 and Sections 7-8 deferred | 0 |
| 2026-08-10 | Completed Section 6 Registry Batch 2 for C8-EXEC-006 through C8-EXEC-010 | Add five complete planned registries for weighted exit price, distinct entry/exit execution counts, and stable scale-in/out events with exact formulas, ambiguity, authorization, coverage, privacy, long/short/flip safety, and no-runtime boundaries | 0 |
| 2026-08-10 | Recorded all nineteen canonical records' independent PASS and completed Section 6 Registry Batch 1 for C8-EXEC-001 through C8-EXEC-005 | Add five complete planned language registries with exact event identity, simple/weighted price basis, ambiguity clarification, authorization, coverage, privacy, and no-runtime boundaries while leaving registries 006-019 and Sections 7-8 deferred | 0 |
| 2026-08-10 | Remediated C8-EXEC-014 to require its account, stable-instrument, and account-local-entry-date partition for every request | Remove the residual conditional wording so non-day-specific requests cannot bypass the accepted partition, pre-filter sequence, or barrier/no-renumber contract | 0 |
| 2026-08-10 | Completed Section 5 Batch 3 records C8-EXEC-015 through C8-EXEC-019 and all nineteen canonical records | Add exact Stock-share execution mean, Category 7 duration alias, conserving quantity reconciliation, exclusive unmatched-member coverage, and legitimate-open quantity records while preserving Planned status and deferred Sections 6-8 | 0 |
| 2026-08-10 | Completed Section 5 Batch 2 records C8-EXEC-008 through C8-EXEC-014 | Add the next seven planned canonical records with exact exit-execution, scale-event, partial-exit-rate, flip, repeat, sequence, barrier, partition, privacy, and coverage boundaries while leaving records 015-019 and Sections 6-8 deferred | 0 |
| 2026-08-10 | Recorded final independent planning PASS/controller acceptance and completed Section 5 Batch 1 records C8-EXEC-001 through C8-EXEC-007 | Produce the first seven planned canonical records with exact allocation-event, execution-ID, simple/weighted price, coverage, partition, privacy, and no-runtime boundaries while leaving records 008-019 and Sections 6-8 deferred | 0 |
| 2026-08-10 | Applied final planning precision remediation for pre-filter lifecycle sequencing and deterministic unmatched-member precedence | Preserve predecessor/barrier identity across analytic filters and prevent Data Decisions or shared underlying members from being counted across unmatched coverage labels | 0 |
| 2026-08-10 | Applied controller-accepted independent planning remediation for event identity, price-name collision, scale/partial policy, duration alias, sequence barriers, and unmatched coverage | Resolve the bounded planning findings while preserving all nineteen names/order, Planned statuses, Version 0, deferred deliverables, and unapproved/unlocked state | 0 |
| 2026-08-10 | Created Version 0 Category 8 planning and complete 19-name controlling inventory draft; deferred Sections 5-8 | Establish evidence-backed execution/allocation vocabulary and expose controller decisions without changing the source-plan list or claiming implementation | 0 |
