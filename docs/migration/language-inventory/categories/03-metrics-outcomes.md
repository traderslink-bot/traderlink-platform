# Category 3: Outcome Metrics

# Category Metadata

| Field | Value |
|---|---|
| Category name | Outcome Metrics |
| Category number | 3 |
| Category slug | metrics-outcomes |
| File name | 03-metrics-outcomes.md |
| Category type | Trade-outcome, realized-day, and realized-sequence metric vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-10 |
| Last updated | 2026-08-10 |
| Dependencies | Category 1 Intents version 1; locked Category 2 profit-and-loss basis and fee boundaries; replacement Journal Analytics Fact Set, capability catalog, metric/query/result contracts, account-scope, date/timezone, and coverage contracts |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** Bounded current Chat reads may use
> mapped outcome language without promoting future or unavailable concepts or
> replacing deterministic population, coverage, and account-scope checks.

**Lead-review state:** After independent Terra review returned a final PASS,
the lead project controller approved and locked Category 3 at Version 1 on
2026-08-10. The category is Complete. Planned and Unavailable capabilities and
the future AI Chat implementation remain documented non-blocking boundaries.

---

# 1. Category Purpose

Category 3 gives the future TraderLink AI Chat language layer stable targets for
questions about how many factually confirmed trades closed, whether their
declared realized outcome was positive, negative, or exactly zero, how often
those outcomes occurred, how realized closing days finished, and how outcomes
ran in sequence. It prevents a request such as “my wins,” “green days,” or
“streak” from silently changing the population, P/L basis, fee coverage, date
attribution, ordering, or denominator.

The category is limited to deterministic Journal evidence. Category 1 supplies
the intent route; Journal Analytics supplies the read-only facts, calculation,
coverage, and limitation state. A later AI Chat interpreter, validator, tool
router, and answer runtime must map language to those deterministic services.
Their absence means this inventory does not claim executable production Chat.

This category does not infer why a trade won or lost, whether a streak shows
skill, discipline, revenge, FOMO, or any other behavior, or what the trader
should do next. It reports evidence and its boundaries only.

---

# 2. Category Boundaries

## Included

This category owns exactly the following outcome-language families:

- counts of eligible realized closed trades and their positive, negative, and
  exactly-zero outcomes;
- factually confirmed legitimate-open position count as a separate lifecycle
  population;
- win, loss, and breakeven/flat rates over an explicitly declared eligible
  realized closed-trade denominator;
- positive, negative, and exactly-zero realized closing-day counts plus the
  percentage of profitable realized days; and
- current/ending consecutive winning and losing sequences, and maximum
  historical winning and losing sequences, over a declared realized outcome
  order.

Every metric must retain its population, gross/net selected outcome basis,
fee-completeness state, zero threshold, account/currency partition, account
IANA timezone where a closing date is used, coverage counts, formula version,
and unavailable/empty/partial state.

## Excluded

The following are referenced but owned elsewhere:

- P/L amounts, gross/net definition, fee facts, and money values: Category 2;
- commissions, fee completeness, charge policy, and fee-impact metrics:
  Category 5, although this category consumes fee completeness when a net
  outcome basis is selected;
- expectancy, profit factor, statistical quality, consistency, and edge:
  Category 4;
- quantity/exposure, duration, and execution metrics: Categories 6–8;
- behavior, motive, rule adherence, setup quality, causation, recommendations,
  and coaching: later behavior/policy categories;
- market marks, candles, catalysts, sessions, and external facts: Category 10
  and their source owners;
- account, currency, ticker, direction, provenance, date, timezone, and other
  dimensions: Categories 11 and 13;
- operators, ranking/comparison grammar, conversation context, slang,
  ambiguity, response preferences, and policy: Categories 12 and 14–19; and
- the AI Chat runtime, persistence, writes, or Journal mutation.

## Cross-Category References

Category 3 references, without redefining:

- Category 1 metric, summary, grouping, comparison, ranking, explanation, and
  diagnosis intents;
- Category 2 selected gross/net realized P/L basis, fee coverage, currency
  partition, and exact money calculation;
- Category 5 charge completeness and source-policy evidence for net outcomes;
- Category 11 account, currency, direction, symbol, and provenance dimensions;
- Category 13 account IANA timezone and closing-date interpretation;
- Category 14 comparison, ranking, and tie-language policy;
- Category 15 selected-query and conversation context;
- Category 16 trader language variants; and
- Category 19 server-authoritative account isolation, privacy, causation, and
  unsupported-request policy.

Category 3 owns outcome meaning. “Flat” and “breakeven” are alternate language
for an exact-zero declared-basis outcome; they must not create an approximate
scratch category or duplicate calculation.

---

# 3. Planning Analysis

The lead accepted planning Sections 1–4 and the exact 17-name controlling
inventory for production. Sections 5–7 remain deliberately deferred; their
production is the next required work.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?**

   It routes outcome/count/rate/day/streak language to one declared
   deterministic population and outcome basis. It distinguishes observed
   lifecycle or population counts from rates derived by division, and current
   sequences from historical maxima.

2. **What canonical concepts belong here?**

   Exactly the 17 ordered names in Section 4. They are controlling even where
   the current capability catalog calls the same deterministic output
   `flat_count`, `flat_rate`, `total_trades`, or a longest/current streak
   identifier.

3. **What related concepts belong elsewhere?**

   Money and fee definitions remain Category 2/5; dimensions and dates remain
   Categories 11/13; interpretation, ranking, comparison, behavior, and
   policy remain with their stated owners. This category reports an outcome; it
   does not explain it.

4. **What data is required?**

   Realized trade outcomes require server-authorized workspace/account scope,
   the applicable currency partition, current active `ready_closed` Stock
   round-trip projections, complete price/value-convention facts, their
   declared gross or net P/L basis, and the closing time. A net outcome also
   requires the applicable fee-complete population and must report partial or
   unavailable coverage where fees are incomplete, unsupported, conflicting,
   or currency-mismatched. Realized-day outcomes additionally require the
   closing trading date in the account IANA timezone. Streaks require the
   deterministic close-time plus stable round-trip-ID order. Open count
   requires current factually confirmed `legitimate_open` projections only.
   Natural language never selects an account scope; the server authorizes it.

5. **Which deterministic tools will answer these requests?**

   The replacement `JournalAnalyticsService`, `JournalAnalyticsFactSet`,
   versioned metric registry, shared population/accumulator, exact
   decimal/rational math, grouped analytics service, and typed
   `journal_analytics_query_v1` / result contract provide the evidence path.
   The future natural-language validator and AI Chat tool router remain
   planned; no Chat request handler is asserted by this inventory.

6. **Which concepts are directly observed?**

   `open_trades` is a count of factually confirmed current `legitimate_open`
   lifecycle projections. `closed_trades` and `trade_count` count eligible
   current projections after deterministic population selection. The underlying
   state, timestamps, account timezone, currency, and fee evidence are
   factual/accepted Journal evidence. A win, loss, flat outcome, rate, day
   outcome, or streak is not directly observed: it depends on a selected P/L
   basis and deterministic derivation.

7. **Which concepts are deterministically derived?**

   Winning, losing, breakeven, and closed eligible outcomes derive from the
   selected P/L basis and exact zero comparison. All rates divide the matching
   numerator by eligible realized closed trades and are unavailable at a zero
   denominator. Green/red/flat days derive by assigning eligible realized P/L
   to closing trading date and comparing each day’s selected-basis total with
   zero. Current and maximum streaks derive from the ordered realized outcome
   sequence; flat trades break a streak.

8. **Which concepts are proxy indicators?**

   None. A win rate, profitable-day percentage, or streak is factual outcome
   evidence, not a proxy for skill, risk, consistency, probability of a future
   result, or causation.

9. **Which concepts are user-labelled?**

   None. An accepted tag, setup, or rule can later filter a population under
   its owning contract, but it neither changes an outcome threshold nor labels
   a trade as a win/loss/flat result here.

10. **Which concepts are not measurable?**

    No listed outcome is estimated. A requested net outcome that lacks
    fee-complete evidence is partial or unavailable as required by the result
    contract; a non-Stock money outcome without a supported value convention is
    unavailable. A `needs_decision` projection is not inferred as closed,
    open, or any outcome. A “scratch” claim without an exact zero threshold is
    not measurable by this category.

11. **Which terms are ambiguous?**

    Lead decision: unqualified “trades” defaults to eligible current
    `ready_closed` round trips, consistent with locked saved-round-trip and
    historical-performance default vocabulary. Clarify it only when wording or
    trusted context materially indicates execution rows (Category 8), current
    factually confirmed open positions, or all coverage candidates.

    “Trades” may mean eligible closed round trips, factually confirmed open
    positions, execution rows (Category 8), or every coverage candidate.
    “Win,” “loss,” “green,” “red,” “flat,” “breakeven,” “scratch,” “rate,” and
    “streak” each require a declared gross/net basis when that basis can change
    the classification. “Streak” additionally requires current/ending versus
    maximum historical meaning. “Days” means realized closing trading days,
    not calendar days with no eligible closed trade, unless a later calendar
    contract explicitly supplies zero-fill semantics.

12. **What defaults are safe?**

    `trade_count` defaults to the same exact eligible current `ready_closed`
    round-trip count as `closed_trades`. They remain separate plan-listed
    language entries but never create duplicate calculations or double
    counting. `open_trades` always means only current factually confirmed
    `legitimate_open` projections. These three counts need no money basis. For
    a direct unqualified win/loss/breakeven count or rate, green/red/flat day,
    profitable-day percentage, or streak request, ask gross versus net first
    when classification can differ and no trusted basis context exists. A
    multi-metric `summarize_performance` request may instead use the locked
    Category 1 summary default: net only with reliable fee coverage, otherwise
    gross with an explicit limitation and stated basis. Ask one field at a
    time.

    Do not silently choose gross versus net when the answer can differ. Use
    exact zero only for `breakeven_trades`, `breakeven_rate`, and `flat_days`;
    do not treat “scratch,” a small result, rounded display value, or an
    approximate threshold as breakeven. Realized metrics use only current
    active `ready_closed` projections. `open_trades` means only current
    `legitimate_open` projections. A valid zero count is an empty/zero result,
    not missing data. Counts may have a clearly labelled cross-currency total;
    any selected-basis money-derived outcome, day, or streak response remains
    within one currency and compatible account-timezone partition.

13. **What conditions require clarification?**

    The accepted `trade_count` default means this question is not needed for
    ordinary unqualified trade-count wording. Clarify population only when
    wording or trusted context materially indicates executions, current open
    positions, or all coverage candidates. For a direct unqualified
    win/loss/breakeven count or rate, green/red/flat day, profitable-day
    percentage, or streak request, ask one focused gross-versus-net question
    when classification can differ and no trusted basis context exists. Do not
    ask that money-basis question for `trade_count`, `closed_trades`, or
    `open_trades`.

    Beyond those accepted rules, ask one focused question when “streak” does
    not identify current versus maximum, when “days” could mean realized
    closing days versus a calendar-filled series, when a requested date period
    lacks a usable account timezone/date boundary, or when comparison/ranking
    language lacks its target. Ask one field at a time rather than combining
    basis, population, date, and streak questions. Do not clarify a
    `needs_decision` row into an invented outcome; return its coverage
    limitation.

14. **What combinations are invalid?**

    Invalid combinations include a realized win/loss/flat count or rate that
    includes `legitimate_open`, `needs_decision`, excluded, superseded, or
    unsupported rows; net classification over fee-incomplete rows without an
    explicit partial/unavailable state; rate division by zero; approximate
    scratch language substituted for exact zero; green/red/flat day results
    that zero-fill open-only or no-trade calendar dates; a streak that mixes
    accounts/currencies/timezones or uses unordered rows; an ending streak
    presented as the historical maximum; cross-account access chosen from
    natural language; and behavior, causation, prediction, or advice inferred
    from any result.

15. **What evaluation coverage proves completion?**

    Later production must cover each controlling concept with canonical,
    formal, conversational, slang, abbreviation, misspelling, noisy,
    singular/plural, question, command, fragment, follow-up, correction,
    comparison, ranking, negation, exclusion, multi-filter, multi-part,
    ambiguity, negative, unsupported-data, selected-context, and applicable
    cross-category cases. Expected structures must assert concept, gross/net
    basis, fee state, population, numerator/denominator where relevant,
    account/currency/timezone partition, date rule, sequence order, coverage,
    and unavailable reason. The approved Version 1 registry and evaluation
    coverage now satisfies this requirement.

## 3.2 Dependencies

- **Earlier inventory:** locked Category 1 Intents version 1 provides routing;
  locked Category 2 provides gross/net, realized, fee, currency, and result
  boundary vocabulary.
- **Journal facts:** current active projection state, round-trip ID, close time,
  allocations, exact P/L basis inputs, fee evidence, currency, account IANA
  timezone, coverage/Data Decision state, and authorized account scope.
- **Deterministic implementation:** replacement fact set, capability/metric
  registry, exact math, population and grouped accumulator, result coverage
  contract, and read-only analytics service.
- **Later language categories:** dimensions, operators, date/time, comparison,
  conversation, slang, ambiguity, response, and policy categories are needed
  before full language coverage is produced.
- **External data:** none for gross realized outcome metrics. No market mark is
  required for these outcomes; market data must not supply a missing realized
  outcome fact.
- **Unsupported dependencies:** production AI Chat interpreter/validator/tool
  router/answer runtime; any unsupported value convention; and a calendar
  zero-fill contract not established by the replacement evidence.

## 3.3 Risks

- **Population confusion:** eligible `ready_closed`, factually confirmed
  `legitimate_open`, and `needs_decision` are distinct. Decisions stay visible
  coverage and cannot be silently classified or used to hide unrelated valid
  results.
- **Observed-versus-derived confusion:** counts describe a declared projection
  population; outcome classification, rates, day outcomes, and streaks are
  derived and must retain their basis and formula.
- **Basis and fee risk:** gross and net thresholds can classify a trade or day
  differently. Net requires fee-complete evidence and must expose partial or
  unavailable coverage rather than borrow gross results.
- **Zero-threshold risk:** display rounding, “scratch,” and approximate
  tolerances must never substitute for exact selected-basis zero.
- **Denominator risk:** rate and profitable-day percentage are unavailable for
  an empty eligible population; zero is valid only when the formula has a
  nonzero denominator and zero numerator.
- **Calendar risk:** closing date uses each account’s IANA timezone. Open-only
  days and calendar no-trade days are not realized zero/flat days without an
  explicit later calendar contract.
- **Sequence risk:** use closing UTC instant plus stable round-trip ID; flat
  results break winning/losing streaks. Current/ending and maximum historical
  streak must never be silently substituted for each other.
- **Isolation/privacy risk:** account scope is server authoritative. Currency
  partitions and incompatible account timezones cannot be silently merged;
  no raw private trade/account identifiers belong in language artifacts.
- **Causation/advice risk:** a result cannot establish behavior, cause,
  discipline, future odds, or a recommendation.
- **Runtime risk:** deterministic replacement support is not production AI Chat
  availability; V3 names, fixtures, and sample data are not evidence.
- **Alias risk:** flat/breakeven and longest/maximum/current/ending language can
  collide. Preserve the 17 plan-listed canonical names while documenting their
  deterministic source mapping. The lead accepted the current mapping.

## 3.4 Repository Evidence

The following privacy-safe documents were inspected read-only. They establish
replacement capabilities and boundaries only; no private statement values,
account identifiers, tokens, or secrets are recorded.

| Repository path | What it proves |
|---|---|
| `docs/migration/traderslink_ai_language_inventory_master.md` | Mandatory category workflow, statuses, delegated boundary, exact Category 3 tracker entry, and controlling-inventory rule. |
| `docs/migration/category_completion_template_example.md` | Required category structure, capability-status vocabulary, deferred deliverables, coverage draft, and approval gate. |
| `docs/migration/language-inventory/categories/01-intents.md` | Locked routing, account-scope, deterministic-evidence, no-invention, and planned-Chat conventions. |
| `docs/migration/language-inventory/categories/02-metrics-profit-loss.md` | Locked gross/net, fee-completeness, realized/open, currency, timezone, denominator, and AI-Chat boundaries inherited here. |
| `docs/migration/traderslink_ai_chatbot_complete_language_plan.md` | Exact ordered 17-item Category 3 list in section 5.2 and validated-query planning context. |
| `docs/migration/analytics-capability-catalog.md` | Supported closed/outcome counts/rates, daily outcome counts, confirmed-open lifecycle, and current/longest streak capability families with their exact boundaries. |
| `docs/migration/phase-4-core-analytics-plan.md` | Accepted `ready_closed`/`legitimate_open`/`needs_decision` population, exact fee, currency, timezone, closing-date, coverage, and ordered-streak contracts. |
| `docs/migration/phase-4-core-analytics-progress.md` | Accepted replacement implementation: outcomes, streaks, open lifecycle, currency/timezone partitions, coverage, and no active Chat runtime. |

Evidence interpretation: each Section 4 `Supported` status means an accepted
replacement deterministic capability or result-coverage path exists under its
declared conditions. It does not mean a production AI Chat runtime currently
recognizes or executes the language.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

`Supported` below means a replacement deterministic metric, grouped result, or
lifecycle coverage path exists. It can still return `empty`, `partial`, or
`unavailable` for the requested facts. A selected-basis outcome must declare
gross or net; net is fee-conditional. The status does not claim an active AI
Chat language/runtime path.

The accepted planning default routes unqualified `trade_count` to the same
eligible current `ready_closed` population as `closed_trades`; it is a separate
plan-listed language entry, never a second calculation. `open_trades` remains
only the `legitimate_open` count. Direct unqualified outcome/day/streak requests
clarify gross versus net when classification can differ and trusted basis
context is absent. A multi-metric `summarize_performance` request may use the
locked Category 1 net-with-reliable-fees, otherwise-gross-with-explicit-
limitation summary default.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Evidence classification | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|---|
| 1 | C3-OUT-001 | trade_count | Trade count | realized activity | directly observed and deterministically derived | Supported | Defaults to the same exact eligible current `ready_closed` round-trip count as `closed_trades`; a separate plan-listed language entry only. Clarify only when wording/context materially indicates executions, current open positions, or all coverage candidates. |
| 2 | C3-OUT-002 | winning_trades | Winning trades | realized outcome count | deterministically derived | Supported | Count of eligible `ready_closed` round trips whose declared gross or fee-complete net P/L is strictly greater than exact zero. |
| 3 | C3-OUT-003 | losing_trades | Losing trades | realized outcome count | deterministically derived | Supported | Count of eligible `ready_closed` round trips whose declared gross or fee-complete net P/L is strictly less than exact zero. |
| 4 | C3-OUT-004 | breakeven_trades | Breakeven trades | realized outcome count | deterministically derived | Supported | Current `flat_count` outcome path: eligible `ready_closed` round trips whose declared basis equals exact zero; “scratch” is not an approximate substitute. |
| 5 | C3-OUT-005 | open_trades | Open trades | lifecycle count | directly observed | Supported | Current `legitimate_open` projection count only; `needs_decision` rows are separate coverage and never inferred as open. |
| 6 | C3-OUT-006 | closed_trades | Closed trades | realized activity | directly observed and deterministically derived | Supported | Count of eligible current `ready_closed` round trips; each has zero final position, a close time, complete price facts, and no pending chain decision. |
| 7 | C3-OUT-007 | win_rate | Win rate | realized outcome rate | deterministically derived | Supported | `winning_trades` divided by eligible closed-trade count on the same declared basis; unavailable when the denominator is zero. |
| 8 | C3-OUT-008 | loss_rate | Loss rate | realized outcome rate | deterministically derived | Supported | `losing_trades` divided by eligible closed-trade count on the same declared basis; unavailable when the denominator is zero. |
| 9 | C3-OUT-009 | breakeven_rate | Breakeven rate | realized outcome rate | deterministically derived | Supported | Current `flat_rate` outcome path: exact-zero/breakeven count divided by eligible closed-trade count on the same declared basis; unavailable when the denominator is zero. |
| 10 | C3-OUT-010 | green_days | Green days | realized closing-day outcome | deterministically derived | Supported | Count of closing trading dates whose eligible selected-basis realized P/L total is strictly positive, using account IANA timezone; open-only/no-trade dates are not zero-filled. |
| 11 | C3-OUT-011 | red_days | Red days | realized closing-day outcome | deterministically derived | Supported | Count of closing trading dates whose eligible selected-basis realized P/L total is strictly negative, using account IANA timezone; open-only/no-trade dates are not zero-filled. |
| 12 | C3-OUT-012 | flat_days | Flat days | realized closing-day outcome | deterministically derived | Supported | Count of closing trading dates whose eligible selected-basis realized P/L total equals exact zero, using account IANA timezone; not an approximate scratch-day measure. |
| 13 | C3-OUT-013 | percentage_of_profitable_days | Percentage of profitable days | realized closing-day rate | deterministically derived | Supported | `green_days` divided by the count of eligible realized closing trading dates on the same declared basis; unavailable when no eligible realized day exists. |
| 14 | C3-OUT-014 | consecutive_wins | Consecutive wins | current realized sequence | deterministically derived | Supported | Current/ending run of positive eligible realized outcomes in deterministic close-time plus stable round-trip-ID order; a flat outcome breaks the run. |
| 15 | C3-OUT-015 | consecutive_losses | Consecutive losses | current realized sequence | deterministically derived | Supported | Current/ending run of negative eligible realized outcomes in deterministic close-time plus stable round-trip-ID order; a flat outcome breaks the run. |
| 16 | C3-OUT-016 | maximum_win_streak | Maximum win streak | historical realized sequence | deterministically derived | Supported | Current `longest_winning_trade_streak` path: greatest positive-outcome run across the declared ordered eligible population; flat outcomes break a run. |
| 17 | C3-OUT-017 | maximum_loss_streak | Maximum loss streak | historical realized sequence | deterministically derived | Supported | Current `longest_losing_trade_streak` path: greatest negative-outcome run across the declared ordered eligible population; flat outcomes break a run. |

## Proposed Inventory Additions

None proposed. The controlling list is exactly the 17 section-5.2 names. The
current replacement contains adjacent capabilities, but none is added without
lead approval.

## Proposed Removals or Merges

None proposed. The following are explicit lead-review mapping notes, not
renames or silent merges:

| Controlling name | Existing deterministic term/path | Boundary that must remain explicit |
|---|---|---|
| `trade_count` / `closed_trades` | `total_trades` / closed-trade count | `trade_count` defaults to the same eligible current `ready_closed` population as `closed_trades`. They remain separate plan-listed language entries but never create duplicate calculations or double counting. Clarify only for materially indicated executions, current open positions, or all coverage candidates. |
| `breakeven_trades` / `breakeven_rate` | `flat_count` / `flat_rate` | Both use exact selected-basis zero. “Breakeven” and “flat” are language variants, not a tolerance, approximation, or duplicate calculation. |
| `green_days`, `red_days`, `flat_days` | profitable/losing/flat trading-day paths | Day outcome is assigned by closing trading date in account IANA timezone and is not a calendar zero-fill. |
| `consecutive_wins` / `maximum_win_streak` | current / longest winning streak | Current/ending run and maximum historical run are distinct outputs; deterministic close-time plus stable-ID order and flat-break behavior apply. |
| `consecutive_losses` / `maximum_loss_streak` | current / longest losing streak | Current/ending run and maximum historical run are distinct outputs; deterministic close-time plus stable-ID order and flat-break behavior apply. |

---

# 5. Canonical Inventory Deliverable

Version 1 contains the approved and locked canonical records for all
C3-OUT-001 through C3-OUT-017. Sections 6–7 are populated,
production-complete, independently reviewed, and approved at Version 1.

## Section 5 Shared Query and Result Contract

The following contract applies to every Section 5 record unless its record says
otherwise. It makes the common conditions explicit without creating duplicate
calculations for one Journal population.

References below to the earlier “Batch 1 shared contract” mean this same
Section 5 Shared Query and Result Contract.

- **Current evidence and status:** `Supported` means the replacement's
  deterministic Journal Analytics fact set, versioned registry, shared
  population/accumulator, exact math, and result contract provide the stated
  capability. It does not mean an AI Chat language interpreter, validator,
  tool router, or answer runtime exists.
- **Authorized scope and partitions:** account scope comes only from the
  server-authorized `WorkspaceAccessScope`; natural language cannot select
  another account. One response uses one trade-currency partition. Calendar or
  timing grouping combines accounts only when their IANA trading timezones are
  compatible; otherwise it returns separate partitions.
- **Basis-free count exception:** `trade_count`, `closed_trades`, and
  `open_trades` are basis-free counts and may return a clearly labeled
  cross-currency total when the authorized population contract permits. That
  total must not be presented as a money, selected-basis outcome, rate, day, or
  streak result; those remain in one declared currency and timezone-compatible
  partition.
- **Realized population:** realized records use only current active
  `ready_closed` Stock round-trip projections with the required value facts.
  `legitimate_open`, `needs_decision`, excluded, superseded, and unsupported
  rows never enter a realized count or rate denominator and remain visible in
  coverage. `needs_decision` is never inferred as open, closed, winning,
  losing, or breakeven.
- **Basis and fees:** `trade_count`, `closed_trades`, and `open_trades` need no
  P/L basis. A win/loss/breakeven count or rate uses one explicitly selected
  gross basis or fee-complete net basis. Gross retains the eligible realized
  population. A net result uses fee-complete rows and reports `partial` when
  gross-eligible rows are fee-incomplete; it is `unavailable` when a required
  net basis cannot be established. It never substitutes gross for net.
- **Rate population identity:** every outcome rate uses identical numerator and
  denominator selected-basis populations: gross uses all gross-eligible
  `ready_closed` rows; net uses only fee-complete net-eligible `ready_closed`
  rows. Fee-incomplete net rows remain coverage only and never enter either
  side of a net rate.
- **Closing-day basis completeness:** build each green/red/flat day from its
  complete selected-basis closing-date bucket: gross uses every gross-eligible
  row; net classifies a date only when all of that date's eligible rows have
  fee-complete net P/L. A date with incomplete or unsupported selected-basis
  evidence is not classified and remains explicit coverage. The
  profitable-day denominator contains only classified selected-basis closing
  dates.
- **Sequence barriers:** a row with unavailable, unknown, or non-classifiable
  selected-basis outcome is a sequence barrier. It is neither positive,
  negative, nor exact-zero, and no winning or losing streak may bridge across
  it. Flat outcomes also break both streak types.
- **Filters, groupings, and operators:** valid filters/groupings are only the
  server-validated `journal_analytics_query_v1` allowlist, including authorized
  account scope, currency, inclusive closing-date range, stable symbol,
  direction, provenance, and realized outcome where applicable; total and the
  accepted closing day/week/month/year, weekday, entry-time, symbol, direction,
  account, provenance, and realized-outcome groupings must reconcile exactly to
  the same filtered population. Operators are only that contract's validated
  allowlist; unknown fields, operators, metric IDs, groupings, timezones, and
  currencies fail closed. Categories 11–14 own the grammar, not these records.
- **Compatible intents:** Category 1's `calculate_metric`,
  `summarize_performance`, `group_and_aggregate`, `compare_groups`,
  `rank_results`, `explain_result`, and `diagnose_performance`, subject to
  their separate intent and policy contracts. No compatible intent authorizes a
  Journal write.
- **Incompatible requests:** do not include an open/decision row in a realized
  population; do not mix gross and fee-incomplete net outcomes; do not cross
  account/currency/timezone partitions without their declared contract; and do
  not infer behavior, causation, skill, prediction, recommendation, or advice.
- **Coverage and sample:** every answer carries candidate, included,
  ready-closed, legitimate-open, needs-decision, excluded, unsupported,
  fee-complete, fee-incomplete, and unavailable counts/reasons as applicable,
  with `complete`, `partial`, `empty`, or `unavailable` state. A valid zero is
  not missing. Counts and rates must state their eligible denominator; small
  samples and period/group comparisons require the count and no certainty
  claim.

## `trade_count`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-001 |
| Category | Outcome Metrics |
| Subcategory | realized activity |
| Canonical name | trade_count |
| Display name | Trade count |
| Exact definition | Count of eligible current `ready_closed` round trips in the authorized, filtered population. |
| Distinction from related concepts | Defaults to the exact same closed-population count as `closed_trades`; it is a separate plan-listed language entry, not a second calculation. It is not execution count, open-position count, or all coverage candidates. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Supported |
| Result units | count of round trips |
| Open-trade support | No; `legitimate_open` is excluded and reported in coverage. |
| Fee handling | No P/L basis or fee completeness is required. |
| Version | 1 |

### Related Concepts

- Broader concept: realized activity.
- Narrower concepts: winning_trades, losing_trades, breakeven_trades.
- Commonly confused concepts: closed_trades, open_trades, execution count.
- Must not be merged with: closed_trades; they share one calculation but remain
  separate plan-listed language entries.

### Formula and Interpretation Contract

- **Exact formula:** `count(current eligible ready_closed round trips after the
  validated filters)`.
- **Default:** unqualified `trade_count` routes to this formula. Clarify only
  when wording or trusted context materially indicates execution rows, current
  open positions, or all coverage candidates.
- **Unsupported conditions:** an unauthorized account selection, unknown
  query field/operator, or unsupported value-convention population fails
  closed; no V3, fixture, or inferred substitute is used.
- **Tool target:** `JournalAnalyticsService` through the versioned registry and
  `journal_analytics_query_v1` / result contract, under the Batch 1 shared
  contract.

## `winning_trades`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-002 |
| Category | Outcome Metrics |
| Subcategory | realized outcome count |
| Canonical name | winning_trades |
| Display name | Winning trades |
| Exact definition | Count of eligible current `ready_closed` round trips whose explicitly selected gross or fee-complete net P/L is strictly greater than exact zero. |
| Distinction from related concepts | A positive trade outcome, not gross profit, green day, win rate, behavior, or advice. Gross and net can classify the same trade differently. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of round trips |
| Open-trade support | No; open and decision rows are coverage only. |
| Fee handling | Gross needs no fee facts. Net is fee-complete only and follows the Batch 1 partial/unavailable coverage policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome count.
- Narrower concepts: none.
- Commonly confused concepts: green_days, gross_profit, win_rate,
  consecutive_wins.
- Must not be merged with: losing_trades or breakeven_trades.

### Formula and Interpretation Contract

- **Exact formula:** `count(eligible ready_closed round trips where
  selected_basis_pnl > 0)`.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. A multi-metric `summarize_performance` request may use net
  only with reliable fee coverage, otherwise gross with an explicit limitation
  and stated basis.
- **Unsupported conditions:** no chosen/established basis, incomplete required
  net fee coverage, unauthorized scope, or unknown contract field/operator
  produces clarification, partial, unavailable, or fail-closed behavior as
  applicable; do not infer a winner from an open or decision row.
- **Tool target:** the shared Journal Analytics population/accumulator and
  outcome count/rate registry path under the Batch 1 shared contract.

## `losing_trades`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-003 |
| Category | Outcome Metrics |
| Subcategory | realized outcome count |
| Canonical name | losing_trades |
| Display name | Losing trades |
| Exact definition | Count of eligible current `ready_closed` round trips whose explicitly selected gross or fee-complete net P/L is strictly less than exact zero. |
| Distinction from related concepts | A negative trade outcome, not gross loss, red day, loss rate, motive, or recommendation. Gross and net can classify the same trade differently. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of round trips |
| Open-trade support | No; open and decision rows are coverage only. |
| Fee handling | Gross needs no fee facts. Net is fee-complete only and follows the Batch 1 partial/unavailable coverage policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome count.
- Narrower concepts: none.
- Commonly confused concepts: red_days, gross_loss, loss_rate,
  consecutive_losses.
- Must not be merged with: winning_trades or breakeven_trades.

### Formula and Interpretation Contract

- **Exact formula:** `count(eligible ready_closed round trips where
  selected_basis_pnl < 0)`.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. A multi-metric `summarize_performance` request follows the
  accepted summary basis default in the Batch 1 shared contract.
- **Unsupported conditions:** no chosen/established basis, incomplete required
  net fee coverage, unauthorized scope, or unknown contract field/operator
  produces clarification, partial, unavailable, or fail-closed behavior as
  applicable; no open or decision row becomes a loss.
- **Tool target:** the shared Journal Analytics population/accumulator and
  outcome count/rate registry path under the Batch 1 shared contract.

## `breakeven_trades`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-004 |
| Category | Outcome Metrics |
| Subcategory | realized outcome count |
| Canonical name | breakeven_trades |
| Display name | Breakeven trades |
| Exact definition | Count of eligible current `ready_closed` round trips whose explicitly selected gross or fee-complete net P/L equals exact zero. |
| Distinction from related concepts | The existing deterministic path calls this `flat_count`. “Breakeven” and “flat” are language variants; “scratch,” rounded display zero, or a small approximate result is not this metric. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of round trips |
| Open-trade support | No; open and decision rows are coverage only. |
| Fee handling | Gross needs no fee facts. Net is fee-complete only and follows the Batch 1 partial/unavailable coverage policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome count.
- Narrower concepts: none.
- Commonly confused concepts: flat_days, breakeven_rate, scratch language,
  winning_trades, losing_trades.
- Must not be merged with: breakeven_rate or flat_days.

### Formula and Interpretation Contract

- **Exact formula:** `count(eligible ready_closed round trips where
  selected_basis_pnl = 0)`; compare exact declared-basis values, never rounded
  display values.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. Do not add a tolerance or interpret “scratch” as exact zero.
- **Unsupported conditions:** no chosen/established basis, incomplete required
  net fee coverage, approximate zero threshold, unauthorized scope, or unknown
  contract field/operator produces clarification, partial, unavailable, or
  fail-closed behavior as applicable.
- **Tool target:** the shared Journal Analytics population/accumulator and
  outcome count/rate registry path under the Batch 1 shared contract.

## `open_trades`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-005 |
| Category | Outcome Metrics |
| Subcategory | lifecycle count |
| Canonical name | open_trades |
| Display name | Open trades |
| Exact definition | Count of current factually confirmed `legitimate_open` round-trip projections in the server-authorized, filtered population. |
| Distinction from related concepts | This is a lifecycle count, not an unrealized P/L result, a ready-closed count, a pending decision count, or a broker tax-lot claim. |
| Evidence classification | directly observed |
| Capability status | Supported |
| Result units | count of current open position lifecycles |
| Open-trade support | Yes; this metric is the `legitimate_open` population only. |
| Fee handling | No P/L basis or fee completeness is required. |
| Version | 1 |

### Related Concepts

- Broader concept: position lifecycle coverage.
- Narrower concepts: none.
- Commonly confused concepts: trade_count, closed_trades, needs-decision count,
  unrealized_pnl.
- Must not be merged with: a nonzero `needs_decision` projection or any realized
  outcome count.

### Formula and Interpretation Contract

- **Exact formula:** `count(current factually confirmed legitimate_open
  projections after the validated filters)`.
- **Default:** `open_trades` has no gross/net basis and never selects an account
  from natural language. It excludes `needs_decision` even if final quantity is
  nonzero.
- **Clarification:** ask only when wording/context could instead mean execution
  rows, eligible closed trades, or all coverage candidates; otherwise use the
  explicit open lifecycle population.
- **Unsupported conditions:** missing authoritative lifecycle state,
  unauthorized scope, or unknown contract field/operator fails closed; do not
  estimate a position from an incomplete chain or a market mark.
- **Tool target:** `JournalAnalyticsService` legitimate-open lifecycle coverage
  path under the Batch 1 shared contract.

## `closed_trades`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-006 |
| Category | Outcome Metrics |
| Subcategory | realized activity |
| Canonical name | closed_trades |
| Display name | Closed trades |
| Exact definition | Count of eligible current `ready_closed` round trips in the authorized, filtered population. Each has zero final position, a close time, complete price facts, and no pending chain decision. |
| Distinction from related concepts | The same exact population and calculation as `trade_count`; it remains a separate plan-listed language entry. It is not execution count, `legitimate_open`, or `needs_decision`. |
| Evidence classification | directly observed and deterministically derived |
| Capability status | Supported |
| Result units | count of round trips |
| Open-trade support | No; `legitimate_open` is excluded and reported in coverage. |
| Fee handling | No P/L basis or fee completeness is required. |
| Version | 1 |

### Related Concepts

- Broader concept: realized activity.
- Narrower concepts: winning_trades, losing_trades, breakeven_trades.
- Commonly confused concepts: trade_count, open_trades, execution count.
- Must not be merged with: trade_count; the shared calculation must not create
  duplicate counts or double counting.

### Formula and Interpretation Contract

- **Exact formula:** `count(current eligible ready_closed round trips after the
  validated filters)`, exactly the `trade_count` formula.
- **Default:** no P/L basis is required. The name explicitly selects the
  eligible closed population; no open or decision row enters it.
- **Clarification:** ask only if the user’s wording/context materially changes
  the requested subject to executions, current open positions, or all coverage
  candidates.
- **Unsupported conditions:** an unauthorized account selection, unknown
  query field/operator, or unsupported value-convention population fails
  closed; no V3, fixture, or inferred substitute is used.
- **Tool target:** `JournalAnalyticsService` through the versioned registry and
  `journal_analytics_query_v1` / result contract, under the Batch 1 shared
  contract.

## `win_rate`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-007 |
| Category | Outcome Metrics |
| Subcategory | realized outcome rate |
| Canonical name | win_rate |
| Display name | Win rate |
| Exact definition | Percentage of eligible current `ready_closed` round trips with explicitly selected gross or fee-complete net P/L strictly greater than exact zero. |
| Distinction from related concepts | It is a derived rate, not an observed count, profitable-day percentage, expectancy, prediction, or measure of skill. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | exact ratio with rounded display percentage metadata |
| Open-trade support | No; open and decision rows are excluded from numerator and denominator and remain coverage only. |
| Fee handling | Gross needs no fee facts. Net is fee-complete only and follows the Batch 1 partial/unavailable coverage policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome rate.
- Narrower concepts: none.
- Commonly confused concepts: winning_trades, loss_rate, breakeven_rate,
  percentage_of_profitable_days.
- Must not be merged with: profitable-day percentage or a future probability.

### Formula and Interpretation Contract

- **Exact formula:** `count(selected_basis_eligible_ready_closed where
  selected_basis_pnl > 0) / count(selected_basis_eligible_ready_closed)`;
  preserve numerator and denominator exactly and round only for display.
- **Empty and coverage behavior:** denominator zero is `unavailable`, never
  zero. A zero numerator with a nonzero denominator is a valid 0% result.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. A multi-metric `summarize_performance` request follows the
  accepted summary basis default in the Batch 1 shared contract.
- **Unsupported conditions:** no chosen/established basis, incomplete required
  net fee coverage, zero denominator, unauthorized scope, or unknown contract
  field/operator produces clarification, partial, unavailable, or fail-closed
  behavior as applicable.
- **Tool target:** the shared Journal Analytics population/accumulator and
  outcome count/rate registry path under the Batch 1 shared contract.

## `loss_rate`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-008 |
| Category | Outcome Metrics |
| Subcategory | realized outcome rate |
| Canonical name | loss_rate |
| Display name | Loss rate |
| Exact definition | Percentage of eligible current `ready_closed` round trips with explicitly selected gross or fee-complete net P/L strictly less than exact zero. |
| Distinction from related concepts | It is a derived rate, not an observed count, red-day percentage, a causal explanation, or a recommendation. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | exact ratio with rounded display percentage metadata |
| Open-trade support | No; open and decision rows are excluded from numerator and denominator and remain coverage only. |
| Fee handling | Gross needs no fee facts. Net is fee-complete only and follows the Batch 1 partial/unavailable coverage policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome rate.
- Narrower concepts: none.
- Commonly confused concepts: losing_trades, win_rate, breakeven_rate,
  percentage_of_profitable_days.
- Must not be merged with: win_rate or a future probability.

### Formula and Interpretation Contract

- **Exact formula:** `count(selected_basis_eligible_ready_closed where
  selected_basis_pnl < 0) / count(selected_basis_eligible_ready_closed)`;
  preserve numerator and denominator exactly and round only for display.
- **Empty and coverage behavior:** denominator zero is `unavailable`, never
  zero. A zero numerator with a nonzero denominator is a valid 0% result.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. A multi-metric `summarize_performance` request follows the
  accepted summary basis default in the Batch 1 shared contract.
- **Unsupported conditions:** no chosen/established basis, incomplete required
  net fee coverage, zero denominator, unauthorized scope, or unknown contract
  field/operator produces clarification, partial, unavailable, or fail-closed
  behavior as applicable.
- **Tool target:** the shared Journal Analytics population/accumulator and
  outcome count/rate registry path under the Batch 1 shared contract.

## `breakeven_rate`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-009 |
| Category | Outcome Metrics |
| Subcategory | realized outcome rate |
| Canonical name | breakeven_rate |
| Display name | Breakeven rate |
| Exact definition | Percentage of eligible current `ready_closed` round trips with explicitly selected gross or fee-complete net P/L equal to exact zero. |
| Distinction from related concepts | The current deterministic path calls this `flat_rate`. It is not `breakeven_win_rate`, an approximate scratch rate, a flat-day rate, or a future probability. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | exact ratio with rounded display percentage metadata |
| Open-trade support | No; open and decision rows are excluded from numerator and denominator and remain coverage only. |
| Fee handling | Gross needs no fee facts. Net is fee-complete only and follows the Batch 1 partial/unavailable coverage policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome rate.
- Narrower concepts: none.
- Commonly confused concepts: breakeven_trades, flat_days, breakeven_win_rate,
  win_rate, loss_rate.
- Must not be merged with: breakeven_win_rate, a Category 4/edge measure, or
  an approximate scratch rate.

### Formula and Interpretation Contract

- **Exact formula:** `count(selected_basis_eligible_ready_closed where
  selected_basis_pnl = 0) / count(selected_basis_eligible_ready_closed)`;
  compare exact declared-basis values, retain numerator/denominator, and round
  only for display.
- **Empty and coverage behavior:** denominator zero is `unavailable`, never
  zero. A zero numerator with a nonzero denominator is a valid 0% result.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. Do not treat “scratch” or rounded display zero as breakeven.
- **Unsupported conditions:** no chosen/established basis, incomplete required
  net fee coverage, zero denominator, approximate threshold, unauthorized
  scope, or unknown contract field/operator produces clarification, partial,
  unavailable, or fail-closed behavior as applicable.
- **Tool target:** the shared Journal Analytics population/accumulator and
  outcome count/rate registry path under the Batch 1 shared contract.

## `green_days`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-010 |
| Category | Outcome Metrics |
| Subcategory | realized closing-day outcome |
| Canonical name | green_days |
| Display name | Green days |
| Exact definition | Count of eligible realized closing-date buckets whose selected gross or fee-complete net P/L total is strictly greater than exact zero. |
| Distinction from related concepts | A realized closing-day count, not winning_trades, a calendar activity count, a zero-filled calendar day, gross profit, or advice. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of realized closing trading dates |
| Open-trade support | No; open-only and no-trade days are excluded, never zero-filled. |
| Fee handling | Gross needs no fee facts. Net uses fee-complete rows and follows the Section 5 shared partial/unavailable policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized closing-day outcome.
- Narrower concepts: none.
- Commonly confused concepts: winning_trades, red_days, flat_days,
  percentage_of_profitable_days.
- Must not be merged with: a calendar day containing only an open position or
  no eligible closed trade.

### Formula and Interpretation Contract

- **Exact formula:** assign each complete selected-basis eligible
  `ready_closed` P/L to its account-IANA closing trading date; then
  `count(complete selected-basis closing_date buckets where
  sum(selected_basis_pnl) > 0)`.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. Do not ask multiple fields at once. A multi-metric
  `summarize_performance` request follows the accepted Section 5 summary-basis
  default.
- **Empty and coverage behavior:** no eligible realized closing date returns a
  zero count only with explicit `empty` state where the deterministic result
  contract permits; it is not a calendar-filled flat day. Coverage retains open
  and decision populations separately.
- **Unsupported conditions:** missing/unsupported selected basis, incomplete
  required net fee coverage, incompatible currency/timezone partition,
  unauthorized scope, or unknown contract field/operator produces
  clarification, partial, unavailable, or fail-closed behavior as applicable.
- **Tool target:** shared Journal Analytics population/accumulator and
  closing-day grouping path under the Section 5 shared contract.

## `red_days`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-011 |
| Category | Outcome Metrics |
| Subcategory | realized closing-day outcome |
| Canonical name | red_days |
| Display name | Red days |
| Exact definition | Count of eligible realized closing-date buckets whose selected gross or fee-complete net P/L total is strictly less than exact zero. |
| Distinction from related concepts | A realized closing-day count, not losing_trades, a calendar activity count, a zero-filled calendar day, gross loss, or a causal explanation. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of realized closing trading dates |
| Open-trade support | No; open-only and no-trade days are excluded, never zero-filled. |
| Fee handling | Gross needs no fee facts. Net uses fee-complete rows and follows the Section 5 shared partial/unavailable policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized closing-day outcome.
- Narrower concepts: none.
- Commonly confused concepts: losing_trades, green_days, flat_days,
  percentage_of_profitable_days.
- Must not be merged with: a calendar day containing only an open position or
  no eligible closed trade.

### Formula and Interpretation Contract

- **Exact formula:** assign each complete selected-basis eligible
  `ready_closed` P/L to its account-IANA closing trading date; then
  `count(complete selected-basis closing_date buckets where
  sum(selected_basis_pnl) < 0)`.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. Do not ask multiple fields at once. A multi-metric
  `summarize_performance` request follows the accepted Section 5 summary-basis
  default.
- **Empty and coverage behavior:** no eligible realized closing date returns a
  zero count only with explicit `empty` state where the deterministic result
  contract permits; it is not a calendar-filled flat day. Coverage retains open
  and decision populations separately.
- **Unsupported conditions:** missing/unsupported selected basis, incomplete
  required net fee coverage, incompatible currency/timezone partition,
  unauthorized scope, or unknown contract field/operator produces
  clarification, partial, unavailable, or fail-closed behavior as applicable.
- **Tool target:** shared Journal Analytics population/accumulator and
  closing-day grouping path under the Section 5 shared contract.

## `flat_days`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-012 |
| Category | Outcome Metrics |
| Subcategory | realized closing-day outcome |
| Canonical name | flat_days |
| Display name | Flat days |
| Exact definition | Count of eligible realized closing-date buckets whose selected gross or fee-complete net P/L total equals exact zero. |
| Distinction from related concepts | A realized closing-day exact-zero count, not breakeven_trades, a zero-filled calendar day, an approximate scratch day, or rounded-display zero. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of realized closing trading dates |
| Open-trade support | No; open-only and no-trade days are excluded, never zero-filled. |
| Fee handling | Gross needs no fee facts. Net uses fee-complete rows and follows the Section 5 shared partial/unavailable policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized closing-day outcome.
- Narrower concepts: none.
- Commonly confused concepts: breakeven_trades, green_days, red_days, scratch
  language.
- Must not be merged with: an approximate scratch day or a calendar day without
  an eligible realized closing-date bucket.

### Formula and Interpretation Contract

- **Exact formula:** assign each complete selected-basis eligible
  `ready_closed` P/L to its account-IANA closing trading date; then
  `count(complete selected-basis closing_date buckets where
  sum(selected_basis_pnl) = 0)`. Comparison is exact and never uses rounded
  display values or a tolerance.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. Do not treat “scratch” as exact zero. A multi-metric
  `summarize_performance` request follows the accepted Section 5 summary-basis
  default.
- **Empty and coverage behavior:** no eligible realized closing date returns a
  zero count only with explicit `empty` state where the deterministic result
  contract permits; it does not generate flat days from no-trade/open-only
  dates. Coverage retains open and decision populations separately.
- **Unsupported conditions:** missing/unsupported selected basis, incomplete
  required net fee coverage, approximate threshold, incompatible
  currency/timezone partition, unauthorized scope, or unknown contract
  field/operator produces clarification, partial, unavailable, or fail-closed
  behavior as applicable.
- **Tool target:** shared Journal Analytics population/accumulator and
  closing-day grouping path under the Section 5 shared contract.

## `percentage_of_profitable_days`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-013 |
| Category | Outcome Metrics |
| Subcategory | realized closing-day rate |
| Canonical name | percentage_of_profitable_days |
| Display name | Percentage of profitable days |
| Exact definition | Percentage of eligible realized closing trading dates whose selected gross or fee-complete net P/L total is strictly greater than exact zero. |
| Distinction from related concepts | A day-level derived rate, not win_rate, green_days, a percentage of all calendar days, or a prediction. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | exact ratio with rounded display percentage metadata |
| Open-trade support | No; open-only and no-trade days are excluded from numerator and denominator. |
| Fee handling | Gross needs no fee facts. Net uses fee-complete rows and follows the Section 5 shared partial/unavailable policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized closing-day rate.
- Narrower concepts: none.
- Commonly confused concepts: green_days, win_rate, loss_rate, flat_days.
- Must not be merged with: win_rate or a calendar occupancy/activity rate.

### Formula and Interpretation Contract

- **Exact formula:** `count(complete selected-basis eligible realized closing
  dates where sum(selected_basis_pnl) > 0) / count(complete selected-basis
  eligible realized closing dates)` after account-IANA closing-date assignment;
  preserve numerator/denominator exactly and round only for display.
- **Default and clarification:** direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists. A multi-metric `summarize_performance` request follows the
  accepted Section 5 summary-basis default.
- **Empty and coverage behavior:** a zero realized-day denominator is
  `unavailable`, never zero. A zero green-day numerator with a nonzero eligible
  realized-day denominator is a valid 0% result. Open-only/no-trade dates do
  not enter either side of the ratio.
- **Unsupported conditions:** missing/unsupported selected basis, incomplete
  required net fee coverage, zero denominator, incompatible currency/timezone
  partition, unauthorized scope, or unknown contract field/operator produces
  clarification, partial, unavailable, or fail-closed behavior as applicable.
- **Tool target:** shared Journal Analytics population/accumulator and
  closing-day grouping path under the Section 5 shared contract.

## `consecutive_wins`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-014 |
| Category | Outcome Metrics |
| Subcategory | current realized sequence |
| Canonical name | consecutive_wins |
| Display name | Consecutive wins |
| Exact definition | Length of the current/ending contiguous positive-outcome run at the end of the ordered eligible current `ready_closed` population on an explicitly selected gross or fee-complete net basis. |
| Distinction from related concepts | Current/ending sequence only, not maximum_win_streak, a count of all winning trades, a day streak, or evidence of skill/cause. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of consecutive round trips |
| Open-trade support | No; open and decision rows do not enter the realized sequence. |
| Fee handling | Gross needs no fee facts. Net uses fee-complete rows and follows the Section 5 shared partial/unavailable policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome sequence.
- Narrower concepts: none.
- Commonly confused concepts: maximum_win_streak, winning_trades,
  consecutive_losses, green_days.
- Must not be merged with: maximum_win_streak or a calendar-day sequence.

### Formula and Interpretation Contract

- **Exact formula:** order eligible current `ready_closed` round trips by close
  UTC instant, then stable round-trip ID; return the length of the terminal
  contiguous suffix where `selected_basis_pnl > 0`. A negative, exact-zero, or
  unknown/non-classifiable selected-basis outcome barrier breaks the run.
- **Default and clarification:** “consecutive wins” means this current/ending
  run at the population boundary. Direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists; ask a separate current-versus-maximum question only when
  wording says merely “streak.”
- **Empty and coverage behavior:** an empty eligible population yields zero
  count with explicit `empty` state where the deterministic result contract
  permits. It never establishes a behavioral, causal, predictive, or advisory
  conclusion.
- **Unsupported conditions:** missing/unsupported selected basis, incomplete
  required net fee coverage, incompatible currency/timezone partition,
  unauthorized scope, or unknown contract field/operator produces
  clarification, partial, unavailable, or fail-closed behavior as applicable.
- **Tool target:** shared Journal Analytics ordered realized-sequence/streak
  path under the Section 5 shared contract.

## `consecutive_losses`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-015 |
| Category | Outcome Metrics |
| Subcategory | current realized sequence |
| Canonical name | consecutive_losses |
| Display name | Consecutive losses |
| Exact definition | Length of the current/ending contiguous negative-outcome run at the end of the ordered eligible current `ready_closed` population on an explicitly selected gross or fee-complete net basis. |
| Distinction from related concepts | Current/ending sequence only, not maximum_loss_streak, a count of all losing trades, a day streak, or evidence of behavior/cause. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of consecutive round trips |
| Open-trade support | No; open and decision rows do not enter the realized sequence. |
| Fee handling | Gross needs no fee facts. Net uses fee-complete rows and follows the Section 5 shared partial/unavailable policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome sequence.
- Narrower concepts: none.
- Commonly confused concepts: maximum_loss_streak, losing_trades,
  consecutive_wins, red_days.
- Must not be merged with: maximum_loss_streak or a calendar-day sequence.

### Formula and Interpretation Contract

- **Exact formula:** order eligible current `ready_closed` round trips by close
  UTC instant, then stable round-trip ID; return the length of the terminal
  contiguous suffix where `selected_basis_pnl < 0`. A positive, exact-zero, or
  unknown/non-classifiable selected-basis outcome barrier breaks the run.
- **Default and clarification:** “consecutive losses” means this current/ending
  run at the population boundary. Direct unqualified requests ask one focused
  gross-versus-net question when classification can differ and no trusted basis
  context exists; ask a separate current-versus-maximum question only when
  wording says merely “streak.”
- **Empty and coverage behavior:** an empty eligible population yields zero
  count with explicit `empty` state where the deterministic result contract
  permits. It never establishes a behavioral, causal, predictive, or advisory
  conclusion.
- **Unsupported conditions:** missing/unsupported selected basis, incomplete
  required net fee coverage, incompatible currency/timezone partition,
  unauthorized scope, or unknown contract field/operator produces
  clarification, partial, unavailable, or fail-closed behavior as applicable.
- **Tool target:** shared Journal Analytics ordered realized-sequence/streak
  path under the Section 5 shared contract.

## `maximum_win_streak`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-016 |
| Category | Outcome Metrics |
| Subcategory | historical realized sequence |
| Canonical name | maximum_win_streak |
| Display name | Maximum win streak |
| Exact definition | Greatest length of any contiguous positive-outcome run across the ordered eligible current `ready_closed` population on an explicitly selected gross or fee-complete net basis. |
| Distinction from related concepts | Historical maximum only, not consecutive_wins/current ending run, total winning_trades, a calendar-day streak, or a forecast. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of consecutive round trips |
| Open-trade support | No; open and decision rows do not enter the realized sequence. |
| Fee handling | Gross needs no fee facts. Net uses fee-complete rows and follows the Section 5 shared partial/unavailable policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome sequence.
- Narrower concepts: none.
- Commonly confused concepts: consecutive_wins, winning_trades,
  maximum_loss_streak, green_days.
- Must not be merged with: consecutive_wins/current ending streak or a
  calendar-day streak.

### Formula and Interpretation Contract

- **Exact formula:** order eligible current `ready_closed` round trips by close
  UTC instant, then stable round-trip ID; return the greatest contiguous run
  length where `selected_basis_pnl > 0`. A negative, exact-zero, or
  unknown/non-classifiable selected-basis outcome barrier breaks each run.
- **Default and clarification:** “maximum win streak” means the longest
  historical run. Direct unqualified requests ask one focused gross-versus-net
  question when classification can differ and no trusted basis context exists;
  ask a separate current-versus-maximum question only when wording says merely
  “streak.”
- **Empty and coverage behavior:** an empty eligible population yields zero
  count with explicit `empty` state where the deterministic result contract
  permits. It never establishes a behavioral, causal, predictive, or advisory
  conclusion.
- **Unsupported conditions:** missing/unsupported selected basis, incomplete
  required net fee coverage, incompatible currency/timezone partition,
  unauthorized scope, or unknown contract field/operator produces
  clarification, partial, unavailable, or fail-closed behavior as applicable.
- **Tool target:** shared Journal Analytics ordered realized-sequence/streak
  path under the Section 5 shared contract.

## `maximum_loss_streak`

| Field | Value |
|---|---|
| Inventory ID | C3-OUT-017 |
| Category | Outcome Metrics |
| Subcategory | historical realized sequence |
| Canonical name | maximum_loss_streak |
| Display name | Maximum loss streak |
| Exact definition | Greatest length of any contiguous negative-outcome run across the ordered eligible current `ready_closed` population on an explicitly selected gross or fee-complete net basis. |
| Distinction from related concepts | Historical maximum only, not consecutive_losses/current ending run, total losing_trades, a calendar-day streak, or a causal conclusion. |
| Evidence classification | deterministically derived |
| Capability status | Supported |
| Result units | count of consecutive round trips |
| Open-trade support | No; open and decision rows do not enter the realized sequence. |
| Fee handling | Gross needs no fee facts. Net uses fee-complete rows and follows the Section 5 shared partial/unavailable policy. |
| Version | 1 |

### Related Concepts

- Broader concept: realized outcome sequence.
- Narrower concepts: none.
- Commonly confused concepts: consecutive_losses, losing_trades,
  maximum_win_streak, red_days.
- Must not be merged with: consecutive_losses/current ending streak or a
  calendar-day streak.

### Formula and Interpretation Contract

- **Exact formula:** order eligible current `ready_closed` round trips by close
  UTC instant, then stable round-trip ID; return the greatest contiguous run
  length where `selected_basis_pnl < 0`. A positive, exact-zero, or
  unknown/non-classifiable selected-basis outcome barrier breaks each run.
- **Default and clarification:** “maximum loss streak” means the longest
  historical run. Direct unqualified requests ask one focused gross-versus-net
  question when classification can differ and no trusted basis context exists;
  ask a separate current-versus-maximum question only when wording says merely
  “streak.”
- **Empty and coverage behavior:** an empty eligible population yields zero
  count with explicit `empty` state where the deterministic result contract
  permits. It never establishes a behavioral, causal, predictive, or advisory
  conclusion.
- **Unsupported conditions:** missing/unsupported selected basis, incomplete
  required net fee coverage, incompatible currency/timezone partition,
  unauthorized scope, or unknown contract field/operator produces
  clarification, partial, unavailable, or fail-closed behavior as applicable.
- **Tool target:** shared Journal Analytics ordered realized-sequence/streak
  path under the Section 5 shared contract.

---

# 6. Language Registry Deliverable

Version 1 language registries for C3-OUT-001 through C3-OUT-017 are
production-complete, approved, and locked. All 17 registries contain the
required 38 subsections (646 instances total). They describe approved language
routing contracts but do not claim that an AI Chat runtime exists.

## `trade_count` Language Registry

### Exact Definition

Count eligible current `ready_closed` round trips after validated filters; it is the same exact calculation as `closed_trades`, retained as a separate plan-listed language route. A clearly labelled cross-currency count is permitted because this count has no money basis.

### Formal Wording

- Return the eligible realized trade count for the selected closing-date range.

### Normal Conversational Wording

- How many trades did I take this month?; what is my trade count?

### Trader Slang

- How many plays did I close?; how many trades was that?

### Abbreviations

- `TC` can map only with clear trade-count grammar or trusted context; bare `TC` remains a ticker-shaped candidate and must not auto-route.

### Common Misspellings

- Tradecount; trade counnt; trad count.

### Noisy or Incomplete Input

- trade count july; how many trades wk.

### Singular and Plural Forms

- Trade count; trade counts; number of trades.

### Full Questions

- How many eligible closed trades did I have last week?; What was my trade count for NVDA in July?

### Commands

- Show my trade count for this month; count my closed trades.

### Sentence Fragments

- Trades this week; July trade count.

### Follow-Up Wording

- Now just the long trades; what about the prior month?

### Correction Wording

- I meant closed round trips, not executions; count only eligible trades.

### Comparison Wording

- Compare my trade count this month with last month.

### Ranking Wording

- Rank eligible months by trade count only over the declared valid periods.

### Negated Wording

- Do not include open positions; not execution count.

### Exclusion Wording

- Exclude AAPL; leave out the selected date range.

### Multi-Filter Wording

- Trade count for long NVDA trades in July, excluding AAPL.

### Multi-Part Question Wording

- Show my trade count for July and compare it with June.

### Ambiguous Wording

- “Trades” defaults to eligible `ready_closed` round trips. Clarify only if wording or trusted context materially indicates executions, legitimate-open positions, or all coverage candidates.

### Negative Examples

- How many fills did I receive?; how many positions are open now?; why did I trade so much?

### Context Requirements

- Server-authorized account scope is required; trusted date, ticker, or direction context may narrow the count. A cross-currency result must be clearly labelled as a count-only total.

### Required Data

- Authorized scope, one valid partition where required, active eligible `ready_closed` projections, validated filters, and coverage state.

### Optional Data

- Closing-date range, stable symbol, direction, provenance, and approved grouping.

### Valid Filters

- Server-authorized account scope, inclusive closing date, symbol, direction, provenance, and realized-outcome filters permitted by `journal_analytics_query_v1`.

### Valid Groupings

- Total, approved closing day/week/month/year, weekday, entry-time, symbol, direction, account, provenance, and realized outcome when the population remains valid.

### Valid Operators

- Count, approved comparison, grouping, and ranking over separately valid candidate populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, `explain_result`, and `diagnose_performance`.

### Incompatible Combinations

- Execution count, legitimate-open count, all-candidate coverage count, unauthorized account selection, or causal/advisory interpretation.

### Default Interpretation

- Use the exact eligible current `ready_closed` count, identically to `closed_trades`, without a money basis or a second calculation. A clearly labelled cross-currency count is valid; it never becomes a currency-converted money result.

### Clarification Conditions

- Ask one population question only when executions, current opens, or coverage candidates are materially indicated; ask separately for an unresolved period or valid comparison target.

### Recommended Clarification Wording

- Do you mean eligible closed round trips, execution rows, or current open positions?

### Unsupported Conditions

- Unknown query fields, unauthorized scope, or a request to infer unresolved rows fails closed; V3, fixtures, and inferred substitutes are unsupported.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService` through the versioned registry and `journal_analytics_query_v1` result contract.

### Result Units

- Count of eligible round trips, with coverage counts and `complete`, `partial`, `empty`, or `unavailable` state.

### Fee Handling

- No money basis or fee completeness is needed.

### Open-Trade Handling

- Exclude `legitimate_open` and `needs_decision` rows; report them as coverage without treating either as zero.

### Sample-Size Considerations

- Return the included count and coverage; a valid zero is an `empty` result, not missing data.

## `winning_trades` Language Registry

### Exact Definition

Count the identical selected-basis eligible population of current `ready_closed` round trips: gross-eligible rows with gross P/L strictly greater than exact zero, or fee-complete net-eligible rows with net P/L strictly greater than exact zero.

### Formal Wording

- Return the count of positive realized trade outcomes on the declared basis.

### Normal Conversational Wording

- How many winning trades did I have?; how many trades were green?

### Trader Slang

- How many winners?; count my green trades.

### Abbreviations

- `WT` maps only with clear winning-trades grammar or trusted context; bare `WT` remains ticker-safe and must not auto-route.

### Common Misspellings

- Winning tradees; winnning trades; wining trades.

### Noisy or Incomplete Input

- winners july; green trades wk.

### Singular and Plural Forms

- Winning trade; winning trades; winner; winners.

### Full Questions

- How many winning trades did I have after fees in July?; What was my gross winner count last week?

### Commands

- Show winning trades for this month; count gross winners.

### Sentence Fragments

- Winners this week; green trades net.

### Follow-Up Wording

- Use gross instead; now show only shorts.

### Correction Wording

- I meant winning trades, not green days; use net, not gross.

### Comparison Wording

- Compare my winning-trade count this month with last month on the same basis.

### Ranking Wording

- Rank valid ticker groups by winning-trade count on one declared basis.

### Negated Wording

- Do not use gross; do not include open trades.

### Exclusion Wording

- Exclude TSLA; leave out trades outside regular hours when that filter is supported.

### Multi-Filter Wording

- Count net winning long NVDA trades in July, excluding TSLA.

### Multi-Part Question Wording

- Show my gross winning-trade count for July and compare it with June.

### Ambiguous Wording

- “Winners” and “green trades” require gross or net when classification can differ. Bare `WT` never supplies that basis.

### Negative Examples

- What was my gross profit?; how many green days?; predict my next winner.

### Context Requirements

- Require server-authorized scope, one currency partition, and an explicit or trusted gross/net basis.

### Required Data

- Eligible `ready_closed` projections, selected-basis P/L, exact-zero comparison, coverage state, and fee completeness for net.

### Optional Data

- Date range, symbol, direction, provenance, selected trade, and approved grouping.

### Valid Filters

- Valid realized-population filters in `journal_analytics_query_v1`, including authorized scope, date, currency, symbol, direction, provenance, and realized outcome.

### Valid Groupings

- Approved total, closing-date, symbol, direction, account, provenance, and realized-outcome groups within valid partitions.

### Valid Operators

- Count, approved comparison, grouping, and ranking with a common declared basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, `explain_result`, and `diagnose_performance`.

### Incompatible Combinations

- Open or decision rows, mixed gross/net classification, fee-incomplete net rows as complete net evidence, or causation/advice claims.

### Default Interpretation

- For a direct request, do not choose gross or net when it can change classification; `summarize_performance` may use net with reliable fees, otherwise gross with a stated limitation.

### Clarification Conditions

- Ask one gross-versus-net question when no trusted basis exists and classification can differ; ask period or comparison target separately if needed.

### Recommended Clarification Wording

- Should I count winners by gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- Missing selected basis, required net fee incompleteness, unsupported value facts, unknown query terms, or unauthorized scope produces clarification, partial, unavailable, or fail-closed behavior.

### Target Analytics Tool or Query Capability

- Shared Journal Analytics population/accumulator and outcome count/rate registry through `journal_analytics_query_v1`.

### Result Units

- Count of winning eligible round trips, plus basis, fee coverage, denominator population, and result state.

### Fee Handling

- Gross requires no fee facts; net uses fee-complete rows only and reports partial or unavailable coverage rather than substituting gross.

### Open-Trade Handling

- Legitimate-open and `needs_decision` rows never become winners and remain visible only in coverage.

### Sample-Size Considerations

- Return the eligible closed count and winning numerator; zero winners with a nonzero eligible population is valid.

## `losing_trades` Language Registry

### Exact Definition

Count the identical selected-basis eligible population of current `ready_closed` round trips: gross-eligible rows with gross P/L strictly less than exact zero, or fee-complete net-eligible rows with net P/L strictly less than exact zero.

### Formal Wording

- Return the count of negative realized trade outcomes on the declared basis.

### Normal Conversational Wording

- How many losing trades did I have?; how many trades were red?

### Trader Slang

- How many losers?; count my red trades.

### Abbreviations

- `LT` maps only with clear losing-trades grammar or trusted context; a bare `LT` remains a ticker-shaped candidate.

### Common Misspellings

- Loosing trades; losing tradees; losin trades.

### Noisy or Incomplete Input

- losers july; red trades wk.

### Singular and Plural Forms

- Losing trade; losing trades; loser; losers.

### Full Questions

- How many losing trades did I have before fees this month?; What was my net red-trade count in July?

### Commands

- Show my losing trades; count net losers for last week.

### Sentence Fragments

- Losers this month; red trades gross.

### Follow-Up Wording

- Now use net; compare that with June.

### Correction Wording

- I meant losing trades, not red days; count gross losses instead.

### Comparison Wording

- Compare my losing-trade count across these two valid periods on the same basis.

### Ranking Wording

- Rank valid symbol groups by losing-trade count with the selected basis shown.

### Negated Wording

- Do not include fee-incomplete trades in a net count; not open positions.

### Exclusion Wording

- Exclude AAPL; leave out the selected provenance when supported.

### Multi-Filter Wording

- Count gross losing short trades in July, excluding AAPL.

### Multi-Part Question Wording

- Show my net losing-trade count and winning-trade count for July.

### Ambiguous Wording

- “Losers” and “red trades” require a gross/net basis if it can change classification. Bare `LT` is not enough to route.

### Negative Examples

- What was my gross loss amount?; how many red days?; tell me how to stop losing.

### Context Requirements

- Require server-authorized scope, one currency partition, and a declared or trusted outcome basis.

### Required Data

- Eligible `ready_closed` facts, selected-basis P/L, exact comparison, net fee completeness where applicable, and coverage state.

### Optional Data

- Date range, stable symbol, direction, provenance, selected trade, and approved group.

### Valid Filters

- Authorized account scope and server-validated realized filters for closing date, currency, symbol, direction, provenance, and outcome.

### Valid Groupings

- Supported total, closing-date, symbol, direction, account, provenance, and outcome groups that reconcile to the filtered population.

### Valid Operators

- Count, comparison, grouping, and ranking over valid populations on one basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, `explain_result`, and `diagnose_performance`.

### Incompatible Combinations

- Net classification with missing fee evidence, open/decision rows, cross-currency merging, or behavioral, predictive, and advisory conclusions.

### Default Interpretation

- Direct requests clarify gross versus net when material; summary routing follows the locked net-with-reliable-fees, otherwise-gross-with-limitation rule.

### Clarification Conditions

- Ask for basis first when needed, then separately resolve a missing period, partition, or comparison target.

### Recommended Clarification Wording

- Should I count losing trades by gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- Unestablished basis, unavailable net fee-complete population, unsupported facts, unapproved query terms, and unauthorized access are not inferred.

### Target Analytics Tool or Query Capability

- Journal Analytics outcome count/rate registry and exact shared accumulator under the typed query/result contract.

### Result Units

- Count of losing eligible round trips, returned with declared basis and coverage.

### Fee Handling

- Gross accepts eligible realized rows without fee facts; net uses only fee-complete rows and makes incomplete coverage explicit.

### Open-Trade Handling

- Exclude legitimate-open and decision rows from the count; neither is a loss by default.

### Sample-Size Considerations

- Include the eligible closed denominator and a nonnegative losing-trade count representing selected-basis negative outcomes; a zero losing-trade count is valid only when the denominator exists.

## `breakeven_trades` Language Registry

### Exact Definition

Count the identical selected-basis eligible population of current `ready_closed` round trips: gross-eligible rows whose gross P/L equals exact zero, or fee-complete net-eligible rows whose net P/L equals exact zero.

### Formal Wording

- Return the count of exact-zero realized trade outcomes on the declared basis.

### Normal Conversational Wording

- How many breakeven trades did I have?; how many trades were flat?

### Trader Slang

- How many scratch trades?; count the flats.

### Abbreviations

- `BE` maps only with clear breakeven-trades grammar or trusted context; bare `BE` remains ticker-safe and must not auto-route.

### Common Misspellings

- Breakeven tradees; break even trades; break-even trads.

### Noisy or Incomplete Input

- flats july; breakevens wk.

### Singular and Plural Forms

- Breakeven trade; breakeven trades; flat; flats.

### Full Questions

- How many exact breakeven trades did I have after fees in July?; What was my gross flat-trade count?

### Commands

- Show breakeven trades for this month; count exact-zero gross trades.

### Sentence Fragments

- Flat trades July; breakevens net.

### Follow-Up Wording

- Use gross; now show that for longs.

### Correction Wording

- I meant exact breakeven trades, not small losses rounded to zero.

### Comparison Wording

- Compare exact breakeven-trade counts between these periods on the same basis.

### Ranking Wording

- Rank valid ticker groups by exact breakeven-trade count; do not rank approximate scratches.

### Negated Wording

- Do not treat rounded values as flat; do not include open trades.

### Exclusion Wording

- Exclude NVDA; leave out fee-incomplete rows from a net result.

### Multi-Filter Wording

- Count net breakeven long trades in July, excluding NVDA.

### Multi-Part Question Wording

- Show gross breakeven trades and win rate for July, with each basis stated.

### Ambiguous Wording

- “Flat” and “breakeven” mean exact selected-basis zero. “Scratch” is not an approximate threshold and requires clarification if the user means near zero.

### Negative Examples

- Count trades within one dollar of zero; what was my flat day count?; predict whether my next trade scratches.

### Context Requirements

- Require server scope, one currency partition, and a gross/net basis that can support exact-zero classification.

### Required Data

- Eligible `ready_closed` facts, selected exact P/L basis, fee-complete net evidence when selected, and coverage state.

### Optional Data

- Closing-date range, stable symbol, direction, provenance, and valid grouping.

### Valid Filters

- Authorized scope plus supported realized date, currency, symbol, direction, provenance, and outcome filters.

### Valid Groupings

- Valid total, closing date, symbol, direction, account, provenance, and realized-outcome groupings within compatible partitions.

### Valid Operators

- Exact-zero count, comparison, grouping, and ranking over valid candidate populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, `explain_result`, and `diagnose_performance`.

### Incompatible Combinations

- Tolerance-based scratch counts, display-rounded zeros, open or decision rows, mixed bases, and causation or trade advice.

### Default Interpretation

- A direct request asks gross versus net when classification can differ; do not silently choose a tolerance, and summary routing retains its declared basis.

### Clarification Conditions

- Ask for gross or net when needed; ask what threshold is intended when “scratch” would mean anything other than exact zero.

### Recommended Clarification Wording

- Should I use exact gross P/L before fees or exact net P/L after recorded fees?

### Unsupported Conditions

- Approximate thresholds, missing selected basis, incomplete required net fees, unsupported facts, and unauthorized scope cannot yield an invented flat result.

### Target Analytics Tool or Query Capability

- The exact Journal Analytics outcome count/rate registry path currently named `flat_count`, through the typed query/result contract.

### Result Units

- Count of exact-zero eligible round trips with basis and fee-coverage state.

### Fee Handling

- Gross needs no fee facts; net classification uses fee-complete rows only and does not estimate missing fees.

### Open-Trade Handling

- Exclude legitimate-open and `needs_decision` rows; neither can be inferred as flat.

### Sample-Size Considerations

- Return the eligible denominator and exact-zero numerator; a zero numerator is valid when eligible records exist.

## `open_trades` Language Registry

### Exact Definition

Count current factually confirmed `legitimate_open` lifecycle projections after validated filters; it is not a realized outcome count. A clearly labelled cross-currency count is permitted because it has no money basis.

### Formal Wording

- Return the current count of factually confirmed legitimate-open positions.

### Normal Conversational Wording

- How many trades are open?; what open trades do I have?

### Trader Slang

- How many plays am I still in?; open positions now.

### Abbreviations

- `OT` maps only with clear open-trades grammar or trusted context; bare `OT` remains a ticker-shaped candidate and must not auto-route.

### Common Misspellings

- Open tradees; open trads; opn trades.

### Noisy or Incomplete Input

- opens now; open trades.

### Singular and Plural Forms

- Open trade; open trades; open position; open positions.

### Full Questions

- How many factually confirmed open trades do I have now?; What is my current open-position count for NVDA?

### Commands

- Show my open-trade count; count current open positions.

### Sentence Fragments

- Open positions; opens now.

### Follow-Up Wording

- Now just NVDA; what about the other account partition?

### Correction Wording

- I meant current open positions, not closed trades; do not include rows needing a decision.

### Comparison Wording

- Compare current legitimate-open counts only where the snapshots and scope are valid.

### Ranking Wording

- Rank valid current symbol groups by legitimate-open count; no realized-outcome ranking is implied.

### Negated Wording

- Do not include needs-decision rows; not closed trades.

### Exclusion Wording

- Exclude AAPL; leave out the specified provenance when supported.

### Multi-Filter Wording

- Count current open long NVDA positions, excluding AAPL.

### Multi-Part Question Wording

- Show my current open-trade count and separately report closed-trade count for July.

### Ambiguous Wording

- “Open trades” means current `legitimate_open` projections only. “Unresolved” or “pending” does not make a `needs_decision` row open.

### Negative Examples

- How many candidate rows need a decision?; what is unrealized P/L?; why am I holding these?

### Context Requirements

- Require server-authorized current account scope; a trusted symbol or direction context may narrow current lifecycle facts. A cross-currency total must remain clearly labelled as count-only.

### Required Data

- Authorized scope, current active projection lifecycle state, supported filters, and coverage/Data Decision state.

### Optional Data

- Stable symbol, direction, provenance, selected position, and approved current grouping.

### Valid Filters

- Server-authorized account scope and validated current lifecycle filters such as symbol, direction, and provenance where exposed.

### Valid Groupings

- Supported current total, symbol, direction, account, and provenance groupings; no realized closing-date grouping is assumed.

### Valid Operators

- Count, approved current-state grouping, comparison, and ranking with explicit snapshot semantics.

### Compatible Intents

- `calculate_metric`, `retrieve_records`, `summarize_performance` when separately labelled, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Realized win/loss/breakeven rates, needs-decision inference, a P/L basis requirement for the count, or advice/prediction claims.

### Default Interpretation

- Use the current `legitimate_open` count only, with no money basis and no inference about decision, excluded, superseded, or unsupported rows. A clearly labelled cross-currency count is valid.

### Clarification Conditions

- Ask one field at a time only for an unclear current snapshot, a conflicting account/symbol context, or whether “open” instead means unresolved candidates.

### Recommended Clarification Wording

- Do you mean current factually confirmed open positions or rows that still need a Data Decision?

### Unsupported Conditions

- A request to classify `needs_decision` as open, to reconstruct a historical open count without a supported snapshot, or to infer unrealized results is unsupported.

### Target Analytics Tool or Query Capability

- Journal Analytics current lifecycle projection path and typed query/result coverage contract.

### Result Units

- Count of current legitimate-open positions with timestamp/scope and coverage state.

### Fee Handling

- No P/L basis or fee completeness is required for the lifecycle count.

### Open-Trade Handling

- Include current `legitimate_open` only; report `needs_decision`, excluded, superseded, and unsupported rows separately without conversion.

### Sample-Size Considerations

- A count of zero is a valid current empty state when scope coverage is available; it is not a realized-performance conclusion.

## `closed_trades` Language Registry

### Exact Definition

Count eligible current `ready_closed` round trips after validated filters; it shares the exact calculation with `trade_count` and does not double count. A clearly labelled cross-currency count is permitted because this count has no money basis.

### Formal Wording

- Return the count of eligible closed round trips in the selected scope.

### Normal Conversational Wording

- How many trades did I close?; how many closed trades did I have?

### Trader Slang

- How many plays did I finish?; closed-out trades.

### Abbreviations

- `CT` maps only in clear closed-trades grammar or trusted context; bare `CT` remains ticker-safe and must not auto-route.

### Common Misspellings

- Closed tradees; close trades; closd trades.

### Noisy or Incomplete Input

- closed july; closed trades wk.

### Singular and Plural Forms

- Closed trade; closed trades; completed trade; completed trades.

### Full Questions

- How many eligible closed trades did I have in July?; What was my NVDA closed-trade count last week?

### Commands

- Show closed trades for this month; count completed round trips.

### Sentence Fragments

- Closed trades July; completed plays.

### Follow-Up Wording

- Now only shorts; show the prior month too.

### Correction Wording

- I meant closed round trips, not executions; use the same count as trade count.

### Comparison Wording

- Compare eligible closed-trade counts between two declared periods.

### Ranking Wording

- Rank valid closing months by closed-trade count without mixing account scope.

### Negated Wording

- Do not include open positions; not all imported candidates.

### Exclusion Wording

- Exclude TSLA; leave out trades outside the supported selected range.

### Multi-Filter Wording

- Count closed long NVDA trades in July, excluding TSLA.

### Multi-Part Question Wording

- Show closed trades for July and compare them with my trade count for June.

### Ambiguous Wording

- “Closed trades” is eligible current `ready_closed` round trips, not every row that looks completed, execution fills, or coverage candidates.

### Negative Examples

- How many fills were completed?; how many trades are still open?; which closed trade caused my loss?

### Context Requirements

- Require server-authorized scope and valid filters; date and symbol context may narrow the closed population. A cross-currency total must remain clearly labelled as count-only.

### Required Data

- Current active `ready_closed` projections, authorized scope, validated filters, and coverage state.

### Optional Data

- Closing-date range, symbol, direction, provenance, and allowed grouping.

### Valid Filters

- Authorized scope and validated closing-date, currency, symbol, direction, provenance, and realized-outcome filters.

### Valid Groupings

- Supported total, closing date, symbol, direction, account, provenance, and realized-outcome groups that reconcile exactly.

### Valid Operators

- Count, comparison, grouping, and ranking over valid populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, `explain_result`, and `diagnose_performance`.

### Incompatible Combinations

- Execution counts, open positions, unresolved candidates, cross-account selection from language, or causal/advisory inference.

### Default Interpretation

- Use one exact eligible current `ready_closed` count, the same calculation as `trade_count`, with no money basis and no duplicate aggregation. A clearly labelled cross-currency count is valid.

### Clarification Conditions

- Clarify only if the user materially indicates fills, open positions, coverage candidates, an unclear period, or an invalid comparison target.

### Recommended Clarification Wording

- Do you mean eligible closed round trips, execution rows, or current open positions?

### Unsupported Conditions

- Unresolved/unsupported rows cannot be promoted to closed; unknown query fields, unauthorized scope, and inferred substitutes fail closed.

### Target Analytics Tool or Query Capability

- `JournalAnalyticsService` and versioned count registry through `journal_analytics_query_v1`.

### Result Units

- Count of eligible closed round trips with complete, partial, empty, or unavailable coverage state.

### Fee Handling

- No money basis or fee facts are required.

### Open-Trade Handling

- Exclude legitimate-open and `needs_decision` rows; show their coverage rather than silently counting them.

### Sample-Size Considerations

- Return included and coverage counts. A zero count is valid for an empty eligible population.

## `win_rate` Language Registry

### Exact Definition

`winning_trades` divided by the identical selected-basis eligible population: gross-eligible `ready_closed` rows for gross, or fee-complete net-eligible `ready_closed` rows for net. Excluded fee-incomplete net rows remain coverage, and a zero selected-basis denominator is unavailable.

### Formal Wording

- Return the positive-outcome rate over the eligible realized closed-trade population.

### Normal Conversational Wording

- What is my win rate?; what percentage of my trades won?

### Trader Slang

- What is my hit rate?; how often am I green?

### Abbreviations

- `WR` maps only with clear win-rate grammar or trusted context; bare `WR` remains ticker-safe and must not auto-route.

### Common Misspellings

- Winrate; win rat; winr ate.

### Noisy or Incomplete Input

- wr july; hit rate wk.

### Singular and Plural Forms

- Win rate; win rates; winning percentage.

### Full Questions

- What was my net win rate in July?; What percentage of eligible trades were gross winners last week?

### Commands

- Show my win rate; calculate gross winning percentage.

### Sentence Fragments

- Win rate this month; net hit rate.

### Follow-Up Wording

- Use gross; now by ticker.

### Correction Wording

- I meant win rate, not number of winners; use net after fees.

### Comparison Wording

- Compare net win rate this month with last month, including each denominator.

### Ranking Wording

- Rank valid ticker groups by gross win rate only with each eligible denominator and common basis shown.

### Negated Wording

- Do not count open positions; do not treat fee-incomplete rows as complete net results.

### Exclusion Wording

- Exclude AAPL; leave out the selected unsupported filter.

### Multi-Filter Wording

- Show net win rate for long NVDA trades in July, excluding AAPL.

### Multi-Part Question Wording

- Show gross win rate and winning-trade count for July, then compare with June.

### Ambiguous Wording

- “Win rate,” “hit rate,” and `WR` require a gross/net basis when outcomes can differ. A bare `WR` cannot route or select an account.

### Negative Examples

- How many winners did I have?; what was my percentage of profitable days?; will my win rate improve?

### Context Requirements

- Require server-authorized scope, one currency partition, selected basis, valid eligible population, and date/group scope for comparisons.

### Required Data

- Eligible `ready_closed` count, selected-basis positive numerator, exact classification, net fee coverage if selected, and result coverage state.

### Optional Data

- Date range, symbol, direction, provenance, selected trade context, and approved group.

### Valid Filters

- Authorized scope and allowed realized filters for date, currency, symbol, direction, provenance, and outcome.

### Valid Groupings

- Approved total, closing date, symbol, direction, account, provenance, and realized-outcome groups with separately valid denominators.

### Valid Operators

- Division, percentage display, comparison, grouping, and ranking only when each candidate uses the same valid metric basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, `explain_result`, and `diagnose_performance`.

### Incompatible Combinations

- Zero-denominator percentage, open or decision rows, mixed gross/net groups, account selection by language, or prediction/advice.

### Default Interpretation

- Direct requests ask gross versus net when classification can differ; multi-metric summaries may use reliable-fee net or otherwise stated-limitation gross.

### Clarification Conditions

- Ask one basis question if unresolved, then separately ask for a missing period, valid grouping, or comparison target.

### Recommended Clarification Wording

- Should I calculate win rate from gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- A zero eligible denominator is unavailable, not 0%; missing net fee evidence, unsupported facts, unknown terms, and unauthorized scope cannot be guessed.

### Target Analytics Tool or Query Capability

- Journal Analytics outcome count/rate registry and exact population accumulator through the typed query/result contract.

### Result Units

- Percentage or exact ratio, plus winning numerator, eligible denominator, basis, fee coverage, and state.

### Fee Handling

- Gross needs no fee facts; net uses fee-complete rows only and exposes partial or unavailable coverage.

### Open-Trade Handling

- Legitimate-open and `needs_decision` rows are excluded from both numerator and denominator and retained in coverage.

### Sample-Size Considerations

- Always show the denominator; small samples describe observed frequency only and do not establish future odds.

## `loss_rate` Language Registry

### Exact Definition

`losing_trades` divided by the identical selected-basis eligible population: gross-eligible `ready_closed` rows for gross, or fee-complete net-eligible `ready_closed` rows for net. Excluded fee-incomplete net rows remain coverage, and a zero selected-basis denominator is unavailable.

### Formal Wording

- Return the negative-outcome rate over the eligible realized closed-trade population.

### Normal Conversational Wording

- What is my loss rate?; what percentage of my trades lost?

### Trader Slang

- What is my miss rate?; how often am I red?

### Abbreviations

- `LR` maps only with clear loss-rate grammar or trusted context; bare `LR` remains a ticker-shaped candidate and must not auto-route.

### Common Misspellings

- Lossrate; los rate; loss ratte.

### Noisy or Incomplete Input

- lr july; miss rate wk.

### Singular and Plural Forms

- Loss rate; loss rates; losing percentage.

### Full Questions

- What was my gross loss rate in July?; What percentage of eligible trades lost after fees last week?

### Commands

- Show my loss rate; calculate net losing percentage.

### Sentence Fragments

- Loss rate July; net miss rate.

### Follow-Up Wording

- Use gross; break it out by direction.

### Correction Wording

- I meant loss rate, not losing-trade count; use gross before fees.

### Comparison Wording

- Compare loss rate for these valid periods with the same basis and both denominators.

### Ranking Wording

- Rank valid groups by net loss rate only when fee coverage and eligible denominators are shown.

### Negated Wording

- Do not include open positions; do not calculate 0% for an empty population.

### Exclusion Wording

- Exclude NVDA; leave out rows outside the supported date range.

### Multi-Filter Wording

- Show gross loss rate for short NVDA trades in July, excluding AAPL.

### Multi-Part Question Wording

- Show net loss rate and losing-trade count for July, then compare with June.

### Ambiguous Wording

- “Loss rate,” “miss rate,” and `LR` require a declared gross/net basis if classification can differ. Bare `LR` must remain ticker-safe.

### Negative Examples

- How many losing trades did I take?; how many red days were there?; tell me what I should change to lower it.

### Context Requirements

- Require server-authorized scope, one currency partition, selected basis, and a valid eligible denominator.

### Required Data

- Eligible `ready_closed` denominator, a nonnegative losing-trade numerator count representing selected-basis negative outcomes, exact classification, applicable net fee coverage, and result state.

### Optional Data

- Date range, symbol, direction, provenance, selected context, and approved group.

### Valid Filters

- Server-authorized and typed-query-approved realized filters for date, currency, symbol, direction, provenance, and outcome.

### Valid Groupings

- Supported total, closing-date, symbol, direction, account, provenance, and outcome groups with valid separate denominators.

### Valid Operators

- Division, percentage display, comparison, grouping, and ranking with a consistent declared basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, `explain_result`, and `diagnose_performance`.

### Incompatible Combinations

- Empty-denominator rates, net classification without complete fees, open/decision rows, cross-partition aggregation, and causal or advisory conclusions.

### Default Interpretation

- Direct loss-rate wording clarifies gross versus net when material; summary uses only the locked reliable-fee-net or stated-limitation-gross rule.

### Clarification Conditions

- Resolve basis first if needed; resolve period, group, or comparison target one field at a time afterwards.

### Recommended Clarification Wording

- Should I calculate loss rate from gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- Zero denominator is unavailable, and missing fee facts, unsupported inputs, unknown operators, or unauthorized scope never produce a guessed percentage.

### Target Analytics Tool or Query Capability

- Exact Journal Analytics outcome rate registry and shared accumulator through `journal_analytics_query_v1`.

### Result Units

- Percentage or exact ratio with a nonnegative losing-trade numerator, eligible denominator, declared basis, and coverage state.

### Fee Handling

- Gross requires no fees; net requires fee-complete evidence and retains any excluded incomplete population as coverage.

### Open-Trade Handling

- Exclude open and decision rows from numerator and denominator; do not call them losses.

### Sample-Size Considerations

- Show the eligible denominator. Observed rates are not probability forecasts or recommendations.

## `breakeven_rate` Language Registry

### Exact Definition

`breakeven_trades` divided by the identical selected-basis eligible population: gross-eligible `ready_closed` rows for gross, or fee-complete net-eligible `ready_closed` rows for net. Excluded fee-incomplete net rows remain coverage, and a zero selected-basis denominator is unavailable.

### Formal Wording

- Return the exact-zero realized-outcome rate over the eligible closed-trade population.

### Normal Conversational Wording

- What is my breakeven rate?; what percentage of my trades were flat?

### Trader Slang

- What is my scratch rate?; how often did I get out flat?

### Abbreviations

- `BR` and `BE` map only with clear breakeven-rate grammar or trusted context; bare short tokens remain ticker-safe and must not auto-route.

### Common Misspellings

- Breakeven rate; break even rate; breakeven rat.

### Noisy or Incomplete Input

- be rate july; flats % wk.

### Singular and Plural Forms

- Breakeven rate; breakeven rates; flat percentage.

### Full Questions

- What was my net breakeven rate in July?; What percentage of gross eligible trades were exactly flat last week?

### Commands

- Show my breakeven rate; calculate gross flat percentage.

### Sentence Fragments

- Flat rate July; breakeven percentage net.

### Follow-Up Wording

- Use gross instead; now compare it with June.

### Correction Wording

- I meant exact breakeven rate, not trades within a rounding tolerance.

### Comparison Wording

- Compare exact breakeven rates for valid periods with the same basis and denominators.

### Ranking Wording

- Rank valid groups by exact breakeven rate only with each eligible denominator visible.

### Negated Wording

- Do not treat scratch as near zero; do not include open trades.

### Exclusion Wording

- Exclude TSLA; leave out fee-incomplete rows from net classification.

### Multi-Filter Wording

- Show gross breakeven rate for long NVDA trades in July, excluding TSLA.

### Multi-Part Question Wording

- Show net breakeven rate, win rate, and loss rate for July with the common basis stated.

### Ambiguous Wording

- “Breakeven,” “flat,” and “scratch rate” mean exact selected-basis zero only; a tolerance request needs clarification. Bare `BR` or `BE` does not safely route.

### Negative Examples

- What percentage were within a dollar of flat?; how many flat days?; will I scratch more next month?

### Context Requirements

- Require server-authorized scope, one currency partition, selected basis, and a nonempty eligible denominator.

### Required Data

- Eligible `ready_closed` denominator, exact-zero selected-basis numerator, fee-complete net evidence when applicable, and coverage state.

### Optional Data

- Date range, symbol, direction, provenance, selected trade, and approved grouping.

### Valid Filters

- Authorized scope plus supported realized filters for closing date, currency, symbol, direction, provenance, and outcome.

### Valid Groupings

- Valid total, closing-date, symbol, direction, account, provenance, and outcome groups with independent eligible denominators.

### Valid Operators

- Exact-zero division, percentage display, comparison, grouping, and ranking with one declared basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, `explain_result`, and `diagnose_performance`.

### Incompatible Combinations

- Approximate scratch rate, zero-denominator output, open/decision rows, mixed fee basis, cross-account selection, and prediction or advice.

### Default Interpretation

- Direct requests clarify gross versus net when the result can differ; summary routing may use only reliable-fee net or otherwise gross with a stated limitation.

### Clarification Conditions

- Ask for gross/net when needed; ask a separate question if “scratch” seeks a tolerance or if the period/group target is missing.

### Recommended Clarification Wording

- Should I calculate exact breakeven rate from gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- A zero denominator is unavailable; approximate thresholds, incomplete required net fees, unknown query terms, and unauthorized scope cannot yield a rate.

### Target Analytics Tool or Query Capability

- Exact Journal Analytics outcome rate registry path currently named `flat_rate`, through the typed query/result contract.

### Result Units

- Percentage or exact ratio with exact-zero numerator, eligible denominator, selected basis, and coverage.

### Fee Handling

- Gross needs no fee facts; net includes fee-complete rows only and reports partial or unavailable coverage without estimating fees.

### Open-Trade Handling

- Open and decision rows are excluded from numerator and denominator and remain visible only as coverage.

### Sample-Size Considerations

- Return the denominator and exact-zero numerator; a small observed rate is not a prediction, explanation, or recommendation.

---

## `green_days` Language Registry

### Exact Definition

Count account-IANA closing dates in the selected authorized, currency- and timezone-compatible partition whose complete selected-basis realized P/L total is strictly greater than exact zero.

### Formal Wording

- Return the number of profitable realized closing dates for the declared gross or fee-complete net basis.

### Normal Conversational Wording

- How many green days did I have?; how many profitable days were there in July?

### Trader Slang

- How many green sessions?; how many days did I finish green?

### Abbreviations

- `GD` maps only with clear green-day grammar or trusted context; bare `GD` is ticker-shaped and never auto-routes.

### Common Misspellings

- Green dayz; gren days; profitable day count.

### Noisy or Incomplete Input

- gd july; green days wk.

### Singular and Plural Forms

- Green day; green days; profitable day; profitable days.

### Full Questions

- How many gross green days did I have in July?; How many days closed positive after recorded fees?

### Commands

- Show my green days; count net profitable days.

### Sentence Fragments

- Green days July; profitable days net.

### Follow-Up Wording

- Use gross instead; break those days out by month.

### Correction Wording

- I meant green days, not winning trades; use the net day total.

### Comparison Wording

- Compare green-day counts for these valid periods with the same declared basis.

### Ranking Wording

- Rank valid months by green days with each period and basis shown.

### Negated Wording

- Do not count open-only days; do not fill no-trade calendar dates as flat.

### Exclusion Wording

- Exclude NVDA; leave out the selected closing-date range.

### Multi-Filter Wording

- Show gross green days for long NVDA round trips in July, excluding AAPL.

### Multi-Part Question Wording

- Show green, red, and flat days for July on the same net basis.

### Ambiguous Wording

- “Green day” means a complete selected-basis realized closing-date bucket with total P/L greater than zero. Direct wording needs gross/net clarification when classifications can differ; bare `GD` remains ticker-safe.

### Negative Examples

- How many winning trades did I have?; how many calendar days did I trade?; why were my days green?

### Context Requirements

- Require server-authorized scope, one account, and one currency/timezone-compatible partition with account IANA closing dates.

### Required Data

- Eligible `ready_closed` rows, selected basis, closing UTC/timezone conversion, complete day-bucket coverage, and result state.

### Optional Data

- Closing-date range, symbol, direction, provenance, and approved grouping.

### Valid Filters

- Authorized realized filters for closing date, currency, symbol, direction, provenance, and outcome under the typed query contract.

### Valid Groupings

- Supported total, closing week/month/year, symbol, direction, account, provenance, and outcome groups with separately valid day buckets.

### Valid Operators

- Count, grouping, comparison, and ranking over valid declared-basis day populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Calendar occupancy, winning-trade count, zero-filled dates, cross-partition aggregation, causation, behavior, prediction, or advice.

### Default Interpretation

- A direct request asks one gross-versus-net question if classification can differ. Only a Category 1 multi-metric summary uses the accepted summary-basis default.

### Clarification Conditions

- Clarify one field at a time: selected basis first when needed, then missing period or valid comparison target.

### Recommended Clarification Wording

- Should I count green days from gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- Incomplete required net fee coverage, unknown fields, unauthorized scope, incompatible partition, or unavailable classification never yields an invented count.

### Target Analytics Tool or Query Capability

- Journal Analytics closing-day grouping and shared accumulator through `journal_analytics_query_v1`.

### Result Units

- Count of realized closing dates, with selected basis, coverage, and `complete`, `partial`, `empty`, or `unavailable` state.

### Fee Handling

- Gross needs no fee facts. Net classifies a date only when every eligible row on that date is fee-complete; partial or unavailable coverage is explicit.

### Open-Trade Handling

- Open-only and no-trade dates are excluded and never become zero or flat days; decision rows remain coverage.

### Sample-Size Considerations

- Return the included day count and coverage; it does not establish a cause, tendency, or forecast.

## `red_days` Language Registry

### Exact Definition

Count account-IANA closing dates in the selected authorized, currency- and timezone-compatible partition whose complete selected-basis realized P/L total is strictly less than exact zero.

### Formal Wording

- Return the number of negative realized closing dates for the declared gross or fee-complete net basis.

### Normal Conversational Wording

- How many red days did I have?; how many losing days were there in July?

### Trader Slang

- How many red sessions?; how many days did I finish red?

### Abbreviations

- `RD` maps only with clear red-day grammar or trusted context; bare `RD` is ticker-shaped and never auto-routes.

### Common Misspellings

- Red dayz; redd days; losing day count.

### Noisy or Incomplete Input

- rd july; red days wk.

### Singular and Plural Forms

- Red day; red days; losing day; losing days.

### Full Questions

- How many gross red days did I have in July?; How many days closed negative after recorded fees?

### Commands

- Show my red days; count net losing days.

### Sentence Fragments

- Red days July; losing days net.

### Follow-Up Wording

- Use gross instead; break those days out by month.

### Correction Wording

- I meant red days, not losing trades; use the net day total.

### Comparison Wording

- Compare red-day counts for these valid periods with the same declared basis.

### Ranking Wording

- Rank valid months by red days with each period and basis shown.

### Negated Wording

- Do not count open-only days; do not fill no-trade calendar dates as flat.

### Exclusion Wording

- Exclude NVDA; leave out the selected closing-date range.

### Multi-Filter Wording

- Show gross red days for short NVDA round trips in July, excluding AAPL.

### Multi-Part Question Wording

- Show green, red, and flat days for July on the same gross basis.

### Ambiguous Wording

- “Red day” means a complete selected-basis realized closing-date bucket with total P/L less than zero. Direct wording needs gross/net clarification when classifications can differ; bare `RD` remains ticker-safe.

### Negative Examples

- How many losing trades did I have?; how many calendar days did I trade?; tell me how to avoid red days.

### Context Requirements

- Require server-authorized scope, one account, and one currency/timezone-compatible partition with account IANA closing dates.

### Required Data

- Eligible `ready_closed` rows, selected basis, closing UTC/timezone conversion, complete day-bucket coverage, and result state.

### Optional Data

- Closing-date range, symbol, direction, provenance, and approved grouping.

### Valid Filters

- Authorized realized filters for closing date, currency, symbol, direction, provenance, and outcome under the typed query contract.

### Valid Groupings

- Supported total, closing week/month/year, symbol, direction, account, provenance, and outcome groups with separately valid day buckets.

### Valid Operators

- Count, grouping, comparison, and ranking over valid declared-basis day populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Calendar occupancy, losing-trade count, zero-filled dates, cross-partition aggregation, causation, behavior, prediction, or advice.

### Default Interpretation

- A direct request asks one gross-versus-net question if classification can differ. Only a Category 1 multi-metric summary uses the accepted summary-basis default.

### Clarification Conditions

- Clarify one field at a time: selected basis first when needed, then missing period or valid comparison target.

### Recommended Clarification Wording

- Should I count red days from gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- Incomplete required net fee coverage, unknown fields, unauthorized scope, incompatible partition, or unavailable classification never yields an invented count.

### Target Analytics Tool or Query Capability

- Journal Analytics closing-day grouping and shared accumulator through `journal_analytics_query_v1`.

### Result Units

- Count of realized closing dates, with selected basis, coverage, and `complete`, `partial`, `empty`, or `unavailable` state.

### Fee Handling

- Gross needs no fee facts. Net classifies a date only when every eligible row on that date is fee-complete; partial or unavailable coverage is explicit.

### Open-Trade Handling

- Open-only and no-trade dates are excluded and never become zero or flat days; decision rows remain coverage.

### Sample-Size Considerations

- Return the included day count and coverage; it does not establish a cause, tendency, or forecast.

## `flat_days` Language Registry

### Exact Definition

Count account-IANA closing dates in the selected authorized, currency- and timezone-compatible partition whose complete selected-basis realized P/L total equals exact zero.

### Formal Wording

- Return the number of exact-zero realized closing dates for the declared gross or fee-complete net basis.

### Normal Conversational Wording

- How many flat days did I have?; how many days finished exactly even?

### Trader Slang

- How many scratch days?; how many days did I finish flat?

### Abbreviations

- `FD` maps only with clear flat-day grammar or trusted context; bare `FD` is ticker-shaped and never auto-routes.

### Common Misspellings

- Flat dayz; flatt days; scratch day count.

### Noisy or Incomplete Input

- fd july; flat days wk.

### Singular and Plural Forms

- Flat day; flat days; exact-zero day; exact-zero days.

### Full Questions

- How many gross flat days did I have in July?; How many days were exactly flat after recorded fees?

### Commands

- Show my flat days; count net exact-zero days.

### Sentence Fragments

- Flat days July; exact zero days net.

### Follow-Up Wording

- Use gross instead; now show green and red days too.

### Correction Wording

- I meant flat days, not breakeven trades; exact zero, not close to zero.

### Comparison Wording

- Compare exact flat-day counts for these valid periods with the same declared basis.

### Ranking Wording

- Rank valid months by flat days with each period and basis shown.

### Negated Wording

- Do not treat rounded display zero as flat; do not zero-fill no-trade or open-only dates.

### Exclusion Wording

- Exclude TSLA; leave out the selected closing-date range.

### Multi-Filter Wording

- Show gross flat days for long NVDA round trips in July, excluding TSLA.

### Multi-Part Question Wording

- Show net flat days and profitable-day percentage for July with the same basis.

### Ambiguous Wording

- “Flat” means exact selected-basis day total zero; “scratch” does not create a tolerance. Direct wording needs gross/net clarification when classifications can differ, and bare `FD` remains ticker-safe.

### Negative Examples

- How many trades were within a dollar of flat?; how many days had no trades?; will I have fewer flat days?

### Context Requirements

- Require server-authorized scope, one account, and one currency/timezone-compatible partition with account IANA closing dates.

### Required Data

- Eligible `ready_closed` rows, selected basis, closing UTC/timezone conversion, exact totals, complete day-bucket coverage, and result state.

### Optional Data

- Closing-date range, symbol, direction, provenance, and approved grouping.

### Valid Filters

- Authorized realized filters for closing date, currency, symbol, direction, provenance, and outcome under the typed query contract.

### Valid Groupings

- Supported total, closing week/month/year, symbol, direction, account, provenance, and outcome groups with separately valid day buckets.

### Valid Operators

- Exact-zero count, grouping, comparison, and ranking over valid declared-basis day populations.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Approximate scratch thresholds, breakeven-trade count, zero-filled dates, cross-partition aggregation, causation, behavior, prediction, or advice.

### Default Interpretation

- A direct request asks one gross-versus-net question if classification can differ. Only a Category 1 multi-metric summary uses the accepted summary-basis default.

### Clarification Conditions

- Clarify one field at a time: selected basis first when needed, then an approximate “scratch” threshold or missing period.

### Recommended Clarification Wording

- Should I count exact flat days from gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- Tolerances, incomplete required net fee coverage, unknown fields, unauthorized scope, incompatible partition, or unavailable classification never yield an invented count.

### Target Analytics Tool or Query Capability

- Journal Analytics closing-day grouping and shared accumulator through `journal_analytics_query_v1`.

### Result Units

- Count of exact-zero realized closing dates, with selected basis, coverage, and `complete`, `partial`, `empty`, or `unavailable` state.

### Fee Handling

- Gross needs no fee facts. Net classifies a date only when every eligible row on that date is fee-complete; partial or unavailable coverage is explicit.

### Open-Trade Handling

- Open-only and no-trade dates are excluded and never become zero or flat days; decision rows remain coverage.

### Sample-Size Considerations

- Return the included day count and coverage; it does not establish a cause, tendency, or forecast.

## `percentage_of_profitable_days` Language Registry

### Exact Definition

Percentage of complete selected-basis eligible account-IANA realized closing dates whose total P/L is strictly greater than exact zero, divided only by all classified selected-basis realized closing dates.

### Formal Wording

- Return the profitable realized-day rate with its exact green-day numerator and classified realized-day denominator.

### Normal Conversational Wording

- What percentage of my days were profitable?; what was my profitable-day percentage?

### Trader Slang

- What percent of days were green?; how often did I finish green?

### Abbreviations

- `PDPD` maps only with clear profitable-day-percentage grammar or trusted context; bare `PDPD` and similar short forms are ticker-shaped candidates and never auto-route.

### Common Misspellings

- Percent profitable days; profitable day percent; profitible days percentage.

### Noisy or Incomplete Input

- pdpd july; green day % wk.

### Singular and Plural Forms

- Percentage of profitable days; profitable-day percentage; percent of green days.

### Full Questions

- What was my gross percentage of profitable days in July?; What percent of classified days were green after recorded fees?

### Commands

- Show my profitable-day percentage; calculate net green-day percent.

### Sentence Fragments

- Profitable days percent July; green day % net.

### Follow-Up Wording

- Use gross instead; compare it with June.

### Correction Wording

- I meant profitable-day percentage, not win rate; use the classified day denominator.

### Comparison Wording

- Compare profitable-day percentages for valid periods with the same basis and both denominators.

### Ranking Wording

- Rank valid months by profitable-day percentage only when each classified-day denominator and coverage are shown.

### Negated Wording

- Do not use all calendar days; do not return 0% when no classified realized day exists.

### Exclusion Wording

- Exclude NVDA; leave out the selected closing-date range.

### Multi-Filter Wording

- Show gross profitable-day percentage for long NVDA round trips in July, excluding AAPL.

### Multi-Part Question Wording

- Show net profitable-day percentage, green days, and classified-day denominator for July.

### Ambiguous Wording

- “Profitable-day percentage” is day-level, not `win_rate`; direct wording needs gross/net clarification when classification can differ, and bare `PDPD` is not a safe route.

### Negative Examples

- What percentage of trades won?; what percent of calendar days had activity?; will my profitable-day rate improve?

### Context Requirements

- Require server-authorized scope, one account, and one currency/timezone-compatible partition with account IANA closing dates and a nonzero classified-day denominator.

### Required Data

- Eligible `ready_closed` rows, selected basis, complete classified closing-date buckets, exact numerator/denominator, fee coverage, and result state.

### Optional Data

- Closing-date range, symbol, direction, provenance, and approved grouping.

### Valid Filters

- Authorized realized filters for closing date, currency, symbol, direction, provenance, and outcome under the typed query contract.

### Valid Groupings

- Supported total, closing week/month/year, symbol, direction, account, provenance, and outcome groups with independent classified-day denominators.

### Valid Operators

- Exact division, percentage display, grouping, comparison, and ranking with one declared basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Win rate, calendar-day occupancy, zero denominator, cross-partition aggregation, causation, behavior, prediction, or advice.

### Default Interpretation

- A direct request asks one gross-versus-net question if classification can differ. Only a Category 1 multi-metric summary uses the accepted summary-basis default.

### Clarification Conditions

- Clarify one field at a time: selected basis first when needed, then missing period or valid comparison target.

### Recommended Clarification Wording

- Should I calculate profitable-day percentage from gross P/L before fees or net P/L after recorded fees?

### Unsupported Conditions

- A zero classified-day denominator is `unavailable`; incomplete required net fee coverage, unknown fields, unauthorized scope, or incompatible partition never produce a guessed percentage.

### Target Analytics Tool or Query Capability

- Journal Analytics closing-day grouping and shared accumulator through `journal_analytics_query_v1`.

### Result Units

- Exact ratio and display percentage with green-day numerator, classified realized-day denominator, selected basis, coverage, and result state.

### Fee Handling

- Gross needs no fee facts. Net includes a date only when every eligible row for that date is fee-complete; partial or unavailable coverage is explicit.

### Open-Trade Handling

- Open-only and no-trade dates enter neither numerator nor denominator and are never zero-filled; decision rows remain coverage.

### Sample-Size Considerations

- Always show numerator and denominator; observed frequency is not a probability forecast or recommendation.

## `consecutive_wins` Language Registry

### Exact Definition

Length of the current/ending contiguous positive selected-basis realized-outcome run in eligible current `ready_closed` round trips ordered by close UTC instant and then stable round-trip ID.

### Formal Wording

- Return the terminal winning-run length over the declared gross or fee-complete net realized sequence.

### Normal Conversational Wording

- How many wins in a row am I on?; what is my current win streak?

### Trader Slang

- How hot am I?; how many dubs straight?

### Abbreviations

- `CW` maps only with clear consecutive-win grammar or trusted context; bare `CW` is ticker-shaped and never auto-routes.

### Common Misspellings

- Consequtive wins; consecutive winz; current win streak.

### Noisy or Incomplete Input

- cw now; wins in row.

### Singular and Plural Forms

- Consecutive win; consecutive wins; current win streak; wins in a row.

### Full Questions

- What is my gross current win streak?; How many net wins in a row am I ending on?

### Commands

- Show current consecutive wins; calculate my net ending win run.

### Sentence Fragments

- Current wins; cw gross.

### Follow-Up Wording

- Use net; now show the longest historical win streak.

### Correction Wording

- I meant my current streak, not the longest streak; count round trips, not days.

### Comparison Wording

- Compare current ending win streaks for valid separately ordered periods with the same basis.

### Ranking Wording

- Rank valid groups by current ending win streak only when each group has its own declared sequence boundary.

### Negated Wording

- Do not bridge across a flat, loss, unknown, unavailable, or non-classifiable outcome; do not include opens.

### Exclusion Wording

- Exclude NVDA; leave out the selected closing-date range before ordering the remaining sequence.

### Multi-Filter Wording

- Show gross consecutive wins for long NVDA round trips in July, excluding AAPL.

### Multi-Part Question Wording

- Show my net current win streak and maximum win streak with the same basis.

### Ambiguous Wording

- “Consecutive wins” means the current/ending run. “Streak” alone needs a one-field current-versus-maximum clarification; direct basis wording follows gross/net policy, and bare `CW` remains ticker-safe.

### Negative Examples

- What is my longest win streak?; how many total winners?; why am I on a streak?

### Context Requirements

- Require server-authorized scope, one account and currency-compatible partition, selected basis, and deterministic close ordering.

### Required Data

- Eligible `ready_closed` rows, selected-basis classification, fee coverage where net, close UTC instant, stable round-trip ID, barriers, and result state.

### Optional Data

- Closing-date range, symbol, direction, provenance, selected context, and approved grouping.

### Valid Filters

- Authorized realized filters for closing date, currency, symbol, direction, provenance, and outcome that leave a valid ordered sequence.

### Valid Groupings

- Supported total, closing period, symbol, direction, account, and provenance groups when each has an independent ordered sequence boundary.

### Valid Operators

- Terminal contiguous-run calculation, grouping, comparison, and ranking with stable order and declared basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Maximum streak without clarification, day streak, dropped barriers, open/decision rows, cross-partition aggregation, causation, behavior, prediction, or advice.

### Default Interpretation

- “Consecutive wins” is current/ending. A direct request asks one gross-versus-net question if classification can differ; only a Category 1 multi-metric summary uses the summary-basis default.

### Clarification Conditions

- Ask current versus maximum only for “streak” alone; otherwise clarify selected basis first when needed, then one missing field at a time.

### Recommended Clarification Wording

- Do you mean your current ending win streak or your longest historical win streak?

### Unsupported Conditions

- Incomplete required net fee coverage, unstable ordering, unknown fields, unauthorized scope, or unavailable/non-classifiable outcomes never get dropped or bridged.

### Target Analytics Tool or Query Capability

- Journal Analytics ordered realized-sequence/streak path through `journal_analytics_query_v1`.

### Result Units

- Count of consecutive round trips, with selected basis, ordering, barrier coverage, and `complete`, `partial`, `empty`, or `unavailable` state.

### Fee Handling

- Gross needs no fee facts. Net requires fee-complete classification; incomplete, unknown, or unavailable outcomes remain explicit barriers and coverage.

### Open-Trade Handling

- Open and decision rows are excluded from realized outcomes and reported as coverage; they are not wins, zeroes, or bridges.

### Sample-Size Considerations

- Show the sequence scope and barriers. A run length is descriptive only and does not prove skill or predict the next trade.

## `consecutive_losses` Language Registry

### Exact Definition

Length of the current/ending contiguous negative selected-basis realized-outcome run in eligible current `ready_closed` round trips ordered by close UTC instant and then stable round-trip ID.

### Formal Wording

- Return the terminal losing-run length over the declared gross or fee-complete net realized sequence.

### Normal Conversational Wording

- How many losses in a row am I on?; what is my current loss streak?

### Trader Slang

- How cold am I?; how many Ls straight?

### Abbreviations

- `CL` maps only with clear consecutive-loss grammar or trusted context; bare `CL` is ticker-shaped and never auto-routes.

### Common Misspellings

- Consequtive losses; consecutive lossess; current loss streak.

### Noisy or Incomplete Input

- cl now; losses in row.

### Singular and Plural Forms

- Consecutive loss; consecutive losses; current loss streak; losses in a row.

### Full Questions

- What is my gross current loss streak?; How many net losses in a row am I ending on?

### Commands

- Show current consecutive losses; calculate my net ending loss run.

### Sentence Fragments

- Current losses; cl gross.

### Follow-Up Wording

- Use net; now show the longest historical loss streak.

### Correction Wording

- I meant my current streak, not the longest streak; count round trips, not days.

### Comparison Wording

- Compare current ending loss streaks for valid separately ordered periods with the same basis.

### Ranking Wording

- Rank valid groups by current ending loss streak only when each group has its own declared sequence boundary.

### Negated Wording

- Do not bridge across a flat, win, unknown, unavailable, or non-classifiable outcome; do not include opens.

### Exclusion Wording

- Exclude NVDA; leave out the selected closing-date range before ordering the remaining sequence.

### Multi-Filter Wording

- Show gross consecutive losses for short NVDA round trips in July, excluding AAPL.

### Multi-Part Question Wording

- Show my net current loss streak and maximum loss streak with the same basis.

### Ambiguous Wording

- “Consecutive losses” means the current/ending run. “Streak” alone needs a one-field current-versus-maximum clarification; direct basis wording follows gross/net policy, and bare `CL` remains ticker-safe.

### Negative Examples

- What is my longest loss streak?; how many total losers?; tell me what to do after losses.

### Context Requirements

- Require server-authorized scope, one account and currency-compatible partition, selected basis, and deterministic close ordering.

### Required Data

- Eligible `ready_closed` rows, selected-basis classification, fee coverage where net, close UTC instant, stable round-trip ID, barriers, and result state.

### Optional Data

- Closing-date range, symbol, direction, provenance, selected context, and approved grouping.

### Valid Filters

- Authorized realized filters for closing date, currency, symbol, direction, provenance, and outcome that leave a valid ordered sequence.

### Valid Groupings

- Supported total, closing period, symbol, direction, account, and provenance groups when each has an independent ordered sequence boundary.

### Valid Operators

- Terminal contiguous-run calculation, grouping, comparison, and ranking with stable order and declared basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Maximum streak without clarification, day streak, dropped barriers, open/decision rows, cross-partition aggregation, causation, behavior, prediction, or advice.

### Default Interpretation

- “Consecutive losses” is current/ending. A direct request asks one gross-versus-net question if classification can differ; only a Category 1 multi-metric summary uses the summary-basis default.

### Clarification Conditions

- Ask current versus maximum only for “streak” alone; otherwise clarify selected basis first when needed, then one missing field at a time.

### Recommended Clarification Wording

- Do you mean your current ending loss streak or your longest historical loss streak?

### Unsupported Conditions

- Incomplete required net fee coverage, unstable ordering, unknown fields, unauthorized scope, or unavailable/non-classifiable outcomes never get dropped or bridged.

### Target Analytics Tool or Query Capability

- Journal Analytics ordered realized-sequence/streak path through `journal_analytics_query_v1`.

### Result Units

- Count of consecutive round trips, with selected basis, ordering, barrier coverage, and `complete`, `partial`, `empty`, or `unavailable` state.

### Fee Handling

- Gross needs no fee facts. Net requires fee-complete classification; incomplete, unknown, or unavailable outcomes remain explicit barriers and coverage.

### Open-Trade Handling

- Open and decision rows are excluded from realized outcomes and reported as coverage; they are not losses, zeroes, or bridges.

### Sample-Size Considerations

- Show the sequence scope and barriers. A run length is descriptive only and does not prove behavior or predict the next trade.

## `maximum_win_streak` Language Registry

### Exact Definition

Greatest historical contiguous positive selected-basis realized-outcome run in eligible current `ready_closed` round trips ordered by close UTC instant and then stable round-trip ID.

### Formal Wording

- Return the longest historical winning-run length over the declared gross or fee-complete net realized sequence.

### Normal Conversational Wording

- What was my longest win streak?; what is my maximum run of wins?

### Trader Slang

- What was my biggest heater?; longest hot streak?

### Abbreviations

- `MWS` maps only with clear maximum-win-streak grammar or trusted context; bare `MWS` and similar short forms are ticker-shaped candidates and never auto-route.

### Common Misspellings

- Max win streak; maximum win streek; longest winstreak.

### Noisy or Incomplete Input

- mws july; biggest heater.

### Singular and Plural Forms

- Maximum win streak; max win streak; longest winning run.

### Full Questions

- What was my gross maximum win streak in July?; What was my longest net winning run?

### Commands

- Show maximum win streak; calculate my net longest winning run.

### Sentence Fragments

- Longest wins; mws gross.

### Follow-Up Wording

- Use net; now show my current win streak.

### Correction Wording

- I meant the longest historical streak, not my current ending run; count round trips, not days.

### Comparison Wording

- Compare maximum win streaks for valid separately ordered periods with the same basis.

### Ranking Wording

- Rank valid groups by maximum win streak only when each group has its own declared sequence boundary.

### Negated Wording

- Do not bridge across a flat, loss, unknown, unavailable, or non-classifiable outcome; do not include opens.

### Exclusion Wording

- Exclude NVDA; leave out the selected closing-date range before ordering the remaining sequence.

### Multi-Filter Wording

- Show gross maximum win streak for long NVDA round trips in July, excluding AAPL.

### Multi-Part Question Wording

- Show my net maximum win streak and current win streak with the same basis.

### Ambiguous Wording

- “Maximum” and “longest” mean historical. “Streak” alone needs a one-field current-versus-maximum clarification; direct basis wording follows gross/net policy, and bare `MWS` remains ticker-safe.

### Negative Examples

- What is my current win streak?; how many total winners?; does my heater mean I should size up?

### Context Requirements

- Require server-authorized scope, one account and currency-compatible partition, selected basis, and deterministic close ordering.

### Required Data

- Eligible `ready_closed` rows, selected-basis classification, fee coverage where net, close UTC instant, stable round-trip ID, barriers, and result state.

### Optional Data

- Closing-date range, symbol, direction, provenance, selected context, and approved grouping.

### Valid Filters

- Authorized realized filters for closing date, currency, symbol, direction, provenance, and outcome that leave a valid ordered sequence.

### Valid Groupings

- Supported total, closing period, symbol, direction, account, and provenance groups when each has an independent ordered sequence boundary.

### Valid Operators

- Historical maximum contiguous-run calculation, grouping, comparison, and ranking with stable order and declared basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Current streak without clarification, day streak, dropped barriers, open/decision rows, cross-partition aggregation, causation, behavior, prediction, or advice.

### Default Interpretation

- “Maximum win streak” is the longest historical run. A direct request asks one gross-versus-net question if classification can differ; only a Category 1 multi-metric summary uses the summary-basis default.

### Clarification Conditions

- Ask current versus maximum only for “streak” alone; otherwise clarify selected basis first when needed, then one missing field at a time.

### Recommended Clarification Wording

- Do you mean your current ending win streak or your longest historical win streak?

### Unsupported Conditions

- Incomplete required net fee coverage, unstable ordering, unknown fields, unauthorized scope, or unavailable/non-classifiable outcomes never get dropped or bridged.

### Target Analytics Tool or Query Capability

- Journal Analytics ordered realized-sequence/streak path through `journal_analytics_query_v1`.

### Result Units

- Count of consecutive round trips, with selected basis, ordering, barrier coverage, and `complete`, `partial`, `empty`, or `unavailable` state.

### Fee Handling

- Gross needs no fee facts. Net requires fee-complete classification; incomplete, unknown, or unavailable outcomes remain explicit barriers and coverage.

### Open-Trade Handling

- Open and decision rows are excluded from realized outcomes and reported as coverage; they are not wins, zeroes, or bridges.

### Sample-Size Considerations

- Show the sequence scope and barriers. A maximum run is descriptive only and does not prove skill or predict the next trade.

## `maximum_loss_streak` Language Registry

### Exact Definition

Greatest historical contiguous negative selected-basis realized-outcome run in eligible current `ready_closed` round trips ordered by close UTC instant and then stable round-trip ID.

### Formal Wording

- Return the longest historical losing-run length over the declared gross or fee-complete net realized sequence.

### Normal Conversational Wording

- What was my longest loss streak?; what is my maximum run of losses?

### Trader Slang

- What was my biggest skid?; longest cold streak?

### Abbreviations

- `MLS` maps only with clear maximum-loss-streak grammar or trusted context; bare `MLS` and similar short forms are ticker-shaped candidates and never auto-route.

### Common Misspellings

- Max loss streak; maximum loss streek; longest lossstreak.

### Noisy or Incomplete Input

- mls july; biggest skid.

### Singular and Plural Forms

- Maximum loss streak; max loss streak; longest losing run.

### Full Questions

- What was my gross maximum loss streak in July?; What was my longest net losing run?

### Commands

- Show maximum loss streak; calculate my net longest losing run.

### Sentence Fragments

- Longest losses; mls gross.

### Follow-Up Wording

- Use net; now show my current loss streak.

### Correction Wording

- I meant the longest historical streak, not my current ending run; count round trips, not days.

### Comparison Wording

- Compare maximum loss streaks for valid separately ordered periods with the same basis.

### Ranking Wording

- Rank valid groups by maximum loss streak only when each group has its own declared sequence boundary.

### Negated Wording

- Do not bridge across a flat, win, unknown, unavailable, or non-classifiable outcome; do not include opens.

### Exclusion Wording

- Exclude NVDA; leave out the selected closing-date range before ordering the remaining sequence.

### Multi-Filter Wording

- Show gross maximum loss streak for short NVDA round trips in July, excluding AAPL.

### Multi-Part Question Wording

- Show my net maximum loss streak and current loss streak with the same basis.

### Ambiguous Wording

- “Maximum” and “longest” mean historical. “Streak” alone needs a one-field current-versus-maximum clarification; direct basis wording follows gross/net policy, and bare `MLS` remains ticker-safe.

### Negative Examples

- What is my current loss streak?; how many total losers?; what should I do after a skid?

### Context Requirements

- Require server-authorized scope, one account and currency-compatible partition, selected basis, and deterministic close ordering.

### Required Data

- Eligible `ready_closed` rows, selected-basis classification, fee coverage where net, close UTC instant, stable round-trip ID, barriers, and result state.

### Optional Data

- Closing-date range, symbol, direction, provenance, selected context, and approved grouping.

### Valid Filters

- Authorized realized filters for closing date, currency, symbol, direction, provenance, and outcome that leave a valid ordered sequence.

### Valid Groupings

- Supported total, closing period, symbol, direction, account, and provenance groups when each has an independent ordered sequence boundary.

### Valid Operators

- Historical maximum contiguous-run calculation, grouping, comparison, and ranking with stable order and declared basis.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `group_and_aggregate`, `compare_groups`, `rank_results`, and `explain_result`.

### Incompatible Combinations

- Current streak without clarification, day streak, dropped barriers, open/decision rows, cross-partition aggregation, causation, behavior, prediction, or advice.

### Default Interpretation

- “Maximum loss streak” is the longest historical run. A direct request asks one gross-versus-net question if classification can differ; only a Category 1 multi-metric summary uses the summary-basis default.

### Clarification Conditions

- Ask current versus maximum only for “streak” alone; otherwise clarify selected basis first when needed, then one missing field at a time.

### Recommended Clarification Wording

- Do you mean your current ending loss streak or your longest historical loss streak?

### Unsupported Conditions

- Incomplete required net fee coverage, unstable ordering, unknown fields, unauthorized scope, or unavailable/non-classifiable outcomes never get dropped or bridged.

### Target Analytics Tool or Query Capability

- Journal Analytics ordered realized-sequence/streak path through `journal_analytics_query_v1`.

### Result Units

- Count of consecutive round trips, with selected basis, ordering, barrier coverage, and `complete`, `partial`, `empty`, or `unavailable` state.

### Fee Handling

- Gross needs no fee facts. Net requires fee-complete classification; incomplete, unknown, or unavailable outcomes remain explicit barriers and coverage.

### Open-Trade Handling

- Open and decision rows are excluded from realized outcomes and reported as coverage; they are not losses, zeroes, or bridges.

### Sample-Size Considerations

- Show the sequence scope and barriers. A maximum run is descriptive only and does not prove behavior or predict the next trade.

---

# 7. Evaluation Cases Deliverable

Evaluation Batches 1 through 6 contain 374 reviewed and passing cases for
C3-OUT-001 through C3-OUT-017. Independent Terra review returned a final PASS,
and the lead project controller approved and locked the Version 1 category.

## 7.1 Evaluation Case Schema

Each saved object uses the locked Category 2 21-field schema and key order.

## 7.2 Required Case Types

Each concept has the exact 22 required case types, in their locked order.

## 7.3 Evaluation Summary

| Case Type | Required | Completed | Passed | Notes |
|---|---:|---:|---:|---|
| Canonical | 17 | 17 | 17 | C3-E1-01 through C3-E17-01 passed final independent review. |
| Formal paraphrase | 17 | 17 | 17 | C3-E1-02 through C3-E17-02 passed final independent review. |
| Conversational paraphrase | 17 | 17 | 17 | C3-E1-03 through C3-E17-03 passed final independent review. |
| Slang | 17 | 17 | 17 | C3-E1-04 through C3-E17-04 passed final independent review. |
| Abbreviations | 17 | 17 | 17 | C3-E1-05 through C3-E17-05 passed final independent review. |
| Misspelling | 17 | 17 | 17 | C3-E1-06 through C3-E17-06 passed final independent review. |
| Noisy input | 17 | 17 | 17 | C3-E1-07 through C3-E17-07 passed final independent review. |
| Commands | 17 | 17 | 17 | C3-E1-08 through C3-E17-08 passed final independent review. |
| Fragments | 17 | 17 | 17 | C3-E1-09 through C3-E17-09 passed final independent review. |
| Follow-ups | 17 | 17 | 17 | C3-E1-10 through C3-E17-10 passed final independent review. |
| Corrections | 17 | 17 | 17 | C3-E1-11 through C3-E17-11 passed final independent review. |
| Comparisons | 17 | 17 | 17 | C3-E1-12 through C3-E17-12 passed final independent review. |
| Rankings | 17 | 17 | 17 | C3-E1-13 through C3-E17-13 passed final independent review. |
| Negation | 17 | 17 | 17 | C3-E1-14 through C3-E17-14 passed final independent review. |
| Exclusion | 17 | 17 | 17 | C3-E1-15 through C3-E17-15 passed final independent review. |
| Multi-filter | 17 | 17 | 17 | C3-E1-16 through C3-E17-16 passed final independent review. |
| Multi-part | 17 | 17 | 17 | C3-E1-17 through C3-E17-17 passed final independent review. |
| Ambiguity | 17 | 17 | 17 | C3-E1-18 through C3-E17-18 passed final independent review. |
| Negative examples | 17 | 17 | 17 | C3-E1-19 through C3-E17-19 passed final independent review. |
| Unsupported data | 17 | 17 | 17 | C3-E1-20 through C3-E17-20 passed final independent review. |
| Selected entity | 17 | 17 | 17 | C3-E1-21 through C3-E17-21 passed final independent review. |
| Cross-category | 17 | 17 | 17 | C3-E1-22 through C3-E17-22 passed final independent review. |

## 7.4 Structured Evaluation Arrays

### trade_count

```json
[
{"caseId":"C3-E1-01","caseType":"canonical","input":"Show my trade count for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Defaults to the exact eligible ready_closed count, the same population as closed_trades; it is not a second calculation."},
{"caseId":"C3-E1-02","caseType":"formal_paraphrase","input":"Determine the number of eligible closed round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["eligible ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Closed round trips are the eligible realized population."},
{"caseId":"C3-E1-03","caseType":"conversational_paraphrase","input":"How many trades did I close last week?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","last week"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational closed-trade wording retains the ready_closed default."},
{"caseId":"C3-E1-04","caseType":"trader_slang","input":"How many roundies did I finish today?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","today"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"today","expectedSelectedEntity":null,"expectedContextRequirements":["trusted today boundary","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Finish wording is resolved as closed round trips, not executions."},
{"caseId":"C3-E1-05","caseType":"abbreviation","input":"TC for July closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit trade-count grammar","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"TC is accepted only with explicit closed-trade grammar; bare abbreviations remain symbol-safe."},
{"caseId":"C3-E1-06","caseType":"misspelling","input":"How many clsoed trades were there in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the misspelling without altering population."},
{"caseId":"C3-E1-07","caseType":"noisy_input","input":"trade count july closed only pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not add open positions or execution rows."},
{"caseId":"C3-E1-08","caseType":"command","input":"Count my closed trades for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","June"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One read-only count."},
{"caseId":"C3-E1-09","caseType":"fragment","input":"Closed trades this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","this month"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},
{"caseId":"C3-E1-10","caseType":"follow_up","input":"How many of those closed trades were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["prior closed-trade population"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior population context."},
{"caseId":"C3-E1-11","caseType":"correction","input":"I meant closed trades, not executions, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count","population correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects round trips rather than execution records."},
{"caseId":"C3-E1-12","caseType":"comparison","input":"Compare my July and June closed-trade counts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July","June"],"expectedGroupings":[],"expectedOperators":["count","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"eligible ready_closed count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","same currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison preserves one count definition."},
{"caseId":"C3-E1-13","caseType":"ranking","input":"Which ticker had the most closed trades in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July"],"expectedGroupings":["ticker"],"expectedOperators":["count","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is ticker-grouped closed-trade count."},
{"caseId":"C3-E1-14","caseType":"negation","input":"Count trades that are not still open this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","this month"],"expectedGroupings":[],"expectedOperators":["count","exclude open"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open positions never enter the realized count."},
{"caseId":"C3-E1-15","caseType":"exclusion","input":"Show July trade count excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["count","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is visible and does not affect unresolved decisions."},
{"caseId":"C3-E1-16","caseType":"multi_filter","input":"Count July closed long trades in regular hours.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July","long","regular hours"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["session definition","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters narrow the same eligible realized population."},
{"caseId":"C3-E1-17","caseType":"multi_part","input":"Count closed trades by currency and show a labelled all-currency total for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July"],"expectedGroupings":["trade currency"],"expectedOperators":["count","group by","labelled cross-currency total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["currency partitions","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Counts may be summed only as an explicitly labelled cross-currency total; no currency amounts are merged."},
{"caseId":"C3-E1-18","caseType":"ambiguous","input":"How many trades did I make in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Defaults to the exact eligible ready_closed count, the same population as closed_trades; it is not a second calculation."},
{"caseId":"C3-E1-19","caseType":"negative_example","input":"How many trades caused my July loss?","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["July"],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A trade count cannot establish what caused an outcome.","notes":"Negative example rejects causation rather than inventing a count."},
{"caseId":"C3-E1-20","caseType":"unsupported_data","input":"Count July candidates still awaiting a Data Decision as closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["needs_decision","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["Data Decision coverage","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Pending-decision candidates are not eligible ready_closed trades and cannot be classified as closed.","notes":"No fallback classification is allowed."},
{"caseId":"C3-E1-21","caseType":"selected_entity_context","input":"How many closed trades are in the selected review period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","selected review period"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context must be trusted and account-scoped."},
{"caseId":"C3-E1-22","caseType":"cross_category","input":"Explain the difference between my July trade count and June.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["trade_count"],"expectedFilters":["ready_closed","July","June"],"expectedGroupings":[],"expectedOperators":["count","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"eligible ready_closed count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain_result may describe documented count differences without assigning cause."}
]
```

### winning_trades

```json
[
{"caseId":"C3-E2-01","caseType":"canonical","input":"Show my gross winning trades for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","open and decision exclusion"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only eligible ready_closed trades with direct gross P/L above exact zero."},
{"caseId":"C3-E2-02","caseType":"formal_paraphrase","input":"Determine the count of eligible realized trades with positive gross P/L in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Positive is strict exact-basis comparison."},
{"caseId":"C3-E2-03","caseType":"conversational_paraphrase","input":"How many winners did I have last week before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","last week"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Before fees explicitly selects gross basis."},
{"caseId":"C3-E2-04","caseType":"trader_slang","input":"How many green trades did I close in June gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","June"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Green means positive declared gross P/L, not a recommendation."},
{"caseId":"C3-E2-05","caseType":"abbreviation","input":"WT for July gross winners.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit winning-trades grammar","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"WT is safe only with metric grammar; bare tokens remain symbol-safe."},
{"caseId":"C3-E2-06","caseType":"misspelling","input":"How many winnng trades were gross positive in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing basis."},
{"caseId":"C3-E2-07","caseType":"noisy_input","input":"winners july gross closed only pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not include open or candidate records."},
{"caseId":"C3-E2-08","caseType":"command","input":"Count my gross winners for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Read-only outcome count."},
{"caseId":"C3-E2-09","caseType":"fragment","input":"Gross winners, this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","this month"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment has direct basis."},
{"caseId":"C3-E2-10","caseType":"follow_up","input":"How many of those were winners on a gross basis?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["prior ready_closed population","gross P/L greater than exact zero"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior population","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses prior trusted range with explicit gross basis."},
{"caseId":"C3-E2-11","caseType":"correction","input":"Use gross winners, not net winners, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes only selected basis."},
{"caseId":"C3-E2-12","caseType":"comparison","input":"Compare gross winning-trade counts for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross winning-trade count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same gross basis","same currency partition","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both periods use the same exact gross threshold."},
{"caseId":"C3-E2-13","caseType":"ranking","input":"Which ticker had the most gross winners in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["count","greater than zero","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker ranking counts only gross-positive ready_closed trades."},
{"caseId":"C3-E2-14","caseType":"negation","input":"Count July trades that were not gross losers.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L not less than zero","July"],"expectedGroupings":[],"expectedOperators":["count","not less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["exact zero distinction","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Not losing includes flat trades and is not the winning_trades metric.","notes":"Negation must not silently turn non-losses into wins."},
{"caseId":"C3-E2-15","caseType":"exclusion","input":"Show July gross winners excluding AMD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July","exclude AMD"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["AMD symbol resolution","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion applies before count."},
{"caseId":"C3-E2-16","caseType":"multi_filter","input":"Count July gross winners for long QQQ trades in regular hours.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July","long","QQQ","regular hours"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["QQQ symbol resolution","session definition","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All filters preserve direct gross outcome basis."},
{"caseId":"C3-E2-17","caseType":"multi_part","input":"Count July gross winners by ticker and show the sample size.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["count","greater than zero","group by","sample size"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["coverage counts","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouped results retain population coverage."},
{"caseId":"C3-E2-18","caseType":"ambiguous","input":"How many winning trades did I have in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["gross or fee-complete net basis","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should winning mean gross P/L or fee-complete net P/L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One focused basis clarification; no candidate result is imposed."},
{"caseId":"C3-E2-19","caseType":"negative_example","input":"How many winners prove my strategy will work next month?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no prediction or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A winning-trade count cannot prove future performance or provide trading advice.","notes":"The metric may be counted separately, but the predictive claim is unsupported."},
{"caseId":"C3-E2-20","caseType":"unsupported_data","input":"Count my July net winners where fee records are incomplete.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","net P/L","incomplete fees","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net basis","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Net outcome classification is unavailable for affected trades without complete fee evidence; do not fall back to gross.","notes":"Partial fee coverage remains explicit."},
{"caseId":"C3-E2-21","caseType":"selected_entity_context","input":"How many gross winners are in the selected review period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","selected review period"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected period context is trusted, not user-controlled account scope."},
{"caseId":"C3-E2-22","caseType":"cross_category","input":"Explain why my gross winner count changed from June to July.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["winning_trades"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","June","July"],"expectedGroupings":[],"expectedOperators":["count","greater than zero","period comparison"],"expectedComparison":{"left":"June","right":"July","basis":"gross winning-trade count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented differences without attributing cause."}
]
```

### losing_trades

```json
[
{"caseId":"C3-E3-01","caseType":"canonical","input":"Show my gross losing trades for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","open and decision exclusion"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count only eligible ready_closed trades with direct gross P/L below exact zero."},
{"caseId":"C3-E3-02","caseType":"formal_paraphrase","input":"Determine the count of eligible realized trades with negative gross P/L in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negative is a strict exact-basis comparison."},
{"caseId":"C3-E3-03","caseType":"conversational_paraphrase","input":"How many losers did I have last week before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","last week"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Before fees explicitly selects gross basis."},
{"caseId":"C3-E3-04","caseType":"trader_slang","input":"How many red trades did I close in June gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","June"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Red means negative declared gross P/L, not causation or advice."},
{"caseId":"C3-E3-05","caseType":"abbreviation","input":"LT for July gross losers.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit losing-trades grammar","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"LT is safe only with explicit metric grammar; bare tokens remain symbol-safe."},
{"caseId":"C3-E3-06","caseType":"misspelling","input":"How many losng trades were gross negative in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing basis."},
{"caseId":"C3-E3-07","caseType":"noisy_input","input":"losers july gross closed only pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not include open or candidate records."},
{"caseId":"C3-E3-08","caseType":"command","input":"Count my gross losers for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Read-only outcome count."},
{"caseId":"C3-E3-09","caseType":"fragment","input":"Gross losers, this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","this month"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment has direct basis."},
{"caseId":"C3-E3-10","caseType":"follow_up","input":"How many of those were losers on a gross basis?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["prior ready_closed population","gross P/L less than exact zero"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior population","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses prior trusted range with explicit gross basis."},
{"caseId":"C3-E3-11","caseType":"correction","input":"Use gross losers, not net losers, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes only selected basis."},
{"caseId":"C3-E3-12","caseType":"comparison","input":"Compare gross losing-trade counts for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","less than zero","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross losing-trade count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same gross basis","same currency partition","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both periods use the same exact gross threshold."},
{"caseId":"C3-E3-13","caseType":"ranking","input":"Which ticker had the most gross losers in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["count","less than zero","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker ranking counts only gross-negative ready_closed trades."},
{"caseId":"C3-E3-14","caseType":"negation","input":"Count July trades that were not gross winners.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L not greater than zero","July"],"expectedGroupings":[],"expectedOperators":["count","not greater than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["exact zero distinction","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Not winning includes flat trades and is not the losing_trades metric.","notes":"Negation must not silently turn non-winners into losses."},
{"caseId":"C3-E3-15","caseType":"exclusion","input":"Show July gross losers excluding TSLA.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July","exclude TSLA"],"expectedGroupings":[],"expectedOperators":["count","less than zero","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["TSLA symbol resolution","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion applies before count."},
{"caseId":"C3-E3-16","caseType":"multi_filter","input":"Count July gross losers for short NVDA trades in regular hours.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July","short","NVDA","regular hours"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","session definition","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All filters preserve direct gross outcome basis."},
{"caseId":"C3-E3-17","caseType":"multi_part","input":"Count July gross losers by ticker and show the sample size.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["count","less than zero","group by","sample size"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["coverage counts","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouped results retain population coverage."},
{"caseId":"C3-E3-18","caseType":"ambiguous","input":"How many losing trades did I have in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["gross or fee-complete net basis","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should losing mean gross P/L or fee-complete net P/L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One focused basis clarification; no candidate result is imposed."},
{"caseId":"C3-E3-19","caseType":"negative_example","input":"How many losers prove I should stop trading?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A losing-trade count cannot determine trading advice.","notes":"The metric does not prescribe action."},
{"caseId":"C3-E3-20","caseType":"unsupported_data","input":"Count my July net losers where fee records are incomplete.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","net P/L","incomplete fees","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net basis","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Net outcome classification is unavailable for affected trades without complete fee evidence; do not fall back to gross.","notes":"Partial fee coverage remains explicit."},
{"caseId":"C3-E3-21","caseType":"selected_entity_context","input":"How many gross losers are in the selected review period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","selected review period"],"expectedGroupings":[],"expectedOperators":["count","less than zero","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected period context is trusted and account-scoped."},
{"caseId":"C3-E3-22","caseType":"cross_category","input":"Explain why my gross loser count changed from June to July.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["ready_closed","gross P/L less than exact zero","June","July"],"expectedGroupings":[],"expectedOperators":["count","less than zero","period comparison"],"expectedComparison":{"left":"June","right":"July","basis":"gross losing-trade count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented differences without attributing cause."}
]
```

### breakeven_trades

```json
[
{"caseId":"C3-E4-01","caseType":"canonical","input":"Show my gross breakeven trades for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","open and decision exclusion"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Breakeven is direct gross P/L equal to exact zero only."},
{"caseId":"C3-E4-02","caseType":"formal_paraphrase","input":"Determine eligible realized trades whose declared gross basis is exactly zero in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The equality threshold is exact, not rounded display zero."},
{"caseId":"C3-E4-03","caseType":"conversational_paraphrase","input":"How many flat trades did I close last week before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","last week"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Before fees explicitly selects gross; net classification can differ."},
{"caseId":"C3-E4-04","caseType":"trader_slang","input":"How many scratches were exact net zero this month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","fee-complete net P/L equals exact zero","this month"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","net"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net evidence","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Scratch is accepted only where exact selected net P/L is zero."},
{"caseId":"C3-E4-05","caseType":"abbreviation","input":"BE trades, gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit breakeven-trades grammar","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"BE is accepted only with explicit metric grammar; bare ticker-shaped text is safe."},
{"caseId":"C3-E4-06","caseType":"misspelling","input":"How many breakevenn trades were gross zero in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing the exact-zero rule."},
{"caseId":"C3-E4-07","caseType":"noisy_input","input":"flat trades july gross exact zero pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not introduce approximate scratch handling."},
{"caseId":"C3-E4-08","caseType":"command","input":"Count my fee-complete net breakeven trades for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","fee-complete net P/L equals exact zero","June"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","net"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net evidence","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One read-only exact net-zero count."},
{"caseId":"C3-E4-09","caseType":"fragment","input":"Gross flat trades, this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","this month"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A bounded fragment with explicit basis is sufficient."},
{"caseId":"C3-E4-10","caseType":"follow_up","input":"How many of those were exactly net flat?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["prior ready_closed population","fee-complete net P/L equals exact zero"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","net"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior population","fee-complete net evidence","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses trusted prior scope and does not estimate missing fees."},
{"caseId":"C3-E4-11","caseType":"correction","input":"Use net breakeven trades, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","fee-complete net P/L equals exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","net basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","fee-complete net evidence","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction can change classification because gross and net differ."},
{"caseId":"C3-E4-12","caseType":"comparison","input":"Compare July and June gross breakeven-trade counts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross breakeven-trade count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same gross basis","same currency partition","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both periods retain the same exact gross-zero classification."},
{"caseId":"C3-E4-13","caseType":"ranking","input":"Which ticker had the most gross breakeven trades in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["count","equals exact zero","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is a valid ticker-grouped exact-zero count."},
{"caseId":"C3-E4-14","caseType":"negation","input":"Count July trades that were not gross winners or losers.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["exact zero distinction","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Neither positive nor negative maps to exact zero, never a rounded value."},
{"caseId":"C3-E4-15","caseType":"exclusion","input":"Show July gross breakeven trades excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is applied before the exact-zero count."},
{"caseId":"C3-E4-16","caseType":"multi_filter","input":"Count July gross breakeven long trades in regular hours.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July","long","regular hours"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["session definition","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters narrow the same direct-basis population."},
{"caseId":"C3-E4-17","caseType":"multi_part","input":"Count July gross breakeven trades by currency and show a labelled all-currency total.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","July"],"expectedGroupings":["trade currency"],"expectedOperators":["count","equals exact zero","group by","omit combined total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["separate currency partitions","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Selected-basis breakeven classifications must remain separated by trade currency; return the currency groups and omit the combined total.","notes":"Return separate per-currency breakeven counts and refuse the requested all-currency total."},
{"caseId":"C3-E4-18","caseType":"ambiguous","input":"How many breakeven trades did I have in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["gross or fee-complete net basis","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should breakeven mean gross P/L or fee-complete net P/L?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One focused basis clarification; no candidate answer is selected."},
{"caseId":"C3-E4-19","caseType":"negative_example","input":"How many flat trades prove I should increase my size?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A breakeven-trade count cannot determine trading advice.","notes":"The metric does not prescribe action."},
{"caseId":"C3-E4-20","caseType":"unsupported_data","input":"Count July net breakeven trades with missing fee records.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","net P/L","incomplete fees","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net basis","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Net breakeven classification is unavailable for affected trades without complete fee evidence; do not fall back to gross.","notes":"No approximate or gross fallback is allowed."},
{"caseId":"C3-E4-21","caseType":"selected_entity_context","input":"How many gross breakeven trades are in the selected review period?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","selected review period"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected period context is trusted and account-scoped."},
{"caseId":"C3-E4-22","caseType":"cross_category","input":"Explain the documented difference in gross breakeven counts between June and July.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["breakeven_trades"],"expectedFilters":["ready_closed","gross P/L equals exact zero","June","July"],"expectedGroupings":[],"expectedOperators":["count","equals exact zero","period comparison"],"expectedComparison":{"left":"June","right":"July","basis":"gross breakeven-trade count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented differences without attributing cause."}
]
```

### open_trades

```json
[
{"caseId":"C3-E5-01","caseType":"canonical","input":"Show my open trades right now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","current lifecycle projection","decision exclusion"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Right now means the current snapshot of factually confirmed legitimate_open projections only."},
{"caseId":"C3-E5-02","caseType":"formal_paraphrase","input":"Determine the current count of legitimate open lifecycle projections.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","current lifecycle projection"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The metric is current state, not an order or execution-row count."},
{"caseId":"C3-E5-03","caseType":"conversational_paraphrase","input":"How many positions am I still holding right now?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","current lifecycle projection"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Still holding resolves to currently legitimate open trades."},
{"caseId":"C3-E5-04","caseType":"trader_slang","input":"How many bags am I holding now?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","current lifecycle projection"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang does not turn unresolved candidates into holdings."},
{"caseId":"C3-E5-05","caseType":"abbreviation","input":"OT count for current positions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["explicit open-trades grammar","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"OT is accepted only with explicit current-position grammar; bare tokens remain symbol-safe."},
{"caseId":"C3-E5-06","caseType":"misspelling","input":"How many opne trades are currently active?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without inferring lifecycle state."},
{"caseId":"C3-E5-07","caseType":"noisy_input","input":"open positions now count pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not add open orders or raw execution rows."},
{"caseId":"C3-E5-08","caseType":"command","input":"Count my currently open trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One read-only current lifecycle count."},
{"caseId":"C3-E5-09","caseType":"fragment","input":"Open trades right now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A current-state fragment is sufficient."},
{"caseId":"C3-E5-10","caseType":"follow_up","input":"How many of those are still open?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open","prior selected population"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior population","same account scope","current lifecycle projection"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted prior context may narrow the current legitimate-open set."},
{"caseId":"C3-E5-11","caseType":"correction","input":"I meant current open trades, not pending open orders.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count","population correction"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects lifecycle projections rather than orders."},
{"caseId":"C3-E5-12","caseType":"comparison","input":"Compare my current open long and short trade counts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":["direction"],"expectedOperators":["count","group by","comparison"],"expectedComparison":{"left":"long","right":"short","basis":"current legitimate_open count"},"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["observed direction","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison uses only factually confirmed current open lifecycles."},
{"caseId":"C3-E5-13","caseType":"ranking","input":"Which ticker has the most current open trades?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":["ticker"],"expectedOperators":["count","descending","top one"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is a valid current ticker-grouped count."},
{"caseId":"C3-E5-14","caseType":"negation","input":"Count my current factually confirmed open trades, not closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open","exclude closed"],"expectedGroupings":[],"expectedOperators":["count","exclude closed"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["confirmed lifecycle status","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit confirmed-open wording selects legitimate_open; unresolved rows and pending orders remain separate."},
{"caseId":"C3-E5-15","caseType":"exclusion","input":"Show current open trades excluding NVDA.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open","exclude NVDA"],"expectedGroupings":[],"expectedOperators":["count","exclude"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["NVDA symbol resolution","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion applies before the current-state count."},
{"caseId":"C3-E5-16","caseType":"multi_filter","input":"Count current open long SPY trades in the selected account.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open","long","SPY","selected account"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":"selected account","expectedContextRequirements":["SPY symbol resolution","trusted selected account","server-authoritative account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters do not infer status from orders or execution rows."},
{"caseId":"C3-E5-17","caseType":"multi_part","input":"Count current open trades by currency and show a labelled all-currency total.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":["trade currency"],"expectedOperators":["count","group by","labelled cross-currency total"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["currency partitions","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Basis-free counts may have a clearly labelled cross-currency total."},
{"caseId":"C3-E5-18","caseType":"ambiguous","input":"How many open things do I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean current open trades or pending open orders?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One focused clarification; capability is deferred and no candidate answer is assumed until the population is selected."},
{"caseId":"C3-E5-19","caseType":"negative_example","input":"How many open trades prove I should close everything today?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["no advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"An open-trade count cannot determine trading advice.","notes":"The metric does not prescribe action."},
{"caseId":"C3-E5-20","caseType":"unsupported_data","input":"Count pending open orders and unresolved execution rows as open trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["open orders","execution rows","needs_decision"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["lifecycle evidence","Data Decision coverage","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Open orders, execution rows, and needs_decision candidates are not factually confirmed legitimate_open lifecycle projections.","notes":"No inferred open classification or fallback is allowed."},
{"caseId":"C3-E5-21","caseType":"selected_entity_context","input":"How many open trades are in the selected account?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open","selected account"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"current","expectedSelectedEntity":"selected account","expectedContextRequirements":["trusted selected account","server-authoritative account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected account context is trusted and server-authoritative."},
{"caseId":"C3-E5-22","caseType":"cross_category","input":"Explain the documented difference between current open-trade counts by direction.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["group_and_aggregate","compare_groups","calculate_metric"],"expectedCanonicalConcepts":["open_trades"],"expectedFilters":["current legitimate_open"],"expectedGroupings":["direction"],"expectedOperators":["count","group by","comparison"],"expectedComparison":{"left":"long","right":"short","basis":"current legitimate_open count"},"expectedTimeRange":"current","expectedSelectedEntity":null,"expectedContextRequirements":["observed direction","comparison evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented differences without causation or future claims."}
]
```

### closed_trades

```json
[
{"caseId":"C3-E6-01","caseType":"canonical","input":"Show my closed trades for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","open and decision exclusion"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses the one exact eligible ready_closed count shared with trade_count; no duplicate calculation."},
{"caseId":"C3-E6-02","caseType":"formal_paraphrase","input":"Determine the number of eligible current ready_closed round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["eligible ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Closed round trips are the eligible realized population."},
{"caseId":"C3-E6-03","caseType":"conversational_paraphrase","input":"How many trades did I finish last week?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","last week"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Finish wording resolves to closed round trips, not executions."},
{"caseId":"C3-E6-04","caseType":"trader_slang","input":"How many round trips did I wrap up today?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","today"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"today","expectedSelectedEntity":null,"expectedContextRequirements":["trusted today boundary","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang preserves the ready_closed population."},
{"caseId":"C3-E6-05","caseType":"abbreviation","input":"CT for July completed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit closed-trades grammar","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"CT is accepted only with explicit metric grammar; bare ticker-shaped text remains safe."},
{"caseId":"C3-E6-06","caseType":"misspelling","input":"How many clsoed trades did I have in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing population."},
{"caseId":"C3-E6-07","caseType":"noisy_input","input":"closed trades july count pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not include open positions or execution rows."},
{"caseId":"C3-E6-08","caseType":"command","input":"Give me the June closed-trade total.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","June"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One read-only count on the shared ready_closed population."},
{"caseId":"C3-E6-09","caseType":"fragment","input":"Closed round trips this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","this month"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A bounded realized-activity fragment is sufficient."},
{"caseId":"C3-E6-10","caseType":"follow_up","input":"How many of those have closed?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["prior selected population","ready_closed"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior population","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior population context."},
{"caseId":"C3-E6-11","caseType":"correction","input":"I meant closed trades, not my execution count, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count","population correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects round trips rather than execution records."},
{"caseId":"C3-E6-12","caseType":"comparison","input":"Contrast June with July using my closed-trade totals.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July","June"],"expectedGroupings":[],"expectedOperators":["count","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"eligible ready_closed count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","same currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison preserves the one shared count definition."},
{"caseId":"C3-E6-13","caseType":"ranking","input":"Rank July tickers by completed-trade count; show the top one.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":["ticker"],"expectedOperators":["count","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking is ticker-grouped closed-trade count, not a second calculation."},
{"caseId":"C3-E6-14","caseType":"negation","input":"This month, count trades that have finished rather than remain open.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","this month"],"expectedGroupings":[],"expectedOperators":["count","exclude open"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open positions never enter the realized count."},
{"caseId":"C3-E6-15","caseType":"exclusion","input":"Show July closed-trade count excluding TSLA.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July","exclude TSLA"],"expectedGroupings":[],"expectedOperators":["count","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["TSLA symbol resolution","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is visible and preserves unrelated decision coverage."},
{"caseId":"C3-E6-16","caseType":"multi_filter","input":"For July regular hours, total completed long trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July","long","regular hours"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["session definition","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters narrow the same eligible realized population."},
{"caseId":"C3-E6-17","caseType":"multi_part","input":"Count July closed trades by currency and show a labelled all-currency total.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":["trade currency"],"expectedOperators":["count","group by","labelled cross-currency total"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["currency partitions","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Basis-free counts may be summed only as a clearly labelled cross-currency total."},
{"caseId":"C3-E6-18","caseType":"ambiguous","input":"What was my July completed-trade tally?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Defaults to the exact eligible ready_closed count; this language route shares trade_count's calculation."},
{"caseId":"C3-E6-19","caseType":"negative_example","input":"How many closed trades prove I will win next month?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"next month","expectedSelectedEntity":null,"expectedContextRequirements":["no future proof","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A closed-trade count cannot prove a future outcome.","notes":"The metric cannot establish future performance."},
{"caseId":"C3-E6-20","caseType":"unsupported_data","input":"Count July candidates awaiting a Data Decision as closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["needs_decision","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["Data Decision coverage","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Pending-decision candidates are not eligible ready_closed trades and cannot be classified as closed.","notes":"No fallback classification is allowed."},
{"caseId":"C3-E6-21","caseType":"selected_entity_context","input":"Within the selected review period, what is my completed-trade count?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","selected review period"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context must be trusted and account-scoped."},
{"caseId":"C3-E6-22","caseType":"cross_category","input":"Explain the documented difference between my July and June closed-trade counts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["ready_closed","July","June"],"expectedGroupings":[],"expectedOperators":["count","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"eligible ready_closed count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented differences without attributing cause."}
]
```

---


### win_rate

```json
[
{"caseId":"C3-E7-01","caseType":"canonical","input":"What is my win rate for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","basis required before classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate win rate from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct unqualified rate request asks only the focused gross-versus-net basis question and returns no candidate answer."},
{"caseId":"C3-E7-02","caseType":"formal_paraphrase","input":"Determine the proportion of eligible July round trips with winning gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-03","caseType":"conversational_paraphrase","input":"How often did I have a winning trade in July before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-04","caseType":"trader_slang","input":"Show my gross hit rate for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-05","caseType":"abbreviation","input":"WR for July gross closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit rate grammar","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-06","caseType":"misspelling","input":"What was my winrate in July gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-07","caseType":"noisy_input","input":"wr july gross closed only pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-08","caseType":"command","input":"Calculate my gross win rate for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-09","caseType":"fragment","input":"Gross win rate this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","this month"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-10","caseType":"follow_up","input":"What was that win rate with the same gross basis?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["prior selected-basis eligible ready_closed population"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","same selected basis","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-11","caseType":"correction","input":"I meant win rate, not the winning-trade count; use gross for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","rate correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-12","caseType":"comparison","input":"Compare my gross July and June win rates.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross eligible ready_closed win rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","account scope","separate valid denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-13","caseType":"ranking","input":"Rank July tickers by gross win rate; show the top one and each denominator.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["divide","percentage","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","same gross basis","valid group denominators","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-14","caseType":"negation","input":"Show my gross win rate this month without open positions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","this month","exclude open"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","exclude open"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-15","caseType":"exclusion","input":"Show July gross win rate excluding TSLA.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July","exclude TSLA"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["TSLA symbol resolution","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-16","caseType":"multi_filter","input":"Show net win rate for long NVDA trades in July, excluding AAPL.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","net P/L greater than exact zero","fee-complete net","July","long","NVDA","exclude AAPL"],"expectedGroupings":[],"expectedOperators":["divide","percentage","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net population","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Net numerator and denominator use only the identical fee-complete eligible population; excluded fee-incomplete rows are explicit partial coverage."},
{"caseId":"C3-E7-17","caseType":"multi_part","input":"Show gross win rate, its numerator, and its denominator for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","show numerator","show denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-18","caseType":"ambiguous","input":"What was my win rate?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","basis required before classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate win rate from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct unqualified rate request asks only the focused gross-versus-net basis question and returns no candidate answer."},
{"caseId":"C3-E7-19","caseType":"negative_example","input":"Will my win rate improve next month?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":"next month","expectedSelectedEntity":null,"expectedContextRequirements":["no future prediction or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A historical win rate cannot predict future performance or provide advice.","notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-20","caseType":"unsupported_data","input":"Show my gross win rate for July when there are zero eligible closed trades on that gross basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July","zero selected-basis eligible denominator"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["selected gross basis","identical numerator and denominator eligibility","zero eligible denominator","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Win rate is unavailable when the selected-basis eligible denominator is zero; never return 0% for an empty population.","notes":"Apply the same selected-basis eligibility to numerator and denominator, distinguish an empty denominator from a zero numerator, and return unavailable rather than 0%."},
{"caseId":"C3-E7-21","caseType":"selected_entity_context","input":"Within the selected review period, show my gross win rate.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","selected review period"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E7-22","caseType":"cross_category","input":"Explain the documented difference between my gross July and June win rates.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["win_rate"],"expectedFilters":["ready_closed","gross P/L greater than exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross eligible ready_closed win rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","account scope","separate valid denominators"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented rate differences without assigning cause or recommending action."}
]
```

### loss_rate

```json
[
{"caseId":"C3-E8-01","caseType":"canonical","input":"What is my loss rate for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","basis required before classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate loss rate from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct unqualified rate request asks only the focused gross-versus-net basis question and returns no candidate answer."},
{"caseId":"C3-E8-02","caseType":"formal_paraphrase","input":"Determine the proportion of eligible July round trips with losing gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-03","caseType":"conversational_paraphrase","input":"How often did I have a losing trade in July before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-04","caseType":"trader_slang","input":"Show my gross miss rate for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-05","caseType":"abbreviation","input":"LR for July gross closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit rate grammar","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-06","caseType":"misspelling","input":"What was my lossrate in July gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-07","caseType":"noisy_input","input":"lr july gross closed only pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-08","caseType":"command","input":"Calculate my gross loss rate for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-09","caseType":"fragment","input":"Gross loss rate this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","this month"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-10","caseType":"follow_up","input":"What was that loss rate with the same gross basis?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["prior selected-basis eligible ready_closed population"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","same selected basis","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-11","caseType":"correction","input":"I meant loss rate, not the losing-trade count; use gross for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","rate correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-12","caseType":"comparison","input":"Compare my gross July and June loss rates.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross eligible ready_closed loss rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","account scope","separate valid denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-13","caseType":"ranking","input":"Rank July tickers by gross loss rate; show the top one and each denominator.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["divide","percentage","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","same gross basis","valid group denominators","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-14","caseType":"negation","input":"Show my gross loss rate this month without open positions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","this month","exclude open"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","exclude open"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-15","caseType":"exclusion","input":"Show July gross loss rate excluding TSLA.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July","exclude TSLA"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["TSLA symbol resolution","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-16","caseType":"multi_filter","input":"Show net loss rate for long NVDA trades in July, excluding AAPL.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","net P/L less than exact zero","fee-complete net","July","long","NVDA","exclude AAPL"],"expectedGroupings":[],"expectedOperators":["divide","percentage","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net population","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Net numerator and denominator use only the identical fee-complete eligible population; excluded fee-incomplete rows are explicit partial coverage."},
{"caseId":"C3-E8-17","caseType":"multi_part","input":"Show gross loss rate, its numerator, and its denominator for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","show numerator","show denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-18","caseType":"ambiguous","input":"What was my loss rate?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","basis required before classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate loss rate from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct unqualified rate request asks only the focused gross-versus-net basis question and returns no candidate answer."},
{"caseId":"C3-E8-19","caseType":"negative_example","input":"Will my loss rate improve next month?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":"next month","expectedSelectedEntity":null,"expectedContextRequirements":["no future prediction or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A historical loss rate cannot predict future performance or provide advice.","notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-20","caseType":"unsupported_data","input":"Show my gross loss rate for July when there are zero eligible closed trades on that gross basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July","zero selected-basis eligible denominator"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["selected gross basis","identical numerator and denominator eligibility","zero eligible denominator","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Loss rate is unavailable when the selected-basis eligible denominator is zero; never return 0% for an empty population.","notes":"Apply the same selected-basis eligibility to numerator and denominator, distinguish an empty denominator from a zero numerator, and return unavailable rather than 0%."},
{"caseId":"C3-E8-21","caseType":"selected_entity_context","input":"Within the selected review period, show my gross loss rate.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","selected review period"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E8-22","caseType":"cross_category","input":"Explain the documented difference between my gross July and June loss rates.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["loss_rate"],"expectedFilters":["ready_closed","gross P/L less than exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross eligible ready_closed loss rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","account scope","separate valid denominators"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented rate differences without assigning cause or recommending action."}
]
```

### breakeven_rate

```json
[
{"caseId":"C3-E9-01","caseType":"canonical","input":"What is my breakeven rate for July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","basis required before classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate exact breakeven rate from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct unqualified rate request asks only the focused gross-versus-net basis question and returns no candidate answer."},
{"caseId":"C3-E9-02","caseType":"formal_paraphrase","input":"Determine the proportion of eligible July round trips with breakeven gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-03","caseType":"conversational_paraphrase","input":"How often did I have a breakeven trade in July before fees?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-04","caseType":"trader_slang","input":"Show my gross scratch rate for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-05","caseType":"abbreviation","input":"BR for July gross closed trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit rate grammar","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-06","caseType":"misspelling","input":"What was my breakevenrate in July gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-07","caseType":"noisy_input","input":"br july gross closed only pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-08","caseType":"command","input":"Calculate my gross breakeven rate for June.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-09","caseType":"fragment","input":"Gross breakeven rate this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","this month"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-10","caseType":"follow_up","input":"What was that breakeven rate with the same gross basis?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["prior selected-basis eligible ready_closed population"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","same selected basis","same account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-11","caseType":"correction","input":"I meant breakeven rate, not the breakeven-trade count; use gross for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","rate correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-12","caseType":"comparison","input":"Compare my gross July and June breakeven rates.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross eligible ready_closed breakeven rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","account scope","separate valid denominators"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-13","caseType":"ranking","input":"Rank July tickers by gross breakeven rate; show the top one and each denominator.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["divide","percentage","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","same gross basis","valid group denominators","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-14","caseType":"negation","input":"Show my gross breakeven rate this month without open positions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","this month","exclude open"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","exclude open"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-15","caseType":"exclusion","input":"Show July gross breakeven rate excluding TSLA.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July","exclude TSLA"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["TSLA symbol resolution","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-16","caseType":"multi_filter","input":"Show net breakeven rate for long NVDA trades in July, excluding AAPL.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","net P/L equal to exact zero","fee-complete net","July","long","NVDA","exclude AAPL"],"expectedGroupings":[],"expectedOperators":["divide","percentage","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee-complete net population","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Net numerator and denominator use only the identical fee-complete eligible population; excluded fee-incomplete rows are explicit partial coverage."},
{"caseId":"C3-E9-17","caseType":"multi_part","input":"Show gross breakeven rate, its numerator, and its denominator for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","show numerator","show denominator"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","identical selected-basis eligible ready_closed numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-18","caseType":"ambiguous","input":"What was my breakeven rate?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","one currency partition","basis required before classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate exact breakeven rate from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Direct unqualified rate request asks only the focused gross-versus-net basis question and returns no candidate answer."},
{"caseId":"C3-E9-19","caseType":"negative_example","input":"Will my breakeven rate improve next month?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed"],"expectedGroupings":[],"expectedOperators":["divide","percentage"],"expectedComparison":null,"expectedTimeRange":"next month","expectedSelectedEntity":null,"expectedContextRequirements":["no future prediction or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A historical breakeven rate cannot predict future performance or provide advice.","notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-20","caseType":"unsupported_data","input":"Show my gross breakeven rate for July when there are zero eligible closed trades on that gross basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July","zero selected-basis eligible denominator"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["selected gross basis","identical numerator and denominator eligibility","zero eligible denominator","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Breakeven rate is unavailable when the selected-basis eligible denominator is zero; never return 0% for an empty population.","notes":"Apply the same selected-basis eligibility to numerator and denominator, distinguish an empty denominator from a zero numerator, and return unavailable rather than 0%."},
{"caseId":"C3-E9-21","caseType":"selected_entity_context","input":"Within the selected review period, show my gross breakeven rate.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","selected review period"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account scope","one currency partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open and decision rows are excluded; selected-basis numerator and denominator are identical eligible ready_closed populations."},
{"caseId":"C3-E9-22","caseType":"cross_category","input":"Explain the documented difference between my gross July and June breakeven rates.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["breakeven_rate"],"expectedFilters":["ready_closed","gross P/L equal to exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["divide","percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross eligible ready_closed breakeven rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","account scope","separate valid denominators"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented rate differences without assigning cause or recommending action."}
]
```

### green_days

```json
[{"caseId":"C3-E10-01","caseType":"canonical","input":"How many green days did I have in July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Counts selected-basis completed closing-date buckets only."},{"caseId":"C3-E10-02","caseType":"formal_paraphrase","input":"Determine the number of July closing-date buckets with greater than zero gross realized P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A completed day is classified from its selected-basis closing-date bucket."},{"caseId":"C3-E10-03","caseType":"conversational_paraphrase","input":"How many green days were in June, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","June"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses the account IANA closing date."},{"caseId":"C3-E10-04","caseType":"trader_slang","input":"How many green days did I put up last week, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","last week"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Safe slang retains the selected-basis day definition."},{"caseId":"C3-E10-05","caseType":"abbreviation","input":"GD green-day count for July on a gross P/L basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit green-day count grammar","gross basis","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"GD is accepted only alongside explicit green-day count wording with July and gross basis."},{"caseId":"C3-E10-06","caseType":"misspelling","input":"How many grene days did I have in July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the misspelling without changing scope or basis."},{"caseId":"C3-E10-07","caseType":"noisy_input","input":"green days july gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open-only and no-trade dates are excluded and never zero-filled."},{"caseId":"C3-E10-08","caseType":"command","input":"Count my net green days for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A net date is classified only when every eligible row for that date is fee-complete."},{"caseId":"C3-E10-09","caseType":"fragment","input":"Gross green days this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","this month"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},{"caseId":"C3-E10-10","caseType":"follow_up","input":"How many of those were green days, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","prior range"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","same account IANA timezone"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior period context."},{"caseId":"C3-E10-11","caseType":"correction","input":"I meant net green days, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["count","net","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes the selected basis and uses complete-date net coverage."},{"caseId":"C3-E10-12","caseType":"comparison","input":"Compare my July and June gross green-day counts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross green-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account IANA timezone","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison preserves one closing-date-bucket definition."},{"caseId":"C3-E10-13","caseType":"ranking","input":"Which month had the most gross green days this year?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","this year"],"expectedGroupings":["month"],"expectedOperators":["count","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"this year","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","deterministic tie policy","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking groups the same gross outcome definition by month."},{"caseId":"C3-E10-14","caseType":"negation","input":"Count July days that were not red or flat, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross","outcome negation"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation resolves to the exact selected outcome."},{"caseId":"C3-E10-15","caseType":"exclusion","input":"Show July gross green days excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["count","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is applied before daily classification."},{"caseId":"C3-E10-16","caseType":"multi_filter","input":"Show net green days for long NVDA trades in July, excluding AAPL.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July","long","NVDA","exclude AAPL"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fee-incomplete dates remain coverage, not classified net days."},{"caseId":"C3-E10-17","caseType":"multi_part","input":"Show gross green days and gross red days for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","July"],"expectedGroupings":["day outcome"],"expectedOperators":["count","gross","classify days"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both counts use the same gross date buckets without causation."},{"caseId":"C3-E10-18","caseType":"ambiguous","input":"How many green days did I have in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["basis required before classification","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I count green days from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only gross-versus-net basis needs clarification; no candidate answer is returned."},{"caseId":"C3-E10-19","caseType":"negative_example","input":"Using evidence only, explain the difference between my gross July and June green-day counts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross green-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","same account IANA timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain evidence-backed differences only, without causal attribution or recommendations."},{"caseId":"C3-E10-20","caseType":"unsupported_data","input":"Show July net green days even when some rows on a date have missing fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-incomplete net","July"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee completeness coverage","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A net day is unclassified when any eligible row for that date lacks complete fees; it remains coverage, not a classified day.","notes":"No fee estimate or partial-date net classification is allowed."},{"caseId":"C3-E10-21","caseType":"selected_entity_context","input":"In the selected review period, show my gross green days.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","selected review period"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context must be trusted and account-scoped."},{"caseId":"C3-E10-22","caseType":"cross_category","input":"Explain the documented difference between my gross July and June green-day counts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["green_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross green-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","same account IANA timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain evidence-backed differences without causal attribution or recommendations."}]
```

### red_days

```json
[{"caseId":"C3-E11-01","caseType":"canonical","input":"How many red days did I have in July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Counts selected-basis completed closing-date buckets only."},{"caseId":"C3-E11-02","caseType":"formal_paraphrase","input":"Determine the number of July closing-date buckets with less than zero gross realized P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A completed day is classified from its selected-basis closing-date bucket."},{"caseId":"C3-E11-03","caseType":"conversational_paraphrase","input":"How many red days were in June, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","June"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses the account IANA closing date."},{"caseId":"C3-E11-04","caseType":"trader_slang","input":"How many red days did I put up last week, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","last week"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Safe slang retains the selected-basis day definition."},{"caseId":"C3-E11-05","caseType":"abbreviation","input":"RD red-day count for July on a gross P/L basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit red-day count grammar","gross basis","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"RD is accepted only alongside explicit red-day count wording with July and gross basis."},{"caseId":"C3-E11-06","caseType":"misspelling","input":"How many redd days did I have in July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the misspelling without changing scope or basis."},{"caseId":"C3-E11-07","caseType":"noisy_input","input":"red days july gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open-only and no-trade dates are excluded and never zero-filled."},{"caseId":"C3-E11-08","caseType":"command","input":"Count my net red days for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A net date is classified only when every eligible row for that date is fee-complete."},{"caseId":"C3-E11-09","caseType":"fragment","input":"Gross red days this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","this month"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},{"caseId":"C3-E11-10","caseType":"follow_up","input":"How many of those were red days, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","prior range"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","same account IANA timezone"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior period context."},{"caseId":"C3-E11-11","caseType":"correction","input":"I meant net red days, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["count","net","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes the selected basis and uses complete-date net coverage."},{"caseId":"C3-E11-12","caseType":"comparison","input":"Compare my July and June gross red-day counts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross red-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account IANA timezone","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison preserves one closing-date-bucket definition."},{"caseId":"C3-E11-13","caseType":"ranking","input":"Which month had the most gross red days this year?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","this year"],"expectedGroupings":["month"],"expectedOperators":["count","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"this year","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","deterministic tie policy","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking groups the same gross outcome definition by month."},{"caseId":"C3-E11-14","caseType":"negation","input":"Count July days that were not green or flat, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross","outcome negation"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation resolves to the exact selected outcome."},{"caseId":"C3-E11-15","caseType":"exclusion","input":"Show July gross red days excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["count","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is applied before daily classification."},{"caseId":"C3-E11-16","caseType":"multi_filter","input":"Show net red days for long NVDA trades in July, excluding AAPL.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July","long","NVDA","exclude AAPL"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fee-incomplete dates remain coverage, not classified net days."},{"caseId":"C3-E11-17","caseType":"multi_part","input":"Show gross red days and gross green days for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","July"],"expectedGroupings":["day outcome"],"expectedOperators":["count","gross","classify days"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both counts use the same gross date buckets without causation."},{"caseId":"C3-E11-18","caseType":"ambiguous","input":"How many red days did I have in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["basis required before classification","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I count red days from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only gross-versus-net basis needs clarification; no candidate answer is returned."},{"caseId":"C3-E11-19","caseType":"negative_example","input":"Using evidence only, explain the difference between my gross July and June red-day counts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross red-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","same account IANA timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain evidence-backed differences only, without causal attribution or recommendations."},{"caseId":"C3-E11-20","caseType":"unsupported_data","input":"Show July net red days even when some rows on a date have missing fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-incomplete net","July"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee completeness coverage","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A net day is unclassified when any eligible row for that date lacks complete fees; it remains coverage, not a classified day.","notes":"No fee estimate or partial-date net classification is allowed."},{"caseId":"C3-E11-21","caseType":"selected_entity_context","input":"In the selected review period, show my gross red days.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","selected review period"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context must be trusted and account-scoped."},{"caseId":"C3-E11-22","caseType":"cross_category","input":"Explain the documented difference between my gross July and June red-day counts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["red_days"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross red-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","same account IANA timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain evidence-backed differences without causal attribution or recommendations."}]
```

### flat_days

```json
[{"caseId":"C3-E12-01","caseType":"canonical","input":"How many flat days did I have in July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Counts selected-basis completed closing-date buckets only."},{"caseId":"C3-E12-02","caseType":"formal_paraphrase","input":"Determine the number of July closing-date buckets whose gross realized P/L equals exactly zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A completed day is classified from its selected-basis closing-date bucket."},{"caseId":"C3-E12-03","caseType":"conversational_paraphrase","input":"How many flat days were in June, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","June"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses the account IANA closing date."},{"caseId":"C3-E12-04","caseType":"trader_slang","input":"How many scratch days did I put up last week, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","last week"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Scratch means exact zero, never rounded or approximate zero."},{"caseId":"C3-E12-05","caseType":"abbreviation","input":"FD flat-day count for July on a gross P/L basis.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit flat-day count grammar","gross basis","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"FD is accepted only alongside explicit flat-day count wording with July and gross basis."},{"caseId":"C3-E12-06","caseType":"misspelling","input":"How many flatt days did I have in July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize the misspelling without changing scope or basis."},{"caseId":"C3-E12-07","caseType":"noisy_input","input":"flat days july gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open-only and no-trade dates are excluded and never zero-filled."},{"caseId":"C3-E12-08","caseType":"command","input":"Count my net flat days for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","net realized P/L equal to exact zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A net date is classified only when every eligible row for that date is fee-complete."},{"caseId":"C3-E12-09","caseType":"fragment","input":"Gross flat days this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","this month"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},{"caseId":"C3-E12-10","caseType":"follow_up","input":"How many of those were flat days, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","prior range"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","same account IANA timezone"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior period context."},{"caseId":"C3-E12-11","caseType":"correction","input":"I meant net flat days, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","net realized P/L equal to exact zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["count","net","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes the selected basis and uses complete-date net coverage."},{"caseId":"C3-E12-12","caseType":"comparison","input":"Compare my July and June gross flat-day counts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross flat-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account IANA timezone","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison preserves one closing-date-bucket definition."},{"caseId":"C3-E12-13","caseType":"ranking","input":"Which month had the most gross flat days this year?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","this year"],"expectedGroupings":["month"],"expectedOperators":["count","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"this year","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","deterministic tie policy","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking groups the same gross outcome definition by month."},{"caseId":"C3-E12-14","caseType":"negation","input":"Count July days that were neither green nor red, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July"],"expectedGroupings":[],"expectedOperators":["count","gross","outcome negation"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Flat is exact zero only, never a rounded scratch."},{"caseId":"C3-E12-15","caseType":"exclusion","input":"Show July gross flat days excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["count","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is applied before daily classification."},{"caseId":"C3-E12-16","caseType":"multi_filter","input":"Show net flat days for long NVDA trades in July, excluding AAPL.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","net realized P/L equal to exact zero","fee-complete net","July","long","NVDA","exclude AAPL"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fee-incomplete dates remain coverage, not classified net days."},{"caseId":"C3-E12-17","caseType":"multi_part","input":"Show gross flat days and gross green days for July.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","July"],"expectedGroupings":["day outcome"],"expectedOperators":["count","gross","classify days"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both counts use the same gross date buckets without causation."},{"caseId":"C3-E12-18","caseType":"ambiguous","input":"How many flat days did I have in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["count"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["basis required before classification","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I count flat days from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only gross-versus-net basis needs clarification; no candidate answer is returned."},{"caseId":"C3-E12-19","caseType":"negative_example","input":"Using evidence only, explain the difference between my gross July and June flat-day counts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross flat-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","same account IANA timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain evidence-backed differences only, without causal attribution or recommendations."},{"caseId":"C3-E12-20","caseType":"unsupported_data","input":"Show July net flat days even when some rows on a date have missing fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","net realized P/L equal to exact zero","fee-incomplete net","July"],"expectedGroupings":[],"expectedOperators":["count","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee completeness coverage","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A net day is unclassified when any eligible row for that date lacks complete fees; it remains coverage, not a classified day.","notes":"No fee estimate or partial-date net classification is allowed."},{"caseId":"C3-E12-21","caseType":"selected_entity_context","input":"In the selected review period, show my gross flat days.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","selected review period"],"expectedGroupings":[],"expectedOperators":["count","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account IANA closing date","one currency and timezone-compatible partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context must be trusted and account-scoped."},{"caseId":"C3-E12-22","caseType":"cross_category","input":"Explain the documented difference between my gross July and June flat-day counts.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["flat_days"],"expectedFilters":["ready_closed","gross realized P/L equal to exact zero","July","June"],"expectedGroupings":[],"expectedOperators":["count","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross flat-day count"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","same account IANA timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain evidence-backed differences without causal attribution or recommendations."}]
```

### percentage_of_profitable_days

```json
[{"caseId":"C3-E13-01","caseType":"canonical","input":"What percentage of my July days were profitable, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July"],"expectedGroupings":[],"expectedOperators":["count green classified dates","divide by all classified dates","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Green classified selected-basis closing dates divided by all classified selected-basis realized closing dates."},
{"caseId":"C3-E13-02","caseType":"formal_paraphrase","input":"Calculate July gross profitable-day rate from completed classified closing-date buckets.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July"],"expectedGroupings":[],"expectedOperators":["green classified-date numerator","all classified-date denominator","percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition","complete date buckets"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open-only and no-trade dates are not zero-filled into the denominator."},
{"caseId":"C3-E13-03","caseType":"conversational_paraphrase","input":"How often did I finish a day green in June, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","June"],"expectedGroupings":[],"expectedOperators":["profitable-day rate","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Finish-day wording uses closing-date buckets."},
{"caseId":"C3-E13-04","caseType":"trader_slang","input":"What was my green-day clip last week, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","last week"],"expectedGroupings":[],"expectedOperators":["profitable-day rate","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Safe slang retains the classified-date rate definition."},
{"caseId":"C3-E13-05","caseType":"abbreviation","input":"PDPD gross profitable-day percentage for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July"],"expectedGroupings":[],"expectedOperators":["percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["registered PDPD with explicit gross profitable-day percentage grammar","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Registered PDPD is accepted only alongside explicit gross profitable-day percentage grammar."},
{"caseId":"C3-E13-06","caseType":"misspelling","input":"What was my percetage of profitable days in July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July"],"expectedGroupings":[],"expectedOperators":["percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing basis."},
{"caseId":"C3-E13-07","caseType":"noisy_input","input":"profitable day % july gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July"],"expectedGroupings":[],"expectedOperators":["percentage","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No open or no-trade date is inserted as a zero."},
{"caseId":"C3-E13-08","caseType":"command","input":"Calculate my net profitable-day percentage for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","net realized P/L","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["percentage","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only fee-complete net date buckets are classified."},
{"caseId":"C3-E13-09","caseType":"fragment","input":"Gross profitable-day percentage this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","this month"],"expectedGroupings":[],"expectedOperators":["percentage","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},
{"caseId":"C3-E13-10","caseType":"follow_up","input":"What percentage of those days were profitable, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","prior range"],"expectedGroupings":[],"expectedOperators":["percentage","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","same account IANA timezone"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior period context."},
{"caseId":"C3-E13-11","caseType":"correction","input":"I meant net profitable-day percentage, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","net realized P/L","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["percentage","net","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes both numerator and denominator to net classified dates."},
{"caseId":"C3-E13-12","caseType":"comparison","input":"Compare my July and June gross profitable-day percentages.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July","June"],"expectedGroupings":[],"expectedOperators":["percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross profitable-day rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account IANA timezone","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each period keeps its own classified-date denominator."},
{"caseId":"C3-E13-13","caseType":"ranking","input":"Which month had my highest gross profitable-day percentage this year?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","this year"],"expectedGroupings":["month"],"expectedOperators":["percentage","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"this year","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","deterministic tie policy","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranked month rates retain separate complete date-bucket coverage."},
{"caseId":"C3-E13-14","caseType":"negation","input":"What percentage of July days were not red or flat, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["percentage","gross","outcome negation"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation resolves to positive classified dates."},
{"caseId":"C3-E13-15","caseType":"exclusion","input":"Show July gross profitable-day percentage excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["percentage","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion occurs before daily classification."},
{"caseId":"C3-E13-16","caseType":"multi_filter","input":"Show net profitable-day percentage for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","net realized P/L","fee-complete net","July","long","NVDA"],"expectedGroupings":[],"expectedOperators":["percentage","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition","all eligible rows in each classified date fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fee-incomplete dates remain explicit coverage."},
{"caseId":"C3-E13-17","caseType":"multi_part","input":"Show my July gross profitable-day percentage and gross green-day count.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["percentage_of_profitable_days","green_days"],"expectedFilters":["ready_closed","gross realized P/L","July"],"expectedGroupings":["day outcome"],"expectedOperators":["percentage","count","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The percentage numerator equals the green-day count."},
{"caseId":"C3-E13-18","caseType":"ambiguous","input":"What percentage of my July days were profitable?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["percentage"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["basis required before classification","account IANA closing date"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I use gross P/L before fees or net P/L after recorded fees for the profitable-day rate?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the gross-versus-net basis needs clarification."},
{"caseId":"C3-E13-19","caseType":"negative_example","input":"Using evidence only, explain the difference between my gross July and June profitable-day percentages.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July","June"],"expectedGroupings":[],"expectedOperators":["percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross profitable-day rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","same account IANA timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain evidence-backed differences only, without causal attribution or recommendations."},
{"caseId":"C3-E13-20","caseType":"unsupported_data","input":"Show my July net profitable-day percentage when missing fees leave zero classified dates.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","net realized P/L","fee-incomplete net","July","zero classified-date denominator"],"expectedGroupings":[],"expectedOperators":["percentage","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["fee completeness coverage","account IANA closing date","zero classified-date denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The net profitable-day percentage is unavailable when missing fees leave zero classified dates; never return 0% for an empty denominator.","notes":"Fee-incomplete dates remain coverage; with no classified dates, return unavailable rather than 0%."},
{"caseId":"C3-E13-21","caseType":"selected_entity_context","input":"In the selected review period, show my gross profitable-day percentage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","selected review period"],"expectedGroupings":[],"expectedOperators":["percentage","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","account IANA closing date","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted selected context cannot expand account scope."},
{"caseId":"C3-E13-22","caseType":"cross_category","input":"Explain the documented difference between my gross July and June profitable-day percentages.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["percentage_of_profitable_days"],"expectedFilters":["ready_closed","gross realized P/L","July","June"],"expectedGroupings":[],"expectedOperators":["percentage","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross profitable-day rate"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","same account IANA timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented differences without causal attribution or advice."}]
```

### consecutive_wins

```json
[{"caseId":"C3-E14-01","caseType":"canonical","input":"How many consecutive wins do I have at the end of July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current is the ending run at the filtered population boundary, not maximum."},{"caseId":"C3-E14-02","caseType":"formal_paraphrase","input":"Determine the current ending sequence of gross wins among July realized round trips.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ordering is close UTC then stable round-trip ID."},{"caseId":"C3-E14-03","caseType":"conversational_paraphrase","input":"What is my current win streak for June, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","June"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current means the ending run in the filtered population."},{"caseId":"C3-E14-04","caseType":"trader_slang","input":"What was my gross win streak at the end of last week?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","last week"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The end-of-period wording selects the ending run, not a maximum streak."},{"caseId":"C3-E14-05","caseType":"abbreviation","input":"CW current win streak for July, gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit current win-streak grammar","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"CW is accepted only alongside explicit current win-streak grammar."},{"caseId":"C3-E14-06","caseType":"misspelling","input":"Show my consective wins in July, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing run meaning."},{"caseId":"C3-E14-07","caseType":"noisy_input","input":"wins streak July gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Flat and unknown outcomes are barriers, never dropped or bridged."},{"caseId":"C3-E14-08","caseType":"command","input":"Calculate my net ending win streak for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["current ending run","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition","fee-complete net classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Net fee gaps remain explicit barriers and coverage."},{"caseId":"C3-E14-09","caseType":"fragment","input":"Gross current win streak this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","this month"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},{"caseId":"C3-E14-10","caseType":"follow_up","input":"What is my current win streak there, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","prior range"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior ordered population."},{"caseId":"C3-E14-11","caseType":"correction","input":"I meant my net current win streak, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["current ending run","net","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition","fee-complete net classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes selected basis and barrier coverage."},{"caseId":"C3-E14-12","caseType":"comparison","input":"Compare my ending gross win streaks for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","June"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross ending wins run"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","each period ends at its own filtered boundary","stable ordering"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison does not convert either run into a maximum."},{"caseId":"C3-E14-13","caseType":"ranking","input":"Which month ended with my longest gross win streak this year?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","this year"],"expectedGroupings":["month"],"expectedOperators":["current ending run","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"this year","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","each grouped month has its own boundary","stable ordering"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranks ending runs by month, not maximum historical streaks."},{"caseId":"C3-E14-14","caseType":"negation","input":"Count the current gross run of results that are not losses or flat in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","outcome negation"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only exact selected-basis outcomes extend the run."},{"caseId":"C3-E14-15","caseType":"exclusion","input":"Show my July gross win streak excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion applies before ordering and barrier evaluation."},{"caseId":"C3-E14-16","caseType":"multi_filter","input":"Show my net current win streak for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July","long","NVDA"],"expectedGroupings":[],"expectedOperators":["current ending run","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition","all included rows fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fee-incomplete, flat, or unknown outcomes break rather than bridge the run."},{"caseId":"C3-E14-17","caseType":"multi_part","input":"Show my gross current win streak and the last barrier in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["consecutive_wins","retrieve_records"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","retrieve last barrier evidence","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition","bounded ordered outcome evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Calculate the current run and retrieve only its documented last barrier as bounded evidence, without causation."},{"caseId":"C3-E14-18","caseType":"ambiguous","input":"What is my current consecutive win streak in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["current ending run"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["basis required","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate the current consecutive win streak from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current streak meaning is explicit; clarify gross versus net basis only."},{"caseId":"C3-E14-19","caseType":"negative_example","input":"Using evidence only, explain my gross current win streak ending in July.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","identify ending barrier"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["ordered outcome evidence","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain the documented ending barrier for the gross current streak without assigning cause or advice."},{"caseId":"C3-E14-20","caseType":"unsupported_data","input":"Show my net current win streak while skipping trades with missing fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-incomplete net"],"expectedGroupings":[],"expectedOperators":["current ending run","net"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee completeness coverage","stable ordering"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee-incomplete net outcomes are explicit barriers and coverage; they cannot be skipped or bridged.","notes":"Fee-incomplete net outcomes remain explicit barriers and coverage at any period scope; no fallback to gross or partial net classification."},{"caseId":"C3-E14-21","caseType":"selected_entity_context","input":"For the selected review period, show my gross current win streak.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","selected review period"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context is trusted and account-scoped."},{"caseId":"C3-E14-22","caseType":"cross_category","input":"Explain the documented difference between my July and June gross ending win streaks.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["consecutive_wins"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","June"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross ending wins run"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","stable ordering"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented sequence differences without causal attribution or advice."}]
```

### consecutive_losses

```json
[{"caseId":"C3-E15-01","caseType":"canonical","input":"How many consecutive losses do I have at the end of July, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current is the ending run at the filtered population boundary, not maximum."},{"caseId":"C3-E15-02","caseType":"formal_paraphrase","input":"Determine the current ending sequence of gross losses among July realized round trips.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ordering is close UTC then stable round-trip ID."},{"caseId":"C3-E15-03","caseType":"conversational_paraphrase","input":"What is my current loss streak for June, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","June"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current means the ending run in the filtered population."},{"caseId":"C3-E15-04","caseType":"trader_slang","input":"What was my gross loss streak at the end of last week?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","last week"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The end-of-period wording selects the ending run, not a maximum streak."},{"caseId":"C3-E15-05","caseType":"abbreviation","input":"CL current loss streak for July, gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit current loss-streak grammar","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"CL is accepted only alongside explicit current loss-streak grammar."},{"caseId":"C3-E15-06","caseType":"misspelling","input":"Show my consective losses in July, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize spelling without changing run meaning."},{"caseId":"C3-E15-07","caseType":"noisy_input","input":"losses streak July gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Flat and unknown outcomes are barriers, never dropped or bridged."},{"caseId":"C3-E15-08","caseType":"command","input":"Calculate my net ending loss streak for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["current ending run","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition","fee-complete net classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Net fee gaps remain explicit barriers and coverage."},{"caseId":"C3-E15-09","caseType":"fragment","input":"Gross current loss streak this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","this month"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},{"caseId":"C3-E15-10","caseType":"follow_up","input":"What is my current loss streak there, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","prior range"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior ordered population."},{"caseId":"C3-E15-11","caseType":"correction","input":"I meant my net current loss streak, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["current ending run","net","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition","fee-complete net classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes selected basis and barrier coverage."},{"caseId":"C3-E15-12","caseType":"comparison","input":"Compare my ending gross loss streaks for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","June"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross ending losses run"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","each period ends at its own filtered boundary","stable ordering"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison does not convert either run into a maximum."},{"caseId":"C3-E15-13","caseType":"ranking","input":"Which month ended with my longest gross loss streak this year?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","this year"],"expectedGroupings":["month"],"expectedOperators":["current ending run","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"this year","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","each grouped month has its own boundary","stable ordering"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranks ending runs by month, not maximum historical streaks."},{"caseId":"C3-E15-14","caseType":"negation","input":"Count the current gross run of results that are not wins or flat in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","outcome negation"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only exact selected-basis outcomes extend the run."},{"caseId":"C3-E15-15","caseType":"exclusion","input":"Show my July gross loss streak excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion applies before ordering and barrier evaluation."},{"caseId":"C3-E15-16","caseType":"multi_filter","input":"Show my net current loss streak for short NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July","short","NVDA"],"expectedGroupings":[],"expectedOperators":["current ending run","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition","all included rows fee-complete"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fee-incomplete, flat, or unknown outcomes break rather than bridge the run."},{"caseId":"C3-E15-17","caseType":"multi_part","input":"Show my gross current loss streak and the last barrier in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["consecutive_losses","retrieve_records"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","retrieve last barrier evidence","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["server-authoritative account scope","close UTC then stable round-trip ID","one currency and timezone partition","bounded ordered outcome evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Calculate the current run and retrieve only its documented last barrier as bounded evidence, without causation."},{"caseId":"C3-E15-18","caseType":"ambiguous","input":"What is my current consecutive loss streak in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["current ending run"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["basis required","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate the current consecutive loss streak from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current streak meaning is explicit; clarify gross versus net basis only."},{"caseId":"C3-E15-19","caseType":"negative_example","input":"Using evidence only, explain my gross current loss streak ending in July.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","identify ending barrier"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["ordered outcome evidence","no causation or advice","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain the documented ending barrier for the gross current streak without assigning cause or advice."},{"caseId":"C3-E15-20","caseType":"unsupported_data","input":"Show my net current loss streak while skipping trades with missing fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-incomplete net"],"expectedGroupings":[],"expectedOperators":["current ending run","net"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee completeness coverage","stable ordering"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee-incomplete net outcomes are explicit barriers and coverage; they cannot be skipped or bridged.","notes":"Fee-incomplete net outcomes remain explicit barriers and coverage at any period scope; no fallback to gross or partial net classification."},{"caseId":"C3-E15-21","caseType":"selected_entity_context","input":"For the selected review period, show my gross current loss streak.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","selected review period"],"expectedGroupings":[],"expectedOperators":["current ending run","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context is trusted and account-scoped."},{"caseId":"C3-E15-22","caseType":"cross_category","input":"Explain the documented difference between my July and June gross ending loss streaks.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["consecutive_losses"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","June"],"expectedGroupings":[],"expectedOperators":["current ending run","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross ending losses run"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","stable ordering"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented sequence differences without causal attribution or advice."}]
```


### maximum_win_streak

```json
[
{"caseId":"C3-E16-01","caseType":"canonical","input":"What was my longest gross win streak in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Returns the longest historical run, not the current ending run."},
{"caseId":"C3-E16-02","caseType":"formal_paraphrase","input":"Determine the historical maximum sequence of gross winning realized round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses deterministic historical ordering."},
{"caseId":"C3-E16-03","caseType":"conversational_paraphrase","input":"What was my biggest string of wins in June, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","June"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Biggest string means historical maximum."},
{"caseId":"C3-E16-04","caseType":"trader_slang","input":"What was my longest heater last week, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","last week"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Longest heater has explicit maximum grammar."},
{"caseId":"C3-E16-05","caseType":"abbreviation","input":"Show my MWS (maximum win streak) for July, gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit maximum win streak grammar","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"MWS is safe only with explicit maximum win streak grammar."},
{"caseId":"C3-E16-06","caseType":"misspelling","input":"Show my maximim win streak for July, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize only explicit maximum wording."},
{"caseId":"C3-E16-07","caseType":"noisy_input","input":"longest win streak july gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Flat and unknown outcomes are barriers, never dropped or bridged."},
{"caseId":"C3-E16-08","caseType":"command","input":"Calculate my net longest win run for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","fee-complete net classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fee-incomplete net rows are barriers."},
{"caseId":"C3-E16-09","caseType":"fragment","input":"Maximum gross win streak this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","this month"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},
{"caseId":"C3-E16-10","caseType":"follow_up","input":"What was the longest win run there, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","prior range"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior ordered population."},
{"caseId":"C3-E16-11","caseType":"correction","input":"I meant the net maximum win streak, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","net","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","close UTC then stable round-trip ID","fee-complete net classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes only the selected basis."},
{"caseId":"C3-E16-12","caseType":"comparison","input":"Compare my longest gross win streaks for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","June"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross maximum win streak"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","stable ordering","separate period populations"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both values use the same maximum definition."},
{"caseId":"C3-E16-13","caseType":"ranking","input":"Which ticker had my longest gross win streak in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["historical maximum run","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","stable ordering","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranks ticker-specific historical maxima."},
{"caseId":"C3-E16-14","caseType":"negation","input":"Show my longest gross run that was not a loss or flat in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross","outcome negation"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["stable ordering","flat and unknown barriers","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only exact positive outcomes extend a run."},
{"caseId":"C3-E16-15","caseType":"exclusion","input":"Show my July gross maximum win streak excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is applied before ordering and barrier evaluation."},
{"caseId":"C3-E16-16","caseType":"multi_filter","input":"Show my net maximum win streak for long NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-complete net","July","long","NVDA"],"expectedGroupings":[],"expectedOperators":["historical maximum run","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["stable ordering","fee-complete net classification","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No fee-incomplete row may bridge a run."},
{"caseId":"C3-E16-17","caseType":"multi_part","input":"Show my July gross maximum win streak and its documented start and end trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["maximum_win_streak","retrieve_records"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","retrieve start and end run evidence","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["stable ordering","account scope","one currency and timezone partition","bounded start and end run evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Calculate the maximum streak and retrieve only its documented start and end trades as bounded evidence, without causation."},
{"caseId":"C3-E16-18","caseType":"ambiguous","input":"What is my maximum win streak in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["basis required","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate the maximum win streak from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Maximum streak meaning is explicit; clarify gross versus net basis only."},
{"caseId":"C3-E16-19","caseType":"negative_example","input":"Why did my longest win streak happen in July?","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["ordered outcome evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A maximum streak cannot establish why it occurred.","notes":"Do not infer causation."},
{"caseId":"C3-E16-20","caseType":"unsupported_data","input":"Show my net maximum win streak while skipping trades with missing fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","net realized P/L greater than zero","fee-incomplete net"],"expectedGroupings":[],"expectedOperators":["historical maximum run","net"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee completeness coverage","stable ordering"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee-incomplete net outcomes are barriers and cannot be skipped or bridged.","notes":"Fee-incomplete net outcomes remain barriers at any period scope; no fallback to gross or partial net classification."},
{"caseId":"C3-E16-21","caseType":"selected_entity_context","input":"For the selected review period, show my gross maximum win streak.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","selected review period"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context must be trusted and account-scoped."},
{"caseId":"C3-E16-22","caseType":"cross_category","input":"Explain the documented difference between my July and June gross maximum win streaks.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["maximum_win_streak"],"expectedFilters":["ready_closed","gross realized P/L greater than zero","July","June"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross maximum win streak"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","stable ordering"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented differences without causal attribution or advice."}
]
```

### maximum_loss_streak

```json
[
{"caseId":"C3-E17-01","caseType":"canonical","input":"What was my longest gross loss streak in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Returns the longest historical run, not the current ending run."},
{"caseId":"C3-E17-02","caseType":"formal_paraphrase","input":"Determine the historical maximum sequence of gross losing realized round trips in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Uses deterministic historical ordering."},
{"caseId":"C3-E17-03","caseType":"conversational_paraphrase","input":"What was my biggest string of losses in June, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","June"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"June","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Biggest string means historical maximum."},
{"caseId":"C3-E17-04","caseType":"trader_slang","input":"What was my longest cold streak last week, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","last week"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"last week","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Longest cold streak has explicit maximum grammar."},
{"caseId":"C3-E17-05","caseType":"abbreviation","input":"Show my MLS (maximum loss streak) for July, gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["explicit maximum loss streak grammar","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"MLS is safe only with explicit maximum loss streak grammar."},
{"caseId":"C3-E17-06","caseType":"misspelling","input":"Show my maximim loss streak for July, gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Normalize only explicit maximum wording."},
{"caseId":"C3-E17-07","caseType":"noisy_input","input":"longest loss streak july gross pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Flat and unknown outcomes are barriers, never dropped or bridged."},
{"caseId":"C3-E17-08","caseType":"command","input":"Calculate my net longest loss run for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","fee-complete net classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fee-incomplete net rows are barriers."},
{"caseId":"C3-E17-09","caseType":"fragment","input":"Maximum gross loss streak this month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","this month"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"this month","expectedSelectedEntity":null,"expectedContextRequirements":["account scope","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bounded fragment is sufficient."},
{"caseId":"C3-E17-10","caseType":"follow_up","input":"What was the longest loss run there, gross?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","prior range"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"prior range","expectedSelectedEntity":null,"expectedContextRequirements":["trusted prior query","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Requires trusted prior ordered population."},
{"caseId":"C3-E17-11","caseType":"correction","input":"I meant the net maximum loss streak, not gross, for July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","net","basis correction"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["prior query","close UTC then stable round-trip ID","fee-complete net classification"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes only the selected basis."},
{"caseId":"C3-E17-12","caseType":"comparison","input":"Compare my longest gross loss streaks for July and June.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","June"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross maximum loss streak"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["same account scope","stable ordering","separate period populations"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both values use the same maximum definition."},
{"caseId":"C3-E17-13","caseType":"ranking","input":"Which ticker had my longest gross loss streak in July?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":["ticker"],"expectedOperators":["historical maximum run","gross","descending","top one"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["deterministic tie policy","stable ordering","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranks ticker-specific historical maxima."},
{"caseId":"C3-E17-14","caseType":"negation","input":"Show my longest gross run that was not a win or flat in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross","outcome negation"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["stable ordering","flat and unknown barriers","account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only exact negative outcomes extend a run."},
{"caseId":"C3-E17-15","caseType":"exclusion","input":"Show my July gross maximum loss streak excluding SPY.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","exclude SPY"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross","exclude"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["SPY symbol resolution","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion is applied before ordering and barrier evaluation."},
{"caseId":"C3-E17-16","caseType":"multi_filter","input":"Show my net maximum loss streak for short NVDA trades in July.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-complete net","July","short","NVDA"],"expectedGroupings":[],"expectedOperators":["historical maximum run","net"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["stable ordering","fee-complete net classification","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No fee-incomplete row may bridge a run."},
{"caseId":"C3-E17-17","caseType":"multi_part","input":"Show my July gross maximum loss streak and its documented start and end trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":["maximum_loss_streak","retrieve_records"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run","retrieve start and end run evidence","gross"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["stable ordering","account scope","one currency and timezone partition","bounded start and end run evidence"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Calculate the maximum streak and retrieve only its documented start and end trades as bounded evidence, without causation."},
{"caseId":"C3-E17-18","caseType":"ambiguous","input":"What is my maximum loss streak in July?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["basis required","close UTC then stable round-trip ID"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should I calculate the maximum loss streak from gross P/L before fees or net P/L after recorded fees?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Maximum streak meaning is explicit; clarify gross versus net basis only."},
{"caseId":"C3-E17-19","caseType":"negative_example","input":"Why did my longest loss streak happen in July?","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","July"],"expectedGroupings":[],"expectedOperators":["historical maximum run"],"expectedComparison":null,"expectedTimeRange":"July","expectedSelectedEntity":null,"expectedContextRequirements":["ordered outcome evidence","no causation claim","account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"A maximum streak cannot establish why it occurred.","notes":"Do not infer causation."},
{"caseId":"C3-E17-20","caseType":"unsupported_data","input":"Show my net maximum loss streak while skipping trades with missing fees.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","net realized P/L less than zero","fee-incomplete net"],"expectedGroupings":[],"expectedOperators":["historical maximum run","net"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["fee completeness coverage","stable ordering"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Fee-incomplete net outcomes are barriers and cannot be skipped or bridged.","notes":"Fee-incomplete net outcomes remain barriers at any period scope; no fallback to gross or partial net classification."},
{"caseId":"C3-E17-21","caseType":"selected_entity_context","input":"For the selected review period, show my gross maximum loss streak.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","selected review period"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross"],"expectedComparison":null,"expectedTimeRange":"selected review period","expectedSelectedEntity":"selected review period","expectedContextRequirements":["trusted selected period","close UTC then stable round-trip ID","one currency and timezone partition"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context must be trusted and account-scoped."},
{"caseId":"C3-E17-22","caseType":"cross_category","input":"Explain the documented difference between my July and June gross maximum loss streaks.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["compare_groups","calculate_metric"],"expectedCanonicalConcepts":["maximum_loss_streak"],"expectedFilters":["ready_closed","gross realized P/L less than zero","July","June"],"expectedGroupings":[],"expectedOperators":["historical maximum run","gross","period comparison"],"expectedComparison":{"left":"July","right":"June","basis":"gross maximum loss streak"},"expectedTimeRange":"June and July","expectedSelectedEntity":null,"expectedContextRequirements":["comparison evidence","no causation or advice","stable ordering"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain documented differences without causal attribution or advice."}
]
```

# 8. Coverage Report Deliverable

## 8.1 Inventory Coverage

| Measure | Count |
|---|---:|
| Controlling inventory items | 17 |
| Completed canonical-inventory deliverables | 17 |
| Incomplete items | 0 |
| Proposed additions | 0 |
| Proposed removals or merges | 0 |
| Locked canonical names | 17 |

## 8.2 Language Coverage

| Measure | Count |
|---|---:|
| Complete Version 1 registry entries | 17 of 17 |
| Pending registry entries | 0 of 17 |
| Mandatory subsections complete | 646 of 646 |
| Evaluation cases | 374 of 374 passed |

Language Registry Batches 1 and 2 cover C3-OUT-001 through C3-OUT-017.
Section 7 Evaluation arrays cover C3-OUT-001 through C3-OUT-017 and passed
final independent Terra review.

## 8.3 Evaluation Coverage

| Measure | Count |
|---|---:|
| Total evaluation cases | 374 |
| Passed | 374 |
| Failed | 0 |
| Clarification cases | 18 |
| Unsupported cases | 31 |
| Cross-category cases | 17 |

## 8.4 Data and Tool Coverage

- **Required data:** authorized account scope; current active projection state;
  ready-closed value facts; selected gross/net basis; fee evidence for net;
  round-trip ID/close time; currency; account IANA timezone; and coverage/Data
  Decision state.
- **Optional data:** later approved filters, selected UI entity, presentation
  preferences, and user-labelled dimensions under their owners.
- **Missing data:** missing/unsupported fee facts for a net basis; unsupported
  value convention; and any user request that does not resolve required basis,
  population, calendar, or streak meaning.
- **Tool targets:** replacement fact set, versioned registry, exact math,
  shared accumulator, grouped result service, and read-only Journal Analytics
  query/result contracts.
- **Tools not yet implemented:** AI Chat language interpreter, validator, tool
  router, and answer runtime.
- **Unsupported capabilities:** approximate scratch thresholds, inferred
  Data-Decision outcomes, outcome classification from market data, calendar
  zero-fill without a contract, cross-account results, and behavior/causation/
  advice claims from outcomes.

## 8.5 Overlap Review

- **Duplicate concepts found:** none in the controlling list.
- **Synonym collisions:** flat/breakeven; win/loss versus green/red; current,
  ending, longest, and maximum streak; and “trades” versus executions/open
  positions/closed round trips.
- **Cross-category conflicts:** none resolved by this inventory; Category 2/5
  retains money basis and fee definitions, Category 13 retains date/time
  language, and Category 14 retains comparison/ranking grammar.
- **Terms requiring global ambiguity policy:** win, loss, flat, breakeven,
  scratch, trade count, green/red day, rate, current streak, and longest
  streak.
- **Terms requiring user-defined aliases:** none identified.

## 8.6 Remaining Gaps

- Planned and Unavailable capability statuses remain explicit, reviewed,
  non-blocking implementation or evidence gaps.
- The production AI Chat language interpreter, validator, tool router, and
  answer runtime remain planned implementation boundaries; they do not block
  approval, locking, or completion of this inventory.

There is no remaining inventory, review, approval, or locking blocker.

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
- [x] Duplicate concepts are resolved for planning; the lead accepted the alias decisions.

## Canonical Inventory

- [x] Every item has a stable inventory ID.
- [x] Every item has a canonical name.
- [x] Every item has an exact definition.
- [x] Related concepts are distinguished.
- [x] Classification, status, and version are present.

## Language Registry

Language Registry Batches 1 and 2 are production-complete: 17 of 17 registry
entries and 646 of 646 mandatory subsections. They are approved and locked at
Version 1.

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

- [x] Required and optional data are documented.
- [x] Valid filters are documented.
- [x] Valid groupings are documented.
- [x] Valid operators are documented.
- [x] Compatible intents are documented.
- [x] Incompatible combinations are documented.
- [x] Defaults are documented.
- [x] Clarification conditions are documented.
- [x] Unsupported conditions are documented.
- [x] Tool targets are documented.
- [x] Units, fees, open trades, and sample-size rules are documented.

## Evaluation

- [x] Evaluation cases exist for every important concept.
- [x] Expected structured interpretations are present.
- [x] Negative examples are saved.
- [x] Ambiguous cases are saved.
- [x] Unsupported cases are saved.
- [x] Cross-category cases are saved where needed.

## Coverage Report

- [x] Counts are complete.
- [x] Gaps are listed.
- [x] Overlaps are reviewed for planning.
- [x] Unsupported capabilities are listed.
- [x] No unresolved blocker is hidden.

## Approval

- [x] Category reached Ready for Review.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] Version is updated.
- [x] Master tracker is updated.
- [x] Change log is updated.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Independent Terra review covered all 17 canonical records, all 17 language
  registries, and all 374 structured evaluation cases.
- Review findings covering population defaults, selected-basis eligibility,
  currency partitioning, zero denominators, lifecycle and streak semantics,
  natural wording, and structural fence artifacts were remediated.
- Final independent Terra review returned PASS with no remaining required
  changes. Planned and Unavailable capabilities and the future AI Chat runtime
  are accepted non-blocking documented gaps.

## Required Changes

- None. All required independent-review changes are complete.

## Completed Changes

- Completed and independently reviewed all 17 canonical records, all 17
  language registries with 38 required headings each, and all 374 evaluation
  cases across 17 arrays.
- Applied every required review remediation and recorded the final independent
  Terra PASS.
- Recorded the lead project controller's Version 1 approval, canonical-name
  lock, and Complete decision clerically without independently approving it.

## Approval Decision

- Status: Complete.
- Approved by: Lead project controller after independent Terra review.
- Approval date: 2026-08-10.
- Version: 1.
- Canonical names locked: Yes.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-10 | Created Category 3 Version 0 planning draft with the exact 17-item controlling inventory; deferred Sections 5–7. | Begin bounded inventory planning without claiming language coverage, evaluation, approval, locking, completion, or production AI Chat. | 0 |
| 2026-08-10 | Recorded lead acceptance of the planning/controlling inventory and the `trade_count` and direct-outcome-basis defaults; advanced to Deliverables In Progress. | Authorize Sections 5–7 production while retaining Version 0, no canonical-name lock, and no category completion claim. | 0 |
| 2026-08-10 | Completed Version 0 canonical-record Batch 1 for C3-OUT-001 through C3-OUT-009; retained C3-OUT-010 through C3-OUT-017 as pending. | Produce only the authorized first nine Section 5 records without language registry, evaluation, approval, lock, version, or status changes. | 0 |
| 2026-08-10 | Completed Version 0 canonical-record Batch 2 for C3-OUT-010 through C3-OUT-017; all 17 Section 5 records are now production-complete. | Finish only the authorized canonical-record deliverable while retaining Sections 6–7, approval, lock, Version 0, and category completion boundaries. | 0 |
| 2026-08-10 | Completed Version 0 Language Registry Batch 1 for C3-OUT-001 through C3-OUT-009, with every mandatory subsection. | Produce only the authorized first nine Section 6 registries while retaining the eight remaining registries, Section 7 evaluation, approval, lock, Version 0, and category completion boundaries. | 0 |
| 2026-08-10 | Completed Version 0 Language Registry Batch 2 for C3-OUT-010 through C3-OUT-017, with every mandatory subsection. | Produce only the authorized final eight Section 6 registries while retaining Section 7 evaluation, approval, lock, Version 0, and category completion boundaries. | 0 |
| 2026-08-10 | Saved Version 0 Section 7 Evaluation Batch 1 for C3-OUT-001 through C3-OUT-003 (66 cases). | Produce only the authorized three-concept evaluation batch; retain 308 pending cases, unreviewed status, approval, lock, Version 0, and category completion boundaries. | 0 |
| 2026-08-10 | Appended Section 7 arrays for breakeven_trades, open_trades, and closed_trades (66 cases). | Save three additional 22-case arrays with exact-zero basis, legitimate-open, and shared ready-closed boundaries; retain 242 pending cases, unreviewed status, approval, lock, Version 0, and category completion boundaries. | 0 |
| 2026-08-10 | Appended Section 7 arrays for win_rate, loss_rate, and breakeven_rate (66 cases). | Save three additional 22-case arrays with identical selected-basis numerator/denominator populations, focused gross/net clarification, fee-complete net coverage, and outcome-rate boundaries; retain 176 pending cases, unreviewed status, approval, lock, Version 0, and category completion boundaries. | 0 |
| 2026-08-10 | Appended Section 7 arrays for green_days, red_days, and flat_days (66 cases). | Save three additional 22-case arrays with selected-basis closing-date buckets, fee-complete net-date coverage, exact-zero flat, no zero-fill, and no-causation boundaries; retain 110 pending cases, unreviewed status, approval, lock, Version 0, and category completion boundaries. | 0 |
| 2026-08-10 | Appended Section 7 arrays for percentage_of_profitable_days, consecutive_wins, and consecutive_losses (66 cases). | Save three additional 22-case arrays with direct gross/net clarification, complete classified date-bucket rates, ending-run boundaries, stable ordering, explicit barriers, and no-causation boundaries; retain 44 pending cases, unreviewed status, approval, lock, Version 0, and category completion boundaries. | 0 |
| 2026-08-10 | Saved the Section 7 array for maximum_win_streak (22 cases). | Add only the longest-historical-run array with explicit gross or fee-complete net basis, stable ordering, barrier coverage, clarification, and no-causation/advice boundaries; retain review, approval, locking, Version 0, and category completion as pending. | 0 |
| 2026-08-10 | Saved the Section 7 array for maximum_loss_streak (22 cases). | Complete the saved, unreviewed evaluation set with longest-historical-run semantics, explicit gross or fee-complete net basis, stable ordering, barriers, clarification, and no-causation/advice boundaries. | 0 |
| 2026-08-10 | Recorded final independent Terra PASS and the lead project controller's approval and canonical-name lock; finalized Category 3 as Complete. | Close the reviewed 17-concept inventory with 17 approved registries and 374 passing evaluation cases while retaining documented non-blocking implementation gaps. | 1 |
