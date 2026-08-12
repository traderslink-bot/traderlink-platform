# Category 17: Ambiguity Language

# Category Metadata

| Field | Value |
|---|---|
| Category name | Ambiguity Language |
| Category number | 17 |
| Category slug | ambiguity-language |
| File name | 17-ambiguity-language.md |
| Category type | Ambiguity detection and clarification routing |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-11 |
| Last updated | 2026-08-12 |
| Dependencies | Locked Categories 1-16; Category 15 accepted-query and pending-ambiguity lifecycle; Category 19 policy; Category 20 evaluation |
| Owner | AI language inventory workflow |

The exact Version 0 seventeen-record controlling inventory independently
PASSed planning review and was accepted by the lead controller on 2026-08-11.
The master tracker is synchronized and canonical production is authorized.
All seventeen canonical records and all seventeen language registries
independently PASSed and were accepted by the controller at Version 0.
All six evaluation batches, all 17 arrays, and all 374 required cases
independently PASSed comprehensive pre-lock review. There are zero failed,
unreviewed, or pending cases. On 2026-08-12 the lead controller approved and
locked the exact seventeen canonical names and all seventeen registries at
Version 1. Final completion is synchronized in the master tracker and the
category is Complete. Nothing here
implements a parser, model, resolver, query tool, conversation store, analytics
runtime, or data access.

---

# 1. Category Purpose

Category 17 defines how the future AI Companion recognizes materially
ambiguous trader language, preserves every plausible authorized meaning, and
selects a safe next step without silently changing the answer. It owns the
ambiguity-routing contract for the seventeen priority phrases declared by the
master plan. It does not own the underlying intent, metric, dimension,
operator, time, ranking, comparison, slang, or conversation-state meaning.

This category must support:

- detecting when one phrase has multiple materially different interpretations;
- using only explicit message content or trusted, typed, current, unique,
  server-authorized context to resolve an interpretation;
- applying one shared decision ladder: safe resolution, an explicitly stated
  assumption only where the owning contract permits it, or focused
  clarification;
- asking one question about the highest-impact unresolved field, then staging
  later questions instead of presenting a compound checklist;
- retaining the accepted query unchanged while clarification remains pending;
- distinguishing ambiguity from missing data, unavailable capability,
  unsupported requests, and protected actions;
- preserving same-account authorization, minimum necessary context, and
  privacy-safe output without raw identifiers; and
- routing a resolved meaning to its locked owner without changing that owner's
  formula, basis, population, threshold, coverage, or capability status.

This category does not establish a global confidence number, invent defaults,
calculate a result, define subjective quality, diagnose motive, infer cause,
give trading advice, predict performance, authorize a write, expose another
account's information, or claim runtime support.

---

# 2. Category Boundaries

## Included

- The seventeen master-priority ambiguity families in exact source order:
  best, worst, better, profit, size, risk, later trades, recent, cheap stocks,
  scalp, overtrading, good trade, bad trade, normal size, large loss,
  performance, and consistency.
- Possible-meaning preservation, trusted context signals, safe-resolution
  conditions, explicitly labelled assumption constraints, clarification
  conditions, first clarification wording, and positive/negative routing
  examples for each family.
- Materiality checks: clarification is required when choosing among plausible
  meanings would change the metric, formula, basis, units, population, group,
  time/event scope, threshold, ordering, result, availability, or authorization.
- One-field-at-a-time clarification ordering and handoff to Category 15's
  accepted-query/pending-ambiguity lifecycle.
- Privacy-safe same-account ambiguity resolution and cross-category routing to
  locked owners.

## Excluded

- Ranking and comparison semantics such as `best`, `worst`, and `better_than`,
  which remain owned by Category 14 after ambiguity resolves.
- Profit, outcome, edge, fee, size, time, execution, behaviour, candle, and
  dimension definitions owned by Categories 2-11.
- Operators and date/time resolution owned by Categories 12-13.
- Follow-up, correction, accepted-query revision, selected-entity resolution,
  and pending-ambiguity storage owned by Category 15.
- Generic and account-scoped trader vocabulary, including price terms and
  user-defined label resolution, owned by Category 16.
- Response format owned by Category 18; privacy, retention, advice, causation,
  evidence, and unsupported-request policy owned by Category 19; and final
  cross-category proof owned by Category 20.
- Creating, editing, saving, or applying a label, definition, threshold, rule,
  alias, metric, or preference. Any future protected action remains subject to
  its own draft, authorization, and confirmation contract.
- Treating a clarification response as permission to access a new account,
  reveal private candidates, mutate accepted state, or bypass an unavailable
  or unsupported boundary.

## Cross-Category References

- Category 1 owns the resolved primary/secondary intent and protected-action
  boundary.
- Categories 2-10 own exact metrics and evidence, including gross/net P/L,
  position-size measures, approved risk facts, behaviour proxies, and
  consistency formulas.
- Category 11 owns dimensions, explicit user-authored factual labels, saved
  definitions, price buckets, and population/grouping fields.
- Categories 12-14 own operators, date/time contracts, ranking, comparison,
  direction, baselines, denominators, limits, and ties.
- Category 15 owns the two-track state transition: accepted query remains
  unchanged while a validator-accepted privacy-safe ambiguity record is
  pending.
- Category 16 owns exact/fuzzy vocabulary matching, trader slang, label-class
  collisions, same-account user-defined aliases, and ticker-like/abbreviation
  token-class safety. Category 17 consumes only its privacy-safe resolved or
  unresolved token/class state; it does not choose a ticker, abbreviation, or
  label meaning itself.
- Category 18 may change presentation only after the query resolves.
- Categories 19 and 20 own global policy and final evaluation respectively.

---

# 3. Planning Analysis

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?** It prevents a plausible
   phrase from being silently forced into one materially different analytics
   meaning. It records the ambiguity family, preserves authorized candidates,
   resolves from trusted evidence when unique, or asks the smallest useful
   clarification.
2. **What canonical concepts belong here?** Exactly seventeen ambiguity-routing
   families, `C17-AMB-001` through `C17-AMB-017`, in the master priority order.
   Safe resolution, stated assumption, and clarification are shared steps in
   one decision ladder, not additional inventory records.
3. **What related concepts belong elsewhere?** Every candidate meaning and
   resulting calculation remains with its locked owner. Category 17 may select
   an owner route but may not redefine or merge the owner concepts.
4. **What data is required?** Original user wording; parsed candidate fields;
   current locked registry versions; server-derived user/workspace/Journal-
   account scope; trusted typed accepted-query and selected-entity context;
   authorized same-account saved definitions where applicable; candidate owner,
   capability, coverage, and materiality metadata; and a privacy-safe pending
   ambiguity reference supplied through Category 15 when needed.
5. **Which deterministic tools will answer these requests?** A locked-registry
   candidate router; typed context validator; authorization gate; candidate
   compatibility/materiality checker; versioned saved-definition resolver;
   capability/coverage checker; highest-impact-field selector; clarification
   renderer; and Category 15 atomic state-transition validator. These are
   planned contracts, not implemented Chat capabilities.
6. **Which concepts are directly observed?** The message text, explicitly named
   metric/basis/threshold/period/group, authorized stored definition or label,
   and trusted typed context are observed facts.
7. **Which concepts are deterministically derived?** Candidate-owner sets,
   compatibility, uniqueness, materiality, required-field gaps, clarification
   priority, and whether an owning capability is Planned, Unavailable, or
   Unsupported can be derived from approved registries and authorized state.
8. **Which concepts are proxy indicators?** `overtrading`, `good`, `bad`,
   `risk`, `performance`, and `consistency` may point to an approved factual
   proxy only after that proxy is explicitly selected. No proxy proves motive,
   quality, discipline, cause, or future edge.
9. **Which concepts are user-labelled?** `cheap stocks`, `scalp`,
   `overtrading`, `good trade`, `bad trade`, `normal size`, `large loss`, and
   other terms may use an authorized same-account saved definition or label.
   The stored version, class, applicability, and coverage must resolve first.
10. **Which concepts are not measurable?** Ambiguity itself is a routing state,
    not a trading metric. Undefined quality, goodness, badness, normality,
    cheapness, riskiness, scalp style, overtrading, consistency, or overall
    performance is not measurable until an approved owner contract resolves.
11. **Which terms are ambiguous?** The seventeen controlling phrases are the
    exact priority set. Their main unresolved fields include metric, direction,
    gross/net basis, units, threshold, comparison baseline, population, event,
    time window, label class, saved definition, process criterion, and sample
    contract.
12. **What defaults are safe?** There is no hidden semantic default for any of
    the seventeen records. A meaning may resolve without a question only when
    explicit wording or trusted typed current context yields one authorized,
    compatible, materially complete interpretation. An explicitly stated
    assumption is allowed only where the owning locked/source contract permits
    it, must be labelled before the result, must not alter authorization or a
    protected action, and must remain easily correctable. Otherwise clarify.
13. **What conditions require clarification?** Ask when two or more authorized
    compatible meanings remain and the choice materially changes the answer;
    when a required metric, basis, unit, threshold, population, period, event,
    baseline, definition, or label class is missing; when context is stale,
    untyped, unauthorized, or non-unique; or when a supposedly safe assumption
    is not explicitly permitted by the owning contract.
14. **What combinations are invalid?** Cross-account candidate loading;
    client-claimed authorization; raw IDs or private candidate lists in model,
    logs, errors, or output; using recency alone as identity; silently choosing
    gross/net, high/low, quantity/notional/exposure, ordinal/time/event,
    threshold, baseline, saved definition, quality score, or consistency
    formula; treating missing data as a clarification choice; converting an
    unavailable owner capability into Planned/Supported; applying a pending
    candidate as accepted state; diagnosing cause or motive; recommending a
    trade; or mutating data.
15. **What evaluation coverage proves completion?** Later Sections 5-8 must
    cover every record with all 22 required case types, each plausible owner
    route, explicit trusted-context resolution, labelled-assumption boundaries,
    highest-impact clarification, sequential follow-up clarification, stale and
    missing context, correction, unavailable and unsupported distinctions,
    same-account and cross-account cases, privacy/no-ID cases, no-cause/no-advice
    cases, ticker-like and abbreviation collisions routed through Category 16,
    and exact Category 15 pending-state behavior.

## 3.2 Dependencies

- **Locked language owners:** Categories 1-16 supply the only allowed candidate
  meanings. Category 17 must reference their current approved versions and must
  never synthesize another metric, dimension, threshold, ranking, or slang
  meaning.
- **Authorization:** The server supplies the current Platform user, workspace,
  Journal account, and permitted data scope. Text, an opaque identifier, an
  alias, a selected UI row, or prior conversation prose is not authorization.
- **Structured context:** Category 15 supplies the latest accepted query
  revision and separately trusted typed selected entities. Context is used only
  when current, unique, type-compatible, and revalidated in the same authorized
  account.
- **Pending lifecycle:** Category 15 alone stores, replaces, clears, and applies
  a pending ambiguity record. Category 17 provides the unresolved field,
  privacy-safe candidate classes, question priority, and expected answer type;
  it does not partially update accepted query state.
- **Saved definitions:** Category 16 and Category 11 supply only authorized,
  active, compatible, versioned same-account aliases/definitions and coverage.
  Fuzzy, deprecated, colliding, cross-class, or cross-account candidates cannot
  silently resolve meaning. Category 16 must also resolve or preserve every
  ticker-like/abbreviation token-class collision before Category 17 may use a
  vocabulary candidate; token shape never establishes a ticker, abbreviation,
  label class, or analytics meaning.
- **Capability and data state:** Each candidate owner supplies its exact
  `Planned`, `Unavailable`, or `Unsupported` state and required data. Ambiguity
  resolution never invents evidence or upgrades capability.
- **Future policy/evaluation:** Category 19 must lock global privacy, disclosure,
  causation, advice, provider, logging, and unsupported-request policy; Category
  20 must prove end-to-end behavior.
- **Unsupported dependencies:** Raw database access, arbitrary note/screenshot/
  browser inference, another account's labels or facts, unrestricted SQL, V3
  fallback, unapproved model confidence, unapproved universal thresholds,
  current-market facts without an authorized provider contract, and any write
  or state change outside the approved Category 15 validator.

## 3.3 Shared Ambiguity Decision Ladder

The following ladder applies to every record. It is a shared routing procedure,
not three additional canonical records.

1. **Preserve candidates.** Retain every plausible candidate that is owned by a
   locked category and compatible with the explicit message. Remove a candidate
   only through a documented type, authorization, capability, or contradiction
   check; do not discard it because another meaning is more common.
2. **Safe resolution.** Resolve without asking only when explicit wording or
   trusted typed current context leaves exactly one authorized, compatible,
   materially complete meaning. Revalidate account, type, version, capability,
   and coverage at the current turn.
3. **Explicitly stated assumption.** Use only when the owning source/locked
   contract explicitly permits an assumption and the choice does not bypass
   authorization, unavailable data, privacy, confirmation, or a protected
   action. State the exact assumption before the answer and retain correction
   support. A common or convenient interpretation is not permission.
4. **Focused clarification.** If a material choice remains, ask one question
   about the highest-impact unresolved field. Do not ask for metric, basis,
   population, time, threshold, grouping, and format in one prompt. Stage the
   remaining questions after the user's answer.
5. **State isolation.** A validator-accepted `clarification_needed` result may
   create or replace only Category 15's privacy-safe pending record tied to the
   unchanged accepted-query revision. It supplies no query value. A complete
   validated clarification atomically clears it and creates the next accepted
   revision; a still-ambiguous answer replaces only the pending record.
6. **Truthful terminal state.** If data is missing, say unavailable; if product
   policy rejects the request, say unsupported; if a capability is designed but
   not active, keep Planned. Do not use clarification to disguise any of these
   states.

## 3.4 Priority Ambiguity Resolution Matrix

This planning matrix defines the main candidate meanings and the first field to
resolve. Detailed positive/negative examples and full registry wording remain
deferred to Sections 5-8.

| # | Canonical ambiguity | Main possible meanings | Trusted resolution signals | Safe default | First focused clarification when unresolved |
|---:|---|---|---|---|---|
| 1 | `best_ambiguity` | Highest result under an explicit metric/direction; approved balanced score; subjective quality or recommendation | Explicit locked metric/score, direction, population, N, ties, and current accepted query | None | Which metric or approved score should define best? |
| 2 | `worst_ambiguity` | Lowest result under an explicit metric/direction; largest loss by signed or absolute basis; subjective quality | Explicit metric, direction, sign/absolute basis, population, N, ties, and current accepted query | None | Which metric should define worst? |
| 3 | `better_ambiguity` | Higher/lower result according to a declared metric direction; process adherence; subjective preference | Explicit compatible left/right sides, locked metric/direction, basis, population, and baseline | None | Which two compatible groups, periods, trades, or other sides should I compare? After the sides resolve, ask for the metric/direction only if still missing. |
| 4 | `profit_ambiguity` | Gross P/L; fee-complete net P/L; profit from winners only; realized versus open/unrealized value | Explicit gross/net wording, eligible grain, realized/open state, fee/currency facts, and accepted metric context | None | Do you mean total realized P/L, profit from winners only, or open/unrealized profit? After that family resolves, ask gross versus fee-complete net only when applicable and still missing. |
| 5 | `size_ambiguity` | Execution quantity; entry quantity; maximum open quantity; dollar notional; approved exposure measure; result-set count | Explicit units, owner concept, event/valuation basis, and typed entity/population context | None | Do you mean the number of results or records, or the size of a trade, execution, or position? If trade/execution/position size, ask quantity, maximum position, dollar notional, or another approved measure next. |
| 6 | `risk_ambiguity` | Dollar risk, risk per share, stop-defined risk, R-multiple denominator, exposure, drawdown, saved risk rule, or subjective riskiness | Explicit locked risk measure/rule, units, valuation/stop basis, population, and coverage | None | Which approved risk measure or saved rule should I use? |
| 7 | `later_trades_ambiguity` | Ordinal later trades such as fourth-or-later; trades after a clock time; trades after an event/outcome/threshold; subsequent attempts | Explicit ordinal, clock/event boundary, account timezone, sequence/lifecycle contract, or accepted query | None | Should later mean a trade ordinal, trades after a clock time, trades after a specific event or threshold, or a later attempt on the same instrument? |
| 8 | `recent_ambiguity` | Rolling calendar duration; last N trades; current/prior calendar period; since an event; saved recent window | Explicit N/unit, as-of, event/timezone basis, owner-compatible saved window, or accepted date context | None | What exact window should recent mean? |
| 9 | `cheap_stocks_ambiguity` | Saved price bucket; explicit price threshold; entry/exit/average/candle/current price; subjective valuation | Unique authorized saved definition or explicit price field, event, threshold, currency, applicability, and version | No hidden price threshold; a labelled assumption is allowed only if the owning approved contract permits it | Does cheap stocks mean one of your saved price buckets, a new explicit price definition, or a subjective valuation description? After that family resolves, ask price field/event, threshold, and currency sequentially if required. |
| 10 | `scalp_ambiguity` | Same-account saved setup/style/tag; explicit duration/event definition; session behavior; ordinary descriptive word | Unique authorized label class/version, explicit duration/event definition, explicit session-behavior criterion, or unambiguous ordinary grammar | None | Does scalp mean one of your saved labels, an explicit duration or event definition, a session-behavior description, or just ordinary descriptive wording? |
| 11 | `overtrading_ambiguity` | Saved rule breach; explicit count/rate threshold; Category 9 thresholded proxy; comparison with a declared baseline; trader-authored judgment | Exact saved rule/version, explicit threshold and denominator, locked proxy, accepted baseline, and coverage | None; no universal trade-count threshold | Which standard should define overtrading: a saved rule, a specific threshold, or a historical comparison? |
| 12 | `good_trade_ambiguity` | Profitable outcome; rule adherence; setup/plan or broader process criteria; risk review; authorized saved review label; recommendation | Explicit selected-basis outcome, exact rule/setup/process criterion, or exact authorized saved definition/label with covered association | None | Should good trade mean its outcome, rule/setup/process criteria, or an authorized saved review label? Ask the selected family's basis, rule/version, or other details only after that definition family resolves. |
| 13 | `bad_trade_ambiguity` | Losing outcome; rule breach; setup/plan or broader process/risk issue; authorized saved mistake/review label; trader judgment | Explicit selected-basis outcome, exact rule/setup/process criterion, or exact authorized saved mistake/review definition with coverage | None | Should bad trade mean its outcome, rule/setup/process criteria, or an authorized saved mistake or review label? Ask the selected family's basis, rule/version, or other details only after that definition family resolves. |
| 14 | `normal_size_ambiguity` | Personal median; recent baseline; saved size bucket; setup-specific or condition-specific baseline; account-equity-relative size | Explicit size measure/unit, authorized baseline population/window/version, minimum sample, and coverage | None | Which size measure should define normal size? Resolve this through `size_ambiguity` first; then validate or clarify the unit, followed by the baseline, window/version, and sample contract sequentially if still missing. |
| 15 | `large_loss_ambiguity` | Absolute gross/net loss; magnitude threshold; percentile/bucket; R-multiple; loss relative to recent/personal baseline; saved limit | Explicit loss metric/basis, sign/absolute rule, units/currency, threshold or baseline, eligible population, and version | None | Which loss measure should define large: gross or net dollars, R-multiple, or another approved basis? |
| 16 | `performance_ambiguity` | Gross/net P/L, win rate, expectancy, return, drawdown, frequency, execution or process metric, or multi-metric summary | Explicit locked metric/set, basis, population, period, currency/fees, and coverage | None | Which metric or approved metric set should represent performance? |
| 17 | `consistency_ambiguity` | Approved dispersion measure; outcome frequency; rule adherence rate; stable size/time/process; colloquial reliability | Explicit approved formula/version, representation/direction, units, sample/outlier contract, population, and period | None | Which approved consistency measure should I use? |

## 3.5 Risks, Overlaps, and Decisions

| Area | Draft decision / risk control |
|---|---|
| Inventory unit | Use one ambiguity-routing record for each of the seventeen master-priority phrases. Do not promote resolution, assumption, clarification, candidate meaning, or pending state to extra records. |
| Underlying-owner overlap | Each record selects among locked owners only. It cannot redefine `best`, gross/net P/L, size, risk, dates, price buckets, behavior proxies, labels, or consistency formulas. |
| Materiality | Clarify when a candidate choice changes calculation, formula/version, direction, basis, units, population, time/event, threshold, result, availability, or authorization. Stylistic wording alone does not create a new ambiguity record. |
| Context | Explicit message content outranks retained context. Retained context is usable only when typed, accepted, current, unique, same-account, and compatible. Prose reconstruction, browser position, recency, or a raw ID cannot resolve ambiguity. |
| Safe resolution | A unique compatible interpretation may resolve only after authorization, version, type, capability, and coverage checks. Frequency or popularity is never enough. |
| Stated assumption | It is a narrowly permitted shared ladder step, not a default. State it before answering, never use it for protected/sensitive/account scope, and never use it to fabricate a threshold, metric, evidence, or data. |
| Clarification order | Ask the field that creates the largest semantic branch first. Stage dependent metric basis, population, period, grouping, threshold, limit, ties, and response-format questions later. |
| Ticker-like and abbreviation collisions | Category 16 owns token/class resolution. A short, uppercase, ticker-shaped, or abbreviation-like token cannot silently select a ticker, user label, saved definition, or ambiguity candidate. Category 17 preserves the privacy-safe unresolved classes and clarifies only after Category 16's guards leave more than one authorized compatible class. |
| Pending state | Category 17 proposes the unresolved field and focused question. Category 15 exclusively owns privacy-safe pending-record persistence and atomic accepted-query transitions. |
| Missing versus unsupported | Missing required facts/capability yield Unavailable; product-rejected requests yield Unsupported; designed but inactive ambiguity routing remains Planned. None is converted into a clarification or empty/zero result. |
| Subjective labels | `good`, `bad`, `normal`, `cheap`, `large`, `risk`, `scalp`, and `overtrading` require an explicit owner definition or authorized same-account saved label. Results and executions do not infer motive, discipline, quality, or value. |
| Ranking/comparison | `best`, `worst`, and `better` require Category 14's exact metric, direction, population, baseline, denominator, N, tie, and coverage contracts. High/low and signed/absolute meanings are never assumed. |
| Account and privacy | Candidate discovery stays within the server-authorized user/workspace/Journal account. Use candidate classes or privacy-safe labels only when necessary; never expose raw account, trade, execution, label, rule, source, or conversation IDs. |
| Cause/advice/runtime | Resolving language permits only the routed historical request. It proves no cause or motive, supplies no recommendation or prediction, authorizes no mutation, and does not imply a Chat runtime exists. |

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

The table preserves the seventeen master-priority ambiguity terms in exact
source order. All records are Version 1 `Planned` language-routing contracts.
Independent planning review PASSed and the lead controller accepted this exact
inventory for canonical production on 2026-08-11. After comprehensive pre-lock
PASS, the lead controller approved and locked every exact canonical name and
registry on 2026-08-12. This changes no capability status and claims no runtime.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | C17-AMB-001 | best_ambiguity | Best Ambiguity | Ranking and quality ambiguity | Planned | Route only after an explicit metric or approved score, direction, authorized population, N, ties, and coverage resolve; never infer a universal quality score or recommendation. |
| 2 | C17-AMB-002 | worst_ambiguity | Worst Ambiguity | Ranking and quality ambiguity | Planned | Route only after metric, direction, signed/absolute basis where applicable, population, N, ties, and coverage resolve; never default to largest loss. |
| 3 | C17-AMB-003 | better_ambiguity | Better Ambiguity | Comparison and quality ambiguity | Planned | Route only after compatible sides and an explicit metric/direction/basis resolve; never infer process quality, preference, or advice. |
| 4 | C17-AMB-004 | profit_ambiguity | Profit Ambiguity | Metric and basis ambiguity | Planned | Distinguish gross, fee-complete net, winners-only, realized, and open/unrealized meanings; no gross/net or realized/open default. |
| 5 | C17-AMB-005 | size_ambiguity | Size Ambiguity | Measure and unit ambiguity | Planned | Distinguish quantity, entry/max-open position, notional, approved exposure, and result count using explicit units/entity/event context; do not substitute measures. |
| 6 | C17-AMB-006 | risk_ambiguity | Risk Ambiguity | Measure, rule, and evidence ambiguity | Planned | Require an explicit approved risk measure or saved rule, units/basis, population, and evidence; no risk score, stop, exposure, or drawdown default. |
| 7 | C17-AMB-007 | later_trades_ambiguity | Later Trades Ambiguity | Sequence and temporal ambiguity | Planned | Distinguish ordinal, after-time, after-event/threshold, and later-attempt meanings using exact sequence/time/event context; never invent a boundary. |
| 8 | C17-AMB-008 | recent_ambiguity | Recent Ambiguity | Date, count, and as-of ambiguity | Planned | Require an exact rolling duration, last-N count, calendar period, event window, or approved saved window with event/timezone/as-of; never use server/browser recency. |
| 9 | C17-AMB-009 | cheap_stocks_ambiguity | Cheap Stocks Ambiguity | Price and saved-definition ambiguity | Planned | Resolve an authorized saved bucket or explicit price field/event/threshold/currency definition; no universal cheap, penny-stock, current-quote, or valuation default. |
| 10 | C17-AMB-010 | scalp_ambiguity | Scalp Ambiguity | Label, style, and duration ambiguity | Planned | Distinguish an authorized saved label from a duration/event definition; trade duration or outcome alone cannot infer style, setup, or quality. |
| 11 | C17-AMB-011 | overtrading_ambiguity | Overtrading Ambiguity | Behaviour, rule, and threshold ambiguity | Planned | Require a saved rule, explicit threshold/denominator, locked proxy, or declared comparison baseline; no universal count or motive inference. |
| 12 | C17-AMB-012 | good_trade_ambiguity | Good Trade Ambiguity | Outcome, process, and label ambiguity | Planned | Distinguish selected-basis outcome, rule/setup/process criteria, and authorized saved review labels; no generic goodness, advice, or future-edge inference. |
| 13 | C17-AMB-013 | bad_trade_ambiguity | Bad Trade Ambiguity | Outcome, process, and label ambiguity | Planned | Distinguish selected-basis loss, rule/process issue, explicit mistake, and authorized saved review labels; no person judgment, motive, or cause inference. |
| 14 | C17-AMB-014 | normal_size_ambiguity | Normal Size Ambiguity | Baseline and size ambiguity | Planned | Require an explicit size measure/unit plus personal, recent, saved, setup-specific, or condition-specific baseline and sample/coverage; no universal normal. |
| 15 | C17-AMB-015 | large_loss_ambiguity | Large Loss Ambiguity | Loss metric, threshold, and baseline ambiguity | Planned | Require gross/net or other approved loss measure, sign/absolute rule, units, threshold/baseline, population, and coverage; no hidden dollar or percentile threshold. |
| 16 | C17-AMB-016 | performance_ambiguity | Performance Ambiguity | Metric-set and population ambiguity | Planned | Require an explicit locked metric or approved metric set, basis, population, period, units/fees, and coverage; never synthesize a global performance score. |
| 17 | C17-AMB-017 | consistency_ambiguity | Consistency Ambiguity | Formula, direction, and sample ambiguity | Planned | Require an approved consistency/dispersion or adherence formula/version, representation, direction, population, sample/outlier contract, period, and coverage. |

## Proposed Inventory Additions

None. Candidate meanings, clarification fields, confidence/materiality checks,
the three-step routing ladder, and Category 15 pending-state operations are
supporting contracts rather than additional ambiguity concepts. If a future
source adds another priority phrase, record it here for controller review before
changing the controlling inventory.

## Proposed Removals or Merges

None. Related phrases remain separate because their first material ambiguity
and owner routes differ. In particular, `best`, `worst`, and `better`; `size`
and `normal size`; `profit`, `performance`, and `consistency`; and `good trade`
and `bad trade` must not be silently merged.

---

# 5. Canonical Inventory Deliverable

**Canonical batch status:** The lead controller accepted the exact seventeen-
record planning inventory and authorized canonical production on 2026-08-11.
All three canonical batches, C17-AMB-001 through C17-AMB-017, independently
PASSed and were accepted by the controller in exact source order. On 2026-08-12
the lead controller approved and locked all seventeen exact canonical names at
Version 1. All capability statuses remain `Planned`; approval and locking do
not claim or activate runtime support. There are 17 of 17 canonical records
passed, approved, and locked.

**Batch-wide canonical contract:** These records detect and route ambiguity;
they do not define or calculate the underlying candidate meanings. Preserve the
shared Section 3.3 ladder and ask one highest-impact unresolved field at a time,
staging dependent questions. A candidate may resolve only from explicit wording
or trusted typed current context that is unique, same-account, server-authorized,
compatible, and complete. Category 15 alone owns accepted-query and pending-
ambiguity state. Category 16 owns ticker-like/abbreviation token-class safety.
Every routed owner retains its exact metric/formula/version, direction, basis,
units, population, time/event, positive integer N where ranking applies, tie
policy, gross/net fee/credit contract, currency partition, sample and coverage
rules, capability state, and unavailable/unsupported boundary. Never use a raw
or opaque ID as authorization or expose raw account, trade, execution, source,
label, rule, or conversation identifiers. No record crosses accounts, infers a
cause or motive, recommends or predicts a trade, authorizes a mutation, or
claims runtime support.

## `best_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-001 |
| Category | Ambiguity Language |
| Subcategory | Ranking and quality ambiguity |
| Canonical name | `best_ambiguity` |
| Display name | Best Ambiguity |
| Exact definition | Detect and route `best` wording that could mean a Category 14 ranking under one explicit locked metric and its declared direction, an approved versioned multi-metric score, or a subjective quality/recommendation claim. Resolve only when explicit wording or trusted typed accepted context uniquely supplies the authorized candidate population/group, metric or score, formula/version, direction, units/basis, time/event scope, positive integer N, deterministic privacy-safe tie policy, and coverage. Otherwise ask which metric or approved score should define best, then stage any still-missing population, period, N, tie, basis, or coverage field. This record produces no ranking or quality judgment itself. |
| Distinction from related concepts | Category 14 `best` owns the resolved ranking composition; this record owns only detection and safe selection among materially different meanings. It is not `top`, `most_profitable`, `highest_win_rate`, a highest numeric default, a generic quality score, a setup evaluation, or permission to recommend what the trader should trade. |
| Evidence classification | Directly observed user wording and explicit/trusted typed context; deterministically derived authorized candidate set, uniqueness, materiality, required-field gaps, and route to a locked owner |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome: resolved locked-owner route, one pending highest-impact field, or truthful unavailable/unsupported state; no independent numeric unit |
| Open-trade support | Owner-dependent only. Open positions may participate only when the explicitly selected metric/score and population support them with compatible valuation time, currency, and coverage. Never mix unrealized open values with realized ready-closed facts or default `best trade` to closed P/L. |
| Fee handling | If P/L or a fee-sensitive approved score defines `best`, require its explicit gross or fee-complete net basis. Net uses the locked formula and conserving allocated charge-cost/charge-credit facts; missing fee completeness is partial/unavailable, never gross fallback. Non-fee metrics retain their owner's fee rule. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous ranking or quality language.
- Narrower concepts: metric-defined best ranking; approved-score best ranking;
  unresolved subjective-quality use.
- Commonly confused concepts: Category 14 `best`, `top`, `most_profitable`,
  `highest_win_rate`, `most_consistent`, and advice requests.
- Must not be merged with: `worst_ambiguity`, `better_ambiguity`, any metric,
  any universal quality score, or a protected recommendation/action.

## `worst_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-002 |
| Category | Ambiguity Language |
| Subcategory | Ranking and quality ambiguity |
| Canonical name | `worst_ambiguity` |
| Display name | Worst Ambiguity |
| Exact definition | Detect and route `worst` wording that could mean a Category 14 ranking under one explicit locked metric/direction, largest adverse magnitude under a declared signed-versus-absolute loss rule, an approved versioned score, or a subjective quality claim. Resolve only when explicit wording or trusted typed accepted context uniquely supplies the authorized candidate population/group, metric or score, formula/version, direction, sign/absolute basis where applicable, units, time/event scope, positive integer N, deterministic privacy-safe tie policy, and coverage. Otherwise ask `Which metric or approved score should define worst?`, then stage the score formula/version and direction, signed-versus-absolute basis where applicable, population, period, positive integer N, deterministic privacy-safe tie policy, fee/currency state, and coverage as needed. This record does not rank or judge quality. |
| Distinction from related concepts | Category 14 `worst` owns resolved ranking composition. This ambiguity record cannot default `worst` to the most negative value, largest absolute loss, lowest expectancy, rule breach, biggest drawdown, or a bad-trade label. Numeric low is not universally worse because the selected owner's direction controls meaning. |
| Evidence classification | Directly observed user wording and explicit/trusted typed context; deterministically derived authorized candidate set, uniqueness, materiality, missing fields, and locked-owner route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome with a resolved route, one pending field, or truthful unavailable/unsupported state; no numeric ranking unit |
| Open-trade support | Owner-dependent only. Unrealized open losses require an explicit compatible open-valuation owner and as-of/currency facts. They cannot be ranked with realized ready-closed losses or treated as a finalized worst trade by default. |
| Fee handling | A loss/P&L route requires declared gross or fee-complete net basis and signed-versus-absolute semantics. Net preserves the locked allocated charge-cost and charge-credit contract; incomplete fees remain partial/unavailable. Scores and non-fee metrics retain their locked fee rules. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous ranking or quality language.
- Narrower concepts: metric-defined worst ranking; signed-loss ranking;
  absolute-loss-magnitude ranking; approved-score ranking.
- Commonly confused concepts: Category 14 `worst`, `bottom`,
  `least_profitable`, `lowest_expectancy`, `larger_losses`, and
  `bad_trade_ambiguity`.
- Must not be merged with: `best_ambiguity`, `large_loss_ambiguity`, a generic
  lowest-value rule, subjective trader judgment, or advice.

## `better_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-003 |
| Category | Ambiguity Language |
| Subcategory | Comparison and quality ambiguity |
| Canonical name | `better_ambiguity` |
| Display name | Better Ambiguity |
| Exact definition | Detect and route `better` wording that could request a Category 14 comparison under a declared locked metric/direction, compare rule/setup/process adherence, or express subjective preference/advice. If compatible left/right groups, periods, trades, or other reference sides are absent, ask which two sides should be compared first. After the sides resolve, require the explicit metric or approved criterion, formula/version, direction, units/basis, compatible side-specific populations and time/event scope, fixed equality treatment, signed left-minus-right and absolute-difference semantics, and coverage. A percentage difference additionally requires an explicit compatible meaningful nonzero baseline; zero or invalid denominators are unavailable, not invented. This record performs no comparison. |
| Distinction from related concepts | Category 14 `better_than` owns the resolved comparison. This record is not `improved`, `more_profitable`, `highest`, a hidden positive-is-better rule, a causal explanation, or a recommendation. It preserves both side identity and metric direction rather than treating a higher number as universally better. |
| Evidence classification | Directly observed wording, named sides, and explicit/trusted typed comparison context; deterministically derived candidate sides/owners, compatibility, materiality, missing-field order, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; after resolution, units remain those of the locked comparison metric, but this record has no independent numeric unit |
| Open-trade support | Both sides must use compatible owner-approved populations. Open and realized trades cannot be silently mixed; an open-value comparison requires matching as-of, valuation, currency, and coverage rules on each side. |
| Fee handling | When P/L or another fee-sensitive metric defines `better`, both sides require the same declared gross or fee-complete net contract. Net uses exact allocated charge costs and credits; incomplete side-specific fee coverage is reported and never replaced with gross values. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous comparative or quality language.
- Narrower concepts: metric-defined side comparison; process-criterion
  comparison; unresolved subjective preference.
- Commonly confused concepts: Category 14 `better_than`, `improved`,
  `more_profitable`, `current_versus_previous`, and `best_ambiguity`.
- Must not be merged with: comparison-side resolution, a metric's direction,
  causal improvement, a quality score, or advice.

## `profit_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-004 |
| Category | Ambiguity Language |
| Subcategory | Metric and basis ambiguity |
| Canonical name | `profit_ambiguity` |
| Display name | Profit Ambiguity |
| Exact definition | Detect and route `profit` wording that could mean total realized P/L over the eligible population, positive P/L from winners only, or open/unrealized profit at an explicit valuation time. Resolve that semantic family first; do not begin with gross/net. For a realized family, then require eligible grain/population, event/time range, compatible currency partition, and explicit gross or fee-complete net basis. Gross sums locked `gross_pnl`; fee-complete net applies the locked formula `gross_pnl - allocated charge_cost + allocated charge_credit` over eligible records. Winners-only additionally requires the locked selected-basis winner population and must not be relabelled total P/L. Open/unrealized profit requires a separate approved owner, valuation/as-of, market-data/currency coverage, and may remain unavailable. This record calculates no profit. |
| Distinction from related concepts | It routes among `gross_pnl`, `net_pnl`, winners-only positive contribution, and an explicit open/unrealized value owner. It is not gross profit from winning trades by default, revenue, cash balance, buying power, account equity, deposits, return percentage, or a forecast. `Profit` in ordinary wording does not authorize a fee, currency, realization, or population assumption. |
| Evidence classification | Directly observed profit wording and explicit/trusted typed grain, population, realization, basis, fee, currency, and time context; deterministically derived candidate owner set, first unresolved semantic family, completeness, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; resolved profit owners normally return currency partitioned by compatible currency, while percentages or other units require a separately explicit owner |
| Open-trade support | Realized total P/L and winners-only routes use their locked eligible ready-closed populations. Open/unrealized profit is a separate candidate and requires approved valuation facts; never add it to realized P/L or silently value an open position. |
| Fee handling | Ask gross versus fee-complete net only after total-realized/winners-only/open meaning resolves and only when applicable. Net requires complete conserving allocated charge-cost and charge-credit facts in compatible currency; partial fee coverage produces a partial/unavailable state and visible counts, never a gross fallback or estimated fee. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous financial-result language.
- Narrower concepts: total realized gross P/L; total realized fee-complete net
  P/L; winners-only positive contribution; explicit open/unrealized profit.
- Commonly confused concepts: `gross_pnl`, `net_pnl`, `gross_profit`, account
  balance/equity, return, proceeds, and `performance_ambiguity`.
- Must not be merged with: realized and unrealized values, winners-only and
  whole-population P/L, fees, currency conversion, or future profit prediction.

## `size_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-005 |
| Category | Ambiguity Language |
| Subcategory | Measure and unit ambiguity |
| Canonical name | `size_ambiguity` |
| Display name | Size Ambiguity |
| Exact definition | Detect and route `size` wording that could mean a result/record count or the size of a trade, execution, order, or position. Resolve that entity/measure family first. If trade/execution/position size remains intended, require the explicit locked measure: execution quantity, entry quantity, maximum open quantity, dollar notional under a declared valuation/event basis, or another approved exposure measure. Then validate the measure's units, entity, time/event, population, currency/price basis where applicable, and coverage. Quantity, notional, exposure, execution count, trade count, and result count are never substituted for one another. This record calculates no size. |
| Distinction from related concepts | Category 6 owns size metrics; Categories 8 and 11 own execution/count/entity facts; Category 16 owns trader wording such as `size`, `share size`, `position`, and `exposure`. This ambiguity record only chooses the intended owner/measure. It is not `normal_size_ambiguity`, a risk measure, account equity, buying power, or an inferred order size. |
| Evidence classification | Directly observed wording and explicit/trusted typed entity, unit, event, valuation, population, and owner context; deterministically derived candidate measure classes, compatibility, missing-field order, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; resolved owner units may be shares/quantity, currency notional, an approved exposure unit, or count, but this record has no default or independent unit |
| Open-trade support | Owner-dependent. Execution/event quantity may include factual accepted executions; maximum open quantity requires a complete lifecycle path; current notional/exposure requires an approved valuation/as-of contract. Open quantity is not realized position size, and incomplete chains remain visible or unavailable. |
| Fee handling | Size/count resolution is normally fee-independent. If a downstream notional/exposure or filtered population uses a fee-sensitive financial contract, retain that owner's explicit fee rule; size wording never selects gross/net or fills missing charges. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous measure, entity, or unit language.
- Narrower concepts: result count; execution quantity; entry quantity; maximum
  open quantity; dollar notional; approved exposure measure.
- Commonly confused concepts: trade count, execution count, order quantity,
  `position`, `exposure`, `normal_size_ambiguity`, and `risk_ambiguity`.
- Must not be merged with: one universal size metric, account value, risk,
  record count, or a client-supplied raw entity identifier.

## `risk_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-006 |
| Category | Ambiguity Language |
| Subcategory | Measure, rule, and evidence ambiguity |
| Canonical name | `risk_ambiguity` |
| Display name | Risk Ambiguity |
| Exact definition | Detect and route `risk` wording that could mean an explicit approved dollar-risk or risk-per-share measure, stop-defined planned risk, the denominator of a locked R-multiple, position exposure, realized drawdown, an authorized saved risk rule/version, or a subjective riskiness judgment. Require the user to select an approved risk measure or saved rule first unless explicit wording or trusted typed current context leaves one unique authorized meaning. Then require that owner's exact formula/version, units, stop/valuation/baseline basis, eligible population and time/event scope, currency, rule applicability/version, evidence coverage, and sample contract. Missing stop, plan, equity, market value, or rule evidence makes the routed metric unavailable; it is never inferred from P/L, size, volatility, outcome, or another account. This record computes no risk and creates no rule. |
| Distinction from related concepts | Risk is not one universal metric. This record remains separate from Category 6 size/exposure, Category 4 drawdown/quality metrics, outcome/P&L, saved-rule adherence, volatility, and advice. A loss is not automatically planned risk; R-multiple cannot be calculated without its approved risk denominator; subjective `risky` language is not a factual classification. |
| Evidence classification | Directly observed risk wording, authorized saved rule/version, and explicit/trusted typed measure/basis context; deterministically derived authorized candidate owners, uniqueness, required-data completeness, capability state, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; a resolved owner may use currency, currency/share, R, percentage, drawdown, exposure, or adherence state under its exact contract, with no default unit here |
| Open-trade support | Owner-dependent. Planned stop-defined risk or current exposure may apply to an open position only with explicit accepted plan/stop/quantity/valuation/as-of/currency facts and owner support. Realized drawdown and ready-closed result metrics cannot be silently applied to open positions. |
| Fee handling | Fee handling follows the selected owner. Planned risk/exposure may be fee-independent, while realized loss/drawdown or R results may require an explicit gross or fee-complete net basis. Missing fee completeness remains partial/unavailable; risk wording never chooses a basis or estimates charges. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous risk, rule, or evidence language.
- Narrower concepts: explicit risk measure; planned stop-defined risk; R
  denominator; exposure; drawdown; authorized saved risk rule; subjective risk.
- Commonly confused concepts: position size, exposure, loss, drawdown,
  volatility, R-multiple, rule adherence, and `large_loss_ambiguity`.
- Must not be merged with: a universal risk score, inferred stop/plan, account
  equity, loss outcome, motive, safety judgment, or trading advice.

## `later_trades_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-007 |
| Category | Ambiguity Language |
| Subcategory | Sequence and temporal ambiguity |
| Canonical name | `later_trades_ambiguity` |
| Display name | Later Trades Ambiguity |
| Exact definition | Detect and route `later trades` wording among four materially different families before resolving their dependent fields: an ordinal such as fourth-or-later trades, trades after an exact clock time, trades after an explicit event/outcome/threshold, or a later lifecycle attempt on the same stable instrument. Ask which family the user means when explicit wording or trusted typed current context does not uniquely resolve it. Both ordinal and later-attempt routes require a fixed server-authorized account plus stable instrument plus account-local-entry-date partition, with the local entry date derived from raw UTC using the account IANA timezone. Build the complete current candidate lifecycle set before any requested output filter; preserve decision, incomplete, and legitimate-open barriers; order deterministically by first-entry raw UTC and then a privacy-safe stable internal tie key; assign the original one-based ordinal once; and never skip or renumber after filters or barriers. Fourth-or-later retains the locked owner threshold of original ordinal `>= 4`. A later attempt retains original ordinal `>= 2` and additionally requires a verified return to zero before that later zero-to-nonzero lifecycle start. Executions/fills and display rows are not trades and never receive trade ordinals. Clock-time and after-event routes separately require account-IANA timezone/boundary/endpoints/DST or named event/version/attainment/selected-basis/chronological-relation facts. Never expose a stable instrument identifier or internal tie key, or invent a time, ordinal, threshold, event, predecessor, or causal effect. |
| Distinction from related concepts | This record selects a meaning family; Category 7 owns time/order facts, Categories 8-9 own lifecycle/attempt/behavior sequence concepts, Category 11 owns sequence dimensions, Category 13 owns date/time language, and Category 15 owns retained context. An execution/fill, rendered row, or add inside one open lifecycle is not a separately numbered trade or later attempt. A later attempt is an original ordinal `>= 2` only after a verified return to zero; fourth-or-later is the distinct original ordinal threshold `>= 4`. An after-event association does not prove the event caused the result. |
| Evidence classification | Directly observed wording and explicit/trusted typed ordinal, clock, event, threshold, server-authorized account, stable-instrument, account-IANA/local-entry-date, and lifecycle context; deterministically derived complete current candidate set, first-entry-raw-UTC order, privacy-safe internal tie order, original one-based ordinal, return-to-zero state, barriers, materiality, and locked-owner route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome resolving to an ordinal, temporal, event-relative, or attempt-relative route, one pending highest-impact field, or truthful unavailable/unsupported state. Ordinal routes preserve the original one-based lifecycle ordinal but never expose the stable instrument identifier or internal tie key; there is no independent numeric metric unit. |
| Open-trade support | Owner-dependent. A legitimate open lifecycle remains in the complete current candidate set and preserves its original ordinal/barrier state; it is never skipped so later visible rows can be renumbered. It may be identified as a factual later attempt only when its zero-to-nonzero start follows a verified return to zero in the same fixed partition. Ready-closed metrics still exclude it, and decision/incomplete barriers block affected downstream sequence claims without hiding unrelated valid records. |
| Fee handling | Family routing is fee-independent. An outcome/threshold event or downstream comparison that depends on P/L must retain its explicit gross or fee-complete net basis, compatible currency, conserving allocated charges/credits, and coverage. Missing fee completeness never becomes gross fallback. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous sequence or temporal language.
- Narrower concepts: ordinal later trades; after-clock-time trades; after-event
  or after-threshold trades; later same-instrument lifecycle attempts.
- Commonly confused concepts: `fourth_or_later_trade` at original ordinal
  `>= 4`, later attempts at original ordinal `>= 2` after return to zero,
  `trade_after_time`, executions/fills, display rows, adds,
  `before_versus_after`, and `recent`.
- Must not be merged with: post-filter row number, a skipped/renumbered ordinal,
  stable identifier or internal tie key disclosure, one universal later
  boundary, inferred predecessor, same-lifecycle execution order, causal
  attribution, or future performance.

## `recent_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-008 |
| Category | Ambiguity Language |
| Subcategory | Date, count, and as-of ambiguity |
| Canonical name | `recent_ambiguity` |
| Display name | Recent Ambiguity |
| Exact definition | Detect and route `recent` wording among an exact rolling calendar duration, the last positive integer N eligible trades/events, a named current/prior calendar period, a window since or around an explicit event, or an authorized versioned saved recent-window definition. Ask `What exact window should recent mean?` when no unique authorized family and bound are explicit or retained in trusted typed accepted context. After the family resolves, require its positive N/unit or calendar identity, approved event basis, account-IANA timezone and DST behavior, explicit `as_of` instant, endpoint inclusivity, ordering/tie policy where last-N applies, saved-definition version/applicability where used, and coverage. Never use server time, browser/device time, message recency, an undocumented rolling window, or a stale prior range. |
| Distinction from related concepts | Category 13 owns date/time resolution and Category 15 owns retained accepted ranges. This record detects the missing window contract only. Rolling 30 days, this month, last month, last 20 trades, and since an event are non-equivalent; `recent` is not `current`, `latest`, `previous`, or the nearest visible UI item by default. |
| Evidence classification | Directly observed wording and explicit/trusted typed N/unit, calendar, event, saved-window, timezone, event-basis, and as-of context; deterministically derived candidate windows, completeness, ordering compatibility, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome resolving to a Category 13 temporal/count-window contract or one pending field; no independent time or count unit until the owner resolves it |
| Open-trade support | The resolved window may filter open-position facts only when the selected owner supports them and declares the applicable event timestamp or as-of valuation. Last-N ready-closed trades and open lifecycles cannot be silently mixed or reordered. |
| Fee handling | Window resolution is fee-independent. Any downstream fee-sensitive metric retains its exact gross/net, currency, fee-completeness, and coverage rules; `recent` never changes basis or supplies missing fees. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous temporal or count-window language.
- Narrower concepts: rolling duration; last-N eligible records; named calendar
  period; event-relative window; saved recent-window definition.
- Commonly confused concepts: current/previous periods, latest record,
  selected entity, `active_date_range`, and `later_trades_ambiguity`.
- Must not be merged with: server/browser recency, a universal rolling window,
  message timestamp, inferred event basis, or stale conversation state.

## `cheap_stocks_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-009 |
| Category | Ambiguity Language |
| Subcategory | Price and saved-definition ambiguity |
| Canonical name | `cheap_stocks_ambiguity` |
| Display name | Cheap Stocks Ambiguity |
| Exact definition | Detect and route `cheap stocks` wording first among an authorized same-account saved price bucket/definition, a new explicit factual price definition, or a subjective valuation description. Ask which owner family is intended before asking price details. A saved bucket requires one exact active compatible version, applicability, coverage, and Category 16 collision-free resolution. A factual definition then requires the exact price field (entry, exit, average, candle, current quote only under a separate approved market-data owner, or another approved field), observation event/time, strict/inclusive threshold and endpoints, unit/currency, population, and coverage. Subjective valuation has no factual price default and may be unsupported without an approved owner. An explicitly stated assumption is allowed only when the selected locked owner contract expressly permits it; state it before answering and never use it to invent a threshold, current quote, penny-stock definition, value judgment, or account scope. |
| Distinction from related concepts | Category 11 owns price dimensions/buckets and explicitly defined penny stocks; Category 16 owns price-term vocabulary, saved aliases, exact/fuzzy matching, and ticker-like/abbreviation collision safety. This record chooses the owner family only. `Cheap` is not automatically sub-dollar, under $5, penny stock, low float, low market cap, undervalued, or a current quote. |
| Evidence classification | Directly observed wording, explicit price contract, or authorized saved definition/version; deterministically derived same-account candidate family, Category 16 match/collision state, definition completeness, and locked-owner route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome resolving to a saved price bucket, explicit price predicate, or unsupported subjective-valuation route; a factual owner normally uses compatible currency per share, but there is no default unit |
| Open-trade support | A saved or explicit historical entry/exit/average/candle predicate follows its exact covered event facts. A current open-position or current-quote interpretation requires a separately approved as-of market-data/valuation owner and cannot be substituted from stale executions or candles. |
| Fee handling | Price-family resolution is fee-independent. Downstream P/L or cost comparisons retain their exact fee/currency contracts; `cheap` never means low fees and cannot supply missing transaction costs. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous price, bucket, or valuation language.
- Narrower concepts: authorized saved cheap-stock bucket; explicit factual price
  threshold; subjective valuation description.
- Commonly confused concepts: low-priced stock, sub-dollar, penny stock,
  current quote, market capitalization, low float, and undervaluation.
- Must not be merged with: a universal price threshold, ticker-shaped token,
  current-market fact, investment value, recommendation, or another account's
  private bucket.

## `scalp_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-010 |
| Category | Ambiguity Language |
| Subcategory | Label, style, and duration ambiguity |
| Canonical name | `scalp_ambiguity` |
| Display name | Scalp Ambiguity |
| Exact definition | Detect and route `scalp` wording among an authorized same-account saved setup/style/tag or other compatible label, an explicit duration/event-based trade definition, an explicit session-behavior description, or ordinary noncanonical description. Ask which family is intended when explicit wording or trusted typed context does not uniquely resolve it. Saved language must pass Category 16's exact active class/version, locale, deprecation, fuzzy-candidate, cross-class, ticker-like, and abbreviation collision gates and requires explicit covered record association. Duration/event meaning requires exact endpoints, event basis, units, threshold, population, timezone where applicable, and coverage. Session behavior requires its explicitly named factual criteria and owner. A short hold, quick exit, session, ticker, result, or chart shape never infers a scalp label, style, setup quality, motive, or advice. |
| Distinction from related concepts | Category 16 owns label/token resolution; Category 11 owns explicit labels and dimensions; Category 7 owns duration/time; behavior owners retain factual criteria. This ambiguity record does not create a global scalp definition or associate a trade with a saved label. `Scalp` may be ordinary prose and is not automatically a duration bucket, strategy, setup, session, or quality classification. |
| Evidence classification | Directly observed wording, authorized stored label/alias/version and association, or explicit duration/event/session criteria; deterministically derived Category 16 candidate/collision state, compatible owner family, completeness, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome resolving to an authorized label class, duration/event contract, session-behavior owner, ordinary-description route, or one pending field; no independent unit |
| Open-trade support | An explicit saved label association may be reported for an open lifecycle only if that association and its coverage are owner-supported. Duration of an open trade requires an approved as-of endpoint and remains distinct from completed holding time. No open trade is inferred to be a scalp from elapsed time or price action alone. |
| Fee handling | Scalp-family resolution is fee-independent. A downstream result comparison must declare gross or fee-complete net basis and preserve fee/currency coverage; frequent fees do not establish scalp identity. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous trader label, style, or duration language.
- Narrower concepts: saved scalp label; explicit duration/event definition;
  session-behavior definition; ordinary descriptive use.
- Commonly confused concepts: setup, strategy, tag, playbook, holding duration,
  session, quick trade, and high-frequency behavior.
- Must not be merged with: inferred trade style, a universal duration cutoff,
  ticker/abbreviation resolution, setup quality, motive, or recommendation.

## `overtrading_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-011 |
| Category | Ambiguity Language |
| Subcategory | Behaviour, rule, and threshold ambiguity |
| Canonical name | `overtrading_ambiguity` |
| Display name | Overtrading Ambiguity |
| Exact definition | Detect and route `overtrading` wording among breach/applicability of an exact authorized saved rule/version, an explicit count or rate threshold with its denominator and endpoint semantics, a locked Category 9 factual proxy, a comparison against an explicit historical/personal baseline, or a trader-authored subjective judgment. Ask which standard should define overtrading when no unique authorized family is explicit or retained in trusted typed context. Then require the exact count/event grain, denominator/window, threshold and strict/inclusive operator, rule version/applicability, proxy formula/version, baseline population/period, account-IANA time contract, ordering and pre-filter barrier rules where chronological, samples, and coverage. There is no universal trades-per-day threshold. Activity, clicks, repeats, losses, or a late session do not prove overtrading, compulsion, revenge, discipline, or cause. |
| Distinction from related concepts | Category 9 owns thresholded overtrading/frequency proxies; Category 11 owns saved rules and behavior dimensions; Category 16 owns phrases such as `overtrade`, `trade too much`, `too many trades`, `kept clicking`, `forced trades`, and `churned`. This record chooses the intended standard without merging executions, lifecycle starts, completed trades, rates, rule breaches, or judgments. |
| Evidence classification | Directly observed wording, explicit threshold/baseline, authorized saved rule/version, and user-authored judgment; deterministically derived owner-family candidates, denominator/rule/proxy completeness, chronological barriers, materiality, and route; proxy-based only after an explicit locked proxy is selected |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; resolved owners may use count, rate, threshold membership, rule-adherence state, comparison difference, or explicit user label, with no universal unit here |
| Open-trade support | Owner-dependent. Execution/lifecycle-start counts may include a factually confirmed open lifecycle only when the selected rule/proxy defines that event and complete chronological coverage exists. Ready-closed outcome comparisons exclude open trades; unknown chains and decisions remain visible barriers. |
| Fee handling | Frequency/rule routing is normally fee-independent. A P/L-based threshold, baseline, or downstream performance result requires explicit gross or fee-complete net basis, compatible currency, exact allocated charges/credits, and visible coverage. Missing fees never prove or disprove overtrading. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous behavior, frequency, or rule language.
- Narrower concepts: saved-rule standard; count/rate threshold; locked factual
  proxy; declared baseline comparison; trader-authored judgment.
- Commonly confused concepts: trade count, execution count, repeat attempts,
  high frequency, `trading_frequency_vocabulary`, rule breach, revenge trading,
  and forced trades.
- Must not be merged with: a universal threshold, motive/emotion diagnosis,
  discipline score, causal loss claim, or recommendation to stop trading.

## `good_trade_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-012 |
| Category | Ambiguity Language |
| Subcategory | Outcome, process, and label ambiguity |
| Canonical name | `good_trade_ambiguity` |
| Display name | Good Trade Ambiguity |
| Exact definition | Detect and route `good trade` wording first among a selected-basis profitable/breakeven/other factual outcome, an exact rule/setup/plan/risk or broader process criterion, or an authorized same-account saved review label/definition with explicit covered association. Ask which definition family should determine `good` when explicit wording or trusted typed current context does not uniquely resolve it. Then require the chosen family's exact basis: eligible ready-closed grain and gross or fee-complete net basis for outcome; exact rule/setup/process definition/version, applicability, evidence, and coverage for criteria; or Category 16 collision-free label class/version and association coverage for a saved label. A positive outcome does not prove good process, adherence, setup quality, skill, cause, future edge, or that the trade should be repeated. This record assigns no quality label and gives no advice. |
| Distinction from related concepts | Category 3 owns factual selected-basis outcomes; Categories 9 and 11 own rule/process facts and authorized labels; Category 16 owns saved vocabulary resolution. This record selects the intended definition family only. `Good trade` is not synonymous with winner, profitable ticker, good trader, approved setup, low risk, optimal execution, recommendation, or predicted winner. |
| Evidence classification | Directly observed wording, explicit selected basis/criterion, authorized saved definition/label/version, and explicit association; deterministically derived candidate family, Category 16 collision state, owner completeness, materiality, and route; user-labelled only when the exact authorized label owner resolves |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; resolved owners may use outcome class/currency, adherence/applicability state, process evidence, or authorized label association, with no universal quality score or unit |
| Open-trade support | A finalized realized outcome cannot classify an open trade. An explicit current rule/process fact or saved label association may be reported only if its owner supports open lifecycles with complete evidence; it still does not establish overall trade quality or future result. |
| Fee handling | Outcome meaning requires explicit gross or fee-complete net basis because fees may change classification. Net preserves exact allocated charge costs/credits and compatible currency; incomplete fees remain partial/unavailable. Rule/process/label routes retain their own fee relevance and cannot inherit a profitable outcome. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous outcome, process, or review language.
- Narrower concepts: selected-basis favorable outcome; rule/setup/process
  criterion; authorized saved good-trade review label.
- Commonly confused concepts: winner, profitable trade, followed rule, valid
  setup, good execution, `best_ambiguity`, and recommendation.
- Must not be merged with: one universal quality score, person judgment,
  causation, skill, advice, prediction, or a protected label mutation.

## `bad_trade_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-013 |
| Category | Ambiguity Language |
| Subcategory | Outcome, process, risk, mistake, and label ambiguity |
| Canonical name | `bad_trade_ambiguity` |
| Display name | Bad Trade Ambiguity |
| Exact definition | Detect and route `bad trade` wording first among a selected-basis losing/breakeven/other factual outcome; an exact rule, setup, plan, process, or risk criterion; an explicit authorized mistake fact; or an authorized same-account saved review label/definition with explicit covered association. Ask which definition family should determine `bad` when explicit wording or trusted typed current context does not uniquely resolve it. Then require the chosen family's exact basis: eligible ready-closed grain and gross or fee-complete net basis for outcome; exact rule/setup/process/risk definition/version, applicability, evidence, and coverage for criteria; explicit mistake provenance/version and applicability for a mistake fact; or Category 16 collision-free label class/version and association coverage for a saved label. A loss, repeat, rule event, large size, chart shape, or negative note does not prove bad process, a mistake, motive, emotion, cause, future weakness, or that the trader is a bad person. This record assigns no quality label and gives no advice. |
| Distinction from related concepts | Category 3 owns factual selected-basis outcomes; Categories 9 and 11 own rule/process/risk/mistake facts and authorized labels; Category 16 owns saved vocabulary and token/class collision safety. This record selects the intended definition family only. `Bad trade` is not synonymous with loser, bad trader, invalid setup, broken rule, large loss, poor execution, revenge, or a trade to avoid in the future. |
| Evidence classification | Directly observed wording, explicit selected basis/criterion, authorized explicit mistake or saved definition/label/version, and covered association; deterministically derived candidate family, Category 16 collision state, owner completeness, materiality, and route; user-labelled only when the exact authorized label or mistake owner resolves |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; resolved owners may use outcome class/currency, rule/process/risk applicability or adherence, explicit mistake state, or authorized label association, with no universal quality score or unit |
| Open-trade support | A finalized realized loss cannot classify an open trade. An explicit current rule/process/risk fact, mistake, or saved label association may be reported only if its owner supports open lifecycles with complete evidence; it still does not establish overall quality, motive, cause, or future result. |
| Fee handling | Outcome meaning requires explicit gross or fee-complete net basis because fees may change classification. Net preserves exact allocated charge costs/credits and compatible currency; incomplete fees remain partial/unavailable. Rule/process/risk/mistake/label routes retain their own fee relevance and cannot inherit a losing outcome. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous outcome, process, risk, mistake, or
  review language.
- Narrower concepts: selected-basis adverse outcome; rule/setup/process/risk
  criterion; explicit authorized mistake; authorized saved bad-trade label.
- Commonly confused concepts: loser, broke rule, invalid setup, execution
  mistake, `large_loss_ambiguity`, revenge trading, and person judgment.
- Must not be merged with: one universal quality score, trader identity,
  inferred motive/emotion/cause, advice, prediction, or protected label change.

## `normal_size_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-014 |
| Category | Ambiguity Language |
| Subcategory | Size measure, unit, and baseline ambiguity |
| Canonical name | `normal_size_ambiguity` |
| Display name | Normal Size Ambiguity |
| Exact definition | Detect and route `normal size` only after resolving the intended Category 6 size measure through `size_ambiguity`; ask `Which size measure should define normal size?` first. After the measure resolves, validate or clarify its unit second. Then identify the requested baseline family: a saved size bucket/definition, a personal historical baseline, a recent-window baseline, a setup-specific baseline, or another condition-specific baseline. The locked Category 6 `size_relative_to_normal_size` capability remains `Unavailable`: there is no approved normal baseline, default numerator measure, or relation formula. A complete Category 11 size bucket may support exact membership only; it does not become a normal baseline or activate relative-to-normal calculation. Future support requires one approved version defining the baseline source, effective period and scope, numerator measure, relation formula and result unit, denominator and zero-denominator behavior, minimum sample, exclusions/outlier treatment, and coverage. Category 16 must resolve saved names and ticker-like/abbreviation/class collisions before use. There is no universal normal quantity, notional, exposure, account-equity percentage, sample, or recent window, and one observed trade cannot create a baseline. Resolution may therefore recognize the language and route truthfully to `Unavailable`; it must not fabricate the missing contract. |
| Distinction from related concepts | Category 6 owns quantity/notional/exposure measures and the locked unavailable `size_relative_to_normal_size` calculation; Category 11 owns size-bucket membership and setup/condition dimensions; Category 16 owns authorized saved-language resolution. A complete size bucket establishes membership only, not the numerator, baseline source, denominator, relation formula, or relative-size unit. This record sequences measure, unit, and baseline-family clarification and preserves the owner's unavailable state. It is not `size_ambiguity`, average/median by default, planned risk, account equity, buying power, a recommendation, or a universal position-size standard. |
| Evidence classification | Directly observed wording and explicit/trusted typed size measure/unit; directly observed authorized saved size-bucket definition and membership where available; deterministically derived baseline-family candidates, version/window/population/sample/coverage gaps, Category 16 collision state, materiality, and route to the locked unavailable owner; no relative-to-normal value is derived under the current contract |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome or truthful `Unavailable` route. `size_relative_to_normal_size` has no approved relation formula or result unit; a Category 11 bucket retains only its membership/bucket unit and cannot supply a default quantity, currency, exposure, ratio, or percentage unit. |
| Open-trade support | The locked relative-to-normal calculation remains unavailable for both open and closed trades until the complete future contract is approved. A current open position may have factual size or bucket membership only under its owning supported measure and complete lifecycle/as-of facts; it cannot enter an invented baseline or establish relative normality. |
| Fee handling | Normal-size resolution is normally fee-independent. A downstream fee-sensitive condition or result comparison retains the owner's explicit gross/net, fee, and currency contract; size wording cannot supply fees or change the baseline measure. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous relative-size and baseline language.
- Narrower concepts: Category 11 size-bucket membership; proposed personal,
  recent, setup-specific, or condition-specific baseline families; locked
  unavailable Category 6 `size_relative_to_normal_size`.
- Commonly confused concepts: `size_ambiguity`, average size, median size,
  typical size, planned risk, account-equity-relative size, and size advice.
- Must not be merged with: bucket membership and relative-to-normal calculation,
  a universal normal, default numerator/relation formula, implicit result unit,
  one observed trade, an unstated recent window, another account's baseline, or
  recommendation.

## `large_loss_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-015 |
| Category | Ambiguity Language |
| Subcategory | Loss metric, magnitude, threshold, and baseline ambiguity |
| Canonical name | `large_loss_ambiguity` |
| Display name | Large Loss Ambiguity |
| Exact definition | Detect and route `large loss` only after an approved loss metric is selected: gross realized P/L, fee-complete net realized P/L, or another locked loss measure such as an approved R-multiple or drawdown owner. Require signed-versus-absolute magnitude semantics and exact units/currency. Then resolve an explicit fixed threshold, authorized versioned baseline, or owner-defined bucket. A fixed threshold must declare its strict/inclusive comparison operator, endpoint, and equality handling; there is no `>` versus `>=` default. A bucket must use its locked owner to declare all bounds, endpoint inclusivity, and gap/overlap behavior. A baseline requires its statistic/range, window/as-of, version/applicability, compatible measure/unit, and comparison relation. Then require eligible population and time/event range, gross/net and fee-completeness state, sample/exclusion rules, and coverage. Preserve the staged order: loss measure first; signed/absolute representation second; threshold, baseline, or bucket contract third; then population/time, fee/currency, sample, and coverage. There is no hidden dollar, percentile, standard-deviation, R, personal threshold, endpoint, or equality rule. A loss outcome alone does not establish unusual magnitude, rule breach, process quality, cause, or advice. |
| Distinction from related concepts | Categories 2-5 own loss/P&L, drawdown, expectancy, and fee facts; Categories 11-12 own explicit loss buckets/baselines, typed comparisons, bounds, endpoints, and gap/overlap behavior; Category 14 owns largest/worst ranking. This record only resolves metric and magnitude-definition ambiguity. `Large loss` is not automatically the most negative trade, maximum loss, largest absolute P/L, net loss, stop-defined risk, drawdown, or a bad trade. A threshold test and bucket membership are distinct owner contracts, and equality cannot silently move between them. |
| Evidence classification | Directly observed wording and explicit/trusted typed metric, sign/absolute, units/currency, threshold operator/endpoint/equality, bucket bounds/endpoints/gap-overlap, baseline, population/time, fee, sample, and coverage context; deterministically derived candidate owners, predicate/bucket/baseline compatibility, completeness, materiality, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; resolved owners retain currency, R, percentage, or another approved loss unit plus signed/absolute, strict/inclusive operator, endpoint/equality, or owner-defined bucket/baseline metadata, with no default unit or comparator here |
| Open-trade support | Realized large-loss classification uses the locked eligible ready-closed population. An open/unrealized adverse value is a separate approved valuation owner requiring as-of, price-source, currency, and coverage facts and cannot be merged with realized loss or finalized as a large-loss trade by default. |
| Fee handling | Gross and fee-complete net are distinct candidate bases. Net uses locked `gross_pnl - allocated charge_cost + allocated charge_credit` semantics with conserving allocation and compatible currency; incomplete fees yield partial/unavailable coverage, never gross fallback or estimated charges. Other loss owners retain their exact fee contract. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous adverse-result magnitude language.
- Narrower concepts: gross-dollar threshold; fee-complete net-dollar threshold;
  approved R/drawdown measure; fixed predicate with explicit operator/equality;
  owner-defined bounded bucket; versioned relative baseline.
- Commonly confused concepts: `worst_ambiguity`, `larger_losses`, maximum loss,
  drawdown, stop risk, loss outlier, and `bad_trade_ambiguity`.
- Must not be merged with: `>` and `>=`, inclusive and exclusive endpoints,
  threshold predicate and bucket membership, one universal threshold,
  signed/absolute default, gross/net fallback, open/unrealized value, cause,
  process judgment, or advice.

## `performance_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-016 |
| Category | Ambiguity Language |
| Subcategory | Metric-set, basis, and population ambiguity |
| Canonical name | `performance_ambiguity` |
| Display name | Performance Ambiguity |
| Exact definition | Detect and route `performance` wording only after the user selects one locked metric or an explicitly approved versioned metric set with declared component formulas, units, directions, weighting/aggregation, missing-component behavior, and interpretation. Require the metric/set's exact basis, eligible authorized population and grain, time/event period, units and compatible currency, gross/net and fee-completeness contract, sample/exclusion/outlier rules, open-trade handling, and coverage. Ask which metric or approved metric set should represent performance first, then stage basis, population, period, fees/currency, sample, and coverage. Never synthesize a global performance score, average incompatible units, select only favorable metrics, infer quality/skill/cause, or turn historical description into prediction or advice. |
| Distinction from related concepts | Categories 2-10 own individual metrics, Category 11 owns populations/groupings, Category 14 owns comparisons/rankings, and Category 18 owns presentation only. This record selects an owner metric or approved metric set; it does not calculate, weight, summarize, compare, or score performance. P/L, win rate, expectancy, drawdown, consistency, frequency, and process adherence are non-equivalent. |
| Evidence classification | Directly observed wording and explicit/trusted typed metric/set, version, basis, population, period, unit/currency, fee, sample, and coverage context; deterministically derived authorized candidate metrics/sets, compatibility, completeness, materiality, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; a single resolved metric retains its owner unit, while an approved multi-metric set retains separate component units or its explicitly approved score unit—never an invented common unit |
| Open-trade support | Owner-dependent and component-specific. Ready-closed realized metrics exclude open trades; approved open/unrealized or exposure components require explicit as-of/valuation facts. A metric set must state how unsupported/open-ineligible components affect availability and cannot silently drop them. |
| Fee handling | Every P/L-sensitive metric/component requires its declared gross or fee-complete net basis and compatible currency. Net preserves exact allocated charge costs/credits; partial fee coverage remains visible per component/population. A metric set cannot mix gross and net silently or impute missing fees. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous analytics-summary language.
- Narrower concepts: one locked performance metric; approved versioned
  multi-metric performance set.
- Commonly confused concepts: P/L, win rate, expectancy, drawdown,
  `consistency_ambiguity`, ranking, response summary mode, quality, and skill.
- Must not be merged with: a global score, hidden weighting, incompatible-unit
  average, recommendation, causal diagnosis, or future-performance prediction.

## `consistency_ambiguity`

| Field | Value |
|---|---|
| Inventory ID | C17-AMB-017 |
| Category | Ambiguity Language |
| Subcategory | Formula, representation, direction, and sample ambiguity |
| Canonical name | `consistency_ambiguity` |
| Display name | Consistency Ambiguity |
| Exact definition | Detect and route `consistency` wording only after selection of an approved versioned formula, such as a locked dispersion measure over an explicit result representation or an exact rule/process adherence measure. Require the formula/version, representation (for example currency P/L, R, percentage, duration, size, or binary adherence), declared direction stating how more/less consistent maps to the result, eligible authorized population and grain, minimum sample, exclusions/outlier treatment, time/event period, metric basis, gross/net and fee-completeness state where applicable, compatible currency/partition, open-trade handling, and coverage. Ask which approved consistency measure should be used first, then stage representation/direction, population/sample/outliers, period, basis/fees/currency, and coverage. There is no default formula, standard deviation/variance choice, lower-is-better direction, adherence interpretation, sample threshold, or outlier policy. Repeated outcomes do not prove discipline, quality, skill, cause, or future stability. |
| Distinction from related concepts | Category 4 owns approved dispersion/edge-quality metrics; Category 9/11 own factual adherence/process owners; Category 14 owns `most_consistent` and `less_consistent` composition. This record selects the consistency owner and contract only. Consistency is not profitability, win rate, low drawdown, frequency, identical trade size, rule following, or a general quality score unless an approved formula explicitly defines that representation. |
| Evidence classification | Directly observed wording and explicit/trusted typed formula/version, representation, direction, population, sample/outlier, period, basis/fee/currency, and coverage context; deterministically derived candidate owners, formula compatibility, completeness, materiality, and route |
| Capability status | Planned |
| Result units | Privacy-safe typed ambiguity outcome; resolved owners retain their declared dispersion or adherence representation/unit and direction, with no default unit, scale, or score here |
| Open-trade support | Owner-dependent. Ready-closed result dispersion excludes open trades. A size/time/process or adherence formula may include an open lifecycle only when its exact owner declares eligibility and complete comparable facts; missing endpoints or unrealized values remain excluded/unavailable with visible coverage, not zero. |
| Fee handling | A P/L-based representation requires explicit gross or fee-complete net basis and compatible currency. Net preserves exact allocated charge costs/credits; incomplete fees remain partial/unavailable. Adherence or nonfinancial representations retain their owner's fee rule and cannot be silently converted to P/L consistency. |
| Version | 1 |

### Related Concepts

- Broader concept: materially ambiguous stability, dispersion, or adherence language.
- Narrower concepts: versioned dispersion formula over a declared representation;
  exact rule/process adherence consistency measure.
- Commonly confused concepts: standard deviation, variance, expectancy,
  profitability, win rate, drawdown, adherence rate, `most_consistent`, and
  `performance_ambiguity`.
- Must not be merged with: a default formula/direction, generic quality score,
  discipline or skill judgment, hidden outlier/sample policy, cause, or prediction.

---

# 6. Language Registry Deliverable

**Registry batch status:** All three registry batches, C17-AMB-001 through
C17-AMB-017, independently PASSed and were accepted by the controller. On
2026-08-12 the lead controller approved and locked all seventeen registries at
Version 1. All capability statuses remain `Planned`; no runtime capability is
claimed.

**Batch-wide registry contract:** Each entry has all 38 required subsections in
template order. Preserve the Section 3.3 resolution ladder, ask one highest-
impact field at a time, and stage dependent questions. Only locked Category 1
intent names may be used. Explicit wording or trusted typed current context may
resolve only one same-account, server-authorized, compatible, materially
complete meaning. Category 15 exclusively owns accepted-query/pending-
ambiguity state; Category 16 owns exact/fuzzy and ticker-like/abbreviation/
label-class collision safety. A registry route cannot change an owner's metric,
formula/version, direction, basis, units, population, time/event, N, tie,
fee/currency, sample, coverage, open-trade, or capability contract. `Planned`,
`Unavailable`, and `Unsupported` remain distinct. Never expose raw IDs or
unnecessary private text, cross accounts, infer cause/motive, give advice or a
prediction, mutate state, or claim runtime support.

## `best_ambiguity` Language Registry

### Exact Definition

- C17-AMB-001 routes `best` among a locked metric/direction ranking, an approved
  versioned score, and subjective quality/advice. It resolves only with exact
  population, period, positive integer N, privacy-safe ties, and coverage.

### Formal Wording

- “Identify the best authorized group under the specified fee-complete net P/L metric.”
- “Rank the eligible population using the approved score and declared direction.”

### Normal Conversational Wording

- “Which trades were my best by net P and L last month?”
- “What was my best setup using the approved score?”

### Trader Slang

- “What was my best runner by realized net P and L?”
- “Show my top performer by expectancy.” `Top` remains Category 14 wording after resolution.

### Abbreviations

- No bare abbreviation is safe. `#1 by net P&L` may route only after `#1`, P&L,
  population, N, and ticker-like/abbreviation collisions resolve.

### Common Misspellings

- `bets trades` and `besst setup` are fuzzy candidates only; never auto-correct
  across a ticker, saved label, or ordinary-word collision.

### Noisy or Incomplete Input

- `best?? last mo top 5 net pnl` is resolvable only after exact period, fee
  completeness, population, N, and ties validate.
- `best ones` remains ambiguous.

### Singular and Plural Forms

- `best trade`, `best trades`, `best group`, and `best groups` retain distinct
  entity/population and N requirements.

### Full Questions

- “Which five eligible ready-closed trades had the best fee-complete net P/L last quarter?”
- “Which setup ranks best under my approved score, with sample coverage shown?”

### Commands

- “Rank the authorized ticker groups from best to worst by expectancy and show ties.”

### Sentence Fragments

- `best by gross P/L, last 90 days`
- `best approved score; top three`

### Follow-Up Wording

- “By best, I mean highest fee-complete net P/L.”
- “Keep that metric; make it the top five.”

### Correction Wording

- “No, use expectancy, not win rate, to define best.”
- “Use the approved score, not highest raw P/L.”

### Comparison Wording

- “Of these two authorized groups, which is best by the same expectancy definition?”

### Ranking Wording

- “Rank the top ten setups by the declared approved score with the approved tie policy.”

### Negated Wording

- “Do not define best by win rate; use fee-complete net P/L.”

### Exclusion Wording

- “Find the best by expectancy, excluding records outside the validated population and reporting unknown coverage.”

### Multi-Filter Wording

- “Best long NVDA ready-closed trades last month by fee-complete net P/L, top five.”

### Multi-Part Question Wording

- “Rank my three best setups by expectancy, show samples and ties, then explain the metric definition.”

### Ambiguous Wording

- `Show my best trades.` could mean P/L, expectancy, outcome, an approved score,
  process quality, or advice; select none silently.

### Negative Examples

These examples must not map to this concept.

- `Show the best bid and offer now.` is a separate market-data request.
- `What is the best stock to buy tomorrow?` is an unsupported advice/prediction request.
- `My saved setup is named Best Breakout.` is label resolution, not a best ranking.

### Context Requirements

- Same server-authorized user/workspace/Journal account; explicit or trusted
  accepted metric/score, direction, population/group, period/event, positive N,
  tie policy, capability, samples, and coverage; no raw IDs or private candidate text.

### Required Data

- Locked metric or approved score formula/version/direction; authorized eligible
  candidates; compatible units/basis/currency; time/event contract; positive N;
  exact unrounded sort values; privacy-safe ties; missing/excluded counts.

### Optional Data

- Explicit filters/groupings, trusted selected population, response preference,
  and privacy-safe evidence references after the query resolves.

### Valid Filters

- Only locked owner-compatible authorized filters applied without changing the
  candidate identity or hiding unknown/decision coverage.

### Valid Groupings

- Authorized Category 11 groups with compatible complete metric/score facts;
  never invented quality, private-label, or cross-account groups.

### Valid Operators

- Category 14 rank/sort under declared direction, positive integer N,
  deterministic privacy-safe ties, and exact values before display rounding.

### Compatible Intents

- `rank_results`, `identify_strengths`, `summarize_performance`,
  `explain_result`, and `inspect_data_quality` after ambiguity resolution.

### Incompatible Combinations

- Missing metric/score or direction; nonpositive/unknown N; incompatible units
  or populations; hidden tie rule; cross-account candidates; quality/advice as
  fact; protected mutation; unavailable data treated as zero.

### Default Interpretation

- None. `Best` does not default to highest number, P/L, win rate, one trade,
  closed trades, a score, or a recommendation.

### Clarification Conditions

- Clarify when metric versus approved score remains material or the first
  required field is absent. After it resolves, stage direction, population,
  period, N, tie, fee/currency, sample, and coverage separately as needed.

### Recommended Clarification Wording

- `Which metric or approved score should define best?`

### Unsupported Conditions

- Cross-account/private-candidate access, recommendations, predictions, causal
  quality claims, or mutation are `Unsupported`. Missing metric facts are
  `Unavailable`; this designed registry remains `Planned`, not runtime support.

### Target Analytics Tool or Query Capability

- Planned ambiguity candidate router, Category 15 state validator, Category 16
  token guard, locked metric/score validator, and Category 14 ranking composer.

### Result Units

- Typed resolution/pending/unavailable/unsupported state. After resolution, the
  locked metric/score retains its own unit; this registry has no numeric unit.

### Fee Handling

- P/L-sensitive routes require explicit gross or fee-complete net basis. Net
  preserves exact allocated charge costs/credits and compatible currency;
  incomplete fees remain partial/unavailable, never gross fallback.

### Open-Trade Handling

- Open trades participate only if the selected owner supports them with exact
  as-of/valuation/currency coverage. Never mix open unrealized and ready-closed
  realized facts or default `best trade` to either population.

### Sample-Size Considerations

- Retain eligible, excluded, missing, unavailable, and per-group counts. Small
  samples remain visible; no hidden minimum, confidence, or quality inference.

## `worst_ambiguity` Language Registry

### Exact Definition

- C17-AMB-002 routes `worst` among a locked metric/direction ranking, an
  approved versioned score, signed versus absolute adverse magnitude, and
  subjective quality. It performs no ranking or judgment.

### Formal Wording

- “Identify the worst authorized group under the specified metric and direction.”
- “Rank the eligible population by the approved score's declared worst direction.”

### Normal Conversational Wording

- “Which trades were worst by fee-complete net P and L?”
- “What was my worst setup under the approved score?”

### Trader Slang

- “Show my biggest bag by absolute net loss.”
- “Which setup got smoked worst by expectancy?” Slang never supplies cause or quality.

### Abbreviations

- No bare abbreviation is safe. `#last by net P&L` and `WL` require explicit
  expansion plus Category 16 ticker/abbreviation/class collision checks.

### Common Misspellings

- `wrost trades` and `wosrt setup` are fuzzy candidates only and cannot outrank
  an authorized ticker or saved-label interpretation.

### Noisy or Incomplete Input

- `worst?? july abs loss top 3` still needs locked metric/basis, population,
  positive N, ties, fee/currency, and coverage.
- `show worst` remains ambiguous.

### Singular and Plural Forms

- `worst trade`, `worst trades`, `worst group`, and `worst groups` preserve
  entity/population and N differences.

### Full Questions

- “Which five eligible trades had the worst fee-complete net P/L last quarter?”
- “Which strategy ranks worst under the approved score with samples and ties?”

### Commands

- “Rank the bottom five authorized groups by expectancy using the approved tie policy.”

### Sentence Fragments

- `worst by absolute net loss, July`
- `worst approved score; bottom three`

### Follow-Up Wording

- “By worst, I mean largest absolute fee-complete net loss.”
- “Keep that score; show the bottom five.”

### Correction Wording

- “No, use lowest expectancy, not largest dollar loss.”
- “Use signed net P/L, not absolute magnitude.”

### Comparison Wording

- “Which of these two groups is worse under the same declared expectancy direction?”

### Ranking Wording

- “Rank the ten worst groups by the approved score and keep tied results deterministic.”

### Negated Wording

- “Do not define worst as biggest absolute loss; use lowest expectancy.”

### Exclusion Wording

- “Find the worst by net P/L excluding ineligible records, while reporting unknown coverage.”

### Multi-Filter Wording

- “Worst short ready-closed trades in July by absolute fee-complete net loss, bottom five.”

### Multi-Part Question Wording

- “Rank the three worst setups by expectancy, show samples and ties, then explain the direction.”

### Ambiguous Wording

- `Show my worst trades.` could mean lowest signed P/L, largest absolute loss,
  lowest expectancy, an approved score, process quality, or advice.

### Negative Examples

These examples must not map to this concept.

- `Show the worst ask price in today's quote feed.` is market-data wording.
- `Which stock will perform worst tomorrow?` is unsupported prediction.
- `My tag is Worst Entry.` is saved-label resolution, not ranking ambiguity.

### Context Requirements

- Same authorized account; explicit/trusted metric or score, formula/version,
  direction, signed/absolute basis, population, period, positive N, ties,
  fee/currency, sample, and coverage; no raw stable IDs or private candidates.

### Required Data

- Locked metric or approved score; declared direction; sign/absolute rule where
  relevant; eligible candidates; exact unrounded values; positive N; privacy-safe
  ties; compatible units/currency; coverage and exclusions.

### Optional Data

- Valid filters/groupings, trusted selected population, and privacy-safe evidence
  after semantic and authorization gates pass.

### Valid Filters

- Locked owner-compatible authorized filters that do not renumber, invent, or
  hide unknown/decision populations.

### Valid Groupings

- Authorized compatible Category 11 groups; no inferred bad-trade, person,
  private-label, or cross-account grouping.

### Valid Operators

- Category 14 ranking with declared direction, signed/absolute semantics where
  applicable, positive N, exact pre-rounded values, and privacy-safe ties.

### Compatible Intents

- `rank_results`, `summarize_performance`, `diagnose_performance`,
  `explain_result`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Hidden metric/score/direction/sign basis; nonpositive N; incompatible sides or
  units; private/cross-account candidates; prediction, person judgment, cause,
  advice, mutation, or unavailable facts treated as worst.

### Default Interpretation

- None. `Worst` does not default to lowest number, largest absolute loss, net
  P/L, one trade, a bad-trade label, or advice.

### Clarification Conditions

- Clarify metric versus approved score first. Then stage score formula/version,
  direction, signed/absolute basis, population, period, positive N, ties,
  fee/currency, sample, and coverage.

### Recommended Clarification Wording

- `Which metric or approved score should define worst?`

### Unsupported Conditions

- Prediction, recommendation, cross-account/private access, person/quality/
  causal claims, and mutation are `Unsupported`. Missing required owner facts
  are `Unavailable`; this registry and Chat path remain `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state validator, Category 16 token
  guard, owner metric/score validator, and Category 14 ranking composer.

### Result Units

- Typed resolution/pending/unavailable/unsupported state. Resolved owner metric
  or score retains its units and direction; no registry numeric unit.

### Fee Handling

- Loss/P&L routes require gross or fee-complete net and signed/absolute meaning.
  Net retains exact allocated costs/credits and currency; incomplete fees are
  partial/unavailable, never gross fallback.

### Open-Trade Handling

- Open/unrealized losses require a separate supported owner and exact as-of,
  valuation, and currency facts. Never mix them with ready-closed realized losses
  or finalize an open lifecycle as the worst trade by default.

### Sample-Size Considerations

- Report side/group candidate counts, ties, missing/ineligible records, and
  limitations. One extreme observation cannot silently establish persistent quality.

## `better_ambiguity` Language Registry

### Exact Definition

- C17-AMB-003 routes `better` only after compatible comparison sides/reference
  resolve first, followed by one locked metric or approved criterion and its
  direction/basis. It never supplies preference, quality, cause, or advice.

### Formal Wording

- “Compare the two authorized populations under the declared metric and direction.”
- “Determine which side has the better result using the approved criterion.”

### Normal Conversational Wording

- “Were mornings or afternoons better by expectancy?”
- “Which of these two setups was better on fee-complete net P and L?”

### Trader Slang

- “Which side traded cleaner under my saved rule-adherence definition?”
- “Did the open do better than midday by net P and L?”

### Abbreviations

- No bare abbreviation is safe. `A > B?` is only a candidate comparison; `>`
  cannot establish which metric, direction, or quality meaning applies.

### Common Misspellings

- `bettter`, `beter`, and `bettr than` are fuzzy candidates only and remain
  subject to Category 16 token, ticker, and saved-label collision checks.

### Noisy or Incomplete Input

- `which better A B` first needs exact authorized sides, then metric/direction.
- `better now?` needs a resolved current/previous reference and metric.

### Singular and Plural Forms

- `better trade`, `better trades`, `better group`, and `better groups` retain
  distinct side/population semantics.

### Full Questions

- “Were authorized setup A or setup B better by expectancy last quarter?”
- “Was this selected trade better than similar trades on fee-complete net P/L?”

### Commands

- “Compare these two authorized periods and decide better only by the declared metric direction.”

### Sentence Fragments

- `morning vs afternoon; better by expectancy`
- `this one better than peers? net P/L`

### Follow-Up Wording

- “By better, I mean higher expectancy.”
- “Keep those sides; use fee-complete net P/L instead.”

### Correction Wording

- “No, compare June with July, not July with August.”
- “I meant rule adherence, not profitability.”

### Comparison Wording

- “Compare side A with side B using signed left-minus-right expectancy and the fixed equality rule.”

### Ranking Wording

- “For these two resolved sides, order them by the approved metric direction; do not invent a broader ranking.”

### Negated Wording

- “Do not use win rate to decide better; use expectancy.”

### Exclusion Wording

- “Compare the two sides excluding ineligible rows and keep unknown coverage outside both.”

### Multi-Filter Wording

- “Were long NVDA mornings or afternoons better by fee-complete net P/L last month?”

### Multi-Part Question Wording

- “Resolve the two sides, compare expectancy, report signed and absolute differences, samples, and coverage.”

### Ambiguous Wording

- `Which was better?` lacks sides/reference and metric/criterion. Ask sides first;
  do not use recency, UI order, or the prior answer's prose as identity.

### Negative Examples

These examples must not map to this concept.

- `Make this chart look better.` is presentation/editing language.
- `Which stock is better to buy tomorrow?` is unsupported advice/prediction.
- `Better Breakout is my setup name.` is saved-label resolution.

### Context Requirements

- Two explicit or trusted typed current authorized compatible sides/reference;
  locked metric/criterion, formula/version/direction, basis/units, side-specific
  populations/time, equality/difference/baseline, samples, and coverage.

### Required Data

- Exact left/right identity and authorization; compatible owner facts; metric/
  criterion and direction; side-specific eligible values/counts; signed
  left-minus-right and absolute magnitude; equality; coverage.

### Optional Data

- Explicit percentage difference only with a named compatible meaningful
  nonzero baseline; valid filters/groupings and privacy-safe evidence.

### Valid Filters

- Identical or explicitly compatible locked filters per side, preserving
  side-specific eligibility, exclusions, unknowns, and authorization.

### Valid Groupings

- Two explicit compatible authorized groups, periods, trades, or owner-approved
  references; never inferred peers or cross-account complements.

### Valid Operators

- Category 14 direct comparison, signed left-minus-right, absolute magnitude,
  fixed equality, and optional percentage only with valid explicit baseline.

### Compatible Intents

- `compare_groups`, `analyze_trend`, `analyze_trade`, `evaluate_rule`,
  `evaluate_label`, `explain_result`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Missing/nonunique sides; incompatible populations/units/bases; hidden metric
  or direction; invalid/zero percentage baseline; cross-account reference;
  quality, cause, advice, prediction, mutation, or missing facts treated as equal.

### Default Interpretation

- None. `Better` supplies neither sides, metric, direction, baseline, equality,
  percentage denominator, quality criterion, nor advice.

### Clarification Conditions

- If sides/reference are missing or nonunique, clarify them first. Only after
  they resolve, ask metric/direction, basis, population/time, baseline,
  fee/currency, sample, and coverage sequentially.

### Recommended Clarification Wording

- `Which two compatible groups, periods, trades, or other sides should I compare?`

### Unsupported Conditions

- Cross-account/private comparisons, recommendations, predictions, causal or
  person-quality claims, and mutation are `Unsupported`. Missing side/metric
  facts are `Unavailable`; the registry/runtime remains `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 reference/state validator, Category 16
  collision guard, owner metric validator, and Category 14 comparison composer.

### Result Units

- Typed ambiguity state. A resolved comparison retains metric units plus signed
  difference/absolute magnitude; percentage appears only under its valid baseline.

### Fee Handling

- Fee-sensitive sides use the same explicit gross or fee-complete net contract.
  Net preserves exact allocated costs/credits and currency; report side-specific
  incomplete coverage without gross substitution.

### Open-Trade Handling

- Both sides require compatible open/closed eligibility. Open values need exact
  as-of/valuation/currency facts and cannot be silently compared with realized
  ready-closed outcomes.

### Sample-Size Considerations

- Report side-specific eligible, missing, excluded, and unavailable counts and
  overlap. Equality of small results is descriptive, not proof of equivalence.

## `profit_ambiguity` Language Registry

### Exact Definition

- C17-AMB-004 first routes `profit` among total realized P/L, winners-only
  positive contribution, and open/unrealized profit. Only afterward may a
  realized route resolve gross versus fee-complete net.

### Formal Wording

- “Calculate total realized profit and loss using the specified gross or fee-complete net basis.”
- “Report positive contribution from selected-basis winning trades only.”

### Normal Conversational Wording

- “How much profit did I make after fees last month?”
- “How much profit came only from my winners?”

### Trader Slang

- “What did I bank after fees?” can mean realized net P/L only with exact context.
- “How much am I up on this open one?” routes separately to open/unrealized value.

### Abbreviations

- `P/L`, `P&L`, `GP`, and `NP` require approved expansion and Category 16
  abbreviation/ticker/class collision checks; bare `P` is never safe.

### Common Misspellings

- `profut`, `proffit`, and `realised proft` are fuzzy candidates only and cannot
  supply total/winners/open or gross/net meaning.

### Noisy or Incomplete Input

- `profit july?? after fees` still needs total-realized versus winners-only/open,
  eligible population, fee completeness, currency, and coverage.
- `profit on this` needs trusted typed selected-entity context.

### Singular and Plural Forms

- `profit`, `profits`, `trade profit`, and `trades' profit` do not change the
  required grain, population, realization, or basis.

### Full Questions

- “What was my total fee-complete net P/L for eligible ready-closed trades last month?”
- “What is the supported unrealized profit on the trusted selected open position as of the stated time?”

### Commands

- “Sum total realized gross P/L for the authorized period and report currency coverage.”

### Sentence Fragments

- `total realized profit, after fees, July`
- `winners-only gross profit`
- `open profit as of 10:30 Eastern`

### Follow-Up Wording

- “By profit, I meant total realized P/L.”
- “Use fee-complete net, not gross.”

### Correction Wording

- “No, I meant profit from winners only, not the whole population.”
- “That is open/unrealized profit, not realized P/L.”

### Comparison Wording

- “Compare total fee-complete net P/L for the two authorized groups, not winners-only contribution.”

### Ranking Wording

- “Rank groups by total realized fee-complete net P/L after resolving profit meaning and ties.”

### Negated Wording

- “Show total realized P/L, not open profit and not winners-only profit.”

### Exclusion Wording

- “Exclude ineligible or fee-incomplete records from the net result and report them separately.”

### Multi-Filter Wording

- “Total fee-complete net P/L for long NVDA ready-closed trades last quarter.”

### Multi-Part Question Wording

- “Report total realized gross and fee-complete net P/L separately, then show eligible and unavailable counts.”

### Ambiguous Wording

- `How much profit did I make?` could mean whole-population realized P/L,
  winners-only contribution, or open value; ask that family before gross/net.

### Negative Examples

These examples must not map to this concept.

- `What is my cash balance?` is an account-balance request.
- `How much profit will NVDA make tomorrow?` is unsupported prediction.
- `Profit Target is my saved rule.` is label/rule resolution.

### Context Requirements

- Same authorized account; explicit or trusted total/winners/open family;
  eligible grain/population, period/event, realization/as-of, gross/net basis,
  fee completeness, compatible currency, coverage; no raw trade/source IDs.

### Required Data

- Locked `gross_pnl` facts or fee-complete `net_pnl` inputs; selected-basis
  winner classification for winners-only; approved valuation source/as-of for
  open profit; eligible population, currency, exclusions, and coverage.

### Optional Data

- Valid dimensions/groupings, trusted selected trade/open position, response
  preference, and privacy-safe supporting evidence after authorization.

### Valid Filters

- Owner-compatible authorized time, ticker, direction, lifecycle, outcome, and
  label filters with eligibility and missing coverage preserved.

### Valid Groupings

- Authorized compatible Category 11 dimensions; keep whole-population,
  winners-only, and open populations explicitly distinct.

### Valid Operators

- Eligible sum under locked gross/net formula; selected-basis winner membership;
  owner-approved open valuation; compare/rank only after meaning resolution.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `retrieve_records`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `explain_result`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Mixing realized/open values; whole-population and winners-only substitution;
  missing fee/currency facts treated as zero; cross-account data; future profit,
  cause/advice, mutation, or unsupported valuation treated as available.

### Default Interpretation

- None. `Profit` supplies no total/winners/open family, realization, gross/net,
  grain, currency, period, or fee assumption.

### Clarification Conditions

- Resolve total realized P/L versus winners-only versus open/unrealized first.
  Then stage gross/net where applicable, followed by population/time,
  fee/currency, valuation, and coverage.

### Recommended Clarification Wording

- `Do you mean total realized P/L, profit from winners only, or open/unrealized profit?`

### Unsupported Conditions

- Prediction, recommendations, invented valuations/fees, cross-account/private
  access, cause claims, and mutation are `Unsupported`. Missing fee/valuation
  evidence is `Unavailable`; the registry and Chat runtime remain `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state validator, Category 16 token
  guard, locked P/L/winner/open-value validators, and deterministic metric tool.

### Result Units

- Typed ambiguity state; resolved financial owners return compatible currency.
  Percent/return requires another explicit locked owner, never inference here.

### Fee Handling

- After semantic-family resolution, realized routes require explicit gross or
  fee-complete net. Net is `gross_pnl - allocated charge_cost + allocated
  charge_credit`; partial fees remain partial/unavailable without estimation.

### Open-Trade Handling

- Realized total and winners-only use eligible ready-closed records. Open profit
  is a separate owner with explicit as-of/valuation/source/currency coverage and
  is never added to realized P/L.

### Sample-Size Considerations

- Report eligible, winning, fee-complete, open, excluded, missing, and
  unavailable counts as applicable. No minimum sample creates missing profit.

## `size_ambiguity` Language Registry

### Exact Definition

- C17-AMB-005 first distinguishes result/record count from trade, execution, or
  position size. It then resolves quantity, maximum position, dollar notional,
  or another approved exposure measure and validates its unit/event basis.

### Formal Wording

- “Specify whether size denotes record cardinality or a trade/execution/position measure.”
- “Calculate maximum open quantity under the locked lifecycle contract.”

### Normal Conversational Wording

- “By size, do you mean how many trades or how big each position was?”
- “Show my dollar position size at entry.”

### Trader Slang

- “How heavy was I?” needs an explicit measure and baseline; it proves no risk.
- “How many shares did I put on?” can resolve to entry quantity with exact events.

### Abbreviations

- `qty`, `sh`, `$ size`, and `exp` require approved expansions and Category 16
  ticker/abbreviation/class collision checks; `S` is never safe.

### Common Misspellings

- `szie`, `sharez`, and `postion size` are fuzzy candidates only; they cannot
  select quantity, notional, exposure, entity, or unit.

### Noisy or Incomplete Input

- `size?? july avg` first needs count versus entity-size, then exact measure/unit.
- `how big this one` needs a trusted typed selected entity and event basis.

### Singular and Plural Forms

- `size`, `sizes`, `position size`, `position sizes`, `share count`, and `record
  count` retain distinct measure/entity meanings.

### Full Questions

- “What was the maximum open share quantity for the trusted selected trade?”
- “How many eligible trades are in the result, rather than how large were they?”

### Commands

- “Calculate entry dollar notional using the approved entry-price event and currency.”

### Sentence Fragments

- `record count, not trade size`
- `maximum open shares`
- `entry notional USD`

### Follow-Up Wording

- “By size, I meant maximum open quantity.”
- “Keep the measure; use dollars instead of shares only if the owner supports notional.”

### Correction Wording

- “No, I meant how many records, not position size.”
- “Use entry quantity, not maximum open quantity.”

### Comparison Wording

- “Compare the two groups using the same explicit maximum-open-quantity unit.”

### Ranking Wording

- “Rank authorized trades by entry notional after validating price event, currency, N, and ties.”

### Negated Wording

- “Show share quantity, not dollar notional or exposure.”

### Exclusion Wording

- “Exclude incomplete lifecycle paths from maximum-position results and report their coverage.”

### Multi-Filter Wording

- “Maximum open share quantity for long NVDA ready-closed trades last month.”

### Multi-Part Question Wording

- “Report eligible record count and average entry quantity as separate results with units and coverage.”

### Ambiguous Wording

- `What was my size?` could mean record count, quantity, maximum position,
  notional, exposure, or a selected entity; choose none silently.

### Negative Examples

These examples must not map to this concept.

- `Resize the chart.` is a presentation request.
- `What size order should I place tomorrow?` is unsupported advice.
- `SIZE is the ticker I selected.` is ticker resolution, not a size measure.

### Context Requirements

- Same authorized account; count versus entity-size family; exact entity,
  locked measure/unit, event/valuation, lifecycle, population/time, currency/
  price where applicable, samples, and coverage; no raw IDs.

### Required Data

- For count, exact eligible candidate identity. For quantity/notional/exposure,
  accepted execution and lifecycle facts, selected event, price/currency or
  valuation contract, complete paths, and owner capability/coverage.

### Optional Data

- Trusted selected trade/execution/position, valid filters/groupings, explicit
  baseline for comparison, and privacy-safe evidence after authorization.

### Valid Filters

- Owner-compatible authorized filters applied without changing lifecycle
  identity, sequence, units, valuation basis, or missing/decision coverage.

### Valid Groupings

- Authorized Category 11 dimensions compatible with the exact measure/unit;
  never group by inferred risk, motive, or another account's labels.

### Valid Operators

- Count, sum/average where owner-approved, maximum open quantity, notional/
  exposure calculation, compare, and rank only under exact measure contracts.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `explain_result`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Count/quantity/notional/exposure substitution; missing unit/event/valuation;
  incomplete chains treated as zero; raw/client entity ID as authorization;
  cross-account data, risk/motive inference, advice, prediction, or mutation.

### Default Interpretation

- None. `Size` supplies no count-versus-entity family, measure, unit, entity,
  event, price, currency, valuation, population, or baseline.

### Clarification Conditions

- Ask count versus trade/execution/position size first. If entity size, then ask
  quantity, maximum position, dollar notional, or approved exposure; validate
  unit, event, population, valuation, and coverage afterward.

### Recommended Clarification Wording

- `Do you mean the number of results or records, or the size of a trade, execution, or position?`

### Unsupported Conditions

- Advice, inferred risk, invented quantity/valuation, cross-account/private
  access, raw-ID output, and mutation are `Unsupported`. Missing lifecycle/
  valuation facts are `Unavailable`; the registry/runtime remains `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 entity/state validator, Category 16
  token guard, locked count/Category 6 measure validator, and analytics tool.

### Result Units

- Typed ambiguity state. Resolved owners retain count, shares/quantity,
  compatible currency notional, or an approved exposure unit; no default unit.

### Fee Handling

- Size/count routing is normally fee-independent. Fee-sensitive downstream
  results retain their locked gross/net and currency contract; size never fills
  missing charges or changes financial basis.

### Open-Trade Handling

- Accepted execution quantity may be factual; maximum open quantity requires a
  complete lifecycle; current notional/exposure needs approved as-of valuation.
  Incomplete paths remain visible/unavailable, not zero.

### Sample-Size Considerations

- Report record/trade/execution grain, eligible and incomplete counts, unit
  coverage, and valuation coverage. Averages require nonzero eligible denominator.

## `risk_ambiguity` Language Registry

### Exact Definition

- C17-AMB-006 routes `risk` among an approved dollar/risk-per-share measure,
  stop-defined planned risk, locked R denominator, exposure, drawdown, authorized
  saved risk rule/version, and subjective riskiness; it computes none.

### Formal Wording

- “Specify the approved risk measure or saved rule before evaluation.”
- “Calculate stop-defined planned risk only from complete accepted plan facts.”

### Normal Conversational Wording

- “Do you mean dollars at risk, risk per share, or my saved risk rule?”
- “What was the drawdown risk for this authorized period?”

### Trader Slang

- “How much heat was I taking?” needs an approved exposure/risk meaning.
- “What was my R?” needs the exact locked risk denominator; slang supplies none.

### Abbreviations

- `R`, `RPS`, `DR`, and `risk$` require approved expansion and Category 16
  ticker/abbreviation/class collision checks; bare `R` never auto-routes.

### Common Misspellings

- `riks`, `rsik`, and `risk per shrae` are fuzzy candidates only and cannot
  invent a stop, denominator, rule, exposure, or unit.

### Noisy or Incomplete Input

- `risk?? this trade 2R` still needs exact risk owner/denominator and plan facts.
- `too risky` is subjective without an approved measure/rule.

### Singular and Plural Forms

- `risk`, `risks`, `trade risk`, `risk per share`, and `risk rules` retain
  different measure, entity, and rule semantics.

### Full Questions

- “What was the supported planned dollar risk for the selected trade under its accepted stop?”
- “Did this trade breach my exact active saved risk rule version?”

### Commands

- “Evaluate the authorized saved risk rule using only complete applicable facts.”

### Sentence Fragments

- `planned dollar risk, selected trade`
- `R denominator missing`
- `saved risk rule, current version`

### Follow-Up Wording

- “By risk, I meant risk per share.”
- “Use my saved rule, not drawdown.”

### Correction Wording

- “No, I meant realized drawdown, not planned stop risk.”
- “Use gross-basis R only if that is the locked denominator contract.”

### Comparison Wording

- “Compare the same approved risk measure for the two authorized populations.”

### Ranking Wording

- “Rank groups by the declared approved risk measure with N, ties, and coverage.”

### Negated Wording

- “Use planned dollar risk, not exposure or realized loss.”

### Exclusion Wording

- “Exclude trades missing accepted stop facts and report them as unavailable.”

### Multi-Filter Wording

- “Planned dollar risk for authorized long NVDA trades with accepted stop facts last month.”

### Multi-Part Question Wording

- “Report the approved risk measure, its formula/version, eligible sample, missing facts, and rule applicability.”

### Ambiguous Wording

- `Show my risk.` could mean planned dollars, per-share risk, R denominator,
  exposure, drawdown, saved rule, or subjective riskiness.

### Negative Examples

These examples must not map to this concept.

- `Which risky stock should I buy?` is unsupported advice.
- `RISK is my ticker.` requires ticker resolution, not a risk metric.
- `Rename my rule Risk One.` is a protected mutation, not ambiguity analysis.

### Context Requirements

- Same authorized account; explicit/trusted approved measure or saved rule;
  formula/version, units, stop/valuation/baseline, eligible population/time,
  currency, applicability, evidence, samples, capability, and coverage; no IDs.

### Required Data

- Owner-specific accepted plan/stop/quantity, valuation/exposure, drawdown path,
  R denominator, or saved rule/version/applicability facts plus authorization,
  eligible population, currency, and missing-data state.

### Optional Data

- Trusted selected trade, valid group/filter, comparison baseline, and privacy-
  safe evidence after measure, capability, and authorization resolve.

### Valid Filters

- Locked owner-compatible authorized filters that preserve plan/rule version,
  lifecycle identity, time/event, coverage, and decision/incomplete states.

### Valid Groupings

- Authorized dimensions compatible with the exact risk owner and unit; no
  inferred risky ticker, motive, emotion, or private cross-account rule group.

### Valid Operators

- Owner-approved calculate, membership/adherence evaluation, compare, rank, and
  coverage inspection; no universal risk score or inferred threshold.

### Compatible Intents

- `calculate_metric`, `analyze_trade`, `evaluate_rule`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `explain_result`,
  `diagnose_performance`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Missing/unapproved measure, formula, stop, denominator, unit, rule version, or
  evidence; risk/size/loss substitution; cross-account rule; person/motive/
  cause inference; advice, prediction, mutation, or unavailable as zero.

### Default Interpretation

- None. `Risk` supplies no measure, formula, stop, denominator, exposure,
  drawdown, rule, unit, population, time, basis, or threshold.

### Clarification Conditions

- Ask for the approved risk measure or saved rule first. Then stage formula/
  version, unit, stop/valuation/baseline, population/time, fee/currency,
  applicability, evidence, sample, and coverage.

### Recommended Clarification Wording

- `Which approved risk measure or saved rule should I use?`

### Unsupported Conditions

- Trading advice, prediction, inferred riskiness/motive, fabricated stop/rule,
  cross-account/private access, and mutation are `Unsupported`. Missing owner
  evidence is `Unavailable`; the ambiguity registry/runtime remains `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state/entity validator, Category 16
  token guard, locked risk/rule capability validator, and owner analytics tool.

### Result Units

- Typed ambiguity state. Resolved owners retain currency, currency/share, R,
  percentage, drawdown, exposure, or adherence units; none defaults here.

### Fee Handling

- Owner-specific. Planned risk/exposure may be fee-independent; realized loss,
  drawdown, or R may require explicit gross or fee-complete net. Missing fees
  remain partial/unavailable and never select a risk meaning.

### Open-Trade Handling

- Planned stop risk/current exposure may support an open trade only with exact
  accepted plan/stop/quantity/valuation/as-of/currency facts. Ready-closed
  realized metrics cannot be silently applied to open positions.

### Sample-Size Considerations

- Single-trade risk may be factual when complete; population summaries require
  eligible/missing counts and owner minimums. No sample proves safety, motive,
  causation, or future performance.

## `later_trades_ambiguity` Language Registry

### Exact Definition

- C17-AMB-007 routes `later trades` among ordinal, after-clock-time,
  after-event/threshold, and later-attempt meanings while preserving the locked
  account/instrument/local-date sequence and barriers.

### Formal Wording

- “Resolve whether later denotes an ordinal, clock boundary, event boundary, or subsequent lifecycle attempt.”

### Normal Conversational Wording

- “By later trades, do you mean my fourth trade onward or trades after 11:00?”
- “Do you mean another attempt after I got flat?”

### Trader Slang

- “How did my late clicks do?” needs clock versus execution/trade clarification.
- “What about my re-entries?” requires verified return-to-zero lifecycle facts.

### Abbreviations

- `4+`, `LT`, and `re` are candidates only. They require explicit expansion and
  Category 16 ticker/abbreviation/class collision checks.

### Common Misspellings

- `latter trades`, `later trdes`, and `re-entires` are fuzzy candidates only;
  they never supply a boundary or sequence identity.

### Noisy or Incomplete Input

- `later?? nvda july` preserves all four meaning families until one resolves.
- `after 11` still needs exact date/timezone/event endpoints.

### Singular and Plural Forms

- `later trade`, `later trades`, `later attempt`, and `later attempts` retain
  different entity, population, and ordinal requirements.

### Full Questions

- “How did my fourth-or-later trades perform by expectancy last month?”
- “Show later attempts after a verified return to zero on the same instrument and local entry date.”

### Commands

- “Build the complete pre-filter lifecycle order, then select original ordinal four or higher.”

### Sentence Fragments

- `fourth-or-later, original ordinal`
- `after 11:00 account time`
- `attempt two plus, after flat`

### Follow-Up Wording

- “By later, I meant after 11:00, not fourth-or-later.”
- “Keep the same partition; use later attempts.”

### Correction Wording

- “No, I meant the second attempt after returning to zero, not the second fill.”

### Comparison Wording

- “Compare first trades with original fourth-or-later trades without renumbering after filters.”

### Ranking Wording

- “Rank authorized groups by fourth-or-later count only after original ordinals and barriers are fixed.”

### Negated Wording

- “Use later lifecycle attempts, not later fills or adds inside one open trade.”

### Exclusion Wording

- “Exclude output rows outside July only after original ordinals are assigned; do not skip barriers.”

### Multi-Filter Wording

- “Original fourth-or-later long NVDA lifecycles in July with complete sequence coverage.”

### Multi-Part Question Wording

- “Resolve later-attempt meaning, report eligible count and barriers, then calculate gross P/L separately.”

### Ambiguous Wording

- `Show my later trades.` leaves ordinal, time, event, and attempt families open;
  ask one family question before any boundary detail.

### Negative Examples

These examples must not map to this concept.

- `Show later rows on this page.` is display pagination, not trade sequence.
- `Will later trades recover my loss?` is unsupported prediction/advice.
- `LATE is a ticker.` requires ticker resolution.

### Context Requirements

- Fixed server-authorized account, stable instrument, account-local entry date
  derived from raw UTC/account IANA, complete current candidate lifecycles,
  accepted event/time context, barriers, and no exposed stable ID/tie key.

### Required Data

- Complete lifecycle candidates; first-entry raw UTC; privacy-safe stable
  internal tie key; original one-based ordinal; return-to-zero facts; legitimate
  open, decision, and incomplete barriers; owner event/time facts and coverage.

### Optional Data

- Explicit output filters, downstream metric/basis, trusted selected instrument,
  and privacy-safe evidence after sequence identity resolves.

### Valid Filters

- Authorized output filters only after partition, complete candidate set,
  deterministic order, original ordinal, and barriers are fixed; no renumbering.

### Valid Groupings

- Fixed account plus stable instrument plus account-local-entry-date partitions,
  or authorized owner groups after sequence construction; no raw stable IDs.

### Valid Operators

- Order by first-entry raw UTC then private stable tie key; assign original
  one-based ordinal; select `>= 4` for fourth-or-later or `>= 2` plus verified
  return to zero for later attempts; interval/event relation for other families.

### Compatible Intents

- `retrieve_records`, `analyze_sequence`, `calculate_metric`, `compare_groups`,
  `group_and_aggregate`, `explain_result`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Fills/display rows treated as trades; post-filter numbering; skipped open/
  decision/incomplete barriers; missing return to zero; cross-account partition;
  stable ID/tie-key disclosure; cause, prediction, advice, or mutation.

### Default Interpretation

- None. `Later` supplies no ordinal, clock, event, threshold, attempt, partition,
  timezone, boundary, or predecessor.

### Clarification Conditions

- Resolve ordinal versus after-time versus after-event/threshold versus later-
  attempt first. Then stage ordinal/boundary/event, timezone, population,
  downstream metric/basis, and coverage.

### Recommended Clarification Wording

- `Should later mean a trade ordinal, trades after a clock time, trades after a specific event or threshold, or a later attempt on the same instrument?`

### Unsupported Conditions

- Cross-account/private sequence access, tie-key disclosure, causal claims,
  prediction/advice, and mutation are `Unsupported`. Incomplete paths are
  `Unavailable`; this registry/runtime remains `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state validator, Category 16 token
  guard, locked lifecycle sequencer/barrier validator, and owner query tool.

### Result Units

- Typed ambiguity state; ordinal routes retain the original one-based lifecycle
  ordinal without exposing stable keys. Downstream metrics retain owner units.

### Fee Handling

- Sequence routing is fee-independent. P/L event/metric routes retain explicit
  gross or fee-complete net, allocated cost/credit, currency, and coverage rules.

### Open-Trade Handling

- Legitimate open lifecycles remain in the complete candidate sequence and keep
  original ordinals/barriers. They enter ready-closed metrics only if owner-eligible.

### Sample-Size Considerations

- Report complete candidates, eligible outputs, original ordinal coverage, and
  open/decision/incomplete barriers. Never renumber to enlarge a sample.

## `recent_ambiguity` Language Registry

### Exact Definition

- C17-AMB-008 routes `recent` among rolling duration, last positive N records,
  named calendar period, event-relative window, and authorized saved window,
  requiring exact event/timezone/as-of/endpoints.

### Formal Wording

- “Specify the exact recent-window family, bounds, event basis, timezone, and as-of instant.”

### Normal Conversational Wording

- “Does recent mean the last 30 days or my last 20 trades?”
- “Use this month as of the stated account time.”

### Trader Slang

- “How have I been doing lately?” still needs an exact window and metric.
- “My last few trades” requires positive integer N, not a guessed count.

### Abbreviations

- `L30D`, `L20T`, and `MTD` require approved expansion and Category 16 token/
  ticker collision checks; no abbreviation supplies event basis or as-of.

### Common Misspellings

- `recnt`, `lattely`, and `lat 30 dys` are fuzzy candidates only and cannot set bounds.

### Noisy or Incomplete Input

- `recent pnl??` lacks window, as-of, event/timezone, and metric basis.
- `last few` lacks positive N and eligible record grain.

### Singular and Plural Forms

- `recent trade`, `recent trades`, `recent day`, and `recent days` preserve
  record-count versus calendar-duration distinctions.

### Full Questions

- “What was my fee-complete net P/L over the 30 calendar days ending at this explicit as-of instant?”
- “Show my last 20 eligible ready-closed trades by closing-event order.”

### Commands

- “Resolve the saved recent window version and report its exact bounds before querying.”

### Sentence Fragments

- `last 20 eligible trades`
- `rolling 30 calendar days as of [instant]`
- `since the named event`

### Follow-Up Wording

- “By recent, I meant my last 20 trades.”
- “Keep the window family; change the as-of instant.”

### Correction Wording

- “No, use the prior calendar month, not a rolling 30-day window.”

### Comparison Wording

- “Compare this exact recent window with the prior compatible window using the same event basis.”

### Ranking Wording

- “Rank groups inside the resolved recent window only after bounds, metric, N, and ties validate.”

### Negated Wording

- “Use last 20 trades, not the last 20 calendar days.”

### Exclusion Wording

- “Exclude records outside the resolved endpoints and report unknown event-time coverage.”

### Multi-Filter Wording

- “Last 20 eligible long NVDA ready-closed trades by accepted closing-event order.”

### Multi-Part Question Wording

- “Resolve recent as rolling 30 days, report exact UTC/account-local bounds, then calculate net P/L and coverage.”

### Ambiguous Wording

- `Show recent performance.` could mean duration, last-N, calendar, event, or
  saved window and also lacks a performance metric.

### Negative Examples

These examples must not map to this concept.

- `Open the most recently viewed page.` is product/UI state.
- `What will happen soon?` is unsupported prediction.
- `RECENT is my tag.` requires saved-label resolution.

### Context Requirements

- Same authorized account; exact family and N/unit or calendar/event/saved
  definition; approved event basis; account IANA/DST; explicit as-of; endpoints;
  ordering/ties for last-N; accepted state and coverage.

### Required Data

- Authorized event timestamps, account IANA zone, DST resolution, as-of instant,
  bounds/endpoints, positive N and ordering where applicable, saved definition/
  version/applicability, eligible population, and coverage.

### Optional Data

- Locked metric/basis, filters/groupings, selected entity, and privacy-safe
  evidence after the temporal contract resolves.

### Valid Filters

- Owner-compatible authorized filters applied after last-N identity/order where
  required; no server/browser clock or stale-context fallback.

### Valid Groupings

- Authorized compatible time or Category 11 groups within the exact resolved
  window; no grouping changes the as-of or endpoints.

### Valid Operators

- Endpoint-aware interval membership, positive-N selection under exact event
  order/ties, calendar resolution, event-relative bounds, and coverage reporting.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Missing as-of/event/timezone; guessed few/N; server/browser time; rolling/
  calendar substitution; stale saved version; post-filter last-N reorder;
  cross-account context, prediction, mutation, or missing data as empty.

### Default Interpretation

- None. `Recent` does not default to 7/30/90 days, this month, last N trades,
  current time, server/browser zone, event, endpoints, or saved window.

### Clarification Conditions

- Ask the exact window first. Then stage N/unit or calendar/event, event basis,
  timezone/as-of/endpoints, ordering/ties, metric, population, and coverage.

### Recommended Clarification Wording

- `What exact window should recent mean?`

### Unsupported Conditions

- Cross-account/private history, prediction, invented timestamps, and mutation
  are `Unsupported`. Missing event/time facts are `Unavailable`; the registry/
  runtime remains `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state validator, Category 16 token
  guard, Category 13 resolver, last-N order validator, and owner query tool.

### Result Units

- Typed ambiguity state; resolved windows retain duration/calendar/count/event
  metadata. Downstream result units remain with the selected owner.

### Fee Handling

- Temporal routing is fee-independent. Downstream financial metrics retain
  exact gross/net, allocated charge/credit, currency, and coverage contracts.

### Open-Trade Handling

- Open facts require a declared applicable event or as-of valuation. Last-N
  ready-closed records never silently include or reorder open lifecycles.

### Sample-Size Considerations

- Positive N is explicit. Report requested versus eligible count, missing event
  times, ties, exclusions, and incomplete window coverage.

## `cheap_stocks_ambiguity` Language Registry

### Exact Definition

- C17-AMB-009 first routes `cheap stocks` among authorized saved price bucket,
  new explicit factual price definition, and subjective valuation, then resolves
  price field/event/threshold/currency without defaults.

### Formal Wording

- “Specify whether cheap denotes a saved price bucket, an explicit price predicate, or subjective valuation.”

### Normal Conversational Wording

- “By cheap stocks, do you mean my saved bucket or stocks below a price I specify?”
- “Use entry price below five USD, not current value.”

### Trader Slang

- “Show my cheapies” resolves only through an exact authorized alias or explicit definition.
- “Under a buck” supplies a threshold but still needs price field/event/currency.

### Abbreviations

- `U5`, `sub1`, and `$cheap` require explicit expansion and Category 16 ticker/
  abbreviation/label-class collision checks.

### Common Misspellings

- `cheep stocks`, `low prced`, and `peny stocks` are fuzzy candidates only;
  they cannot create a bucket or penny-stock definition.

### Noisy or Incomplete Input

- `cheap stocks july??` first needs owner family, then price contract.
- `under 5` lacks field, event, unit/currency, endpoints, and applicability.

### Singular and Plural Forms

- `cheap stock`, `cheap stocks`, `price bucket`, and `price buckets` retain
  entity and definition/version distinctions.

### Full Questions

- “Show trades whose accepted entry price was strictly below five USD under the explicit definition.”
- “Which trades belong to my exact active authorized low-price bucket version?”

### Commands

- “Resolve the saved bucket or explicit price predicate before classifying any trade.”

### Sentence Fragments

- `saved cheap-stock bucket`
- `entry price strictly below 5 USD`
- `subjective valuation, unsupported owner`

### Follow-Up Wording

- “By cheap, I meant my saved Under Five Entry bucket.”
- “Use entry price, not a current quote.”

### Correction Wording

- “No, define it explicitly as entry price below three USD; do not use my saved bucket.”

### Comparison Wording

- “Compare inside versus outside the exact covered bucket using a separate declared performance metric.”

### Ranking Wording

- “Rank covered price buckets by eligible count only after definitions, N, and ties resolve.”

### Negated Wording

- “Use the saved bucket, not penny-stock status or subjective undervaluation.”

### Exclusion Wording

- “Exclude records with unknown entry-price membership from both bucket and complement.”

### Multi-Filter Wording

- “July long trades with accepted entry price strictly below five USD and known currency.”

### Multi-Part Question Wording

- “Resolve the price owner, report membership and unknown coverage, then compare net P/L separately.”

### Ambiguous Wording

- `Show cheap stocks.` leaves saved bucket, explicit factual threshold, and
  subjective valuation open; ask that family before price details.

### Negative Examples

These examples must not map to this concept.

- `Show current quotes for my watchlist.` is separate market data.
- `Which cheap stock should I buy?` is unsupported advice.
- `CHEAP is a ticker.` requires ticker resolution.

### Context Requirements

- Same authorized account; explicit owner family; Category 16 exact/fuzzy/
  ticker/class state; saved version/coverage or price field/event/threshold/
  operator/endpoints/currency/applicability; no private definition or raw ID.

### Required Data

- Authorized saved bucket definition/version/membership coverage, or accepted
  price field/event/time, operator/threshold/endpoints, unit/currency,
  population/applicability, and missing state; subjective owner if approved.

### Optional Data

- Valid period/ticker/grouping and downstream metric/basis after price meaning
  resolves; owner-permitted explicitly labelled assumption only.

### Valid Filters

- Exact owner-approved bucket membership or typed price predicate. Unknown
  membership stays outside both set and complement; no current-quote fallback.

### Valid Groupings

- Authorized complete price buckets or compatible dimensions; no inferred value,
  penny-stock, low-float, market-cap, or cross-account group.

### Valid Operators

- Owner-defined range membership or explicit typed price comparison with exact
  operator/endpoints; compare/rank only after separate metric resolution.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `evaluate_label`, `explain_result`,
  and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Hidden threshold/field/event/currency; current quote or penny-stock default;
  subjective value as fact; fuzzy/ticker collision bypass; cross-account bucket;
  advice, prediction, mutation, or unknown membership as false.

### Default Interpretation

- None. No universal cheap threshold, price field/event, currency, bucket,
  current quote, penny-stock status, or valuation meaning exists.

### Clarification Conditions

- Resolve saved bucket versus new explicit price definition versus subjective
  valuation first. Then stage field/event, threshold/operator/endpoints,
  currency/applicability, population, and coverage.

### Recommended Clarification Wording

- `Does cheap stocks mean one of your saved price buckets, a new explicit price definition, or a subjective valuation description?`

### Unsupported Conditions

- Advice, valuation claims without owner, current quotes without approved data,
  cross-account/private definitions, inferred penny status, and mutation are
  `Unsupported`. Missing prices are `Unavailable`; registry/runtime is `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state validator, Category 16 collision/
  saved-definition resolver, typed price predicate validator, and owner query.

### Result Units

- Typed ambiguity state; factual price owners retain compatible currency per
  share and predicate/bucket metadata. Subjective valuation has no default unit.

### Fee Handling

- Price resolution is fee-independent. Downstream P/L comparisons retain exact
  gross/net, allocated cost/credit, currency, and coverage contracts.

### Open-Trade Handling

- Historical event predicates use covered accepted price facts. Current open/
  quote meaning needs a separate approved as-of market-data owner; no stale fallback.

### Sample-Size Considerations

- Report covered members, known nonmembers, unknowns, missing price/currency,
  and per-bucket samples. No sample validates subjective cheapness.

## `scalp_ambiguity` Language Registry

### Exact Definition

- C17-AMB-010 routes `scalp` among an authorized saved label, explicit duration/
  event definition, explicit session behavior, and ordinary description without
  inferring style, setup, quality, motive, or advice.

### Formal Wording

- “Specify whether scalp denotes a saved label, duration/event definition, session behavior, or ordinary description.”

### Normal Conversational Wording

- “Does scalp mean my saved setup or a trade held under five minutes?”
- “I was just describing the exit; do not treat scalp as a label.”

### Trader Slang

- “Quick scalp” still supplies neither saved-label membership nor exact duration endpoints.
- “Hit-and-run trade” is ordinary wording unless an approved owner resolves it.

### Abbreviations

- `SC`, `SCLP`, and `sc` require explicit expansion and Category 16 ticker/
  abbreviation/label-class collision checks.

### Common Misspellings

- `scapl`, `scalpp`, and `scalpng` are fuzzy candidates only; never auto-associate a trade.

### Noisy or Incomplete Input

- `my scalps july` first needs saved-label versus duration/session/description.
- `quick ones` has no label, duration threshold, or event basis.

### Singular and Plural Forms

- `scalp`, `scalps`, `scalp trade`, and `scalp setup` preserve label/entity differences.

### Full Questions

- “Show July trades explicitly associated with my exact active Scalp setup.”
- “Show trades held under the explicit duration threshold using locked endpoints.”

### Commands

- “Resolve the scalp meaning family before retrieving any associated records.”

### Sentence Fragments

- `saved Scalp setup`
- `duration-defined scalp`
- `session behavior, not label`

### Follow-Up Wording

- “By scalp, I meant my saved setup label.”
- “Keep the duration definition; change the explicit threshold.”

### Correction Wording

- “No, I was describing a quick exit, not assigning my Scalp setup.”

### Comparison Wording

- “Compare explicitly Scalp-associated trades with nonmembers under a separate metric.”

### Ranking Wording

- “Rank explicit saved-label groups only after identity, metric, N, ties, and coverage resolve.”

### Negated Wording

- “Use duration-defined trades, not my saved Scalp label.”

### Exclusion Wording

- “Exclude only proven nonmembers; keep unknown label/duration coverage separate.”

### Multi-Filter Wording

- “July NVDA trades explicitly associated with my exact active Scalp setup.”

### Multi-Part Question Wording

- “Resolve scalp meaning, count covered members, then calculate gross P/L separately.”

### Ambiguous Wording

- `Show my scalps.` leaves saved label, duration/event, session behavior, and
  ordinary description open.

### Negative Examples

These examples must not map to this concept.

- `Scalp irritation` is ordinary nontrading language.
- `Which scalp should I take tomorrow?` is unsupported advice/prediction.
- `SCALP is a ticker.` requires ticker resolution.

### Context Requirements

- Same authorized account; explicit family; Category 16 exact/fuzzy/ticker/
  class state; label version/association or duration endpoints/event/threshold
  or explicit session criteria; population and coverage; no IDs/private text.

### Required Data

- Saved label/class/version/status and explicit association coverage; or locked
  duration events/units/threshold/time; or exact session behavior owner facts.

### Optional Data

- Trusted selected trade, valid filters/groups, downstream metric/basis, and
  privacy-safe evidence after meaning resolves.

### Valid Filters

- Explicit covered label membership, owner-approved duration predicate, or
  exact session-behavior predicate; unknowns remain separate.

### Valid Groupings

- Authorized saved labels, duration buckets, or session groups with complete
  definitions; no inferred style/quality or cross-account group.

### Valid Operators

- Exact label resolution/membership, duration interval/threshold, session
  predicate, count, compare, rank, and coverage under owner contracts.

### Compatible Intents

- `retrieve_records`, `evaluate_label`, `analyze_trade`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`,
  and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Fuzzy/colliding label auto-route; duration infers label; session/result infers
  style; unknown association as false; cross-account label; quality/motive/
  cause, advice, prediction, mutation, or raw-ID disclosure.

### Default Interpretation

- None. `Scalp` supplies no label class/version, association, duration event/
  threshold, session criterion, style, setup, or quality meaning.

### Clarification Conditions

- Resolve saved label versus duration/event versus session behavior versus
  ordinary description first; then stage label class/version, duration facts,
  session criteria, population, metric, and coverage.

### Recommended Clarification Wording

- `Does scalp mean one of your saved labels, an explicit duration or event definition, a session-behavior description, or just ordinary descriptive wording?`

### Unsupported Conditions

- Advice/prediction, inferred style/motive/quality, cross-account/private label
  access, raw IDs, and mutation are `Unsupported`. Missing association/duration
  facts are `Unavailable`; registry/runtime remains `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state/entity validator, Category 16
  label/token guard, duration/session validator, and owner query tool.

### Result Units

- Typed ambiguity state; resolved label routes return association state,
  duration routes retain time units, and session routes retain owner predicates.

### Fee Handling

- Meaning resolution is fee-independent. Downstream financial results retain
  explicit gross/net, allocated charges/credits, currency, and coverage.

### Open-Trade Handling

- Explicit label association may be owner-supported for open lifecycles. Open
  duration requires approved as-of endpoint; no elapsed time infers scalp identity.

### Sample-Size Considerations

- Report covered associations, known nonmembers, unknowns, duration-complete
  records, and per-group counts. Small samples prove no style quality.

## `overtrading_ambiguity` Language Registry

### Exact Definition

- C17-AMB-011 routes `overtrading` among an exact saved rule, explicit threshold
  plus denominator, locked factual proxy, declared baseline comparison, and
  trader-authored judgment without universal threshold or motive inference.

### Formal Wording

- “Specify the saved rule, threshold/denominator, approved proxy, or comparison baseline defining overtrading.”

### Normal Conversational Wording

- “Do you mean I broke my saved max-trades rule or traded more than usual?”
- “Use more than six completed trades per account-local day.”

### Trader Slang

- “I kept clicking” may mean executions, not lifecycle starts or overtrading.
- “I churned” needs turnover/repeats/executions/judgment clarification.

### Abbreviations

- `OT`, `maxT`, and `TPD` require explicit expansion and Category 16 collision checks.

### Common Misspellings

- `overtradding`, `over tradng`, and `too meny trades` are fuzzy candidates only.

### Noisy or Incomplete Input

- `overtrade? july` lacks standard, event grain, denominator, threshold, and coverage.
- `too much` may be subjective and supplies no baseline.

### Singular and Plural Forms

- `overtrade`, `overtrading`, `too many trades`, and `overtraded days` preserve
  event, day, rule, and judgment differences.

### Full Questions

- “Which account-local days exceeded my exact active saved max-trades rule?”
- “Was my completed-trade rate higher than the explicit historical baseline?”

### Commands

- “Evaluate the exact saved rule version and report applicability and coverage.”

### Sentence Fragments

- `saved max-trades rule`
- `more than six per day`
- `approved frequency proxy`

### Follow-Up Wording

- “By overtrading, I meant breaching my saved rule.”
- “Use the historical baseline, not a fixed threshold.”

### Correction Wording

- “No, count lifecycle starts, not fills or clicks.”

### Comparison Wording

- “Compare the declared trade rate with the explicit baseline using the same denominator.”

### Ranking Wording

- “Rank account-local days by the approved count/rate only after event grain, N, ties, and coverage resolve.”

### Negated Wording

- “Use my saved rule, not a universal trades-per-day threshold.”

### Exclusion Wording

- “Exclude inapplicable rule periods and keep incomplete chronological barriers visible.”

### Multi-Filter Wording

- “Account-local July days with more than six completed Day-trade lifecycles under the explicit rule.”

### Multi-Part Question Wording

- “Resolve the standard, report breaches and denominator, then compare P/L separately without causal claims.”

### Ambiguous Wording

- `Was I overtrading?` leaves saved rule, threshold/denominator, proxy, baseline,
  and user judgment open.

### Negative Examples

These examples must not map to this concept.

- `Count all order executions.` is factual execution counting only.
- `Tell me when to stop trading today.` is advice/protected behavior.
- `OT is a ticker.` requires ticker resolution.

### Context Requirements

- Same authorized account; explicit standard; event grain, denominator/window,
  threshold/operator, rule/proxy/baseline version/applicability, account IANA,
  chronology/barriers, samples, and coverage; no IDs/private rule text.

### Required Data

- Saved rule/version/applicability or exact threshold/denominator, locked proxy
  formula/version, or compatible baseline population/period; exact event counts,
  local dates, chronological coverage, exclusions, and missing state.

### Optional Data

- Downstream metric/basis, explicit user-authored judgment, filters/groupings,
  and privacy-safe evidence after standard resolution.

### Valid Filters

- Owner-compatible authorized filters applied after event identity/sequence and
  denominator are fixed; no filtering that changes rule applicability or barriers.

### Valid Groupings

- Authorized account-local day, period, ticker, session, or saved-rule groups
  compatible with exact event/denominator; no inferred motive group.

### Valid Operators

- Rule applicability/adherence, typed threshold with exact operator, count/rate,
  proxy formula, baseline comparison, and coverage; no universal threshold.

### Compatible Intents

- `evaluate_rule`, `calculate_metric`, `analyze_sequence`, `compare_groups`,
  `group_and_aggregate`, `detect_pattern`, `diagnose_performance`,
  `explain_result`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Missing denominator/event grain/rule version; executions/fills substituted
  for trades; inferred motive/discipline/revenge; universal threshold;
  cross-account rule, cause/advice/prediction, mutation, or missing as no breach.

### Default Interpretation

- None. No universal count, rate, denominator, period, threshold, rule, proxy,
  baseline, motive, or judgment is implied.

### Clarification Conditions

- Resolve saved rule versus threshold/denominator versus proxy versus baseline
  versus user judgment first. Then stage event grain, operator/window, version,
  population/time, samples, and coverage.

### Recommended Clarification Wording

- `Which definition should overtrading use: your saved rule, an explicit threshold and denominator, a locked factual proxy, a historical or personal baseline, or your own subjective judgment?`

### Unsupported Conditions

- Motive/emotion/discipline diagnosis, advice/prediction, cross-account/private
  rule access, raw IDs, and mutation are `Unsupported`. Missing rule/sequence
  facts are `Unavailable`; registry/runtime is `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state validator, Category 16 token/rule
  guard, locked rule/threshold/proxy/baseline validator, and sequence tool.

### Result Units

- Typed ambiguity state; resolved owners retain count, rate, threshold/breach,
  adherence, comparison difference, or explicit judgment state.

### Fee Handling

- Frequency/rule routing is normally fee-independent. P/L thresholds or
  downstream results retain exact gross/net, charges/credits, currency, and coverage.

### Open-Trade Handling

- Lifecycle-start counts may include a legitimate open lifecycle only if the
  selected owner defines it and chronology is complete. Ready-closed outcomes exclude it.

### Sample-Size Considerations

- Report numerator/denominator, eligible days/events, breaches, incomplete
  barriers, and baseline samples. One busy or losing day proves no motive.

## `good_trade_ambiguity` Language Registry

### Exact Definition

- C17-AMB-012 routes `good trade` among selected-basis factual outcome, exact
  rule/setup/plan/risk/process criterion, and authorized saved review label with
  covered association; it assigns no universal quality.

### Formal Wording

- “Specify whether good denotes outcome, an approved process criterion, or an authorized saved review label.”

### Normal Conversational Wording

- “Do you mean profitable, followed my plan, or tagged Good Trade?”
- “Was this trade good under my exact rule-adherence definition?”

### Trader Slang

- “Was this a clean trade?” requires an explicit process or saved-label definition.
- “That was a banger” may describe outcome, not quality or future edge.

### Abbreviations

- `GT`, `A+`, and `clean` require explicit expansion and Category 16 ticker/
  abbreviation/label-class collision checks.

### Common Misspellings

- `gud trade`, `goood setup`, and `profitablee` are fuzzy candidates only.

### Noisy or Incomplete Input

- `good? this one` needs trusted selection and outcome/process/label family.
- `A+ july` needs exact authorized label/class/version or criterion.

### Singular and Plural Forms

- `good trade`, `good trades`, `good setup`, and `good outcomes` retain entity,
  criterion, and population differences.

### Full Questions

- “Was the selected ready-closed trade profitable on fee-complete net basis?”
- “Which trades explicitly carry my exact active Good Trade review label?”

### Commands

- “Resolve outcome versus process criterion versus authorized label before evaluating.”

### Sentence Fragments

- `good by net outcome`
- `good by rule adherence`
- `saved Good Trade label`

### Follow-Up Wording

- “By good, I meant followed the exact saved rule.”
- “Use outcome, not my review label.”

### Correction Wording

- “No, a winner is not automatically a good-process trade.”

### Comparison Wording

- “Compare explicit good-label members with known nonmembers under a separate metric.”

### Ranking Wording

- “Rank authorized criteria groups by a declared metric; do not rank generic goodness.”

### Negated Wording

- “Use rule adherence, not profitable outcome, to define good.”

### Exclusion Wording

- “Exclude unknown label associations from both members and nonmembers.”

### Multi-Filter Wording

- “July NVDA ready-closed trades explicitly carrying my active Good Trade label.”

### Multi-Part Question Wording

- “Resolve good meaning, report criterion/label coverage, then calculate net P/L separately.”

### Ambiguous Wording

- `Was this a good trade?` leaves outcome, process/rule/setup/risk criterion, and
  authorized saved label open.

### Negative Examples

These examples must not map to this concept.

- `Am I a good trader?` is person judgment, not trade classification.
- `What is a good trade to take tomorrow?` is unsupported advice/prediction.
- `GOOD is a ticker.` requires ticker resolution.

### Context Requirements

- Same authorized account; trusted selected trade/population; explicit family;
  outcome basis or exact criterion/version/applicability/evidence or Category 16
  label/class/version/association; samples/coverage; no raw IDs/private text.

### Required Data

- Eligible ready-closed outcome and gross/net facts, or exact rule/setup/process/
  risk criterion facts, or authorized saved label definition/version and covered
  associations; owner capability, exclusions, and missing state.

### Optional Data

- Valid period/filters/groupings, privacy-safe evidence, and response preference
  after semantic and authorization gates pass.

### Valid Filters

- Selected-basis outcome, exact applicable process criterion, or explicit
  covered label membership; unknowns and inapplicable records remain separate.

### Valid Groupings

- Authorized outcome, criterion, or saved-label groups with exact definitions;
  no inferred quality, person, skill, or cross-account grouping.

### Valid Operators

- Outcome classification, criterion applicability/adherence, explicit label
  membership, count, compare, rank by separate metric, and coverage inspection.

### Compatible Intents

- `analyze_trade`, `evaluate_rule`, `evaluate_label`, `retrieve_records`,
  `calculate_metric`, `compare_groups`, `group_and_aggregate`,
  `explain_result`, and `inspect_data_quality` after resolution.

### Incompatible Combinations

- Winner implies good process; label inferred from result/chart/note; missing
  evidence as false; cross-account label; person/skill/motive/cause claims;
  advice, prediction, mutation, or raw-ID disclosure.

### Default Interpretation

- None. `Good` supplies no outcome basis, criterion, rule/setup/process/risk
  version, label class/association, quality score, cause, or advice.

### Clarification Conditions

- Resolve outcome versus rule/setup/process criterion versus authorized label
  first. Then stage selected basis or criterion/label version, applicability,
  population/time, fees/currency, evidence, samples, and coverage.

### Recommended Clarification Wording

- `Should good trade mean its outcome, an exact rule/setup/plan/risk or broader-process criterion, or an authorized saved review label?`

### Unsupported Conditions

- Person judgment, inferred motive/cause/skill/quality, advice/prediction,
  cross-account/private label access, raw IDs, and mutation are `Unsupported`.
  Missing evidence is `Unavailable`; registry/runtime remains `Planned`.

### Target Analytics Tool or Query Capability

- Planned ambiguity router, Category 15 state/entity validator, Category 16
  token/label guard, locked outcome/criterion/association validator, owner query.

### Result Units

- Typed ambiguity state; resolved owners retain outcome class/currency,
  adherence/applicability, process evidence, or label-association state.

### Fee Handling

- Outcome meaning requires explicit gross or fee-complete net. Net preserves
  allocated costs/credits and currency; process/label routes retain owner fee relevance.

### Open-Trade Handling

- Finalized outcome excludes open trades. Explicit current criterion or label
  association may be reported only if owner-supported; it proves no overall quality.

### Sample-Size Considerations

- Report eligible outcomes, criterion-applicable records, label members,
  nonmembers, unknowns, and missing evidence. Small samples prove no skill/edge.

## `bad_trade_ambiguity` Language Registry

### Exact Definition
- C17-AMB-013 routes `bad trade` among outcome, exact rule/setup/plan/risk/process criterion, explicit authorized mistake, and authorized saved review label; it proves no person trait, motive, cause, or advice.
### Formal Wording
- “Specify whether bad denotes outcome, a process/risk criterion, an explicit mistake, or an authorized review label.”
### Normal Conversational Wording
- “Do you mean a loser, a rule/process mistake, or my saved Bad Trade label?”
### Trader Slang
- “Was this a trash trade?” needs an exact outcome/criterion/label family; slang proves no quality.
### Abbreviations
- `BT`, `F`, and `D-` require explicit expansion and Category 16 ticker/label/class collision checks.
### Common Misspellings
- `baad trade`, `bad trad`, and `mistkae` are fuzzy candidates only.
### Noisy or Incomplete Input
- `bad? this one` needs trusted selection plus definition family; `bad july` also needs population/time.
### Singular and Plural Forms
- `bad trade`, `bad trades`, `mistake`, and `mistakes` retain entity, criterion, and association differences.
### Full Questions
- “Was the selected ready-closed trade a fee-complete net loser or explicitly marked with my authorized mistake?”
### Commands
- “Resolve outcome versus process/risk/mistake/label before evaluating.”
### Sentence Fragments
- `bad by net outcome`; `saved mistake`; `Bad Trade label`.
### Follow-Up Wording
- “By bad, I meant broke my exact saved rule, not losing outcome.”
### Correction Wording
- “No, a loser is not automatically a bad-process trade.”
### Comparison Wording
- “Compare explicit mistake members with known nonmembers under a separate metric.”
### Ranking Wording
- “Rank criterion groups by a declared metric; never rank generic badness.”
### Negated Wording
- “Use the explicit mistake fact, not outcome or inferred motive.”
### Exclusion Wording
- “Keep unknown mistake/label associations outside both members and nonmembers.”
### Multi-Filter Wording
- “July NVDA ready-closed trades explicitly carrying my active Bad Trade review label.”
### Multi-Part Question Wording
- “Resolve bad meaning, report evidence/coverage, then calculate net P/L separately.”
### Ambiguous Wording
- `Was this bad?` leaves outcome, rule/setup/plan/risk/process, mistake, and label families open.
### Negative Examples
- `Am I a bad trader?` is person judgment; `What trade should I avoid tomorrow?` is unsupported advice/prediction; `BAD` may be a ticker.
### Context Requirements
- Same authorized account; trusted entity/population; explicit family; outcome basis or criterion/mistake/label version, applicability, evidence, association, samples, and coverage; no IDs/private text.
### Required Data
- Eligible outcome/fees, or exact criterion/version, explicit authorized mistake provenance, or saved label/version/association; owner capability and missing state.
### Optional Data
- Valid filters/groups and privacy-safe evidence after semantic/authorization gates.
### Valid Filters
- Selected-basis outcome, applicable criterion/mistake, or explicit covered label membership; unknowns stay separate.
### Valid Groupings
- Authorized outcome, criterion, mistake, or label groups; no person/motive/cross-account group.
### Valid Operators
- Outcome classification, applicability/adherence, explicit association, count, compare, rank by separate metric, and coverage.
### Compatible Intents
- `analyze_trade`, `evaluate_rule`, `evaluate_label`, `retrieve_records`, `calculate_metric`, `compare_groups`, `explain_result`, and `inspect_data_quality` after resolution.
### Incompatible Combinations
- Loss implies mistake; inferred motive/cause/person quality; cross-account label; advice/prediction/mutation; raw IDs; missing evidence as false.
### Default Interpretation
- None. `Bad` supplies no outcome basis, criterion/version, mistake, label, quality score, motive, cause, or advice.
### Clarification Conditions
- Resolve outcome versus exact rule/setup/plan/risk/process criterion versus explicit mistake versus saved label first; stage basis/version/applicability/population/evidence/coverage.
### Recommended Clarification Wording
- `Should bad trade mean its outcome, an exact rule/setup/plan/risk or broader-process criterion, an explicit authorized mistake, or an authorized saved review label?`
### Unsupported Conditions
- Person/motive/cause claims, advice/prediction, cross-account/private access, IDs, and mutation are `Unsupported`; missing evidence is `Unavailable`; registry/runtime is `Planned`.
### Target Analytics Tool or Query Capability
- Planned ambiguity router, Category 15 state/entity validator, Category 16 collision guard, owner outcome/criterion/mistake/label validator.
### Result Units
- Typed ambiguity state; resolved owners retain outcome currency/class, adherence/applicability, mistake, or label-association state.
### Fee Handling
- Outcome requires explicit gross or fee-complete net; exact allocated costs/credits and currency remain owner-controlled.
### Open-Trade Handling
- Final outcome excludes open trades; owner-supported current criterion/mistake/label facts still prove no overall quality.
### Sample-Size Considerations
- Report eligible, applicable, member/nonmember, unknown, and missing counts; samples prove no person trait or cause.

## `normal_size_ambiguity` Language Registry

### Exact Definition
- C17-AMB-014 asks size measure first and unit second, then baseline family, while preserving locked Category 6 `size_relative_to_normal_size` as `Unavailable`; Category 11 bucket membership cannot activate it.
### Formal Wording
- “Resolve measure and unit before baseline; report relative-to-normal calculation unavailable under the current contract.”
### Normal Conversational Wording
- “Normal in shares or dollars, and compared with which baseline?”
### Trader Slang
- “Was I normal size or heavy?” supplies neither measure, unit, nor approved baseline.
### Abbreviations
- `NS`, `avg sz`, and `med qty` require expansion and Category 16 collision checks.
### Common Misspellings
- `nromal size`, `norml`, and `baseine` are fuzzy candidates only.
### Noisy or Incomplete Input
- `normal size?? july` needs measure then unit; no later answer can invent the unavailable relation formula.
### Singular and Plural Forms
- `normal size`, `normal sizes`, `size bucket`, and `baseline` retain calculation/membership distinctions.
### Full Questions
- “Is relative-to-normal size available for entry quantity against an approved recent baseline?”
### Commands
- “Resolve measure and unit, then report the locked relative-size capability as unavailable.”
### Sentence Fragments
- `normal shares`; `saved bucket membership only`; `relative formula unavailable`.
### Follow-Up Wording
- “Use maximum open quantity; now validate its unit before asking baseline.”
### Correction Wording
- “No, bucket membership does not mean relative-to-normal size.”
### Comparison Wording
- “Compare factual bucket membership only; do not calculate a normal-size ratio.”
### Ranking Wording
- “Rank factual sizes by their owner metric, not by unavailable relative normality.”
### Negated Wording
- “Use no default median, numerator, relation formula, or percentage unit.”
### Exclusion Wording
- “Exclude unknown bucket membership without inventing baseline nonmembership.”
### Multi-Filter Wording
- “July trades with known membership in my active authorized size bucket.”
### Multi-Part Question Wording
- “Resolve measure/unit, report bucket membership, then explain why relative normal size is unavailable.”
### Ambiguous Wording
- `Was this normal size?` lacks measure/unit/baseline and currently has no approved relative formula.
### Negative Examples
- `What size should I trade?` is advice; `NS` may be a ticker; account-equity percentage is not a normal-size default.
### Context Requirements
- Same account; explicit measure/unit; authorized baseline-family candidate and Category 16 state; current C6 unavailable contract; no IDs/private definitions.
### Required Data
- Future support needs baseline source/effective period/scope, numerator measure, relation formula/unit, denominator/zero behavior, minimum sample, exclusions/outliers, and coverage.
### Optional Data
- Current factual Category 11 bucket definition/version and membership, which never activates relative calculation.
### Valid Filters
- Exact factual size or covered bucket membership only; no relative-normal predicate under current capability.
### Valid Groupings
- Authorized factual size/bucket groups; no invented personal/recent/setup baseline.
### Valid Operators
- Measure/unit resolution, bucket membership, capability/coverage inspection; relative calculation remains unavailable.
### Compatible Intents
- `retrieve_records`, `calculate_metric`, `analyze_trade`, `evaluate_label`, `explain_result`, and `inspect_data_quality` with truthful unavailable handling.
### Incompatible Combinations
- Bucket becomes baseline; default numerator/formula/unit; zero-denominator invention; cross-account baseline; advice/mutation; unavailable as zero.
### Default Interpretation
- None. No universal normal, measure, unit, baseline, window, numerator, formula, denominator behavior, sample, or coverage.
### Clarification Conditions
- Ask measure first, unit second, then baseline family; do not keep clarifying as though missing fields can activate the unavailable calculation.
### Recommended Clarification Wording
- `Which size measure should define normal size?`
### Unsupported Conditions
- Advice, cross-account/private baseline access, invented formula, and mutation are `Unsupported`; relative calculation is `Unavailable`; registry/runtime is `Planned`.
### Target Analytics Tool or Query Capability
- Planned ambiguity router, Category 15 state validator, Category 16 bucket guard, C6 capability validator, and C11 membership reader.
### Result Units
- Typed ambiguity/unavailable state; bucket retains membership/unit only; no approved relative ratio or percentage unit.
### Fee Handling
- Normally fee-independent; downstream financial results retain owner gross/net/currency rules.
### Open-Trade Handling
- Factual open size/bucket membership may be owner-supported; relative normality remains unavailable for open and closed trades.
### Sample-Size Considerations
- Future contract must declare minimum sample and exclusions/outliers; one trade or bucket cannot define normal.

## `large_loss_ambiguity` Language Registry

### Exact Definition
- C17-AMB-015 resolves approved loss metric, signed/absolute representation, then threshold/baseline/bucket; threshold requires operator/endpoint/equality and bucket requires owner bounds/endpoints/gap-overlap.
### Formal Wording
- “Specify loss measure, magnitude representation, and exact predicate or bucket boundary contract.”
### Normal Conversational Wording
- “Does large mean net loss at least $500 or more than $500?”
### Trader Slang
- “Big red one” supplies neither gross/net basis nor magnitude threshold.
### Abbreviations
- `LL`, `-$500+`, and `2R+` require expansion and Category 16 collision checks.
### Common Misspellings
- `larg los`, `bigest loss`, and `treshold` are fuzzy candidates only.
### Noisy or Incomplete Input
- `large loss >? 500` needs metric, signed/absolute, currency, operator, endpoint/equality, population, and fees.
### Singular and Plural Forms
- `large loss`, `large losses`, `loss bucket`, and `loss threshold` retain predicate/bucket differences.
### Full Questions
- “Show fee-complete net losses with absolute magnitude greater than or equal to 500 USD.”
### Commands
- “Resolve metric and magnitude, then apply the explicit inclusive threshold.”
### Sentence Fragments
- `net absolute loss >= 500 USD`; `owner bucket, closed-open endpoints`.
### Follow-Up Wording
- “Use net dollars; include equality at exactly 500.”
### Correction Wording
- “No, use greater than, not greater than or equal to.”
### Comparison Wording
- “Compare explicit large-loss members under identical threshold semantics.”
### Ranking Wording
- “Rank by declared loss metric after threshold meaning; do not replace predicate with worst ranking.”
### Negated Wording
- “Use absolute magnitude, not signed value, and exclude equality.”
### Exclusion Wording
- “Keep unknown fee/currency/threshold states outside members and nonmembers.”
### Multi-Filter Wording
- “July ready-closed net losses with absolute magnitude >= 500 USD and fee-complete coverage.”
### Multi-Part Question Wording
- “Resolve metric/operator/bounds, report membership/unknowns, then summarize coverage.”
### Ambiguous Wording
- `Show large losses.` lacks metric, magnitude, unit, threshold/baseline/bucket, endpoints, equality, fees, and population.
### Negative Examples
- `What loss limit should I use?` is advice; `LL` may be a ticker; open drawdown is not realized large loss.
### Context Requirements
- Same account; explicit metric/basis/sign/unit/currency; operator/endpoint/equality or owner bucket/baseline; population/time/fees/sample/coverage.
### Required Data
- Eligible loss facts, fee completeness, currency, typed comparator and equality, or versioned bucket bounds/endpoints/gap-overlap, or compatible baseline contract.
### Optional Data
- Valid filters/groups and privacy-safe evidence after predicate ownership resolves.
### Valid Filters
- Exact typed threshold, owner bucket membership, or versioned baseline relation; unknowns stay separate.
### Valid Groupings
- Authorized compatible loss buckets/dimensions; no hidden overlap/gap policy.
### Valid Operators
- Signed/absolute transform, `>`/`>=` or other explicit comparator, equality, bounded membership, compare/rank, coverage.
### Compatible Intents
- `retrieve_records`, `calculate_metric`, `compare_groups`, `group_and_aggregate`, `rank_results`, `diagnose_performance`, `explain_result`, and `inspect_data_quality` after resolution.
### Incompatible Combinations
- `>`/`>=` default; unknown endpoints/equality/gaps; gross/net fallback; open/realized mix; cause/advice/prediction/mutation.
### Default Interpretation
- None. No metric, sign/absolute rule, unit, threshold, comparator, equality, bucket, baseline, fee, or population default.
### Clarification Conditions
- Ask loss measure first, signed/absolute second, threshold/baseline/bucket third; then stage operator/bounds, population/time, fees/currency, sample, coverage.
### Recommended Clarification Wording
- `Which loss measure should define large: gross or net dollars, R-multiple, or another approved basis?`
### Unsupported Conditions
- Advice/prediction, invented boundaries/fees, cross-account/private access, cause, and mutation are `Unsupported`; missing facts are `Unavailable`; registry/runtime `Planned`.
### Target Analytics Tool or Query Capability
- Planned ambiguity router, owner loss validator, Category 12 predicate/bucket validator, fee/currency/coverage validator.
### Result Units
- Typed ambiguity state; owner currency/R/percentage plus explicit magnitude, comparator/equality, bucket/baseline metadata.
### Fee Handling
- Gross and fee-complete net remain distinct; net uses exact allocated costs/credits; incomplete fees are partial/unavailable.
### Open-Trade Handling
- Realized classification uses ready-closed records; open adverse value needs separate as-of valuation owner.
### Sample-Size Considerations
- Report eligible members/nonmembers/unknowns, fee/currency completeness, bucket overlap/gaps, and baseline sample limits.

## `performance_ambiguity` Language Registry

### Exact Definition
- C17-AMB-016 routes `performance` to one locked metric or approved versioned metric set with explicit components; it never synthesizes a global score.
### Formal Wording
- “Specify the locked metric or approved metric set and its basis, population, period, units, samples, and coverage.”
### Normal Conversational Wording
- “By performance, do you mean net P/L, expectancy, or the approved metric set?”
### Trader Slang
- “How am I doing?” still needs an exact metric/set and period.
### Abbreviations
- `perf`, `KPIs`, and `score` require expansion/collision checks; `score` cannot invent a set.
### Common Misspellings
- `performnce`, `perfromance`, and `metrc set` are fuzzy candidates only.
### Noisy or Incomplete Input
- `performance july?` lacks metric/set, basis, population, fees/units, sample, and coverage.
### Singular and Plural Forms
- `performance`, `performances`, `metric`, and `metrics` retain single/set differences.
### Full Questions
- “Summarize the approved metric set for eligible July trades with component coverage.”
### Commands
- “Use fee-complete net expectancy only; do not create a global score.”
### Sentence Fragments
- `performance = expectancy`; `approved set version`; `component coverage`.
### Follow-Up Wording
- “By performance, I meant expectancy.”
### Correction Wording
- “No, use the approved set, not P/L alone.”
### Comparison Wording
- “Compare the same locked metric/set across compatible sides.”
### Ranking Wording
- “Rank only by a declared metric or approved score direction, N, and ties.”
### Negated Wording
- “Do not average incompatible units or hide missing components.”
### Exclusion Wording
- “Exclude ineligible records per component and report exclusions separately.”
### Multi-Filter Wording
- “Approved July long-NVDA performance set over eligible ready-closed trades.”
### Multi-Part Question Wording
- “Resolve metric/set, report components, samples, fees, units, and coverage.”
### Ambiguous Wording
- `How was performance?` could mean P/L, win rate, expectancy, drawdown, frequency, process, or approved set.
### Negative Examples
- `Will performance improve tomorrow?` is prediction; `PERF` may be a ticker; response detail is Category 18.
### Context Requirements
- Same account; exact metric/set/version/components/directions/weights; basis/population/period/units/fees/samples/open handling/coverage.
### Required Data
- Locked owner facts or approved set contract, eligible populations, component availability, currency/fees, samples, exclusions, coverage.
### Optional Data
- Valid filters/groups/comparison and response preference after metric resolution.
### Valid Filters
- Owner-compatible authorized filters with per-component eligibility/coverage.
### Valid Groupings
- Authorized compatible groups; no inferred quality/skill group.
### Valid Operators
- Calculate/summarize/compare/rank under selected owner; set aggregation only by approved version.
### Compatible Intents
- `summarize_performance`, `calculate_metric`, `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`, `diagnose_performance`, `explain_result`, and `inspect_data_quality` after resolution.
### Incompatible Combinations
- Hidden metric/set/weight; incompatible-unit average; silent missing component; cause/skill/advice/prediction/mutation; cross-account data.
### Default Interpretation
- None. No P/L, score, metric set, basis, population, period, unit, fee, sample, or coverage default.
### Clarification Conditions
- Ask metric or approved set first; stage basis, population, period, units/fees, sample, open handling, coverage.
### Recommended Clarification Wording
- `Which metric or approved metric set should represent performance?`
### Unsupported Conditions
- Prediction/advice/global-score invention/cross-account access/cause/mutation are `Unsupported`; missing components `Unavailable`; registry/runtime `Planned`.
### Target Analytics Tool or Query Capability
- Planned ambiguity router, Category 15 validator, locked metric/set registry, capability/coverage validator.
### Result Units
- Typed ambiguity state; single metric keeps its unit; set keeps separate units or explicit approved score unit only.
### Fee Handling
- Each P/L component declares gross or fee-complete net; no silent mixing/imputation.
### Open-Trade Handling
- Component-specific; ready-closed metrics exclude open, and unsupported open components remain visible/unavailable.
### Sample-Size Considerations
- Report per-component samples/exclusions/missingness; no hidden adequacy or favorable metric selection.

## `consistency_ambiguity` Language Registry

### Exact Definition
- C17-AMB-017 requires an approved versioned dispersion/adherence formula, representation, declared direction, population, sample/outlier, time, basis, fees/currency, and coverage; none defaults.
### Formal Wording
- “Specify the approved consistency formula/version, representation, direction, and sample contract.”
### Normal Conversational Wording
- “Consistent by P/L dispersion or by rule adherence?”
### Trader Slang
- “Was I steady?” supplies no formula, representation, or direction.
### Abbreviations
- `SD`, `CV`, and `cons` require expansion/collision checks and cannot select a formula.
### Common Misspellings
- `consistant`, `consistncy`, and `varaince` are fuzzy candidates only.
### Noisy or Incomplete Input
- `consistent july?` lacks formula/version/representation/direction/population/sample/outliers/basis/coverage.
### Singular and Plural Forms
- `consistency`, `consistent trade`, `consistent groups`, and `adherence consistency` retain formula/grain differences.
### Full Questions
- “Compare groups using the approved P/L-dispersion formula/version and declared direction.”
### Commands
- “Resolve the consistency measure before calculating or ranking.”
### Sentence Fragments
- `approved dispersion`; `binary adherence`; `direction required`.
### Follow-Up Wording
- “By consistency, I meant rule-adherence rate.”
### Correction Wording
- “No, use the approved variance representation, not win rate.”
### Comparison Wording
- “Compare compatible sides under the same formula/version/representation/direction.”
### Ranking Wording
- “Rank by the approved consistency direction with N, ties, samples, and coverage.”
### Negated Wording
- “Do not assume lower variance always means more consistent.”
### Exclusion Wording
- “Apply the approved outlier exclusions and report removed/missing records.”
### Multi-Filter Wording
- “July long NVDA consistency under the approved fee-complete net-P/L dispersion formula.”
### Multi-Part Question Wording
- “Resolve formula, report representation/direction/sample/outliers/fees/currency/coverage, then compare.”
### Ambiguous Wording
- `Was I consistent?` could mean dispersion, adherence, outcome frequency, size/time/process stability, or reliability.
### Negative Examples
- `Will I stay consistent tomorrow?` is prediction; `CONS` may be a ticker; discipline judgment is not a formula.
### Context Requirements
- Same account; approved formula/version/representation/direction; population/grain/sample/outliers/time/basis/fees/currency/open handling/coverage.
### Required Data
- Owner formula inputs, compatible representation, eligible population, sample and exclusions, exact period, fee/currency completeness, coverage.
### Optional Data
- Valid groups/filters and privacy-safe evidence after formula resolution.
### Valid Filters
- Owner-compatible filters preserving representation, sample, exclusions/outliers, and missing coverage.
### Valid Groupings
- Authorized compatible groups; no inferred quality/discipline/skill group.
### Valid Operators
- Approved dispersion/adherence calculation, compare, rank under declared direction, and coverage inspection.
### Compatible Intents
- `calculate_metric`, `summarize_performance`, `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`, `evaluate_rule`, `explain_result`, and `inspect_data_quality` after resolution.
### Incompatible Combinations
- Hidden formula/version/representation/direction/sample/outlier rule; incompatible currency/basis; discipline/cause/advice/prediction/mutation; missing as zero.
### Default Interpretation
- None. No standard deviation/variance/adherence formula, representation, lower/higher direction, sample, outlier, period, basis, fee, or currency default.
### Clarification Conditions
- Ask approved measure first; stage formula/version, representation/direction, population/sample/outliers, period, basis/fees/currency, coverage.
### Recommended Clarification Wording
- `Which approved consistency measure should I use?`
### Unsupported Conditions
- Prediction, discipline/skill/cause claims, cross-account access, invented formula, and mutation are `Unsupported`; missing facts `Unavailable`; registry/runtime `Planned`.
### Target Analytics Tool or Query Capability
- Planned ambiguity router, formula registry/version validator, Category 15 state validator, capability/sample/coverage validator.
### Result Units
- Typed ambiguity state; resolved owner retains declared dispersion/adherence representation, unit, scale, and direction.
### Fee Handling
- P/L representation requires explicit gross or fee-complete net and compatible currency; nonfinancial owners keep their fee rule.
### Open-Trade Handling
- Ready-closed dispersion excludes open; owner-supported time/size/process/adherence may include open only with complete comparable facts.
### Sample-Size Considerations
- Apply approved minimum sample and exclusions/outliers; report eligible/missing counts; no sample proves skill or future stability.

---

# 7. Evaluation Cases Deliverable

All six evaluation batches independently PASSed all 374 `Planned` cases for
`C17-E1` through `C17-E17`. All 17 of 17 arrays contain all 22 standard case
types in the required order and exact ordered schema; 374 of 374 required cases
passed, with zero failed, unreviewed, or pending cases. No evaluation batch,
canonical name, or category remains awaiting review: the lead controller
approved and locked all seventeen canonical names and all seventeen language
registries at Version 1, Category 17 is Complete, and no runtime capability is
claimed.

## 7.1 Evaluation Case Schema

Use the exact shared schema in
`docs/migration/category_completion_template_example.md`. Do not omit fields.

## 7.2 Required Case Types

All 22 shared case types are required, including ambiguity, negative,
unsupported-data, selected-entity, and cross-category cases.

## Evaluation Array C17-E1 -- best_ambiguity

~~~json
[
  {"caseId":"C17-E1-01","caseType":"canonical","input":"Rank the best three authorized ready-closed trades by fee-complete net P/L in validated July, descending, with exact-value ties retained under the approved privacy-safe tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve best to the explicit net_pnl ranking owner","sort descending on exact unrounded net_pnl","return positive integer N equals 3 with approved privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency partition","eligible ready_closed population","positive integer N equals 3","approved deterministic privacy-safe tie policy","eligible excluded missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Every ranking field is explicit; the ambiguity router selects the locked owner without calculating or claiming runtime support."},
  {"caseId":"C17-E1-02","caseType":"formal_paraphrase","input":"Identify the best five authorized setup groups in the validated quarter under my approved Execution Discipline Score version 2, defined exactly as 100 times covered followed rule evaluations divided by covered applicable rule evaluations, in score points from 0 to 100; higher is best, fees and currency are not applicable to this nonfinancial score, exact-value ties use the approved deterministic privacy-safe tie policy with each sample and coverage shown, and any group with zero covered applicable rule evaluations has an Unavailable score that stays out of the resolved ranking values and remains visible in missing and unavailable coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","rule_followed"],"expectedFilters":["authorized applicable rule evaluations with covered rule_followed state"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["resolve best to approved Execution Discipline Score version 2","calculate exactly 100 times covered followed rule evaluations divided by covered applicable rule evaluations only when the covered applicable denominator is positive","mark a group with zero covered applicable rule evaluations Unavailable without dividing assigning zero or inferring a score","exclude Unavailable groups from resolved ranking values while exposing them in missing and unavailable coverage","rank exact available score points descending because higher is best","return positive integer N equals 5 with approved exact-value ties"],"expectedComparison":null,"expectedTimeRange":"validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","approved Execution Discipline Score identity","exact formula version 2 is 100 times covered followed rule evaluations divided by covered applicable rule evaluations","score-point unit on a 0-to-100 basis","zero covered applicable denominator makes that group's score Unavailable and never zero divided or inferred","Unavailable groups remain outside resolved ranking values and visible in missing and unavailable coverage","fees and currency are explicitly not applicable to the nonfinancial score","compatible authorized setup-group populations in the validated quarter","declared higher-is-best direction","finite positive integer N equals 5","approved deterministic privacy-safe exact-value tie policy","per-group numerator denominator sample missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The approved score identity, exact versioned formula, direction, units, basis, fee and currency rule, population, period, finite N, ties, sample, coverage, and zero-denominator Unavailable boundary are explicit; no hidden score, default, division, or subjective quality inference is used."},
  {"caseId":"C17-E1-03","caseType":"conversational_paraphrase","input":"What were my best two authorized ready-closed trades by gross P/L last week, highest first, keeping exact ties under the approved privacy-safe rule?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":[],"expectedOperators":["resolve best to explicit gross_pnl","sort descending on exact unrounded gross_pnl","return positive integer N equals 2 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact and compatible currency partition","eligible ready_closed population","declared higher-is-better direction","positive integer N equals 2","approved deterministic privacy-safe tie policy","eligible excluded missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational best is safe only because metric, direction, population, N, ties, period, basis, and coverage are complete."},
  {"caseId":"C17-E1-04","caseType":"trader_slang","input":"Show my top four authorized runners by fee-complete net P/L in validated August, biggest exact result first, with the approved privacy-safe tie treatment.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","net_pnl"],"expectedFilters":["authorized eligible ready_closed runner trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve top runner wording to explicit best ranking","sort exact net_pnl descending","return positive integer N equals 4 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated August temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","runner population explicitly authorized and typed","locked fee-complete net_pnl formula","compatible currency partition","positive integer N equals 4","approved deterministic privacy-safe tie policy","population and fee coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang supplies no causal claim or trade recommendation."},
  {"caseId":"C17-E1-05","caseType":"abbreviation","input":"Does BST mean a ticker, an abbreviation, a saved label, or best-ranking wording here?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["best_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve all authorized token-class candidates","ask for token class before any ranking route or data access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 ticker abbreviation and label-class collision check","accepted query revision remains unchanged","privacy-safe pending marker stores no raw identifier or private candidate text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does BST mean a ticker, an abbreviation, a saved label, or best-ranking wording here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A short token never silently establishes best, a ticker, or a private label."},
  {"caseId":"C17-E1-06","caseType":"misspelling","input":"Show my besst trades for the validated month.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["best_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate best as a fuzzy candidate only","clarify the fuzzy candidate before asking for metric or population"],"expectedComparison":null,"expectedTimeRange":"validated requested month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 locale-aware fuzzy candidate generation","ticker and saved-label collision check","accepted query revision remains unchanged","privacy-safe pending marker without raw IDs or private text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean best as ranking wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Even a likely misspelling cannot auto-route; later metric, population, N, tie, basis, and coverage fields remain staged."},
  {"caseId":"C17-E1-07","caseType":"noisy_input","input":"july best 3 closed net pnl desc exact ties approved coverage pls","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve noisy best wording to explicit net_pnl ranking","sort exact net_pnl descending","return positive integer N equals 3 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","validated phrase net pnl means locked fee-complete net_pnl in this input","locked net_pnl formula and compatible currency","eligible ready_closed population","positive integer N equals 3","approved privacy-safe tie policy","complete fee and population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Harmless noise changes no metric, direction, basis, N, tie, population, or coverage contract."},
  {"caseId":"C17-E1-08","caseType":"command","input":"Rank the best six authorized ticker groups by locked expectancy this year, higher is better, using exact values, approved privacy-safe ties, and complete per-group coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy"],"expectedGroupings":["authorized exact ticker groups"],"expectedOperators":["resolve best to locked expectancy","rank exact expectancy descending","return positive integer N equals 6 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula and version","declared higher-is-better direction","compatible per-group eligible populations","positive integer N equals 6","approved deterministic privacy-safe tie policy","per-group sample missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A command is read-only and authorizes no protected action or mutation."},
  {"caseId":"C17-E1-09","caseType":"fragment","input":"best 5 setups; expectancy v1; higher first; validated Q2; exact ties; approved covered groups","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy v1"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["resolve fragment to expectancy v1 ranking","rank descending on exact expectancy","return positive integer N equals 5 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula version 1","declared higher-is-better direction","compatible covered setup-group populations","positive integer N equals 5","approved deterministic privacy-safe tie policy","per-group denominator and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete because every material ranking owner field is explicit and trusted."},
  {"caseId":"C17-E1-10","caseType":"follow_up","input":"For that trusted accepted July ready-closed net P/L ranking, keep its descending direction, top three limit, approved exact-tie policy, currency basis, and coverage; show the best again.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","net_pnl"],"expectedFilters":["retained authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted ranking fields","revalidate authorization formula version and coverage","rank exact net_pnl descending with retained N and ties"],"expectedComparison":null,"expectedTimeRange":"retained validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained locked net_pnl formula version and compatible currency","retained ready_closed population and descending direction","retained positive integer N equals 3","retained approved privacy-safe tie policy","current fee and population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Nearby prose or recency alone cannot supply these fields; trusted typed accepted state can after revalidation."},
  {"caseId":"C17-E1-11","caseType":"correction","input":"For the same validated July ready-closed population, I meant best by gross P/L descending, top four with approved exact ties and complete compatible-currency coverage, not net P/L.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":[],"expectedOperators":["validate replacement of net_pnl with gross_pnl only","rank exact gross_pnl descending","use positive integer N equals 4 and approved ties"],"expectedComparison":null,"expectedTimeRange":"retained validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","trusted accepted query revision","locked gross_pnl fact and compatible currency","retained eligible ready_closed population","declared descending direction","positive integer N equals 4","approved deterministic privacy-safe tie policy","gross coverage complete","prior accepted metric remains unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A validated correction creates the next accepted revision atomically; it does not rewrite Journal facts."},
  {"caseId":"C17-E1-12","caseType":"comparison","input":"Within each of the two authorized months, identify the best two ready-closed trades by fee-complete net P/L descending, retain approved exact ties, then compare the two ranked result sets with side-specific coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["rank_results","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["authorized month A population","authorized month B population"],"expectedOperators":["rank each side by exact net_pnl descending","return positive integer N equals 2 per side with approved ties","compare only compatible ranked side populations"],"expectedComparison":"best two fee-complete net_pnl trades in authorized month A versus authorized month B","expectedTimeRange":"two validated nonoverlapping monthly temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit compatible comparison sides","locked net_pnl formula and compatible currency","same eligible ready_closed population contract per side","declared descending direction","positive integer N equals 2 per side","approved privacy-safe tie policy","side-specific fee sample and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The comparison proves neither cause nor future advantage."},
  {"caseId":"C17-E1-13","caseType":"ranking","input":"Order the best seven authorized weekday groups by locked expectancy for the validated year, higher first, with exact values, approved privacy-safe ties, and complete group coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy"],"expectedGroupings":["authorized weekday groups"],"expectedOperators":["resolve best to locked expectancy","rank exact expectancy descending","return positive integer N equals 7 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula and version","declared higher-is-better direction","compatible weekday group populations","positive integer N equals 7","approved deterministic privacy-safe tie policy","per-group eligible missing unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Best remains a ranking composition, not an independent quality score."},
  {"caseId":"C17-E1-14","caseType":"negation","input":"For validated Q1, rank the best three authorized setup groups by fee-complete net P/L descending with approved exact ties, and do not use win rate or any hidden score.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["exclude win-rate and hidden-score candidates","rank exact net_pnl descending","return positive integer N equals 3 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated Q1 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked net_pnl formula","fee-complete compatible currency partition","compatible setup-group populations","declared descending direction","positive integer N equals 3","approved privacy-safe tie policy","per-group coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation removes named candidates but cannot create an unspoken score."},
  {"caseId":"C17-E1-15","caseType":"exclusion","input":"Find the best five authorized ticker groups by gross P/L descending in validated June, excluding only known ineligible rows, preserving unknown coverage, and applying the approved exact-tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","gross_pnl"],"expectedFilters":["authorized eligible ready_closed rows with known gross_pnl","exclude only validated ineligible rows"],"expectedGroupings":["authorized exact ticker groups"],"expectedOperators":["rank exact gross_pnl descending","return positive integer N equals 5 with approved ties","keep missing and unavailable populations outside the complement"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact and compatible currency","declared eligible ready_closed population","positive integer N equals 5","approved deterministic privacy-safe tie policy","explicit excluded missing and unavailable counts","no unknown-as-zero substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes only the read population and never deletes or reclassifies facts."},
  {"caseId":"C17-E1-16","caseType":"multi_filter","input":"Rank the best four authorized long NVDA ready-closed trades outside premarket by fee-complete net P/L descending in validated July, with approved exact ties and complete currency coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","net_pnl"],"expectedFilters":["authorized exact NVDA ticker","long side","outside validated premarket session","eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["apply all authorized owner-compatible filters","rank exact net_pnl descending","return positive integer N equals 4 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact ticker resolution","locked session timezone contract","locked net_pnl formula","fee-complete compatible currency partition","declared descending direction","positive integer N equals 4","approved privacy-safe tie policy","filtered population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple filters cannot alter candidate identity or hide missing coverage."},
  {"caseId":"C17-E1-17","caseType":"multi_part","input":"Rank the best three authorized setups by expectancy v1 in validated Q2, higher first with approved exact ties; also show each denominator and coverage, then explain the locked formula without judging quality.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["best_ambiguity","best","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy v1"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["rank exact expectancy v1 descending","return positive integer N equals 3 with approved ties","report per-group denominator and coverage","explain the locked formula"],"expectedComparison":null,"expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula version 1","declared higher-is-better direction","compatible setup-group populations","positive integer N equals 3","approved deterministic privacy-safe tie policy","per-group sample missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The multi-part read remains factual and supplies no cause, advice, prediction, or mutation."},
  {"caseId":"C17-E1-18","caseType":"ambiguous","input":"Show my best trades.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["best_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve metric score and subjective-quality candidates","ask only the highest-impact unresolved field","create or replace only a privacy-safe pending ambiguity marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted query revision remains unchanged","pending marker records expected answer type without supplying a query value","no raw account trade label or conversation identifiers","later population period N tie basis and coverage questions remain staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which metric or approved score should define best?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No hidden P/L, win-rate, score, closed-trade, direction, population, N, tie, or quality default is allowed."},
  {"caseId":"C17-E1-19","caseType":"negative_example","input":"Explain the locked Category 14 definition of the best ranking operator without ranking any records.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["best"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["explain the locked ranking composition only","perform no ambiguity routing or record access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized product documentation","locked Category 14 registry version","no private data raw IDs ranking execution or quality judgment"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This explicit concept-explanation request must not map to best_ambiguity."},
  {"caseId":"C17-E1-20","caseType":"unsupported_data","input":"Use another account's private trades and saved labels to rank its best stock, reveal the source identifiers, and recommend what I should buy tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["best_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account access","reject private label text and raw identifier disclosure","reject investment advice and prediction","return Unsupported without candidate enumeration or data access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account boundary","minimum necessary privacy-safe refusal","no raw account trade source label or conversation identifiers","no private candidate text","accepted query state unchanged","Planned ambiguity registry does not imply runtime support"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private-data access, raw identifier disclosure, investment advice, and future prediction are unsupported.","notes":"Unsupported is a terminal policy state, not a clarification, missing-data state, protected action, or permission to reveal whether private candidates exist."},
  {"caseId":"C17-E1-21","caseType":"selected_entity_context","input":"Rank the trusted selected ready-closed trade's authorized setup group among all covered setup groups by expectancy v1 this quarter, higher first, top three with approved exact ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["analyze_trade","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["best_ambiguity","best","expectancy"],"expectedFilters":["authorized setup groups containing eligible ready_closed trades"],"expectedGroupings":["authorized setup groups including the selected trade's validated group"],"expectedOperators":["revalidate selected trade and its setup association server-side","rank exact expectancy v1 descending","return positive integer N equals 3 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance lifecycle and setup association","locked expectancy formula version 1","compatible covered group populations","declared higher-is-better direction","positive integer N equals 3","approved privacy-safe tie policy","per-group denominator and coverage","no raw trade label account or source IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context supplies identity only after revalidation; it never supplies missing metric, population, N, tie, or coverage facts."},
  {"caseId":"C17-E1-22","caseType":"cross_category","input":"Rank the best five authorized weekday groups by fee-complete net P/L in validated Q3, descending with approved exact ties, then report each group's sample and coverage without causal or future-edge claims.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["best_ambiguity","best","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["authorized weekday groups"],"expectedOperators":["route ambiguity through Category 17","calculate locked net_pnl through Category 2","group through Category 11","rank through Category 14","report evidence and limitations"],"expectedComparison":null,"expectedTimeRange":"validated Q3 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked net_pnl formula and compatible currency","compatible weekday populations","declared descending direction","positive integer N equals 5","approved deterministic privacy-safe tie policy","per-group eligible excluded missing and unavailable counts","no cause advice prediction or mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition retains every locked owner's contract and no component claims implemented Chat runtime."}
]
~~~

## Evaluation Array C17-E2 -- worst_ambiguity

~~~json
[
  {"caseId":"C17-E2-01","caseType":"canonical","input":"Rank the worst three authorized ready-closed trades by fee-complete net P/L in validated July, ascending on exact signed values, with approved privacy-safe ties and complete coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve worst to explicit signed net_pnl ranking","sort ascending on exact unrounded signed net_pnl","return positive integer N equals 3 with approved privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency partition","eligible ready_closed population","declared lower-is-worse signed-value direction","positive integer N equals 3","approved deterministic privacy-safe tie policy","eligible excluded missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Signed net P/L is explicit; no absolute-loss or subjective-quality default is used."},
  {"caseId":"C17-E2-02","caseType":"formal_paraphrase","input":"Identify the worst four authorized setup groups in the validated quarter under my approved Execution Discipline Score version 2, defined exactly as 100 times covered followed rule evaluations divided by covered applicable rule evaluations, in score points from 0 to 100; lower is worst, fees and currency are not applicable to this nonfinancial score, exact-value ties use the approved deterministic privacy-safe tie policy with each sample and coverage shown, and any group with zero covered applicable rule evaluations has an Unavailable score that stays out of the resolved ranking values and remains visible in missing and unavailable coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","rule_followed"],"expectedFilters":["authorized applicable rule evaluations with covered rule_followed state"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["resolve worst to approved Execution Discipline Score version 2","calculate exactly 100 times covered followed rule evaluations divided by covered applicable rule evaluations only when the covered applicable denominator is positive","mark a group with zero covered applicable rule evaluations Unavailable without dividing assigning zero or inferring a score","exclude Unavailable groups from resolved ranking values while exposing them in missing and unavailable coverage","rank exact available score points ascending because lower is worst","return positive integer N equals 4 with approved exact-value ties"],"expectedComparison":null,"expectedTimeRange":"validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","approved Execution Discipline Score identity","exact formula version 2 is 100 times covered followed rule evaluations divided by covered applicable rule evaluations","score-point unit on a 0-to-100 basis","zero covered applicable denominator makes that group's score Unavailable and never zero divided or inferred","Unavailable groups remain outside resolved ranking values and visible in missing and unavailable coverage","fees and currency are explicitly not applicable to the nonfinancial score","compatible authorized setup-group populations in the validated quarter","declared lower-is-worst direction","finite positive integer N equals 4","approved deterministic privacy-safe exact-value tie policy","per-group numerator denominator sample missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The approved score identity, exact versioned formula, direction, units, basis, fee and currency rule, population, period, finite N, ties, sample, coverage, and zero-denominator Unavailable boundary are explicit; no hidden score, default, division, loss basis, or subjective quality inference is used."},
  {"caseId":"C17-E2-03","caseType":"conversational_paraphrase","input":"What were my worst two authorized ready-closed trades by absolute fee-complete net loss last week, largest loss magnitude first, keeping approved exact ties?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with negative fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve worst to explicit absolute negative net_pnl magnitude","sort descending on exact absolute loss magnitude","return positive integer N equals 2 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked fee-complete net_pnl formula","compatible currency partition","eligible ready_closed negative-result population","declared absolute-loss basis and largest-magnitude-is-worse direction","positive integer N equals 2","approved deterministic privacy-safe tie policy","eligible excluded missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Absolute magnitude is explicit and is not silently substituted for signed ranking."},
  {"caseId":"C17-E2-04","caseType":"trader_slang","input":"Show my bottom four authorized bags by signed gross P/L in validated August, lowest exact result first, with the approved privacy-safe tie treatment and full coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","gross_pnl"],"expectedFilters":["authorized eligible ready_closed bag trades with known gross_pnl"],"expectedGroupings":[],"expectedOperators":["resolve bottom bag wording to explicit signed gross_pnl ranking","sort exact signed gross_pnl ascending","return positive integer N equals 4 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated August temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","bag population explicitly authorized and typed","locked gross_pnl fact and compatible currency","declared signed lower-is-worse direction","positive integer N equals 4","approved deterministic privacy-safe tie policy","population and metric coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang does not prove poor quality, motive, or what should be traded next."},
  {"caseId":"C17-E2-05","caseType":"abbreviation","input":"Does WST mean a ticker, an abbreviation, a saved label, or worst-ranking wording in this request?","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["worst_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve all authorized token-class candidates","ask for token class before any ranking route or data access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 ticker abbreviation and label-class collision check","accepted query revision remains unchanged","privacy-safe pending marker stores no raw identifier or private candidate text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does WST mean a ticker, an abbreviation, a saved label, or worst-ranking wording here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Short-token shape never selects a ranking, ticker, abbreviation, or private label."},
  {"caseId":"C17-E2-06","caseType":"misspelling","input":"Show my wrost trades for the validated quarter.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["worst_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate worst as a fuzzy candidate only","clarify the fuzzy candidate before metric or score selection"],"expectedComparison":null,"expectedTimeRange":"validated requested quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 locale-aware fuzzy candidate generation","ticker and saved-label collision check","accepted query revision remains unchanged","privacy-safe pending marker without raw IDs or private text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean worst as ranking wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fuzzy candidate cannot auto-route; metric or score, direction, sign basis, population, N, ties, and coverage remain staged."},
  {"caseId":"C17-E2-07","caseType":"noisy_input","input":"june worst 3 closed net pnl signed low first exact ties approved coverage pls","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve noisy worst wording to signed net_pnl ranking","sort exact signed net_pnl ascending","return positive integer N equals 3 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","validated phrase net pnl means locked fee-complete net_pnl in this input","locked net_pnl formula and compatible currency","eligible ready_closed population","declared signed lower-is-worse direction","positive integer N equals 3","approved privacy-safe tie policy","complete fee and population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not change signed values into absolute magnitude or a quality label."},
  {"caseId":"C17-E2-08","caseType":"command","input":"Rank the worst six authorized ticker groups by locked expectancy this year, lower is worse, using exact values, approved privacy-safe ties, and complete per-group coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy"],"expectedGroupings":["authorized exact ticker groups"],"expectedOperators":["resolve worst to locked expectancy","rank exact expectancy ascending","return positive integer N equals 6 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula and version","declared lower-is-worse direction","compatible per-group eligible populations","positive integer N equals 6","approved deterministic privacy-safe tie policy","per-group sample missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command is read-only and does not authorize a mutation or judgment about the trader."},
  {"caseId":"C17-E2-09","caseType":"fragment","input":"worst 5 setups; expectancy v1; lower first; validated Q1; exact ties; approved covered groups","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy v1"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["resolve fragment to expectancy v1 ranking","rank exact expectancy ascending","return positive integer N equals 5 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated Q1 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula version 1","declared lower-is-worse direction","compatible covered setup-group populations","positive integer N equals 5","approved deterministic privacy-safe tie policy","per-group denominator and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete because every material owner field is explicit and trusted."},
  {"caseId":"C17-E2-10","caseType":"follow_up","input":"For that trusted accepted August ready-closed signed net P/L ranking, keep its ascending direction, bottom three limit, approved exact-tie policy, currency basis, and coverage; show the worst again.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","net_pnl"],"expectedFilters":["retained authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted ranking fields","revalidate authorization formula version and coverage","rank exact signed net_pnl ascending with retained N and ties"],"expectedComparison":null,"expectedTimeRange":"retained validated August temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained locked net_pnl formula version and compatible currency","retained ready_closed population and signed ascending direction","retained positive integer N equals 3","retained approved privacy-safe tie policy","current fee and population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Typed accepted state may be reused only after current account and contract revalidation."},
  {"caseId":"C17-E2-11","caseType":"correction","input":"For the same validated June ready-closed population, I meant worst by absolute fee-complete net loss descending, top four with approved exact ties and complete currency coverage, not signed net P/L ascending.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with negative fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["validate replacement of signed basis with absolute negative net_pnl magnitude","rank exact absolute loss magnitude descending","use positive integer N equals 4 and approved ties"],"expectedComparison":null,"expectedTimeRange":"retained validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","trusted accepted query revision","locked fee-complete net_pnl formula and compatible currency","retained eligible ready_closed negative-result population","declared absolute-loss basis and descending magnitude direction","positive integer N equals 4","approved deterministic privacy-safe tie policy","fee and population coverage","prior accepted basis remains unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A correction can change basis only after full validation and creates the next accepted revision atomically."},
  {"caseId":"C17-E2-12","caseType":"comparison","input":"Within each of the two authorized quarters, identify the worst two ready-closed trades by signed gross P/L ascending, retain approved exact ties, then compare the ranked result sets with side-specific coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["rank_results","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":["authorized quarter A population","authorized quarter B population"],"expectedOperators":["rank each side by exact signed gross_pnl ascending","return positive integer N equals 2 per side with approved ties","compare only compatible ranked side populations"],"expectedComparison":"worst two signed gross_pnl trades in authorized quarter A versus authorized quarter B","expectedTimeRange":"two validated nonoverlapping quarterly temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit compatible comparison sides","locked gross_pnl fact and compatible currency","same eligible ready_closed population contract per side","declared signed lower-is-worse direction","positive integer N equals 2 per side","approved privacy-safe tie policy","side-specific sample and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparing adverse results establishes no cause, blame, or prediction."},
  {"caseId":"C17-E2-13","caseType":"ranking","input":"Order the worst seven authorized weekday groups by locked expectancy for the validated year, lower first, with exact values, approved privacy-safe ties, and complete group coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy"],"expectedGroupings":["authorized weekday groups"],"expectedOperators":["resolve worst to locked expectancy","rank exact expectancy ascending","return positive integer N equals 7 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula and version","declared lower-is-worse direction","compatible weekday group populations","positive integer N equals 7","approved deterministic privacy-safe tie policy","per-group eligible missing unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Worst remains a ranking composition and never an independent bad-trade score."},
  {"caseId":"C17-E2-14","caseType":"negation","input":"For validated Q4, rank the worst three authorized setup groups by signed gross P/L ascending with approved exact ties, and do not use absolute loss, win rate, or a hidden score.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["exclude absolute-loss win-rate and hidden-score candidates","rank exact signed gross_pnl ascending","return positive integer N equals 3 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated Q4 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact and compatible currency","compatible setup-group populations","declared signed lower-is-worse direction","positive integer N equals 3","approved privacy-safe tie policy","per-group coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation removes named meanings without supplying an unspoken quality rule."},
  {"caseId":"C17-E2-15","caseType":"exclusion","input":"Find the worst five authorized ticker groups by signed gross P/L ascending in validated May, excluding only known ineligible rows, preserving unknown coverage, and applying the approved exact-tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","gross_pnl"],"expectedFilters":["authorized eligible ready_closed rows with known gross_pnl","exclude only validated ineligible rows"],"expectedGroupings":["authorized exact ticker groups"],"expectedOperators":["rank exact signed gross_pnl ascending","return positive integer N equals 5 with approved ties","keep missing and unavailable populations outside the complement"],"expectedComparison":null,"expectedTimeRange":"validated May temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact and compatible currency","declared signed lower-is-worse direction","positive integer N equals 5","approved deterministic privacy-safe tie policy","explicit excluded missing and unavailable counts","no unknown-as-zero substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion never converts unavailable facts into favorable or adverse values."},
  {"caseId":"C17-E2-16","caseType":"multi_filter","input":"Rank the worst four authorized short TSLA ready-closed trades outside regular hours by absolute fee-complete net loss in validated July, largest magnitude first, with approved exact ties and complete coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","net_pnl"],"expectedFilters":["authorized exact TSLA ticker","short side","outside validated regular-hours session","eligible ready_closed trades with negative fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["apply all authorized owner-compatible filters","rank exact absolute net loss magnitude descending","return positive integer N equals 4 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact ticker resolution","locked session timezone contract","locked net_pnl formula","fee-complete compatible currency partition","declared absolute-loss basis and descending magnitude direction","positive integer N equals 4","approved privacy-safe tie policy","filtered population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters cannot change signed-versus-absolute semantics or hide missing coverage."},
  {"caseId":"C17-E2-17","caseType":"multi_part","input":"Rank the worst three authorized setups by expectancy v1 in validated Q3, lower first with approved exact ties; also show each denominator and coverage, then explain the direction without assigning blame.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["worst_ambiguity","worst","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy v1"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["rank exact expectancy v1 ascending","return positive integer N equals 3 with approved ties","report per-group denominator and coverage","explain the locked direction"],"expectedComparison":null,"expectedTimeRange":"validated Q3 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula version 1","declared lower-is-worse direction","compatible setup-group populations","positive integer N equals 3","approved deterministic privacy-safe tie policy","per-group sample missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The multi-part read infers no motive, cause, advice, prediction, or mutation."},
  {"caseId":"C17-E2-18","caseType":"ambiguous","input":"Show my worst trades.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["worst_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve metric approved-score signed-loss absolute-loss and subjective-quality candidates","ask only the highest-impact unresolved field","create or replace only a privacy-safe pending ambiguity marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted query revision remains unchanged","pending marker records expected answer type without supplying a query value","no raw account trade label or conversation identifiers","later direction sign basis population period N tie fee currency and coverage questions remain staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which metric or approved score should define worst?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No hidden most-negative, absolute-loss, expectancy, score, bad-trade, population, N, or tie default is allowed."},
  {"caseId":"C17-E2-19","caseType":"negative_example","input":"Explain the locked Category 14 definition of the worst ranking operator without ranking any Journal records.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["worst"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["explain the locked ranking composition only","perform no ambiguity routing or record access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized product documentation","locked Category 14 registry version","no private data raw IDs ranking execution or subjective judgment"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This explicit concept-explanation request must not map to worst_ambiguity."},
  {"caseId":"C17-E2-20","caseType":"unsupported_data","input":"Using the accepted July signed net P/L ranking contract, rank the worst three ready-closed trades even though fee completeness is unavailable; do not substitute gross P/L or absolute loss.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades requiring fee-complete signed net_pnl"],"expectedGroupings":[],"expectedOperators":["preserve the explicit signed net_pnl owner route","return Unavailable for missing fee completeness","do not rank gross P/L absolute loss or zero-filled values"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","trusted accepted metric direction sign basis population N tie and time contract","locked net_pnl formula","fee completeness explicitly unavailable","missing and unavailable coverage reported without private evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The designed route remains Planned while the result is Unavailable; unavailable is not Unsupported and must not be disguised as ambiguity."},
  {"caseId":"C17-E2-21","caseType":"selected_entity_context","input":"Rank the trusted selected ready-closed trade's authorized setup group among all covered setup groups by expectancy v1 this year, lower first, bottom four with approved exact ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["analyze_trade","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["worst_ambiguity","worst","expectancy"],"expectedFilters":["authorized setup groups containing eligible ready_closed trades"],"expectedGroupings":["authorized setup groups including the selected trade's validated group"],"expectedOperators":["revalidate selected trade and its setup association server-side","rank exact expectancy v1 ascending","return positive integer N equals 4 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance lifecycle and setup association","locked expectancy formula version 1","compatible covered group populations","declared lower-is-worse direction","positive integer N equals 4","approved privacy-safe tie policy","per-group denominator and coverage","no raw trade label account or source IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected identity cannot establish a metric, direction, population, N, tie rule, or quality judgment."},
  {"caseId":"C17-E2-22","caseType":"cross_category","input":"Rank the worst five authorized weekday groups by signed gross P/L in validated Q2, ascending with approved exact ties, then report each sample and coverage without causal, personal-quality, or future claims.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["worst_ambiguity","worst","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":["authorized weekday groups"],"expectedOperators":["route ambiguity through Category 17","read locked gross_pnl through Category 2","group through Category 11","rank through Category 14","report evidence and limitations"],"expectedComparison":null,"expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact and compatible currency","compatible weekday populations","declared signed lower-is-worse direction","positive integer N equals 5","approved deterministic privacy-safe tie policy","per-group eligible excluded missing and unavailable counts","no cause blame advice prediction or mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition preserves each locked owner contract and claims no implemented Chat runtime."}
]
~~~

## Evaluation Array C17-E3 -- better_ambiguity

~~~json
[
  {"caseId":"C17-E3-01","caseType":"canonical","input":"Compare the authorized morning and afternoon ready-closed populations in validated July by fee-complete net P/L; higher is better, use signed morning-minus-afternoon and absolute difference, treat exact equality as tied, and report side coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["validated morning-session population","validated afternoon-session population"],"expectedOperators":["resolve the two compatible sides","resolve better to explicit net_pnl and higher-is-better direction","calculate signed left-minus-right and absolute difference","apply fixed exact-equality treatment"],"expectedComparison":"morning fee-complete net_pnl versus afternoon fee-complete net_pnl","expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked session timezone contract","locked net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency partition on both sides","compatible eligible ready_closed side populations","morning is fixed left side and afternoon fixed right side","higher-is-better direction","exact equality is tied","side-specific eligible excluded missing and unavailable coverage","exactly two sides with no hidden ranking N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All side, metric, direction, basis, difference, equality, time, population, and coverage fields are explicit."},
  {"caseId":"C17-E3-02","caseType":"formal_paraphrase","input":"Determine whether authorized setup Alpha or setup Beta had the better locked expectancy in the validated quarter, with Alpha as left, Beta as right, higher as better, exact equality tied, and complete side denominators.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by locked expectancy"],"expectedGroupings":["authorized setup Alpha population","authorized setup Beta population"],"expectedOperators":["resolve exact compatible left and right sides","compare locked expectancy under higher-is-better direction","calculate signed left-minus-right and absolute difference","treat exact equality as tied"],"expectedComparison":"setup Alpha expectancy versus setup Beta expectancy","expectedTimeRange":"validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula and version","setup Alpha fixed as left and setup Beta fixed as right","compatible eligible ready_closed side populations","declared higher-is-better direction","exact equality rule","side-specific denominator sample and coverage","exactly two sides with no hidden baseline percentage N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal better wording creates no preference, process score, cause, or advice."},
  {"caseId":"C17-E3-03","caseType":"conversational_paraphrase","input":"Were my authorized June or July ready-closed trades better on gross P/L, using June minus July, higher is better, exact equality means tied, and both sides keep compatible currency and coverage?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":["validated June population","validated July population"],"expectedOperators":["resolve June as left and July as right","compare exact gross_pnl under higher-is-better direction","calculate signed left-minus-right and absolute difference","apply exact equality as tied"],"expectedComparison":"June gross_pnl versus July gross_pnl","expectedTimeRange":"validated June and July temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact","compatible currency partition and eligible ready_closed population on both sides","June fixed as left and July fixed as right","higher-is-better direction","exact equality rule","side-specific eligible excluded missing and unavailable coverage","no percentage denominator ranking N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording is resolved only because both sides and every material comparison contract are complete."},
  {"caseId":"C17-E3-04","caseType":"trader_slang","input":"Did the authorized open-session group trade cleaner than midday under my locked rule-adherence fact in validated August, with open as left, midday as right, higher adherence better, exact equality tied, and side coverage shown?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_rule","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","rule_followed"],"expectedFilters":["authorized records with accepted covered rule-adherence facts"],"expectedGroupings":["validated open-session population","validated midday-session population"],"expectedOperators":["resolve cleaner only to the explicit locked rule-adherence criterion","compare left and right adherence under higher-is-better direction","calculate signed left-minus-right and absolute difference","treat exact equality as tied"],"expectedComparison":"open-session rule adherence versus midday-session rule adherence","expectedTimeRange":"validated August temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked session timezone contract","accepted versioned rule and rule_followed evidence contract","open session fixed as left and midday fixed as right","compatible covered populations","declared higher-is-better direction","exact equality rule","side-specific denominator and unavailable coverage","no hidden quality score ranking N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cleaner is safe only because the user explicitly binds it to an accepted factual rule criterion; no motive or quality is inferred."},
  {"caseId":"C17-E3-05","caseType":"abbreviation","input":"Does BTR mean a ticker, an abbreviation, a saved label, or better-comparison wording in this request?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["better_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve all authorized token-class candidates","ask for token class before selecting comparison sides or metric"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 ticker abbreviation and label-class collision check","accepted query revision remains unchanged","privacy-safe pending marker stores no raw identifier or private candidate text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does BTR mean a ticker, an abbreviation, a saved label, or better-comparison wording here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A short token cannot establish sides, metric, direction, a ticker, or a private label."},
  {"caseId":"C17-E3-06","caseType":"misspelling","input":"Which group was bettr for the validated month?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["better_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate better as a fuzzy candidate only","clarify the fuzzy candidate before asking for sides"],"expectedComparison":null,"expectedTimeRange":"validated requested month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 locale-aware fuzzy candidate generation","ticker and saved-label collision check","accepted query revision remains unchanged","privacy-safe pending marker without raw IDs or private text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean better as comparison wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After fuzzy confirmation, sides are asked before metric; all other fields remain staged."},
  {"caseId":"C17-E3-07","caseType":"noisy_input","input":"june vs july better gross pnl june-left higher exact tie covered closed pls","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":["validated June population","validated July population"],"expectedOperators":["resolve noisy wording to exact two-side gross_pnl comparison","calculate signed June-minus-July and absolute difference","apply higher-is-better direction and exact equality"],"expectedComparison":"June gross_pnl versus July gross_pnl","expectedTimeRange":"validated June and July temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact and compatible currency","June fixed as left and July fixed as right","compatible eligible ready_closed populations","declared higher-is-better direction","exact equality rule","side-specific coverage","no percentage baseline ranking N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Harmless noise changes no side identity, metric, direction, equality, population, or coverage contract."},
  {"caseId":"C17-E3-08","caseType":"command","input":"Compare authorized long and short ready-closed populations by fee-complete net P/L in validated Q2, long minus short, higher is better, exact equality tied, with compatible currency and side coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["authorized long-side population","authorized short-side population"],"expectedOperators":["resolve long as left and short as right","compare exact net_pnl under higher-is-better direction","calculate signed left-minus-right and absolute difference","treat exact equality as tied"],"expectedComparison":"long-side fee-complete net_pnl versus short-side fee-complete net_pnl","expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked net_pnl formula","fee-complete compatible currency on both sides","compatible eligible ready_closed side populations","long fixed as left and short fixed as right","higher-is-better direction","exact equality rule","side-specific coverage","no hidden percentage baseline N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The read-only command authorizes no write or protected action."},
  {"caseId":"C17-E3-09","caseType":"fragment","input":"setup Alpha vs Beta; expectancy v1; Alpha-left; higher better; exact tie; validated Q4; covered groups","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy v1"],"expectedGroupings":["authorized setup Alpha population","authorized setup Beta population"],"expectedOperators":["resolve exact sides from explicit labels","compare expectancy v1 under higher-is-better direction","calculate signed Alpha-minus-Beta and absolute difference","apply exact equality as tied"],"expectedComparison":"setup Alpha expectancy v1 versus setup Beta expectancy v1","expectedTimeRange":"validated Q4 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula version 1","Alpha fixed as left and Beta fixed as right","compatible covered setup populations","declared higher-is-better direction","exact equality rule","side-specific denominators and coverage","no percentage baseline ranking N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete because all required comparison fields are explicit and trusted."},
  {"caseId":"C17-E3-10","caseType":"follow_up","input":"For that trusted accepted morning-versus-afternoon July comparison, keep the same authorized sides, fee-complete net P/L, morning-minus-afternoon sign, higher-is-better direction, exact equality, currency basis, and side coverage; which was better?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","net_pnl"],"expectedFilters":["retained authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["retained validated morning population","retained validated afternoon population"],"expectedOperators":["reuse only trusted typed accepted comparison fields","revalidate authorization owner version and coverage","calculate signed left-minus-right and absolute difference with exact equality"],"expectedComparison":"retained morning fee-complete net_pnl versus retained afternoon fee-complete net_pnl","expectedTimeRange":"retained validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained locked session and net_pnl contracts","morning retained as left and afternoon as right","retained higher-is-better and equality rules","current compatible currency and side coverage","no prose-only recency-only percentage N or tie-break default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trusted typed context can retain a complete comparison only after current revalidation."},
  {"caseId":"C17-E3-11","caseType":"correction","input":"For the same validated Alpha-versus-Beta quarter, I meant fee-complete net P/L with Alpha left, Beta right, higher better, exact equality tied, and full side coverage, not expectancy.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["authorized setup Alpha population","authorized setup Beta population"],"expectedOperators":["validate replacement of expectancy with net_pnl only","retain exact left and right sides","calculate signed Alpha-minus-Beta and absolute difference","apply higher-is-better and exact equality"],"expectedComparison":"setup Alpha fee-complete net_pnl versus setup Beta fee-complete net_pnl","expectedTimeRange":"retained validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","trusted accepted query revision","locked net_pnl formula and fee-complete compatible currency","Alpha fixed as left and Beta fixed as right","compatible eligible ready_closed populations","higher-is-better direction","exact equality rule","side-specific coverage","prior accepted metric remains unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A complete validated correction atomically creates the next accepted revision without mutating Journal facts."},
  {"caseId":"C17-E3-12","caseType":"comparison","input":"Compare authorized Q1 with Q2 by gross P/L, Q1 as left and Q2 as right, higher better, signed Q1-minus-Q2 plus absolute difference, exact equality tied, compatible currency, and side coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":["validated Q1 population","validated Q2 population"],"expectedOperators":["resolve explicit compatible quarter sides","compare exact gross_pnl under higher-is-better direction","calculate signed left-minus-right and absolute difference","apply exact equality as tied"],"expectedComparison":"Q1 gross_pnl versus Q2 gross_pnl","expectedTimeRange":"validated Q1 and Q2 temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact and compatible currency","Q1 fixed as left and Q2 fixed as right","compatible eligible ready_closed populations","declared higher-is-better direction","exact equality rule","side-specific eligible excluded missing and unavailable coverage","no hidden percentage baseline N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The comparison is factual and establishes no cause or future edge."},
  {"caseId":"C17-E3-13","caseType":"ranking","input":"Order exactly two authorized groups, morning then afternoon, by expectancy v1 in validated June; higher is better, exact equality is tied, and show each denominator and coverage without creating a broader ranking.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["compare_groups","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy v1"],"expectedGroupings":["validated morning-session population","validated afternoon-session population"],"expectedOperators":["resolve exactly two fixed comparison sides","compare exact expectancy v1 under higher-is-better direction","order the two sides only","treat exact equality as tied"],"expectedComparison":"morning expectancy v1 versus afternoon expectancy v1","expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked session timezone contract","locked expectancy formula version 1","morning fixed as left and afternoon fixed as right","compatible covered populations","higher-is-better direction","exact equality rule","side-specific denominator and coverage","exactly two sides and no ranking N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking wording does not authorize adding groups or inventing a top-N contract."},
  {"caseId":"C17-E3-14","caseType":"negation","input":"Compare authorized setup Alpha with setup Beta by expectancy v1 this year, Alpha left, higher better, exact equality tied; do not use win rate, P/L, or subjective quality, and show side coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy v1"],"expectedGroupings":["authorized setup Alpha population","authorized setup Beta population"],"expectedOperators":["exclude win-rate P/L and quality candidates","compare exact expectancy v1 under higher-is-better direction","calculate signed Alpha-minus-Beta and absolute difference","apply exact equality as tied"],"expectedComparison":"setup Alpha expectancy v1 versus setup Beta expectancy v1","expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula version 1","Alpha fixed as left and Beta fixed as right","compatible covered populations","declared higher-is-better direction","exact equality rule","side-specific denominator and coverage","no hidden percentage baseline N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation removes candidates but never supplies an unspoken preference or score."},
  {"caseId":"C17-E3-15","caseType":"exclusion","input":"Compare authorized June with July by signed gross P/L, June left and July right, higher better, excluding only known ineligible rows, preserving unknown coverage, and treating exact equality as tied.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","gross_pnl"],"expectedFilters":["authorized eligible ready_closed rows with known gross_pnl","exclude only validated ineligible rows"],"expectedGroupings":["validated June population","validated July population"],"expectedOperators":["compare exact gross_pnl under higher-is-better direction","calculate signed June-minus-July and absolute difference","apply exact equality as tied","keep missing and unavailable outside the complement"],"expectedComparison":"June gross_pnl versus July gross_pnl","expectedTimeRange":"validated June and July temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact and compatible currency","June fixed as left and July fixed as right","compatible eligible ready_closed populations","higher-is-better direction","exact equality rule","side-specific excluded missing and unavailable counts","no unknown-as-zero percentage N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion never treats unknown facts as favorable, adverse, or equal."},
  {"caseId":"C17-E3-16","caseType":"multi_filter","input":"Compare authorized long NVDA morning trades with long NVDA afternoon trades by fee-complete net P/L in validated July, morning left, higher better, exact equality tied, compatible currency, and side coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","net_pnl"],"expectedFilters":["authorized exact NVDA ticker","long side","eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["validated morning-session population","validated afternoon-session population"],"expectedOperators":["apply identical authorized filters to both sides","compare exact net_pnl under higher-is-better direction","calculate signed morning-minus-afternoon and absolute difference","apply exact equality as tied"],"expectedComparison":"long NVDA morning fee-complete net_pnl versus long NVDA afternoon fee-complete net_pnl","expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact ticker resolution","locked session timezone contract","locked net_pnl formula and fee-complete compatible currency","morning fixed as left and afternoon fixed as right","compatible filtered ready_closed populations","higher-is-better direction","exact equality rule","side-specific coverage","no hidden percentage baseline N or tie-break"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters remain identical and cannot change side identity or hide missing data."},
  {"caseId":"C17-E3-17","caseType":"multi_part","input":"Compare authorized setup Alpha with setup Beta by expectancy v1 in validated Q2, Alpha left and higher better; report signed and absolute difference, exact equality, each denominator and coverage, then explain the formula without recommending either setup.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["better_ambiguity","better_than","expectancy"],"expectedFilters":["authorized eligible ready_closed trades covered by expectancy v1"],"expectedGroupings":["authorized setup Alpha population","authorized setup Beta population"],"expectedOperators":["compare exact expectancy v1 under higher-is-better direction","calculate signed Alpha-minus-Beta and absolute difference","apply exact equality as tied","report denominators and coverage","explain locked formula"],"expectedComparison":"setup Alpha expectancy v1 versus setup Beta expectancy v1","expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked expectancy formula version 1","Alpha fixed as left and Beta fixed as right","compatible covered populations","higher-is-better direction","exact equality rule","side-specific denominator missing and unavailable counts","no hidden percentage baseline N tie-break or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The multi-part answer remains explanatory and cannot make a recommendation or predict future performance."},
  {"caseId":"C17-E3-18","caseType":"ambiguous","input":"Which was better?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["better_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve all authorized side and metric candidates","ask only for the highest-impact missing comparison sides","create or replace only a privacy-safe pending ambiguity marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted query revision remains unchanged","pending marker records expected side-reference answer type without supplying query values","no raw account trade label or conversation identifiers","metric direction basis population time equality difference baseline sample and coverage questions remain staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which two compatible groups, periods, trades, or other sides should I compare?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recency, UI order, prose, higher numeric value, P/L, or subjective preference cannot silently establish either side or metric."},
  {"caseId":"C17-E3-19","caseType":"negative_example","input":"Explain the locked Category 14 better-than comparison operator without comparing any groups or records.","expectedPrimaryIntent":"explain_concept","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["better_than"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["explain the locked comparison composition only","perform no ambiguity routing or private record access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized product documentation","locked Category 14 registry version","no private data raw IDs side selection calculation or subjective preference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This explicit concept-explanation request must not map to better_ambiguity."},
  {"caseId":"C17-E3-20","caseType":"unsupported_data","input":"Using the accepted June-versus-July fee-complete net P/L comparison, decide which was better even though July fee completeness is unavailable; do not substitute gross P/L or zero.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades requiring fee-complete net_pnl on both sides"],"expectedGroupings":["validated June population","validated July population"],"expectedOperators":["preserve the explicit sides net_pnl direction and equality contract","return Unavailable for the incomplete July side","do not compare gross P/L zero or partial side values"],"expectedComparison":"June fee-complete net_pnl versus July fee-complete net_pnl","expectedTimeRange":"validated June and July temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","trusted accepted left right metric direction equality population and time contract","locked net_pnl formula","July fee completeness explicitly unavailable","side-specific missing and unavailable coverage reported without private evidence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The designed comparison route remains Planned while the result is Unavailable; unavailable is not Unsupported and must not be disguised as ambiguity."},
  {"caseId":"C17-E3-21","caseType":"selected_entity_context","input":"Compare the trusted selected ready-closed trade with its server-validated authorized peer trade by fee-complete net P/L, selected trade left, peer right, higher better, exact equality tied, compatible currency, and complete evidence coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["compare_groups","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["better_ambiguity","better_than","net_pnl"],"expectedFilters":["two server-validated eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["revalidate both selected and peer entities server-side","fix selected trade as left and peer as right","compare exact net_pnl under higher-is-better direction","calculate signed left-minus-right and absolute difference","apply exact equality as tied"],"expectedComparison":"selected trade fee-complete net_pnl versus validated peer trade fee-complete net_pnl","expectedTimeRange":"exact realized lifecycle of each validated trade","expectedSelectedEntity":"server-validated selected ready-closed trade and compatible peer reference","expectedContextRequirements":["trusted typed selected and peer entities","same server-authorized account scope","current ownership type provenance and lifecycle for both sides","locked net_pnl formula and fee-complete compatible currency","selected trade fixed as left and peer fixed as right","higher-is-better direction","exact equality rule","complete evidence coverage","no raw trade account source or execution IDs","no hidden similarity or peer inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context supplies neither an inferred peer nor missing metric facts; both entities and every comparison field are explicitly validated."},
  {"caseId":"C17-E3-22","caseType":"cross_category","input":"Compare authorized morning with afternoon ready-closed trades by fee-complete net P/L in validated Q3, morning left and higher better, exact equality tied; report signed and absolute difference plus side coverage without cause, advice, prediction, or mutation.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["better_ambiguity","better_than","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["validated morning-session population","validated afternoon-session population"],"expectedOperators":["route ambiguity through Category 17","calculate locked net_pnl through Category 2","group sessions through Categories 11 and 13","compare through Category 14","report evidence and limitations"],"expectedComparison":"morning fee-complete net_pnl versus afternoon fee-complete net_pnl","expectedTimeRange":"validated Q3 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked session timezone contract","locked net_pnl formula and fee-complete compatible currency","morning fixed as left and afternoon fixed as right","compatible side populations","higher-is-better direction","exact equality rule","side-specific eligible excluded missing and unavailable counts","no hidden baseline percentage ranking N tie-break cause advice prediction or mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition retains every locked owner contract and claims no implemented Chat runtime."}
]
~~~

## Evaluation Array C17-E4 -- profit_ambiguity

~~~json
[
  {"caseId":"C17-E4-01","caseType":"canonical","input":"Calculate total realized fee-complete net P/L for authorized eligible ready-closed trades in validated July, in USD with fee and population coverage shown.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve profit to total realized whole-population P/L","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","sum exact compatible USD values"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized family","eligible ready_closed trade grain","explicit fee-complete net basis","locked net_pnl formula","compatible USD currency partition","eligible excluded fee-incomplete missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The family resolves before basis; this case supplies both without mixing winners-only or open value."},
  {"caseId":"C17-E4-02","caseType":"formal_paraphrase","input":"Report the gross positive contribution from authorized selected-basis winning ready-closed trades only during the validated quarter, in USD with winner and coverage counts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","gross_profit","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with exact gross_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["resolve profit to winners-only positive contribution","classify winners on explicit gross_pnl basis before rounding","sum exact positive gross_pnl values"],"expectedComparison":null,"expectedTimeRange":"validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit winners-only family","eligible ready_closed trade grain","explicit gross basis","exact positive gross_pnl classification","compatible USD currency partition","eligible winning excluded missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Winners-only contribution is not total P/L and cannot include losing or open records."},
  {"caseId":"C17-E4-03","caseType":"conversational_paraphrase","input":"How much unrealized profit is on the trusted selected open position at 10:30 America/New_York? Recognize the open-profit family, but report the locked result Unavailable because there is no approved mark source; do not calculate or fall back to realized P/L, and show open quantity, cost, mark, as-of, and currency coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","unrealized_pnl"],"expectedFilters":["server-validated selected legitimate-open position"],"expectedGroupings":[],"expectedOperators":["resolve profit to the open unrealized family","revalidate legitimate-open lifecycle evidence","return locked unrealized_pnl Unavailable because no approved current mark source exists","never calculate from last execution or realized P/L fallback"],"expectedComparison":null,"expectedTimeRange":"10:30 America/New_York as-of contract on the validated date","expectedSelectedEntity":"server-validated selected legitimate-open position","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","legitimate-open quantity coverage","open cost-basis coverage","approved current mark source is missing","exact as-of and timezone coverage","compatible currency coverage","missing and unavailable fields exposed","no realized P/L fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The Category 17 route is Planned while locked Category 2 unrealized_pnl is Unavailable; recognition never claims a mark, calculation, or realized substitute."},
  {"caseId":"C17-E4-04","caseType":"trader_slang","input":"What did I bank after fees on all authorized ready-closed trades in validated August, meaning total realized fee-complete net P/L in USD?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve banked to explicit total realized P/L","apply locked fee-complete net formula","sum exact compatible USD values"],"expectedComparison":null,"expectedTimeRange":"validated August temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized family","explicit after-fees net basis","eligible ready_closed population","locked net_pnl formula","compatible USD currency","fee and population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang is safe because family, basis, population, period, currency, and coverage are explicit."},
  {"caseId":"C17-E4-05","caseType":"abbreviation","input":"Does P mean P/L, a ticker, an abbreviation, or a saved label in this request?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve all authorized token-class candidates","ask for token class before profit-family or data access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 ticker abbreviation and label-class collision check","accepted query revision remains unchanged","privacy-safe pending marker without raw IDs or private candidate text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does P mean P/L, a ticker, an abbreviation, or a saved label here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A bare abbreviation cannot select profit, family, basis, ticker, or private label."},
  {"caseId":"C17-E4-06","caseType":"misspelling","input":"How much proffit did I make in the validated month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate profit as a fuzzy candidate only","clarify the fuzzy candidate before asking the profit family"],"expectedComparison":null,"expectedTimeRange":"validated requested month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 locale-aware fuzzy candidate generation","ticker and saved-label collision check","accepted query revision remains unchanged","privacy-safe pending marker without raw IDs or private text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean profit as P/L wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After fuzzy confirmation, total versus winners-only versus open is asked before gross or net."},
  {"caseId":"C17-E4-07","caseType":"noisy_input","input":"july total realized profit all closed after fees USD coverage pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve noisy wording to total realized whole-population P/L","calculate locked fee-complete net_pnl","sum exact USD values"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized family","explicit fee-complete net basis","eligible ready_closed population","compatible USD currency","fee-complete eligible excluded missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no realization family, fee basis, population, currency, or coverage contract."},
  {"caseId":"C17-E4-08","caseType":"command","input":"Sum total realized gross P/L for all authorized eligible ready-closed trades in validated Q2, partitioned by compatible currency with coverage reported.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":["compatible currency partitions"],"expectedOperators":["resolve profit to total realized P/L","apply explicit gross basis","sum exact gross_pnl separately by currency"],"expectedComparison":null,"expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized family","explicit gross basis","eligible ready_closed population","no cross-currency addition","currency-specific eligible missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The read command authorizes no write and does not net currencies together."},
  {"caseId":"C17-E4-09","caseType":"fragment","input":"winners-only gross profit; ready-closed; validated Q1; USD; exact positive basis; coverage","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","gross_profit","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with exact gross_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["resolve fragment to winners-only contribution","classify exact positive gross_pnl before rounding","sum exact positive USD gross_pnl"],"expectedComparison":null,"expectedTimeRange":"validated Q1 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit winners-only family","explicit gross basis","eligible ready_closed population","exact positive classification","compatible USD currency","winner and coverage counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete and does not silently become whole-population P/L."},
  {"caseId":"C17-E4-10","caseType":"follow_up","input":"For that trusted accepted total-realized ready-closed July query, keep the population and USD currency but use fee-complete net P/L rather than gross.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","net_pnl"],"expectedFilters":["retained authorized eligible ready_closed population with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted family population period and currency","validate replacement of gross with fee-complete net basis","sum exact net_pnl"],"expectedComparison":null,"expectedTimeRange":"retained validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained total-realized family and ready_closed population","locked net_pnl formula","retained compatible USD currency","current fee and population coverage","accepted state changes only after complete validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Typed accepted context may retain complete fields; nearby prose or recency may not."},
  {"caseId":"C17-E4-11","caseType":"correction","input":"For the same authorized validated quarter, I meant gross profit from exact gross-basis winners only, not total realized P/L; keep USD and ready-closed coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","gross_profit","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with exact gross_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["validate replacement of total-realized family with winners-only","classify exact gross-basis winners","sum exact positive gross_pnl"],"expectedComparison":null,"expectedTimeRange":"retained validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","trusted accepted query revision","explicit winners-only correction","explicit gross basis","retained ready_closed USD population","winner and coverage counts","prior accepted family unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction atomically creates the next accepted revision and rewrites no Journal fact."},
  {"caseId":"C17-E4-12","caseType":"comparison","input":"Compare total realized fee-complete net P/L for authorized morning versus afternoon ready-closed trades in validated June, using compatible USD facts and side coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["validated morning-session population","validated afternoon-session population"],"expectedOperators":["resolve profit to total realized P/L on both sides","sum exact net_pnl per side","compare compatible side values without cause inference"],"expectedComparison":"morning total realized net_pnl versus afternoon total realized net_pnl","expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized family","locked session timezone contract","same fee-complete net basis on both sides","compatible USD currency and ready_closed populations","side-specific fee sample and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison establishes association only and cannot explain why one side differs."},
  {"caseId":"C17-E4-13","caseType":"ranking","input":"Rank the top five authorized setup groups by total realized gross P/L in validated Q3, descending on exact USD values with approved privacy-safe ties and group coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["resolve profit to total realized gross P/L","sum exact gross_pnl per compatible group","rank descending with positive integer N equals 5 and approved ties"],"expectedComparison":null,"expectedTimeRange":"validated Q3 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized family and gross basis","compatible USD ready_closed group populations","positive integer N equals 5","approved deterministic privacy-safe exact-value tie policy","per-group sample missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses no hidden winners-only, net, open, score, or quality definition."},
  {"caseId":"C17-E4-14","caseType":"negation","input":"Show total realized gross P/L for all authorized ready-closed trades in validated May, not winners-only profit and not open profit, in USD with coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","gross_pnl"],"expectedFilters":["authorized eligible ready_closed trades with gross_pnl"],"expectedGroupings":[],"expectedOperators":["exclude winners-only and open-family candidates","resolve total realized whole-population P/L","sum exact USD gross_pnl"],"expectedComparison":null,"expectedTimeRange":"validated May temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized family","explicit gross basis","eligible ready_closed population","compatible USD currency","eligible excluded missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation removes named branches but supplies no other hidden default."},
  {"caseId":"C17-E4-15","caseType":"exclusion","input":"Calculate total realized fee-complete net P/L in authorized April, exclude only fee-incomplete ready-closed trades, and report excluded, missing, and unavailable USD coverage separately.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","net_pnl"],"expectedFilters":["authorized eligible fee-complete ready_closed trades","exclude fee-incomplete trades from resolved net values"],"expectedGroupings":[],"expectedOperators":["resolve total realized net P/L","sum exact fee-complete net_pnl","keep fee-incomplete missing and unavailable populations visible"],"expectedComparison":null,"expectedTimeRange":"validated April temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized and fee-complete net contract","compatible USD currency","known eligibility and fee completeness","no missing-fee estimation or gross fallback","excluded missing unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion shapes the result population and never deletes or zero-fills evidence."},
  {"caseId":"C17-E4-16","caseType":"multi_filter","input":"Calculate total realized fee-complete net P/L for authorized long NVDA ready-closed trades outside premarket in validated July, in USD with filtered coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","net_pnl"],"expectedFilters":["authorized exact NVDA ticker","long side","outside validated premarket session","eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["apply owner-compatible authorized filters","resolve total realized net P/L","sum exact compatible USD net_pnl"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact ticker resolution","locked session timezone contract","explicit total-realized and net basis","locked net_pnl formula","compatible USD currency","filtered fee and population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters do not alter realization, fee basis, currency, or missing-data rules."},
  {"caseId":"C17-E4-17","caseType":"multi_part","input":"For authorized ready-closed trades in validated Q1, report total realized gross P/L and fee-complete net P/L as separate USD results, then show eligible, fee-incomplete, missing, and unavailable counts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["profit_ambiguity","gross_pnl","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades"],"expectedGroupings":[],"expectedOperators":["resolve both requested results to total-realized family","sum exact gross_pnl separately","sum exact fee-complete net_pnl separately","report basis-specific coverage"],"expectedComparison":null,"expectedTimeRange":"validated Q1 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized family","separate gross and fee-complete net contracts","locked net_pnl formula","compatible USD currency","basis-specific eligible fee-incomplete missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Gross and net remain separate and neither is winners-only or open profit."},
  {"caseId":"C17-E4-18","caseType":"ambiguous","input":"How much profit did I make?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve total-realized winners-only and open-unrealized candidates","ask only the highest-impact family field","create or replace only a privacy-safe pending ambiguity marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted query revision remains unchanged","pending marker supplies no profit-family value","no raw account trade source or conversation identifiers","gross versus net population period currency fee valuation and coverage questions remain staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean total realized P/L, profit from winners only, or open/unrealized profit?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No total, winners-only, open, gross, net, currency, population, or time default is allowed."},
  {"caseId":"C17-E4-19","caseType":"negative_example","input":"Show my authorized cash balance without calculating any trading P/L.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized account cash-balance record"],"expectedGroupings":[],"expectedOperators":["route to the separate account-balance owner if available","perform no profit ambiguity or P/L calculation"],"expectedComparison":null,"expectedTimeRange":"validated balance as-of contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate balance capability and as-of evidence","no trade P/L substitution or raw account identifier"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cash balance must not map to profit_ambiguity."},
  {"caseId":"C17-E4-20","caseType":"unsupported_data","input":"Use another account's private trades to predict tomorrow's NVDA profit, reveal its source identifiers, and tell me whether to buy.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private access","reject raw identifier disclosure","reject future-profit prediction and investment advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account boundary","minimum necessary privacy-safe refusal","no private candidate text or raw identifiers","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private-data access, identifier disclosure, future-profit prediction, and investment advice are unsupported.","notes":"Unsupported is terminal and is not disguised as clarification or unavailable evidence."},
  {"caseId":"C17-E4-21","caseType":"selected_entity_context","input":"For the trusted selected legitimate-open position at 14:00 America/New_York, recognize USD unrealized P/L but return it Unavailable because no approved current mark source exists; show remaining-open quantity, cost, mark, as-of, and currency coverage without calculation or realized fallback.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["profit_ambiguity","unrealized_pnl"],"expectedFilters":["server-validated selected legitimate-open position"],"expectedGroupings":[],"expectedOperators":["revalidate selected entity and legitimate-open lifecycle","route to locked unrealized_pnl","return Unavailable for the missing approved current mark","never calculate from last execution or realized P/L fallback"],"expectedComparison":null,"expectedTimeRange":"14:00 America/New_York as-of contract on the validated date","expectedSelectedEntity":"server-validated selected legitimate-open position","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership provenance and legitimate-open state","remaining-open quantity coverage","open cost-basis coverage","approved current mark source is missing","exact as-of and timezone coverage","compatible USD currency coverage","missing and unavailable fields exposed","no raw trade source execution or account IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection cannot overcome Category 2's Unavailable mark boundary or authorize a guessed, last-execution, or realized result."},
  {"caseId":"C17-E4-22","caseType":"cross_category","input":"Group authorized ready-closed trades by weekday and calculate total realized fee-complete net P/L for each group in validated Q4, preserving USD fee, sample, and coverage facts without causal claims.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":["calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["profit_ambiguity","net_pnl"],"expectedFilters":["authorized eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["authorized weekday groups"],"expectedOperators":["route profit family through Category 17","calculate locked net_pnl through Category 2","group through Category 11","resolve time through Category 13","report evidence and limitations"],"expectedComparison":null,"expectedTimeRange":"validated Q4 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit total-realized and fee-complete net basis","locked net_pnl formula","compatible USD weekday populations","per-group eligible fee-incomplete missing and unavailable counts","no cause advice prediction mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition preserves each locked owner's formula and coverage."}
]
~~~

## Evaluation Array C17-E5 -- size_ambiguity

~~~json
[
  {"caseId":"C17-E5-01","caseType":"canonical","input":"Report the number of authorized eligible ready-closed trades in validated July, meaning record count rather than trade or position size, with coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","trade_count"],"expectedFilters":["authorized eligible ready_closed trades"],"expectedGroupings":[],"expectedOperators":["resolve size to result cardinality","count exact eligible trade records","report excluded missing and unavailable counts"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit result-count family","eligible ready_closed trade grain","locked trade_count identity","no quantity notional exposure or size-unit substitution","population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count and entity size remain distinct; this case supplies the count family explicitly."},
  {"caseId":"C17-E5-02","caseType":"formal_paraphrase","input":"Report the exact accepted-execution share quantity for each authorized Stock execution in the validated quarter at its own execution event, preserving execution grain, side, time, and source provenance with coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity"],"expectedFilters":["authorized accepted Stock executions"],"expectedGroupings":[],"expectedOperators":["resolve size to accepted-execution quantity","read the accepted quantity at exact execution grain","preserve execution event side and provenance without aggregation"],"expectedComparison":null,"expectedTimeRange":"validated quarter execution-event temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit execution entity and accepted-execution quantity measure","one accepted execution per result grain","exact execution timestamp and side","share quantity unit","accepted source and correction provenance","missing invalid and unavailable execution-quantity coverage","no raw execution source or account IDs in output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One accepted execution's factual quantity is not entered quantity, maximum position, notional, exposure, or a lifecycle aggregate."},
  {"caseId":"C17-E5-03","caseType":"conversational_paraphrase","input":"What was my average position size last month, meaning the arithmetic mean of each authorized ready-closed Stock trade's maximum absolute open share quantity, with complete paths and sample count?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","average_position_size"],"expectedFilters":["authorized eligible ready_closed Stock trades with complete maximum-open-quantity facts"],"expectedGroupings":[],"expectedOperators":["resolve size to maximum-open-share-quantity aggregate","calculate each eligible trade's maximum absolute running quantity","take arithmetic mean over the nonzero eligible denominator"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit entity-size family and average_position_size owner","share quantity unit","complete accepted lifecycle paths","nonzero eligible denominator","eligible incomplete missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Average position size uses maximum open quantity, not entry quantity, notional, or exposure."},
  {"caseId":"C17-E5-04","caseType":"trader_slang","input":"How many shares did I put on in the trusted selected Stock trade, meaning entered quantity from accepted allocation roles opening, adding, and flip_opening only; exclude reducing, closing, and flip_closing, and do not substitute maximum-open quantity?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity"],"expectedFilters":["server-validated selected Stock trade with covered opening adding and flip_opening accepted allocations"],"expectedGroupings":[],"expectedOperators":["resolve put on to entered share quantity","include only accepted allocation roles opening adding and flip_opening","exclude only reducing closing and flip_closing","sum covered included-role allocation quantities"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade opening adding and flip_opening allocation events","expectedSelectedEntity":"server-validated selected Stock trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","accepted chronological allocation-role evidence","included roles opening adding and flip_opening","excluded roles reducing closing and flip_closing","share quantity unit","allocation quantity and role coverage","no raw trade execution source or account IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Entered quantity is the sum of opening, adding, and flip_opening allocations; it excludes only reducing, closing, and flip_closing and is not one-execution or maximum-open quantity."},
  {"caseId":"C17-E5-05","caseType":"abbreviation","input":"Does S mean size, shares, a ticker, an abbreviation, or a saved label here?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve authorized token and class candidates","ask token class before count-versus-entity or data access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 ticker abbreviation and label-class collision check","accepted query revision remains unchanged","privacy-safe pending marker without raw IDs or private candidate text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does S mean size, shares, a ticker, an abbreviation, or a saved label here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A bare token supplies no family, entity, measure, unit, or authorization."},
  {"caseId":"C17-E5-06","caseType":"misspelling","input":"What was my szie in the validated month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate size as a fuzzy candidate only","clarify the fuzzy candidate before count-versus-entity"],"expectedComparison":null,"expectedTimeRange":"validated requested month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 locale-aware fuzzy candidate generation","ticker and saved-label collision check","accepted query revision remains unchanged","privacy-safe pending marker without raw identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean size as count or trade-size wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After fuzzy confirmation, family comes before measure and unit."},
  {"caseId":"C17-E5-07","caseType":"noisy_input","input":"july size = record count closed eligible coverage pls not shares","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","trade_count"],"expectedFilters":["authorized eligible ready_closed trades"],"expectedGroupings":[],"expectedOperators":["resolve noisy size wording to result cardinality","count exact eligible trade records","report population coverage"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit record-count family","eligible ready_closed trade grain","shares quantity notional and exposure excluded","eligible excluded missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise cannot turn record count into share quantity or risk."},
  {"caseId":"C17-E5-08","caseType":"command","input":"Calculate average position size for authorized ready-closed Stock trades in validated Q2 as the arithmetic mean of complete maximum absolute open share quantities, with sample and path coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","average_position_size"],"expectedFilters":["authorized eligible ready_closed Stock trades with complete quantity paths"],"expectedGroupings":[],"expectedOperators":["resolve size to average maximum-open-quantity owner","derive each maximum absolute running share quantity","calculate arithmetic mean over eligible trades"],"expectedComparison":null,"expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit entity-size family measure and share unit","complete chronological execution paths","nonzero eligible denominator","eligible incomplete missing unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The read-only command does not alter executions or define exposure."},
  {"caseId":"C17-E5-09","caseType":"fragment","input":"Stock entry notional; entered allocation quantity times accepted execution price; multiplier 1; execution-event USD; validated Q3; coverage","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","entry_price"],"expectedFilters":["authorized covered position-increasing Stock allocations with accepted execution price"],"expectedGroupings":[],"expectedOperators":["resolve size to Stock entry notional","multiply each position-increasing entered allocation quantity by its accepted execution price and Stock multiplier 1","sum only compatible execution-event currency values"],"expectedComparison":null,"expectedTimeRange":"validated Q3 position-increasing execution-event temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","position-increasing allocation-role boundary","accepted allocation quantity and accepted execution price at the same event","Stock multiplier equals 1","explicit execution-event USD currency","eligible incomplete price-missing currency-missing and unavailable coverage","no current mark or later valuation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Stock entry notional is event notional only; it is not generic exposure, current or market value, equity utilization, margin, or peak exposure."},
  {"caseId":"C17-E5-10","caseType":"follow_up","input":"For that trusted accepted selected-trade size query, keep the same trade and complete lifecycle but use maximum open share quantity instead of entry quantity.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","maximum_position_size"],"expectedFilters":["retained server-validated selected ready_closed Stock trade"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed selected entity and lifecycle","validate replacement of entry quantity with maximum open quantity","derive exact maximum absolute running shares"],"expectedComparison":null,"expectedTimeRange":"retained exact selected-trade lifecycle","expectedSelectedEntity":"server-validated selected ready-closed Stock trade","expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained current selected entity and complete path","explicit maximum-open measure and share unit","path coverage","accepted state changes only after validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A follow-up may revise the measure but does not rewrite source quantities."},
  {"caseId":"C17-E5-11","caseType":"correction","input":"For the same validated July population, I meant the number of eligible ready-closed trade records, not maximum position size or share quantity.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","trade_count"],"expectedFilters":["authorized eligible ready_closed trades"],"expectedGroupings":[],"expectedOperators":["validate replacement of entity-size family with record count","count exact eligible trade records","clear the prior size measure only after validation"],"expectedComparison":null,"expectedTimeRange":"retained validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","trusted accepted query revision","explicit record-count correction","retained eligible ready_closed population","population coverage","prior accepted family unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes query meaning atomically and no Journal record."},
  {"caseId":"C17-E5-12","caseType":"comparison","input":"Compare authorized morning and afternoon trades by average position size in validated June, using the same complete maximum-open-share-quantity contract and side coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","average_position_size"],"expectedFilters":["authorized eligible ready_closed Stock trades with complete quantity paths"],"expectedGroupings":["validated morning-session population","validated afternoon-session population"],"expectedOperators":["derive maximum open share quantity per trade","calculate side-specific arithmetic means","compare compatible share values"],"expectedComparison":"morning average_position_size versus afternoon average_position_size","expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked session timezone contract","same maximum-open-share measure and complete lifecycle basis","nonzero side denominators","side-specific eligible incomplete missing unavailable coverage","no risk or cause inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compatible quantity comparison proves neither risk nor motive."},
  {"caseId":"C17-E5-13","caseType":"ranking","input":"Rank the top five authorized ready-closed Stock trades by maximum absolute open share quantity in validated Q1, descending on exact values with approved privacy-safe ties and path coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","maximum_position_size"],"expectedFilters":["authorized eligible ready_closed Stock trades with complete quantity paths"],"expectedGroupings":[],"expectedOperators":["derive exact maximum open share quantity per trade","rank descending","return positive integer N equals 5 with approved exact-value ties"],"expectedComparison":null,"expectedTimeRange":"validated Q1 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit maximum-open-share measure","complete accepted execution paths","positive integer N equals 5","approved deterministic privacy-safe tie policy","eligible incomplete missing unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses no dollar, exposure, normal-size, risk, or quality default."},
  {"caseId":"C17-E5-14","caseType":"negation","input":"Show maximum open share quantity for authorized ready-closed Stock trades in validated May, not dollar exposure, not notional, and not record count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","maximum_position_size"],"expectedFilters":["authorized eligible ready_closed Stock trades with complete quantity paths"],"expectedGroupings":[],"expectedOperators":["exclude count notional and exposure candidates","derive maximum absolute running share quantity","report path coverage"],"expectedComparison":null,"expectedTimeRange":"validated May temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit entity-size family maximum-open measure and share unit","complete accepted execution lifecycle","eligible incomplete missing unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation removes candidates and supplies no price, currency, or exposure basis."},
  {"caseId":"C17-E5-15","caseType":"exclusion","input":"Calculate average maximum open share quantity in authorized April, excluding only trades with incomplete quantity lifecycles and reporting those paths as unavailable rather than zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","average_position_size"],"expectedFilters":["authorized eligible ready_closed Stock trades with complete quantity paths","exclude incomplete paths from resolved size values"],"expectedGroupings":[],"expectedOperators":["derive per-trade maximum open shares","calculate mean over complete positive denominator","keep incomplete and unavailable paths visible"],"expectedComparison":null,"expectedTimeRange":"validated April temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit average maximum-open-share contract","complete lifecycle requirement","nonzero eligible denominator","no incomplete-as-zero substitution","excluded missing unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion never changes or fabricates execution quantities."},
  {"caseId":"C17-E5-16","caseType":"multi_filter","input":"Calculate average maximum open share quantity for authorized long NVDA ready-closed trades outside premarket in validated July, using complete paths and filtered coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","average_position_size"],"expectedFilters":["authorized exact NVDA ticker","long side","outside validated premarket session","eligible ready_closed Stock trades with complete quantity paths"],"expectedGroupings":[],"expectedOperators":["apply owner-compatible filters","derive maximum open shares per trade","calculate arithmetic mean over eligible values"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact ticker resolution","locked session timezone contract","share unit and complete lifecycle basis","nonzero eligible denominator","filtered incomplete missing unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters cannot alter the quantity measure or hide incomplete paths."},
  {"caseId":"C17-E5-17","caseType":"multi_part","input":"For authorized ready-closed trades in validated Q4, report eligible trade count and average maximum open share quantity as separate results; also state that generic average dollar exposure is Unavailable because no approved exposure basis exists.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["size_ambiguity","trade_count","average_position_size","average_dollar_exposure"],"expectedFilters":["authorized eligible ready_closed trades","complete Stock quantity paths for average_position_size"],"expectedGroupings":[],"expectedOperators":["count eligible trade records","calculate average maximum-open-share quantity separately","return Unavailable for generic average_dollar_exposure without an approved basis"],"expectedComparison":null,"expectedTimeRange":"validated Q4 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate count and quantity units","complete quantity lifecycle and nonzero size denominator","average_dollar_exposure capability is Unavailable","no entry-notional market-value equity-margin or peak-exposure fallback","result-specific sample and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Planned ambiguity routing preserves Category 6's Unavailable exposure owner and does not disguise it as clarification."},
  {"caseId":"C17-E5-18","caseType":"ambiguous","input":"What was my size?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve record-count and trade-execution-position-size candidates","ask only the highest-impact family field","create or replace only a privacy-safe pending ambiguity marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted query revision remains unchanged","pending marker supplies no family or measure value","no raw account trade execution source or conversation identifiers","measure unit entity event price currency valuation population baseline and coverage remain staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the number of results or records, or the size of a trade, execution, or position?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No count, quantity, maximum-position, notional, exposure, entity, unit, or event default is allowed."},
  {"caseId":"C17-E5-19","caseType":"negative_example","input":"Resize the performance chart to a wider layout without reading Journal data.","expectedPrimaryIntent":"product_help","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["route to presentation help","perform no size ambiguity or trading-data access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized presentation context","no Journal facts raw IDs trade-size metric or protected mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Visual resize wording must not map to size_ambiguity."},
  {"caseId":"C17-E5-20","caseType":"unsupported_data","input":"Read another account's private order size, reveal its execution identifiers, and tell me what size order I should place tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["size_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private access","reject raw identifier disclosure","reject order-size advice and future recommendation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account boundary","minimum necessary privacy-safe refusal","no private candidate text raw account order execution or source identifiers","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private-data access, identifier disclosure, and advice about a future order size are unsupported.","notes":"Unsupported is terminal and cannot be converted into a draft order or clarification."},
  {"caseId":"C17-E5-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed Stock trade, calculate maximum absolute open share quantity from its validated complete accepted execution lifecycle and show path coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","maximum_position_size"],"expectedFilters":["server-validated selected ready_closed Stock trade with complete quantity path"],"expectedGroupings":[],"expectedOperators":["revalidate selected trade server-side","derive maximum absolute running share quantity","report lifecycle coverage"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade lifecycle","expectedSelectedEntity":"server-validated selected ready-closed Stock trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle","accepted chronological execution quantities","share unit","complete path and decision coverage","no raw trade execution source or account IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected identity supplies neither measure nor unit without the explicit current-turn contract."},
  {"caseId":"C17-E5-22","caseType":"cross_category","input":"Group authorized ready-closed Stock trades by approved maximum-open-share buckets in validated Q2 and compare fee-complete net P/L, using explicit nonoverlapping bounds, USD facts, and bucket-specific coverage without causal claims.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity","performance_by_size_bucket","maximum_position_size","net_pnl"],"expectedFilters":["authorized eligible ready_closed Stock trades with complete maximum-open-share facts and fee-complete net_pnl"],"expectedGroupings":["approved versioned nonoverlapping maximum-open-share buckets"],"expectedOperators":["resolve size to maximum open share quantity","classify under explicit bucket endpoints","calculate locked net_pnl per bucket","compare compatible populations"],"expectedComparison":"fee-complete net_pnl across approved maximum-open-share buckets","expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","approved bucket version bounds endpoints and gap-overlap policy","complete quantity lifecycle","locked net_pnl formula and compatible USD currency","bucket-specific eligible incomplete fee-missing and unavailable counts","no cause motive advice prediction mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition retains the Planned named bucket metric and every locked owner boundary."}
]
~~~

## Evaluation Array C17-E6 -- risk_ambiguity

~~~json
[
  {"caseId":"C17-E6-01","caseType":"canonical","input":"Recognize requested planned dollar risk for the trusted selected long Stock trade under proposed formula version 3, but return the locked result Unavailable because no separately approved versioned owner exists; do not calculate from entry, stop, or quantity facts, and expose missing owner and evidence coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["server-validated selected long Stock trade requesting planned dollar risk"],"expectedGroupings":[],"expectedOperators":["resolve risk to requested planned-dollar-risk meaning","return the locked owner Unavailable because no separately approved versioned contract exists","never calculate from entry stop quantity or plan facts"],"expectedComparison":null,"expectedTimeRange":"requested selected-trade plan and entry event","expectedSelectedEntity":"server-validated selected long Stock trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","proposed formula version 3 is not an approved owner","missing approved formula version unit basis applicability and population contract","entry stop and quantity facts cannot activate the metric","missing and unavailable owner/evidence coverage exposed","no fee realized-loss or risk-score substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Meaning is recognized but planned dollar risk remains locked Unavailable; no formula calculation or generic risk score is inferred."},
  {"caseId":"C17-E6-02","caseType":"formal_paraphrase","input":"Report the R denominator for authorized validated-Q1 trades, but keep it Unavailable because no separately approved versioned R-denominator owner defines the formula, basis, units, eligible population, or zero and missing handling; do not derive it from stop facts or label a generic result R.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["authorized validated-Q1 trades requesting an R denominator"],"expectedGroupings":[],"expectedOperators":["resolve risk to the requested R-denominator branch","return the locked owner Unavailable because no approved versioned denominator contract exists","never calculate from entry stop loss exposure or saved-rule facts"],"expectedComparison":null,"expectedTimeRange":"validated Q1 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","missing approved R-denominator identity formula version basis and unit","missing eligible population and event contract","zero missing and unavailable denominator handling not approved","requested evidence and unavailable coverage exposed","no generic R score advice or realized fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The ambiguity route recognizes R-denominator meaning but preserves the locked Unavailable owner and invents no denominator or score."},
  {"caseId":"C17-E6-03","caseType":"conversational_paraphrase","input":"For authorized ready-closed trades in validated July, summarize only explicit covered Daily Risk Cap rule version 4 evaluation facts as followed, broken, unknown, not evaluated, or incomplete; do not derive adherence from stops, prices, quantities, or any risk formula.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity","rule_followed","rule_broken","rule"],"expectedFilters":["authorized trades with explicit covered Daily Risk Cap version 4 evaluation facts"],"expectedGroupings":["followed","broken","unknown","not evaluated","incomplete"],"expectedOperators":["resolve risk to authorized saved rule version 4","read only explicit versioned rule evaluation facts","keep followed broken unknown not_evaluated and incomplete states separate","never derive evaluation from a risk formula or plan facts"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique authorized Daily Risk Cap rule version 4","explicit covered evaluator-produced rule_followed and rule_broken facts","unknown not_evaluated incomplete and inapplicable states preserved separately","evaluation version applicability sample and coverage","no private rule text raw IDs or formula-derived adherence"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Rule evaluation consumes accepted facts only and supplies no universal risk threshold or score."},
  {"caseId":"C17-E6-04","caseType":"trader_slang","input":"How much heat was on the trusted selected trade, meaning current dollar exposure? Recognize exposure but return it Unavailable because no approved exposure denominator, valuation event, mark, multiplier, or currency-conversion contract exists; do not substitute entry notional or infer riskiness.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity","average_dollar_exposure"],"expectedFilters":["server-validated selected trade requesting current exposure"],"expectedGroupings":[],"expectedOperators":["resolve heat to the explicit exposure branch","return locked dollar exposure Unavailable","never substitute entry notional market value equity margin peak exposure or a subjective risk score"],"expectedComparison":null,"expectedTimeRange":"requested current valuation event","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","missing approved exposure basis denominator and version","missing approved valuation event current mark multiplier and currency conversion","missing and unavailable coverage exposed","no entry-notional fallback cause emotion advice or prediction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exposure meaning is recognized but remains locked Unavailable and is not a generic risk score."},
  {"caseId":"C17-E6-05","caseType":"abbreviation","input":"Does R mean R-multiple, risk, a ticker, an abbreviation, or a saved label here?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve authorized risk R ticker abbreviation and label candidates","ask token class before measure or denominator selection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 16 short-token ticker abbreviation and label-class collision check","accepted query revision remains unchanged","privacy-safe pending marker without raw IDs or private candidate text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does R mean R-multiple, risk, a ticker, an abbreviation, or a saved label here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare R supplies no formula, denominator, unit, direction, rule, or authorization."},
  {"caseId":"C17-E6-06","caseType":"misspelling","input":"Show the riks on this validated trade.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate risk as a fuzzy candidate only","clarify the fuzzy candidate before asking measure or saved rule"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"unresolved referenced trade","expectedContextRequirements":["same server-authorized account scope","Category 16 locale-aware fuzzy candidate generation","ticker and saved-label collision check","no entity resolution or data access before clarification","accepted query revision unchanged","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean risk as a measure or saved-rule request?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After fuzzy confirmation, the approved measure or saved rule is the first semantic question."},
  {"caseId":"C17-E6-07","caseType":"noisy_input","input":"selected trade planned risk v3 entry stop shares USD -- recognize only, unavailable owner, no calc, coverage pls","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["server-validated selected trade requesting planned dollar risk"],"expectedGroupings":[],"expectedOperators":["resolve noisy wording to requested planned-dollar-risk meaning","return Unavailable for the missing approved owner","never calculate from plan facts"],"expectedComparison":null,"expectedTimeRange":"requested selected-trade plan event","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","proposed version 3 is not approved","missing owner formula basis unit applicability and coverage","entry stop quantity evidence does not create a metric"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise is recognized without activating a formula or runtime result."},
  {"caseId":"C17-E6-08","caseType":"command","input":"Report explicit covered Daily Risk Cap rule version 4 evaluation states for authorized validated-Q2 trades, separating followed, broken, unknown, not evaluated, incomplete, and inapplicable records without recomputing the rule from plan facts.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity","rule_followed","rule_broken","rule"],"expectedFilters":["authorized trades with versioned Daily Risk Cap evaluation coverage"],"expectedGroupings":["followed","broken","unknown","not evaluated","incomplete","inapplicable"],"expectedOperators":["resolve risk to saved rule version 4","read explicit covered versioned evaluation facts only","report each factual or coverage state separately","never calculate planned risk or re-evaluate the rule"],"expectedComparison":null,"expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique authorized rule version 4","explicit accepted evaluation provenance and applicability","covered rule_followed and rule_broken facts","unknown not_evaluated incomplete and inapplicable counts","no mutation private rule text or formula-derived status"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command reads evaluator results and neither calculates nor edits the saved rule."},
  {"caseId":"C17-E6-09","caseType":"fragment","input":"risk per share; requested v3; validated Q4; no separately approved owner; unavailable; no entry-stop calculation; coverage","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["authorized validated-Q4 trades requesting risk per share"],"expectedGroupings":[],"expectedOperators":["resolve fragment to requested risk-per-share meaning","return locked owner Unavailable","never calculate entry minus stop without an approved versioned owner"],"expectedComparison":null,"expectedTimeRange":"validated Q4 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","requested version 3 is not approved","missing formula basis unit direction applicability and population contracts","entry and stop facts cannot activate the result","missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Risk-per-share meaning is recognized but remains Unavailable and is not an R denominator."},
  {"caseId":"C17-E6-10","caseType":"follow_up","input":"For that trusted selected trade, keep its authorization but show only the explicit covered Daily Risk Cap rule version 4 evaluation fact; if it is unknown, not evaluated, incomplete, or inapplicable, preserve that exact state rather than deriving followed or broken.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["analyze_trade","inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity","rule_followed","rule_broken","rule"],"expectedFilters":["retained server-validated selected trade with Daily Risk Cap version 4 evaluation coverage"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed selected entity and rule reference","read the explicit accepted versioned evaluation fact","preserve unknown not_evaluated incomplete and inapplicable states","never derive followed or broken from plan facts"],"expectedComparison":null,"expectedTimeRange":"retained accepted evaluation event","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","current selected-trade authorization","unique authorized rule version 4","explicit evaluation provenance applicability and coverage","accepted state changes only after validation","no formula-derived adherence or mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up state cannot select a stale rule version, invent evaluation, or mutate the rule."},
  {"caseId":"C17-E6-11","caseType":"correction","input":"For the same trusted accepted period, I meant realized drawdown, not planned risk or exposure; retain the correction but return drawdown Unavailable until a separately approved versioned drawdown owner supplies exact equity curve, peak, trough, recovery, gross/net, currency, and population contracts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["retained authorized realized population requesting drawdown"],"expectedGroupings":[],"expectedOperators":["validate replacement of prior risk meaning with realized-drawdown branch","return locked drawdown owner Unavailable","never substitute largest loss cumulative P/L exposure or planned risk"],"expectedComparison":null,"expectedTimeRange":"retained validated accepted temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","trusted accepted query revision","missing approved drawdown identity formula and version","missing exact equity-curve peak trough recovery and ordering contract","missing gross or fee-complete net basis and compatible currency population","missing and unavailable coverage exposed","prior meaning unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction recognizes realized drawdown but cannot activate an unapproved formula or infer riskiness."},
  {"caseId":"C17-E6-12","caseType":"comparison","input":"Compare morning and afternoon by requested average planned dollar risk v3 in validated July, but return both sides Unavailable because no separately approved versioned owner exists; do not calculate or infer a difference.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["authorized morning and afternoon populations requesting planned dollar risk"],"expectedGroupings":["validated morning-session population","validated afternoon-session population"],"expectedOperators":["recognize the requested two-side planned-risk comparison","return each side Unavailable for missing approved owner","do not calculate averages differences or equality"],"expectedComparison":"unavailable morning versus afternoon requested planned dollar risk","expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked session timezone contract","proposed version 3 is not approved","missing formula unit basis side eligibility and sample contracts","side-specific missing and unavailable coverage","no cause advice or numeric fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A comparison cannot activate an unavailable measure or fabricate side values."},
  {"caseId":"C17-E6-13","caseType":"ranking","input":"Rank the top five setup groups by requested average planned dollar risk v3 in validated Q1, but return the ranking Unavailable because no approved versioned owner supplies values; exclude unavailable groups from ranking values and expose coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["authorized setup groups requesting planned dollar risk"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["recognize requested ranking and finite N equals 5","return planned-risk values Unavailable","exclude unavailable groups from resolved ranking values and report coverage"],"expectedComparison":null,"expectedTimeRange":"validated Q1 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","proposed version 3 is not approved","missing formula unit population denominator and value contracts","positive integer N equals 5 and tie policy cannot activate missing values","per-group missing and unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking semantics cannot turn an unavailable measure into a universal risk score."},
  {"caseId":"C17-E6-14","caseType":"negation","input":"Recognize requested planned dollar risk v3 for authorized June trades, not exposure, drawdown, R, or a saved rule, but return it Unavailable because the requested formula is not a separately approved owner.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["authorized June trades requesting planned dollar risk"],"expectedGroupings":[],"expectedOperators":["exclude exposure drawdown R and saved-rule branches","return requested planned dollar risk Unavailable","never calculate from stop or quantity facts"],"expectedComparison":null,"expectedTimeRange":"validated June temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","requested v3 owner is not approved","missing formula basis unit population and evidence contracts","missing and unavailable coverage","no subjective risk-score fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation resolves the branch but cannot activate an unapproved formula."},
  {"caseId":"C17-E6-15","caseType":"exclusion","input":"Request average planned dollar risk v3 in authorized May while excluding missing-stop trades, but keep the entire result Unavailable because no approved measure owner exists; never treat complete-looking rows as calculable or missing rows as zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["authorized May population requesting planned dollar risk","missing-stop records identified for coverage only"],"expectedGroupings":[],"expectedOperators":["recognize requested exclusion","return the measure Unavailable for every row without an approved owner","report stop and owner coverage without calculation or zero substitution"],"expectedComparison":null,"expectedTimeRange":"validated May temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","requested v3 is not approved","complete-looking plan facts do not activate a metric","missing-stop and owner-unavailable populations separate","no average denominator or fabricated value"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Owner unavailability precedes row evidence completeness and is not a clarification choice."},
  {"caseId":"C17-E6-16","caseType":"multi_filter","input":"Recognize planned dollar risk v3 for authorized long NVDA trades outside premarket in validated July, but return it Unavailable because no approved owner exists, even where stop facts are present; report filtered coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["authorized exact NVDA ticker","long side","outside validated premarket session"],"expectedGroupings":[],"expectedOperators":["apply authorized identity and time filters","return requested planned-risk owner Unavailable","never calculate from filtered plan facts"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact ticker resolution","locked session timezone contract","requested v3 is not approved","missing owner formula unit applicability and coverage","no stop-fact or filter-based activation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters cannot create an approved measure, score, or advice."},
  {"caseId":"C17-E6-17","caseType":"multi_part","input":"For authorized Q3 trades, recognize requested risk-per-share and planned-dollar-risk v3 as separate meanings, but return both Unavailable because neither has a separately approved versioned owner; show owner, unit, evidence, and coverage gaps without calculation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["authorized Q3 trades requesting two risk measures"],"expectedGroupings":[],"expectedOperators":["preserve risk-per-share and planned-dollar-risk as separate requested branches","return both locked owners Unavailable","report separate missing formula unit applicability evidence and coverage contracts"],"expectedComparison":null,"expectedTimeRange":"validated Q3 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","requested version 3 formulas are not approved","USD-per-share and USD requests do not establish valid units","plan facts cannot activate either metric","branch-specific missing and unavailable coverage","no fee loss exposure or quality substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Two requested meanings remain separate and Unavailable; neither becomes a universal risk score."},
  {"caseId":"C17-E6-18","caseType":"ambiguous","input":"Show my risk.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve approved measure saved-rule exposure drawdown R and subjective candidates","ask only the highest-impact owner field","create or replace only a privacy-safe pending ambiguity marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted query revision remains unchanged","pending marker supplies no risk owner or rule value","no raw account trade rule source or conversation identifiers","formula version unit stop valuation baseline population time fee currency applicability evidence sample and coverage remain staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which approved risk measure or saved rule should I use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No dollars, per-share, stop, R, exposure, drawdown, rule, threshold, or quality default is allowed."},
  {"caseId":"C17-E6-19","caseType":"negative_example","input":"Show authorized historical trades for the exact ticker RISK without evaluating any risk measure or rule.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized exact RISK ticker"],"expectedGroupings":[],"expectedOperators":["resolve RISK as an exact ticker through Category 16","retrieve authorized historical records without risk evaluation"],"expectedComparison":null,"expectedTimeRange":"validated requested historical period","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact ticker-class resolution","historical record capability and coverage","no risk formula rule or private-label inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact ticker grammar must not map to risk_ambiguity."},
  {"caseId":"C17-E6-20","caseType":"unsupported_data","input":"Use another account's private risk rule and identifiers, invent a missing stop, then tell me the safest stock and exact order I should place tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private rule access and identifier disclosure","reject fabricated stop evidence","reject safest-stock and future-order advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account boundary","minimum necessary privacy-safe refusal","no private rule text raw IDs or candidate enumeration","no invented evidence","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private access, identifier disclosure, fabricated risk evidence, investment advice, and a future order recommendation are unsupported.","notes":"Unsupported is terminal and cannot be converted into a draft or subjective risk score."},
  {"caseId":"C17-E6-21","caseType":"selected_entity_context","input":"For the trusted selected trade, recognize requested planned dollar risk v3 but return it Unavailable because no separately approved versioned owner exists; selection and complete-looking plan facts must not trigger calculation.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity"],"expectedFilters":["server-validated selected trade requesting planned dollar risk"],"expectedGroupings":[],"expectedOperators":["revalidate selected entity server-side","resolve requested planned-risk meaning","return locked owner Unavailable without using plan facts"],"expectedComparison":null,"expectedTimeRange":"requested selected-trade plan event","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership provenance and lifecycle","requested v3 is not an approved owner","missing formula basis unit applicability and population contract","owner and evidence coverage exposed","no raw trade rule source execution or account IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected identity cannot approve a formula or convert Unavailable into a calculated value."},
  {"caseId":"C17-E6-22","caseType":"cross_category","input":"Compare fee-complete net P/L for authorized trades with explicit covered Daily Risk Cap rule version 4 facts of followed versus broken in validated Q2; keep unknown, not evaluated, incomplete, and inapplicable records outside both sides and visible in coverage, with no recomputation or causal claim.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_rule","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["risk_ambiguity","rule_followed","rule_broken","net_pnl"],"expectedFilters":["authorized trades with explicit covered rule version 4 evaluation facts and fee-complete net_pnl"],"expectedGroupings":["explicit rule_followed population","explicit rule_broken population"],"expectedOperators":["resolve authorized saved rule version 4","consume only explicit covered versioned rule_followed and rule_broken facts","keep unknown not_evaluated incomplete and inapplicable outside both sides","calculate locked net_pnl per factual group","compare compatible populations without recomputing the rule"],"expectedComparison":"fee-complete net_pnl for explicit Daily Risk Cap followed versus broken populations","expectedTimeRange":"validated Q2 temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique authorized rule version 4 and explicit evaluation provenance","explicit rule_followed and rule_broken facts","unknown not_evaluated incomplete and inapplicable coverage separated","locked net_pnl formula and fee-complete compatible currency","side-specific sample missing and unavailable coverage","no plan-formula derivation cause motive safety advice prediction mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A factual evaluator-produced association establishes no causal benefit or recommendation."}
]
~~~

## Evaluation Array C17-E7 -- later_trades_ambiguity

~~~json
[
  {"caseId":"C17-E7-01","caseType":"canonical","input":"Show original fourth-or-later lifecycles for authorized account, NVDA, and account-local 2026-07-15, deriving local date from first-entry raw UTC with account IANA timezone; build all current candidates before filters, order by raw UTC then private tie key, retain open/decision/incomplete barriers, assign one-based ordinals, and select ordinal at least 4.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["authorized account","exact NVDA instrument","account-local entry date 2026-07-15","original ordinal at least 4"],"expectedGroupings":["fixed authorized account plus stable instrument plus account-local entry date"],"expectedOperators":["build complete current lifecycle candidates before output filters","order first-entry raw UTC then private stable tie key","assign original one-based ordinals","retain legitimate-open decision and incomplete barriers","select original ordinal greater than or equal to 4"],"expectedComparison":null,"expectedTimeRange":"account-local 2026-07-15 derived with account IANA timezone","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","stable NVDA identity","first-entry raw UTC","account IANA timezone and DST","complete current candidates","private deterministic tie key never exposed","original ordinal and barrier coverage","no post-filter renumbering"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ordinal identity precedes output filters and never exposes private tie keys or raw IDs."},
  {"caseId":"C17-E7-02","caseType":"formal_paraphrase","input":"Retrieve authorized NVDA lifecycle attempts numbered two or higher on account-local 2026-07-16, where each later attempt starts only after the prior lifecycle verified return to zero; preserve complete candidates, raw-UTC/private-tie order, original attempt ordinals, and barriers.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["authorized account","exact NVDA instrument","account-local entry date 2026-07-16","verified attempt ordinal at least 2"],"expectedGroupings":["fixed account instrument local-entry-date attempt partition"],"expectedOperators":["build complete lifecycle candidates","require verified return to zero between attempts","order attempt starts by raw UTC then private tie key","assign original attempt ordinals","retain barriers"],"expectedComparison":null,"expectedTimeRange":"account-local 2026-07-16 under account IANA timezone","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","first-entry raw UTC and account IANA zone","stable instrument","verified zero-return facts","complete current candidates","open decision incomplete barriers","private tie key","attempt and coverage counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Adds and fills inside one open lifecycle never become later attempts."},
  {"caseId":"C17-E7-03","caseType":"conversational_paraphrase","input":"Show authorized trades after 11:00 America/New_York on account-local 2026-07-17 using first-entry event time, exact strict-after semantics, and event-time coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity","entry_time"],"expectedFilters":["first-entry event strictly after 11:00 America/New_York","account-local entry date 2026-07-17"],"expectedGroupings":[],"expectedOperators":["resolve later to after-clock-time","convert first-entry raw UTC with account IANA timezone","apply strict greater-than clock boundary"],"expectedComparison":null,"expectedTimeRange":"strictly after 11:00 America/New_York on 2026-07-17","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","explicit first-entry event","raw UTC timestamps","account IANA timezone and DST","strict endpoint semantics","missing event-time coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clock-later is not ordinal-later or a server-time default."},
  {"caseId":"C17-E7-04","caseType":"trader_slang","input":"Show my authorized NVDA re-entries on account-local 2026-07-18, meaning attempts two plus after verified flat, with complete raw-UTC order, original attempt numbers, private ties, and barriers.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["exact NVDA","account-local entry date 2026-07-18","attempt ordinal at least 2"],"expectedGroupings":["fixed account NVDA local-date attempt partition"],"expectedOperators":["resolve re-entry to later attempt","verify prior return to zero","order complete candidates by raw UTC and private tie","preserve original attempt ordinals and barriers"],"expectedComparison":null,"expectedTimeRange":"account-local 2026-07-18","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","account IANA zone","complete current lifecycles","verified flat transitions","private tie key not output","open decision incomplete coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Re-entry slang does not include adds before flat or infer motive."},
  {"caseId":"C17-E7-05","caseType":"abbreviation","input":"Does LT mean later trades, a ticker, an abbreviation, or a saved label here?","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve token-class candidates","ask token class before sequence access"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","Category 16 ticker abbreviation and label collision check","accepted query unchanged","privacy-safe pending marker without private text or IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does LT mean later trades, a ticker, an abbreviation, or a saved label here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A short token supplies no sequence family or boundary."},
  {"caseId":"C17-E7-06","caseType":"misspelling","input":"Show my latter trdes in validated July.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate later trades as a fuzzy candidate only","clarify fuzzy meaning before sequence family"],"expectedComparison":null,"expectedTimeRange":"validated July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","Category 16 fuzzy and collision checks","accepted query unchanged","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean later trades as sequence or time wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After confirmation, ordinal versus time versus event versus attempt is asked first."},
  {"caseId":"C17-E7-07","caseType":"noisy_input","input":"nvda 7/19 acct date fourth+ orig ord all candidates rawutc private ties barriers pls","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["exact NVDA","account-local date 2026-07-19","original ordinal at least 4"],"expectedGroupings":["fixed account instrument local-date partition"],"expectedOperators":["construct all current candidates","order raw UTC then private tie","assign original ordinals","retain barriers","select at least 4"],"expectedComparison":null,"expectedTimeRange":"account-local 2026-07-19","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","account IANA timezone","complete candidates","private tie never exposed","open decision incomplete barriers","ordinal coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no partition, ordering, threshold, or barrier contract."},
  {"caseId":"C17-E7-08","caseType":"command","input":"Build the complete authorized account/instrument/account-local-date lifecycle order from first-entry raw UTC and private ties, preserve barriers, then select original ordinal four or higher after ordering.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["original ordinal at least 4 after complete ordering"],"expectedGroupings":["fixed authorized account instrument account-local-entry-date partition"],"expectedOperators":["build complete candidates","order raw UTC then private tie","assign one-based original ordinal","retain barriers","apply output filter last"],"expectedComparison":null,"expectedTimeRange":"explicit validated local-date contract","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","stable instrument","account IANA timezone","private tie not output","open decision incomplete barrier coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command is read-only and cannot renumber after filters."},
  {"caseId":"C17-E7-09","caseType":"fragment","input":"after daily-loss-threshold reached; accepted event; strict after; account timezone; validated July; coverage","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity","trade_after_daily_loss_threshold_reached"],"expectedFilters":["trade first-entry event strictly after accepted daily-loss-threshold event"],"expectedGroupings":[],"expectedOperators":["resolve later to after-event threshold branch","validate accepted threshold event","apply strict event ordering"],"expectedComparison":null,"expectedTimeRange":"validated July under account IANA timezone","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","approved threshold definition and accepted reached event","raw UTC event times","account IANA timezone","strict endpoint semantics","missing event and trade-time coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After-event meaning is not ordinal or causal performance."},
  {"caseId":"C17-E7-10","caseType":"follow_up","input":"For that trusted accepted NVDA local-date sequence, keep the account, instrument, candidates, raw-UTC/private-tie order, ordinals, and barriers; use later attempts two plus after verified flat instead of fourth-or-later.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["retained partition","attempt ordinal at least 2 after verified zero"],"expectedGroupings":["retained account instrument local-date attempt partition"],"expectedOperators":["reuse trusted typed partition only","validate family replacement","require return to zero","preserve complete ordering and barriers"],"expectedComparison":null,"expectedTimeRange":"retained validated local-date contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same authorized account","retained raw UTC/IANA/tie/order facts","verified zero transitions","accepted state changes atomically"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Follow-up cannot reuse stale prose or skip barriers."},
  {"caseId":"C17-E7-11","caseType":"correction","input":"For the same validated account-local date, I meant trades strictly after 11:00 account time by first-entry event, not ordinal four or later; keep raw UTC, account IANA timezone, and event coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity","entry_time"],"expectedFilters":["first-entry strictly after 11:00 account time"],"expectedGroupings":[],"expectedOperators":["validate replacement with after-clock branch","convert raw UTC under account IANA timezone","apply strict greater-than boundary"],"expectedComparison":null,"expectedTimeRange":"retained local date strictly after 11:00 account time","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same authorized account","first-entry event","account IANA/DST","prior family unchanged until validation","event-time coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes query meaning, not lifecycle facts."},
  {"caseId":"C17-E7-12","caseType":"comparison","input":"Compare original first trades with original fourth-or-later trades in authorized July after constructing each account/instrument/local-date sequence from complete candidates, raw UTC/private ties, and barriers; use fee-complete net P/L with coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["analyze_sequence","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity","net_pnl"],"expectedFilters":["original ordinal equals 1","original ordinal at least 4","eligible ready_closed fee-complete trades"],"expectedGroupings":["first-trade population","fourth-or-later population"],"expectedOperators":["construct sequences before filters","preserve barriers and original ordinals","calculate locked net_pnl per side","compare compatible populations"],"expectedComparison":"first trades versus original fourth-or-later trades by net_pnl","expectedTimeRange":"validated July local-date partitions","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","raw UTC account IANA and private tie order","complete candidates and barriers","locked net_pnl and currency","side-specific coverage","no causal claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters never renumber either comparison population."},
  {"caseId":"C17-E7-13","caseType":"ranking","input":"Rank authorized instruments by count of original fourth-or-later lifecycles in validated July only after fixed account/instrument/local-date partitions, complete raw-UTC/private-tie order, barriers, ordinal threshold at least 4, positive N five, and approved ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["analyze_sequence","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity","trade_count"],"expectedFilters":["original ordinal at least 4"],"expectedGroupings":["authorized stable instruments"],"expectedOperators":["construct partition sequences","count eligible ordinal-at-least-4 lifecycles per instrument","rank descending with N 5 and approved ties"],"expectedComparison":null,"expectedTimeRange":"validated July local-date partitions","expectedSelectedEntity":null,"expectedContextRequirements":["same account","raw UTC IANA and private ties","complete candidates and barriers","positive integer N equals 5","privacy-safe tie policy","group coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking cannot alter lifecycle ordinals or expose tie keys."},
  {"caseId":"C17-E7-14","caseType":"negation","input":"Show later attempts two plus after verified return to zero for authorized NVDA local dates, not later fills, adds, reductions, or display rows; preserve complete ordering and barriers.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["verified attempt ordinal at least 2"],"expectedGroupings":["account NVDA local-date attempt partitions"],"expectedOperators":["exclude fill and display-row meanings","require verified return to zero","assign original attempt ordinals from complete candidates"],"expectedComparison":null,"expectedTimeRange":"validated requested local-date scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","stable NVDA","raw UTC IANA and private ties","open decision incomplete barriers","attempt coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation does not permit skipping an incomplete barrier."},
  {"caseId":"C17-E7-15","caseType":"exclusion","input":"Select original fourth-or-later authorized July lifecycles, then exclude short-side outputs only after all candidates were ordered and numbered; retain excluded and barrier coverage without renumbering.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["original ordinal at least 4","exclude short-side output after numbering"],"expectedGroupings":["fixed account instrument local-date partitions"],"expectedOperators":["order complete candidates","assign original ordinal","retain barriers","apply side exclusion last","never renumber"],"expectedComparison":null,"expectedTimeRange":"validated July local-date partitions","expectedSelectedEntity":null,"expectedContextRequirements":["same account","raw UTC IANA and private ties","complete candidates","original ordinal and excluded/barrier coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Output exclusion cannot erase sequence members."},
  {"caseId":"C17-E7-16","caseType":"multi_filter","input":"Retrieve original fourth-or-later long NVDA ready-closed lifecycles for account-local July dates, but construct each full account/NVDA/local-date sequence with raw UTC/private ties and barriers before applying long and closed filters.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["exact NVDA","original ordinal at least 4","long side output","ready_closed output"],"expectedGroupings":["account NVDA account-local-date partitions"],"expectedOperators":["construct full sequences before filters","order raw UTC/private tie","assign ordinals and barriers","apply output filters"],"expectedComparison":null,"expectedTimeRange":"validated July account-local dates","expectedSelectedEntity":null,"expectedContextRequirements":["same account","account IANA timezone","complete candidates including open decision incomplete","private tie not exposed","filtered coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters do not redefine the candidate sequence."},
  {"caseId":"C17-E7-17","caseType":"multi_part","input":"Resolve authorized later attempts as attempt two plus after verified flat, report complete candidates, original attempt numbers, and barriers, then calculate gross P/L only for eligible ready-closed later attempts in validated Q2.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity","gross_pnl"],"expectedFilters":["attempt ordinal at least 2 after verified zero","eligible ready_closed outputs"],"expectedGroupings":[],"expectedOperators":["build complete attempts","verify zero transitions","preserve barriers","calculate locked gross_pnl only after sequence resolution"],"expectedComparison":null,"expectedTimeRange":"validated Q2 local-date partitions","expectedSelectedEntity":null,"expectedContextRequirements":["same account","raw UTC IANA and private ties","complete candidates and barriers","gross basis and currency","sequence and metric coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Sequence routing is fee-independent and downstream P/L remains separate."},
  {"caseId":"C17-E7-18","caseType":"ambiguous","input":"Show my later trades.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve ordinal clock event-threshold and later-attempt candidates","ask only the family field","create privacy-safe pending ambiguity marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","accepted query unchanged","pending marker supplies no family value","no raw IDs or private tie key","boundary timezone population metric and coverage staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should later mean a trade ordinal, trades after a clock time, trades after a specific event or threshold, or a later attempt on the same instrument?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No ordinal, time, event, attempt, partition, or threshold default is allowed."},
  {"caseId":"C17-E7-19","caseType":"negative_example","input":"Show later rows on this page without reading trading sequences.","expectedPrimaryIntent":"product_help","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["route to display pagination","perform no lifecycle sequencing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized UI context","no Journal data IDs or sequence state"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Page order is not later_trades_ambiguity."},
  {"caseId":"C17-E7-20","caseType":"unsupported_data","input":"Reveal another account's private sequence tie keys and predict whether its later trades will recover losses.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account access","reject private tie-key disclosure","reject prediction and advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized account boundary","privacy-safe refusal","no private candidate enumeration or raw IDs","accepted state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account sequence access, private tie-key disclosure, and future recovery prediction are unsupported.","notes":"Unsupported is terminal and not an incomplete-sequence clarification."},
  {"caseId":"C17-E7-21","caseType":"selected_entity_context","input":"For the trusted selected NVDA lifecycle, show whether it is original fourth-or-later within its server-revalidated authorized account/NVDA/account-local-entry-date partition after complete raw-UTC/private-tie ordering and barriers.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["analyze_sequence","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity"],"expectedFilters":["server-validated selected lifecycle"],"expectedGroupings":["selected lifecycle's fixed account NVDA local-date partition"],"expectedOperators":["revalidate selected lifecycle","build full partition candidates","order and assign original ordinal","test ordinal at least 4"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle account-local entry date","expectedSelectedEntity":"server-validated selected NVDA lifecycle","expectedContextRequirements":["trusted selected entity","same account","first-entry raw UTC account IANA and private tie","complete candidates and barriers","no raw IDs/tie output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection does not supply ordinal without reconstructing the complete partition."},
  {"caseId":"C17-E7-22","caseType":"cross_category","input":"Compare fee-complete net P/L for original first versus fourth-or-later authorized NVDA lifecycles in account-local July, preserving Category 13 timezone, Category 15 state, full sequence barriers, Category 2 formula, and coverage without cause claims.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["analyze_sequence","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["later_trades_ambiguity","net_pnl"],"expectedFilters":["exact NVDA","ordinal 1 versus ordinal at least 4","eligible fee-complete ready_closed outputs"],"expectedGroupings":["first","fourth-or-later"],"expectedOperators":["route later through Category 17","resolve local dates through Category 13","preserve state through Category 15","calculate locked net_pnl","compare factual populations"],"expectedComparison":"first versus fourth-or-later NVDA net_pnl","expectedTimeRange":"validated July account-local dates","expectedSelectedEntity":null,"expectedContextRequirements":["same account","complete raw-UTC/private-tie sequence and barriers","account IANA zone","locked net_pnl/currency","side coverage","no cause advice prediction or mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition never renumbers or claims runtime support."}
]
~~~

## Evaluation Array C17-E8 -- recent_ambiguity

~~~json
[
  {"caseId":"C17-E8-01","caseType":"canonical","input":"Calculate fee-complete net P/L for accepted closing events in the rolling 30-elapsed-day half-open interval [2026-07-01T20:00:00Z, 2026-07-31T20:00:00Z), derived as [trusted as-of minus 30 elapsed days, trusted as-of), with USD and coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","net_pnl"],"expectedFilters":["accepted closing event inside rolling 30-elapsed-day half-open UTC interval","eligible fee-complete ready_closed trades"],"expectedGroupings":[],"expectedOperators":["resolve recent to rolling elapsed duration","derive UTC start as trusted as-of minus 30 elapsed days","apply half-open UTC membership [start, trusted as-of)","sum locked net_pnl"],"expectedComparison":null,"expectedTimeRange":"[2026-07-01T20:00:00Z, 2026-07-31T20:00:00Z)","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","positive duration 30 elapsed days","accepted closing-event basis","trusted as-of 2026-07-31T20:00:00Z","half-open UTC membership [trusted as-of - 30 elapsed days, trusted as-of)","locked net_pnl USD","event-time fee and population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No server clock, local-calendar duration, or inclusive-endpoint substitution is used."},
  {"caseId":"C17-E8-02","caseType":"formal_paraphrase","input":"Retrieve the last 20 authorized eligible ready-closed trades by accepted closing-event raw UTC order as of 2026-08-01T20:00:00Z, using private deterministic ties and reporting requested-versus-eligible coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","record_count_windows"],"expectedFilters":["last positive N equals 20 eligible ready_closed trades as of explicit instant"],"expectedGroupings":[],"expectedOperators":["resolve recent to last-N records","order complete eligible population by accepted close raw UTC then private tie","select last 20 before output filters"],"expectedComparison":null,"expectedTimeRange":"records closing on or before 2026-08-01T20:00:00Z","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","positive integer N equals 20","eligible ready_closed trade grain","accepted closing-event basis","explicit as-of","private tie key not exposed","requested eligible missing-time and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Last-N identity is fixed before later filters and uses no recency guess."},
  {"caseId":"C17-E8-03","caseType":"conversational_paraphrase","input":"Show this calendar month through explicit as-of 2026-08-11T10:00:00-04:00 in America/New_York, using accepted closing events, inclusive month start and as-of endpoint, and coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","calendar_dates"],"expectedFilters":["accepted closing events in current calendar month through explicit as-of"],"expectedGroupings":[],"expectedOperators":["resolve recent to named calendar period","derive local month start under IANA zone","apply stated inclusive endpoints"],"expectedComparison":null,"expectedTimeRange":"2026-08-01 local start through 2026-08-11T10:00:00-04:00 inclusive","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","named current calendar month","accepted closing event","America/New_York IANA/DST","explicit as-of","exact endpoints","missing event-time coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current month is explicit and not inferred from server time."},
  {"caseId":"C17-E8-04","caseType":"trader_slang","input":"Show my last few trades, where few explicitly means the last 5 eligible ready-closed trades by accepted close raw UTC as of 2026-08-10T20:00:00Z, with private ties and coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","record_count_windows"],"expectedFilters":["last N equals 5 eligible ready_closed trades"],"expectedGroupings":[],"expectedOperators":["resolve few to explicit positive N equals 5","order accepted close raw UTC/private tie","select last five"],"expectedComparison":null,"expectedTimeRange":"through explicit 2026-08-10T20:00:00Z as-of","expectedSelectedEntity":null,"expectedContextRequirements":["same account","explicit N 5","eligible grain","accepted closing event","private tie not output","requested-versus-eligible and missing-time coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang is safe only because N, event, as-of, order, ties, and population are explicit."},
  {"caseId":"C17-E8-05","caseType":"abbreviation","input":"Does MTD mean month-to-date, a ticker, an abbreviation, or a saved label here?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recent_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve token/class candidates","ask class before window resolution"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 ticker abbreviation label collision check","accepted query unchanged","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does MTD mean month-to-date, a ticker, an abbreviation, or a saved label here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"MTD supplies no as-of, timezone, event basis, or endpoints."},
  {"caseId":"C17-E8-06","caseType":"misspelling","input":"Show recnt performance.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recent_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate recent as fuzzy candidate only","clarify fuzzy candidate before exact window"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 fuzzy/collision check","accepted query unchanged","privacy-safe pending marker","metric remains staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean recent as a time or last-record window?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No corrected window or performance metric is inferred."},
  {"caseId":"C17-E8-07","caseType":"noisy_input","input":"last20 closed by closeevent rawutc asof 2026-08-01T20:00Z private ties coverage pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","record_count_windows"],"expectedFilters":["last 20 eligible ready_closed trades"],"expectedGroupings":[],"expectedOperators":["order accepted close raw UTC/private tie","select last positive N 20"],"expectedComparison":null,"expectedTimeRange":"through explicit 2026-08-01T20:00:00Z","expectedSelectedEntity":null,"expectedContextRequirements":["same account","N 20","accepted closing event","explicit as-of","private tie not output","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no last-N contract."},
  {"caseId":"C17-E8-08","caseType":"command","input":"Resolve my authorized saved Recent Review window version 3, require its active applicability, accepted closing-event basis, America/New_York zone, explicit as-of 2026-08-11T09:00:00-04:00, exact endpoints, and coverage before querying.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity"],"expectedFilters":["authorized active saved Recent Review window version 3"],"expectedGroupings":[],"expectedOperators":["resolve exact saved window version","validate applicability","materialize exact endpoints from saved definition and explicit as-of"],"expectedComparison":null,"expectedTimeRange":"saved version-3 bounds as of 2026-08-11T09:00:00-04:00","expectedSelectedEntity":null,"expectedContextRequirements":["same account","authorized saved definition/version 3","active applicability","accepted event basis","IANA timezone","explicit as-of","endpoint and coverage facts","no private definition text or ID output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command neither creates nor edits a saved window."},
  {"caseId":"C17-E8-09","caseType":"fragment","input":"since accepted daily-loss-threshold event; through 2026-08-11T16:00-04:00; America/New_York; close events; inclusive; coverage","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","trade_after_daily_loss_threshold_reached"],"expectedFilters":["accepted closing events from accepted threshold event through explicit as-of"],"expectedGroupings":[],"expectedOperators":["resolve recent to event-relative window","validate named accepted event","apply inclusive event/as-of endpoints"],"expectedComparison":null,"expectedTimeRange":"accepted threshold event through 2026-08-11T16:00:00-04:00 inclusive","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved threshold and accepted reached event","accepted closing event","IANA zone","explicit as-of","exact endpoints","event-time coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Event-relative recent is not a guessed rolling duration."},
  {"caseId":"C17-E8-10","caseType":"follow_up","input":"For that trusted accepted last-20-trades window, keep N, eligible grain, accepted close-event order, private ties, and explicit as-of; change only the downstream metric to gross P/L.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","gross_pnl"],"expectedFilters":["retained last 20 eligible ready_closed identities"],"expectedGroupings":[],"expectedOperators":["reuse trusted typed window","revalidate current authorization","calculate gross_pnl over retained identities"],"expectedComparison":null,"expectedTimeRange":"retained explicit as-of and last-N contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same account","retained N/event/order/tie/as-of","gross basis/currency","coverage","atomic validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric change does not reorder last-N identities."},
  {"caseId":"C17-E8-11","caseType":"correction","input":"I meant the prior calendar month in America/New_York through its exact month-end, not rolling 30 days; keep accepted closing events and coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","calendar_dates"],"expectedFilters":["accepted closing events in prior calendar month"],"expectedGroupings":[],"expectedOperators":["validate calendar-family correction","derive exact prior-month local endpoints","apply accepted close-event membership"],"expectedComparison":null,"expectedTimeRange":"prior calendar month under retained explicit as-of and America/New_York","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","explicit IANA/as-of","calendar endpoint/DST resolution","prior window unchanged until validation","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Calendar month never becomes rolling 30 days."},
  {"caseId":"C17-E8-12","caseType":"comparison","input":"Compare accepted-close-event fee-complete net P/L in the rolling 30-elapsed-day half-open UTC interval [2026-07-02T20:00:00Z, 2026-08-01T20:00:00Z) with the immediately prior adjacent interval [2026-06-02T20:00:00Z, 2026-07-02T20:00:00Z), using trusted as-of, USD, and coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","net_pnl"],"expectedFilters":["recent half-open UTC interval [2026-07-02T20:00:00Z, 2026-08-01T20:00:00Z)","prior adjacent half-open UTC interval [2026-06-02T20:00:00Z, 2026-07-02T20:00:00Z)"],"expectedGroupings":["recent interval","prior compatible interval"],"expectedOperators":["derive recent interval as [trusted as-of - 30 elapsed days, trusted as-of)","derive prior interval as [trusted as-of - 60 elapsed days, trusted as-of - 30 elapsed days)","apply half-open UTC close-event membership","calculate locked net_pnl per side","compare compatible populations"],"expectedComparison":"recent rolling-30-elapsed-day net_pnl versus prior adjacent rolling-30-elapsed-day net_pnl","expectedTimeRange":"recent [2026-07-02T20:00:00Z, 2026-08-01T20:00:00Z); prior [2026-06-02T20:00:00Z, 2026-07-02T20:00:00Z)","expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted close-event basis","trusted as-of 2026-08-01T20:00:00Z","both adjacent half-open UTC intervals","elapsed-day arithmetic","locked net_pnl USD","side coverage","no cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The adjacent half-open intervals neither overlap nor leave a boundary gap, and the factual comparison proves no cause or future trend."},
  {"caseId":"C17-E8-13","caseType":"ranking","input":"Rank top five authorized setup groups by fee-complete net P/L inside the exact last-50 eligible close-event-ordered trades as of 2026-08-01T20:00Z, with private last-N ties, approved ranking ties, USD, and coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","net_pnl"],"expectedFilters":["last N 50 eligible ready_closed identities"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["fix last-50 identities by close raw UTC/private tie","calculate net_pnl per group","rank descending N 5 with approved ties"],"expectedComparison":null,"expectedTimeRange":"through explicit 2026-08-01T20:00Z","expectedSelectedEntity":null,"expectedContextRequirements":["same account","positive last-N 50","explicit as-of","private selection tie","positive ranking N 5","ranking tie policy","USD/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Grouping occurs after last-N identity is fixed."},
  {"caseId":"C17-E8-14","caseType":"negation","input":"Use the last 20 eligible ready-closed trades by accepted closing-event order as of 2026-08-10T20:00Z, not the last 20 calendar days, with ties and coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","record_count_windows"],"expectedFilters":["last N equals 20 trades"],"expectedGroupings":[],"expectedOperators":["exclude duration branch","select last 20 by close raw UTC/private tie"],"expectedComparison":null,"expectedTimeRange":"through explicit as-of 2026-08-10T20:00Z","expectedSelectedEntity":null,"expectedContextRequirements":["same account","N 20","eligible grain","accepted event","explicit as-of","ties/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation supplies no other time default."},
  {"caseId":"C17-E8-15","caseType":"exclusion","input":"Retrieve accepted close events in the rolling 14-elapsed-day half-open UTC interval [2026-07-28T16:00:00Z, 2026-08-11T16:00:00Z), derived as [trusted as-of minus 14 elapsed days, trusted as-of); exclude known outside events and keep missing-event-time records visible as unavailable.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity"],"expectedFilters":["accepted close event inside half-open UTC interval [2026-07-28T16:00:00Z, 2026-08-11T16:00:00Z)"],"expectedGroupings":[],"expectedOperators":["derive UTC start as trusted as-of minus 14 elapsed days","apply half-open UTC membership [start, trusted as-of)","keep unknown event times outside both member and known-outside sets and visible"],"expectedComparison":null,"expectedTimeRange":"[2026-07-28T16:00:00Z, 2026-08-11T16:00:00Z)","expectedSelectedEntity":null,"expectedContextRequirements":["same account","duration 14 elapsed days","trusted as-of 2026-08-11T16:00:00Z","half-open UTC membership [trusted as-of - 14 elapsed days, trusted as-of)","accepted close event","excluded/missing/unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Pure UTC elapsed-day arithmetic avoids any unstated zone; unknown time is not outside-window false."},
  {"caseId":"C17-E8-16","caseType":"multi_filter","input":"Show the last 20 eligible long NVDA ready-closed trades by accepted closing-event order as of 2026-08-11T20:00Z, fixing last-N identities before applying long/NVDA output filters and reporting coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","record_count_windows"],"expectedFilters":["last N 20 identities","exact NVDA output","long output"],"expectedGroupings":[],"expectedOperators":["build eligible last-N universe","order close raw UTC/private tie","select 20","apply output filters afterward"],"expectedComparison":null,"expectedTimeRange":"through 2026-08-11T20:00Z","expectedSelectedEntity":null,"expectedContextRequirements":["same account","N/event/as-of/order/tie","exact ticker","no post-filter refill or reorder","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Output filtering does not redefine last-N."},
  {"caseId":"C17-E8-17","caseType":"multi_part","input":"Resolve recent as the rolling 30-elapsed-day half-open UTC interval [2026-07-12T20:00:00Z, 2026-08-11T20:00:00Z), derived as [trusted as-of minus 30 elapsed days, trusted as-of), by accepted close event; report the endpoints, then calculate fee-complete net P/L in USD and coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["explain_result","inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","net_pnl"],"expectedFilters":["accepted close event inside half-open UTC interval [2026-07-12T20:00:00Z, 2026-08-11T20:00:00Z)"],"expectedGroupings":[],"expectedOperators":["derive UTC start as trusted as-of minus 30 elapsed days","apply half-open UTC membership [start, trusted as-of)","render exact UTC endpoints","calculate locked net_pnl","report coverage"],"expectedComparison":null,"expectedTimeRange":"[2026-07-12T20:00:00Z, 2026-08-11T20:00:00Z)","expectedSelectedEntity":null,"expectedContextRequirements":["same account","trusted as-of 2026-08-11T20:00:00Z","30 elapsed days","half-open UTC membership [trusted as-of - 30 elapsed days, trusted as-of)","accepted close event","net formula/USD","event fee population coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Elapsed-day time routing and financial calculation remain separate owners."},
  {"caseId":"C17-E8-18","caseType":"ambiguous","input":"Show recent performance.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recent_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve rolling last-N calendar event and saved-window candidates","ask exact window only","create privacy-safe pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted query unchanged","pending marker supplies no window","no server/browser recency","event timezone as-of endpoints metric population coverage staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"What exact window should recent mean?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No 7/30/90-day, this-month, last-N, current-time, or server-zone default."},
  {"caseId":"C17-E8-19","caseType":"negative_example","input":"Open the most recently viewed Help page without querying trades.","expectedPrimaryIntent":"product_help","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["route to UI history if available","perform no temporal analytics"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized UI context","no Journal history or IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recently viewed UI state is not recent_ambiguity."},
  {"caseId":"C17-E8-20","caseType":"unsupported_data","input":"Use another account's private recent history and server clock to predict what will happen soon.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["recent_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account access","reject server-clock window invention","reject prediction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized account boundary","privacy-safe refusal","no private IDs/text","accepted state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account history access, invented server-clock recency, and future prediction are unsupported.","notes":"Unsupported is not a missing timestamp clarification."},
  {"caseId":"C17-E8-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed trade, retrieve the prior 10 eligible ready-closed trades by accepted closing-event raw UTC before its validated close, using private ties, same account, and coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","record_count_windows"],"expectedFilters":["10 eligible ready_closed predecessors before selected close"],"expectedGroupings":[],"expectedOperators":["revalidate selected trade","use its accepted close as explicit event/as-of boundary","order prior closes raw UTC/private tie","select positive N 10"],"expectedComparison":null,"expectedTimeRange":"strictly before selected trade accepted close","expectedSelectedEntity":"server-validated selected ready_closed trade","expectedContextRequirements":["trusted selected entity","same account","close event/raw UTC/private tie","N 10","requested/eligible/missing coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection provides an event only after server revalidation."},
  {"caseId":"C17-E8-22","caseType":"cross_category","input":"Compare fee-complete net P/L in the rolling 30-elapsed-day half-open UTC interval [2026-07-12T20:00:00Z, 2026-08-11T20:00:00Z) with the prior adjacent interval [2026-06-12T20:00:00Z, 2026-07-12T20:00:00Z), preserving Category 13 trusted as-of and endpoints, Category 15 state, Category 2 USD formula, and coverage without prediction.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["recent_ambiguity","net_pnl"],"expectedFilters":["recent half-open UTC interval [2026-07-12T20:00:00Z, 2026-08-11T20:00:00Z)","prior adjacent half-open UTC interval [2026-06-12T20:00:00Z, 2026-07-12T20:00:00Z)"],"expectedGroupings":["recent","prior"],"expectedOperators":["route recent through Category 17","derive recent as [trusted as-of - 30 elapsed days, trusted as-of) through Category 13","derive prior as [trusted as-of - 60 elapsed days, trusted as-of - 30 elapsed days)","apply half-open UTC close-event membership","retain state through Category 15","calculate net_pnl through Category 2","compare facts"],"expectedComparison":"recent versus prior adjacent rolling-30-elapsed-day net_pnl","expectedTimeRange":"recent [2026-07-12T20:00:00Z, 2026-08-11T20:00:00Z); prior [2026-06-12T20:00:00Z, 2026-07-12T20:00:00Z)","expectedSelectedEntity":null,"expectedContextRequirements":["same account","trusted as-of 2026-08-11T20:00:00Z","accepted close event","both adjacent half-open UTC intervals","elapsed-day arithmetic","net formula/USD","side coverage","no cause prediction advice mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition uses no server recency and states both nonoverlapping adjacent intervals."}
]
~~~

## Evaluation Array C17-E9 -- cheap_stocks_ambiguity

~~~json
[
  {"caseId":"C17-E9-01","caseType":"canonical","input":"Retrieve authorized trades whose exact first-opening accepted execution/allocation price was strictly less than 5 USD per share in validated July, using one first-opening price per trade lifecycle, Stock multiplier 1, explicit applicability, and price/currency/allocation coverage; this is a new factual predicate, not a saved bucket, current quote, or valuation claim.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["exact first-opening accepted execution/allocation price strictly less than 5 USD per share","authorized applicable Stock trade lifecycles with one first-opening allocation"],"expectedGroupings":[],"expectedOperators":["resolve cheap to new explicit factual price predicate","select the exact first-opening accepted execution/allocation price for each trade lifecycle","apply strict less-than 5 USD comparison"],"expectedComparison":null,"expectedTimeRange":"validated July first-opening accepted execution/allocation-event temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict less-than operator","threshold 5","USD-per-share currency/unit","Stock multiplier 1","applicable covered population","known member nonmember missing-price missing-currency and missing-allocation coverage","no quantity-weighted lifecycle-entry current quote or subjective value substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The predicate uses only the locked first-opening basis, classifies historical facts, and creates no saved definition."},
  {"caseId":"C17-E9-02","caseType":"formal_paraphrase","input":"Resolve my authorized saved Under Five Entry bucket version 2, but return locked price_buckets membership Unavailable because the current owner lacks an approved active bucket contract and covered membership facts; do not recreate it from a threshold or expose its private definition.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","price_buckets"],"expectedFilters":["requested authorized saved Under Five Entry bucket version 2"],"expectedGroupings":[],"expectedOperators":["resolve cheap to saved-bucket family","return locked price_buckets owner Unavailable","never reconstruct membership from name threshold or current quotes"],"expectedComparison":null,"expectedTimeRange":"validated requested historical scope","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","requested saved bucket identity/version","approved active definition and membership facts absent","price field event operator bounds endpoints currency applicability and coverage missing","no private definition or raw ID output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Category 17 recognizes the saved family while locked Category 11 price_buckets remains Unavailable."},
  {"caseId":"C17-E9-03","caseType":"conversational_paraphrase","input":"Show authorized trades whose exact first-opening accepted execution/allocation price was less than or equal to 3 CAD per share in validated Q1, using one first-opening price per trade lifecycle, exact inclusive comparison, Stock applicability, and price/currency/allocation coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["exact first-opening accepted execution/allocation price less than or equal to 3 CAD per share"],"expectedGroupings":[],"expectedOperators":["resolve new explicit factual price definition","select the exact first-opening accepted execution/allocation price for each trade lifecycle","apply inclusive less-than-or-equal comparison"],"expectedComparison":null,"expectedTimeRange":"validated Q1 first-opening accepted execution/allocation-event temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","operator less-than-or-equal","threshold 3 CAD per share","Stock multiplier 1","applicable population","member nonmember missing-price missing-currency and missing-allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The locked first-opening basis, CAD, and inclusive equality are explicit; no weighted-entry, USD-conversion, or bucket default."},
  {"caseId":"C17-E9-04","caseType":"trader_slang","input":"Show my cheapies, explicitly meaning authorized Stock trades whose exact first-opening accepted execution/allocation price was strictly below 2 USD per share, using one first-opening price per trade lifecycle, multiplier 1, and coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["exact first-opening accepted execution/allocation price strictly below 2 USD per share"],"expectedGroupings":[],"expectedOperators":["resolve slang to explicitly supplied factual predicate","select the exact first-opening accepted execution/allocation price for each trade lifecycle","apply strict threshold"],"expectedComparison":null,"expectedTimeRange":"validated requested first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","explicit operator threshold and USD unit","Stock applicability/multiplier 1","price currency and allocation coverage","no weighted-entry subjective valuation or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang is safe because the locked first-opening basis and every price-contract field are explicit."},
  {"caseId":"C17-E9-05","caseType":"abbreviation","input":"Does U5 mean under-five price wording, a ticker, an abbreviation, or a saved label here?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["cheap_stocks_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve token/class candidates","ask class before price-owner resolution"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 ticker abbreviation label collision check","accepted query unchanged","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does U5 mean under-five price wording, a ticker, an abbreviation, or a saved label here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"U5 supplies no field, event, operator, currency, applicability, or definition."},
  {"caseId":"C17-E9-06","caseType":"misspelling","input":"Show cheep stocks in validated July.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["cheap_stocks_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate cheap stocks as fuzzy candidate only","clarify fuzzy candidate before owner family"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 fuzzy/ticker/label checks","accepted query unchanged","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean cheap stocks as saved-bucket, explicit-price, or valuation wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After confirmation, owner family precedes field and threshold details."},
  {"caseId":"C17-E9-07","caseType":"noisy_input","input":"july long cheap = exact first-opening accepted execution/allocation px <5 USD/share; one per trade lifecycle; stock mult1 known price/currency/allocation coverage no quote","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["long side","exact first-opening accepted execution/allocation price strictly below 5 USD per share"],"expectedGroupings":[],"expectedOperators":["resolve noisy explicit predicate","select the exact first-opening accepted execution/allocation price for each trade lifecycle","apply strict threshold"],"expectedComparison":null,"expectedTimeRange":"validated July first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict operator/5/USD per share","Stock multiplier 1","applicability and price/currency/allocation coverage","no weighted-entry or quote fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes neither the locked first-opening basis nor the price contract."},
  {"caseId":"C17-E9-08","caseType":"command","input":"Classify authorized Stock trades by the new explicit predicate exact first-opening accepted execution/allocation price strictly below 4 USD per share, using one first-opening price per trade lifecycle and multiplier 1; report member, nonmember, missing-price, missing-currency, missing-allocation, and inapplicable counts.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["exact first-opening accepted execution/allocation price strictly below 4 USD per share"],"expectedGroupings":["known member","known nonmember"],"expectedOperators":["validate explicit first-opening predicate","select one exact first-opening accepted execution/allocation price per trade lifecycle","classify covered facts","keep unknown outside both set and complement"],"expectedComparison":null,"expectedTimeRange":"validated requested first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict operator/4/USD per share","Stock multiplier 1","applicability","member/nonmember/unknown price/currency/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command uses only the locked first-opening basis and creates no saved bucket or mutation."},
  {"caseId":"C17-E9-09","caseType":"fragment","input":"penny stocks explicitly defined by saved Penny Entry bucket v1; locked owner unavailable; no threshold inference; coverage","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","penny_stocks_where_explicitly_defined"],"expectedFilters":["requested saved Penny Entry definition version 1"],"expectedGroupings":[],"expectedOperators":["resolve penny wording to explicit saved-definition family","return locked penny_stocks_where_explicitly_defined owner Unavailable","never infer a universal penny threshold"],"expectedComparison":null,"expectedTimeRange":"validated requested historical scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","requested definition/version","approved active price basis currency and membership facts absent","missing/unavailable coverage","no current quote or private definition output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Penny-stock language remains locked Unavailable, not a hidden cheap default."},
  {"caseId":"C17-E9-10","caseType":"follow_up","input":"For that trusted accepted explicit-price query, keep the exact first-opening accepted execution/allocation price basis, one first-opening price per trade lifecycle, strict less-than operator, USD per share, Stock multiplier 1, applicability, and price/currency/allocation coverage; change only the threshold from 5 to 3.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["exact first-opening accepted execution/allocation price strictly below 3 USD per share"],"expectedGroupings":[],"expectedOperators":["reuse trusted typed first-opening price contract","retain one first-opening accepted execution/allocation price per trade lifecycle","validate threshold replacement","reclassify covered facts"],"expectedComparison":null,"expectedTimeRange":"retained validated first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","retained exact first-opening accepted execution/allocation basis and membership grain","retained operator currency applicability and coverage","new threshold 3","atomic state validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the threshold changes; the locked first-opening basis remains fixed and no saved definition is created."},
  {"caseId":"C17-E9-11","caseType":"correction","input":"I meant a new explicit predicate of exact first-opening accepted execution/allocation price less than or equal to 3 USD per share, using one first-opening price per trade lifecycle, not my saved bucket; keep Stock multiplier 1 and price/currency/allocation coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["exact first-opening accepted execution/allocation price less than or equal to 3 USD per share"],"expectedGroupings":[],"expectedOperators":["validate family replacement with explicit first-opening predicate","select one first-opening accepted execution/allocation price per trade lifecycle","apply inclusive comparison","classify covered facts"],"expectedComparison":null,"expectedTimeRange":"retained validated first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","less-than-or-equal/3/USD","Stock applicability","prior family unchanged until validation","price/currency/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction selects the locked first-opening basis and does not create or edit a saved bucket."},
  {"caseId":"C17-E9-12","caseType":"comparison","input":"Compare fee-complete net P/L inside versus outside the explicit exact-first-opening-accepted-execution/allocation-price-strictly-below-5-USD predicate for authorized ready-closed Stock trades in validated Q2, using one first-opening price per trade lifecycle, keeping unknown membership outside both sides, and showing coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price","net_pnl"],"expectedFilters":["covered exact first-opening accepted execution/allocation price predicate","eligible fee-complete ready_closed trades"],"expectedGroupings":["known predicate members","known predicate nonmembers"],"expectedOperators":["select one exact first-opening accepted execution/allocation price per trade lifecycle","classify covered first-opening price facts","calculate locked net_pnl per side","compare compatible populations"],"expectedComparison":"net_pnl inside versus outside exact first-opening accepted execution/allocation price predicate","expectedTimeRange":"validated Q2 first-opening accepted execution/allocation-event and trade scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict operator/5/USD/multiplier1","locked net formula/USD","unknown price currency or allocation outside both","side coverage","no cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The locked first-opening price association proves neither undervaluation nor advice and is never merged with weighted entry."},
  {"caseId":"C17-E9-13","caseType":"ranking","input":"Rank top five authorized setup groups by count of covered trades whose exact first-opening accepted execution/allocation price was strictly below 5 USD per share in validated Q3, using one first-opening price per trade lifecycle, Stock multiplier 1, approved exact-value ties, and coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price","trade_count"],"expectedFilters":["exact first-opening accepted execution/allocation price strictly below 5 USD per share"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["select one exact first-opening accepted execution/allocation price per trade lifecycle","classify covered predicate membership","count member trade lifecycles per group","rank descending N 5 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated Q3 first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict operator/5/USD/multiplier1","positive N 5","tie policy","per-group price currency and allocation coverage","no value score"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking counts explicit locked-first-opening predicate members only, never weighted-entry members."},
  {"caseId":"C17-E9-14","caseType":"negation","input":"Use the explicit exact-first-opening-accepted-execution/allocation-price-strictly-below-5-USD predicate with one first-opening price per trade lifecycle, not a quantity-weighted entry, saved bucket, penny-stock status, current quote, or subjective undervaluation; keep Stock multiplier 1 and coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["exact first-opening accepted execution/allocation price strictly below 5 USD per share"],"expectedGroupings":[],"expectedOperators":["exclude weighted-entry saved penny quote and valuation branches","select one exact first-opening accepted execution/allocation price per trade lifecycle","apply explicit historical predicate"],"expectedComparison":null,"expectedTimeRange":"validated requested first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict threshold/USD/multiplier1","price currency and allocation coverage","no weighted-entry quote or value default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation fixes the locked first-opening basis and cannot invent another price owner."},
  {"caseId":"C17-E9-15","caseType":"exclusion","input":"Classify the exact first-opening accepted execution/allocation price strictly below 5 USD per share using one first-opening price per trade lifecycle; exclude records missing that first-opening price, its currency, or allocation from both member and complement, and report them as unknown/unavailable with Stock applicability coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["covered exact first-opening accepted execution/allocation price predicate"],"expectedGroupings":["known member","known nonmember"],"expectedOperators":["select one exact first-opening accepted execution/allocation price per trade lifecycle","apply strict predicate","keep missing first-opening price currency or allocation outside both","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict operator/threshold/USD","Stock multiplier1","unknown and unavailable price currency allocation coverage","no unknown-as-false or weighted-entry substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Complement contains known nonmembers of the locked first-opening predicate only."},
  {"caseId":"C17-E9-16","caseType":"multi_filter","input":"Retrieve authorized long NVDA ready-closed Stock trades in validated July whose exact first-opening accepted execution/allocation price was strictly below 5 USD per share, using one first-opening price per trade lifecycle, multiplier 1, and known price/currency/allocation coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["exact NVDA","long","ready_closed","exact first-opening accepted execution/allocation price strictly below 5 USD per share"],"expectedGroupings":[],"expectedOperators":["apply authorized filters","select one exact first-opening accepted execution/allocation price per trade lifecycle","classify explicit price predicate","report filtered coverage"],"expectedComparison":null,"expectedTimeRange":"validated July first-opening accepted execution/allocation-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact ticker","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict operator/5/USD","Stock multiplier1","filtered price/currency/allocation coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters retain the locked first-opening basis and supply no current quote or valuation meaning."},
  {"caseId":"C17-E9-17","caseType":"multi_part","input":"Resolve cheap as the explicit exact-first-opening-accepted-execution/allocation-price-strictly-below-5-USD predicate using one first-opening price per trade lifecycle, report member/nonmember/unknown price/currency/allocation coverage, then compare fee-complete net P/L separately without implying low price caused performance or means undervalued.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price","net_pnl"],"expectedFilters":["covered exact first-opening accepted execution/allocation price predicate","eligible fee-complete trades"],"expectedGroupings":["known members","known nonmembers"],"expectedOperators":["select one exact first-opening accepted execution/allocation price per trade lifecycle","classify the locked first-opening predicate","report coverage","calculate net_pnl per side","compare facts"],"expectedComparison":"locked first-opening predicate member versus nonmember net_pnl","expectedTimeRange":"validated requested first-opening accepted execution/allocation-event and trade scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict operator/5/USD/Stock multiplier1","price currency and allocation coverage","locked net formula/currency","unknown outside sides","no weighted-entry cause value or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Locked first-opening factual grouping and performance remain distinct owners."},
  {"caseId":"C17-E9-18","caseType":"ambiguous","input":"Show cheap stocks.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["cheap_stocks_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve saved-bucket new-explicit-price and subjective-valuation candidates","ask owner family only","if the explicit-entry route is selected stage first-opening accepted execution/allocation versus defined quantity-weighted lifecycle-entry basis before threshold","create privacy-safe pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted query unchanged","pending marker supplies no owner","explicit-entry route stages entry-price basis before operator threshold currency applicability population and coverage","no quote/penny/value default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does cheap stocks mean one of your saved price buckets, a new explicit price definition, or a subjective valuation description?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No universal threshold, entry-price basis, saved bucket, current quote, penny status, or valuation default; an explicit-entry follow-up resolves the locked basis before any threshold."},
  {"caseId":"C17-E9-19","caseType":"negative_example","input":"Show current quotes for my authorized watchlist without classifying cheap stocks.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized watchlist current-quote request"],"expectedGroupings":[],"expectedOperators":["route to separate current-market-data owner if available","perform no historical price classification"],"expectedComparison":null,"expectedTimeRange":"explicit current as-of request","expectedSelectedEntity":null,"expectedContextRequirements":["same account","separate quote availability/as-of contract","no cheap threshold or bucket inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current quotes do not map to cheap_stocks_ambiguity."},
  {"caseId":"C17-E9-20","caseType":"unsupported_data","input":"Use another account's private cheap bucket and live quotes to identify an undervalued penny stock and tell me what to buy.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["cheap_stocks_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private definition access","reject unavailable quote/penny/valuation inference","reject investment advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized account boundary","privacy-safe refusal","no private definition or IDs","no invented price/value facts","accepted state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private-bucket access, invented current valuation or penny status, and investment advice are unsupported.","notes":"Subjective cheapness is nonfactual and supplies no score or recommendation."},
  {"caseId":"C17-E9-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed Stock trade, test whether its exact first-opening accepted execution/allocation price was strictly below 5 USD per share, using one first-opening price for that trade lifecycle and multiplier 1, after server revalidation and with price/currency/allocation coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price"],"expectedFilters":["selected trade exact first-opening accepted execution/allocation price strictly below 5 USD per share"],"expectedGroupings":[],"expectedOperators":["revalidate selected trade","select its one exact first-opening accepted execution/allocation price","apply strict predicate"],"expectedComparison":null,"expectedTimeRange":"selected trade first-opening accepted execution/allocation event","expectedSelectedEntity":"server-validated selected ready_closed Stock trade","expectedContextRequirements":["trusted selected entity","same account","exact first-opening accepted execution/allocation price basis","one first-opening price for the selected trade lifecycle","strict operator/5/USD","Stock multiplier1","price/currency/allocation/applicability coverage","no weighted-entry substitution or raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies no price definition without the explicit current-turn locked first-opening predicate."},
  {"caseId":"C17-E9-22","caseType":"cross_category","input":"Compare fee-complete net P/L inside versus outside the explicit exact-first-opening-accepted-execution/allocation-price-below-5-USD predicate in validated Q2, using one first-opening price per trade lifecycle and preserving Category 16 ticker safety, Category 15 state, Category 11 locked first-opening basis, Category 2 formula, and unknown coverage without cause or advice.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["cheap_stocks_ambiguity","entry_price","net_pnl"],"expectedFilters":["covered exact first-opening accepted execution/allocation price predicate","eligible fee-complete trades"],"expectedGroupings":["known member","known nonmember"],"expectedOperators":["route ambiguity through Category 17","guard tokens through Category 16","retain state through Category 15","select one exact first-opening accepted execution/allocation price per trade lifecycle through Category 11","classify locked first-opening facts","calculate Category 2 net_pnl","compare"],"expectedComparison":"net_pnl inside versus outside exact first-opening accepted execution/allocation price predicate","expectedTimeRange":"validated Q2 first-opening accepted execution/allocation-event and trade scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact first-opening accepted execution/allocation price basis","one first-opening price per trade lifecycle membership grain","strict operator/5/USD/Stock multiplier1","locked net formula/USD","unknown price currency or allocation outside both","coverage","no weighted-entry cause value advice prediction mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition fixes Category 11's locked first-opening basis and does not activate price_buckets or penny facts."}
]
~~~

## Evaluation Array C17-E10 -- scalp_ambiguity

~~~json
[
  {"caseId":"C17-E10-01","caseType":"canonical","input":"Show validated July trades explicitly associated with my authorized active Scalp Setup label version 2, with member, nonmember, unknown, and inapplicable association coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":["authorized active Scalp Setup label version 2 membership","validated July"],"expectedGroupings":[],"expectedOperators":["resolve scalp to saved-label family","validate exact class/version/applicability","retrieve covered associations"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","exact saved label/class/version 2","active applicability","covered association states","no private definition or raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An explicit association is factual; duration or outcome never infers the label."},
  {"caseId":"C17-E10-02","caseType":"formal_paraphrase","input":"Retrieve authorized ready-closed trade lifecycles whose locked hold_duration from exact accepted first-open raw UTC to exact accepted final-close raw UTC is positive and strictly less than 300 elapsed seconds, with endpoint and missing-state coverage; treat this only as an explicit duration definition.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity","hold_duration"],"expectedFilters":["ready_closed positive hold_duration strictly less than 300 elapsed seconds"],"expectedGroupings":[],"expectedOperators":["resolve scalp to explicit duration family","compute locked positive raw-UTC first-open-to-final-close hold_duration","apply strict less-than 300-second predicate"],"expectedComparison":null,"expectedTimeRange":"validated requested final-close scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","ready_closed lifecycles","exact accepted first-open and final-close raw UTC endpoints","positive elapsed seconds","strict operator and 300-second threshold","missing endpoint and state coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Locked hold_duration does not infer setup, style, quality, or motive."},
  {"caseId":"C17-E10-03","caseType":"conversational_paraphrase","input":"Show trades explicitly defined as having both exact accepted first-entry raw UTC and final-exit raw UTC inside `[authorized versioned regular-session open raw UTC, open + 15 elapsed minutes)`, using the complete authorized session-open definition/version and coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":["accepted first entry and final exit both inside half-open raw-UTC session interval [open, open + 15 elapsed minutes)"],"expectedGroupings":[],"expectedOperators":["resolve scalp to explicit session-behavior family","validate complete authorized versioned regular-session-open owner","materialize raw-UTC half-open interval [open, open + 15 elapsed minutes)","test both accepted lifecycle events for membership"],"expectedComparison":null,"expectedTimeRange":"[authorized versioned regular-session open raw UTC, open + 15 elapsed minutes)","expectedSelectedEntity":null,"expectedContextRequirements":["same account","complete authorized session-open definition and version","exact regular-session open raw UTC","half-open [open, open + 15 elapsed minutes) membership","accepted first-entry and final-exit raw UTC","missing definition/version/open/event returns Unavailable with coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Both events must be inside the same authorized half-open session interval; missing owner or event facts remain Unavailable and explicit session behavior infers no label or style."},
  {"caseId":"C17-E10-04","caseType":"trader_slang","input":"Pull my quick scalps, where quick scalp explicitly means active Scalp Setup label version 2 membership in my authorized account, with association coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":["authorized active Scalp Setup label version 2 members"],"expectedGroupings":[],"expectedOperators":["resolve slang using supplied saved-label identity","validate version and applicability","retrieve covered members"],"expectedComparison":null,"expectedTimeRange":"validated requested scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact label/class/version","explicit association","member nonmember unknown coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang is safe only because the authorized label owner is explicit."},
  {"caseId":"C17-E10-05","caseType":"abbreviation","input":"Does SC mean my Scalp label, a ticker, an abbreviation, or ordinary text here?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve ticker abbreviation label and text candidates","ask token class before scalp-family resolution"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 exact token/class/version/collision check","accepted query unchanged","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does SC mean your Scalp label, a ticker, an abbreviation, or ordinary text here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No label, duration, session, or style meaning is inferred."},
  {"caseId":"C17-E10-06","caseType":"misspelling","input":"Show my scapl trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate scalp as fuzzy candidate only","run Category 16 ticker/label collision checks","clarify before association"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted query unchanged","fuzzy candidate not accepted fact","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean scalp as a saved label, an explicit duration or event definition, session behavior, or ordinary wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fuzzy match cannot assign a style or label."},
  {"caseId":"C17-E10-07","caseType":"noisy_input","input":"july scalps = saved Scalp Setup v2 active assoc known unknown coverage pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":["validated July","active Scalp Setup version 2 association"],"expectedGroupings":[],"expectedOperators":["resolve noisy input to supplied saved-label family","validate exact version/applicability","report association coverage"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact label class/version","association states","coverage","no fuzzy fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no saved-label contract."},
  {"caseId":"C17-E10-08","caseType":"command","input":"Classify ready-closed trades by locked hold_duration from exact accepted first-open raw UTC to exact accepted final-close raw UTC, requiring a positive interval less than or equal to 180 elapsed seconds and reporting missing-endpoint coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity","hold_duration"],"expectedFilters":["ready_closed positive hold_duration less than or equal to 180 elapsed seconds"],"expectedGroupings":["known member","known nonmember"],"expectedOperators":["validate first-open/final-close events unit and operator","compute locked positive raw-UTC hold_duration","classify covered lifecycles"],"expectedComparison":null,"expectedTimeRange":"validated requested final-close scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","ready_closed state","exact accepted first-open/final-close raw UTC endpoints","positive elapsed seconds","inclusive comparator","180 seconds","member nonmember missing-endpoint coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The locked hold_duration command creates no saved label and infers no trading style."},
  {"caseId":"C17-E10-09","caseType":"fragment","input":"ordinary description: scalp the exit; no label, duration class, or session classification","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve scalp to ordinary-description family","perform no trade classification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","unambiguous ordinary grammar","accepted state unchanged","no association or owner inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ordinary description is a resolved nonclassification route."},
  {"caseId":"C17-E10-10","caseType":"follow_up","input":"For that trusted accepted Scalp Setup version 2 member set, keep label identity, applicability, associations, and coverage; change only the downstream metric to gross P/L in USD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity","gross_pnl"],"expectedFilters":["retained covered Scalp Setup version 2 members","eligible ready_closed trades"],"expectedGroupings":[],"expectedOperators":["reuse trusted typed label query","revalidate authorization","calculate locked gross_pnl over retained identities"],"expectedComparison":null,"expectedTimeRange":"retained validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same account","retained label/class/version/associations","gross basis/USD","coverage","atomic validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric revision does not redefine scalp membership."},
  {"caseId":"C17-E10-11","caseType":"correction","input":"I meant ready-closed trades with positive locked hold_duration strictly under 300 elapsed seconds from exact accepted first-open raw UTC to final-close raw UTC, not my saved Scalp label; retain the prior result until this duration-family correction validates.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity","hold_duration"],"expectedFilters":["ready_closed positive hold_duration strictly below 300 elapsed seconds"],"expectedGroupings":[],"expectedOperators":["validate family replacement atomically","compute locked positive raw-UTC first-open-to-final-close hold_duration","replace prior query only after validation"],"expectedComparison":null,"expectedTimeRange":"retained validated final-close scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","ready_closed state","exact accepted first-open/final-close raw UTC endpoints","positive elapsed seconds","strict 300-second predicate","prior state unchanged until valid","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Locked hold_duration correction does not edit or delete the saved label."},
  {"caseId":"C17-E10-12","caseType":"comparison","input":"Compare fee-complete net P/L for known Scalp Setup version 2 members versus known nonmembers in validated Q2, keeping unknown associations outside both sides and showing compatible coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity","net_pnl"],"expectedFilters":["covered Scalp Setup version 2 associations","eligible fee-complete ready_closed trades"],"expectedGroupings":["known label members","known label nonmembers"],"expectedOperators":["validate exact label membership","calculate locked net_pnl per side","compare compatible populations"],"expectedComparison":"Scalp Setup version 2 member versus nonmember net_pnl","expectedTimeRange":"validated Q2","expectedSelectedEntity":null,"expectedContextRequirements":["same account","label class/version/applicability","unknown outside both","locked net formula/USD","side samples and coverage","no cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Association and performance are separate facts and prove no style quality."},
  {"caseId":"C17-E10-13","caseType":"ranking","input":"Rank the top five authorized saved setup-label groups by ready-closed trade count in validated Q3, including exact Scalp Setup version 2, approved exact-value ties, and per-group association coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity","trade_count"],"expectedFilters":["covered authorized setup-label memberships","eligible ready_closed trades"],"expectedGroupings":["exact authorized saved setup labels and versions"],"expectedOperators":["resolve label identities","count eligible members per group","rank descending N 5 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated Q3","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact label classes/versions","positive N 5","tie policy","per-group samples and coverage","no generic scalp score"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses separate trade_count, not inferred label quality."},
  {"caseId":"C17-E10-14","caseType":"negation","input":"Use the explicit behavior requiring both exact accepted first-entry and final-exit raw UTC inside `[complete authorized versioned regular-session open raw UTC, open + 15 elapsed minutes)`, not my saved Scalp label, duration-only bucket, outcome, or inferred style.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":["accepted first entry and final exit both inside half-open raw-UTC session interval [open, open + 15 elapsed minutes)"],"expectedGroupings":[],"expectedOperators":["exclude label duration-only outcome and style branches","validate complete authorized versioned session-open owner","materialize [open, open + 15 elapsed minutes)","apply both-event session membership"],"expectedComparison":null,"expectedTimeRange":"[authorized versioned regular-session open raw UTC, open + 15 elapsed minutes)","expectedSelectedEntity":null,"expectedContextRequirements":["same account","complete authorized session-open definition/version","exact open raw UTC","accepted first-entry/final-exit raw UTC","half-open interval membership","missing definition/version/open/event returns Unavailable with coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation fixes an exact complete owner and cannot invent another scalp definition."},
  {"caseId":"C17-E10-15","caseType":"exclusion","input":"For Scalp Setup version 2, exclude unknown or missing associations from both members and nonmembers, retain inapplicable records separately, and report all coverage states.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":["covered Scalp Setup version 2 associations"],"expectedGroupings":["known member","known nonmember"],"expectedOperators":["validate exact label association","keep unknown outside set and complement","report applicability and coverage"],"expectedComparison":null,"expectedTimeRange":"validated requested scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","label/class/version/status","member nonmember unknown inapplicable counts","no unknown-as-false"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The complement contains proven nonmembers only."},
  {"caseId":"C17-E10-16","caseType":"multi_filter","input":"Retrieve authorized long NVDA ready-closed trades in validated July explicitly associated with active Scalp Setup version 2, with filtered association coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":["exact NVDA","long","ready_closed","active Scalp Setup version 2 member"],"expectedGroupings":[],"expectedOperators":["validate label identity before filters","apply authorized filters","report filtered association coverage"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact ticker","label class/version/applicability","association coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker and side filters do not infer scalp membership."},
  {"caseId":"C17-E10-17","caseType":"multi_part","input":"Resolve scalp as ready-closed positive locked hold_duration from exact accepted first-open raw UTC to final-close raw UTC strictly below 300 elapsed seconds, report member/nonmember/missing-endpoint coverage, then calculate gross P/L in USD separately without implying duration caused results.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["scalp_ambiguity","hold_duration","gross_pnl"],"expectedFilters":["covered ready_closed positive hold_duration below 300 seconds"],"expectedGroupings":["known duration members","known duration nonmembers"],"expectedOperators":["compute locked positive raw-UTC first-open-to-final-close hold_duration","classify strict predicate","report endpoint/state coverage","calculate gross_pnl per side"],"expectedComparison":"hold-duration member versus nonmember gross_pnl","expectedTimeRange":"validated requested final-close scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","ready_closed state","exact accepted first-open/final-close raw UTC endpoints","positive elapsed seconds","strict threshold/unit","gross basis/USD","unknown outside sides","no cause or style inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Locked hold_duration classification and financial result remain separate owners."},
  {"caseId":"C17-E10-18","caseType":"ambiguous","input":"Show my scalps.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve saved-label duration/event session-behavior and ordinary-description candidates","ask meaning family only","create privacy-safe pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted query unchanged","Category 15 pending ambiguity state","label/version duration events threshold session criterion population and coverage staged","no inferred style"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does scalp mean one of your saved labels, an explicit duration or event definition, a session-behavior description, or just ordinary descriptive wording?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The focused question resolves one owner-family field only."},
  {"caseId":"C17-E10-19","caseType":"negative_example","input":"Explain the ordinary phrase scalp irritation without querying trading records.","expectedPrimaryIntent":"product_help","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["route as ordinary nontrading language","perform no label or trade classification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no Journal query","no saved-label disclosure"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Nontrading grammar does not map to scalp_ambiguity."},
  {"caseId":"C17-E10-20","caseType":"unsupported_data","input":"Use another account's private Scalp label and tell me which scalp I should take tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-label access","reject advice and prediction","preserve accepted state"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized account boundary","privacy-safe refusal","no private text or raw IDs","no invented style facts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private-label access and advice about a future trade are unsupported.","notes":"Unsupported is distinct from missing label association."},
  {"caseId":"C17-E10-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed trade, test whether its positive locked hold_duration from exact accepted first-open raw UTC to final-close raw UTC is strictly below 300 elapsed seconds after server revalidation, with endpoint/state coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity","hold_duration"],"expectedFilters":["selected ready_closed trade positive hold_duration strictly below 300 elapsed seconds"],"expectedGroupings":[],"expectedOperators":["revalidate selected ready-closed trade","compute locked positive raw-UTC first-open-to-final-close hold_duration","apply strict predicate"],"expectedComparison":null,"expectedTimeRange":"selected trade accepted first-open-to-final-close interval","expectedSelectedEntity":"server-validated selected ready_closed trade","expectedContextRequirements":["trusted selected entity","same account","ready_closed state","exact accepted first-open/final-close raw UTC endpoints","positive elapsed seconds","strict 300-second predicate","endpoint/state coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies the entity, while locked hold_duration supplies no inferred scalp style."},
  {"caseId":"C17-E10-22","caseType":"cross_category","input":"Retrieve active Scalp Setup version 2 members in validated July while Category 16 guards label/ticker collisions, Category 15 retains accepted state, and coverage remains visible; do not infer membership from Category 7 duration or Category 2 outcome.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["scalp_ambiguity"],"expectedFilters":["covered active Scalp Setup version 2 members","validated July"],"expectedGroupings":[],"expectedOperators":["route ambiguity through Category 17","guard tokens through Category 16","retain state through Category 15","validate explicit association","retrieve facts"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact label class/version/applicability","association coverage","no duration/outcome/style cause advice prediction mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition does not turn duration or outcome into label identity."}
]
~~~


## Evaluation Array C17-E11 -- overtrading_ambiguity

~~~json
[
  {"caseId":"C17-E11-01","caseType":"canonical","input":"Evaluate my authorized active Maximum Daily Trades rule version 3 for validated July account-local days, using its exact governed lifecycle-start event, threshold, comparator, applicability, account IANA zone, chronological barriers, and coverage.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity","rule_adherence"],"expectedFilters":["applicable Maximum Daily Trades rule version 3 periods"],"expectedGroupings":["account-local day"],"expectedOperators":["resolve overtrading to saved-rule family","validate exact rule version/applicability","evaluate accepted rule facts"],"expectedComparison":null,"expectedTimeRange":"validated July under authorized account IANA timezone","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","saved rule/version 3","governed lifecycle-start event","threshold/comparator","account IANA zone","chronology/barriers","breach nonbreach unknown coverage","no private rule text or IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A saved-rule breach is factual rule evaluation, not proof of motive or discipline."},
  {"caseId":"C17-E11-02","caseType":"formal_paraphrase","input":"Classify complete-coverage account-local active days whose factual zero-to-nonzero lifecycle-start count is strictly greater than 6, with ready-closed and legitimate-open starts counted, partial days unavailable, and numerator/denominator coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["complete-coverage active days","lifecycle-start count strictly greater than 6"],"expectedGroupings":["account-local day"],"expectedOperators":["resolve overtrading to explicit threshold/denominator family","count factual lifecycle starts","apply strict greater-than 6 predicate","report breach-day numerator and complete-day denominator"],"expectedComparison":null,"expectedTimeRange":"validated requested account-local period","expectedSelectedEntity":null,"expectedContextRequirements":["same account","account IANA zone","zero-to-nonzero lifecycle-start grain","active-day denominator","strict operator and threshold 6","ready_closed and legitimate_open inclusion","decision/incomplete partial-day coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This exact threshold classifies activity; it supplies no universal meaning of overtrading."},
  {"caseId":"C17-E11-03","caseType":"conversational_paraphrase","input":"Use locked Category 9 overtrading_frequency Version 1 with T=6 for validated Q2: per complete account-local active day count factual zero-to-nonzero starts from ready_closed plus legitimate_open lifecycles; breach when count is strictly greater than 6; return breach-day count divided by complete-active-day count, with needs_decision/incomplete days partial outside both numerator and denominator and zero denominator Unavailable.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity","overtrading_frequency"],"expectedFilters":["complete account-local active days under explicit T=6"],"expectedGroupings":[],"expectedOperators":["resolve overtrading to locked factual proxy family","count factual zero-to-nonzero ready_closed and legitimate_open starts per complete active day","apply strict >T breach predicate","divide breach-day count by complete-active-day count","exclude needs_decision/incomplete partial days from both numerator and denominator","return Unavailable for zero denominator"],"expectedComparison":null,"expectedTimeRange":"validated Q2 account-local days","expectedSelectedEntity":null,"expectedContextRequirements":["same account","locked Category 9 overtrading_frequency Version 1 formula","account IANA local-day mapping","threshold T=6 and strict > comparator","ready_closed plus legitimate_open starts","breach-day numerator and complete-active-day denominator","needs_decision/incomplete partial-day coverage outside both","zero denominator Unavailable","no motive inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The complete Version 1 proxy is descriptive and does not prove overtrading, motive, or discipline."},
  {"caseId":"C17-E11-04","caseType":"trader_slang","input":"Show days I went click-crazy, explicitly meaning more than 20 accepted execution-grain facts per complete-coverage account-local active day in validated July, with strict comparator and factual execution-grain coverage; do not call executions trades or merge them into another canonical owner.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["complete active days with accepted execution-grain fact count strictly greater than 20"],"expectedGroupings":["account-local day"],"expectedOperators":["resolve slang to explicit accepted-execution-grain threshold through ambiguity only","count accepted execution-grain facts by local day without naming a merged metric owner","apply strict greater-than 20"],"expectedComparison":null,"expectedTimeRange":"validated July under authorized account IANA zone","expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted execution grain","complete active-day denominator","strict threshold 20","account IANA zone","factual execution-grain coverage","no trade-count motive or invented canonical-owner substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit factual threshold remains an ambiguity-owned route and does not create or merge an execution_count concept."},
  {"caseId":"C17-E11-05","caseType":"abbreviation","input":"Does OT mean overtrading, a ticker, an abbreviation, a saved rule, or a label here?","expectedPrimaryIntent":"diagnose_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve ticker abbreviation rule label and concept candidates","ask token class before standard resolution"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 exact token/class/version/collision check","accepted query unchanged","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does OT mean overtrading, a ticker, an abbreviation, a saved rule, or a label here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No threshold, denominator, rule, proxy, baseline, or judgment is inferred."},
  {"caseId":"C17-E11-06","caseType":"misspelling","input":"Was I overtradding in July?","expectedPrimaryIntent":"diagnose_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate overtrading as fuzzy candidate only","run Category 16 collision checks","clarify definition family"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","fuzzy candidate not accepted meaning","accepted query unchanged","Category 15 pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean overtrading under a saved rule, an explicit threshold and denominator, a locked proxy, a baseline comparison, or your own judgment?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A spelling correction cannot choose the standard."},
  {"caseId":"C17-E11-07","caseType":"noisy_input","input":"july overtrade = >6 lifecycle starts / complete active acct-local day strict; IANA America/New_York; partial unavailable; coverage","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["complete active days with lifecycle-start count strictly greater than 6"],"expectedGroupings":["account-local day"],"expectedOperators":["resolve noisy explicit threshold/denominator","count factual lifecycle starts","apply strict predicate","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated July America/New_York local days","expectedSelectedEntity":null,"expectedContextRequirements":["same account","America/New_York IANA zone","lifecycle-start grain","threshold 6/operator >","complete active-day denominator","partial-day coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no threshold or denominator contract."},
  {"caseId":"C17-E11-08","caseType":"command","input":"Evaluate active Maximum Daily Trades rule version 3 and return applicable days, breaches, nonbreaches, partial/unavailable days, and chronological coverage without exposing private rule text.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity","rule_adherence"],"expectedFilters":["applicable saved rule version 3 days"],"expectedGroupings":["breach","nonbreach"],"expectedOperators":["validate rule version/effective scope","evaluate governed event facts","keep partial days outside breach/nonbreach"],"expectedComparison":null,"expectedTimeRange":"validated requested effective scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","rule version 3","event grain threshold comparator timezone","chronological barriers","coverage","no private rule text or IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Evaluation does not mutate the rule or diagnose motive."},
  {"caseId":"C17-E11-09","caseType":"fragment","input":"my own journal judgment: overtraded=yes on 2026-07-15; preserve as authored label, no inferred threshold","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["explicit trader-authored overtraded judgment on validated local date"],"expectedGroupings":[],"expectedOperators":["resolve to trader-authored judgment family","retrieve exact authored state","perform no formula or motive inference"],"expectedComparison":null,"expectedTimeRange":"validated account-local date 2026-07-15","expectedSelectedEntity":null,"expectedContextRequirements":["same account","explicit authored judgment and date","association/evidence coverage","no private note text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A personal judgment is not converted into a universal analytic threshold."},
  {"caseId":"C17-E11-10","caseType":"follow_up","input":"For the trusted accepted greater-than-6 lifecycle-starts per complete active day query, keep grain, denominator, operator, timezone, barriers, and coverage; change only the threshold to 8.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["complete active days with lifecycle-start count strictly greater than 8"],"expectedGroupings":["account-local day"],"expectedOperators":["reuse trusted typed threshold query","validate threshold replacement","reclassify covered days"],"expectedComparison":null,"expectedTimeRange":"retained validated account-local scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","retained grain/denominator/operator/timezone/barriers","new threshold 8","coverage","atomic validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the threshold changes; no saved rule is edited."},
  {"caseId":"C17-E11-11","caseType":"correction","input":"I meant compare the selected complete account-local day's factual zero-to-nonzero lifecycle-start count against the median count of the immediately preceding 60 complete active days, not evaluate my saved rule; count ready_closed plus legitimate_open starts, treat needs_decision/incomplete days as partial, require all 60 complete predecessors, define an even-sample median as the arithmetic mean of sorted positions 30 and 31, and classify above baseline only when target count is strictly greater than the median, with equality non-above.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["selected complete target active day","immediately preceding 60 complete active days"],"expectedGroupings":["selected target day","preceding-60-complete-active-day baseline"],"expectedOperators":["validate family replacement atomically","build deterministic account-local active-day order under authorized IANA timezone","count factual zero-to-nonzero ready_closed plus legitimate_open starts per complete day","keep needs_decision/incomplete days partial and outside complete-day samples","select immediately preceding 60 complete active days or return Unavailable for insufficient history","sort 60 baseline counts and average positions 30 and 31 for the exact median","compare selected target-day count strictly greater than baseline median with equality classified non-above"],"expectedComparison":"selected target-day lifecycle-start count strictly above versus not above the immediately preceding-60-complete-day median","expectedTimeRange":"selected validated account-local active day and its immediately preceding 60 complete active days","expectedSelectedEntity":"trusted selected complete account-local active day","expectedContextRequirements":["trusted accepted query and selected day","same account","authorized account IANA timezone","factual zero-to-nonzero lifecycle-start grain","ready_closed plus legitimate_open starts","needs_decision/incomplete partial-day barriers","exact immediately preceding 60 complete-day population","insufficient history Unavailable","even-sample median arithmetic mean of sorted positions 30 and 31","target statistic is selected-day count","strict greater-than direction with equality non-above","samples and coverage","prior state unchanged until valid"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The deterministic baseline comparison reports insufficient history and partial-day coverage, edits no saved rule, and proves no behavioral cause."},
  {"caseId":"C17-E11-12","caseType":"comparison","input":"Compare July versus June Category 9 overtrading_frequency Version 1 independently per side using T=6: count factual zero-to-nonzero ready_closed plus legitimate_open starts per complete account-local active day, breach when strictly greater than 6, divide breach days by complete days, keep needs_decision/incomplete days partial outside both numerator and denominator, and return either side Unavailable if its denominator is zero.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity","overtrading_frequency"],"expectedFilters":["complete account-local active days under T=6 independently per side"],"expectedGroupings":["validated July","validated June"],"expectedOperators":["calculate Version 1 factual start counts independently for July and June","apply strict >6 breach predicate independently per side","divide each breach-day count by its complete-active-day count","exclude each side's needs_decision/incomplete partial days from numerator and denominator","return a side Unavailable for zero denominator","compare only compatible available rates"],"expectedComparison":"independently calculated July versus June overtrading_frequency Version 1","expectedTimeRange":"validated June and July account-local periods","expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 9 Version 1","authorized IANA timezone","ready_closed plus legitimate_open factual starts","threshold T=6 and strict >","independent breach-day numerators and complete-day denominators","independent partial-day coverage","independent zero-denominator Unavailable state","side samples","no cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each side is computed and availability-checked independently; compatible proxy rates prove neither motive nor discipline."},
  {"caseId":"C17-E11-13","caseType":"ranking","input":"Rank the top five complete-coverage account-local July days by the explicit factual zero-to-nonzero lifecycle-start count owner, with approved exact-value ties and partial days excluded visibly; do not rank generic overtrading or call lifecycle starts trade_count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["complete-coverage active days"],"expectedGroupings":["account-local day"],"expectedOperators":["count factual zero-to-nonzero lifecycle starts per day under the explicit owner","rank descending N 5 with approved ties","report partial-day coverage"],"expectedComparison":null,"expectedTimeRange":"validated July account-local days","expectedSelectedEntity":null,"expectedContextRequirements":["same account","explicit lifecycle-start fact owner and grain","complete-day denominator","positive N 5","tie policy","partial-day coverage","no trade_count or universal threshold substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking explicit factual lifecycle-start counts is not trade_count or a judgment about overtrading."},
  {"caseId":"C17-E11-14","caseType":"negation","input":"Use active Maximum Daily Trades rule version 3 breaches, not a universal trades-per-day threshold, execution count, baseline comparison, or motive diagnosis.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity","rule_adherence"],"expectedFilters":["applicable saved rule version 3 periods"],"expectedGroupings":[],"expectedOperators":["exclude threshold-only execution baseline and motive branches","evaluate exact saved rule"],"expectedComparison":null,"expectedTimeRange":"validated effective rule scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","rule identity/version/applicability","governed event/comparator/threshold","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation supplies no substitute universal standard."},
  {"caseId":"C17-E11-15","caseType":"exclusion","input":"For explicit greater-than-6 lifecycle starts per complete active day, exclude partial days from both breach and nonbreach sets, keep them visible as unavailable, and report numerator, denominator, and exclusions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["complete active days under strict threshold 6"],"expectedGroupings":["known breach","known nonbreach"],"expectedOperators":["count covered lifecycle starts","keep partial days outside both groups","report exact numerator/denominator/coverage"],"expectedComparison":null,"expectedTimeRange":"validated requested account-local scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","lifecycle-start grain","strict threshold 6","complete-active-day denominator","decision/incomplete barriers","no partial-as-nonbreach"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unknown chronology cannot become a factual nonbreach."},
  {"caseId":"C17-E11-16","caseType":"multi_filter","input":"Show validated July account-local days with more than 6 completed Day-trade lifecycle starts, using a complete-day denominator and applying Day intent only after lifecycle identity and coverage are fixed.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":["validated July","Day intent output filter","completed lifecycle starts strictly greater than 6"],"expectedGroupings":["account-local day"],"expectedOperators":["build complete lifecycle-start population","fix day coverage","apply Day filter without changing barriers","classify threshold"],"expectedComparison":null,"expectedTimeRange":"validated July account-local days","expectedSelectedEntity":null,"expectedContextRequirements":["same account","completed lifecycle-start grain","Day intent facts","strict threshold 6","complete-day denominator","filter-order and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filtering cannot hide candidates that determine day completeness."},
  {"caseId":"C17-E11-17","caseType":"multi_part","input":"Resolve overtrading as locked Category 9 overtrading_frequency Version 1 with T=6: per complete account-local active day count factual zero-to-nonzero ready_closed plus legitimate_open starts, breach when strictly greater than 6, report breach-day numerator divided by complete-day denominator, keep needs_decision/incomplete days partial outside both, and return zero denominator Unavailable; then compare fee-complete net P/L separately without implying frequency caused performance.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["compare_groups","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["overtrading_ambiguity","overtrading_frequency","net_pnl"],"expectedFilters":["complete account-local active days under T=6","eligible fee-complete trades"],"expectedGroupings":["known breach days","known nonbreach days"],"expectedOperators":["count Version 1 factual ready_closed plus legitimate_open starts per complete active day","apply strict >6 breach predicate","divide breach-day numerator by complete-day denominator","exclude needs_decision/incomplete partial days from both","return zero denominator Unavailable","report samples and coverage","calculate net_pnl separately","compare facts"],"expectedComparison":"Version 1 breach-day versus nonbreach-day net_pnl","expectedTimeRange":"validated requested account-local scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 9 overtrading_frequency Version 1","account IANA timezone","factual zero-to-nonzero ready_closed plus legitimate_open starts","strict T=6","breach-day numerator/complete-day denominator","needs_decision/incomplete partial-day coverage","zero denominator Unavailable","net formula/currency","side coverage","no cause or motive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Complete Version 1 proxy classification and financial performance remain distinct owners."},
  {"caseId":"C17-E11-18","caseType":"ambiguous","input":"Was I overtrading?","expectedPrimaryIntent":"diagnose_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve saved-rule threshold/denominator locked-proxy baseline and authored-judgment candidates","ask definition standard only","create privacy-safe pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted query unchanged","Category 15 pending ambiguity state","event grain denominator threshold rule/proxy/baseline population/time and coverage staged","no motive inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which definition should overtrading use: your saved rule, an explicit threshold and denominator, a locked factual proxy, a historical or personal baseline, or your own subjective judgment?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The first question resolves one standard-family field only."},
  {"caseId":"C17-E11-19","caseType":"negative_example","input":"Count accepted execution-grain facts in validated July without classifying overtrading or naming a merged execution-count owner.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":[],"expectedFilters":["accepted execution-grain facts in validated July"],"expectedGroupings":[],"expectedOperators":["route to the explicit factual execution-grain request through its available owner","perform no behavioral classification or invented canonical merge"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted execution grain","factual coverage","no threshold judgment or invented owner"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A factual execution-grain count alone does not map to overtrading_ambiguity or create execution_count."},
  {"caseId":"C17-E11-20","caseType":"unsupported_data","input":"Read another account's private max-trades rule, diagnose why they overtrade, and tell them when to stop today.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["overtrading_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account rule access","reject motive diagnosis","reject prescriptive advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized account boundary","privacy-safe refusal","no private rule text or IDs","accepted state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private-rule access, motive diagnosis, and prescriptive trading advice are unsupported.","notes":"Unsupported is distinct from an unavailable rule evaluation."},
  {"caseId":"C17-E11-21","caseType":"selected_entity_context","input":"For the trusted selected account-local day, evaluate active Maximum Daily Trades rule version 3 after server revalidation, using its governed lifecycle-start grain and reporting breach/nonbreach/partial coverage.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity","rule_adherence"],"expectedFilters":["selected day applicable rule version 3"],"expectedGroupings":[],"expectedOperators":["revalidate selected day/account","validate rule applicability","evaluate governed facts"],"expectedComparison":null,"expectedTimeRange":"server-validated selected account-local day","expectedSelectedEntity":"server-validated selected account-local day","expectedContextRequirements":["trusted selected entity","same account","rule identity/version","event grain/threshold/comparator","chronology and coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies a day, not a universal overtrading standard."},
  {"caseId":"C17-E11-22","caseType":"cross_category","input":"Calculate Category 9 overtrading_frequency Version 1 with T=6 while Category 16 guards OT collisions, Category 15 retains state, Category 13 resolves account-local dates, and Category 8 supplies factual zero-to-nonzero starts: count ready_closed plus legitimate_open starts per complete active day, breach when strictly greater than 6, divide breach days by complete days, keep needs_decision/incomplete days partial outside both numerator and denominator, and return zero denominator Unavailable; make no motive, advice, prediction, mutation, or runtime claim.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["overtrading_ambiguity","overtrading_frequency"],"expectedFilters":["complete account-local active days under T=6"],"expectedGroupings":[],"expectedOperators":["route ambiguity through Category 17","guard token through Category 16","retain state through Category 15","resolve IANA dates through Category 13","consume ready_closed plus legitimate_open starts and partial barriers through Category 8","apply strict >6 breach predicate","divide breach-day count by complete-day count","exclude needs_decision/incomplete partial days from both","return zero denominator Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated requested account-local period","expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 9 overtrading_frequency Version 1","T=6 strict > comparator","authorized IANA date mapping","factual ready_closed plus legitimate_open starts","breach-day numerator/complete-day denominator","needs_decision/incomplete partial-day coverage","zero denominator Unavailable","samples","no motive cause advice prediction mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition preserves the complete Version 1 proxy and its descriptive boundary."}
]
~~~

## Evaluation Array C17-E12 -- good_trade_ambiguity

~~~json
[
  {"caseId":"C17-E12-01","caseType":"canonical","input":"Classify eligible ready-closed trades as winning_trades members only when fee-complete net_pnl in USD is strictly greater than zero, with exact formula, currency, population, fee coverage, and loser, breakeven, and unknown states represented separately.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","winning_trades","net_pnl"],"expectedFilters":["eligible fee-complete ready_closed trades","selected-basis net_pnl USD strictly greater than zero"],"expectedGroupings":["winning_trades members","losers","breakeven","unknown or unavailable"],"expectedOperators":["resolve good to selected-basis outcome family","calculate locked net_pnl","apply strict >0 winning_trades membership","keep net_pnl <0 losers, =0 breakeven, and missing/ineligible unknown separate"],"expectedComparison":null,"expectedTimeRange":"validated requested close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same authorized account","ready_closed population","fee-complete net_pnl formula","USD currency","strict greater-than-zero winning_trades basis","loser/breakeven/unknown separation","fee/missing coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Winning-trade membership is a positive selected-basis outcome and does not prove good process, skill, or future edge."},
  {"caseId":"C17-E12-02","caseType":"formal_paraphrase","input":"Evaluate good trade under exact active Risk Per Trade rule version 2 adherence, using saved rule-evaluation facts, applicability, evidence, and unknown coverage; do not derive adherence from P/L.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","rule_adherence"],"expectedFilters":["applicable Risk Per Trade rule version 2 evaluations"],"expectedGroupings":["followed","broken"],"expectedOperators":["resolve good to exact rule-criterion family","validate rule/version/applicability","consume accepted evaluation facts"],"expectedComparison":null,"expectedTimeRange":"validated effective rule scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact saved rule/version 2","accepted followed/broken evaluation facts","applicability/evidence/unknown coverage","no private rule text or IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Rule adherence is a process criterion and remains independent of outcome."},
  {"caseId":"C17-E12-03","caseType":"conversational_paraphrase","input":"Show trades explicitly meeting my authorized active A+ Setup review criterion version 4, using its saved evaluation facts and member, nonmember, unknown, and inapplicable coverage.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","setup_discipline"],"expectedFilters":["A+ Setup criterion version 4 satisfied"],"expectedGroupings":[],"expectedOperators":["resolve good to exact setup/process criterion","validate version/applicability","retrieve covered accepted evaluations"],"expectedComparison":null,"expectedTimeRange":"validated requested effective scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","authorized criterion/version 4","accepted evaluation or association facts","member nonmember unknown inapplicable coverage","no outcome inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An explicit setup criterion supplies no generic quality score."},
  {"caseId":"C17-E12-04","caseType":"trader_slang","input":"Show my clean trades, explicitly meaning trades with active Good Process review label version 2 membership, with association coverage and no outcome substitution.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity"],"expectedFilters":["authorized active Good Process label version 2 members"],"expectedGroupings":[],"expectedOperators":["resolve slang using supplied label identity","validate class/version/applicability","retrieve covered associations"],"expectedComparison":null,"expectedTimeRange":"validated requested scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact label/class/version 2","association states","coverage","no P/L or skill inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang is resolved only because the authorized saved label is explicit."},
  {"caseId":"C17-E12-05","caseType":"abbreviation","input":"Does GT mean Good Trade label, a ticker, an abbreviation, or ordinary text here?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["good_trade_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve ticker abbreviation label and text candidates","ask token class before quality-family resolution"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 exact token/class/version/collision check","accepted query unchanged","privacy-safe pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does GT mean your Good Trade label, a ticker, an abbreviation, or ordinary text here?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No outcome, criterion, or label membership is inferred."},
  {"caseId":"C17-E12-06","caseType":"misspelling","input":"Was this a gud trade?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["good_trade_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate good trade as fuzzy candidate only","clarify family before evaluation","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted selection still required","same account","Category 16 fuzzy/collision check","accepted query unchanged","no automatic quality"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean good trade by outcome, an exact rule/setup/plan/risk or process criterion, or an authorized saved review label?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fuzzy correction cannot choose the standard or entity."},
  {"caseId":"C17-E12-07","caseType":"noisy_input","input":"july good = winning_trades where feecomplete readyclosed net_pnl USD >0; losers <0, breakeven =0, unknown separate; coverage; no process claim","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","winning_trades","net_pnl"],"expectedFilters":["ready_closed fee-complete net_pnl USD strictly greater than zero winning_trades","validated July"],"expectedGroupings":["winning_trades members","losers","breakeven","unknown"],"expectedOperators":["resolve noisy input to explicit outcome family","calculate locked net_pnl","apply strict >0 winning_trades membership","separate <0 losers =0 breakeven and unknown"],"expectedComparison":null,"expectedTimeRange":"validated July closing-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","net_pnl formula/USD/fee coverage","ready_closed population","strict >0 winning membership","loser/breakeven/unknown separation","no process or edge inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no selected-basis winning_trades outcome contract."},
  {"caseId":"C17-E12-08","caseType":"command","input":"Evaluate exact Plan Followed criterion version 3 from accepted saved evaluation facts and report applicable, followed, broken, unknown, and missing-evidence counts without exposing private criterion text.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","plan_adherence"],"expectedFilters":["applicable Plan Followed criterion version 3 evaluations"],"expectedGroupings":["followed","broken"],"expectedOperators":["validate exact criterion version/applicability","consume accepted evaluation facts","keep unknown outside both"],"expectedComparison":null,"expectedTimeRange":"validated requested effective scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","criterion/version 3","accepted evaluation facts","applicability/evidence coverage","no private text or IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command evaluates existing facts and creates no criterion or review."},
  {"caseId":"C17-E12-09","caseType":"fragment","input":"saved Good Trade review label v1; active; explicit associations; coverage; no outcome inference","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity"],"expectedFilters":["active Good Trade review label version 1 membership"],"expectedGroupings":[],"expectedOperators":["resolve to saved-label family","validate exact class/version/applicability","retrieve covered associations"],"expectedComparison":null,"expectedTimeRange":"validated requested scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","authorized review label/version 1","association states","coverage","no private label text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Label membership is not reconstructed from outcome, chart, or note text."},
  {"caseId":"C17-E12-10","caseType":"follow_up","input":"For that trusted accepted Good Trade label version 1 member set, keep identity, associations, applicability, and coverage; change only the downstream metric to fee-complete net P/L in USD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","net_pnl"],"expectedFilters":["retained covered Good Trade label version 1 members","eligible fee-complete ready_closed trades"],"expectedGroupings":[],"expectedOperators":["reuse trusted typed label query","revalidate authorization","calculate locked net_pnl over retained identities"],"expectedComparison":null,"expectedTimeRange":"retained validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same account","retained label/class/version/associations","net formula/USD","coverage","atomic validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric revision does not redefine good-trade membership."},
  {"caseId":"C17-E12-11","caseType":"correction","input":"I meant exact Risk Per Trade rule version 2 adherence, not profitable outcome; preserve the prior accepted query until the rule-family replacement validates with applicability and evidence coverage.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","rule_adherence"],"expectedFilters":["applicable Risk Per Trade rule version 2 evaluations"],"expectedGroupings":[],"expectedOperators":["validate family replacement atomically","consume accepted rule-evaluation facts","replace prior query only after validation"],"expectedComparison":null,"expectedTimeRange":"retained validated effective scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","rule/version/applicability","accepted evaluation facts","prior state unchanged until valid","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A winning outcome remains distinct from good process."},
  {"caseId":"C17-E12-12","caseType":"comparison","input":"Compare fee-complete net P/L for known Good Process label version 2 members versus known nonmembers in validated Q2, keeping unknown associations outside both sides and reporting compatible coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","net_pnl"],"expectedFilters":["covered Good Process label version 2 associations","eligible fee-complete ready_closed trades"],"expectedGroupings":["known label members","known label nonmembers"],"expectedOperators":["validate explicit label associations","calculate locked net_pnl per side","compare compatible populations"],"expectedComparison":"Good Process label member versus nonmember net_pnl","expectedTimeRange":"validated Q2","expectedSelectedEntity":null,"expectedContextRequirements":["same account","label class/version/applicability","unknown outside both","locked net formula/USD","side samples and coverage","no cause or skill inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Label association and outcome remain separate facts."},
  {"caseId":"C17-E12-13","caseType":"ranking","input":"Rank the top five authorized setup-criterion groups by fee-complete net P/L in validated Q3, using exact criterion versions, eligible ready-closed populations, approved exact-value ties, and per-group coverage; do not rank generic goodness.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","net_pnl"],"expectedFilters":["covered authorized criterion evaluations","eligible fee-complete ready_closed trades"],"expectedGroupings":["exact authorized setup criteria and versions"],"expectedOperators":["resolve criterion identities","calculate locked net_pnl per group","rank descending N 5 with approved ties"],"expectedComparison":null,"expectedTimeRange":"validated Q3","expectedSelectedEntity":null,"expectedContextRequirements":["same account","criterion identities/versions/applicability","positive N 5","tie policy","net formula/USD","per-group samples and coverage","no generic quality score"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking uses a declared financial metric, not universal goodness."},
  {"caseId":"C17-E12-14","caseType":"negation","input":"Define good by exact active Plan Followed criterion version 3, not profitable outcome, saved Good Trade label, chart appearance, or future potential.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","plan_adherence"],"expectedFilters":["applicable Plan Followed version 3 evaluations"],"expectedGroupings":[],"expectedOperators":["exclude outcome label chart and prediction branches","evaluate exact criterion facts"],"expectedComparison":null,"expectedTimeRange":"validated effective criterion scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","criterion/version/applicability","accepted evaluation facts","coverage","no outcome or edge substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation cannot invent another process criterion."},
  {"caseId":"C17-E12-15","caseType":"exclusion","input":"For Good Trade label version 1, exclude unknown or missing associations from both members and nonmembers, retain inapplicable records separately, and report all association coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity"],"expectedFilters":["covered Good Trade label version 1 associations"],"expectedGroupings":["known member","known nonmember"],"expectedOperators":["validate exact label association","keep unknown outside set and complement","report applicability and coverage"],"expectedComparison":null,"expectedTimeRange":"validated requested scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","label/class/version/status","member nonmember unknown inapplicable counts","no unknown-as-false"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Missing association is not evidence of a bad trade."},
  {"caseId":"C17-E12-16","caseType":"multi_filter","input":"Retrieve authorized long NVDA ready-closed trades in validated July that explicitly satisfy active A+ Setup criterion version 4, with filtered criterion and evidence coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","setup_discipline"],"expectedFilters":["exact NVDA","long","ready_closed","A+ Setup criterion version 4 satisfied"],"expectedGroupings":[],"expectedOperators":["validate criterion identity before filters","apply authorized filters","report filtered evaluation coverage"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact ticker","criterion/version/applicability","accepted evaluation and evidence coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker, side, and result filters cannot infer criterion satisfaction."},
  {"caseId":"C17-E12-17","caseType":"multi_part","input":"Resolve good as exact Plan Followed criterion version 3, report followed/broken/unknown/applicability coverage, then compare fee-complete net P/L separately without implying adherence caused outcome or predicts edge.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_rule","calculate_metric","inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["good_trade_ambiguity","plan_adherence","net_pnl"],"expectedFilters":["covered Plan Followed version 3 evaluations","eligible fee-complete ready_closed trades"],"expectedGroupings":["known followed","known broken"],"expectedOperators":["validate exact criterion facts","report coverage","calculate net_pnl per side","compare facts"],"expectedComparison":"Plan Followed versus broken net_pnl","expectedTimeRange":"validated effective criterion and trade scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","criterion/version/applicability/evidence","locked net formula/USD","unknown outside sides","side samples and coverage","no cause or prediction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Process classification and financial performance remain distinct owners."},
  {"caseId":"C17-E12-18","caseType":"ambiguous","input":"Was this a good trade?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["good_trade_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve outcome rule/setup/plan/risk/process-criterion and authorized-label candidates","ask definition family only","create privacy-safe pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted selected entity still required","same account","accepted query unchanged","Category 15 pending ambiguity state","outcome basis criterion/version label/association population evidence and coverage staged","no generic goodness"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should good trade mean its outcome, an exact rule/setup/plan/risk or broader-process criterion, or an authorized saved review label?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The first question resolves one definition-family field only."},
  {"caseId":"C17-E12-19","caseType":"negative_example","input":"Summarize my authorized trader profile without classifying any trade as good or bad.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized profile summary request"],"expectedGroupings":[],"expectedOperators":["route to profile-summary owner","perform no trade-quality classification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","privacy-safe aggregate output","no inferred trade labels"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A profile summary does not map to good_trade_ambiguity."},
  {"caseId":"C17-E12-20","caseType":"unsupported_data","input":"Use another account's private Good Trade label, judge whether they are a good trader, and recommend a trade for tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["good_trade_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-label access","reject person/skill judgment","reject advice and prediction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized account boundary","privacy-safe refusal","no private label text or IDs","accepted state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private-label access, person or skill judgment, and future trading advice are unsupported.","notes":"Unsupported claims are not missing-evidence classifications."},
  {"caseId":"C17-E12-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed trade, test winning_trades membership by whether fee-complete net_pnl in USD is strictly greater than zero after server revalidation; represent net_pnl below zero as loser, equal to zero as breakeven, and missing or ineligible as unknown, with fee/currency/eligibility coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","winning_trades","net_pnl"],"expectedFilters":["selected trade fee-complete net_pnl USD strictly greater than zero winning_trades membership"],"expectedGroupings":["winning member","loser","breakeven","unknown"],"expectedOperators":["revalidate selected trade","calculate locked net_pnl","apply strict >0 winning_trades membership","separate <0 loser =0 breakeven and missing/ineligible unknown"],"expectedComparison":null,"expectedTimeRange":"selected trade accepted close event","expectedSelectedEntity":"server-validated selected ready_closed trade","expectedContextRequirements":["trusted selected entity","same account","ready_closed eligibility","fee-complete net_pnl formula/USD","strict >0 membership","loser/breakeven/unknown separation","fee/currency/eligibility coverage","no process skill or edge inference","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies the entity; the current turn supplies exact winning_trades membership and separate nonwinning states."},
  {"caseId":"C17-E12-22","caseType":"cross_category","input":"Evaluate exact Plan Followed criterion version 3 while Category 16 guards label/ticker collisions, Category 15 retains accepted state, Category 9 supplies accepted adherence facts, and Category 2 supplies net P/L only as a separate requested result; make no cause, skill, advice, prediction, mutation, or runtime claim.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["good_trade_ambiguity","plan_adherence","net_pnl"],"expectedFilters":["applicable Plan Followed version 3 evaluations"],"expectedGroupings":[],"expectedOperators":["route ambiguity through Category 17","guard tokens through Category 16","retain state through Category 15","consume adherence through Category 9","calculate separate net_pnl through Category 2 if requested"],"expectedComparison":null,"expectedTimeRange":"validated effective criterion and trade scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","criterion/version/applicability/evidence","locked net formula/currency if requested","coverage","no cause skill advice prediction mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition never turns outcome into process quality or future edge."}
]
~~~

## Evaluation Array C17-E13 -- bad_trade_ambiguity

~~~json
[
  {"caseId":"C17-E13-01","caseType":"canonical","input":"Classify eligible ready-closed trades as bad outcome only when fee-complete net_pnl in USD is strictly less than zero, keeping winners, breakeven, and unknown separate with coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","losing_trades","net_pnl"],"expectedFilters":["ready_closed fee-complete net_pnl USD strictly below zero"],"expectedGroupings":["losers","winners","breakeven","unknown"],"expectedOperators":["resolve bad to selected-basis outcome","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","classify <0 loss and separate other states"],"expectedComparison":null,"expectedTimeRange":"validated close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","ready_closed population","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","strict <0","separate nonloss/unknown coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A losing outcome proves no bad process, motive, cause, or person trait."},
  {"caseId":"C17-E13-02","caseType":"formal_paraphrase","input":"Evaluate bad trade as exact active Risk Per Trade rule version 2 broken, using accepted saved evaluation facts, applicability, evidence, and coverage; do not infer breach from loss.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","rule_adherence"],"expectedFilters":["applicable Risk Per Trade rule version 2 evaluations"],"expectedGroupings":["broken","followed"],"expectedOperators":["resolve bad to rule criterion","validate version/applicability","consume accepted evaluations"],"expectedComparison":null,"expectedTimeRange":"validated effective rule scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","rule/version 2","accepted broken/followed facts","evidence/unknown coverage","no private text/IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Rule breach and outcome remain independent."},
  {"caseId":"C17-E13-03","caseType":"conversational_paraphrase","input":"Show trades explicitly marked with my authorized active Chased Entry mistake version 3, with member, nonmember, unknown, inapplicable, and evidence coverage.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_mistake_language","mistake"],"expectedFilters":["active Chased Entry mistake version 3 explicit association"],"expectedGroupings":["member","nonmember","unknown","inapplicable"],"expectedOperators":["resolve one unique active current-version same-account class-compatible collision-free mistake match","retrieve explicit mistake associations","return Unavailable when recognition or association evidence is unavailable"],"expectedComparison":null,"expectedTimeRange":"validated requested scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","authorized mistake/version 3","explicit association and provenance","member/nonmember/unknown/inapplicable coverage","no frequency formula","no outcome/motive inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only trader-authorized mistake evidence qualifies; no mistake_frequency metric is invoked."},
  {"caseId":"C17-E13-04","caseType":"trader_slang","input":"Show my trash trades, explicitly meaning active Bad Process review label version 2 members, with association coverage and no outcome substitution.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_tag_language","custom_tag"],"expectedFilters":["explicit Bad Process custom_tag version 2 members"],"expectedGroupings":["member","nonmember","unknown","inapplicable"],"expectedOperators":["resolve one unique active current-version same-account class-compatible collision-free tag match","retrieve explicit custom_tag associations","return Unavailable when recognition or association evidence is unavailable"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","authorized tag/class/version 2","member/nonmember/unknown/inapplicable association coverage","no outcome substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit custom_tag facts make slang safe; no generic judgment is made."},
  {"caseId":"C17-E13-05","caseType":"abbreviation","input":"Does BT mean Bad Trade label, a ticker, an abbreviation, or ordinary text?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["bad_trade_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve ticker abbreviation label text candidates","ask token class first"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 collision/class/version check","accepted query unchanged","pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does BT mean your Bad Trade label, a ticker, an abbreviation, or ordinary text?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No badness owner is inferred."},
  {"caseId":"C17-E13-06","caseType":"misspelling","input":"Was this a baad trade?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["bad_trade_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate bad trade as fuzzy candidate","clarify family","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted entity still required","same account","Category 16 fuzzy/collision guard","no automatic judgment"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean bad by outcome, an exact process criterion, an explicit mistake, or an authorized saved label?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling correction cannot select the owner."},
  {"caseId":"C17-E13-07","caseType":"noisy_input","input":"july bad = feecomplete net_pnl USD <0 readyclosed; winners zero unknown separate; coverage; no motive","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","losing_trades","net_pnl"],"expectedFilters":["validated July ready_closed net_pnl USD <0"],"expectedGroupings":["losers","winners","breakeven","unknown"],"expectedOperators":["resolve outcome family","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","classify exact states"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","ready_closed","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","strict <0","coverage","no motive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no outcome contract."},
  {"caseId":"C17-E13-08","caseType":"command","input":"Evaluate exact Plan Followed criterion version 3 as bad only when accepted evaluation is broken; report followed, broken, unknown, inapplicable, and evidence coverage.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","plan_adherence"],"expectedFilters":["applicable Plan Followed version 3 evaluations"],"expectedGroupings":["broken","followed"],"expectedOperators":["validate criterion/version","consume accepted facts","keep unknown separate"],"expectedComparison":null,"expectedTimeRange":"validated effective scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","criterion/version 3","applicability/evidence coverage","no private text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Existing evaluation only; no mutation or outcome inference."},
  {"caseId":"C17-E13-09","caseType":"fragment","input":"saved Bad Trade review label v1; active; explicit association; coverage","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_tag_language","custom_tag"],"expectedFilters":["explicit Bad Trade custom_tag version 1 association"],"expectedGroupings":["member","nonmember","unknown","inapplicable"],"expectedOperators":["resolve one unique active current-version same-account class-compatible collision-free tag match","retrieve explicit custom_tag associations","return Unavailable when recognition or association evidence is unavailable"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","authorized tag/version 1","member/nonmember/unknown/inapplicable association coverage","no private text or raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The custom_tag is not reconstructed from result or notes."},
  {"caseId":"C17-E13-10","caseType":"follow_up","input":"For the trusted Bad Trade label version 1 members, retain identities and coverage; change only downstream metric to gross_pnl USD.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_tag_language","custom_tag","gross_pnl"],"expectedFilters":["retained explicit custom_tag members","ready_closed trades"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed tag state","revalidate one unique active current-version same-account class-compatible collision-free match","retain member/nonmember/unknown/inapplicable association coverage","calculate gross_pnl or return Unavailable"],"expectedComparison":null,"expectedTimeRange":"retained scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted revision","same account","retained tag/class/version","explicit association coverage","gross/USD coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric change does not redefine custom_tag membership."},
  {"caseId":"C17-E13-11","caseType":"correction","input":"I meant exact Risk Per Trade rule version 2 broken, not losing outcome; preserve prior query until rule-family validation succeeds.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","rule_adherence"],"expectedFilters":["applicable rule version 2 evaluations"],"expectedGroupings":[],"expectedOperators":["validate replacement atomically","consume accepted evaluations","replace after validation"],"expectedComparison":null,"expectedTimeRange":"retained effective scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted query","same account","rule/version/applicability","prior state retained","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Loss does not imply rule breach."},
  {"caseId":"C17-E13-12","caseType":"comparison","input":"Compare net_pnl for known Chased Entry mistake version 3 members versus nonmembers, with unknown outside both and compatible fee/currency coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_mistake_language","mistake","net_pnl"],"expectedFilters":["explicit covered Chased Entry mistake version 3 associations","fee-complete ready_closed"],"expectedGroupings":["known members","known nonmembers"],"expectedOperators":["resolve one unique active current-version same-account class-compatible collision-free mistake match","build member and known-nonmember populations from explicit associations","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit per side","compare or return Unavailable"],"expectedComparison":"mistake member versus nonmember net_pnl","expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","explicit mistake/version association","unknown and inapplicable outside both","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","side coverage","no frequency formula or cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Association proves no motive, frequency formula, or causation."},
  {"caseId":"C17-E13-13","caseType":"ranking","input":"Rank top five authorized mistake groups by fee-complete net_pnl in Q3 with exact versions, ties, samples, and coverage; do not rank generic badness.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_mistake_language","mistake","net_pnl"],"expectedFilters":["explicit covered mistake associations","ready_closed fee-complete"],"expectedGroupings":["authorized exact active mistake/version groups"],"expectedOperators":["resolve each unique active current-version same-account class-compatible collision-free mistake match","group only explicit covered associations","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","rank N5 using approved deterministic privacy-safe ties over exact unrounded owner sort values"],"expectedComparison":null,"expectedTimeRange":"validated Q3","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact active mistake versions and association coverage","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","N5 and approved deterministic ties","samples/coverage","no raw IDs","no frequency formula or badness score"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Declared net_pnl, not frequency or generic judgment, drives rank."},
  {"caseId":"C17-E13-14","caseType":"negation","input":"Define bad by explicit Chased Entry mistake version 3, not loss, saved Bad Trade label, inferred motive, or chart appearance.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_mistake_language","mistake"],"expectedFilters":["explicit Chased Entry mistake version 3 association"],"expectedGroupings":["member","nonmember","unknown","inapplicable"],"expectedOperators":["exclude outcome/tag/motive/chart branches","resolve one unique active current-version same-account class-compatible collision-free mistake match","read explicit associations or return Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","mistake/version/provenance","member/nonmember/unknown/inapplicable coverage","no frequency formula"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation cannot invent another criterion or a mistake frequency metric."},
  {"caseId":"C17-E13-15","caseType":"exclusion","input":"For Bad Trade label version 1, keep unknown associations outside members and nonmembers, retain inapplicable separately, and report coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_tag_language","custom_tag"],"expectedFilters":["covered explicit Bad Trade custom_tag associations"],"expectedGroupings":["member","nonmember","unknown","inapplicable"],"expectedOperators":["resolve one unique active current-version same-account class-compatible collision-free tag match","exclude unknown from members and nonmembers","report association coverage or return Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","authorized tag/class/version","member/nonmember/unknown/inapplicable counts","no unknown-as-false","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Missing association evidence is not good or bad."},
  {"caseId":"C17-E13-16","caseType":"multi_filter","input":"Retrieve long NVDA ready-closed July trades explicitly carrying active Bad Process label version 2, with filtered association coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","user_tag_language","custom_tag"],"expectedFilters":["NVDA","long","ready_closed","explicit Bad Process custom_tag v2 member"],"expectedGroupings":[],"expectedOperators":["resolve one unique active current-version same-account class-compatible collision-free tag match","apply filters to explicit associations","report member/nonmember/unknown/inapplicable coverage or return Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact ticker","authorized tag/class/version 2","explicit association coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters cannot infer badness or custom_tag membership."},
  {"caseId":"C17-E13-17","caseType":"multi_part","input":"Resolve bad as Plan Followed version 3 broken, report followed/broken/unknown coverage, then compare net_pnl separately without cause or motive claims.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_rule","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","plan_adherence","net_pnl"],"expectedFilters":["covered criterion evaluations","fee-complete trades"],"expectedGroupings":["broken","followed"],"expectedOperators":["validate criterion","report coverage","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit per side","compare"],"expectedComparison":"broken versus followed net_pnl","expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","criterion/version/evidence","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","side coverage","no cause/motive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Process and outcome remain distinct."},
  {"caseId":"C17-E13-18","caseType":"ambiguous","input":"Was this a bad trade?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["bad_trade_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve outcome criterion mistake label candidates","ask family only","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted entity still required","same account","Category 15 pending state","basis/version/evidence/population/coverage staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should bad trade mean its outcome, an exact rule/setup/plan/risk or broader-process criterion, an explicit authorized mistake, or an authorized saved review label?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One definition-family field is asked first."},
  {"caseId":"C17-E13-19","caseType":"negative_example","input":"Summarize losing_trades without calling them bad trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["losing_trades"],"expectedFilters":["explicit selected-basis losses"],"expectedGroupings":[],"expectedOperators":["route to outcome owner","perform no quality classification"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","basis/currency/population","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Loss alone does not map to bad_trade_ambiguity."},
  {"caseId":"C17-E13-20","caseType":"unsupported_data","input":"Use another account's private Bad Trade label, diagnose why they fail, and tell them what to avoid tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["bad_trade_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account access","reject person/motive judgment","reject advice/prediction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["account boundary","privacy-safe refusal","no private text/IDs","state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private-label access, person or motive judgment, and future advice are unsupported.","notes":"Unsupported is distinct from unavailable evidence."},
  {"caseId":"C17-E13-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed trade, test fee-complete net_pnl USD <0 after revalidation and represent winner, breakeven, and unknown separately; call this bad outcome only.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","losing_trades","net_pnl"],"expectedFilters":["selected trade net_pnl <0"],"expectedGroupings":["loser","winner","breakeven","unknown"],"expectedOperators":["revalidate entity","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","classify exact states"],"expectedComparison":null,"expectedTimeRange":"selected close event","expectedSelectedEntity":"server-validated selected ready_closed trade","expectedContextRequirements":["same account","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","coverage","no process/motive inference","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection plus exact outcome basis supplies no quality judgment."},
  {"caseId":"C17-E13-22","caseType":"cross_category","input":"Evaluate Plan Followed version 3 broken while Category 16 guards collisions, Category 15 retains state, Category 9 supplies adherence, and Category 2 net_pnl remains separate; no cause, motive, advice, prediction, mutation, or runtime claim.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["bad_trade_ambiguity","plan_adherence","net_pnl"],"expectedFilters":["applicable criterion evaluations"],"expectedGroupings":[],"expectedOperators":["route ambiguity","guard tokens","retain state","consume adherence","calculate separate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit if requested"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","criterion/version/evidence","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","coverage","no cause/motive/advice/runtime"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition never turns outcome into bad process."}
]
~~~

## Evaluation Array C17-E14 -- normal_size_ambiguity

~~~json
[
  {"caseId":"C17-E14-01","caseType":"canonical","input":"For normal size, use entered share quantity from accepted opening, adding, and flip_opening allocation roles only; then report locked Category 6 size_relative_to_normal_size Unavailable because no approved baseline relation contract exists.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_ambiguity","size_relative_to_normal_size"],"expectedFilters":["accepted opening adding and flip_opening allocation roles"],"expectedGroupings":[],"expectedOperators":["resolve size_ambiguity to entered share quantity","sum accepted opening adding and flip_opening allocation quantities","exclude reducing closing and flip_closing","return locked relative-size owner Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated trade lifecycle scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted chronological allocation-role evidence","shares unit","included opening adding and flip_opening roles","excluded reducing closing and flip_closing roles","allocation quantity and role coverage","Category 6 locked Unavailable","missing baseline/formula/sample coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The size_ambiguity primitive and unit do not activate an unavailable relative formula."},
  {"caseId":"C17-E14-02","caseType":"formal_paraphrase","input":"Resolve maximum open quantity in shares, proposed personal trailing-20-ready-closed-trade median baseline version 1, minimum sample 20, and coverage; return size_relative_to_normal_size Unavailable under Category 6.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","maximum_position_size","size_relative_to_normal_size"],"expectedFilters":["proposed trailing-20 ready_closed baseline"],"expectedGroupings":[],"expectedOperators":["resolve measure/unit","validate baseline family/version/window/population/sample","return locked Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated target and trailing-20 population","expectedSelectedEntity":null,"expectedContextRequirements":["same account","maximum open quantity/shares","baseline v1/window/population","minimum sample 20","coverage","no invented relation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Complete proposed baseline facts still do not activate the locked unavailable relation."},
  {"caseId":"C17-E14-03","caseType":"conversational_paraphrase","input":"Show known membership in my authorized active Medium Share Size bucket version 2 after validating its complete saved definition; do not treat membership as relative-to-normal size.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_bucket"],"expectedFilters":["Medium Share Size size_bucket version 2 membership"],"expectedGroupings":[],"expectedOperators":["validate the complete size_bucket definition before membership","retrieve covered membership only","return Unavailable if any definition or membership fact is missing"],"expectedComparison":null,"expectedTimeRange":"validated effective-version scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved active effective version 2","share-quantity basis and shares unit","currency explicitly inapplicable","bounds and endpoint inclusivity","tie and gap-overlap policies","applicability","member/nonmember/unknown/inapplicable coverage","Category 6 relation remains Unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Complete Category 11 size_bucket membership remains membership-only and cannot become a baseline or ratio."},
  {"caseId":"C17-E14-04","caseType":"trader_slang","input":"Was I normal size or heavy, explicitly by maximum open quantity in shares against my proposed trailing-20 median baseline v1? Report relative calculation Unavailable.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","maximum_position_size","size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve slang using supplied measure/unit/baseline","validate proposed facts","return Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated trailing-20 scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","maximum quantity/shares","baseline v1/window/sample","locked Unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang supplies no approved relation."},
  {"caseId":"C17-E14-05","caseType":"abbreviation","input":"Does NS mean normal size, a ticker, an abbreviation, or a saved bucket?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["normal_size_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve class candidates","ask token class first"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 collision check","accepted query unchanged","pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does NS mean normal size, a ticker, an abbreviation, or a saved bucket?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No measure or bucket is inferred."},
  {"caseId":"C17-E14-06","caseType":"misspelling","input":"Was this nromal size?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["normal_size_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate fuzzy candidate","ask measure first","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted entity still required","same account","fuzzy guard","unit/baseline staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which size measure should define normal size?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Measure precedes unit and baseline."},
  {"caseId":"C17-E14-07","caseType":"noisy_input","input":"normal?? entered shares = accepted opening + adding + flip_opening allocations only; baseline trailing20 median v1 sample20 coverage; relative unavailable","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_ambiguity","size_relative_to_normal_size"],"expectedFilters":["accepted opening adding and flip_opening allocation roles"],"expectedGroupings":[],"expectedOperators":["sum covered accepted opening adding and flip_opening allocation quantities","exclude reducing closing and flip_closing","return locked relative-size Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated trailing-20","expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted allocation-role evidence","shares unit","allocation quantity and role coverage","baseline v1/sample20","locked Unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes neither the size_ambiguity primitive formula nor the capability boundary."},
  {"caseId":"C17-E14-08","caseType":"command","input":"Resolve entered share quantity as the sum of accepted opening, adding, and flip_opening allocation quantities only, then return size_relative_to_normal_size Unavailable with required future baseline/version/window/population/sample/formula/zero/coverage facts listed.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_ambiguity","size_relative_to_normal_size"],"expectedFilters":["accepted opening adding and flip_opening allocation roles"],"expectedGroupings":[],"expectedOperators":["sum covered included-role allocation quantities","exclude reducing closing and flip_closing","inspect relative capability","report missing contract"],"expectedComparison":null,"expectedTimeRange":"validated trade lifecycle scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted chronological allocation-role evidence","shares unit","allocation quantity and role coverage","truthful Unavailable","no relative-formula invention"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The size_ambiguity primitive is factual; relative Unavailable is not zero."},
  {"caseId":"C17-E14-09","caseType":"fragment","input":"Medium Share Size bucket v2 complete definition; bounds/endpoints/ties/effective basis/shares/currency-inapplicable/applicability/coverage; membership only; unknown separate; no relative normality","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_bucket"],"expectedFilters":["size_bucket v2 membership"],"expectedGroupings":["member","nonmember","unknown","inapplicable"],"expectedOperators":["validate complete size_bucket definition before membership","retrieve membership only","return Unavailable for incomplete definition or evidence"],"expectedComparison":null,"expectedTimeRange":"validated effective-version scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","active effective version 2","bounds and endpoint inclusivity","tie and gap-overlap policies","share-quantity basis and shares unit","currency explicitly inapplicable","applicability","member/nonmember/unknown/inapplicable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"size_bucket remains membership-only."},
  {"caseId":"C17-E14-10","caseType":"follow_up","input":"Keep trusted maximum open quantity measure; set unit to shares, then report relative-to-normal owner Unavailable without asking a baseline as if it could activate calculation.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","maximum_position_size","size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reuse measure","validate unit","return Unavailable"],"expectedComparison":null,"expectedTimeRange":"retained scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted query","same account","maximum quantity/shares","locked Unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unit resolution does not continue a futile activation path."},
  {"caseId":"C17-E14-11","caseType":"correction","input":"I meant known Medium Share Size size_bucket version 2 membership after complete-definition validation, not relative-to-normal calculation; preserve prior query until validation.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_bucket"],"expectedFilters":["size_bucket v2 membership"],"expectedGroupings":[],"expectedOperators":["validate family replacement and complete size_bucket definition","retain state until validation","retrieve membership only or return Unavailable"],"expectedComparison":null,"expectedTimeRange":"retained effective-version scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted query","same account","active effective version 2","bounds and endpoint inclusivity","tie and gap-overlap policies","share-quantity basis and shares unit","currency explicitly inapplicable","applicability and membership coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction activates only validated membership, never a Category 6 relation."},
  {"caseId":"C17-E14-12","caseType":"comparison","input":"After complete-definition validation, compare known Medium versus Large Share Size size_bucket v2 membership counts; keep unknown coverage and do not calculate normal-size ratios.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_bucket"],"expectedFilters":["covered size_bucket memberships"],"expectedGroupings":["Medium v2","Large v2"],"expectedOperators":["validate each complete size_bucket definition before membership","construct membership-only groups","count members only after validation","compare counts or return Unavailable"],"expectedComparison":"Medium versus Large size_bucket membership counts","expectedTimeRange":"validated effective-version scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","active effective versions","bounds and endpoint inclusivity","tie and gap-overlap policies","share-quantity basis and shares unit","currency explicitly inapplicable","applicability","side-specific member/nonmember/unknown/inapplicable samples and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Complete-definition validation precedes the membership count comparison; membership is not relative normality."},
  {"caseId":"C17-E14-13","caseType":"ranking","input":"Rank top five ready-closed trades by factual maximum open quantity in shares with approved deterministic privacy-safe ties and coverage; do not rank relative normality.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","maximum_position_size"],"expectedFilters":["known maximum open quantity shares"],"expectedGroupings":[],"expectedOperators":["read factual size","rank N5 over exact unrounded owner sort values","apply approved deterministic privacy-safe ties","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","maximum quantity/shares","N5","approved deterministic privacy-safe tie policy","exact unrounded owner sort values","coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Factual privacy-safe ranking avoids the unavailable relation."},
  {"caseId":"C17-E14-14","caseType":"negation","input":"Use completely defined Medium Share Size size_bucket v2 membership, not a default median, personal baseline, percentage, or relative formula.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_bucket"],"expectedFilters":["size_bucket v2 membership"],"expectedGroupings":[],"expectedOperators":["exclude baseline and formula branches","validate complete size_bucket definition before membership","return membership only or Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated effective-version scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","active effective version 2","bounds and endpoint inclusivity","tie and gap-overlap policies","share-quantity basis and shares unit","currency explicitly inapplicable","applicability and membership coverage","no defaults"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation supplies no relative owner; membership requires the complete saved definition."},
  {"caseId":"C17-E14-15","caseType":"exclusion","input":"After complete Medium size_bucket v2 definition validation, exclude unknown membership from members and nonmembers; report unknown/inapplicable coverage and no normal-size inference.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_bucket"],"expectedFilters":["covered size_bucket membership"],"expectedGroupings":["member","nonmember","unknown","inapplicable"],"expectedOperators":["validate complete size_bucket definition before membership","exclude unknown from member and nonmember","report membership-only coverage or return Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated effective-version scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","active effective version 2","bounds and endpoint inclusivity","tie and gap-overlap policies","share-quantity basis and shares unit","currency explicitly inapplicable","applicability","member/nonmember/unknown/inapplicable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unknown membership is neither nonmember nor nonnormal."},
  {"caseId":"C17-E14-16","caseType":"multi_filter","input":"Show July long NVDA trades with known Medium Share Size size_bucket v2 membership after complete-definition validation and with coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","size_bucket"],"expectedFilters":["July","NVDA","long","size_bucket v2 member"],"expectedGroupings":[],"expectedOperators":["validate complete size_bucket definition before membership","apply filters to proven members","report filtered membership coverage or return Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated July within effective version","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact ticker","active effective version 2","bounds and endpoint inclusivity","tie and gap-overlap policies","share-quantity basis and shares unit","currency explicitly inapplicable","applicability","filtered member/nonmember/unknown/inapplicable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters do not activate relative normality; size_bucket remains membership-only."},
  {"caseId":"C17-E14-17","caseType":"multi_part","input":"Resolve maximum open quantity in shares, report factual values and completely defined Medium size_bucket v2 membership, then explain size_relative_to_normal_size remains Unavailable.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","maximum_position_size","size_bucket","size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["read maximum position size","validate complete size_bucket definition before membership","report membership only or Unavailable","return relative-size Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated effective-version scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","maximum-open share measure/unit","active effective bucket version 2","bounds and endpoint inclusivity","tie and gap-overlap policies","share-quantity basis and shares unit","currency explicitly inapplicable","applicability and membership coverage","locked relative capability Unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Factual maximum, membership-only size_bucket, and unavailable relative owner remain separate."},
  {"caseId":"C17-E14-18","caseType":"ambiguous","input":"Was this normal size?","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["normal_size_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["ask measure first","stage unit","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["trusted entity still required","same account","Category 15 pending","unit/baseline staged","locked unavailable known"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which size measure should define normal size?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One field only; baseline cannot activate current capability."},
  {"caseId":"C17-E14-19","caseType":"negative_example","input":"Show factual entered share quantity as accepted opening, adding, and flip_opening allocation quantities only, without comparing it with normal.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["size_ambiguity"],"expectedFilters":["accepted opening adding and flip_opening allocation roles"],"expectedGroupings":[],"expectedOperators":["route to size_ambiguity primitive","sum covered included-role allocation quantities","exclude reducing closing and flip_closing","perform no relative classification"],"expectedComparison":null,"expectedTimeRange":"validated trade lifecycle scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted chronological allocation-role evidence","shares unit","allocation quantity and role coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The size_ambiguity primitive is not normal_size_ambiguity."},
  {"caseId":"C17-E14-20","caseType":"unsupported_data","input":"Use another account's private baseline, invent a normal-size formula, and tell me what size to trade.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["normal_size_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account access","reject invented formula","reject advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["account boundary","privacy-safe refusal","state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account baseline access, invented relative-size formula, and position-size advice are unsupported.","notes":"Unsupported differs from locked Unavailable."},
  {"caseId":"C17-E14-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report maximum open quantity in shares and completely defined Medium size_bucket v2 membership after revalidation; report relative normal size Unavailable.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["evaluate_label","inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","maximum_position_size","size_bucket","size_relative_to_normal_size"],"expectedFilters":["selected trade"],"expectedGroupings":[],"expectedOperators":["revalidate entity","read maximum position size","validate complete size_bucket definition before membership","return membership only or Unavailable","return relative-size Unavailable"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle within effective version","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["same account","maximum-open shares","active effective bucket version 2","bounds and endpoint inclusivity","tie and gap-overlap policies","share-quantity basis and shares unit","currency explicitly inapplicable","applicability and membership coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies no baseline formula; size_bucket remains membership-only."},
  {"caseId":"C17-E14-22","caseType":"cross_category","input":"Read Category 6 maximum_position_size and completely defined Category 11 size_bucket membership while Category 15 retains state and Category 16 guards collisions; size_relative_to_normal_size stays Unavailable with no advice or runtime claim.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["normal_size_ambiguity","maximum_position_size","size_bucket","size_relative_to_normal_size"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["route ambiguity","guard tokens","retain state","read maximum position size","validate complete size_bucket definition before membership","return membership only or Unavailable","return locked relative Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated effective-version scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","maximum-open measure/unit","active effective bucket version","bounds and endpoint inclusivity","tie and gap-overlap policies","basis unit and currency applicability","membership applicability and coverage","locked relative capability","no advice/mutation/runtime"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Complete size_bucket membership never activates the relation."}
]
~~~

## Evaluation Array C17-E15 -- large_loss_ambiguity

~~~json
[
  {"caseId":"C17-E15-01","caseType":"canonical","input":"Retrieve ready-closed trades whose fee-complete net_pnl loss has absolute magnitude greater than or equal to 500 USD, equality included, with population, fee, currency, member, nonmember, and unknown coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl","losing_trades"],"expectedFilters":["ready_closed net_pnl <0","absolute loss magnitude >=500 USD"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","transform losses to absolute magnitude","apply inclusive >=500 predicate"],"expectedComparison":null,"expectedTimeRange":"validated close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","absolute magnitude","threshold 500","operator >= with equality included","ready_closed population","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exact fixed threshold defines membership without a universal meaning of large."},
  {"caseId":"C17-E15-02","caseType":"formal_paraphrase","input":"Classify signed fee-complete net_pnl less than or equal to -500 USD as large loss, including equality, for eligible ready-closed trades with exact fees and coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl","losing_trades"],"expectedFilters":["signed net_pnl <= -500 USD"],"expectedGroupings":["member","nonmember"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","preserve signed representation","apply <= -500 inclusive","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","signed representation","threshold -500","operator <= equality included","ready_closed","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Signed and absolute routes are never mixed."},
  {"caseId":"C17-E15-03","caseType":"conversational_paraphrase","input":"Show ready-closed fee-complete losses under this explicit typed fixed predicate: absolute net USD magnitude in [500,1000), lower included and upper excluded; this is not a saved bucket.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["explicit typed fixed absolute net loss predicate [500,1000) USD"],"expectedGroupings":["member","nonmember","unknown"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply lower-inclusive upper-exclusive fixed predicate","report predicate coverage"],"expectedComparison":null,"expectedTimeRange":"validated close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","typed predicate not saved bucket","absolute net representation","bounds 500 and 1000","closed-open endpoints","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","ready_closed population and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit current-query predicate creates no fictional saved loss bucket."},
  {"caseId":"C17-E15-04","caseType":"trader_slang","input":"Show big red ones, explicitly meaning ready-closed fee-complete net USD loss magnitude >500, equality excluded, with coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl","losing_trades"],"expectedFilters":["absolute net loss >500 USD"],"expectedGroupings":[],"expectedOperators":["resolve slang to explicit predicate","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply strict >500","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","absolute net representation","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","threshold 500","strict > equality excluded","ready_closed coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All facts are explicit; slang adds no judgment."},
  {"caseId":"C17-E15-05","caseType":"abbreviation","input":"Does LL mean large loss, a ticker, an abbreviation, or a saved bucket?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["large_loss_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve candidates","ask token class first"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 collision check","pending marker"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does LL mean large loss, a ticker, an abbreviation, or a saved bucket?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No metric or bound is inferred."},
  {"caseId":"C17-E15-06","caseType":"misspelling","input":"Show larg losses.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["large_loss_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate fuzzy candidate","ask metric first","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","fuzzy guard","signed/absolute and threshold staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which loss measure should define large: gross or net dollars, R-multiple, or another approved basis?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Metric precedes representation and predicate."},
  {"caseId":"C17-E15-07","caseType":"noisy_input","input":"july readyclosed net feecomplete abs loss >=500 USD equality yes coverage","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl","losing_trades"],"expectedFilters":["July absolute net loss >=500 USD"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","resolve absolute representation","apply inclusive threshold","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback",">=500 equality","ready_closed coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no predicate."},
  {"caseId":"C17-E15-08","caseType":"command","input":"Classify ready-closed fee-complete net loss absolute magnitude >=500 USD; keep missing fees/currency outside members and nonmembers and report coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["covered absolute net loss >=500 USD"],"expectedGroupings":["member","nonmember","unknown"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply exact predicate","exclude unknown from member and nonmember","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","absolute representation",">=500 equality","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","fee/currency coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unknown is not nonmember."},
  {"caseId":"C17-E15-09","caseType":"fragment","input":"explicit typed fixed predicate only; readyclosed feecomplete abs net USD [500,1000); not saved bucket; coverage","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["explicit typed fixed absolute net loss predicate [500,1000) USD"],"expectedGroupings":["member","nonmember","unknown"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply lower-inclusive upper-exclusive fixed predicate","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","typed predicate not saved bucket","absolute net representation","bounds/endpoints [500,1000)","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","ready_closed coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No fictional loss bucket is created or read."},
  {"caseId":"C17-E15-10","caseType":"follow_up","input":"Keep fee-complete net absolute USD and ready-closed population; change only threshold from >=500 to >750, equality excluded.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["absolute net loss >750 USD"],"expectedGroupings":[],"expectedOperators":["reuse trusted typed predicate","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","validate threshold/operator replacement","reclassify"],"expectedComparison":null,"expectedTimeRange":"retained scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted query","same account","retained absolute representation and ready_closed population","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","new >750","coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"No bucket is edited."},
  {"caseId":"C17-E15-11","caseType":"correction","input":"I meant signed net_pnl <= -500 USD including equality, not absolute magnitude; preserve prior query until validation.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["signed net_pnl <=-500 USD"],"expectedGroupings":[],"expectedOperators":["validate representation replacement","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply inclusive signed predicate","replace atomically"],"expectedComparison":null,"expectedTimeRange":"retained scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted query","same account","signed representation","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","<=-500 equality","state/coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Signed and magnitude states remain distinct."},
  {"caseId":"C17-E15-12","caseType":"comparison","input":"Compare Q2 and Q3 rates of ready-closed fee-complete absolute net losses >=500 USD using identical population, currency, denominator, equality, and side coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["absolute net loss >=500 USD"],"expectedGroupings":["Q2","Q3"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit per side","classify each side","divide members by eligible ready_closed denominator only when nonzero","return Unavailable rather than zero for a zero eligible denominator","compare compatible rates"],"expectedComparison":"Q2 versus Q3 large-loss rate","expectedTimeRange":"validated Q2/Q3","expectedSelectedEntity":null,"expectedContextRequirements":["same account","identical absolute representation and >=500 equality","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","nonzero eligible denominator per side","side samples/coverage","no cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A zero eligible denominator is Unavailable, never a zero rate; compatible rates prove no cause."},
  {"caseId":"C17-E15-13","caseType":"ranking","input":"Rank top five ready-closed losses by absolute fee-complete net_pnl USD magnitude after defining large as >=500 USD; use approved deterministic privacy-safe ties and coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["absolute net loss >=500 USD"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","classify predicate","rank magnitude descending N5 over exact unrounded owner sort values","apply approved deterministic privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","absolute representation and >=500 equality","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","N5","approved deterministic privacy-safe tie policy","exact unrounded owner sort values","coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Privacy-safe ranking does not replace predicate meaning."},
  {"caseId":"C17-E15-14","caseType":"negation","input":"Use absolute fee-complete net USD loss >500, not signed value, gross P/L, equality, bucket, baseline, or open drawdown.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["absolute net loss >500 USD"],"expectedGroupings":[],"expectedOperators":["exclude signed gross equality bucket baseline and open branches","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply strict magnitude predicate"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","absolute representation","strict >500 equality excluded","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","ready_closed coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation fixes all boundary facts."},
  {"caseId":"C17-E15-15","caseType":"exclusion","input":"For absolute net loss >=500 USD, exclude missing fee/currency facts from members and nonmembers and report unknown/ineligible coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["covered predicate facts"],"expectedGroupings":["member","nonmember","unknown","ineligible"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply predicate","keep unknown outside member and nonmember","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact absolute >=500 predicate","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","fee/currency/state coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unknown does not satisfy complement."},
  {"caseId":"C17-E15-16","caseType":"multi_filter","input":"Show July long NVDA ready-closed fee-complete absolute net losses >=500 USD with coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["July","NVDA","long","ready_closed","absolute net loss >=500 USD"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply predicate","apply authorized filters","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated July","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact ticker","absolute >=500 equality","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","filtered coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters change no threshold semantics."},
  {"caseId":"C17-E15-17","caseType":"multi_part","input":"Resolve large loss as fee-complete absolute net USD >=500, report member/nonmember/unknown counts and eligible denominator, then summarize net_pnl without causal claims.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["absolute net loss >=500 USD"],"expectedGroupings":["member","nonmember","unknown"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","classify predicate","report coverage","summarize compatible net_pnl"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","absolute representation and >=500 equality","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","eligible population and denominator","coverage","no cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Membership and summary remain factual."},
  {"caseId":"C17-E15-18","caseType":"ambiguous","input":"Show large losses.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["large_loss_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve metric candidates","ask metric only","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 15 pending","signed/absolute threshold/baseline/bucket unit/currency/population/fees/coverage staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which loss measure should define large: gross or net dollars, R-multiple, or another approved basis?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One field first; no universal threshold."},
  {"caseId":"C17-E15-19","caseType":"negative_example","input":"Show nested open-position unrealized drawdown without classifying realized large losses.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":[],"expectedFilters":["explicit nested open-position unrealized valuation request"],"expectedGroupings":[],"expectedOperators":["return nested open unrealized drawdown Unavailable","require an approved as_of valuation and mark-price owner","perform no realized-loss or net_pnl fallback"],"expectedComparison":null,"expectedTimeRange":"requested as_of valuation time","expectedSelectedEntity":null,"expectedContextRequirements":["same account","explicit as_of","approved mark-price source and version","compatible currency","open-position and market-data coverage","truthful Unavailable","no realized fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Nested open unrealized drawdown is explicitly Unavailable and is not large_loss_ambiguity."},
  {"caseId":"C17-E15-20","caseType":"unsupported_data","input":"Use another account's private loss bucket, invent missing fees, and tell me what loss limit to use tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["large_loss_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account access","reject invented facts","reject advice/prediction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["account boundary","privacy-safe refusal","state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account bucket access, invented fee facts, and future loss-limit advice are unsupported.","notes":"Unsupported differs from missing-data Unavailable."},
  {"caseId":"C17-E15-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed trade, test fee-complete absolute net loss >=500 USD after revalidation, equality included, with fee/currency coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["selected trade absolute net loss >=500 USD"],"expectedGroupings":[],"expectedOperators":["revalidate entity","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","transform a loss to absolute magnitude","apply inclusive predicate"],"expectedComparison":null,"expectedTimeRange":"selected close event","expectedSelectedEntity":"server-validated selected ready_closed trade","expectedContextRequirements":["same account","absolute representation and >=500 equality","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies entity only."},
  {"caseId":"C17-E15-22","caseType":"cross_category","input":"Classify fee-complete absolute net loss >=500 USD while Category 16 guards collisions, Category 15 retains state, Category 2 owns net_pnl, Category 12 owns the typed fixed predicate, and coverage remains explicit; no cause, advice, mutation, or runtime claim.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["large_loss_ambiguity","net_pnl"],"expectedFilters":["absolute net loss >=500 USD"],"expectedGroupings":[],"expectedOperators":["route ambiguity","guard token","retain state","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply typed >= predicate","report coverage"],"expectedComparison":null,"expectedTimeRange":"validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","absolute representation and >=500 equality","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","population and coverage","no cause/advice/prediction/mutation/runtime"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition adds no hidden boundary or fictional bucket."}
]
~~~

## Evaluation Array C17-E16 -- performance_ambiguity

~~~json
[
  {"caseId":"C17-E16-01","caseType":"canonical","input":"Summarize performance as fee-complete net expectancy version 1 in USD for eligible ready-closed Stock trades in validated Q3, with exact formula, sample, and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","net_pnl"],"expectedFilters":["eligible ready_closed Stock trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate expectancy as sum net_pnl divided by eligible ready_closed count","return Unavailable when eligible count is zero"],"expectedComparison":null,"expectedTimeRange":"validated Q3 close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","expectancy version 1","money per trade in compatible USD currency partition","ready_closed population and grain","higher exact expectancy means better for this approved historical route","conserving charge allocation","incomplete fees yield partial/Unavailable and never gross fallback","eligible count sample and coverage","historical description only"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One locked metric represents performance; no global score or hidden aggregation is created."},
  {"caseId":"C17-E16-02","caseType":"formal_paraphrase","input":"Report approved Core Performance Set version 2 for eligible ready-closed Stock trades in Q3: fee-complete net expectancy in USD and fee-complete net win_rate as an exact ratio with rounded percent display, both higher-is-better, with no composite score.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","win_rate","net_pnl"],"expectedFilters":["eligible ready_closed Stock trades with fee-complete net_pnl"],"expectedGroupings":["Core Performance Set version 2 components"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate expectancy as sum net_pnl divided by eligible ready_closed count","calculate win_rate as count net_pnl strictly greater than exact zero divided by the same eligible count","keep component results separate"],"expectedComparison":null,"expectedTimeRange":"validated Q3 close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved set version 2","expectancy USD per trade higher exact value is better","win_rate exact ratio with rounded percent display higher exact value is better","zero denominator Unavailable","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","no weighting/composite","same ready_closed population","component sample and coverage","open trades excluded and visible as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The approved set preserves separate units and never becomes a synthetic performance score."},
  {"caseId":"C17-E16-03","caseType":"conversational_paraphrase","input":"How did I do in July? Use gross expectancy version 1 in CAD over eligible ready-closed trades and show the eligible count and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","gross_pnl"],"expectedFilters":["eligible ready_closed trades with gross_pnl"],"expectedGroupings":[],"expectedOperators":["resolve performance to expectancy version 1","sum gross_pnl and divide by eligible ready_closed count","return Unavailable for zero eligible count"],"expectedComparison":null,"expectedTimeRange":"validated July close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","gross basis","compatible CAD partition","money per trade unit","higher exact expectancy means better for this approved historical route","ready_closed population","eligible count and coverage","no fee subtraction on gross basis","no score or skill claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording is safe because the single locked metric and complete contract are explicit."},
  {"caseId":"C17-E16-04","caseType":"trader_slang","input":"How am I doing, explicitly meaning Q2 fee-complete net expectancy version 1 in USD for ready-closed Stock trades, with sample and coverage?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","net_pnl"],"expectedFilters":["eligible ready_closed Stock trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["resolve slang to supplied expectancy owner","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","divide compatible net sum by eligible count"],"expectedComparison":null,"expectedTimeRange":"validated Q2 close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","expectancy version 1","USD per trade","higher exact expectancy means better for this approved historical route","ready_closed population","zero count Unavailable","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","sample and coverage","no quality cause advice or prediction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang adds no metric, aggregation, or interpretation beyond the supplied owner contract."},
  {"caseId":"C17-E16-05","caseType":"abbreviation","input":"Does PERF mean performance, a ticker, an abbreviation, or an authorized saved metric set?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve performance ticker abbreviation and saved-set candidates","run Category 16 collision checks","ask token class first","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted query unchanged","no private candidate disclosure","metric/set and dependent contract staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does PERF mean performance, a ticker, an abbreviation, or one of your authorized saved metric sets?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An abbreviation cannot select a metric, set, or score."},
  {"caseId":"C17-E16-06","caseType":"misspelling","input":"Show my performnce last month.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate performance as a fuzzy candidate only","ask metric or approved set first","create pending marker"],"expectedComparison":null,"expectedTimeRange":"validated prior-month candidate scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 fuzzy guard","accepted query unchanged","basis population units fees sample and coverage staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which metric or approved metric set should represent performance?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling repair supplies no metric or set owner."},
  {"caseId":"C17-E16-07","caseType":"noisy_input","input":"q3 perf = CoreSet v2; exp=sum net/n USD/trade hi; wr=count net>0/n exact ratio rounded pct hi; readyclosed; feecomplete; n0 unavailable; no composite; coverage","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","win_rate","net_pnl"],"expectedFilters":["eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["Core Performance Set version 2 components"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate expectancy as sum net_pnl divided by eligible ready_closed count","calculate win_rate as count net_pnl strictly greater than exact zero divided by the same eligible count","keep components separate"],"expectedComparison":null,"expectedTimeRange":"validated Q3 close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved set version 2","expectancy USD per trade and win_rate exact ratio/rounded percent","higher exact value is better for both components","zero denominator Unavailable","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","no weighting or composite","component sample exclusions and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no component formula, unit, direction, or missing-component policy."},
  {"caseId":"C17-E16-08","caseType":"command","input":"Use fee-complete net expectancy version 1 only for eligible ready-closed USD trades this year; calculate sum net_pnl divided by eligible count, make zero count Unavailable, and report coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","net_pnl"],"expectedFilters":["eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","sum net_pnl and divide by eligible count","return Unavailable for zero eligible count"],"expectedComparison":null,"expectedTimeRange":"validated current-year close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","expectancy version 1","USD per trade","higher exact expectancy means better for this approved historical route","ready_closed grain and population","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","eligible count and coverage","no hidden score"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command selects one metric and does not authorize additional favorable metrics."},
  {"caseId":"C17-E16-09","caseType":"fragment","input":"performance = gross expectancy v1; CAD/trade; readyclosed July; sum gross/n; n0 unavailable; sample coverage","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","gross_pnl"],"expectedFilters":["eligible ready_closed trades with gross_pnl"],"expectedGroupings":[],"expectedOperators":["sum gross_pnl","divide by eligible ready_closed count","return Unavailable for zero count"],"expectedComparison":null,"expectedTimeRange":"validated July close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","expectancy version 1","gross basis","compatible CAD partition","money per trade","higher exact expectancy means better for this approved historical route","eligible sample and coverage","no fee or score inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment fully selects a locked single-metric route."},
  {"caseId":"C17-E16-10","caseType":"follow_up","input":"For the trusted accepted Q3 performance query, keep account, ready-closed population, fee-complete net USD basis, and coverage; change only the owner from expectancy version 1 to win_rate version 1.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","win_rate","net_pnl"],"expectedFilters":["retained eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["reuse trusted typed population and basis","validate metric replacement atomically","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate win_rate as count net_pnl strictly greater than exact zero divided by the same eligible count"],"expectedComparison":null,"expectedTimeRange":"retained validated Q3 scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","win_rate version 1","higher exact win_rate means better for this approved historical route","exact ratio with rounded percent display","zero denominator Unavailable","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","no retained expectancy aggregation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only the owner changes after validation; accepted state remains intact until then."},
  {"caseId":"C17-E16-11","caseType":"correction","input":"I meant approved Core Performance Set version 2, not net P/L alone; preserve the prior query until both expectancy and win_rate component contracts validate.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","win_rate","net_pnl"],"expectedFilters":["eligible ready_closed trades with fee-complete net_pnl"],"expectedGroupings":["Core Performance Set version 2 components"],"expectedOperators":["validate set replacement atomically","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate expectancy as sum net_pnl divided by eligible ready_closed count","calculate win_rate as count net_pnl strictly greater than exact zero divided by the same eligible count","keep components separate"],"expectedComparison":null,"expectedTimeRange":"retained validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","approved set version 2","expectancy USD per trade higher exact value is better","win_rate exact ratio/rounded percent higher exact value is better","zero denominator Unavailable","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","no weighting/composite","component sample and coverage","prior state retained until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction does not synthesize a score or silently drop an unavailable component."},
  {"caseId":"C17-E16-12","caseType":"comparison","input":"Compare July and August performance using the same fee-complete net expectancy version 1 in USD, higher-is-better, over compatible ready-closed populations with side-specific samples and coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete USD trades"],"expectedGroupings":["July","August"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit per side","calculate expectancy as side net sum divided by side eligible count","return a side Unavailable for zero count","compare exact owner values under higher-is-better direction"],"expectedComparison":"July versus August net expectancy version 1","expectedTimeRange":"validated July and August close-event scopes","expectedSelectedEntity":null,"expectedContextRequirements":["same account","identical metric/version/formula/basis/currency/population","USD per trade","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","side-specific eligible samples and exclusions","no cause or broader score"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A compatible historical difference proves no cause, skill, or future result."},
  {"caseId":"C17-E16-13","caseType":"ranking","input":"For Core Performance Set version 2 in Q3, rank top five authorized setup groups only by its declared fee-complete net expectancy component in USD, higher exact value better, while reporting net win_rate separately without composite scoring.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["summarize_performance","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","win_rate","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete USD trades"],"expectedGroupings":["authorized setup groups","Core Performance Set version 2 components"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate expectancy as sum net_pnl divided by eligible ready_closed count","calculate win_rate as count net_pnl strictly greater than exact zero divided by the same eligible count","rank only by exact unrounded expectancy","apply approved deterministic privacy-safe ties","report win_rate separately"],"expectedComparison":null,"expectedTimeRange":"validated Q3 close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved set version 2","expectancy USD per trade higher exact value better","win_rate exact ratio/rounded percent higher exact value better","zero denominator Unavailable","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","positive N5/exact sort/privacy-safe ties","no weighting/composite/raw IDs","component samples and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The set remains separate; only the declared expectancy component orders the ranking."},
  {"caseId":"C17-E16-14","caseType":"negation","input":"Use Core Performance Set version 2 components separately, not a global score, incompatible-unit average, favorable-component subset, or hidden weighting.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","win_rate","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete trades"],"expectedGroupings":["approved set version 2 components"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate expectancy as sum selected-basis P/L divided by eligible ready_closed count","calculate win_rate as count selected-basis P/L strictly greater than exact zero divided by the same eligible count","retain separate USD-per-trade and exact-ratio/rounded-percent outputs","report unavailable components"],"expectedComparison":null,"expectedTimeRange":"validated requested scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved set version 2","higher exact expectancy and win_rate values mean better","zero denominator Unavailable","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","component samples and coverage","no weighting/composite/selection bias"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation preserves the approved set and forbids invented aggregation."},
  {"caseId":"C17-E16-15","caseType":"exclusion","input":"For Core Performance Set version 2, exclude records lacking fee-complete net or compatible USD facts from each affected component, keep open and decision rows out of ready-closed populations, and report exclusions without dropping components.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","win_rate","net_pnl"],"expectedFilters":["component-eligible ready_closed fee-complete USD trades"],"expectedGroupings":["approved set version 2 components"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate expectancy as sum selected-basis P/L divided by eligible ready_closed count","calculate win_rate as count selected-basis P/L strictly greater than exact zero divided by the same eligible count","return partial/Unavailable per component","report all exclusions and coverage"],"expectedComparison":null,"expectedTimeRange":"validated requested close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved set version 2","expectancy USD per trade and win_rate exact ratio/rounded percent","higher exact value means better for both","zero denominator Unavailable","conserving charge allocation","compatible USD currency","incomplete fees yield partial/Unavailable and never gross fallback","component-specific eligible missing excluded and unavailable counts","no weighting/composite or silent component removal"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Missing evidence changes component availability, not the approved set definition."},
  {"caseId":"C17-E16-16","caseType":"multi_filter","input":"Show July long NVDA performance as fee-complete net expectancy version 1 in USD for eligible ready-closed Stock trades with sample and filtered coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","net_pnl"],"expectedFilters":["July","NVDA","long","eligible ready_closed Stock trades with fee-complete net_pnl"],"expectedGroupings":[],"expectedOperators":["apply authorized filters","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","divide filtered net sum by filtered eligible count","return Unavailable for zero count"],"expectedComparison":null,"expectedTimeRange":"validated July close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact ticker and direction","expectancy version 1","USD per trade","higher exact expectancy means better for this approved historical route","ready_closed population","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","filtered sample and coverage","no cause or score"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters cannot redefine performance or its metric formula."},
  {"caseId":"C17-E16-17","caseType":"multi_part","input":"Resolve performance to Core Performance Set version 2, report net expectancy and net win_rate separately with formulas, units, directions, samples, fees, and coverage, then compare the same components across Q2 and Q3 without a composite conclusion.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["summarize_performance","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","win_rate","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete trades"],"expectedGroupings":["Q2","Q3","approved set components"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit per side","calculate expectancy as sum selected-basis P/L divided by eligible ready_closed count per side","calculate win_rate as count selected-basis P/L strictly greater than exact zero divided by the same eligible count per side","compare like components only","report side-component coverage"],"expectedComparison":"Q2 versus Q3 Core Performance Set version 2 components","expectedTimeRange":"validated Q2 and Q3 close-event scopes","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved set version 2","USD-per-trade expectancy and exact-ratio/rounded-percent win_rate","higher exact value means better for both components","zero denominator Unavailable","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","no weighting/composite","side-component samples and coverage","no cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The multi-part response retains distinct components and makes no global quality judgment."},
  {"caseId":"C17-E16-18","caseType":"ambiguous","input":"How was my performance?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve single-metric and approved-set candidates","ask owner metric or set only","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 15 pending state","basis population period units fees currency sample open handling and coverage staged","no P/L or score default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which metric or approved metric set should represent performance?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The highest-impact owner field is asked first; no global score exists."},
  {"caseId":"C17-E16-19","caseType":"negative_example","input":"Show monthly gross_pnl in CAD without calling it performance or creating a score.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["gross_pnl"],"expectedFilters":["eligible gross_pnl facts"],"expectedGroupings":["validated calendar month"],"expectedOperators":["route directly to gross_pnl owner","sum compatible gross facts by month","perform no performance-set selection or scoring"],"expectedComparison":null,"expectedTimeRange":"validated monthly close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","gross basis","compatible CAD partition","authorized monthly grouping","eligible samples and coverage","no performance interpretation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An explicit metric request is not performance_ambiguity."},
  {"caseId":"C17-E16-20","caseType":"unsupported_data","input":"Use another account's private metrics, invent missing fees, create the best global performance score, and tell me whether it will improve tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["performance_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account access","reject invented fees and global-score synthesis","reject favorable-metric selection","reject prediction and advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["account boundary","privacy-safe refusal","accepted state unchanged","no private metric names values or raw IDs disclosed"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account evidence, invented facts, synthetic global scoring, favorable selection, and future-performance prediction are unsupported.","notes":"Fail closed without exposing private definitions or creating a runtime claim."},
  {"caseId":"C17-E16-21","caseType":"selected_entity_context","input":"For the trusted selected result set, summarize fee-complete net expectancy version 1 in USD after server revalidation, with eligible count, exclusions, and coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","net_pnl"],"expectedFilters":["selected result set eligible ready_closed fee-complete USD trades"],"expectedGroupings":[],"expectedOperators":["revalidate selected result set server-side","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","divide net sum by eligible count","return Unavailable for zero count"],"expectedComparison":null,"expectedTimeRange":"selected result set validated close-event scope","expectedSelectedEntity":"server-validated selected result set","expectedContextRequirements":["trusted typed selected set","same account","expectancy version 1","USD per trade","higher exact expectancy means better for this approved historical route","ready_closed population","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","sample exclusion and coverage","no raw IDs or hidden context reuse"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies population only; the current turn supplies the metric contract."},
  {"caseId":"C17-E16-22","caseType":"cross_category","input":"Report Core Performance Set version 2 while Category 16 guards tokens, Category 15 retains state, locked metric owners calculate net expectancy and win_rate, Category 11 supplies the ready-closed population, and Category 14 compares only like components; no global score, cause, advice, mutation, or runtime claim.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["performance_ambiguity","expectancy","win_rate","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete trades"],"expectedGroupings":["approved set version 2 components"],"expectedOperators":["route ambiguity and retain state","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate expectancy as sum selected-basis P/L divided by eligible ready_closed count","calculate win_rate as count selected-basis P/L strictly greater than exact zero divided by the same eligible count","keep components separate","report component coverage"],"expectedComparison":null,"expectedTimeRange":"validated requested close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved set version 2","USD-per-trade expectancy and exact-ratio/rounded-percent win_rate","higher exact value means better for both components","zero denominator Unavailable","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","population time samples exclusions open handling and component coverage","no weighting/composite/score/cause/advice/prediction/mutation/runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition preserves every owner and adds no hidden aggregation."}
]
~~~

## Evaluation Array C17-E17 -- consistency_ambiguity

~~~json
[
  {"caseId":"C17-E17-01","caseType":"canonical","input":"Measure consistency with approved P/L Dispersion version 1 over fee-complete net_pnl in USD for eligible ready-closed Q3 trades: population variance is exact, displayed standard deviation is its rounded square root, and lower exact variance means more consistent.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["eligible ready_closed Q3 trades with fee-complete net_pnl in USD"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate exact population mean and exact variance as sum squared deviations divided by eligible count","display deterministic rounded square root","return Unavailable when eligible count is zero"],"expectedComparison":null,"expectedTimeRange":"validated Q3 close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved P/L Dispersion version 1","net USD representation and money unit","lower exact variance is more consistent","ready_closed population and grain","minimum sample one unless approved contract says otherwise","no outlier exclusion","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","eligible missing excluded and unavailable coverage","open trades excluded"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The declared direction applies to this approved measure only; rounded display never replaces exact underlying variance."},
  {"caseId":"C17-E17-02","caseType":"formal_paraphrase","input":"Evaluate consistency as rule_adherence for active Risk Per Trade rule version 2 in Q3: followed applicable decisions divided by all applicable decisions, higher exact rate means more consistent, zero denominator Unavailable, with unknown determinations retained in coverage.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","rule_adherence"],"expectedFilters":["Risk Per Trade rule version 2 applicable decisions"],"expectedGroupings":["followed","broken","unknown determination","inapplicable"],"expectedOperators":["deduplicate distinct decisions at the stable applicable-decision grain","count distinct applicable decisions with explicit factual followed determinations","divide by all distinct applicable decisions including unknown determinations","return partial/Unavailable for unknown determinations and Unavailable for zero denominator"],"expectedComparison":null,"expectedTimeRange":"validated Q3 effective-rule scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","active saved rule version 2","approved rule_adherence representation","higher exact rate is more consistent","exact ratio with percentage display","no extra minimum beyond a nonzero all-applicable denominator unless the version declares one","explicit applicability and provenance","fees and currency inapplicable","followed broken unknown inapplicable samples and coverage","no discipline or outcome inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Adherence consistency is a declared factual representation, not a character judgment."},
  {"caseId":"C17-E17-03","caseType":"conversational_paraphrase","input":"Was I steady in July? Use gross-P/L Dispersion version 1 in CAD, exact population variance with rounded standard-deviation display, lower exact variance means steadier, no outlier exclusions, and show sample coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","gross_pnl"],"expectedFilters":["eligible ready_closed July trades with gross_pnl in CAD"],"expectedGroupings":[],"expectedOperators":["calculate mu as sum gross_pnl divided by n","calculate exact population variance as sum of (x - mu)^2 divided by n","display deterministically rounded square root of exact variance","use exact variance only for ordering equality and ties"],"expectedComparison":null,"expectedTimeRange":"validated July close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved P/L Dispersion version 1","gross CAD money representation","ready_closed population","n=1 is valid and no extra adequacy threshold applies","n=0 Unavailable","lower exact variance means more consistent","rounded-equal display is not a tie unless exact variances equal","no outlier exclusions","eligible sample and coverage","gross basis needs no fee subtraction","no skill cause or prediction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Conversational wording is resolved only by the complete supplied dispersion contract."},
  {"caseId":"C17-E17-04","caseType":"trader_slang","input":"Was I locked in, explicitly meaning Q2 Plan Followed version 3 plan_adherence rate, higher exact followed-over-all-applicable rate means more consistent, with zero denominator and unknown coverage?","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","plan_adherence"],"expectedFilters":["Plan Followed version 3 applicable actions"],"expectedGroupings":["followed","broken","unknown determination","inapplicable"],"expectedOperators":["deduplicate distinct actions at the stable applicable-action grain","count distinct applicable actions with explicit factual followed determinations","divide by all distinct applicable actions including unknown determinations","return partial/Unavailable for unknown determinations and Unavailable for zero denominator"],"expectedComparison":null,"expectedTimeRange":"validated Q2 effective-plan scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","active trader-authored plan version 3","approved adherence representation","higher exact ratio is more consistent","percentage display","no extra minimum beyond a nonzero all-applicable denominator unless the version declares one","fees/currency inapplicable","applicability provenance and coverage","no discipline inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang adds no character, outcome, or future-stability meaning."},
  {"caseId":"C17-E17-05","caseType":"abbreviation","input":"Does SD mean the approved P/L standard-deviation measure, a ticker, an abbreviation, or another authorized consistency formula?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve dispersion ticker abbreviation and formula candidates","run Category 16 collision checks","ask token class first","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","accepted query unchanged","no private candidate disclosure","formula representation direction and dependent fields staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does SD mean the approved P/L standard-deviation measure, a ticker, an abbreviation, or another authorized consistency formula?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An abbreviation cannot select a formula, representation, or direction."},
  {"caseId":"C17-E17-06","caseType":"misspelling","input":"Was I consistant last month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate consistency as fuzzy candidate only","ask approved measure first","create pending marker"],"expectedComparison":null,"expectedTimeRange":"validated prior-month candidate scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 16 fuzzy guard","accepted query unchanged","formula version representation direction population sample outliers period basis fees currency and coverage staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which approved consistency measure should I use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling repair supplies no consistency formula or direction."},
  {"caseId":"C17-E17-07","caseType":"noisy_input","input":"q3 consistent = pnlDisp v1 net USD readyclosed; mu=sumx/n; var=sum((x-mu)^2)/n exact; show rounded sqrt; lower exact var better; no outliers; n0 unavailable; fees coverage","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["eligible ready_closed Q3 fee-complete net_pnl USD trades"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate mu as sum net_pnl divided by n","calculate exact population variance as sum of (x - mu)^2 divided by n","display deterministically rounded square root","use exact variance only for ordering equality and ties"],"expectedComparison":null,"expectedTimeRange":"validated Q3 close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved formula version 1","net USD money representation","ready_closed grain","n=1 valid with no extra adequacy threshold and n=0 Unavailable","lower exact variance means more consistent","rounded equal is not a tie unless exact variance equal","no outlier exclusion","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","sample and coverage","no default or prediction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes neither exact underlying variance nor the declared interpretation."},
  {"caseId":"C17-E17-08","caseType":"command","input":"Use rule_adherence for active Risk Per Trade rule version 2 as consistency: followed divided by all applicable decisions, higher exact rate is more consistent, zero denominator Unavailable, and report unknown determinations and coverage.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","rule_adherence"],"expectedFilters":["applicable Risk Per Trade rule version 2 decisions"],"expectedGroupings":["followed","broken","unknown determination","inapplicable"],"expectedOperators":["deduplicate distinct decisions at the stable applicable-decision grain","count distinct applicable decisions with explicit factual followed determinations","divide by all distinct applicable decisions including unknown determinations","return partial/Unavailable for unknown determinations and Unavailable for zero denominator"],"expectedComparison":null,"expectedTimeRange":"validated effective-rule scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved adherence formula and higher direction","exact ratio with percentage display","no extra minimum beyond a nonzero all-applicable denominator unless the version declares one","fees/currency inapplicable","applicability provenance and coverage","no outcome or discipline inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command resolves every material adherence field and creates no generic score."},
  {"caseId":"C17-E17-09","caseType":"fragment","input":"consistency = gross P/L Dispersion v1; CAD; readyclosed July; exact population variance; rounded sqrt display; lower exact variance better; no outliers; n0 unavailable; coverage","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","gross_pnl"],"expectedFilters":["eligible ready_closed July gross_pnl CAD trades"],"expectedGroupings":[],"expectedOperators":["calculate mu as sum gross_pnl divided by n","calculate exact population variance as sum of (x - mu)^2 divided by n","display deterministically rounded square root","use exact variance only for ordering equality and ties"],"expectedComparison":null,"expectedTimeRange":"validated July close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved version 1","gross CAD representation/unit","ready_closed population","n=1 valid with no extra adequacy threshold and n=0 Unavailable","lower exact variance means more consistent","rounded equal is not a tie unless exact variance equal","no outlier exclusions","sample and coverage","no fee subtraction or hidden direction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment fully resolves formula, representation, direction, sample, and coverage."},
  {"caseId":"C17-E17-10","caseType":"follow_up","input":"For the trusted accepted Q3 consistency query, keep account and period; change only the approved measure from net-P/L Dispersion version 1 to Risk Per Trade rule version 2 rule_adherence, higher exact rate more consistent.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","rule_adherence"],"expectedFilters":["Risk Per Trade rule version 2 applicable decisions"],"expectedGroupings":["followed","broken","unknown determination","inapplicable"],"expectedOperators":["reuse only trusted account and period","validate formula-family replacement atomically","deduplicate distinct decisions at stable applicable-decision grain","count distinct factual followed applicable decisions and divide by all distinct applicable decisions including unknown determinations","return partial/Unavailable for unknown determinations and zero-denominator Unavailable"],"expectedComparison":null,"expectedTimeRange":"retained validated Q3 scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","active rule/version 2","higher exact ratio direction","no extra minimum beyond a nonzero all-applicable denominator unless version 2 declares one","fees/currency inapplicable","applicability provenance sample and coverage","prior dispersion state retained until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A formula-family change never reuses the old P/L population or units."},
  {"caseId":"C17-E17-11","caseType":"correction","input":"I meant approved fee-complete net-P/L Dispersion version 1 in USD, not win_rate; preserve the prior query until formula, representation, lower-direction, population, sample, and fee coverage validate.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete net_pnl USD trades"],"expectedGroupings":[],"expectedOperators":["validate replacement atomically","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate mu as sum net_pnl divided by n","calculate exact population variance as sum of (x - mu)^2 divided by n","display deterministically rounded square root","use exact variance only for ordering equality and ties"],"expectedComparison":null,"expectedTimeRange":"retained validated scope","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query","same account","approved formula version 1","net USD representation","ready_closed population","n=1 valid with no extra adequacy threshold and n=0 Unavailable","lower exact variance means more consistent","rounded equal is not a tie unless exact variance equal","declared no-outlier policy","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","coverage","prior state retained until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Win rate is not substituted for consistency; the corrected owner remains explicit."},
  {"caseId":"C17-E17-12","caseType":"comparison","input":"Compare July and August consistency under the same fee-complete net-P/L Dispersion version 1 in USD; lower exact population variance is more consistent, while rounded standard deviation is display only, with side samples and coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete USD trades"],"expectedGroupings":["July","August"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit per side","calculate mu as sum x divided by n and exact population variance as sum of (x - mu)^2 divided by n per side","compare exact variance under lower-is-more-consistent direction","tie only on exact variance equality","display deterministically rounded square roots"],"expectedComparison":"July versus August approved P/L dispersion consistency","expectedTimeRange":"validated July and August close-event scopes","expectedSelectedEntity":null,"expectedContextRequirements":["same account","identical formula/version/net USD representation/population","n=1 valid with no extra adequacy threshold and side n=0 Unavailable","rounded equal is not a tie unless exact variances equal","no-outlier policy","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","side samples exclusions and coverage","no cause"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compatible dispersion comparison describes history only."},
  {"caseId":"C17-E17-13","caseType":"ranking","input":"Rank top five authorized setup groups by approved fee-complete net-P/L Dispersion version 1 in Q3; lower exact USD population variance is more consistent, use exact underlying values and privacy-safe ties, and display rounded standard deviation with samples and coverage.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete USD trades"],"expectedGroupings":["authorized setup groups"],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate mu as sum x divided by n and exact population variance as sum of (x - mu)^2 divided by n per group","sort ascending over exact variance","tie only on exact variance equality","display deterministically rounded square root"],"expectedComparison":null,"expectedTimeRange":"validated Q3 close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved version 1 and lower exact variance direction","net USD representation","positive N5","n=1 valid with no extra adequacy threshold and n=0 groups Unavailable","no-outlier policy","rounded equal is not a tie unless exact variance equal","approved privacy-safe ties/no raw IDs","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","group samples and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Rounded-equal displays do not create a tie unless exact underlying variance is equal under the approved policy."},
  {"caseId":"C17-E17-14","caseType":"negation","input":"Use Risk Per Trade rule version 2 rule_adherence as consistency, higher exact followed-over-all-applicable rate is more consistent; do not use P/L dispersion, win rate, profitability, streaks, or a discipline judgment.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","rule_adherence"],"expectedFilters":["Risk Per Trade rule version 2 applicable decisions"],"expectedGroupings":["followed","broken","unknown determination","inapplicable"],"expectedOperators":["exclude dispersion outcome streak and character branches","deduplicate distinct decisions at stable applicable-decision grain","count distinct factual followed applicable decisions and divide by all distinct applicable decisions including unknown determinations","return partial/Unavailable for unknown determinations and zero-denominator Unavailable"],"expectedComparison":null,"expectedTimeRange":"validated effective-rule scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","active rule version","higher exact rate direction","no extra minimum beyond a nonzero all-applicable denominator unless the version declares one","fees/currency inapplicable","provenance and coverage","no discipline or skill inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation fixes the owner without making adherence a personal trait."},
  {"caseId":"C17-E17-15","caseType":"exclusion","input":"For approved fee-complete net-P/L Dispersion version 1 in USD, exclude values outside the explicit inclusive [-2000,2000] USD outlier window before calculation, report excluded and missing records, and use lower exact variance as more consistent.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["eligible ready_closed net_pnl within inclusive [-2000,2000] USD"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","apply explicit inclusive fixed outlier window","calculate mu as retained sum x divided by retained n and exact population variance as sum of (x - mu)^2 divided by retained n","display deterministically rounded square root","use exact variance only for ordering equality and ties"],"expectedComparison":null,"expectedTimeRange":"validated requested close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved formula version 1","net USD representation","inclusive endpoint policy","lower exact variance direction","retained n=1 valid with no extra adequacy threshold and n=0 Unavailable","rounded equal is not a tie unless exact variance equal","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","excluded/missing/unavailable coverage","no hidden winsorization or deletion"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit outlier rule is part of this approved calculation and is never inferred."},
  {"caseId":"C17-E17-16","caseType":"multi_filter","input":"Show July long NVDA consistency using approved fee-complete net-P/L Dispersion version 1 in USD for eligible ready-closed trades, lower exact variance means more consistent, no outlier exclusions, with filtered sample and coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["July","NVDA","long","eligible ready_closed fee-complete USD trades"],"expectedGroupings":[],"expectedOperators":["apply authorized filters","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate mu as sum x divided by n and exact population variance as sum of (x - mu)^2 divided by n","display deterministically rounded square root","use exact variance only for ordering equality and ties"],"expectedComparison":null,"expectedTimeRange":"validated July close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","exact ticker/direction","approved version 1","net USD representation","lower exact variance direction","n=1 valid with no extra adequacy threshold and n=0 Unavailable","rounded equal is not a tie unless exact variance equal","no outlier exclusions","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","filtered sample and coverage","no quality or cause claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters preserve formula, representation, direction, and sample policy."},
  {"caseId":"C17-E17-17","caseType":"multi_part","input":"Resolve consistency to Risk Per Trade rule version 2 rule_adherence, report followed/broken/unknown/inapplicable samples and the exact rate, then compare Q2 and Q3 under the same higher-is-more-consistent direction without causal or discipline claims.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_rule","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","rule_adherence"],"expectedFilters":["Risk Per Trade rule version 2 applicable decisions"],"expectedGroupings":["Q2","Q3","followed","broken","unknown determination","inapplicable"],"expectedOperators":["deduplicate distinct decisions at stable applicable-decision grain per side","count distinct factual followed applicable decisions and divide by all distinct applicable decisions including unknown determinations per side","return partial/Unavailable for unknown determinations and zero-denominator Unavailable","compare exact compatible rates"],"expectedComparison":"Q2 versus Q3 rule-adherence consistency","expectedTimeRange":"validated Q2 and Q3 effective-rule scopes","expectedSelectedEntity":null,"expectedContextRequirements":["same account","same active rule version/formula","higher exact rate direction and percentage display","no extra minimum beyond a nonzero all-applicable denominator unless version 2 declares one","fees/currency inapplicable","side applicability provenance samples and coverage","no cause character advice or prediction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A historical adherence-rate difference proves no cause or personal trait."},
  {"caseId":"C17-E17-18","caseType":"ambiguous","input":"Was I consistent?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve approved dispersion adherence and other authorized measure candidates","ask approved measure only","create pending marker"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same account","Category 15 pending state","formula version representation direction population sample outliers period basis fees currency open handling and coverage staged","no standard-deviation adherence or lower-is-better default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which approved consistency measure should I use?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The highest-impact formula owner is asked first."},
  {"caseId":"C17-E17-19","caseType":"negative_example","input":"Report Risk Per Trade rule version 2 rule_adherence without calling it consistency or making a discipline judgment.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["rule_adherence"],"expectedFilters":["Risk Per Trade rule version 2 applicable decisions"],"expectedGroupings":["followed","broken","unknown determination","inapplicable"],"expectedOperators":["route directly to rule_adherence","deduplicate distinct decisions at stable applicable-decision grain","count distinct factual followed applicable decisions and divide by all distinct applicable decisions including unknown determinations","return partial/Unavailable for unknown determinations and zero-denominator Unavailable","perform no consistency interpretation"],"expectedComparison":null,"expectedTimeRange":"validated effective-rule scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","active rule version","no extra minimum beyond a nonzero all-applicable denominator unless the version declares one","fees/currency inapplicable","applicability provenance sample and coverage","no trait inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An explicit owner request is not consistency_ambiguity."},
  {"caseId":"C17-E17-20","caseType":"unsupported_data","input":"Use another account's private rules, infer missing adherence from winning trades, invent the standard consistency formula and direction, and tell me whether I will stay disciplined tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["consistency_ambiguity"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account access","reject outcome-based adherence inference","reject invented formula and direction","reject discipline judgment prediction and advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["account boundary","privacy-safe refusal","accepted state unchanged","no private rule names definitions values or raw IDs disclosed"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account evidence, inferred adherence, invented consistency contracts, discipline judgments, and future-stability prediction are unsupported.","notes":"Fail closed without exposing private definitions or claiming runtime behavior."},
  {"caseId":"C17-E17-21","caseType":"selected_entity_context","input":"For the trusted selected result set, calculate approved fee-complete net-P/L Dispersion version 1 in USD after server revalidation; lower exact variance means more consistent, display rounded standard deviation, use no outlier exclusions, and report sample coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["selected result set eligible ready_closed fee-complete USD trades"],"expectedGroupings":[],"expectedOperators":["revalidate selected set server-side","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate mu as sum x divided by n and exact population variance as sum of (x - mu)^2 divided by n","display deterministically rounded square root","use exact variance only for ordering equality and ties"],"expectedComparison":null,"expectedTimeRange":"selected result set validated close-event scope","expectedSelectedEntity":"server-validated selected result set","expectedContextRequirements":["trusted typed selected set","same account","approved version 1","net USD representation","ready_closed population","lower exact variance direction","n=1 valid with no extra adequacy threshold and n=0 Unavailable","rounded equal is not a tie unless exact variance equal","no outlier exclusions","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","sample and coverage","no raw IDs or hidden context reuse"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies population only; the current turn supplies formula and direction."},
  {"caseId":"C17-E17-22","caseType":"cross_category","input":"Compare approved net-P/L Dispersion version 1 consistency across authorized groups while Category 16 guards tokens, Category 15 retains state, Category 4 owns exact variance and rounded standard deviation, Category 11 owns population, and Category 14 compares exact underlying values under the declared lower direction; no default, cause, advice, mutation, or runtime claim.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["consistency_ambiguity","standard_deviation","net_pnl"],"expectedFilters":["eligible ready_closed fee-complete compatible-currency trades"],"expectedGroupings":["authorized compatible groups"],"expectedOperators":["route ambiguity and retain state","calculate net_pnl as gross_pnl - allocated charge_cost + allocated charge_credit","calculate mu as sum x divided by n and exact population variance as sum of (x - mu)^2 divided by n per group","compare exact variance under lower-is-more-consistent direction","tie only on exact equality","display deterministically rounded square roots"],"expectedComparison":"approved dispersion consistency across authorized groups","expectedTimeRange":"validated requested close-event scope","expectedSelectedEntity":null,"expectedContextRequirements":["same account","approved formula/version/net representation/lower direction","population grain and period","n=1 valid with no extra adequacy threshold and n=0 Unavailable","outlier/exclusion policy","rounded equal is not a tie unless exact variance equal","conserving charge allocation","compatible currency","incomplete fees yield partial/Unavailable and never gross fallback","side coverage","no default/cause/advice/prediction/mutation/runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-category composition preserves exact owner values and adds no global consistency score."}
]
~~~

## 7.3 Evaluation Summary

| Measure | Required | Completed | Passed | Notes |
|---|---:|---:|---:|---|
| Evaluation arrays | 17 | 17 | 17 | C17-E1 through C17-E17 independently PASSed |
| Evaluation cases | 374 | 374 | 374 | 374 PASS, 0 failed, 0 unreviewed, 0 pending |

---

# 8. Coverage Report Deliverable

Final Version 1 coverage records all 17 approved and locked canonical and registry
deliverables plus all 17 evaluation arrays and 374 cases. Comprehensive
pre-lock review independently PASSed the substantive, language, evaluation,
data/tool, overlap, privacy, capability, and no-runtime boundaries.

## 8.1 Inventory Coverage

| Measure | Count |
|---|---:|
| Controlling inventory items | 17 |
| Completed canonical and registry items | 17 |
| Incomplete evaluation items | 0 |
| Proposed additions | 0 |
| Proposed removals or merges | 0 |
| Locked canonical names | 17 |

## 8.2 Language Coverage

All seventeen language registries independently PASSed and were accepted by the
controller. The final aggregate evaluation counts are synchronized below.

## 8.3 Evaluation Coverage

| Measure | Count |
|---|---:|
| Total evaluation cases | 374 |
| Passed | 374 |
| Failed | 0 |
| Unreviewed | 0 |
| Pending | 0 |
| Clarification cases | 51 |
| Unsupported cases | 15 |
| Cross-category cases | 17 |
| Secondary-intent cases | 295 |
| Selected-entity cases | 26 |
| Time-range cases | 309 |
| Comparison cases | 48 |
| Confirmation cases | 0 |
| Protected-action cases | 0 |

## 8.4 Data and Tool Coverage

- Required data: planned in Section 3.2; record-level production deferred.
- Optional data: record-level production deferred.
- Missing data: must be reported per owner without invention.
- Tool targets: planned contracts only; no Chat runtime is claimed.
- Tools not yet implemented: ambiguity router, context/materiality validator,
  highest-impact question selector, and clarification state integration.
- Unsupported capabilities: cross-account resolution, raw-ID disclosure,
  inferred cause/motive, advice/prediction, and unauthorized mutation.

## 8.5 Overlap Review

- Duplicate concepts found: none in the proposed seventeen-record inventory.
- Synonym collisions: documented as candidate-owner ambiguity, not merged.
- Cross-category conflicts: ownership boundaries are recorded in Sections 2 and
  3.5 and independently PASSed comprehensive pre-lock review.
- Terms requiring global ambiguity policy: all seventeen records.
- Terms requiring user-defined aliases: only authorized same-account saved
  definitions where their owner permits them; no phrase requires an alias by
  default.

## 8.6 Remaining Gaps

- None at the language-inventory workflow scope. Final completion is
  synchronized in the master tracker and Category 17 is Complete.
- No parser, model, resolver, query tool, conversation store, analytics runtime,
  or data access is implemented or claimed by this Markdown inventory.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete.
- [x] Boundaries are complete.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete proposed canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] No listed item was silently omitted.
- [x] No listed item was silently renamed.
- [x] No listed item was silently merged.
- [x] Proposed additions are separated.
- [x] Duplicate concepts are resolved at planning scope.

## Canonical Inventory

- [x] Every proposed item has a stable inventory ID.
- [x] Every proposed item has a canonical name.
- [x] Every item has a complete canonical-deliverable exact definition.
- [x] Related concepts are fully distinguished in Section 5.
- [x] Classification, status, and version are present in every Section 5 record.

## Language Registry

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

- [x] Required and optional data are complete per record.
- [x] Valid filters are documented per record.
- [x] Valid groupings are documented per record.
- [x] Valid operators are documented per record.
- [x] Compatible intents are documented per record.
- [x] Incompatible combinations are documented per record.
- [x] Defaults are documented per record.
- [x] Clarification conditions are documented per record.
- [x] Unsupported conditions are documented per record.
- [x] Tool targets are documented per record.
- [x] Units, fees, open trades, and sample-size rules are documented per record.

## Evaluation

- [x] Evaluation cases exist for every important concept.
- [x] Expected structured interpretations are present.
- [x] Negative examples are tested.
- [x] Ambiguous cases are tested.
- [x] Unsupported cases are tested.
- [x] Cross-category cases are tested where needed.

## Coverage Report

- [x] Final counts are complete.
- [x] Current gaps are listed.
- [x] Planning overlaps are reviewed.
- [x] Planning-level unsupported capabilities are listed.
- [x] No unresolved planning blocker is hidden.

## Approval

- [x] Category reached Ready for Review.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] All language registries are approved and locked.
- [x] Version is updated.
- [x] Master tracker final completion is synchronized.
- [x] Planning-start change log is current in the master.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Current finding: comprehensive pre-lock review independently PASSed all 17
  canonical records, all 17 language registries, all six evaluation batches,
  all 17 arrays, and all 374 cases. Exact aggregate counts, owner boundaries,
  privacy, capability, and no-runtime contracts are complete. No substantive
  remediation remains; controller approval, Version 1 locks, master completion
  synchronization, and the Complete transition are recorded.
- Current finding: Evaluation Batch 6 independently PASSed after its
  self-containment remediation; `C17-E16` and `C17-E17` contribute the final 44
  accepted cases, leaving zero failed, unreviewed, or pending cases.
- Historical findings below record the completed review path only; none is an
  active pending-review statement.

- Independent planning review initially accepted the exact seventeen-record
  size/order but required explicit Category 16 ticker-like/abbreviation
  collision safety and first-question sequencing corrections for nine
  ambiguity records.
- The remediated planning draft independently PASSed re-review. The lead
  controller accepted the exact seventeen-record inventory and authorized
  staged canonical production; the master is synchronized.
- Canonical Batch 1 records C17-AMB-001 through C17-AMB-006 independently
  PASSed and were accepted by the controller.
- Canonical Batch 2 records C17-AMB-007 through C17-AMB-012 independently
  PASSed and were accepted by the controller.
- Final Canonical Batch 3 and the comprehensive seventeen-record Section 5
  review independently PASSed; the controller accepted all canonical records.
- Registry Batch 1 entries C17-AMB-001 through C17-AMB-006 independently PASSed
  and were accepted by the controller.
- Registry Batch 2 independently PASSed and was accepted by the controller.
- Final Registry Batch 3 and the comprehensive seventeen-registry Section 6
  review independently PASSed; the controller accepted all registry entries.
- Evaluation Batch 1 review required one explicit resolved approved-score route
  in both C17-E1 and C17-E2. C17-E1-02 and C17-E2-02 now contain the approved
  score identity, exact formula/version, direction, unit/basis, fee/currency
  rule, compatible population/period, finite positive N, exact-value
  privacy-safe ties, samples, and coverage; both were submitted for independent
  re-review.
  The sole residual zero-denominator boundary is now explicit: a group with no
  covered applicable evaluations is `Unavailable`, is never divided, zeroed,
  or inferred, stays outside resolved ranking values, and remains visible in
  missing/unavailable coverage.
- Remediated Evaluation Batch 1 independently PASSed re-review; the controller
  accepted all 66 cases across C17-E1 through C17-E3.
- Evaluation Batch 2 entries C17-E4 through C17-E6 independently PASSed after
  owner/coverage remediation and were accepted by the controller: locked open
  unrealized and unapproved risk owners remain `Unavailable`; exact execution,
  entered, and Stock entry-notional size routes are covered; saved-rule cases
  consume only explicit versioned evaluation facts.
- Evaluation Batch 3 independent review found two bounded contract issues. The
  rolling-window cases C17-E8-01/12/15/17/22 now use exact elapsed-day,
  half-open UTC membership `[trusted as-of - N elapsed days, trusted as-of)`;
  comparison cases state both adjacent intervals and C17-E8-15 uses pure UTC.
  Resolved explicit-entry cases C17-E9-01/03/04/07/08/10-17/21/22 now use the
  single locked first-opening accepted execution/allocation price basis at one
  price per trade lifecycle, while C17-E9-18 stages entry-price basis before
  threshold if its explicit-entry route is selected. The remediated 66-case
  batch independently PASSed re-review and was accepted by the controller.
- Historical: Evaluation Batch 4 entries C17-E10 through C17-E12 were drafted
  with all 22 required case types in exact order before their later PASS. Resolved
  scalp routes use explicit saved-label, duration/event, session-behavior, or
  ordinary-description owners; overtrading routes use exact saved rule,
  threshold/denominator, Category 9 proxy, declared baseline, or authored
  judgment; good-trade routes use selected-basis outcome, exact process
  criterion, or authorized saved-label facts without inferred style, motive,
  generic quality, advice, or future edge.
- Evaluation Batch 4 owner review found bounded naming and completeness issues.
  The affected scalp cases now use locked `hold_duration` or a complete
  authorized versioned half-open session-open contract; execution-grain and
  lifecycle-start cases avoid invented `execution_count`/`trade_count` owners;
  outcome cases use `winning_trades` plus `net_pnl`; and all affected Category
  9 proxy/baseline routes now state their exact Version 1 formulas, populations,
  barriers, zero/insufficient-denominator states, and coverage. This was a
  historical remediation state; the batch later independently PASSed.
- Remediated Evaluation Batch 4 independently PASSed and was accepted by the
  controller. Historically, Evaluation Batch 5 entries C17-E13 through
  C17-E15 were then drafted with all 22 required case types in exact order
  before their later independent PASS.
- Remediated Evaluation Batch 5 independently PASSed and was accepted by the
  controller. Historically, final Evaluation Batch 6 entries C17-E16 through
  C17-E17 were then drafted with all 22 required case types in exact order;
  they subsequently independently PASSed comprehensive pre-lock review.

## Required Changes

- None at the language-inventory workflow scope.
- Do not claim or implement a parser, model, resolver, query tool, conversation
  store, analytics runtime, or data access as part of this Markdown inventory.

## Completed Changes

- Created the exact seventeen-record proposed planning inventory in master
  priority order.
- Documented the shared safe-resolution, explicitly stated-assumption, and
  focused-clarification ladder without promoting its steps to records.
- Preserved Category 15 ownership of pending ambiguity and accepted-query state.
- Documented locked-owner, no-default, capability, authorization, privacy,
  cross-account, no-ID, no-cause, no-advice, and no-runtime boundaries.
- Added Category 16-owned ticker-like/abbreviation token-class safety to the
  cross-category, dependency, risk, and later evaluation contracts.
- Corrected the first highest-impact clarification branch for `better`,
  `profit`, `size`, `later trades`, `cheap stocks`, `scalp`, `good trade`, `bad
  trade`, and `normal size`, while staging dependent questions for later turns.
- Narrowed the `normal size` first question to size measure alone, with unit
  validation/clarification and baseline/window/version/sample details staged
  after measure resolution.
- Recorded independent planning PASS and lead-controller acceptance of the
  exact seventeen-record inventory.
- Drafted complete Version 0 `Planned` canonical records for C17-AMB-001 through
  C17-AMB-006 with full template fields and related-concept boundaries.
- Remediated C17-AMB-002 so its first clarification includes both a metric and
  an approved score, while retaining every dependent field for staged follow-up.
- Recorded independent PASS and controller acceptance of Canonical Batch 1.
- Drafted complete Version 0 `Planned` canonical records for C17-AMB-007 through
  C17-AMB-012 with full template fields and related-concept boundaries.
- Remediated C17-AMB-007 to preserve its fixed account/instrument/local-date
  partition, complete pre-filter candidate order, original lifecycle ordinals,
  barriers, exact later-attempt/fourth-or-later thresholds, and private stable
  tie-key boundary.
- Recorded independent PASS and controller acceptance of Canonical Batch 2.
- Drafted complete Version 0 `Planned` canonical records for C17-AMB-013 through
  C17-AMB-017 with full template fields and related-concept boundaries,
  completing the 17-of-17 Section 5 draft.
- Remediated C17-AMB-014 to preserve locked Category 6
  `size_relative_to_normal_size` unavailability and prevent Category 11 bucket
  membership from becoming a baseline or relative-size calculation.
- Remediated C17-AMB-015 to require explicit threshold comparator, endpoint and
  equality semantics, plus owner-defined bucket bounds/endpoints/gap-overlap.
- Recorded independent PASS and controller acceptance of all seventeen
  canonical records and the comprehensive Section 5 review.
- Drafted Registry Batch 1, C17-AMB-001 through C17-AMB-006, with all 38 required
  populated subsections in exact template order.
- Recorded independent PASS and controller acceptance of Registry Batch 1.
- Drafted Registry Batch 2, C17-AMB-007 through C17-AMB-012, with all 38 required
  populated subsections in exact template order.
- Remediated the C17-AMB-011 and C17-AMB-012 first clarification questions so
  each retains every accepted definition family without combining later fields.
- Recorded Registry Batch 2 PASS/controller acceptance and drafted final Registry
  Batch 3, completing all seventeen 38-subsection registry headings.
- Recorded final Registry Batch 3 and comprehensive Section 6 PASS/controller
  acceptance.
- Drafted Evaluation Batch 1, C17-E1 through C17-E3, with 66 `Planned` cases,
  all 22 required case types per array, exact ordered schema, ambiguity-state
  isolation, capability boundaries, privacy guards, and locked-owner contracts.
- Remediated C17-E1-02 and C17-E2-02 into complete approved Execution Discipline
  Score version 2 routes without changing schema, order, IDs, case types, status,
  or any other evaluation case.
- Added the explicit zero covered-applicable denominator boundary to both score
  routes without changing their approved formula, direction, or workflow state.
- Recorded Evaluation Batch 1 independent PASS and controller acceptance.
- Drafted Evaluation Batch 2, C17-E4 through C17-E6, with 66 `Planned` cases,
  exact family-first ambiguity routing, owner formulas and capability states,
  state isolation, privacy guards, and no-cause/advice/runtime boundaries.
- Remediated Evaluation Batch 2 open-P/L, execution/entered/notional size, risk
  owner availability, R-denominator, exposure, drawdown, and explicit saved-rule
  evaluation coverage without changing array size, order, schema, IDs, or status.
- Corrected E5-04 entered-share allocation roles to include `opening`, `adding`,
  and `flip_opening`, while excluding only `reducing`, `closing`, and
  `flip_closing`.
- Recorded Evaluation Batch 2 independent PASS and controller acceptance.
- Drafted Evaluation Batch 3, C17-E7 through C17-E9, with 66 `Planned` cases,
  preserving exact later-sequence partitions and ordinals, explicit recent
  window families and as-of contracts, strict cheap-stock owner predicates,
  capability states, privacy, and no-default/no-runtime boundaries.
- Remediated Evaluation Batch 3 rolling-window membership to exact elapsed-day
  half-open UTC intervals, including both adjacent comparison intervals and a
  pure-UTC exclusion case.
- Remediated every resolved explicit-entry cheap-stock case to the exact locked
  first-opening accepted execution/allocation price basis with one price per
  trade lifecycle; staged basis selection before threshold in the unresolved
  explicit-entry route without changing schema, order, IDs, case types, status,
  or workflow state.
- Recorded Evaluation Batch 3 independent PASS and controller acceptance.
- Drafted Evaluation Batch 4, C17-E10 through C17-E12, with 66 `Planned` cases,
  preserving exact scalp label/duration/session routes, saved-rule and locked
  Category 9 overtrading routes, factual outcome/process/label good-trade
  routes, one-field pending clarification, privacy, coverage, owner capability,
  and no-inference/no-runtime boundaries.
- Remediated Evaluation Batch 4 owner findings by replacing invented duration,
  execution-count, trade-count, and win/loss concepts with locked
  `hold_duration`, explicit factual grains, and `winning_trades`/`net_pnl`;
  completed the versioned half-open session owner, Category 9
  `overtrading_frequency` Version 1, and deterministic preceding-60-day median
  baseline contracts without changing IDs, schema, order, status, or workflow.
- Recorded Evaluation Batch 4 independent PASS and controller acceptance.
- Drafted Evaluation Batch 5, C17-E13 through C17-E15, with 66 `Planned` cases
  preserving exact bad-outcome/process/mistake/label families, locked normal-
  size unavailability and bucket-only boundaries, and explicit large-loss
  metric/representation/threshold/baseline/bucket contracts.
- Remediated Evaluation Batch 5 mistake/tag ownership, explicit association,
  entered-share primitive, complete `size_bucket`, typed loss predicate,
  unrealized-drawdown unavailability, exact net formula, denominator, and
  privacy-safe tie findings without changing case count, order, schema, IDs,
  `Planned` status, or pending review state.
- Recorded Evaluation Batch 5 independent PASS and controller acceptance.
- Drafted final Evaluation Batch 6, C17-E16 through C17-E17, with 44 `Planned`
  cases preserving complete single-metric/approved-set performance contracts,
  dispersion/adherence consistency contracts, exact-versus-rounded ordering,
  state, privacy, coverage, capability, and no-score/no-default boundaries.
- Remediated final Evaluation Batch 6 self-containment findings by making every
  affected performance component, net-P/L, dispersion, adherence, direction,
  denominator, minimum-sample, exact-ordering, tie, and coverage contract
  standalone without changing schema, order, IDs, `Planned` status, or pending
  independent-review state.
- Recorded final Evaluation Batch 6 and comprehensive pre-lock substantive
  PASS: all 17 arrays and 374 cases pass with exact aggregate counts and zero
  failed, unreviewed, or pending cases.
- Recorded the lead controller's 2026-08-12 approval and lock of all seventeen
  exact canonical names and all seventeen registries, and advanced the metadata
  and canonical records to Version 1 without changing any `Planned` capability
  status or claiming runtime support.
- Synchronized final completion in the master tracker and marked Category 17
  Complete at Version 1 while preserving every capability as `Planned` and
  making no runtime or implementation claim.

## Approval Decision

- Status: Complete
- Approved by: Lead controller
- Approval date: 2026-08-12
- Version: 1
- Canonical names locked: Yes
- Language registries locked: Yes
- Master tracker final completion synchronized: Yes

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-12 | Synchronized final master completion and marked Category 17 Complete | Close the approved and locked Version 1 language-inventory workflow while preserving all capability statuses as `Planned` and claiming no runtime implementation | 1 |
| 2026-08-12 | Lead controller approved and locked all seventeen canonical names and all seventeen registries | Advance the independently passing exact inventory to Version 1 while preserving `Planned` capability status, Ready for Review workflow state, no-runtime scope, and the open final Complete/master-synchronization gates | 1 |
| 2026-08-12 | Recorded comprehensive pre-lock substantive PASS and advanced Category 17 to Ready for Review | Synchronize all 17 canonical records, 17 registries, six evaluation batches, 17 arrays, 374 passing cases, exact aggregates, and zero failed/unreviewed/pending cases before controller approval and Version 1 lock | 0 |
| 2026-08-12 | Remediated final Evaluation Batch 6 self-containment findings | State exact net P/L, approved-set components, dispersion math, adherence denominator, direction, n=1, rounded-display, tie, and coverage contracts inside every affected resolved case before independent review | 0 |
| 2026-08-12 | Drafted final Evaluation Batch 6, C17-E16 through C17-E17, after Evaluation Batch 5 PASS | Complete all 374 cases with exact performance metric/set and consistency dispersion/adherence contracts while preserving no-score, no-default, privacy, coverage, and no-runtime boundaries | 0 |
| 2026-08-12 | Recorded Evaluation Batch 5 independent PASS and controller acceptance | Synchronize the accepted 330-case checkpoint before final evaluation production | 0 |
| 2026-08-11 | Remediated Evaluation Batch 5 owner, formula, bucket, unavailable-state, denominator, and tie findings | Use locked mistake/tag/size owners, complete definition and association coverage, exact conserving net P/L, truthful Unavailable outcomes, and privacy-safe deterministic ranking before independent re-review | 0 |
| 2026-08-11 | Drafted Evaluation Batch 5, C17-E13 through C17-E15, after Evaluation Batch 4 PASS | Add 66 bad-trade, normal-size, and large-loss ambiguity cases with exact owner, capability, boundary, privacy, and no-inference contracts | 0 |
| 2026-08-11 | Recorded Evaluation Batch 4 independent PASS and controller acceptance | Synchronize the accepted 264-case checkpoint before Batch 5 production | 0 |
| 2026-08-11 | Remediated Evaluation Batch 4 owner naming, session-window, Category 9 proxy, and baseline findings | Use only locked concepts and complete deterministic owner formulas, populations, barriers, unavailable states, and coverage before independent re-review | 0 |
| 2026-08-11 | Drafted Evaluation Batch 4, C17-E10 through C17-E12, after Evaluation Batch 3 PASS | Add 66 structured scalp, overtrading, and good-trade ambiguity cases while preserving exact owner families, locked capabilities, state, privacy, coverage, and no-inference/no-runtime boundaries | 0 |
| 2026-08-11 | Recorded Evaluation Batch 3 independent PASS and controller acceptance | Synchronize the accepted 198-case checkpoint before Batch 4 production | 0 |
| 2026-08-11 | Remediated Evaluation Batch 3 rolling-window and entry-price-basis findings | Use elapsed-day half-open UTC membership with explicit adjacent intervals, and fix every resolved explicit-entry route to the locked first-opening accepted execution/allocation basis before re-review | 0 |
| 2026-08-11 | Drafted Evaluation Batch 3, C17-E7 through C17-E9, after Evaluation Batch 2 PASS | Add 66 structured later-trades, recent, and cheap-stocks ambiguity cases while preserving exact sequence, time-window, price-owner, capability, privacy, and no-runtime contracts | 0 |
| 2026-08-11 | Recorded Evaluation Batch 2 independent PASS and controller acceptance | Synchronize the accepted 132-case checkpoint before Batch 3 production | 0 |
| 2026-08-11 | Corrected E5-04 entered-share allocation-role boundary | Preserve flip-opening entered quantity and exclude only reducing, closing, and flip-closing roles | 0 |
| 2026-08-11 | Remediated Evaluation Batch 2 owner and coverage findings | Preserve locked unrealized and risk unavailability, add exact execution/entered/entry-notional routes, and consume saved-rule evaluation facts without formula derivation | 0 |
| 2026-08-11 | Drafted Evaluation Batch 2, C17-E4 through C17-E6, after Evaluation Batch 1 PASS | Add 66 structured profit, size, and risk ambiguity cases while preserving branch-first clarification, locked owner contracts, capability states, privacy, and no-runtime boundaries | 0 |
| 2026-08-11 | Recorded Evaluation Batch 1 independent PASS and controller acceptance | Synchronize the accepted 66-case score-route remediation checkpoint before Batch 2 production | 0 |
| 2026-08-11 | Added the zero-denominator Unavailable boundary to C17-E1-02 and C17-E2-02 | Prevent divide-by-zero, zero substitution, inferred scores, and unavailable groups entering resolved ranking values while retaining visible missing/unavailable coverage | 0 |
| 2026-08-11 | Remediated approved-score coverage in C17-E1-02 and C17-E2-02 | Prove resolved best and worst score routes with explicit identity, exact formula/version, direction, unit/basis, fee/currency rule, population/period, finite N, ties, sample, and coverage | 0 |
| 2026-08-11 | Drafted Evaluation Batch 1, C17-E1 through C17-E3, after comprehensive Section 6 PASS | Add the first 66 structured ambiguity-routing cases while preserving owner completeness, one-field clarification, state isolation, capability, privacy, and no-runtime boundaries | 0 |
| 2026-08-11 | Recorded final Registry Batch 3 and comprehensive Section 6 PASS/controller acceptance | Synchronize the accepted seventeen-registry Version 0 checkpoint before evaluation production | 0 |
| 2026-08-11 | Drafted final Registry Batch 3, C17-AMB-013 through C17-AMB-017, after Registry Batch 2 PASS | Complete all seventeen registry headings while preserving locked unavailable, boundary, formula, privacy, and no-runtime contracts | 0 |
| 2026-08-11 | Remediated Registry Batch 2 clarification-family coverage for C17-AMB-011 and C17-AMB-012 | Preserve every accepted overtrading and good-trade owner family in one focused first question while staging dependent fields | 0 |
| 2026-08-11 | Drafted Registry Batch 2, C17-AMB-007 through C17-AMB-012, after independent PASS and controller acceptance of Registry Batch 1 | Continue bounded language coverage while preserving exact sequence/time/owner-family, staged clarification, collision, privacy, capability, and no-runtime contracts | 0 |
| 2026-08-11 | Drafted Registry Batch 1, C17-AMB-001 through C17-AMB-006, after independent PASS and controller acceptance of all seventeen canonical records | Begin bounded language coverage with exact 38-subsection entries while preserving owner, staged clarification, state, collision, privacy, capability, and no-runtime contracts | 0 |
| 2026-08-11 | Remediated C17-AMB-014 unavailable relative-normal-size ownership and C17-AMB-015 threshold/bucket endpoint contracts | Prevent bucket-membership activation, invented normal-size formulas, and hidden strict/inclusive large-loss boundaries | 0 |
| 2026-08-11 | Drafted final Canonical Batch 3, C17-AMB-013 through C17-AMB-017, after independent PASS and controller acceptance of Batch 2 | Complete the 17-of-17 canonical draft while preserving owner, clarification, state, collision, privacy, capability, and no-runtime contracts | 0 |
| 2026-08-11 | Remediated C17-AMB-007 ordinal and later-attempt sequence identity, barrier, and privacy contracts | Prevent fills, display rows, filters, or incomplete/open barriers from skipping or renumbering the original lifecycle sequence | 0 |
| 2026-08-11 | Drafted Canonical Batch 2, C17-AMB-007 through C17-AMB-012, after independent PASS and controller acceptance of Batch 1 | Continue bounded canonical production while preserving semantic-family-first clarification, owner, state, privacy, capability, and no-runtime contracts | 0 |
| 2026-08-11 | Added the approved-score branch to C17-AMB-002's first clarification and retained all dependent staged fields | Complete the `worst_ambiguity` candidate family without creating a compound first question | 0 |
| 2026-08-11 | Drafted Canonical Batch 1, C17-AMB-001 through C17-AMB-006, after independent planning PASS and controller inventory acceptance | Begin bounded canonical production while retaining owner, clarification, capability, privacy, and no-runtime contracts | 0 |
| 2026-08-11 | Narrowed the `normal_size_ambiguity` first clarification to size measure alone and staged unit and baseline details | Preserve the one-highest-impact-field clarification contract | 0 |
| 2026-08-11 | Remediated independent planning findings for token/class collision safety and highest-impact clarification ordering | Preserve Category 16 ownership and prevent later-stage fields from being asked before the ambiguity family resolves | 0 |
| 2026-08-11 | Created bounded planning file with Sections 1-4 and exact proposed seventeen-record controlling inventory; deferred Sections 5-8 | Establish complete ambiguity-routing scope and owner boundaries before language or evaluation production | 0 |
